import Phaser from 'phaser';
import { BACKGROUND_CONFIG, GradientColorStop } from '../config/backgroundConfig';

/**
 * PERSISTENT BACKGROUND SCENE
 *
 * Runs continuously in the background across all game states (TitleScreen, PlayState,
 * Options, etc.). Retains continuous animation, seamless color positioning, and tactile
 * paper texture without resetting, flashing, or reloading during scene transitions.
 */
export class BackgroundScene extends Phaser.Scene {
  private bgTileSprite!: Phaser.GameObjects.TileSprite;
  private paperOverlay?: Phaser.GameObjects.Graphics;
  private currentScrollSpeed: number = BACKGROUND_CONFIG.scrollSpeed;
  private isPaused: boolean = false;

  private static readonly TEXTURE_KEY = 'diffusePastelGradient';

  constructor() {
    super('BackgroundScene');
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Generate or retrieve gradient texture
    this.ensureGradientTexture();

    // 2. Continuous Scrolling TileSprite
    this.bgTileSprite = this.add.tileSprite(
      width / 2,
      height / 2,
      width,
      height,
      BackgroundScene.TEXTURE_KEY
    );
    this.bgTileSprite.setDepth(0);

    // 3. Procedural Tactile Construction Paper Grain Overlay
    if (BACKGROUND_CONFIG.paperTexture.enabled) {
      this.createPaperTextureOverlay(width, height);
    }

    // 4. Ensure background stays permanently at the bottom of the scene stack
    this.scene.sendToBack();

    // 5. Launch initial scene if none active
    if (!this.scene.isActive('TitleScene') && !this.scene.isActive('MainScene')) {
      this.scene.launch('TitleScene');
    }
  }

  /**
   * Generates seamless diffuse pastel gradient canvas texture.
   * Cached by Phaser TextureManager so it is only rendered once.
   */
  private ensureGradientTexture(): void {
    const key = BackgroundScene.TEXTURE_KEY;
    if (this.textures.exists(key)) return;

    this.renderGradientTexture(BACKGROUND_CONFIG.gradientColors);
  }

  /**
   * Renders the linear gradient into an offscreen canvas texture.
   * Can be re-invoked if palette is updated at runtime.
   */
  public renderGradientTexture(colors: GradientColorStop[]): void {
    const key = BackgroundScene.TEXTURE_KEY;
    const textureH = BACKGROUND_CONFIG.gradientCanvasHeight;

    // If texture exists, remove it before regenerating
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }

    const canvas = this.textures.createCanvas(key, 32, textureH);
    if (!canvas) return;

    const ctx = canvas.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, textureH);

    // Append the first color at the end for a seamless looping cycle
    const loopColors = [...colors, colors[0]];
    loopColors.forEach((c, idx) => {
      const stop = idx / (loopColors.length - 1);
      grad.addColorStop(stop, `rgb(${c.r}, ${c.g}, ${c.b})`);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, textureH);
    canvas.refresh();

    if (this.bgTileSprite) {
      this.bgTileSprite.setTexture(key);
    }
  }

  /**
   * Procedural tactile paper texture overlay with fine fibers and mottled flecks.
   */
  private createPaperTextureOverlay(width: number, height: number): void {
    if (this.paperOverlay) {
      this.paperOverlay.destroy();
    }

    this.paperOverlay = this.add.graphics();
    this.paperOverlay.setDepth(1);

    const cfg = BACKGROUND_CONFIG.paperTexture;
    const seedRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    let seed = 77;
    for (let i = 0; i < cfg.fiberCount; i++) {
      const px = seedRandom(seed++) * width;
      const py = seedRandom(seed++) * height;
      const isDark = seedRandom(seed++) > 0.5;
      const color = isDark ? cfg.darkColor : cfg.lightColor;
      const alpha = cfg.minAlpha + seedRandom(seed++) * (cfg.maxAlpha - cfg.minAlpha);
      const len = 1.5 + seedRandom(seed++) * 3.0;

      this.paperOverlay.lineStyle(1, color, alpha);
      this.paperOverlay.lineBetween(px, py, px + len, py + (seedRandom(seed++) - 0.5) * 1.5);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || !this.bgTileSprite) return;

    const direction = BACKGROUND_CONFIG.scrollDirection === 'up' ? 1 : -1;
    this.bgTileSprite.tilePositionY += (this.currentScrollSpeed * direction * delta) / 1000;
  }

  // --- PUBLIC API FOR DYNAMIC ADJUSTMENTS ---

  public setScrollSpeed(speed: number): void {
    this.currentScrollSpeed = speed;
  }

  public getScrollSpeed(): number {
    return this.currentScrollSpeed;
  }

  public getTilePositionY(): number {
    return this.bgTileSprite ? this.bgTileSprite.tilePositionY : 0;
  }

  public setTilePositionY(y: number): void {
    if (this.bgTileSprite) {
      this.bgTileSprite.tilePositionY = y;
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public setFrostedBlur(enabled: boolean): void {
    if (!this.cameras?.main?.postFX) return;
    if (enabled) {
      this.cameras.main.postFX.addBlur(2, 4, 4, 2);
    } else {
      this.cameras.main.postFX.clear();
    }
  }
}
