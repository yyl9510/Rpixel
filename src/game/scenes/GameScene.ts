import Phaser from 'phaser';
import { COLOR_STYLES } from '../assets';
import { FIRST_LEVEL } from '../data/levels';
import type { Pig, PigColor } from '../types';

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;
const WAITING_CAPACITY = 5;
const BOARD_SIZE = 700;
const BOARD_X = (GAME_WIDTH - BOARD_SIZE) / 2;
const BOARD_Y = 480;
const TRACK_PAD = 118;

type Side = 'bottom' | 'right' | 'top' | 'left';

interface TrackPosition {
  x: number;
  y: number;
  side: Side;
}

interface BoardCell {
  row: number;
  col: number;
  color: PigColor;
  pending: boolean;
  cleared: boolean;
  image: Phaser.GameObjects.Image;
}

interface ActivePig {
  pig: Pig;
  container: Phaser.GameObjects.Container;
  ammoText: Phaser.GameObjects.Text;
  distance: number;
  speed: number;
  firedKeys: Set<string>;
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

export class GameScene extends Phaser.Scene {
  private cells: BoardCell[][] = [];
  private waiting: Pig[] = [];
  private reserve: Pig[] = [];
  private activePigs: ActivePig[] = [];
  private waitingLayer?: Phaser.GameObjects.Container;
  private reserveLayer?: Phaser.GameObjects.Container;
  private hudLayer?: Phaser.GameObjects.Container;
  private blocksLeftText?: Phaser.GameObjects.Text;
  private totalCells = 0;
  private clearedCells = 0;
  private gameOver = false;
  private readonly gridSize = FIRST_LEVEL.grid.length;
  private readonly cellSize = BOARD_SIZE / FIRST_LEVEL.grid.length;
  private readonly center = { x: GAME_WIDTH / 2, y: BOARD_Y + BOARD_SIZE / 2 };
  private readonly track: TrackMetrics = this.createTrackMetrics();

  constructor() {
    super('GameScene');
  }

  create(): void {
    window.__RPIXEL_SCENE__ = 'game';
    this.gameOver = false;
    this.clearedCells = 0;
    this.activePigs = [];
    this.waiting = [];
    this.reserve = FIRST_LEVEL.pigs.map((pig) => ({ ...pig }));
    this.totalCells = FIRST_LEVEL.grid.length * FIRST_LEVEL.grid[0].length;

    this.drawBackground();
    this.drawHud();
    this.drawTrack();
    this.drawBoard();

    this.waitingLayer = this.add.container(0, 0);
    this.reserveLayer = this.add.container(0, 0);
    this.refillWaiting();
    this.renderWaiting();
    this.renderReserve();
    this.updateDebugState();
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) {
      return;
    }

    for (let index = this.activePigs.length - 1; index >= 0; index -= 1) {
      const active = this.activePigs[index];
      active.distance += active.speed * (delta / 1000);

      if (active.distance >= this.track.total) {
        this.completeActivePig(index);
        continue;
      }

      const position = this.positionOnTrack(active.distance);
      active.container.setPosition(position.x, position.y);
      active.container.setRotation(Phaser.Math.Angle.Between(position.x, position.y, this.center.x, this.center.y) + Math.PI / 2);
      this.tryShoot(active, position, delta);
    }
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
      const y = 260 + i * 96;
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
    this.hudLayer = this.add.container(0, 0);
    this.addRoundRect(540, 86, 318, 74, 20, 0x0b1534, 0.62, 0x050915, 5);
    this.add.text(540, 51, `Level ${FIRST_LEVEL.id}`, this.textStyle(40)).setOrigin(0.5, 0).setStroke('#06101f', 8);

    this.addRoundRect(78, 84, 94, 70, 18, 0xffc83d, 1, 0x050915, 5);
    this.add.text(50, 50, '<', this.textStyle(46)).setStroke('#06101f', 8);
    this.add.zone(78, 84, 110, 92).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('MenuScene'));

