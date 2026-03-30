import { NextResponse } from "next/server"

function buildResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Use o fluxo de autenticacao do NextAuth em /api/auth/callback/credentials.",
    },
    { status: 405 }
  )
}

export async function GET() {
  return buildResponse()
}

export async function POST() {
  return buildResponse()
}
