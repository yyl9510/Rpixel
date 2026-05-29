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
  blue: { base: 0x2f80ed, dark: 0x1559a8, light: 0x91c9ff, text: 'B' },
  yellow: { base: 0xffcf3f, dark: 0xd98b00, light: 0xfff1a6, text: 'Y' },
  green: { base: 0x35c95f, dark: 0x16863a, light: 0x9cf2b2, text: 'G' },
  purple: { base: 0x9b5cff, dark: 0x6034ba, light: 0xd2b6ff, text: 'P' },
};

export function createGeneratedAssets(scene: Phaser.Scene): void {
  if (scene.textures.exists('pig-red')) {
    return;
  }

  for (const [color, style] of Object.entries(COLOR_STYLES) as [PigColor, ColorStyle][]) {
    createBlockTexture(scene, color, style);
    createPigTexture(scene, color, style);
  }
}

function createBlockTexture(scene: Phaser.Scene, color: PigColor, style: ColorStyle): void {
  const g = scene.add.graphics();
  const topX = 16;
  const topY = 8;
  const size = 82;
  const depth = 24;

  g.fillStyle(0x050915, 0.3);
  g.fillEllipse(66, 104, 104, 32);
  g.fillStyle(style.dark, 1);
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
  g.lineStyle(7, 0x050915, 1);
  g.fillStyle(style.base, 1);
  g.fillRoundedRect(topX, topY, size, size, 16);
  g.strokeRoundedRect(topX, topY, size, size, 16);
  g.fillStyle(style.light, 0.58);
  g.fillRoundedRect(topX + 12, topY + 10, 50, 18, 9);
  g.fillStyle(0xffffff, 0.2);
  g.fillRoundedRect(topX + 12, topY + 34, 64, 10, 5);
  g.lineStyle(3, 0xffffff, 0.28);
  g.strokeRoundedRect(topX + 9, topY + 8, size - 18, size - 18, 12);
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
