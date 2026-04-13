import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ReplyForm from "./ReplyForm"
import { requireUser } from "@/lib/auth"
import { formatChannelLocation, formatDateRange } from "@/lib/community"
import { getRoleLabel, isAdminRole } from "@/lib/role"
import { getForumPostTypeLabel } from "@/lib/platform"
import VideoEmbed from "@/app/components/VideoEmbed"
import EngagementBar from "@/app/components/EngagementBar"
import SafeImage from "@/app/components/SafeImage"

export default async function ForumThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireUser()
  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: {
      author: true,
      _count: { select: { replies: true, reactions: true } },
      channel: {
        include: {
          owner: true,
          subscriptions: {
            where: { userId: session.user.id, status: "ACTIVE" },
            select: { id: true },
          },
          contents: {
            where: { published: true },
            orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
            take: 3,
          },
        },
      },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  })

  if (!thread) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center text-white">
        <p>Post nao encontrado.</p>
      </div>
    )
  }

  if (
    thread.channel &&
    !thread.channel.isPublic &&
    thread.channel.ownerId !== session.user.id &&
    !isAdminRole(session.user.role) &&
    thread.channel.subscriptions.length === 0
  ) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center px-4 text-white sm:px-6">
        <div className="max-w-xl rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-semibold">Esse canal privado ainda nao foi liberado para voce</h1>
          <p className="mt-3 text-slate-300">
            Este post faz parte do canal <strong>{thread.channel.name}</strong>.
          </p>
          <Link
            href={`/forum/channels/${thread.channel.slug}`}
            className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Ir para o canal
          </Link>
        </div>
      </div>
    )
  }

  const currentReaction = await prisma.forumThreadReaction.findUnique({
    where: {
      threadId_userId: {
        threadId: thread.id,
        userId: session.user.id!,
      },
    },
  })
  const canInteractWithThread = true

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/forum" className="text-cyan-300 hover:underline underline-offset-4">
          Voltar ao forum
        </Link>

        {thread.channel && (
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-lg shadow-black/30">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100">{thread.channel.name}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-100">
                {thread.channel.owner.name} • {getRoleLabel(thread.channel.owner.role)}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-300">{thread.channel.description}</p>
            <p className="mt-3 text-xs text-slate-400">{formatChannelLocation(thread.channel.city, thread.channel.state)}</p>
          </div>
        )}

        <article className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] p-8 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em]">
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getForumPostTypeLabel(thread.postType)}</span>
            {thread.channel ? (
              <Link
                href={`/forum/channels/${thread.channel.slug}`}
                className="rounded-full bg-white/10 px-3 py-1 text-gray-100 hover:bg-white/15"
              >
                {thread.channel.name}
              </Link>
            ) : (
              <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">Comunidade geral</span>
            )}
          </div>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-lg font-semibold text-cyan-100">
              {thread.author.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="font-semibold text-white">{thread.author.name}</span>
                <span>{getRoleLabel(thread.author.role)}</span>
                <span>
                  {new Date(thread.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold">{thread.title}</h1>

              {thread.imageUrl && (
                <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40">
                  <SafeImage src={thread.imageUrl} alt={thread.title} className="h-[340px] w-full object-cover" />
                </div>
              )}

              <p className="mt-4 whitespace-pre-wrap text-slate-100 leading-7">{thread.content}</p>

              <div className="mt-6">
                <EngagementBar
                  reactionEndpoint={`/api/forum/${thread.id}/reactions`}
                  initialLiked={Boolean(currentReaction)}
                  initialReactionCount={thread._count.reactions}
                  conversationCount={thread._count.replies}
                  conversationLabel="Comentarios"
                  canInteract={canInteractWithThread}
                  lockedHref="/forum"
                  lockedLabel="Entre na conversa"
                />
              </div>

              {thread.postType === "EVENTO" && thread.eventStartsAt && (
                <div className="mt-5 rounded-[24px] border border-emerald-300/15 bg-emerald-500/10 p-5">
                  <p className="text-sm text-emerald-50">{formatDateRange(thread.eventStartsAt, thread.eventEndsAt)}</p>
                  <p className="mt-1 text-sm text-emerald-50/90">
                    {thread.eventLocation || formatChannelLocation(thread.eventCity, thread.eventState)}
                  </p>
                </div>
              )}

              {thread.videoUrl && (
                <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40">
                  <VideoEmbed url={thread.videoUrl} title={thread.title} />
                </div>
              )}
            </div>
          </div>
        </article>

        {thread.channel && thread.channel.contents.length > 0 && (
          <section className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Curso dentro do canal</p>
                <h2 className="text-2xl font-semibold">Modulos relacionados</h2>
              </div>
              <Link
                href={`/forum/channels/${thread.channel.slug}`}
                className="text-sm text-cyan-300 hover:underline underline-offset-4"
              >
                Ver canal completo
              </Link>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {thread.channel.contents.map((content) => (
                <Link
                  key={content.id}
                  href={`/conteudos/${content.slug}`}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">
                    {content.orderIndex ? `Modulo ${content.orderIndex}` : "Conteudo do canal"}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{content.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{truncate(content.summary || content.body, 120)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section id="comments" className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl">
          <h2 className="text-2xl font-semibold">Comentarios ({thread.replies.length})</h2>
          {thread.replies.length === 0 && <p className="mt-3 text-slate-300">Nenhum comentario ainda.</p>}
          <div className="mt-4 space-y-3">
            {thread.replies.map((reply) => (
              <div key={reply.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="font-semibold text-white">{reply.author.name}</span>
                  <span>{getRoleLabel(reply.author.role)}</span>
                  <span>
                    {new Date(reply.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-slate-200">{reply.content}</p>
              </div>
            ))}
          </div>
          <ReplyForm
            threadId={thread.id}
            canReply={canInteractWithThread}
            blockedMessage="Seu plano atual permite ler este post, mas para responder no forum voce precisa ativar um plano pago."
            actionHref="/billing?locked=/forum"
            actionLabel="Ativar plano Pago"
          />
        </section>
      </div>
    </div>
  )
}

function truncate(value: string | null | undefined, max = 160) {
  if (!value) return ""
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}
