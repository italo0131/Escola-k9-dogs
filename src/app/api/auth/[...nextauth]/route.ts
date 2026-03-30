import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import bcrypt from "bcrypt"
import { createVerificationCode, verifyCode } from "@/lib/verification"
import { takeRateLimit } from "@/lib/security"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function verifyPassword(stored: string, input: string) {
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return { valid: await bcrypt.compare(input, stored), needsRehash: false }
  }
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":")
    const derivedInput = scryptSync(input, salt, 64)
    return { valid: timingSafeEqual(Buffer.from(hash, "hex"), derivedInput), needsRehash: false }
  }
  const sha = createHash("sha256").update(input).digest("hex")
  if (stored === sha) return { valid: true, needsRehash: true }
  return { valid: stored === input, needsRehash: stored === input }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
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
        const email = normalizeEmail(credentials.email)
        const loginRateLimit = takeRateLimit(`auth:login:${email}`, 10, 10 * 60 * 1000)
        if (!loginRateLimit.allowed) {
          throw new Error("TOO_MANY_ATTEMPTS")
        }
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        const passwordCheck = await verifyPassword(user.password, credentials.password)
        if (!passwordCheck.valid) return null
        if (user.status === "SUSPENDED") {
          throw new Error("ACCOUNT_SUSPENDED")
        }

        if (passwordCheck.needsRehash) {
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashPassword(credentials.password) },
          })
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          planStatus: user.planStatus,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.role = (user as any).role
        token.plan = (user as any).plan
        token.planStatus = (user as any).planStatus
      }
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
        if (dbUser) {
          token.role = dbUser.role
          token.plan = dbUser.plan
          token.planStatus = dbUser.planStatus
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
        session.user.plan = token.plan as string
        session.user.planStatus = token.planStatus as string
        session.user.emailVerifiedAt = token.emailVerifiedAt as string | null
        session.user.status = token.status as string
        session.user.twoFactorEnabled = !!token.twoFactorEnabled
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
