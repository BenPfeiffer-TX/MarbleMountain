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
  bandHeight: 160, // Height of each procedural hole row band in px
  bandGap: 60, // Clear vertical gap between bands for player maneuvering
  minSafeCorridorWidth: 110, // Guaranteed safe gap width along every horizontal slice (marble diameter is 50px)
  maxSafeCorridorShift: 160, // Maximum horizontal shift of safe corridor between adjacent bands

  // Hole Dimensions
  rectMinWidth: 75,
  rectMaxWidth: 150,
  rectMinHeight: 55,
  rectMaxHeight: 90,
  rectCornerRadius: 8,

  triMinBase: 80,
  triMaxBase: 130,
  triMinHeight: 65,
  triMaxHeight: 95,

  // Playable Boundaries within the 720px viewport
  playableMarginLeft: 45,
  playableMarginRight: 675,

  // Visual Appearance
  holeBgColor: 0x050507, // Deep pitch black interior
  holeInnerShadowAlpha: 0.45, // Soft ambient occlusion along top-left inner rim
  borderWidth: 2.5, // Thin theme border width
};
