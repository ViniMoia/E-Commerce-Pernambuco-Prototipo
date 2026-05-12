import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import * as productService from "@/services/product.service";
import { productFiltersSchema, createProductSchema } from "@/lib/validators/product";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());

    const parsed = productFiltersSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid filters", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const products = await productService.getProducts(parsed.data);
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdmin();
    if (guard instanceof NextResponse) return guard;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    // userId always comes from the verified session, never from the request body
    const product = await productService.createProduct({
      ...parsed.data,
      userId: guard.user.id,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    console.error("[PRODUCTS_POST]", error);

    if (error instanceof Error && error.message === "STORE_NOT_FOUND") {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
