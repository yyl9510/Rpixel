import { expect, test, type Page } from '@playwright/test';

interface CanvasBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SPEED_TOGGLE_X = 214;
const SPEED_TOGGLE_Y = 82;
const CAPACITY_PILL_CENTER_X = 350;
const CAPACITY_PILL_CENTER_Y = 82;
const CAPACITY_PILL_HALF_WIDTH = 75;
const CAPACITY_PILL_HALF_HEIGHT = 31;
const RESERVE_TOKEN_HALF_HEIGHT = (178 * 0.68) / 2;
const BOOSTER_BAR_TOP_Y = 1812;
const MIN_RESERVE_TOOLBAR_GAP = 48;

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => window.localStorage.clear());
});

async function gameBox(page: Page) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  return { canvas, box };
}

async function clickGame(page: Page, box: CanvasBox, x: number, y: number) {
  await page.mouse.click(box.x + box.width * (x / 1080), box.y + box.height * (y / 1920));
}

async function visibleReserve(page: Page) {
  return page.evaluate(() => window.__RPIXEL_VISIBLE_RESERVE__ ?? []);
}

async function visibleWaiting(page: Page) {
  return page.evaluate(() => window.__RPIXEL_VISIBLE_WAITING__ ?? []);
}

function modularDelta(from: number, to: number, modulo: number) {
  return ((to - from) % modulo + modulo) % modulo;
}

test('loads the menu and launches shooters through the waiting area', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  const brightness = await canvas.evaluate((node) => {
    const canvasNode = node as HTMLCanvasElement;
    const context = canvasNode.getContext('2d');
    if (!context) {
      return 0;
    }

    const data = context.getImageData(0, 0, canvasNode.width, canvasNode.height).data;
    let total = 0;
    for (let index = 0; index < data.length; index += 4096) {
      total += data[index] + data[index + 1] + data[index + 2] + data[index + 3];
    }
    return total;
  });
  expect(brightness).toBeGreaterThan(1000);

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');
  expect(await page.evaluate(() => window.__RPIXEL_CAPACITY_LABEL__)).toBe('0-5');
  const capacityBounds = await page.evaluate(() => window.__RPIXEL_CAPACITY_LABEL_BOUNDS__);
  expect(capacityBounds).toBeTruthy();
  if (capacityBounds) {
    expect(capacityBounds.left).toBeGreaterThanOrEqual(CAPACITY_PILL_CENTER_X - CAPACITY_PILL_HALF_WIDTH);
    expect(capacityBounds.right).toBeLessThanOrEqual(CAPACITY_PILL_CENTER_X + CAPACITY_PILL_HALF_WIDTH);
    expect(capacityBounds.top).toBeGreaterThanOrEqual(CAPACITY_PILL_CENTER_Y - CAPACITY_PILL_HALF_HEIGHT);
    expect(capacityBounds.bottom).toBeLessThanOrEqual(CAPACITY_PILL_CENTER_Y + CAPACITY_PILL_HALF_HEIGHT);
  }
  await page.waitForFunction(() => (window.__RPIXEL_RESERVE_LEFT__ ?? 0) > 0);
  await page.waitForFunction(() => (window.__RPIXEL_LOCKED_RESERVE__ ?? 0) > 0);

  const visibleReserveRows = await visibleReserve(page);
  expect(visibleReserveRows).toHaveLength(6);
  expect([...new Set(visibleReserveRows.map((item) => item.row))]).toEqual([0, 1]);
  const bottomReserveY = Math.max(...visibleReserveRows.map((item) => item.y)) + RESERVE_TOKEN_HALF_HEIGHT;
  expect(BOOSTER_BAR_TOP_Y - bottomReserveY).toBeGreaterThanOrEqual(MIN_RESERVE_TOOLBAR_GAP);

  const balance = await page.evaluate(() => ({
    board: window.__RPIXEL_BOARD_COLOR_COUNTS__ ?? {},
    ammo: window.__RPIXEL_AMMO_COLOR_TOTALS__ ?? {},
    blocks: window.__RPIXEL_BLOCKS_LEFT__ ?? 0,
    shooterAmmo: window.__RPIXEL_ALL_SHOOTER_AMMO__ ?? [],
  }));
  expect(balance.ammo).toEqual(balance.board);
  expect(Object.values(balance.board).reduce((sum, value) => sum + Number(value), 0)).toBe(balance.blocks);
  expect(balance.shooterAmmo.length).toBeGreaterThan(0);
  expect(balance.shooterAmmo.every((value) => value > 0 && value % 5 === 0)).toBe(true);

  const conveyorStart = await page.evaluate(() => ({
    offset: window.__RPIXEL_CONVEYOR_OFFSET__ ?? 0,
    markers: window.__RPIXEL_CONVEYOR_MARKERS__ ?? 0,
    spacing: window.__RPIXEL_CONVEYOR_PLATE_SPACING__ ?? 78,
  }));
  expect(conveyorStart.markers).toBeGreaterThan(20);
  await page.waitForTimeout(260);
  const conveyorEnd = await page.evaluate(() => window.__RPIXEL_CONVEYOR_OFFSET__ ?? 0);
  expect(modularDelta(conveyorStart.offset, conveyorEnd, conveyorStart.spacing)).toBeGreaterThan(10);

  const shape = await page.evaluate(() => window.__RPIXEL_BOARD_SHAPE__);
  expect(shape?.empty).toBeGreaterThan(30);
  expect(new Set(shape?.rowWidths ?? []).size).toBeGreaterThan(3);
  expect(Math.min(...(shape?.rowWidths ?? [0]))).toBeLessThan(Math.max(...(shape?.rowWidths ?? [0])));

  const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
  const reserve = await visibleReserve(page);
  const nonMatching = reserve.find((item) => !item.locked && !exposed.has(item.color));
  expect(nonMatching).toBeTruthy();
  if (!nonMatching) {
    return;
  }

  await clickGame(page, box, nonMatching.x + 84, nonMatching.y + 8);
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 1, undefined, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__RPIXEL_CAPACITY_LABEL__)).toBe('1-5');
  await page.waitForFunction(
    () => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 && (window.__RPIXEL_VISIBLE_WAITING__ ?? []).some((item) => item.status === 'stuck'),
    undefined,
    { timeout: 12_000 },
  );

  const waiting = (await visibleWaiting(page)).find((item) => item.status === 'stuck');
  expect(waiting).toBeTruthy();
  if (!waiting) {
    return;
  }
  await page.waitForTimeout(100);
  await clickGame(page, box, waiting.x + 84, waiting.y + 8);
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 1 && (window.__RPIXEL_SLOTS_FILLED__ ?? 0) === 0, undefined, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__RPIXEL_CAPACITY_LABEL__)).toBe('1-5');
});

