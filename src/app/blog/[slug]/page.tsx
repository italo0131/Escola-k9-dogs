import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getAuthSession } from "@/lib/auth"
import { getRoleLabel, isStaffRole } from "@/lib/role"
import VideoEmbed from "@/app/components/VideoEmbed"
import EngagementBar from "@/app/components/EngagementBar"
import SafeImage from "@/app/components/SafeImage"
import { formatDateRange, formatRegion } from "@/lib/community"
import { getBlogPostTypeLabel } from "@/lib/platform"
import BlogDiscussionPanel from "./BlogDiscussionPanel"
import DeletePostButton from "@/app/components/DeletePostButton"

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getAuthSession()
  const canViewDrafts = isStaffRole(session?.user?.role)

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  })

  if (!post || (!post.published && !canViewDrafts)) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center text-white">
        <p>Post nao encontrado.</p>
      </div>
    )
  }

  const currentReaction =
    session?.user?.id
      ? await prisma.blogPostReaction.findUnique({
          where: {
            postId_userId: {
              postId: post.id,
              userId: session.user.id,
            },
          },
        })
      : null

  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      published: true,
      slug: { not: slug },
      OR: [{ authorId: post.authorId }, { category: post.category }],
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 3,
    include: {
      author: true,
      _count: { select: { comments: true, reactions: true } },
    },
  })






  const isEvent = post.postType === "EVENTO"

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/blog" className="text-cyan-300 hover:underline underline-offset-4">
          Voltar ao blog
        </Link>
        <article>
            <h1>{post.title}</h1>
              <p>Por {post.author.name}</p>
              <div>{post.content}</div>
                {/* Botão de exclusão visível apenas para o autor */}
                {session?.user && (
                  <DeletePostButton
                    postId={post.id}
                authorId={post.authorId}
              postType="blog"
        />
      )}
    </article>



        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
              <span className="text-cyan-200/80">{post.author.name}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">{getRoleLabel(post.author.role)}</span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">{post.category}</span>
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getBlogPostTypeLabel(post.postType)}</span>
              {post.videoUrl && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">Video</span>}
              {post.coverImageUrl && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">Imagem</span>}
              {!post.published && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-100">Rascunho</span>}
            </div>
            <h1 className="mt-3 text-3xl font-semibold">{post.title}</h1>
            <p className="mt-2 text-xs text-gray-400">
              {new Date(post.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>

            {post.coverImageUrl && (
              <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/40">
                <SafeImage src={post.coverImageUrl} alt={post.title} className="h-[340px] w-full object-cover" />
              </div>
            )}

            {isEvent && post.eventStartsAt && (
              <div className="mt-5 grid gap-4 rounded-[28px] border border-emerald-300/15 bg-emerald-500/10 p-5 md:grid-cols-3">
                <InfoBlock title="Data" value={formatDateRange(post.eventStartsAt, post.eventEndsAt) || "A definir"} />
                <InfoBlock title="Local" value={post.eventLocation || "Local em definicao"} />
                <InfoBlock title="Regiao" value={formatRegion(post.eventCity, post.eventState)} />
              </div>
            )}

            {post.excerpt && <p className="mt-5 text-lg text-slate-300">{post.excerpt}</p>}

            <div className="mt-6">
              <EngagementBar
                reactionEndpoint={`/api/blog/${post.slug}/reactions`}
                initialLiked={Boolean(currentReaction)}
                initialReactionCount={post._count.reactions}
                conversationCount={post._count.comments}
                conversationLabel="Comentarios"
                canInteract={Boolean(session?.user)}
              />
            </div>

            <div className="mt-6">
              <VideoEmbed url={post.videoUrl} title={post.title} />
            </div>

            <div className="mt-6 whitespace-pre-wrap leading-7 text-gray-200">{post.content}</div>
          </article>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Autor</p>
              <h2 className="mt-3 text-2xl font-semibold">{post.author.name}</h2>
              <p className="mt-2 text-sm text-slate-300">{getRoleLabel(post.author.role)}</p>
              <p className="mt-4 text-sm text-slate-300">
                {post.author.bio || "Perfil em evolucao, mas ja participando ativamente da conversa da comunidade."}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Continue no feed</p>
                  <h2 className="text-2xl font-semibold">Posts relacionados</h2>
                </div>
                <Link href="/blog" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Ver todos
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {relatedPosts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.slug}`}
                    className="block rounded-[22px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">{item.category}</p>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{truncate(item.excerpt || item.content, 120)}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>{item._count.reactions} curtidas</span>
                      <span>{item._count.comments} comentarios</span>
                    </div>
                  </Link>
                ))}
                {relatedPosts.length === 0 && <p className="text-sm text-slate-300">Nenhum post relacionado publicado ainda.</p>}
              </div>
            </div>
          </aside>
        </section>

        <BlogDiscussionPanel
          slug={post.slug}
          canComment={Boolean(session?.user)}
          initialComments={post.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            author: {
              name: comment.author.name,
              role: comment.author.role,
            },
          }))}
        />
      </div>
    </div>
  )
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">{title}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}

function truncate(value: string | null | undefined, max = 160) {
  if (!value) return ""
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}
