// src/lib/breed-groups.ts
export const BREED_GROUPS = [
  { value: 'herding', label: 'Pastoreio' },
  { value: 'working', label: 'Trabalho' },
  { value: 'sporting', label: 'Esportivo / Caça' },
  { value: 'hound', label: 'Faroeiros / Caça' },
  { value: 'terrier', label: 'Terrier' },
  { value: 'toy', label: 'Companhia' },
  { value: 'non-sporting', label: 'Não esportivo' },
  { value: 'mixed', label: 'SRD' },
];

export function translateBreedGroup(group: string): string {
  const found = BREED_GROUPS.find(g => g.value === group);
  return found?.label || group;
}

export function mapApiGroupToValue(apiGroup: string): string {
  return apiGroup.toLowerCase().replace(/\s+/g, '-');
}