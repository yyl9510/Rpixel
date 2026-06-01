import Phaser from 'phaser';
import { COLOR_STYLES } from '../assets';
import { FIRST_LEVEL } from '../data/levels';
import { ShooterToken, type AmmoLabelDebug } from '../objects/ShooterToken';
import { PIG_COLORS, type Pig, type PigColor } from '../types';

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;
const SLOT_CAPACITY = 5;
const BOARD_BOX_WIDTH = 760;
const BOARD_BOX_HEIGHT = 840;
const BOARD_TOP = 270;
const TRACK_PAD = 116;
const SLOT_Y = 1360;
const RESERVE_VISIBLE = 6;
const RESERVE_COLS = 3;
const TRACK_SPEED = 820;
const CONVEYOR_SCROLL_SPEED = 96;
const CONVEYOR_FAST_MULTIPLIER = 1.35;
const CONVEYOR_PLATE_SPACING = 132;
const TRACK_SHOOTER_SCALE = 0.9;
const WAITING_SHOOTER_SCALE = 0.84;
const TRACK_START_OFFSET = 118;
const SPEED_TOGGLE_POSITION = { x: 214, y: 82 };
const CAPACITY_LABEL_POSITION = { x: 350, y: 82 };
const CAPACITY_PILL_SIZE = { width: 150, height: 62 };
const HUD_LABEL_OPTICAL_OFFSET = { x: -6, y: -12 };
const MANUAL_LAUNCH_HIT_RADIUS = 108;
const RESERVE_HIT_WIDTH = 206;
const RESERVE_HIT_HEIGHT = 178;
const WAITING_HIT_WIDTH = 178;
const WAITING_HIT_HEIGHT = 170;

type Side = 'bottom' | 'right' | 'top' | 'left';
type SlotStatus = 'entering' | 'stuck' | 'activating';

interface TrackPosition {
  x: number;
  y: number;
  side: Side;
}

interface DebugBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface TrackMetrics {
  left: number;
  right: number;
  top: number;
  bottom: number;
  startX: number;
  total: number;
  segments: number[];
}

interface BoardCell {
  row: number;
  col: number;
  color: PigColor;
  pending: boolean;
  cleared: boolean;
  image: Phaser.GameObjects.Image;
}

interface EdgeTarget {
  side: Side;
  lineIndex: number;
  cell: BoardCell;
  distance: number;
}

interface TrackStep {
  side: Side;
  lineIndex: number;
  distance: number;
  key: string;
}

interface ConveyorPlate {
  container: Phaser.GameObjects.Container;
  offset: number;
}

interface ReserveEntry {
  pig: Pig;
  index: number;
  row: number;
  col: number;
}

interface SlotShooter {
  slotIndex: number;
  status: SlotStatus;
  pig: Pig;
  container: ShooterToken;
  body: Phaser.GameObjects.Container;
}

type ManualLaunchTarget = { type: 'reserve'; index: number } | { type: 'waiting'; index: number };

interface ResolvingShooter {
  pig: Pig;
  container: ShooterToken;
  body: Phaser.GameObjects.Container;
  distance: number;
  orbiting: boolean;
  currentSide: Side;
  pendingShots: number;
  completedLap: boolean;
  lastTrackStepKey?: string;
  targetKey?: string;
}

export class GameScene extends Phaser.Scene {
  private cells: Array<Array<BoardCell | null>> = [];
  private slots: Array<SlotShooter | null> = [];
  private reserveColumns: Pig[][] = [];
  private resolvingShooters: ResolvingShooter[] = [];
  private reservedTargetKeys = new Set<string>();
  private slotChromeLayer?: Phaser.GameObjects.Container;
  private reserveLayer?: Phaser.GameObjects.Container;
  private manualHitLayer?: Phaser.GameObjects.Container;
  private conveyorLayer?: Phaser.GameObjects.Container;
  private conveyorPlates: ConveyorPlate[] = [];
  private conveyorOffset = 0;
  private blocksLeftText?: Phaser.GameObjects.Text;
  private activeCapacityText?: Phaser.GameObjects.Text;
  private speedToggleText?: Phaser.GameObjects.Text;
  private coinText?: Phaser.GameObjects.Text;
  private progressFill?: Phaser.GameObjects.Graphics;
  private coins = 10100;
  private totalCells = 0;
  private clearedCells = 0;
  private lastDirectPigPointerStamp = -1;
  private speedMultiplier: 1 | 5 = 1;
  private shotLog: Array<{ pigId: string; color: PigColor; side: Side; lineIndex: number; cell: string; distance: number }> = [];
  private reserveLabelDebug: AmmoLabelDebug[] = [];
  private reserveMotionStarts = new Map<string, { x: number; y: number }>();
  private gameOver = false;

  private readonly rows = FIRST_LEVEL.grid.length;
  private readonly cols = Math.max(...FIRST_LEVEL.grid.map((row) => row.length));
  private readonly cellSize = Math.floor(Math.min(BOARD_BOX_WIDTH / this.cols, BOARD_BOX_HEIGHT / this.rows));
  private readonly boardWidth = this.cellSize * this.cols;
  private readonly boardHeight = this.cellSize * this.rows;
  private readonly boardX = (GAME_WIDTH - this.boardWidth) / 2;
  private readonly boardY = BOARD_TOP + (BOARD_BOX_HEIGHT - this.boardHeight) / 2;
  private readonly center = { x: GAME_WIDTH / 2, y: BOARD_TOP + BOARD_BOX_HEIGHT / 2 };
  private readonly track: TrackMetrics = this.createTrackMetrics();
  private readonly trackSteps: TrackStep[] = this.createTrackSteps();

  constructor() {
    super('GameScene');
  }

  create(): void {
    window.__RPIXEL_SCENE__ = 'game';
    this.gameOver = false;
    this.resolvingShooters = [];
    this.reservedTargetKeys.clear();
    this.reserveMotionStarts.clear();
    this.coins = 10100;
    this.clearedCells = 0;
    this.speedMultiplier = 1;
    this.conveyorOffset = 0;
    this.conveyorPlates = [];
    this.slots = Array.from({ length: SLOT_CAPACITY }, () => null);
    this.reserveColumns = this.buildReserveColumns(FIRST_LEVEL.pigs);
    this.shotLog = [];
    this.totalCells = FIRST_LEVEL.grid.flat().filter((color) => color !== null).length;

    this.drawBackground();
    this.drawHud();
    this.drawTrack();
    this.drawBoard();
    this.drawSlotChrome();

    this.reserveLayer = this.add.container(0, 0).setDepth(12);
    this.manualHitLayer = this.add.container(0, 0).setDepth(70);
    this.renderReserve();
    this.drawBoosterBar();
    this.bindManualLaunchFallback();
    this.updateDebugState();
  }

