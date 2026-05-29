export const PIG_COLORS = ['red', 'blue', 'yellow', 'green', 'purple'] as const;

export type PigColor = (typeof PIG_COLORS)[number];

export interface Pig {
  id: string;
  color: PigColor;
  ammo: number;
}

export interface LevelDefinition {
  id: number;
  difficulty: string;
  grid: PigColor[][];
  pigs: Pig[];
}