    this.addRoundRect(978, 84, 128, 70, 18, 0x39c66a, 1, 0x050915, 5);
    this.add.text(935, 54, 'Retry', this.textStyle(32)).setStroke('#06101f', 7);
    this.add.zone(978, 84, 148, 92).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.restart());

    this.blocksLeftText = this.add.text(540, 345, '', this.textStyle(38)).setOrigin(0.5, 0).setStroke('#06101f', 8);
    this.updateProgressText();
  }

  private drawTrack(): void {
    const g = this.add.graphics();
    const width = this.track.right - this.track.left;
    const height = this.track.bottom - this.track.top;
    g.lineStyle(24, 0x051122, 0.5);
    g.strokeRoundedRect(this.track.left, this.track.top, width, height, 38);
    g.lineStyle(13, 0xffc51e, 1);
    g.strokeRoundedRect(this.track.left, this.track.top, width, height, 38);
    g.lineStyle(4, 0xfff19a, 0.9);
    g.strokeRoundedRect(this.track.left + 7, this.track.top + 7, width - 14, height - 14, 30);
  }

  private drawBoard(): void {
    this.addRoundRect(this.center.x, this.center.y, BOARD_SIZE + 46, BOARD_SIZE + 46, 28, 0xf1fbff, 0.72, 0x050915, 8);
    this.addRoundRect(this.center.x, this.center.y, BOARD_SIZE + 12, BOARD_SIZE + 12, 18, 0x1241a5, 0.18, 0xffffff, 4, 0.55);

    this.cells = FIRST_LEVEL.grid.map((row, rowIndex) =>
      row.map((color, colIndex) => {
        const image = this.add.image(
          BOARD_X + colIndex * this.cellSize + this.cellSize / 2,
          BOARD_Y + rowIndex * this.cellSize + this.cellSize / 2,
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

  private renderWaiting(): void {
    if (!this.waitingLayer) {
      return;
    }

    this.waitingLayer.removeAll(true);
    for (let index = 0; index < WAITING_CAPACITY; index += 1) {
      const x = 160 + index * 190;
      this.waitingLayer.add(this.makeRoundRect(150, 150, 26, 0x0b1534, 0.42, 0xffffff, 4, 0.32, x, 210));
      const pig = this.waiting[index];
      if (pig) {
        const token = this.createPigToken(pig, x, 210, 0.76, true, () => this.launchPig(pig.id));
        this.waitingLayer.add(token.container);
      }
    }
  }

  private renderReserve(): void {
    if (!this.reserveLayer) {
      return;
    }

    this.reserveLayer.removeAll(true);
    this.reserveLayer.add(this.makeRoundRect(820, 178, 28, 0x0b1534, 0.48, 0x050915, 5, 1, 540, 1696));

    const preview = this.reserve.slice(0, 7);
    for (let index = 0; index < preview.length; index += 1) {
      const token = this.createPigToken(preview[index], 190 + index * 115, 1692, 0.46, false);
      token.container.setAlpha(0.82);
      this.reserveLayer.add(token.container);
    }

    this.reserveLayer.add(this.add.text(540, 1796, `${this.reserve.length} left`, this.textStyle(32)).setOrigin(0.5, 0).setStroke('#06101f', 7));
  }

  private refillWaiting(): void {
    while (this.waiting.length < WAITING_CAPACITY && this.reserve.length > 0) {
      const nextPig = this.reserve.shift();
      if (nextPig) {
        this.waiting.push(nextPig);
      }
    }
  }

  private launchPig(pigId: string): void {
    if (this.gameOver) {
      return;
    }

    const index = this.waiting.findIndex((pig) => pig.id === pigId);
    if (index < 0) {
      return;
    }

    const [pig] = this.waiting.splice(index, 1);
    const token = this.createPigToken(pig, this.track.startX, this.track.bottom, 0.72, false, undefined, true);
    const active: ActivePig = {
      pig,
      container: token.container,
      ammoText: token.ammoText,
      distance: 0,
      speed: 330,
      firedKeys: new Set<string>(),
    };
    this.activePigs.push(active);
    this.refillWaiting();
    this.renderWaiting();
    this.renderReserve();
    this.updateDebugState();
  }

  private tryShoot(active: ActivePig, position: TrackPosition, delta: number): void {
    if (active.pig.ammo <= 0) {
      return;
    }

    const threshold = Math.max(9, active.speed * (delta / 1000) + 7);
    const lineIndex = this.lineIndexForPosition(position, threshold);
    if (lineIndex === null) {
      return;
    }

    const key = `${position.side}:${lineIndex}`;
    if (active.firedKeys.has(key)) {
      return;
    }
    active.firedKeys.add(key);

    const target = this.findVisibleTarget(position.side, lineIndex, active.pig.color);
    if (!target) {
      return;
    }

    this.fireProjectile(active, target);
  }

  private lineIndexForPosition(position: TrackPosition, threshold: number): number | null {
    if (position.side === 'bottom' || position.side === 'top') {
      return this.nearestBoardIndex(position.x, BOARD_X, threshold);
    }
    return this.nearestBoardIndex(position.y, BOARD_Y, threshold);
  }

  private nearestBoardIndex(value: number, start: number, threshold: number): number | null {
    const raw = (value - start - this.cellSize / 2) / this.cellSize;
    const index = Math.round(raw);
    if (index < 0 || index >= this.gridSize) {
      return null;
    }
    const center = start + index * this.cellSize + this.cellSize / 2;
    return Math.abs(value - center) <= threshold ? index : null;
  }

  private findVisibleTarget(side: Side, lineIndex: number, color: PigColor): BoardCell | null {
    const sequence = this.scanSequence(side, lineIndex);
    for (const [row, col] of sequence) {
      const cell = this.cells[row][col];
      if (!cell.cleared && !cell.pending) {
        return cell.color === color ? cell : null;
      }
    }
    return null;
  }

  private scanSequence(side: Side, lineIndex: number): [number, number][] {
    const sequence: [number, number][] = [];
    if (side === 'bottom') {
      for (let row = this.gridSize - 1; row >= 0; row -= 1) {
        sequence.push([row, lineIndex]);
      }
    } else if (side === 'top') {
      for (let row = 0; row < this.gridSize; row += 1) {
        sequence.push([row, lineIndex]);
      }
    } else if (side === 'right') {
      for (let col = this.gridSize - 1; col >= 0; col -= 1) {
        sequence.push([lineIndex, col]);
      }
    } else {
      for (let col = 0; col < this.gridSize; col += 1) {
        sequence.push([lineIndex, col]);
      }
    }
    return sequence;
  }

  private fireProjectile(active: ActivePig, target: BoardCell): void {
    target.pending = true;
    active.pig.ammo -= 1;
    active.ammoText.setText(String(active.pig.ammo));

    const style = COLOR_STYLES[active.pig.color];
    const projectile = this.add.circle(active.container.x, active.container.y, 17, style.base).setStrokeStyle(5, 0xffffff, 0.95);
    projectile.setDepth(20);

    this.tweens.add({
      targets: projectile,
      x: target.image.x,
      y: target.image.y,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => {
        projectile.destroy();
        this.clearCell(target);
      },
    });
  }

  private clearCell(cell: BoardCell): void {
    if (cell.cleared) {
      return;
    }

    cell.cleared = true;
    this.clearedCells += 1;
    this.updateProgressText();
    this.updateDebugState();

    const burst = this.add.circle(cell.image.x, cell.image.y, 38, 0xffffff, 0.44);
    this.tweens.add({ targets: burst, scale: 2, alpha: 0, duration: 230, onComplete: () => burst.destroy() });
    this.tweens.add({
      targets: cell.image,
      scale: cell.image.scaleX * 1.25,
      alpha: 0,
      duration: 180,
      ease: 'Back.easeIn',
      onComplete: () => cell.image.destroy(),
    });

    if (this.clearedCells >= this.totalCells) {
      this.time.delayedCall(260, () => this.showResult(true, 'CLEAR'));
    }
  }

  private completeActivePig(index: number): void {
    const active = this.activePigs[index];
    active.container.destroy();
    this.activePigs.splice(index, 1);

    if (this.gameOver) {
      this.updateDebugState();
      return;
    }

    if (active.pig.ammo > 0 && this.clearedCells < this.totalCells) {
      if (this.waiting.length >= WAITING_CAPACITY) {
        this.showResult(false, 'WAIT FULL');
        return;
      }
      this.waiting.push(active.pig);
      this.refillWaiting();
    }

    this.renderWaiting();
    this.renderReserve();
    this.updateDebugState();

    if (this.activePigs.length === 0 && this.waiting.length === 0 && this.reserve.length === 0 && this.clearedCells < this.totalCells) {
      this.showResult(false, 'NO PIGS');
    }
  }

  private showResult(win: boolean, title: string): void {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    window.__RPIXEL_SCENE__ = win ? 'win' : 'fail';

    const overlay = this.add.rectangle(540, 960, GAME_WIDTH, GAME_HEIGHT, 0x04101f, 0.62);
    overlay.setDepth(80);
    const panel = this.add.container(540, 930).setDepth(81);
    panel.add(this.makeRoundRect(660, 430, 36, win ? 0x2387ff : 0xbd2338, 1, 0x050915, 9));
    panel.add(this.makeRoundRect(596, 110, 28, 0xffffff, 0.2, undefined, 0, 1, 0, -130));
    panel.add(this.add.text(0, -156, title, this.textStyle(74)).setOrigin(0.5, 0).setStroke('#06101f', 13));
    panel.add(this.add.text(0, -34, `${this.clearedCells}/${this.totalCells}`, this.textStyle(54)).setOrigin(0.5, 0).setStroke('#06101f', 10));

    const retry = this.makeResultButton(-170, 124, 'Retry', 0xffc83d, () => this.scene.restart());
    const map = this.makeResultButton(170, 124, 'Map', 0x35c95f, () => this.scene.start('MenuScene'));
    panel.add([retry, map]);
  }

  private makeResultButton(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.add(this.makeRoundRect(245, 92, 24, color, 1, 0x050915, 6));
    container.add(this.add.text(0, -31, label, this.textStyle(36)).setOrigin(0.5, 0).setStroke('#06101f', 8));
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
  ): { container: Phaser.GameObjects.Container; ammoText: Phaser.GameObjects.Text } {
    const container = this.add.container(x, y).setScale(scale);
    const shadow = this.add.ellipse(8, 18, 132, 58, 0x050915, 0.25);
    const barrel = this.add.rectangle(0, -78, 30, 64, 0x242a3d).setStrokeStyle(5, 0x050915);
    barrel.setVisible(showBarrel);
    const image = this.add.image(0, 0, `pig-${pig.color}`);
    const badge = this.add.circle(50, -44, 28, 0xffffff).setStrokeStyle(6, 0x050915);
    const ammoText = this.add.text(50, -66, String(pig.ammo), this.textStyle(36)).setOrigin(0.5, 0).setStroke('#06101f', 7);
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

  private createTrackMetrics(): TrackMetrics {
    const left = BOARD_X - TRACK_PAD;
    const right = BOARD_X + BOARD_SIZE + TRACK_PAD;
    const top = BOARD_Y - TRACK_PAD;
    const bottom = BOARD_Y + BOARD_SIZE + TRACK_PAD;
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

  private updateProgressText(): void {
    const left = this.totalCells - this.clearedCells;
    this.blocksLeftText?.setText(`${left} blocks`);
    window.__RPIXEL_BLOCKS_LEFT__ = left;
  }

  private updateDebugState(): void {
    window.__RPIXEL_ACTIVE_PIGS__ = this.activePigs.length;
    window.__RPIXEL_BLOCKS_LEFT__ = this.totalCells - this.clearedCells;
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
