import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators/auth";
import { loginUser, AuthError } from "@/services/auth.service";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Validação com Zod
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 🔐 Autenticação
    const user = await loginUser(parsed.data);

    // 🍪 Criação de sessão na base de dados + Cookie
    await createSession(user.id);

    return NextResponse.json(
      {
        message: "Login realizado com sucesso",
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}