test('can run multiple shooters on the track at once', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const { box } = await gameBox(page);
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');

  for (let count = 0; count < 5; count += 1) {
    const next = (await visibleReserve(page)).find((item) => !item.locked);
    expect(next).toBeTruthy();
    if (!next) {
      return;
    }
    await clickGame(page, box, next.x, next.y);
    await page.waitForTimeout(80);
  }

  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 5, undefined, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__RPIXEL_CAPACITY_LABEL__)).toBe('5-5');
  const ignored = (await visibleReserve(page)).find((item) => !item.locked);
  if (ignored) {
    await clickGame(page, box, ignored.x, ignored.y);
    await page.waitForTimeout(200);
  }
  expect(await page.evaluate(() => window.__RPIXEL_ACTIVE_PIGS__ ?? 0)).toBe(5);

  const firstPosition = await page.evaluate(() => (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? [])[0]?.distance ?? 0);
  await page.waitForTimeout(500);
  const secondPosition = await page.evaluate(() => (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? [])[0]?.distance ?? 0);
  expect(Math.abs(secondPosition - firstPosition)).toBeGreaterThan(80);

  const active = await page.evaluate(() => window.__RPIXEL_ACTIVE_PIGS__ ?? 0);
  expect(active).toBeGreaterThan(0);
  expect(active).toBeLessThanOrEqual(5);
});

