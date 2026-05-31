import Phaser from 'phaser';
import { COLOR_STYLES } from '../assets';
import { FIRST_LEVEL } from '../data/levels';
import { PIG_COLORS, type Pig, type PigColor } from '../types';

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;
const SLOT_CAPACITY = 5;
const BOARD_BOX_WIDTH = 760;
const BOARD_BOX_HEIGHT = 840;
const BOARD_TOP = 270;
const TRACK_PAD = 116;
const SLOT_Y = 1360;
const RESERVE_VISIBLE = 9;
const RESERVE_COLS = 3;
const TRACK_SPEED = 820;
const CONVEYOR_SCROLL_SPEED = 96;
const CONVEYOR_FAST_MULTIPLIER = 1.35;
const CONVEYOR_PLATE_SPACING = 62;
const TRANSFER_PLATE_SPACING = 62;
const TRACK_SHOOTER_SCALE = 0.9;
const WAITING_SHOOTER_SCALE = 0.84;
const SPEED_TOGGLE_POSITION = { x: 214, y: 82 };
const CAPACITY_LABEL_POSITION = { x: 328, y: 82 };
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

interface TreasureState {
  unlocked: boolean;
  container: Phaser.GameObjects.Container;
  row: number;
  col: number;
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

interface TransferPlate {
  container: Phaser.GameObjects.Container;
  phase: number;
  from: Phaser.Math.Vector2;
  to: Phaser.Math.Vector2;
  rotation: number;
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
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  ammoText: Phaser.GameObjects.Text;
}

type ManualLaunchTarget = { type: 'reserve'; index: number } | { type: 'waiting'; index: number };

interface ResolvingShooter {
  pig: Pig;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  ammoText: Phaser.GameObjects.Text;
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
  private transferPlates: TransferPlate[] = [];
  private conveyorOffset = 0;
  private blocksLeftText?: Phaser.GameObjects.Text;
  private activeCapacityText?: Phaser.GameObjects.Text;
  private speedToggleText?: Phaser.GameObjects.Text;
  private coinText?: Phaser.GameObjects.Text;
  private progressFill?: Phaser.GameObjects.Graphics;
  private treasure?: TreasureState;
  private coins = 10100;
  private totalCells = 0;
  private clearedCells = 0;
  private lastDirectPigPointerStamp = -1;
  private speedMultiplier: 1 | 5 = 1;
  private shotLog: Array<{ pigId: string; color: PigColor; side: Side; lineIndex: number; cell: string; distance: number }> = [];
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
    this.treasure = undefined;
    this.coins = 10100;
    this.clearedCells = 0;
    this.speedMultiplier = 1;
    this.conveyorOffset = 0;
    this.conveyorPlates = [];
    this.transferPlates = [];
    this.slots = Array.from({ length: SLOT_CAPACITY }, () => null);
    this.reserveColumns = this.buildReserveColumns(FIRST_LEVEL.pigs);
    this.shotLog = [];
    this.totalCells = FIRST_LEVEL.grid.flat().filter((color) => color !== null).length;

    this.drawBackground();
    this.drawHud();
    this.drawTrack();
    this.drawBoard();
    this.drawTreasure();
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
    const top = Phaser.Display.Color.ValueToColor(0x48507a);
    const bottom = Phaser.Display.Color.ValueToColor(0x252943);

