/**
 * @file order.service.ts
 * @description Camada de serviço para gerenciamento de pedidos.
 *
 * REGRAS GERAIS:
 * - Sem conhecimento de HTTP (sem NextRequest/NextResponse aqui).
 * - Erros de negócio lançados via OrderError para o Route Handler tratar.
 * - Todas as operações multi-escrita são atômicas via prisma.$transaction().
 * - Aritmética monetária feita com Prisma.Decimal (nunca com number nativo).
 */

import prisma from "@/lib/prisma";
import { Prisma, OrderStatus } from "@prisma/client";
import { isValidTransition } from "@/lib/order-transitions";
import type { ListOrdersParams, UpdateOrderStatusInput, UpdateStatusResult } from "@/types/admin.types";
import type {
  CreateOrderInput,
  OrderWithDetails,
  OrderSummary,
} from "@/types/order.types";

// ─── Classe de Erro Customizada ────────────────────────────────────────────────

/**
 * Erro de domínio do serviço de pedidos.
 * O Route Handler pode usar `instanceof OrderError` para distinguir
 * erros de negócio (→ HTTP 400/404) de erros inesperados (→ HTTP 500).
 */
export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

// ─── 1. CRIAR PEDIDO A PARTIR DO CARRINHO ─────────────────────────────────────

/**
 * Converte um carrinho ativo em um pedido (PENDING).
 *
 * Fluxo atômico (tudo ou nada):
 * 1. Valida cart (pertence ao user, está ACTIVE, não está vazio)
 * 2. Valida address (pertence ao user)
 * 3. Calcula subtotal e total
 * 4. Cria Order + OrderItems (snapshot de preço, cor e tamanho)
 * 5. Marca Cart como COMPLETED
 *
 * ⚠️  ESTOQUE NÃO É DEDUZIDO AQUI — só quando o status mudar para PAID.
 */
export async function createOrderFromCart(
  input: CreateOrderInput
): Promise<OrderWithDetails> {
  const { userID, cartID, addressID } = input;

  // ── Pré-validações fora da transação (leituras rápidas) ───────────────────
  // Busca o carrinho com seus itens em uma única query (evita N+1)
  const cart = await prisma.cart.findUnique({
    where: { id: cartID },
    include: { items: true },
  });

  if (!cart) {
    throw new OrderError("CART_NOT_FOUND");
  }

  // Garante que o carrinho pertence ao usuário autenticado (autorização)
  if (cart.userID !== userID) {
    throw new OrderError("CART_ACCESS_DENIED");
  }

  if (cart.status !== "ACTIVE") {
    throw new OrderError("CART_NOT_ACTIVE");
  }

  if (cart.items.length === 0) {
    throw new OrderError("CART_IS_EMPTY");
  }

  // Valida que o endereço existe e pertence ao usuário
  const address = await prisma.address.findUnique({
    where: { id: addressID },
  });

  if (!address) {
    throw new OrderError("ADDRESS_NOT_FOUND");
  }

  if (address.userID !== userID) {
    throw new OrderError("ADDRESS_ACCESS_DENIED");
  }

  // ── Cálculo do total ──────────────────────────────────────────────────────
  /**
   * POR QUE Prisma.Decimal e não number?
   *
   * JavaScript representa números com IEEE 754 (ponto flutuante de 64 bits).
   * Isso causa erros de arredondamento em operações monetárias:
   *   0.1 + 0.2 === 0.30000000000000004   ← BUG silencioso em produção!
   *
   * Prisma.Decimal usa uma biblioteca de precisão arbitrária (decimal.js)
   * que faz aritmética exata. Sempre use-a para valores monetários.
   */
  const subtotal = cart.items.reduce((acc, item) => {
    // item.price é Float no schema (Product.price), então convertemos para Decimal
    const itemPrice = new Prisma.Decimal(item.price);
    const itemQuantity = new Prisma.Decimal(item.quantity);
    return acc.plus(itemPrice.times(itemQuantity));
  }, new Prisma.Decimal(0));

  const shippingCostDecimal = new Prisma.Decimal(cart.shippingCost ?? 0);
  const total = subtotal.plus(shippingCostDecimal);

  // ── Transação atômica ─────────────────────────────────────────────────────
  /**
   * Por que $transaction() é OBRIGATÓRIO aqui?
   *
   * Sem transação, se o servidor falhar após criar o Order mas antes de
   * criar os OrderItems, ou antes de marcar o Cart como COMPLETED, o banco
   * ficará em estado inconsistente:
   *   - Um Order sem itens (órfão)
   *   - O Cart ainda ACTIVE, permitindo checkout duplo
   *
   * Com $transaction(), o Prisma garante que TODAS as operações são
   * confirmadas juntas (COMMIT) ou revertidas juntas (ROLLBACK).
   * No Vercel (Serverless), cada invocação abre/fecha conexão rapidamente,
   * então usamos a API sequencial do $transaction (array) — mais eficiente
   * que o callback interativo nesse contexto.
   */
  const [order] = await prisma.$transaction([
    // 1. Cria o pedido
    prisma.order.create({
      data: {
        userID,
        addressID,
        status: "PENDING",
        subtotal,
        shippingCost: shippingCostDecimal,
        total,
        // Cria os OrderItems em nested write (mais eficiente que múltiplos creates)
        items: {
          createMany: {
            data: cart.items.map((item) => ({
              productID: item.productID,
              variantID: item.variantID,
              quantity: item.quantity,
              // SNAPSHOT: copiamos price, color, size e productName do CartItem.
              // Isso garante que mudanças futuras no produto NÃO alteram o histórico
              // do pedido — comportamento correto para e-commerce.
              price: new Prisma.Decimal(item.price),
              color: item.color,
              size: item.size,
              productName: item.productName,
              imageUrl: item.imageUrl,
            })),
          },
        },
      },
      // Retorna o pedido completo com todos os includes necessários
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarImageUrl: true,
            role: true,
            status: true,
          },
        },
      },
    }),

    // 2. Marca o carrinho como concluído (impede checkout duplo)
    prisma.cart.update({
      where: { id: cartID },
      data: { status: "COMPLETED" },
    }),
  ]);

  return order as OrderWithDetails;
}



