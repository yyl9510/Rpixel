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
  g.fillStyle(0x050915, 0.34);
  g.fillRoundedRect(10, 14, 92, 92, 18);
  g.lineStyle(7, 0x050915, 1);
  g.fillStyle(style.dark, 1);
  g.fillRoundedRect(6, 6, 92, 92, 18);
  g.strokeRoundedRect(6, 6, 92, 92, 18);
  g.fillStyle(style.base, 1);
  g.fillRoundedRect(14, 12, 76, 76, 14);
  g.fillStyle(style.light, 0.55);
  g.fillRoundedRect(22, 18, 46, 18, 9);
  g.generateTexture(`block-${color}`, 112, 112);
  g.destroy();
}

function createPigTexture(scene: Phaser.Scene, color: PigColor, style: ColorStyle): void {
  const g = scene.add.graphics();
  g.fillStyle(0x050915, 0.38);
  g.fillEllipse(78, 92, 122, 74);
  g.fillStyle(style.dark, 1);
  g.fillCircle(43, 39, 24);
  g.fillCircle(113, 39, 24);
  g.lineStyle(7, 0x050915, 1);
  g.strokeCircle(43, 39, 24);
  g.strokeCircle(113, 39, 24);
  g.fillStyle(style.base, 1);
  g.fillRoundedRect(20, 28, 116, 106, 30);
  g.strokeRoundedRect(20, 28, 116, 106, 30);
  g.fillStyle(style.light, 0.34);
  g.fillRoundedRect(32, 36, 76, 23, 12);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(55, 75, 13);
  g.fillCircle(101, 75, 13);
  g.fillStyle(0x071122, 1);
  g.fillCircle(58, 77, 7);
  g.fillCircle(98, 77, 7);
  g.fillStyle(0xffd86b, 1);
  g.fillRoundedRect(48, 93, 60, 31, 15);
  g.lineStyle(5, 0x8a4c00, 1);
  g.strokeRoundedRect(48, 93, 60, 31, 15);
  g.fillStyle(0x8a4c00, 1);
  g.fillCircle(67, 108, 5);
  g.fillCircle(89, 108, 5);
  g.lineStyle(8, 0x050915, 1);
  g.lineBetween(78, 18, 78, 0);
  g.lineStyle(5, 0xffffff, 0.75);
  g.lineBetween(63, 0, 93, 0);
  g.generateTexture(`pig-${color}`, 156, 150);
  g.destroy();
}

