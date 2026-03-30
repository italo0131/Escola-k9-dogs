import type { BreedStudyProfile } from "@/lib/breed-study"

export const BREED_LIFESTYLE_OPTIONS = {
  livingSpace: [
    { value: "APARTAMENTO", label: "Apartamento" },
    { value: "CASA_COMPACTA", label: "Casa compacta" },
    { value: "CASA_COM_QUINTAL", label: "Casa com quintal" },
    { value: "AREA_ABERTA", label: "Area aberta / chacara" },
  ],
  routine: [
    { value: "LEVE", label: "Rotina leve" },
    { value: "MODERADA", label: "Rotina moderada" },
    { value: "INTENSA", label: "Rotina intensa" },
  ],
  experience: [
    { value: "PRIMEIRO_CAO", label: "Primeiro cao" },
    { value: "INTERMEDIARIO", label: "Ja tive outros caes" },
    { value: "EXPERIENTE", label: "Tenho experiencia forte" },
  ],
  goal: [
    { value: "COMPANHIA", label: "Companhia" },
    { value: "FAMILIA", label: "Rotina de familia" },
    { value: "OBEDIENCIA", label: "Obediencia e foco" },
    { value: "ESPORTE", label: "Esporte e performance" },
    { value: "GUARDA", label: "Guarda e vigilancia" },
  ],
  trainingTime: [
    { value: "CURTO", label: "Pouco tempo" },
    { value: "MEDIO", label: "Tempo moderado" },
    { value: "LONGO", label: "Bom tempo diario" },
  ],
  activityLevel: [
    { value: "BAIXA", label: "Baixa" },
    { value: "MEDIA", label: "Media" },
    { value: "ALTA", label: "Alta" },
  ],
  sizePreference: [
    { value: "QUALQUER", label: "Sem preferencia" },
    { value: "MINI", label: "Mini" },
    { value: "PEQUENO", label: "Pequeno" },
    { value: "MEDIO", label: "Medio" },
    { value: "GRANDE", label: "Grande ou gigante" },
  ],
  energyPreference: [
    { value: "QUALQUER", label: "Sem preferencia" },
    { value: "BAIXA", label: "Baixa" },
    { value: "MEDIA", label: "Media" },
    { value: "ALTA", label: "Alta" },
  ],
} as const

export type BreedLifestyleForm = {
  livingSpace: (typeof BREED_LIFESTYLE_OPTIONS.livingSpace)[number]["value"]
  routine: (typeof BREED_LIFESTYLE_OPTIONS.routine)[number]["value"]
  experience: (typeof BREED_LIFESTYLE_OPTIONS.experience)[number]["value"]
  goal: (typeof BREED_LIFESTYLE_OPTIONS.goal)[number]["value"]
  trainingTime: (typeof BREED_LIFESTYLE_OPTIONS.trainingTime)[number]["value"]
  activityLevel: (typeof BREED_LIFESTYLE_OPTIONS.activityLevel)[number]["value"]
  sizePreference: (typeof BREED_LIFESTYLE_OPTIONS.sizePreference)[number]["value"]
  energyPreference: (typeof BREED_LIFESTYLE_OPTIONS.energyPreference)[number]["value"]
  kids: boolean
  otherPets: boolean
  notes: string
}

export type BreedMatchResult = {
  score: number
  label: string
  summary: string
  strengths: string[]
  cautions: string[]
  dimensions: Array<{
    id: "space" | "routine" | "guidance" | "goal" | "social"
    label: string
    score: number
    description: string
  }>
}

export const DEFAULT_BREED_LIFESTYLE: BreedLifestyleForm = {
  livingSpace: "CASA_COMPACTA",
  routine: "MODERADA",
  experience: "INTERMEDIARIO",
  goal: "COMPANHIA",
  trainingTime: "MEDIO",
  activityLevel: "MEDIA",
  sizePreference: "QUALQUER",
  energyPreference: "QUALQUER",
  kids: false,
  otherPets: false,
  notes: "",
}

function normalize(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function clamp(value: number, min = 20, max = 98) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function describeDimension(score: number) {
  if (score >= 85) return "Muito favoravel para este contexto."
  if (score >= 72) return "Bom encaixe para a rotina informada."
  if (score >= 58) return "Funciona com manejo consciente."
  return "Pede mais criterio antes de decidir."
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    return value === "true" || value === "1"
  }
  return fallback
}