// ─── 3. BUSCAR PEDIDO POR ID ──────────────────────────────────────────────────

/**
 * Retorna um pedido completo com itens, produtos, endereço e usuário (sem senha).
 */
export async function getOrderById(
  orderID: string
): Promise<OrderWithDetails> {
  const order = await prisma.order.findUnique({
    where: { id: orderID },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      address: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarImageUrl: true,
          role: true,
          status: true,
          // password: NÃO incluído — nunca expor hash de senha
        },
      },
    },
  });

  if (!order) {
    throw new OrderError("ORDER_NOT_FOUND");
  }

  return order as OrderWithDetails;
}

// ─── 4. LISTAR PEDIDOS DO USUÁRIO ─────────────────────────────────────────────

/**
 * Retorna todos os pedidos de um usuário, do mais recente ao mais antigo.
 * Inclui os itens de cada pedido (sem dados aninhados de produto para performance).
 */
export async function getOrdersByUser(
  userID: string
): Promise<OrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userID },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders as OrderSummary[];
}
export async function listOrdersForAdmin(params: ListOrdersParams) {
  const where: any = {};
  if (params.status) {
    where.status = params.status;
  }
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) where.createdAt.gte = params.dateFrom;
    if (params.dateTo) where.createdAt.lte = params.dateTo;
  }
  if (params.search) {
    where.OR = [
      { user: { name: { contains: params.search, mode: 'insensitive' } } },
      { user: { email: { contains: params.search, mode: 'insensitive' } } },
    ];
  }
  const pageSize = params.pageSize ?? 20;
  const [orders, totalCount] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      take: pageSize + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      skip: params.cursor ? 1 : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  const hasNextPage = orders.length > pageSize;
  const data = hasNextPage ? orders.slice(0, pageSize) : orders;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;
  return { data, totalCount, nextCursor, hasNextPage };
}

export async function getOrderDetailForAdmin(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      address: true,
      items: {
        select: {
          id: true,
          quantity: true,
          productName: true,
          size: true,
          color: true,
          price: true
        }
      }
    }
  })
  return order
}

export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<UpdateStatusResult> {
  const fullOrder = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, status: true, userID: true, items: true }
  })

  if (!fullOrder) {
    return { success: false, error: 'Pedido não encontrado.', code: 'NOT_FOUND' }
  }

  if (!isValidTransition(fullOrder.status, input.newStatus)) {
    return { success: false, error: 'Transição de status inválida.', code: 'INVALID_TRANSITION' }
  }

  const auditEntry = prisma.auditLog.create({
    data: {
      actorId: input.performedById,
      targetId: fullOrder.userID,
      action: 'ORDER_STATUS_UPDATED',
      entity: 'Order',
      entityId: input.orderId,
      previousValue: { status: fullOrder.status },
      newValue: { status: input.newStatus },
      ipAddress: input.ipAddress ?? null
    }
  })

  if (input.newStatus === 'PAID') {
    const variantStockChecks = await prisma.productVariants.findMany({
      where: { id: { in: fullOrder.items.map((i) => i.variantID) } },
      select: { id: true, stock: true },
    })
    const stockMap = new Map(variantStockChecks.map((v) => [v.id, v.stock]))
    for (const item of fullOrder.items) {
      const available = stockMap.get(item.variantID) ?? 0
      if (available < item.quantity) {
        return { success: false, error: `Estoque insuficiente para a variante ${item.variantID}.`, code: 'INVALID_TRANSITION' }
      }
    }
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: input.orderId },
        data: { status: input.newStatus },
        select: { id: true, status: true }
      }),
      ...fullOrder.items.map((item) =>
        prisma.productVariants.update({
          where: { id: item.variantID, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
      ),
      auditEntry
    ])
    return { success: true, order: updatedOrder }
  }

  if (input.newStatus === 'CANCELLED' && fullOrder.status === 'PAID') {
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: input.orderId },
        data: { status: input.newStatus },
        select: { id: true, status: true }
      }),
      ...fullOrder.items.map((item) =>
        prisma.productVariants.update({
          where: { id: item.variantID },
          data: { stock: { increment: item.quantity } },
        })
      ),
      auditEntry
    ])
    return { success: true, order: updatedOrder }
  }

  const [updatedOrder] = await prisma.$transaction([
    prisma.order.update({
      where: { id: input.orderId },
      data: { status: input.newStatus },
      select: { id: true, status: true }
    }),
    auditEntry
  ])

  return { success: true, order: updatedOrder }
}
