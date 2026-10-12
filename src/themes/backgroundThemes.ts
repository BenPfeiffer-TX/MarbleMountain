import Phaser from 'phaser';
import { BackgroundTheme } from './types';
import { BACKGROUND_CONFIG } from '../config/backgroundConfig';

/**
 * DEFAULT BACKGROUND THEME: DIFFUSE PASTEL GRADIENT WITH CONSTRUCTION PAPER GRAIN
 */
export const pastelPaperBackgroundTheme: BackgroundTheme = {
  id: 'pastelPaper',
  name: 'Pastel Paper',
  textureKey: 'diffusePastelGradient',
  hasPaperOverlay: true,

  ensureTexture(textures: Phaser.Textures.TextureManager): string {
    const key = this.textureKey;
    if (textures.exists(key)) return key;

    const textureH = BACKGROUND_CONFIG.gradientCanvasHeight;
    const canvas = textures.createCanvas(key, 32, textureH);
    if (!canvas) return key;

    const ctx = canvas.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, textureH);

    const colors = BACKGROUND_CONFIG.gradientColors;
    const loopColors = [...colors, colors[0]];
    loopColors.forEach((c, idx) => {
      const stop = idx / (loopColors.length - 1);
      grad.addColorStop(stop, `rgb(${c.r}, ${c.g}, ${c.b})`);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, textureH);
    canvas.refresh();
    return key;
  },
};

/**
 * NEW BACKGROUND THEME: GREYISH-BLACK CROSS STITCH (ZOOMED-IN SUIT FABRIC)
 *
 * Implements:
 * - A seamless 64x64 microscopic woven textile lattice.
 * - Alternating diagonal cross-stitch yarns (warp & weft threads) with authentic
 *   fiber highlights, tactile depth, and tonal charcoal/black wool variation.
 * - Scrolls continuously without visible seams.
 */
export const suitFabricBackgroundTheme: BackgroundTheme = {
  id: 'suitFabric',
  name: 'Suit Fabric',
  textureKey: 'background_suit_fabric',
  hasPaperOverlay: false,

  ensureTexture(textures: Phaser.Textures.TextureManager): string {
    const key = this.textureKey;
    if (textures.exists(key)) return key;

    const tileSize = 64;
    const canvas = textures.createCanvas(key, tileSize, tileSize);
    if (!canvas) return key;

    const ctx = canvas.getContext();

    // 1. Deep charcoal-black worsted wool suiting base
    ctx.fillStyle = '#16171a';
    ctx.fillRect(0, 0, tileSize, tileSize);

    // 2. Microscopic woven cross-stitch threads (8x8 pixel grid cells)
    const cellSize = 8;
    const cols = tileSize / cellSize;
    const rows = tileSize / cellSize;

    // Pseudo-random deterministic hash for natural yarn fiber tonal micro-variations
    const hash = (x: number, y: number) => {
      const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x0 = c * cellSize;
        const y0 = r * cellSize;
        const hVal = hash(c, r);

        // Yarn color lightness modulation (+- 10%)
        const lightBoost = (hVal - 0.5) * 16;
        const warpBase = Math.round(56 + lightBoost);
        const weftBase = Math.round(48 + lightBoost);

        // --- STITCH 1: Top-Left to Bottom-Right (Warp Yarn) ---
        // Shadow underneath
        ctx.strokeStyle = '#0c0d0f';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x0 + 0.5, y0 + 1.2);
        ctx.lineTo(x0 + cellSize + 0.5, y0 + cellSize + 1.2);
        ctx.stroke();

        // Yarn thread body
        ctx.strokeStyle = `rgb(${warpBase}, ${warpBase + 2}, ${warpBase + 6})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + cellSize, y0 + cellSize);
        ctx.stroke();

        // Yarn highlight thread (raised 3D center sheen)
        ctx.strokeStyle = `rgba(135, 142, 155, ${0.45 + hVal * 0.25})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x0 + 0.5, y0 + 0.5);
        ctx.lineTo(x0 + cellSize - 0.5, y0 + cellSize - 0.5);
        ctx.stroke();

        // --- STITCH 2: Bottom-Left to Top-Right (Weft Yarn Crossing Over) ---
        // Shadow underneath
        ctx.strokeStyle = '#090a0c';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x0 + 0.5, y0 + cellSize + 1.2);
        ctx.lineTo(x0 + cellSize + 0.5, y0 + 1.2);
        ctx.stroke();

        // Yarn thread body
        ctx.strokeStyle = `rgb(${weftBase}, ${weftBase + 1}, ${weftBase + 4})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(x0, y0 + cellSize);
        ctx.lineTo(x0 + cellSize, y0);
        ctx.stroke();

        // Yarn highlight thread (raised 3D center sheen)
        ctx.strokeStyle = `rgba(120, 126, 138, ${0.40 + hVal * 0.25})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x0 + 0.5, y0 + cellSize - 0.5);
        ctx.lineTo(x0 + cellSize - 0.5, y0 + 0.5);
        ctx.stroke();

        // Interlocking woven intersection pip (simulates warp/weft compression)
        ctx.fillStyle = `rgba(18, 19, 22, 0.45)`;
        ctx.fillRect(x0 + cellSize / 2 - 1, y0 + cellSize / 2 - 1, 2, 2);
      }
    }

    canvas.refresh();
    return key;
  },
};

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  pastelPaperBackgroundTheme,
  suitFabricBackgroundTheme,
];