test('speed toggle switches active shooters from 1x to 5x', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const { box } = await gameBox(page);
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');
  expect(await page.evaluate(() => window.__RPIXEL_SPEED_MULTIPLIER__)).toBe(1);

  const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
  const reserve = await visibleReserve(page);
  const shooter = reserve.find((item) => !item.locked && !exposed.has(item.color)) ?? reserve.find((item) => !item.locked);
  expect(shooter).toBeTruthy();
  if (!shooter) {
    return;
  }

  await clickGame(page, box, shooter.x, shooter.y);
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? [])[0]?.orbiting === true, undefined, { timeout: 10_000 });
  await page.waitForTimeout(120);

  const start1x = await page.evaluate(() => ({
    distance: (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? [])[0]?.distance ?? 0,
    offset: window.__RPIXEL_CONVEYOR_OFFSET__ ?? 0,
    spacing: window.__RPIXEL_CONVEYOR_PLATE_SPACING__ ?? 78,
    trackSpeed: window.__RPIXEL_TRACK_SPEED__ ?? 0,
    conveyorSpeed: window.__RPIXEL_CONVEYOR_SCROLL_SPEED__ ?? -1,
    effectiveConveyorSpeed: window.__RPIXEL_CONVEYOR_EFFECTIVE_SCROLL_SPEED__ ?? -1,
  }));
  expect(start1x.conveyorSpeed).toBeLessThan(start1x.trackSpeed);
  expect(start1x.effectiveConveyorSpeed).toBe(start1x.conveyorSpeed);
  await page.waitForTimeout(160);
  const end1x = await page.evaluate(() => ({
    distance: (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? [])[0]?.distance ?? 0,
    offset: window.__RPIXEL_CONVEYOR_OFFSET__ ?? 0,
  }));
  const delta1x = end1x.distance - start1x.distance;
  expect(delta1x).toBeGreaterThan(70);
  expect(modularDelta(start1x.offset, end1x.offset, start1x.spacing)).toBeGreaterThan(12);

  await clickGame(page, box, SPEED_TOGGLE_X, SPEED_TOGGLE_Y);
  await page.waitForFunction(() => window.__RPIXEL_SPEED_MULTIPLIER__ === 5);
  const start5x = await page.evaluate(() => ({
    distance: (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? [])[0]?.distance ?? 0,
    offset: window.__RPIXEL_CONVEYOR_OFFSET__ ?? 0,
    spacing: window.__RPIXEL_CONVEYOR_PLATE_SPACING__ ?? 78,
    effectiveConveyorSpeed: window.__RPIXEL_CONVEYOR_EFFECTIVE_SCROLL_SPEED__ ?? 0,
    trackSpeed: window.__RPIXEL_TRACK_SPEED__ ?? 0,
  }));
  expect(start5x.effectiveConveyorSpeed).toBeLessThan(start5x.trackSpeed);
  await page.waitForTimeout(160);
  const end5x = await page.evaluate(() => ({
    distance: (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? [])[0]?.distance ?? 0,
    offset: window.__RPIXEL_CONVEYOR_OFFSET__ ?? 0,
  }));
  const delta5x = end5x.distance - start5x.distance;
  expect(delta5x).toBeGreaterThan(delta1x * 3);
  expect(modularDelta(start5x.offset, end5x.offset, start5x.spacing)).toBeGreaterThan(14);
});

