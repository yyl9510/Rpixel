import Phaser from 'phaser';
import { createGeneratedAssets, preloadGeminiAssets } from '../assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    preloadGeminiAssets(this);
  }

  create(): void {
    createGeneratedAssets(this);
    this.scene.start('MenuScene');
  }
}

