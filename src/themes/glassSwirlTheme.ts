import Phaser from 'phaser';
import { MarbleTheme } from './types';

/**
 * RED & YELLOW SWIRL GLASS MARBLE THEME
 *
 * Implements:
 * 1. Layer 1 (Base Body): A crystal glass sphere with intertwining, organic ribbons
 *    of deep ruby red and brilliant sunshine yellow spiraling through the core.
 *    Because it rotates with the marble's physical rolling velocity (rotatesBody: true),
 *    the player sees the vibrant colored glass ribbons physically tumble in 3D.
 * 2. Layer 2 (Stationary Overlay): A high-gloss, crystal-clear glass specular reflection
 *    and caustic internal refraction that remains locked to the overhead lighting.
 * 3. Soft warm amber contact drop shadow.
 */
export const glassSwirlMarbleTheme: MarbleTheme = {
  id: 'glassSwirl',
  name: 'Glass Swirl',
  rotatesBody: true,
  rotatesTexture: true,

  ensureBaseTexture(textures: Phaser.Textures.TextureManager, radius: number): string {
    const key = `marble_glass_swirl_base_${radius}`;
    if (textures.exists(key)) return key;

    const size = radius * 2 + 4;
    const canvas = textures.createCanvas(key, size, size);
    if (!canvas) return key;

    const ctx = canvas.getContext();
    const cx = size / 2;
    const cy = size / 2;
    const r = radius;

    ctx.save();

    // Clip all inner artwork strictly to the circular marble contour
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // 1. Base translucent glass core (golden amber crystal gradient)
    const baseGrad = ctx.createRadialGradient(
      cx - r * 0.2,
      cy - r * 0.2,
      r * 0.05,
      cx,
      cy,
      r * 1.02
    );
    baseGrad.addColorStop(0.0, '#fffde7'); // Warm crystal glass center
    baseGrad.addColorStop(0.25, '#fff59d'); // Translucent yellow mid-glow
    baseGrad.addColorStop(0.55, '#ffb74d'); // Warm amber refraction
    baseGrad.addColorStop(0.85, '#e65100'); // Deep amber-orange edge
    baseGrad.addColorStop(1.0, '#880e4f'); // Dark glass contour edge
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Intertwining Ruby Red Spiral Ribbons
    // Primary Red Ribbon (Curving S-Swirl)
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.85, cy - r * 0.45);
    ctx.bezierCurveTo(
      cx - r * 0.4,
      cy - r * 0.9,
      cx + r * 0.1,
      cy - r * 0.1,
      cx + r * 0.75,
      cy - r * 0.55
    );
    ctx.bezierCurveTo(
      cx + r * 0.9,
      cy - r * 0.2,
      cx + r * 0.3,
      cy + r * 0.4,
      cx - r * 0.35,
      cy + r * 0.85
    );
    ctx.bezierCurveTo(
      cx - r * 0.75,
      cy + r * 0.8,
      cx - r * 0.15,
      cy + r * 0.15,
      cx - r * 0.85,
      cy - r * 0.45
    );
    ctx.closePath();
    const redGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    redGrad.addColorStop(0.0, '#b71c1c'); // Deep crimson ruby
    redGrad.addColorStop(0.4, '#d32f2f'); // Radiant scarlet
    redGrad.addColorStop(0.7, '#f44336'); // Vibrant bright red
    redGrad.addColorStop(1.0, '#b71c1c');
    ctx.fillStyle = redGrad;
    ctx.fill();

    // Secondary Red Swirl Core Accent
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.2, cy - r * 0.6);
    ctx.bezierCurveTo(
      cx + r * 0.55,
      cy - r * 0.45,
      cx + r * 0.65,
      cy + r * 0.35,
      cx + r * 0.15,
      cy + r * 0.75
    );
    ctx.bezierCurveTo(
      cx + r * 0.4,
      cy + r * 0.2,
      cx + r * 0.35,
      cy - r * 0.25,
      cx - r * 0.2,
      cy - r * 0.6
    );
    ctx.closePath();
    ctx.fillStyle = '#c62828';
    ctx.fill();

    // 3. Intertwining Golden Sunshine Yellow Spiral Ribbons
    // Primary Yellow Ribbon winding alongside the red swirl
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy + r * 0.35);
    ctx.bezierCurveTo(
      cx - r * 0.5,
      cy - r * 0.25,
      cx - r * 0.05,
      cy - r * 0.55,
      cx + r * 0.55,
      cy - r * 0.75
    );
    ctx.bezierCurveTo(
      cx + r * 0.75,
      cy - r * 0.5,
      cx + r * 0.15,
      cy - r * 0.3,
      cx - r * 0.25,
      cy + r * 0.05
    );
    ctx.bezierCurveTo(
      cx - r * 0.45,
      cy + r * 0.3,
      cx - r * 0.2,
      cy + r * 0.7,
      cx - r * 0.7,
      cy + r * 0.35
    );
    ctx.closePath();
    const yellowGrad = ctx.createLinearGradient(cx - r, cy + r, cx + r, cy - r);
    yellowGrad.addColorStop(0.0, '#f57f17'); // Rich amber gold
    yellowGrad.addColorStop(0.35, '#ffeb3b'); // Blazing lemon yellow
    yellowGrad.addColorStop(0.7, '#fff59d'); // Pastel yellow highlight
    yellowGrad.addColorStop(1.0, '#fbc02d');
    ctx.fillStyle = yellowGrad;
    ctx.fill();

    // Fine ribbon highlight filaments
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, cy - r * 0.15);
    ctx.quadraticCurveTo(cx + r * 0.1, cy - r * 0.35, cx + r * 0.55, cy - r * 0.65);
    ctx.stroke();

    // 4. Internal Glass Depth Vignette (shading layer giving 3D spherical depth to swirls)
    const depthGrad = ctx.createRadialGradient(
      cx - r * 0.2,
      cy - r * 0.2,
      r * 0.25,
      cx,
      cy,
      r
    );
    depthGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.08)');
    depthGrad.addColorStop(0.65, 'rgba(120, 20, 20, 0.12)');
    depthGrad.addColorStop(0.92, 'rgba(60, 5, 5, 0.45)');
    depthGrad.addColorStop(1.0, 'rgba(25, 0, 0, 0.85)');
    ctx.fillStyle = depthGrad;
    ctx.fillRect(0, 0, size, size);

    // 5. Crisp outer glass contour rim
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#260a0a';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    canvas.refresh();
    return key;
  },

  ensureOverlayTexture(textures: Phaser.Textures.TextureManager, radius: number): string | null {
    const key = `marble_glass_swirl_overlay_${radius}`;
    if (textures.exists(key)) return key;

    const size = radius * 2 + 4;
    const canvas = textures.createCanvas(key, size, size);
    if (!canvas) return null;

    const ctx = canvas.getContext();
    const cx = size / 2;
    const cy = size / 2;
    const r = radius;

    // 1. Primary Hot Specular Glare (curved glass reflection top-left)
    const hx = cx - r * 0.32;
    const hy = cy - r * 0.32;

    const specGrad = ctx.createRadialGradient(
      hx,
      hy,
      0,
      hx,
      hy,
      r * 0.42
    );
    specGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)'); // Blinding white core
    specGrad.addColorStop(0.22, 'rgba(255, 255, 255, 0.92)');
    specGrad.addColorStop(0.48, 'rgba(255, 250, 240, 0.40)');
    specGrad.addColorStop(0.80, 'rgba(255, 245, 230, 0.10)');
    specGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.beginPath();
    ctx.arc(hx, hy, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = specGrad;
    ctx.fill();

    // 2. Secondary Pinpoint Specular Glint
    const g2x = cx - r * 0.12;
    const g2y = cy - r * 0.46;
    ctx.beginPath();
    ctx.arc(g2x, g2y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();

    // 3. Bottom-Right Caustic Internal Glass Refraction Glow
    const causticGrad = ctx.createRadialGradient(
      cx + r * 0.30,
      cy + r * 0.34,
      r * 0.15,
      cx + r * 0.30,
      cy + r * 0.34,
      r * 0.70
    );
    causticGrad.addColorStop(0.0, 'rgba(255, 235, 120, 0.32)');
    causticGrad.addColorStop(0.5, 'rgba(255, 200, 80, 0.12)');
    causticGrad.addColorStop(1.0, 'rgba(255, 180, 50, 0.0)');

    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.2, 0, Math.PI * 2);
    ctx.fillStyle = causticGrad;
    ctx.fill();

    canvas.refresh();
    return key;
  },

  drawShadow(g: Phaser.GameObjects.Graphics, radius: number): void {
    g.clear();
    // Warm amber-tinted contact drop shadow
    g.fillStyle(0x281206, 0.28);
    g.fillEllipse(0, radius + 1, radius * 1.5, 6.5);
  },
};
