import type { Breed } from "@/types/breeds"

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24

const API_BASE = "https://registry.dog/api/v1"

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const cached = cache.get(url)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "K9-Training-Platform/1.0" },
  })

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`)
  }

  const result = (await response.json()) as { data: T }
  const data = result.data

  cache.set(url, { data, timestamp: Date.now() })

  return data
}

export async function listAllBreeds(): Promise<Array<{ id: string; name: string }>> {
  return fetchFromAPI("/breeds")
}

export async function getBreed(identifier: string): Promise<Breed> {
  return fetchFromAPI(`/breeds/${encodeURIComponent(identifier)}`)
}

export async function searchBreeds(query: string): Promise<Breed[]> {
  const all = await listAllBreeds()
  const normalizedQuery = normalizeText(query)
  const matched = all
    .filter((breed) => normalizeText(breed.name).includes(normalizedQuery))
    .sort((left, right) => {
      const leftName = normalizeText(left.name)
      const rightName = normalizeText(right.name)
      const leftStarts = leftName.startsWith(normalizedQuery) ? 1 : 0
      const rightStarts = rightName.startsWith(normalizedQuery) ? 1 : 0
      if (leftStarts !== rightStarts) return rightStarts - leftStarts
      return leftName.localeCompare(rightName)
    })

  const breeds = await Promise.all(matched.slice(0, 18).map((breed) => getBreed(breed.id)))
  return breeds
}

export async function getPopularBreeds(limit = 18): Promise<Breed[]> {
  const popularIds = [
    "border-collie",
    "labrador-retriever",
    "golden-retriever",
    "german-shepherd",
    "shih-tzu",
    "belgian-malinois",
    "poodle",
    "bulldog",
    "beagle",
    "rottweiler",
    "yorkshire-terrier",
    "dachshund",
    "siberian-husky",
    "great-dane",
    "doberman",
    "cavalier-king-charles-spaniel",
    "pug",
    "chihuahua",
  ]

  const breeds = await Promise.all(popularIds.slice(0, limit).map((id) => getBreed(id)))
  return breeds
}
