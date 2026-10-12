import Phaser from 'phaser';
import { MARBLE_CONFIG } from '../config/marbleConfig';
import { createTactileButton } from './TactileButton';
import { ScoreManager } from '../utils/ScoreManager';

/**
 * GAME OVER MODAL COMPONENT
 *
 * Displays when the marble falls off the bar or into a pit:
 * - Frosted glass backdrop heavily blurring the view of background and bar.
 * - Rounded-edge card in the center with "Game over!" title.
 * - Current run score display.
 * - Personal High Score Board tracking the single persistent high score value.
 * - Tactile 3D wood squircle buttons for "Try Again" and "Main Menu" side-by-side.
 */
export class GameOverModal extends Phaser.GameObjects.Container {
  private backdrop!: Phaser.GameObjects.Graphics;
  private cardContainer!: Phaser.GameObjects.Container;
  private isVisibleModal: boolean = false;

  private scoreValueText!: Phaser.GameObjects.Text;
  private highScoreValueText!: Phaser.GameObjects.Text;
  private newBestBadge!: Phaser.GameObjects.Text;

  private onTryAgainCallback?: () => void;
  private onMainMenuCallback?: () => void;

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    super(scene, 0, 0);

    this.createFrostedBackdrop(width, height);
    this.createModalCard(width, height);

    this.setDepth(100);
    this.setVisible(false);
    this.setAlpha(0);

