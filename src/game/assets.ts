import Phaser from 'phaser';
import type { PigColor } from './types';

interface ColorStyle {
  base: number;
  dark: number;
  light: number;
  text: string;
}

export const COLOR_STYLES: Record<PigColor, ColorStyle> = {
  red: { base: 0xf43f5e, dark: 0x9f1239, light: 0xff8fab, text: 'R' },
  blue: { base: 0x15c8f4, dark: 0x0c71b8, light: 0xa2f4ff, text: 'B' },
  yellow: { base: 0xffcf3f, dark: 0xd98b00, light: 0xfff1a6, text: 'Y' },
  green: { base: 0x35c95f, dark: 0x16863a, light: 0x9cf2b2, text: 'G' },
  purple: { base: 0x9b5cff, dark: 0x6034ba, light: 0xd2b6ff, text: 'P' },
  orange: { base: 0xff8a22, dark: 0xb94b00, light: 0xffc36b, text: 'O' },
  white: { base: 0xf7fbff, dark: 0xa5b3c8, light: 0xffffff, text: 'W' },
};


const GEMINI_ASSET_SOURCES = {
  blocks: new URL('../../Gemini_rpixel_assets/block_spritesheet.png', import.meta.url).href,
  boosters: new URL('../../Gemini_rpixel_assets/button_and_icons_spritesheet.png', import.meta.url).href,
  hud: new URL('../../Gemini_rpixel_assets/hud_icons_spritesheet.png', import.meta.url).href,
  monsters: new URL('../../Gemini_rpixel_assets/monster_spritesheet.png', import.meta.url).href,
  track: new URL('../../Gemini_rpixel_assets/track_frame.png', import.meta.url).href,
  waitingSlot: new URL('../../Gemini_rpixel_assets/waiting_slot_frame.png', import.meta.url).href,
} as const;

type GeminiSheetKey = keyof typeof GEMINI_ASSET_SOURCES;

const GPT_ASSET_SOURCES = {
  blockBlue: new URL('../../GPT_rpixel_assets/block_blue.png', import.meta.url).href,
  blockCyan: new URL('../../GPT_rpixel_assets/block_cyan.png', import.meta.url).href,
  blockPink: new URL('../../GPT_rpixel_assets/block_pink.png', import.meta.url).href,
  blockPurple: new URL('../../GPT_rpixel_assets/block_purple.png', import.meta.url).href,
  blockWhite: new URL('../../GPT_rpixel_assets/block_white.png', import.meta.url).href,
  blockYellow: new URL('../../GPT_rpixel_assets/block_yellow.png', import.meta.url).href,
  buttonBaseRed: new URL('../../GPT_rpixel_assets/button_base_red.png', import.meta.url).href,
  hudCoin: new URL('../../GPT_rpixel_assets/hud_coin_256.png', import.meta.url).href,
  hudGear: new URL('../../GPT_rpixel_assets/hud_gear_256.png', import.meta.url).href,
  hudPlus: new URL('../../GPT_rpixel_assets/hud_plus_256.png', import.meta.url).href,
  iconAddCard: new URL('../../GPT_rpixel_assets/icon_add_card.png', import.meta.url).href,
  iconRefresh: new URL('../../GPT_rpixel_assets/icon_refresh.png', import.meta.url).href,
  iconRocketSnail: new URL('../../GPT_rpixel_assets/icon_rocket_snail.png', import.meta.url).href,
  iconTap: new URL('../../GPT_rpixel_assets/icon_tap.png', import.meta.url).href,
  monsterBlue: new URL('../../GPT_rpixel_assets/monster_blue.png', import.meta.url).href,
  monsterCyan: new URL('../../GPT_rpixel_assets/monster_cyan.png', import.meta.url).href,
  monsterPink: new URL('../../GPT_rpixel_assets/monster_pink.png', import.meta.url).href,
  monsterPurple: new URL('../../GPT_rpixel_assets/monster_purple.png', import.meta.url).href,
  monsterWhite: new URL('../../GPT_rpixel_assets/monster_white.png', import.meta.url).href,
  monsterYellow: new URL('../../GPT_rpixel_assets/monster_yellow.png', import.meta.url).href,
  trackFrame: new URL('../../GPT_rpixel_assets/track_frame.png', import.meta.url).href,
  waitingSlotFrame: new URL('../../GPT_rpixel_assets/waiting_slot_frame_256_transparent.png', import.meta.url).href,
} as const;

type GptAssetKey = keyof typeof GPT_ASSET_SOURCES;

interface CropFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OutputSize {
  width: number;
  height: number;
}

interface ProcessTextureOptions {
  target?: OutputSize;
  padding?: number;
  tint?: number;
  trim?: boolean;
  keepLargestComponent?: boolean;
}