test('keeps waiting slots left-packed when any waiting shooter launches', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const { box } = await gameBox(page);
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');
  await clickGame(page, box, SPEED_TOGGLE_X, SPEED_TOGGLE_Y);
  await page.waitForFunction(() => window.__RPIXEL_SPEED_MULTIPLIER__ === 5);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const stuckCount = await page.evaluate(() => (window.__RPIXEL_VISIBLE_WAITING__ ?? []).filter((item) => item.status === 'stuck').length);
    if (stuckCount >= 3) {
      break;
    }
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 || window.__RPIXEL_SCENE__ !== 'game', undefined, { timeout: 18_000 });
    expect(await page.evaluate(() => window.__RPIXEL_SCENE__)).toBe('game');
    const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
    const reserve = await visibleReserve(page);
    const candidate = reserve.find((item) => !item.locked && !exposed.has(item.color)) ?? reserve.find((item) => !item.locked);
    expect(candidate).toBeTruthy();
    if (!candidate) {
      return;
    }
    await clickGame(page, box, candidate.x, candidate.y);
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 1, undefined, { timeout: 10_000 });
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 || window.__RPIXEL_SCENE__ !== 'game', undefined, { timeout: 18_000 });
    expect(await page.evaluate(() => window.__RPIXEL_SCENE__)).toBe('game');
    await page.waitForTimeout(200);
  }

  await page.waitForFunction(
    () => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 && (window.__RPIXEL_VISIBLE_WAITING__ ?? []).filter((item) => item.status === 'stuck').length === 3,
    undefined,
    { timeout: 14_000 },
  );
  const before = (await visibleWaiting(page)).filter((item) => item.status === 'stuck').sort((a, b) => a.index - b.index);
  expect(before.map((item) => item.index)).toEqual([0, 1, 2]);

  await clickGame(page, box, SPEED_TOGGLE_X, SPEED_TOGGLE_Y);
  await page.waitForFunction(() => window.__RPIXEL_SPEED_MULTIPLIER__ === 1);
  await page.waitForTimeout(100);
  await clickGame(page, box, before[1].x, before[1].y);
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 1, undefined, { timeout: 10_000 });
  await page.waitForTimeout(250);

  const after = (await visibleWaiting(page)).filter((item) => item.status === 'stuck').sort((a, b) => a.index - b.index);
  expect(after.map((item) => item.index)).toEqual(after.map((_, index) => index));
  expect(after[0]?.id).toBe(before[0].id);
  expect(after[1]?.id).toBe(before[2].id);
});

test('edge hit zones launch all first-row reserve columns and every waiting slot', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const { box } = await gameBox(page);
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');
  await clickGame(page, box, SPEED_TOGGLE_X, SPEED_TOGGLE_Y);
  await page.waitForFunction(() => window.__RPIXEL_SPEED_MULTIPLIER__ === 5);

  const initialTop = (await visibleReserve(page)).filter((item) => !item.locked).sort((a, b) => a.col - b.col);
  expect(initialTop).toHaveLength(3);
  for (const shooter of initialTop) {
    await clickGame(page, box, shooter.x + 96, shooter.y + 12);
    await page.waitForTimeout(120);
  }
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 3, undefined, { timeout: 10_000 });
  const afterTop = await visibleReserve(page);
  initialTop.forEach((shooter) => {
    expect(afterTop.find((entry) => entry.col === shooter.col && entry.row === 0)?.id).not.toBe(shooter.id);
  });

  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0, undefined, { timeout: 18_000 });

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.waitForFunction(
      () => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 && (window.__RPIXEL_VISIBLE_WAITING__ ?? []).every((item) => item.status === 'stuck'),
      undefined,
      { timeout: 18_000 },
    );
    const occupiedSlots = await page.evaluate(() => window.__RPIXEL_SLOTS_FILLED__ ?? 0);
    if (occupiedSlots >= 5) {
      break;
    }
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 || window.__RPIXEL_SCENE__ !== 'game', undefined, { timeout: 18_000 });
    expect(await page.evaluate(() => window.__RPIXEL_SCENE__)).toBe('game');
    const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
    const reserve = await visibleReserve(page);
    const candidate = reserve.find((item) => !item.locked && !exposed.has(item.color)) ?? reserve.find((item) => !item.locked);
    expect(candidate).toBeTruthy();
    if (!candidate) {
      return;
    }
    await clickGame(page, box, candidate.x, candidate.y);
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 1, undefined, { timeout: 10_000 });
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 || window.__RPIXEL_SCENE__ !== 'game', undefined, { timeout: 18_000 });
    expect(await page.evaluate(() => window.__RPIXEL_SCENE__)).toBe('game');
    await page.waitForTimeout(200);
  }

  await page.waitForFunction(
    () => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 && (window.__RPIXEL_VISIBLE_WAITING__ ?? []).filter((item) => item.status === 'stuck').length === 5,
    undefined,
    { timeout: 14_000 },
  );
  await clickGame(page, box, SPEED_TOGGLE_X, SPEED_TOGGLE_Y);
  await page.waitForFunction(() => window.__RPIXEL_SPEED_MULTIPLIER__ === 1);
  const waiting = (await visibleWaiting(page)).filter((item) => item.status === 'stuck').sort((a, b) => b.index - a.index);
  expect(waiting.map((item) => item.index)).toEqual([4, 3, 2, 1, 0]);

  for (const shooter of waiting) {
    await clickGame(page, box, shooter.x + 78, shooter.y + 12);
    await page.waitForTimeout(35);
  }

  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 5 && (window.__RPIXEL_SLOTS_FILLED__ ?? 0) === 0, undefined, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__RPIXEL_CAPACITY_LABEL__)).toBe('5-5');
});

