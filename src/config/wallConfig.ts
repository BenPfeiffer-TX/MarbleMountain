/**
 * CONFIGURATION & PARAMETERS FOR PROCEDURAL WALL HOLES & SPEED GAUGE
 */

export const WALL_CONFIG = {
  // Motion & Speed
  scrollSpeed: 70, // Pixels per second (downward mountain wall progression)

  // Tick Marks (Speed Gauge along left and right edges)
  tickSpacing: 70, // Pixels between ticks (exactly 1 tick mark passes bar every second at 70px/s)
  tickMajorInterval: 5, // Every 5th tick mark is extended (major altitude marker)
  tickMajorLength: 18, // Length of major tick in px
  tickMinorLength: 10, // Length of minor tick in px
  tickWidth: 2, // Stroke width of ticks
  tickLeftX: 8, // X origin of left tick gauge
  tickRightX: 712, // X origin of right tick gauge

  // Continuous Procedural Obstacle Distribution
  stepMinY: 55, // Fine-grained vertical advance for dense obstacles (px)
  stepMaxY: 85, // Vertical advance max step (px)
  minHoleGap: 16, // Minimum clearance buffer between distinct holes (px)
  minSafeCorridorWidth: 68, // Tight safe corridor requiring high player precision (marble diameter is 50px)
  corridorLeftX: 165, // Safe corridor reaches far left
  corridorRightX: 555, // Safe corridor reaches far right
  corridorSwingMinY: 120, // Vertical distance for safe corridor to swing side-to-side (fast, frantic pacing)
  corridorSwingMaxY: 160,
  initialBottomRatio: 0.58, // Shapes start at ~58% of screen height (nearer to the bar for immediate action)

  // Giant Half-Screen Spanning Shapes (45-degree diagonal barriers & sharp wedges)
  giantRectMinLength: 260,
  giantRectMaxLength: 380, // Spans half the 720px screen!
  giantRectMinThickness: 70,
  giantRectMaxThickness: 105,

  // Giant & Medium Sharp Triangles / Wedges
  giantTriMinBase: 190,
  giantTriMaxBase: 310,
  giantTriMinHeight: 140,
  giantTriMaxHeight: 230,
  medTriMinBase: 110,
  medTriMaxBase: 190,
  medTriMinHeight: 90,
  medTriMaxHeight: 160,

  // Giant & Medium Ellipses / Ovals
  giantEllipseMinRx: 95,
  giantEllipseMaxRx: 140,
  giantEllipseMinRy: 48,
  giantEllipseMaxRy: 75,
  medEllipseMinRx: 55,
  medEllipseMaxRx: 90,
  medEllipseMinRy: 35,
  medEllipseMaxRy: 55,

  // Medium Rectangles
  medRectMinLength: 140,
  medRectMaxLength: 220,
  medRectMinThickness: 55,
  medRectMaxThickness: 80,

  // Organic Kidney Beans (tuned to be a balanced accent, not dominant)
  beanMinLength: 160,
  beanMaxLength: 260,
  beanMinThickness: 60,
  beanMaxThickness: 85,

  // Non-Polygonal Shapes: Circular Pits
  circleMinRadius: 30,
  circleMaxRadius: 52, // Clean circular pits (diameter 60-104px)

  // Playable Boundaries within the 720px viewport
  playableMarginLeft: 45,
  playableMarginRight: 675,

  // Visual Appearance
  holeBgColor: 0x050507, // Deep pitch black interior
  holeInnerShadowAlpha: 0.45, // Soft ambient occlusion along top-left inner rim
  borderWidth: 4.5, // Thicker theme border width
};
