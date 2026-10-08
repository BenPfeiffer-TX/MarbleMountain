import { GameTheme } from './types';
import { DEFAULT_GAME_THEME } from './defaultTheme';

/**
 * THEME MANAGER (SINGLETON REGISTRY)
 *
 * Centralized controller for managing the visual themes/skins of:
 * 1. The Marble (sphere texture, reflections, shadow)
 * 2. The Bar (surface wood/neon styling, colors, grain)
 * 3. The Buttons (base, face plate, press shading, typography across all screens)
 *
 * Facilitates easily swapping all game visuals at the same time in the future.
 */
export class ThemeManager {
  private static activeTheme: GameTheme = DEFAULT_GAME_THEME;
  private static registeredThemes: Map<string, GameTheme> = new Map([
    [DEFAULT_GAME_THEME.id, DEFAULT_GAME_THEME],
  ]);
  private static listeners: Set<(theme: GameTheme) => void> = new Set();

  /**
   * Retrieves the current active game theme.
   */
  public static getActiveTheme(): GameTheme {
    return this.activeTheme;
  }

  /**
   * Registers a new theme option for future selection.
   */
  public static registerTheme(theme: GameTheme): void {
    this.registeredThemes.set(theme.id, theme);
  }

  /**
   * Changes the active theme by theme ID or instance and notifies all subscribers.
   */
  public static setTheme(themeIdOrInstance: string | GameTheme): void {
    if (typeof themeIdOrInstance === 'string') {
      const found = this.registeredThemes.get(themeIdOrInstance);
      if (found) {
        this.activeTheme = found;
        this.notifyListeners();
      }
    } else {
      this.activeTheme = themeIdOrInstance;
      this.registeredThemes.set(themeIdOrInstance.id, themeIdOrInstance);
      this.notifyListeners();
    }
  }

  /**
   * Subscribes to theme changes. Returns an unsubscribe function.
   */
  public static onThemeChanged(listener: (theme: GameTheme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.activeTheme));
  }
}
