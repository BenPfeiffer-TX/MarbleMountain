import Phaser from 'phaser';
import { Marble, MarbleState } from '../components/Marble';
import { WallManager } from '../components/WallManager';
import { GameOverModal } from '../ui/GameOverModal';
import { MARBLE_CONFIG } from '../config/marbleConfig';
import { BackgroundScene } from './BackgroundScene';
import { ThemeManager } from '../themes/themeManager';

/**
 * TUNABLE GAMEPLAY & VISUAL CONFIGURATION
 * Adjust these parameters to fine-tune the feel and appearance of the bar and controls.
 */
export const BAR_CONFIG = {
  // Positioning & Dimensions
  barYRatio: 0.885, // Lowered so max deflection tip (at 20 deg) sits just above the bottom edge
  barWidthRatio: 0.92, // Extends 92% of screen width (within 90-95% specification)
  barHeight: 22, // 10% thicker (increased from 20px to 22px)
  barCornerRadius: 8, // Rounded corner radius of the wood rectangle

  // Motion & Rotation Limits
  maxDeflectionDeg: 20, // Maximum deflection angle (+- 20 degrees)
  autoCenterOnRelease: false, // false = mechanical hold (Ice Cold Beer style), true = spring back to 0°

  // Touch Input Deadzone & Sensitivity
  touchDeadzonePx: 7, // Minimum vertical movement threshold (pixels) before motion registers (filters tremors)
  touchSensitivity: 0.80, // Sensitivity multiplier (lower = less twitchy, more deliberate control)

  // Inertia & Physics Feel
  inertiaStiffness: 55, // How eagerly the bar follows target angle (lower = heavier inertia)
  inertiaDamping: 15, // Damping against angular velocity (critically damped to eliminate oscillation)
  maxAngularSpeed: 3.5, // Maximum angular speed in rad/sec (prevents whipping on rapid flicks)

  // Touch Zones (Outer Edges - fully functional but invisible)
  touchZoneWidthRatio: 0.35, // Width of each outer touch zone (35% screen width on left & right)
  touchZoneHeight: 460, // Vertical touch reach for thumb movement
  touchZonePadding: 30, // Dedicated hit area padding (+30px margin)

  // Minimalist Visual Styling
  paperColor: 0xdfd5c0, // Warm natural construction paper tone
  woodBaseColor: 0x9c6638, // Warm natural wood grain base
  woodGrainDarkColor: 0x7c4e27, // Darker wood grain fibers
  woodGrainLightColor: 0xb57c4c, // Lighter wood grain highlights
};

export class MainScene extends Phaser.Scene {
  // Gameplay containers & managers
  private playContainer!: Phaser.GameObjects.Container;
  private wallManager!: WallManager;
  private barContainer!: Phaser.GameObjects.Container;
  private barGraphics!: Phaser.GameObjects.Graphics;

  // Marble component
  private marble!: Marble;

  // Game Over Modal UI
  private gameOverModal!: GameOverModal;
  private isGameOverActive: boolean = false;
  private unsubscribeTheme?: () => void;

  // Touch zones (invisible hit areas)
  private leftZone!: Phaser.GameObjects.Zone;
  private rightZone!: Phaser.GameObjects.Zone;

  // Touch tracking state & deadzone anchors
  private leftPointerId: number | null = null;
  private rightPointerId: number | null = null;
  private leftAnchorY: number = 0;
  private rightAnchorY: number = 0;
  private leftFilteredY: number = 0;
  private rightFilteredY: number = 0;

  // Rotation angles & angular velocity (for physical inertia)
  private currentAngleRad: number = 0;
  private targetAngleRad: number = 0;
  private angularVelocity: number = 0;

  private fromTitle: boolean = false;

  constructor() {
    super('MainScene');
  }

  init(data?: { fromTitle?: boolean }): void {
    this.fromTitle = data?.fromTitle ?? false;
  }

