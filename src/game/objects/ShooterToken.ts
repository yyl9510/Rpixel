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
    this.centerAmmoTextBounds();
  }

  ammoLabelDebug(index: number, id: string): AmmoLabelDebug {
    const center = this.getAmmoTextBoundsCenter();
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

  private centerAmmoTextBounds(): void {
    const center = this.getAmmoTextBoundsCenter();
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
    const matrix = this.getWorldTransformMatrix();
    const point = matrix.transformPoint(AMMO_LABEL_CENTER.x, AMMO_LABEL_CENTER.y);
    return { x: point.x, y: point.y };
  }

  private getAmmoTextBoundsCenter(): { x: number; y: number } {
    const bounds = this.ammoText.getBounds();
    return {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
    };
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
