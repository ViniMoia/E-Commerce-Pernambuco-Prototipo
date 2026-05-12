import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getCustomers } from "@/services/customer.service";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const customers = await getCustomers();
    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
