export const PIG_COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'white'] as const;

export type PigColor = (typeof PIG_COLORS)[number];

export interface Pig {
  id: string;
  color: PigColor;
  ammo: number;
  mystery?: boolean;
}

export type PixelCellColor = PigColor | null;

export interface LevelDefinition {
  id: number;
  difficulty: string;
  grid: PixelCellColor[][];
  pigs: Pig[];
}
