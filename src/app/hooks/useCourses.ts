import { useEffect, useState } from "react"
import { Course } from "@/app/types/course"

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch("/api/courses")
        const data = await res.json().catch(() => [])
        if (!mounted) return
        setCourses(data || [])
      } catch (err) {
        if (!mounted) return
        setError("Erro ao carregar cursos")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return { courses, loading, error }
}
