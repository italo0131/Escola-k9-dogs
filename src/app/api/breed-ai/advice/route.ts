import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"

import { authOptions } from "../../auth/[...nextauth]/route"
import { buildBreedStudyProfile, type BreedStudyProfile } from "@/lib/breed-study"
import {
  normalizeBreedLifestyleForm,
  scoreBreedMatch,
  type BreedLifestyleForm,
} from "@/lib/breed-match"
import { listDogBreeds } from "@/lib/thedogapi"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

type AdvisorRequest = {
  lifestyle?: Partial<BreedLifestyleForm>
  breedIds?: string[]
}

function extractOutputText(payload: unknown) {
  if (typeof payload === "object" && payload && "output_text" in payload) {
    const direct = (payload as { output_text?: unknown }).output_text
    if (typeof direct === "string" && direct.trim()) return direct.trim()
  }

  if (!payload || typeof payload !== "object" || !("output" in payload)) {
    return null
  }

  const output = (payload as { output?: Array<{ content?: Array<{ text?: unknown }> }> }).output
  if (!Array.isArray(output)) return null

  for (const item of output) {
    if (!Array.isArray(item?.content)) continue
    for (const content of item.content) {
      if (typeof content?.text === "string" && content.text.trim()) {
        return content.text.trim()
      }
    }
  }

  return null
}

function normalizeStoredLifestyle(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return normalizeBreedLifestyleForm(value as Partial<BreedLifestyleForm>)
}

async function resolveUserLifestyle(requestLifestyle?: Partial<BreedLifestyleForm>) {
  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) {
    return {
      userName: null,
      lifestyle: normalizeBreedLifestyleForm(requestLifestyle),
      profileSource: "guest" as const,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      breedAdvisorProfile: true,
    },
  })

  const storedLifestyle = normalizeStoredLifestyle(user?.breedAdvisorProfile)
  const mergedLifestyle = normalizeBreedLifestyleForm({
    ...(storedLifestyle || {}),
    ...(requestLifestyle || {}),
  })

  return {
    userName: user?.name || null,
    lifestyle: mergedLifestyle,
    profileSource: storedLifestyle ? ("saved" as const) : ("live" as const),
  }
}

function buildLifestyleSummary(lifestyle: BreedLifestyleForm) {
  const childrenLine = lifestyle.kids ? "Convive com criancas." : "Sem criancas no contexto principal."
  const petsLine = lifestyle.otherPets ? "Convive com outros pets." : "Sem outros pets no contexto principal."

  return [
    `Moradia: ${lifestyle.livingSpace}.`,
    `Rotina: ${lifestyle.routine}.`,
    `Experiencia: ${lifestyle.experience}.`,
    `Objetivo: ${lifestyle.goal}.`,
    `Tempo para treino e passeio: ${lifestyle.trainingTime}.`,
    `Nivel de atividade do tutor: ${lifestyle.activityLevel}.`,
    `Preferencia de porte: ${lifestyle.sizePreference}.`,
    `Preferencia de energia: ${lifestyle.energyPreference}.`,
    childrenLine,
    petsLine,
    lifestyle.notes ? `Observacoes do tutor: ${lifestyle.notes}` : null,
  ]
    .filter(Boolean)
    .join(" ")
}

function buildBreedContext(profile: BreedStudyProfile, score: number) {
  return [
    `Raca: ${profile.breed.name}`,
    `Grupo: ${profile.groupLabel}`,
    `Ranking local: ${score}/100`,
    `Resumo: ${profile.summary}`,
    `Porte: ${profile.sizeLabel}`,
    `Peso: ${profile.weightLabel}`,
    `Altura: ${profile.heightLabel}`,
    `Vida media: ${profile.lifeSpanLabel}`,
    `Temperamento: ${profile.temperamentLabel || "Nao informado"}`,
    `Papel historico: ${profile.historicalRole}`,
    `Rotina ideal: ${profile.idealRoutine}`,
    `Foco de treino: ${profile.trainingFocus}`,
    `Perfil de tutor: ${profile.tutorProfile}`,
    `Energia: ${profile.energy.label} (${profile.energy.score}/5)`,
    `Treinabilidade: ${profile.trainability.label} (${profile.trainability.score}/5)`,
    `Convivencia: ${profile.sociability.label} (${profile.sociability.score}/5)`,
    `Pontos de atencao: ${profile.attentionPoints.join(" | ")}`,
  ].join("\n")
}

