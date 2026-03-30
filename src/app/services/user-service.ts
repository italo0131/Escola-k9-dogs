import { apiRequest } from "@/app/lib/db"
import { User } from "@/app/types/user"

export function getUsers() {
  return apiRequest<User[]>("/api/users")
}

export function updateUserRole(email: string, role: string) {
  return apiRequest<{ success: boolean; user: User }>("/api/admin/promote", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  })
}
