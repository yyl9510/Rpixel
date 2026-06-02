import Phaser from 'phaser';
import { createGeneratedAssets, preloadGeminiAssets, preloadGptAssets } from '../assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    preloadGptAssets(this);
    preloadGeminiAssets(this);
  }

  create(): void {
    createGeneratedAssets(this);
    this.scene.start('MenuScene');
  }
}
