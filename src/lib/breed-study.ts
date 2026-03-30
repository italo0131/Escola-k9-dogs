import type { DogBreedLookup } from "@/lib/thedogapi"

export const BREED_GROUP_OPTIONS = [
  { value: "Herding", label: "Pastoreio" },
  { value: "Working", label: "Trabalho" },
  { value: "Sporting", label: "Esporte e aporte" },
  { value: "Hound", label: "Caca e faro" },
  { value: "Terrier", label: "Terrier" },
  { value: "Toy", label: "Companhia de pequeno porte" },
  { value: "Non-Sporting", label: "Companhia e utilidade" },
  { value: "Mixed", label: "Sem grupo definido" },
] as const

const BREED_GROUP_LABELS = Object.fromEntries(BREED_GROUP_OPTIONS.map((item) => [normalizeText(item.value), item.label]))

const TEMPERAMENT_LABELS: Record<string, string> = {
  active: "Ativo",
  adaptable: "Adaptavel",
  adventurous: "Aventureiro",
  affectionate: "Carinhoso",
  agile: "Agil",
  alert: "Alerta",
  aloof: "Reservado",
  amiable: "Amavel",
  assertive: "Assertivo",
  athletic: "Atletico",
  attentive: "Atento",
  balanced: "Equilibrado",
  bold: "Corajoso",
  brave: "Valente",
  calm: "Calmo",
  catlike: "Felino",
  charming: "Charmoso",
  cheerful: "Alegre",
  clever: "Esperto",
  clownish: "Brincalhao",
  companionable: "Companheiro",
  composed: "Composto",
  confident: "Confiante",
  courageous: "Corajoso",
  curious: "Curioso",
  dependable: "Confiavel",
  determined: "Determinado",
  devoted: "Dedicado",
  dignified: "Digno",
  docile: "Docil",
  dominant: "Dominante",
  eager: "Disposto",
  "eager to please": "Disposto a agradar",
  easygoing: "Tranquilo",
  "easy going": "Tranquilo",
  energetic: "Energetico",
  eventempered: "Equilibrado",
  "even tempered": "Equilibrado",
  excitable: "Reativo",
  extroverted: "Extrovertido",
  faithful: "Fiel",
  fearless: "Destemido",
  fierce: "Forte",
  friendly: "Amigavel",
  "fun loving": "Divertido",
  "fun-loving": "Divertido",
  game: "Persistente",
  gentle: "Gentil",
  goodnatured: "Bem-humorado",
  "good natured": "Bem-humorado",
  happy: "Feliz",
  hardworking: "Trabalhador",
  "hard working": "Trabalhador",
  independent: "Independente",
  intelligent: "Inteligente",
  kind: "Bondoso",
  lively: "Vivo",
  loving: "Amoroso",
  loyal: "Leal",
  obedient: "Obediente",
  outgoing: "Sociavel",
  patient: "Paciente",
  playful: "Brincalhao",
  powerful: "Poderoso",
  protective: "Protetor",
  quick: "Rapido",
  quiet: "Quieto",
  receptive: "Receptivo",
  reliable: "Confiavel",
  reserved: "Reservado",
  responsive: "Responsivo",
  selfsured: "Seguro de si",
  "self assured": "Seguro de si",
  selfassured: "Seguro de si",
  sensitive: "Sensivel",
  sociable: "Sociavel",
  spirited: "Vibrante",
  stable: "Estavel",
  steadfast: "Firme",
  steady: "Estavel",
  stubborn: "Teimoso",
  strong: "Forte",
  "strong willed": "Forte de vontade",
  strongwilled: "Forte de vontade",
  sweettempered: "Temperamento doce",
  "sweet tempered": "Temperamento doce",
  tenacious: "Tenaz",
  territorial: "Territorial",
  trainable: "Treinavel",
  trusting: "Confiado",
  vigilant: "Vigilante",
  watchful: "Observador",
  wild: "Instintivo",
}

type StudyMeter = {
  label: string
  description: string
  score: number
}

export type BreedStudyHighlight = {
  title: string
  description: string
}

export type BreedStudyProfile = {
  breed: DogBreedLookup
  groupLabel: string
  sizeLabel: string
  weightLabel: string
  heightLabel: string
  lifeSpanLabel: string
  temperamentLabel: string | null
  summary: string
  historicalRole: string
  idealRoutine: string
  trainingFocus: string
  tutorProfile: string
  attentionPoints: string[]
  studyHighlights: BreedStudyHighlight[]
  energy: StudyMeter
  trainability: StudyMeter
  sociability: StudyMeter
}

