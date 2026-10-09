import Phaser from 'phaser';
import { WALL_CONFIG } from '../config/wallConfig';
import { ThemeManager } from '../themes/themeManager';
import {
  Hole,
  createRectHole,
  createTriHole,
  createCircleHole,
  createEllipseHole,
  createBeanHole,
  isPointInHole,
  renderHole,
} from './wallShapes';

export type { Hole };

/**
 * WALL MANAGER COMPONENT
 *
 * Implements:
 * 1. Procedural generation of organic shapes: long angled slots/capsules, stretched rotated triangles,
 *    circles, rotated ellipses, and organic curved kidney beans.
 * 2. Dynamic S-curve weaving safe corridor ensuring obstacles cut across the center, forcing active player tilt control.
 * 3. Strict solvability invariant (every horizontal slice is guaranteed a navigable opening >= 115px).
 * 4. High-density, non-linear staggered obstacle distribution with no horizontal rows or lines.
 * 5. Synchronized altitude tick speed gauge (1 tick/sec).
 * 6. High-precision point-in-hole collision tests and thematic rendering.
 */
export class WallManager extends Phaser.GameObjects.Container {
  private holesGraphics!: Phaser.GameObjects.Graphics;
  private ticksGraphics!: Phaser.GameObjects.Graphics;

