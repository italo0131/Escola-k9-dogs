export const DOG_SIZE_OPTIONS = ["MINI", "PEQUENO", "MEDIO", "GRANDE", "GIGANTE"] as const
export const DOG_GENDER_OPTIONS = ["MACHO", "FEMEA"] as const
export const DOG_ENERGY_LEVEL_OPTIONS = ["BAIXA", "MEDIA", "ALTA"] as const
export const DOG_ACTIVITY_PROFILE_OPTIONS = ["COMPANION", "ATHLETE", "WORKING", "RECOVERY"] as const
export const DOG_SPORT_FOCUS_OPTIONS = [
  "AGILITY",
  "CANICROSS",
  "PASTOREIO",
  "OBEDIENCIA",
  "DISC_DOG",
  "TRILHA",
  "NADO",
  "FARO",
  "MONDIORING",
  "RECUPERACAO",
] as const

function normalizeText(input: unknown, maxLength = 160) {
  const value = String(input ?? "").trim().replace(/\s+/g, " ")
  return value ? value.slice(0, maxLength) : null
}

function normalizeLongText(input: unknown, maxLength = 1200) {
  const value = String(input ?? "").trim()
  return value ? value.slice(0, maxLength) : null
}

function normalizeInteger(input: unknown, min = 0, max = Number.POSITIVE_INFINITY) {
  if (input === null || input === undefined || input === "") return null
  const parsed = Number(input)
  if (!Number.isFinite(parsed)) return null
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function normalizeFloat(input: unknown) {
  if (input === null || input === undefined || input === "") return null
  const parsed = Number(input)
  return Number.isFinite(parsed) ? Math.max(0, Number(parsed.toFixed(1))) : null
}

function normalizeDate(input: unknown) {
  if (!input) return null
  const date = new Date(String(input))
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeBoolean(input: unknown) {
  return input === true || input === "true" || input === "on" || input === 1 || input === "1"
}

export function getActivityProfileLabel(value?: string | null) {
  const profile = String(value || "COMPANION").toUpperCase()
  if (profile === "ATHLETE") return "Atleta"
  if (profile === "WORKING") return "Trabalho"
  if (profile === "RECOVERY") return "Recuperacao"
  return "Companhia"
}

export function getSportFocusLabel(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function estimateDogSize(weightMinKg?: number | null, weightMaxKg?: number | null) {
  const values = [weightMinKg, weightMaxKg].filter((value): value is number => typeof value === "number")
  if (!values.length) return null
  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  if (average <= 4) return "MINI"
  if (average <= 10) return "PEQUENO"
  if (average <= 25) return "MEDIO"
  if (average <= 45) return "GRANDE"
  return "GIGANTE"
}

export function buildDogPayload(data: Record<string, unknown>, ownerId: string) {
  return {
    name: String(data.name || "").trim(),
    breed: String(data.breed || "").trim(),
    breedApiId: normalizeText(data.breedApiId, 40),
    breedGroup: normalizeText(data.breedGroup, 80),
    breedOrigin: normalizeText(data.breedOrigin, 120),
    breedTemperament: normalizeLongText(data.breedTemperament, 300),
    breedDescription: normalizeLongText(data.breedDescription, 800),
    breedLifeSpan: normalizeText(data.breedLifeSpan, 40),
    breedWeightMinKg: normalizeFloat(data.breedWeightMinKg),
    breedWeightMaxKg: normalizeFloat(data.breedWeightMaxKg),
    breedHeightReferenceCm: normalizeText(data.breedHeightReferenceCm, 80),
    breedReferenceImageUrl: normalizeText(data.breedReferenceImageUrl, 500),
    age: Math.max(0, Number(data.age) || 0),
    ownerId,
    size: normalizeText(data.size, 20),
    weightKg: normalizeFloat(data.weightKg),
    gender: normalizeText(data.gender, 20),
    color: normalizeText(data.color, 60),
    birthDate: normalizeDate(data.birthDate),
    foodName: normalizeText(data.foodName, 120),
    mealsPerDay: normalizeInteger(data.mealsPerDay),
    portionSize: normalizeText(data.portionSize, 80),
    feedingTimes: normalizeText(data.feedingTimes, 160),
    allergies: normalizeLongText(data.allergies, 300),
    medications: normalizeLongText(data.medications, 300),
    healthNotes: normalizeLongText(data.healthNotes, 800),
    behaviorNotes: normalizeLongText(data.behaviorNotes, 800),
    energyLevel: normalizeText(data.energyLevel, 20),
    activityProfile: normalizeText(data.activityProfile, 20) || "COMPANION",
    sportFocus: normalizeText(data.sportFocus, 40),
    dailyExerciseGoalMinutes: normalizeInteger(data.dailyExerciseGoalMinutes),
    weeklyConditioningSessions: normalizeInteger(data.weeklyConditioningSessions),
    bodyConditionScore: normalizeInteger(data.bodyConditionScore, 1, 9),
    restingHeartRateBpm: normalizeInteger(data.restingHeartRateBpm),
    athleteClearance: normalizeBoolean(data.athleteClearance),
    lastVetCheckupAt: normalizeDate(data.lastVetCheckupAt),
    hydrationPlan: normalizeLongText(data.hydrationPlan, 500),
    supplements: normalizeLongText(data.supplements, 500),
    injuryHistory: normalizeLongText(data.injuryHistory, 600),
    veterinaryRestrictions: normalizeLongText(data.veterinaryRestrictions, 600),
    recoveryNotes: normalizeLongText(data.recoveryNotes, 600),
    performanceGoals: normalizeLongText(data.performanceGoals, 600),
    vaccinated: normalizeBoolean(data.vaccinated),
    neutered: normalizeBoolean(data.neutered),
  }
}

type DogSummaryLike = {
  foodName?: string | null
  mealsPerDay?: number | null
  portionSize?: string | null
  feedingTimes?: string | null
  weightKg?: number | null
  size?: string | null
  vaccinated?: boolean | null
  neutered?: boolean | null
  allergies?: string | null
  breedGroup?: string | null
  bodyConditionScore?: number | null
  activityProfile?: string | null
  sportFocus?: string | null
  dailyExerciseGoalMinutes?: number | null
  weeklyConditioningSessions?: number | null
  athleteClearance?: boolean | null
  restingHeartRateBpm?: number | null
  breedWeightMinKg?: number | null
  breedWeightMaxKg?: number | null
}

export function formatDogFeedingSummary(dog: DogSummaryLike) {
  const parts = [dog.foodName, dog.mealsPerDay ? `${dog.mealsPerDay}x ao dia` : null, dog.portionSize, dog.feedingTimes]
    .filter(Boolean)
    .join(" • ")
  return parts || "Rotina alimentar ainda nao cadastrada."
}

export function formatDogHealthSummary(dog: DogSummaryLike) {
  const targetWeight =
    typeof dog.breedWeightMinKg === "number" || typeof dog.breedWeightMaxKg === "number"
      ? `alvo ${dog.breedWeightMinKg || "?"}-${dog.breedWeightMaxKg || "?"} kg`
      : null

  const flags = [
    dog.weightKg ? `${dog.weightKg} kg` : null,
    dog.size ? `porte ${String(dog.size).toLowerCase()}` : null,
    dog.breedGroup ? `grupo ${String(dog.breedGroup).toLowerCase()}` : null,
    dog.vaccinated ? "vacinas em dia" : "vacinas pendentes",
    dog.neutered ? "castrado" : null,
    targetWeight,
    dog.allergies ? "com alergias registradas" : null,
  ]
    .filter(Boolean)
    .join(" • ")

  return flags || "Ficha de saude em construcao."
}

export function formatDogAthleteSummary(dog: DogSummaryLike) {
  const parts = [
    getActivityProfileLabel(dog.activityProfile),
    dog.sportFocus ? getSportFocusLabel(dog.sportFocus) : null,
    dog.dailyExerciseGoalMinutes ? `${dog.dailyExerciseGoalMinutes} min/dia` : null,
    dog.weeklyConditioningSessions ? `${dog.weeklyConditioningSessions} sessoes/semana` : null,
    dog.bodyConditionScore ? `BCS ${dog.bodyConditionScore}/9` : null,
    dog.restingHeartRateBpm ? `${dog.restingHeartRateBpm} bpm repouso` : null,
    dog.athleteClearance ? "liberado para esporte" : null,
  ]
    .filter(Boolean)
    .join(" • ")

  return parts || "Perfil atletico ainda nao configurado."
}
