import type { LevelDefinition, Pig, PixelCellColor } from '../types';

const grid: PixelCellColor[][] = [
  [null, null, 'red', 'red', 'blue', null, null],
  [null, 'red', 'yellow', 'yellow', 'green', 'green', null],
  ['blue', 'yellow', 'purple', 'yellow', 'purple', 'red', 'green'],
  ['blue', 'green', 'purple', null, 'purple', 'yellow', 'green'],
  ['green', 'red', 'purple', null, 'purple', 'yellow', 'blue'],
  ['green', 'red', 'red', null, 'blue', 'yellow', 'blue'],
  [null, 'green', 'yellow', null, 'yellow', 'blue', null],
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
  { id: 'pig-15', color: 'yellow', ammo: 4, mystery: true },
  { id: 'pig-16', color: 'green', ammo: 3, mystery: true },
  { id: 'pig-17', color: 'blue', ammo: 3, mystery: true },
  { id: 'pig-18', color: 'red', ammo: 3, mystery: true },
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
