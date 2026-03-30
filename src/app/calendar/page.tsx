import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser, isStaffSession } from "@/lib/auth"
import { formatDateRange, formatRegion } from "@/lib/community"
import { getScheduleFormatLabel } from "@/lib/platform"
import { isAdminRole } from "@/lib/role"

type CalendarEntry = {
  id: string
  kind: "SCHEDULE" | "BLOG_EVENT" | "FORUM_EVENT"
  title: string
  startsAt: Date
  endsAt: Date | null
  location: string | null
  description: string | null
  status: string
  href: string
  meta: string
}

export default async function CalendarPage() {
  const session = await requireUser()
  const isStaff = isStaffSession(session)
  const isAdmin = isAdminRole(session.user.role)
  const where = isStaff ? { OR: [{ trainerId: session.user.id }, { userId: session.user.id }] } : { userId: session.user.id }

  const scheduleEvents = await prisma.schedule.findMany({
    where,
    orderBy: { date: "asc" },
    include: { user: true, trainer: true, dog: true },
  })

  const blogEvents = await prisma.blogPost.findMany({
    where: isStaff ? { postType: "EVENTO" } : { published: true, postType: "EVENTO" },
    orderBy: { eventStartsAt: "asc" },
    include: { author: true },
  })

  const forumEvents = await prisma.forumThread.findMany({
    where: isAdmin
      ? { postType: "EVENTO" }
      : {
          postType: "EVENTO",
          OR: [
            { channelId: null },
            { channel: { ownerId: session.user.id } },
            { channel: { subscriptions: { some: { userId: session.user.id, status: "ACTIVE" } } } },
          ],
        },
    orderBy: { eventStartsAt: "asc" },
    include: {
      author: true,
      channel: true,
    },
  })

  const entries: CalendarEntry[] = [
    ...scheduleEvents.map((item) => ({
      id: item.id,
      kind: "SCHEDULE" as const,
      title: item.title,
      startsAt: item.date,
      endsAt: item.durationMinutes ? new Date(item.date.getTime() + item.durationMinutes * 60000) : null,
      location: item.location,
      description: item.notes,
      status: item.status,
      href: "/calendar",
      meta: `${getScheduleFormatLabel(item.format)} • ${item.dog?.name || item.user?.name || "Sem referencia"}`,
    })),
    ...blogEvents
      .filter((item) => item.eventStartsAt)
      .map((item) => ({
        id: item.id,
        kind: "BLOG_EVENT" as const,
        title: item.title,
        startsAt: item.eventStartsAt!,
        endsAt: item.eventEndsAt || null,
        location: item.eventLocation || formatRegion(item.eventCity, item.eventState),
        description: item.excerpt || item.content.slice(0, 180),
        status: "Evento do blog",
        href: `/blog/${item.slug}`,
        meta: `${item.author.name} • Blog`,
      })),
    ...forumEvents
      .filter((item) => item.eventStartsAt)
      .map((item) => ({
        id: item.id,
        kind: "FORUM_EVENT" as const,
        title: item.title,
        startsAt: item.eventStartsAt!,
        endsAt: item.eventEndsAt || null,
        location: item.eventLocation || formatRegion(item.eventCity, item.eventState),
        description: item.content.slice(0, 180),
        status: item.channel ? `Canal ${item.channel.name}` : "Forum",
        href: `/forum/${item.id}`,
        meta: `${item.author.name} • ${item.channel?.name || "Comunidade geral"}`,
      })),
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())

  const grouped = entries.reduce<Record<string, CalendarEntry[]>>((acc, item) => {
    const key = item.startsAt.toISOString().slice(0, 10)
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})

  const confirmedCount = scheduleEvents.filter((item) => String(item.status).toLowerCase() === "confirmado").length

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/80">Agenda</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Calendario unificado da conta.</h1>
              <p className="max-w-2xl text-slate-300">
                Aqui entram suas sessoes, os eventos publicados no blog e os eventos dos canais do forum que fazem
                parte da sua rotina.
              </p>
            </div>

            <Link
              href="/calendar/new"
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
            >
              Novo agendamento
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Metric title="Agenda total" value={String(entries.length)} description="Compromissos e eventos visiveis para sua conta" />
            <Metric title="Sessoes confirmadas" value={String(confirmedCount)} description="Treinos prontos para execucao" />
            <Metric title="Eventos da comunidade" value={String(blogEvents.length + forumEvents.length)} description="Blog e forum conectados ao calendario" />
            <Metric title="Perfil" value={isStaff ? "Operacao" : "Cliente"} description={isStaff ? "Visao de atendimento e entrega" : "Sua agenda e seus eventos"} />
          </div>
        </section>

        {entries.length === 0 && <p className="text-gray-300">Nenhum item no calendario.</p>}

        <div className="space-y-4">
          {Object.entries(grouped).map(([day, items]) => (
            <section key={day} className="rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-lg shadow-black/30">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-xl font-semibold">
                  {new Date(day).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                </p>
                <span className="text-sm text-slate-400">{items.length} compromissos</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                {items.map((item) => (
                  <Link key={`${item.kind}-${item.id}`} href={item.href} className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">
                        {item.kind === "SCHEDULE" ? "Agendamento" : item.kind === "BLOG_EVENT" ? "Evento do blog" : "Evento do forum"}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{item.status}</span>
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-300">{formatDateRange(item.startsAt, item.endsAt)}</p>
                      </div>
                      {item.location && <p className="text-sm text-slate-400">{item.location}</p>}
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-300">
                      <p>{item.meta}</p>
                      {item.description && <p className="text-slate-400">{item.description}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
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
