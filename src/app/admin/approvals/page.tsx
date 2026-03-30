import { redirect } from "next/navigation"

import ApprovalsBoard from "@/app/admin/approvals/ApprovalsBoard"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ACCOUNT_PLANS } from "@/lib/platform"
import { isAdminRole, isProfessionalRole, isRootRole } from "@/lib/role"

const PENDING_PLAN_STATUSES = ["CHECKOUT_REQUIRED", "CHECKOUT_PENDING", "PAST_DUE", "CANCELED"]
const PAID_PLANS = ACCOUNT_PLANS.filter((plan) => plan !== "FREE")

export default async function AdminApprovalsPage() {
  const session = await requireUser()

  if (!isAdminRole(session.user.role)) {
    redirect("/dashboard")
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { emailVerifiedAt: null },
        { status: "PENDING_APPROVAL" },
        {
          plan: { in: PAID_PLANS },
          planStatus: { in: PENDING_PLAN_STATUSES },
        },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      plan: true,
      planStatus: true,
      planActivatedAt: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      headline: true,
      bio: true,
      city: true,
      state: true,
      specialties: true,
      experienceYears: true,
      availabilityNotes: true,
      websiteUrl: true,
      instagramHandle: true,
      createdAt: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          createdAt: true,
        },
      },
    },
  })

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    plan: user.plan,
    planStatus: user.planStatus,
    planActivatedAt: user.planActivatedAt?.toISOString() || null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null,
    phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() || null,
    isProfessional: isProfessionalRole(user.role),
    headline: user.headline,
    bio: user.bio,
    city: user.city,
    state: user.state,
    specialties: user.specialties,
    experienceYears: user.experienceYears,
    availabilityNotes: user.availabilityNotes,
    websiteUrl: user.websiteUrl,
    instagramHandle: user.instagramHandle,
    createdAt: user.createdAt.toISOString(),
    lastPayment: user.payments[0]
      ? {
          id: user.payments[0].id,
          status: user.payments[0].status,
          amount: user.payments[0].amount,
          currency: user.payments[0].currency,
          createdAt: user.payments[0].createdAt.toISOString(),
        }
      : null,
  }))

  return (
    <ApprovalsBoard
      initialRows={rows}
      isRoot={isRootRole(session.user.role)}
    />
  )
}