const GEMINI_TEXTURE_PREFIX = 'gemini-source';
const GPT_TEXTURE_PREFIX = 'gpt-source';

const GPT_BLOCK_ASSETS: Record<PigColor, { key: GptAssetKey; tint?: number }> = {
  red: { key: 'blockPink' },
  blue: { key: 'blockBlue' },
  yellow: { key: 'blockYellow' },
  green: { key: 'blockCyan', tint: COLOR_STYLES.green.base },
  purple: { key: 'blockPurple' },
  orange: { key: 'blockYellow', tint: COLOR_STYLES.orange.base },
  white: { key: 'blockWhite' },
};

const GPT_MONSTER_ASSETS: Record<PigColor, { key: GptAssetKey; tint?: number }> = {
  red: { key: 'monsterPink' },
  blue: { key: 'monsterBlue' },
  yellow: { key: 'monsterYellow' },
  green: { key: 'monsterCyan', tint: COLOR_STYLES.green.base },
  purple: { key: 'monsterPurple' },
  orange: { key: 'monsterYellow', tint: COLOR_STYLES.orange.base },
  white: { key: 'monsterWhite' },
};

const BLOCK_FRAMES: Record<PigColor, { frame: CropFrame; tint?: number }> = {
  blue: { frame: { x: 218, y: 212, width: 455, height: 452 }, tint: COLOR_STYLES.blue.base },
  green: { frame: { x: 865, y: 212, width: 454, height: 453 }, tint: COLOR_STYLES.green.base },
  yellow: { frame: { x: 1497, y: 212, width: 455, height: 452 }, tint: COLOR_STYLES.yellow.base },
  red: { frame: { x: 2143, y: 212, width: 454, height: 452 }, tint: COLOR_STYLES.red.base },
  purple: { frame: { x: 219, y: 853, width: 453, height: 448 }, tint: COLOR_STYLES.purple.base },
  white: { frame: { x: 866, y: 853, width: 453, height: 448 } },
  orange: { frame: { x: 1497, y: 212, width: 455, height: 452 }, tint: COLOR_STYLES.orange.base },
};

const MONSTER_FRAMES: Record<PigColor, { frame: CropFrame; tint?: number }> = {
  blue: { frame: { x: 129, y: 91, width: 509, height: 582 }, tint: COLOR_STYLES.blue.base },
  green: { frame: { x: 813, y: 91, width: 508, height: 582 }, tint: COLOR_STYLES.green.base },
  yellow: { frame: { x: 1495, y: 91, width: 508, height: 582 }, tint: COLOR_STYLES.yellow.base },
  red: { frame: { x: 2179, y: 91, width: 508, height: 582 }, tint: COLOR_STYLES.red.base },
  purple: { frame: { x: 449, y: 842, width: 528, height: 581 }, tint: COLOR_STYLES.purple.base },
  white: { frame: { x: 1143, y: 843, width: 530, height: 581 } },
  orange: { frame: { x: 1495, y: 91, width: 508, height: 582 }, tint: COLOR_STYLES.orange.base },
};

const GEMINI_UI_FRAMES = {
  buttonBase: { sheet: 'boosters', frame: { x: 183, y: 372, width: 796, height: 794 }, target: { width: 128, height: 128 }, padding: 2 },
  boosterAdd: { sheet: 'boosters', frame: { x: 1231, y: 185, width: 424, height: 524 }, target: { width: 84, height: 84 }, padding: 4 },
  boosterTap: { sheet: 'boosters', frame: { x: 2063, y: 169, width: 422, height: 528 }, target: { width: 84, height: 84 }, padding: 4 },
  boosterRefresh: { sheet: 'boosters', frame: { x: 1184, y: 860, width: 505, height: 276 }, target: { width: 86, height: 74 }, padding: 4 },
  boosterRocket: { sheet: 'boosters', frame: { x: 2016, y: 860, width: 534, height: 527 }, target: { width: 88, height: 88 }, padding: 2 },
  hudGear: { sheet: 'hud', frame: { x: 278, y: 442, width: 639, height: 645 }, target: { width: 86, height: 86 }, padding: 4 },
  hudCoin: { sheet: 'hud', frame: { x: 1090, y: 439, width: 636, height: 645 }, target: { width: 84, height: 84 }, padding: 2 },
  hudPlus: { sheet: 'hud', frame: { x: 1910, y: 457, width: 624, height: 624 }, target: { width: 74, height: 74 }, padding: 4 },
  trackFrame: { sheet: 'track', frame: { x: 55, y: 73, width: 1810, height: 2085 }, padding: 0 },
  waitingSlotFrame: { sheet: 'waitingSlot', frame: { x: 797, y: 182, width: 1222, height: 1181 }, target: { width: 150, height: 142 }, padding: 4 },
} as const;