  create(): void {
    const { width, height } = this.scale;
    const barCenterX = width / 2;
    const barCenterY = height * BAR_CONFIG.barYRatio;
    const barWidth = width * BAR_CONFIG.barWidthRatio;

    this.leftAnchorY = barCenterY;
    this.rightAnchorY = barCenterY;
    this.leftFilteredY = barCenterY;
    this.rightFilteredY = barCenterY;
    this.leftPointerId = null;
    this.rightPointerId = null;
    this.currentAngleRad = 0;
    this.targetAngleRad = 0;
    this.angularVelocity = 0;
    this.isGameOverActive = false;

    // Ensure persistent BackgroundScene is running behind MainScene
    if (!this.scene.isActive('BackgroundScene')) {
      this.scene.launch('BackgroundScene');
      this.scene.sendToBack('BackgroundScene');
    }
    this.scene.bringToTop();

    // Container grouping game elements (wall + bar + marble) for collective frosted glass blur
    this.playContainer = this.add.container(0, 0);

    // 0. Procedural Wall Holes & Speed Gauge (behind bar and marble)
    // Starts shapes halfway down the screen immediately as game begins
    this.wallManager = new WallManager(this);
    this.wallManager.startSpawning();
    this.playContainer.add(this.wallManager);

    // 1. Wood Grain Bar (rotates around pinned center 0,0 - no visible pivot)
    this.barContainer = this.add.container(barCenterX, barCenterY);
    this.barGraphics = this.add.graphics();
    this.drawWoodBar(this.barGraphics, barWidth, BAR_CONFIG.barHeight);
    this.barContainer.add(this.barGraphics);
    this.playContainer.add(this.barContainer);

    // 2. Metallic Steel Marble
    this.marble = new Marble(
      this,
      barCenterX,
      barCenterY - BAR_CONFIG.barHeight / 2 - MARBLE_CONFIG.radius
    );
    this.marble.setOnGameOver(() => this.triggerGameOver());
    this.playContainer.add(this.marble);

    // 3. Invisible Outer Touch Zones
    this.createTouchZones(width, barCenterY);

    // 4. Global Pointer Movement and Release Handlers
    this.setupGlobalPointerListeners();

    // 5. Game Over Modal Overlay
    this.gameOverModal = new GameOverModal(this);

    // 6. Upward arrival transition when entering from title screen
    if (this.fromTitle) {
      const offscreenBottomY = height + BAR_CONFIG.barHeight + 60;
      this.barContainer.y = offscreenBottomY;

      // Bar slides UP into resting position; marble momentum lifts it upward continuously as bar brakes
      this.tweens.add({
        targets: this.barContainer,
        y: barCenterY,
        duration: 440,
        ease: 'Cubic.easeOut',
      });
    } else {
      this.marble.resetToCenter(barCenterX, barCenterY, 0, BAR_CONFIG.barHeight);
    }

    // Subscribe to dynamic theme switches for the bar
    this.unsubscribeTheme = ThemeManager.onThemeChanged((theme) => {
      if (this.barGraphics) {
        const currentBarWidth = this.scale.width * BAR_CONFIG.barWidthRatio;
        theme.bar.drawBar(this.barGraphics, currentBarWidth, BAR_CONFIG.barHeight, BAR_CONFIG.barCornerRadius);
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.unsubscribeTheme) {
        this.unsubscribeTheme();
      }
    });
  }

  private drawWoodBar(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    ThemeManager.getActiveTheme().bar.drawBar(g, w, h, BAR_CONFIG.barCornerRadius);
  }

