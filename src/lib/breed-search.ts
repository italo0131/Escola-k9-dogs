import type { DogBreedLookup } from "@/lib/thedogapi"

type RankedBreed = {
  breed: DogBreedLookup
  score: number
}

export type BreedSearchSuggestion = {
  label: string
  query: string
  source: "catalog" | "alias" | "discovery"
}

const BRAZILIAN_BREED_ALIAS_ENTRIES: Array<{
  canonical: string
  aliases: string[]
}> = [
  {
    canonical: "german shepherd",
    aliases: [
      "pastor alemao",
      "pastores alemaes",
      "pastor alemaes",
      "shepherd alemao",
    ],
  },
  {
    canonical: "golden retriever",
    aliases: ["golden", "goldens", "retriever dourado"],
  },
  {
    canonical: "labrador retriever",
    aliases: ["labrador", "labradores", "lab"],
  },
  {
    canonical: "shih tzu",
    aliases: ["shitzu", "shihtzu", "shih-tzu", "shitsu"],
  },
  {
    canonical: "poodle",
    aliases: ["poodles", "caniche"],
  },
  {
    canonical: "bulldog",
    aliases: ["buldogue", "buldog", "buldogues"],
  },
  {
    canonical: "french bulldog",
    aliases: ["buldogue frances", "bulldog frances", "frenchie"],
  },
  {
    canonical: "siberian husky",
    aliases: ["husky", "husky siberiano", "huskies"],
  },
  {
    canonical: "dachshund",
    aliases: ["salsicha", "cofap", "teckel", "bassotto", "dachshunds"],
  },
  {
    canonical: "belgian malinois",
    aliases: ["malinois", "pastor belga malinois", "malinoi"],
  },
  {
    canonical: "border collie",
    aliases: ["collie", "borders"],
  },
  {
    canonical: "rottweiler",
    aliases: ["rott", "rotts"],
  },
  {
    canonical: "doberman pinscher",
    aliases: ["doberman", "dobermann"],
  },
  {
    canonical: "beagle",
    aliases: ["beagles"],
  },
  {
    canonical: "yorkshire terrier",
    aliases: ["yorkshire", "york", "yorkie"],
  },
  {
    canonical: "dalmatian",
    aliases: ["dalmata", "dalmatas"],
  },
  {
    canonical: "boxer",
    aliases: ["boxers"],
  },
  {
    canonical: "chihuahua",
    aliases: ["chihuahuas"],
  },
  {
    canonical: "pug",
    aliases: ["pugs", "carlin"],
  },
  {
    canonical: "samoyed",
    aliases: ["samoieda", "samoiedas"],
  },
  {
    canonical: "akita",
    aliases: ["akita inu", "akitas"],
  },
  {
    canonical: "shiba inu",
    aliases: ["shiba", "shibas"],
  },
  {
    canonical: "lhasa apso",
    aliases: ["lhasa", "lhasa apso"],
  },
  {
    canonical: "cavalier king charles spaniel",
    aliases: ["cavalier", "king charles", "cavalier king"],
  },
  {
    canonical: "miniature pinscher",
    aliases: ["pinscher", "pincher", "pinschers"],
  },
  {
    canonical: "great dane",
    aliases: ["dogue alemao", "dinamarques", "dinamarquês"],
  },
  {
    canonical: "cane corso",
    aliases: ["cane corso italiano"],
  },
  {
    canonical: "american pit bull terrier",
    aliases: ["pitbull", "pit bull", "pitbull terrier"],
  },
  {
    canonical: "jack russell terrier",
    aliases: ["jack russel", "jack russell"],
  },
]

const ALIAS_LOOKUP = new Map<string, string>()
const REVERSE_ALIAS_LOOKUP = new Map<string, string[]>()