export function preloadGeminiAssets(scene: Phaser.Scene): void {
  (Object.entries(GEMINI_ASSET_SOURCES) as Array<[GeminiSheetKey, string]>).forEach(([key, url]) => {
    scene.load.image(geminiSourceKey(key), url);
  });
}

export function preloadGptAssets(scene: Phaser.Scene): void {
  (Object.entries(GPT_ASSET_SOURCES) as Array<[GptAssetKey, string]>).forEach(([key, url]) => {
    scene.load.image(gptSourceKey(key), url);
  });
}

export function createGeneratedAssets(scene: Phaser.Scene): void {
  createGptAssetTextures(scene);
  createGeminiAssetTextures(scene);

  for (const [color, style] of Object.entries(COLOR_STYLES) as [PigColor, ColorStyle][]) {
    if (!scene.textures.exists(`block-${color}`)) {
      createBlockTexture(scene, color, style);
    }
    if (!scene.textures.exists(`pig-${color}`)) {
      createPigTexture(scene, color, style);
    }
    if (!scene.textures.exists(`shooter-${color}`)) {
      createShooterTexture(scene, color, style);
    }
  }
}

function createGptAssetTextures(scene: Phaser.Scene): void {
  if (!gptAssetsAreReady(scene)) {
    return;
  }

  (Object.entries(GPT_BLOCK_ASSETS) as Array<[PigColor, { key: GptAssetKey; tint?: number }]>).forEach(([color, config]) => {
    createGptProcessedTexture(scene, `block-${color}`, config.key, {
      target: { width: 128, height: 128 },
      padding: 5,
      tint: config.tint,
    });
  });

  (Object.entries(GPT_MONSTER_ASSETS) as Array<[PigColor, { key: GptAssetKey; tint?: number }]>).forEach(([color, config]) => {
    createGptProcessedTexture(scene, `pig-${color}`, config.key, {
      target: { width: 164, height: 164 },
      padding: 6,
      tint: config.tint,
    });
    createGptProcessedTexture(scene, `shooter-${color}`, config.key, {
      target: { width: 164, height: 164 },
      padding: 6,
      tint: config.tint,
    });
  });

  createGptProcessedTexture(scene, 'gemini-button-base', 'buttonBaseRed', { target: { width: 128, height: 128 }, padding: 3 });
  createGptProcessedTexture(scene, 'gemini-booster-add', 'iconAddCard', { target: { width: 84, height: 84 }, padding: 5 });
  createGptProcessedTexture(scene, 'gemini-booster-tap', 'iconTap', { target: { width: 84, height: 84 }, padding: 5 });
  createGptProcessedTexture(scene, 'gemini-booster-refresh', 'iconRefresh', { target: { width: 86, height: 74 }, padding: 5 });
  createGptProcessedTexture(scene, 'gemini-booster-rocket', 'iconRocketSnail', { target: { width: 88, height: 88 }, padding: 3 });
  createGptProcessedTexture(scene, 'gemini-hud-gear', 'hudGear', { target: { width: 86, height: 86 }, padding: 4 });
  createGptProcessedTexture(scene, 'gemini-hud-coin', 'hudCoin', { target: { width: 84, height: 84 }, padding: 3 });
  createGptProcessedTexture(scene, 'gemini-hud-plus', 'hudPlus', { target: { width: 74, height: 74 }, padding: 4 });
  createGptProcessedTexture(scene, 'gemini-track-frame', 'trackFrame', {
    trim: false,
    padding: 0,
    keepLargestComponent: true,
  });
  createGptProcessedTexture(scene, 'gemini-waiting-slot-frame', 'waitingSlotFrame', { target: { width: 150, height: 142 }, padding: 2 });

  (window as typeof window & { __RPIXEL_GPT_ASSET_MAP__?: Record<string, string> }).__RPIXEL_GPT_ASSET_MAP__ = {
    blocks: 'GPT block_*.png -> block-* textures',
    monsters: 'GPT monster_*.png -> pig-* and shooter-* textures',
    track: 'GPT track_frame.png -> gemini-track-frame compatibility key',
    waitingSlots: 'GPT waiting_slot_frame_256_transparent.png -> gemini-waiting-slot-frame compatibility key',
    hud: 'GPT hud_*.png -> gemini-hud-* compatibility keys',
    boosters: 'GPT button/icon PNGs -> gemini-button-base and gemini-booster-* compatibility keys',
  };
}

