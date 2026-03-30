"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BrainCircuit, CheckCircle2, Dog, LoaderCircle, Radar, Sparkles } from "lucide-react"
import { useEffect, useState, useTransition } from "react"

import MotionReveal from "@/app/components/ui/MotionReveal"
import Skeleton from "@/app/components/ui/Skeleton"

import type { BreedStudyProfile } from "@/lib/breed-study"
import {
  BREED_LIFESTYLE_OPTIONS,
  DEFAULT_BREED_LIFESTYLE,
  normalizeBreedLifestyleForm,
  scoreBreedMatch,
  type BreedLifestyleForm,
  type BreedMatchResult,
} from "@/lib/breed-match"

type Props = {
  profiles: BreedStudyProfile[]
  errorMessage: string
  pageTitle: string
}

type ProfileApiResponse = {
  success?: boolean
  user?: {
    name?: string
    breedAdvisorProfile?: Partial<BreedLifestyleForm> | null
  }
}

type AdvisorResponse = {
  success?: boolean
  fallback?: boolean
  profileSource?: "guest" | "live" | "saved"
  advice?: string
  message?: string
}

const SELECT_FIELDS: Array<{
  label: string
  field:
    | "livingSpace"
    | "routine"
    | "experience"
    | "goal"
    | "trainingTime"
    | "activityLevel"
    | "sizePreference"
    | "energyPreference"
}> = [
  {
    label: "Espaco",
    field: "livingSpace",
  },
  {
    label: "Rotina da casa",
    field: "routine",
  },
  {
    label: "Experiencia com caes",
    field: "experience",
  },
  {
    label: "Objetivo principal",
    field: "goal",
  },
  {
    label: "Tempo para treino",
    field: "trainingTime",
  },
  {
    label: "Seu nivel de atividade",
    field: "activityLevel",
  },
  {
    label: "Preferencia de porte",
    field: "sizePreference",
  },
  {
    label: "Preferencia de energia",
    field: "energyPreference",
  },
]

