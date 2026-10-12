import Phaser from 'phaser';
import { BarTheme, ButtonTheme, HoleTheme } from './types';

/**
 * NEON GLOWING GREEN HALOGEN SURFACE THEME
 *
 * Implements:
 * 1. Bar: An electric glowing halogen neon tube with multi-layered radiant aura,
 *    emerald glass envelope, and a blazing white-hot fluorescent neon gas filament.
 * 2. Buttons: Sleek dark titanium and emerald glass squircles with neon green glowing borders.
 * 3. Holes & Speed Gauge: Radiant electric neon green outlines and speed gauge ticks.
 */

export const neonHalogenBarTheme: BarTheme = {
  id: 'neonHalogen',
  name: 'Neon Halogen',

  drawBar(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    cornerRadius: number
  ): void {
    g.clear();
    const halfW = width / 2;
    const halfH = height / 2;
    const r = cornerRadius;

    // 1. Outermost Atmospheric Neon Aura (diffuse radiant green glow)
    g.lineStyle(16, 0x16a34a, 0.12);
    g.strokeRoundedRect(-halfW - 4, -halfH - 4, width + 8, height + 8, r + 4);

    g.lineStyle(10, 0x22c55e, 0.22);
    g.strokeRoundedRect(-halfW - 2, -halfH - 2, width + 4, height + 4, r + 2);

    g.lineStyle(5, 0x39ff14, 0.45);
    g.strokeRoundedRect(-halfW, -halfH, width, height, r);

    // 2. Translucent Halogen Emerald Glass Body
    g.fillStyle(0x064e3b, 0.95);
    g.fillRoundedRect(-halfW, -halfH, width, height, r);

    // 3. Inner Fluorescent Neon Gas Envelope
    g.fillStyle(0x15803d, 0.65);
    g.fillRoundedRect(-halfW + 4, -halfH + 3, width - 8, height - 6, r - 2);

    // 4. Ultra-bright Center Neon Filament Core (linear gas discharge beam)
    // Outer beam glow
    g.lineStyle(6, 0x4ade80, 0.85);
    g.lineBetween(-halfW + 12, 0, halfW - 12, 0);

    // Inner blinding white-hot filament
    g.lineStyle(2.4, 0xf0fff4, 1.0);
    g.lineBetween(-halfW + 14, 0, halfW - 14, 0);

    // 5. Specular highlight along the top curvature of the glass tube
    g.lineStyle(1.4, 0xa7f3d0, 0.65);
    g.beginPath();
    g.moveTo(-halfW + r, -halfH + 2.5);
    g.lineTo(halfW - r, -halfH + 2.5);
    g.strokePath();

    // 6. Halogen Glass Outline
    g.lineStyle(1.8, 0x39ff14, 0.90);
    g.strokeRoundedRect(-halfW, -halfH, width, height, r);

    // 7. Metal Electrode End Caps at bar tips
    const capW = 12;
    // Left Cap
    g.fillStyle(0x1e293b, 1.0);
    g.fillRoundedRect(-halfW - 2, -halfH + 1, capW, height - 2, 4);
    g.lineStyle(1.5, 0x39ff14, 0.95);
    g.strokeRoundedRect(-halfW - 2, -halfH + 1, capW, height - 2, 4);

    // Right Cap
    g.fillStyle(0x1e293b, 1.0);
    g.fillRoundedRect(halfW - capW + 2, -halfH + 1, capW, height - 2, 4);
    g.lineStyle(1.5, 0x39ff14, 0.95);
    g.strokeRoundedRect(halfW - capW + 2, -halfH + 1, capW, height - 2, 4);
  },
};

export const neonHalogenButtonTheme: ButtonTheme = {
  id: 'neonHalogenButton',
  name: 'Neon Halogen Button',
  textColor: '#ecfdf5', // Crisp fluorescent mint-white
  fontFamily: '"Quicksand", "Nunito", "ui-rounded", -apple-system, BlinkMacSystemFont, sans-serif',
  pressDepth: 6,

  drawBase(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    radius: number
  ): void {
    g.clear();
    const halfW = width / 2;
    const halfH = height / 2;

    // Glowing diffuse shadow
    g.fillStyle(0x14532d, 0.35);
    g.fillRoundedRect(-halfW, -halfH + 7, width, height, radius);

    // Dark titanium casing extrusion
    g.fillStyle(0x052e16, 1.0);
    g.fillRoundedRect(-halfW, -halfH + 4, width, height, radius);
  },

  drawFace(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    radius: number
  ): void {
    g.clear();
    const halfW = width / 2;
    const halfH = height / 2;

    // Outer soft neon aura
    g.lineStyle(4, 0x22c55e, 0.35);
    g.strokeRoundedRect(-halfW, -halfH, width, height, radius);

    // Dark emerald glass face
    g.fillStyle(0x064e3b, 0.95);
    g.fillRoundedRect(-halfW, -halfH, width, height, radius);

    // Subtle inner neon wash
    g.fillStyle(0x15803d, 0.35);
    g.fillRoundedRect(-halfW + 4, -halfH + 4, width - 8, height - 8, radius - 2);

    // Crisp neon green border
    g.lineStyle(2, 0x39ff14, 1.0);
    g.strokeRoundedRect(-halfW, -halfH, width, height, radius);

    // Top edge glass highlight
    g.lineStyle(1.4, 0xa7f3d0, 0.70);
    g.beginPath();
    g.moveTo(-halfW + radius, -halfH + 2);
    g.lineTo(halfW - radius, -halfH + 2);
    g.strokePath();
  },

  drawPressShade(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    radius: number
  ): void {
    g.clear();
    const halfW = width / 2;
    const halfH = height / 2;
    g.fillStyle(0x022c22, 0.45);
    g.fillRoundedRect(-halfW, -halfH, width, height, radius);
  },
};

