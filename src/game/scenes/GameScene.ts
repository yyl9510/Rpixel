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
const FIRE_COOLDOWN_MS = 32;

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

interface SlotShooter {
  slotIndex: number;
  status: SlotStatus;
  pig: Pig;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  ammoText: Phaser.GameObjects.Text;
}

interface ResolvingShooter {
  pig: Pig;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  ammoText: Phaser.GameObjects.Text;
  distance: number;
  orbiting: boolean;
  fireCooldownMs: number;
  targetKey?: string;
}

export class GameScene extends Phaser.Scene {
  private cells: Array<Array<BoardCell | null>> = [];
  private slots: Array<SlotShooter | null> = [];
  private reserve: Pig[] = [];
  private resolvingShooters: ResolvingShooter[] = [];
  private reservedTargetKeys = new Set<string>();
  private slotChromeLayer?: Phaser.GameObjects.Container;
  private reserveLayer?: Phaser.GameObjects.Container;
  private blocksLeftText?: Phaser.GameObjects.Text;
  private coinText?: Phaser.GameObjects.Text;
  private progressFill?: Phaser.GameObjects.Graphics;
  private treasure?: TreasureState;
  private coins = 10100;
  private totalCells = 0;
  private clearedCells = 0;
  private gameOver = false;
  private evaluationQueued = false;

  private readonly rows = FIRST_LEVEL.grid.length;
  private readonly cols = Math.max(...FIRST_LEVEL.grid.map((row) => row.length));
  private readonly cellSize = Math.floor(Math.min(BOARD_BOX_WIDTH / this.cols, BOARD_BOX_HEIGHT / this.rows));
  private readonly boardWidth = this.cellSize * this.cols;
  private readonly boardHeight = this.cellSize * this.rows;
  private readonly boardX = (GAME_WIDTH - this.boardWidth) / 2;
  private readonly boardY = BOARD_TOP + (BOARD_BOX_HEIGHT - this.boardHeight) / 2;
  private readonly center = { x: GAME_WIDTH / 2, y: BOARD_TOP + BOARD_BOX_HEIGHT / 2 };
  private readonly track: TrackMetrics = this.createTrackMetrics();

  constructor() {
    super('GameScene');
  }

  create(): void {
    window.__RPIXEL_SCENE__ = 'game';
    this.gameOver = false;
    this.evaluationQueued = false;
    this.resolvingShooters = [];
    this.reservedTargetKeys.clear();
    this.treasure = undefined;
    this.coins = 10100;
    this.clearedCells = 0;
    this.slots = Array.from({ length: SLOT_CAPACITY }, () => null);
    this.reserve = FIRST_LEVEL.pigs.map((pig) => ({ ...pig }));
    this.totalCells = FIRST_LEVEL.grid.flat().filter((color) => color !== null).length;

    this.drawBackground();
    this.drawHud();
    this.drawTrack();
    this.drawBoard();
    this.drawTreasure();
    this.drawSlotChrome();

    this.reserveLayer = this.add.container(0, 0).setDepth(12);
    this.renderReserve();
    this.drawBoosterBar();
    this.updateDebugState();
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) {
      return;
    }

    [...this.resolvingShooters].forEach((active) => this.updateResolvingShooter(active, delta));
    this.publishActiveShooterDebug();
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    const top = Phaser.Display.Color.ValueToColor(0x3d3d62);
    const bottom = Phaser.Display.Color.ValueToColor(0x323352);

