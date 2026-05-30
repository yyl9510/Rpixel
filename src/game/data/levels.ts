import type { LevelDefinition, Pig, PixelCellColor } from '../types';

const ROWS = 21;
const COLS = 17;

function makeReferenceGrid(): PixelCellColor[][] {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      let color: PixelCellColor = row >= 16 ? 'green' : 'blue';

      if (row >= 11 && row <= 20 && col >= 7 && col <= 10) {
        color = col <= 8 ? 'yellow' : 'orange';
      }

      if (row >= 5 && row <= 8 && col >= 6 && col <= 12) {
        color = row <= 6 ? 'red' : col <= 9 ? 'orange' : 'red';
      }

      if ((row >= 3 && row <= 13 && col >= 1 && col <= 4) || (row >= 10 && row <= 15 && col >= 12 && col <= 15)) {
        color = (row + col) % 3 === 0 ? 'white' : color;
      }

      if (row >= 6 && row <= 14 && col >= 4 && col <= 7 && (row + col) % 4 === 0) {
        color = 'white';
      }

      if (row >= 4 && row <= 14 && col >= 2 && col <= 14 && (row * 7 + col * 5) % 17 === 0) {
        color = 'purple';
      }

      if (row >= 2 && row <= 17 && col >= 1 && col <= 15 && (row * 11 + col * 3) % 23 === 0) {
        color = row < 15 ? 'white' : 'blue';
      }

      if (row >= 15 && row <= 19 && (col === 0 || col === 16)) {
        color = 'green';
      }

      if (row >= ROWS - 3) {
        return null;
      }

      if (row === Math.floor(ROWS / 2) && col === Math.floor(COLS / 2)) {
        return null;
      }

      return color;
    }),
  );
}

const grid = makeReferenceGrid();

const pigs: Pig[] = [
  { id: 'pig-1', color: 'green', ammo: 50 },
  { id: 'pig-2', color: 'blue', ammo: 80 },
  { id: 'pig-3', color: 'white', ammo: 40 },
  { id: 'pig-4', color: 'purple', ammo: 12 },
  { id: 'pig-5', color: 'purple', ammo: 12 },
  { id: 'pig-6', color: 'purple', ammo: 12 },
  { id: 'pig-7', color: 'purple', ammo: 12 },
  { id: 'pig-8', color: 'purple', ammo: 12 },
  { id: 'pig-9', color: 'red', ammo: 35, mystery: true },
  { id: 'pig-10', color: 'orange', ammo: 55, mystery: true },
  { id: 'pig-11', color: 'yellow', ammo: 55, mystery: true },
  { id: 'pig-12', color: 'blue', ammo: 90, mystery: true },
  { id: 'pig-13', color: 'green', ammo: 45, mystery: true },
  { id: 'pig-14', color: 'white', ammo: 45, mystery: true },
  { id: 'pig-15', color: 'red', ammo: 35, mystery: true },
  { id: 'pig-16', color: 'orange', ammo: 45, mystery: true },
  { id: 'pig-17', color: 'yellow', ammo: 45, mystery: true },
  { id: 'pig-18', color: 'blue', ammo: 90, mystery: true },
  { id: 'pig-19', color: 'green', ammo: 45, mystery: true },
  { id: 'pig-20', color: 'white', ammo: 35, mystery: true },
  { id: 'pig-21', color: 'purple', ammo: 30, mystery: true },
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
