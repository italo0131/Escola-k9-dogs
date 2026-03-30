import nodemailer, { type Transporter } from "nodemailer"
import { Resend } from "resend"

import { prisma } from "./prisma"

let resendClient: Resend | null = null
let smtpClient: Transporter | null = null

type EmailProvider = "smtp" | "resend" | "console"

function getSmtpConfig() {
  const host = String(process.env.SMTP_HOST || "").trim()
  const user = String(process.env.SMTP_USER || "").trim()
  const pass = String(process.env.SMTP_PASS || "").trim()

  if (!host || !user || !pass) {
    return null
  }

  const port = Number(process.env.SMTP_PORT || 587)
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass,
  }
}

function getSmtpTransport() {
  const config = getSmtpConfig()
  if (!config) {
    return null
  }

  if (!smtpClient) {
    smtpClient = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })
  }

  return smtpClient
}

function getResend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return null
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

function getPlatformBaseUrl() {
  return process.env.NEXTAUTH_URL || "http://localhost:3000"
}

function getFromAddress() {
  const fromName = process.env.EMAIL_FROM_NAME || "K9 Training"
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "no-reply@k9training.local"
  return `${fromName} <${fromAddress}>`
}

function assertSmtpSenderAddress() {
  const smtp = getSmtpConfig()
  if (!smtp) return

  const fromAddress = String(process.env.EMAIL_FROM_ADDRESS || "").trim().toLowerCase()
  if (!fromAddress || fromAddress.endsWith("@resend.dev") || fromAddress.endsWith(".local")) {
    throw new Error("SMTP_FROM_ADDRESS_NOT_CONFIGURED")
  }
}

export function isEmailConfigured() {
  return !!getSmtpConfig() || !!process.env.RESEND_API_KEY
}

function renderEmailShell({
  eyebrow,
  title,
  intro,
  body,
  ctaLabel,
  ctaHref,
  footer,
}: {
  eyebrow: string
  title: string
  intro: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  footer?: string
}) {
  return `
    <div style="background:#020617;padding:32px 16px;font-family:Arial,sans-serif;color:#e2e8f0;">
      <div style="max-width:640px;margin:0 auto;background:linear-gradient(160deg,#0f172a,#111827);border:1px solid rgba(148,163,184,0.18);border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;color:#67e8f9;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;">${eyebrow}</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#f8fafc;">${title}</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#cbd5e1;">${intro}</p>
        <div style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#e2e8f0;">${body}</div>
        ${
          ctaLabel && ctaHref
            ? `<a href="${ctaHref}" style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#10b981);padding:12px 18px;border-radius:14px;color:#ffffff;text-decoration:none;font-weight:700;">${ctaLabel}</a>`
            : ""
        }
        <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#94a3b8;">${footer || "Mensagem automatica da plataforma K9 Training."}</p>
      </div>
    </div>
  `
}

async function sendPlatformEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const smtp = getSmtpTransport()
  if (smtp) {
    assertSmtpSenderAddress()
    await smtp.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
    })

    return { success: true, queued: true, provider: "smtp" as EmailProvider }
  }

  const resend = getResend()
  if (resend) {
    await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
    })

    return { success: true, queued: true, provider: "resend" as EmailProvider }
  }

  if (!smtp && !resend) {
    console.log(`[email-fallback-console] provider_not_configured to=${to} subject=${subject}`)
    console.log(html)
    return { success: true, queued: false, provider: "console" as EmailProvider }
  }
}

async function getUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")
  return user
}

export async function sendVerifyEmail(userId: string, code: string) {
  const user = await getUserOrThrow(userId)
  const verifyHref = `${getPlatformBaseUrl()}/api/verify/email/verify?code=${encodeURIComponent(code)}`
  const html = renderEmailShell({
    eyebrow: "Seguranca da conta",
    title: "Confirme seu email na K9 Training",
    intro: `Ola, ${user.name}. Estamos quase la. Essa confirmacao ajuda a proteger seu acesso e deixa a experiencia mais segura para toda a comunidade.`,
    body: `
      <p style="margin:0 0 12px;">Use este codigo nos proximos 10 minutos:</p>
      <div style="display:inline-block;padding:14px 18px;border-radius:18px;background:rgba(6,182,212,0.12);border:1px solid rgba(103,232,249,0.22);font-size:24px;font-weight:700;letter-spacing:0.18em;color:#f8fafc;">${code}</div>
      <p style="margin:16px 0 0;">Se voce ja estiver logado, o botao abaixo leva direto para a confirmacao. Se ainda nao entrou, faca login e siga por la. Sempre que houver automacao ou IA na plataforma, vamos sinalizar isso com transparencia.</p>
      <p style="margin:16px 0 0;">Cada cao e unico, e as recomendacoes da plataforma servem como apoio. A palavra final continua com o tutor ou responsavel.</p>
    `,
    ctaLabel: "Abrir verificacao",
    ctaHref: verifyHref,
    footer: "Se nao foi voce quem criou essa conta, pode ignorar esta mensagem com tranquilidade.",
  })

  return sendPlatformEmail({
    to: user.email,
    subject: "Confirme seu email na K9 Training",
    html,
  })
}

export async function sendApprovalEmail(userId: string, approverName: string) {
  const user = await getUserOrThrow(userId)
  const html = renderEmailShell({
    eyebrow: "Conta aprovada",
    title: "Sua conta foi liberada",
    intro: `Ola, ${user.name}. ${approverName} aprovou sua conta na plataforma.`,
    body: "<p style=\"margin:0;\">Agora voce pode entrar, completar seu perfil e explorar a K9 Training no seu ritmo.</p>",
    ctaLabel: "Entrar na plataforma",
    ctaHref: `${getPlatformBaseUrl()}/login`,
    footer: "Se voce tiver qualquer duvida, conte com a equipe da K9 Training.",
  })

  return sendPlatformEmail({
    to: user.email,
    subject: "Sua conta foi aprovada",
    html,
  })
}

export async function sendRejectionEmail(userId: string, reason: string) {
  const user = await getUserOrThrow(userId)
  const html = renderEmailShell({
    eyebrow: "Cadastro em revisao",
    title: "Precisamos ajustar alguns pontos do seu cadastro",
    intro: `Ola, ${user.name}. No momento sua conta ainda nao foi liberada para uso.`,
    body: `<p style="margin:0 0 12px;">Motivo informado pela equipe:</p><div style="padding:14px 16px;border-radius:18px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.18);">${reason}</div>`,
    ctaLabel: "Falar com a equipe",
    ctaHref: `${getPlatformBaseUrl()}/contato`,
    footer: "Se quiser revisar o caso, estamos por perto para ajudar.",
  })

  return sendPlatformEmail({
    to: user.email,
    subject: "Ajuste necessario no cadastro",
    html,
  })
}
