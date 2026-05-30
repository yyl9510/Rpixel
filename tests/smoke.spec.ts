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

async function visibleWaiting(page: Page) {
  return page.evaluate(() => window.__RPIXEL_VISIBLE_WAITING__ ?? []);
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
  await page.waitForFunction(() => (window.__RPIXEL_RESERVE_LEFT__ ?? 0) > 0);
  await page.waitForFunction(() => (window.__RPIXEL_LOCKED_RESERVE__ ?? 0) > 0);

  const balance = await page.evaluate(() => ({
    board: window.__RPIXEL_BOARD_COLOR_COUNTS__ ?? {},
    ammo: window.__RPIXEL_AMMO_COLOR_TOTALS__ ?? {},
    blocks: window.__RPIXEL_BLOCKS_LEFT__ ?? 0,
  }));
  expect(balance.ammo).toEqual(balance.board);
  expect(Object.values(balance.board).reduce((sum, value) => sum + Number(value), 0)).toBe(balance.blocks);

  const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
  const reserve = await visibleReserve(page);
  const nonMatching = reserve.find((item) => !item.locked && !exposed.has(item.color));
  expect(nonMatching).toBeTruthy();
  if (!nonMatching) {
    return;
  }

  await clickGame(page, box, nonMatching.x, nonMatching.y);
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
  await clickGame(page, box, waiting.x, waiting.y);
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
  expect(active).toBe(5);
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

  for (let count = 0; count < 3; count += 1) {
    const exposed = new Set(await page.evaluate(() => window.__RPIXEL_EXPOSED_COLORS__ ?? []));
    const candidate = (await visibleReserve(page)).find((item) => !item.locked && !exposed.has(item.color));
    expect(candidate).toBeTruthy();
    if (!candidate) {
      return;
    }
    await clickGame(page, box, candidate.x, candidate.y);
    await page.waitForTimeout(80);
  }

  await page.waitForFunction(
    () => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 && (window.__RPIXEL_VISIBLE_WAITING__ ?? []).filter((item) => item.status === 'stuck').length === 3,
    undefined,
    { timeout: 14_000 },
  );
  const before = (await visibleWaiting(page)).filter((item) => item.status === 'stuck').sort((a, b) => a.index - b.index);
  expect(before.map((item) => item.index)).toEqual([0, 1, 2]);

  await page.waitForTimeout(100);
  await clickGame(page, box, before[1].x, before[1].y);
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 1, undefined, { timeout: 10_000 });
  await page.waitForTimeout(250);

  const after = (await visibleWaiting(page)).filter((item) => item.status === 'stuck').sort((a, b) => a.index - b.index);
  expect(after.map((item) => item.index)).toEqual([0, 1]);
  expect(after.map((item) => item.id)).toEqual([before[0].id, before[2].id]);
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

test('fails only when a returning shooter would overflow five waiting slots', async ({ page }) => {
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
    await page.waitForTimeout(80);
  }

  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) === 0 && (window.__RPIXEL_SLOTS_FILLED__ ?? 0) === 5, undefined, { timeout: 14_000 });
  expect(await page.evaluate(() => window.__RPIXEL_SCENE__)).toBe('game');

  const overflow = (await visibleReserve(page)).find((item) => !item.locked);
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

  for (let step = 0; step < 220; step += 1) {
    await page.waitForTimeout(260);
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
    const chosen =
      ((state.slots ?? 0) >= 4 ? waitingCandidates.find((item) => exposed.has(item.color)) ?? waitingCandidates[0] : undefined) ??
      reserveCandidates.find((item) => exposed.has(item.color)) ??
      waitingCandidates.find((item) => exposed.has(item.color)) ??
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
    timeout: 20_000,
  });
  await page.waitForTimeout(250);
  await clickAt(370, 1180);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu' && window.localStorage.getItem('rpixel-current-level') === '1101', undefined, { timeout: 10_000 });
});
