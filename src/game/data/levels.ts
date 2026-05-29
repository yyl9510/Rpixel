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
  { id: 'pig-1', color: 'purple', ammo: 3 },
  { id: 'pig-2', color: 'purple', ammo: 3 },
  { id: 'pig-3', color: 'purple', ammo: 3 },
  { id: 'pig-4', color: 'purple', ammo: 3 },
  { id: 'pig-5', color: 'purple', ammo: 3 },
  { id: 'pig-6', color: 'red', ammo: 6 },
  { id: 'pig-7', color: 'blue', ammo: 6 },
  { id: 'pig-8', color: 'green', ammo: 6, mystery: true },
  { id: 'pig-9', color: 'yellow', ammo: 6, mystery: true },
  { id: 'pig-10', color: 'red', ammo: 4, mystery: true },
  { id: 'pig-11', color: 'blue', ammo: 4, mystery: true },
  { id: 'pig-12', color: 'green', ammo: 4, mystery: true },
  { id: 'pig-13', color: 'yellow', ammo: 4, mystery: true },
  { id: 'pig-14', color: 'purple', ammo: 4, mystery: true },
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
