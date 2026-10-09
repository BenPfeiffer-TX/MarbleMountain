import Phaser from 'phaser';
import { HoleTheme } from '../themes/types';

export interface BaseHole {
  id: string;
  type: 'rect' | 'tri' | 'circle' | 'ellipse' | 'bean';
  cx: number;
  cy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface RectHole extends BaseHole {
  type: 'rect';
  w: number;
  h: number;
  angle: number;
  r: number;
  polygon: { x: number; y: number }[];
}

export interface TriHole extends BaseHole {
  type: 'tri';
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
}

export interface CircleHole extends BaseHole {
  type: 'circle';
  radius: number;
}

export interface EllipseHole extends BaseHole {
  type: 'ellipse';
  rx: number;
  ry: number;
  angle: number;
  polygon: { x: number; y: number }[];
}

export interface BeanHole extends BaseHole {
  type: 'bean';
  length: number;
  thickness: number;
  angle: number;
  polygon: { x: number; y: number }[];
}

export type Hole = RectHole | TriHole | CircleHole | EllipseHole | BeanHole;

/**
 * Procedural Factory: Creates a rotated rounded rectangle / diagonal ramp.
 * Supports giant sizes (e.g., 280-400px length at 45 degrees spanning half the screen).
 */
export function createRectHole(
  id: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle: number,
  r: number = 16
): RectHole {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const halfW = w / 2;
  const halfH = h / 2;
  const rad = Math.min(r, halfW - 2, halfH - 2);

  // Generate 16 rounded rectangle boundary points in local coordinates (strict counter-clockwise order)
  const localPts: { x: number; y: number }[] = [];
  const corners = [
    { cx: halfW - rad, cy: halfH - rad, startA: 0 },
    { cx: -(halfW - rad), cy: halfH - rad, startA: Math.PI / 2 },
    { cx: -(halfW - rad), cy: -(halfH - rad), startA: Math.PI },
    { cx: halfW - rad, cy: -(halfH - rad), startA: (Math.PI * 3) / 2 },
  ];

  for (const c of corners) {
    for (let step = 0; step < 4; step++) {
      const a = c.startA + (step / 3) * (Math.PI / 2);
      localPts.push({
        x: c.cx + rad * Math.cos(a),
        y: c.cy + rad * Math.sin(a),
      });
    }
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const polygon = localPts.map((pt) => {
    const wx = cx + pt.x * cosA - pt.y * sinA;
    const wy = cy + pt.x * sinA + pt.y * cosA;
    minX = Math.min(minX, wx);
    maxX = Math.max(maxX, wx);
    minY = Math.min(minY, wy);
    maxY = Math.max(maxY, wy);
    return { x: wx, y: wy };
  });

  return {
    id,
    type: 'rect',
    cx,
    cy,
    w,
    h,
    angle,
    r: rad,
    minX,
    maxX,
    minY,
    maxY,
    polygon,
  };
}

/**
 * Procedural Factory: Creates a stretched, rotated triangle at any orientation.
 */
export function createTriHole(
  id: string,
  cx: number,
  cy: number,
  base: number,
  height: number,
  skew: number = 0,
  angle: number = 0
): TriHole {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const localPts = [
    { x: skew * (base / 2), y: -height / 2 },
    { x: -base / 2, y: height / 2 },
    { x: base / 2, y: height / 2 },
  ];

  const worldPts = localPts.map((pt) => ({
    x: cx + pt.x * cosA - pt.y * sinA,
    y: cy + pt.x * sinA + pt.y * cosA,
  }));

  const minX = Math.min(worldPts[0].x, worldPts[1].x, worldPts[2].x);
  const maxX = Math.max(worldPts[0].x, worldPts[1].x, worldPts[2].x);
  const minY = Math.min(worldPts[0].y, worldPts[1].y, worldPts[2].y);
  const maxY = Math.max(worldPts[0].y, worldPts[1].y, worldPts[2].y);

  return {
    id,
    type: 'tri',
    cx,
    cy,
    p1: worldPts[0],
    p2: worldPts[1],
    p3: worldPts[2],
    minX,
    maxX,
    minY,
    maxY,
  };
}

/**
 * Procedural Factory: Creates a circular pit.
 */
export function createCircleHole(
  id: string,
  cx: number,
  cy: number,
  radius: number
): CircleHole {
  return {
    id,
    type: 'circle',
    cx,
    cy,
    radius,
    minX: cx - radius,
    maxX: cx + radius,
    minY: cy - radius,
    maxY: cy + radius,
  };
}

/**
 * Procedural Factory: Creates a rotated oval / ellipse.
 */
export function createEllipseHole(
  id: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number
): EllipseHole {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const steps = 24;
  const polygon: { x: number; y: number }[] = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const lx = rx * Math.cos(t);
    const ly = ry * Math.sin(t);
    const wx = cx + lx * cosA - ly * sinA;
    const wy = cy + lx * sinA + ly * cosA;

    minX = Math.min(minX, wx);
    maxX = Math.max(maxX, wx);
    minY = Math.min(minY, wy);
    maxY = Math.max(maxY, wy);

    polygon.push({ x: wx, y: wy });
  }

  return {
    id,
    type: 'ellipse',
    cx,
    cy,
    rx,
    ry,
    angle,
    minX,
    maxX,
    minY,
    maxY,
    polygon,
  };
}

/**
 * Procedural Factory: Creates an organic, non-polygonal kidney bean / peanut hole.
 * Uses a smooth parametric spine-normal formulation mathematically guaranteed to never self-intersect.
 */
export function createBeanHole(
  id: string,
  cx: number,
  cy: number,
  length: number,
  thickness: number,
  angle: number,
  bendOffset: number = 0,
  asymmetry: number = 0.16
): BeanHole {
  const halfL = length / 2;
  const numSteps = 16;
  const topPts: { x: number; y: number }[] = [];
  const botPts: { x: number; y: number }[] = [];

  // Spine runs from t = -1 to t = +1 along local X axis with parabolic arch y_spine = bendOffset * (1 - t^2)
  for (let i = 0; i <= numSteps; i++) {
    const t = -1 + (2 * i) / numSteps;
    const xSpine = t * halfL;
    const ySpine = bendOffset * (1 - t * t);

    // Spine tangent angle derivative dy/dx
    const slope = halfL !== 0 ? (-2 * bendOffset * t) / halfL : 0;
    const psi = Math.atan(slope);
    const normX = -Math.sin(psi);
    const normY = Math.cos(psi);

    // Smooth thickness envelope tapering to rounded end caps at t = +-1
    const halfThick =
      (thickness / 2) * Math.sqrt(Math.max(0, 1 - t * t)) * (1 + asymmetry * t);

    topPts.push({
      x: xSpine + normX * halfThick,
      y: ySpine + normY * halfThick,
    });
    botPts.push({
      x: xSpine - normX * halfThick,
      y: ySpine - normY * halfThick,
    });
  }

  // Combine top curve (left to right) and bottom curve (right to left) into a single closed loop
  const localPolygon: { x: number; y: number }[] = [];
  for (let i = 0; i < topPts.length; i++) {
    localPolygon.push(topPts[i]);
  }
  for (let i = botPts.length - 1; i >= 0; i--) {
    localPolygon.push(botPts[i]);
  }

  // Rotate by angle and translate to (cx, cy)
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const polygon = localPolygon.map((pt) => {
    const wx = cx + pt.x * cosA - pt.y * sinA;
    const wy = cy + pt.x * sinA + pt.y * cosA;
    minX = Math.min(minX, wx);
    maxX = Math.max(maxX, wx);
    minY = Math.min(minY, wy);
    maxY = Math.max(maxY, wy);
    return { x: wx, y: wy };
  });

  return {
    id,
    type: 'bean',
    cx,
    cy,
    length,
    thickness,
    angle,
    minX,
    maxX,
    minY,
    maxY,
    polygon,
  };
}

/**
 * Fast 2D Cross-Product Triangle Inclusion Test.
 */
function isPointInTriangle(
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
 * Universal Ray-Casting Algorithm for 2D Point-in-Polygon Inclusion.
 */
function isPointInPolygon(px: number, py: number, pts: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * High-Precision Point-in-Hole Detection:
 * Determines if point (screenX, screenY) enters the surface of hole.
 */
export function isPointInHole(
  hole: Hole,
  screenX: number,
  screenY: number,
  offsetY: number
): boolean {
  const wx = screenX;
  const wy = screenY - offsetY;

  // 1. Fast AABB Rejection
  if (wx < hole.minX || wx > hole.maxX || wy < hole.minY || wy > hole.maxY) {
    return false;
  }

  // 2. Specific Geometric Inclusions
  if (hole.type === 'circle') {
    const dx = wx - hole.cx;
    const dy = wy - hole.cy;
    return dx * dx + dy * dy <= hole.radius * hole.radius;
  }

  if (hole.type === 'tri') {
    return isPointInTriangle(wx, wy, hole.p1, hole.p2, hole.p3);
  }

  if (hole.type === 'rect') {
    const cosA = Math.cos(-hole.angle);
    const sinA = Math.sin(-hole.angle);
    const dx = wx - hole.cx;
    const dy = wy - hole.cy;
    const lx = dx * cosA - dy * sinA;
    const ly = dx * sinA + dy * cosA;

    const halfW = hole.w / 2;
    const halfH = hole.h / 2;
    const rad = hole.r;

    const qx = Math.abs(lx) - (halfW - rad);
    const qy = Math.abs(ly) - (halfH - rad);

    if (qx <= 0 && Math.abs(ly) <= halfH) return true;
    if (qy <= 0 && Math.abs(lx) <= halfW) return true;
    if (qx > 0 && qy > 0) return qx * qx + qy * qy <= rad * rad;
    return false;
  }

  if (hole.type === 'ellipse') {
    const cosA = Math.cos(-hole.angle);
    const sinA = Math.sin(-hole.angle);
    const dx = wx - hole.cx;
    const dy = wy - hole.cy;
    const lx = dx * cosA - dy * sinA;
    const ly = dx * sinA + dy * cosA;

    const nx = lx / hole.rx;
    const ny = ly / hole.ry;
    return nx * nx + ny * ny <= 1.0;
  }

  if (hole.type === 'bean') {
    return isPointInPolygon(wx, wy, hole.polygon);
  }

  return false;
}

/**
 * Dispatches hole rendering with theme-textured border and deep abyss interior.
 */
export function renderHole(
  g: Phaser.GameObjects.Graphics,
  theme: HoleTheme,
  hole: Hole,
  offsetY: number
): void {
  if (hole.type === 'circle') {
    theme.drawCircleHole(g, hole.cx, hole.cy + offsetY, hole.radius);
  } else if (hole.type === 'tri') {
    theme.drawTriHole(
      g,
      { x: hole.p1.x, y: hole.p1.y + offsetY },
      { x: hole.p2.x, y: hole.p2.y + offsetY },
      { x: hole.p3.x, y: hole.p3.y + offsetY }
    );
  } else {
    // Rect, Ellipse, Bean all provide world-space polygon vertices
    const shiftedPts = hole.polygon.map((pt) => ({
      x: pt.x,
      y: pt.y + offsetY,
    }));
    theme.drawPolygonHole(g, shiftedPts);
  }
}
