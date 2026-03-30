import { notFound } from "next/navigation";
import { getDogBreedById } from "@/lib/thedogapi";import { buildBreedStudyProfile, type BreedStudyProfile } from "@/lib/breed-study";
import { getBreedImageUrl } from "@/lib/breed-search";
import Image from "next/image";
import Link from "next/link";

interface BreedDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BreedDetailPage({ params }: BreedDetailPageProps) {
  const { id } = await params;
  
  let breed;
  try {
    breed = await getDogBreedById(id);
  } catch (error) {
    console.error("Erro ao buscar raça:", error);
    notFound();
  }
  
  if (!breed) notFound();

  const profile = buildBreedStudyProfile({
    ...breed,
    referenceImageUrl: getBreedImageUrl(breed.name, breed.referenceImageUrl),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/racas" className="text-cyan-400 hover:underline mb-6 inline-block">
          ← Voltar para raças
        </Link>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
              <img
                src={profile.breed.referenceImageUrl || "/placeholder-dog.jpg"}
                alt={profile.breed.name}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.breed.name}</h1>
              <p className="text-cyan-300 mt-1">{profile.groupLabel}</p>
              <p className="mt-4 text-slate-300">{profile.summary}</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Porte</p>
                  <p className="font-medium">{profile.sizeLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Energia</p>
                  <p className="font-medium">{profile.energy.label} ({profile.energy.score}/5)</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Treinabilidade</p>
                  <p className="font-medium">{profile.trainability.label} ({profile.trainability.score}/5)</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Convivência</p>
                  <p className="font-medium">{profile.sociability.label} ({profile.sociability.score}/5)</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Peso médio</p>
                  <p className="font-medium">{profile.weightLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Expectativa de vida</p>
                  <p className="font-medium">{profile.lifeSpanLabel}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-3">História e função</h2>
            <p className="text-slate-300">{profile.historicalRole}</p>
            <h2 className="text-2xl font-semibold mt-6 mb-3">Rotina ideal</h2>
            <p className="text-slate-300">{profile.idealRoutine}</p>
            <h2 className="text-2xl font-semibold mt-6 mb-3">Foco de treino</h2>
            <p className="text-slate-300">{profile.trainingFocus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}