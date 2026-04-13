import { getSessionModuleKeys } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { isStaffRole } from "@/lib/role"

const COURSE_MODULE_KEYS = ["COURSES", "CONTENT_LIBRARY"] as const

export type CourseAccess = {
  isStaff: boolean
  hasCourseModule: boolean
  allowAll: boolean
  allowedContentIds: Set<string>
}

function normalizeToken(value: unknown) {
  return String(value || "").trim()
}

export function hasAllowedId(allowed: Set<string>, ...values: Array<string | null | undefined>) {
  return values.some((value) => value && allowed.has(value))
}

export async function getCourseAccess(session: any): Promise<CourseAccess> {
  const role = session?.user?.role as string | undefined
  const isStaff = isStaffRole(role)
  const moduleKeys = getSessionModuleKeys(session?.user?.modules || [])
  const hasCourseModule = moduleKeys.some((key) => COURSE_MODULE_KEYS.includes(key as any))

  if (!session?.user?.id || (!hasCourseModule && !isStaff)) {
    return { isStaff, hasCourseModule, allowAll: false, allowedContentIds: new Set() }
  }

  const modules = await prisma.module.findMany({
    where: {
      users: { some: { id: session.user.id } },
      key: { in: COURSE_MODULE_KEYS as unknown as string[] },
    },
    select: { contentIds: true },
  })

  let allowAll = false
  const allowedContentIds = new Set<string>()

  modules.forEach((module) => {
    if (!module.contentIds || module.contentIds.length === 0) {
      allowAll = true
      return
    }

    module.contentIds.map(normalizeToken).filter(Boolean).forEach((token) => allowedContentIds.add(token))
  })

  return {
    isStaff,
    hasCourseModule: hasCourseModule || allowAll || allowedContentIds.size > 0,
    allowAll,
    allowedContentIds,
  }
}
