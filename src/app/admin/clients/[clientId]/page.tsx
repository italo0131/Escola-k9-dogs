import { redirect } from "next/navigation"

type Props = { params: Promise<{ clientId: string }> }

export default async function AdminClientRedirectPage({ params }: Props) {
  const { clientId } = await params
  redirect(`/admin/users/${clientId}`)
}
