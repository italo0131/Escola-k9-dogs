export interface BreedGeneral {
  name: string;
  group: string;
  personalityTraits: string[];
  shortDescription: string;
  longDescription: string;
  popularity: number;
  height: number;      // polegadas
  weight: number;      // libras
  lifespan: number;    // anos
  rare: boolean;
}

export interface BreedPhysical {
  size: number;               // 1-5
  lifespan: number;            // 1-5
  droolingFrequency: number;   // 1-5
  coatStyle: string;           // ex: "Double", "Single"
  coatTexture: string;         // ex: "Smooth", "Rough", "Curly"
  coatLength: number;          // 1-5
  doubleCoat: boolean;
}

export interface BreedBehavior {
  familyAffection: number;        // 1-5
  childFriendly: number;          // 1-5
  dogSociability: number;          // 1-5
  friendlinessToStrangers: number; // 1-5
  playfulness: number;            // 1-5
  protectiveInstincts: number;    // 1-5
  adaptability: number;           // 1-5
  barkingFrequency: number;       // 1-5
}

export interface BreedCare {
  sheddingAmount: number;          // 1-5
  groomingFrequency: number;       // 1-5
  exerciseNeeds: number;           // 1-5
  mentalStimulationNeeds: number;  // 1-5
  trainingDifficulty: number;      // 1-5
}

export interface BreedImages {
  indoors: string;
  outdoors: string;
  studio: string;
}

export interface Breed {
  id: string;
  general: BreedGeneral;
  physical: BreedPhysical;
  behavior: BreedBehavior;
  care: BreedCare;
  images: BreedImages;
}