function pickOptionValue<T extends readonly { value: string }[]>(
  options: T,
  value: unknown,
  fallback: T[number]["value"],
): T[number]["value"] {
  const candidate = String(value || "")
  return options.some((option) => option.value === candidate) ? (candidate as T[number]["value"]) : fallback
}

export function normalizeBreedLifestyleForm(input?: Partial<BreedLifestyleForm> | null): BreedLifestyleForm {
  return {
    livingSpace: pickOptionValue(BREED_LIFESTYLE_OPTIONS.livingSpace, input?.livingSpace, DEFAULT_BREED_LIFESTYLE.livingSpace),
    routine: pickOptionValue(BREED_LIFESTYLE_OPTIONS.routine, input?.routine, DEFAULT_BREED_LIFESTYLE.routine),
    experience: pickOptionValue(BREED_LIFESTYLE_OPTIONS.experience, input?.experience, DEFAULT_BREED_LIFESTYLE.experience),
    goal: pickOptionValue(BREED_LIFESTYLE_OPTIONS.goal, input?.goal, DEFAULT_BREED_LIFESTYLE.goal),
    trainingTime: pickOptionValue(BREED_LIFESTYLE_OPTIONS.trainingTime, input?.trainingTime, DEFAULT_BREED_LIFESTYLE.trainingTime),
    activityLevel: pickOptionValue(BREED_LIFESTYLE_OPTIONS.activityLevel, input?.activityLevel, DEFAULT_BREED_LIFESTYLE.activityLevel),
    sizePreference: pickOptionValue(BREED_LIFESTYLE_OPTIONS.sizePreference, input?.sizePreference, DEFAULT_BREED_LIFESTYLE.sizePreference),
    energyPreference: pickOptionValue(BREED_LIFESTYLE_OPTIONS.energyPreference, input?.energyPreference, DEFAULT_BREED_LIFESTYLE.energyPreference),
    kids: parseBoolean(input?.kids, DEFAULT_BREED_LIFESTYLE.kids),
    otherPets: parseBoolean(input?.otherPets, DEFAULT_BREED_LIFESTYLE.otherPets),
    notes: String(input?.notes || "").trim().slice(0, 500),
  }
}

function matchesSizePreference(sizePreference: BreedLifestyleForm["sizePreference"], size: string) {
  if (sizePreference === "QUALQUER") return true
  if (sizePreference === "GRANDE") return size === "grande" || size === "gigante"
  return normalize(sizePreference) === size
}

function matchesEnergyPreference(energyPreference: BreedLifestyleForm["energyPreference"], energy: number) {
  if (energyPreference === "QUALQUER") return true
  if (energyPreference === "BAIXA") return energy <= 2
  if (energyPreference === "MEDIA") return energy >= 2 && energy <= 4
  return energy >= 4
}

