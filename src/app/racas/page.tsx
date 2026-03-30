import Link from "next/link"
import type { Metadata } from "next"
import { Radar, BrainCircuit, GitCompare, Dog, ArrowRight } from "lucide-react"

import { BREED_GROUPS, mapApiGroupToValue, translateBreedGroup } from "@/lib/breed-groups"
import { buildBreedStudyProfile, type BreedStudyProfile } from "@/lib/breed-study"
import {
  getBreedImageUrl,
  getBreedQuerySuggestions,
  normalizeBreedSearchAlias,
  normalizeBreedSearchTerm,
  searchBreedCatalog,
  suggestBreedQueries,
} from "@/lib/breed-search"
import { getDogBreedCatalog } from "@/lib/thedogapi"

type SearchParams = {
  q?: string | string[]
  grupo?: string | string[]
}

type Props = {
  searchParams?: Promise<SearchParams> | SearchParams
}

const POPULAR_SEARCHES = [
  { label: "Pastor Alemão", query: "pastor alemao" },
  { label: "Golden", query: "golden" },
  { label: "Labrador", query: "labrador" },
  { label: "Shih Tzu", query: "shih tzu" },
  { label: "Salsicha", query: "salsicha" },
  { label: "Malinois", query: "malinois" },
]

export const revalidate = 21600

async function resolveSearchParams(input?: Promise<SearchParams> | SearchParams) {
  if (!input) return {} as SearchParams
  if (typeof (input as Promise<SearchParams>).then === "function") {
    return (await input) || {}
  }
  return input
}

function getSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) return String(value[0] || "")
  return String(value || "")
}

function buildBreedHref(query?: string, group?: string) {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (group) params.set("grupo", group)
  const search = params.toString()
  return search ? `/racas?${search}` : "/racas"
}

