import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { isApprovedProfessional, isProfessionalRole } from "@/lib/role"
import NewContentForm from "./NewContentForm"

export default async function NewContentPage({
  searchParams,
}: {
  searchParams?: { channel?: string }
}) {
  const session = await requireUser()

  if (!isProfessionalRole(session.user.role)) {
    redirect("/conteudos")
  }

  if (!isApprovedProfessional(session.user.role, session.user.status)) {
    redirect("/profile")
  }

  const channels = await prisma.forumChannel.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
    },
  })

  if (channels.length === 0) {
    redirect("/forum/channels/new")
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/80">Conteudos</p>
          <h1 className="text-3xl font-semibold">Nova aula exclusiva do canal</h1>
          <p className="max-w-2xl text-slate-300">
            Construa a trilha que seu cliente vai consumir na assinatura, com video, imagem, objetivo claro e ordem
            pratica.
          </p>
        </div>

        <NewContentForm channels={channels} initialChannelSlug={searchParams?.channel} />
      </div>
    </div>
  )
}
