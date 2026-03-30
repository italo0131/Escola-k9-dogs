"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  Calendar,
  CreditCard,
  Dog,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Shield,
  UserCircle2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { usePlatformSession } from "@/app/components/PlatformSessionProvider"
import { getAccountPlanLabel } from "@/lib/platform"
import { getRoleLabel, isAdminRole, isProfessionalRole, isRootRole, isTrainerRole } from "@/lib/role"

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
}

const guestLinks: NavLink[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/racas", label: "Racas", icon: Dog },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/#planos", label: "Planos", icon: CreditCard },
]

const adminLinks: NavLink[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/approvals", label: "Aprovacoes", icon: Shield },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/clients", label: "Clientes", icon: Users },
  { href: "/billing", label: "Planos", icon: CreditCard },
  { href: "/profile", label: "Perfil", icon: UserCircle2 },
]

const professionalLinks: NavLink[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/calendar", label: "Agenda", icon: Calendar },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/conteudos", label: "Conteudos", icon: BookOpen },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/billing", label: "Planos", icon: CreditCard },
  { href: "/profile", label: "Perfil", icon: UserCircle2 },
]

const clientCoreLinks: NavLink[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/dogs", label: "Caes", icon: Dog },
  { href: "/racas", label: "Racas", icon: Dog },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/profile", label: "Perfil", icon: UserCircle2 },
]

const clientPremiumLinks: NavLink[] = [
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/conteudos", label: "Conteudos", icon: BookOpen },
  { href: "/calendar", label: "Agenda", icon: Calendar },
]

function isActiveLink(pathname: string, href: string) {
  if (href.startsWith("/#")) return pathname === "/"
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { session, isLoggedIn, role, plan, emailVerified, hasPremiumAccess } = usePlatformSession()

  const isAdmin = isAdminRole(role)
  const isRoot = isRootRole(role)
  const isTrainer = isTrainerRole(role)
  const isProfessional = isProfessionalRole(role)
  const needsEmailVerification = isLoggedIn && !emailVerified

  const baseLinks = isAdmin
    ? adminLinks
    : isProfessional
      ? professionalLinks
      : hasPremiumAccess
        ? [...clientCoreLinks.slice(0, 2), ...clientPremiumLinks, ...clientCoreLinks.slice(2)]
        : [
            ...clientCoreLinks.slice(0, 4),
            { href: "/billing", label: "Desbloquear", icon: CreditCard },
            clientCoreLinks[4],
          ]

  const createLinks: NavLink[] = isAdmin
    ? [{ href: "/blog/new", label: "Novo post", icon: FileText }]
    : isTrainer
      ? [
          { href: "/forum/channels/new", label: "Meu canal", icon: MessageSquare },
          { href: "/blog/new", label: "Novo post", icon: FileText },
        ]
      : isProfessional
        ? [{ href: "/blog/new", label: "Novo post", icon: FileText }]
        : []

  const loggedLinks = needsEmailVerification
    ? [{ href: "/verify", label: "Confirmar email", icon: Shield }, ...baseLinks, ...createLinks]
    : [...baseLinks, ...createLinks]

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 px-4 py-4 text-white backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="group flex min-h-[44px] items-center gap-3 rounded-2xl pr-3 transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(6,182,212,0.28),rgba(16,185,129,0.35))] shadow-lg shadow-cyan-500/15 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-cyan-500/25">
            <Dog className="h-5 w-5 text-cyan-100" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-white">K9 Training</p>
            <p className="text-xs text-slate-300">Treino, comunidade e evolucao canina.</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {isLoggedIn && session?.user ? (
            <>
              <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 xl:block">
                <span className="font-medium text-white">{session.user.name || session.user.email}</span>
                <span className="mx-2 text-slate-500">|</span>
                <span>{getRoleLabel(role)}</span>
                <span className="mx-2 text-slate-500">|</span>
                <span>{getAccountPlanLabel(plan)}</span>
                {needsEmailVerification ? <span className="ml-2 text-amber-300">Email pendente</span> : null}
                {isRoot ? <span className="ml-2 text-cyan-200">Root</span> : null}
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="min-h-[44px] rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-100 transition-all duration-200 hover:bg-white/10"
              >
                Sair
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex min-h-[44px] items-center rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-100 transition-all duration-200 hover:bg-white/10"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="flex min-h-[44px] items-center rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:-translate-y-0.5"
              >
                Criar conta
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 p-3 text-slate-100 transition-all duration-200 hover:bg-white/10 lg:hidden"
          aria-expanded={open}
          aria-controls="app-menu"
          aria-label={open ? "Fechar navegacao" : "Abrir navegacao"}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <div className="mx-auto hidden max-w-7xl pt-4 lg:block">
        <div className="flex flex-wrap gap-2">
          {(isLoggedIn ? loggedLinks : guestLinks).map((link) => (
            <NavPill key={link.href} link={link} active={isActiveLink(pathname, link.href)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="app-menu"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto mt-4 max-w-7xl lg:hidden"
          >
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
              {isLoggedIn && session?.user ? (
                <div className="mb-4 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <p className="font-semibold text-white">{session.user.name || session.user.email}</p>
                  <p className="mt-1 text-slate-300">
                    {getRoleLabel(role)} • {getAccountPlanLabel(plan)}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {needsEmailVerification ? "Confirme seu email para liberar a experiencia completa." : "Conta pronta para seguir."}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                {(isLoggedIn ? loggedLinks : guestLinks).map((link) => (
                  <NavPill key={link.href} link={link} active={isActiveLink(pathname, link.href)} mobile onClick={() => setOpen(false)} />
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition-all duration-200 hover:bg-white/10"
                  >
                    Sair da conta
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition-all duration-200 hover:bg-white/10"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/register"
                      className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Criar conta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  )
}

function NavPill({
  link,
  active,
  mobile = false,
  onClick,
}: {
  link: NavLink
  active: boolean
  mobile?: boolean
  onClick?: () => void
}) {
  const Icon = link.icon

  return (
    <Link
      href={link.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[44px] items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all duration-200 ${
        mobile ? "w-full justify-start" : ""
      } ${
        active
          ? "border-cyan-300/30 bg-cyan-500/10 text-cyan-100 shadow-lg shadow-cyan-950/15"
          : "border-white/10 bg-white/5 text-slate-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{link.label}</span>
    </Link>
  )
}
