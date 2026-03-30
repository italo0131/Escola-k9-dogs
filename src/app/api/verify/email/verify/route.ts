import { NextResponse } from "next/server"

export { POST } from "../confirm/route"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = (url.searchParams.get("code") || "").trim()
  const target = new URL("/verify", url)

  if (code) {
    target.searchParams.set("emailCode", code)
    target.searchParams.set("auto", "1")
  }

  return NextResponse.redirect(target)
}
