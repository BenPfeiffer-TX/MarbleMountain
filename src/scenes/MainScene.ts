import Phaser from 'phaser';

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
  // Bar components
  private barContainer!: Phaser.GameObjects.Container;
  private barGraphics!: Phaser.GameObjects.Graphics;

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

    // Ensure persistent BackgroundScene is running behind MainScene
    if (!this.scene.isActive('BackgroundScene')) {
      this.scene.launch('BackgroundScene');
      this.scene.sendToBack('BackgroundScene');
    }
    this.scene.bringToTop();

    // 1. Wood Grain Bar (rotates around pinned center 0,0 - no visible pivot)
    this.barContainer = this.add.container(barCenterX, barCenterY);
    this.barGraphics = this.add.graphics();
    this.drawWoodBar(this.barGraphics, barWidth, BAR_CONFIG.barHeight);
    this.barContainer.add(this.barGraphics);

    // 2. Invisible Outer Touch Zones
    this.createTouchZones(width, barCenterY);

    // 3. Global Pointer Movement and Release Handlers
    this.setupGlobalPointerListeners();

    // 4. Downward arrival transition when entering from title screen
    // Bar glides down into resting position over the persistent animated background
    if (this.fromTitle) {
      this.barContainer.y = barCenterY - 70;
      this.barContainer.alpha = 0.5;
      this.tweens.add({
        targets: this.barContainer,
        y: barCenterY,
        alpha: 1.0,
        duration: 400,
        ease: 'Cubic.easeOut',
      });
    }
  }

  private drawWoodBar(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    g.clear();
    const halfW = w / 2;
    const halfH = h / 2;
    const r = BAR_CONFIG.barCornerRadius;

    // Soft contact drop shadow beneath bar
    g.fillStyle(0x3a2c1d, 0.26);
    g.fillRoundedRect(-halfW, -halfH + 5, w, h, r);

    // Wood base rounded rectangle
    g.fillStyle(BAR_CONFIG.woodBaseColor, 1.0);
    g.fillRoundedRect(-halfW, -halfH, w, h, r);

    // Subtle wood grain lines along the length
    const grainLines = [
      { yOffset: -halfH + 3.5, color: BAR_CONFIG.woodGrainLightColor, alpha: 0.35, width: 2 },
      { yOffset: -halfH + 7.5, color: BAR_CONFIG.woodGrainDarkColor, alpha: 0.25, width: 1.5 },
      { yOffset: -halfH + 11.5, color: BAR_CONFIG.woodGrainLightColor, alpha: 0.20, width: 1 },
      { yOffset: -halfH + 15.5, color: BAR_CONFIG.woodGrainDarkColor, alpha: 0.30, width: 2 },
      { yOffset: -halfH + 18.5, color: BAR_CONFIG.woodGrainLightColor, alpha: 0.25, width: 1.5 },
    ];

    grainLines.forEach((grain) => {
      g.lineStyle(grain.width, grain.color, grain.alpha);
      g.lineBetween(-halfW + 6, grain.yOffset, halfW - 6, grain.yOffset);
    });

    // Soft perimeter edge shadow to give the wood bar tactile depth
    g.lineStyle(1.5, BAR_CONFIG.woodGrainDarkColor, 0.45);
    g.strokeRoundedRect(-halfW, -halfH, w, h, r);
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
      this.leftPointerId = pointer.id;
      this.leftAnchorY = pointer.y;
      this.leftFilteredY = pointer.y;
    });

    // Dedicated Right Invisible Hit Area (with generous padding)
    this.rightZone = this.add.zone(rightX, barCenterY, zoneW + pad * 2, zoneH + pad * 2);
    this.rightZone.setInteractive({ useHandCursor: true });
    this.rightZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.rightPointerId = pointer.id;
      this.rightAnchorY = pointer.y;
      this.rightFilteredY = pointer.y;
    });
  }

  private setupGlobalPointerListeners(): void {
    // Track active pointer movements with deadzone filtering to absorb micro-tremors
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
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

    const maxRad = Phaser.Math.DegToRad(BAR_CONFIG.maxDeflectionDeg);

    const isLeftActive = this.leftPointerId !== null;
    const isRightActive = this.rightPointerId !== null;

    // Calculate target angle based on deadzone-filtered touch coordinates & sensitivity scaling
    if (isLeftActive && isRightActive) {
      // Both fingers on screen: angle formed by line connecting left and right touches
      const dY = (this.rightFilteredY - this.leftFilteredY) * BAR_CONFIG.touchSensitivity;
      const dX = halfW * 2;
      this.targetAngleRad = Math.atan2(dY, dX);
    } else if (isLeftActive) {
      // Only left finger active: pivot around pinned center
      // Moving left touch up (leftFilteredY < barCenterY) tilts bar clockwise (+angle)
      const dY = (barCenterY - this.leftFilteredY) * BAR_CONFIG.touchSensitivity;
      this.targetAngleRad = Math.atan2(dY, halfW);
    } else if (isRightActive) {
      // Only right finger active: pivot around pinned center
      // Moving right touch down (rightFilteredY > barCenterY) tilts bar clockwise (+angle)
      const dY = (this.rightFilteredY - barCenterY) * BAR_CONFIG.touchSensitivity;
      this.targetAngleRad = Math.atan2(dY, halfW);
    } else {
      // Neither finger active
      if (BAR_CONFIG.autoCenterOnRelease) {
        this.targetAngleRad = 0;
      }
    }

    // Clamp target angle to +- maxDeflectionDeg (+-30 degrees)
    this.targetAngleRad = Phaser.Math.Clamp(this.targetAngleRad, -maxRad, maxRad);

    // Physical inertia simulation using second-order critically damped angular mechanics
    const dt = Math.min(delta / 1000, 0.05); // Safe clamped frame time step in seconds
    const angleError = this.targetAngleRad - this.currentAngleRad;

    // Spring torque pulling towards target angle + damping torque resisting velocity
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

    // Hard mechanical limits at max deflection angles (+-30 deg)
    if (this.currentAngleRad >= maxRad) {
      this.currentAngleRad = maxRad;
      this.angularVelocity = 0;
    } else if (this.currentAngleRad <= -maxRad) {
      this.currentAngleRad = -maxRad;
      this.angularVelocity = 0;
    }

    // Apply rotation to the bar container
    this.barContainer.setRotation(this.currentAngleRad);
  }
}