export function scoreBreedMatch(profile: BreedStudyProfile, formInput: BreedLifestyleForm): BreedMatchResult {
  const lifestyle = normalizeBreedLifestyleForm(formInput)
  const dimensionScores = {
    space: 60,
    routine: 60,
    guidance: 60,
    goal: 60,
    social: 60,
  }
  const strengths: string[] = []
  const cautions: string[] = []
  const group = normalize(profile.breed.breedGroup)
  const size = normalize(profile.sizeLabel)
  const energy = profile.energy.score
  const trainability = profile.trainability.score
  const sociability = profile.sociability.score

  if (lifestyle.livingSpace === "APARTAMENTO") {
    if (size === "mini" || size === "pequeno") {
      dimensionScores.space += 12
      strengths.push("o porte tende a encaixar melhor em rotina de apartamento")
    } else if (size === "grande" || size === "gigante") {
      dimensionScores.space -= 14
      cautions.push("o porte pede manejo de espaco e rotina mais disciplinados")
    }
    if (energy >= 4) {
      dimensionScores.space -= 10
      dimensionScores.routine -= 6
      cautions.push("a energia alta costuma pesar mais em espacos compactos")
    }
  }

  if (lifestyle.livingSpace === "CASA_COM_QUINTAL" || lifestyle.livingSpace === "AREA_ABERTA") {
    if (size === "grande" || size === "gigante") {
      dimensionScores.space += 8
      strengths.push("o espaco favorece melhor o manejo de um cao maior")
    }
    if (energy >= 4) {
      dimensionScores.space += 8
      dimensionScores.routine += 6
      strengths.push("o ambiente ajuda a absorver melhor a energia da raca")
    }
  }

  if (lifestyle.routine === "LEVE") {
    if (energy <= 2) {
      dimensionScores.routine += 12
      strengths.push("a energia tende a combinar com uma rotina mais leve")
    } else if (energy >= 4) {
      dimensionScores.routine -= 18
      cautions.push("a rotina leve pode deixar essa raca subestimulada")
    }
  }

  if (lifestyle.routine === "MODERADA") {
    if (energy >= 2 && energy <= 4) {
      dimensionScores.routine += 8
      strengths.push("a demanda de rotina tende a ficar em uma faixa administravel")
    }
  }

  if (lifestyle.routine === "INTENSA") {
    if (energy >= 4) {
      dimensionScores.routine += 14
      strengths.push("a raca costuma aproveitar bem uma rotina forte e constante")
    } else if (energy <= 2) {
      dimensionScores.routine -= 6
      cautions.push("o perfil pode pedir menos volume do que voce imagina")
    }
  }

  if (lifestyle.trainingTime === "CURTO") {
    if (energy >= 4 || trainability <= 2) {
      dimensionScores.guidance -= 10
      dimensionScores.routine -= 6
      cautions.push("com pouco tempo diario, o manejo pode apertar rapido")
    }
  }

  if (lifestyle.trainingTime === "LONGO") {
    dimensionScores.guidance += 6
    if (trainability >= 4 || energy >= 4) {
      strengths.push("o tempo disponivel ajuda a extrair melhor o potencial da raca")
    }
  }

  if (lifestyle.activityLevel === "BAIXA") {
    if (energy >= 4) {
      dimensionScores.routine -= 10
      cautions.push("seu nivel de atividade parece abaixo do que a raca costuma pedir")
    }
  }

  if (lifestyle.activityLevel === "ALTA") {
    if (energy >= 4) {
      dimensionScores.routine += 8
      strengths.push("seu ritmo ajuda a sustentar um perfil mais intenso")
    } else if (energy <= 2) {
      dimensionScores.goal -= 4
      cautions.push("voce pode preferir um perfil com mais disposicao para acompanhar sua rotina")
    }
  }

  if (lifestyle.experience === "PRIMEIRO_CAO") {
    if (trainability >= 4) {
      dimensionScores.guidance += 10
      strengths.push("a resposta ao treino tende a facilitar o primeiro ciclo de aprendizado")
    } else if (trainability <= 2) {
      dimensionScores.guidance -= 14
      cautions.push("para primeiro cao, a conducao pode ficar mais exigente")
    }
  }

  if (lifestyle.experience === "EXPERIENTE") {
    if (trainability <= 2 || group === "working" || group === "terrier" || group === "hound") {
      dimensionScores.guidance += 8
      strengths.push("sua experiencia pode ajudar em um perfil que pede criterio")
    }
  }

  if (lifestyle.goal === "COMPANHIA") {
    if (sociability >= 4) {
      dimensionScores.goal += 12
      dimensionScores.social += 6
      strengths.push("o perfil social ajuda bastante no papel de companhia")
    }
    if (energy <= 3) {
      dimensionScores.goal += 6
      strengths.push("a energia tende a ser mais facil de sustentar no cotidiano")
    }
  }

  if (lifestyle.goal === "FAMILIA") {
    if (sociability >= 4) {
      dimensionScores.goal += 12
      dimensionScores.social += 8
      strengths.push("a sociabilidade costuma combinar bem com rotina de familia")
    } else if (sociability <= 2) {
      dimensionScores.goal -= 10
      dimensionScores.social -= 8
      cautions.push("a convivencia costuma exigir socializacao mais caprichada")
    }
  }

  if (lifestyle.goal === "OBEDIENCIA") {
    if (trainability >= 4) {
      dimensionScores.goal += 14
      dimensionScores.guidance += 6
      strengths.push("tem boa base para obediencia funcional e progresso de treino")
    } else {
      dimensionScores.goal -= 4
      cautions.push("o foco em obediencia pode exigir mais repeticao e ambiente controlado")
    }
  }

  if (lifestyle.goal === "ESPORTE") {
    if (energy >= 4) {
      dimensionScores.goal += 14
      dimensionScores.routine += 6
      strengths.push("o nivel de energia favorece um projeto mais esportivo")
    }
    if (group === "herding" || group === "sporting" || group === "working") {
      dimensionScores.goal += 10
      strengths.push("o grupo funcional tem afinidade com atividade, funcao e performance")
    } else {
      dimensionScores.goal -= 4
      cautions.push("vale validar se o objetivo esportivo respeita a vocacao da raca")
    }
  }

  if (lifestyle.goal === "GUARDA") {
    if (group === "working" || group === "herding") {
      dimensionScores.goal += 10
      strengths.push("o grupo funcional costuma lidar melhor com vigilancia e controle")
    }
    if (sociability <= 2) {
      dimensionScores.social -= 6
      cautions.push("reserva social pede socializacao muito bem conduzida para nao virar problema")
    }
  }

  if (lifestyle.kids) {
    if (sociability >= 4) {
      dimensionScores.social += 8
      strengths.push("a sociabilidade favorece uma casa com mais interacao")
    } else {
      dimensionScores.social -= 6
      cautions.push("crianca + raca mais reservada pedem supervisao e rotina muito claras")
    }
  }

  if (lifestyle.otherPets) {
    if (sociability >= 4) {
      dimensionScores.social += 6
      strengths.push("tende a ter uma base melhor para convivencia com outros animais")
    } else {
      dimensionScores.social -= 6
      cautions.push("a convivencia com outros pets pode exigir apresentacao bem estruturada")
    }
  }

  if (matchesSizePreference(lifestyle.sizePreference, size)) {
    dimensionScores.goal += 4
  } else {
    dimensionScores.goal -= 6
    cautions.push("o porte foge um pouco da preferencia que voce declarou")
  }

  if (matchesEnergyPreference(lifestyle.energyPreference, energy)) {
    dimensionScores.routine += 4
  } else if (lifestyle.energyPreference !== "QUALQUER") {
    dimensionScores.routine -= 6
    cautions.push("a energia parece distante do que voce disse querer no dia a dia")
  }

  const rawDimensions: BreedMatchResult["dimensions"] = [
    { id: "space", label: "Espaco", score: clamp(dimensionScores.space), description: "" },
    { id: "routine", label: "Rotina", score: clamp(dimensionScores.routine), description: "" },
    { id: "guidance", label: "Conducao", score: clamp(dimensionScores.guidance), description: "" },
    { id: "goal", label: "Objetivo", score: clamp(dimensionScores.goal), description: "" },
    { id: "social", label: "Convivencia", score: clamp(dimensionScores.social), description: "" },
  ]

  const dimensions: BreedMatchResult["dimensions"] = rawDimensions.map((dimension) => ({
    ...dimension,
    description: describeDimension(dimension.score),
  }))

  const score = clamp(
    dimensions.reduce((total, item) => total + item.score, 0) / dimensions.length +
      (strengths.length > cautions.length ? 2 : cautions.length > strengths.length ? -2 : 0),
  )

  const label =
    score >= 85 ? "Encaixe forte" : score >= 72 ? "Bom encaixe" : score >= 58 ? "Encaixe com criterio" : "Exige cautela"

  const summary =
    label === "Encaixe forte"
      ? "Os sinais gerais desta raca combinam bem com o contexto que voce descreveu."
      : label === "Bom encaixe"
        ? "Ha bastante aderencia, mas alguns pontos vao depender da rotina e da conducao."
        : label === "Encaixe com criterio"
          ? "Pode funcionar, desde que voce aceite o manejo e os pontos de atencao do perfil."
          : "Antes de decidir, vale comparar com racas de energia, porte ou resposta ao treino mais favoraveis."

  return {
    score,
    label,
    summary,
    strengths: unique(strengths).slice(0, 5),
    cautions: unique(cautions.length ? cautions : profile.attentionPoints).slice(0, 5),
    dimensions,
  }
}