function buildPageTitle(query: string, selectedGroup: string) {
  if (query) return `Resultados para "${query}"`
  if (selectedGroup) return `Grupo: ${translateBreedGroup(selectedGroup)}`
  return "Explorador de raças"
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolved = await resolveSearchParams(searchParams)
  const query = getSingleParam(resolved.q).trim()
  const selectedGroup = getSingleParam(resolved.grupo).trim()
  const normalizedQuery = normalizeBreedSearchAlias(query)

  const title = query
    ? `${query} | Raças | K9 Training Platform`
    : selectedGroup
      ? `${translateBreedGroup(selectedGroup)} | Raças | K9 Training Platform`
      : "Raças | K9 Training Platform"

  const description = query
    ? `Veja informações sobre ${query}, compare com outras raças e descubra se combina com seu estilo de vida.`
    : selectedGroup
      ? `Conheça as raças do grupo ${translateBreedGroup(selectedGroup)}.`
      : "Explore raças de cães com busca inteligente, comparador e radar de encaixe."

  return {
    title,
    description,
    alternates: {
      canonical: selectedGroup || query ? buildBreedHref(query || undefined, selectedGroup || undefined) : "/racas",
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
    keywords: ["raças de cães", "pastor alemão", "golden retriever", normalizedQuery, selectedGroup].filter(Boolean),
  }
}

export default async function RacasPage({ searchParams }: Props) {
  const resolvedParams = await resolveSearchParams(searchParams)
  const query = getSingleParam(resolvedParams.q).trim()
  const selectedGroup = getSingleParam(resolvedParams.grupo).trim()

  let profiles: BreedStudyProfile[] = []
  let errorMessage = ""

  try {
    const catalogResult = await getDogBreedCatalog(200)
    const catalog = catalogResult.breeds
    const baseCatalog = selectedGroup
      ? catalog.filter((breed) => mapApiGroupToValue(breed.breedGroup || "mixed") === selectedGroup)
      : catalog

    const visibleBreeds = query
      ? searchBreedCatalog(baseCatalog, query, 36)
      : baseCatalog.slice(0, selectedGroup ? 30 : 48)

    profiles = visibleBreeds.map((breed) =>
      buildBreedStudyProfile({
        ...breed,
        referenceImageUrl: getBreedImageUrl(breed.name, breed.referenceImageUrl),
      }),
    )
  } catch (error) {
    console.error("Erro ao carregar raças:", error)
    errorMessage = "Não foi possível carregar as raças agora. Tente novamente em alguns instantes."
  }

  const pageTitle = buildPageTitle(query, selectedGroup)
  const relatedSuggestions = getBreedQuerySuggestions()
  const smartSuggestions = suggestBreedQueries(profiles.map(p => p.breed), query, 6)

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.12),transparent_24%),linear-gradient(145deg,#020617,#08111f_45%,#020617)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero com busca */}
        <section className="rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.92)_45%,rgba(76,29,149,0.68)),radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_30%)] p-6 md:p-8">
          <div className="text-center space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Encontre a raça perfeita para você
            </h1>
            <p className="text-base text-slate-200 md:text-lg">
              Busque por pastor alemão, golden, salsicha ou qualquer apelido. Explore características, compare e tire suas dúvidas com a IA.
            </p>
          </div>

          <form method="get" className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Busque por pastor alemão, golden, labrador, salsicha..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4 text-white placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            <select
              name="grupo"
              defaultValue={selectedGroup}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4 text-white focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">Todos os grupos</option>
              {BREED_GROUPS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#fb7185)] px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5"
            >
              Explorar raças
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {POPULAR_SEARCHES.map((item) => (
              <Link
                key={item.label}
                href={buildBreedHref(item.query, selectedGroup || undefined)}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Botões para funcionalidades complementares */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureButton
            href="/racas/radar"
            icon={<Radar className="h-5 w-5" />}
            title="Radar de encaixe"
            description="Descubra quais raças combinam com sua rotina, espaço e energia."
          />
          <FeatureButton
            href="/racas/ia"
            icon={<BrainCircuit className="h-5 w-5" />}
            title="Consultor com IA"
            description="Responda algumas perguntas e receba recomendações personalizadas."
          />
          <FeatureButton
            href="/racas/comparador"
            icon={<GitCompare className="h-5 w-5" />}
            title="Comparador de raças"
            description="Selecione até 3 raças e compare características lado a lado."
          />
        </div>

        {/* Filtro por grupo */}
        <section className="rounded-[32px] border border-white/10 bg-white/6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-200/80">Filtro tátil</p>
              <h2 className="mt-2 text-2xl font-semibold">{pageTitle}</h2>
            </div>
            {(query || selectedGroup) && (
              <Link
                href="/racas"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Limpar filtros
              </Link>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <FilterChip href={buildBreedHref(query || undefined)} active={!selectedGroup} label="Todos" />
            {BREED_GROUPS.map((option) => (
              <FilterChip
                key={option.value}
                href={buildBreedHref(query || undefined, option.value)}
                active={selectedGroup === option.value}
                label={option.label}
              />
            ))}
          </div>
          {query && profiles.length === 0 && (
            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-50">
              Nenhum resultado encontrado para "{query}". Tente uma destas: {relatedSuggestions.join(", ")}.
            </div>
          )}
        </section>

        {/* Grade de raças */}
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-6 text-center text-rose-100">
            {errorMessage}
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-12 text-center text-slate-300">
            Nenhuma raça encontrada. Tente outro termo ou limpe os filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map((profile) => (
              <BreedCard key={profile.breed.id} profile={profile} />
            ))}
          </div>
        )}

        {/* Call to action final */}
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(140deg,rgba(15,23,42,0.96),rgba(15,23,42,0.72)),radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_30%)] p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-200/80">Da pesquisa para a prática</p>
              <h2 className="mt-2 text-3xl font-semibold">Encontrou a raça ideal? Cadastre seu cão agora.</h2>
              <p className="mt-3 text-sm text-slate-300">
                Depois de escolher, cadastre seu amigo e comece a receber recomendações personalizadas de treino e cuidados.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dogs/new"
                className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#10b981)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
              >
                <Dog className="h-4 w-4" />
                <span>Cadastrar meu cão</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Criar conta</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// Componentes auxiliares

function FeatureButton({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
    >
      <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-200 transition group-hover:bg-cyan-500/20">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-300">{description}</p>
    </Link>
  )
}

function BreedCard({ profile }: { profile: BreedStudyProfile }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10">
      <div className="relative h-48 w-full">
        <img
          src={profile.breed.referenceImageUrl || "https://placehold.co/600x400/0f172a/e2e8f0?text=Sem+imagem"}
          alt={profile.breed.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 rounded-full bg-slate-950/75 px-2 py-1 text-xs text-cyan-100 backdrop-blur">
          {profile.groupLabel}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold text-white">{profile.breed.name}</h3>
        <p className="mt-2 text-sm text-slate-300 line-clamp-2">{profile.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-200">Energia: {profile.energy.label}</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">Porte: {profile.sizeLabel}</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-200">Treino: {profile.trainability.label}</span>
        </div>
        <Link
          href={`/racas/${profile.breed.id}`}
          className="mt-5 block w-full rounded-xl bg-cyan-600/50 py-2 text-center text-sm font-medium text-white transition hover:bg-cyan-600"
        >
          Ver detalhes
        </Link>
      </div>
    </div>
  )
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 ${
        active
          ? "bg-[linear-gradient(135deg,#22d3ee,#10b981)] text-slate-950 shadow-lg shadow-cyan-500/25"
          : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  )
}