"use client";

import { useState, useEffect } from "react";
import { getDogBreedCatalog } from "@/lib/thedogapi";
import { buildBreedStudyProfile, type BreedStudyProfile } from "@/lib/breed-study";
import { getBreedImageUrl } from "@/lib/breed-search";
import { GitCompare, X } from "lucide-react";

export default function ComparadorPage() {
  const [breeds, setBreeds] = useState<BreedStudyProfile[]>([]);
  const [selected, setSelected] = useState<BreedStudyProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const { breeds: rawBreeds } = await getDogBreedCatalog(200);
        const mapped = rawBreeds.map((breed) =>
          buildBreedStudyProfile({
            ...breed,
            referenceImageUrl: getBreedImageUrl(breed.name, breed.referenceImageUrl),
          })
        );
        setBreeds(mapped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBreeds();
  }, []);

  const addBreed = (breed: BreedStudyProfile) => {
    if (selected.length >= 3) return;
    setSelected([...selected, breed]);
  };

  const removeBreed = (id: string) => {
    setSelected(selected.filter((b) => b.breed.id !== id));
  };

  if (loading) return <div className="text-center py-20">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <GitCompare className="h-8 w-8" /> Comparador de Raças
        </h1>
        <p className="mb-6 text-slate-300">Selecione até 3 raças para comparar lado a lado.</p>

        <div className="flex flex-wrap gap-4 mb-8">
          {breeds.slice(0, 20).map((breed) => (
            <button
              key={breed.breed.id}
              onClick={() => addBreed(breed)}
              disabled={selected.length >= 3 || selected.some((s) => s.breed.id === breed.breed.id)}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {breed.breed.name}
            </button>
          ))}
        </div>

        {selected.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left text-slate-400">Característica</th>
                  {selected.map((breed) => (
                    <th key={breed.breed.id} className="p-3 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span>{breed.breed.name}</span>
                        <button onClick={() => removeBreed(breed.breed.id)} className="text-red-400 hover:text-red-300">
                          <X size={16} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  { label: "Porte", key: (p: BreedStudyProfile) => p.sizeLabel },
                  { label: "Energia", key: (p: BreedStudyProfile) => `${p.energy.label} (${p.energy.score}/5)` },
                  { label: "Treinabilidade", key: (p: BreedStudyProfile) => `${p.trainability.label} (${p.trainability.score}/5)` },
                  { label: "Convivência", key: (p: BreedStudyProfile) => `${p.sociability.label} (${p.sociability.score}/5)` },
                  { label: "Peso médio", key: (p: BreedStudyProfile) => p.weightLabel },
                  { label: "Vida média", key: (p: BreedStudyProfile) => p.lifeSpanLabel },
                  { label: "Rotina ideal", key: (p: BreedStudyProfile) => p.idealRoutine },
                ].map((item) => (
                  <tr key={item.label}>
                    <td className="p-3 font-medium">{item.label}</td>
                    {selected.map((breed) => (
                      <td key={breed.breed.id} className="p-3 text-slate-300">
                        {item.key(breed)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-slate-400">Nenhuma raça selecionada. Clique nos botões acima para comparar.</div>
        )}
      </div>
    </div>
  );
}