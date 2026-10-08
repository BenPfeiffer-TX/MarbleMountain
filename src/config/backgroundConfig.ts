/**
 * CONFIGURATION & PARAMETERS FOR PERSISTENT BACKGROUND
 *
 * This configuration controls the persistent background that seamlessly spans
 * across both the Title Screen and the Play State (MainScene).
 *
 * Visual style: Soft diffuse pastel gradient with a subtle tactile construction
 * paper grain overlay that continuously scrolls upward.
 */

export interface GradientColorStop {
  r: number;
  g: number;
  b: number;
}

export interface PaperTextureConfig {
  enabled: boolean;
  fiberCount: number;
  darkColor: number;
  lightColor: number;
  minAlpha: number;
  maxAlpha: number;
}

export interface BackgroundConfig {
  // Animation Motion
  scrollSpeed: number; // Pixels per second (diffuse pastel gradient travel)
  scrollDirection: 'up' | 'down'; // Direction of gradient travel

  // Color Palette (in top-to-bottom sequence before looping)
  gradientColors: GradientColorStop[];

  // Procedural Construction Paper Texture
  paperTexture: PaperTextureConfig;

  // Canvas Generation
  gradientCanvasHeight: number; // Canvas height used to generate smooth gradient interpolation
}

export const BACKGROUND_CONFIG: BackgroundConfig = {
  // Motion & Animation
  scrollSpeed: 40, // 40px/s upward travel
  scrollDirection: 'up',

  // Soft Pastel Gradient Palette
  // Colors transition smoothly through warm, rosy, lavender, and mint pastel shades
  gradientColors: [
    { r: 253, g: 243, b: 219 }, // Soft Cream / Buttercup
    { r: 250, g: 212, b: 192 }, // Pastel Peach / Apricot
    { r: 244, g: 206, b: 216 }, // Soft Rose / Blush
    { r: 226, g: 214, b: 237 }, // Pale Lavender
    { r: 214, g: 230, b: 245 }, // Misty Sky Blue
    { r: 222, g: 240, b: 226 }, // Pale Mint / Sage
  ],

  // Tactile Construction Paper Grain Overlay
  paperTexture: {
    enabled: true,
    fiberCount: 700,
    darkColor: 0x8a7a60,
    lightColor: 0xffffff,
    minAlpha: 0.02,
    maxAlpha: 0.07,
  },

  // Gradient loop canvas dimensions
  gradientCanvasHeight: 1536,
};
