import Phaser from 'phaser';
import './styles.css';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { MenuScene } from './game/scenes/MenuScene';

declare global {
  interface Window {
    __RPIXEL_SCENE__?: string;
    __RPIXEL_ACTIVE_PIGS__?: number;
    __RPIXEL_BLOCKS_LEFT__?: number;
    __RPIXEL_SLOTS_FILLED__?: number;
    __RPIXEL_STUCK_SLOTS__?: number;
    __RPIXEL_RESERVE_LEFT__?: number;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: 'game',
  width: 1080,
  height: 1920,
  backgroundColor: '#0aa9ff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 4,
  },
  scene: [BootScene, MenuScene, GameScene],
};

new Phaser.Game(config);
