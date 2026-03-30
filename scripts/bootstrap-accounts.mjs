import fs from "fs"
import path from "path"
import { randomBytes, scryptSync } from "crypto"
import { PrismaClient } from "@prisma/client"

function loadLocalEnv() {
  for (const [filename, overwrite] of [
    [".env.local", true],
    [".env", false],
  ]) {
    const filePath = path.join(process.cwd(), filename)
    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, "utf8")
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith("#")) continue
      const separator = line.indexOf("=")
      if (separator === -1) continue
      const key = line.slice(0, separator).trim()
      const value = line.slice(separator + 1).trim().replace(/^"(.*)"$/, "$1")
      if (overwrite || !(key in process.env)) {
        process.env[key] = value
      }
    }
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
}

loadLocalEnv()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL nao encontrado em variaveis de ambiente, .env.local ou .env")
}

const prisma = new PrismaClient()

const accounts = [
  {
    email: "admin@k9training.local",
    name: "Administrador K9",
    role: "ADMIN",
    password: "AdminK9!2026",
    headline: "Governanca, disciplina operacional e crescimento da plataforma.",
    bio: "Conta administrativa criada para organizar usuarios, canais, conteudos e assinatura da plataforma.",
  },
  {
    email: "adestrador@k9training.local",
    name: "Adestrador Demo",
    role: "TRAINER",
    password: "TrainerK9!2026",
    headline: "Metodologia clara, rotina forte e treino com constancia.",
    bio: "Conta de adestrador preparada para criar canal, publicar aulas e atender alunos na plataforma.",
  },
  {
    email: "veterinario@k9training.local",
    name: "Veterinario Demo",
    role: "VET",
    password: "VetK9!2026",
    headline: "Saude, prevencao e performance com acompanhamento disciplinado.",
    bio: "Conta veterinaria preparada para orientar tutores, publicar conteudo e acompanhar caes atletas na plataforma.",
  },
]

async function main() {
  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password: hashPassword(account.password),
        role: account.role,
        status: "ACTIVE",
        plan: "PRO",
        planStatus: "ACTIVE",
        planActivatedAt: new Date(),
        headline: account.headline,
        bio: account.bio,
        emailVerifiedAt: new Date(),
      },
      create: {
        name: account.name,
        email: account.email,
        password: hashPassword(account.password),
        role: account.role,
        status: "ACTIVE",
        plan: "PRO",
        planStatus: "ACTIVE",
        planActivatedAt: new Date(),
        headline: account.headline,
        bio: account.bio,
        emailVerifiedAt: new Date(),
      },
    })
  }

  console.log("Contas base prontas:")
  for (const account of accounts) {
    console.log(`${account.role}: ${account.email} / ${account.password}`)
  }
}

main()
  .catch((error) => {
    console.error("Falha ao criar contas base:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
