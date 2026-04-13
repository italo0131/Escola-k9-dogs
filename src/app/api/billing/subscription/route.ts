import { NextResponse } from "next/server"

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: "As assinaturas publicas foram desativadas. Ajustes de acesso agora passam pelo admin.",
    },
    { status: 410 },
  )
}
