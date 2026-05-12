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
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
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

// ─── 2. ATUALIZAR STATUS DO PEDIDO ────────────────────────────────────────────

/**
 * Atualiza o status de um pedido, gerenciando o estoque nas transições críticas.
 *
 * Transições com efeito colateral no estoque:
 *   PENDING → PAID      : Deduz estoque de cada ProductVariant
 *   PAID    → CANCELLED : Devolve estoque (rollback)
 *   Demais              : Apenas atualiza o status
 */
export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<void> {
  const { orderID, newStatus } = input;

  // Busca o pedido com seus itens para conhecer o status atual e as quantidades
  const order = await prisma.order.findUnique({
    where: { id: orderID },
    include: { items: true },
  });

  if (!order) {
    throw new OrderError("ORDER_NOT_FOUND");
  }

  const currentStatus = order.status;

  // Evita reprocessamento: idempotência básica
  if (currentStatus === newStatus) {
    return;
  }

  // ── Transição PAID: deduzir estoque ──────────────────────────────────────
  if (newStatus === "PAID") {
    /**
     * POR QUE validar estoque ANTES da transação?
     *
     * Fazemos uma pré-validação para dar feedback rápido e evitar que a
     * transação seja aberta e revertida desnecessariamente.
     * Dentro da transação, o Prisma/PostgreSQL garante a atomicidade final.
     *
     * ⚠️  ARMADILHA - ESTOQUE NEGATIVO:
     * Se usássemos `decrement` sem verificar, poderíamos criar estoque negativo.
     * A solução correta é filtrar na cláusula `where` da atualização:
     *   where: { id: variantID, stock: { gte: quantity } }
     * Se nenhum registro for encontrado (estoque insuficiente), o Prisma
     * lança P2025 (RecordNotFound) e a transação inteira é revertida.
     */
    const variantStockChecks = await prisma.productVariants.findMany({
      where: {
        id: { in: order.items.map((i) => i.variantID) },
      },
      select: { id: true, stock: true, size: true, color: true },
    });

    // Monta um mapa para lookup O(1)
    const stockMap = new Map(variantStockChecks.map((v) => [v.id, v.stock]));

    for (const item of order.items) {
      const available = stockMap.get(item.variantID) ?? 0;
      if (available < item.quantity) {
        throw new OrderError(
          `INSUFFICIENT_STOCK:${item.variantID}:available=${available}:required=${item.quantity}`
        );
      }
    }

    // Executa a dedução e a atualização de status atomicamente
    await prisma.$transaction([
      // Decrementa o estoque de cada variante somente se houver stock suficiente.
      // O filtro `stock: { gte: item.quantity }` é a proteção contra race condition:
      // se outro processo consumiu o estoque entre a verificação acima e esta linha,
      // o `where` não encontrará o registro e o Prisma lançará P2025 → ROLLBACK.
      ...order.items.map((item) =>
        prisma.productVariants.update({
          where: {
            id: item.variantID,
            stock: { gte: item.quantity }, // ← guarda de segurança anti-negativo
          },
          data: { stock: { decrement: item.quantity } },
        })
      ),

      // Atualiza o status do pedido
      prisma.order.update({
        where: { id: orderID },
        data: { status: newStatus },
      }),
    ]);

    return;
  }

  // ── Transição CANCELLED (vindo de PAID): devolver estoque ────────────────
  if (newStatus === "CANCELLED" && currentStatus === "PAID") {
    await prisma.$transaction([
      ...order.items.map((item) =>
        prisma.productVariants.update({
          where: { id: item.variantID },
          data: { stock: { increment: item.quantity } },
        })
      ),

      prisma.order.update({
        where: { id: orderID },
        data: { status: newStatus },
      }),
    ]);

    return;
  }

  // ── Demais transições: apenas atualizar o status ──────────────────────────
  await prisma.order.update({
    where: { id: orderID },
    data: { status: newStatus },
  });
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