export function translateBreedGroup(group?: string | null) {
  const normalized = normalizeText(group || "")
  return BREED_GROUP_LABELS[normalized] || (group ? group : "Sem grupo definido")
}

export function isBreedFromGroup(breed: DogBreedLookup, group?: string | null) {
  if (!group) return true
  return normalizeText(breed.breedGroup || "") === normalizeText(group)
}

export function buildBreedStudyProfile(breed: DogBreedLookup): BreedStudyProfile {
  const traits = splitTraits(breed.temperament)
  const groupLabel = translateBreedGroup(breed.breedGroup)
  const sizeLabel = getSizeLabel(breed)
  const energy = getEnergyMeter(breed, traits)
  const trainability = getTrainabilityMeter(breed, traits)
  const sociability = getSociabilityMeter(breed, traits)

  return {
    breed,
    groupLabel,
    sizeLabel,
    weightLabel: formatRangeLabel(breed.weightMinKg, breed.weightMaxKg, "kg"),
    heightLabel: formatRangeLabel(breed.heightMinCm, breed.heightMaxCm, "cm"),
    lifeSpanLabel: formatLifeSpan(breed.lifeSpan),
    temperamentLabel: translateTemperamentList(breed.temperament),
    summary: buildSummary(breed, groupLabel, sizeLabel, energy),
    historicalRole: buildHistoricalRole(breed),
    idealRoutine: buildIdealRoutine(breed, groupLabel, energy),
    trainingFocus: buildTrainingFocus(breed, groupLabel, trainability),
    tutorProfile: buildTutorProfile(breed, sizeLabel, energy),
    attentionPoints: buildAttentionPoints(breed, sizeLabel, energy, trainability, sociability),
    studyHighlights: buildStudyHighlights(groupLabel, sizeLabel, energy, trainability, sociability),
    energy,
    trainability,
    sociability,
  }
}

function buildSummary(breed: DogBreedLookup, groupLabel: string, sizeLabel: string, energy: StudyMeter) {
  const origin = breed.origin ? ` com origem em ${breed.origin}` : ""
  const lifeSpan = breed.lifeSpan ? ` Costuma viver por cerca de ${formatLifeSpan(breed.lifeSpan).toLowerCase()}.` : ""
  const groupText = groupLabel !== "Sem grupo definido" ? ` do grupo ${groupLabel.toLowerCase()}` : ""
  return `${breed.name} e uma raca${groupText}${origin}, geralmente de porte ${sizeLabel.toLowerCase()} e com nivel de energia ${energy.label.toLowerCase()}.${lifeSpan}`
}

function buildHistoricalRole(breed: DogBreedLookup) {
  const origin = breed.origin ? ` em ${breed.origin}` : ""
  const functionHint = normalizeText(`${breed.bredFor || ""} ${breed.perfectFor || ""}`)

  if (functionHint.includes("herd")) return `Historicamente ligada ao pastoreio e ao manejo de rebanhos${origin}.`
  if (functionHint.includes("retrieve")) return `Historicamente ligada a atividades de aporte e recuperacao${origin}.`
  if (functionHint.includes("guard")) return `Historicamente ligada a guarda, vigilancia e protecao${origin}.`
  if (functionHint.includes("hunt")) return `Historicamente ligada a atividades de caca${origin}.`
  if (functionHint.includes("scent")) return `Historicamente ligada ao faro e a buscas guiadas por cheiro${origin}.`
  if (functionHint.includes("rat")) return `Historicamente ligada ao controle de pequenos animais e pragas${origin}.`
  if (functionHint.includes("companion")) return `Historicamente ligada a convivencia proxima com pessoas${origin}.`
  if (functionHint.includes("sled")) return `Historicamente ligada a tracao e trabalho em clima frio${origin}.`

  const group = normalizeText(breed.breedGroup || "")
  if (group === "herding") return `Tradicionalmente associada a trabalho com rebanhos, foco e resposta rapida a comandos${origin}.`
  if (group === "working") return `Tradicionalmente associada a tarefas de guarda, servico ou trabalho com mais exigencia fisica${origin}.`
  if (group === "sporting") return `Tradicionalmente associada a atividades de campo, busca e aporte${origin}.`
  if (group === "hound") return `Tradicionalmente associada a atividades de caca, perseguicao ou trabalho de faro${origin}.`
  if (group === "terrier") return `Tradicionalmente associada a coragem, iniciativa e controle de pequenos animais${origin}.`
  if (group === "toy") return `Tradicionalmente associada a convivencia proxima, companhia e adaptacao a rotina da familia${origin}.`
  if (group === "non sporting") return `Tem perfil historico mais variado, com funcoes que mudam bastante entre as linhagens${origin}.`

  return origin ? `Tem uma base historica vinculada ao desenvolvimento da raca${origin}.` : "Tem uma base historica diversa, sem um grupo funcional claramente dominante."
}

