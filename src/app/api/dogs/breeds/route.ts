import { NextResponse } from "next/server"
import { requireApiUser } from "../../_auth"
import { searchDogBreeds } from "@/lib/thedogapi"

export async function GET(req: Request) {
  const { error } = await requireApiUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") || ""

  if (query.trim().length < 2) {
    return NextResponse.json([])
  }

  try {
    const breeds = await searchDogBreeds(query)
    return NextResponse.json(breeds)
  } catch (error) {
    console.error("ERRO GET /api/dogs/breeds:", error)
    return NextResponse.json({ success: false, message: "Nao foi possivel consultar as racas agora" }, { status: 500 })
  }
}
