import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { requireApiUser } from "../../_auth"

export const runtime = "nodejs"

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set([".mp4", ".webm", ".ogg", ".mov", ".m4v"])

export async function POST(req: Request) {
  const { error } = await requireApiUser()
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Arquivo de video obrigatorio" }, { status: 400 })
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: "Video muito grande. Limite de 100 MB." }, { status: 413 })
    }

    const extension = path.extname(file.name || "").toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ success: false, message: "Formato de video nao suportado" }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos")
    const filename = `${Date.now()}-${randomUUID()}${extension}`
    const targetPath = path.join(uploadDir, filename)

    await mkdir(uploadDir, { recursive: true })
    await writeFile(targetPath, bytes)

    return NextResponse.json({ success: true, url: `/uploads/videos/${filename}` })
  } catch (error) {
    console.error("ERRO POST /api/upload/video:", error)
    return NextResponse.json({ success: false, message: "Erro ao enviar video" }, { status: 500 })
  }
}
