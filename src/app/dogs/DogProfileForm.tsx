"use client"

import type { ReactNode } from "react"
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { normalizeBreedSearchAlias, normalizeBreedSearchTerm } from "@/lib/breed-search"
import { isStaffRole } from "@/lib/role"
import {
  DOG_ACTIVITY_PROFILE_OPTIONS,
  DOG_ENERGY_LEVEL_OPTIONS,
  DOG_GENDER_OPTIONS,
  DOG_SIZE_OPTIONS,
  DOG_SPORT_FOCUS_OPTIONS,
  estimateDogSize,
  getActivityProfileLabel,
  getSportFocusLabel,
} from "@/lib/dog-profile"

type Owner = { id: string; name: string }

type BreedSuggestion = {
  id: string
  name: string
  breedGroup: string | null
  origin: string | null
  temperament: string | null
  description: string | null
  lifeSpan: string | null
  weightMinKg: number | null
  weightMaxKg: number | null
  heightReferenceCm: string | null
  referenceImageUrl: string | null
}

const initialForm = {
  name: "",
  breed: "",
  breedApiId: "",
  breedGroup: "",
  breedOrigin: "",
  breedTemperament: "",
  breedDescription: "",
  breedLifeSpan: "",
  breedWeightMinKg: "",
  breedWeightMaxKg: "",
  breedHeightReferenceCm: "",
  breedReferenceImageUrl: "",
  age: "",
  size: "MEDIO",
  weightKg: "",
  gender: "MACHO",
  color: "",
  birthDate: "",
  foodName: "",
  mealsPerDay: "2",
  portionSize: "",
  feedingTimes: "",
  allergies: "",
  medications: "",
  healthNotes: "",
  behaviorNotes: "",
  energyLevel: "MEDIA",
  activityProfile: "COMPANION",
  sportFocus: "",
  dailyExerciseGoalMinutes: "",
  weeklyConditioningSessions: "",
  bodyConditionScore: "",
  restingHeartRateBpm: "",
  athleteClearance: false,
  lastVetCheckupAt: "",
  hydrationPlan: "",
  supplements: "",
  injuryHistory: "",
  veterinaryRestrictions: "",
  recoveryNotes: "",
  performanceGoals: "",
  vaccinated: false,
  neutered: false,
}

type Props = {
  mode: "create" | "edit"
  dogId?: string
}

const emptyBreedProfileFields = {
  breedApiId: "",
  breedGroup: "",
  breedOrigin: "",
  breedTemperament: "",
  breedDescription: "",
  breedLifeSpan: "",
  breedWeightMinKg: "",
  breedWeightMaxKg: "",
  breedHeightReferenceCm: "",
  breedReferenceImageUrl: "",
}

function resetBreedProfile(current: typeof initialForm, nextBreed: string) {
  return {
    ...current,
    breed: nextBreed,
    ...emptyBreedProfileFields,
  }
}

function resolveAutoSelectedBreed(query: string, breeds: BreedSuggestion[]) {
  const normalizedQuery = normalizeBreedSearchTerm(query)
  const canonicalQuery = normalizeBreedSearchAlias(query)

  const exactMatch = breeds.find((breed) => {
    const normalizedName = normalizeBreedSearchTerm(breed.name)
    return normalizedName === normalizedQuery || normalizedName === canonicalQuery
  })

  if (exactMatch) {
    return exactMatch
  }

  if (breeds.length === 1 && (normalizedQuery.length >= 4 || canonicalQuery !== normalizedQuery)) {
    return breeds[0]
  }

  return null
}

