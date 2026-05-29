import { expect, test } from '@playwright/test';

test('loads the menu and drives reserve-to-slot gameplay', async ({ page }) => {
  await page.goto('./');
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
  await page.waitForFunction(() => window.__RPIXEL_STUCK_SLOTS__ === 1 && window.__RPIXEL_RESERVE_LEFT__ === 13 && window.__RPIXEL_LOCKED_RESERVE__ === 6);

  await page.mouse.click(box.x + box.width * (674 / 1080), box.y + box.height * (1530 / 1920));
  await page.waitForFunction(() => (window.__RPIXEL_BLOCKS_LEFT__ ?? 36) < 36, { timeout: 8_000 });
});

test('fails only when all active slots are stuck and another reserve shooter is clicked', async ({ page }) => {
  await page.goto('./');
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
