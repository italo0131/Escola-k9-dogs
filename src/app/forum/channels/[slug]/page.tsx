import Link from "next/link"

import ChannelSubscriptionButton from "@/app/components/ChannelSubscriptionButton"
import SafeImage from "@/app/components/SafeImage"
import { requireUser } from "@/lib/auth"
import { formatChannelLocation, formatDateRange, formatMoney, formatServiceMode } from "@/lib/community"
import { prisma } from "@/lib/prisma"
import { getRoleLabel, isAdminRole } from "@/lib/role"
import {
  getChannelContentAccessLabel,
  getChannelContentCategoryLabel,
  getChannelContentTypeLabel,
  getForumPostTypeLabel,
} from "@/lib/platform"

export default async function ForumChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await requireUser()

  const channel = await prisma.forumChannel.findUnique({
    where: { slug },
    include: {
      owner: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { userId: true },
      },
      contents: {
        where: { published: true },
        include: { author: true },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
        take: 8,
      },
      threads: {
        include: { author: true, _count: { select: { replies: true, reactions: true } } },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 12,
      },
    },
  })

  if (!channel) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center text-white">
        <p>Canal nao encontrado.</p>
      </div>
    )
  }

  const isOwner = channel.ownerId === session.user.id || isAdminRole(session.user.role)
  const isSubscribed = channel.subscriptions.some((item) => item.userId === session.user.id)
  const canAccessPosts = channel.isPublic || isOwner || isSubscribed
  const previewThreads = channel.threads.slice(0, 4)

  const channelAccessMessage = isOwner
    ? "Voce administra este canal e enxerga toda a operacao."
    : isSubscribed
      ? "Canal ativo na sua conta. Feed interno, comentarios e modulos liberados."
      : channel.isPublic
        ? "Canal publico. Voce pode entrar para acompanhar o conteudo liberado e interagir."
        : "Canal privado da operacao K9. A equipe pode liberar esse acesso quando fizer sentido para o seu acompanhamento."

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/forum" className="text-cyan-300 hover:underline underline-offset-4">
          Voltar ao forum
        </Link>

        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(15,23,42,0.74)),radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_30%)] p-8 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">{channel.category}</span>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100">{formatServiceMode(channel.serviceMode)}</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold">{channel.name}</h1>
          <p className="mt-3 max-w-3xl text-gray-300">{channel.description}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Metric title="Profissional" value={`${channel.owner.name} • ${getRoleLabel(channel.owner.role)}`} />
            <Metric title="Formato social" value={`${channel.contents.length} modulos • ${channel.threads.length} posts`} />
            <Metric title="Local" value={formatChannelLocation(channel.city, channel.state)} />
            <Metric title="Participacao" value={channel.isPublic ? "Canal publico" : "Canal privado"} />
            <Metric
              title="Servicos"
              value={`${formatMoney(channel.onlinePrice) || "Online sob consulta"} • ${formatMoney(channel.inPersonPrice) || "Presencial sob consulta"}`}
            />
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            {channelAccessMessage}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <ChannelSubscriptionButton channelId={channel.id} initialSubscribed={isSubscribed} isOwner={isOwner} />
            {(isOwner || isSubscribed || channel.isPublic) && (
              <Link
                href={`/forum/new?channel=${channel.slug}`}
                className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
              >
                Publicar neste canal
              </Link>
            )}
            {isOwner && (
              <Link
                href={`/conteudos/new?channel=${channel.slug}`}
                className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
              >
                Novo modulo do curso
              </Link>
            )}
            <Link
              href="/blog/new"
              className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-gray-100 transition hover:bg-white/10"
            >
              Publicar no blog
            </Link>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Conteudos</p>
                <h2 className="text-2xl font-semibold">Biblioteca do canal</h2>
              </div>
              <span className="text-sm text-gray-400">{channel.contents.length} materiais</span>
            </div>

            {channel.contents.length === 0 ? <p className="mt-4 text-gray-300">Nenhum conteudo publicado ainda.</p> : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {channel.contents.map((content) => {
                const canOpenContent = isOwner || channel.isPublic || content.accessLevel === "FREE" || isSubscribed
                const contentCard = (
                  <>
                    {content.coverImageUrl ? (
                      <SafeImage src={content.coverImageUrl} alt={content.title} className="h-40 w-full object-cover" />
                    ) : null}
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getChannelContentTypeLabel(content.contentType)}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{getChannelContentAccessLabel(content.accessLevel)}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{getChannelContentCategoryLabel(content.category)}</span>
                        {content.durationMinutes ? <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{content.durationMinutes} min</span> : null}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">
                        {content.orderIndex ? `${content.orderIndex}. ` : ""}
                        {content.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-300">{truncate(content.summary || content.body, 150)}</p>
                      <p className="mt-3 text-xs text-gray-400">{content.author.name}</p>
                      {!canOpenContent ? <p className="mt-3 text-xs text-amber-100">Esse material depende de acesso ao canal privado.</p> : null}
                    </div>
                  </>
                )

                if (canOpenContent) {
                  return (
                    <Link
                      key={content.id}
                      href={`/conteudos/${content.slug}`}
                      className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 transition hover:bg-white/10"
                    >
                      {contentCard}
                    </Link>
                  )
                }

                return (
                  <div key={content.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 opacity-90">
                    {contentCard}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Mural do canal</p>
                <h2 className="text-2xl font-semibold">Posts e conversas</h2>
              </div>
              <span className="text-sm text-gray-400">{channel.threads.length} posts</span>
            </div>

            {!canAccessPosts ? (
              <div className="mt-4 rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
                Esse feed pertence a um canal privado e precisa ser liberado pela equipe K9.
              </div>
            ) : null}

            {canAccessPosts && channel.threads.length === 0 ? <p className="mt-4 text-gray-300">Nenhum post ainda neste canal.</p> : null}

            <div className="mt-4 space-y-3">
              {canAccessPosts
                ? channel.threads.map((thread) => (
                    <Link
                      key={thread.id}
                      href={`/forum/${thread.id}`}
                      className="block rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getForumPostTypeLabel(thread.postType)}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{thread._count.reactions} curtidas</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{thread._count.replies} comentarios</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">{thread.title}</h3>
                      {thread.imageUrl ? (
                        <div className="mt-3 overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/40">
                          <SafeImage src={thread.imageUrl} alt={thread.title} className="h-40 w-full object-cover" />
                        </div>
                      ) : null}
                      <p className="mt-2 text-sm text-gray-300">{truncate(thread.content, 180)}</p>
                      {thread.postType === "EVENTO" && thread.eventStartsAt ? (
                        <p className="mt-3 text-xs text-emerald-200">
                          {formatDateRange(thread.eventStartsAt, thread.eventEndsAt)} •{" "}
                          {thread.eventLocation || formatChannelLocation(thread.eventCity, thread.eventState)}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs text-gray-400">{thread.author.name}</p>
                    </Link>
                  ))
                : previewThreads.map((thread) => (
                    <div key={thread.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5 opacity-90">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getForumPostTypeLabel(thread.postType)}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{thread._count.reactions} curtidas</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{thread._count.replies} comentarios</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">{thread.title}</h3>
                      <p className="mt-2 text-sm text-gray-300">{truncate(thread.content, 180)}</p>
                      <p className="mt-3 text-xs text-amber-100">Esse canal privado precisa ser liberado pela equipe K9.</p>
                    </div>
                  ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max).trim()}...`
}