  private isScrolling: boolean = false;
  private wallOffsetY: number = 0; // Cumulative downward scroll offset (px)
  private highestGeneratedY: number = 0; // Top-most generated wall Y coordinate
  private corridorAnchors: { y: number; x: number }[] = []; // Smooth S-curve corridor control points
  private corridorTargetSide: 'left' | 'right' = 'left';

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
   * Generates a dense, organic obstacle field starting halfway down the screen with
   * immediate obstacles in the center requiring player action.
   */
  public startSpawning(): void {
    if (this.isScrolling) return;
    this.isScrolling = true;

    if (this.holes.length === 0) {
      const h = this.scene.scale.height;
      this.highestGeneratedY = h * (WALL_CONFIG.initialBottomRatio ?? 0.50);
      this.corridorAnchors = [];
      // Pre-generate dense continuous obstacle field upward past the top of viewport
      this.generateUpTo(-450);
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
   * Advances upward in fine-grained vertical steps, placing varied organic shapes.
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
   * Constructs the meandering S-curve safe corridor spine.
   * Alternates target side between Left (X ~ 195) and Right (X ~ 525), forcing obstacles
   * to cut directly across the center of the board.
   */
  private ensureCorridorAnchorsUpTo(targetTopY: number): void {
    const minCenter = WALL_CONFIG.playableMarginLeft + WALL_CONFIG.minSafeCorridorWidth / 2 + 15;
    const maxCenter = WALL_CONFIG.playableMarginRight - WALL_CONFIG.minSafeCorridorWidth / 2 - 15;

    if (this.corridorAnchors.length === 0) {
      const initialY = this.highestGeneratedY + 100;
      this.corridorAnchors.push({ y: initialY, x: 360 });
      // Alternate target side immediately so the first obstacles arrive in the center
      this.corridorTargetSide = Math.random() > 0.5 ? 'left' : 'right';
    }

    while (this.corridorAnchors[this.corridorAnchors.length - 1].y > targetTopY) {
      const last = this.corridorAnchors[this.corridorAnchors.length - 1];
      const nextY = last.y - WALL_CONFIG.corridorAnchorStep;

      const targetX =
        this.corridorTargetSide === 'left' ? WALL_CONFIG.corridorLeftX : WALL_CONFIG.corridorRightX;

      const step = 65;
      let nextX = last.x;
      if (Math.abs(last.x - targetX) <= step) {
        nextX = targetX;
        // Reached target side: toggle to the other side for the next stretch
        this.corridorTargetSide = this.corridorTargetSide === 'left' ? 'right' : 'left';
      } else {
        nextX = last.x + Math.sign(targetX - last.x) * step;
      }

      // Add gentle organic wobble
      nextX += Phaser.Math.Between(-12, 12);
      nextX = Phaser.Math.Clamp(nextX, minCenter, maxCenter);

      this.corridorAnchors.push({ y: nextY, x: nextX });
    }
  }

  /**
   * Evaluates the safe corridor center X at vertical coordinate Y using smoothstep.
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
   * Returns the extreme horizontal envelope of the safe corridor across vertical span [yTop, yBottom].
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
   * Solvability Invariant:
   * Ensures the candidate hole does not encroach into the guaranteed safe corridor.
   */
  private isHoleSafeFromCorridor(hole: Hole): boolean {
    const { minLeft, maxRight } = this.getSafeCorridorSpan(hole.minY, hole.maxY);
    const margin = 14;
    return hole.maxX <= minLeft - margin || hole.minX >= maxRight + margin;
  }

  /**
   * Separation Check:
   * Ensures holes do not awkwardly overlap each other, keeping borders distinct.
   */
  private doesHoleOverlapExisting(candidate: Hole): boolean {
    const gap = WALL_CONFIG.minHoleGap;
    const cMinX = candidate.minX - gap;
    const cMaxX = candidate.maxX + gap;
    const cMinY = candidate.minY - gap;
    const cMaxY = candidate.maxY + gap;

    for (const h of this.holes) {
      if (h.maxY < cMinY || h.minY > cMaxY) continue;
      if (cMinX < h.maxX && cMaxX > h.minX && cMinY < h.maxY && cMaxY > h.minY) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates candidate obstacles across the horizontal slice at baseY.
   */
  private generateStepAtY(baseY: number): void {
    const minX = WALL_CONFIG.playableMarginLeft;
    const maxX = WALL_CONFIG.playableMarginRight;
    const safe = this.getSafeCorridorSpan(baseY - 70, baseY + 70);

    const leftMaxX = safe.minLeft - 14;
    const rightMinX = safe.maxRight + 14;

    const leftW = leftMaxX - minX;
    const rightW = maxX - rightMinX;

    const canLeft = leftW >= 75;
    const canRight = rightW >= 75;

    // High attempt probability (88%) ensures rich obstacle density
    let tryLeft = canLeft && Math.random() < 0.88;
    let tryRight = canRight && Math.random() < 0.88;

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
   * Wide regions are preserved to host giant half-screen spanning obstacles.
   */
  private tryPlaceHoleInRegion(regionMinX: number, regionMaxX: number, baseY: number): boolean {
    const availW = regionMaxX - regionMinX;
    if (availW < 75) return false;

    // Only split occasionally (20% of the time) when wide so giant half-screen shapes dominate
    const shouldSplit = availW >= 290 && Math.random() < 0.20;
    if (shouldSplit) {
      const halfW = availW / 2;
      const h1 = this.createCandidateHole(
        regionMinX,
        regionMinX + halfW - 10,
        baseY + Phaser.Math.Between(-28, 28)
      );
      const h2 = this.createCandidateHole(
        regionMinX + halfW + 10,
        regionMaxX,
        baseY + Phaser.Math.Between(-28, 28)
      );
      return h1 || h2;
    } else {
      const jitterY = Phaser.Math.Between(-25, 25);
      return this.createCandidateHole(regionMinX, regionMaxX, baseY + jitterY);
    }
  }

  /**
   * Creates a randomized candidate hole supporting giant half-screen obstacles,
   * organic kidney beans, rotated diagonal ramps, circles, ellipses, and triangles.
   */
  private createCandidateHole(minX: number, maxX: number, targetY: number): boolean {
    const availW = maxX - minX;
    if (availW < 70) return false;

    for (let attempt = 0; attempt < 4; attempt++) {
      const id = `hole_${this.nextHoleId++}`;
      let candidate: Hole | null = null;

      // When region is wide (>= 220px), prioritize Giant half-screen spanning obstacles
      const canBeGiant = availW >= 220;
      const roll = Math.random();

      if (canBeGiant && roll < 0.45) {
        // 1. GIANT 45-DEGREE RECTANGLE / RAMP (spanning half the screen)
        const length = Phaser.Math.Clamp(
          Phaser.Math.Between(WALL_CONFIG.giantRectMinLength, WALL_CONFIG.giantRectMaxLength),
          220,
          Math.min(availW * 1.35, 390)
        );
        const thickness = Phaser.Math.Between(
          WALL_CONFIG.giantRectMinThickness,
          WALL_CONFIG.giantRectMaxThickness
        );
        // Angle at ~45 degrees (+-38 to +-50 deg)
        const angleSign = Math.random() > 0.5 ? 1 : -1;
        const angleDeg = angleSign * Phaser.Math.Between(38, 50);
        const angle = Phaser.Math.DegToRad(angleDeg);
        const cx = (minX + maxX) / 2 + Phaser.Math.Between(-20, 20);

        candidate = createRectHole(id, cx, targetY, length, thickness, angle, 18);
      } else if (canBeGiant && roll < 0.75) {
        // 2. GIANT ORGANIC CURVED KIDNEY BEAN
        const length = Phaser.Math.Clamp(
          Phaser.Math.Between(WALL_CONFIG.giantBeanMinLength, WALL_CONFIG.giantBeanMaxLength),
          200,
          Math.min(availW * 1.25, 370)
        );
        const thickness = Phaser.Math.Between(
          WALL_CONFIG.giantBeanMinThickness,
          WALL_CONFIG.giantBeanMaxThickness
        );
        const angleDeg = Phaser.Math.Between(-45, 45);
        const angle = Phaser.Math.DegToRad(angleDeg);
        const bendOffset = Phaser.Math.Between(-24, 24);
        const cx = (minX + maxX) / 2 + Phaser.Math.Between(-20, 20);

        candidate = createBeanHole(id, cx, targetY, length, thickness, angle, bendOffset);
      } else {
        // 3. MEDIUM & COMPACT VARIETY
        const subRoll = Math.random();
        if (subRoll < 0.28) {
          // Medium Angled Rectangle / Capsule Slot
          const length = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.medRectMinLength, WALL_CONFIG.medRectMaxLength),
            90,
            availW - 6
          );
          const thickness = Phaser.Math.Between(
            WALL_CONFIG.medRectMinThickness,
            WALL_CONFIG.medRectMaxThickness
          );
          const angle = Phaser.Math.FloatBetween(-Phaser.Math.DegToRad(50), Phaser.Math.DegToRad(50));
          const cx = (minX + maxX) / 2 + Phaser.Math.Between(-15, 15);

          candidate = createRectHole(id, cx, targetY, length, thickness, angle, 14);
        } else if (subRoll < 0.52) {
          // Medium Organic Bean
          const length = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.medBeanMinLength, WALL_CONFIG.medBeanMaxLength),
            85,
            availW - 6
          );
          const thickness = Phaser.Math.Between(
            WALL_CONFIG.medBeanMinThickness,
            WALL_CONFIG.medBeanMaxThickness
          );
          const angle = Phaser.Math.FloatBetween(-Phaser.Math.DegToRad(45), Phaser.Math.DegToRad(45));
          const bendOffset = Phaser.Math.Between(-18, 18);
          const cx = (minX + maxX) / 2 + Phaser.Math.Between(-15, 15);

          candidate = createBeanHole(id, cx, targetY, length, thickness, angle, bendOffset);
        } else if (subRoll < 0.72) {
          // Stretched & Rotated Triangle
          const base = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.triMinBase, WALL_CONFIG.triMaxBase),
            85,
            availW - 6
          );
          const height = Phaser.Math.Between(WALL_CONFIG.triMinHeight, WALL_CONFIG.triMaxHeight);
          const skew = Phaser.Math.FloatBetween(-0.35, 0.35);
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const cx = (minX + maxX) / 2 + Phaser.Math.Between(-15, 15);

          candidate = createTriHole(id, cx, targetY, base, height, skew, angle);
        } else if (subRoll < 0.88) {
          // Rotated Ellipse / Oval
          const rx = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.ellipseMinRx, WALL_CONFIG.ellipseMaxRx),
            45,
            availW / 2 - 4
          );
          const ry = Phaser.Math.Between(WALL_CONFIG.ellipseMinRy, WALL_CONFIG.ellipseMaxRy);
          const angle = Phaser.Math.FloatBetween(-Phaser.Math.DegToRad(45), Phaser.Math.DegToRad(45));
          const cx = (minX + maxX) / 2 + Phaser.Math.Between(-12, 12);

          candidate = createEllipseHole(id, cx, targetY, rx, ry, angle);
        } else {
          // Circular Pit (distinct hazard)
          const radius = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.circleMinRadius, WALL_CONFIG.circleMaxRadius),
            28,
            availW / 2 - 4
          );
          const cx = (minX + maxX) / 2 + Phaser.Math.Between(-12, 12);

          candidate = createCircleHole(id, cx, targetY, radius);
        }
      }

      if (
        candidate &&
        this.isHoleSafeFromCorridor(candidate) &&
        !this.doesHoleOverlapExisting(candidate)
      ) {
        this.holes.push(candidate);
        return true;
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
      this.generateUpTo(screenTopInWallSpace - 450);

      // Cull holes that have scrolled past the bottom of the screen
      const screenBottomInWallSpace = screenHeight - this.wallOffsetY + 150;
      this.holes = this.holes.filter((h) => h.maxY <= screenBottomInWallSpace);

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

    // 1. Draw Visible Holes
    this.holesGraphics.clear();
    for (const hole of this.holes) {
      const screenMinY = hole.minY + this.wallOffsetY;
      const screenMaxY = hole.maxY + this.wallOffsetY;
      if (screenMaxY < -60 || screenMinY > screenHeight + 60) continue;

      renderHole(this.holesGraphics, theme, hole, this.wallOffsetY);
    }

    // 2. Draw Speed Gauge Tick Marks along left and right edges
    this.ticksGraphics.clear();
    const tickSpacing = WALL_CONFIG.tickSpacing;
    const offsetMod = this.wallOffsetY % tickSpacing;

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
      if (isPointInHole(hole, screenX, screenY, this.wallOffsetY)) {
        return hole;
      }
    }
    return null;
  }

  /**
   * Returns screen coordinates of the geometric center / centroid of a hole.
   */
  public getHoleScreenCenter(hole: Hole): { x: number; y: number } {
    return {
      x: hole.cx,
      y: hole.cy + this.wallOffsetY,
    };
  }

  public getScrollSpeed(): number {
    return WALL_CONFIG.scrollSpeed;
  }

  public isWallScrolling(): boolean {
    return this.isScrolling;
  }
}
