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
  private corridorWaypoints: { y: number; x: number }[] = []; // Smooth S-curve corridor key turn waypoints
  private corridorTargetSide: 'left' | 'right' = 'left';
  private swingCountSinceCenter: number = 0;

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
      this.highestGeneratedY = h * (WALL_CONFIG.initialBottomRatio ?? 0.58);
      this.corridorWaypoints = [];
      this.swingCountSinceCenter = 0;
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
    this.corridorWaypoints = [];
    this.swingCountSinceCenter = 0;
    this.holes = [];
    this.holesGraphics.clear();
    this.ticksGraphics.clear();
  }

  /**
   * Continuous Procedural Generator:
   * Advances upward in fine-grained vertical steps, placing varied organic shapes.
   */
  private generateUpTo(targetTopY: number): void {
    this.ensureCorridorWaypointsUpTo(targetTopY - 250);

    while (this.highestGeneratedY > targetTopY) {
      const stepY = Phaser.Math.Between(WALL_CONFIG.stepMinY, WALL_CONFIG.stepMaxY);
      this.highestGeneratedY -= stepY;
      this.generateStepAtY(this.highestGeneratedY);
    }
  }

  /**
   * Constructs the frantic, high-skill S-curve corridor path using key turn waypoints.
   * Alternates target side rapidly between Left (X ~ 165) and Right (X ~ 555) every 120-160px
   * of vertical travel (~1.8 - 2.3 seconds at 70px/s), requiring rapid back-and-forth tilt control.
   */
  private ensureCorridorWaypointsUpTo(targetTopY: number): void {
    if (this.corridorWaypoints.length === 0) {
      const initialY = this.highestGeneratedY + 80;
      this.corridorWaypoints.push({ x: 360, y: initialY });

      // Immediate sharp first swing so obstacles arrive in the center
      const firstSide = Math.random() > 0.5 ? 'left' : 'right';
      const firstTargetX =
        firstSide === 'left'
          ? Phaser.Math.Between(WALL_CONFIG.corridorLeftX - 10, WALL_CONFIG.corridorLeftX + 15)
          : Phaser.Math.Between(WALL_CONFIG.corridorRightX - 15, WALL_CONFIG.corridorRightX + 10);
      const firstSwingY = Phaser.Math.Between(
        WALL_CONFIG.corridorSwingMinY,
        WALL_CONFIG.corridorSwingMaxY
      );
      this.corridorWaypoints.push({ x: firstTargetX, y: initialY - firstSwingY });
      this.corridorTargetSide = firstSide === 'left' ? 'right' : 'left';
    }

    while (this.corridorWaypoints[this.corridorWaypoints.length - 1].y > targetTopY) {
      const last = this.corridorWaypoints[this.corridorWaypoints.length - 1];
      const swingY = Phaser.Math.Between(
        WALL_CONFIG.corridorSwingMinY,
        WALL_CONFIG.corridorSwingMaxY
      );
      const nextY = last.y - swingY;

      // Decide target side: mostly alternate left <-> right for frantic back-and-forth,
      // with occasional chicane / center cut (18% chance) after 2 alternating swings
      let nextX: number;
      if (this.swingCountSinceCenter > 2 && Math.random() < 0.18) {
        nextX = Phaser.Math.Between(330, 390); // Center chicane
        this.swingCountSinceCenter = 0;
      } else {
        if (this.corridorTargetSide === 'left') {
          nextX = Phaser.Math.Between(WALL_CONFIG.corridorLeftX - 10, WALL_CONFIG.corridorLeftX + 20);
          this.corridorTargetSide = 'right';
        } else {
          nextX = Phaser.Math.Between(WALL_CONFIG.corridorRightX - 20, WALL_CONFIG.corridorRightX + 10);
          this.corridorTargetSide = 'left';
        }
        this.swingCountSinceCenter++;
      }

      this.corridorWaypoints.push({ x: nextX, y: nextY });
    }
  }

  /**
   * Evaluates the safe corridor center X at vertical coordinate Y using smooth Hermite cubic interpolation.
   */
  public getSafeCorridorCenterX(y: number): number {
    const wps = this.corridorWaypoints;
    if (wps.length === 0) return 360;
    if (y >= wps[0].y) return wps[0].x;
    if (y <= wps[wps.length - 1].y) return wps[wps.length - 1].x;

    for (let i = 0; i < wps.length - 1; i++) {
      const w0 = wps[i];
      const w1 = wps[i + 1];
      if (y <= w0.y && y >= w1.y) {
        const t = (w0.y - y) / (w0.y - w1.y);
        const smoothT = t * t * (3 - 2 * t);
        return w0.x + (w1.x - w0.x) * smoothT;
      }
    }
    return wps[wps.length - 1].x;
  }

  /**
   * Calculates the exact horizontal coverage interval [minX, maxX] of a hole at vertical slice y.
   * Returns null if the hole does not intersect line y.
   */
  private getHoleHorizontalSpanAtY(
    hole: Hole,
    y: number
  ): { minX: number; maxX: number } | null {
    if (y < hole.minY || y > hole.maxY) {
      return null;
    }

    if (hole.type === 'circle') {
      const dy = Math.abs(y - hole.cy);
      if (dy > hole.radius) return null;
      const dx = Math.sqrt(Math.max(0, hole.radius * hole.radius - dy * dy));
      return { minX: hole.cx - dx, maxX: hole.cx + dx };
    }

    // Polygon-based shapes (rect, tri, ellipse, bean)
    const polygon =
      hole.type === 'tri' ? [hole.p1, hole.p2, hole.p3] : hole.polygon;

    const n = polygon.length;
    let minX = Infinity;
    let maxX = -Infinity;
    let hits = 0;

    for (let i = 0; i < n; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % n];

      // Check if horizontal line y intersects edge p1 -> p2
      if ((p1.y <= y && y <= p2.y) || (p2.y <= y && y <= p1.y)) {
        if (Math.abs(p1.y - p2.y) > 0.001) {
          const t = (y - p1.y) / (p2.y - p1.y);
          const x = p1.x + t * (p2.x - p1.x);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          hits++;
        } else {
          minX = Math.min(minX, p1.x, p2.x);
          maxX = Math.max(maxX, p1.x, p2.x);
          hits += 2;
        }
      }
    }

    if (hits === 0 || minX > maxX) {
      return null;
    }

    return { minX, maxX };
  }

  /**
   * Solvability Invariant:
   * Slices vertically across the candidate hole's height [hole.minY, hole.maxY].
   * At each vertical slice y, determines the hole's horizontal coverage [hMin, hMax]
   * and ensures it does not encroach into the guaranteed safe corridor [cMin, cMax].
   * This guarantees that a ball has at least minSafeCorridorWidth clearance at every slice.
   */
  private isHoleSafeFromCorridor(hole: Hole): boolean {
    const halfCorridor = WALL_CONFIG.minSafeCorridorWidth / 2;
    const safetyMargin = 6; // Clearance buffer around safe corridor
    const stepY = 8; // Fine-grained vertical sampling step

    const minY = Math.floor(hole.minY);
    const maxY = Math.ceil(hole.maxY);

    for (let y = minY; y <= maxY; y += stepY) {
      if (!this.isSliceSafe(hole, y, halfCorridor, safetyMargin)) {
        return false;
      }
    }
    // Check exact bottom edge
    if (!this.isSliceSafe(hole, maxY, halfCorridor, safetyMargin)) {
      return false;
    }

    return true;
  }

  private isSliceSafe(
    hole: Hole,
    y: number,
    halfCorridor: number,
    margin: number
  ): boolean {
    const span = this.getHoleHorizontalSpanAtY(hole, y);
    if (!span) return true; // Hole does not exist at this y

    const cx = this.getSafeCorridorCenterX(y);
    const cMin = cx - halfCorridor - margin;
    const cMax = cx + halfCorridor + margin;

    // Fast check: is corridor center point inside hole?
    if (isPointInHole(hole, cx, y, 0)) {
      return false;
    }

    // Check interval overlap: [span.minX, span.maxX] overlaps [cMin, cMax]
    if (span.minX <= cMax && span.maxX >= cMin) {
      return false; // Encroaches on safe corridor!
    }

    return true;
  }

  /**
   * Separation Check:
   * Ensures holes do not awkwardly overlap each other, keeping borders distinct.
   * Uses fast AABB pruning followed by slice-by-slice interval check for candidates with overlapping bounding boxes.
   */
  private doesHoleOverlapExisting(candidate: Hole): boolean {
    const gap = WALL_CONFIG.minHoleGap;
    const cMinX = candidate.minX - gap;
    const cMaxX = candidate.maxX + gap;
    const cMinY = candidate.minY - gap;
    const cMaxY = candidate.maxY + gap;

    for (const h of this.holes) {
      // 1. Fast AABB rejection
      if (h.maxY < cMinY || h.minY > cMaxY) continue;
      if (h.maxX < cMinX || h.minX > cMaxX) continue;

      // 2. Exact slice-by-slice overlap test across the overlapping vertical interval
      const yStart = Math.max(candidate.minY, h.minY);
      const yEnd = Math.min(candidate.maxY, h.maxY);
      const step = 10;

      let overlaps = false;
      for (let y = yStart; y <= yEnd; y += step) {
        const spanC = this.getHoleHorizontalSpanAtY(candidate, y);
        const spanH = this.getHoleHorizontalSpanAtY(h, y);
        if (spanC && spanH) {
          if (spanC.minX - gap <= spanH.maxX && spanC.maxX + gap >= spanH.minX) {
            overlaps = true;
            break;
          }
        }
      }

      if (overlaps) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates candidate obstacles across the horizontal slice at baseY.
   * Guarantees that the wide side gets a primary/giant obstacle, and the narrow side gets an obstacle if space allows.
   */
  private generateStepAtY(baseY: number): void {
    const minPlayX = WALL_CONFIG.playableMarginLeft;
    const maxPlayX = WALL_CONFIG.playableMarginRight;
    const cx = this.getSafeCorridorCenterX(baseY);
    const halfCorridor = WALL_CONFIG.minSafeCorridorWidth / 2;
    const margin = 8;

    const leftMaxX = cx - halfCorridor - margin;
    const rightMinX = cx + halfCorridor + margin;

    const leftW = leftMaxX - minPlayX;
    const rightW = maxPlayX - rightMinX;

    if (rightW >= leftW) {
      // Right side is wider: place major / giant obstacle on the right
      if (rightW >= 70) {
        this.tryPlaceHoleInRegion(rightMinX, maxPlayX, baseY, true);
      }
      // Left side gets a compact obstacle with high probability (80%) if wide enough
      if (leftW >= 70 && Math.random() < 0.80) {
        this.tryPlaceHoleInRegion(minPlayX, leftMaxX, baseY, false);
      }
    } else {
      // Left side is wider: place major / giant obstacle on the left
      if (leftW >= 70) {
        this.tryPlaceHoleInRegion(minPlayX, leftMaxX, baseY, true);
      }
      // Right side gets a compact obstacle with high probability (80%) if wide enough
      if (rightW >= 70 && Math.random() < 0.80) {
        this.tryPlaceHoleInRegion(rightMinX, maxPlayX, baseY, false);
      }
    }
  }

  /**
   * Places 1 or 2 staggered candidate holes within an available horizontal region.
   * Wide regions are preserved to host giant half-screen spanning obstacles.
   */
  private tryPlaceHoleInRegion(
    regionMinX: number,
    regionMaxX: number,
    baseY: number,
    isMajor: boolean
  ): boolean {
    const availW = regionMaxX - regionMinX;
    if (availW < 65) return false;

    // For extremely wide regions (>= 320px) where isMajor is true,
    // occasionally (20% chance) split into 2 obstacles, otherwise preserve full width for giant obstacle
    const shouldSplit = availW >= 320 && Math.random() < 0.20;
    if (shouldSplit) {
      const halfW = availW / 2;
      const h1 = this.createCandidateHole(
        regionMinX,
        regionMinX + halfW - 8,
        baseY + Phaser.Math.Between(-20, 20),
        false
      );
      const h2 = this.createCandidateHole(
        regionMinX + halfW + 8,
        regionMaxX,
        baseY + Phaser.Math.Between(-20, 20),
        false
      );
      return h1 || h2;
    } else {
      const jitterY = Phaser.Math.Between(-20, 20);
      return this.createCandidateHole(regionMinX, regionMaxX, baseY + jitterY, isMajor);
    }
  }

  /**
   * Creates a randomized candidate hole with balanced variety across all shapes:
   * Rectangles (32%), Triangles (26%), Ellipses (18%), Beans (14%), and Circles (10%).
   * Eliminates bias towards beans and supports giant 45-degree ramps and sharp wedges.
   */
  private createCandidateHole(
    minX: number,
    maxX: number,
    targetY: number,
    isMajor: boolean
  ): boolean {
    const availW = maxX - minX;
    if (availW < 65) return false;

    for (let attempt = 0; attempt < 4; attempt++) {
      const id = `hole_${this.nextHoleId++}`;
      let candidate: Hole | null = null;

      // Shape Family Selection:
      // Dominant Rectangles & Triangles (84% total!):
      // 0.00 - 0.48: Rectangles (45° Ramps, Slabs, Steep Dividers, Bars) - 48%
      // 0.48 - 0.84: Triangles (Sharp Wedges, Inclined Ramps, Corner Triangles) - 36%
      // 0.84 - 0.90: Ellipses (Ovals) - 6%
      // 0.90 - 0.95: Beans (Organic Kidney Curves) - 5%
      // 0.95 - 1.00: Circles (Round Pits) - 5%
      const roll = Math.random();
      const canBeGiant = isMajor && availW >= 180;

      if (roll < 0.48) {
        // 1. RECTANGLE / RAMP / SLAB (48%)
        if (canBeGiant) {
          const rectTypeRoll = Math.random();
          if (rectTypeRoll < 0.55) {
            // Giant 45-Degree Diagonal Ramp
            const length = Phaser.Math.Clamp(
              Phaser.Math.Between(WALL_CONFIG.giantRectMinLength, WALL_CONFIG.giantRectMaxLength),
              200,
              Math.min(availW * 1.35, 380)
            );
            const thickness = Phaser.Math.Between(
              WALL_CONFIG.giantRectMinThickness,
              WALL_CONFIG.giantRectMaxThickness
            );
            const angleSign = Math.random() > 0.5 ? 1 : -1;
            const angleDeg = angleSign * Phaser.Math.Between(36, 52);
            const angle = Phaser.Math.DegToRad(angleDeg);
            const hw = (length / 2) * Math.abs(Math.cos(angle)) + (thickness / 2) * Math.abs(Math.sin(angle));
            const minC = minX + hw + 2;
            const maxC = maxX - hw - 2;
            const cx = minC <= maxC ? Phaser.Math.Between(minC, maxC) : (minX + maxX) / 2;
            candidate = createRectHole(id, cx, targetY, length, thickness, angle, 16);
          } else if (rectTypeRoll < 0.82) {
            // Giant Barrier Slab / Low-Angle Ramp
            const length = Phaser.Math.Clamp(
              Phaser.Math.Between(220, 350),
              180,
              availW - 6
            );
            const thickness = Phaser.Math.Between(60, 85);
            const angle = Phaser.Math.FloatBetween(-Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(20));
            const hw = (length / 2) * Math.abs(Math.cos(angle)) + (thickness / 2) * Math.abs(Math.sin(angle));
            const minC = minX + hw + 2;
            const maxC = maxX - hw - 2;
            const cx = minC <= maxC ? Phaser.Math.Between(minC, maxC) : (minX + maxX) / 2;
            candidate = createRectHole(id, cx, targetY, length, thickness, angle, 14);
          } else {
            // Steep Slotted Barrier / Vertical Lane Divider
            const length = Phaser.Math.Clamp(
              Phaser.Math.Between(190, 290),
              160,
              300
            );
            const thickness = Phaser.Math.Between(65, 90);
            const angleSign = Math.random() > 0.5 ? 1 : -1;
            const angle = Phaser.Math.DegToRad(angleSign * Phaser.Math.Between(62, 78));
            const hw = (length / 2) * Math.abs(Math.cos(angle)) + (thickness / 2) * Math.abs(Math.sin(angle));
            const minC = minX + hw + 2;
            const maxC = maxX - hw - 2;
            const cx = minC <= maxC ? Phaser.Math.Between(minC, maxC) : (minX + maxX) / 2;
            candidate = createRectHole(id, cx, targetY, length, thickness, angle, 16);
          }
        } else {
          // Medium Angled Rectangle
          const length = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.medRectMinLength, WALL_CONFIG.medRectMaxLength),
            85,
            availW - 6
          );
          const thickness = Phaser.Math.Between(
            WALL_CONFIG.medRectMinThickness,
            WALL_CONFIG.medRectMaxThickness
          );
          const angle = Phaser.Math.FloatBetween(-Phaser.Math.DegToRad(55), Phaser.Math.DegToRad(55));
          const hw = (length / 2) * Math.abs(Math.cos(angle)) + (thickness / 2) * Math.abs(Math.sin(angle));
          const minC = minX + hw + 2;
          const maxC = maxX - hw - 2;
          const cx = minC <= maxC ? Phaser.Math.Between(minC, maxC) : (minX + maxX) / 2;
          candidate = createRectHole(id, cx, targetY, length, thickness, angle, 12);
        }
      } else if (roll < 0.84) {
        // 2. TRIANGLE / SHARP WEDGE (36%)
        if (canBeGiant) {
          const triTypeRoll = Math.random();
          if (triTypeRoll < 0.60) {
            // Giant Sharp Triangular Wedge
            const base = Phaser.Math.Clamp(
              Phaser.Math.Between(WALL_CONFIG.giantTriMinBase, WALL_CONFIG.giantTriMaxBase),
              180,
              Math.min(availW * 1.15, 310)
            );
            const height = Phaser.Math.Between(
              WALL_CONFIG.giantTriMinHeight,
              WALL_CONFIG.giantTriMaxHeight
            );
            const skew = Phaser.Math.FloatBetween(-0.45, 0.45);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const hw = base * 0.45;
            const minC = minX + hw + 2;
            const maxC = maxX - hw - 2;
            const cx = minC <= maxC ? Phaser.Math.Between(minC, maxC) : (minX + maxX) / 2;
            candidate = createTriHole(id, cx, targetY, base, height, skew, angle);
          } else {
            // Giant Right-Angled / Ramp Triangle
            const base = Phaser.Math.Clamp(
              Phaser.Math.Between(180, 290),
              160,
              availW - 6
            );
            const height = Phaser.Math.Between(130, 220);
            const skew = Math.random() > 0.5 ? 0.85 : -0.85; // Sharp right-angle incline
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const hw = base * 0.45;
            const minC = minX + hw + 2;
            const maxC = maxX - hw - 2;
            const cx = minC <= maxC ? Phaser.Math.Between(minC, maxC) : (minX + maxX) / 2;
            candidate = createTriHole(id, cx, targetY, base, height, skew, angle);
          }
        } else {
          // Medium Sharp Triangle
          const base = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.medTriMinBase, WALL_CONFIG.medTriMaxBase),
            80,
            availW - 6
          );
          const height = Phaser.Math.Between(
            WALL_CONFIG.medTriMinHeight,
            WALL_CONFIG.medTriMaxHeight
          );
          const skew = Phaser.Math.FloatBetween(-0.40, 0.40);
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const hw = base * 0.45;
          const minC = minX + hw + 2;
          const maxC = maxX - hw - 2;
          const cx = minC <= maxC ? Phaser.Math.Between(minC, maxC) : (minX + maxX) / 2;
          candidate = createTriHole(id, cx, targetY, base, height, skew, angle);
        }
      } else if (roll < 0.90) {
        // 3. ELLIPSE / ROTATED OVAL (6%)
        if (canBeGiant) {
          const rx = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.giantEllipseMinRx, WALL_CONFIG.giantEllipseMaxRx),
            85,
            Math.min(availW * 0.65, 140)
          );
          const ry = Phaser.Math.Between(
            WALL_CONFIG.giantEllipseMinRy,
            WALL_CONFIG.giantEllipseMaxRy
          );
          const angle = Phaser.Math.FloatBetween(-Math.PI / 3, Math.PI / 3);
          const cx = (minX + maxX) / 2 + Phaser.Math.Between(-15, 15);
          candidate = createEllipseHole(id, cx, targetY, rx, ry, angle);
        } else {
          const rx = Phaser.Math.Clamp(
            Phaser.Math.Between(WALL_CONFIG.medEllipseMinRx, WALL_CONFIG.medEllipseMaxRx),
            45,
            availW / 2 - 4
          );
          const ry = Phaser.Math.Between(
            WALL_CONFIG.medEllipseMinRy,
            WALL_CONFIG.medEllipseMaxRy
          );
          const angle = Phaser.Math.FloatBetween(-Math.PI / 4, Math.PI / 4);
          const cx = (minX + maxX) / 2 + Phaser.Math.Between(-10, 10);
          candidate = createEllipseHole(id, cx, targetY, rx, ry, angle);
        }
      } else if (roll < 0.95) {
        // 4. ORGANIC KIDNEY BEAN (5% - occasional accent)
        const length = Phaser.Math.Clamp(
          Phaser.Math.Between(WALL_CONFIG.beanMinLength, WALL_CONFIG.beanMaxLength),
          120,
          Math.min(availW * 1.1, 260)
        );
        const thickness = Phaser.Math.Between(
          WALL_CONFIG.beanMinThickness,
          WALL_CONFIG.beanMaxThickness
        );
        const angle = Phaser.Math.FloatBetween(-Math.PI / 3, Math.PI / 3);
        const bendOffset = Phaser.Math.Between(-20, 20);
        const cx = (minX + maxX) / 2 + Phaser.Math.Between(-15, 15);
        candidate = createBeanHole(id, cx, targetY, length, thickness, angle, bendOffset, 0.15);
      } else {
        // 5. CIRCULAR PIT (5%)
        const radius = Phaser.Math.Clamp(
          Phaser.Math.Between(WALL_CONFIG.circleMinRadius, WALL_CONFIG.circleMaxRadius),
          26,
          Math.min(availW / 2 - 4, 52)
        );
        const cx = (minX + maxX) / 2 + Phaser.Math.Between(-10, 10);
        candidate = createCircleHole(id, cx, targetY, radius);
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

      // Cull holes that have scrolled completely past the bottom of the screen.
      // Must check hole.minY (the top edge of the hole), NOT hole.maxY!
      // A hole is only completely off-screen once its top edge has scrolled well past the viewport bottom.
      const cullThresholdY = screenHeight - this.wallOffsetY + 250;
      this.holes = this.holes.filter((h) => h.minY <= cullThresholdY);

      // Cull old corridor waypoints far below the screen
      this.corridorWaypoints = this.corridorWaypoints.filter(
        (a) => a.y <= cullThresholdY + 300
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
      if (screenMaxY < -100 || screenMinY > screenHeight + 100) continue;

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
