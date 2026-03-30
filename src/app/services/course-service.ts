import { apiRequest } from "@/app/lib/db"
import { Course } from "@/app/types/course"

export function getCourses() {
  return apiRequest<Course[]>("/api/courses")
}

export function getCourse(id: string) {
  return apiRequest<Course>(`/api/courses/${id}`)
}
