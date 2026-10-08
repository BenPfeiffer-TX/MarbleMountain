import Phaser from 'phaser';
import { MARBLE_CONFIG } from '../config/marbleConfig';
import { ThemeManager } from '../themes/themeManager';
import { MarbleTheme } from '../themes/types';

export enum MarbleState {
  ENTERING = 'ENTERING',
  ARRIVAL_LIFT = 'ARRIVAL_LIFT',
  ARRIVAL_BOUNCE = 'ARRIVAL_BOUNCE',
  ROLLING = 'ROLLING',
  FALLING = 'FALLING',
  GAME_OVER = 'GAME_OVER',
}

/**
 * SHINY METALLIC BALL BEARING MARBLE COMPONENT
 *
 * Implements:
 * 1. Clean, shiny metallic steel ball bearing visual appearance decoupled via ThemeManager.
 * 2. Pure rolling physics along the mechanical tilting bar (no sliding, inertia + friction).
 * 3. Kinetic arrival lift-off and bounce sequence when entering the scene.
 * 4. Free-fall projectile physics when rolling off the bar tips.
 */
export class Marble extends Phaser.GameObjects.Container {
  private marbleState: MarbleState = MarbleState.ENTERING;

  // Bar-relative coordinates (when on the bar)
  private s: number = 0; // Distance along the bar from center (-W_half to +W_half)
  private v_s: number = 0; // Linear velocity along the bar (px/s)
  private h: number = 0; // Height lifted above the bar surface (px)
  private v_h: number = 0; // Vertical lift velocity relative to the bar (px/s)

  // World-space coordinates (when falling off the bar)
  private worldX: number = 0;
  private worldY: number = 0;
  private velX: number = 0;
  private velY: number = 0;

  // Rolling rotation angle around center (radians)
  private rollAngle: number = 0;

  // Visual sub-elements (2-layer composition)
  private dropShadow!: Phaser.GameObjects.Graphics;
  private bodySprite!: Phaser.GameObjects.Image; // Layer 1: Base sphere / pattern that physically rolls
  private overlaySprite?: Phaser.GameObjects.Image; // Layer 2: Stationary specular highlight & 3D gloss
  private unsubscribeTheme?: () => void;

  private onGameOverCallback?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createVisualElements();

    scene.add.existing(this);
    this.setDepth(15);

