import "./globals.css"
import { ReactNode } from "react"
import Navbar from "../app/components/navbar"
import UserBanner from "./components/UserBanner"
import { Space_Grotesk } from "next/font/google"
import { Providers } from "./providers"

export const dynamic = "force-dynamic"

const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br" className="bg-slate-950">
      <body className={`${grotesk.className} text-white antialiased bg-slate-950 min-h-[100svh]`}>
        <Providers>
          <div className="app-bg fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.12),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.05),transparent_30%)]" />
          <UserBanner />
          <Navbar />
          <main className="page-shell">{children}</main>
        </Providers>
      </body>
    </html>
  )
}

