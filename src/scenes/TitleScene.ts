import Phaser from 'phaser';

/**
 * TUNABLE TITLE SCREEN CONFIGURATION
 * Adjust these parameters to fine-tune the visuals, animation speeds, and layout.
 */
export const TITLE_CONFIG = {
  // Pastel Gradient Animation
  gradientScrollSpeed: 40, // Pixels per second diffuse pastel gradient travels upward
  gradientColors: [
    { r: 253, g: 243, b: 219 }, // Soft Cream / Buttercup
    { r: 250, g: 212, b: 192 }, // Pastel Peach / Apricot
    { r: 244, g: 206, b: 216 }, // Soft Rose / Blush
    { r: 226, g: 214, b: 237 }, // Pale Lavender
    { r: 214, g: 230, b: 245 }, // Misty Sky Blue
    { r: 222, g: 240, b: 226 }, // Pale Mint / Sage
  ],

  // Flat Title Position & Typography
  titleY: 330, // Vertical center of the title block
  titleFontSize: '82px', // Larger, bolder font size
  titleFontWeight: '900', // Extra bold weight
  titleLineSpacing: -10, // Snug line spacing between 'Marble' and 'Mountain'
  titleTextColor: '#fdf6e7', // Light beige color (same as button labels)
  titleStrokeColor: '#3a2415', // Soft warm contour for crisp legibility on pastel background
  titleStrokeThickness: 3, // Contour thickness

  // Tactile Wood Squircle Buttons (Deep 3D Press & Shading)
  buttonWidth: 290,
  buttonHeight: 74,
  buttonRadius: 22,
  playButtonY: 720,
  optionsButtonY: 825,
  backButtonY: 780,
  buttonTextColor: '#fdf6e7', // Light beige color
  buttonTextFontSize: '26px',
  woodBaseColor: 0x9c6638,
  woodDarkEdgeColor: 0x5a3617,
  woodGrainDarkColor: 0x7c4e27,
  woodGrainLightColor: 0xb57c4c,
  touchPadding: 30, // Dedicated hit area padding (+30px)

  // Transitions
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

    // 1. Flat Bold Title in Light Beige
    const titleText = this.createFlatTitle(width);
    this.mainContainer.add(titleText);

    // 2. Tactile 3D Wood Squircle 'Play' Button
    const playButton = this.createTactileWoodButton({
      x: width / 2,
      y: TITLE_CONFIG.playButtonY,
      label: 'Play',
      onPointerDown: () => this.handlePlay(),
    });
    this.mainContainer.add(playButton);

    // 3. Tactile 3D Wood Squircle 'Options' Button
    const optionsButton = this.createTactileWoodButton({
      x: width / 2,
      y: TITLE_CONFIG.optionsButtonY,
      label: 'Options',
      onPointerDown: () => this.handleOptions(),
    });
    this.mainContainer.add(optionsButton);
  }

  private createFlatTitle(width: number): Phaser.GameObjects.Text {
    const fontStack = '"Quicksand", "Nunito", "ui-rounded", -apple-system, BlinkMacSystemFont, sans-serif';

    const text = this.add.text(width / 2, TITLE_CONFIG.titleY, 'Marble\nMountain', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleFontSize,
      fontStyle: TITLE_CONFIG.titleFontWeight,
      color: TITLE_CONFIG.titleTextColor,
      align: 'center',
      lineSpacing: TITLE_CONFIG.titleLineSpacing,
      stroke: TITLE_CONFIG.titleStrokeColor,
      strokeThickness: TITLE_CONFIG.titleStrokeThickness,
    });
    text.setOrigin(0.5);

    return text;
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
      fontStyle: '900',
      color: '#362417',
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
    const backButton = this.createTactileWoodButton({
      x: width / 2,
      y: TITLE_CONFIG.backButtonY,
      label: 'Back',
      onPointerDown: () => this.handleBackFromOptions(),
    });

    this.optionsContainer.add([header, cardBg, msg, backButton]);
  }

  /**
   * Creates a tactile 3D wood squircle button.
   * Uses real depth layers (base extrusion + movable face plate + dark press shade)
   * and a properly-aligned dedicated Zone hit area at (0, 0) inside the container.
   */
  private createTactileWoodButton(config: {
    x: number;
    y: number;
    label: string;
    onPointerDown: () => void;
  }): Phaser.GameObjects.Container {
    const w = TITLE_CONFIG.buttonWidth;
    const h = TITLE_CONFIG.buttonHeight;
    const r = TITLE_CONFIG.buttonRadius;
    const pad = TITLE_CONFIG.touchPadding;
    const fontStack = '"Quicksand", "Nunito", "ui-rounded", -apple-system, BlinkMacSystemFont, sans-serif';

    const buttonContainer = this.add.container(config.x, config.y);

    // 1. Stationary Base & Shadow (shows physical wood block depth underneath)
    const baseG = this.add.graphics();
    // Drop shadow
    baseG.fillStyle(0x3a2c1d, 0.28);
    baseG.fillRoundedRect(-w / 2, -h / 2 + 8, w, h, r);
    // Dark bottom wood bevel / thickness (extrusion)
    baseG.fillStyle(TITLE_CONFIG.woodDarkEdgeColor, 1.0);
    baseG.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, r);
    buttonContainer.add(baseG);

    // 2. Movable Top Face Container (sinks down 6px when pressed, springs up on release)
    const faceContainer = this.add.container(0, -6);

    // Face plate graphics
    const faceG = this.add.graphics();
    // Base wood face
    faceG.fillStyle(TITLE_CONFIG.woodBaseColor, 1.0);
    faceG.fillRoundedRect(-w / 2, -h / 2, w, h, r);

    // Wood grain lines
    const halfH = h / 2;
    const grainOffsets = [
      { y: -halfH + 12, col: TITLE_CONFIG.woodGrainLightColor, a: 0.35, width: 2 },
      { y: -halfH + 26, col: TITLE_CONFIG.woodGrainDarkColor, a: 0.28, width: 1.5 },
      { y: -halfH + 42, col: TITLE_CONFIG.woodGrainLightColor, a: 0.25, width: 1.5 },
      { y: -halfH + 58, col: TITLE_CONFIG.woodGrainDarkColor, a: 0.30, width: 2 },
    ];
    grainOffsets.forEach((line) => {
      faceG.lineStyle(line.width, line.col, line.a);
      faceG.lineBetween(-w / 2 + 10, line.y, w / 2 - 10, line.y);
    });

    // Top highlight rim & border
    faceG.lineStyle(2, TITLE_CONFIG.woodGrainDarkColor, 0.5);
    faceG.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    faceContainer.add(faceG);

    // Button Label Text
    const labelText = this.add.text(0, 0, config.label, {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.buttonTextFontSize,
      fontStyle: '800',
      color: TITLE_CONFIG.buttonTextColor,
      align: 'center',
    });
    labelText.setOrigin(0.5);
    faceContainer.add(labelText);

    // Dark press shading overlay (clearly darkens the button when pressed)
    const shadeOverlay = this.add.graphics();
    shadeOverlay.fillStyle(0x180b02, 0.36);
    shadeOverlay.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    shadeOverlay.setAlpha(0); // Invisible by default
    faceContainer.add(shadeOverlay);

    buttonContainer.add(faceContainer);

    // 3. Dedicated Touch Zone placed at (0, 0) relative to buttonContainer
    // Generous padding (+30px) guarantees reliable mobile touch
    const zone = this.add.zone(0, 0, w + pad * 2, h + pad * 2);
    zone.setInteractive({ useHandCursor: true });
    buttonContainer.add(zone);

    // Tactile Interaction Handlers
    zone.on('pointerdown', () => {
      if (this.isTransitioning) return;

      // 1. Instantly sink 6px down and visibly shade/darken
      faceContainer.y = 0;
      shadeOverlay.setAlpha(1);

      // 2. Spring up with punchy recoil and fire action
      this.time.delayedCall(80, () => {
        this.tweens.add({
          targets: faceContainer,
          y: -7,
          duration: 100,
          ease: 'Back.easeOut',
          onComplete: () => {
            shadeOverlay.setAlpha(0);
            config.onPointerDown();
          },
        });
      });
    });

    const resetState = () => {
      if (this.isTransitioning) return;
      faceContainer.y = -6;
      shadeOverlay.setAlpha(0);
    };

    zone.on('pointerout', resetState);
    zone.on('pointercancel', resetState);

    return buttonContainer;
  }

  private handlePlay(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Slide title and buttons upward and off the screen
    this.tweens.add({
      targets: this.mainContainer,
      y: -780,
      alpha: 0.9,
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
