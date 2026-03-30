import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { createVerificationCode } from "@/lib/verification"
import { sendVerifyEmail } from "@/lib/email"
import { rejectIfCrossOrigin, rejectIfRateLimited } from "@/lib/security"
import { normalizeBreedLifestyleForm, type BreedLifestyleForm } from "@/lib/breed-match"

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

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

function normalizeAdvisorProfile(value: unknown): BreedLifestyleForm | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return normalizeBreedLifestyleForm(value as Partial<BreedLifestyleForm>)
}

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Sem sessão" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      plan: true,
      planStatus: true,
      planActivatedAt: true,
      headline: true,
      bio: true,
      city: true,
      state: true,
      specialties: true,
      experienceYears: true,
      availabilityNotes: true,
      websiteUrl: true,
      instagramHandle: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      twoFactorEnabled: true,
      breedAdvisorProfile: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ success: false, message: "Nenhum usuário" }, { status: 404 })
  }

  const [dogs, trainings, schedules, subscriptions, channels, channelContents, posts] = await Promise.all([
    prisma.dog.count({ where: { ownerId: user.id } }),
    prisma.trainingSession.count({ where: { dog: { ownerId: user.id } } }),
    prisma.schedule.count({ where: { userId: user.id } }),
    prisma.channelSubscription.count({ where: { userId: user.id, status: "ACTIVE" } }),
    prisma.forumChannel.count({ where: { ownerId: user.id } }),
    prisma.channelContent.count({ where: { authorId: user.id } }),
    prisma.blogPost.count({ where: { authorId: user.id } }),
  ])

  return NextResponse.json({
    success: true,
    user: {
      ...user,
      breedAdvisorProfile: normalizeAdvisorProfile(user.breedAdvisorProfile),
    },
    stats: { dogs, trainings, schedules, subscriptions, channels, channelContents, posts },
  })
}

export async function PATCH(req: Request) {
  try {
    const crossOriginError = rejectIfCrossOrigin(req)
    if (crossOriginError) return crossOriginError

    const rateLimitError = rejectIfRateLimited(
      req,
      "profile-update",
      20,
      15 * 60 * 1000,
      "Muitas alteracoes de perfil em pouco tempo. Aguarde alguns minutos.",
    )
    if (rateLimitError) return rateLimitError

    const session = (await getServerSession(authOptions as any)) as Session | null
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Sem sessão" }, { status: 401 })

    const data = await req.json()
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })

    if (!user) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 })
    }

    const wantsEmailChange = data.email && data.email !== user.email
    const wantsPasswordChange = !!data.password

    if (wantsEmailChange || wantsPasswordChange) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { success: false, message: "Senha atual é obrigatória para alterar email ou senha" },
          { status: 400 },
        )
      }

      const valid = verifyPassword(user.password, data.currentPassword)
      if (!valid) {
        return NextResponse.json({ success: false, message: "Senha atual incorreta" }, { status: 401 })
      }
    }

    const payload: {
      name?: string
      email?: string
      password?: string
      phone?: string | null
      twoFactorEnabled?: boolean
      headline?: string | null
      bio?: string | null
      city?: string | null
      state?: string | null
      specialties?: string | null
      experienceYears?: number | null
      availabilityNotes?: string | null
      websiteUrl?: string | null
      instagramHandle?: string | null
      emailVerifiedAt?: Date | null
      phoneVerifiedAt?: Date | null
      breedAdvisorProfile?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
    } = {}

    if (data.name) payload.name = data.name
    if (wantsEmailChange) {
      payload.email = normalizeEmail(data.email)
      payload.emailVerifiedAt = null
    }
    if (typeof data.phone !== "undefined") {
      const normalizedPhone = data.phone?.trim() || null
      payload.phone = normalizedPhone
      if (normalizedPhone !== (user.phone || null)) payload.phoneVerifiedAt = null
    }
    if (typeof data.twoFactorEnabled !== "undefined") payload.twoFactorEnabled = !!data.twoFactorEnabled
    if (typeof data.headline !== "undefined") payload.headline = data.headline?.trim() || null
    if (typeof data.bio !== "undefined") payload.bio = data.bio?.trim() || null
    if (typeof data.city !== "undefined") payload.city = data.city?.trim() || null
    if (typeof data.state !== "undefined") payload.state = data.state?.trim() || null
    if (typeof data.specialties !== "undefined") payload.specialties = data.specialties?.trim() || null
    if (typeof data.experienceYears !== "undefined") {
      payload.experienceYears = data.experienceYears ? Math.max(0, Number(data.experienceYears)) : null
    }
    if (typeof data.availabilityNotes !== "undefined") payload.availabilityNotes = data.availabilityNotes?.trim() || null
    if (typeof data.websiteUrl !== "undefined") payload.websiteUrl = data.websiteUrl?.trim() || null
    if (typeof data.instagramHandle !== "undefined") payload.instagramHandle = data.instagramHandle?.trim() || null
    if (typeof data.breedAdvisorProfile !== "undefined") {
      const normalizedProfile = normalizeAdvisorProfile(data.breedAdvisorProfile)
      payload.breedAdvisorProfile = normalizedProfile ? (normalizedProfile as Prisma.InputJsonValue) : Prisma.DbNull
    }
    if (wantsPasswordChange) payload.password = hashPassword(data.password)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: payload,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        plan: true,
        planStatus: true,
        planActivatedAt: true,
        headline: true,
        bio: true,
        city: true,
        state: true,
        specialties: true,
        experienceYears: true,
        availabilityNotes: true,
        websiteUrl: true,
        instagramHandle: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        twoFactorEnabled: true,
        breedAdvisorProfile: true,
        createdAt: true,
      },
    })

    let emailDeliveryFailed = false

    if (wantsEmailChange) {
      const code = await createVerificationCode(user.id, "email")
      try {
        await sendVerifyEmail(user.id, code)
      } catch (emailError) {
        emailDeliveryFailed = true
        console.warn("Nao foi possivel reenviar o email de verificacao apos trocar o email.", emailError)
        console.log(`[verify-email] ${updated.email} code=${code}`)
      }
    }

    return NextResponse.json({
      success: true,
      emailDeliveryFailed,
      message:
        wantsEmailChange && emailDeliveryFailed
          ? "Perfil atualizado, mas o email de confirmacao nao saiu agora. Revise o remetente no provedor e tente reenviar pela tela de verificacao."
          : undefined,
      user: {
        ...updated,
        breedAdvisorProfile: normalizeAdvisorProfile(updated.breedAdvisorProfile),
      },
    })
  } catch (error) {
    console.error("ERRO PATCH /profile:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar perfil" }, { status: 500 })
  }
}
