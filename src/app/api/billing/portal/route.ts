import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "O portal de assinatura foi desativado neste novo modelo de operacao.",
    },
    { status: 410 },
  )
}