export default function DogProfileForm({ mode, dogId }: Props) {
  const router = useRouter()
  const breedFileInputRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState(initialForm)
  const [ownerId, setOwnerId] = useState("")
  const [owners, setOwners] = useState<Owner[]>([])
  const [loadingOwners, setLoadingOwners] = useState(true)
  const [loadingDog, setLoadingDog] = useState(mode === "edit")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [isStaff, setIsStaff] = useState(false)
  const [canCreate, setCanCreate] = useState(true)
  const [breedSuggestions, setBreedSuggestions] = useState<BreedSuggestion[]>([])
  const [loadingBreedSuggestions, setLoadingBreedSuggestions] = useState(false)
  const [breedLookupMessage, setBreedLookupMessage] = useState("")
  const [recognizingBreed, setRecognizingBreed] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const meResp = await fetch("/api/profile", { redirect: "follow" })
        const contentType = meResp.headers.get("content-type") || ""
        const meText = await meResp.text()
        const isJson = contentType.includes("application/json")
        const me = isJson && meText ? JSON.parse(meText) : null

        if (!meResp.ok || !me?.user) {
          if (meResp.status === 401) {
            setMessage("Faca login para cadastrar um cao.")
          } else if (!isJson) {
            setMessage("Sua conta precisa ser verificada para continuar.")
          } else {
            setMessage(me?.message || "Nao foi possivel carregar seus dados.")
          }
          setCanCreate(false)
          return
        }

        setOwnerId(me.user.id)
        setIsStaff(isStaffRole(me.user.role))
        setCanCreate(true)

        if (isStaffRole(me.user.role)) {
          const usersResp = await fetch("/api/users")
          const usersText = await usersResp.text()
          const users = usersText ? JSON.parse(usersText) : []
          setOwners(users)
        } else {
          setOwners([{ id: me.user.id, name: me.user.name }])
        }
      } catch (err) {
        console.error("Erro ao carregar tutores", err)
        setMessage("Erro ao carregar dados do usuario.")
      } finally {
        setLoadingOwners(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (mode !== "edit" || !dogId) {
      setLoadingDog(false)
      return
    }

    async function loadDog() {
      try {
        const response = await fetch(`/api/dogs/${dogId}`)
        const payload = await response.json()

        if (!response.ok || !payload?.success || !payload?.dog) {
          setMessage(payload?.message || "Nao foi possivel carregar a ficha do cao.")
          return
        }

        const dog = payload.dog
        setOwnerId(dog.ownerId)
        setForm({
          name: dog.name || "",
          breed: dog.breed || "",
          breedApiId: dog.breedApiId || "",
          breedGroup: dog.breedGroup || "",
          breedOrigin: dog.breedOrigin || "",
          breedTemperament: dog.breedTemperament || "",
          breedDescription: dog.breedDescription || "",
          breedLifeSpan: dog.breedLifeSpan || "",
          breedWeightMinKg: dog.breedWeightMinKg != null ? String(dog.breedWeightMinKg) : "",
          breedWeightMaxKg: dog.breedWeightMaxKg != null ? String(dog.breedWeightMaxKg) : "",
          breedHeightReferenceCm: dog.breedHeightReferenceCm || "",
          breedReferenceImageUrl: dog.breedReferenceImageUrl || "",
          age: dog.age != null ? String(dog.age) : "",
          size: dog.size || "MEDIO",
          weightKg: dog.weightKg != null ? String(dog.weightKg) : "",
          gender: dog.gender || "MACHO",
          color: dog.color || "",
          birthDate: toDateInput(dog.birthDate),
          foodName: dog.foodName || "",
          mealsPerDay: dog.mealsPerDay != null ? String(dog.mealsPerDay) : "",
          portionSize: dog.portionSize || "",
          feedingTimes: dog.feedingTimes || "",
          allergies: dog.allergies || "",
          medications: dog.medications || "",
          healthNotes: dog.healthNotes || "",
          behaviorNotes: dog.behaviorNotes || "",
          energyLevel: dog.energyLevel || "MEDIA",
          activityProfile: dog.activityProfile || "COMPANION",
          sportFocus: dog.sportFocus || "",
          dailyExerciseGoalMinutes: dog.dailyExerciseGoalMinutes != null ? String(dog.dailyExerciseGoalMinutes) : "",
          weeklyConditioningSessions: dog.weeklyConditioningSessions != null ? String(dog.weeklyConditioningSessions) : "",
          bodyConditionScore: dog.bodyConditionScore != null ? String(dog.bodyConditionScore) : "",
          restingHeartRateBpm: dog.restingHeartRateBpm != null ? String(dog.restingHeartRateBpm) : "",
          athleteClearance: Boolean(dog.athleteClearance),
          lastVetCheckupAt: toDateInput(dog.lastVetCheckupAt),
          hydrationPlan: dog.hydrationPlan || "",
          supplements: dog.supplements || "",
          injuryHistory: dog.injuryHistory || "",
          veterinaryRestrictions: dog.veterinaryRestrictions || "",
          recoveryNotes: dog.recoveryNotes || "",
          performanceGoals: dog.performanceGoals || "",
          vaccinated: Boolean(dog.vaccinated),
          neutered: Boolean(dog.neutered),
        })
      } catch (error) {
        console.error(error)
        setMessage("Erro ao carregar ficha do cao.")
      } finally {
        setLoadingDog(false)
      }
    }

    loadDog()
  }, [dogId, mode])

  useEffect(() => {
    const query = form.breed.trim()
    if (query.length < 2) {
      setBreedSuggestions([])
      setBreedLookupMessage("")
      return
    }

    if (form.breedApiId && query.toLowerCase() === form.breed.toLowerCase()) {
      setBreedSuggestions([])
      return
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingBreedSuggestions(true)
        const response = await fetch(`/api/dogs/breeds?q=${encodeURIComponent(query)}`)
        const payload = await response.json()
        if (!response.ok || !Array.isArray(payload)) {
          setBreedSuggestions([])
          if (payload?.message) {
            setBreedLookupMessage(payload.message)
          }
          return
        }
        const autoSelectedBreed = resolveAutoSelectedBreed(query, payload)

        if (autoSelectedBreed) {
          applyBreedSuggestion(autoSelectedBreed, "automatic")
          return
        }

        setBreedSuggestions(payload)
        if (payload.length === 0) {
          setBreedLookupMessage("Nenhuma raca encontrada com esse termo. Tente outro nome ou apelido.")
          return
        }
        setBreedLookupMessage("")
      } catch (error) {
        console.error(error)
        setBreedLookupMessage("Nao foi possivel consultar racas agora.")
      } finally {
        setLoadingBreedSuggestions(false)
      }
    }, 280)

    return () => clearTimeout(timeout)
  }, [form.breed, form.breedApiId])

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = event.target
    const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value
    setForm((current) => {
      if (target.name === "breed") {
        return resetBreedProfile(current, String(value))
      }
      return { ...current, [target.name]: value }
    })
  }

  function applyBreedSuggestion(breed: BreedSuggestion, mode: "manual" | "automatic" = "manual") {
    setForm((current) => ({
      ...current,
      breed: breed.name,
      breedApiId: breed.id,
      breedGroup: breed.breedGroup || "",
      breedOrigin: breed.origin || "",
      breedTemperament: breed.temperament || "",
      breedDescription: breed.description || "",
      breedLifeSpan: breed.lifeSpan || "",
      breedWeightMinKg: breed.weightMinKg ? String(breed.weightMinKg) : "",
      breedWeightMaxKg: breed.weightMaxKg ? String(breed.weightMaxKg) : "",
      breedHeightReferenceCm: breed.heightReferenceCm || "",
      breedReferenceImageUrl: breed.referenceImageUrl || "",
      size: estimateDogSize(breed.weightMinKg, breed.weightMaxKg) || current.size,
      activityProfile: current.activityProfile === "COMPANION" && breed.breedGroup ? "ATHLETE" : current.activityProfile,
    }))
    setBreedSuggestions([])
    setBreedLookupMessage(
      mode === "automatic"
        ? "Perfil de raca carregado automaticamente pela busca."
        : "Perfil de raca aplicado ao cadastro.",
    )
  }

  async function handleBreedImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setRecognizingBreed(true)
      setBreedLookupMessage("")
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/dogs/recognize-breed", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        setBreedLookupMessage(payload?.message || "Nao foi possivel reconhecer a raca pela imagem.")
        return
      }

      applyBreedSuggestion(payload.breed)
      setBreedLookupMessage("Raca reconhecida e perfil aplicado.")
    } catch (error) {
      console.error(error)
      setBreedLookupMessage("Erro ao analisar a imagem do cao.")
    } finally {
      setRecognizingBreed(false)
      if (breedFileInputRef.current) {
        breedFileInputRef.current.value = ""
      }
    }
  }

  async function saveDog() {
    setSubmitting(true)
    setMessage("")
    try {
      const response = await fetch(mode === "edit" && dogId ? `/api/dogs/${dogId}` : "/api/dogs", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          weightKg: form.weightKg ? Number(form.weightKg) : null,
          mealsPerDay: form.mealsPerDay ? Number(form.mealsPerDay) : null,
          breedWeightMinKg: form.breedWeightMinKg ? Number(form.breedWeightMinKg) : null,
          breedWeightMaxKg: form.breedWeightMaxKg ? Number(form.breedWeightMaxKg) : null,
          dailyExerciseGoalMinutes: form.dailyExerciseGoalMinutes ? Number(form.dailyExerciseGoalMinutes) : null,
          weeklyConditioningSessions: form.weeklyConditioningSessions ? Number(form.weeklyConditioningSessions) : null,
          bodyConditionScore: form.bodyConditionScore ? Number(form.bodyConditionScore) : null,
          restingHeartRateBpm: form.restingHeartRateBpm ? Number(form.restingHeartRateBpm) : null,
          ownerId,
        }),
      })

      const text = await response.text()
      if (!text) {
        setMessage("API retornou resposta vazia")
        return
      }
      const data = JSON.parse(text)

      if (!response.ok || !data.success) {
        setMessage(data.message || (mode === "edit" ? "Erro ao atualizar cao" : "Erro ao cadastrar cao"))
        return
      }

      setMessage(mode === "edit" ? "Cao atualizado com sucesso" : "Cao cadastrado com sucesso")
      if (mode === "create") {
        setForm(initialForm)
      }
      router.push("/dogs")
    } catch (error) {
      console.error("ERRO FRONT:", error)
      setMessage(mode === "edit" ? "Erro ao atualizar cao" : "Erro ao cadastrar cao")
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!ownerId) {
      setMessage("Selecione um tutor")
      return
    }
    saveDog()
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_26%),linear-gradient(135deg,#020617,#0f172a,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.95fr]">
        <aside className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-200/80">Saude K9</p>
            <h1 className="mt-2 text-3xl font-semibold">
              {mode === "edit" ? "Atualize a ficha tecnica, saude e performance" : "Ficha tecnica, saude e performance"}
            </h1>
            <p className="mt-3 text-gray-300/80">
              {mode === "edit"
                ? "Mantenha a ficha do cao viva com alteracoes de saude, rotina nutricional, performance e observacoes do tutor."
                : "Cadastre o cao com identidade de raca, rotina nutricional e prontidao fisica. Agora a ficha ja nasce pronta para caes atletas tambem."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <InfoPill title="Raca inteligente" desc="Busca via TheDogAPI para aplicar grupo, origem, peso de referencia e temperamento." />
            <InfoPill title="Saude esportiva" desc="BCS, frequencia cardiaca, liberacao veterinaria, lesoes e recuperacao." />
            <InfoPill title="Rotina completa" desc="Alimentacao, hidratacao, suplementos, metas e contexto comportamental." />
          </div>

          {!loadingOwners && !canCreate && (
            <div className="space-y-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-5">
              <p className="text-amber-100">{message || "Voce precisa estar logado para cadastrar caes."}</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => router.push("/login")} className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-white">
                  Ir para login
                </button>
                <button
                  onClick={() => router.push("/verify")}
                  className="rounded-lg border border-white/15 px-4 py-2 text-gray-100 transition hover:bg-white/10"
                >
                  Verificar conta
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="rounded-lg border border-white/15 px-4 py-2 text-gray-100 transition hover:bg-white/10"
                >
                  Criar conta
                </button>
              </div>
            </div>
          )}
        </aside>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          {loadingDog ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
              Carregando ficha do cao...
            </div>
          ) : !loadingOwners && !canCreate ? null : (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <section className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Identificacao</p>
                  <h2 className="text-2xl font-semibold">Dados principais</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Nome">
                    <input name="name" value={form.name} onChange={updateField} required placeholder="Rex" className={inputClassName} />
                  </Field>

                  <Field label="Raca">
                    <div className="space-y-3">
                      <input
                        name="breed"
                        value={form.breed}
                        onChange={updateField}
                        required
                        placeholder="Digite a raca ou selecione uma sugestao"
                        className={inputClassName}
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => breedFileInputRef.current?.click()}
                          className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
                        >
                          {recognizingBreed ? "Analisando imagem..." : "Tentar reconhecer por foto"}
                        </button>
                        <input
                          ref={breedFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBreedImageChange}
                          className="hidden"
                        />
                        {loadingBreedSuggestions && <span className="text-xs text-slate-300">Consultando racas...</span>}
                      </div>

                      {breedSuggestions.length > 0 && (
                        <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                          {breedSuggestions.map((breed) => (
                            <button
                              key={breed.id}
                              type="button"
                              onClick={() => applyBreedSuggestion(breed)}
                              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{breed.name}</span>
                                {breed.breedGroup && (
                                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">
                                    {breed.breedGroup}
                                  </span>
                                )}
                                {breed.lifeSpan && (
                                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-100">
                                    {breed.lifeSpan} anos
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-gray-300">
                                {breed.description || breed.temperament || "Perfil de raca sem descricao detalhada."}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}

                      {breedLookupMessage && <p className="text-xs text-cyan-100">{breedLookupMessage}</p>}
                    </div>
                  </Field>

                  <Field label="Idade">
                    <input name="age" type="number" min={0} value={form.age} onChange={updateField} required placeholder="3" className={inputClassName} />
                  </Field>
                  <Field label="Peso atual (kg)">
                    <input name="weightKg" type="number" step="0.1" min={0} value={form.weightKg} onChange={updateField} placeholder="18.5" className={inputClassName} />
                  </Field>
                  <Field label="Porte">
                    <select name="size" value={form.size} onChange={updateField} className={inputClassName}>
                      {DOG_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-black">
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sexo">
                    <select name="gender" value={form.gender} onChange={updateField} className={inputClassName}>
                      {DOG_GENDER_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-black">
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cor">
                    <input name="color" value={form.color} onChange={updateField} placeholder="Preto e branco" className={inputClassName} />
                  </Field>
                  <Field label="Nascimento">
                    <input name="birthDate" type="date" value={form.birthDate} onChange={updateField} className={inputClassName} />
                  </Field>
                </div>

                {isStaff ? (
                  <Field label="Tutor">
                    <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} disabled={loadingOwners} required className={inputClassName}>
                      <option value="">{loadingOwners ? "Carregando tutores..." : "Selecione o tutor"}</option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id} className="text-black">
                          {owner.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <p className="text-sm text-gray-300/80">
                    Tutor definido automaticamente: <span className="text-white">{owners.find((owner) => owner.id === ownerId)?.name ?? "Voce"}</span>
                  </p>
                )}
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Perfil da raca</p>
                  <h2 className="text-2xl font-semibold">Contexto tecnico aplicado</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.25fr_0.75fr]">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Grupo da raca">
                      <input name="breedGroup" value={form.breedGroup} onChange={updateField} placeholder="Herding" className={inputClassName} />
                    </Field>
                    <Field label="Origem">
                      <input name="breedOrigin" value={form.breedOrigin} onChange={updateField} placeholder="Anglo-Scottish border region" className={inputClassName} />
                    </Field>
                    <Field label="Vida media">
                      <input name="breedLifeSpan" value={form.breedLifeSpan} onChange={updateField} placeholder="12-15" className={inputClassName} />
                    </Field>
                    <Field label="Altura de referencia (cm)">
                      <input
                        name="breedHeightReferenceCm"
                        value={form.breedHeightReferenceCm}
                        onChange={updateField}
                        placeholder="Male: 48-56; Female: 46-53"
                        className={inputClassName}
                      />
                    </Field>
                    <Field label="Peso minimo de referencia (kg)">
                      <input
                        name="breedWeightMinKg"
                        type="number"
                        step="0.1"
                        min={0}
                        value={form.breedWeightMinKg}
                        onChange={updateField}
                        className={inputClassName}
                      />
                    </Field>
                    <Field label="Peso maximo de referencia (kg)">
                      <input
                        name="breedWeightMaxKg"
                        type="number"
                        step="0.1"
                        min={0}
                        value={form.breedWeightMaxKg}
                        onChange={updateField}
                        className={inputClassName}
                      />
                    </Field>
                    <Field label="Temperamento">
                      <textarea
                        name="breedTemperament"
                        value={form.breedTemperament}
                        onChange={updateField}
                        rows={4}
                        placeholder="Inteligente, energico, leal..."
                        className={textareaClassName}
                      />
                    </Field>
                    <Field label="Descricao da raca">
                      <textarea
                        name="breedDescription"
                        value={form.breedDescription}
                        onChange={updateField}
                        rows={4}
                        placeholder="Contexto morfologico e funcional da raca"
                        className={textareaClassName}
                      />
                    </Field>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    {form.breedReferenceImageUrl ? (
                      <img
                        src={form.breedReferenceImageUrl}
                        alt={form.breed}
                        className="h-48 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/30 text-sm text-slate-400">
                        Referencia visual da raca aparece aqui
                      </div>
                    )}
                    <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-200/80">Leitura rapida</p>
                    <p className="mt-2 text-sm text-gray-300">
                      {form.breedGroup || "Grupo nao definido"} • alvo de peso {form.breedWeightMinKg || "?"}-{form.breedWeightMaxKg || "?"} kg
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Nutricao</p>
                  <h2 className="text-2xl font-semibold">Rotina alimentar</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="O que ele come">
                    <input name="foodName" value={form.foodName} onChange={updateField} placeholder="Racao premium, alimentacao natural..." className={inputClassName} />
                  </Field>
                  <Field label="Quantas vezes por dia">
                    <input name="mealsPerDay" type="number" min={0} value={form.mealsPerDay} onChange={updateField} placeholder="2" className={inputClassName} />
                  </Field>
                  <Field label="Quantidade">
                    <input name="portionSize" value={form.portionSize} onChange={updateField} placeholder="180g por refeicao" className={inputClassName} />
                  </Field>
                  <Field label="Horarios">
                    <input name="feedingTimes" value={form.feedingTimes} onChange={updateField} placeholder="07:00 e 19:00" className={inputClassName} />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Saude e performance</p>
                  <h2 className="text-2xl font-semibold">Base clinica e atletica</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Nivel de energia">
                    <select name="energyLevel" value={form.energyLevel} onChange={updateField} className={inputClassName}>
                      {DOG_ENERGY_LEVEL_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-black">
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Perfil de atividade">
                    <select name="activityProfile" value={form.activityProfile} onChange={updateField} className={inputClassName}>
                      {DOG_ACTIVITY_PROFILE_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-black">
                          {getActivityProfileLabel(option)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Modalidade foco">
                    <select name="sportFocus" value={form.sportFocus} onChange={updateField} className={inputClassName}>
                      <option value="" className="text-black">
                        Sem foco esportivo definido
                      </option>
                      {DOG_SPORT_FOCUS_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-black">
                          {getSportFocusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ultimo check-up veterinario">
                    <input name="lastVetCheckupAt" type="date" value={form.lastVetCheckupAt} onChange={updateField} className={inputClassName} />
                  </Field>

                  <Field label="Exercicio alvo por dia (min)">
                    <input name="dailyExerciseGoalMinutes" type="number" min={0} value={form.dailyExerciseGoalMinutes} onChange={updateField} className={inputClassName} />
                  </Field>
                  <Field label="Sessoes de condicionamento/semana">
                    <input
                      name="weeklyConditioningSessions"
                      type="number"
                      min={0}
                      value={form.weeklyConditioningSessions}
                      onChange={updateField}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Body Condition Score (1-9)">
                    <input
                      name="bodyConditionScore"
                      type="number"
                      min={1}
                      max={9}
                      value={form.bodyConditionScore}
                      onChange={updateField}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Frequencia cardiaca em repouso (bpm)">
                    <input
                      name="restingHeartRateBpm"
                      type="number"
                      min={0}
                      value={form.restingHeartRateBpm}
                      onChange={updateField}
                      className={inputClassName}
                    />
                  </Field>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label className="flex items-center gap-3 text-sm text-gray-200/90">
                    <input name="athleteClearance" type="checkbox" checked={form.athleteClearance} onChange={updateField} />
                    Liberado pelo veterinario para rotina atletica e treinos de alta exigencia
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Plano de hidratacao">
                    <textarea
                      name="hydrationPlan"
                      value={form.hydrationPlan}
                      onChange={updateField}
                      rows={4}
                      placeholder="Volume, fracionamento e cuidados no calor ou em prova"
                      className={textareaClassName}
                    />
                  </Field>
                  <Field label="Suplementos">
                    <textarea
                      name="supplements"
                      value={form.supplements}
                      onChange={updateField}
                      rows={4}
                      placeholder="Condroprotetor, omega 3, eletrolitos..."
                      className={textareaClassName}
                    />
                  </Field>
                  <Field label="Historico de lesoes">
                    <textarea
                      name="injuryHistory"
                      value={form.injuryHistory}
                      onChange={updateField}
                      rows={4}
                      placeholder="Lesoes previas, recidivas, pontos de atencao"
                      className={textareaClassName}
                    />
                  </Field>
                  <Field label="Restricoes veterinarias">
                    <textarea
                      name="veterinaryRestrictions"
                      value={form.veterinaryRestrictions}
                      onChange={updateField}
                      rows={4}
                      placeholder="Impacto, saltos, intensidade, limitacoes clinicas"
                      className={textareaClassName}
                    />
                  </Field>
                  <Field label="Notas de recuperacao">
                    <textarea
                      name="recoveryNotes"
                      value={form.recoveryNotes}
                      onChange={updateField}
                      rows={4}
                      placeholder="Sono, descompressao, massagens, dias leves"
                      className={textareaClassName}
                    />
                  </Field>
                  <Field label="Metas de performance">
                    <textarea
                      name="performanceGoals"
                      value={form.performanceGoals}
                      onChange={updateField}
                      rows={4}
                      placeholder="Agility, canicross, prova de obediencia, ganho de condicionamento"
                      className={textareaClassName}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Alergias">
                    <textarea name="allergies" value={form.allergies} onChange={updateField} rows={4} placeholder="Alergia a frango, sensibilidade dermatologica..." className={textareaClassName} />
                  </Field>
                  <Field label="Medicamentos">
                    <textarea name="medications" value={form.medications} onChange={updateField} rows={4} placeholder="Medicamentos de uso continuo ou recente" className={textareaClassName} />
                  </Field>
                  <Field label="Observacoes de saude">
                    <textarea name="healthNotes" value={form.healthNotes} onChange={updateField} rows={4} placeholder="Historico veterinario, exames, sinais de atencao..." className={textareaClassName} />
                  </Field>
                  <Field label="Notas comportamentais">
                    <textarea name="behaviorNotes" value={form.behaviorNotes} onChange={updateField} rows={4} placeholder="Ansiedade, sociabilidade, gatilhos, rotina ideal..." className={textareaClassName} />
                  </Field>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-center gap-3 md:flex-row md:items-center md:justify-between">
                  <label className="flex items-center gap-3 text-sm text-gray-200/90">
                    <input name="vaccinated" type="checkbox" checked={form.vaccinated} onChange={updateField} />
                    Vacinas em dia
                  </label>
                  <label className="flex items-center gap-3 text-sm text-gray-200/90">
                    <input name="neutered" type="checkbox" checked={form.neutered} onChange={updateField} />
                    Castrado
                  </label>
                </div>
              </section>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-xl border border-white/15 px-4 py-3 text-gray-100 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Salvando..." : mode === "edit" ? "Salvar alteracoes" : "Salvar cao"}
                </button>
              </div>

              {message && <p className="text-sm text-cyan-100">{message}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-gray-200/80">{label}</span>
      {children}
    </label>
  )
}

function InfoPill({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-gray-300">{desc}</p>
    </div>
  )
}

function toDateInput(value?: string | Date | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"

const textareaClassName =
  "w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