function createGeminiAssetTextures(scene: Phaser.Scene): void {
  if (!geminiSheetsAreReady(scene)) {
    return;
  }

  (Object.entries(BLOCK_FRAMES) as Array<[PigColor, { frame: CropFrame; tint?: number }]>).forEach(([color, config]) => {
    createProcessedTexture(scene, `block-${color}`, 'blocks', config.frame, {
      target: { width: 128, height: 128 },
      padding: 5,
      tint: config.tint,
    });
  });

  (Object.entries(MONSTER_FRAMES) as Array<[PigColor, { frame: CropFrame; tint?: number }]>).forEach(([color, config]) => {
    createProcessedTexture(scene, `pig-${color}`, 'monsters', config.frame, {
      target: { width: 164, height: 164 },
      padding: 4,
      tint: config.tint,
    });
    createProcessedTexture(scene, `shooter-${color}`, 'monsters', config.frame, {
      target: { width: 164, height: 164 },
      padding: 4,
      tint: config.tint,
    });
  });

  createProcessedTexture(scene, 'gemini-button-base', 'boosters', GEMINI_UI_FRAMES.buttonBase.frame, GEMINI_UI_FRAMES.buttonBase);
  createProcessedTexture(scene, 'gemini-booster-add', 'boosters', GEMINI_UI_FRAMES.boosterAdd.frame, GEMINI_UI_FRAMES.boosterAdd);
  createProcessedTexture(scene, 'gemini-booster-tap', 'boosters', GEMINI_UI_FRAMES.boosterTap.frame, GEMINI_UI_FRAMES.boosterTap);
  createProcessedTexture(scene, 'gemini-booster-refresh', 'boosters', GEMINI_UI_FRAMES.boosterRefresh.frame, GEMINI_UI_FRAMES.boosterRefresh);
  createProcessedTexture(scene, 'gemini-booster-rocket', 'boosters', GEMINI_UI_FRAMES.boosterRocket.frame, GEMINI_UI_FRAMES.boosterRocket);
  createProcessedTexture(scene, 'gemini-hud-gear', 'hud', GEMINI_UI_FRAMES.hudGear.frame, GEMINI_UI_FRAMES.hudGear);
  createProcessedTexture(scene, 'gemini-hud-coin', 'hud', GEMINI_UI_FRAMES.hudCoin.frame, GEMINI_UI_FRAMES.hudCoin);
  createProcessedTexture(scene, 'gemini-hud-plus', 'hud', GEMINI_UI_FRAMES.hudPlus.frame, GEMINI_UI_FRAMES.hudPlus);
  createProcessedTexture(scene, 'gemini-track-frame', 'track', GEMINI_UI_FRAMES.trackFrame.frame, {
    trim: false,
    padding: 0,
    keepLargestComponent: true,
  });
  createProcessedTexture(scene, 'gemini-waiting-slot-frame', 'waitingSlot', GEMINI_UI_FRAMES.waitingSlotFrame.frame, GEMINI_UI_FRAMES.waitingSlotFrame);

  (window as typeof window & { __RPIXEL_GEMINI_ASSET_MAP__?: Record<string, string> }).__RPIXEL_GEMINI_ASSET_MAP__ = {
    blocks: 'Gemini block_spritesheet.png -> block-* textures',
    monsters: 'Gemini monster_spritesheet.png -> pig-* and shooter-* textures',
    track: 'Gemini track_frame.png -> gemini-track-frame',
    waitingSlots: 'Gemini waiting_slot_frame.png -> gemini-waiting-slot-frame',
    hud: 'Gemini hud_icons_spritesheet.png -> gemini-hud-* textures',
    boosters: 'Gemini button_and_icons_spritesheet.png -> gemini-button-base and gemini-booster-* textures',
  };
}

function geminiSheetsAreReady(scene: Phaser.Scene): boolean {
  return (Object.keys(GEMINI_ASSET_SOURCES) as GeminiSheetKey[]).every((key) => scene.textures.exists(geminiSourceKey(key)));
}

function geminiSourceKey(key: GeminiSheetKey): string {
  return `${GEMINI_TEXTURE_PREFIX}-${key}`;
}

function gptAssetsAreReady(scene: Phaser.Scene): boolean {
  return (Object.keys(GPT_ASSET_SOURCES) as GptAssetKey[]).every((key) => scene.textures.exists(gptSourceKey(key)));
}

function gptSourceKey(key: GptAssetKey): string {
  return `${GPT_TEXTURE_PREFIX}-${key}`;
}

