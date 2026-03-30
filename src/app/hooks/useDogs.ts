import { useEffect, useState } from "react"
import { Dog } from "@/app/types/dog"

export function useDogs() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch("/api/dogs")
        const data = await res.json()
        if (!mounted) return
        setDogs(data || [])
      } catch (err) {
        if (!mounted) return
        setError("Erro ao carregar caes")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return { dogs, loading, error }
}
