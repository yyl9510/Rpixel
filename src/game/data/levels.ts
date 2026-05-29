import type { LevelDefinition, Pig, PixelCellColor } from '../types';

const grid: PixelCellColor[][] = [
  ['red', 'red', 'blue', 'blue', 'green', 'green'],
  ['red', 'purple', 'purple', 'yellow', 'yellow', 'green'],
  ['blue', 'purple', 'yellow', 'purple', 'red', 'yellow'],
  ['blue', 'green', 'purple', 'yellow', 'purple', 'yellow'],
  ['green', 'red', 'red', 'blue', 'purple', 'blue'],
  ['green', 'green', 'yellow', 'yellow', 'blue', 'blue'],
];

const pigs: Pig[] = [
  { id: 'pig-1', color: 'purple', ammo: 4 },
  { id: 'pig-2', color: 'red', ammo: 3 },
  { id: 'pig-3', color: 'blue', ammo: 4 },
  { id: 'pig-4', color: 'green', ammo: 4 },
  { id: 'pig-5', color: 'yellow', ammo: 4 },
  { id: 'pig-6', color: 'purple', ammo: 3 },
  { id: 'pig-7', color: 'red', ammo: 3 },
  { id: 'pig-8', color: 'blue', ammo: 4, mystery: true },
  { id: 'pig-9', color: 'yellow', ammo: 4, mystery: true },
  { id: 'pig-10', color: 'green', ammo: 3, mystery: true },
];

export const LEVELS: LevelDefinition[] = [
  {
    id: 1100,
    difficulty: 'Very Hard',
    grid,
    pigs,
  },
];

export const FIRST_LEVEL = LEVELS[0];