function buildIdealRoutine(breed: DogBreedLookup, groupLabel: string, energy: StudyMeter) {
  const group = normalizeText(breed.breedGroup || "")

  if (group === "herding") {
    return "Costuma evoluir melhor com passeios consistentes, desafio mental diario, comandos de autocontrole e tarefas com objetivo."
  }
  if (group === "sporting") {
    return "Costuma responder bem a rotina com exercicio moderado a alto, brincadeiras de busca, repeticoes curtas e boa interacao com o tutor."
  }
  if (group === "working") {
    return "Vai melhor com rotina estruturada, regras claras, gasto fisico de qualidade e atividades que deem funcao ao cao."
  }
  if (group === "hound") {
    return "Tende a aproveitar melhor passeios ricos em cheiro, treino de foco, controle de impulsos e exploracao guiada."
  }
  if (group === "terrier") {
    return "Costuma ir melhor com sessoes curtas, variadas, limites claros e atividades que direcionem energia e iniciativa."
  }
  if (group === "toy") {
    return "Mesmo em porte pequeno, costuma precisar de passeios regulares, treino funcional e convivencia ativa com a familia."
  }
  if (group === "non sporting") {
    return "Ajuste a rotina observando o individuo, mas mantenha constancia, socializacao e treino simples dentro do cotidiano."
  }

  if (energy.score >= 4) {
    return `Como costuma ter energia ${energy.label.toLowerCase()}, o ideal e oferecer gasto fisico diario, estimulo mental e previsibilidade na rotina.`
  }
  if (energy.score <= 2) {
    return "Geralmente se beneficia de rotina equilibrada, passeios regulares, treinos curtos e boa qualidade de descanso."
  }
  return `A tendencia e responder bem a uma rotina estavel, com treino frequente, socializacao e atividade proporcional ao grupo ${groupLabel.toLowerCase()}.`
}

function buildTrainingFocus(breed: DogBreedLookup, groupLabel: string, trainability: StudyMeter) {
  const group = normalizeText(breed.breedGroup || "")

  if (group === "herding") {
    return "Foque em autocontrole, redirecionamento de energia, obediencia funcional e tarefas que exijam concentracao."
  }
  if (group === "sporting") {
    return "Foque em repeticao bem recompensada, resposta a comando, espera, recall e trabalho motivado por interacao ou brinquedo."
  }
  if (group === "working") {
    return "Foque em limites claros, conducao segura, estabilidade emocional e obediencia com criterio."
  }
  if (group === "hound") {
    return "Foque em foco no tutor, recall progressivo, manejo de cheiro e treino paciente em ambientes com distracao."
  }
  if (group === "terrier") {
    return "Foque em constancia, controle de impulso, tolerancia a frustracao e sessoes curtas para manter engajamento."
  }
  if (group === "toy") {
    return "Foque em socializacao, educacao de casa, tolerancia a manejo e obediencia do dia a dia."
  }

  if (trainability.score >= 4) {
    return `Em geral tende a aprender bem quando o treino e claro, consistente e dividido em etapas simples.`
  }
  if (trainability.score <= 2) {
    return "A evolucao costuma depender mais de paciencia, repeticao, ambiente bem controlado e tutor consistente."
  }
  return `O treino costuma funcionar melhor com rotina, reforco claro e progressao gradual respeitando o perfil ${groupLabel.toLowerCase()}.`
}

function buildTutorProfile(breed: DogBreedLookup, sizeLabel: string, energy: StudyMeter) {
  if (energy.score >= 4 && (sizeLabel === "Grande" || sizeLabel === "Gigante")) {
    return "Combina melhor com tutor presente, ativo e preparado para lidar com manejo, gasto fisico e consistencia diaria."
  }
  if (energy.score >= 4) {
    return "Tende a combinar mais com tutores ativos, que gostem de treinar e tenham tempo real para enriquecer a rotina."
  }
  if (sizeLabel === "Pequeno" || sizeLabel === "Mini") {
    return "Costuma ir bem com tutores que valorizam convivencia proxima, rotina organizada e treino funcional no dia a dia."
  }
  return "Costuma funcionar melhor com tutores consistentes, rotina previsivel e disposicao para acompanhar a evolucao com calma."
}

