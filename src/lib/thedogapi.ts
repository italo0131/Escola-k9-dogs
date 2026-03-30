import { searchBreedCatalog } from "@/lib/breed-search"
import { CURATED_FALLBACK_BREEDS } from "@/lib/breed-fallback"

const DOG_API_BASE_URL = "https://api.thedogapi.com/v1"
const BREED_CACHE_TTL = 1000 * 60 * 60 * 6
const CURATED_FALLBACK_LIMIT = 36

function getApiKey() {
  return process.env.THEDOGAPI_API_KEY || process.env.DOG_API_KEY || null
}

type DogApiMetric = {
  metric?: string | null
}

type DogApiImage = {
  url?: string | null
}

type DogApiBreedResponse = {
  id?: string | number | null
  name?: string | null
  breed_group?: string | null
  origin?: string | null
  temperament?: string | null
  description?: string | null
  life_span?: string | null
  bred_for?: string | null
  perfect_for?: string | null
  history?: string | null
  country_code?: string | null
  reference_image_id?: string | null
  male_weight_kg?: string | null
  female_weight_kg?: string | null
  weight?: DogApiMetric | null
  male_height_cm?: string | null
  height?: DogApiMetric | null
  image?: DogApiImage | null
}

type DogApiLabel = {
  name?: string | null
  breed_name?: string | null
  breed_id?: string | number | null
  id?: string | number | null
}

let breedCatalogCache: {
  expiresAt: number
  source: "dog-api" | "registry-fallback"
  data: DogBreedLookup[]
} | null = null

async function dogApiFetch(path: string, init?: RequestInit) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("THEDOGAPI_API_KEY_NOT_CONFIGURED")
  }

  const headers = new Headers(init?.headers)
  headers.set("x-api-key", apiKey)

  return fetch(`${DOG_API_BASE_URL}${path}`, {
    ...init,
    headers,
    next: { revalidate: 21600 },
  })
}

function parseMetricRange(input?: string | null) {
  const value = String(input || "")
  const values = (value.match(/(\d+(?:\.\d+)?)/g) || []).map(Number).filter(Number.isFinite)
  if (values.length === 0) {
    return { min: null as number | null, max: null as number | null }
  }
  return { min: Math.min(...values), max: Math.max(...values) }
}

function resolveReferenceImageUrl(item: DogApiBreedResponse) {
  if (item?.image?.url) {
    return String(item.image.url)
  }

  if (item?.reference_image_id) {
    return `https://cdn2.thedogapi.com/images/${String(item.reference_image_id)}.jpg`
  }

  return null
}

export type DogBreedLookup = {
  id: string
  name: string
  breedGroup: string | null
  origin: string | null
  temperament: string | null
  description: string | null
  lifeSpan: string | null
  bredFor: string | null
  perfectFor: string | null
  history: string | null
  countryCode: string | null
  weightMinKg: number | null
  weightMaxKg: number | null
  heightReferenceCm: string | null
  heightMinCm: number | null
  heightMaxCm: number | null
  referenceImageUrl: string | null
}

export type DogBreedCatalog = {
  breeds: DogBreedLookup[]
  source: "dog-api" | "registry-fallback"
}

function mapBreedResponse(item: DogApiBreedResponse): DogBreedLookup {
  const weightMetric =
    typeof item?.male_weight_kg === "string"
      ? item.male_weight_kg
      : typeof item?.female_weight_kg === "string"
        ? item.female_weight_kg
        : typeof item?.weight?.metric === "string"
          ? item.weight.metric
          : null

  const { min, max } = parseMetricRange(weightMetric)
  const heightMetric =
    typeof item?.male_height_cm === "string"
      ? item.male_height_cm
      : typeof item?.height?.metric === "string"
        ? item.height.metric
        : null
  const { min: heightMin, max: heightMax } = parseMetricRange(heightMetric)

  return {
    id: String(item?.id || ""),
    name: String(item?.name || "").trim(),
    breedGroup: item?.breed_group ? String(item.breed_group) : null,
    origin: item?.origin ? String(item.origin) : null,
    temperament: item?.temperament ? String(item.temperament) : null,
    description: item?.description ? String(item.description) : null,
    lifeSpan: item?.life_span ? String(item.life_span) : null,
    bredFor: item?.bred_for ? String(item.bred_for) : null,
    perfectFor: item?.perfect_for ? String(item.perfect_for) : null,
    history: item?.history ? String(item.history) : null,
    countryCode: item?.country_code ? String(item.country_code) : null,
    weightMinKg: min,
    weightMaxKg: max,
    heightReferenceCm: heightMetric,
    heightMinCm: heightMin,
    heightMaxCm: heightMax,
    referenceImageUrl: resolveReferenceImageUrl(item),
  }
}

async function fetchRegistryFallbackCatalog() {
  if (breedCatalogCache && Date.now() < breedCatalogCache.expiresAt && breedCatalogCache.source === "registry-fallback") {
    return {
      breeds: breedCatalogCache.data,
      source: breedCatalogCache.source,
    } satisfies DogBreedCatalog
  }

  const data = CURATED_FALLBACK_BREEDS.slice(0, CURATED_FALLBACK_LIMIT)

  breedCatalogCache = {
    expiresAt: Date.now() + BREED_CACHE_TTL,
    source: "registry-fallback",
    data,
  }

  return {
    breeds: data,
    source: "registry-fallback",
  } satisfies DogBreedCatalog
}

