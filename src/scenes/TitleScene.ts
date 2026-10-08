import Phaser from 'phaser';

/**
 * TUNABLE TITLE SCREEN CONFIGURATION
 * Adjust these parameters to fine-tune the visuals, animation speeds, and layout.
 */
export const TITLE_CONFIG = {
  // Pastel Gradient Animation
  gradientScrollSpeed: 40, // Pixels per second the diffuse pastel gradient travels upward
  gradientColors: [
    { r: 253, g: 243, b: 219 }, // Soft Cream / Buttercup
    { r: 250, g: 212, b: 192 }, // Pastel Peach / Apricot
    { r: 244, g: 206, b: 216 }, // Soft Rose / Blush
    { r: 226, g: 214, b: 237 }, // Pale Lavender
    { r: 214, g: 230, b: 245 }, // Misty Sky Blue
    { r: 222, g: 240, b: 226 }, // Pale Mint / Sage
  ],

  // Title Position & Perspective Leaning Sign Effect
  titleY: 340, // Vertical center of the title block
  titleTopFontSize: '64px', // 'Marble' font size
  titleBottomFontSize: '76px', // 'Mountain' font size (larger for upward perspective)
  titleTopScale: 0.94, // Farther away (top of sign)
  titleBottomScale: 1.04, // Closer to viewer (bottom of sign)
  titlePerspectiveY: 0.88, // Vertical foreshortening ratio
  titleColor: '#362417', // Deep warm charred wood tone
  titleShadowColor: '#8a725e', // Soft 3D drop shadow

  // Buttons Layout & Wood Theme (Matches Bar in MainScene)
  buttonWidth: 290,
  buttonHeight: 74,
  buttonRadius: 22,
  playButtonY: 720,
  optionsButtonY: 825,
  backButtonY: 780,
  buttonTextColor: '#fdf6e7', // Lighter beige color
  buttonTextFontSize: '26px',
  woodBaseColor: 0x9c6638,
  woodGrainDarkColor: 0x7c4e27,
  woodGrainLightColor: 0xb57c4c,
  touchPadding: 30, // Generous touch hit area margin (+30px)

  // Slide Transitions
  slideDuration: 420,
};

export class TitleScene extends Phaser.Scene {
  // Background gradient tile sprite
  private bgTileSprite!: Phaser.GameObjects.TileSprite;

  // Screen Content Containers for sliding transitions
  private mainContainer!: Phaser.GameObjects.Container;
  private optionsContainer!: Phaser.GameObjects.Container;

  // Interaction Lock during animations
  private isTransitioning: boolean = false;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.isTransitioning = false;

    // 1. Moving Pastel Gradient Background
    this.createPastelGradientBackground(width, height);

    // 2. Main Title Screen Content (Title + Play Button + Options Button)
    this.createMainContent(width);

