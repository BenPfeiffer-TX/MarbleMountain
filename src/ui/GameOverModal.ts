import Phaser from 'phaser';
import { MARBLE_CONFIG } from '../config/marbleConfig';
import { createTactileButton } from './TactileButton';

/**
 * GAME OVER MODAL COMPONENT
 *
 * Displays when the marble falls off the bar and off-screen:
 * - Frosted glass backdrop heavily blurring the view of the background and bar underneath.
 * - Rounded-edge card in the center of the screen with "Game over!" title.
 * - Tactile 3D wood squircle buttons for "Try Again" and "Main Menu" side-by-side.
 * - Highscore chart with a blank list and soft semi-transparent grey vertical column divider lines.
 */
export class GameOverModal extends Phaser.GameObjects.Container {
  private backdrop!: Phaser.GameObjects.Graphics;
  private cardContainer!: Phaser.GameObjects.Container;
  private isVisibleModal: boolean = false;

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
    const titleText = this.scene.add.text(0, -h / 2 + 56, 'Game over!', {
      fontFamily: fontStack,
      fontSize: '52px',
      fontStyle: '900',
      color: '#3a2415',
      align: 'center',
    });
    titleText.setOrigin(0.5);
    this.cardContainer.add(titleText);

    // 4. Two Tactile Wood Squircle Buttons side-by-side
    // 'Try Again' on the left, 'Main Menu' to the right of it
    const btnW = MARBLE_CONFIG.buttonWidth;
    const btnH = MARBLE_CONFIG.buttonHeight;
    const btnY = -h / 2 + 155;
    const gap = MARBLE_CONFIG.buttonGap;
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

    // 5. 'Highscore' Chart below the buttons
    const chartY = -h / 2 + 250;
    this.createHighscoreChart(chartY, w - 70, fontStack);

    this.add(this.cardContainer);
  }

  /**
   * Creates the Highscore chart: blank list with columns separated only by
   * soft semi-transparent grey vertical divider lines.
   */
  private createHighscoreChart(
    topY: number,
    chartW: number,
    fontStack: string
  ): void {
    const halfW = chartW / 2;

    // Header label
    const headerTitle = this.scene.add.text(-halfW + 10, topY, 'Highscore', {
      fontFamily: fontStack,
      fontSize: '24px',
      fontStyle: '800',
      color: '#463222',
    });
    headerTitle.setOrigin(0, 0.5);
    this.cardContainer.add(headerTitle);

    // Columns: [0: Highscore (Name/Rank)], [1: Score], [2: Time]
    const col1X = -halfW + 185; // First vertical divider line
    const col2X = halfW - 120; // Second vertical divider line

    const scoreHeader = this.scene.add.text(col1X + 24, topY, 'Score', {
      fontFamily: fontStack,
      fontSize: '18px',
      fontStyle: '700',
      color: '#7a6654',
    });
    scoreHeader.setOrigin(0, 0.5);
    this.cardContainer.add(scoreHeader);

    const timeHeader = this.scene.add.text(col2X + 24, topY, 'Time', {
      fontFamily: fontStack,
      fontSize: '18px',
      fontStyle: '700',
      color: '#7a6654',
    });
    timeHeader.setOrigin(0, 0.5);
    this.cardContainer.add(timeHeader);

    // Soft header horizontal underline
    const linesG = this.scene.add.graphics();
    const dividerColor = MARBLE_CONFIG.dividerLineColor;
    const dividerAlpha = MARBLE_CONFIG.dividerLineAlpha;

    linesG.lineStyle(1.5, dividerColor, dividerAlpha);
    linesG.lineBetween(-halfW, topY + 22, halfW, topY + 22);

    // ONLY lines outlining the list are soft, semi-transparent grey lines between columns:
    const listBottomY = topY + 22 + MARBLE_CONFIG.highscoreRowCount * MARBLE_CONFIG.highscoreRowHeight + 10;
    linesG.lineBetween(col1X, topY + 10, col1X, listBottomY);
    linesG.lineBetween(col2X, topY + 10, col2X, listBottomY);
    this.cardContainer.add(linesG);

    // Blank list rows with subtle placeholders
    const startRowY = topY + 44;
    for (let i = 0; i < MARBLE_CONFIG.highscoreRowCount; i++) {
      const rowY = startRowY + i * MARBLE_CONFIG.highscoreRowHeight;

      // Row rank number
      const rankText = this.scene.add.text(-halfW + 18, rowY, `${i + 1}.   - - -`, {
        fontFamily: fontStack,
        fontSize: '16px',
        fontStyle: '600',
        color: '#a49282',
      });
      rankText.setOrigin(0, 0.5);
      this.cardContainer.add(rankText);

      // Blank score placeholder
      const scoreDash = this.scene.add.text(col1X + 40, rowY, '- -', {
        fontFamily: fontStack,
        fontSize: '16px',
        fontStyle: '600',
        color: '#b0a092',
      });
      scoreDash.setOrigin(0.5);
      this.cardContainer.add(scoreDash);

      // Blank time placeholder
      const timeDash = this.scene.add.text(col2X + 44, rowY, '- -', {
        fontFamily: fontStack,
        fontSize: '16px',
        fontStyle: '600',
        color: '#b0a092',
      });
      timeDash.setOrigin(0.5);
      this.cardContainer.add(timeDash);
    }
  }

  public show(onTryAgain: () => void, onMainMenu: () => void): void {
    if (this.isVisibleModal) return;
    this.isVisibleModal = true;
    this.onTryAgainCallback = onTryAgain;
    this.onMainMenuCallback = onMainMenu;

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