  update(_time: number, delta: number): void {
    this.updateConveyor(delta);

    if (this.gameOver) {
      return;
    }

    [...this.resolvingShooters].forEach((active) => this.updateResolvingShooter(active, delta));
    this.publishActiveShooterDebug();
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    const top = Phaser.Display.Color.ValueToColor(0x4b537b);
    const bottom = Phaser.Display.Color.ValueToColor(0x2f344f);

    for (let y = 0; y < GAME_HEIGHT; y += 12) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, GAME_HEIGHT, y);
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      graphics.fillRect(0, y, GAME_WIDTH, 12);
    }

    graphics.fillStyle(0xffffff, 0.035);
    graphics.fillRoundedRect(52, 206, 976, 1060, 42);
    graphics.fillStyle(0x050915, 0.13);
    graphics.fillRoundedRect(84, 1280, 912, 500, 54);
    graphics.fillStyle(0xffffff, 0.035);
    graphics.fillRoundedRect(122, 1322, 836, 60, 30);
  }

  private drawHud(): void {
    this.add.ellipse(96, 92, 108, 52, 0x050915, 0.22).setDepth(5);
    this.add.circle(94, 82, 52, 0xbd3048).setStrokeStyle(4, 0x20283f, 0.88).setDepth(6);
    this.add.circle(82, 66, 21, 0xffffff, 0.13).setDepth(6);
    this.drawGearIcon(94, 82, 34, 0xf2f5ff, 0x20283f, 4, 7);
    this.add.zone(94, 82, 128, 128).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('MenuScene'));

    this.add.ellipse(558, 94, 260, 44, 0x050915, 0.18).setDepth(5);
    this.addRoundRect(558, 82, 268, 76, 23, 0x20283e, 0.98, 0x9fb0ca, 3, 0.42).setDepth(6);
    this.addRoundRect(558, 111, 220, 7, 4, 0xc94a61, 0.72).setDepth(7);
    this.addRoundRect(552, 57, 206, 15, 8, 0xffffff, 0.1).setDepth(7);
    this.add.text(558, 53, `Level ${FIRST_LEVEL.id}`, this.premiumTextStyle(36)).setOrigin(0.5, 0).setStroke('#11182b', 4).setDepth(8);

    this.add.circle(744, 82, 39, 0xf3bd3c).setStrokeStyle(4, 0x8a5811, 0.82).setDepth(6);
    this.add.circle(735, 72, 18, 0xfff1a6, 0.35).setDepth(7);
    this.coinText = this.add.text(798, 54, this.formatCoins(this.coins), this.premiumTextStyle(36)).setStroke('#11182b', 5).setDepth(8);
    this.addRoundRect(968, 82, 78, 72, 18, 0xd88f2d, 1, 0x7a4a10, 4, 0.86).setDepth(6);
    this.addRoundRect(962, 59, 46, 10, 6, 0xffffff, 0.15).setDepth(7);
    this.add.text(943, 43, '+', this.premiumTextStyle(55)).setStroke('#8a520f', 5).setDepth(8);
    this.drawSpeedToggle();
    this.drawActiveCapacityPill();

    this.progressFill = this.add.graphics().setDepth(4);
    this.blocksLeftText = this.add.text(540, 134, '', this.textStyle(18)).setOrigin(0.5, 0).setAlpha(0);
    this.updateProgressText();
  }

  private drawSpeedToggle(): void {
    const container = this.add.container(SPEED_TOGGLE_POSITION.x, SPEED_TOGGLE_POSITION.y).setDepth(52);
    const shadow = this.add.ellipse(3, 10, 110, 42, 0x050915, 0.24);
    const background = this.makeRoundRect(104, 58, 19, 0x121a30, 0.98, 0x26324d, 3, 0.9);
    const rim = this.makeRoundRect(86, 40, 14, 0x34405f, 0.94, 0xe6eeff, 2, 0.32);
    const gloss = this.makeRoundRect(58, 10, 6, 0xffffff, 0.15, undefined, 0, 1, -3, -14);
    this.speedToggleText = this.add
      .text(HUD_LABEL_OPTICAL_OFFSET.x, HUD_LABEL_OPTICAL_OFFSET.y, '1x', this.compactHudTextStyle(25))
      .setOrigin(0.5, 0.5)
      .setStroke('#0b1020', 4)
      .setShadow(0, 2, '#050915', 3, false, true);
    this.speedToggleText.setResolution(2);
    const hit = this.add.zone(0, 0, 112, 76).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.toggleSpeedMultiplier());
    container.add([shadow, background, rim, gloss, this.speedToggleText]);
    this.placeHudText(this.speedToggleText);
    container.add(hit);
  }

  private drawActiveCapacityPill(): void {
    const container = this.add.container(CAPACITY_LABEL_POSITION.x, CAPACITY_LABEL_POSITION.y).setDepth(52);
    container.add(this.add.ellipse(3, 11, CAPACITY_PILL_SIZE.width + 10, 42, 0x050915, 0.23));
    container.add(this.makeRoundRect(CAPACITY_PILL_SIZE.width, CAPACITY_PILL_SIZE.height, 20, 0x111a30, 0.98, 0x26324d, 3, 0.95));
    container.add(this.makeRoundRect(CAPACITY_PILL_SIZE.width - 20, CAPACITY_PILL_SIZE.height - 18, 15, 0x2f3a58, 0.94, 0xe8f1ff, 2, 0.28));
    container.add(this.add.circle(-55, 0, 7, 0x3de083, 0.95).setStrokeStyle(2, 0x071122, 0.72));
    container.add(this.add.circle(55, 0, 7, 0x95a6c9, 0.92).setStrokeStyle(2, 0x071122, 0.72));
    container.add(this.makeRoundRect(92, 9, 5, 0xffffff, 0.13, undefined, 0, 1, -4, -15));
    this.activeCapacityText = this.add
      .text(HUD_LABEL_OPTICAL_OFFSET.x, HUD_LABEL_OPTICAL_OFFSET.y, `0-${SLOT_CAPACITY}`, this.capacityTextStyle(26))
      .setOrigin(0.5, 0.5)
      .setStroke('#0b1020', 4)
      .setShadow(0, 2, '#050915', 3, false, true);
    this.activeCapacityText.setResolution(2);
    container.add(this.activeCapacityText);
    this.placeHudText(this.activeCapacityText);
  }

  private toggleSpeedMultiplier(): void {
    this.speedMultiplier = this.speedMultiplier === 1 ? 5 : 1;
    this.speedToggleText?.setText(`${this.speedMultiplier}x`);
    if (this.speedToggleText) {
      this.placeHudText(this.speedToggleText);
    }
    this.updateDebugState();
  }

  private drawTrack(): void {
    const width = this.track.right - this.track.left;
    const height = this.track.bottom - this.track.top;
    const shadow = this.add.graphics().setDepth(2);
    shadow.fillStyle(0x050915, 0.2);
    shadow.fillRoundedRect(this.track.left - 14, this.track.top + 18, width + 28, height + 20, 98);

    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x182039, 0.98);
    g.fillRoundedRect(this.track.left, this.track.top, width, height, 92);
    g.fillStyle(0x39415f, 0.96);
    g.fillRoundedRect(this.track.left + 14, this.track.top + 14, width - 28, height - 28, 80);
    g.fillStyle(0x252d48, 1);
    g.fillRoundedRect(this.track.left + 44, this.track.top + 44, width - 88, height - 88, 56);
    g.lineStyle(4, 0xe3edff, 0.24);
    g.strokeRoundedRect(this.track.left + 17, this.track.top + 17, width - 34, height - 34, 78);
    g.lineStyle(3, 0x6edcf4, 0.12);
    g.strokeRoundedRect(this.track.left + 28, this.track.top + 28, width - 56, height - 56, 70);

    this.conveyorLayer = this.add.container(0, 0).setDepth(4);
    this.createConveyorPlates();
    this.updateConveyor(0);
  }

  private createConveyorPlates(): void {
    if (!this.conveyorLayer) {
      return;
    }

    const count = Math.ceil(this.track.total / CONVEYOR_PLATE_SPACING);
    for (let index = 0; index < count; index += 1) {
      const plate = this.makeConveyorPlate(80, 20);
      this.conveyorLayer.add(plate);
      this.conveyorPlates.push({ container: plate, offset: index * CONVEYOR_PLATE_SPACING });
    }
  }

  private makeConveyorPlate(width: number, height: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    container.add(this.makeRoundRect(width, height, height / 2, 0xdbe6ff, 0.12, 0xffffff, 1, 0.1));
    container.add(this.makeRoundRect(width * 0.58, height * 0.32, height * 0.16, 0xffffff, 0.1, undefined, 0, 1, -width * 0.06, -height * 0.12));
    const g = this.add.graphics();
    g.lineStyle(2, 0x93d9ff, 0.26);
    g.lineBetween(-width * 0.26, 0, width * 0.28, 0);
    container.add(g);
    return container;
  }

  private updateConveyor(delta: number): void {
    if (!this.conveyorLayer) {
      return;
    }

    const conveyorMultiplier = this.speedMultiplier === 5 ? CONVEYOR_FAST_MULTIPLIER : 1;
    const scroll = (CONVEYOR_SCROLL_SPEED * conveyorMultiplier * delta) / 1000;
    this.conveyorOffset = (this.conveyorOffset + scroll) % CONVEYOR_PLATE_SPACING;

    this.conveyorPlates.forEach((plate) => {
      const position = this.positionOnTrack((plate.offset + this.conveyorOffset) % this.track.total);
      plate.container.setPosition(position.x, position.y);
      plate.container.setRotation(this.trackRotationFor(position.side));
    });

    window.__RPIXEL_CONVEYOR_OFFSET__ = Number(this.conveyorOffset.toFixed(2));
    window.__RPIXEL_CONVEYOR_MARKERS__ = this.conveyorPlates.length;
    window.__RPIXEL_TRACK_SPEED__ = TRACK_SPEED;
    window.__RPIXEL_CONVEYOR_SCROLL_SPEED__ = CONVEYOR_SCROLL_SPEED;
    window.__RPIXEL_CONVEYOR_EFFECTIVE_SCROLL_SPEED__ = CONVEYOR_SCROLL_SPEED * conveyorMultiplier;
    window.__RPIXEL_CONVEYOR_PLATE_SPACING__ = CONVEYOR_PLATE_SPACING;
    window.__RPIXEL_SPEED_TOGGLE_POSITION__ = SPEED_TOGGLE_POSITION;
    window.__RPIXEL_CAPACITY_LABEL_POSITION__ = CAPACITY_LABEL_POSITION;
    window.__RPIXEL_CAPACITY_LABEL_BOUNDS__ = this.activeCapacityText ? this.toDebugBounds(this.getTextVisualWorldBounds(this.activeCapacityText) ?? this.activeCapacityText.getBounds()) : undefined;
    window.__RPIXEL_SPEED_LABEL_BOUNDS__ = this.speedToggleText ? this.toDebugBounds(this.getTextVisualWorldBounds(this.speedToggleText) ?? this.speedToggleText.getBounds()) : undefined;
    window.__RPIXEL_CAPACITY_LABEL_TARGET__ = { x: CAPACITY_LABEL_POSITION.x + HUD_LABEL_OPTICAL_OFFSET.x, y: CAPACITY_LABEL_POSITION.y + HUD_LABEL_OPTICAL_OFFSET.y };
    window.__RPIXEL_SPEED_LABEL_TARGET__ = { x: SPEED_TOGGLE_POSITION.x + HUD_LABEL_OPTICAL_OFFSET.x, y: SPEED_TOGGLE_POSITION.y + HUD_LABEL_OPTICAL_OFFSET.y };
  }

  private drawBoard(): void {
    this.add.ellipse(this.center.x + 8, this.center.y + this.boardHeight / 2 - 4, this.boardWidth + 92, 50, 0x050915, 0.16).setDepth(4);
    this.addRoundRect(this.center.x, this.center.y, this.boardWidth + 36, this.boardHeight + 36, 20, 0x1b223b, 0.78, 0x0b1024, 3, 0.54).setDepth(5);
    this.addRoundRect(this.center.x, this.center.y, this.boardWidth + 12, this.boardHeight + 12, 14, 0x12182d, 0.72, 0xdce7ff, 2, 0.18).setDepth(6);

    this.cells = FIRST_LEVEL.grid.map((row, rowIndex) =>
      Array.from({ length: this.cols }, (_, colIndex) => {
        const color = row[colIndex] ?? null;
        if (color === null) {
          return null;
        }

        const image = this.add.image(
          this.boardX + colIndex * this.cellSize + this.cellSize / 2,
          this.boardY + rowIndex * this.cellSize + this.cellSize / 2,
          `block-${color}`,
        );
        image.setScale((this.cellSize * 1.08) / 128);
        image.setDepth(9 + rowIndex + colIndex * 0.01);

        return {
          row: rowIndex,
          col: colIndex,
          color,
          pending: false,
          cleared: false,
          image,
        };
      }),
    );
  }

  private drawSlotChrome(): void {
    this.slotChromeLayer = this.add.container(0, 0).setDepth(10);
    for (let index = 0; index < SLOT_CAPACITY; index += 1) {
      const position = this.slotPosition(index);
      this.slotChromeLayer.add(this.add.ellipse(position.x + 4, position.y + 24, 160, 44, 0x050915, 0.18));
      this.slotChromeLayer.add(this.makeRoundRect(154, 146, 28, 0x171d34, 0.78, 0x9fb0ca, 2, 0.22, position.x, position.y));
      this.slotChromeLayer.add(this.makeRoundRect(120, 112, 24, 0x343b5c, 0.46, undefined, 0, 1, position.x, position.y));
    }
  }

  private renderReserve(): void {
    if (!this.reserveLayer) {
      return;
    }

    this.reserveLabelDebug = [];
    this.reserveLayer.removeAll(true);
    this.reserveLayer.add(this.add.ellipse(540, 1636, 650, 286, 0x050915, 0.14));
    this.reserveLayer.add(this.makeRoundRect(628, 300, 54, 0x151b32, 0.42, 0xffffff, 2, 0.06, 540, 1606));

    this.visibleReserveEntries().forEach((entry) => {
      const position = this.reservePosition(entry.index);
      const locked = this.isReserveLocked(entry);
      const token = this.createPigToken(entry.pig, position.x, position.y, 0.9, !locked, () => this.handleReserveClick(entry.index), false);
      token.setAlpha(locked ? 0.74 : 1);
      this.reserveLayer?.add(token);
      const motionStart = this.reserveMotionStarts.get(entry.pig.id);
      if (motionStart) {
        token.setPosition(motionStart.x, motionStart.y);
        this.tweens.add({
          targets: token,
          x: position.x,
          y: position.y,
          alpha: locked ? 0.74 : 1,
          duration: 240,
          ease: 'Sine.easeOut',
        });
      }
      this.reserveLabelDebug.push(token.ammoLabelDebug(entry.index, entry.pig.id));
    });
    this.reserveMotionStarts.clear();
    this.renderManualLaunchHitZones();
  }

  private drawBoosterBar(): void {
    const layer = this.add.container(0, 0).setDepth(50);
    layer.add(this.add.rectangle(540, 1866, GAME_WIDTH, 108, 0x10182d, 0.98).setStrokeStyle(2, 0x8fa2c7, 0.18));
    layer.add(this.add.rectangle(540, 1812, GAME_WIDTH, 4, 0xc94a61, 0.58));
    const boosters = [
      { x: 148, type: 'add', count: '17' },
      { x: 392, type: 'tap', count: '44' },
      { x: 636, type: 'refresh', count: '38' },
      { x: 880, type: 'rocket', count: '8' },
    ];
    boosters.forEach((booster) => {
      const buttonY = 1836;
      layer.add(this.add.ellipse(booster.x + 3, buttonY + 18, 118, 34, 0x050915, 0.2));
      layer.add(this.add.circle(booster.x, buttonY, 62, 0x20283e).setStrokeStyle(5, 0xdce7ff, 0.68));
      layer.add(this.add.circle(booster.x, buttonY, 53, 0xd94a5d, 0.88).setStrokeStyle(2, 0x10182d, 0.7));
      layer.add(this.add.circle(booster.x - 13, buttonY - 18, 23, 0xffffff, 0.16));
      layer.add(this.add.circle(booster.x, buttonY, 43, 0xff7d82, 0.18));
      this.drawBoosterIcon(layer, booster.x, buttonY, booster.type);
      layer.add(this.add.circle(booster.x + 66, buttonY + 56, 25, 0xb91f34).setStrokeStyle(3, 0x5d0712, 0.86));
      layer.add(this.add.text(booster.x + 66, buttonY + 39, booster.count, this.premiumTextStyle(24)).setOrigin(0.5, 0).setStroke('#11182b', 4));
    });
  }

  private drawBoosterIcon(layer: Phaser.GameObjects.Container, x: number, y: number, type: string): void {
    if (type === 'add') {
      layer.add(this.makeRoundRect(54, 68, 10, 0xffffff, 0.98, 0x11182b, 4, 0.9, x - 8, y - 4));
      layer.add(this.makeRoundRect(44, 56, 9, 0xf4f7ff, 0.98, 0x11182b, 4, 0.9, x + 9, y + 4));
      layer.add(this.add.rectangle(x + 9, y + 4, 32, 8, 0xd94a5d).setStrokeStyle(3, 0x11182b, 0.92));
      layer.add(this.add.rectangle(x + 9, y + 4, 8, 32, 0xd94a5d).setStrokeStyle(3, 0x11182b, 0.92));
      return;
    }

    if (type === 'tap') {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.98);
      g.lineStyle(4, 0x11182b, 0.92);
      g.fillRoundedRect(x - 18, y - 48, 34, 92, 17);
      g.strokeRoundedRect(x - 18, y - 48, 34, 92, 17);
      g.fillRoundedRect(x - 2, y - 14, 52, 58, 18);
      g.strokeRoundedRect(x - 2, y - 14, 52, 58, 18);
      g.fillStyle(0xffd6dc, 0.96);
      g.fillRoundedRect(x - 9, y - 39, 18, 70, 9);
      g.lineStyle(3, 0x11182b, 0.8);
      g.lineBetween(x - 38, y - 48, x - 56, y - 68);
      g.lineBetween(x - 56, y - 18, x - 80, y - 18);
      layer.add(g);
      return;
    }

    if (type === 'refresh') {
      const g = this.add.graphics();
      g.lineStyle(10, 0xffffff, 0.98);
      g.beginPath();
      g.arc(x - 2, y, 34, Phaser.Math.DegToRad(35), Phaser.Math.DegToRad(215), false);
      g.strokePath();
      g.beginPath();
      g.arc(x + 2, y, 34, Phaser.Math.DegToRad(215), Phaser.Math.DegToRad(395), false);
      g.strokePath();
      g.fillStyle(0xffffff, 1);
      g.lineStyle(4, 0x11182b, 0.92);
      g.fillTriangle(x - 43, y + 4, x - 13, y + 1, x - 27, y + 29);
      g.strokeTriangle(x - 43, y + 4, x - 13, y + 1, x - 27, y + 29);
      g.fillTriangle(x + 43, y - 4, x + 13, y - 1, x + 27, y - 29);
      g.strokeTriangle(x + 43, y - 4, x + 13, y - 1, x + 27, y - 29);
      layer.add(g);
      return;
    }

    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.98);
    g.lineStyle(4, 0x11182b, 0.92);
    g.fillTriangle(x - 42, y + 36, x - 6, y - 46, x + 42, y + 20);
    g.strokeTriangle(x - 42, y + 36, x - 6, y - 46, x + 42, y + 20);
    g.fillStyle(0xe8f3ff, 0.98);
    g.fillCircle(x + 2, y - 6, 15);
    g.strokeCircle(x + 2, y - 6, 15);
    g.fillStyle(0xffd84a, 1);
    g.fillTriangle(x - 42, y + 36, x - 58, y + 52, x - 18, y + 42);
    layer.add(g);
  }

  private handleReserveClick(reserveIndex: number): void {
    if (this.gameOver) {
      return;
    }

    const entry = this.reserveEntryAt(reserveIndex);
    if (!entry || this.isReserveLocked(entry) || this.resolvingShooters.length >= SLOT_CAPACITY) {
      return;
    }

    const reservePosition = this.reservePosition(entry.index);
    this.captureReserveAdvanceMotion(entry);
    const [pig] = this.reserveColumns[entry.col].splice(entry.row, 1);
    const launchingPig = { ...pig, mystery: false };
    const token = this.createPigToken(launchingPig, reservePosition.x, reservePosition.y, 0.68, false, undefined, false);
    token.setDepth(24);

    this.renderReserve();
    this.launchShooter(launchingPig, token);

    this.updateDebugState();
  }

  private captureReserveAdvanceMotion(entry: ReserveEntry): void {
    const visibleRows = Math.ceil(RESERVE_VISIBLE / RESERVE_COLS);
    for (let row = entry.row + 1; row <= visibleRows; row += 1) {
      const pig = this.reserveColumns[entry.col]?.[row];
      if (!pig) {
        continue;
      }
      this.reserveMotionStarts.set(pig.id, this.reservePosition(row * RESERVE_COLS + entry.col));
    }
  }

  private isReserveLocked(entry: ReserveEntry): boolean {
    return entry.row > 0;
  }

  private handleSlotClick(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (this.gameOver || !slot || slot.status !== 'stuck' || this.resolvingShooters.length >= SLOT_CAPACITY) {
      return;
    }

    this.tweens.killTweensOf(slot.container);
    slot.status = 'activating';
    this.slots[slot.slotIndex] = null;
    this.clearPigTokenClick(slot.container);
    this.launchShooter(slot.pig, slot.container);
    this.compactWaitingSlots();
    this.renderManualLaunchHitZones();
    this.updateDebugState();
  }

  private launchShooter(pig: Pig, token: ShooterToken): void {
    const entryPosition = this.positionOnTrack(0);
    const active: ResolvingShooter = {
      pig,
      container: token,
      body: token.visualBody,
      distance: 0,
      orbiting: false,
      currentSide: 'bottom',
      pendingShots: 0,
      completedLap: false,
    };
    this.resolvingShooters.push(active);
    this.updateDebugState();

    const startScale = active.container.scaleX;
    const startX = active.container.x;
    const startY = active.container.y;

    this.tweens.add({
      targets: active.container,
      scale: startScale * 0.9,
      duration: 70,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onUpdate: () => this.faceTrackSide(active, 'bottom'),
      onComplete: () => {
        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 260,
          ease: 'Sine.easeOut',
          onUpdate: (tween) => {
            const progress = Number(tween.getValue());
            const lift = Math.sin(progress * Math.PI) * 30;
            active.container.setPosition(Phaser.Math.Linear(startX, entryPosition.x, progress), Phaser.Math.Linear(startY, entryPosition.y, progress) - lift);
            active.container.setScale(Phaser.Math.Linear(startScale, TRACK_SHOOTER_SCALE, progress));
            active.container.setAngle(Phaser.Math.Linear(active.container.angle, 0, progress));
            this.faceTrackSide(active, 'bottom');
          },
          onComplete: () => {
            active.distance = 0;
            active.container.setPosition(entryPosition.x, entryPosition.y);
            active.container.setScale(TRACK_SHOOTER_SCALE);
            active.container.setAngle(0);
            active.orbiting = true;
            this.faceTrackSide(active, 'bottom');
            this.tryFireAtCurrentTrackStep(active);
          },
        });
      },
    });
  }

  private updateResolvingShooter(active: ResolvingShooter, delta: number): void {
    if (!active.orbiting || !this.isResolvingActive(active)) {
      return;
    }

    const previousDistance = active.distance;
    active.distance = Math.min(this.track.total, active.distance + (TRACK_SPEED * this.speedMultiplier * delta) / 1000);
    const position = this.positionOnTrack(active.distance);
    active.container.setPosition(position.x, position.y);
    this.faceTrackSide(active, position.side);

    this.crossedTrackSteps(previousDistance, active.distance).forEach((step) => this.tryFireAtTrackStep(active, step));

    if (active.distance >= this.track.total) {
      active.completedLap = true;
      active.orbiting = false;
      if (active.pendingShots === 0) {
        this.resolveCompletedLap(active);
      }
    }
  }

  private tryFireAtCurrentTrackStep(active: ResolvingShooter): boolean {
    const step = this.trackSteps.find((candidate) => Math.abs(candidate.distance - active.distance) < 0.5);
    return step ? this.tryFireAtTrackStep(active, step) : false;
  }

  private tryFireAtTrackStep(active: ResolvingShooter, step: TrackStep): boolean {
    if (active.lastTrackStepKey === step.key || !this.isResolvingActive(active) || active.pig.ammo <= 0) {
      return false;
    }

    active.lastTrackStepKey = step.key;
    const target = this.findVisibleTarget(step.side, step.lineIndex, active.pig.color, active.targetKey);
    if (!target) {
      return false;
    }

    this.reserveTarget(active, target);
    this.fireProjectile(active, target, step, () => {
      if (!this.gameOver && this.isResolvingActive(active) && active.pendingShots === 0 && active.completedLap) {
        this.resolveCompletedLap(active);
      }
    });
    return true;
  }

  private hasRemainingColor(color: PigColor): boolean {
    return this.cells.some((row) => row.some((cell) => Boolean(cell && !cell.cleared && cell.color === color)));
  }

  private fireProjectile(active: ResolvingShooter, target: BoardCell, step: TrackStep, onComplete: () => void): void {
    this.releaseReservedTarget(active);
    target.pending = true;
    active.pendingShots += 1;
    active.pig.ammo -= 1;
    active.container.setAmmo(active.pig.ammo);
    const exhausted = active.pig.ammo <= 0;
    this.shotLog.push({
      pigId: active.pig.id,
      color: active.pig.color,
      side: step.side,
      lineIndex: step.lineIndex,
      cell: this.cellKey(target),
      distance: Math.round(step.distance),
    });
    window.__RPIXEL_SHOT_LOG__ = [...this.shotLog];

    const style = COLOR_STYLES[active.pig.color];
    const projectile = this.add.container(active.container.x, active.container.y).setDepth(23);
    projectile.add(this.add.circle(-6, 7, 20, style.dark, 0.62));
    projectile.add(this.add.circle(0, 0, 18, style.base, 1).setStrokeStyle(4, style.dark, 0.9));
    projectile.add(this.add.circle(-5, -6, 6, style.light, 0.92));
    this.tweens.add({ targets: target.image, scale: target.image.scaleX * 1.14, duration: 75, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: projectile,
      x: target.image.x,
      y: target.image.y,
      scale: 0.78,
      duration: 58,
      ease: 'Quad.easeOut',
      onComplete: () => {
        projectile.destroy();
        this.clearCell(target);
        active.pendingShots = Math.max(0, active.pendingShots - 1);
        onComplete();
      },
    });

    if (exhausted) {
      active.orbiting = false;
      this.finishResolvingShooter(active);
    }
  }

  private clearCell(cell: BoardCell): void {
    if (cell.cleared) {
      return;
    }

    cell.cleared = true;
    cell.pending = false;
    this.reservedTargetKeys.delete(this.cellKey(cell));
    this.clearedCells += 1;
    this.updateProgressText();
    this.updateDebugState();

    const style = COLOR_STYLES[cell.color];
    this.tweens.killTweensOf(cell.image);
    const flash = this.add.rectangle(cell.image.x, cell.image.y, this.cellSize * 1.05, this.cellSize * 1.05, 0xffffff, 0.58).setDepth(24).setScale(0.25);
    this.tweens.add({
      targets: flash,
      scale: 1.16,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
    const ring = this.add.circle(cell.image.x, cell.image.y, this.cellSize * 0.38, style.light, 0).setStrokeStyle(5, 0xffffff, 0.6).setDepth(24);
    this.tweens.add({
      targets: ring,
      scale: 1.75,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
    for (let index = 0; index < 18; index += 1) {
      const particle = this.add.circle(cell.image.x, cell.image.y, Phaser.Math.Between(5, 11), style.light, 0.86).setDepth(25);
      this.tweens.add({
        targets: particle,
        x: cell.image.x + Phaser.Math.Between(-74, 74),
        y: cell.image.y + Phaser.Math.Between(-74, 74),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(210, 360),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    for (let index = 0; index < 10; index += 1) {
      const shard = this.add
        .rectangle(cell.image.x, cell.image.y, Phaser.Math.Between(12, 24), Phaser.Math.Between(8, 18), index % 2 === 0 ? style.base : style.dark, 0.94)
        .setStrokeStyle(2, 0xffffff, 0.3)
        .setDepth(26)
        .setAngle(Phaser.Math.Between(-45, 45));
      this.tweens.add({
        targets: shard,
        x: cell.image.x + Phaser.Math.Between(-86, 86),
        y: cell.image.y + Phaser.Math.Between(-92, 92),
        angle: shard.angle + Phaser.Math.Between(-220, 220),
        alpha: 0,
        scale: 0.35,
        duration: Phaser.Math.Between(240, 430),
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy(),
      });
    }

    this.tweens.add({
      targets: cell.image,
      scale: cell.image.scaleX * 0.08,
      alpha: 0,
      angle: cell.image.angle + Phaser.Math.Between(-18, 18),
      duration: 260,
      ease: 'Back.easeIn',
      onComplete: () => cell.image.destroy(),
    });

    if (this.clearedCells >= this.totalCells) {
      this.time.delayedCall(260, () => this.showResult(true, `LEVEL ${FIRST_LEVEL.id} COMPLETED!`));
    }
  }

  private animateCoinsFrom(x: number, y: number, amount: number): void {
    const targetX = 816;
    const targetY = 84;
    for (let index = 0; index < 8; index += 1) {
      const coin = this.add.circle(x + Phaser.Math.Between(-28, 28), y + Phaser.Math.Between(-20, 20), 13, 0xffd84a).setStrokeStyle(4, 0x8a4c00).setDepth(70);
      this.tweens.add({
        targets: coin,
        x: targetX,
        y: targetY,
        scale: 0.45,
        duration: 420 + index * 35,
        ease: 'Sine.easeInOut',
        onComplete: () => coin.destroy(),
      });
    }

    this.time.delayedCall(620, () => {
      this.coins += amount;
      this.coinText?.setText(this.formatCoins(this.coins));
      this.updateDebugState();
    });
  }

  private finishResolvingShooter(active: ResolvingShooter): void {
    const index = this.resolvingShooters.indexOf(active);
    if (index === -1) {
      return;
    }

    this.releaseReservedTarget(active);
    this.resolvingShooters.splice(index, 1);
    this.tweens.killTweensOf(active.container);
    this.emitShooterExhaustBurst(active.container.x, active.container.y, active.pig.color);
    this.tweens.add({
      targets: active.container,
      y: active.container.y + 24,
      scale: active.container.scaleX * 1.12,
      angle: active.container.angle + 5,
      duration: 95,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: active.container,
          y: active.container.y - 36,
          scale: 0.18,
          angle: active.container.angle - 18,
          alpha: 0,
          duration: 260,
          ease: 'Back.easeIn',
          onComplete: () => active.container.destroy(),
        });
      },
    });
    this.updateDebugState();
  }

  private emitShooterExhaustBurst(x: number, y: number, color: PigColor): void {
    const style = COLOR_STYLES[color];
    const ring = this.add.circle(x, y, 42, style.light, 0).setStrokeStyle(6, style.light, 0.7).setDepth(26);
    this.tweens.add({
      targets: ring,
      scale: 2.1,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
    for (let index = 0; index < 12; index += 1) {
      const spark = this.add.circle(x, y, Phaser.Math.Between(5, 10), index % 2 === 0 ? style.light : style.base, 0.9).setDepth(27);
      this.tweens.add({
        targets: spark,
        x: x + Phaser.Math.Between(-80, 80),
        y: y + Phaser.Math.Between(-70, 70),
        scale: 0.2,
        alpha: 0,
        duration: Phaser.Math.Between(240, 430),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private resolveCompletedLap(active: ResolvingShooter): void {
    if (active.pig.ammo <= 0) {
      this.finishResolvingShooter(active);
      return;
    }

    this.returnShooterToWaiting(active);
  }

  private returnShooterToWaiting(active: ResolvingShooter): void {
    const activeIndex = this.resolvingShooters.indexOf(active);
    if (activeIndex === -1) {
      return;
    }

    this.compactWaitingSlots();
    const slotIndex = this.slots.findIndex((slot) => slot === null);
    if (slotIndex === -1) {
      this.showResult(false, 'WAITING FULL');
      return;
    }

    this.releaseReservedTarget(active);
    this.resolvingShooters.splice(activeIndex, 1);
    const slot: SlotShooter = {
      slotIndex,
      status: 'entering',
      pig: active.pig,
      container: active.container,
      body: active.body,
    };
    this.slots[slotIndex] = slot;
    this.renderManualLaunchHitZones();

    this.tweenEnteringSlotToAssignedPosition(slot, active, 360);

    this.updateDebugState();
  }

  private compactWaitingSlots(): void {
    const packed = this.slots.filter((slot): slot is SlotShooter => Boolean(slot));
    this.slots = Array.from({ length: SLOT_CAPACITY }, (_, index) => packed[index] ?? null);

    packed.forEach((slot, index) => {
      slot.slotIndex = index;
      if (slot.status === 'entering') {
        return;
      }
      const position = this.slotPosition(index);
      if (slot.status === 'stuck') {
        this.bindPigTokenClick(slot.container, WAITING_SHOOTER_SCALE, () => this.handleSlotClick(slot.slotIndex));
      }
      if (Math.abs(slot.container.x - position.x) < 0.5 && Math.abs(slot.container.y - position.y) < 0.5) {
        return;
      }
      this.tweenWaitingSlotShift(slot, position);
    });
    this.renderManualLaunchHitZones();
  }

  private tweenWaitingSlotShift(slot: SlotShooter, position: { x: number; y: number }): void {
    const startX = slot.container.x;
    const startY = slot.container.y;
    const startScale = slot.container.scaleX;
    this.tweens.killTweensOf(slot.container);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 280,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const progress = Number(tween.getValue());
        const lift = Math.sin(progress * Math.PI) * 18;
        const settle = Math.sin(progress * Math.PI) * 0.025;
        slot.container.setPosition(Phaser.Math.Linear(startX, position.x, progress), Phaser.Math.Linear(startY, position.y, progress) - lift);
        slot.container.setScale(Phaser.Math.Linear(startScale, WAITING_SHOOTER_SCALE, progress) * (1 + settle));
      },
      onComplete: () => {
        if (this.slots[slot.slotIndex] !== slot) {
          return;
        }
        slot.container.setPosition(position.x, position.y);
        slot.container.setScale(WAITING_SHOOTER_SCALE);
      },
    });
  }

  private tweenEnteringSlotToAssignedPosition(slot: SlotShooter, active: ResolvingShooter, duration: number): void {
    const startX = slot.container.x;
    const startY = slot.container.y;
    const startScale = slot.container.scaleX;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        const progress = Number(tween.getValue());
        const arc = Math.sin(progress * Math.PI) * 84;
        const position = this.slotPosition(slot.slotIndex);
        slot.container.setPosition(Phaser.Math.Linear(startX, position.x, progress), Phaser.Math.Linear(startY, position.y, progress) - arc);
        slot.container.setScale(Phaser.Math.Linear(startScale, WAITING_SHOOTER_SCALE, progress));
        this.faceTrackSide(active, 'bottom');
      },
      onComplete: () => this.completeEnteringSlot(slot),
    });
  }

  private completeEnteringSlot(slot: SlotShooter): void {
    if (this.gameOver || this.slots[slot.slotIndex] !== slot) {
      return;
    }

    const position = this.slotPosition(slot.slotIndex);
    slot.container.setPosition(position.x, position.y);
    slot.container.setScale(WAITING_SHOOTER_SCALE);
    slot.status = 'stuck';
    this.bindPigTokenClick(slot.container, WAITING_SHOOTER_SCALE, () => this.handleSlotClick(slot.slotIndex));
    this.renderManualLaunchHitZones();
    this.updateDebugState();
  }

  private findEdgeTarget(color: PigColor): EdgeTarget | null {
    const sides: Side[] = ['bottom', 'right', 'top', 'left'];
    for (const side of sides) {
      const lineCount = side === 'top' || side === 'bottom' ? this.cols : this.rows;
      for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
        const cell = this.findVisibleTarget(side, lineIndex, color);
        if (cell) {
          return {
            side,
            lineIndex,
            cell,
            distance: this.trackDistanceFor(side, lineIndex),
          };
        }
      }
    }
    return null;
  }

  private findVisibleTarget(side: Side, lineIndex: number, color: PigColor, allowedReservedKey?: string): BoardCell | null {
    const cell = this.findVisibleCell(side, lineIndex, allowedReservedKey);
    return cell?.color === color ? cell : null;
  }

  private findVisibleCell(side: Side, lineIndex: number, allowedReservedKey?: string): BoardCell | null {
    for (const [row, col] of this.scanSequence(side, lineIndex)) {
      const cell = this.cells[row]?.[col] ?? null;
      if (!cell || cell.cleared) {
        continue;
      }

      const key = this.cellKey(cell);
      if (cell.pending) {
        return null;
      }

      if (this.reservedTargetKeys.has(key) && key !== allowedReservedKey) {
        return null;
      }

      if (cell) {
        return cell;
      }
    }
    return null;
  }

  private scanSequence(side: Side, lineIndex: number): [number, number][] {
    const sequence: [number, number][] = [];
    if (side === 'bottom') {
      for (let row = this.rows - 1; row >= 0; row -= 1) {
        sequence.push([row, lineIndex]);
      }
    } else if (side === 'top') {
      for (let row = 0; row < this.rows; row += 1) {
        sequence.push([row, lineIndex]);
      }
    } else if (side === 'right') {
      for (let col = this.cols - 1; col >= 0; col -= 1) {
        sequence.push([lineIndex, col]);
      }
    } else {
      for (let col = 0; col < this.cols; col += 1) {
        sequence.push([lineIndex, col]);
      }
    }
    return sequence;
  }

  private showResult(win: boolean, title: string): void {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    window.__RPIXEL_SCENE__ = win ? 'win' : 'fail';

    this.add.rectangle(540, 960, GAME_WIDTH, GAME_HEIGHT, 0x04101f, 0.65).setDepth(80);
    const panel = this.add.container(540, 930).setDepth(81);
    panel.add(this.makeRoundRect(690, win ? 540 : 430, 38, win ? 0x2387ff : 0xbd2338, 1, 0x050915, 9));
    panel.add(this.makeRoundRect(620, 112, 30, 0xffffff, 0.2, undefined, 0, 1, 0, -168));

    if (win) {
      this.animateCoinsFrom(540, 930, 40);
      panel.add(this.add.text(0, -210, 'TROPHY', this.textStyle(52)).setOrigin(0.5, 0).setStroke('#8a4c00', 10));
      panel.add(this.add.circle(0, -66, 78, 0xffd84a).setStrokeStyle(8, 0x8a4c00));
      panel.add(this.add.rectangle(0, 25, 72, 92, 0xffc83d).setStrokeStyle(7, 0x8a4c00));
      panel.add(this.add.text(0, 95, title, this.textStyle(40)).setOrigin(0.5, 0).setStroke('#06101f', 9));
      panel.add(this.add.text(0, 164, '+40 coins', this.textStyle(42)).setOrigin(0.5, 0).setStroke('#06101f', 9));
      panel.add(this.makeResultButton(-170, 250, 'Continue', 0x35c95f, () => this.completeLevelAndReturn()));
      panel.add(this.makeResultButton(170, 250, '2X Reward', 0x8590a6, () => {
        this.animateCoinsFrom(540, 930, 40);
        this.time.delayedCall(520, () => this.completeLevelAndReturn());
      }));
      return;
    }

    panel.add(this.add.text(0, -164, title, this.textStyle(62)).setOrigin(0.5, 0).setStroke('#06101f', 12));
    panel.add(this.add.text(0, -74, 'Waiting area overflowed', this.textStyle(34)).setOrigin(0.5, 0).setStroke('#06101f', 8));
    panel.add(this.add.text(0, -24, 'More than 5 shooters returned.', this.textStyle(27)).setOrigin(0.5, 0).setStroke('#06101f', 7));
    for (let index = 0; index < SLOT_CAPACITY; index += 1) {
      panel.add(this.makeRoundRect(74, 54, 15, 0x101830, 1, 0xffffff, 4, 0.35, -176 + index * 88, 58));
      panel.add(this.add.circle(-176 + index * 88, 58, 18, 0xbd2338).setStrokeStyle(4, 0x050915));
    }
    panel.add(this.add.text(0, 108, `${this.clearedCells}/${this.totalCells} cleared`, this.textStyle(32)).setOrigin(0.5, 0).setStroke('#06101f', 8));
    panel.add(this.makeResultButton(-170, 202, 'Retry', 0xffc83d, () => this.scene.restart()));
    panel.add(this.makeResultButton(170, 202, 'Map', 0x35c95f, () => this.scene.start('MenuScene')));
  }

  private makeResultButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    let fired = false;
    const trigger = () => {
      if (fired) {
        return;
      }
      fired = true;
      onClick();
    };

    container.setSize(280, 122);
    container.setInteractive(new Phaser.Geom.Rectangle(-140, -61, 280, 122), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', trigger);
    container.add(this.makeRoundRect(245, 92, 24, color, 1, 0x050915, 6));
    container.add(this.add.text(0, -31, label, this.textStyle(label.length > 8 ? 30 : 36)).setOrigin(0.5, 0).setStroke('#06101f', 8));
    const hit = this.add.rectangle(0, 0, 280, 122, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', trigger);
    container.add(hit);
    return container;
  }

  private completeLevelAndReturn(): void {
    const stored = Number(window.localStorage.getItem('rpixel-current-level'));
    const current = Number.isFinite(stored) && stored >= FIRST_LEVEL.id ? stored : FIRST_LEVEL.id;
    window.localStorage.setItem('rpixel-current-level', String(Math.max(current, FIRST_LEVEL.id) + 1));
    this.scene.start('MenuScene');
  }

  private createPigToken(
    pig: Pig,
    x: number,
    y: number,
    scale: number,
    interactive: boolean,
    onClick?: () => void,
    mystery = false,
  ): ShooterToken {
    const token = new ShooterToken(this, { pig, x, y, scale, mystery });

    if (interactive && onClick) {
      this.bindPigTokenClick(token, scale, onClick);
    }

    return token;
  }

  private bindPigTokenClick(container: Phaser.GameObjects.Container, scale: number, onClick: () => void): void {
    this.clearPigTokenClick(container);
    container.setSize(178, 178);
    container.setInteractive(new Phaser.Geom.Rectangle(-89, -89, 178, 178), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.lastDirectPigPointerStamp = this.pointerEventStamp(pointer);
      this.tweens.add({ targets: container, scale: scale * 0.9, duration: 65, yoyo: true });
      onClick();
    });
  }

  private clearPigTokenClick(container: Phaser.GameObjects.Container): void {
    container.removeAllListeners('pointerdown');
    container.disableInteractive();
  }

  private renderManualLaunchHitZones(): void {
    if (!this.manualHitLayer) {
      return;
    }

    this.manualHitLayer.removeAll(true);
    this.visibleReserveEntries().forEach((entry) => {
      if (this.isReserveLocked(entry) || entry.row !== 0) {
        return;
      }

      const position = this.reservePosition(entry.index);
      this.manualHitLayer?.add(this.createManualLaunchZone(position.x, position.y, RESERVE_HIT_WIDTH, RESERVE_HIT_HEIGHT, { type: 'reserve', index: entry.index }));
    });

    this.slots.forEach((slot, index) => {
      if (!slot || slot.status !== 'stuck') {
        return;
      }

      const position = this.slotPosition(index);
      this.manualHitLayer?.add(this.createManualLaunchZone(position.x, position.y, WAITING_HIT_WIDTH, WAITING_HIT_HEIGHT, { type: 'waiting', index }));
    });
  }

  private createManualLaunchZone(
    x: number,
    y: number,
    width: number,
    height: number,
    target: ManualLaunchTarget,
  ): Phaser.GameObjects.Zone {
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.launchFromManualTarget(target, pointer));
    return zone;
  }

  private launchFromManualTarget(target: ManualLaunchTarget, pointer: Phaser.Input.Pointer): void {
    if (this.gameOver || this.resolvingShooters.length >= SLOT_CAPACITY) {
      return;
    }

    this.lastDirectPigPointerStamp = this.pointerEventStamp(pointer);
    if (target.type === 'waiting') {
      this.handleSlotClick(target.index);
      return;
    }

    this.handleReserveClick(target.index);
  }

  private bindManualLaunchFallback(): void {
    const fallbackZone = this.add.zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT).setDepth(-100).setInteractive({ useHandCursor: false });
    fallbackZone.on('pointerdown', this.handleManualLaunchPointer, this);
    this.input.on('pointerdown', this.handleManualLaunchPointer, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      fallbackZone.off('pointerdown', this.handleManualLaunchPointer, this);
      fallbackZone.destroy();
      this.input.off('pointerdown', this.handleManualLaunchPointer, this);
    });
  }

  private handleManualLaunchPointer(pointer: Phaser.Input.Pointer): void {
    if (this.gameOver || this.resolvingShooters.length >= SLOT_CAPACITY) {
      return;
    }

    const point = this.pointerGamePoint(pointer);
    const target = this.findManualLaunchTarget(point.x, point.y);
    if (!target) {
      return;
    }

    const pointerStamp = this.pointerEventStamp(pointer);
    const before = this.manualLaunchStateSignature();
    this.time.delayedCall(0, () => {
      if (
        this.gameOver ||
        this.resolvingShooters.length >= SLOT_CAPACITY ||
        this.lastDirectPigPointerStamp === pointerStamp ||
        this.manualLaunchStateSignature() !== before
      ) {
        return;
      }

      if (target.type === 'waiting') {
        this.handleSlotClick(target.index);
        return;
      }

      this.handleReserveClick(target.index);
    });
  }

  private pointerGamePoint(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    const event = pointer.event as
      | (Event & { clientX?: number; clientY?: number; changedTouches?: ArrayLike<{ clientX: number; clientY: number }> })
      | undefined;
    const touch = event?.changedTouches?.[0];
    const clientX = typeof event?.clientX === 'number' ? event.clientX : touch?.clientX;
    const clientY = typeof event?.clientY === 'number' ? event.clientY : touch?.clientY;

    if (typeof clientX === 'number' && typeof clientY === 'number') {
      const bounds = this.game.canvas.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        return {
          x: ((clientX - bounds.left) / bounds.width) * GAME_WIDTH,
          y: ((clientY - bounds.top) / bounds.height) * GAME_HEIGHT,
        };
      }
    }

    const worldX = Number.isFinite(pointer.worldX) ? pointer.worldX : pointer.x;
    const worldY = Number.isFinite(pointer.worldY) ? pointer.worldY : pointer.y;
    return { x: worldX, y: worldY };
  }

  private pointerEventStamp(pointer: Phaser.Input.Pointer): number {
    const event = pointer.event as Event | undefined;
    return typeof event?.timeStamp === 'number' ? event.timeStamp : pointer.downTime;
  }

  private findManualLaunchTarget(x: number, y: number): ManualLaunchTarget | null {
    const waitingTarget = this.nearestWaitingSlotAt(x, y);
    if (waitingTarget !== null) {
      return { type: 'waiting', index: waitingTarget };
    }

    const reserveTarget = this.nearestTopReserveAt(x, y);
    return reserveTarget === null ? null : { type: 'reserve', index: reserveTarget };
  }

  private nearestWaitingSlotAt(x: number, y: number): number | null {
    return this.nearestLaunchPoint(
      this.slots.flatMap((slot, index) => {
        if (!slot || slot.status !== 'stuck') {
          return [];
        }
        return [{ index, ...this.slotPosition(index) }];
      }),
      x,
      y,
    );
  }

  private nearestTopReserveAt(x: number, y: number): number | null {
    return this.nearestLaunchPoint(
      this.visibleReserveEntries().flatMap((entry) => {
        if (this.isReserveLocked(entry) || entry.row !== 0) {
          return [];
        }
        return [{ index: entry.index, ...this.reservePosition(entry.index) }];
      }),
      x,
      y,
    );
  }

  private nearestLaunchPoint(points: Array<{ index: number; x: number; y: number }>, x: number, y: number): number | null {
    let closestIndex: number | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const point of points) {
      const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);
      if (distance > MANUAL_LAUNCH_HIT_RADIUS || distance >= closestDistance) {
        continue;
      }
      closestIndex = point.index;
      closestDistance = distance;
    }
    return closestIndex;
  }

  private manualLaunchStateSignature(): string {
    const waiting = this.slots.map((slot) => (slot ? `${slot.slotIndex}:${slot.status}:${slot.pig.id}:${slot.pig.ammo}` : '-')).join('|');
    const reserve = this.reserveColumns.map((column) => column.map((pig) => `${pig.id}:${pig.ammo}`).join(',')).join('|');
    return `${this.resolvingShooters.length}/${waiting}/${reserve}`;
  }

  private drawGearIcon(x: number, y: number, radius: number, fill: number, stroke: number, strokeWidth: number, depth?: number): void {
    const g = this.add.graphics();
    if (depth !== undefined) {
      g.setDepth(depth);
    }
    g.fillStyle(fill, 1);
    g.lineStyle(strokeWidth, stroke, 1);
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const cx = x + Math.cos(angle) * radius * 0.76;
      const cy = y + Math.sin(angle) * radius * 0.76;
      g.fillRoundedRect(cx - 8, cy - 8, 16, 16, 4);
      g.strokeRoundedRect(cx - 8, cy - 8, 16, 16, 4);
    }
    g.fillCircle(x, y, radius * 0.72);
    g.strokeCircle(x, y, radius * 0.72);
    g.fillStyle(0x3b465f, 1);
    g.fillCircle(x, y, radius * 0.28);
    g.lineStyle(Math.max(3, strokeWidth - 2), stroke, 1);
    g.strokeCircle(x, y, radius * 0.28);
  }

  private isResolvingActive(active: ResolvingShooter): boolean {
    return this.resolvingShooters.includes(active);
  }

  private cellKey(cell: BoardCell): string {
    return `${cell.row}:${cell.col}`;
  }

  private reserveTarget(active: ResolvingShooter, cell: BoardCell): void {
    const nextKey = this.cellKey(cell);
    if (active.targetKey === nextKey) {
      return;
    }

    this.releaseReservedTarget(active);
    active.targetKey = nextKey;
    this.reservedTargetKeys.add(nextKey);
  }

  private releaseReservedTarget(active: ResolvingShooter): void {
    if (!active.targetKey) {
      return;
    }

    this.reservedTargetKeys.delete(active.targetKey);
    active.targetKey = undefined;
  }

  private createTrackSteps(): TrackStep[] {
    const steps: TrackStep[] = [];
    const sides: Side[] = ['bottom', 'right', 'top', 'left'];
    sides.forEach((side) => {
      const lineCount = side === 'top' || side === 'bottom' ? this.cols : this.rows;
      for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
        steps.push({
          side,
          lineIndex,
          distance: this.trackDistanceFor(side, lineIndex),
          key: `${side}:${lineIndex}`,
        });
      }
    });
    return steps.sort((a, b) => a.distance - b.distance);
  }

  private crossedTrackSteps(fromDistance: number, toDistance: number): TrackStep[] {
    const travel = (toDistance - fromDistance + this.track.total) % this.track.total;
    if (travel <= 0) {
      return [];
    }

    return this.trackSteps
      .map((step) => ({ step, ahead: (step.distance - fromDistance + this.track.total) % this.track.total }))
      .filter(({ ahead }) => ahead > 0 && ahead <= travel)
      .sort((a, b) => a.ahead - b.ahead)
      .map(({ step }) => step);
  }

  private positionOnTrack(distance: number): TrackPosition {
    const [bottomRight, rightUp, topLeft, leftDown] = this.track.segments;

    if (distance <= bottomRight) {
      return { x: this.track.startX + distance, y: this.track.bottom, side: 'bottom' };
    }

    if (distance <= bottomRight + rightUp) {
      const d = distance - bottomRight;
      return { x: this.track.right, y: this.track.bottom - d, side: 'right' };
    }

    if (distance <= bottomRight + rightUp + topLeft) {
      const d = distance - bottomRight - rightUp;
      return { x: this.track.right - d, y: this.track.top, side: 'top' };
    }

    if (distance <= bottomRight + rightUp + topLeft + leftDown) {
      const d = distance - bottomRight - rightUp - topLeft;
      return { x: this.track.left, y: this.track.top + d, side: 'left' };
    }

    const d = distance - bottomRight - rightUp - topLeft - leftDown;
    return { x: this.track.left + d, y: this.track.bottom, side: 'bottom' };
  }

  private trackDistanceFor(side: Side, lineIndex: number): number {
    const [bottomRight, rightUp, topLeft, leftDown] = this.track.segments;
    if (side === 'bottom') {
      const x = this.boardX + lineIndex * this.cellSize + this.cellSize / 2;
      return x >= this.track.startX ? x - this.track.startX : this.track.total - (this.track.startX - x);
    }
    if (side === 'right') {
      const y = this.boardY + lineIndex * this.cellSize + this.cellSize / 2;
      return bottomRight + (this.track.bottom - y);
    }
    if (side === 'top') {
      const x = this.boardX + lineIndex * this.cellSize + this.cellSize / 2;
      return bottomRight + rightUp + (this.track.right - x);
    }

    const y = this.boardY + lineIndex * this.cellSize + this.cellSize / 2;
    return bottomRight + rightUp + topLeft + (y - this.track.top) + leftDown * 0;
  }

  private createTrackMetrics(): TrackMetrics {
    const left = this.boardX - TRACK_PAD;
    const right = this.boardX + this.boardWidth + TRACK_PAD;
    const top = this.boardY - TRACK_PAD;
    const bottom = this.boardY + this.boardHeight + TRACK_PAD;
    const startX = left + TRACK_START_OFFSET;
    const bottomRight = right - startX;
    const rightUp = bottom - top;
    const topLeft = right - left;
    const leftDown = bottom - top;
    const bottomCenter = startX - left;
    const segments = [bottomRight, rightUp, topLeft, leftDown, bottomCenter];
    return {
      left,
      right,
      top,
      bottom,
      startX,
      segments,
      total: segments.reduce((sum, value) => sum + value, 0),
    };
  }

  private slotPosition(index: number): { x: number; y: number } {
    return { x: 160 + index * 190, y: SLOT_Y };
  }

  private buildReserveColumns(pigs: Pig[]): Pig[][] {
    const columns = Array.from({ length: RESERVE_COLS }, () => [] as Pig[]);
    pigs.forEach((pig, index) => {
      columns[index % RESERVE_COLS].push({ ...pig });
    });
    return columns;
  }

  private reserveCoordinates(index: number): { row: number; col: number } {
    return { col: index % RESERVE_COLS, row: Math.floor(index / RESERVE_COLS) };
  }

  private reserveEntryAt(index: number): ReserveEntry | null {
    const { row, col } = this.reserveCoordinates(index);
    const pig = this.reserveColumns[col]?.[row];
    return pig ? { pig, index, row, col } : null;
  }

  private visibleReserveEntries(): ReserveEntry[] {
    const entries: ReserveEntry[] = [];
    const visibleRows = Math.ceil(RESERVE_VISIBLE / RESERVE_COLS);
    for (let row = 0; row < visibleRows; row += 1) {
      for (let col = 0; col < RESERVE_COLS; col += 1) {
        const pig = this.reserveColumns[col]?.[row];
        if (pig) {
          entries.push({ pig, index: row * RESERVE_COLS + col, row, col });
        }
      }
    }
    return entries;
  }

  private reserveCount(): number {
    return this.reserveColumns.reduce((sum, column) => sum + column.length, 0);
  }

  private reservePosition(index: number): { x: number; y: number } {
    const col = index % RESERVE_COLS;
    const row = Math.floor(index / RESERVE_COLS);
    return { x: 320 + col * 220, y: 1538 + row * 148 };
  }

  private faceTrackSide(active: ResolvingShooter, side = active.currentSide): void {
    active.currentSide = side;
    active.body.setRotation(this.trackRotationFor(side));
  }

  private trackRotationFor(side: Side): number {
    const rotations: Record<Side, number> = {
      bottom: 0,
      left: Math.PI / 2,
      top: Math.PI,
      right: -Math.PI / 2,
    };
    return rotations[side];
  }

  private updateProgressText(): void {
    const left = this.totalCells - this.clearedCells;
    this.blocksLeftText?.setText(`${left} blocks`);
    if (this.progressFill) {
      this.progressFill.clear();
    }
    window.__RPIXEL_BLOCKS_LEFT__ = left;
  }

  private updateDebugState(): void {
    const activeCapacityLabel = `${this.resolvingShooters.length}-${SLOT_CAPACITY}`;
    this.activeCapacityText?.setText(activeCapacityLabel);
    if (this.activeCapacityText) {
      this.placeHudText(this.activeCapacityText);
    }
    window.__RPIXEL_CAPACITY_LABEL__ = activeCapacityLabel;
    window.__RPIXEL_ACTIVE_PIGS__ = this.resolvingShooters.length;
    window.__RPIXEL_BLOCKS_LEFT__ = this.totalCells - this.clearedCells;
    window.__RPIXEL_SLOTS_FILLED__ = this.slots.filter(Boolean).length;
    window.__RPIXEL_STUCK_SLOTS__ = this.slots.filter((slot) => slot?.status === 'stuck').length;
    window.__RPIXEL_RESERVE_LEFT__ = this.reserveCount();
    const visibleReserve = this.visibleReserveEntries();
    window.__RPIXEL_LOCKED_RESERVE__ = visibleReserve.filter((entry) => this.isReserveLocked(entry)).length;
    window.__RPIXEL_TREASURE_UNLOCKED__ = true;
    window.__RPIXEL_COINS__ = this.coins;
    window.__RPIXEL_SPEED_MULTIPLIER__ = this.speedMultiplier;
    window.__RPIXEL_CONVEYOR_OFFSET__ = Number(this.conveyorOffset.toFixed(2));
    window.__RPIXEL_CONVEYOR_MARKERS__ = this.conveyorPlates.length;
    window.__RPIXEL_TRACK_SPEED__ = TRACK_SPEED;
    window.__RPIXEL_CONVEYOR_SCROLL_SPEED__ = CONVEYOR_SCROLL_SPEED;
    window.__RPIXEL_CONVEYOR_EFFECTIVE_SCROLL_SPEED__ = CONVEYOR_SCROLL_SPEED * (this.speedMultiplier === 5 ? CONVEYOR_FAST_MULTIPLIER : 1);
    window.__RPIXEL_CONVEYOR_PLATE_SPACING__ = CONVEYOR_PLATE_SPACING;
    window.__RPIXEL_SPEED_TOGGLE_POSITION__ = SPEED_TOGGLE_POSITION;
    window.__RPIXEL_CAPACITY_LABEL_POSITION__ = CAPACITY_LABEL_POSITION;
    window.__RPIXEL_CAPACITY_LABEL_BOUNDS__ = this.activeCapacityText ? this.toDebugBounds(this.getTextVisualWorldBounds(this.activeCapacityText) ?? this.activeCapacityText.getBounds()) : undefined;
    window.__RPIXEL_SPEED_LABEL_BOUNDS__ = this.speedToggleText ? this.toDebugBounds(this.getTextVisualWorldBounds(this.speedToggleText) ?? this.speedToggleText.getBounds()) : undefined;
    window.__RPIXEL_CAPACITY_LABEL_TARGET__ = { x: CAPACITY_LABEL_POSITION.x + HUD_LABEL_OPTICAL_OFFSET.x, y: CAPACITY_LABEL_POSITION.y + HUD_LABEL_OPTICAL_OFFSET.y };
    window.__RPIXEL_SPEED_LABEL_TARGET__ = { x: SPEED_TOGGLE_POSITION.x + HUD_LABEL_OPTICAL_OFFSET.x, y: SPEED_TOGGLE_POSITION.y + HUD_LABEL_OPTICAL_OFFSET.y };
    window.__RPIXEL_BOARD_COLOR_COUNTS__ = this.countInitialBoardColors();
    window.__RPIXEL_AMMO_COLOR_TOTALS__ = this.countInitialAmmoTotals();
    window.__RPIXEL_ALL_SHOOTER_AMMO__ = FIRST_LEVEL.pigs.map((pig) => pig.ammo);
    window.__RPIXEL_BOARD_SHAPE__ = {
      rows: this.rows,
      cols: this.cols,
      filled: this.totalCells,
      empty: this.rows * this.cols - this.totalCells,
      rowWidths: FIRST_LEVEL.grid.map((row) => row.filter((color) => color !== null).length),
    };
    window.__RPIXEL_VISIBLE_RESERVE__ = visibleReserve.map((entry) => {
      const position = this.reservePosition(entry.index);
      return { index: entry.index, row: entry.row, col: entry.col, id: entry.pig.id, color: entry.pig.color, ammo: entry.pig.ammo, locked: this.isReserveLocked(entry), x: position.x, y: position.y };
    });
    window.__RPIXEL_VISIBLE_RESERVE_LABELS__ = this.reserveLabelDebug;
    window.__RPIXEL_VISIBLE_WAITING__ = this.slots.flatMap((slot, index) => {
      if (!slot) {
        return [];
      }
      const position = this.slotPosition(index);
      return [{ index, id: slot.pig.id, color: slot.pig.color, status: slot.status, ammo: slot.pig.ammo, x: position.x, y: position.y, actualX: Math.round(slot.container.x), actualY: Math.round(slot.container.y) }];
    });
    window.__RPIXEL_SHOT_LOG__ = [...this.shotLog];
    this.publishActiveShooterDebug();
    window.__RPIXEL_EXPOSED_COLORS__ = this.getExposedColors();
  }

  private publishActiveShooterDebug(): void {
    window.__RPIXEL_ACTIVE_SHOOTERS__ = this.resolvingShooters.map((active) => ({
      color: active.pig.color,
      ammo: active.pig.ammo,
      distance: Math.round(active.distance),
      x: Math.round(active.container.x),
      y: Math.round(active.container.y),
      orbiting: active.orbiting,
      side: active.currentSide,
      rotation: Number(active.body.rotation.toFixed(3)),
      pendingShots: active.pendingShots,
      completedLap: active.completedLap,
    }));
  }

  private placeHudText(text: Phaser.GameObjects.Text): void {
    text.setPosition(HUD_LABEL_OPTICAL_OFFSET.x, HUD_LABEL_OPTICAL_OFFSET.y).setOrigin(0.5, 0.5);
    this.centerTextVisualBoundsOnLocalTarget(text, HUD_LABEL_OPTICAL_OFFSET);
  }

  private centerTextVisualBoundsOnLocalTarget(text: Phaser.GameObjects.Text, target: { x: number; y: number }): void {
    const center = this.getTextVisualWorldCenter(text);
    if (!center) {
      return;
    }

    const parent = text.parentContainer;
    const centerLocal = parent ? parent.getWorldTransformMatrix().applyInverse(center.x, center.y) : center;
    const deltaX = target.x - centerLocal.x;
    const deltaY = target.y - centerLocal.y;
    if (Number.isFinite(deltaX) && Number.isFinite(deltaY)) {
      text.setPosition(text.x + deltaX, text.y + deltaY);
    }
  }

  private getTextVisualWorldCenter(text: Phaser.GameObjects.Text): { x: number; y: number } | undefined {
    const bounds = this.getTextVisualCanvasBounds(text);
    if (!bounds) {
      return undefined;
    }

    const resolution = text.style.resolution || 1;
    const centerX = ((bounds.left + bounds.right + 1) / 2) / resolution - text.displayOriginX;
    const centerY = ((bounds.top + bounds.bottom + 1) / 2) / resolution - text.displayOriginY;
    const point = text.getWorldTransformMatrix().transformPoint(centerX, centerY);
    return { x: point.x, y: point.y };
  }

  private getTextVisualWorldBounds(text: Phaser.GameObjects.Text): DebugBounds | undefined {
    const bounds = this.getTextVisualCanvasBounds(text);
    if (!bounds) {
      return undefined;
    }

    const resolution = text.style.resolution || 1;
    const left = bounds.left / resolution - text.displayOriginX;
    const right = (bounds.right + 1) / resolution - text.displayOriginX;
    const top = bounds.top / resolution - text.displayOriginY;
    const bottom = (bounds.bottom + 1) / resolution - text.displayOriginY;
    const matrix = text.getWorldTransformMatrix();
    const points = [
      matrix.transformPoint(left, top),
      matrix.transformPoint(right, top),
      matrix.transformPoint(right, bottom),
      matrix.transformPoint(left, bottom),
    ];
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const worldLeft = Math.min(...xs);
    const worldRight = Math.max(...xs);
    const worldTop = Math.min(...ys);
    const worldBottom = Math.max(...ys);
    return {
      left: worldLeft,
      right: worldRight,
      top: worldTop,
      bottom: worldBottom,
      width: worldRight - worldLeft,
      height: worldBottom - worldTop,
    };
  }

  private getTextVisualCanvasBounds(text: Phaser.GameObjects.Text): { left: number; right: number; top: number; bottom: number } | undefined {
    const canvas = text.canvas;
    const context = text.context;
    const width = canvas.width;
    const height = canvas.height;
    if (width <= 0 || height <= 0) {
      return undefined;
    }

    const data = context.getImageData(0, 0, width, height).data;
    let left = width;
    let right = -1;
    let top = height;
    let bottom = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha <= 64) {
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
    return { left, right, top, bottom };
  }

  private toDebugBounds(bounds: Phaser.Geom.Rectangle | DebugBounds): DebugBounds {
    return {
      left: Math.round(bounds.left),
      right: Math.round(bounds.right),
      top: Math.round(bounds.top),
      bottom: Math.round(bounds.bottom),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    };
  }

  private emptyColorTotals(): Record<PigColor, number> {
    return PIG_COLORS.reduce(
      (totals, color) => ({ ...totals, [color]: 0 }),
      {} as Record<PigColor, number>,
    );
  }

  private countInitialBoardColors(): Record<PigColor, number> {
    const totals = this.emptyColorTotals();
    FIRST_LEVEL.grid.flat().forEach((color) => {
      if (color !== null) {
        totals[color] += 1;
      }
    });
    return totals;
  }

  private countInitialAmmoTotals(): Record<PigColor, number> {
    const totals = this.emptyColorTotals();
    FIRST_LEVEL.pigs.forEach((pig) => {
      totals[pig.color] += pig.ammo;
    });
    return totals;
  }

  private getExposedColors(): string[] {
    const colors = new Set<string>();
    const sides: Side[] = ['bottom', 'right', 'top', 'left'];
    for (const side of sides) {
      const lineCount = side === 'top' || side === 'bottom' ? this.cols : this.rows;
      for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
        const cell = this.findVisibleCell(side, lineIndex);
        if (cell) {
          colors.add(cell.color);
        }
      }
    }
    return Array.from(colors);
  }

  private formatCoins(value: number): string {
    return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : String(value);
  }

  private addRoundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor: number,
    fillAlpha = 1,
    strokeColor?: number,
    strokeWidth = 0,
    strokeAlpha = 1,
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    if (strokeColor !== undefined && strokeWidth > 0) {
      graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
      graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    }
    return graphics;
  }

  private makeRoundRect(
    width: number,
    height: number,
    radius: number,
    fillColor: number,
    fillAlpha = 1,
    strokeColor?: number,
    strokeWidth = 0,
    strokeAlpha = 1,
    offsetX = 0,
    offsetY = 0,
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRoundedRect(offsetX - width / 2, offsetY - height / 2, width, height, radius);
    if (strokeColor !== undefined && strokeWidth > 0) {
      graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
      graphics.strokeRoundedRect(offsetX - width / 2, offsetY - height / 2, width, height, radius);
    }
    return graphics;
  }

  private textStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      align: 'center',
    };
  }

  private compactHudTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Rounded MT Bold, Arial Black, Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#f8fbff',
      align: 'center',
    };
  }

  private premiumTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Rounded MT Bold, Arial Black, Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#f5f8ff',
      align: 'center',
    };
  }

  private capacityTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Rounded MT Bold, Arial Black, Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#eef5ff',
      align: 'center',
    };
  }

}
