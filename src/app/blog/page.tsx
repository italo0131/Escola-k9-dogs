import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getAuthSession } from "@/lib/auth"
import { getRoleLabel, isStaffRole } from "@/lib/role"
import SafeImage from "@/app/components/SafeImage"
import { formatDateRange, formatRegion } from "@/lib/community"
import { getBlogPostTypeLabel } from "@/lib/platform"

export default async function BlogPage() {
  const session = await getAuthSession()
  const canWrite = !!session?.user
  const canViewDrafts = isStaffRole(session?.user?.role)

  const posts = await prisma.blogPost.findMany({
    where: canViewDrafts ? {} : { published: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      author: true,
      _count: { select: { comments: true, reactions: true } },
    },
  })

  const events = posts.filter((post) => post.postType === "EVENTO")
  const articles = posts.filter((post) => post.postType !== "EVENTO")
  const featured = posts.find((post) => post.featured) || posts[0] || null
  const socialVolume = posts.reduce((sum, post) => sum + post._count.comments + post._count.reactions, 0)

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_26%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(140deg,rgba(15,23,42,0.96),rgba(15,23,42,0.76)),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_28%)] p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/80">Blog da plataforma</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Aprenda, publique e acompanhe o que a comunidade vive.</h1>
              <p className="text-slate-300">
                Aqui ficam os posts abertos da plataforma. Clientes registram aprendizados, enquanto adestradores,
                veterinarios e equipe publicam guias, orientacoes, casos e eventos que entram no calendario.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {canWrite ? (
                <Link
                  href="/blog/new"
                  className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
                >
                  Novo post
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-gray-100 transition hover:bg-white/10"
                >
                  Entrar para publicar
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            <Metric title="Posts publicados" value={String(posts.length)} description="Artigos, guias e relatos publicados" />
            <Metric title="Eventos ativos" value={String(events.length)} description="Entram no calendario do cliente" />
            <Metric title="Autores" value={String(new Set(posts.map((post) => post.authorId)).size)} description="Clientes, especialistas e equipe" />
            <Metric title="Movimento" value={String(socialVolume)} description="Curtidas e comentarios circulando no blog" />
            <Metric
              title="Modo"
              value={canWrite ? "Conta ativa" : "Leitura"}
              description={canWrite ? "Sua conta ja pode publicar no blog" : "Entre para participar da comunidade"}
            />
          </div>
        </section>

        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="block overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(150deg,rgba(8,145,178,0.18),rgba(255,255,255,0.04))] shadow-2xl shadow-cyan-950/40 transition hover:-translate-y-0.5"
          >
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-8">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em]">
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getBlogPostTypeLabel(featured.postType)}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{featured.category}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{getRoleLabel(featured.author.role)}</span>
                  {featured.videoUrl && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">Video</span>}
                  {featured.coverImageUrl && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">Imagem</span>}
                  {!featured.published && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-100">Rascunho</span>}
                </div>
                <h2 className="mt-4 text-3xl font-semibold">{featured.title}</h2>
                <p className="mt-3 max-w-3xl text-slate-300">{truncate(featured.excerpt || featured.content, 240)}</p>
                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
                  <span>{featured.author.name}</span>
                  <span>
                    {new Date(featured.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                  <span>{featured._count.reactions} curtidas</span>
                  <span>{featured._count.comments} comentarios</span>
                  {featured.postType === "EVENTO" && featured.eventStartsAt && (
                    <span>{formatDateRange(featured.eventStartsAt, featured.eventEndsAt)}</span>
                  )}
                </div>
              </div>
              <div className="min-h-[260px] bg-slate-950/50">
                {featured.coverImageUrl ? (
                  <SafeImage src={featured.coverImageUrl} alt={featured.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_35%),linear-gradient(140deg,#0f172a,#111827)] px-8 text-center text-slate-300">
                    Post em destaque com visual pronto para ganhar imagem, video e conversa.
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Eventos</p>
              <h2 className="text-2xl font-semibold">Agenda aberta da comunidade</h2>
            </div>
            <span className="text-sm text-slate-400">{events.length} eventos</span>
          </div>

          {events.length === 0 && <p className="text-slate-300">Nenhum evento publicado no blog ainda.</p>}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/6 transition hover:bg-white/10"
              >
                {post.coverImageUrl && <SafeImage src={post.coverImageUrl} alt={post.title} className="h-44 w-full object-cover" />}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em]">
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">Evento</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{post.category}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{post.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{truncate(post.excerpt || post.content, 150)}</p>
                  <div className="mt-4 space-y-1 text-sm text-slate-300">
                    <p>{formatDateRange(post.eventStartsAt, post.eventEndsAt)}</p>
                    <p>{post.eventLocation || formatRegion(post.eventCity, post.eventState)}</p>
                    <p>{post.author.name}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{post._count.reactions} curtidas</span>
                    <span>{post._count.comments} comentarios</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Publicacoes</p>
              <h2 className="text-2xl font-semibold">Conhecimento em circulacao</h2>
            </div>
            <span className="text-sm text-slate-400">{articles.length} posts</span>
          </div>

          {articles.length === 0 && <p className="text-slate-300">Nenhum post publicado ainda.</p>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/6 shadow-lg shadow-black/20 transition hover:bg-white/10"
              >
                {post.coverImageUrl && <SafeImage src={post.coverImageUrl} alt={post.title} className="h-44 w-full object-cover" />}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em]">
                    <span className="text-cyan-200/80">{post.author.name}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">{getRoleLabel(post.author.role)}</span>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">{post.category}</span>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getBlogPostTypeLabel(post.postType)}</span>
                    {post.videoUrl && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">Video</span>}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{post.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{truncate(post.excerpt || post.content, 170)}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span>{post._count.reactions} curtidas</span>
                    <span>{post._count.comments} comentarios</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  )
}

function truncate(value: string | null | undefined, max = 160) {
  if (!value) return ""
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}
