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
  stepMinY: 65, // Vertical advance min step (px)
  stepMaxY: 100, // Vertical advance max step (px) - spaced for larger, bolder obstacles
  minHoleGap: 24, // Minimum clearance buffer between distinct holes (px)
  minSafeCorridorWidth: 115, // Guaranteed safe gap width along every horizontal slice (marble diameter is 50px)
  corridorAnchorStep: 80, // Vertical distance between smooth corridor control points
  corridorLeftX: 195, // Safe corridor target center on the left side
  corridorRightX: 525, // Safe corridor target center on the right side
  initialBottomRatio: 0.50, // Shapes start halfway down the screen (50% viewport height)

  // Giant Half-Screen Spanning Shapes (e.g. 45-degree diagonal barriers)
  giantRectMinLength: 280,
  giantRectMaxLength: 390, // Spans half the 720px screen!
  giantRectMinThickness: 75,
  giantRectMaxThickness: 110,
  giantBeanMinLength: 250,
  giantBeanMaxLength: 370,
  giantBeanMinThickness: 80,
  giantBeanMaxThickness: 125,

  // Medium Shapes
  medRectMinLength: 160,
  medRectMaxLength: 240,
  medRectMinThickness: 60,
  medRectMaxThickness: 90,
  medBeanMinLength: 150,
  medBeanMaxLength: 220,
  medBeanMinThickness: 65,
  medBeanMaxThickness: 95,

  // Stretched & Rotated Triangles
  triMinBase: 110,
  triMaxBase: 230,
  triMinHeight: 95,
  triMaxHeight: 185,

  // Non-Polygonal Shapes: Circles & Ellipses
  circleMinRadius: 32,
  circleMaxRadius: 55, // Clean circular pits (diameter 64-110px)
  ellipseMinRx: 70,
  ellipseMaxRx: 125,
  ellipseMinRy: 45,
  ellipseMaxRy: 75,

  // Playable Boundaries within the 720px viewport
  playableMarginLeft: 45,
  playableMarginRight: 675,

  // Visual Appearance
  holeBgColor: 0x050507, // Deep pitch black interior
  holeInnerShadowAlpha: 0.45, // Soft ambient occlusion along top-left inner rim
  borderWidth: 4.5, // Thicker theme border width
};
