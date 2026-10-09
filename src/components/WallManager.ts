import Phaser from 'phaser';
import { WALL_CONFIG } from '../config/wallConfig';
import { ThemeManager } from '../themes/themeManager';

export interface RectHole {
  type: 'rect';
  id: string;
  x: number; // Top-left X in wall coordinate space
  y: number; // Top-left Y in wall coordinate space
  w: number;
  h: number;
  r: number;
}

export interface TriHole {
  type: 'tri';
  id: string;
  p1: { x: number; y: number }; // In wall coordinate space
  p2: { x: number; y: number };
  p3: { x: number; y: number };
}

export type Hole = RectHole | TriHole;

/**
 * WALL MANAGER COMPONENT
 *
 * Controls:
 * 1. Procedural generation of triangular and rectangular wall holes.
 * 2. Strict solvability invariant (every horizontal slice has a guaranteed safe passage corridor).
 * 3. Wall scrolling motion and speed.
 * 4. Speed gauge altitude tick marks along screen edges (1 tick passes bar every second).
 * 5. High-precision point-in-hole collision detection.
 * 6. Dynamic theme integration via ThemeManager.
 */
export class WallManager extends Phaser.GameObjects.Container {
  private holesGraphics!: Phaser.GameObjects.Graphics;
  private ticksGraphics!: Phaser.GameObjects.Graphics;

  private isScrolling: boolean = false;
  private wallOffsetY: number = 0; // Cumulative vertical scroll offset
  private highestGeneratedY: number = 0; // Top-most generated wall Y coordinate
  private lastSafeCorridorX: number = 360; // Center of safe corridor of previous band

  private holes: Hole[] = [];
  private unsubscribeTheme?: () => void;

  private nextHoleId: number = 1;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.createVisualLayers();

