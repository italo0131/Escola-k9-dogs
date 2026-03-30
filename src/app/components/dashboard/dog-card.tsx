import { Dog } from "@/app/types/dog"

export function DogCard({ dog }: { dog: Dog }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-lg font-semibold">{dog.name}</p>
      <p className="text-sm text-gray-300">Raca: {dog.breed}</p>
      <p className="text-sm text-gray-300">Idade: {dog.age}</p>
    </div>
  )
}