    // Subscribe to dynamic theme switches
    this.unsubscribeTheme = ThemeManager.onThemeChanged((theme) => {
      this.applyTheme(theme.marble);
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.unsubscribeTheme) {
        this.unsubscribeTheme();
      }
    });
  }

  private createVisualElements(): void {
    const r = MARBLE_CONFIG.radius;
    const theme = ThemeManager.getActiveTheme().marble;

    // 1. Soft contact drop shadow beneath marble
    this.dropShadow = this.scene.add.graphics();
    theme.drawShadow(this.dropShadow, r);
    this.add(this.dropShadow);

    // 2. Base Body Sprite (Layer 1 - rolls with physics if theme.rotatesBody is true)
    const baseKey = theme.ensureBaseTexture
      ? theme.ensureBaseTexture(this.scene.textures, r)
      : theme.ensureTexture!(this.scene.textures, r);
    this.bodySprite = this.scene.add.image(0, 0, baseKey);
    this.add(this.bodySprite);

    // 3. Stationary Overlay Sprite (Layer 2 - fixed specular gloss & lighting)
    const overlayKey = theme.ensureOverlayTexture
      ? theme.ensureOverlayTexture(this.scene.textures, r)
      : null;
    if (overlayKey) {
      this.overlaySprite = this.scene.add.image(0, 0, overlayKey);
      this.add(this.overlaySprite);
    }
  }

  /**
   * Updates visual appearance when a new theme is activated.
   */
  public applyTheme(theme: MarbleTheme): void {
    const r = MARBLE_CONFIG.radius;
    const baseKey = theme.ensureBaseTexture
      ? theme.ensureBaseTexture(this.scene.textures, r)
      : theme.ensureTexture!(this.scene.textures, r);

    if (this.bodySprite) {
      this.bodySprite.setTexture(baseKey);
      const shouldRotate = theme.rotatesBody ?? theme.rotatesTexture ?? false;
      if (!shouldRotate) {
        this.bodySprite.setRotation(0);
      }
    }

    const overlayKey = theme.ensureOverlayTexture
      ? theme.ensureOverlayTexture(this.scene.textures, r)
      : null;

    if (overlayKey) {
      if (!this.overlaySprite) {
        this.overlaySprite = this.scene.add.image(0, 0, overlayKey);
        this.add(this.overlaySprite);
      } else {
        this.overlaySprite.setTexture(overlayKey);
        this.overlaySprite.setVisible(true);
      }
    } else if (this.overlaySprite) {
      this.overlaySprite.setVisible(false);
    }

    if (this.dropShadow) {
      theme.drawShadow(this.dropShadow, r);
    }
  }

  /**
   * Sets callback when ball falls off-screen to trigger Game Over modal.
   */
  public setOnGameOver(cb: () => void): void {
    this.onGameOverCallback = cb;
  }

  /**
   * Resets marble state and positions it centered on top of the bar.
   */
  public resetToCenter(barX: number, barY: number, barAngle: number, barHeight: number): void {
    this.marbleState = MarbleState.ROLLING;
    this.s = 0;
    this.v_s = 0;
    this.h = 0;
    this.v_h = 0;
    this.rollAngle = 0;
    if (this.bodySprite) {
      this.bodySprite.setRotation(0);
    }
    const theme = ThemeManager.getActiveTheme().marble;
    theme.drawShadow(this.dropShadow, MARBLE_CONFIG.radius);
    this.dropShadow.setAlpha(MARBLE_CONFIG.shadowAlpha);
    this.dropShadow.setScale(1);

    const r = MARBLE_CONFIG.radius;
    const dPerp = barHeight / 2 + r;
    this.x = barX + dPerp * Math.sin(barAngle);
    this.y = barY - dPerp * Math.cos(barAngle);
  }

  /**
   * Triggered when the bar comes to a sudden rest upon arrival from the title screen.
   * Gives the marble upward inertia to lift off the bar, drop, and do one small bounce.
   */
  public startArrivalLift(): void {
    this.marbleState = MarbleState.ARRIVAL_LIFT;
    this.v_h = MARBLE_CONFIG.arrivalLiftSpeed;
    this.h = 0;
  }

  /**
   * Main Physics Update Loop called every scene frame.
   */
  public updatePhysics(
    dt: number,
    barX: number,
    barY: number,
    barRestY: number,
    barAngle: number,
    barAngularVel: number,
    barHalfWidth: number,
    barHeight: number,
    screenHeight: number,
    screenWidth: number
  ): void {
    const r = MARBLE_CONFIG.radius;

    // --- STATE 1: ENTERING (Riding bar upward from off-screen) ---
    if (this.marbleState === MarbleState.ENTERING) {
      this.s = 0;
      this.h = 0;
      const dPerp = barHeight / 2 + r;
      this.x = barX + dPerp * Math.sin(barAngle);
      this.y = barY - dPerp * Math.cos(barAngle);

      // As bar begins decelerating into resting position, the marble's upward momentum
      // carries it into the air in a continuous fluid motion while the bar halts underneath it
      if (barY <= barRestY + 32) {
        this.marbleState = MarbleState.ARRIVAL_LIFT;
        this.v_h = MARBLE_CONFIG.arrivalLiftSpeed;
      }
      return;
    }

    // --- STATE 2: ARRIVAL LIFT & BOUNCE (Inertia lift off bar when bar comes to rest) ---
    if (this.marbleState === MarbleState.ARRIVAL_LIFT || this.marbleState === MarbleState.ARRIVAL_BOUNCE) {
      this.v_h -= MARBLE_CONFIG.gravity * dt;
      this.h += this.v_h * dt;

      // Drop shadow shrinks and softens as ball lifts away from the bar
      const liftFactor = Math.max(0, this.h);
      this.dropShadow.setScale(Math.max(0.5, 1 / (1 + liftFactor * 0.04)));
      this.dropShadow.setAlpha(
        Math.max(0.08, MARBLE_CONFIG.shadowAlpha / (1 + liftFactor * 0.05))
      );

      if (this.h <= 0) {
        this.h = 0;
        if (this.marbleState === MarbleState.ARRIVAL_LIFT) {
          // Rebound into one small bounce
          this.v_h = Math.abs(this.v_h) * MARBLE_CONFIG.bounceRestitution;
          this.marbleState = MarbleState.ARRIVAL_BOUNCE;
        } else {
          // Settled on bar
          this.v_h = 0;
          this.dropShadow.setScale(1);
          this.dropShadow.setAlpha(MARBLE_CONFIG.shadowAlpha);
          this.marbleState = MarbleState.ROLLING;
        }
      }

      const dPerp = barHeight / 2 + r + this.h;
      this.x = barX + this.s * Math.cos(barAngle) + dPerp * Math.sin(barAngle);
      this.y = barY + this.s * Math.sin(barAngle) - dPerp * Math.cos(barAngle);
      return;
    }

    // --- STATE 3: ROLLING ON THE BAR ---
    if (this.marbleState === MarbleState.ROLLING) {
      const sinTilt = Math.sin(barAngle);
      const cosTilt = Math.cos(barAngle);

      // 1. Gravitational acceleration along the inclined plane (rolling without slipping: 5/7 * g * sin(theta))
      const aGravity = MARBLE_CONFIG.rollingAccelerationFactor * MARBLE_CONFIG.gravity * sinTilt;

      // 2. Centrifugal acceleration outward from center: s * omega^2
      const aCentrifugal = this.s * (barAngularVel * barAngularVel);

      // 3. Rolling Resistance (Friction + Viscous Rolling Drag)
      const drag = -this.v_s * MARBLE_CONFIG.rollingDrag;
      const frictionMagnitude = Math.min(MARBLE_CONFIG.rollingFriction, Math.abs(this.v_s) / dt);
      const friction = this.v_s !== 0 ? -Math.sign(this.v_s) * frictionMagnitude : 0;

      // Static friction: When nearly flat and essentially stopped, hold position without micro-drift
      if (
        Math.abs(sinTilt) < MARBLE_CONFIG.staticFrictionAngleRad &&
        Math.abs(this.v_s) < 1.0
      ) {
        this.v_s = 0;
      } else {
        const totalAccel = aGravity + aCentrifugal + friction + drag;
        this.v_s += totalAccel * dt;
        this.v_s = Phaser.Math.Clamp(
          this.v_s,
          -MARBLE_CONFIG.maxRollSpeed,
          MARBLE_CONFIG.maxRollSpeed
        );
      }

      this.s += this.v_s * dt;

      // Pure rolling rotation: distance rolled / radius = rotation in radians
      this.rollAngle += (this.v_s * dt) / r;
      const theme = ThemeManager.getActiveTheme().marble;
      const shouldRotate = theme.rotatesBody ?? theme.rotatesTexture ?? false;
      if (shouldRotate && this.bodySprite) {
        this.bodySprite.setRotation(this.rollAngle);
      }

      // Calculate world position on the bar surface
      const dPerp = barHeight / 2 + r;
      this.x = barX + this.s * cosTilt + dPerp * sinTilt;
      this.y = barY + this.s * sinTilt - dPerp * cosTilt;

      // Check if marble has rolled off the ends of the bar
      if (Math.abs(this.s) > barHalfWidth) {
        this.marbleState = MarbleState.FALLING;
        this.worldX = this.x;
        this.worldY = this.y;

        // Tangential departure velocity in world space
        this.velX = this.v_s * cosTilt - this.s * barAngularVel * sinTilt;
        this.velY = this.v_s * sinTilt + this.s * barAngularVel * cosTilt;

        // Fade shadow off when leaving the bar surface
        this.dropShadow.setAlpha(0);
      }
      return;
    }

    // --- STATE 4: FALLING (Rolled off bar, free fall projectile) ---
    if (this.marbleState === MarbleState.FALLING) {
      this.velY += MARBLE_CONFIG.gravity * dt;
      this.worldX += this.velX * dt;
      this.worldY += this.velY * dt;

      this.rollAngle += (this.v_s / r) * dt;
      const theme = ThemeManager.getActiveTheme().marble;
      const shouldRotate = theme.rotatesBody ?? theme.rotatesTexture ?? false;
      if (shouldRotate && this.bodySprite) {
        this.bodySprite.setRotation(this.rollAngle);
      }

      this.x = this.worldX;
      this.y = this.worldY;

      // Check if ball has fallen off screen below the bar / viewport
      if (
        this.y > screenHeight + 70 ||
        this.x < -70 ||
        this.x > screenWidth + 70
      ) {
        this.marbleState = MarbleState.GAME_OVER;
        if (this.onGameOverCallback) {
          this.onGameOverCallback();
        }
      }
      return;
    }
  }

  public getMarbleState(): MarbleState {
    return this.marbleState;
  }
}
