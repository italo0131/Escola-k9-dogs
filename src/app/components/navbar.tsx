"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { signOut } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  Calendar,
  Dog,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  UserCircle2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { usePlatformSession } from "@/app/components/PlatformSessionProvider"
import { getRoleLabel, isAdminRole, isProfessionalRole, isRootRole } from "@/lib/role"

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
}

const guestLinks: NavLink[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/racas", label: "Racas", icon: Dog },
  { href: "/blog", label: "Blog", icon: FileText },
]

function isActiveLink(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { session, isLoggedIn, role, emailVerified, hasModule, modules } = usePlatformSession()

  const isAdmin = isAdminRole(role)
  const isRoot = isRootRole(role)
  const isProfessional = isProfessionalRole(role)
  const needsEmailVerification = isLoggedIn && !emailVerified

  const loggedLinks = useMemo(() => {
    if (isAdmin) {
      return [
        { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
        { href: "/admin/users", label: "Usuarios", icon: Users },
        { href: "/admin/modules", label: "Modulos", icon: Shield },
        { href: "/forum", label: "Forum", icon: MessageSquare },
        { href: "/blog", label: "Blog", icon: FileText },
        { href: "/profile", label: "Perfil", icon: UserCircle2 },
      ] satisfies NavLink[]
    }

    if (isProfessional) {
      return [
        { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
        { href: "/calendar", label: "Agenda", icon: Calendar },
        { href: "/forum", label: "Forum", icon: MessageSquare },
        { href: "/conteudos", label: "Conteudos", icon: BookOpen },
        { href: "/blog", label: "Blog", icon: FileText },
        { href: "/profile", label: "Perfil", icon: UserCircle2 },
      ] satisfies NavLink[]
    }

    const links: NavLink[] = [
      { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
      { href: "/forum", label: "Forum", icon: MessageSquare },
      { href: "/racas", label: "Racas", icon: Dog },
      { href: "/blog", label: "Blog", icon: FileText },
      { href: "/profile", label: "Perfil", icon: UserCircle2 },
    ]

    if (hasModule("DOGS")) links.splice(1, 0, { href: "/dogs", label: "Caes", icon: Dog })
    if (hasModule("TRAINING")) links.splice(links.length - 2, 0, { href: "/training", label: "Treinos", icon: BookOpen })
    if (hasModule("SCHEDULE")) links.splice(links.length - 2, 0, { href: "/calendar", label: "Agenda", icon: Calendar })
    if (hasModule(["COURSES", "CONTENT_LIBRARY"])) {
      links.splice(links.length - 2, 0, { href: "/conteudos", label: "Conteudos", icon: BookOpen })
    }

    if (needsEmailVerification) {
      links.unshift({ href: "/verify", label: "Confirmar email", icon: Shield })
    }

    return links
  }, [hasModule, isAdmin, isProfessional, needsEmailVerification])

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 px-4 py-4 text-white backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="group flex min-h-[44px] items-center gap-3 rounded-2xl pr-3 transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(6,182,212,0.28),rgba(16,185,129,0.35))] shadow-lg shadow-cyan-500/15 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-cyan-500/25">
            <Dog className="h-5 w-5 text-cyan-100" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-white">K9 Training</p>
            <p className="text-xs text-slate-300">Acompanhamento, rotina e comunidade.</p>
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
                <span>{modules.length} modulos</span>
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
                Como receber acesso
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
                    {getRoleLabel(role)} • {modules.length} modulos liberados
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {needsEmailVerification ? "Confirme seu email para proteger a conta." : "Conta pronta para seguir."}
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
                      Como receber acesso
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
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
        active
          ? "border-cyan-300/30 bg-cyan-500/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
      } ${mobile ? "w-full" : ""}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{link.label}</span>
      {link.href === "/admin/modules" ? <Settings className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" /> : null}
    </Link>
  )
}
