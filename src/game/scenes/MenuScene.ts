import Phaser from 'phaser';
import { FIRST_LEVEL } from '../data/levels';

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    window.__RPIXEL_SCENE__ = 'menu';
    window.__RPIXEL_ACTIVE_PIGS__ = 0;

    this.drawBackground();
    this.drawTopBar();
    this.drawLevelPath();
    this.drawPlayButton();
    this.drawBottomNav();
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    const top = Phaser.Display.Color.ValueToColor(0x0632d4);
    const bottom = Phaser.Display.Color.ValueToColor(0x0bc6ff);

    for (let y = 0; y < GAME_HEIGHT; y += 12) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, GAME_HEIGHT, y);
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      graphics.fillRect(0, y, GAME_WIDTH, 12);
    }

    graphics.lineStyle(7, 0xffffff, 0.18);
    for (let i = 0; i < 18; i += 1) {
      const x = 90 + ((i * 271) % 900);
      const y = 310 + i * 92;
      if (i % 2 === 0) {
        graphics.strokeCircle(x, y, 54);
        graphics.strokeCircle(x - 18, y - 8, 9);
        graphics.strokeCircle(x + 22, y - 8, 9);
      } else {
        graphics.strokeRoundedRect(x - 48, y - 36, 96, 72, 18);
      }
    }
  }

  private drawTopBar(): void {
    this.addRoundRect(112, 166, 140, 140, 28, 0x67c9ff, 1, 0x04112d, 5);
    this.add.image(112, 166, 'pig-green').setScale(0.72);

    this.addRoundRect(372, 165, 335, 86, 20, 0x07122a, 0.48, 0x07122a, 4, 0.55);
    this.add.text(238, 137, 'INF 3m22s', this.textStyle(42)).setStroke('#06101f', 10);

    this.add.circle(620, 166, 52, 0xffc937).setStrokeStyle(6, 0x7a4a00);
    this.add.circle(620, 166, 38, 0xffdd55, 0.7);
    this.add.text(681, 137, '10.1k', this.textStyle(48)).setStroke('#06101f', 10);

    this.addRoundRect(870, 168, 94, 86, 18, 0xffb43d, 1, 0x6b3b00, 5);
    this.add.text(853, 130, '+', this.textStyle(62)).setStroke('#9a5200', 8);

    this.add.circle(992, 166, 56, 0x22283d).setStrokeStyle(6, 0x050915);
    this.add.text(970, 130, 'SET', this.textStyle(34)).setStroke('#050915', 8);
  }

  private drawLevelPath(): void {
    const path = this.add.graphics();
    path.lineStyle(32, 0x052049, 0.34);
    path.lineBetween(GAME_WIDTH / 2, 280, GAME_WIDTH / 2, 1210);
    path.lineStyle(22, 0xffc624, 1);
    path.lineBetween(GAME_WIDTH / 2, 280, GAME_WIDTH / 2, 1210);

    this.addLevelNode(540, 430, 1102, 0x1b90ff, false);
    this.addLevelNode(540, 780, 1101, 0x1b90ff, false);
    this.addLevelNode(540, 1185, FIRST_LEVEL.id, 0xe2383f, true);

    this.addRoundRect(540, 1325, 310, 76, 36, 0xc51f34, 1, 0x050915, 8);
    this.add.text(540, 1297, FIRST_LEVEL.difficulty, this.textStyle(42)).setOrigin(0.5, 0).setStroke('#06101f', 8);

    this.drawSideBadge(144, 462, '21h 42m', 'pig-yellow');
    this.drawSideBadge(146, 835, '21m 50s', 'block-red');
    this.drawSideBadge(146, 1180, '21h 42m', 'pig-blue');
    this.drawSideBadge(902, 512, '3d 21h', 'pig-purple');
    this.add.text(830, 710, 'ADS', this.textStyle(74)).setStroke('#06101f', 14).setAngle(-4);
    this.addRoundRect(916, 830, 210, 64, 18, 0x6ed13a, 1, 0x113a0d, 5);
    this.add.text(916, 802, 'NO ADS', this.textStyle(37)).setOrigin(0.5, 0).setStroke('#113a0d', 7);
  }

  private addLevelNode(x: number, y: number, label: number, color: number, active: boolean): void {
    const g = this.add.graphics();
    const points = [
      new Phaser.Geom.Point(x, y - 110),
      new Phaser.Geom.Point(x + 96, y - 55),
      new Phaser.Geom.Point(x + 96, y + 55),
      new Phaser.Geom.Point(x, y + 110),
      new Phaser.Geom.Point(x - 96, y + 55),
      new Phaser.Geom.Point(x - 96, y - 55),
    ];

    g.fillStyle(active ? 0xffb729 : 0x77ceff, 1);
    g.lineStyle(10, 0x050915, 1);
    g.fillPoints(points, true);
    g.strokePoints(points, true);
    g.fillStyle(color, 1);
    g.lineStyle(8, active ? 0x7a281a : 0x1460cb, 1);
    g.fillPoints(points.map((point) => new Phaser.Geom.Point(x + (point.x - x) * 0.72, y + (point.y - y) * 0.72)), true);
    g.strokePoints(points.map((point) => new Phaser.Geom.Point(x + (point.x - x) * 0.72, y + (point.y - y) * 0.72)), true);

    this.add.text(x, y - 36, String(label), this.textStyle(62)).setOrigin(0.5, 0).setStroke('#06101f', 12);
  }

  private drawSideBadge(x: number, y: number, label: string, texture: string): void {
    this.add.circle(x, y, 88, 0xd9f3ff).setStrokeStyle(7, 0x050915);
    this.add.image(x, y - 6, texture).setScale(texture.startsWith('pig') ? 0.72 : 1.06);
    this.addRoundRect(x, y + 89, 190, 62, 16, 0x101830, 1, 0xffffff, 5);
    this.add.text(x, y + 62, label, this.textStyle(32)).setOrigin(0.5, 0).setStroke('#06101f', 8);
  }

  private drawPlayButton(): void {
    const container = this.add.container(540, 1542);
    const shadow = this.makeRoundRect(510, 175, 38, 0x5d3a08, 0.7, undefined, 0, 1, 0, 22);
    const button = this.makeRoundRect(510, 175, 38, 0xffc83d, 1, 0x050915, 9);
    const gloss = this.makeRoundRect(468, 74, 30, 0xffe98a, 0.65, undefined, 0, 1, 0, -40);
    const label = this.add.text(0, -58, 'Play', this.textStyle(86)).setOrigin(0.5, 0).setStroke('#06101f', 13);
    const zone = this.add.zone(0, 0, 530, 190).setInteractive({ useHandCursor: true });

    container.add([shadow, button, gloss, label, zone]);
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.94, duration: 70, yoyo: true });
      this.time.delayedCall(95, () => this.scene.start('GameScene'));
    });
  }

  private drawBottomNav(): void {
    this.add.rectangle(540, 1818, 1080, 204, 0x20243e).setStrokeStyle(4, 0x050915);
    this.add.rectangle(180, 1818, 360, 204, 0x20243e).setStrokeStyle(3, 0x050915);
    this.add.rectangle(540, 1802, 360, 236, 0x4e5edb).setStrokeStyle(6, 0x050915);
    this.add.rectangle(900, 1818, 360, 204, 0x20243e).setStrokeStyle(3, 0x050915);
    this.add.text(540, 1793, 'Start', this.textStyle(58)).setOrigin(0.5, 0).setStroke('#06101f', 10);
    this.add.image(540, 1722, 'pig-blue').setScale(0.86);
    this.add.text(122, 1752, 'SHOP', this.textStyle(34)).setStroke('#06101f', 8);
    this.add.text(838, 1752, 'LOCK', this.textStyle(34)).setStroke('#06101f', 8);
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
