import { NextResponse } from "next/server"
import { randomBytes, scryptSync } from "crypto"

import { prisma } from "@/lib/prisma"
import { sendVerifyEmail } from "@/lib/email"
import { createVerificationCode } from "@/lib/verification"
import { ACCOUNT_PLANS, REGISTERABLE_ROLES, isPaidPlan } from "@/lib/platform"
import { isProfessionalRole } from "@/lib/role"

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data?.name || !data?.email || !data?.password) {
      return NextResponse.json(
        { success: false, message: "Nome, email e senha sao os primeiros dados que precisamos para criar sua conta." },
        { status: 400 },
      )
    }

    const hashedPassword = hashPassword(data.password)
    const email = normalizeEmail(data.email)
    const requestedRole = String(data?.role || "CLIENT").toUpperCase()
    const requestedPlan = String(data?.plan || "FREE").toUpperCase()
    const requiresProfessionalApproval = isProfessionalRole(requestedRole)

    if (!REGISTERABLE_ROLES.includes(requestedRole as (typeof REGISTERABLE_ROLES)[number])) {
      return NextResponse.json({ success: false, message: "Esse tipo de conta nao esta disponivel para cadastro publico." }, { status: 400 })
    }

    if (!ACCOUNT_PLANS.includes(requestedPlan as (typeof ACCOUNT_PLANS)[number])) {
      return NextResponse.json({ success: false, message: "Nao reconheci o plano escolhido. Tente novamente." }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        password: hashedPassword,
        role: requestedRole,
        plan: requestedPlan,
        planStatus: isPaidPlan(requestedPlan) ? "CHECKOUT_REQUIRED" : "ACTIVE",
        planActivatedAt: isPaidPlan(requestedPlan) ? null : new Date(),
        phone: data.phone || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        headline: data.headline?.trim() || null,
        bio: data.bio?.trim() || null,
        specialties: data.specialties?.trim() || null,
        experienceYears: data.experienceYears ? Math.max(0, Number(data.experienceYears)) : null,
        availabilityNotes: data.availabilityNotes?.trim() || null,
        websiteUrl: data.websiteUrl?.trim() || null,
        instagramHandle: data.instagramHandle?.trim() || null,
        status: requiresProfessionalApproval ? "PENDING_APPROVAL" : "ACTIVE",
      },
    })

    const emailCode = await createVerificationCode(user.id, "email")
    let emailDeliveryFailed = false
    try {
      await sendVerifyEmail(user.id, emailCode)
    } catch (emailError) {
      emailDeliveryFailed = true
      console.warn("Nao foi possivel enviar o email de verificacao automaticamente.", emailError)
      console.log(`[verify-email] ${user.email} code=${emailCode}`)
    }

    if (data.phone) {
      const phoneCode = await createVerificationCode(user.id, "phone")
      console.log(`[verify-phone] ${data.phone} code=${phoneCode}`)
    }

    const { password, ...safeUser } = user

    return NextResponse.json(
      {
        success: true,
        user: safeUser,
        emailDeliveryFailed,
        message: emailDeliveryFailed
          ? "Conta criada com sucesso, mas o email de confirmacao nao saiu agora. Revise o remetente no provedor e tente reenviar pela tela de verificacao."
          : requiresProfessionalApproval
            ? "Conta criada com sucesso. Depois da confirmacao de email, seu perfil profissional vai para analise da equipe."
          : isPaidPlan(requestedPlan)
            ? "Conta criada com sucesso. Vamos confirmar seu email e depois seguir para a assinatura do plano escolhido."
            : "Conta criada com sucesso. Enviamos um codigo para o seu email para liberar a experiencia completa.",
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("ERRO API POST /register:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ success: false, message: "Ja existe uma conta com esse email. Se ela for sua, voce pode entrar ou recuperar o acesso." }, { status: 409 })
    }

    return NextResponse.json({ success: false, message: "Ops, algo deu errado ao criar sua conta. Tente novamente em alguns instantes." }, { status: 500 })
  }
}