    scene.add.existing(this);
  }

  /**
   * Fullscreen translucent frosted glass backdrop overlay.
   */
  private createFrostedBackdrop(width: number, height: number): void {
    this.backdrop = this.scene.add.graphics();
    // Translucent frosted glass tint
    this.backdrop.fillStyle(0xf4ede4, 0.60);
    this.backdrop.fillRect(0, 0, width, height);

    // Subtle diffuse frosted noise flecks
    const seedRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    let seed = 123;
    for (let i = 0; i < 450; i++) {
      const px = seedRandom(seed++) * width;
      const py = seedRandom(seed++) * height;
      const isWhite = seedRandom(seed++) > 0.45;
      const color = isWhite ? 0xffffff : 0x7c6d5c;
      const alpha = 0.03 + seedRandom(seed++) * 0.06;

      this.backdrop.fillStyle(color, alpha);
      this.backdrop.fillCircle(px, py, 1.5 + seedRandom(seed++) * 2.0);
    }

    this.add(this.backdrop);
  }

  /**
   * Creates the centered rounded-edge modal card and all its contents.
   */
  private createModalCard(width: number, height: number): void {
    const cardCenterX = width / 2;
    const cardCenterY = height * 0.48; // Positioned slightly above absolute center for perfect balance
    const w = MARBLE_CONFIG.modalWidth;
    const h = MARBLE_CONFIG.modalHeight;
    const r = MARBLE_CONFIG.modalCornerRadius;

    this.cardContainer = this.scene.add.container(cardCenterX, cardCenterY);
    const fontStack = '"Quicksand", "Nunito", "ui-rounded", -apple-system, BlinkMacSystemFont, sans-serif';

    // 1. Drop shadow behind the card
    const cardShadow = this.scene.add.graphics();
    cardShadow.fillStyle(0x2d1f14, 0.22);
    cardShadow.fillRoundedRect(-w / 2, -h / 2 + 10, w, h, r);
    this.cardContainer.add(cardShadow);

    // 2. Main card background (warm cream paper / frosted acrylic surface)
    const cardBg = this.scene.add.graphics();
    cardBg.fillStyle(MARBLE_CONFIG.modalBgColor, MARBLE_CONFIG.modalBgAlpha);
    cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    // Subtle frosted border
    cardBg.lineStyle(2, MARBLE_CONFIG.modalBorderColor, MARBLE_CONFIG.modalBorderAlpha);
    cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    this.cardContainer.add(cardBg);

    // 3. 'Game over!' Header Title
    const titleText = this.scene.add.text(0, -h / 2 + 52, 'Game over!', {
      fontFamily: fontStack,
      fontSize: '50px',
      fontStyle: '900',
      color: '#3a2415',
      align: 'center',
    });
    titleText.setOrigin(0.5);
    this.cardContainer.add(titleText);

    // 4. Current Run Score Display
    const scoreLabelY = -h / 2 + 122;
    const scoreLabel = this.scene.add.text(0, scoreLabelY, 'SCORE', {
      fontFamily: fontStack,
      fontSize: '15px',
      fontStyle: '800',
      color: '#826d5b',
      letterSpacing: 2,
      align: 'center',
    });
    scoreLabel.setOrigin(0.5);
    this.cardContainer.add(scoreLabel);

    this.scoreValueText = this.scene.add.text(0, scoreLabelY + 36, '0', {
      fontFamily: fontStack,
      fontSize: '52px',
      fontStyle: '900',
      color: '#3a2415',
      align: 'center',
    });
    this.scoreValueText.setOrigin(0.5);
    this.cardContainer.add(this.scoreValueText);

    // 5. Personal High Score Board (single persistent value, no units)
    const boardCenterY = -h / 2 + 258;
    const boardW = w - 74;
    const boardH = 118;
    const boardR = 18;

    const boardBg = this.scene.add.graphics();
    // Inset recessed plate
    boardBg.fillStyle(0xede2d3, 0.85);
    boardBg.fillRoundedRect(-boardW / 2, boardCenterY - boardH / 2, boardW, boardH, boardR);
    boardBg.lineStyle(1.5, 0xc4b29f, 0.7);
    boardBg.strokeRoundedRect(-boardW / 2, boardCenterY - boardH / 2, boardW, boardH, boardR);
    this.cardContainer.add(boardBg);

    const highScoreLabel = this.scene.add.text(0, boardCenterY - 30, 'HIGH SCORE', {
      fontFamily: fontStack,
      fontSize: '15px',
      fontStyle: '800',
      color: '#6d5744',
      letterSpacing: 2,
      align: 'center',
    });
    highScoreLabel.setOrigin(0.5);
    this.cardContainer.add(highScoreLabel);

    this.highScoreValueText = this.scene.add.text(0, boardCenterY + 12, '0', {
      fontFamily: fontStack,
      fontSize: '50px',
      fontStyle: '900',
      color: '#2c1b0e',
      align: 'center',
    });
    this.highScoreValueText.setOrigin(0.5);
    this.cardContainer.add(this.highScoreValueText);

    this.newBestBadge = this.scene.add.text(0, boardCenterY + 44, '★ NEW HIGH SCORE! ★', {
      fontFamily: fontStack,
      fontSize: '13px',
      fontStyle: '900',
      color: '#b45309',
      letterSpacing: 1,
      align: 'center',
    });
    this.newBestBadge.setOrigin(0.5);
    this.newBestBadge.setVisible(false);
    this.cardContainer.add(this.newBestBadge);

    // 6. Two Tactile Wood Squircle Buttons side-by-side below the board
    const btnW = 205;
    const btnH = 68;
    const btnY = -h / 2 + 420;
    const gap = 20;
    const leftBtnX = -btnW / 2 - gap / 2;
    const rightBtnX = btnW / 2 + gap / 2;

    const tryAgainBtn = createTactileButton(this.scene, {
      x: leftBtnX,
      y: btnY,
      w: btnW,
      h: btnH,
      radius: MARBLE_CONFIG.buttonRadius,
      label: 'Try Again',
      fontSize: '22px',
      onPointerDown: () => {
        if (this.onTryAgainCallback) this.onTryAgainCallback();
      },
    });
    this.cardContainer.add(tryAgainBtn);

    const mainMenuBtn = createTactileButton(this.scene, {
      x: rightBtnX,
      y: btnY,
      w: btnW,
      h: btnH,
      radius: MARBLE_CONFIG.buttonRadius,
      label: 'Main Menu',
      fontSize: '22px',
      onPointerDown: () => {
        if (this.onMainMenuCallback) this.onMainMenuCallback();
      },
    });
    this.cardContainer.add(mainMenuBtn);

    this.add(this.cardContainer);
  }

  /**
   * Displays the Game Over modal with run score and personal high score.
   */
  public show(runScore: number, onTryAgain: () => void, onMainMenu: () => void): void {
    if (this.isVisibleModal) return;
    this.isVisibleModal = true;
    this.onTryAgainCallback = onTryAgain;
    this.onMainMenuCallback = onMainMenu;

    // Record score in local persistent storage
    const { highScore, isNewHighScore } = ScoreManager.recordScore(runScore);

    this.scoreValueText.setText(runScore.toString());
    this.highScoreValueText.setText(highScore.toString());

    if (isNewHighScore && runScore > 0) {
      this.newBestBadge.setVisible(true);
      this.newBestBadge.setAlpha(1);
      this.scene.tweens.add({
        targets: this.newBestBadge,
        scale: { from: 0.85, to: 1.08 },
        duration: 260,
        yoyo: true,
        repeat: 2,
        ease: 'Back.easeOut',
      });
    } else {
      this.newBestBadge.setVisible(false);
    }

    this.setVisible(true);
    this.setAlpha(0);
    this.cardContainer.setScale(0.92);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 250,
      ease: 'Cubic.easeOut',
    });

    this.scene.tweens.add({
      targets: this.cardContainer,
      scale: 1.0,
      duration: 320,
      ease: 'Back.easeOut',
    });
  }

  public hide(onComplete?: () => void): void {
    if (!this.isVisibleModal) return;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 180,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.setVisible(false);
        this.isVisibleModal = false;
        if (onComplete) onComplete();
      },
    });
  }

  public isOpen(): boolean {
    return this.isVisibleModal;
  }
}
