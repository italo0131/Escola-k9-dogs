"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Bot, LoaderCircle, MessageSquareText, ShieldCheck, Sparkles, WandSparkles } from "lucide-react"

import { useAppToast } from "@/app/components/AppToastProvider"
import MotionReveal from "@/app/components/ui/MotionReveal"
import Skeleton from "@/app/components/ui/Skeleton"

type CoachSuggestion = {
  label: string
  prompt: string
}

type CoachRecommendation = {
  href: string
  title: string
  description: string
  badge: string
}

type CoachResponse = {
  answer?: string
  message?: string
  recommendations?: CoachRecommendation[]
  fallback?: boolean
}

type AICoachPanelProps = {
  eyebrow?: string
  title?: string
  description?: string
  courseSlug?: string
  contentSlug?: string
  suggestions?: CoachSuggestion[]
}

export default function AICoachPanel({
  eyebrow = "Apoio com IA",
  title = "Converse com a K9 IA",
  description = "Receba uma leitura objetiva com base no contexto disponivel da plataforma, sem perder a sua autonomia na decisao.",
  courseSlug,
  contentSlug,
  suggestions = defaultSuggestions,
}: AICoachPanelProps) {
  const { pushToast } = useAppToast()
  const [question, setQuestion] = useState("")
  const [lastQuestion, setLastQuestion] = useState("")
  const [result, setResult] = useState<CoachResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const canAsk = question.trim().length >= 8
  const activeSuggestions = suggestions.slice(0, 4)
  const contextLabel = courseSlug ? "curso atual" : contentSlug ? "aula atual" : "catalogo e conteudos da plataforma"

  async function ask(prompt: string) {
    const trimmed = prompt.trim()
    if (trimmed.length < 8) {
      const message = "Conte um pouquinho mais para eu te ajudar com mais contexto."
      setError(message)
      pushToast({
        title: "Faltou um pouco de contexto",
        description: message,
        variant: "info",
      })
      return
    }

    setError(null)
    setLastQuestion(trimmed)
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          courseSlug,
          contentSlug,
        }),
      })

      const payload = (await response.json().catch(() => null)) as CoachResponse | null

      if (!response.ok) {
        const message = payload?.message || "Ops, algo deu errado. Tente novamente em alguns instantes."
        setResult(null)
        setError(message)
        pushToast({
          title: "Nao consegui responder agora",
          description: message,
          variant: "error",
        })
        return
      }

      setResult(payload)
      pushToast({
        title: payload?.fallback ? "Resposta guiada pronta" : "Resposta com IA pronta",
        description: payload?.fallback
          ? "Use esta leitura como apoio inicial e ajuste com o contexto real do seu cao."
          : "A recomendacao foi gerada com base nos dados disponiveis da plataforma.",
        variant: "success",
      })
    } catch {
      const message = "A conexao com o assistente falhou. Tente novamente em alguns segundos."
      setResult(null)
      setError(message)
      pushToast({
        title: "Assistente indisponivel no momento",
        description: message,
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MotionReveal delay={0.08}>
      <section
        id="coach-k9"
        aria-labelledby="coach-k9-title"
        aria-busy={isLoading}
        className="rounded-[32px] border border-white/10 bg-[linear-gradient(150deg,rgba(14,116,144,0.2),rgba(15,23,42,0.94)_42%,rgba(12,74,110,0.85)),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_32%)] p-6 shadow-2xl shadow-black/25 md:p-8"
      >
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{eyebrow}</span>
              </div>
              <h2 id="coach-k9-title" className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                {title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">{description}</p>
            </div>

            <MotionReveal delay={0.12} className="surface-card interactive-card rounded-[24px] p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
                <span>Perguntas que costumam render boas respostas</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.label}
                    type="button"
                    onClick={() => {
                      setQuestion(suggestion.prompt)
                      void ask(suggestion.prompt)
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="interactive-button min-h-[44px] rounded-full border border-white/10 bg-white/10 px-4 py-2 text-left text-sm text-slate-100 transition-all duration-200 hover:border-amber-300/30 hover:bg-white/15 focus-visible:ring-amber-400/40"
                    aria-label={`Usar sugestao: ${suggestion.label}`}
                  >
                    {suggestion.label}
                  </motion.button>
                ))}
              </div>
            </MotionReveal>

            <MotionReveal delay={0.16} className="surface-card rounded-[24px] p-4 text-sm leading-7 text-slate-200">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-2 text-emerald-100">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-white">Como a IA funciona por aqui</p>
                  <p className="mt-2">
                    Esta leitura e gerada por inteligencia artificial com base nos dados disponiveis da plataforma. Ela serve como apoio,
                    nao como prescricao absoluta. Cada cao e unico, e o tutor ou responsavel tem a palavra final.
                  </p>
                  <p className="mt-2 text-slate-300">
                    Em caso de dor, lesao, medo intenso, agressividade ou suspeita clinica, recomendamos acompanhamento presencial com
                    um profissional qualificado.
                  </p>
                </div>
              </div>
            </MotionReveal>
          </div>

          <div className="space-y-4">
            <MotionReveal delay={0.1} className="surface-card rounded-[28px] p-4 sm:p-5">
              <label htmlFor="coach-question" className="flex items-center gap-2 text-sm font-medium text-slate-100">
                <MessageSquareText className="h-4 w-4 text-amber-200" aria-hidden="true" />
                <span>O que voce quer entender melhor agora?</span>
              </label>
              <textarea
                id="coach-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                placeholder="Ex.: meu cao fica muito agitado quando chegam visitas. Quero uma rotina segura e realista para as proximas duas semanas."
                className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 text-sm text-white placeholder:text-slate-400 focus:border-amber-300/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                aria-describedby="coach-helper"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p id="coach-helper" className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Contexto usado: {contextLabel}
                </p>
                <button
                  type="button"
                  onClick={() => void ask(question)}
                  disabled={!canAsk || isLoading}
                  className="interactive-button flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#fb7185)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Pensando com cuidado...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" aria-hidden="true" />
                      <span>Receber orientacao</span>
                    </>
                  )}
                </button>
              </div>
            </MotionReveal>

            {error ? (
              <MotionReveal delay={0.05}>
                <div className="rounded-[24px] border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>
              </MotionReveal>
            ) : null}

            {isLoading ? (
              <div className="space-y-4">
                <div className="surface-card rounded-[28px] p-5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-4 h-4 w-full" />
                  <Skeleton className="mt-3 h-4 w-11/12" />
                  <Skeleton className="mt-3 h-4 w-10/12" />
                  <Skeleton className="mt-6 h-28 w-full rounded-[20px]" />
                </div>
                <div className="surface-card rounded-[28px] p-5">
                  <Skeleton className="h-4 w-40" />
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Skeleton className="h-28 w-full rounded-[20px]" />
                    <Skeleton className="h-28 w-full rounded-[20px]" />
                  </div>
                </div>
              </div>
            ) : null}

            {!isLoading && result ? (
              <MotionReveal delay={0.04} className="space-y-4">
                <div className="surface-card rounded-[28px] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-100">
                      Resposta assistida
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200">
                      {result.fallback ? "Modo guiado" : "IA ativa"}
                    </span>
                  </div>

                  {lastQuestion ? (
                    <p className="mt-3 text-sm text-slate-400">
                      Sua pergunta: <span className="text-slate-200">{lastQuestion}</span>
                    </p>
                  ) : null}

                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-100">{result.answer || result.message}</div>
                </div>

                {result.recommendations && result.recommendations.length > 0 ? (
                  <div className="surface-card rounded-[28px] p-5">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <span>Proximo passo</span>
                    </div>
                    <h3 className="mt-2 text-xl font-semibold text-white">Conteudos que podem ajudar no seu ritmo</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {result.recommendations.map((recommendation, index) => (
                        <motion.div
                          key={`${recommendation.href}-${recommendation.title}`}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.25 }}
                          transition={{ duration: 0.22, delay: index * 0.05 }}
                        >
                          <Link
                            href={recommendation.href}
                            className="interactive-card flex h-full min-h-[180px] flex-col rounded-[22px] border border-white/10 bg-white/10 p-4 transition-all duration-200 hover:bg-white/15"
                          >
                            <span className="w-fit rounded-full bg-cyan-500/15 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan-100">
                              {recommendation.badge}
                            </span>
                            <h4 className="mt-3 text-base font-semibold text-white">{recommendation.title}</h4>
                            <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{recommendation.description}</p>
                            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">
                              Saiba mais
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </MotionReveal>
            ) : null}
          </div>
        </div>
      </section>
    </MotionReveal>
  )
}

const defaultSuggestions: CoachSuggestion[] = [
  {
    label: "Rotina para filhote",
    prompt: "Monte uma rotina simples de cursos, dicas e pratica para um filhote com muita energia.",
  },
  {
    label: "Passeio sem puxar",
    prompt: "Quais os primeiros passos para reduzir puxoes no passeio e que tipo de aula devo estudar primeiro?",
  },
  {
    label: "Socializacao com calma",
    prompt: "Quero melhorar a socializacao do meu cao sem exagerar nos estimulos. Como posso fazer isso com mais seguranca?",
  },
  {
    label: "Plano de 7 dias",
    prompt: "Crie um plano de estudo de 7 dias com dicas e pratica para obediencia basica.",
  },
]
