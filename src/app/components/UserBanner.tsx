"use client"

import Link from "next/link"

import { usePlatformSession } from "@/app/components/PlatformSessionProvider"
import { getRoleLabel, isRootRole } from "@/lib/role"

export default function UserBanner() {
  const { session, role, modules, emailVerified, isLoggedIn } = usePlatformSession()
  const isRoot = isRootRole(role)

  if (!isLoggedIn || !session?.user) return null

  return (
    <div className="app-banner border-b text-xs text-gray-200 md:text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 sm:px-6 md:gap-3">
        <span>
          Ola, <strong>{session.user.name || session.user.email}</strong>
        </span>
        <span className="text-gray-400">|</span>
        <span>
          Perfil: <strong>{getRoleLabel(role)}</strong>
        </span>
        <span className="text-gray-400">|</span>
        <span>
          Modulos: <strong>{modules.length}</strong>
        </span>
        {isRoot ? <span className="root-pill">Controle total ativo</span> : null}
        {emailVerified ? (
          <span className="text-emerald-300">Email confirmado</span>
        ) : (
          <Link href="/verify" className="text-amber-300 underline underline-offset-4">
            Falta confirmar seu email
          </Link>
        )}
      </div>
    </div>
  )
}