function createGptProcessedTexture(
  scene: Phaser.Scene,
  outputKey: string,
  assetKey: GptAssetKey,
  options: ProcessTextureOptions = {},
): void {
  if (scene.textures.exists(outputKey)) {
    return;
  }

  const source = scene.textures.get(gptSourceKey(assetKey)).getSourceImage() as CanvasImageSource;
  const width = sourceWidth(source);
  const height = sourceHeight(source);
  if (width <= 0 || height <= 0) {
    return;
  }

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = width;
  cropCanvas.height = height;
  const cropContext = cropCanvas.getContext('2d');
  if (!cropContext) {
    return;
  }

  cropContext.drawImage(source, 0, 0, width, height);
  const imageData = cropContext.getImageData(0, 0, width, height);
  removeGptEdgeBackground(imageData);
  processGptPixels(imageData, options.tint);
  if (options.keepLargestComponent) {
    keepLargestAlphaComponent(imageData);
  }
  cropContext.putImageData(imageData, 0, 0);

  const shouldTrim = options.trim !== false;
  const bounds = shouldTrim ? alphaBounds(imageData) : { x: 0, y: 0, width, height };
  if (!bounds) {
    return;
  }

  addProcessedCanvasTexture(scene, outputKey, cropCanvas, bounds, options);
}

function createProcessedTexture(
  scene: Phaser.Scene,
  outputKey: string,
  sheetKey: GeminiSheetKey,
  frame: CropFrame,
  options: ProcessTextureOptions = {},
): void {
  if (scene.textures.exists(outputKey)) {
    return;
  }

  const source = scene.textures.get(geminiSourceKey(sheetKey)).getSourceImage() as CanvasImageSource;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = frame.width;
  cropCanvas.height = frame.height;
  const cropContext = cropCanvas.getContext('2d');
  if (!cropContext) {
    return;
  }

  cropContext.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
  const imageData = cropContext.getImageData(0, 0, frame.width, frame.height);
  processGeminiPixels(imageData, options.tint);
  if (options.keepLargestComponent) {
    keepLargestAlphaComponent(imageData);
  }
  cropContext.putImageData(imageData, 0, 0);

  const shouldTrim = options.trim !== false;
  const bounds = shouldTrim ? alphaBounds(imageData) : { x: 0, y: 0, width: frame.width, height: frame.height };
  if (!bounds) {
    return;
  }

  addProcessedCanvasTexture(scene, outputKey, cropCanvas, bounds, options);
}

function addProcessedCanvasTexture(
  scene: Phaser.Scene,
  outputKey: string,
  sourceCanvas: HTMLCanvasElement,
  bounds: { x: number; y: number; width: number; height: number },
  options: ProcessTextureOptions,
): void {
  const target = options.target ?? { width: bounds.width, height: bounds.height };
  const padding = options.padding ?? 0;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = target.width;
  outputCanvas.height = target.height;
  const outputContext = outputCanvas.getContext('2d');
  if (!outputContext) {
    return;
  }

  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = 'high';
  const maxWidth = Math.max(1, target.width - padding * 2);
  const maxHeight = Math.max(1, target.height - padding * 2);
  const scale = Math.min(maxWidth / bounds.width, maxHeight / bounds.height);
  const drawWidth = bounds.width * scale;
  const drawHeight = bounds.height * scale;
  const drawX = (target.width - drawWidth) / 2;
  const drawY = (target.height - drawHeight) / 2;
  outputContext.drawImage(sourceCanvas, bounds.x, bounds.y, bounds.width, bounds.height, drawX, drawY, drawWidth, drawHeight);

  scene.textures.addCanvas(outputKey, outputCanvas);
}

function sourceWidth(source: CanvasImageSource): number {
  if ('naturalWidth' in source && typeof source.naturalWidth === 'number') {
    return source.naturalWidth;
  }
  if ('videoWidth' in source && typeof source.videoWidth === 'number') {
    return source.videoWidth;
  }
  return 'width' in source && typeof source.width === 'number' ? source.width : 0;
}

function sourceHeight(source: CanvasImageSource): number {
  if ('naturalHeight' in source && typeof source.naturalHeight === 'number') {
    return source.naturalHeight;
  }
  if ('videoHeight' in source && typeof source.videoHeight === 'number') {
    return source.videoHeight;
  }
  return 'height' in source && typeof source.height === 'number' ? source.height : 0;
}

function removeGptEdgeBackground(imageData: ImageData): void {
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];
  const enqueue = (index: number): void => {
    if (index < 0 || index >= width * height || visited[index]) {
      return;
    }
    const pixel = index * 4;
    if (!isGptBackgroundPixel(data[pixel], data[pixel + 1], data[pixel + 2], data[pixel + 3])) {
      return;
    }
    visited[index] = 1;
    stack.push(index);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) {
      continue;
    }
    const cx = current % width;
    const cy = Math.floor(current / width);
    const neighbors = [current - 1, current + 1, current - width, current + width];
    for (const next of neighbors) {
      if (next < 0 || next >= width * height || visited[next]) {
        continue;
      }
      const nx = next % width;
      const ny = Math.floor(next / width);
      if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) {
        continue;
      }
      const pixel = next * 4;
      if (!isGptBackgroundPixel(data[pixel], data[pixel + 1], data[pixel + 2], data[pixel + 3])) {
        continue;
      }
      visited[next] = 1;
      stack.push(next);
    }
  }

  for (let index = 0; index < width * height; index += 1) {
    const pixel = index * 4;
    if (visited[index] || data[pixel + 3] <= 12) {
      data[pixel + 3] = 0;
    }
  }
}

