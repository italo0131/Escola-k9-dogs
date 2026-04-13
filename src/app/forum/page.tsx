import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { formatChannelLocation, formatDateRange, formatMoney } from "@/lib/community"
import { getRoleLabel, isAdminRole } from "@/lib/role"
import { getForumPostTypeLabel } from "@/lib/platform"
import SafeImage from "@/app/components/SafeImage"

export default async function ForumPage() {
  const session = await requireUser()
  const isAdmin = isAdminRole(session.user.role)
  const canCreateChannel = isAdmin

  const [channels, subscriptions] = await Promise.all([
    prisma.forumChannel.findMany({
      where: { isPublic: true },
      include: { owner: true, _count: { select: { threads: true, subscriptions: true, contents: true } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.channelSubscription.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { channelId: true },
    }),
  ])

  const subscribedChannelIds = new Set(subscriptions.map((item) => item.channelId))
  const threadWhere = isAdmin
    ? {}
    : {
        OR: [
          { channelId: null },
          { channel: { ownerId: session.user.id } },
          { channel: { subscriptions: { some: { userId: session.user.id, status: "ACTIVE" } } } },
        ],
      }

  const feed = await prisma.forumThread.findMany({
    where: threadWhere,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: true,
      channel: { include: { owner: true, _count: { select: { contents: true } } } },
      _count: { select: { replies: true, reactions: true } },
    },
    take: 18,
  })

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_25%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Forum K9</p>
            <h1 className="mt-3 text-3xl font-semibold">Acompanhe profissionais, descubra canais e entre na conversa certa.</h1>
            <p className="mt-3 text-sm text-slate-300">
              Veja os canais publicos, acompanhe o mural da comunidade e entre nas conversas que fazem parte do seu acompanhamento na K9 Training.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/forum/new"
                className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition"
              >
                Novo post
              </Link>
              {canCreateChannel && (
                <Link
                  href="/forum/channels/new"
                  className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                >
                  Criar canal
                </Link>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Canais</p>
                <h2 className="text-2xl font-semibold">Profissionais</h2>
              </div>
              <span className="text-sm text-slate-400">{channels.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/forum/channels/${channel.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">{channel.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {channel.owner.name} • {getRoleLabel(channel.owner.role)}
                      </p>
                    </div>
                    {subscribedChannelIds.has(channel.id) && (
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100">Assinado</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{channel.description}</p>
                  <div className="mt-3 grid gap-1 text-xs text-slate-400">
                    <p>{formatChannelLocation(channel.city, channel.state)}</p>
                    <p>
                      {formatMoney(channel.subscriptionPrice) || "Canal gratuito"} • {channel._count.subscriptions} assinantes
                    </p>
                    <p>{channel._count.contents} modulos • {channel._count.threads} posts</p>
                    <p className="text-cyan-100/80">
                      {subscribedChannelIds.has(channel.id)
                        ? "Canal ja conectado a sua conta."
                        : "Abra o canal para entrar, seguir ou acompanhar o conteudo liberado."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          {feed.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
              Nenhum post publicado ainda. Abra a conversa da comunidade.
            </div>
          )}

          {feed.map((post) => (
            <Link
              key={post.id}
              href={`/forum/${post.id}`}
              className="block overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] shadow-lg shadow-black/30 transition hover:bg-white/10"
            >
              {post.imageUrl && <SafeImage src={post.imageUrl} alt={post.title} className="h-60 w-full object-cover" />}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.15em]">
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getForumPostTypeLabel(post.postType)}</span>
                  {post.channel ? (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">{post.channel.name}</span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">Comunidade geral</span>
                  )}
                  {post.isPinned && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">Fixado</span>}
                  {post.videoUrl && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">Video</span>}
                  {post.imageUrl && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">Imagem</span>}
                </div>

                <div className="mt-4 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-lg font-semibold text-cyan-100">
                    {post.author.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold">{post.author.name}</p>
                      <p className="text-sm text-slate-400">{getRoleLabel(post.author.role)}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold">{post.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-slate-200">{truncate(post.content, 360)}</p>

                    {post.postType === "EVENTO" && post.eventStartsAt && (
                      <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                        <p>{formatDateRange(post.eventStartsAt, post.eventEndsAt)}</p>
                        <p className="mt-1">{post.eventLocation || formatChannelLocation(post.eventCity, post.eventState)}</p>
                      </div>
                    )}

                    {post.videoUrl && (
                      <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                        Este post inclui video. Abra para assistir e participar da conversa.
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-400">
                      <span>{post._count.reactions} curtidas</span>
                      <span>{post._count.replies} comentarios</span>
                      {post.channel?.owner && <span>Canal de {post.channel.owner.name}</span>}
                      {post.channel && <span>{post.channel._count.contents} modulos no canal</span>}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </main>
      </div>
    </div>
  )
}

function truncate(value: string, max = 200) {
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}
