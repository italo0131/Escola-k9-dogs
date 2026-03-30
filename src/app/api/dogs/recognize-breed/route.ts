import { NextResponse } from "next/server"
import { requireApiUser } from "../../_auth"
import { recognizeDogBreedFromImage } from "@/lib/thedogapi"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const { error } = await requireApiUser()
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Imagem obrigatoria" }, { status: 400 })
    }

    const result = await recognizeDogBreedFromImage(file)

    if (result.capability === "LABELS_NOT_ENABLED") {
      return NextResponse.json(
        {
          success: false,
          capability: result.capability,
          message: "Sua chave da TheDogAPI ainda nao tem o recurso de identificacao por imagem habilitado. A busca inteligente por raca segue disponivel.",
        },
        { status: 403 }
      )
    }

    if (!result.breed) {
      return NextResponse.json(
        {
          success: false,
          capability: result.capability,
          message: "Nao foi possivel reconhecer a raca pela imagem enviada.",
        },
        { status: 422 }
      )
    }

    return NextResponse.json({ success: true, breed: result.breed, capability: result.capability })
  } catch (error) {
    console.error("ERRO POST /api/dogs/recognize-breed:", error)
    return NextResponse.json({ success: false, message: "Erro ao analisar a imagem do cao" }, { status: 500 })
  }
}