function buildFallbackAdvice(profiles: BreedStudyProfile[], lifestyle: BreedLifestyleForm) {
  const ranked = profiles
    .map((profile) => ({
      profile,
      match: scoreBreedMatch(profile, lifestyle),
    }))
    .sort((left, right) => right.match.score - left.match.score)

  const best = ranked[0]
  const alternatives = ranked.slice(1, 3)
  const cautions = Array.from(new Set(best.match.cautions.concat(best.profile.attentionPoints))).slice(0, 3)

  return [
    "Adequacao",
    `${best.profile.breed.name} aparece como o encaixe mais forte para o contexto atual, com ${best.match.score}/100. ${best.match.summary}`,
    "",
    "Cuidados especificos",
    cautions.length > 0 ? cautions.map((item) => `- ${item}`).join("\n") : "- Continue validando rotina, socializacao e conducao.",
    "",
    "Comparativo objetivo",
    alternatives.length > 0
      ? `Mantenha ${alternatives.map((item) => `${item.profile.breed.name} (${item.match.score}/100)`).join(" e ")} na mesa antes de fechar a decisao.`
      : "Compare com pelo menos mais uma raca de energia e porte parecidos antes da decisao final.",
    "",
    "Proximo passo",
    `Teste na pratica se a rotina ideal de ${best.profile.breed.name.toLowerCase()} cabe no seu dia: ${best.profile.idealRoutine}`,
  ].join("\n")
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as AdvisorRequest
  const breedIds = Array.isArray(body.breedIds)
    ? Array.from(new Set(body.breedIds.map((item) => String(item).trim()).filter(Boolean))).slice(0, 3)
    : []

  if (breedIds.length === 0) {
    return NextResponse.json(
      { success: false, message: "Selecione pelo menos uma raca para consultar a IA." },
      { status: 400 },
    )
  }

  const [{ lifestyle, profileSource, userName }, catalog] = await Promise.all([
    resolveUserLifestyle(body.lifestyle),
    listDogBreeds(200),
  ])

  const breedMap = new Map(catalog.map((breed) => [breed.id, breed]))
  const profiles = breedIds
    .map((id) => breedMap.get(id))
    .filter(Boolean)
    .map((breed) => buildBreedStudyProfile(breed!))

  if (profiles.length === 0) {
    return NextResponse.json(
      { success: false, message: "Nao encontramos essas racas no catalogo atual da plataforma." },
      { status: 404 },
    )
  }

  const ranked = profiles
    .map((profile) => ({
      profile,
      match: scoreBreedMatch(profile, lifestyle),
    }))
    .sort((left, right) => right.match.score - left.match.score)

  const fallbackAdvice = buildFallbackAdvice(profiles, lifestyle)

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      success: true,
      fallback: true,
      profileSource,
      advice: fallbackAdvice,
    })
  }

  const instructions = [
    "Voce e um consultor especialista em racas de caes para a plataforma K9.",
    "Use apenas os dados fornecidos sobre o tutor e sobre as racas.",
    "Nunca invente dados e nunca recomende racas fora da lista recebida.",
    "Se algo estiver incerto, diga explicitamente que e uma inferencia limitada.",
    "Estruture a resposta em 4 blocos curtos com os titulos: Adequacao, Cuidados especificos, Comparativo objetivo, Proximo passo.",
    "A recomendacao precisa ser pratica e objetiva, nao promocional.",
  ].join(" ")

  const input = [
    userName ? `Tutor: ${userName}` : "Tutor sem nome informado.",
    `Origem do perfil: ${profileSource}.`,
    `Perfil do tutor:\n${buildLifestyleSummary(lifestyle)}`,
    "Racas do catalogo em analise:",
    ranked.map(({ profile, match }) => buildBreedContext(profile, match.score)).join("\n\n---\n\n"),
  ].join("\n\n")

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_BREED_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      store: false,
      temperature: 0.4,
      max_output_tokens: 700,
      instructions,
      input,
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    return NextResponse.json({
      success: true,
      fallback: true,
      profileSource,
      advice: fallbackAdvice,
    })
  }

  const advice = extractOutputText(payload)

  return NextResponse.json({
    success: true,
    fallback: false,
    profileSource,
    advice: advice || fallbackAdvice,
  })
}
