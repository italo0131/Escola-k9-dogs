import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { isAdminRole } from "@/lib/role"
import { redirect } from "next/navigation"

export default async function AdminSecurityPage() {
  const session = await requireUser()
  if (!isAdminRole(session.user.role)) {
    redirect("/dashboard")
  }

  const [
    userCount,
    unverifiedCount,
    suspendedCount,
    twoFactorCount,
    suspendedUsers,
    unverifiedUsers,
    auditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerifiedAt: null } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { twoFactorEnabled: true } }),
    prisma.user.findMany({ where: { status: "SUSPENDED" }, select: { id: true, name: true, email: true } }),
    prisma.user.findMany({ where: { emailVerifiedAt: null }, select: { id: true, name: true, email: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: true },
    }),
  ])

  const buildTargetHref = (type: string, id?: string | null) => {
    if (!id) return null
    const key = type.toLowerCase()
    if (key.includes("user")) return `/admin/users/${id}`
    if (key.includes("client")) return `/admin/clients/${id}`
    if (key.includes("dog")) return `/admin/dogs/${id}`
    if (key.includes("training")) return `/training/${id}`
    return null
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Segurança</h1>
          <p className="text-sm text-gray-300">Visão geral de verificações e contas.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat title="Usuários" value={userCount} href="/admin/users" />
          <Stat title="Emails pendentes" value={unverifiedCount} href="/admin/users" />
          <Stat title="Suspensos" value={suspendedCount} href="/admin/users" />
          <Stat title="2FA ativo" value={twoFactorCount} href="/admin/users" />
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Contas suspensas</h2>
            {suspendedUsers.length === 0 && <p className="text-sm text-gray-300 mt-2">Nenhuma conta suspensa.</p>}
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              {suspendedUsers.map((user) => (
                <li key={user.id}>
                  <Link href={`/admin/users/${user.id}`} className="hover:text-cyan-200 transition">
                    <span className="font-semibold">{user.name}</span> <span className="text-gray-400">{user.email}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Emails não verificados</h2>
            {unverifiedUsers.length === 0 && <p className="text-sm text-gray-300 mt-2">Todos verificados.</p>}
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              {unverifiedUsers.map((user) => (
                <li key={user.id}>
                  <Link href={`/admin/users/${user.id}`} className="hover:text-cyan-200 transition">
                    <span className="font-semibold">{user.name}</span> <span className="text-gray-400">{user.email}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Auditoria (últimas ações)</h2>
          {auditLogs.length === 0 && <p className="text-sm text-gray-300 mt-2">Sem registros.</p>}
          <ul className="mt-3 space-y-2 text-sm text-gray-300">
            {auditLogs.map((log) => {
              const targetHref = buildTargetHref(log.targetType, log.targetId)
              return (
                <li key={log.id} className="flex flex-wrap items-center justify-between gap-2">
                  {targetHref ? (
                    <Link href={targetHref} className="hover:text-cyan-200 transition">
                      <strong>{log.action}</strong> em {log.targetType} {log.targetId ? `(${log.targetId})` : ""}
                    </Link>
                  ) : (
                    <span>
                      <strong>{log.action}</strong> em {log.targetType} {log.targetId ? `(${log.targetId})` : ""}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {log.actor?.email || "Sistema"} •{" "}
                    {log.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}

function Stat({ title, value, href }: { title: string; value: number; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-gray-300">{title}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  )
  if (!href) return content
  return (
    <Link href={href} className="block hover:-translate-y-0.5 transition">
      {content}
    </Link>
  )
}
