import Phaser from 'phaser';
import { ThemeManager } from '../themes/themeManager';

export interface TactileButtonConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  label: string;
  fontSize?: string;
  onPointerDown: () => void;
}

/**
 * Creates a tactile 3D squircle button whose visual texture and styling
 * are driven directly by the centralized ThemeManager.
 *
 * When themes change (e.g. from wood to neon), all buttons automatically inherit
 * the active theme's base, face plate, typography, and press shading.
 */
export function createTactileButton(
  scene: Phaser.Scene,
  config: TactileButtonConfig
): Phaser.GameObjects.Container {
  const theme = ThemeManager.getActiveTheme().button;
  const w = config.w;
  const h = config.h;
  const r = config.radius;
  const pressDepth = theme.pressDepth || 6;
  const fontSize = config.fontSize || '24px';

  const btnContainer = scene.add.container(config.x, config.y);

  // 1. Stationary Base & Shadow (rendered from active theme)
  const baseG = scene.add.graphics();
  theme.drawBase(baseG, w, h, r);
  btnContainer.add(baseG);

  // 2. Movable Top Face Container (sinks down when pressed, springs up on release)
  const faceContainer = scene.add.container(0, -pressDepth);

  const faceG = scene.add.graphics();
  theme.drawFace(faceG, w, h, r);
  faceContainer.add(faceG);

  // Button text label (rendered from active theme font and color)
  const label = scene.add.text(0, 0, config.label, {
    fontFamily: theme.fontFamily,
    fontSize,
    fontStyle: '700',
    color: theme.textColor,
    align: 'center',
  });
  label.setOrigin(0.5);
  faceContainer.add(label);

  // Press shading overlay (rendered from active theme)
  const shadeOverlay = scene.add.graphics();
  theme.drawPressShade(shadeOverlay, w, h, r);
  shadeOverlay.setAlpha(0);
  faceContainer.add(shadeOverlay);

  btnContainer.add(faceContainer);

  // Dynamic theme change listener
  const redraw = () => {
    const currentTheme = ThemeManager.getActiveTheme().button;
    currentTheme.drawBase(baseG, w, h, r);
    currentTheme.drawFace(faceG, w, h, r);
    currentTheme.drawPressShade(shadeOverlay, w, h, r);
    label.setStyle({
      fontFamily: currentTheme.fontFamily,
      fontSize,
      fontStyle: '700',
      color: currentTheme.textColor,
      align: 'center',
    });
  };
  const unsubscribe = ThemeManager.onThemeChanged(() => redraw());
  btnContainer.once(Phaser.GameObjects.Events.DESTROY, () => {
    unsubscribe();
  });

  // 3. Dedicated Interactive Touch Zone at local (0, 0)
  const zone = scene.add.zone(0, 0, w + 24, h + 24);
  zone.setInteractive({ useHandCursor: true });
  btnContainer.add(zone);

  let isPressed = false;
  zone.on('pointerdown', () => {
    if (isPressed) return;
    isPressed = true;

    // 1. Instantly sink down and darken
    faceContainer.y = 0;
    shadeOverlay.setAlpha(1);

    // 2. Spring up with punchy recoil and fire action
    scene.time.delayedCall(80, () => {
      scene.tweens.add({
        targets: faceContainer,
        y: -pressDepth,
        duration: 100,
        ease: 'Back.easeOut',
        onComplete: () => {
          shadeOverlay.setAlpha(0);
          isPressed = false;
          config.onPointerDown();
        },
      });
    });
  });

  const resetState = () => {
    if (!isPressed) {
      faceContainer.y = -pressDepth;
      shadeOverlay.setAlpha(0);
    }
  };
  zone.on('pointerout', resetState);
  zone.on('pointercancel', resetState);

  return btnContainer;
}
