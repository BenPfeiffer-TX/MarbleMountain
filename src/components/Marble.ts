import Phaser from 'phaser';
import { MARBLE_CONFIG } from '../config/marbleConfig';

export enum MarbleState {
  ENTERING = 'ENTERING',
  ARRIVAL_LIFT = 'ARRIVAL_LIFT',
  ARRIVAL_BOUNCE = 'ARRIVAL_BOUNCE',
  ROLLING = 'ROLLING',
  FALLING = 'FALLING',
  GAME_OVER = 'GAME_OVER',
}

/**
 * METALLIC STEEL MARBLE COMPONENT
 *
 * Implements:
 * 1. Reflective chrome/steel visual appearance with rotating brushed steel surface
 *    and stationary specular highlight to clearly convey rolling without sliding.
 * 2. Pure rolling physics along the mechanical tilting bar (no sliding, inertia + friction).
 * 3. Arrival lift-off and bounce sequence when entering the scene.
 * 4. Departure and free-fall projectile physics when rolling off the bar tips.
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

  // Visual sub-elements
  private dropShadow!: Phaser.GameObjects.Graphics;
  private rotatingBodyContainer!: Phaser.GameObjects.Container;
  private fixedSpecularHighlight!: Phaser.GameObjects.Graphics;

  private onGameOverCallback?: () => void;

  private static readonly TEXTURE_KEY = 'metallicSteelMarbleBody';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.ensureMarbleTextures();
    this.createVisualElements();

    scene.add.existing(this);
    this.setDepth(15);
  }

  /**
   * Generates high-res reflective metallic steel sphere canvas texture.
   */
  private ensureMarbleTextures(): void {
    const key = Marble.TEXTURE_KEY;
    if (this.scene.textures.exists(key)) return;

    const r = MARBLE_CONFIG.radius;
    const size = r * 2 + 4;
    const canvas = this.scene.textures.createCanvas(key, size, size);
    if (!canvas) return;

    const ctx = canvas.getContext();
    const cx = size / 2;
    const cy = size / 2;

    // 1. Dark outer steel rim shadow
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#22272c';
    ctx.fill();

    // 2. Spherical steel radial gradient
    // Light source positioned top-left (-0.32r, -0.32r)
    const grad = ctx.createRadialGradient(
      cx - r * 0.32,
      cy - r * 0.32,
      r * 0.05,
      cx,
      cy,
      r
    );
    grad.addColorStop(0.0, '#ffffff'); // Crisp specular core
    grad.addColorStop(0.18, '#e6ebed'); // Bright silver
    grad.addColorStop(0.45, '#a6b2ba'); // Mid reflective steel
    grad.addColorStop(0.72, '#6d7780'); // Shadowed steel tone
    grad.addColorStop(0.92, '#3e454d'); // Dark steel rim
    grad.addColorStop(1.0, '#262a2e'); // Contour border

    ctx.beginPath();
    ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 3. Subtle brushed steel surface grain lines (rotates with ball to prove rolling)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.65, 0.4, 2.7);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(30, 36, 42, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 3.4, 5.8);
    ctx.stroke();

    // Latitudinal polished steel equator seam for visible rotation feedback
    ctx.strokeStyle = 'rgba(240, 246, 250, 0.28)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.85, r * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    canvas.refresh();
  }

  private createVisualElements(): void {
    const r = MARBLE_CONFIG.radius;

    // 1. Drop shadow cast onto the wood bar (or ground)
    this.dropShadow = this.scene.add.graphics();
    this.dropShadow.fillStyle(MARBLE_CONFIG.shadowColor, MARBLE_CONFIG.shadowAlpha);
    this.dropShadow.fillEllipse(0, r + 1, r * 1.5, 6);
    this.add(this.dropShadow);

    // 2. Rotating Steel Body Container
    this.rotatingBodyContainer = this.scene.add.container(0, 0);
    const bodySprite = this.scene.add.image(0, 0, Marble.TEXTURE_KEY);
    this.rotatingBodyContainer.add(bodySprite);
    this.add(this.rotatingBodyContainer);

    // 3. Stationary Specular Glare (stays aligned to light source at top-left)
    this.fixedSpecularHighlight = this.scene.add.graphics();
    this.fixedSpecularHighlight.fillStyle(0xffffff, 0.75);
    this.fixedSpecularHighlight.fillEllipse(-r * 0.35, -r * 0.35, r * 0.45, r * 0.3);
    this.fixedSpecularHighlight.fillStyle(0xffffff, 0.95);
    this.fixedSpecularHighlight.fillCircle(-r * 0.33, -r * 0.33, r * 0.16);
    // Subtle ambient underside rim reflection
    this.fixedSpecularHighlight.lineStyle(1.5, 0xc8b69b, 0.25);
    this.fixedSpecularHighlight.beginPath();
    this.fixedSpecularHighlight.arc(0, 0, r - 1.5, Math.PI * 0.25, Math.PI * 0.75);
    this.fixedSpecularHighlight.strokePath();

    this.add(this.fixedSpecularHighlight);
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
    this.rotatingBodyContainer.setRotation(0);
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
      this.rotatingBodyContainer.setRotation(this.rollAngle);

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
      this.rotatingBodyContainer.setRotation(this.rollAngle);

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
