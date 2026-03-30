"use client";

import { useState, useEffect } from "react";
import { getDogBreedCatalog } from "@/lib/thedogapi";
import { buildBreedStudyProfile, type BreedStudyProfile } from "@/lib/breed-study";
import { getBreedImageUrl } from "@/lib/breed-search";
import { normalizeBreedLifestyleForm, DEFAULT_BREED_LIFESTYLE, scoreBreedMatch } from "@/lib/breed-match";
import { Radar } from "lucide-react";

export default function RadarPage() {
  const [profiles, setProfiles] = useState<BreedStudyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [lifestyle, setLifestyle] = useState(DEFAULT_BREED_LIFESTYLE);

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const { breeds } = await getDogBreedCatalog(200);
        const mapped = breeds.map((breed) =>
          buildBreedStudyProfile({
            ...breed,
            referenceImageUrl: getBreedImageUrl(breed.name, breed.referenceImageUrl),
          })
        );
        setProfiles(mapped);
      } catch (error) {
        console.error("Erro ao carregar raças:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBreeds();
  }, []);

  const ranked = profiles
    .map((profile) => ({
      ...profile,
      match: scoreBreedMatch(profile, lifestyle),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Radar className="h-8 w-8" /> Radar de Encaixe
        </h1>
        <p className="mb-6 text-slate-300">
          Preencha as informações sobre sua rotina e descubra as raças mais compatíveis com seu estilo de vida.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <select
              value={lifestyle.livingSpace}
              onChange={(e) => setLifestyle({ ...lifestyle, livingSpace: e.target.value as any })}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <option value="APARTAMENTO">Apartamento</option>
              <option value="CASA_COMPACTA">Casa compacta</option>
              <option value="CASA_COM_QUINTAL">Casa com quintal</option>
              <option value="AREA_ABERTA">Área aberta</option>
            </select>
            <select
              value={lifestyle.routine}
              onChange={(e) => setLifestyle({ ...lifestyle, routine: e.target.value as any })}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <option value="work">Trabalho fora</option>
              <option value="home">Home office</option>
            <option value="active">Muito tempo livre</option>
          </select>
          {/* Adicione mais campos conforme necessário */}
        </div>

        {loading ? (
          <div className="text-center">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {ranked.map((profile, idx) => (
              <div key={profile.breed.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg">{idx+1}. {profile.breed.name}</span>
                  <p className="text-sm text-slate-400">{profile.groupLabel}</p>
                </div>
                <div className="text-cyan-400 font-bold">{profile.match.score}/100</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}