  private createTouchZones(width: number, barCenterY: number): void {
    const zoneW = width * BAR_CONFIG.touchZoneWidthRatio;
    const zoneH = BAR_CONFIG.touchZoneHeight;
    const pad = BAR_CONFIG.touchZonePadding;

    const leftX = zoneW / 2;
    const rightX = width - zoneW / 2;

    // Dedicated Left Invisible Hit Area (with generous padding)
    this.leftZone = this.add.zone(leftX, barCenterY, zoneW + pad * 2, zoneH + pad * 2);
    this.leftZone.setInteractive({ useHandCursor: true });
    this.leftZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOverActive) return;
      this.leftPointerId = pointer.id;
      this.leftAnchorY = pointer.y;
      this.leftFilteredY = pointer.y;
    });

    // Dedicated Right Invisible Hit Area (with generous padding)
    this.rightZone = this.add.zone(rightX, barCenterY, zoneW + pad * 2, zoneH + pad * 2);
    this.rightZone.setInteractive({ useHandCursor: true });
    this.rightZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOverActive) return;
      this.rightPointerId = pointer.id;
      this.rightAnchorY = pointer.y;
      this.rightFilteredY = pointer.y;
    });
  }

  private setupGlobalPointerListeners(): void {
    // Track active pointer movements with deadzone filtering to absorb micro-tremors
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOverActive) return;

      if (pointer.id === this.leftPointerId) {
        const diff = pointer.y - this.leftAnchorY;
        if (Math.abs(diff) > BAR_CONFIG.touchDeadzonePx) {
          if (diff > 0) {
            this.leftFilteredY = pointer.y - BAR_CONFIG.touchDeadzonePx;
            this.leftAnchorY = pointer.y - BAR_CONFIG.touchDeadzonePx;
          } else {
            this.leftFilteredY = pointer.y + BAR_CONFIG.touchDeadzonePx;
            this.leftAnchorY = pointer.y + BAR_CONFIG.touchDeadzonePx;
          }
        }
      }
      if (pointer.id === this.rightPointerId) {
        const diff = pointer.y - this.rightAnchorY;
        if (Math.abs(diff) > BAR_CONFIG.touchDeadzonePx) {
          if (diff > 0) {
            this.rightFilteredY = pointer.y - BAR_CONFIG.touchDeadzonePx;
            this.rightAnchorY = pointer.y - BAR_CONFIG.touchDeadzonePx;
          } else {
            this.rightFilteredY = pointer.y + BAR_CONFIG.touchDeadzonePx;
            this.rightAnchorY = pointer.y + BAR_CONFIG.touchDeadzonePx;
          }
        }
      }
    });

    // Handle release
    const handleRelease = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.leftPointerId) {
        this.leftPointerId = null;
      }
      if (pointer.id === this.rightPointerId) {
        this.rightPointerId = null;
      }
    };

    this.input.on('pointerup', handleRelease);
    this.input.on('pointerupoutside', handleRelease);
    this.input.on('gameout', () => {
      this.leftPointerId = null;
      this.rightPointerId = null;
    });
  }

  update(_time: number, delta: number): void {
    const { width, height } = this.scale;
    const barCenterY = height * BAR_CONFIG.barYRatio;
    const barWidth = width * BAR_CONFIG.barWidthRatio;
    const halfW = barWidth / 2;

    const dt = Math.min(delta / 1000, 0.05); // Safe clamped frame time step in seconds

    // 1. Update bar mechanics when game is active
    if (!this.isGameOverActive) {
      const maxRad = Phaser.Math.DegToRad(BAR_CONFIG.maxDeflectionDeg);

      const isLeftActive = this.leftPointerId !== null;
      const isRightActive = this.rightPointerId !== null;

      // Calculate target angle based on deadzone-filtered touch coordinates & sensitivity scaling
      if (isLeftActive && isRightActive) {
        const dY = (this.rightFilteredY - this.leftFilteredY) * BAR_CONFIG.touchSensitivity;
        const dX = halfW * 2;
        this.targetAngleRad = Math.atan2(dY, dX);
      } else if (isLeftActive) {
        const dY = (barCenterY - this.leftFilteredY) * BAR_CONFIG.touchSensitivity;
        this.targetAngleRad = Math.atan2(dY, halfW);
      } else if (isRightActive) {
        const dY = (this.rightFilteredY - barCenterY) * BAR_CONFIG.touchSensitivity;
        this.targetAngleRad = Math.atan2(dY, halfW);
      } else {
        if (BAR_CONFIG.autoCenterOnRelease) {
          this.targetAngleRad = 0;
        }
      }

      // Clamp target angle to +- maxDeflectionDeg
      this.targetAngleRad = Phaser.Math.Clamp(this.targetAngleRad, -maxRad, maxRad);

      // Physical inertia simulation using second-order critically damped angular mechanics
      const angleError = this.targetAngleRad - this.currentAngleRad;
      const springTorque = angleError * BAR_CONFIG.inertiaStiffness;
      const dampingTorque = -this.angularVelocity * BAR_CONFIG.inertiaDamping;
      const angularAcceleration = springTorque + dampingTorque;

      this.angularVelocity += angularAcceleration * dt;
      this.angularVelocity = Phaser.Math.Clamp(
        this.angularVelocity,
        -BAR_CONFIG.maxAngularSpeed,
        BAR_CONFIG.maxAngularSpeed
      );

      this.currentAngleRad += this.angularVelocity * dt;

      // Hard mechanical limits at max deflection angles
      if (this.currentAngleRad >= maxRad) {
        this.currentAngleRad = maxRad;
        this.angularVelocity = 0;
      } else if (this.currentAngleRad <= -maxRad) {
        this.currentAngleRad = -maxRad;
        this.angularVelocity = 0;
      }

      this.barContainer.setRotation(this.currentAngleRad);
    }

    // 2. Update wall obstacles and speed gauge progression
    this.wallManager.updateWall(dt, height);

    // 3. Update marble physics and rolling dynamics
    this.marble.updatePhysics(
      dt,
      this.barContainer.x,
      this.barContainer.y,
      barCenterY,
      this.currentAngleRad,
      this.angularVelocity,
      halfW,
      BAR_CONFIG.barHeight,
      height,
      width
    );

    // 4. Wall Hole Collision Check: Triggers pit fall animation when marble center enters a hole
    if (this.marble.getMarbleState() === MarbleState.ROLLING) {
      const hole = this.wallManager.getHoleAt(this.marble.x, this.marble.y);
      if (hole) {
        const center = this.wallManager.getHoleScreenCenter(hole);
        this.marble.startHoleFall(center);
        this.wallManager.stopScrolling();
      }
    }
  }

  /**
   * Triggers Game Over state:
   * Heavily blurs the view of background and bar as if viewed through frosted glass,
   * and presents the Game Over modal card with Try Again, Main Menu, and Highscore chart.
   */
  private triggerGameOver(): void {
    if (this.isGameOverActive) return;
    this.isGameOverActive = true;

    // Stop wall motion immediately
    this.wallManager.stopScrolling();

    // Release all active touch pointers
    this.leftPointerId = null;
    this.rightPointerId = null;

    // Apply frosted blur to background scene and play area
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    if (bgScene && typeof bgScene.setFrostedBlur === 'function') {
      bgScene.setFrostedBlur(true);
    }
    if (this.playContainer.postFX) {
      this.playContainer.postFX.addBlur(2, 4, 4, 2);
    }

    // Display Game Over Modal
    this.gameOverModal.show(
      () => this.handleTryAgain(),
      () => this.handleMainMenu()
    );
  }

  /**
   * Resets the play state for another attempt:
   * Clears frosted glass blur, resets bar angle, and centers marble on top of the bar.
   */
  private handleTryAgain(): void {
    const { width, height } = this.scale;
    const barCenterX = width / 2;
    const barCenterY = height * BAR_CONFIG.barYRatio;

    // Clear frosted blur from background and play area
    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    if (bgScene && typeof bgScene.setFrostedBlur === 'function') {
      bgScene.setFrostedBlur(false);
    }
    if (this.playContainer.postFX) {
      this.playContainer.postFX.clear();
    }

    this.gameOverModal.hide(() => {
      // Reset bar rotation state
      this.currentAngleRad = 0;
      this.targetAngleRad = 0;
      this.angularVelocity = 0;
      this.barContainer.setRotation(0);

      // Reset wall obstacles and restart scrolling
      this.wallManager.reset();
      this.wallManager.startSpawning();

      // Reset marble on top of the bar
      this.marble.resetToCenter(barCenterX, barCenterY, 0, BAR_CONFIG.barHeight);
      this.isGameOverActive = false;
    });
  }

  /**
   * Returns to Title Scene:
   * Clears frosted glass blur and switches scenes.
   */
  private handleMainMenu(): void {
    this.wallManager.reset();

    const bgScene = this.scene.get('BackgroundScene') as BackgroundScene;
    if (bgScene && typeof bgScene.setFrostedBlur === 'function') {
      bgScene.setFrostedBlur(false);
    }
    if (this.playContainer.postFX) {
      this.playContainer.postFX.clear();
    }

    // Reset bar angle and velocity
    this.currentAngleRad = 0;
    this.targetAngleRad = 0;
    this.angularVelocity = 0;
    this.leftPointerId = null;
    this.rightPointerId = null;
    this.barContainer.setRotation(0);

    this.gameOverModal.hide(() => {
      this.scene.start('TitleScene');
    });
  }
}
