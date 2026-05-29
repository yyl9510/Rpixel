import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => window.localStorage.clear());
});

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
  await page.waitForFunction(() => window.__RPIXEL_LOCKED_RESERVE__ === 7);

  await page.mouse.click(box.x + box.width * (142 / 1080), box.y + box.height * (1530 / 1920));
  await page.waitForFunction(() => window.__RPIXEL_STUCK_SLOTS__ === 1 && window.__RPIXEL_RESERVE_LEFT__ === 17 && window.__RPIXEL_LOCKED_RESERVE__ === 7);

  await page.mouse.click(box.x + box.width * (674 / 1080), box.y + box.height * (1530 / 1920));
  await page.waitForFunction(() => (window.__RPIXEL_BLOCKS_LEFT__ ?? 36) < 36, { timeout: 8_000 });
});

test('fails only when all active slots are stuck and another reserve shooter is clicked', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'game');

  for (let count = 1; count <= 5; count += 1) {
    await page.mouse.click(box.x + box.width * (142 / 1080), box.y + box.height * (1530 / 1920));
    await page.waitForFunction((expected) => window.__RPIXEL_STUCK_SLOTS__ === expected, count);
  }

  await page.mouse.click(box.x + box.width * (142 / 1080), box.y + box.height * (1530 / 1920));
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'fail');
});

test('can complete the level, unlock treasure, and show the win panel', async ({ page }) => {
  test.setTimeout(120_000);
  await page.reload();
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu');

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const clickGame = async (x: number, y: number) => {
    await page.mouse.click(box.x + box.width * (x / 1080), box.y + box.height * (y / 1920));
  };

  await clickGame(540, 1535);
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
    await clickGame(chosen.x, chosen.y);
    await page.waitForTimeout(120);
  }

  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'win' && window.__RPIXEL_BLOCKS_LEFT__ === 0 && window.__RPIXEL_TREASURE_UNLOCKED__ === true, {
    timeout: 20_000,
  });
  await clickGame(370, 1180);
  await page.waitForFunction(() => window.__RPIXEL_SCENE__ === 'menu' && window.localStorage.getItem('rpixel-current-level') === '1101', { timeout: 10_000 });
});
