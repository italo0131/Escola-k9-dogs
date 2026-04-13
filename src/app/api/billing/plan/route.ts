import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "A troca de plano publico foi removida. A equipe K9 libera acessos manualmente.",
    },
    { status: 410 },
  )
}
