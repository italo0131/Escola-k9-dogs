import { apiRequest } from "@/app/lib/db"
import { TrainingSession } from "@/app/types/training"

export function getTrainings() {
  return apiRequest<TrainingSession[]>("/api/training")
}

export function createTraining(payload: Partial<TrainingSession>) {
  return apiRequest<{ success: boolean; training: TrainingSession }>("/api/training", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
