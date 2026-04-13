import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "O acesso a plataforma e criado manualmente pela equipe K9. Fale com o admin para receber seu login.",
    },
    { status: 403 },
  )
}
