import { resolveMediaUrl } from "@/lib/media"

type Props = {
  src?: string | null
  alt: string
  className?: string
}

export default async function SafeImage({ src, alt, className }: Props) {
  const resolved = await resolveMediaUrl(src)

  if (!resolved) return null

  return <img src={resolved} alt={alt} className={className} />
}
