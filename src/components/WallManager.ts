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
  private corridorAnchors: { y: number; x: number }[] = []; // Smooth meandering corridor control points

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
   * Generates a dense, organic obstacle field starting halfway down the screen.
   */
  public startSpawning(): void {
    if (this.isScrolling) return;
    this.isScrolling = true;

    if (this.holes.length === 0) {
      const h = this.scene.scale.height;
      this.highestGeneratedY = h * (WALL_CONFIG.initialBottomRatio ?? 0.50);
      this.corridorAnchors = [];
      // Pre-generate dense continuous obstacle field upward past the top of viewport
      this.generateUpTo(-400);
      this.renderAll(h);
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
    this.corridorAnchors = [];
    this.holes = [];
    this.holesGraphics.clear();
    this.ticksGraphics.clear();
  }

  /**
   * Continuous Procedural Generator:
   * Advances upward in fine-grained, jittered vertical steps to create a dense,
   * organic, non-linear scattering of triangular and rectangular holes.
   */
  private generateUpTo(targetTopY: number): void {
    this.ensureCorridorAnchorsUpTo(targetTopY - 250);

    while (this.highestGeneratedY > targetTopY) {
      const stepY = Phaser.Math.Between(WALL_CONFIG.stepMinY, WALL_CONFIG.stepMaxY);
      this.highestGeneratedY -= stepY;
      this.generateStepAtY(this.highestGeneratedY);
    }
  }

  /**
   * Ensures smooth corridor anchor points exist up to targetTopY.
   */
  private ensureCorridorAnchorsUpTo(targetTopY: number): void {
    const minCenter = WALL_CONFIG.playableMarginLeft + WALL_CONFIG.minSafeCorridorWidth / 2 + 15;
    const maxCenter = WALL_CONFIG.playableMarginRight - WALL_CONFIG.minSafeCorridorWidth / 2 - 15;

    if (this.corridorAnchors.length === 0) {
      const initialY = this.highestGeneratedY + 120;
      const initialX = (minCenter + maxCenter) / 2;
      this.corridorAnchors.push({ y: initialY, x: initialX });
    }

    while (this.corridorAnchors[this.corridorAnchors.length - 1].y > targetTopY) {
      const last = this.corridorAnchors[this.corridorAnchors.length - 1];
      const nextY = last.y - WALL_CONFIG.corridorAnchorStep;
      const shift = Phaser.Math.Between(
        -WALL_CONFIG.maxCorridorShiftPerAnchor,
        WALL_CONFIG.maxCorridorShiftPerAnchor
      );
      const nextX = Phaser.Math.Clamp(last.x + shift, minCenter, maxCenter);
      this.corridorAnchors.push({ y: nextY, x: nextX });
    }
  }

  /**
   * Computes the exact center of the safe corridor at vertical coordinate Y using smoothstep.
   */
  private getSafeCorridorCenterX(y: number): number {
    if (this.corridorAnchors.length === 0) {
      return (WALL_CONFIG.playableMarginLeft + WALL_CONFIG.playableMarginRight) / 2;
    }
    if (y >= this.corridorAnchors[0].y) {
      return this.corridorAnchors[0].x;
    }
    if (y <= this.corridorAnchors[this.corridorAnchors.length - 1].y) {
      return this.corridorAnchors[this.corridorAnchors.length - 1].x;
    }

    for (let i = 0; i < this.corridorAnchors.length - 1; i++) {
      const a0 = this.corridorAnchors[i];
      const a1 = this.corridorAnchors[i + 1];
      if (y <= a0.y && y >= a1.y) {
        const t = (a0.y - y) / (a0.y - a1.y);
        const smoothT = t * t * (3 - 2 * t);
        return a0.x + (a1.x - a0.x) * smoothT;
      }
    }
    return this.corridorAnchors[this.corridorAnchors.length - 1].x;
  }

  /**
   * Returns the extreme envelope of the safe corridor across vertical span [yTop, yBottom].
   */
  private getSafeCorridorSpan(yTop: number, yBottom: number): { minLeft: number; maxRight: number } {
    const halfW = WALL_CONFIG.minSafeCorridorWidth / 2;
    let minLeft = Infinity;
    let maxRight = -Infinity;

    const step = 20;
    for (let y = yTop; y <= yBottom; y += step) {
      const cx = this.getSafeCorridorCenterX(y);
      minLeft = Math.min(minLeft, cx - halfW);
      maxRight = Math.max(maxRight, cx + halfW);
    }
    const cxBottom = this.getSafeCorridorCenterX(yBottom);
    minLeft = Math.min(minLeft, cxBottom - halfW);
    maxRight = Math.max(maxRight, cxBottom + halfW);

    return { minLeft, maxRight };
  }

  /**
   * Mathematical Solvability Invariant:
   * Verifies that the candidate hole does not encroach into the guaranteed safe corridor.
   */
  private isHoleSafeFromCorridor(x1: number, x2: number, y1: number, y2: number): boolean {
    const { minLeft, maxRight } = this.getSafeCorridorSpan(y1, y2);
    const margin = 14;
    return x2 <= minLeft - margin || x1 >= maxRight + margin;
  }

  /**
   * Minimum Separation Check:
   * Ensures holes do not awkwardly overlap one another, keeping their wooden borders crisp.
   */
  private doesHoleOverlapExisting(x1: number, x2: number, y1: number, y2: number): boolean {
    const gap = WALL_CONFIG.minHoleGap;
    const expX1 = x1 - gap;
    const expX2 = x2 + gap;
    const expY1 = y1 - gap;
    const expY2 = y2 + gap;

    for (const h of this.holes) {
      let hx1: number, hx2: number, hy1: number, hy2: number;
      if (h.type === 'rect') {
        hx1 = h.x;
        hx2 = h.x + h.w;
        hy1 = h.y;
        hy2 = h.y + h.h;
      } else {
        hx1 = Math.min(h.p1.x, h.p2.x, h.p3.x);
        hx2 = Math.max(h.p1.x, h.p2.x, h.p3.x);
        hy1 = Math.min(h.p1.y, h.p2.y, h.p3.y);
        hy2 = Math.max(h.p1.y, h.p2.y, h.p3.y);
      }

      if (hy2 < expY1 || hy1 > expY2) continue;
      if (expX1 < hx2 && expX2 > hx1 && expY1 < hy2 && expY2 > hy1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates candidates across the horizontal slice at baseY.
   */
  private generateStepAtY(baseY: number): void {
    const minX = WALL_CONFIG.playableMarginLeft;
    const maxX = WALL_CONFIG.playableMarginRight;
    const safe = this.getSafeCorridorSpan(baseY - 70, baseY + 70);

    const leftMaxX = safe.minLeft - 14;
    const rightMinX = safe.maxRight + 14;

    const leftW = leftMaxX - minX;
    const rightW = maxX - rightMinX;

    const canLeft = leftW >= 80;
    const canRight = rightW >= 80;

    // High attempt probability (85%) ensures rich obstacle density
    let tryLeft = canLeft && Math.random() < 0.85;
    let tryRight = canRight && Math.random() < 0.85;

    // Guarantee at least one side is attempted to prevent empty gaps
    if (!tryLeft && !tryRight) {
      if (canLeft && (!canRight || leftW >= rightW)) {
        tryLeft = true;
      } else if (canRight) {
        tryRight = true;
      }
    }

    if (tryLeft) {
      this.tryPlaceHoleInRegion(minX, leftMaxX, baseY);
    }
    if (tryRight) {
      this.tryPlaceHoleInRegion(rightMinX, maxX, baseY);
    }
  }

  /**
   * Places 1 or 2 staggered candidate holes within an available horizontal region.
   */
  private tryPlaceHoleInRegion(regionMinX: number, regionMaxX: number, baseY: number): boolean {
    const availW = regionMaxX - regionMinX;
    if (availW < 75) return false;

    // If region is wide (>= 230px), place 2 staggered holes with varied Y
    const shouldSplit = availW >= 230 && Math.random() < 0.50;
    if (shouldSplit) {
      const halfW = availW / 2;
      const h1 = this.createCandidateHole(
        regionMinX,
        regionMinX + halfW - 8,
        baseY + Phaser.Math.Between(-28, 28)
      );
      const h2 = this.createCandidateHole(
        regionMinX + halfW + 8,
        regionMaxX,
        baseY + Phaser.Math.Between(-28, 28)
      );
      return h1 || h2;
    } else {
      const jitterY = Phaser.Math.Between(-30, 30);
      return this.createCandidateHole(regionMinX, regionMaxX, baseY + jitterY);
    }
  }

  /**
   * Attempts to generate a single hole (rectangle or triangle) within [minX, maxX] at targetY.
   */
  private createCandidateHole(minX: number, maxX: number, targetY: number): boolean {
    const availW = maxX - minX;
    if (availW < 75) return false;

    const isTriangle = Math.random() > 0.48;

    for (let attempt = 0; attempt < 3; attempt++) {
      if (isTriangle) {
        const baseW = Phaser.Math.Clamp(
          Phaser.Math.Between(WALL_CONFIG.triMinBase, WALL_CONFIG.triMaxBase),
          75,
          availW - 4
        );
        const triH = Phaser.Math.Between(WALL_CONFIG.triMinHeight, WALL_CONFIG.triMaxHeight);
        const maxStartX = maxX - baseW - 2;
        const minStartX = minX + 2;
        if (maxStartX < minStartX) continue;

        const startX = Phaser.Math.Between(minStartX, maxStartX);
        const isInverted = Math.random() > 0.5;

        const p1 = isInverted
          ? { x: startX, y: targetY }
          : { x: startX + baseW / 2, y: targetY };
        const p2 = isInverted
          ? { x: startX + baseW, y: targetY }
          : { x: startX, y: targetY + triH };
        const p3 = isInverted
          ? { x: startX + baseW / 2, y: targetY + triH }
          : { x: startX + baseW, y: targetY + triH };

        const x1 = startX;
        const x2 = startX + baseW;
        const y1 = targetY;
        const y2 = targetY + triH;

        if (
          this.isHoleSafeFromCorridor(x1, x2, y1, y2) &&
          !this.doesHoleOverlapExisting(x1, x2, y1, y2)
        ) {
          this.holes.push({
            type: 'tri',
            id: `hole_${this.nextHoleId++}`,
            p1,
            p2,
            p3,
          });
          return true;
        }
      } else {
        const rectW = Phaser.Math.Clamp(
          Phaser.Math.Between(WALL_CONFIG.rectMinWidth, WALL_CONFIG.rectMaxWidth),
          75,
          availW - 4
        );
        const rectH = Phaser.Math.Between(WALL_CONFIG.rectMinHeight, WALL_CONFIG.rectMaxHeight);
        const maxStartX = maxX - rectW - 2;
        const minStartX = minX + 2;
        if (maxStartX < minStartX) continue;

        const rectX = Phaser.Math.Between(minStartX, maxStartX);
        const x1 = rectX;
        const x2 = rectX + rectW;
        const y1 = targetY;
        const y2 = targetY + rectH;

        if (
          this.isHoleSafeFromCorridor(x1, x2, y1, y2) &&
          !this.doesHoleOverlapExisting(x1, x2, y1, y2)
        ) {
          this.holes.push({
            type: 'rect',
            id: `hole_${this.nextHoleId++}`,
            x: rectX,
            y: targetY,
            w: rectW,
            h: rectH,
            r: WALL_CONFIG.rectCornerRadius,
          });
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Main per-frame update loop called from MainScene.
   */
  public updateWall(dt: number, screenHeight: number): void {
    if (this.isScrolling) {
      this.wallOffsetY += WALL_CONFIG.scrollSpeed * dt;

      // Generate new obstacles ahead above the viewport
      const screenTopInWallSpace = -this.wallOffsetY;
      this.generateUpTo(screenTopInWallSpace - 400);

      // Cull holes that have scrolled past the bottom of the screen
      const screenBottomInWallSpace = screenHeight - this.wallOffsetY + 150;
      this.holes = this.holes.filter((h) => {
        if (h.type === 'rect') {
          return h.y <= screenBottomInWallSpace;
        } else {
          return Math.min(h.p1.y, h.p2.y, h.p3.y) <= screenBottomInWallSpace;
        }
      });

      // Cull old corridor anchors far below the screen
      this.corridorAnchors = this.corridorAnchors.filter(
        (a) => a.y <= screenBottomInWallSpace + 300
      );
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
