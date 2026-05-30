import { expect, test, type Page } from '@playwright/test';

interface CanvasBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

test('loads the menu and drives reserve-to-slot gameplay', async ({ page }) => {
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
  await page.waitForFunction(() => (window.__RPIXEL_RESERVE_LEFT__ ?? 0) > 0);
  await page.waitForFunction(() => (window.__RPIXEL_LOCKED_RESERVE__ ?? 0) > 0);

  const balance = await page.evaluate(() => ({
    board: window.__RPIXEL_BOARD_COLOR_COUNTS__ ?? {},
    ammo: window.__RPIXEL_AMMO_COLOR_TOTALS__ ?? {},
    blocks: window.__RPIXEL_BLOCKS_LEFT__ ?? 0,
  }));
  expect(balance.ammo).toEqual(balance.board);
  expect(Object.values(balance.board).reduce((sum, value) => sum + Number(value), 0)).toBe(balance.blocks);

  const initialBlocks = await page.evaluate(() => window.__RPIXEL_BLOCKS_LEFT__ ?? 0);
  const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
  const reserve = await visibleReserve(page);
  const stuck = reserve.find((item) => !item.locked && !exposed.has(item.color));
  expect(stuck).toBeTruthy();
  if (!stuck) {
    return;
  }

  await clickGame(page, box, stuck.x, stuck.y);
  await page.waitForFunction(() => window.__RPIXEL_STUCK_SLOTS__ === 1);

  const exposedAfterStuck = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
  const matching = (await visibleReserve(page)).find((item) => !item.locked && exposedAfterStuck.has(item.color));
  expect(matching).toBeTruthy();
  if (!matching) {
    return;
  }
  await clickGame(page, box, matching.x, matching.y);
  await page.waitForFunction((before) => (window.__RPIXEL_BLOCKS_LEFT__ ?? before) < before, initialBlocks, { timeout: 10_000 });
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

  const initialExposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
  const first = (await visibleReserve(page)).find((item) => !item.locked && initialExposed.has(item.color));
  expect(first).toBeTruthy();
  if (!first) {
    return;
  }
  await clickGame(page, box, first.x, first.y);
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) >= 1, undefined, { timeout: 10_000 });

  const blue = (await visibleReserve(page)).find((item) => !item.locked && item.color === 'blue');
  expect(blue).toBeTruthy();
  if (!blue) {
    return;
  }
  await clickGame(page, box, blue.x, blue.y);
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) >= 2, undefined, { timeout: 10_000 });
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? []).some((item) => item.color === 'blue' && item.orbiting), undefined, { timeout: 10_000 });
  const firstBluePosition = await page.evaluate(() => (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? []).find((item) => item.color === 'blue')?.distance ?? 0);
  await page.waitForTimeout(500);
  const secondBluePosition = await page.evaluate(() => (window.__RPIXEL_ACTIVE_SHOOTERS__ ?? []).find((item) => item.color === 'blue')?.distance ?? 0);
  expect(Math.abs(secondBluePosition - firstBluePosition)).toBeGreaterThan(80);

  const active = await page.evaluate(() => window.__RPIXEL_ACTIVE_PIGS__ ?? 0);
  expect(active).toBeGreaterThanOrEqual(2);
  expect(active).toBeLessThanOrEqual(5);
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

  await page.waitForFunction(() => (window.__RPIXEL_SHOT_LOG__ ?? []).length >= 2, undefined, { timeout: 12_000 });
  const shots = await page.evaluate(() => window.__RPIXEL_SHOT_LOG__ ?? []);
  const stepKeys = shots.map((shot) => `${shot.pigId}:${shot.side}:${shot.lineIndex}`);
  expect(new Set(stepKeys).size).toBe(stepKeys.length);
});

test('fails only when all active slots are stuck and another reserve shooter is clicked', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const { box } = await gameBox(page);
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');

  for (let count = 1; count <= 5; count += 1) {
    const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
    const candidate = (await visibleReserve(page)).find((item) => !item.locked && !exposed.has(item.color));
    expect(candidate).toBeTruthy();
    if (!candidate) {
      return;
    }
    await clickGame(page, box, candidate.x, candidate.y);
    await page.waitForFunction((expected) => window.__RPIXEL_STUCK_SLOTS__ === expected, count);
  }

  const next = (await visibleReserve(page)).find((item) => !item.locked);
  expect(next).toBeTruthy();
  if (!next) {
    return;
  }
  await clickGame(page, box, next.x, next.y);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'fail');
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

  for (let step = 0; step < 220; step += 1) {
    await page.waitForTimeout(260);
    const state = await page.evaluate(() => ({
      scene: window.__RPIXEL_SCENE__,
      active: window.__RPIXEL_ACTIVE_PIGS__,
      blocks: window.__RPIXEL_BLOCKS_LEFT__,
      slots: window.__RPIXEL_SLOTS_FILLED__,
      exposed: window.__RPIXEL_EXPOSED_COLORS__ ?? [],
      reserve: window.__RPIXEL_VISIBLE_RESERVE__ ?? [],
    }));

    if (state.scene !== 'game' || state.blocks === 0) {
      break;
    }
    if ((state.active ?? 0) >= 5) {
      continue;
    }

    const exposed = new Set(state.exposed);
    const candidates = state.reserve.filter((item) => !item.locked);
    const chosen = candidates.find((item) => exposed.has(item.color)) ?? ((state.slots ?? 0) < 5 ? candidates[0] : undefined);
    if (!chosen) {
      expect((state.active ?? 0) + (state.slots ?? 0)).toBeGreaterThan(0);
      continue;
    }
    await clickAt(chosen.x, chosen.y);
    await page.waitForTimeout(80);
  }

  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'win' && window.__RPIXEL_BLOCKS_LEFT__ === 0 && window.__RPIXEL_TREASURE_UNLOCKED__ === true, undefined, {
    timeout: 20_000,
  });
  await page.waitForTimeout(250);
  await clickAt(370, 1180);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu' && window.localStorage.getItem('rpixel-current-level') === '1101', undefined, { timeout: 10_000 });
});
