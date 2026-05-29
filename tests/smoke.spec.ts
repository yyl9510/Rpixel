import { expect, test } from '@playwright/test';

test('loads the menu and starts a pig run', async ({ page }) => {
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

  await page.mouse.click(box.x + box.width * (160 / 1080), box.y + box.height * (210 / 1920));
  await page.waitForFunction(() => (window.__RPIXEL_ACTIVE_PIGS__ ?? 0) > 0);
});
