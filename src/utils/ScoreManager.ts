/**
 * SCORE & HIGH SCORE PERSISTENCE MANAGER
 *
 * Manages player run scores and persistent personal high score tracking.
 * Stored locally via localStorage so scores persist across app closes,
 * device reboots, and browser sessions on Android / mobile / desktop.
 */
export class ScoreManager {
  private static readonly STORAGE_KEY = 'marble_mountain_highscore';
  private static memoryFallbackScore: number = 0;

  /**
   * Retrieves the current persistent high score.
   * Returns 0 if no score has been recorded yet.
   */
  public static getHighScore(): number {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(ScoreManager.STORAGE_KEY);
        if (stored !== null) {
          const val = parseInt(stored, 10);
          return isNaN(val) ? 0 : Math.max(0, val);
        }
      }
    } catch (err) {
      console.warn('Unable to access localStorage, using memory fallback:', err);
    }
    return ScoreManager.memoryFallbackScore;
  }

  /**
   * Records a completed run's score.
   * If the score beats the previous high score, it is persisted to local storage.
   *
   * @param score Integer seconds elapsed in the run
   * @returns Object with the updated high score and a flag indicating if it was a new high score.
   */
  public static recordScore(score: number): { highScore: number; isNewHighScore: boolean } {
    const currentHigh = ScoreManager.getHighScore();
    const isNewHighScore = score > currentHigh;
    const finalHigh = Math.max(currentHigh, score);

    ScoreManager.memoryFallbackScore = finalHigh;

    if (isNewHighScore) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(ScoreManager.STORAGE_KEY, finalHigh.toString());
        }
      } catch (err) {
        console.warn('Unable to write to localStorage:', err);
      }
    }

    return {
      highScore: finalHigh,
      isNewHighScore,
    };
  }

  /**
   * Resets the persistent high score to 0 (useful for testing and reset options).
   */
  public static resetHighScore(): void {
    ScoreManager.memoryFallbackScore = 0;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ScoreManager.STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Unable to remove item from localStorage:', err);
    }
  }
}
