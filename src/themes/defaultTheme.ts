import Phaser from 'phaser';
import { GameTheme, MarbleTheme, BarTheme, ButtonTheme } from './types';

/**
 * DEFAULT THEME: CLASSIC WOOD & SHINY STEEL BALL BEARING
 *
 * Implements:
 * - Marble: Polished, shiny chrome/steel ball bearing with smooth specular reflection and ambient curvature.
 * - Bar: Natural warm wood grain with drop shadow and tactile fibers.
 * - Button: 3D tactile wood squircle with extrusion base, wood grain face plate, and light beige text.
 */

export const shinySteelBearingMarbleTheme: MarbleTheme = {
  id: 'shinySteelBallBearing',
  name: 'Shiny Steel Ball Bearing',
  rotatesTexture: false,

  ensureTexture(textures: Phaser.Textures.TextureManager, radius: number): string {
    const key = `marble_ball_bearing_${radius}`;
    if (textures.exists(key)) return key;

    const size = radius * 2 + 4;
    const canvas = textures.createCanvas(key, size, size);
    if (!canvas) return key;

    const ctx = canvas.getContext();
    const cx = size / 2;
    const cy = size / 2;
    const r = radius;

    // 1. Crisp outer dark contour rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1c2024';
    ctx.fill();

    // 2. Spherical polished chrome radial gradient
    // Specular highlight centered at (-0.32r, -0.32r)
    const grad = ctx.createRadialGradient(
      cx - r * 0.32,
      cy - r * 0.32,
      r * 0.04,
      cx - r * 0.08,
      cy - r * 0.08,
      r * 1.05
    );
    grad.addColorStop(0.0, '#ffffff'); // Blinding hot-white specular core
    grad.addColorStop(0.12, '#f0f5fa'); // Bright silver-white glare
    grad.addColorStop(0.28, '#d4dee6'); // Polished chrome sheen
    grad.addColorStop(0.55, '#8e9da8'); // Mid metallic steel tone
    grad.addColorStop(0.80, '#54606a'); // Shadowed steel curvature
    grad.addColorStop(0.94, '#2d3339'); // Deep ambient edge rim
    grad.addColorStop(1.0, '#1c2024'); // Outer steel contour

    ctx.beginPath();
    ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 3. Subtle ambient light reflection along the bottom-right crescent (ground reflection)
    const ambientGrad = ctx.createRadialGradient(
      cx + r * 0.28,
      cy + r * 0.32,
      r * 0.2,
      cx + r * 0.28,
      cy + r * 0.32,
      r * 0.75
    );
    ambientGrad.addColorStop(0.0, 'rgba(215, 230, 245, 0.24)');
    ambientGrad.addColorStop(0.7, 'rgba(180, 195, 210, 0.08)');
    ambientGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.fillStyle = ambientGrad;
    ctx.fill();

    canvas.refresh();
    return key;
  },

  drawShadow(g: Phaser.GameObjects.Graphics, radius: number): void {
    g.clear();
    // Soft elliptical contact shadow cast onto the wood bar
    g.fillStyle(0x22180f, 0.28);
    g.fillEllipse(0, radius + 1, radius * 1.5, 6);
  },
};

export const classicWoodBarTheme: BarTheme = {
  id: 'classicWoodBar',
  name: 'Classic Wood Bar',

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

    // 1. Soft contact drop shadow beneath bar
    g.fillStyle(0x3a2c1d, 0.26);
    g.fillRoundedRect(-halfW, -halfH + 5, width, height, r);

    // 2. Wood base rounded rectangle
    g.fillStyle(0x9c6638, 1.0);
    g.fillRoundedRect(-halfW, -halfH, width, height, r);

    // 3. Subtle wood grain lines along the length
    const grainLines = [
      { yOffset: -halfH + 3.5, color: 0xb57c4c, alpha: 0.35, width: 2 },
      { yOffset: -halfH + 7.5, color: 0x7c4e27, alpha: 0.25, width: 1.5 },
      { yOffset: -halfH + 11.5, color: 0xb57c4c, alpha: 0.20, width: 1 },
      { yOffset: -halfH + 15.5, color: 0x7c4e27, alpha: 0.30, width: 2 },
      { yOffset: -halfH + 18.5, color: 0xb57c4c, alpha: 0.25, width: 1.5 },
    ];

    grainLines.forEach((grain) => {
      g.lineStyle(grain.width, grain.color, grain.alpha);
      g.lineBetween(-halfW + 6, grain.yOffset, halfW - 6, grain.yOffset);
    });

    // 4. Soft perimeter edge shadow to give the wood bar tactile depth
    g.lineStyle(1.5, 0x5a3617, 0.45);
    g.strokeRoundedRect(-halfW, -halfH, width, height, r);
  },
};

export const classicWoodButtonTheme: ButtonTheme = {
  id: 'classicWoodButton',
  name: 'Classic Wood Button',
  textColor: '#fdf6e7', // Light beige color
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

    // Drop shadow
    g.fillStyle(0x3a2c1d, 0.28);
    g.fillRoundedRect(-halfW, -halfH + 7, width, height, radius);

    // Dark bottom wood bevel / thickness (extrusion)
    g.fillStyle(0x5a3617, 1.0);
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

    // Base wood face
    g.fillStyle(0x9c6638, 1.0);
    g.fillRoundedRect(-halfW, -halfH, width, height, radius);

    // Wood grain lines
    const grainOffsets = [
      { y: -halfH + 12, col: 0xb57c4c, alpha: 0.35, width: 2 },
      { y: -halfH + 24, col: 0x7c4e27, alpha: 0.28, width: 1.5 },
      { y: -halfH + 38, col: 0xb57c4c, alpha: 0.25, width: 1.5 },
      { y: -halfH + 50, col: 0x7c4e27, alpha: 0.30, width: 2 },
    ];
    grainOffsets.forEach((grain) => {
      g.lineStyle(grain.width, grain.col, grain.alpha);
      g.lineBetween(-halfW + 8, grain.y, halfW - 8, grain.y);
    });

    // Dark contour stroke
    g.lineStyle(1.5, 0x5a3617, 0.45);
    g.strokeRoundedRect(-halfW, -halfH, width, height, radius);
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
    g.fillStyle(0x180b04, 0.35);
    g.fillRoundedRect(-halfW, -halfH, width, height, radius);
  },
};

export const DEFAULT_GAME_THEME: GameTheme = {
  id: 'classicWoodAndSteel',
  name: 'Classic Wood & Steel',
  marble: shinySteelBearingMarbleTheme,
  bar: classicWoodBarTheme,
  button: classicWoodButtonTheme,
};