test('advances only the clicked reserve column and fires one shot per track step', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const { box } = await gameBox(page);
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');

  const before = await visibleReserve(page);
  const topRow = before.filter((item) => !item.locked).sort((a, b) => a.col - b.col);
  expect(topRow).toHaveLength(3);

  const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
  const chosen = topRow.find((item) => exposed.has(item.color)) ?? topRow[0];
  const unchanged = topRow.filter((item) => item.col !== chosen.col).map((item) => ({ col: item.col, id: item.id }));
  await clickGame(page, box, chosen.x, chosen.y);

  await page.waitForFunction(
    ({ col, id }) => {
      const nextTop = (window.__RPIXEL_VISIBLE_RESERVE__ ?? []).find((item) => item.col === col && item.row === 0);
      return Boolean(nextTop && nextTop.id !== id);
    },
    { col: chosen.col, id: chosen.id },
    { timeout: 10_000 },
  );

  const after = await visibleReserve(page);
  unchanged.forEach((item) => {
    expect(after.find((entry) => entry.col === item.col && entry.row === 0)?.id).toBe(item.id);
  });
  expect(after.filter((item) => !item.locked).every((item) => item.row === 0)).toBe(true);

  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? []).some((item) => item.orbiting), undefined, { timeout: 10_000 });
  const active = await page.evaluate(() => (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? [])[0]);
  const rotations: Record<string, number> = { bottom: 0, left: Math.PI / 2, top: Math.PI, right: -Math.PI / 2 };
  expect(Math.abs(active.rotation - rotations[active.side])).toBeLessThan(0.01);

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = await page.evaluate(() => ({
      scene: window.__RPIXEL_SCENE__,
      active: window.__RPIXEL_ACTIVE_PIGS__ ?? 0,
      slots: window.__RPIXEL_SLOTS_FILLED__ ?? 0,
      exposed: window.__RPIXEL_EXPOSED_COLORS__ ?? [],
      reserve: window.__RPIXEL_VISIBLE_RESERVE__ ?? [],
      waiting: window.__RPIXEL_VISIBLE_WAITING__ ?? [],
      shots: window.__RPIXEL_SHOT_LOG__ ?? [],
    }));
    expect(state.scene).toBe('game');
    if (state.shots.length >= 2) {
      break;
    }
    if (state.active < 5) {
      const exposedColors = new Set(state.exposed);
      const chosen =
        state.reserve.find((item) => !item.locked && exposedColors.has(item.color)) ??
        state.waiting.find((item) => item.status === 'stuck' && exposedColors.has(item.color)) ??
        (state.slots < 4 ? state.reserve.find((item) => !item.locked) : undefined);
      if (chosen) {
        await clickGame(page, box, chosen.x, chosen.y);
      }
    }
    await page.waitForTimeout(250);
  }

  await page.waitForFunction(() => (window.__RPIXEL_SHOT_LOG__ ?? []).length >= 2, undefined, { timeout: 12_000 });
  const shots = await page.evaluate(() => window.__RPIXEL_SHOT_LOG__ ?? []);
  const stepKeys = shots.map((shot) => `${shot.pigId}:${shot.side}:${shot.lineIndex}`);
  expect(new Set(stepKeys).size).toBe(stepKeys.length);
});