    // Subscribe to theme switches
    this.unsubscribeTheme = ThemeManager.onThemeChanged(() => {
      this.renderAll();
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.unsubscribeTheme) {
        this.unsubscribeTheme();
      }
    });

    scene.add.existing(this);
    this.setDepth(2); // Behind the bar (depth 10) and marble (depth 15)
  }

  private createVisualLayers(): void {
    this.holesGraphics = this.scene.add.graphics();
    this.ticksGraphics = this.scene.add.graphics();

    this.add(this.holesGraphics);
    this.add(this.ticksGraphics);
  }

  /**
   * Starts downward wall progression.
   * Called as soon as the marble finishes its arrival bounce animation.
   */
  public startSpawning(): void {
    if (this.isScrolling) return;
    this.isScrolling = true;

    // First pattern appears at the top of the screen (Y <= 0) moving downward
    if (this.holes.length === 0) {
      this.highestGeneratedY = 0;
      this.lastSafeCorridorX = (WALL_CONFIG.playableMarginLeft + WALL_CONFIG.playableMarginRight) / 2;
      // Pre-generate initial bands above the viewport
      this.generateBandsUpTo(-WALL_CONFIG.bandHeight * 2);
    }
  }

  /**
   * Stops wall progression (e.g., during Game Over or pause).
   */
  public stopScrolling(): void {
    this.isScrolling = false;
  }

  /**
   * Resets wall state for a new game session.
   */
  public reset(): void {
    this.isScrolling = false;
    this.wallOffsetY = 0;
    this.highestGeneratedY = 0;
    this.lastSafeCorridorX = (WALL_CONFIG.playableMarginLeft + WALL_CONFIG.playableMarginRight) / 2;
    this.holes = [];
    this.holesGraphics.clear();
    this.ticksGraphics.clear();
  }

  /**
   * Procedural Generation: Generates bands upward until reaching targetTopY.
   */
  private generateBandsUpTo(targetTopY: number): void {
    while (this.highestGeneratedY > targetTopY) {
      const bandTopY = this.highestGeneratedY - WALL_CONFIG.bandHeight;
      this.generateBand(bandTopY, WALL_CONFIG.bandHeight);
      this.highestGeneratedY = bandTopY - WALL_CONFIG.bandGap;
    }
  }

  /**
   * Generates a single horizontal band of procedural holes with guaranteed solvability.
   */
  private generateBand(bandTopY: number, bandH: number): void {
    const minX = WALL_CONFIG.playableMarginLeft;
    const maxX = WALL_CONFIG.playableMarginRight;
    const safeW = WALL_CONFIG.minSafeCorridorWidth;

    // 1. Choose safe corridor position, smoothly constrained to avoid sudden huge jumps
    const maxShift = WALL_CONFIG.maxSafeCorridorShift;
    const minCenter = minX + safeW / 2;
    const maxCenter = maxX - safeW / 2;

    const shiftedMin = Math.max(minCenter, this.lastSafeCorridorX - maxShift);
    const shiftedMax = Math.min(maxCenter, this.lastSafeCorridorX + maxShift);
    const safeCenterX = Phaser.Math.Between(Math.floor(shiftedMin), Math.floor(shiftedMax));
    this.lastSafeCorridorX = safeCenterX;

    const safeLeft = safeCenterX - safeW / 2;
    const safeRight = safeCenterX + safeW / 2;

    // 2. Left Region: [minX, safeLeft - 18]
    const leftRegionW = (safeLeft - 18) - minX;
    if (leftRegionW >= WALL_CONFIG.rectMinWidth) {
      this.populateRegionHoles(minX, safeLeft - 18, bandTopY, bandH);
    }

    // 3. Right Region: [safeRight + 18, maxX]
    const rightRegionW = maxX - (safeRight + 18);
    if (rightRegionW >= WALL_CONFIG.rectMinWidth) {
      this.populateRegionHoles(safeRight + 18, maxX, bandTopY, bandH);
    }
  }

  /**
   * Places 1 or 2 procedural holes (rectangle or triangle) within a bounded region.
   */
  private populateRegionHoles(
    regionLeft: number,
    regionRight: number,
    bandTopY: number,
    bandH: number
  ): void {
    const regionW = regionRight - regionLeft;
    // If region is wide (> 240px), place up to 2 holes; otherwise place 1 hole
    const holeCount = regionW > 240 && Math.random() > 0.4 ? 2 : 1;

    const slotW = regionW / holeCount;
    for (let i = 0; i < holeCount; i++) {
      const slotLeft = regionLeft + i * slotW + 8;
      const slotRight = regionLeft + (i + 1) * slotW - 8;
      const availableW = slotRight - slotLeft;

      if (availableW < 60) continue;

      const isTriangle = Math.random() > 0.5;
      const holeY = bandTopY + Phaser.Math.Between(10, Math.max(12, bandH - 95));

      if (isTriangle) {
        // Procedural Triangle Hole
        const baseW = Phaser.Math.Clamp(
          Phaser.Math.Between(WALL_CONFIG.triMinBase, WALL_CONFIG.triMaxBase),
          55,
          availableW
        );
        const triH = Phaser.Math.Between(WALL_CONFIG.triMinHeight, WALL_CONFIG.triMaxHeight);
        const startX = Phaser.Math.Between(slotLeft, slotRight - baseW);
        const isInverted = Math.random() > 0.5;

        let p1: { x: number; y: number };
        let p2: { x: number; y: number };
        let p3: { x: number; y: number };

        if (!isInverted) {
          // Upright Triangle (Apex at top center)
          p1 = { x: startX + baseW / 2, y: holeY };
          p2 = { x: startX, y: holeY + triH };
          p3 = { x: startX + baseW, y: holeY + triH };
        } else {
          // Inverted Triangle (Apex pointing downward)
          p1 = { x: startX, y: holeY };
          p2 = { x: startX + baseW, y: holeY };
          p3 = { x: startX + baseW / 2, y: holeY + triH };
        }

        this.holes.push({
          type: 'tri',
          id: `hole_${this.nextHoleId++}`,
          p1,
          p2,
          p3,
        });
      } else {
        // Procedural Rectangle Hole
        const rectW = Phaser.Math.Clamp(
          Phaser.Math.Between(WALL_CONFIG.rectMinWidth, WALL_CONFIG.rectMaxWidth),
          60,
          availableW
        );
        const rectH = Phaser.Math.Between(WALL_CONFIG.rectMinHeight, WALL_CONFIG.rectMaxHeight);
        const rectX = Phaser.Math.Between(slotLeft, slotRight - rectW);

        this.holes.push({
          type: 'rect',
          id: `hole_${this.nextHoleId++}`,
          x: rectX,
          y: holeY,
          w: rectW,
          h: rectH,
          r: WALL_CONFIG.rectCornerRadius,
        });
      }
    }
  }

  /**
   * Main per-frame update loop called from MainScene.
   */
  public updateWall(dt: number, screenHeight: number): void {
    if (this.isScrolling) {
      this.wallOffsetY += WALL_CONFIG.scrollSpeed * dt;

      // Generate new bands ahead above the viewport
      const screenTopInWallSpace = -this.wallOffsetY;
      this.generateBandsUpTo(screenTopInWallSpace - WALL_CONFIG.bandHeight * 2);

      // Cull holes that have scrolled past the bottom of the screen
      const screenBottomInWallSpace = screenHeight - this.wallOffsetY + 150;
      this.holes = this.holes.filter((h) => {
        if (h.type === 'rect') {
          return h.y <= screenBottomInWallSpace;
        } else {
          return Math.min(h.p1.y, h.p2.y, h.p3.y) <= screenBottomInWallSpace;
        }
      });
    }

    this.renderAll(screenHeight);
  }

  /**
   * Renders all visible holes and speed gauge tick marks.
   */
  private renderAll(screenHeight: number = 1280): void {
    const theme = ThemeManager.getActiveTheme().hole;

    // 1. Draw Holes
    this.holesGraphics.clear();
    for (const hole of this.holes) {
      if (hole.type === 'rect') {
        const screenY = hole.y + this.wallOffsetY;
        // Viewport frustum culling
        if (screenY + hole.h < -60 || screenY > screenHeight + 60) continue;

        theme.drawRectHole(
          this.holesGraphics,
          hole.x,
          screenY,
          hole.w,
          hole.h,
          hole.r
        );
      } else {
        const p1Y = hole.p1.y + this.wallOffsetY;
        const p2Y = hole.p2.y + this.wallOffsetY;
        const p3Y = hole.p3.y + this.wallOffsetY;

        const minY = Math.min(p1Y, p2Y, p3Y);
        const maxY = Math.max(p1Y, p2Y, p3Y);
        if (maxY < -60 || minY > screenHeight + 60) continue;

        theme.drawTriHole(
          this.holesGraphics,
          { x: hole.p1.x, y: p1Y },
          { x: hole.p2.x, y: p2Y },
          { x: hole.p3.x, y: p3Y }
        );
      }
    }

    // 2. Draw Speed Gauge Tick Marks along left and right edges
    this.ticksGraphics.clear();
    const tickSpacing = WALL_CONFIG.tickSpacing;
    const offsetMod = this.wallOffsetY % tickSpacing;

    // Calculate start index for consistent major/minor tick patterns
    const baseTickIndex = Math.floor(this.wallOffsetY / tickSpacing);

    const startY = -tickSpacing + offsetMod;
    let tickCount = 0;
    for (let y = startY; y <= screenHeight + tickSpacing; y += tickSpacing) {
      const currentTickIdx = baseTickIndex - tickCount;
      const isMajor = Math.abs(currentTickIdx) % WALL_CONFIG.tickMajorInterval === 0;
      const length = isMajor ? WALL_CONFIG.tickMajorLength : WALL_CONFIG.tickMinorLength;

      // Left speed gauge (extends right into screen)
      theme.drawTick(this.ticksGraphics, WALL_CONFIG.tickLeftX, y, length, 1, isMajor);

      // Right speed gauge (extends left into screen)
      theme.drawTick(this.ticksGraphics, WALL_CONFIG.tickRightX, y, length, -1, isMajor);

      tickCount++;
    }
  }

  /**
   * Collision Test: Determines if point (x, y) in screen coordinates is inside any hole.
   */
  public getHoleAt(screenX: number, screenY: number): Hole | null {
    for (const hole of this.holes) {
      if (hole.type === 'rect') {
        const hY = hole.y + this.wallOffsetY;
        if (
          screenX >= hole.x &&
          screenX <= hole.x + hole.w &&
          screenY >= hY &&
          screenY <= hY + hole.h
        ) {
          // Inside rectangle bounding box (with corner radius inset)
          const r = hole.r;
          if (
            (screenX < hole.x + r && screenY < hY + r &&
              Phaser.Math.Distance.Between(screenX, screenY, hole.x + r, hY + r) > r) ||
            (screenX > hole.x + hole.w - r && screenY < hY + r &&
              Phaser.Math.Distance.Between(screenX, screenY, hole.x + hole.w - r, hY + r) > r) ||
            (screenX < hole.x + r && screenY > hY + hole.h - r &&
              Phaser.Math.Distance.Between(screenX, screenY, hole.x + r, hY + hole.h - r) > r) ||
            (screenX > hole.x + hole.w - r && screenY > hY + hole.h - r &&
              Phaser.Math.Distance.Between(screenX, screenY, hole.x + hole.w - r, hY + hole.h - r) > r)
          ) {
            continue; // Inside outer corner deadzone of rounded rectangle
          }
          return hole;
        }
      } else {
        // Point in Triangle barycentric test
        const p1 = { x: hole.p1.x, y: hole.p1.y + this.wallOffsetY };
        const p2 = { x: hole.p2.x, y: hole.p2.y + this.wallOffsetY };
        const p3 = { x: hole.p3.x, y: hole.p3.y + this.wallOffsetY };

        if (this.isPointInTriangle(screenX, screenY, p1, p2, p3)) {
          return hole;
        }
      }
    }
    return null;
  }

  /**
   * Computes point-in-triangle inclusion using 2D cross-product orientation signs.
   */
  private isPointInTriangle(
    px: number,
    py: number,
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ): boolean {
    const sign1 = (px - b.x) * (a.y - b.y) - (a.x - b.x) * (py - b.y);
    const sign2 = (px - c.x) * (b.y - c.y) - (b.x - c.x) * (py - c.y);
    const sign3 = (px - a.x) * (c.y - a.y) - (c.x - a.x) * (py - a.y);

    const hasNeg = sign1 < 0 || sign2 < 0 || sign3 < 0;
    const hasPos = sign1 > 0 || sign2 > 0 || sign3 > 0;

    return !(hasNeg && hasPos);
  }

  /**
   * Returns screen coordinates of the geometric center / centroid of a hole.
   */
  public getHoleScreenCenter(hole: Hole): { x: number; y: number } {
    if (hole.type === 'rect') {
      return {
        x: hole.x + hole.w / 2,
        y: hole.y + this.wallOffsetY + hole.h / 2,
      };
    } else {
      return {
        x: (hole.p1.x + hole.p2.x + hole.p3.x) / 3,
        y: (hole.p1.y + hole.p2.y + hole.p3.y) / 3 + this.wallOffsetY,
      };
    }
  }

  public getScrollSpeed(): number {
    return WALL_CONFIG.scrollSpeed;
  }

  public isWallScrolling(): boolean {
    return this.isScrolling;
  }
}