export const neonHalogenHoleTheme: HoleTheme = {
  id: 'neonHalogenHole',
  name: 'Neon Halogen Hole',
  borderColor: 0x39ff14,
  borderWidth: 4.5,
  innerShadowColor: 0x000000,
  tickColor: 0x39ff14,

  drawCircleFill(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number
  ): void {
    // Deep pitch black pit interior
    g.fillStyle(0x020803, 1.0);
    g.fillCircle(cx, cy, radius);
  },

  drawCircleBorder(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number
  ): void {
    // Layer 1: Radiant diffuse neon aura (9px wide)
    g.lineStyle(9.0, 0x22c55e, 0.35);
    g.strokeCircle(cx, cy, radius);

    // Layer 2: Sharp electric neon green core (4.5px wide)
    g.lineStyle(4.5, 0x39ff14, 1.0);
    g.strokeCircle(cx, cy, radius);

    // Layer 3: Subtle top-edge neon crescent highlight
    g.lineStyle(1.8, 0x86efac, 0.85);
    g.beginPath();
    g.arc(cx, cy, radius, -Math.PI * 0.75, -Math.PI * 0.25, false);
    g.strokePath();
  },

  drawPolygonFill(
    g: Phaser.GameObjects.Graphics,
    points: { x: number; y: number }[]
  ): void {
    if (points.length < 3) return;

    // Deep pitch black pit interior
    g.fillStyle(0x020803, 1.0);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.closePath();
    g.fillPath();
  },

  drawPolygonBorder(
    g: Phaser.GameObjects.Graphics,
    points: { x: number; y: number }[]
  ): void {
    if (points.length < 3) return;

    const trace = () => {
      g.beginPath();
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        g.lineTo(points[i].x, points[i].y);
      }
      g.closePath();
    };

    // Layer 1: Radiant diffuse neon aura (9px wide)
    g.lineStyle(9.0, 0x22c55e, 0.35);
    trace();
    g.strokePath();

    // Layer 2: Sharp electric neon green core (4.5px wide)
    g.lineStyle(4.5, 0x39ff14, 1.0);
    trace();
    g.strokePath();
  },

  drawRectHole(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadius: number = 10
  ): void {
    // 1. Deep pitch black pit interior
    g.fillStyle(0x020803, 1.0);
    g.fillRoundedRect(x, y, width, height, cornerRadius);

    // 2. Radiant diffuse neon aura (9px wide)
    g.lineStyle(9.0, 0x22c55e, 0.35);
    g.strokeRoundedRect(x, y, width, height, cornerRadius);

    // 3. Sharp electric neon green core (4.5px wide)
    g.lineStyle(4.5, 0x39ff14, 1.0);
    g.strokeRoundedRect(x, y, width, height, cornerRadius);

    // 4. Inner bright lime highlight along top edge
    g.lineStyle(1.8, 0x86efac, 0.85);
    g.beginPath();
    g.moveTo(x + cornerRadius, y + 1);
    g.lineTo(x + width - cornerRadius, y + 1);
    g.strokePath();
  },

  drawTriHole(
    g: Phaser.GameObjects.Graphics,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ): void {
    this.drawPolygonFill(g, [p1, p2, p3]);
    this.drawPolygonBorder(g, [p1, p2, p3]);
  },

  drawCircleHole(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number
  ): void {
    this.drawCircleFill(g, cx, cy, radius);
    this.drawCircleBorder(g, cx, cy, radius);
  },

  drawPolygonHole(
    g: Phaser.GameObjects.Graphics,
    points: { x: number; y: number }[]
  ): void {
    this.drawPolygonFill(g, points);
    this.drawPolygonBorder(g, points);
  },

  drawTick(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    length: number,
    direction: 1 | -1,
    isMajor: boolean
  ): void {
    const endX = x + length * direction;
    const alpha = isMajor ? 0.95 : 0.65;
    const width = isMajor ? 3.0 : 1.8;

    // Soft neon aura backing
    g.lineStyle(width + 4, 0x22c55e, alpha * 0.35);
    g.lineBetween(x, y, endX, y);

    // Sharp neon green tick
    g.lineStyle(width, 0x39ff14, alpha);
    g.lineBetween(x, y, endX, y);
  },
};