function buildStudyHighlights(
  groupLabel: string,
  sizeLabel: string,
  energy: StudyMeter,
  trainability: StudyMeter,
  sociability: StudyMeter
): BreedStudyHighlight[] {
  const environment =
    energy.score >= 4
      ? `Vai melhor quando a casa absorve bem movimento, passeio diario e uma rotina com objetivo. O porte ${sizeLabel.toLowerCase()} precisa entrar nessa conta.`
      : `Tende a se adaptar melhor a uma rotina estavel, desde que o tutor nao abra mao de passeio, previsibilidade e estimulo proporcional ao porte ${sizeLabel.toLowerCase()}.`

  const familyLife =
    sociability.score >= 4
      ? "Costuma lidar bem com convivio, proximidade e interacao frequente quando a socializacao e bem conduzida."
      : "Pede apresentacoes mais graduais, leitura fina do tutor e socializacao de qualidade para construir convivio equilibrado."

  const trainingView =
    trainability.score >= 4
      ? "Costuma responder bem a treino claro, repeticao curta e criterio do tutor."
      : "A evolucao depende mais de constancia, paciencia e manejo correto do ambiente."

  const tutorLens =
    energy.score >= 4 || trainability.score <= 2
      ? "Combina melhor com tutor presente, disciplinado e disposto a conduzir a rotina com consistencia."
      : `Costuma encaixar melhor com tutor que quer um perfil ${groupLabel.toLowerCase()} com rotina bem definida e progresso gradual.`

  return [
    { title: "Ambiente ideal", description: environment },
    { title: "Vida em familia", description: familyLife },
    { title: "Treino e conducao", description: trainingView },
    { title: "Perfil de tutor", description: tutorLens },
  ]
}

function buildAttentionPoints(
  breed: DogBreedLookup,
  sizeLabel: string,
  energy: StudyMeter,
  trainability: StudyMeter,
  sociability: StudyMeter
) {
  const points: string[] = []
  const group = normalizeText(breed.breedGroup || "")

  if (energy.score >= 4) {
    points.push("Sem gasto fisico e mental suficiente, pode acumular frustracao e descarregar energia de forma inadequada.")
  }
  if (sizeLabel === "Grande" || sizeLabel === "Gigante") {
    points.push("Porte maior pede manejo cedo, controle de guia e planejamento de espaco, transporte e rotina.")
  }
  if (sizeLabel === "Mini" || sizeLabel === "Pequeno") {
    points.push("Porte pequeno nao elimina a necessidade de limites, socializacao e treino consistente.")
  }
  if (trainability.score <= 2) {
    points.push("Pode testar limites com mais frequencia; repeticao, paciencia e criterio fazem bastante diferenca.")
  }
  if (sociability.score <= 2 || group === "working" || group === "terrier") {
    points.push("Socializacao de qualidade e exposicao gradual ajudam a construir convivencia mais equilibrada.")
  }
  if (group === "hound") {
    points.push("Cheiros e estimulos externos podem competir com o foco no tutor; o treino precisa considerar isso.")
  }

  if (points.length === 0) {
    points.push("Use a raca como referencia, mas ajuste as decisoes observando o individuo, a rotina da casa e a resposta ao treino.")
  }

  return points.slice(0, 3)
}

function getEnergyMeter(breed: DogBreedLookup, traits: string[]): StudyMeter {
  let score = 3
  const group = normalizeText(breed.breedGroup || "")

  if (["herding", "working", "sporting", "terrier"].includes(group)) score += 1
  if (group === "toy" || group === "non sporting") score -= 1

  if (hasAny(traits, ["active", "energetic", "athletic", "agile", "lively", "spirited", "quick", "hardworking", "alert"])) score += 1
  if (hasAny(traits, ["playful", "curious", "outgoing"])) score += 0.5
  if (hasAny(traits, ["calm", "quiet", "easy going", "easygoing", "composed", "docile"])) score -= 1

  score = Math.max(1, Math.min(5, Math.round(score)))

  if (score <= 1) return { score, label: "Baixa", description: "Costuma pedir rotina mais tranquila e gasto fisico moderado." }
  if (score === 2) return { score, label: "Moderada", description: "Costuma equilibrar momentos de atividade com boa adaptacao ao descanso." }
  if (score === 3) return { score, label: "Moderada a alta", description: "Costuma precisar de atividade frequente e boa previsibilidade na rotina." }
  if (score === 4) return { score, label: "Alta", description: "Costuma precisar de atividade diaria, desafio mental e treino estruturado." }
  return { score, label: "Muito alta", description: "Costuma exigir rotina intensa, enriquecimento diario e muita constancia do tutor." }
}

