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

  // Procedural Band Generation
  bandHeight: 220, // Height of each procedural hole row band in px (increased for larger shapes)
  bandGap: 70, // Clear vertical gap between bands for player maneuvering
  minSafeCorridorWidth: 120, // Guaranteed safe gap width along every horizontal slice (marble diameter is 50px)
  maxSafeCorridorShift: 170, // Maximum horizontal shift of safe corridor between adjacent bands
  initialBottomRatio: 0.50, // Shapes start halfway down the screen (50% viewport height)

  // Hole Dimensions (Bigger shapes for prominent obstacles)
  rectMinWidth: 110,
  rectMaxWidth: 220,
  rectMinHeight: 75,
  rectMaxHeight: 135,
  rectCornerRadius: 10,

  triMinBase: 110,
  triMaxBase: 195,
  triMinHeight: 90,
  triMaxHeight: 145,

  // Playable Boundaries within the 720px viewport
  playableMarginLeft: 45,
  playableMarginRight: 675,

  // Visual Appearance
  holeBgColor: 0x050507, // Deep pitch black interior
  holeInnerShadowAlpha: 0.45, // Soft ambient occlusion along top-left inner rim
  borderWidth: 4.5, // Thicker theme border width (increased from 2.5)
};
