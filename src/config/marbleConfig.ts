/**
 * CONFIGURATION & PARAMETERS FOR MARBLE PHYSICS & GAME OVER SCREEN
 *
 * All parameters controlling the marble dimensions, physical inertia, rolling friction,
 * arrival bounce, and game over modal styling are centralized here for easy tuning.
 */

export const MARBLE_CONFIG = {
  // Dimensions & Sizing
  // Radius: 25px (diameter 50px, roughly the size of the drawn circle and app icons in screenshot)
  radius: 25,

  // Physical Inertia & Gravity
  gravity: 1400, // Pixels / sec^2 for downward gravitational acceleration
  rollingAccelerationFactor: 5 / 7, // Physics ratio for solid sphere rolling without slipping (I = 2/5 M R^2)
  rollingFriction: 22, // Lowered from 160 so marble begins rolling at ~1.3 deg instead of 10+ deg
  rollingDrag: 0.30, // Subtle linear viscous rolling drag for smooth speed feel
  staticFrictionAngleRad: 0.010, // Small threshold (~0.57 deg) below which stationary marble doesn't drift
  maxRollSpeed: 850, // Maximum linear velocity along the bar (px/s)

  // Arrival Inertia & Bounce (Entering play scene from title screen)
  arrivalLiftSpeed: 280, // Upward velocity (px/s) when bar comes to rest, causing ball to lift off (~28px apex)
  bounceRestitution: 0.38, // Bounciness coefficient for the small arrival bounce (rebound height ~5-6px)

  // Metallic Steel Visual Styling
  baseSteelColor: 0x8a96a0, // Silver-gray metallic base
  lightGleamColor: 0xffffff, // Pure white specular highlight
  midSilverColor: 0xd0d8dc, // Bright silver mid-tone
  shadowSteelColor: 0x545d65, // Shaded steel underside
  rimContourColor: 0x272c30, // Outer steel contour shadow

  // Drop Shadow
  shadowColor: 0x22180f,
  shadowAlpha: 0.32,

  // Game Over Modal Layout & Styling
  modalWidth: 520,
  modalHeight: 560,
  modalCornerRadius: 24,
  modalBgColor: 0xfdfaf4,
  modalBgAlpha: 0.94,
  modalBorderColor: 0x8a7050,
  modalBorderAlpha: 0.28,

  // Game Over Buttons
  buttonWidth: 200,
  buttonHeight: 66,
  buttonRadius: 18,
  buttonGap: 24,

  // Highscore Chart
  highscoreRowHeight: 32,
  highscoreRowCount: 5,
  dividerLineColor: 0x888888,
  dividerLineAlpha: 0.22,
};
