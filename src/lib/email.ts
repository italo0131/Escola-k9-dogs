import { Resend } from "resend"
import { prisma } from "./prisma"

let resendClient: Resend | null = null
function getResend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY")
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export async function sendVerifyEmail(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const resend = getResend()
  await resend.emails.send({
    from: 'no-reply@k9training.com',
    to: user.email,
    subject: 'Verifique seu email - K9 Training Platform',
    html: `<h1>Verificação de Email</h1><p>Seu código é: <strong>${code}</strong></p><p>Valido 10min.</p>`,
  });
}

export async function sendApprovalEmail(userId: string, approverName: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const resend = getResend()
  await resend.emails.send({
    from: 'admin@k9training.com',
    to: user.email,
    subject: 'Conta Aprovada!',
    html: `<h1>Aprovada por ${approverName}</h1><p><a href="${process.env.NEXTAUTH_URL}/login">Login</a></p>`,
  });
}

export async function sendRejectionEmail(userId: string, reason: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const resend = getResend()
  await resend.emails.send({
    from: 'no-reply@k9training.com',
    to: user.email,
    subject: 'Conta Não Aprovada',
    html: `<h1>Motivo: ${reason}</h1><p>Contate admin.</p>`,
  });
}