export function normalizeBreedSearchTerm(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function stripPlural(value: string) {
  if (value.endsWith("es") && value.length > 4) {
    return value.slice(0, -2)
  }

  if (value.endsWith("s") && value.length > 4) {
    return value.slice(0, -1)
  }

  return value
}

function compact(value: string) {
  return normalizeBreedSearchTerm(value).replace(/\s+/g, "")
}

for (const entry of BRAZILIAN_BREED_ALIAS_ENTRIES) {
  const normalizedCanonical = normalizeBreedSearchTerm(entry.canonical)
  const aliasSet = new Set<string>([normalizedCanonical])

  for (const alias of entry.aliases) {
    const normalizedAlias = normalizeBreedSearchTerm(alias)
    ALIAS_LOOKUP.set(normalizedAlias, entry.canonical)
    aliasSet.add(normalizedAlias)
    aliasSet.add(stripPlural(normalizedAlias))
  }

  REVERSE_ALIAS_LOOKUP.set(normalizedCanonical, Array.from(aliasSet))
}

function buildQueryVariants(query: string) {
  const normalized = normalizeBreedSearchTerm(query)
  const canonical = normalizeBreedSearchAlias(normalized)
  const variants = new Set<string>([
    normalized,
    stripPlural(normalized),
    canonical,
    stripPlural(canonical),
    compact(normalized),
    compact(canonical),
  ])

  for (const token of normalized.split(" ")) {
    if (token) {
      variants.add(token)
      variants.add(stripPlural(token))
    }
  }

  return Array.from(variants).filter(Boolean)
}

function getBreedSearchSpace(breed: DogBreedLookup) {
  const normalizedName = normalizeBreedSearchTerm(breed.name)
  const canonicalAliases = REVERSE_ALIAS_LOOKUP.get(normalizedName) || []
  const directNameTokens = normalizedName.split(" ").map(stripPlural)
  const group = normalizeBreedSearchTerm(breed.breedGroup || "")
  const origin = normalizeBreedSearchTerm(breed.origin || "")
  const temperament = normalizeBreedSearchTerm(breed.temperament || "")

  return Array.from(
    new Set(
      [
        normalizedName,
        stripPlural(normalizedName),
        compact(normalizedName),
        ...canonicalAliases,
        ...directNameTokens,
        group,
        origin,
        temperament,
      ].filter(Boolean),
    ),
  )
}

function scoreBreedAgainstQuery(breed: DogBreedLookup, variants: string[]) {
  const searchSpace = getBreedSearchSpace(breed)
  let score = 0

  for (const variant of variants) {
    if (!variant) continue

    for (const candidate of searchSpace) {
      if (!candidate) continue

      if (candidate === variant) {
        score += 120
        continue
      }

      if (candidate.startsWith(variant)) {
        score += 80
        continue
      }

      if (candidate.includes(variant)) {
        score += 40
      }
    }
  }

  if (normalizeBreedSearchAlias(normalizeBreedSearchTerm(breed.name)) === normalizeBreedSearchAlias(variants[0] || "")) {
    score += 50
  }

  return score
}

export function normalizeBreedSearchAlias(query: string) {
  const normalized = normalizeBreedSearchTerm(query)
  return ALIAS_LOOKUP.get(normalized) || normalized
}

export function getBreedImageFallback(name: string) {
  return `https://placehold.co/960x720/0f172a/e2e8f0?text=${encodeURIComponent(name)}`
}

export function getBreedImageUrl(name: string, imageUrl?: string | null) {
  return typeof imageUrl === "string" && imageUrl.trim().length > 0 ? imageUrl : getBreedImageFallback(name)
}

export function searchBreedCatalog(breeds: DogBreedLookup[], query: string, limit = 24) {
  const normalizedQuery = normalizeBreedSearchTerm(query)

  if (!normalizedQuery) {
    return breeds.slice(0, limit)
  }

  const variants = buildQueryVariants(normalizedQuery)
  const ranked: RankedBreed[] = breeds
    .map((breed) => ({
      breed,
      score: scoreBreedAgainstQuery(breed, variants),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.breed.name.localeCompare(right.breed.name, "pt-BR")
    })

  return ranked.slice(0, limit).map((item) => item.breed)
}

function formatDiscoveryLabel(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ")
}

function appendSuggestion(
  suggestions: BreedSearchSuggestion[],
  seen: Set<string>,
  label: string,
  query: string,
  source: BreedSearchSuggestion["source"],
) {
  const normalized = normalizeBreedSearchTerm(query || label)
  if (!normalized || seen.has(normalized)) return

  suggestions.push({
    label,
    query,
    source,
  })
  seen.add(normalized)
}

export function suggestBreedQueries(breeds: DogBreedLookup[], query: string, limit = 6) {
  const normalizedQuery = normalizeBreedSearchTerm(query)
  const suggestions: BreedSearchSuggestion[] = []
  const seen = new Set<string>()

  if (!normalizedQuery) {
    for (const item of getBreedQuerySuggestions().slice(0, limit)) {
      appendSuggestion(suggestions, seen, formatDiscoveryLabel(item), item, "discovery")
    }
    return suggestions
  }

  const canonical = normalizeBreedSearchAlias(normalizedQuery)
  if (canonical && canonical !== normalizedQuery) {
    const directBreed = breeds.find((breed) => normalizeBreedSearchTerm(breed.name) === canonical)
    appendSuggestion(
      suggestions,
      seen,
      directBreed?.name || formatDiscoveryLabel(canonical),
      directBreed?.name || canonical,
      "alias",
    )
  }

  const ranked = breeds
    .map((breed) => ({
      breed,
      score: scoreBreedAgainstQuery(breed, buildQueryVariants(normalizedQuery)),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.breed.name.localeCompare(right.breed.name, "pt-BR")
    })

  for (const item of ranked.slice(0, limit * 2)) {
    appendSuggestion(suggestions, seen, item.breed.name, item.breed.name, "catalog")
    if (suggestions.length >= limit) return suggestions.slice(0, limit)
  }

  for (const item of getBreedQuerySuggestions()) {
    appendSuggestion(suggestions, seen, formatDiscoveryLabel(item), item, "discovery")
    if (suggestions.length >= limit) break
  }

  return suggestions.slice(0, limit)
}

export function getBreedQuerySuggestions() {
  return [
    "pastor alemão",
    "golden",
    "labrador",
    "shih tzu",
    "poodle",
    "buldogue",
    "husky siberiano",
    "salsicha",
    "malinois",
    "pinscher",
  ]
}
