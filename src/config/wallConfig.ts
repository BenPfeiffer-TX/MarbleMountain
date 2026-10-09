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
  stepMinY: 50, // Vertical advance min step for dense staggered generation (px)
  stepMaxY: 75, // Vertical advance max step for dense staggered generation (px)
  minHoleGap: 18, // Minimum clearance buffer between distinct holes (px)
  minSafeCorridorWidth: 115, // Guaranteed safe gap width along every horizontal slice (marble diameter is 50px)
  corridorAnchorStep: 80, // Vertical distance between smooth corridor control points
  corridorWavelengthY: 220, // Vertical distance for a full half-weave (side-to-side oscillation)
  corridorLeftX: 195, // Safe corridor target center on the left side
  corridorRightX: 525, // Safe corridor target center on the right side
  initialBottomRatio: 0.50, // Shapes start halfway down the screen (50% viewport height)

  // Long & Angled Rectangles
  rectMinLength: 120,
  rectMaxLength: 250,
  rectMinThickness: 50,
  rectMaxThickness: 90,
  rectMaxAngleDeg: 55, // Degrees of diagonal tilt

  // Stretched & Rotated Triangles
  triMinBase: 90,
  triMaxBase: 180,
  triMinHeight: 80,
  triMaxHeight: 165,

  // Non-Polygonal Shapes: Circles, Ellipses, Beans
  circleMinRadius: 28,
  circleMaxRadius: 52,
  ellipseMinRx: 60,
  ellipseMaxRx: 110,
  ellipseMinRy: 35,
  ellipseMaxRy: 60,
  beanMinLength: 85,
  beanMaxLength: 160,
  beanMinLobeRadius: 30,
  beanMaxLobeRadius: 50,

  // Playable Boundaries within the 720px viewport
  playableMarginLeft: 45,
  playableMarginRight: 675,

  // Visual Appearance
  holeBgColor: 0x050507, // Deep pitch black interior
  holeInnerShadowAlpha: 0.45, // Soft ambient occlusion along top-left inner rim
  borderWidth: 4.5, // Thicker theme border width
};
