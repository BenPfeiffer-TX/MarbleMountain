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
  stepMinY: 48, // Vertical advance min step for dense staggered generation (px)
  stepMaxY: 70, // Vertical advance max step for dense staggered generation (px)
  minHoleGap: 20, // Minimum clearance buffer between distinct holes (px)
  minSafeCorridorWidth: 115, // Guaranteed safe gap width along every horizontal slice (marble diameter is 50px)
  corridorAnchorStep: 90, // Vertical distance between smooth corridor control points
  maxCorridorShiftPerAnchor: 95, // Maximum smooth horizontal drift per anchor (px)
  initialBottomRatio: 0.50, // Shapes start halfway down the screen (50% viewport height)

  // Hole Dimensions (Varied, prominent obstacles)
  rectMinWidth: 90,
  rectMaxWidth: 180,
  rectMinHeight: 70,
  rectMaxHeight: 125,
  rectCornerRadius: 10,

  triMinBase: 95,
  triMaxBase: 175,
  triMinHeight: 75,
  triMaxHeight: 130,

  // Playable Boundaries within the 720px viewport
  playableMarginLeft: 45,
  playableMarginRight: 675,

  // Visual Appearance
  holeBgColor: 0x050507, // Deep pitch black interior
  holeInnerShadowAlpha: 0.45, // Soft ambient occlusion along top-left inner rim
  borderWidth: 4.5, // Thicker theme border width
};
