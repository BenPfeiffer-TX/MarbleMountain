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

  // Exaggerated Tilted Signboard Dimensions (/___\ Shape)
  titleY: 330, // Vertical center of the tilted sign
  signTopWidth: 400, // Top width (narrower for perspective)
  signBottomWidth: 570, // Bottom width (wider for perspective)
  signHeight: 180, // Height of the sign slab
  signBgColor: 0x8c5b33, // Rich warm wood signboard
  signBorderColor: 0x4a2c14, // Dark wooden border
  signRivetColor: 0xd4a373, // Bronze mounting corner rivets

  // Title Typography (Thick, Chunky, Snug Spacing)
  titleMarbleY: -28, // Closer vertical line spacing
  titleMountainY: 30, // Closer vertical line spacing
  titleMarbleFontSize: '58px',
  titleMountainFontSize: '70px',
  titleMarbleScaleX: 0.82, // Narrower at top of sign
  titleMountainScaleX: 1.15, // Wider at base of sign
  titleTextColor: '#fdf6e7', // Light embossed cream lettering
  titleStrokeColor: '#2b1a0d', // Dark wood engraved stroke
  titleStrokeThickness: 5, // Extra thick font weight
  titleShadowColor: '#1a0e05', // Deep 3D drop shadow

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

    // 1. Tilted Perspective Trapezoid Sign Title (/___\ shape)
    const titleContainer = this.createTiltedTrapezoidTitle(width);
    this.mainContainer.add(titleContainer);

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

  private createTiltedTrapezoidTitle(width: number): Phaser.GameObjects.Container {
    const container = this.add.container(width / 2, TITLE_CONFIG.titleY);

    const topW = TITLE_CONFIG.signTopWidth;
    const botW = TITLE_CONFIG.signBottomWidth;
    const h = TITLE_CONFIG.signHeight;
    const halfH = h / 2;

    const g = this.add.graphics();

    // 1. Drop shadow beneath the trapezoid (offset down by 10px)
    g.fillStyle(0x2a1d13, 0.28);
    g.beginPath();
    g.moveTo(-topW / 2, -halfH + 10);
    g.lineTo(topW / 2, -halfH + 10);
    g.lineTo(botW / 2, halfH + 10);
    g.lineTo(-botW / 2, halfH + 10);
    g.closePath();
    g.fillPath();

    // 2. Extruded bottom edge for 3D slab thickness
    g.fillStyle(0x3a210d, 0.95);
    g.beginPath();
    g.moveTo(-botW / 2, halfH);
    g.lineTo(botW / 2, halfH);
    g.lineTo(botW / 2, halfH + 6);
    g.lineTo(-botW / 2, halfH + 6);
    g.closePath();
    g.fillPath();

    // 3. Main Trapezoid Wooden Sign Face (/   \ shape)
    g.fillStyle(TITLE_CONFIG.signBgColor, 1.0);
    g.beginPath();
    g.moveTo(-topW / 2, -halfH);
    g.lineTo(topW / 2, -halfH);
    g.lineTo(botW / 2, halfH);
    g.lineTo(-botW / 2, halfH);
    g.closePath();
    g.fillPath();

    // 4. Subtle wood grain horizontal fibers across the trapezoid
    g.lineStyle(1.5, 0x6e4321, 0.35);
    for (let yOffset = -halfH + 18; yOffset < halfH; yOffset += 24) {
      // Line length interpolated between topW and botW
      const t = (yOffset + halfH) / h;
      const currentW = (topW + (botW - topW) * t) * 0.92;
      g.lineBetween(-currentW / 2, yOffset, currentW / 2, yOffset);
    }

    // 5. Heavy Outer Wooden Frame Stroke (/   \)
    g.lineStyle(4, TITLE_CONFIG.signBorderColor, 1.0);
    g.beginPath();
    g.moveTo(-topW / 2, -halfH);
    g.lineTo(topW / 2, -halfH);
    g.lineTo(botW / 2, halfH);
    g.lineTo(-botW / 2, halfH);
    g.closePath();
    g.strokePath();

    // 6. Corner Bronze Mounting Rivets
    const drawRivet = (rx: number, ry: number) => {
      g.fillStyle(0x2a1d13, 0.5);
      g.fillCircle(rx, ry + 2, 6);
      g.fillStyle(TITLE_CONFIG.signRivetColor, 1.0);
      g.fillCircle(rx, ry, 5);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(rx - 1.5, ry - 1.5, 1.5);
    };
    drawRivet(-topW / 2 + 18, -halfH + 16);
    drawRivet(topW / 2 - 18, -halfH + 16);
    drawRivet(-botW / 2 + 20, halfH - 16);
    drawRivet(botW / 2 - 20, halfH - 16);

    container.add(g);

    // 7. Typography (Thick, Chunky, Tightly Spaced)
    const fontStack = '"Quicksand", "Nunito", "ui-rounded", -apple-system, BlinkMacSystemFont, sans-serif';

    // 'Marble' 3D Shadow
    const marbleShadow = this.add.text(0, TITLE_CONFIG.titleMarbleY + 4, 'Marble', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleMarbleFontSize,
      fontStyle: '900',
      color: TITLE_CONFIG.titleShadowColor,
      align: 'center',
      stroke: TITLE_CONFIG.titleShadowColor,
      strokeThickness: TITLE_CONFIG.titleStrokeThickness,
    });
    marbleShadow.setOrigin(0.5);
    marbleShadow.setScale(TITLE_CONFIG.titleMarbleScaleX, 0.85);
    marbleShadow.setAlpha(0.45);

    // 'Marble' Main Text (Narrower at top)
    const marbleText = this.add.text(0, TITLE_CONFIG.titleMarbleY, 'Marble', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleMarbleFontSize,
      fontStyle: '900',
      color: TITLE_CONFIG.titleTextColor,
      align: 'center',
      stroke: TITLE_CONFIG.titleStrokeColor,
      strokeThickness: TITLE_CONFIG.titleStrokeThickness,
    });
    marbleText.setOrigin(0.5);
    marbleText.setScale(TITLE_CONFIG.titleMarbleScaleX, 0.85);

    // 'Mountain' 3D Shadow
    const mountainShadow = this.add.text(0, TITLE_CONFIG.titleMountainY + 4, 'Mountain', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleMountainFontSize,
      fontStyle: '900',
      color: TITLE_CONFIG.titleShadowColor,
      align: 'center',
      stroke: TITLE_CONFIG.titleShadowColor,
      strokeThickness: TITLE_CONFIG.titleStrokeThickness,
    });
    mountainShadow.setOrigin(0.5);
    mountainShadow.setScale(TITLE_CONFIG.titleMountainScaleX, 0.88);
    mountainShadow.setAlpha(0.45);

    // 'Mountain' Main Text (Wider at bottom)
    const mountainText = this.add.text(0, TITLE_CONFIG.titleMountainY, 'Mountain', {
      fontFamily: fontStack,
      fontSize: TITLE_CONFIG.titleMountainFontSize,
      fontStyle: '900',
      color: TITLE_CONFIG.titleTextColor,
      align: 'center',
      stroke: TITLE_CONFIG.titleStrokeColor,
      strokeThickness: TITLE_CONFIG.titleStrokeThickness,
    });
    mountainText.setOrigin(0.5);
    mountainText.setScale(TITLE_CONFIG.titleMountainScaleX, 0.88);

    container.add([marbleShadow, marbleText, mountainShadow, mountainText]);

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
