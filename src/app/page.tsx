import Link from "next/link"
import { unstable_cache } from "next/cache"

import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const getPublicSnapshot = unstable_cache(
  async () => {
    try {
      const [breedCount, postCount, threadCount, moduleCount] = await Promise.all([
        prisma.dog.count(),
        prisma.blogPost.count({ where: { published: true } }),
        prisma.forumThread.count(),
        prisma.module.count(),
      ])

      const posts = await prisma.blogPost.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 4,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
        },
      })

      return { breedCount, postCount, threadCount, moduleCount, posts }
    } catch (error) {
      console.error("[home] Falha ao carregar snapshot publico:", error)
      return { breedCount: 0, postCount: 0, threadCount: 0, moduleCount: 0, posts: [] as Array<{ id: string; title: string; slug: string; excerpt: string | null; category: string | null }> }
    }
  },
  ["home-admin-centric-snapshot"],
  { revalidate: 300 },
)

export default async function Home() {
  const [session, snapshot] = await Promise.all([getAuthSession(), getPublicSnapshot()])

  const isLoggedIn = !!session?.user?.id
  const primaryHref = isLoggedIn ? "/dashboard" : "/login"
  const primaryLabel = isLoggedIn ? "Abrir meu dashboard" : "Entrar com minha conta"

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.10),transparent_22%),linear-gradient(160deg,#020617,#0f172a_52%,#111827)] text-white">
      <section className="mx-auto grid min-h-[82svh] max-w-7xl gap-8 px-4 py-14 sm:px-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-100">
            Plataforma exclusiva para clientes K9 Training
          </span>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Acompanhamento real de treino, rotina e evolução do seu cão, tudo em um só lugar.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              A equipe K9 cria sua conta, libera os módulos certos para o seu caso e acompanha o progresso com
              dedicação, treinos personalizados e suporte contínuo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-cyan-500/25 transition hover:-translate-y-0.5"
            >
              {primaryLabel}
            </Link>
            <Link
              href="/racas"
              className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-6 py-4 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Explorar raças
            </Link>
            <Link
              href="/blog"
              className="rounded-2xl border border-white/15 px-6 py-4 text-sm text-slate-100 transition hover:bg-white/10"
            >
              Ler o blog
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <MetricPill title="Módulos" value={`${snapshot.moduleCount} módulos disponíveis`} />
            <MetricPill title="Conteúdo" value={`${snapshot.postCount} artigos publicados`} />
            <MetricPill title="Comunidade" value={`${snapshot.threadCount} conversas ativas`} />
          </div>
        </div>

        <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.78)),radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_30%)] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Como funciona</p>
          <div className="mt-5 grid gap-4">
            <FlowCard step="01" title="Conta criada pela K9" description="Nossa equipe cadastra seu acesso, define seu e-mail, uma senha temporária e libera os módulos exatos para o momento do seu cão." />
            <FlowCard step="02" title="Treinos e agenda no painel" description="Seu dashboard exibe apenas os treinos, cursos e eventos que realmente fazem sentido para o acompanhamento do seu pet. Sem excessos, sem distrações." />
            <FlowCard step="03" title="Fórum, blog e raças" description="Você vê o progresso em tempo real, registra dúvidas e recebe ajustes no plano sempre que necessário." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <ValueCard
            eyebrow="Clientes"
            title="Dashboard objetivo"
            description="Cada cliente acompanha apenas o que a equipe liberou: treinos, agenda, materiais e progresso do seu cão."
            href={isLoggedIn ? "/dashboard" : "/login"}
            cta={isLoggedIn ? "Abrir meu painel" : "Entrar"}
          />
          <ValueCard
            eyebrow="Conhecimento"
            title="Blog e racas livres"
            description="Conteúdo educativo e enciclopédia de raças continuam acessíveis para qualquer visitante."
            href="/blog"
            cta="Ver conteúdos"
          />
          <ValueCard
            eyebrow="Comunidade"
            title="Forum para clientes logados"
            description="Um espaço seguro para trocar experiências, tirar dúvidas e manter o ritmo do acompanhamento."
            href={isLoggedIn ? "/forum" : "/login"}
            cta={isLoggedIn ? "Abrir fórum" : "Entrar para acessar"}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Blog em destaque</p>
              <h2 className="mt-2 text-3xl font-semibold">Leituras para continuar perto da rotina do seu cão</h2>
            </div>
            <Link href="/blog" className="text-sm text-cyan-300 hover:underline underline-offset-4">
              Ver todos os posts
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {snapshot.posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="rounded-[24px] border border-white/10 bg-slate-950/35 p-5 transition hover:bg-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{post.category}</p>
                <h3 className="mt-3 text-lg font-semibold">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{post.excerpt || "Conteudo educativo da equipe K9 Training."}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetricPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  )
}

function FlowCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">{step}</p>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}

function ValueCard({
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  eyebrow: string
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <Link href={href} className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/10">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <p className="mt-6 text-sm font-semibold text-cyan-200">{cta}</p>
    </Link>
  )
}
