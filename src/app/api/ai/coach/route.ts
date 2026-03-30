import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getChannelContentAccessLabel, getChannelContentCategoryLabel } from "@/lib/platform"

export const runtime = "nodejs"

type Recommendation = {
  href: string
  title: string
  description: string
  badge: string
}

function normalizeQuestion(input: unknown) {
  return String(input || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 600)
}

function buildTerms(value: string) {
  const stopwords = new Set([
    "para",
    "como",
    "quero",
    "tenho",
    "meu",
    "minha",
    "uma",
    "com",
    "sem",
    "mais",
    "menos",
    "sobre",
    "depois",
    "antes",
    "porque",
    "onde",
    "quando",
    "cachorro",
    "cao",
    "caes",
  ])

  return Array.from(
    new Set(
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, " ")
        .split(/\s+/)
        .filter((term) => term.length >= 4 && !stopwords.has(term))
    )
  ).slice(0, 6)
}

function truncate(value: string | null | undefined, max = 160) {
  if (!value) return ""
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  if (!Array.isArray(payload?.output)) {
    return null
  }

  const text = payload.output
    .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
    .map((content: any) => content?.text)
    .find((value: unknown) => typeof value === "string" && value.trim())

  return typeof text === "string" ? text.trim() : null
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const question = normalizeQuestion(body?.question)
  const courseSlug = String(body?.courseSlug || "").trim()
  const contentSlug = String(body?.contentSlug || "").trim()

  if (question.length < 8) {
    return NextResponse.json(
      { success: false, message: "Escreva uma pergunta com pelo menos 8 caracteres." },
      { status: 400 }
    )
  }

  const terms = buildTerms([question, courseSlug, contentSlug].filter(Boolean).join(" "))
  const contentSearch = terms.length
    ? {
        OR: terms.flatMap((term) => [
          { title: { contains: term, mode: "insensitive" as const } },
          { summary: { contains: term, mode: "insensitive" as const } },
          { body: { contains: term, mode: "insensitive" as const } },
        ]),
      }
    : undefined

  const blogSearch = terms.length
    ? {
        OR: terms.flatMap((term) => [
          { title: { contains: term, mode: "insensitive" as const } },
          { excerpt: { contains: term, mode: "insensitive" as const } },
          { content: { contains: term, mode: "insensitive" as const } },
        ]),
      }
    : undefined

  const [course, content, matchedContents, matchedPosts] = await Promise.all([
    courseSlug
      ? prisma.forumChannel.findUnique({
          where: { slug: courseSlug },
          include: {
            owner: { select: { name: true, headline: true } },
            contents: {
              where: { published: true },
              select: {
                id: true,
                slug: true,
                title: true,
                summary: true,
                contentType: true,
                category: true,
                accessLevel: true,
                durationMinutes: true,
                orderIndex: true,
              },
              orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
              take: 6,
            },
          },
        })
      : null,
    contentSlug
      ? prisma.channelContent.findUnique({
          where: { slug: contentSlug },
          include: {
            author: { select: { name: true } },
            channel: { select: { name: true, slug: true } },
          },
        })
      : null,
    prisma.channelContent.findMany({
      where: {
        published: true,
        ...(courseSlug ? { channel: { slug: courseSlug } } : {}),
        ...(contentSearch || {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        body: true,
        category: true,
        accessLevel: true,
        durationMinutes: true,
        channel: { select: { name: true, slug: true } },
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
      take: courseSlug ? 6 : 4,
    }),
    prisma.blogPost.findMany({
      where: {
        published: true,
        ...(blogSearch || {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ])

  const recommendations: Recommendation[] = [
    ...matchedContents.slice(0, 4).map((item) => ({
      href: item.accessLevel === "FREE" ? `/conteudos/${item.slug}` : `/courses/${item.channel.slug}`,
      title: item.title,
      description: truncate(item.summary || item.body, 140),
      badge: `${getChannelContentCategoryLabel(item.category)} - ${getChannelContentAccessLabel(item.accessLevel)}`,
    })),
    ...matchedPosts.slice(0, 2).map((item) => ({
      href: `/blog/${item.slug}`,
      title: item.title,
      description: truncate(item.excerpt || item.content, 140),
      badge: `Blog - ${item.category}`,
    })),
  ].slice(0, 4)

  const contextBlocks = [
    course
      ? [
          `Curso atual: ${course.name}.`,
          course.description,
          `Adestrador: ${course.owner.name}${course.owner.headline ? `, ${course.owner.headline}` : ""}.`,
          course.contents.length
            ? `Aulas mais proximas: ${course.contents
                .map((item) => `${item.orderIndex ? `${item.orderIndex}. ` : ""}${item.title}`)
                .join("; ")}.`
            : "Ainda nao ha aulas publicadas nesta trilha.",
        ]
          .filter(Boolean)
          .join("\n")
      : null,
    content
      ? [
          `Aula atual: ${content.title}.`,
          content.summary || content.objective || "",
          `Canal: ${content.channel.name}. Autor: ${content.author.name}.`,
        ]
          .filter(Boolean)
          .join("\n")
      : null,
    matchedContents.length
      ? `Conteudos relacionados encontrados: ${matchedContents
          .map((item) => `${item.title} (${getChannelContentCategoryLabel(item.category)})`)
          .join("; ")}.`
      : null,
    matchedPosts.length
      ? `Leituras do blog relacionadas: ${matchedPosts.map((item) => item.title).join("; ")}.`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n")

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      success: true,
      fallback: true,
      answer: [
        "O assistente inteligente ja esta integrado a plataforma, mas ainda falta configurar a chave `OPENAI_API_KEY` para gerar respostas da IA.",
        "Enquanto isso, voce ja pode seguir pelos recomendados abaixo para estudar e praticar dentro do fluxo real da K9.",
      ].join("\n\n"),
      recommendations,
    })
  }

  const instructions = [
    "Voce e a K9 IA, assistente educacional da plataforma K9 Training.",
    "Responda sempre em portugues do Brasil.",
    "A plataforma e focada em cursos, dicas, pratica guiada, comportamento e rotina de caes.",
    "Seja objetivo, caloroso e pratico.",
    "Nao invente funcionalidades, aulas ou dados que nao estejam no contexto.",
    "Quando houver risco clinico, dor, lesao ou agressividade grave, recomende apoio de veterinario ou adestrador presencial.",
    "Estruture a resposta em tres blocos curtos: leitura do cenario, passos imediatos, proximo estudo recomendado.",
  ].join(" ")

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      store: false,
      instructions,
      input: [
        contextBlocks ? `Contexto da plataforma:\n${contextBlocks}` : "Contexto da plataforma: catalogo geral de cursos e dicas.",
        `Pergunta do usuario:\n${question}`,
      ].join("\n\n"),
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.error?.message || "A IA nao conseguiu responder agora. Verifique a configuracao da chave e tente novamente."

    return NextResponse.json({ success: false, message }, { status: 502 })
  }

  const answer = extractOutputText(payload)

  if (!answer) {
    return NextResponse.json(
      {
        success: false,
        message: "A IA respondeu sem texto utilizavel. Tente reformular a pergunta.",
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    success: true,
    answer,
    recommendations,
  })
}