function processGptPixels(imageData: ImageData, tint?: number): void {
  const data = imageData.data;
  const tintHsl = tint === undefined ? undefined : rgbToHsl((tint >> 16) & 255, (tint >> 8) & 255, tint & 255);
  if (!tintHsl) {
    return;
  }

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] <= 24) {
      continue;
    }
    const hsl = rgbToHsl(data[index], data[index + 1], data[index + 2]);
    if (hsl.s < 0.12 || hsl.l < 0.1 || hsl.l > 0.92) {
      continue;
    }
    const [r, g, b] = hslToRgb(tintHsl.h, Math.min(0.98, Math.max(hsl.s * 0.82, tintHsl.s * 0.74)), hsl.l);
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
  }
}

function isGptBackgroundPixel(r: number, g: number, b: number, alpha: number): boolean {
  if (alpha <= 18) {
    return true;
  }
  const average = (r + g + b) / 3;
  const neutral = Math.max(r, g, b) - Math.min(r, g, b) <= 12;
  return neutral && average >= 226;
}

function processGeminiPixels(imageData: ImageData, tint?: number): void {
  const data = imageData.data;
  const tintHsl = tint === undefined ? undefined : rgbToHsl((tint >> 16) & 255, (tint >> 8) & 255, tint & 255);

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    if (isGeminiCheckerPixel(r, g, b)) {
      data[index + 3] = 0;
      continue;
    }

    if (!tintHsl) {
      continue;
    }

    const hsl = rgbToHsl(r, g, b);
    if (hsl.s < 0.13 || hsl.l < 0.12 || hsl.l > 0.9) {
      continue;
    }

    const [tr, tg, tb] = hslToRgb(tintHsl.h, Math.min(0.95, Math.max(hsl.s * 0.8, tintHsl.s * 0.72)), hsl.l);
    data[index] = tr;
    data[index + 1] = tg;
    data[index + 2] = tb;
  }
}

function isGeminiCheckerPixel(r: number, g: number, b: number): boolean {
  const average = (r + g + b) / 3;
  return Math.max(r, g, b) - Math.min(r, g, b) <= 8 && average >= 125 && average <= 225;
}

function keepLargestAlphaComponent(imageData: ImageData): void {
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  let largest: number[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (visited[start] || data[start * 4 + 3] <= 24) {
        continue;
      }

      const component: number[] = [];
      const stack = [start];
      visited[start] = 1;
      while (stack.length > 0) {
        const current = stack.pop();
        if (current === undefined) {
          continue;
        }
        component.push(current);
        const cx = current % width;
        const cy = Math.floor(current / width);
        const neighbors = [current - 1, current + 1, current - width, current + width];
        for (const next of neighbors) {
          if (next < 0 || next >= width * height || visited[next] || data[next * 4 + 3] <= 24) {
            continue;
          }
          const nx = next % width;
          const ny = Math.floor(next / width);
          if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) {
            continue;
          }
          visited[next] = 1;
          stack.push(next);
        }
      }

      if (component.length > largest.length) {
        largest = component;
      }
    }
  }

  const keep = new Uint8Array(width * height);
  largest.forEach((index) => {
    keep[index] = 1;
  });
  for (let index = 0; index < width * height; index += 1) {
    if (!keep[index]) {
      data[index * 4 + 3] = 0;
    }
  }
}

function alphaBounds(imageData: ImageData): { x: number; y: number; width: number; height: number } | undefined {
  const { data, width, height } = imageData;
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= 24) {
        continue;
      }
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    return undefined;
  }

  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) {
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }
    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const value = Math.round(l * 255);
    return [value, value, value];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hueToRgb(p, q, h + 1 / 3), hueToRgb(p, q, h), hueToRgb(p, q, h - 1 / 3)].map((value) => Math.round(value * 255)) as [number, number, number];
}

function hueToRgb(p: number, q: number, t: number): number {
  let safeT = t;
  if (safeT < 0) safeT += 1;
  if (safeT > 1) safeT -= 1;
  if (safeT < 1 / 6) return p + (q - p) * 6 * safeT;
  if (safeT < 1 / 2) return q;
  if (safeT < 2 / 3) return p + (q - p) * (2 / 3 - safeT) * 6;
  return p;
}

