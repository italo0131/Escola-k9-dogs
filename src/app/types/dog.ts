export type Dog = {
  id: string
  name: string
  breed: string
  breedApiId?: string | null
  breedGroup?: string | null
  breedOrigin?: string | null
  breedTemperament?: string | null
  breedDescription?: string | null
  breedLifeSpan?: string | null
  breedWeightMinKg?: number | null
  breedWeightMaxKg?: number | null
  breedHeightReferenceCm?: string | null
  breedReferenceImageUrl?: string | null
  age: number
  size?: string | null
  weightKg?: number | null
  gender?: string | null
  color?: string | null
  birthDate?: string | null
  foodName?: string | null
  mealsPerDay?: number | null
  portionSize?: string | null
  feedingTimes?: string | null
  allergies?: string | null
  medications?: string | null
  healthNotes?: string | null
  behaviorNotes?: string | null
  energyLevel?: string | null
  activityProfile?: string | null
  sportFocus?: string | null
  dailyExerciseGoalMinutes?: number | null
  weeklyConditioningSessions?: number | null
  bodyConditionScore?: number | null
  restingHeartRateBpm?: number | null
  athleteClearance?: boolean
  lastVetCheckupAt?: string | null
  hydrationPlan?: string | null
  supplements?: string | null
  injuryHistory?: string | null
  veterinaryRestrictions?: string | null
  recoveryNotes?: string | null
  performanceGoals?: string | null
  vaccinated?: boolean
  neutered?: boolean
  ownerId: string
  companyId?: string | null
}
