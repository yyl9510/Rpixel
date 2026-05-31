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
    __RPIXEL_CAPACITY_LABEL__?: string;
    __RPIXEL_RESERVE_LEFT__?: number;
    __RPIXEL_LOCKED_RESERVE__?: number;
    __RPIXEL_TREASURE_UNLOCKED__?: boolean;
    __RPIXEL_COINS__?: number;
    __RPIXEL_SPEED_MULTIPLIER__?: 1 | 5;
    __RPIXEL_TRACK_SPEED__?: number;
    __RPIXEL_CONVEYOR_SCROLL_SPEED__?: number;
    __RPIXEL_CONVEYOR_EFFECTIVE_SCROLL_SPEED__?: number;
    __RPIXEL_CONVEYOR_PLATE_SPACING__?: number;
    __RPIXEL_SPEED_TOGGLE_POSITION__?: { x: number; y: number };
    __RPIXEL_CAPACITY_LABEL_POSITION__?: { x: number; y: number };
    __RPIXEL_CAPACITY_LABEL_BOUNDS__?: { left: number; right: number; top: number; bottom: number; width: number; height: number };
    __RPIXEL_CONVEYOR_OFFSET__?: number;
    __RPIXEL_CONVEYOR_MARKERS__?: number;
    __RPIXEL_VISIBLE_RESERVE__?: Array<{ index: number; row: number; col: number; id: string; color: string; ammo: number; locked: boolean; x: number; y: number }>;
    __RPIXEL_VISIBLE_WAITING__?: Array<{ index: number; id: string; color: string; status: string; ammo: number; x: number; y: number; actualX?: number; actualY?: number }>;
    __RPIXEL_ACTIVE_SHOOTERS__?: Array<{ color: string; ammo: number; distance: number; x: number; y: number; orbiting: boolean; side: string; rotation: number; pendingShots: number; completedLap: boolean }>;
    __RPIXEL_EXPOSED_COLORS__?: string[];
    __RPIXEL_BOARD_COLOR_COUNTS__?: Record<string, number>;
    __RPIXEL_AMMO_COLOR_TOTALS__?: Record<string, number>;
    __RPIXEL_ALL_SHOOTER_AMMO__?: number[];
    __RPIXEL_BOARD_SHAPE__?: { rows: number; cols: number; filled: number; empty: number; rowWidths: number[] };
    __RPIXEL_SHOT_LOG__?: Array<{ pigId: string; color: string; side: string; lineIndex: number; cell: string; distance: number }>;
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
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  fps: {
    target: 60,
    min: 30,
    smoothStep: true,
  },
  scene: [BootScene, MenuScene, GameScene],
};

new Phaser.Game(config);