    for (let y = 0; y < GAME_HEIGHT; y += 12) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, GAME_HEIGHT, y);
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      graphics.fillRect(0, y, GAME_WIDTH, 12);
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

    this.progressFill = this.add.graphics().setDepth(4);
    this.blocksLeftText = this.add.text(540, 134, '', this.textStyle(18)).setOrigin(0.5, 0).setAlpha(0);
    this.updateProgressText();
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
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x4a4b76, 1);
    g.fillRoundedRect(this.track.left, this.track.top, width, height, 86);
    g.lineStyle(10, 0x10162f, 0.95);
    g.strokeRoundedRect(this.track.left, this.track.top, width, height, 86);
    g.lineStyle(12, 0xbfd7ff, 0.78);
    g.strokeRoundedRect(this.track.left + 10, this.track.top + 10, width - 20, height - 20, 76);
    g.lineStyle(5, 0xffffff, 0.72);
    g.strokeRoundedRect(this.track.left + 22, this.track.top + 22, width - 44, height - 44, 62);
    this.drawTrackArrows();
  }

  private drawTrackArrows(): void {
    const g = this.add.graphics().setDepth(4);
    const drawArrow = (x: number, y: number, rotation: number): void => {
      const points = [
        new Phaser.Math.Vector2(24, 0).rotate(rotation).add(new Phaser.Math.Vector2(x, y)),
        new Phaser.Math.Vector2(-18, -17).rotate(rotation).add(new Phaser.Math.Vector2(x, y)),
        new Phaser.Math.Vector2(-18, 17).rotate(rotation).add(new Phaser.Math.Vector2(x, y)),
      ].map((point) => new Phaser.Geom.Point(point.x, point.y));

      g.fillStyle(0xc7d2ff, 0.22);
      g.fillPoints(points, true);
      g.lineStyle(4, 0xdce7ff, 0.16);
      g.strokePoints(points, true);
    };

    const horizontalInset = 150;
    const verticalInset = 150;
    for (let index = 0; index < 4; index += 1) {
      const t = index / 3;
      drawArrow(Phaser.Math.Linear(this.track.startX - 48, this.track.right - horizontalInset, t), this.track.bottom, 0);
      drawArrow(this.track.right, Phaser.Math.Linear(this.track.bottom - verticalInset, this.track.top + verticalInset, t), -Math.PI / 2);
      drawArrow(Phaser.Math.Linear(this.track.right - horizontalInset, this.track.left + horizontalInset, t), this.track.top, Math.PI);
      drawArrow(this.track.left, Phaser.Math.Linear(this.track.top + verticalInset, this.track.bottom - verticalInset, t), Math.PI / 2);
    }
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
    this.slotChromeLayer.add(this.add.text(58, this.track.bottom + 30, '5/5', this.textStyle(48)).setOrigin(0.5, 0).setStroke('#050915', 10));

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
    this.reserveLayer.add(this.makeRoundRect(620, 430, 68, 0x2f3151, 0.32, undefined, 0, 1, 540, 1655));

    const visible = this.reserve.slice(0, RESERVE_VISIBLE);
    visible.forEach((pig, index) => {
      const position = this.reservePosition(index);
      const locked = this.isReserveLocked(pig, index);
      const token = this.createPigToken(pig, position.x, position.y, 0.74, !locked, () => this.handleReserveClick(index), false, locked);
      token.container.setAlpha(locked ? 0.74 : 1);
      this.reserveLayer?.add(token.container);
    });
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
    if (this.gameOver || reserveIndex >= this.reserve.length) {
      return;
    }

    const candidate = this.reserve[reserveIndex];
    if (!candidate || this.isReserveLocked(candidate, reserveIndex)) {
      return;
    }

    const slotIndex = this.slots.findIndex((slot) => slot === null);
    if (slotIndex === -1) {
      if (this.resolvingShooters.length === 0 && this.slots.every((slot) => slot?.status === 'stuck')) {
        if (this.hasActivatableStuckSlot()) {
          this.evaluateSlots();
          return;
        }
        this.showResult(false, 'SLOTS FULL');
      }
      return;
    }

    const reservePosition = this.reservePosition(reserveIndex);
    const [pig] = this.reserve.splice(reserveIndex, 1);
    const slottedPig = { ...pig, mystery: false };
    const token = this.createPigToken(slottedPig, reservePosition.x, reservePosition.y, 0.58, false, undefined, true, false);
    token.container.setDepth(24);

    const slot: SlotShooter = {
      slotIndex,
      status: 'entering',
      pig: slottedPig,
      container: token.container,
      body: token.body,
      ammoText: token.ammoText,
    };
    this.slots[slotIndex] = slot;

    this.renderReserve();
    const slotPosition = this.slotPosition(slotIndex);
    this.tweens.add({
      targets: token.container,
      x: slotPosition.x,
      y: slotPosition.y,
      scale: 0.72,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (this.gameOver) {
          return;
        }
        slot.status = 'stuck';
        this.updateDebugState();
        this.evaluateSlots();
      },
    });

    this.updateDebugState();
  }

  private isReserveLocked(pig: Pig, reserveIndex: number): boolean {
    return Boolean(pig.mystery) && reserveIndex >= RESERVE_COLS;
  }

  private evaluateSlots(): void {
    if (this.gameOver) {
      return;
    }

    this.evaluationQueued = false;
    let activated = false;
    for (const slot of this.slots) {
      if (this.resolvingShooters.length >= SLOT_CAPACITY) {
        break;
      }

      if (!slot || slot.status !== 'stuck' || slot.pig.ammo <= 0) {
        continue;
      }

      const target = this.findEdgeTarget(slot.pig.color);
      if (target) {
        this.activateSlot(slot, target);
        activated = true;
      }
    }

    if (!activated) {
      this.updateDebugState();
    }
  }

  private hasActivatableStuckSlot(): boolean {
    return this.slots.some((slot) => slot?.status === 'stuck' && slot.pig.ammo > 0 && Boolean(this.findEdgeTarget(slot.pig.color)));
  }

  private queueEvaluation(delay = 110): void {
    if (this.evaluationQueued || this.gameOver) {
      return;
    }

    this.evaluationQueued = true;
    this.time.delayedCall(delay, () => this.evaluateSlots());
  }

  private activateSlot(slot: SlotShooter, target: EdgeTarget): void {
    slot.status = 'activating';
    this.slots[slot.slotIndex] = null;
    const active: ResolvingShooter = {
      pig: slot.pig,
      container: slot.container,
      body: slot.body,
      ammoText: slot.ammoText,
      distance: 0,
      orbiting: false,
      fireCooldownMs: 0,
    };
    this.resolvingShooters.push(active);
    this.updateDebugState();

    this.tweens.add({
      targets: active.container,
      x: this.track.startX,
      y: this.track.bottom,
      scale: 0.7,
      duration: 230,
      ease: 'Quad.easeOut',
      onUpdate: () => this.faceCenter(active),
      onComplete: () => {
        active.distance = 0;
        active.orbiting = true;
        active.fireCooldownMs = 0;
        this.faceCenter(active);
      },
    });
  }

  private updateResolvingShooter(active: ResolvingShooter, delta: number): void {
    if (!active.orbiting || !this.isResolvingActive(active)) {
      return;
    }

    active.distance = (active.distance + (TRACK_SPEED * delta) / 1000) % this.track.total;
    const position = this.positionOnTrack(active.distance);
    active.container.setPosition(position.x, position.y);
    this.faceCenter(active);
    active.fireCooldownMs = Math.max(0, active.fireCooldownMs - delta);

    if (active.pig.ammo <= 0 || !this.hasRemainingColor(active.pig.color)) {
      this.finishResolvingShooter(active);
      return;
    }

    if (active.fireCooldownMs > 0) {
      return;
    }

    const target = this.findForwardTarget(active, position);
    if (!target) {
      return;
    }

    active.fireCooldownMs = FIRE_COOLDOWN_MS;
    this.reserveTarget(active, target);
    this.fireProjectile(active, target, () => {
      if (!this.gameOver && this.isResolvingActive(active) && (active.pig.ammo <= 0 || !this.hasRemainingColor(active.pig.color))) {
        this.finishResolvingShooter(active);
      }
    });
  }

  private findForwardTarget(active: ResolvingShooter, position: TrackPosition): BoardCell | null {
    const lineIndex = this.lineIndexForTrackPosition(position);
    if (lineIndex === null) {
      return null;
    }

    return this.findVisibleTarget(position.side, lineIndex, active.pig.color, active.targetKey);
  }

  private lineIndexForTrackPosition(position: TrackPosition): number | null {
    if (position.side === 'bottom' || position.side === 'top') {
      if (position.x < this.boardX || position.x >= this.boardX + this.boardWidth) {
        return null;
      }
      return Phaser.Math.Clamp(Math.floor((position.x - this.boardX) / this.cellSize), 0, this.cols - 1);
    }

    if (position.y < this.boardY || position.y >= this.boardY + this.boardHeight) {
      return null;
    }
    return Phaser.Math.Clamp(Math.floor((position.y - this.boardY) / this.cellSize), 0, this.rows - 1);
  }

  private hasRemainingColor(color: PigColor): boolean {
    return this.cells.some((row) => row.some((cell) => Boolean(cell && !cell.cleared && cell.color === color)));
  }

  private fireProjectile(active: ResolvingShooter, target: BoardCell, onComplete: () => void): void {
    this.releaseReservedTarget(active);
    target.pending = true;
    active.pig.ammo -= 1;
    active.ammoText.setText(String(active.pig.ammo));

    const style = COLOR_STYLES[active.pig.color];
    const beam = this.add.graphics().setDepth(22);
    beam.lineStyle(26, 0xffffff, 0.2);
    beam.lineBetween(active.container.x, active.container.y, target.image.x, target.image.y);
    beam.lineStyle(15, style.light, 0.78);
    beam.lineBetween(active.container.x, active.container.y, target.image.x, target.image.y);
    beam.lineStyle(7, 0xffffff, 0.9);
    beam.lineBetween(active.container.x, active.container.y, target.image.x, target.image.y);

    const projectile = this.add.circle(active.container.x, active.container.y, 18, style.base).setStrokeStyle(5, 0xffffff, 0.95).setDepth(23);
    this.tweens.add({ targets: target.image, scale: target.image.scaleX * 1.14, duration: 75, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: beam, alpha: 0, duration: 220, onComplete: () => beam.destroy() });
    this.tweens.add({
      targets: projectile,
      x: target.image.x,
      y: target.image.y,
      duration: 58,
      ease: 'Quad.easeOut',
      onComplete: () => {
        projectile.destroy();
        this.clearCell(target);
        onComplete();
      },
    });
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
    this.cameras.main.shake(70, 0.0012);
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
    this.queueEvaluation(30);

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
    this.queueEvaluation(210);
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
      if (!cell || cell.cleared || cell.pending) {
        continue;
      }

      const key = this.cellKey(cell);
      if (this.reservedTargetKeys.has(key) && key !== allowedReservedKey) {
        continue;
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
    panel.add(this.add.text(0, -74, 'All 5 slots are blocked', this.textStyle(34)).setOrigin(0.5, 0).setStroke('#06101f', 8));
    panel.add(this.add.text(0, -24, 'No exposed matching color can move.', this.textStyle(27)).setOrigin(0.5, 0).setStroke('#06101f', 7));
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
    const shadow = this.add.ellipse(8, 18, 132, 58, 0x050915, 0.25);
    const body = this.add.container(0, 0);
    const barrel = this.add.rectangle(0, -84, 30, 68, 0x242a3d).setStrokeStyle(5, 0x050915);
    const barrelTip = this.add.circle(0, -120, 18, 0x5c6684).setStrokeStyle(5, 0x050915);
    barrel.setVisible(showBarrel);
    barrelTip.setVisible(showBarrel);

    const image = mystery ? this.makeMysteryToken() : this.add.image(0, 0, `shooter-${pig.color}`);
    body.add([barrel, barrelTip, image]);
    const ammoText = this.add.text(0, -49, mystery ? '?' : String(pig.ammo), this.textStyle(mystery ? 54 : 60)).setOrigin(0.5, 0).setStroke('#06101f', 10);
    ammoText.setVisible(!mystery);
    container.add([shadow, body, ammoText]);

    if (interactive) {
      const zone = this.add.zone(0, 0, 158, 158).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.tweens.add({ targets: container, scale: scale * 0.9, duration: 65, yoyo: true });
        onClick?.();
      });
      container.add(zone);
    }

    return { container, body, ammoText };
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
    const startX = GAME_WIDTH / 2;
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

  private reservePosition(index: number): { x: number; y: number } {
    const col = index % RESERVE_COLS;
    const row = Math.floor(index / RESERVE_COLS);
    return { x: 320 + col * 220, y: 1538 + row * 148 };
  }

  private faceCenter(active: ResolvingShooter): void {
    active.body.setRotation(Phaser.Math.Angle.Between(active.container.x, active.container.y, this.center.x, this.center.y) + Math.PI / 2);
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
    window.__RPIXEL_ACTIVE_PIGS__ = this.resolvingShooters.length;
    window.__RPIXEL_BLOCKS_LEFT__ = this.totalCells - this.clearedCells;
    window.__RPIXEL_SLOTS_FILLED__ = this.slots.filter(Boolean).length;
    window.__RPIXEL_STUCK_SLOTS__ = this.slots.filter((slot) => slot?.status === 'stuck').length;
    window.__RPIXEL_RESERVE_LEFT__ = this.reserve.length;
    window.__RPIXEL_LOCKED_RESERVE__ = this.reserve.slice(0, RESERVE_VISIBLE).filter((pig, index) => this.isReserveLocked(pig, index)).length;
    window.__RPIXEL_TREASURE_UNLOCKED__ = Boolean(this.treasure?.unlocked);
    window.__RPIXEL_COINS__ = this.coins;
    window.__RPIXEL_BOARD_COLOR_COUNTS__ = this.countInitialBoardColors();
    window.__RPIXEL_AMMO_COLOR_TOTALS__ = this.countInitialAmmoTotals();
    window.__RPIXEL_VISIBLE_RESERVE__ = this.reserve.slice(0, RESERVE_VISIBLE).map((pig, index) => {
      const position = this.reservePosition(index);
      return { index, color: pig.color, locked: this.isReserveLocked(pig, index), x: position.x, y: position.y };
    });
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
