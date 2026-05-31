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