test('fails only when a returning shooter would overflow five waiting slots', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const { box } = await gameBox(page);
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');
  await clickGame(page, box, SPEED_TOGGLE_X, SPEED_TOGGLE_Y);
  await page.waitForFunction(() => window.__RPIXEL_SPEED_MULTIPLIER__ === 5);

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const slots = await page.evaluate(() => window.__RPIXEL_SLOTS_FILLED__ ?? 0);
    if (slots >= 5) {
      break;
    }
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0, undefined, { timeout: 18_000 });
    const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
    const reserve = await visibleReserve(page);
    const candidate = reserve.find((item) => !item.locked && !exposed.has(item.color)) ?? reserve.find((item) => !item.locked);
    expect(candidate).toBeTruthy();
    if (!candidate) {
      return;
    }
    await clickGame(page, box, candidate.x, candidate.y);
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 1, undefined, { timeout: 10_000 });
    await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0, undefined, { timeout: 18_000 });
    expect(await page.evaluate(() => window.__RPIXEL_SCENE__)).toBe('game');
  }

  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 && (window.__RPIXEL_SLOTS_FILLED__ ?? 0) === 5, undefined, { timeout: 18_000 });
  expect(await page.evaluate(() => window.__RPIXEL_SCENE__)).toBe('game');

  const exposedBeforeOverflow = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
  const overflowCandidates = (await visibleReserve(page)).filter((item) => !item.locked);
  const overflow = overflowCandidates.find((item) => !exposedBeforeOverflow.has(item.color)) ?? overflowCandidates.sort((a, b) => b.ammo - a.ammo)[0];
  expect(overflow).toBeTruthy();
  if (!overflow) {
    return;
  }
  await clickGame(page, box, overflow.x, overflow.y);
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 1, undefined, { timeout: 10_000 });
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'fail', undefined, { timeout: 14_000 });
});

test('can complete the level, unlock treasure, and show the win panel', async ({ page }) => {
  test.setTimeout(240_000);
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const clickAt = async (x: number, y: number) => {
    await clickGame(page, box, x, y);
  };

  await clickAt(540, 1535);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');
  await clickAt(SPEED_TOGGLE_X, SPEED_TOGGLE_Y);
  await page.waitForFunction(() => window.__RPIXEL_SPEED_MULTIPLIER__ === 5);

  for (let step = 0; step < 520; step += 1) {
    await page.waitForTimeout(120);
    const state = await page.evaluate(() => ({
      scene: window.__RPIXEL_SCENE__,
      active: window.__RPIXEL_ACTIVE_PIGS__,
      blocks: window.__RPIXEL_BLOCKS_LEFT__,
      slots: window.__RPIXEL_SLOTS_FILLED__,
      exposed: window.__RPIXEL_EXPOSED_COLORS__ ?? [],
      reserve: window.__RPIXEL_VISIBLE_RESERVE__ ?? [],
      waiting: window.__RPIXEL_VISIBLE_WAITING__ ?? [],
    }));

    if (state.scene !== 'game' || state.blocks === 0) {
      break;
    }
    if ((state.active ?? 0) >= 5) {
      continue;
    }

    const exposed = new Set(state.exposed);
    const reserveCandidates = state.reserve.filter((item) => !item.locked);
    const waitingCandidates = state.waiting.filter((item) => item.status === 'stuck');
    const matchingWaiting = waitingCandidates.find((item) => exposed.has(item.color));
    const matchingReserve = reserveCandidates.find((item) => exposed.has(item.color));
    const underReturnPressure = (state.slots ?? 0) + (state.active ?? 0) >= 4;
    const chosen =
      (underReturnPressure ? matchingWaiting : undefined) ??
      matchingReserve ??
      matchingWaiting ??
      (underReturnPressure ? waitingCandidates[0] : undefined) ??
      reserveCandidates[0] ??
      waitingCandidates[0];
    if (!chosen) {
      if ((state.reserve.length === 0 && state.waiting.length === 0) || (state.active ?? 0) + (state.slots ?? 0) > 0) {
        continue;
      }
      expect((state.active ?? 0) + (state.slots ?? 0)).toBeGreaterThan(0);
      continue;
    }
    await clickAt(chosen.x, chosen.y);
    await page.waitForTimeout(80);
  }

  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'win' && window.__RPIXEL_BLOCKS_LEFT__ === 0 && window.__RPIXEL_TREASURE_UNLOCKED__ === true, undefined, {
    timeout: 30_000,
  });
  await page.waitForTimeout(250);
  await clickAt(370, 1180);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu' && window.localStorage.getItem('rpixel-current-level') === '1101', undefined, { timeout: 10_000 });
});