async function fetchBreedCatalog() {
  if (breedCatalogCache && Date.now() < breedCatalogCache.expiresAt && breedCatalogCache.source === "dog-api") {
    return breedCatalogCache.data
  }

  const response = await dogApiFetch("/breeds?limit=200")
  if (!response.ok) {
    throw new Error(`DOG_API_LIST_FAILED:${response.status}`)
  }

  const payload = await response.json()
  const data = Array.isArray(payload)
    ? payload.map(mapBreedResponse).filter((item) => item.id && item.name)
    : []

  breedCatalogCache = {
    expiresAt: Date.now() + BREED_CACHE_TTL,
    source: "dog-api",
    data,
  }

  return data
}

export async function getDogBreedCatalog(limit = 18): Promise<DogBreedCatalog> {
  const safeLimit = Math.max(1, Math.min(limit, 200))

  if (!getApiKey()) {
    const fallback = await fetchRegistryFallbackCatalog()
    return {
      source: fallback.source,
      breeds: fallback.breeds.slice(0, safeLimit),
    }
  }

  try {
    const catalog = await fetchBreedCatalog()
    return {
      source: "dog-api",
      breeds: catalog.slice(0, safeLimit),
    }
  } catch (error) {
    console.warn("Falha ao carregar o catalogo principal de racas. Usando fallback do registro.", error)
    const fallback = await fetchRegistryFallbackCatalog()
    return {
      source: fallback.source,
      breeds: fallback.breeds.slice(0, safeLimit),
    }
  }
}

export async function searchDogBreeds(query: string) {
  const q = query.trim()
  if (!q) return []

  const catalog = await getDogBreedCatalog(200)
  return searchBreedCatalog(catalog.breeds, q, 18)
}

export async function listDogBreeds(limit = 18) {
  const catalog = await getDogBreedCatalog(limit)
  return catalog.breeds
}

export async function getDogBreed(breedId: string) {
  const catalog = await getDogBreedCatalog(200)
  const fromCatalog = catalog.breeds.find((breed) => breed.id === String(breedId))
  if (fromCatalog) {
    return fromCatalog
  }

  if (catalog.source !== "dog-api") {
    throw new Error(`DOG_API_BREED_FAILED:${breedId}`)
  }

  const response = await dogApiFetch(`/breeds/${encodeURIComponent(breedId)}`)
  if (!response.ok) {
    throw new Error(`DOG_API_BREED_FAILED:${response.status}`)
  }

  const payload = await response.json()
  return mapBreedResponse(payload)
}

export async function recognizeDogBreedFromImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const uploadResponse = await dogApiFetch("/images/upload-sync", {
    method: "POST",
    body: formData,
  })

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text()
    throw new Error(`DOG_API_UPLOAD_FAILED:${uploadResponse.status}:${text}`)
  }

  const uploadedImage = await uploadResponse.json()
  if (Array.isArray(uploadedImage?.breeds) && uploadedImage.breeds.length > 0) {
    return {
      imageId: String(uploadedImage.id || ""),
      breed: mapBreedResponse(uploadedImage.breeds[0]),
      raw: uploadedImage,
      capability: "INLINE_BREEDS" as const,
    }
  }

  if (!uploadedImage?.id) {
    return { imageId: null, breed: null, raw: uploadedImage, capability: "NO_IMAGE_ID" as const }
  }

  const labelsResponse = await dogApiFetch(`/images/${encodeURIComponent(String(uploadedImage.id))}/labels`)
  if (labelsResponse.status === 403) {
    return { imageId: String(uploadedImage.id), breed: null, raw: uploadedImage, capability: "LABELS_NOT_ENABLED" as const }
  }

  if (!labelsResponse.ok) {
    const text = await labelsResponse.text()
    throw new Error(`DOG_API_LABELS_FAILED:${labelsResponse.status}:${text}`)
  }

  const labelsPayload = await labelsResponse.json()
  const labels = Array.isArray(labelsPayload?.labels)
    ? (labelsPayload.labels as DogApiLabel[])
    : Array.isArray(labelsPayload)
      ? (labelsPayload as DogApiLabel[])
      : []
  const labelCandidate = labels.find((label) => label?.name || label?.breed_name || label?.breed_id) || null

  const breedId = labelCandidate?.breed_id || labelCandidate?.id || null
  const breedName = labelCandidate?.breed_name || labelCandidate?.name || null

  if (breedId) {
    const breed = await getDogBreed(String(breedId))
    return { imageId: String(uploadedImage.id), breed, raw: labelsPayload, capability: "LABELS_ENABLED" as const }
  }

  if (breedName) {
    const matches = await searchDogBreeds(String(breedName))
    return {
      imageId: String(uploadedImage.id),
      breed: matches[0] || null,
      raw: labelsPayload,
      capability: "LABELS_ENABLED" as const,
    }
  }

  return { imageId: String(uploadedImage.id), breed: null, raw: labelsPayload, capability: "LABELS_ENABLED" as const }
}
export async function getDogBreedById(id: string): Promise<DogBreedLookup> {
  const res = await fetch(`https://api.thedogapi.com/v1/breeds/${id}`, {
    headers: { "x-api-key": process.env.DOG_API_KEY! },
  });
  if (!res.ok) throw new Error("Raça não encontrada");
  return res.json();
}