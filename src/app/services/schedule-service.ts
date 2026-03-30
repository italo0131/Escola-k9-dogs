import { apiRequest } from "@/app/lib/db"

export type Schedule = {
  id: string
  date: string
  status: string
  userId: string
}

export function getSchedules() {
  return apiRequest<Schedule[]>("/api/schedule")
}

export function createSchedule(payload: Partial<Schedule>) {
  return apiRequest<{ success: boolean; schedule: Schedule }>("/api/schedule", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
