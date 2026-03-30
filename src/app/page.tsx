import Link from "next/link"
import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/prisma"
import {
  FREE_PLAN_DOG_LIMIT,
  getAccountPlanLabel,
  getChannelContentAccessLabel,
  getChannelContentCategoryLabel,
} from "@/lib/platform"
import { formatMoney, formatServiceMode } from "@/lib/community"
import { getAuthSession } from "@/lib/auth"
import { getRoleLabel } from "@/lib/role"
import { scoreChannelDiscovery, scoreLessonDiscovery, scorePublicPost, sortByDiscoveryScore } from "@/lib/discovery"

const getHomePublicSnapshot = unstable_cache(
  async () => {
    const [
      dogs,
      trainings,
      users,
      blogPostCount,
      blogPostsRaw,
      channelsRaw,
      recentLessonsRaw,
      contentCount,
      threadCount,
    ] = await Promise.all([
      prisma.dog.count(),
      prisma.trainingSession.count(),
      prisma.user.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 8,
        include: {
          author: true,
          _count: { select: { comments: true, reactions: true } },
        },
      }),
      prisma.forumChannel.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          serviceMode: true,
          subscriptionPrice: true,
          createdAt: true,
          featured: true,
          owner: { select: { name: true, headline: true } },
          contents: {
            where: { published: true },
            select: {
              id: true,
              slug: true,
              title: true,
              summary: true,
              category: true,
              accessLevel: true,
              durationMinutes: true,
              orderIndex: true,
              createdAt: true,
            },
            orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
          },
          _count: { select: { subscriptions: true, threads: true } },
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
      prisma.channelContent.findMany({
        where: { published: true },
        include: {
          channel: { select: { name: true, slug: true, featured: true } },
        },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
        take: 16,
      }),
      prisma.channelContent.count({ where: { published: true } }),
      prisma.forumThread.count(),
    ])

    return {
      dogs,
      trainings,
      users,
      blogPostCount,
      contentCount,
      threadCount,
      blogPosts: sortByDiscoveryScore(blogPostsRaw, scorePublicPost).slice(0, 4),
      channels: sortByDiscoveryScore(channelsRaw, scoreChannelDiscovery).slice(0, 3),
      recentLessons: sortByDiscoveryScore(recentLessonsRaw, scoreLessonDiscovery).slice(0, 4),
    }
  },
  ["home-public-snapshot-v3"],
  { revalidate: 300 },
)

