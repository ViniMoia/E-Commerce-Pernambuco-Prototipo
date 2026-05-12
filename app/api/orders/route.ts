import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdmin } from "@/lib/auth/guards";
import { OrderError, createOrderFromCart, getOrdersByUser } from "@/services/order.service";

const createOrderSchema = z.object({
  cartID: z.string().uuid(),
  addressID: z.string().uuid(),
});

// Error code → HTTP status map shared by all order routes
export const ORDER_ERROR_MAP: Record<string, number> = {
  CART_NOT_FOUND: 404,
  CART_ACCESS_DENIED: 403,
  CART_NOT_ACTIVE: 400,
  CART_IS_EMPTY: 400,
  ADDRESS_NOT_FOUND: 404,
  ADDRESS_ACCESS_DENIED: 403,
  ORDER_NOT_FOUND: 404,
  INSUFFICIENT_STOCK: 409,
};

export function handleOrderError(error: unknown): NextResponse {
  if (error instanceof OrderError) {
    // Extract the base code before any ":" (e.g. "INSUFFICIENT_STOCK:variantId:...")
    const code = error.message.split(":")[0];
    const status = ORDER_ERROR_MAP[code] ?? 400;
    return NextResponse.json({ error: code }, { status });
  }
  console.error("[ORDER_SERVICE_ERROR]", error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const order = await createOrderFromCart({
      userID: guard.user.id,          // userId always from session
      cartID: parsed.data.cartID,
      addressID: parsed.data.addressID,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleOrderError(error);
  }
}

export async function GET() {
  const guard = await requireAuth();
  if (guard instanceof NextResponse) return guard;

  try {
    // ADMIN sees all orders; CUSTOMER sees only their own.
    // getOrdersByUser with no filter would require a service change —
    // for now, role-based branching happens here since the service contract
    // only accepts a userId. An admin passing their own id would be wrong.
    const targetUserId = guard.user.role === "ADMIN" ? undefined : guard.user.id;

    const orders = await getOrdersByUser(targetUserId as string);
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    return handleOrderError(error);
  }
}
