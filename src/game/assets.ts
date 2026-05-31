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

export function createGeneratedAssets(scene: Phaser.Scene): void {
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

function createBlockTexture(scene: Phaser.Scene, color: PigColor, style: ColorStyle): void {
  const g = scene.add.graphics();
  const topX = 16;
  const topY = 8;
  const size = 82;
  const depth = 24;

  g.fillStyle(0x050915, 0.46);
  g.fillEllipse(70, 108, 114, 36);
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
  g.fillStyle(style.dark, 0.9);
  g.fillPoints(
    [
      new Phaser.Geom.Point(topX + size - 4, topY + 10),
      new Phaser.Geom.Point(topX + size + depth, topY + depth + 10),
      new Phaser.Geom.Point(topX + size + depth, topY + size + depth),
      new Phaser.Geom.Point(topX + size - 4, topY + size - 4),
    ],
    true,
  );
  g.lineStyle(8, 0x050915, 1);
  g.fillStyle(style.base, 1);
  g.fillRoundedRect(topX, topY, size, size, 16);
  g.strokeRoundedRect(topX, topY, size, size, 16);
  g.fillStyle(0xffffff, color === 'white' ? 0.2 : 0.08);
  g.fillRoundedRect(topX + 6, topY + 6, size - 12, size - 12, 14);
  g.fillStyle(style.light, 0.78);
  g.fillRoundedRect(topX + 10, topY + 8, 54, 15, 8);
  g.fillStyle(0xffffff, color === 'white' ? 0.5 : 0.3);
  g.fillRoundedRect(topX + 13, topY + 31, 62, 9, 5);
  g.fillStyle(style.dark, 0.24);
  g.fillRoundedRect(topX + 8, topY + size - 21, size - 16, 14, 7);
  g.lineStyle(3, 0xffffff, 0.38);
  g.strokeRoundedRect(topX + 9, topY + 8, size - 18, size - 18, 12);
  g.lineStyle(2, 0x050915, 0.28);
  g.lineBetween(topX + 2, topY + size - 10, topX + size - 6, topY + size - 10);
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
  g.fillStyle(0x050915, 0.5);
  g.fillEllipse(82, 129, 146, 48);

  g.lineStyle(8, 0x050915, 1);
  g.fillStyle(style.dark, 1);
  g.fillRoundedRect(12, 62, 32, 58, 16);
  g.strokeRoundedRect(12, 62, 32, 58, 16);
  g.fillRoundedRect(120, 62, 32, 58, 16);
  g.strokeRoundedRect(120, 62, 32, 58, 16);
  g.fillStyle(style.light, 0.28);
  g.fillRoundedRect(20, 68, 13, 33, 7);
  g.fillRoundedRect(131, 68, 13, 33, 7);

  g.fillStyle(0x050915, 1);
  g.fillRoundedRect(48, 14, 26, 38, 11);
  g.fillRoundedRect(90, 14, 26, 38, 11);
  g.fillStyle(style.light, 0.95);
  g.fillRoundedRect(54, 18, 16, 25, 7);
  g.fillRoundedRect(96, 18, 16, 25, 7);

  g.fillStyle(style.dark, 1);
  g.fillRoundedRect(18, 31, 128, 116, 36);
  g.strokeRoundedRect(18, 31, 128, 116, 36);
  g.fillStyle(style.base, 1);
  g.fillRoundedRect(30, 23, 104, 114, 35);
  g.strokeRoundedRect(30, 23, 104, 114, 35);
  g.fillStyle(style.light, 0.74);
  g.fillRoundedRect(43, 33, 64, 21, 11);
  g.fillStyle(0xffffff, color === 'white' ? 0.42 : 0.26);
  g.fillRoundedRect(45, 61, 74, 12, 7);
  g.fillStyle(0xffffff, color === 'white' ? 0.2 : 0.1);
  g.fillRoundedRect(40, 80, 84, 38, 19);
  g.fillStyle(style.dark, 0.38);
  g.fillRoundedRect(42, 114, 80, 18, 9);

  g.lineStyle(7, style.dark, 0.84);
  g.lineBetween(58, 50, 58, 121);
  g.lineBetween(106, 50, 106, 121);
  g.lineStyle(4, 0xffffff, 0.5);
  g.lineBetween(70, 48, 94, 48);
  g.lineBetween(70, 62, 94, 62);

  g.fillStyle(0xffd86b, 1);
  g.fillRoundedRect(56, 12, 52, 24, 12);
  g.lineStyle(5, 0x8a4c00, 1);
  g.strokeRoundedRect(56, 12, 52, 24, 12);
  g.fillStyle(0xfff1a6, 0.72);
  g.fillRoundedRect(64, 16, 26, 7, 4);

  g.lineStyle(8, 0x050915, 1);
  g.fillStyle(0xf7fbff, 0.94);
  g.fillCircle(82, 123, 12);
  g.strokeCircle(82, 123, 12);
  g.lineStyle(4, 0x050915, 1);
  g.lineBetween(74, 129, 90, 129);

  g.fillStyle(style.dark, 1);
  g.fillRoundedRect(44, 132, 22, 18, 9);
  g.fillRoundedRect(98, 132, 22, 18, 9);
  g.generateTexture(`shooter-${color}`, 164, 162);
  g.destroy();
}