function createBlockTexture(scene: Phaser.Scene, color: PigColor, style: ColorStyle): void {
  const g = scene.add.graphics();
  const topX = 16;
  const topY = 8;
  const size = 82;
  const depth = 24;

  g.fillStyle(0x050915, 0.44);
  g.fillEllipse(72, 110, 118, 34);
  g.fillStyle(0x050915, 0.18);
  g.fillEllipse(75, 101, 96, 24);
  g.fillStyle(style.dark, 0.98);
  g.fillPoints(
    [
      new Phaser.Geom.Point(topX, topY + size - 4),
      new Phaser.Geom.Point(topX + depth, topY + size + depth),
      new Phaser.Geom.Point(topX + size + depth, topY + size + depth),
      new Phaser.Geom.Point(topX + size, topY + size - 4),
    ],
    true,
  );
  g.fillStyle(style.dark, 0.86);
  g.fillPoints(
    [
      new Phaser.Geom.Point(topX + size - 4, topY + 10),
      new Phaser.Geom.Point(topX + size + depth, topY + depth + 10),
      new Phaser.Geom.Point(topX + size + depth, topY + size + depth),
      new Phaser.Geom.Point(topX + size - 4, topY + size - 4),
    ],
    true,
  );
  g.lineStyle(2, 0x071122, 0.28);
  g.lineBetween(topX + 8, topY + size + 8, topX + size + depth - 2, topY + size + depth - 2);
  g.lineBetween(topX + size + 11, topY + depth + 16, topX + size + depth - 1, topY + size + depth - 5);
  g.lineStyle(4, 0x10182d, 0.66);
  g.fillStyle(style.base, 1);
  g.fillRoundedRect(topX, topY, size, size, 16);
  g.strokeRoundedRect(topX, topY, size, size, 16);
  g.fillStyle(style.light, color === 'white' ? 0.38 : 0.2);
  g.fillRoundedRect(topX + 5, topY + 5, size - 10, 30, 14);
  g.fillStyle(0xffffff, color === 'white' ? 0.34 : 0.14);
  g.fillRoundedRect(topX + 8, topY + 8, size - 16, size - 16, 14);
  g.fillStyle(style.light, 0.88);
  g.fillRoundedRect(topX + 12, topY + 10, 50, 13, 7);
  g.fillStyle(0xffffff, color === 'white' ? 0.58 : 0.36);
  g.fillRoundedRect(topX + 14, topY + 29, 58, 8, 4);
  g.fillRoundedRect(topX + 17, topY + 43, 34, 5, 3);
  g.fillStyle(style.dark, 0.3);
  g.fillRoundedRect(topX + 8, topY + size - 23, size - 16, 16, 8);
  g.lineStyle(2, 0xffffff, 0.42);
  g.strokeRoundedRect(topX + 9, topY + 8, size - 18, size - 18, 12);
  g.lineStyle(2, 0x050915, 0.2);
  g.lineBetween(topX + 2, topY + size - 10, topX + size - 6, topY + size - 10);
  g.fillStyle(0xffffff, color === 'white' ? 0.22 : 0.1);
  g.fillCircle(topX + size - 19, topY + 20, 8);
  g.generateTexture(`block-${color}`, 128, 128);
  g.destroy();
}

function createPigTexture(scene: Phaser.Scene, color: PigColor, style: ColorStyle): void {
  const g = scene.add.graphics();
  g.fillStyle(0x050915, 0.34);
  g.fillEllipse(82, 116, 126, 42);

  g.lineStyle(7, 0x050915, 1);
  g.fillStyle(style.dark, 1);
  g.fillCircle(28, 78, 20);
  g.strokeCircle(28, 78, 20);
  g.fillCircle(136, 78, 20);
  g.strokeCircle(136, 78, 20);

  g.fillStyle(style.dark, 1);
  g.fillRoundedRect(22, 32, 120, 106, 30);
  g.strokeRoundedRect(22, 32, 120, 106, 30);
  g.fillStyle(style.base, 1);
  g.fillRoundedRect(30, 24, 104, 104, 30);
  g.strokeRoundedRect(30, 24, 104, 104, 30);
  g.fillStyle(style.light, 0.45);
  g.fillRoundedRect(42, 34, 66, 22, 11);
  g.fillStyle(0xffffff, 0.22);
  g.fillRoundedRect(44, 62, 78, 12, 6);

  g.fillStyle(0xffffff, 1);
  g.fillCircle(62, 76, 12);
  g.fillCircle(101, 76, 12);
  g.fillStyle(0x071122, 1);
  g.fillCircle(64, 78, 6);
  g.fillCircle(99, 78, 6);
  g.lineStyle(5, 0x071122, 1);
  g.lineBetween(71, 103, 91, 103);

  g.fillStyle(0xffd86b, 1);
  g.fillRoundedRect(56, 12, 52, 24, 12);
  g.lineStyle(5, 0x8a4c00, 1);
  g.strokeRoundedRect(56, 12, 52, 24, 12);
  g.fillStyle(0xfff1a6, 0.72);
  g.fillRoundedRect(64, 16, 26, 7, 4);

  g.fillStyle(style.dark, 1);
  g.fillRoundedRect(44, 124, 22, 18, 9);
  g.fillRoundedRect(98, 124, 22, 18, 9);
  g.generateTexture(`pig-${color}`, 164, 154);
  g.destroy();
}

