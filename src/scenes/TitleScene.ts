import Phaser from 'phaser';
import { createTactileButton } from '../ui/TactileButton';
import { createTriangleButton } from '../ui/TriangleButton';
import { ThemeManager } from '../themes/themeManager';
import { MarbleTheme } from '../themes/types';
import { MARBLE_CONFIG } from '../config/marbleConfig';

/**
 * TUNABLE TITLE SCREEN CONFIGURATION
 * Adjust these parameters to fine-tune the visuals, animation speeds, and layout.
 */
export const TITLE_CONFIG = {
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
  // Screen Content Containers for sliding transitions
  private mainContainer!: Phaser.GameObjects.Container;
  private optionsContainer!: Phaser.GameObjects.Container;

  // Interaction Lock during animations
  private isTransitioning: boolean = false;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { width } = this.scale;
    this.isTransitioning = false;

    // Ensure persistent BackgroundScene is running behind TitleScene
    if (!this.scene.isActive('BackgroundScene')) {
      this.scene.launch('BackgroundScene');
      this.scene.sendToBack('BackgroundScene');
    }
    this.scene.bringToTop();

    // 1. Main Title Screen Content (Title + Play Button + Options Button)
    this.createMainContent(width);

    // 2. Options Screen Content ("Not yet implemented!" view + Back Button)
    this.createOptionsContent(width);
  }

  private createMainContent(width: number): void {
    this.mainContainer = this.add.container(0, 0);
    this.mainContainer.setDepth(10);

    // 1. Flat Bold Title in Light Beige
    const titleText = this.createFlatTitle(width);
    this.mainContainer.add(titleText);

    // 2. Tactile 3D Squircle 'Play' Button
    const playButton = createTactileButton(this, {
      x: width / 2,
      y: TITLE_CONFIG.playButtonY,
      w: TITLE_CONFIG.buttonWidth,
      h: TITLE_CONFIG.buttonHeight,
      radius: TITLE_CONFIG.buttonRadius,
      label: 'Play',
      fontSize: TITLE_CONFIG.buttonTextFontSize,
      onPointerDown: () => this.handlePlay(),
    });
    this.mainContainer.add(playButton);

    // 3. Tactile 3D Squircle 'Options' Button
    const optionsButton = createTactileButton(this, {
      x: width / 2,
      y: TITLE_CONFIG.optionsButtonY,
      w: TITLE_CONFIG.buttonWidth,
      h: TITLE_CONFIG.buttonHeight,
      radius: TITLE_CONFIG.buttonRadius,
      label: 'Options',
      fontSize: TITLE_CONFIG.buttonTextFontSize,
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

    // 1. Options Header
    const header = this.add.text(width / 2, 170, 'Options', {
      fontFamily: fontStack,
      fontSize: '56px',
      fontStyle: '900',
      color: '#362417',
      align: 'center',
    });
    header.setOrigin(0.5);
    this.optionsContainer.add(header);

    const centerX = width / 2;
    // Identical horizontal spacing from center across ALL options
    const TRI_SPACING = 80;

    // --- Row 1: Background ---
    const bgRowY = 290;
    const bgBtnY = 350;

    const bgLabel = this.add.text(centerX, bgRowY, 'BACKGROUND', {
      fontFamily: fontStack,
      fontSize: '20px',
      fontStyle: '800',
      color: '#7c5e47',
      letterSpacing: 4,
      align: 'center',
    });
    bgLabel.setOrigin(0.5);
    this.optionsContainer.add(bgLabel);

    const bgLeftBtn = createTriangleButton(this, {
      x: centerX - TRI_SPACING,
      y: bgBtnY,
      direction: 'left',
      size: 44,
      onPointerDown: () => ThemeManager.cycleBackground(-1),
    });

    const bgRightBtn = createTriangleButton(this, {
      x: centerX + TRI_SPACING,
      y: bgBtnY,
      direction: 'right',
      size: 44,
      onPointerDown: () => ThemeManager.cycleBackground(1),
    });

    this.optionsContainer.add([bgLeftBtn, bgRightBtn]);

    // --- Row 2: Ball ---
    const ballRowY = 470;
    const ballBtnY = 530;

    const ballLabel = this.add.text(centerX, ballRowY, 'BALL', {
      fontFamily: fontStack,
      fontSize: '20px',
      fontStyle: '800',
      color: '#7c5e47',
      letterSpacing: 4,
      align: 'center',
    });
    ballLabel.setOrigin(0.5);
    this.optionsContainer.add(ballLabel);

    // Marble Preview placed directly in between the buttons
    const marbleRadius = MARBLE_CONFIG.radius;
    const marbleContainer = this.add.container(centerX, ballBtnY);

    const marbleShadow = this.add.graphics();
    marbleContainer.add(marbleShadow);

    const marbleBody = this.add.image(0, 0, '');
    marbleContainer.add(marbleBody);

    let marbleOverlay: Phaser.GameObjects.Image | null = null;

    const updateMarbleVisual = (marbleTheme: MarbleTheme, dir: number = 0) => {
      // 1. Drop shadow
      marbleShadow.clear();
      marbleTheme.drawShadow(marbleShadow, marbleRadius);

      // 2. Base body texture (Layer 1)
      const baseKey = marbleTheme.ensureBaseTexture
        ? marbleTheme.ensureBaseTexture(this.textures, marbleRadius)
        : marbleTheme.ensureTexture!(this.textures, marbleRadius);
      marbleBody.setTexture(baseKey);

      const shouldRotate = marbleTheme.rotatesBody ?? marbleTheme.rotatesTexture ?? false;
      if (shouldRotate && dir !== 0) {
        this.tweens.add({
          targets: marbleBody,
          rotation: marbleBody.rotation + dir * (Math.PI * 0.5),
          duration: 220,
          ease: 'Cubic.easeOut',
        });
      } else if (!shouldRotate) {
        marbleBody.setRotation(0);
      }

      // 3. Specular overlay texture (Layer 2)
      const overlayKey = marbleTheme.ensureOverlayTexture
        ? marbleTheme.ensureOverlayTexture(this.textures, marbleRadius)
        : null;

      if (overlayKey) {
        if (!marbleOverlay) {
          marbleOverlay = this.add.image(0, 0, overlayKey);
          marbleContainer.add(marbleOverlay);
        } else {
          marbleOverlay.setTexture(overlayKey);
          marbleOverlay.setVisible(true);
        }
      } else if (marbleOverlay) {
        marbleOverlay.setVisible(false);
      }
    };

    updateMarbleVisual(ThemeManager.getActiveBall());

    const unsubBall = ThemeManager.onBallChanged((ball) => {
      updateMarbleVisual(ball);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubBall();
    });

    const onCycleBall = (dir: 1 | -1) => {
      const nextBall = ThemeManager.cycleBall(dir);
      updateMarbleVisual(nextBall, dir);
      this.tweens.add({
        targets: marbleContainer,
        scale: { from: 1.18, to: 1.0 },
        duration: 180,
        ease: 'Back.easeOut',
      });
    };

    // Interactive touch zone for marble preview
    const marbleTouch = this.add.zone(0, 0, marbleRadius * 2 + 16, marbleRadius * 2 + 16);
    marbleTouch.setInteractive({ useHandCursor: true });
    marbleTouch.on('pointerdown', () => onCycleBall(1));
    marbleContainer.add(marbleTouch);

    const ballLeftBtn = createTriangleButton(this, {
      x: centerX - TRI_SPACING,
      y: ballBtnY,
      direction: 'left',
      size: 44,
      onPointerDown: () => onCycleBall(-1),
    });

    const ballRightBtn = createTriangleButton(this, {
      x: centerX + TRI_SPACING,
      y: ballBtnY,
      direction: 'right',
      size: 44,
      onPointerDown: () => onCycleBall(1),
    });

    this.optionsContainer.add([marbleContainer, ballLeftBtn, ballRightBtn]);

    // --- Row 3: Surface ---
    const surfRowY = 650;
    const surfBtnY = 710;

    const surfLabel = this.add.text(centerX, surfRowY, 'SURFACE', {
      fontFamily: fontStack,
      fontSize: '20px',
      fontStyle: '800',
      color: '#7c5e47',
      letterSpacing: 4,
      align: 'center',
    });
    surfLabel.setOrigin(0.5);
    this.optionsContainer.add(surfLabel);

    const surfLeftBtn = createTriangleButton(this, {
      x: centerX - TRI_SPACING,
      y: surfBtnY,
      direction: 'left',
      size: 44,
      onPointerDown: () => ThemeManager.cycleSurface(-1),
    });

    const surfRightBtn = createTriangleButton(this, {
      x: centerX + TRI_SPACING,
      y: surfBtnY,
      direction: 'right',
      size: 44,
      onPointerDown: () => ThemeManager.cycleSurface(1),
    });

    this.optionsContainer.add([surfLeftBtn, surfRightBtn]);

    // Back Button (tactile squircle)
    const backButton = createTactileButton(this, {
      x: centerX,
      y: 860,
      w: 240,
      h: 68,
      radius: TITLE_CONFIG.buttonRadius,
      label: 'Back',
      fontSize: TITLE_CONFIG.buttonTextFontSize,
      onPointerDown: () => this.handleBackFromOptions(),
    });
    this.optionsContainer.add(backButton);
  }

  private handlePlay(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Slide title and buttons upward completely off the screen
    // Lowest element is options button (y: 825, height: 74).
    // Moving mainContainer.y to -1050 ensures all elements are well past the top edge.
    const exitTargetY = -(TITLE_CONFIG.optionsButtonY + TITLE_CONFIG.buttonHeight + 150);

    this.tweens.add({
      targets: this.mainContainer,
      y: exitTargetY,
      duration: 440,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Seamlessly transition into MainScene play state over the persistent background
        this.scene.start('MainScene', { fromTitle: true });
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
}
