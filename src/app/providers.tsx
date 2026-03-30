"use client"

import { SessionProvider } from "next-auth/react"
import { type ReactNode } from "react"

import { AppToastProvider } from "@/app/components/AppToastProvider"
import { PlatformSessionProvider } from "@/app/components/PlatformSessionProvider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchWhenOffline={false}>
      <PlatformSessionProvider>
        <AppToastProvider>{children}</AppToastProvider>
      </PlatformSessionProvider>
    </SessionProvider>
  )
}