export default function BreedExplorer({ profiles, errorMessage, pageTitle }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lifestyle, setLifestyle] = useState<BreedLifestyleForm>(DEFAULT_BREED_LIFESTYLE)
  const [advisorText, setAdvisorText] = useState("")
  const [advisorError, setAdvisorError] = useState("")
  const [advisorMeta, setAdvisorMeta] = useState<{ fallback: boolean; source: string | null }>({
    fallback: false,
    source: null,
  })
  const [profileState, setProfileState] = useState<"loading" | "guest" | "ready">("loading")
  const [profileNotice, setProfileNotice] = useState("")
  const [profileName, setProfileName] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isSavingProfile, startSavingProfile] = useTransition()

  useEffect(() => {
    let active = true

    fetch("/api/profile", { credentials: "same-origin" })
      .then(async (response) => {
        if (!active) return

        if (response.status === 401) {
          setProfileState("guest")
          setProfileNotice("Entre na conta para salvar seu contexto e deixar a IA mais precisa nas proximas consultas.")
          return
        }

        const payload = (await response.json().catch(() => null)) as ProfileApiResponse | null
        if (!response.ok || !payload?.success || !payload.user) {
          setProfileState("guest")
          setProfileNotice("Nao foi possivel carregar um perfil salvo agora. O radar continua funcionando com o contexto da tela.")
          return
        }

        setProfileState("ready")
        setProfileName(String(payload.user.name || ""))

        if (payload.user.breedAdvisorProfile) {
          setLifestyle(normalizeBreedLifestyleForm(payload.user.breedAdvisorProfile))
          setProfileNotice("Seu perfil salvo foi carregado e esta alimentando o radar e a consultoria.")
        } else {
          setProfileNotice("Voce esta logado. Se quiser, salve este contexto para a IA lembrar da sua rotina depois.")
        }
      })
      .catch(() => {
        if (!active) return
        setProfileState("guest")
        setProfileNotice("Nao foi possivel carregar o perfil agora. A leitura segue com o contexto preenchido nesta pagina.")
      })

    return () => {
      active = false
    }
  }, [])

  const rankedProfiles = profiles
    .map((profile) => ({
      profile,
      match: scoreBreedMatch(profile, lifestyle),
    }))
    .sort((left, right) => right.match.score - left.match.score)

  const highlightedProfiles = rankedProfiles.slice(0, 3)
  const bestMatch = highlightedProfiles[0] || null
  const selectedProfiles = profiles.filter((profile) => selectedIds.includes(profile.breed.id))
  const selectedRankedProfiles = selectedProfiles
    .map((profile) => ({
      profile,
      match: scoreBreedMatch(profile, lifestyle),
    }))
    .sort((left, right) => right.match.score - left.match.score)
  const decisionBoard = selectedRankedProfiles[0] || bestMatch

  function updateLifestyle<K extends keyof BreedLifestyleForm>(key: K, value: BreedLifestyleForm[K]) {
    setLifestyle((current) => normalizeBreedLifestyleForm({ ...current, [key]: value }))
  }

  function toggleBreed(profileId: string) {
    setSelectedIds((current) => {
      if (current.includes(profileId)) {
        return current.filter((item) => item !== profileId)
      }
      if (current.length >= 3) {
        return [...current.slice(1), profileId]
      }
      return [...current, profileId]
    })
  }

  function useTopMatches() {
    setSelectedIds(highlightedProfiles.map(({ profile }) => profile.breed.id))
  }

  function useBestMatchOnly() {
    if (!bestMatch) return
    setSelectedIds([bestMatch.profile.breed.id])
  }

  function clearComparator() {
    setSelectedIds([])
    setAdvisorError("")
  }

  function saveProfileContext() {
    if (profileState !== "ready") {
      setProfileNotice("Entre na conta para salvar este contexto e reutiliza-lo nas proximas consultas.")
      return
    }

    startSavingProfile(() => {
      void (async () => {
        try {
          const response = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ breedAdvisorProfile: lifestyle }),
          })

          const payload = (await response.json().catch(() => null)) as ProfileApiResponse | null
          if (!response.ok || !payload?.success) {
            setProfileNotice("Nao foi possivel salvar seu contexto agora.")
            return
          }

          setProfileNotice("Contexto salvo com sucesso. A partir de agora a IA pode reutilizar esse perfil quando voce estiver logado.")
        } catch {
          setProfileNotice("Nao foi possivel salvar seu contexto agora.")
        }
      })()
    })
  }

  function requestAdvisor() {
    if (selectedProfiles.length === 0) {
      setAdvisorError("Selecione de 1 a 3 racas para consultar a IA.")
      return
    }

    setAdvisorError("")
    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/breed-ai/advice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lifestyle,
              breedIds: selectedProfiles.map((profile) => profile.breed.id),
            }),
          })

          const payload = (await response.json().catch(() => null)) as AdvisorResponse | null
          if (!response.ok || !payload?.success) {
            setAdvisorText("")
            setAdvisorMeta({ fallback: false, source: null })
            setAdvisorError(payload?.message || "Nao foi possivel consultar a IA agora.")
            return
          }

          setAdvisorText(String(payload.advice || "").trim())
          setAdvisorMeta({
            fallback: Boolean(payload.fallback),
            source: payload.profileSource || null,
          })
        } catch (error) {
          console.error(error)
          setAdvisorText("")
          setAdvisorMeta({ fallback: false, source: null })
          setAdvisorError("Erro ao conversar com o consultor de IA.")
        }
      })()
    })
  }

  return (
    <div className="space-y-8">
      <MotionReveal delay={0.04}>
        <section id="radar-racas" className="scroll-mt-28 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(8,47,73,0.46),rgba(15,23,42,0.8))] p-6 shadow-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
                  <Radar className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Radar de encaixe</span>
                </div>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Veja quais perfis combinam mais com sua vida real</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  Cruze espaco, rotina, experiencia e objetivo para encontrar o encaixe mais realista.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                Ate 3 racas no comparador
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/15 p-4 text-sm text-slate-200">
              <p className="font-medium text-white">
                {profileState === "ready"
                  ? `Perfil conectado${profileName ? `: ${profileName}` : ""}`
                  : profileState === "guest"
                    ? "Modo visitante"
                    : "Carregando perfil"}
              </p>
              <p className="mt-2 text-slate-300">{profileNotice}</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={saveProfileContext}
                  disabled={profileState !== "ready" || isSavingProfile}
                  className="interactive-button flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  <span>{isSavingProfile ? "Salvando contexto..." : "Salvar contexto no meu perfil"}</span>
                </button>
                {profileState !== "ready" ? (
                  <Link
                    href="/login"
                    className="interactive-button flex min-h-[48px] items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition-all duration-200 hover:bg-cyan-500/20"
                  >
                    Entrar para salvar
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {SELECT_FIELDS.map((field) => (
                <SelectField
                  key={field.field}
                  label={field.label}
                  value={lifestyle[field.field]}
                  onChange={(value) => updateLifestyle(field.field, value as BreedLifestyleForm[typeof field.field])}
                  options={BREED_LIFESTYLE_OPTIONS[field.field]}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ToggleField
                label="Vai conviver com criancas?"
                checked={lifestyle.kids}
                onChange={(checked) => updateLifestyle("kids", checked)}
              />
              <ToggleField
                label="Vai conviver com outros pets?"
                checked={lifestyle.otherPets}
                onChange={(checked) => updateLifestyle("otherPets", checked)}
              />
            </div>

            <label className="mt-4 block text-sm text-slate-300">
              Contexto extra
              <textarea
                value={lifestyle.notes}
                onChange={(event) => updateLifestyle("notes", event.target.value)}
                rows={3}
                placeholder="Ex.: apartamento, crianca pequena, quero companhia e boa treinabilidade."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </label>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {highlightedProfiles.map(({ profile, match }, index) => (
                <motion.div
                  key={profile.breed.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  className="rounded-[26px] border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Top {index + 1}</p>
                      <h3 className="mt-2 text-xl font-semibold">{profile.breed.name}</h3>
                    </div>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-semibold text-cyan-100">
                      {match.score}/100
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{match.label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{match.summary}</p>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    {match.strengths.slice(0, 2).map((item) => (
                      <p key={item}>+ {item}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={useTopMatches}
                disabled={highlightedProfiles.length === 0}
                className="interactive-button flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Usar top 3 no comparador</span>
              </button>
              <button
                type="button"
                onClick={useBestMatchOnly}
                disabled={!bestMatch}
                className="interactive-button flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Fixar melhor encaixe</span>
              </button>
              <button
                type="button"
                onClick={clearComparator}
                disabled={selectedIds.length === 0}
                className="interactive-button flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4 rotate-45" aria-hidden="true" />
                <span>Limpar selecao</span>
              </button>
            </div>

            {bestMatch ? (
              <div className="mt-6 grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Radar funcional</span>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{bestMatch.profile.breed.name}</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Melhor leitura atual para a rotina preenchida.
                  </p>
                  <CompatibilityRadar dimensions={bestMatch.match.dimensions} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {bestMatch.match.dimensions.map((dimension, index) => (
                    <motion.div
                      key={dimension.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                    >
                      <DimensionCard dimension={dimension} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div
            id="coach-racas"
            className="scroll-mt-28 rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(15,23,42,0.76)),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_30%)] p-6 shadow-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
              <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Consultor K9 com IA</span>
            </div>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Peca uma leitura comparativa para sua rotina</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">Selecione algumas racas e deixe a IA organizar a leitura.</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {selectedProfiles.length === 0 ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  Nenhuma raca selecionada ainda
                </span>
              ) : null}
              {selectedProfiles.map((profile) => (
                <button
                  key={profile.breed.id}
                  type="button"
                  onClick={() => toggleBreed(profile.breed.id)}
                  aria-pressed="true"
                  className="interactive-button flex min-h-[44px] items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-2 text-sm text-cyan-100 transition-all duration-200 hover:bg-cyan-500/25"
                >
                  <Dog className="h-4 w-4" aria-hidden="true" />
                  <span>{profile.breed.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Base da resposta</p>
              <p className="mt-2 leading-6">
                {advisorMeta.source === "saved"
                  ? "A IA esta cruzando as racas escolhidas com o perfil salvo da sua conta."
                  : advisorMeta.source === "live"
                    ? "A IA esta usando o contexto preenchido agora nesta tela."
                    : advisorMeta.source === "guest"
                      ? "A IA esta respondendo com base no contexto desta tela em modo visitante."
                      : "Selecione as racas para gerar a leitura."}
              </p>
            </div>

            <button
              type="button"
              onClick={requestAdvisor}
              disabled={isPending}
              className="interactive-button mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <BrainCircuit className="h-4 w-4" aria-hidden="true" />}
              <span>{isPending ? "Consultando IA..." : "Gerar consultoria"}</span>
            </button>

            {advisorError ? (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-50">
                {advisorError}
              </div>
            ) : null}

            {isPending ? (
              <div className="mt-4 space-y-4" role="status" aria-live="polite">
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-4 h-4 w-full" />
                  <Skeleton className="mt-3 h-4 w-11/12" />
                  <Skeleton className="mt-3 h-4 w-10/12" />
                  <Skeleton className="mt-6 h-24 w-full rounded-[20px]" />
                </div>
              </div>
            ) : null}

            {advisorText ? (
              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Leitura da IA</p>
                  {advisorMeta.fallback ? (
                    <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
                      resposta de fallback
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100">{advisorText}</div>
              </div>
            ) : null}
          </div>
        </section>
      </MotionReveal>

      <MotionReveal delay={0.08}>
        <section id="comparador-racas" className="scroll-mt-28 rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Comparador vivo</span>
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Cruze ate 3 racas lado a lado</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="text-sm text-slate-300">Selecao ativa: {selectedProfiles.length}/3</p>
              <button
                type="button"
                onClick={useTopMatches}
                className="interactive-button inline-flex min-h-[40px] items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-cyan-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-500/20"
              >
                usar top 3
              </button>
            </div>
          </div>

          {decisionBoard ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(6,182,212,0.14),rgba(15,23,42,0.82))] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Decisao da rodada</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{decisionBoard.profile.breed.name}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {selectedRankedProfiles.length > 0
                    ? `Entre as racas selecionadas, esta e a lider atual com ${decisionBoard.match.score}/100.`
                    : `Se voce escolhesse so pelo radar atual, esta seria a primeira candidata com ${decisionBoard.match.score}/100.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge label={`Grupo: ${decisionBoard.profile.groupLabel}`} />
                  <Badge label={`Porte: ${decisionBoard.profile.sizeLabel}`} />
                  <Badge label={`Radar: ${decisionBoard.match.label}`} />
                </div>
                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Por que ela lidera agora</p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">
                    {decisionBoard.match.strengths[0] || decisionBoard.match.summary}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(selectedRankedProfiles.length > 0 ? selectedRankedProfiles : highlightedProfiles).map((item) => (
                  <div
                    key={item.profile.breed.id}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.profile.breed.name}</p>
                        <p className="text-xs text-slate-400">{item.profile.groupLabel}</p>
                      </div>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-100">
                        {item.match.score}/100
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {item.match.strengths[0] || item.match.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selectedProfiles.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-slate-300">
              <p>
                Use o botao "Comparar" nos cards abaixo para montar uma mesa de decisao com porte, energia, treino, rotina
                ideal e pontos de atencao.
              </p>
              <button
                type="button"
                onClick={useTopMatches}
                className="interactive-button mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-500/20"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Usar o top 3 do radar agora</span>
              </button>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-[24px] border border-white/10 bg-slate-950/30 p-4">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="pb-3 pr-4">Criterio</th>
                    {selectedProfiles.map((profile) => (
                      <th key={profile.breed.id} className="pb-3 pr-4 align-top">
                        <div className="space-y-2">
                          <p className="text-base font-semibold text-white">{profile.breed.name}</p>
                          <p className="text-xs text-cyan-200/80">{profile.groupLabel}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {[
                    {
                      label: "Porte",
                      values: selectedProfiles.map((profile) => profile.sizeLabel),
                    },
                    {
                      label: "Energia",
                      values: selectedProfiles.map((profile) => `${profile.energy.label} (${profile.energy.score}/5)`),
                    },
                    {
                      label: "Treinabilidade",
                      values: selectedProfiles.map((profile) => `${profile.trainability.label} (${profile.trainability.score}/5)`),
                    },
                    {
                      label: "Convivencia",
                      values: selectedProfiles.map((profile) => `${profile.sociability.label} (${profile.sociability.score}/5)`),
                    },
                    {
                      label: "Peso de referencia",
                      values: selectedProfiles.map((profile) => profile.weightLabel),
                    },
                    {
                      label: "Vida media",
                      values: selectedProfiles.map((profile) => profile.lifeSpanLabel),
                    },
                    {
                      label: "Rotina ideal",
                      values: selectedProfiles.map((profile) => profile.idealRoutine),
                    },
                    {
                      label: "Foco de treino",
                      values: selectedProfiles.map((profile) => profile.trainingFocus),
                    },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-4 pr-4 align-top font-medium text-white">{row.label}</td>
                      {row.values.map((value, index) => (
                        <td key={`${row.label}-${index}`} className="py-4 pr-4 align-top text-slate-300">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </MotionReveal>

      <MotionReveal delay={0.12}>
        <section id="catalogo-racas" className="scroll-mt-28 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
                <Dog className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Estudo de racas</span>
              </div>
              <h2 className="mt-3 text-3xl font-semibold">{pageTitle}</h2>
            </div>
            <p className="text-sm text-slate-300">Selecione uma raca para comparar ou usar no consultor.</p>
          </div>

          {errorMessage ? (
            <div className="rounded-[28px] border border-rose-300/20 bg-rose-500/10 p-5 text-rose-100">{errorMessage}</div>
          ) : null}

          {!errorMessage && profiles.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-6 text-slate-300">
              Nenhuma raca encontrada com esse recorte. Tente ajustar a busca ou mudar o grupo.
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-2">
            {rankedProfiles.map(({ profile, match }, index) => {
              const selected = selectedIds.includes(profile.breed.id)
              return (
                <motion.article
                  key={profile.breed.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.24, delay: (index % 6) * 0.03 }}
                  className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.74))] shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-cyan-950/20"
                >
                  <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="relative min-h-[220px] border-b border-white/10 lg:border-b-0 lg:border-r">
                      <img
                        src={profile.breed.referenceImageUrl || "https://placehold.co/960x720/0f172a/e2e8f0?text=Raca"}
                        alt={profile.breed.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute left-4 top-4 rounded-full bg-slate-950/75 px-3 py-1 text-xs text-cyan-100 backdrop-blur">
                        {profile.groupLabel}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-3xl font-semibold">{profile.breed.name}</h3>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{profile.summary}</p>
                        </div>
                        <div className="space-y-2 md:w-[190px]">
                          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-right">
                            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Radar</p>
                            <p className="mt-1 text-2xl font-semibold text-white">{match.score}/100</p>
                            <p className="text-xs text-slate-300">{match.label}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleBreed(profile.breed.id)}
                            aria-pressed={selected}
                            className={`interactive-button flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                              selected
                                ? "border border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                                : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                            }`}
                          >
                            {selected ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                            <span>{selected ? "Selecionada no comparador" : "Comparar"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Badge label={`Porte: ${profile.sizeLabel}`} />
                        <Badge label={`Energia: ${profile.energy.label}`} />
                        <Badge label={`Treino: ${profile.trainability.label}`} />
                        <Badge label={`Convivio: ${profile.sociability.label}`} />
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <MeterBar label="Energia" value={profile.energy.score} tone="cyan" />
                        <MeterBar label="Treino" value={profile.trainability.score} tone="emerald" />
                        <MeterBar label="Convivio" value={profile.sociability.score} tone="amber" />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <BreedFact title="Peso" value={profile.weightLabel} />
                        <BreedFact title="Altura" value={profile.heightLabel} />
                        <BreedFact title="Vida media" value={profile.lifeSpanLabel} />
                        <BreedFact title="Funcao" value={profile.historicalRole} />
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <InsightPanel title="Rotina ideal">{profile.idealRoutine}</InsightPanel>
                        <InsightPanel title="Foco de treino">{profile.trainingFocus}</InsightPanel>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <InsightPanel title="Pontos fortes">
                          {match.strengths.length > 0 ? match.strengths.map((item) => `+ ${item}`).join("\n") : match.summary}
                        </InsightPanel>
                        <InsightPanel title="Atencao antes de decidir">
                          {match.cautions.length > 0 ? match.cautions.map((item) => `- ${item}`).join("\n") : "Sem alerta forte para esse contexto."}
                        </InsightPanel>
                      </div>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </section>
      </MotionReveal>

      <MotionReveal delay={0.16}>
        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Proximo passo</span>
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Quando fizer sentido, leve a decisao para a ficha do seu cao</h2>
              <p className="mt-3 text-slate-300">
                Depois de estudar e comparar, cadastre seu cao com o perfil enriquecido por raca, saude, rotina e metas
                de treino. Isso transforma leitura em operacao de verdade.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/dogs/new"
                className="interactive-button flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <Dog className="h-4 w-4" aria-hidden="true" />
                <span>Cadastrar cao</span>
              </Link>
              <Link
                href="/register"
                className="interactive-button flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm text-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                <span>Criar conta</span>
              </Link>
            </div>
          </div>
        </section>
      </MotionReveal>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <label className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/10">
      <span className="text-sm font-medium text-slate-100">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-black">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-[56px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-all duration-200 hover:border-white/15 hover:bg-white/10">
      <span className="text-sm text-slate-200">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-white/20 bg-transparent accent-cyan-500"
      />
    </label>
  )
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{label}</span>
}

function BreedFact({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/10">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-slate-100">{value}</p>
    </div>
  )
}

function DimensionCard({
  dimension,
}: {
  dimension: BreedMatchResult["dimensions"][number]
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{dimension.label}</p>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">{dimension.score}/100</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#10b981)]"
          style={{ width: `${dimension.score}%` }}
        />
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{dimension.description}</p>
    </div>
  )
}

function MeterBar({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "cyan" | "emerald" | "amber"
}) {
  const palette =
    tone === "emerald"
      ? "from-emerald-400 to-lime-400"
      : tone === "amber"
        ? "from-amber-400 to-orange-400"
        : "from-cyan-400 to-sky-400"

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{label}</p>
        <span className="text-xs text-slate-300">{value}/5</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${palette}`} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  )
}

function InsightPanel({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/10">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{children}</div>
    </div>
  )
}

function CompatibilityRadar({
  dimensions,
}: {
  dimensions: BreedMatchResult["dimensions"]
}) {
  return (
    <div className="mt-5 space-y-3">
      {dimensions.map((dimension) => (
        <div key={dimension.id}>
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-300">
            <span>{dimension.label}</span>
            <span>{dimension.score}/100</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#10b981)]"
              style={{ width: `${dimension.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
