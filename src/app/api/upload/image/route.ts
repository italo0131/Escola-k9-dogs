import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { requireApiUser } from "../../_auth"

export const runtime = "nodejs"

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"])

export async function POST(req: Request) {
  const { error } = await requireApiUser()
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Arquivo de imagem obrigatorio" }, { status: 400 })
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: "Imagem muito grande. Limite de 8 MB." }, { status: 413 })
    }

    const extension = path.extname(file.name || "").toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ success: false, message: "Formato de imagem nao suportado" }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), "public", "uploads", "images")
    const filename = `${Date.now()}-${randomUUID()}${extension}`
    const targetPath = path.join(uploadDir, filename)

    await mkdir(uploadDir, { recursive: true })
    await writeFile(targetPath, bytes)

    return NextResponse.json({ success: true, url: `/uploads/images/${filename}` })
  } catch (error) {
    console.error("ERRO POST /api/upload/image:", error)
    return NextResponse.json({ success: false, message: "Erro ao enviar imagem" }, { status: 500 })
  }
}
