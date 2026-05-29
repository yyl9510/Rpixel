import Phaser from 'phaser';
import { COLOR_STYLES } from '../assets';
import { FIRST_LEVEL } from '../data/levels';
import type { Pig, PigColor } from '../types';

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;
const SLOT_CAPACITY = 5;
const BOARD_BOX_SIZE = 660;
const BOARD_Y = 350;
const TRACK_PAD = 92;
const SLOT_Y = 1238;
const RESERVE_VISIBLE = 14;
const RESERVE_COLS = 7;

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
  ammoText: Phaser.GameObjects.Text;
}

interface ResolvingShooter {
  pig: Pig;
  container: Phaser.GameObjects.Container;
  ammoText: Phaser.GameObjects.Text;
  distance: number;
}

export class GameScene extends Phaser.Scene {
  private cells: Array<Array<BoardCell | null>> = [];
  private slots: Array<SlotShooter | null> = [];
  private reserve: Pig[] = [];
  private resolvingShooter: ResolvingShooter | null = null;
  private slotChromeLayer?: Phaser.GameObjects.Container;
  private reserveLayer?: Phaser.GameObjects.Container;
  private blocksLeftText?: Phaser.GameObjects.Text;
  private totalCells = 0;
  private clearedCells = 0;
  private gameOver = false;
  private evaluationQueued = false;

  private readonly rows = FIRST_LEVEL.grid.length;
  private readonly cols = Math.max(...FIRST_LEVEL.grid.map((row) => row.length));
  private readonly cellSize = Math.floor(Math.min(BOARD_BOX_SIZE / this.cols, BOARD_BOX_SIZE / this.rows));
  private readonly boardWidth = this.cellSize * this.cols;
  private readonly boardHeight = this.cellSize * this.rows;
  private readonly boardX = (GAME_WIDTH - this.boardWidth) / 2;
  private readonly boardY = BOARD_Y + (BOARD_BOX_SIZE - this.boardHeight) / 2;
  private readonly center = { x: GAME_WIDTH / 2, y: BOARD_Y + BOARD_BOX_SIZE / 2 };
  private readonly track: TrackMetrics = this.createTrackMetrics();

  constructor() {
    super('GameScene');
  }

