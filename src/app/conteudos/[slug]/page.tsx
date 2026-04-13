import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getAuthSession } from "@/lib/auth"
import { isAdminRole } from "@/lib/role"
import { getCourseAccess, hasAllowedId } from "@/lib/course-access"
import VideoEmbed from "@/app/components/VideoEmbed"
import AICoachPanel from "@/app/components/AICoachPanel"
import SafeImage from "@/app/components/SafeImage"
import {
  getChannelContentAccessLabel,
  getChannelContentCategoryLabel,
  getChannelContentTypeLabel,
  getTrainingDifficultyLabel,
} from "@/lib/platform"

export default async function ContentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getAuthSession()
  const access = await getCourseAccess(session)

  const content = await prisma.channelContent.findUnique({
    where: { slug },
    include: {
      author: true,
      channel: {
        include: {
          owner: true,
        },
      },
    },
  })

  if (!content || !content.published) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center text-white">
        <p>Conteudo nao encontrado.</p>
      </div>
    )
  }

  const isOwner = Boolean(
    session?.user?.id &&
      (content.authorId === session.user.id || content.channel.ownerId === session.user.id || isAdminRole(session.user.role))
  )

  const canAccess =
    isOwner ||
    access.isStaff ||
    access.allowAll ||
    content.accessLevel === "FREE" ||
    hasAllowedId(access.allowedContentIds, content.id, content.slug, content.channelId, content.channel.slug)

  if (!canAccess) {
    return (
      <div className="min-h-[100svh] bg-slate-950 px-4 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Conteudos</p>
          <h1 className="mt-3 text-3xl font-semibold">Acesso liberado somente para clientes autorizados</h1>
          <p className="mt-3 text-slate-300">
            Este material faz parte da trilha <strong>{content.channel.name}</strong>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/courses/${content.channel.slug}`}
              className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-gray-100 transition hover:bg-white/10"
            >
              Ver pagina do curso
            </Link>
            <Link
              href={session?.user ? `/forum/channels/${content.channel.slug}` : "/contato"}
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white"
            >
              {session?.user ? "Ir para o canal" : "Solicitar acesso"}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.10),transparent_28%),linear-gradient(145deg,#020617,#0f172a_55%,#111827)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href={`/courses/${content.channel.slug}`} className="text-cyan-300 hover:underline underline-offset-4">
            Voltar para o curso
          </Link>
          <Link href="/conteudos" className="text-slate-400 hover:text-slate-200">
            Ir para a biblioteca
          </Link>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">
              {getChannelContentTypeLabel(content.contentType)}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">
              {getChannelContentAccessLabel(content.accessLevel)}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">
              {getChannelContentCategoryLabel(content.category)}
            </span>
            {content.difficulty && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">
                {getTrainingDifficultyLabel(content.difficulty)}
              </span>
            )}
            {content.durationMinutes && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{content.durationMinutes} min</span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{content.title}</h1>
          <p className="mt-3 text-slate-300">
            {content.summary || content.objective || "Conteudo pratico para evolucao consistente dentro da trilha."}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetaCard title="Curso" value={content.channel.name} />
            <MetaCard title="Autor" value={content.author.name} />
            <MetaCard
              title="Publicado em"
              value={new Date(content.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </div>
        </section>

        {content.coverImageUrl && (
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/40 shadow-xl">
            <SafeImage src={content.coverImageUrl} alt={content.title} className="h-[360px] w-full object-cover" />
          </div>
        )}

        <VideoEmbed url={content.videoUrl} title={content.title} />

        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-lg shadow-black/30">
          {content.objective && (
            <div className="mb-6 rounded-2xl border border-emerald-300/15 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Objetivo</p>
              <p className="mt-2 text-slate-100">{content.objective}</p>
            </div>
          )}
          <div className="whitespace-pre-wrap leading-8 text-slate-100">{content.body}</div>
        </section>

        <AICoachPanel
          contentSlug={content.slug}
          title="Pergunte para a IA sobre esta aula"
          description="A IA usa o contexto deste conteudo para resumir, organizar os proximos passos e indicar o que estudar em seguida."
          suggestions={[
            {
              label: "Resuma a aula",
              prompt: "Resuma esta aula em pontos praticos e diga o que eu devo observar durante a aplicacao.",
            },
            {
              label: "Plano de pratica",
              prompt: "Transforme esta aula em um plano de pratica curto para os proximos 3 dias.",
            },
            {
              label: "Erros comuns",
              prompt: "Quais erros comuns devo evitar ao aplicar o que esta aula ensina?",
            },
            {
              label: "Proximo estudo",
              prompt: "Depois desta aula, que tipo de conteudo eu deveria estudar para continuar evoluindo?",
            },
          ]}
        />

        <section className="flex flex-wrap gap-3">
          <Link
            href={`/forum/channels/${content.channel.slug}`}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
          >
            Conversar no canal
          </Link>
          <Link
            href={`/courses/${content.channel.slug}`}
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/10"
          >
            Voltar para o curso
          </Link>
          <Link
            href={session?.user ? "/training" : "/login"}
            className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
          >
            {session?.user ? "Ver meus treinos" : "Entrar para praticar"}
          </Link>
        </section>
      </div>
    </div>
  )
}

function MetaCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}
