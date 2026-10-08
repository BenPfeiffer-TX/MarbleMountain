import Phaser from 'phaser';

/**
 * THEME DEFINITION INTERFACES
 *
 * Defines the contract for themeable game elements:
 * - Marble: Sphere texture generation & drop shadow
 * - Bar: Mechanical tilting bar drawing & surface styling
 * - Button: 3D tactile squircle buttons (base, face plate, typography, press shading)
 */

export interface MarbleTheme {
  id: string;
  name: string;
  /**
   * Whether the base body layer rotates with the ball's rolling velocity.
   * True for patterned or textured spheres (e.g. striped, 8-ball);
   * False for isotropic or uniform reflective spheres.
   */
  rotatesBody?: boolean;
  /**
   * Legacy alias for rotatesBody.
   */
  rotatesTexture?: boolean;
  /**
   * Generates or retrieves the base body texture key (Layer 1).
   * This represents the sphere's surface material, color, or pattern that physically rolls.
   */
  ensureBaseTexture(textures: Phaser.Textures.TextureManager, radius: number): string;
  /**
   * Generates or retrieves the stationary overlay texture key (Layer 2, optional).
   * Renders stationary 3D spherical shading, specular gloss highlights, or lighting glares
   * that remain fixed relative to the overhead light source regardless of ball rolling.
   * Return null or undefined if the theme has no overlay.
   */
  ensureOverlayTexture?(textures: Phaser.Textures.TextureManager, radius: number): string | null;
  /**
   * Optional single-layer texture generator for backwards compatibility.
   */
  ensureTexture?(textures: Phaser.Textures.TextureManager, radius: number): string;
  /**
   * Draws the drop shadow beneath the marble onto the given Graphics object.
   */
  drawShadow(g: Phaser.GameObjects.Graphics, radius: number): void;
}

export interface BarTheme {
  id: string;
  name: string;
  /**
   * Draws the bar surface and styling onto the given Graphics object.
   */
  drawBar(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    cornerRadius: number
  ): void;
}

export interface ButtonTheme {
  id: string;
  name: string;
  textColor: string;
  fontFamily: string;
  pressDepth: number; // Pixels face plate sinks when pressed (default: 6px)
  /**
   * Draws the stationary base and drop shadow beneath the button.
   */
  drawBase(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    radius: number
  ): void;
  /**
   * Draws the movable top face plate of the button.
   */
  drawFace(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    radius: number
  ): void;
  /**
   * Draws the dark press shading overlay on the face plate.
   */
  drawPressShade(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    radius: number
  ): void;
}

export interface GameTheme {
  id: string;
  name: string;
  marble: MarbleTheme;
  bar: BarTheme;
  button: ButtonTheme;
}
