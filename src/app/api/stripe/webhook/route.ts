import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Webhook Stripe desativado. Este ambiente nao usa mais cobranca publica automatica.",
    },
    { status: 410 },
  )
}
