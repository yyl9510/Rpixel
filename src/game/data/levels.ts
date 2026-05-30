import { PIG_COLORS, type LevelDefinition, type Pig, type PigColor, type PixelCellColor } from '../types';

const ROWS = 21;
const COLS = 17;

function isShapeCell(row: number, col: number): boolean {
  const center = (COLS - 1) / 2;
  const halfWidths = [2, 4, 5, 6, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 5, 4, 3];
  if (Math.abs(col - center) > halfWidths[row]) {
    return false;
  }

  const isDoorwayVoid = row >= 14 && row <= 20 && col >= 6 && col <= 10;
  const isShoulderCut = row >= 16 && ((col >= 1 && col <= 2) || (col >= 14 && col <= 15));
  return !isDoorwayVoid && !isShoulderCut;
}

function makeReferenceGrid(): PixelCellColor[][] {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      if (!isShapeCell(row, col)) {
        return null;
      }

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

      if (row >= 4 && row <= 12 && col >= 5 && col <= 11 && (row * 7 + col * 5) % 17 === 0) {
        color = 'purple';
      }

      if (row >= 2 && row <= 17 && col >= 1 && col <= 15 && (row * 11 + col * 3) % 23 === 0) {
        color = row < 15 ? 'white' : 'blue';
      }

      if (row >= 15 && row <= 19 && (col === 0 || col === 16)) {
        color = 'green';
      }

      if (row === Math.floor(ROWS / 2) && col === Math.floor(COLS / 2)) {
        return null;
      }

      return color;
    }),
  );
}

function balanceGridToFiveMultiples(board: PixelCellColor[][]): PixelCellColor[][] {
  const balanced = board.map((row) => [...row]);
  const changes: Array<{ row: number; col: number; from: PixelCellColor; to: PixelCellColor }> = [
    { row: 7, col: 6, from: 'orange', to: 'red' },
    { row: 7, col: 7, from: 'orange', to: 'red' },
    { row: 7, col: 8, from: 'orange', to: 'yellow' },
    { row: 0, col: 5, from: null, to: 'blue' },
    { row: 0, col: 11, from: null, to: 'purple' },
    { row: 1, col: 3, from: null, to: 'green' },
  ];

  changes.forEach(({ row, col, from, to }) => {
    if ((balanced[row]?.[col] ?? null) !== from) {
      throw new Error(`Unexpected level balance source at ${row}:${col}`);
    }
    balanced[row][col] = to;
  });

  return balanced;
}

const grid = balanceGridToFiveMultiples(makeReferenceGrid());

function emptyColorTotals(): Record<PigColor, number> {
  return PIG_COLORS.reduce(
    (totals, color) => ({ ...totals, [color]: 0 }),
    {} as Record<PigColor, number>,
  );
}

function countGridColors(board: PixelCellColor[][]): Record<PigColor, number> {
  const totals = emptyColorTotals();
  board.flat().forEach((color) => {
    if (color !== null) {
      totals[color] += 1;
    }
  });
  return totals;
}

function splitAmmo(total: number, parts: number): number[] {
  if (total <= 0) {
    return [];
  }
  if (total % 5 !== 0) {
    throw new Error(`Shooter ammo total must be divisible by 5, received ${total}`);
  }

  const units = total / 5;
  const safeParts = Math.max(1, Math.min(parts, units));
  const base = Math.floor(units / safeParts);
  const remainder = units % safeParts;
  return Array.from({ length: safeParts }, (_, index) => (base + (index < remainder ? 1 : 0)) * 5);
}

function buildBalancedPigs(board: PixelCellColor[][]): Pig[] {
  const totals = countGridColors(board);
  let nextId = 1;
  const pigs: Pig[] = [];
  const addPig = (color: PigColor, ammo: number, mystery = false): void => {
    if (ammo <= 0) {
      return;
    }
    pigs.push({ id: `pig-${nextId}`, color, ammo, mystery });
    nextId += 1;
  };

  const [greenFirst = 0, greenSecond = 0] = splitAmmo(totals.green, 2);
  const [blueFirst = 0, blueSecond = 0] = splitAmmo(totals.blue, 2);
  const [whiteFirst = 0, whiteSecond = 0] = splitAmmo(totals.white, 2);
  const [redA = 0, redB = 0, redC = 0, redD = 0] = splitAmmo(totals.red, 4);
  const [purpleA = 0] = splitAmmo(totals.purple, 1);

  const queue: Array<[PigColor, number]> = [
    ['blue', blueFirst],
    ['red', redA],
    ['green', greenFirst],
    ['white', whiteFirst],
    ['red', redB],
    ['purple', purpleA],
    ['orange', totals.orange],
    ['yellow', totals.yellow],
    ['white', whiteSecond],
    ['red', redC],
    ['blue', blueSecond],
    ['red', redD],
    ['green', greenSecond],
  ];

  queue.forEach(([color, ammo]) => addPig(color, ammo));

  return pigs;
}

const pigs = buildBalancedPigs(grid);

export const LEVELS: LevelDefinition[] = [
  {
    id: 1100,
    difficulty: 'Very Hard',
    grid,
    pigs,
  },
];

export const FIRST_LEVEL = LEVELS[0];
