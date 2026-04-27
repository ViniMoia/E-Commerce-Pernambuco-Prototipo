import { registerUser } from "@/services/auth.service"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const user = await registerUser(body)

    return Response.json(user)
  } catch (error: any) {
    console.error("API Error in /api/auth/register:", error);
    
    // Retorna mensagem com status 400. Erros como "Email já existente" cairão aqui.
    return Response.json({ message: error.message || "Erro interno do servidor" }, { status: 400 })
  }
}
