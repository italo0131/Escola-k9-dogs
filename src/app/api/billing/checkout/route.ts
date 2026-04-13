import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "O checkout publico foi desativado. O acesso agora e administrado manualmente pela equipe K9.",
    },
    { status: 410 },
  )
}
