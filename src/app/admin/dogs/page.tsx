import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"
import DogsTable from "./DogsTable"

export default async function AdminDogsPage() {
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const [dogs, owners] = await Promise.all([
    prisma.dog.findMany({
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  const dogRows = dogs.map((dog) => ({
    id: dog.id,
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    ownerId: dog.ownerId,
    ownerName: dog.owner?.name || null,
  }))

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto">
        <DogsTable initialDogs={dogRows} owners={owners} />
      </div>
    </div>
  )
}
