import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { createHash, scryptSync, timingSafeEqual } from "crypto"
import { createVerificationCode, verifyCode } from "@/lib/verification"
function verifyPassword(stored: string, input: string) {
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":")
    const derivedInput = scryptSync(input, salt, 64)
    return timingSafeEqual(Buffer.from(hash, "hex"), derivedInput)
  }
  const sha = createHash("sha256").update(input).digest("hex")
  if (stored === sha) return true
  return stored === input
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 dias
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const ok = verifyPassword(user.password, credentials.password)
        if (!ok) return null
        if (user.status === "SUSPENDED") {
          throw new Error("ACCOUNT_SUSPENDED")
        }
        if (!user.emailVerifiedAt) {
          throw new Error("EMAIL_NOT_VERIFIED")
        }

        if (user.twoFactorEnabled) {
          const providedCode = (credentials as any).twoFactorCode
          if (!providedCode) {
            const code = await createVerificationCode(user.id, "2fa")
            console.log(`[2fa] ${user.email} code=${code}`)
            throw new Error("2FA_REQUIRED")
          }
          const valid2fa = await verifyCode(user.id, "2fa", providedCode)
          if (!valid2fa) {
            throw new Error("2FA_INVALID")
          }
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.role = (user as any).role
      }
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
        if (dbUser) {
          token.role = dbUser.role
          token.emailVerifiedAt = dbUser.emailVerifiedAt?.toISOString() || null
          token.twoFactorEnabled = dbUser.twoFactorEnabled
          token.status = dbUser.status
        }
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.emailVerifiedAt = token.emailVerifiedAt as string | null
        session.user.status = token.status as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
