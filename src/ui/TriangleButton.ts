import Phaser from 'phaser';
import { ThemeManager } from '../themes/themeManager';

export interface TriangleButtonConfig {
  x: number;
  y: number;
  direction: 'left' | 'right';
  size?: number; // Base width of the triangle (default: 44px)
  onPointerDown: () => void;
}

/**
 * TRIANGLE BUTTON COMPONENT
 *
 * Renders an interactive tactile triangle button (pointing Left or Right)
 * drawn dynamically USING THE ACTIVE BAR TEXTURE (Classic Wood or Neon Halogen).
 *
 * Sinks and springs with tactile recoil on press, and automatically redraws
 * when the Surface texture changes.
 */
export function createTriangleButton(
  scene: Phaser.Scene,
  config: TriangleButtonConfig
): Phaser.GameObjects.Container {
  const container = scene.add.container(config.x, config.y);

  const w = config.size || 44;
  const h = (w * 1.05); // Balanced equilateral/isosceles aspect ratio
  const dir = config.direction === 'left' ? -1 : 1;

  // Visual Graphics objects
  const shadowG = scene.add.graphics();
  const faceG = scene.add.graphics();
  const highlightG = scene.add.graphics();

  container.add([shadowG, faceG, highlightG]);

  // Triangle vertices relative to local center
  const getPoints = (offsetX: number = 0, offsetY: number = 0) => {
    // dir === -1 (Left): tip at (-w/2, 0), right base at (+w/2, -h/2) and (+w/2, +h/2)
    // dir === 1 (Right): tip at (+w/2, 0), left base at (-w/2, -h/2) and (-w/2, +h/2)
    const tipX = (dir * w) / 2 + offsetX;
    const tipY = 0 + offsetY;
    const baseX = (-dir * w) / 2 + offsetX;
    const topY = -h / 2 + offsetY;
    const botY = h / 2 + offsetY;

    return {
      tip: { x: tipX, y: tipY },
      top: { x: baseX, y: topY },
      bot: { x: baseX, y: botY },
    };
  };

  /**
   * Draws the triangle button using the active Bar theme's texture and materials.
   */
  const drawTriangle = () => {
    shadowG.clear();
    faceG.clear();
    highlightG.clear();

    const surface = ThemeManager.getActiveSurfacePackage();
    const isNeon = surface.id === 'neonHalogen';

    const pts = getPoints();

    if (isNeon) {
      // --- NEON GLOWING GREEN HALOGEN BAR TEXTURE ---
      // 1. Outermost soft aura
      highlightG.lineStyle(10, 0x16a34a, 0.20);
      highlightG.beginPath();
      highlightG.moveTo(pts.tip.x, pts.tip.y);
      highlightG.lineTo(pts.top.x, pts.top.y);
      highlightG.lineTo(pts.bot.x, pts.bot.y);
      highlightG.closePath();
      highlightG.strokePath();

      highlightG.lineStyle(5, 0x22c55e, 0.45);
      highlightG.strokePath();

      // 2. Translucent halogen emerald glass face
      faceG.fillStyle(0x064e3b, 0.95);
      faceG.beginPath();
      faceG.moveTo(pts.tip.x, pts.tip.y);
      faceG.lineTo(pts.top.x, pts.top.y);
      faceG.lineTo(pts.bot.x, pts.bot.y);
      faceG.closePath();
      faceG.fillPath();

      // 3. Inner neon gas core
      faceG.fillStyle(0x15803d, 0.65);
      const innerScale = 0.68;
      faceG.beginPath();
      faceG.moveTo(pts.tip.x * innerScale, pts.tip.y * innerScale);
      faceG.lineTo(pts.top.x * innerScale, pts.top.y * innerScale);
      faceG.lineTo(pts.bot.x * innerScale, pts.bot.y * innerScale);
      faceG.closePath();
      faceG.fillPath();

      // 4. White-hot neon filament arrow pointer inside the triangle
      faceG.lineStyle(2.5, 0xf0fff4, 1.0);
      faceG.beginPath();
      faceG.moveTo((-dir * w) / 4, 0);
      faceG.lineTo((dir * w) / 3, 0);
      faceG.strokePath();

      // 5. Crisp neon outline
      faceG.lineStyle(2.2, 0x39ff14, 1.0);
      faceG.beginPath();
      faceG.moveTo(pts.tip.x, pts.tip.y);
      faceG.lineTo(pts.top.x, pts.top.y);
      faceG.lineTo(pts.bot.x, pts.bot.y);
      faceG.closePath();
      faceG.strokePath();
    } else {
      // --- CLASSIC NATURAL WOOD BAR TEXTURE ---
      // 1. Soft contact drop shadow underneath
      const sPts = getPoints(0, 4);
      shadowG.fillStyle(0x3a2c1d, 0.32);
      shadowG.beginPath();
      shadowG.moveTo(sPts.tip.x, sPts.tip.y);
      shadowG.lineTo(sPts.top.x, sPts.top.y);
      shadowG.lineTo(sPts.bot.x, sPts.bot.y);
      shadowG.closePath();
      shadowG.fillPath();

      // 2. Base warm wood fill
      faceG.fillStyle(0x9c6638, 1.0);
      faceG.beginPath();
      faceG.moveTo(pts.tip.x, pts.tip.y);
      faceG.lineTo(pts.top.x, pts.top.y);
      faceG.lineTo(pts.bot.x, pts.bot.y);
      faceG.closePath();
      faceG.fillPath();

      // 3. Subtle horizontal wood grain fiber lines (same styling as wood bar)
      const grains = [
        { y: -h * 0.25, col: 0xb57c4c, a: 0.38, lw: 1.5 },
        { y: -h * 0.05, col: 0x7c4e27, a: 0.30, lw: 1.8 },
        { y: h * 0.15, col: 0xb57c4c, a: 0.35, lw: 1.5 },
        { y: h * 0.30, col: 0x7c4e27, a: 0.28, lw: 1.4 },
      ];

      grains.forEach((g) => {
        // Calculate intersection bounds along triangle horizontal line at y
        const t = Math.abs(g.y) / (h / 2); // 0 at center, 1 at top/bot
        const spanW = w * (1 - t);
        const startX = -dir * (w / 2) + dir * 3;
        const endX = startX + dir * (spanW - 6);

        faceG.lineStyle(g.lw, g.col, g.a);
        faceG.lineBetween(startX, g.y, endX, g.y);
      });

      // 4. Perimeter dark wood contour bevel
      faceG.lineStyle(2.0, 0x5a3617, 0.70);
      faceG.beginPath();
      faceG.moveTo(pts.tip.x, pts.tip.y);
      faceG.lineTo(pts.top.x, pts.top.y);
      faceG.lineTo(pts.bot.x, pts.bot.y);
      faceG.closePath();
      faceG.strokePath();

      // Top edge lighter wood highlight
      faceG.lineStyle(1.4, 0xb57c4c, 0.75);
      faceG.beginPath();
      if (dir === -1) {
        // Left pointing: top edge is from base to tip
        faceG.moveTo(pts.top.x, pts.top.y);
        faceG.lineTo(pts.tip.x, pts.tip.y);
      } else {
        // Right pointing: top edge is from base to tip
        faceG.moveTo(pts.top.x, pts.top.y);
        faceG.lineTo(pts.tip.x, pts.tip.y);
      }
      faceG.strokePath();
    }
  };

  // Initial draw
  drawTriangle();

  // Redraw when Surface / Bar texture changes
  const unsubscribe = ThemeManager.onSurfaceChanged(() => {
    drawTriangle();
  });
  container.once(Phaser.GameObjects.Events.DESTROY, () => {
    unsubscribe();
  });

  // Dedicated interactive hit area (+26px padding for effortless thumb touch)
  const hitW = w + 26;
  const hitH = h + 26;
  const zone = scene.add.zone(0, 0, hitW, hitH);
  zone.setInteractive({ useHandCursor: true });
  container.add(zone);

  let isPressed = false;
  zone.on('pointerdown', () => {
    if (isPressed) return;
    isPressed = true;

    // Tactile press sink
    container.setScale(0.88);
    container.y = config.y + 2;

    scene.time.delayedCall(70, () => {
      scene.tweens.add({
        targets: container,
        scale: 1.0,
        y: config.y,
        duration: 90,
        ease: 'Back.easeOut',
        onComplete: () => {
          isPressed = false;
          config.onPointerDown();
        },
      });
    });
  });

  const resetState = () => {
    if (!isPressed) {
      container.setScale(1.0);
      container.y = config.y;
    }
  };
  zone.on('pointerout', resetState);
  zone.on('pointercancel', resetState);

  return container;
}
