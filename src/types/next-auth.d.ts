import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
  }

  interface Session {
    user?: {
      id?: string
      name?: string | null
      email?: string | null
      role?: string
      emailVerifiedAt?: string | null
      status?: string
      twoFactorEnabled?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    emailVerifiedAt?: string | null
    twoFactorEnabled?: boolean
    status?: string
  }
}
