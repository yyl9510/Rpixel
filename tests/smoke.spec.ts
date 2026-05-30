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
  test.setTimeout(180_000);
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

  for (let step = 0; step < 120; step += 1) {
    await page.waitForFunction(() => window.__RPIXEL_SCENE__ !== 'game' || window.__RPIXEL_ACTIVE_PIGS__ === 0, { timeout: 12_000 });
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
    if (state.active) {
      continue;
    }

    const exposed = new Set(state.exposed);
    const candidates = state.reserve.filter((item) => !item.locked);
    const chosen = candidates.find((item) => exposed.has(item.color)) ?? ((state.slots ?? 0) < 5 ? candidates[0] : undefined);
    expect(chosen).toBeTruthy();
    if (!chosen) {
      return;
    }
    await clickAt(chosen.x, chosen.y);
    await page.waitForTimeout(80);
  }

  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'win' && window.__RPIXEL_BLOCKS_LEFT__ === 0 && window.__RPIXEL_TREASURE_UNLOCKED__ === true, {
    timeout: 20_000,
  });
  await clickAt(370, 1180);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu' && window.localStorage.getItem('rpixel-current-level') === '1101', { timeout: 10_000 });
});
