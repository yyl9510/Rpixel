import Phaser from 'phaser';
import { createGeneratedAssets } from '../assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    createGeneratedAssets(this);
    this.scene.start('MenuScene');
  }
}

