// src/lib/breed-profile.ts
import { Breed } from '@/types/breeds';
import { mapApiGroupToValue, translateBreedGroup } from './breed-groups';

export interface BreedProfile {
  breed: Breed;
  groupValue: string;
  groupLabel: string;
  sizeLabel: string;
  energyLabel: string;
  trainabilityLabel: string;
  sociabilityLabel: string;
  summary: string;
  weightLabel: string;
  heightLabel: string;
  lifeSpanLabel: string;
  temperamentLabel: string;
  idealRoutine: string;
  trainingFocus: string;
  tutorProfile: string;
  historicalRole: string;
  attentionPoints: string[];
}

function getSizeLabel(size: number): string {
  if (size <= 2) return 'Pequeno';
  if (size <= 3) return 'Médio';
  if (size <= 4) return 'Grande';
  return 'Gigante';
}

function getEnergyLabel(energy: number): { label: string; description: string } {
  if (energy <= 2) return { label: 'Baixa', description: 'Cão calmo, contente com passeios curtos e brincadeiras leves.' };
  if (energy <= 3) return { label: 'Média', description: 'Precisa de caminhadas diárias e momentos de atividade.' };
  if (energy <= 4) return { label: 'Alta', description: 'Exige exercícios vigorosos diários e desafios mentais.' };
  return { label: 'Muito alta', description: 'Necessita de atividades intensas e frequentes; não é para sedentários.' };
}

function getTrainabilityLabel(difficulty: number): { label: string; description: string } {
  if (difficulty <= 2) return { label: 'Fácil', description: 'Aprende rápido, responde bem a comandos.' };
  if (difficulty <= 3) return { label: 'Moderada', description: 'Pode ser teimoso, mas com consistência aprende.' };
  if (difficulty <= 4) return { label: 'Difícil', description: 'Exige paciência, treinador experiente.' };
  return { label: 'Muito difícil', description: 'Raça independente, necessita de abordagem avançada.' };
}

function getSociabilityLabel(behavior: Breed['behavior']): { label: string; description: string } {
  const avg = (behavior.familyAffection + behavior.childFriendly + behavior.dogSociability + behavior.friendlinessToStrangers) / 4;
  if (avg >= 4) return { label: 'Excelente', description: 'Super sociável, adora pessoas e outros cães.' };
  if (avg >= 3) return { label: 'Boa', description: 'Convive bem, mas pode ser reservado com estranhos.' };
  if (avg >= 2) return { label: 'Regular', description: 'Pode ser seletivo, precisa de socialização.' };
  return { label: 'Difícil', description: 'Tendência a ser arredio ou agressivo; requer manejo cuidadoso.' };
}

export function buildBreedProfile(breed: Breed): BreedProfile {
  const groupValue = mapApiGroupToValue(breed.general.group);
  const groupLabel = translateBreedGroup(groupValue);
  const sizeLabel = getSizeLabel(breed.physical.size);
  const energy = getEnergyLabel(breed.care.exerciseNeeds);
  const trainability = getTrainabilityLabel(breed.care.trainingDifficulty);
  const sociability = getSociabilityLabel(breed.behavior);

  const summary = `${breed.general.shortDescription} É um cão de porte ${sizeLabel.toLowerCase()}, com energia ${energy.label.toLowerCase()} e treinabilidade ${trainability.label.toLowerCase()}.`;

  const weightKg = Math.round(breed.general.weight * 0.453592);
  const heightCm = Math.round(breed.general.height * 2.54);
  const weightLabel = `${weightKg} kg (aprox.)`;
  const heightLabel = `${heightCm} cm (aprox.)`;
  const lifeSpanLabel = `${breed.general.lifespan} anos`;

  const temperamentLabel = breed.general.personalityTraits.join(', ');

  const idealRoutine = energy.label === 'Baixa' ? 'Passeios curtos e brincadeiras leves.'
    : energy.label === 'Média' ? 'Caminhadas diárias e sessões de treino.'
    : 'Atividades intensas diárias, como corrida, agility ou jogos de faro.';

  const trainingFocus = trainability.label === 'Fácil' ? 'Reforço positivo e truques.'
    : trainability.label === 'Moderada' ? 'Consistência e paciência; usar recompensas variadas.'
    : 'Treinamento avançado, socialização constante e manejo de instintos.';

  const tutorProfile = sizeLabel === 'Pequeno' ? 'Apto para apartamentos e tutores com rotina moderada.'
    : sizeLabel === 'Grande' || sizeLabel === 'Gigante' ? 'Requer espaço e tutor com experiência em cães de grande porte.'
    : 'Versátil, adapta-se a diferentes estilos de vida.';

  const historicalRole = breed.general.group;

  const attentionPoints = [];
  if (breed.care.sheddingAmount >= 4) attentionPoints.push('Perda de pelos intensa; exige aspiração frequente.');
  if (breed.care.groomingFrequency >= 4) attentionPoints.push('Escovação diária necessária; pode precisar de tosa profissional.');
  if (breed.care.exerciseNeeds >= 4) attentionPoints.push('Altíssima necessidade de exercício; não é para sedentários.');
  if (breed.care.mentalStimulationNeeds >= 4) attentionPoints.push('Precisa de desafios mentais; pode ficar destrutivo se entediado.');
  if (breed.behavior.barkingFrequency >= 4) attentionPoints.push('Tendência a latir muito; requer treino para controlar.');
  if (breed.behavior.protectiveInstincts >= 4) attentionPoints.push('Instinto protetor forte; pode ser desconfiado com estranhos.');
  if (breed.physical.droolingFrequency >= 4) attentionPoints.push('Baba frequente; prepare panos por perto.');
  if (breed.general.rare) attentionPoints.push('Raça rara; pode ser difícil encontrar criadores ou informações locais.');

  return {
    breed,
    groupValue,
    groupLabel,
    sizeLabel,
    energyLabel: energy.label,
    trainabilityLabel: trainability.label,
    sociabilityLabel: sociability.label,
    summary,
    weightLabel,
    heightLabel,
    lifeSpanLabel,
    temperamentLabel,
    idealRoutine,
    trainingFocus,
    tutorProfile,
    historicalRole,
    attentionPoints: attentionPoints.length ? attentionPoints : ['Nenhum ponto crítico; mas sempre avalie o indivíduo.']
  };
}