  create(): void {
    window.__RPIXEL_SCENE__ = 'game';
    this.gameOver = false;
    this.evaluationQueued = false;
    this.resolvingShooter = null;
    this.clearedCells = 0;
    this.slots = Array.from({ length: SLOT_CAPACITY }, () => null);
    this.reserve = FIRST_LEVEL.pigs.map((pig) => ({ ...pig }));
    this.totalCells = FIRST_LEVEL.grid.flat().filter((color) => color !== null).length;

    this.drawBackground();
    this.drawHud();
    this.drawTrack();
    this.drawBoard();
    this.drawSlotChrome();

    this.reserveLayer = this.add.container(0, 0).setDepth(12);
    this.renderReserve();
    this.updateDebugState();
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    const top = Phaser.Display.Color.ValueToColor(0x0739dd);
    const bottom = Phaser.Display.Color.ValueToColor(0x12cdf3);

    for (let y = 0; y < GAME_HEIGHT; y += 12) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, GAME_HEIGHT, y);
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      graphics.fillRect(0, y, GAME_WIDTH, 12);
    }

    graphics.lineStyle(7, 0xffffff, 0.14);
    for (let i = 0; i < 18; i += 1) {
      const x = 80 + ((i * 247) % 920);
      const y = 250 + i * 96;
      if (i % 2 === 0) {
        graphics.strokeCircle(x, y, 48);
        graphics.strokeCircle(x - 16, y - 7, 8);
        graphics.strokeCircle(x + 18, y - 7, 8);
      } else {
        graphics.strokeRoundedRect(x - 42, y - 34, 84, 68, 16);
      }
    }
  }

  private drawHud(): void {
    this.addRoundRect(540, 86, 318, 74, 20, 0x0b1534, 0.62, 0x050915, 5);
    this.add.text(540, 51, `Level ${FIRST_LEVEL.id}`, this.textStyle(40)).setOrigin(0.5, 0).setStroke('#06101f', 8);

    this.addRoundRect(78, 84, 94, 70, 18, 0xffc83d, 1, 0x050915, 5);
    this.add.text(50, 50, '<', this.textStyle(46)).setStroke('#06101f', 8);
    this.add.zone(78, 84, 110, 92).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('MenuScene'));

    this.addRoundRect(978, 84, 128, 70, 18, 0x39c66a, 1, 0x050915, 5);
    this.add.text(935, 54, 'Retry', this.textStyle(32)).setStroke('#06101f', 7);
    this.add.zone(978, 84, 148, 92).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.restart());

    this.blocksLeftText = this.add.text(540, 283, '', this.textStyle(36)).setOrigin(0.5, 0).setStroke('#06101f', 8).setDepth(18);
    this.updateProgressText();
  }

  private drawTrack(): void {
    const width = this.track.right - this.track.left;
    const height = this.track.bottom - this.track.top;
    const g = this.add.graphics();
    g.lineStyle(24, 0x051122, 0.5);
    g.strokeRoundedRect(this.track.left, this.track.top, width, height, 38);
    g.lineStyle(13, 0xffc51e, 1);
    g.strokeRoundedRect(this.track.left, this.track.top, width, height, 38);
    g.lineStyle(4, 0xfff19a, 0.9);
    g.strokeRoundedRect(this.track.left + 7, this.track.top + 7, width - 14, height - 14, 30);
  }

  private drawBoard(): void {
    this.addRoundRect(this.center.x, this.center.y, BOARD_BOX_SIZE + 48, BOARD_BOX_SIZE + 48, 28, 0xf1fbff, 0.72, 0x050915, 8);
    this.addRoundRect(this.center.x, this.center.y, BOARD_BOX_SIZE + 12, BOARD_BOX_SIZE + 12, 18, 0x1241a5, 0.18, 0xffffff, 4, 0.55);

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
        image.setScale((this.cellSize * 0.9) / 112);

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
    this.slotChromeLayer.add(this.add.text(540, SLOT_Y - 134, 'Active Slots', this.textStyle(34)).setOrigin(0.5, 0).setStroke('#06101f', 7));

    for (let index = 0; index < SLOT_CAPACITY; index += 1) {
      const position = this.slotPosition(index);
      this.slotChromeLayer.add(this.makeRoundRect(158, 166, 28, 0x0b1534, 0.5, 0xffffff, 5, 0.35, position.x, position.y));
    }
  }

  private renderReserve(): void {
    if (!this.reserveLayer) {
      return;
    }

    this.reserveLayer.removeAll(true);
    this.reserveLayer.add(this.makeRoundRect(940, 366, 34, 0x0b1534, 0.5, 0x050915, 6, 1, 540, 1620));
    this.reserveLayer.add(this.add.text(540, 1420, 'Reserve Pool', this.textStyle(34)).setOrigin(0.5, 0).setStroke('#06101f', 7));

    const visible = this.reserve.slice(0, RESERVE_VISIBLE);
    visible.forEach((pig, index) => {
      const position = this.reservePosition(index);
      const token = this.createPigToken(pig, position.x, position.y, 0.5, true, () => this.handleReserveClick(index), false, Boolean(pig.mystery));
      this.reserveLayer?.add(token.container);
    });

    this.reserveLayer.add(this.add.text(540, 1810, `${this.reserve.length} shooters`, this.textStyle(30)).setOrigin(0.5, 0).setStroke('#06101f', 7));
  }

  private handleReserveClick(reserveIndex: number): void {
    if (this.gameOver || reserveIndex >= this.reserve.length) {
      return;
    }

    const slotIndex = this.slots.findIndex((slot) => slot === null);
    if (slotIndex === -1) {
      this.showResult(false, 'NO MOVES');
      return;
    }

    const reservePosition = this.reservePosition(reserveIndex);
    const [pig] = this.reserve.splice(reserveIndex, 1);
    const slottedPig = { ...pig, mystery: false };
    const token = this.createPigToken(slottedPig, reservePosition.x, reservePosition.y, 0.58, false, undefined, false, false);
    token.container.setDepth(24);

    const slot: SlotShooter = {
      slotIndex,
      status: 'entering',
      pig: slottedPig,
      container: token.container,
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

  private evaluateSlots(): void {
    if (this.gameOver || this.resolvingShooter) {
      return;
    }

    this.evaluationQueued = false;
    for (const slot of this.slots) {
      if (!slot || slot.status !== 'stuck' || slot.pig.ammo <= 0) {
        continue;
      }

      const target = this.findEdgeTarget(slot.pig.color);
      if (target) {
        this.activateSlot(slot, target);
        return;
      }
    }

    this.updateDebugState();
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
      ammoText: slot.ammoText,
      distance: 0,
    };
    this.resolvingShooter = active;
    this.updateDebugState();

    this.tweens.add({
      targets: active.container,
      x: this.track.startX,
      y: this.track.bottom,
      scale: 0.7,
      duration: 230,
      ease: 'Quad.easeOut',
      onUpdate: () => this.faceCenter(active.container),
      onComplete: () => {
        active.distance = 0;
        this.moveResolvingToTarget(active, target);
      },
    });
  }

  private moveResolvingToTarget(active: ResolvingShooter, target: EdgeTarget): void {
    if (this.gameOver || this.resolvingShooter !== active) {
      return;
    }

    const travel = (target.distance - active.distance + this.track.total) % this.track.total;
    const state = { value: 0 };
    this.tweens.add({
      targets: state,
      value: travel,
      duration: Math.max(180, travel * 0.62),
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const distance = (active.distance + state.value) % this.track.total;
        const position = this.positionOnTrack(distance);
        active.container.setPosition(position.x, position.y);
        this.faceCenter(active.container);
      },
      onComplete: () => {
        active.distance = target.distance;
        const position = this.positionOnTrack(active.distance);
        active.container.setPosition(position.x, position.y);
        this.faceCenter(active.container);
        this.shootCurrentLine(active, target);
      },
    });
  }

  private shootCurrentLine(active: ResolvingShooter, target: EdgeTarget): void {
    if (this.gameOver || this.resolvingShooter !== active) {
      return;
    }

    if (active.pig.ammo <= 0) {
      this.finishResolvingShooter(active);
      return;
    }

    const visibleTarget = this.findVisibleTarget(target.side, target.lineIndex, active.pig.color);
    if (!visibleTarget) {
      this.seekNextTarget(active);
      return;
    }

    this.fireProjectile(active, visibleTarget, () => {
      if (this.gameOver) {
        return;
      }

      if (active.pig.ammo <= 0) {
        this.finishResolvingShooter(active);
        return;
      }

      this.time.delayedCall(70, () => this.shootCurrentLine(active, target));
    });
  }

  private seekNextTarget(active: ResolvingShooter): void {
    const nextTarget = this.findEdgeTarget(active.pig.color);
    if (!nextTarget || active.pig.ammo <= 0) {
      this.finishResolvingShooter(active);
      return;
    }

    this.moveResolvingToTarget(active, nextTarget);
  }

  private fireProjectile(active: ResolvingShooter, target: BoardCell, onComplete: () => void): void {
    target.pending = true;
    active.pig.ammo -= 1;
    active.ammoText.setText(String(active.pig.ammo));

    const style = COLOR_STYLES[active.pig.color];
    const beam = this.add.graphics().setDepth(22);
    beam.lineStyle(14, style.light, 0.65);
    beam.lineBetween(active.container.x, active.container.y, target.image.x, target.image.y);

    const projectile = this.add.circle(active.container.x, active.container.y, 18, style.base).setStrokeStyle(5, 0xffffff, 0.95).setDepth(23);
    this.tweens.add({ targets: beam, alpha: 0, duration: 180, onComplete: () => beam.destroy() });
    this.tweens.add({
      targets: projectile,
      x: target.image.x,
      y: target.image.y,
      duration: 145,
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
    this.clearedCells += 1;
    this.updateProgressText();
    this.updateDebugState();

    const style = COLOR_STYLES[cell.color];
    for (let index = 0; index < 12; index += 1) {
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

    this.tweens.add({
      targets: cell.image,
      scale: cell.image.scaleX * 1.25,
      alpha: 0,
      duration: 180,
      ease: 'Back.easeIn',
      onComplete: () => cell.image.destroy(),
    });

    if (this.clearedCells >= this.totalCells) {
      this.time.delayedCall(260, () => this.showResult(true, `LEVEL ${FIRST_LEVEL.id} COMPLETED!`));
    }
  }

  private finishResolvingShooter(active: ResolvingShooter): void {
    if (this.resolvingShooter !== active) {
      return;
    }

    this.resolvingShooter = null;
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

  private findVisibleTarget(side: Side, lineIndex: number, color: PigColor): BoardCell | null {
    const cell = this.findVisibleCell(side, lineIndex);
    return cell?.color === color ? cell : null;
  }

  private findVisibleCell(side: Side, lineIndex: number): BoardCell | null {
    for (const [row, col] of this.scanSequence(side, lineIndex)) {
      const cell = this.cells[row]?.[col] ?? null;
      if (cell && !cell.cleared && !cell.pending) {
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
      panel.add(this.add.text(0, -210, 'TROPHY', this.textStyle(52)).setOrigin(0.5, 0).setStroke('#8a4c00', 10));
      panel.add(this.add.circle(0, -66, 78, 0xffd84a).setStrokeStyle(8, 0x8a4c00));
      panel.add(this.add.rectangle(0, 25, 72, 92, 0xffc83d).setStrokeStyle(7, 0x8a4c00));
      panel.add(this.add.text(0, 95, title, this.textStyle(40)).setOrigin(0.5, 0).setStroke('#06101f', 9));
      panel.add(this.add.text(0, 164, '+40 coins', this.textStyle(42)).setOrigin(0.5, 0).setStroke('#06101f', 9));
      panel.add(this.makeResultButton(-170, 250, 'Continue', 0x35c95f, () => this.scene.start('MenuScene')));
      panel.add(this.makeResultButton(170, 250, '2X Reward', 0x8590a6, () => this.scene.start('MenuScene')));
      return;
    }

    panel.add(this.add.text(0, -156, title, this.textStyle(66)).setOrigin(0.5, 0).setStroke('#06101f', 12));
    panel.add(this.add.text(0, -34, `${this.clearedCells}/${this.totalCells}`, this.textStyle(54)).setOrigin(0.5, 0).setStroke('#06101f', 10));
    panel.add(this.makeResultButton(-170, 124, 'Retry', 0xffc83d, () => this.scene.restart()));
    panel.add(this.makeResultButton(170, 124, 'Map', 0x35c95f, () => this.scene.start('MenuScene')));
  }

  private makeResultButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.add(this.makeRoundRect(245, 92, 24, color, 1, 0x050915, 6));
    container.add(this.add.text(0, -31, label, this.textStyle(label.length > 8 ? 30 : 36)).setOrigin(0.5, 0).setStroke('#06101f', 8));
    const zone = this.add.zone(0, 0, 260, 110).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    container.add(zone);
    return container;
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
  ): { container: Phaser.GameObjects.Container; ammoText: Phaser.GameObjects.Text } {
    const container = this.add.container(x, y).setScale(scale);
    const shadow = this.add.ellipse(8, 18, 132, 58, 0x050915, 0.25);
    const barrel = this.add.rectangle(0, -78, 30, 64, 0x242a3d).setStrokeStyle(5, 0x050915);
    barrel.setVisible(showBarrel);

    const image = mystery ? this.makeMysteryToken() : this.add.image(0, 0, `pig-${pig.color}`);
    const badge = this.add.circle(50, -44, 28, 0xffffff).setStrokeStyle(6, 0x050915);
    const ammoText = this.add.text(50, -66, String(pig.ammo), this.textStyle(34)).setOrigin(0.5, 0).setStroke('#06101f', 7);
    container.add([shadow, barrel, image, badge, ammoText]);

    if (interactive) {
      const zone = this.add.zone(0, 0, 158, 158).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.tweens.add({ targets: container, scale: scale * 0.9, duration: 65, yoyo: true });
        onClick?.();
      });
      container.add(zone);
    }

    return { container, ammoText };
  }

  private makeMysteryToken(): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    container.add(this.makeRoundRect(126, 112, 30, 0x4d5dd9, 1, 0x050915, 7));
    container.add(this.add.text(0, -50, '?', this.textStyle(78)).setOrigin(0.5, 0).setStroke('#06101f', 11));
    return container;
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
    return { x: 142 + col * 133, y: 1530 + row * 150 };
  }

  private faceCenter(container: Phaser.GameObjects.Container): void {
    container.setRotation(Phaser.Math.Angle.Between(container.x, container.y, this.center.x, this.center.y) + Math.PI / 2);
  }

  private updateProgressText(): void {
    const left = this.totalCells - this.clearedCells;
    this.blocksLeftText?.setText(`${left} blocks`);
    window.__RPIXEL_BLOCKS_LEFT__ = left;
  }

  private updateDebugState(): void {
    window.__RPIXEL_ACTIVE_PIGS__ = this.resolvingShooter ? 1 : 0;
    window.__RPIXEL_BLOCKS_LEFT__ = this.totalCells - this.clearedCells;
    window.__RPIXEL_SLOTS_FILLED__ = this.slots.filter(Boolean).length;
    window.__RPIXEL_STUCK_SLOTS__ = this.slots.filter((slot) => slot?.status === 'stuck').length;
    window.__RPIXEL_RESERVE_LEFT__ = this.reserve.length;
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
