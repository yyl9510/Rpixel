import Phaser from 'phaser';
import type { Pig } from '../types';

export interface AmmoLabelDebug {
  index: number;
  id: string;
  targetX: number;
  targetY: number;
  centerX: number;
  centerY: number;
  deltaX: number;
  deltaY: number;
}

interface ShooterTokenOptions {
  pig: Pig;
  x: number;
  y: number;
  scale: number;
  showBarrel?: boolean;
  mystery?: boolean;
}

const AMMO_LABEL_CENTER = { x: 0, y: 0 };
const AMMO_NUMBER_VISUAL_OFFSETS = {
  singleDigit: { x: -16, y: -20 },
  multiDigit: { x: -28, y: -18 },
};

export class ShooterToken extends Phaser.GameObjects.Container {
  readonly visualBody: Phaser.GameObjects.Container;
  readonly ammoText: Phaser.GameObjects.Text;

  private readonly ammoBadge: Phaser.GameObjects.Container;
  private ammo = 0;

  constructor(scene: Phaser.Scene, options: ShooterTokenOptions) {
    super(scene, options.x, options.y);
    scene.add.existing(this);
    this.setScale(options.scale);

    const shadow = scene.add.ellipse(10, 30, 166, 66, 0x050915, 0.42);
    this.visualBody = scene.add.container(0, 0);
    const barrel = scene.add.rectangle(0, -84, 30, 68, 0x242a3d).setStrokeStyle(5, 0x050915);
    const barrelTip = scene.add.circle(0, -120, 18, 0x5c6684).setStrokeStyle(5, 0x050915);
    barrel.setVisible(Boolean(options.showBarrel));
    barrelTip.setVisible(Boolean(options.showBarrel));

    const image = options.mystery ? this.makeMysteryToken() : scene.add.image(0, 0, `shooter-${options.pig.color}`);
    this.visualBody.add([barrel, barrelTip, image]);

    this.ammoBadge = this.makeAmmoBadge();
    this.ammoText = scene.add
      .text(AMMO_LABEL_CENTER.x, AMMO_LABEL_CENTER.y, '', this.ammoTextStyle(this.ammoFontSize(options.pig.ammo)))
      .setOrigin(0.5, 0.5)
      .setStroke('#071122', 2);
    this.ammoText.setResolution(3);
    this.ammoText.setShadow(0, 1, '#050915', 2, false, true);
    this.ammoBadge.add(this.ammoText);

    const showAmmo = !options.mystery;
    this.ammoBadge.setVisible(showAmmo);
    this.add([shadow, this.visualBody, this.ammoBadge]);
    this.setAmmo(options.pig.ammo);
  }

  setAmmo(ammo: number): void {
    this.ammo = ammo;
    this.ammoText.setText(String(ammo));
    this.ammoText.setFontSize(this.ammoFontSize(ammo));
    this.ammoText.setOrigin(0.5, 0.5);
    this.ammoText.setPosition(AMMO_LABEL_CENTER.x, AMMO_LABEL_CENTER.y);
    this.centerAmmoTextVisualBounds();
  }

  ammoLabelDebug(index: number, id: string): AmmoLabelDebug {
    const center = this.getAmmoTextVisualCenter();
    const target = this.getAmmoLabelWorldCenter();
    return {
      index,
      id,
      targetX: round1(target.x),
      targetY: round1(target.y),
      centerX: round1(center.x),
      centerY: round1(center.y),
      deltaX: round1(center.x - target.x),
      deltaY: round1(center.y - target.y),
    };
  }

  private centerAmmoTextVisualBounds(): void {
    const center = this.getAmmoTextVisualCenter();
    const target = this.getAmmoLabelWorldCenter();
    const parentMatrix = this.ammoBadge.getWorldTransformMatrix();
    const centerLocal = parentMatrix.applyInverse(center.x, center.y);
    const targetLocal = parentMatrix.applyInverse(target.x, target.y);
    const deltaX = targetLocal.x - centerLocal.x;
    const deltaY = targetLocal.y - centerLocal.y;
    if (Number.isFinite(deltaX) && Number.isFinite(deltaY)) {
      this.ammoText.setPosition(this.ammoText.x + deltaX, this.ammoText.y + deltaY);
    }
  }

  private getAmmoLabelWorldCenter(): { x: number; y: number } {
    const offset = this.ammoNumberVisualOffset();
    const matrix = this.getWorldTransformMatrix();
    const point = matrix.transformPoint(AMMO_LABEL_CENTER.x + offset.x, AMMO_LABEL_CENTER.y + offset.y);
    return { x: point.x, y: point.y };
  }

  private ammoNumberVisualOffset(): { x: number; y: number } {
    return Math.abs(this.ammo) < 10 ? AMMO_NUMBER_VISUAL_OFFSETS.singleDigit : AMMO_NUMBER_VISUAL_OFFSETS.multiDigit;
  }

  private getAmmoTextVisualCenter(): { x: number; y: number } {
    const visualBounds = this.getAmmoTextVisualBounds();
    if (!visualBounds) {
      return this.getAmmoTextObjectCenter();
    }

    const resolution = this.ammoText.style.resolution || 1;
    const centerX = ((visualBounds.left + visualBounds.right + 1) / 2) / resolution - this.ammoText.displayOriginX;
    const centerY = ((visualBounds.top + visualBounds.bottom + 1) / 2) / resolution - this.ammoText.displayOriginY;
    const matrix = this.ammoText.getWorldTransformMatrix();
    const point = matrix.transformPoint(centerX, centerY);
    return { x: point.x, y: point.y };
  }

  private getAmmoTextObjectCenter(): { x: number; y: number } {
    const bounds = this.ammoText.getBounds();
    return { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 };
  }

  private getAmmoTextVisualBounds(): { left: number; right: number; top: number; bottom: number } | undefined {
    const canvas = this.ammoText.canvas;
    const context = this.ammoText.context;
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

  private makeAmmoBadge(): Phaser.GameObjects.Container {
    const badge = this.scene.add.container(AMMO_LABEL_CENTER.x, AMMO_LABEL_CENTER.y);
    badge.add(this.makeRoundRect(72, 42, 16, 0x050915, 0.18, undefined, 0, 1, 3, 4));
    badge.add(this.makeRoundRect(68, 39, 15, 0x111a30, 0.9, 0xffe39a, 2, 0.58));
    badge.add(this.makeRoundRect(52, 25, 11, 0xffffff, 0.09, 0xffffff, 1, 0.14));
    badge.add(this.makeRoundRect(34, 7, 4, 0xffffff, 0.2, undefined, 0, 1, -5, -14));
    return badge;
  }

  private makeMysteryToken(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    container.add(this.scene.add.ellipse(6, 36, 118, 34, 0x050915, 0.28));
    container.add(this.makeRoundRect(126, 112, 30, 0x4d5dd9, 1, 0x050915, 7));
    container.add(this.makeRoundRect(88, 28, 14, 0xaab5ff, 0.35, undefined, 0, 1, -12, -31));
    container.add(this.scene.add.text(0, -50, '?', this.ammoTextStyle(78)).setOrigin(0.5, 0).setStroke('#06101f', 11));
    return container;
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
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRoundedRect(offsetX - width / 2, offsetY - height / 2, width, height, radius);
    if (strokeColor !== undefined && strokeWidth > 0) {
      graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
      graphics.strokeRoundedRect(offsetX - width / 2, offsetY - height / 2, width, height, radius);
    }
    return graphics;
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

  private ammoTextStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Rounded MT Bold, Arial Black, Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#fff4c8',
      align: 'center',
    };
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
