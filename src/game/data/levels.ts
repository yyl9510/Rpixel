import type { LevelDefinition, Pig, PigColor } from '../types';

const grid: PigColor[][] = [
  ['red', 'blue', 'green', 'yellow', 'purple'],
  ['yellow', 'red', 'blue', 'purple', 'green'],
  ['green', 'purple', 'yellow', 'red', 'blue'],
  ['blue', 'green', 'purple', 'yellow', 'red'],
  ['purple', 'yellow', 'red', 'green', 'blue'],
];

const pigOrder: PigColor[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'yellow',
  'red',
  'blue',
  'purple',
  'green',
  'green',
  'purple',
  'yellow',
  'red',
  'blue',
  'blue',
  'green',
  'purple',
  'yellow',
  'red',
  'purple',
  'yellow',
  'red',
  'green',
  'blue',
];

const pigs: Pig[] = pigOrder.map((color, index) => ({
  id: `pig-${index + 1}`,
  color,
  ammo: 1,
}));

export const LEVELS: LevelDefinition[] = [
  {
    id: 1100,
    difficulty: 'Very Hard',
    grid,
    pigs,
  },
];

export const FIRST_LEVEL = LEVELS[0];