function getTrainabilityMeter(breed: DogBreedLookup, traits: string[]): StudyMeter {
  let score = 3
  const group = normalizeText(breed.breedGroup || "")

  if (group === "herding" || group === "sporting") score += 1
  if (hasAny(traits, ["intelligent", "eager to please", "obedient", "responsive", "receptive", "trainable", "attentive", "confident"])) score += 1
  if (hasAny(traits, ["independent", "stubborn", "aloof", "dominant", "territorial", "wild"])) score -= 1

  score = Math.max(1, Math.min(5, Math.round(score)))

  if (score <= 1) return { score, label: "Exige muita conducao", description: "Resultados costumam depender de muita repeticao, manejo fino e paciencia." }
  if (score === 2) return { score, label: "Exige constancia", description: "Aprende, mas costuma precisar de ambiente bem controlado e tutor regular." }
  if (score === 3) return { score, label: "Boa resposta", description: "Tende a evoluir bem quando ha rotina clara, reforco coerente e progressao simples." }
  if (score === 4) return { score, label: "Treinavel", description: "Costuma responder muito bem a treino consistente e bem conduzido." }
  return { score, label: "Muito treinavel", description: "Costuma aprender rapido quando o tutor mantem clareza, criterio e repeticao de qualidade." }
}

function getSociabilityMeter(breed: DogBreedLookup, traits: string[]): StudyMeter {
  let score = 3
  const group = normalizeText(breed.breedGroup || "")

  if (group === "toy" || group === "sporting") score += 0.5
  if (hasAny(traits, ["friendly", "affectionate", "gentle", "companionable", "outgoing", "loving", "happy", "cheerful", "sociable", "trusting"])) score += 1
  if (hasAny(traits, ["aloof", "reserved", "territorial", "protective", "dominant", "watchful"])) score -= 1

  score = Math.max(1, Math.min(5, Math.round(score)))

  if (score <= 1) return { score, label: "Mais reservada", description: "Costuma precisar de socializacao cuidadosa e aproximacao gradual." }
  if (score === 2) return { score, label: "Reservada a moderada", description: "Pode conviver bem, mas normalmente se beneficia de apresentacoes mais bem conduzidas." }
  if (score === 3) return { score, label: "Equilibrada", description: "Tende a conviver bem quando tem rotina, leitura correta e boa socializacao." }
  if (score === 4) return { score, label: "Sociavel", description: "Costuma interagir bem com pessoas e rotina de convivencia ativa." }
  return { score, label: "Muito sociavel", description: "Costuma gostar bastante de proximidade, contato e interacao frequente." }
}

function splitTraits(input?: string | null) {
  return String(input || "")
    .split(",")
    .map((item) => normalizeText(item))
    .filter(Boolean)
}

function translateTemperamentList(input?: string | null) {
  const items = String(input || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  if (items.length === 0) return null
  return items.map((item) => TEMPERAMENT_LABELS[normalizeText(item)] || item).join(", ")
}

function getSizeLabel(breed: DogBreedLookup) {
  const maxWeight = breed.weightMaxKg || breed.weightMinKg || 0
  const maxHeight = breed.heightMaxCm || breed.heightMinCm || 0

  if (maxWeight >= 45 || maxHeight >= 70) return "Gigante"
  if (maxWeight >= 25 || maxHeight >= 55) return "Grande"
  if (maxWeight >= 10 || maxHeight >= 40) return "Medio"
  if (maxWeight >= 5 || maxHeight >= 28) return "Pequeno"
  return "Mini"
}

function formatLifeSpan(value?: string | null) {
  const matches = String(value || "").match(/\d+/g)?.map(Number).filter(Number.isFinite) || []
  if (matches.length >= 2) return `${Math.min(...matches)} a ${Math.max(...matches)} anos`
  if (matches.length === 1) return `${matches[0]} anos`
  return "Nao informada"
}

function formatRangeLabel(min?: number | null, max?: number | null, unit?: string) {
  if (!Number.isFinite(min) && !Number.isFinite(max)) return "Nao informado"
  const from = Number.isFinite(min) ? formatNumber(min as number) : formatNumber(max as number)
  const to = Number.isFinite(max) ? formatNumber(max as number) : formatNumber(min as number)
  if (from === to) return `${from} ${unit || ""}`.trim()
  return `${from} a ${to} ${unit || ""}`.trim()
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",")
}

function hasAny(traits: string[], expected: string[]) {
  return expected.some((item) => traits.includes(normalizeText(item)))
}

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}