    // 3. Options Screen Content ("Not yet implemented!" view + Back Button)
    this.createOptionsContent(width);
  }

  private createPastelGradientBackground(width: number, height: number): void {
    const textureKey = 'diffusePastelGradient';
    const textureH = 1536;

    // Generate seamless gradient canvas if not already cached
    if (!this.textures.exists(textureKey)) {
      const canvas = this.textures.createCanvas(textureKey, 32, textureH);
      if (canvas) {
        const ctx = canvas.getContext();
        const grad = ctx.createLinearGradient(0, 0, 0, textureH);

        // Append the first color at the end for seamless upward looping
        const colors = [...TITLE_CONFIG.gradientColors, TITLE_CONFIG.gradientColors[0]];
        colors.forEach((c, idx) => {
          const stop = idx / (colors.length - 1);
          grad.addColorStop(stop, `rgb(${c.r}, ${c.g}, ${c.b})`);
        });

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, textureH);
        canvas.refresh();
      }
    }

    // Scrolling TileSprite for upward diffuse transition
    this.bgTileSprite = this.add.tileSprite(width / 2, height / 2, width, height, textureKey);
    this.bgTileSprite.setDepth(0);

    // Semi-transparent tactile paper grain overlay
    const paperOverlay = this.add.graphics();
    paperOverlay.setDepth(1);

    const seedRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    let seed = 77;
    for (let i = 0; i < 700; i++) {
      const px = seedRandom(seed++) * width;
      const py = seedRandom(seed++) * height;
      const isDark = seedRandom(seed++) > 0.5;
      const color = isDark ? 0x8a7a60 : 0xffffff;
      const alpha = 0.02 + seedRandom(seed++) * 0.05;
      const len = 1.5 + seedRandom(seed++) * 3.0;

      paperOverlay.lineStyle(1, color, alpha);
      paperOverlay.lineBetween(px, py, px + len, py + (seedRandom(seed++) - 0.5) * 1.5);
    }
  }

  private createMainContent(width: number): void {
    this.mainContainer = this.add.container(0, 0);
    this.mainContainer.setDepth(10);

    // 1. Tilted Perspective Title
    const titleContainer = this.createTiltedTitle(width);
    this.mainContainer.add(titleContainer);

    // 2. Play Button (wood squircle)
    const playButton = this.createWoodButton({
      x: width / 2,
      y: TITLE_CONFIG.playButtonY,
      label: 'Play',
      onPointerDown: () => this.handlePlay(),
    });
    this.mainContainer.add(playButton.container);

    // 3. Options Button (wood squircle)
    const optionsButton = this.createWoodButton({
      x: width / 2,
      y: TITLE_CONFIG.optionsButtonY,
      label: 'Options',
      onPointerDown: () => this.handleOptions(),
    });
    this.mainContainer.add(optionsButton.container);
  }

  private createTiltedTitle(width: number): Phaser.GameObjects.Container {
    const container = this.add.container(width / 2, TITLE_CONFIG.titleY);

    const fontStack = '"Quicksand", "Nunito", "ui-rounded", -apple-system, BlinkMacSystemFont, sans-serif';

    // 3D Perspective Shadow for 'Marble'
    const marbleShadow = this.add.text(0, -40, 'Marble', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleTopFontSize,
      fontStyle: '800',
      color: TITLE_CONFIG.titleShadowColor,
      align: 'center',
    });
    marbleShadow.setOrigin(0.5);
    marbleShadow.setScale(TITLE_CONFIG.titleTopScale);
    marbleShadow.setAlpha(0.35);

    // Main 'Marble' line (slightly narrower / smaller because it is tilted away)
    const marbleText = this.add.text(0, -44, 'Marble', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleTopFontSize,
      fontStyle: '800',
      color: TITLE_CONFIG.titleColor,
      align: 'center',
    });
    marbleText.setOrigin(0.5);
    marbleText.setScale(TITLE_CONFIG.titleTopScale);

    // 3D Perspective Shadow for 'Mountain'
    const mountainShadow = this.add.text(0, 48, 'Mountain', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleBottomFontSize,
      fontStyle: '800',
      color: TITLE_CONFIG.titleShadowColor,
      align: 'center',
    });
    mountainShadow.setOrigin(0.5);
    mountainShadow.setScale(TITLE_CONFIG.titleBottomScale);
    mountainShadow.setAlpha(0.35);

    // Main 'Mountain' line (slightly larger / wider because it is closer to viewer)
    const mountainText = this.add.text(0, 44, 'Mountain', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleBottomFontSize,
      fontStyle: '800',
      color: TITLE_CONFIG.titleColor,
      align: 'center',
    });
    mountainText.setOrigin(0.5);
    mountainText.setScale(TITLE_CONFIG.titleBottomScale);

    container.add([marbleShadow, marbleText, mountainShadow, mountainText]);

    // Apply vertical foreshortening perspective tilt
    container.setScale(1.0, TITLE_CONFIG.titlePerspectiveY);

    return container;
  }

  private createOptionsContent(width: number): void {
    // Starts off-screen to the right
    this.optionsContainer = this.add.container(width, 0);
    this.optionsContainer.setDepth(10);

    const fontStack = '"Quicksand", "Nunito", "ui-rounded", -apple-system, BlinkMacSystemFont, sans-serif';

    // Options Header
    const header = this.add.text(width / 2, 340, 'Options', {
      fontFamily: fontStack,
      fontSize: '56px',
      fontStyle: '800',
      color: TITLE_CONFIG.titleColor,
      align: 'center',
    });
    header.setOrigin(0.5);

    // "Not yet implemented!" card
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x3a2c1d, 0.08);
    cardBg.fillRoundedRect(width / 2 - 220, 460, 440, 160, 20);
    cardBg.lineStyle(2, 0x9c6638, 0.25);
    cardBg.strokeRoundedRect(width / 2 - 220, 460, 440, 160, 20);

    const msg = this.add.text(width / 2, 540, 'Not yet implemented!', {
      fontFamily: fontStack,
      fontSize: '24px',
      fontStyle: '700',
      color: '#5c4331',
      align: 'center',
    });
    msg.setOrigin(0.5);

    // Back Button (wood squircle)
    const backButton = this.createWoodButton({
      x: width / 2,
      y: TITLE_CONFIG.backButtonY,
      label: 'Back',
      onPointerDown: () => this.handleBackFromOptions(),
    });

    this.optionsContainer.add([header, cardBg, msg, backButton.container]);
  }

  private createWoodButton(config: {
    x: number;
    y: number;
    label: string;
    onPointerDown: () => void;
  }): { container: Phaser.GameObjects.Container; zone: Phaser.GameObjects.Zone } {
    const w = TITLE_CONFIG.buttonWidth;
    const h = TITLE_CONFIG.buttonHeight;
    const r = TITLE_CONFIG.buttonRadius;
    const pad = TITLE_CONFIG.touchPadding;
    const fontStack = '"Quicksand", "Nunito", "ui-rounded", -apple-system, BlinkMacSystemFont, sans-serif';

    const container = this.add.container(config.x, config.y);

    // 1. Graphics for wood squircle
    const g = this.add.graphics();

    // Drop shadow
    g.fillStyle(0x3a2c1d, 0.25);
    g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, r);

    // Base wood
    g.fillStyle(TITLE_CONFIG.woodBaseColor, 1.0);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);

    // Wood grain lines
    const halfH = h / 2;
    const grainOffsets = [
      { y: -halfH + 12, col: TITLE_CONFIG.woodGrainLightColor, a: 0.35, width: 2 },
      { y: -halfH + 26, col: TITLE_CONFIG.woodGrainDarkColor, a: 0.28, width: 1.5 },
      { y: -halfH + 42, col: TITLE_CONFIG.woodGrainLightColor, a: 0.25, width: 1.5 },
      { y: -halfH + 58, col: TITLE_CONFIG.woodGrainDarkColor, a: 0.30, width: 2 },
    ];
    grainOffsets.forEach((line) => {
      g.lineStyle(line.width, line.col, line.a);
      g.lineBetween(-w / 2 + 10, line.y, w / 2 - 10, line.y);
    });

    // Tactile perimeter rim
    g.lineStyle(2, TITLE_CONFIG.woodGrainDarkColor, 0.45);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    container.add(g);

    // 2. Button Label Text
    const labelText = this.add.text(0, 0, config.label, {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.buttonTextFontSize,
      fontStyle: '700',
      color: TITLE_CONFIG.buttonTextColor,
      align: 'center',
    });
    labelText.setOrigin(0.5);
    container.add(labelText);

    // 3. Dedicated Touch Zone with generous padding (+30px)
    const zone = this.add.zone(config.x, config.y, w + pad * 2, h + pad * 2);
    zone.setInteractive({ useHandCursor: true });
    container.add(zone);

    zone.on('pointerdown', () => {
      if (this.isTransitioning) return;
      container.setScale(0.94);
      config.onPointerDown();
    });

    const resetScale = () => {
      container.setScale(1.0);
    };
    zone.on('pointerup', resetScale);
    zone.on('pointerout', resetScale);
    zone.on('pointercancel', resetScale);

    return { container, zone };
  }

  private handlePlay(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Slide title and buttons upward and off the screen
    this.tweens.add({
      targets: this.mainContainer,
      y: -750,
      alpha: 0.85,
      duration: 480,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Transition camera smoothly into MainScene play state
        this.cameras.main.fadeOut(200, 223, 213, 192);
        this.time.delayedCall(200, () => {
          this.scene.start('MainScene', { fromTitle: true });
        });
      },
    });
  }

  private handleOptions(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const { width } = this.scale;

    // Slide main content left off-screen, slide options content in from right
    this.tweens.add({
      targets: this.mainContainer,
      x: -width,
      duration: TITLE_CONFIG.slideDuration,
      ease: 'Cubic.easeInOut',
    });

    this.tweens.add({
      targets: this.optionsContainer,
      x: 0,
      duration: TITLE_CONFIG.slideDuration,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.isTransitioning = false;
      },
    });
  }

  private handleBackFromOptions(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const { width } = this.scale;

    // Slide options content back to the right, slide main content back to center
    this.tweens.add({
      targets: this.optionsContainer,
      x: width,
      duration: TITLE_CONFIG.slideDuration,
      ease: 'Cubic.easeInOut',
    });

    this.tweens.add({
      targets: this.mainContainer,
      x: 0,
      duration: TITLE_CONFIG.slideDuration,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.isTransitioning = false;
      },
    });
  }

  update(_time: number, delta: number): void {
    // Smooth upward travel of the diffuse pastel gradient
    if (this.bgTileSprite) {
      this.bgTileSprite.tilePositionY += (TITLE_CONFIG.gradientScrollSpeed * delta) / 1000;
    }
  }
}