    for (let y = 0; y < GAME_HEIGHT; y += 12) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, GAME_HEIGHT, y);
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      graphics.fillRect(0, y, GAME_WIDTH, 12);
    }

    graphics.fillStyle(0xffffff, 0.045);
    graphics.fillRoundedRect(42, 190, 996, 1070, 46);
    graphics.fillStyle(0x071122, 0.16);
    graphics.fillRoundedRect(74, 248, 932, 1010, 44);
    graphics.fillStyle(0xffffff, 0.055);
    graphics.fillCircle(256, 356, 270);
    graphics.fillStyle(0xffd86b, 0.04);
    graphics.fillCircle(852, 1128, 360);
    graphics.fillStyle(0x050915, 0.22);
    graphics.fillRoundedRect(86, 1288, 908, 518, 58);
    graphics.lineStyle(4, 0xffffff, 0.07);
    graphics.strokeRoundedRect(94, 1296, 892, 502, 52);
    graphics.lineStyle(3, 0xffffff, 0.045);
    for (let y = 240; y < 1260; y += 68) {
      graphics.lineBetween(84, y, 996, y - 42);
    }

    graphics.lineStyle(7, 0xffffff, 0.05);
    for (let i = 0; i < 24; i += 1) {
      const x = 60 + ((i * 211) % 980);
      const y = 220 + i * 72;
      if (i % 2 === 0) {
        graphics.strokeCircle(x, y, 40);
        graphics.strokeCircle(x - 14, y - 6, 7);
        graphics.strokeCircle(x + 16, y - 6, 7);
      } else {
        graphics.strokeRoundedRect(x - 36, y - 28, 72, 56, 14);
      }
    }
  }

  private drawHud(): void {
    this.add.circle(94, 82, 56, 0xe63942).setStrokeStyle(7, 0x050915);
    this.drawGearIcon(94, 82, 36, 0xf2f5ff, 0x050915, 6, 7);
    this.add.zone(94, 82, 128, 128).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('MenuScene'));

    this.addRoundRect(540, 82, 300, 86, 24, 0xe63a4b, 1, 0x050915, 7);
    this.add.text(540, 50, `Level ${FIRST_LEVEL.id}`, this.textStyle(43)).setOrigin(0.5, 0).setStroke('#06101f', 9);

    this.add.circle(744, 82, 42, 0xffc937).setStrokeStyle(6, 0x7a4a00);
    this.add.circle(744, 82, 29, 0xffdd55, 0.72);
    this.coinText = this.add.text(798, 50, this.formatCoins(this.coins), this.textStyle(43)).setStroke('#06101f', 9);
    this.addRoundRect(968, 82, 84, 78, 18, 0xffb43d, 1, 0x6b3b00, 6);
    this.add.text(943, 40, '+', this.textStyle(65)).setStroke('#9a5200', 8);
    this.drawSpeedToggle();
    this.drawActiveCapacityPill();

    this.progressFill = this.add.graphics().setDepth(4);
    this.blocksLeftText = this.add.text(540, 134, '', this.textStyle(18)).setOrigin(0.5, 0).setAlpha(0);
    this.updateProgressText();
  }

  private drawSpeedToggle(): void {
    const container = this.add.container(SPEED_TOGGLE_POSITION.x, SPEED_TOGGLE_POSITION.y).setDepth(52);
    const shadow = this.add.ellipse(3, 10, 116, 48, 0x050915, 0.34);
    const background = this.makeRoundRect(104, 60, 20, 0x202845, 0.98, 0x050915, 6, 1);
    const rim = this.makeRoundRect(86, 42, 15, 0x39456c, 0.98, 0xdce7ff, 4, 0.68);
    const gloss = this.makeRoundRect(62, 12, 7, 0xffffff, 0.22, undefined, 0, 1, -3, -15);
    this.speedToggleText = this.add.text(0, -21, '1x', this.textStyle(32)).setOrigin(0.5, 0).setStroke('#06101f', 7);
    const hit = this.add.zone(0, 0, 112, 76).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.toggleSpeedMultiplier());
    container.add([shadow, background, rim, gloss, this.speedToggleText, hit]);
  }

  private drawActiveCapacityPill(): void {
    const container = this.add.container(CAPACITY_LABEL_POSITION.x, CAPACITY_LABEL_POSITION.y).setDepth(52);
    container.add(this.add.ellipse(2, 10, 96, 42, 0x050915, 0.32));
    container.add(this.makeRoundRect(90, 54, 18, 0x11192e, 0.96, 0x050915, 5, 1));
    container.add(this.makeRoundRect(72, 36, 13, 0x2e3a5f, 0.98, 0xe8f1ff, 3, 0.58));
    container.add(this.add.circle(-29, 0, 6, 0x35c95f, 0.95).setStrokeStyle(2, 0x050915, 0.9));
    container.add(this.add.circle(29, 0, 6, 0x8ea0cf, 0.95).setStrokeStyle(2, 0x050915, 0.9));
    container.add(this.makeRoundRect(48, 9, 5, 0xffffff, 0.17, undefined, 0, 1, -4, -13));
    this.activeCapacityText = this.add.text(0, -15, `0-${SLOT_CAPACITY}`, this.textStyle(25)).setOrigin(0.5, 0).setStroke('#050915', 5);
    this.activeCapacityText.setResolution(2);
    container.add(this.activeCapacityText);
  }

  private toggleSpeedMultiplier(): void {
    this.speedMultiplier = this.speedMultiplier === 1 ? 5 : 1;
    this.speedToggleText?.setText(`${this.speedMultiplier}x`);
    this.updateDebugState();
  }

  private drawTreasure(): void {
    const row = Math.floor(this.rows / 2);
    const col = Math.floor(this.cols / 2);
    const x = this.boardX + col * this.cellSize + this.cellSize / 2;
    const y = this.boardY + row * this.cellSize + this.cellSize / 2;
    const container = this.add.container(x, y).setDepth(7).setScale(Math.min(0.82, (this.cellSize * 1.16) / 150));

    container.add(this.add.ellipse(10, 50, 170, 38, 0x050915, 0.28));
    container.add(this.makeRoundRect(158, 100, 22, 0x8b4a17, 0.92, 0x050915, 7, 1, 0, 14));
    container.add(this.makeRoundRect(174, 56, 22, 0xffc83d, 0.96, 0x8a4c00, 5, 1, 0, -38));
    container.add(this.add.rectangle(0, 8, 176, 20, 0xffd84a, 0.94).setStrokeStyle(4, 0x8a4c00));
    container.add(this.add.circle(0, 24, 18, 0xffd84a).setStrokeStyle(5, 0x8a4c00));
    container.add(this.add.text(0, -3, '+40', this.textStyle(30)).setOrigin(0.5, 0).setStroke('#06101f', 6));
    container.add(this.add.text(0, 52, 'LOCK', this.textStyle(21)).setOrigin(0.5, 0).setStroke('#06101f', 5));
    container.setAlpha(0.48);
    this.treasure = { unlocked: false, container, row, col };
  }

  private drawTrack(): void {
    const width = this.track.right - this.track.left;
    const height = this.track.bottom - this.track.top;
    const shadow = this.add.graphics().setDepth(2);
    shadow.fillStyle(0x050915, 0.42);
    shadow.fillRoundedRect(this.track.left - 16, this.track.top + 22, width + 32, height + 24, 104);

    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x11152b, 1);
    g.fillRoundedRect(this.track.left - 2, this.track.top - 2, width + 4, height + 4, 94);
    g.lineStyle(9, 0x050915, 0.98);
    g.strokeRoundedRect(this.track.left - 2, this.track.top - 2, width + 4, height + 4, 94);
    g.fillStyle(0x41456e, 1);
    g.fillRoundedRect(this.track.left + 8, this.track.top + 8, width - 16, height - 16, 88);
    g.lineStyle(13, 0xd8f1ff, 0.9);
    g.strokeRoundedRect(this.track.left + 8, this.track.top + 8, width - 16, height - 16, 88);
    g.lineStyle(5, 0xffffff, 0.62);
    g.strokeRoundedRect(this.track.left + 20, this.track.top + 20, width - 40, height - 40, 78);
    g.fillStyle(0x34375c, 0.98);
    g.fillRoundedRect(this.track.left + 34, this.track.top + 34, width - 68, height - 68, 68);
    g.lineStyle(8, 0x151932, 0.92);
    g.strokeRoundedRect(this.track.left + 44, this.track.top + 44, width - 88, height - 88, 58);
    g.lineStyle(3, 0x8ea0cf, 0.26);
    g.strokeRoundedRect(this.track.left + 58, this.track.top + 58, width - 116, height - 116, 48);

    this.conveyorLayer = this.add.container(0, 0).setDepth(4);
    this.drawTransferConveyorLanes();
    this.createConveyorPlates();
    this.updateConveyor(0);
  }

  private drawTransferConveyorLanes(): void {
    if (!this.conveyorLayer) {
      return;
    }

    const uploadStart = this.transferUploadStart();
    const uploadEnd = this.transferUploadEnd();
    const exitStart = this.transferExitStart();
    const exitEnd = this.transferExitEnd();
    const laneY = (uploadStart.y + uploadEnd.y) / 2;
    const laneHeight = Math.abs(uploadStart.y - uploadEnd.y) + 34;

    this.conveyorLayer.add(this.makeRoundRect(58, laneHeight, 18, 0x242849, 0.98, 0xd8f1ff, 5, 0.7, uploadStart.x, laneY));
    this.conveyorLayer.add(this.makeRoundRect(58, laneHeight, 18, 0x242849, 0.98, 0xd8f1ff, 5, 0.7, exitStart.x, laneY));
    this.conveyorLayer.add(this.makeRoundRect(132, 50, 18, 0x3b3f67, 0.98, 0xd8f1ff, 5, 0.72, this.track.startX + 56, this.track.bottom + 10));
    this.conveyorLayer.add(this.makeRoundRect(158, 50, 18, 0x202641, 0.95, 0x050915, 5, 0.86, this.track.startX + 98, this.track.bottom + 136));

    const ramp = this.add.graphics();
    ramp.fillStyle(0xeef7ff, 0.98);
    ramp.fillRoundedRect(this.track.left - 130, this.track.bottom + 36, 106, 58, 7);
    ramp.lineStyle(3, 0x7c8cac, 0.75);
    ramp.strokeRoundedRect(this.track.left - 130, this.track.bottom + 36, 106, 58, 7);
    for (let line = 0; line < 6; line += 1) {
      ramp.lineStyle(4, 0x9fb0ca, 0.58);
      ramp.lineBetween(this.track.left - 126, this.track.bottom + 44 + line * 8, this.track.left - 28, this.track.bottom + 44 + line * 8);
    }
    this.conveyorLayer.add(ramp);

    const roller = this.add.graphics();
    roller.fillStyle(0x5b66a0, 1);
    roller.fillRoundedRect(this.track.left - 112, this.track.bottom + 88, 92, 54, 16);
    roller.lineStyle(5, 0x050915, 0.9);
    roller.strokeRoundedRect(this.track.left - 112, this.track.bottom + 88, 92, 54, 16);
    for (let line = 0; line < 6; line += 1) {
      roller.lineStyle(4, 0xbecaff, 0.62);
      roller.lineBetween(this.track.left - 96 + line * 13, this.track.bottom + 94, this.track.left - 96 + line * 13, this.track.bottom + 136);
    }
    this.conveyorLayer.add(roller);

    for (let index = 0; index < 4; index += 1) {
      const upPlate = this.makeConveyorPlate(42, 24);
      upPlate.setRotation(-Math.PI / 2);
      this.conveyorLayer.add(upPlate);
      this.transferPlates.push({
        container: upPlate,
        phase: index / 4,
        from: uploadStart,
        to: uploadEnd,
        rotation: -Math.PI / 2,
      });

      const downPlate = this.makeConveyorPlate(42, 24);
      downPlate.setRotation(Math.PI / 2);
      this.conveyorLayer.add(downPlate);
      this.transferPlates.push({
        container: downPlate,
        phase: index / 4,
        from: exitStart,
        to: exitEnd,
        rotation: Math.PI / 2,
      });
    }
  }

  private createConveyorPlates(): void {
    if (!this.conveyorLayer) {
      return;
    }

    const count = Math.ceil(this.track.total / CONVEYOR_PLATE_SPACING);
    for (let index = 0; index < count; index += 1) {
      const plate = this.makeConveyorPlate(62, 30);
      this.conveyorLayer.add(plate);
      this.conveyorPlates.push({ container: plate, offset: index * CONVEYOR_PLATE_SPACING });
    }
  }

  private makeConveyorPlate(width: number, height: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    container.add(this.makeRoundRect(width, height, Math.max(8, height * 0.42), 0xc7d4ff, 0.11, 0x050915, 2, 0.18));
    container.add(this.makeRoundRect(width * 0.72, height * 0.42, Math.max(5, height * 0.2), 0xffffff, 0.08, undefined, 0, 1, -width * 0.04, -height * 0.18));
    const g = this.add.graphics();
    g.lineStyle(Math.max(9, height * 0.4), 0x050915, 0.18);
    g.lineBetween(-width * 0.28, -height * 0.36, width * 0.08, 0.5);
    g.lineBetween(width * 0.08, 0.5, -width * 0.28, height * 0.36);
    g.lineStyle(Math.max(7, height * 0.34), 0xb9c5f2, 0.58);
    g.lineBetween(-width * 0.31, -height * 0.4, width * 0.05, 0);
    g.lineBetween(width * 0.05, 0, -width * 0.31, height * 0.4);
    g.lineStyle(Math.max(2, height * 0.12), 0xf7fbff, 0.38);
    g.lineBetween(-width * 0.25, -height * 0.31, -width * 0.03, 0);
    g.lineBetween(-width * 0.03, 0, -width * 0.25, height * 0.31);
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

    const phaseDelta = (scroll * 0.82) / TRANSFER_PLATE_SPACING;
    this.transferPlates.forEach((plate) => {
      plate.phase = (plate.phase + phaseDelta) % 1;
      plate.container.setPosition(Phaser.Math.Linear(plate.from.x, plate.to.x, plate.phase), Phaser.Math.Linear(plate.from.y, plate.to.y, plate.phase));
      plate.container.setRotation(plate.rotation);
    });

    window.__RPIXEL_CONVEYOR_OFFSET__ = Number(this.conveyorOffset.toFixed(2));
    window.__RPIXEL_CONVEYOR_MARKERS__ = this.conveyorPlates.length;
    window.__RPIXEL_TRACK_SPEED__ = TRACK_SPEED;
    window.__RPIXEL_CONVEYOR_SCROLL_SPEED__ = CONVEYOR_SCROLL_SPEED;
    window.__RPIXEL_CONVEYOR_EFFECTIVE_SCROLL_SPEED__ = CONVEYOR_SCROLL_SPEED * conveyorMultiplier;
    window.__RPIXEL_CONVEYOR_PLATE_SPACING__ = CONVEYOR_PLATE_SPACING;
    window.__RPIXEL_SPEED_TOGGLE_POSITION__ = SPEED_TOGGLE_POSITION;
    window.__RPIXEL_CAPACITY_LABEL_POSITION__ = CAPACITY_LABEL_POSITION;
  }

  private transferUploadStart(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.track.startX + 24, this.track.bottom + 128);
  }

  private transferUploadEnd(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.track.startX + 24, this.track.bottom + 16);
  }

  private transferExitStart(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.track.startX + 86, this.track.bottom + 16);
  }

  private transferExitEnd(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.track.startX + 86, this.track.bottom + 128);
  }

  private drawBoard(): void {
    this.addRoundRect(this.center.x, this.center.y, this.boardWidth + 46, this.boardHeight + 46, 22, 0x202746, 1, 0x0b1024, 8).setDepth(5);
    this.addRoundRect(this.center.x, this.center.y, this.boardWidth + 18, this.boardHeight + 18, 14, 0x151b36, 1, 0xdce7ff, 4, 0.45).setDepth(6);

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
    this.slotChromeLayer.add(this.makeRoundRect(88, 190, 20, 0xdee9ff, 0.8, 0x10162f, 5, 1, 44, this.track.bottom - 54));
    for (let line = 0; line < 8; line += 1) {
      this.slotChromeLayer.add(this.add.rectangle(44, this.track.bottom - 134 + line * 18, 100, 7, 0xffffff, 0.8).setStrokeStyle(1, 0x9aa7c8, 0.6));
    }

    for (let index = 0; index < SLOT_CAPACITY; index += 1) {
      const position = this.slotPosition(index);
      this.slotChromeLayer.add(this.makeRoundRect(162, 158, 28, 0x2e3153, 1, 0x0c1024, 7, 1, position.x, position.y));
      this.slotChromeLayer.add(this.makeRoundRect(136, 132, 22, 0x3a3d62, 1, 0x79839f, 4, 0.7, position.x, position.y));
    }
  }

  private renderReserve(): void {
    if (!this.reserveLayer) {
      return;
    }

    this.reserveLayer.removeAll(true);
    this.reserveLayer.add(this.add.ellipse(540, 1690, 650, 360, 0x050915, 0.18));
    this.reserveLayer.add(this.makeRoundRect(640, 432, 68, 0x151b32, 0.52, 0xffffff, 3, 0.08, 540, 1655));
    this.reserveLayer.add(this.makeRoundRect(606, 398, 58, 0x3b4066, 0.26, 0x050915, 4, 0.28, 540, 1655));
    this.reserveLayer.add(this.makeRoundRect(456, 22, 11, 0xffffff, 0.12, undefined, 0, 1, 520, 1465));

    this.visibleReserveEntries().forEach((entry) => {
      const position = this.reservePosition(entry.index);
      const locked = this.isReserveLocked(entry);
      const token = this.createPigToken(entry.pig, position.x, position.y, 0.9, !locked, () => this.handleReserveClick(entry.index), false, false);
      token.container.setAlpha(locked ? 0.74 : 1);
      this.reserveLayer?.add(token.container);
    });
    this.renderManualLaunchHitZones();
  }

  private drawBoosterBar(): void {
    const layer = this.add.container(0, 0).setDepth(50);
    layer.add(this.add.rectangle(540, 1846, GAME_WIDTH, 160, 0xef3f4a).setStrokeStyle(5, 0xbfd7ff));
    const boosters = [
      { x: 148, type: 'add', count: '17' },
      { x: 392, type: 'tap', count: '44' },
      { x: 636, type: 'refresh', count: '38' },
      { x: 880, type: 'rocket', count: '8' },
    ];
    boosters.forEach((booster) => {
      layer.add(this.add.circle(booster.x, 1780, 72, 0xe83f4b).setStrokeStyle(9, 0xbfd7ff));
      layer.add(this.add.circle(booster.x, 1780, 54, 0xff7d82, 0.48));
      this.drawBoosterIcon(layer, booster.x, 1780, booster.type);
      layer.add(this.add.circle(booster.x + 70, 1852, 34, 0xd72031).setStrokeStyle(6, 0x7b0714));
      layer.add(this.add.text(booster.x + 70, 1827, booster.count, this.textStyle(34)).setOrigin(0.5, 0).setStroke('#06101f', 7));
    });
  }

  private drawBoosterIcon(layer: Phaser.GameObjects.Container, x: number, y: number, type: string): void {
    if (type === 'add') {
      layer.add(this.makeRoundRect(56, 70, 10, 0xffffff, 1, 0x050915, 5, 1, x - 8, y - 4));
      layer.add(this.makeRoundRect(46, 58, 9, 0xf4f7ff, 1, 0x050915, 5, 1, x + 9, y + 4));
      layer.add(this.add.rectangle(x + 9, y + 4, 34, 9, 0xe83f4b).setStrokeStyle(4, 0x050915));
      layer.add(this.add.rectangle(x + 9, y + 4, 9, 34, 0xe83f4b).setStrokeStyle(4, 0x050915));
      return;
    }

    if (type === 'tap') {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.lineStyle(6, 0x050915, 1);
      g.fillRoundedRect(x - 18, y - 48, 34, 92, 17);
      g.strokeRoundedRect(x - 18, y - 48, 34, 92, 17);
      g.fillRoundedRect(x - 2, y - 14, 52, 58, 18);
      g.strokeRoundedRect(x - 2, y - 14, 52, 58, 18);
      g.fillStyle(0xffd6dc, 1);
      g.fillRoundedRect(x - 9, y - 39, 18, 70, 9);
      g.lineStyle(4, 0x050915, 1);
      g.lineBetween(x - 38, y - 48, x - 56, y - 68);
      g.lineBetween(x - 56, y - 18, x - 80, y - 18);
      layer.add(g);
      return;
    }

    if (type === 'refresh') {
      const g = this.add.graphics();
      g.lineStyle(12, 0xffffff, 1);
      g.beginPath();
      g.arc(x - 2, y, 34, Phaser.Math.DegToRad(35), Phaser.Math.DegToRad(215), false);
      g.strokePath();
      g.beginPath();
      g.arc(x + 2, y, 34, Phaser.Math.DegToRad(215), Phaser.Math.DegToRad(395), false);
      g.strokePath();
      g.fillStyle(0xffffff, 1);
      g.lineStyle(5, 0x050915, 1);
      g.fillTriangle(x - 43, y + 4, x - 13, y + 1, x - 27, y + 29);
      g.strokeTriangle(x - 43, y + 4, x - 13, y + 1, x - 27, y + 29);
      g.fillTriangle(x + 43, y - 4, x + 13, y - 1, x + 27, y - 29);
      g.strokeTriangle(x + 43, y - 4, x + 13, y - 1, x + 27, y - 29);
      layer.add(g);
      return;
    }

    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.lineStyle(6, 0x050915, 1);
    g.fillTriangle(x - 42, y + 36, x - 6, y - 46, x + 42, y + 20);
    g.strokeTriangle(x - 42, y + 36, x - 6, y - 46, x + 42, y + 20);
    g.fillStyle(0xe8f3ff, 1);
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
    const [pig] = this.reserveColumns[entry.col].splice(entry.row, 1);
    const launchingPig = { ...pig, mystery: false };
    const token = this.createPigToken(launchingPig, reservePosition.x, reservePosition.y, 0.68, false, undefined, true, false);
    token.container.setDepth(24);

    this.renderReserve();
    this.launchShooter(launchingPig, token.container, token.body, token.ammoText);

    this.updateDebugState();
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
    this.launchShooter(slot.pig, slot.container, slot.body, slot.ammoText);
    this.compactWaitingSlots();
    this.renderManualLaunchHitZones();
    this.updateDebugState();
  }

  private launchShooter(
    pig: Pig,
    container: Phaser.GameObjects.Container,
    body: Phaser.GameObjects.Container,
    ammoText: Phaser.GameObjects.Text,
  ): void {
    const active: ResolvingShooter = {
      pig,
      container,
      body,
      ammoText,
      distance: 0,
      orbiting: false,
      currentSide: 'bottom',
      pendingShots: 0,
      completedLap: false,
    };
    this.resolvingShooters.push(active);
    this.updateDebugState();

    const uploadStart = this.transferUploadStart();
    const uploadEnd = this.transferUploadEnd();

    this.tweens.add({
      targets: active.container,
      x: uploadStart.x,
      y: uploadStart.y,
      scale: 0.72,
      duration: 170,
      ease: 'Sine.easeOut',
      onUpdate: () => this.faceTrackSide(active, 'bottom'),
      onComplete: () => {
        this.tweens.add({
          targets: active.container,
          x: uploadEnd.x,
          y: uploadEnd.y,
          scale: TRACK_SHOOTER_SCALE,
          duration: 150,
          ease: 'Sine.easeInOut',
          onUpdate: () => this.faceTrackSide(active, 'bottom'),
          onComplete: () => {
            active.distance = 0;
            active.container.setPosition(this.track.startX, this.track.bottom);
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
    this.updateAmmoText(active.ammoText, active.pig.ammo);
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
      scale: cell.image.scaleX * 1.25,
      alpha: 0,
      duration: 110,
      ease: 'Back.easeIn',
      onComplete: () => cell.image.destroy(),
    });

    this.checkTreasureUnlock();

    if (this.clearedCells >= this.totalCells) {
      this.time.delayedCall(260, () => this.showResult(true, `LEVEL ${FIRST_LEVEL.id} COMPLETED!`));
    }
  }

  private checkTreasureUnlock(): void {
    if (!this.treasure || this.treasure.unlocked) {
      return;
    }

    const uncovered = [-1, 0, 1].every((rowOffset) =>
      [-1, 0, 1].every((colOffset) => {
        if (rowOffset === 0 && colOffset === 0) {
          return true;
        }
        const cell = this.cells[this.treasure!.row + rowOffset]?.[this.treasure!.col + colOffset] ?? null;
        return cell === null || cell.cleared;
      }),
    );

    if (!uncovered) {
      return;
    }

    this.treasure.unlocked = true;
    this.tweens.add({ targets: this.treasure.container, alpha: 1, scale: this.treasure.container.scaleX * 1.26, duration: 220, yoyo: true, ease: 'Back.easeOut' });
    for (let index = 0; index < 14; index += 1) {
      const sparkle = this.add.star(this.treasure.container.x, this.treasure.container.y, 5, 8, 20, 0xfff1a6, 0.95).setDepth(32);
      this.tweens.add({
        targets: sparkle,
        x: sparkle.x + Phaser.Math.Between(-120, 120),
        y: sparkle.y + Phaser.Math.Between(-120, 120),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(360, 620),
        ease: 'Quad.easeOut',
        onComplete: () => sparkle.destroy(),
      });
    }
    this.time.delayedCall(260, () => this.animateCoinsFrom(this.treasure?.container.x ?? this.center.x, this.treasure?.container.y ?? this.center.y, 40));
    this.updateDebugState();
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
    this.tweens.add({
      targets: active.container,
      scale: 0.15,
      alpha: 0,
      duration: 190,
      ease: 'Back.easeIn',
      onComplete: () => active.container.destroy(),
    });
    this.updateDebugState();
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
      ammoText: active.ammoText,
    };
    this.slots[slotIndex] = slot;
    this.renderManualLaunchHitZones();

    const exitStart = this.transferExitStart();
    const exitEnd = this.transferExitEnd();
    this.tweens.add({
      targets: active.container,
      x: exitStart.x,
      y: exitStart.y,
      scale: 0.72,
      duration: 90,
      ease: 'Quad.easeOut',
      onUpdate: () => this.faceTrackSide(active, 'bottom'),
      onComplete: () => {
        this.tweens.add({
          targets: active.container,
          x: exitEnd.x,
          y: exitEnd.y,
          scale: 0.72,
          duration: 140,
          ease: 'Sine.easeInOut',
          onUpdate: () => this.faceTrackSide(active, 'bottom'),
          onComplete: () => {
            this.tweenEnteringSlotToAssignedPosition(slot, active, 220);
          },
        });
      },
    });

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
      this.tweens.killTweensOf(slot.container);
      this.tweens.add({
        targets: slot.container,
        x: position.x,
        y: position.y,
        duration: 150,
        ease: 'Quad.easeOut',
      });
    });
    this.renderManualLaunchHitZones();
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
        const position = this.slotPosition(slot.slotIndex);
        slot.container.setPosition(Phaser.Math.Linear(startX, position.x, progress), Phaser.Math.Linear(startY, position.y, progress));
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
    showBarrel = false,
    mystery = false,
  ): { container: Phaser.GameObjects.Container; body: Phaser.GameObjects.Container; ammoText: Phaser.GameObjects.Text } {
    const container = this.add.container(x, y).setScale(scale);
    const shadow = this.add.ellipse(10, 30, 166, 66, 0x050915, 0.42);
    const body = this.add.container(0, 0);
    const barrel = this.add.rectangle(0, -84, 30, 68, 0x242a3d).setStrokeStyle(5, 0x050915);
    const barrelTip = this.add.circle(0, -120, 18, 0x5c6684).setStrokeStyle(5, 0x050915);
    barrel.setVisible(showBarrel);
    barrelTip.setVisible(showBarrel);

    const image = mystery ? this.makeMysteryToken() : this.add.image(0, 0, `shooter-${pig.color}`);
    body.add([barrel, barrelTip, image]);
    const ammoFontSize = mystery ? 42 : this.ammoFontSize(pig.ammo);
    const badgeBack = this.makeRoundRect(74, 44, 17, 0x050915, 0.25, undefined, 0, 1, 4, 4);
    const badge = this.makeRoundRect(68, 40, 16, 0x11192e, 0.78, 0xfff1a6, 4, 0.76, 0, -2);
    const badgeInner = this.makeRoundRect(52, 26, 12, 0xffffff, 0.12, 0xffffff, 2, 0.2, 0, -2);
    const badgeGloss = this.makeRoundRect(36, 7, 4, 0xffffff, 0.25, undefined, 0, 1, -5, -16);
    const ammoText = this.add.text(0, -3, mystery ? '?' : String(pig.ammo), this.textStyle(ammoFontSize)).setOrigin(0.5, 0.5).setStroke('#06101f', 4);
    ammoText.setResolution(3);
    ammoText.setShadow(0, 3, '#050915', 4, false, true);
    ammoText.setVisible(!mystery);
    badgeBack.setVisible(!mystery);
    badge.setVisible(!mystery);
    badgeInner.setVisible(!mystery);
    badgeGloss.setVisible(!mystery);
    container.add([shadow, body, badgeBack, badge, badgeInner, badgeGloss, ammoText]);

    if (interactive && onClick) {
      this.bindPigTokenClick(container, scale, onClick);
    }

    return { container, body, ammoText };
  }

  private ammoFontSize(ammo: number): number {
    if (ammo >= 100) {
      return 18;
    }
    if (ammo >= 10) {
      return 22;
    }
    return 24;
  }

  private updateAmmoText(ammoText: Phaser.GameObjects.Text, ammo: number): void {
    ammoText.setText(String(ammo));
    ammoText.setFontSize(this.ammoFontSize(ammo));
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

  private makeMysteryToken(): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    container.add(this.add.ellipse(6, 36, 118, 34, 0x050915, 0.28));
    container.add(this.makeRoundRect(126, 112, 30, 0x4d5dd9, 1, 0x050915, 7));
    container.add(this.makeRoundRect(88, 28, 14, 0xaab5ff, 0.35, undefined, 0, 1, -12, -31));
    container.add(this.add.text(0, -50, '?', this.textStyle(78)).setOrigin(0.5, 0).setStroke('#06101f', 11));
    return container;
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
    const startX = left;
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
    window.__RPIXEL_CAPACITY_LABEL__ = activeCapacityLabel;
    window.__RPIXEL_ACTIVE_PIGS__ = this.resolvingShooters.length;
    window.__RPIXEL_BLOCKS_LEFT__ = this.totalCells - this.clearedCells;
    window.__RPIXEL_SLOTS_FILLED__ = this.slots.filter(Boolean).length;
    window.__RPIXEL_STUCK_SLOTS__ = this.slots.filter((slot) => slot?.status === 'stuck').length;
    window.__RPIXEL_RESERVE_LEFT__ = this.reserveCount();
    const visibleReserve = this.visibleReserveEntries();
    window.__RPIXEL_LOCKED_RESERVE__ = visibleReserve.filter((entry) => this.isReserveLocked(entry)).length;
    window.__RPIXEL_TREASURE_UNLOCKED__ = Boolean(this.treasure?.unlocked);
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
}
