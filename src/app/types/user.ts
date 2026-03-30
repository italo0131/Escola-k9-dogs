export type User = {
  id: string
  name: string
  email: string
  role: string
  plan?: string
  planStatus?: string
  planActivatedAt?: string | null
  headline?: string | null
  bio?: string | null
  city?: string | null
  state?: string | null
  specialties?: string | null
  experienceYears?: number | null
  availabilityNotes?: string | null
  websiteUrl?: string | null
  instagramHandle?: string | null
  status?: string
  emailVerifiedAt?: string | null
  phone?: string | null
  phoneVerifiedAt?: string | null
}
