import { apiRequest } from "@/app/lib/db"
import { Dog } from "@/app/types/dog"

export function getDogs() {
  return apiRequest<Dog[]>("/api/dogs")
}

export function createDog(payload: Partial<Dog>) {
  return apiRequest<{ success: boolean; dog: Dog }>("/api/dogs", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