function createShooterTexture(scene: Phaser.Scene, color: PigColor, style: ColorStyle): void {
  const g = scene.add.graphics();
  g.fillStyle(0x050915, 0.44);
  g.fillEllipse(82, 132, 148, 46);

  g.lineStyle(4, 0x10182d, 0.72);
  g.fillStyle(style.dark, 0.96);
  g.fillRoundedRect(10, 66, 34, 58, 17);
  g.strokeRoundedRect(10, 66, 34, 58, 17);
  g.fillRoundedRect(120, 66, 34, 58, 17);
  g.strokeRoundedRect(120, 66, 34, 58, 17);
  g.fillStyle(style.light, 0.34);
  g.fillRoundedRect(18, 72, 13, 34, 7);
  g.fillRoundedRect(133, 72, 13, 34, 7);
  g.fillStyle(0xffffff, 0.18);
  g.fillCircle(30, 74, 8);
  g.fillCircle(134, 74, 8);

  g.fillStyle(0x10182d, 0.86);
  g.fillRoundedRect(45, 15, 28, 39, 11);
  g.fillRoundedRect(91, 15, 28, 39, 11);
  g.fillStyle(style.light, 0.96);
  g.fillRoundedRect(52, 19, 16, 25, 7);
  g.fillRoundedRect(98, 19, 16, 25, 7);
  g.fillStyle(0xffffff, 0.24);
  g.fillRoundedRect(55, 22, 9, 13, 4);
  g.fillRoundedRect(101, 22, 9, 13, 4);

  g.fillStyle(0x050915, 0.22);
  g.fillRoundedRect(23, 38, 118, 112, 38);
  g.lineStyle(4, 0x10182d, 0.76);
  g.fillStyle(style.dark, 1);
  g.fillRoundedRect(17, 34, 130, 116, 38);
  g.strokeRoundedRect(17, 34, 130, 116, 38);
  g.fillStyle(style.base, 1);
  g.fillRoundedRect(29, 25, 106, 118, 36);
  g.strokeRoundedRect(29, 25, 106, 118, 36);
  g.fillStyle(style.light, 0.8);
  g.fillRoundedRect(42, 35, 66, 22, 11);
  g.fillStyle(0xffffff, color === 'white' ? 0.52 : 0.31);
  g.fillRoundedRect(43, 62, 77, 12, 7);
  g.fillRoundedRect(50, 80, 51, 8, 4);
  g.fillStyle(0xffffff, color === 'white' ? 0.24 : 0.12);
  g.fillRoundedRect(39, 88, 86, 35, 18);
  g.fillStyle(style.dark, 0.42);
  g.fillRoundedRect(41, 116, 82, 18, 9);

  g.lineStyle(4, style.dark, 0.58);
  g.lineBetween(58, 51, 58, 121);
  g.lineBetween(106, 51, 106, 121);
  g.lineStyle(3, 0xffffff, 0.56);
  g.lineBetween(70, 50, 94, 50);
  g.lineBetween(70, 63, 94, 63);
  g.lineStyle(3, 0x050915, 0.18);
  g.strokeRoundedRect(36, 32, 92, 104, 30);

  g.fillStyle(0xffd86b, 1);
  g.fillRoundedRect(55, 10, 54, 25, 12);
  g.lineStyle(3, 0x8a4c00, 0.78);
  g.strokeRoundedRect(55, 10, 54, 25, 12);
  g.fillStyle(0xfff1a6, 0.76);
  g.fillRoundedRect(64, 15, 27, 7, 4);

  g.fillStyle(0x071122, 0.24);
  g.fillRoundedRect(64, 119, 36, 12, 6);
  g.fillStyle(0xffffff, 0.12);
  g.fillRoundedRect(69, 121, 15, 3, 2);

  g.fillStyle(style.dark, 1);
  g.fillRoundedRect(43, 134, 23, 18, 9);
  g.fillRoundedRect(98, 134, 23, 18, 9);
  g.fillStyle(0xffffff, 0.16);
  g.fillRoundedRect(49, 137, 10, 5, 3);
  g.fillRoundedRect(104, 137, 10, 5, 3);
  g.generateTexture(`shooter-${color}`, 164, 162);
  g.destroy();
}