export default async function Home() {
  const [session, publicSnapshot] = await Promise.all([getAuthSession(), getHomePublicSnapshot()])
  const { dogs, trainings, users, blogPostCount, blogPosts, channels, recentLessons, contentCount, threadCount } = publicSnapshot

  const isLoggedIn = !!session?.user?.id
  const needsVerification = isLoggedIn && !session?.user?.emailVerifiedAt
  const primaryHref = needsVerification ? "/verify" : isLoggedIn ? "/dashboard" : "/register"
  const primaryLabel = needsVerification ? "Confirmar email" : isLoggedIn ? "Abrir meu painel" : "Criar minha conta"
  const secondaryHref = isLoggedIn ? "/dogs" : "/racas"
  const secondaryLabel = isLoggedIn ? "Ver meus caes" : "Estudar racas"

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.10),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.12),transparent_28%),linear-gradient(160deg,#020617,#0f172a_52%,#111827)] text-white">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[82svh] max-w-7xl gap-8 px-4 py-14 sm:px-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-amber-100">
              Plataforma para tutores e profissionais
            </span>

            {isLoggedIn ? (
              <div className="max-w-xl rounded-[24px] border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                <p className="font-semibold text-white">
                  {session.user?.name || session.user?.email} reconhecido como {getRoleLabel(session.user?.role)}.
                </p>
                <p className="mt-2">
                  Plano {getAccountPlanLabel(session.user?.plan)} ativo na conta.
                  {needsVerification ? " Falta confirmar o email para liberar tudo com seguranca." : ""}
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
                Treino canino com orientacao, rotina e comunidade no mesmo lugar.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                A K9 conecta tutor, adestrador e conteudo em uma jornada clara. Menos ruido, mais continuidade.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#fb7185)] px-6 py-4 text-sm font-semibold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5"
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-6 py-4 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
              >
                {secondaryLabel}
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <MetricPill title="Base viva" value={`${users} contas e ${dogs} caes`} />
              <MetricPill title="Aprendizado" value={`${contentCount} conteudos e ${blogPostCount} posts`} />
              <MetricPill title="Comunidade" value={`${threadCount} conversas e ${trainings} treinos registrados`} />
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.78)),radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_30%)] p-6 shadow-2xl shadow-black/30">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Em destaque</p>
                <h2 className="mt-2 text-2xl font-semibold">Comece sem se perder</h2>
              </div>
              <Link href="/courses" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Ver trilhas
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {recentLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={lesson.accessLevel === "FREE" ? `/conteudos/${lesson.slug}` : `/courses/${lesson.channel.slug}`}
                  className="block rounded-[24px] border border-white/10 bg-slate-950/35 p-4 transition hover:bg-white/10"
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-100">
                      {getChannelContentCategoryLabel(lesson.category)}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">
                      {getChannelContentAccessLabel(lesson.accessLevel)}
                    </span>
                    {lesson.durationMinutes ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{lesson.durationMinutes} min</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{lesson.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{lesson.channel.name}</p>
                </Link>
              ))}

              {recentLessons.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
                  As primeiras trilhas publicas vao aparecer aqui.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <ValueCard
            eyebrow="Racas"
            title="Aprenda antes de decidir"
            description="Estude perfil, porte, energia e encaixe de rotina antes de contratar ou comprar por impulso."
            href="/racas"
            cta="Explorar racas"
          />
          <ValueCard
            eyebrow="Rotina"
            title="Acompanhe o cao com contexto"
            description="Saude, alimentacao, treino e evolucao ficam organizados na mesma conta."
            href={isLoggedIn ? "/dogs" : "/register"}
            cta={isLoggedIn ? "Ver caes" : "Criar conta"}
          />
          <ValueCard
            eyebrow="Comunidade"
            title="Siga canais e profissionais de verdade"
            description="Conteudo, forum e agenda caminham juntos para o cliente nao perder o ritmo."
            href={isLoggedIn ? "/forum" : "/register"}
            cta={isLoggedIn ? "Abrir comunidade" : "Comecar agora"}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Canais em destaque</p>
                <h2 className="mt-2 text-3xl font-semibold">Adestradores com trilha, canal e presenca</h2>
              </div>
              <Link href="/courses" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Catalogo
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {channels.map((channel) => (
                <FeaturedChannelCard
                  key={channel.id}
                  href={`/courses/${channel.slug}`}
                  title={channel.name}
                  owner={channel.owner.name}
                  description={channel.description}
                  serviceMode={formatServiceMode(channel.serviceMode)}
                  price={formatMoney(channel.subscriptionPrice) || "Entrada gratuita"}
                  lessonCount={channel.contents.length}
                  subscriberCount={channel._count.subscriptions}
                />
              ))}

              {channels.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
                  Os canais em destaque vao aparecer aqui assim que os primeiros profissionais publicarem.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.82))] p-8 shadow-xl shadow-black/20">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-200/80">Blog ativo</p>
                <h2 className="mt-2 text-3xl font-semibold">Leitura curta, util e aplicavel</h2>
              </div>
              <Link href="/blog" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Abrir blog
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">{post.category}</p>
                  <h3 className="mt-3 text-xl font-semibold">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{truncate(post.excerpt || post.content, 135)}</p>
                  <p className="mt-4 text-xs text-slate-400">
                    {post.author.name} · {post._count.reactions} curtidas · {post._count.comments} comentarios
                  </p>
                </Link>
              ))}

              {blogPosts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
                  Os posts mais recentes vao aparecer aqui assim que forem publicados.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Planos</p>
          <h2 className="mt-2 text-3xl font-semibold">Entre leve. Evolua quando fizer sentido.</h2>
          <p className="mt-3 text-slate-300">No Free voce estuda e organiza. Nos pagos voce libera tudo.</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <PlanCard
            name="Free"
            price="R$ 0"
            description={`Ate ${FREE_PLAN_DOG_LIMIT} caes, blog livre e area de racas.`}
            items={["Entrada sem atrito", "Base da conta organizada", "Ideal para conhecer a plataforma"]}
            href="/register"
            cta="Entrar no Free"
          />
          <PlanCard
            name="Starter"
            price="R$ 79/mes"
            description="Libera forum, conteudos, treinos, calendario e canais assinados."
            items={["Tudo da plataforma", "Melhor custo para uso ativo", "Fluxo completo para cliente e profissional"]}
            href={isLoggedIn ? "/billing" : "/register"}
            cta={isLoggedIn ? "Ver Starter" : "Entrar no Starter"}
            highlight
          />
          <PlanCard
            name="Pro"
            price="R$ 149/mes"
            description="Acesso total com presenca premium para quem quer operar com mais autoridade."
            items={["Tudo da plataforma", "Mais forca comercial", "Pensado para profissionais e operacao forte"]}
            href={isLoggedIn ? "/billing" : "/register"}
            cta={isLoggedIn ? "Ver Pro" : "Entrar no Pro"}
          />
        </div>
      </section>
    </div>
  )
}

function MetricPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-white">{value}</p>
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
    <Link
      href={href}
      className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/10"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <p className="mt-5 text-sm font-medium text-amber-200">{cta}</p>
    </Link>
  )
}

function FeaturedChannelCard({
  href,
  title,
  owner,
  description,
  serviceMode,
  price,
  lessonCount,
  subscriberCount,
}: {
  href: string
  title: string
  owner: string
  description: string
  serviceMode: string
  price: string
  lessonCount: number
  subscriberCount: number
}) {
  return (
    <Link
      href={href}
      className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 transition hover:bg-white/10"
    >
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-100">{serviceMode}</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{price}</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{lessonCount} aulas</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{owner}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{truncate(description, 160)}</p>
      <p className="mt-4 text-sm text-cyan-200">{subscriberCount} assinaturas ativas</p>
    </Link>
  )
}

function PlanCard({
  name,
  price,
  description,
  items,
  href,
  cta,
  highlight = false,
}: {
  name: string
  price: string
  description: string
  items: string[]
  href: string
  cta: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-[30px] border p-6 shadow-xl shadow-black/20 ${
        highlight
          ? "border-amber-300/25 bg-[linear-gradient(160deg,rgba(245,158,11,0.18),rgba(15,23,42,0.94)_40%,rgba(17,24,39,0.84))]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-sm uppercase tracking-[0.18em] text-cyan-200/80">{name}</p>
      <p className="mt-4 text-4xl font-semibold">{price}</p>
      <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <p key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
            {item}
          </p>
        ))}
      </div>

      <Link
        href={href}
        className={`mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
          highlight
            ? "bg-[linear-gradient(135deg,#f59e0b,#fb7185)] text-slate-950 shadow-lg shadow-amber-500/20"
            : "border border-white/15 text-white hover:bg-white/10"
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

function truncate(value: string | null | undefined, max = 160) {
  if (!value) return ""
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}
