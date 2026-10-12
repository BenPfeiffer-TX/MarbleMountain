import { GameTheme, MarbleTheme, BarTheme, ButtonTheme, HoleTheme, BackgroundTheme } from './types';
import {
  shinySteelBearingMarbleTheme,
  classicWoodBarTheme,
  classicWoodButtonTheme,
  classicWoodHoleTheme,
} from './defaultTheme';
import {
  pastelPaperBackgroundTheme,
  suitFabricBackgroundTheme,
} from './backgroundThemes';
import { glassSwirlMarbleTheme } from './glassSwirlTheme';
import {
  neonHalogenBarTheme,
  neonHalogenButtonTheme,
  neonHalogenHoleTheme,
} from './neonHalogenTheme';

export interface SurfacePackage {
  id: string;
  name: string;
  bar: BarTheme;
  button: ButtonTheme;
  hole: HoleTheme;
}

/**
 * THEME MANAGER (SINGLETON REGISTRY)
 *
 * Provides completely independent selection and cycling for:
 * 1. Background ('Pastel Paper', 'Suit Fabric')
 * 2. Ball ('Steel Bearing', 'Glass Swirl')
 * 3. Surface ('Classic Wood', 'Neon Halogen')
 *
 * Persists user selections locally across sessions.
 * Maintains backwards compatibility with all scenes via getActiveTheme().
 */
export class ThemeManager {
  private static readonly STORAGE_KEY = 'marble_mountain_theme_selections';

  // --- REGISTRIES ---
  private static readonly backgroundOptions: BackgroundTheme[] = [
    pastelPaperBackgroundTheme,
    suitFabricBackgroundTheme,
  ];

  private static readonly ballOptions: MarbleTheme[] = [
    shinySteelBearingMarbleTheme,
    glassSwirlMarbleTheme,
  ];

  private static readonly surfaceOptions: SurfacePackage[] = [
    {
      id: 'classicWood',
      name: 'Classic Wood',
      bar: classicWoodBarTheme,
      button: classicWoodButtonTheme,
      hole: classicWoodHoleTheme,
    },
    {
      id: 'neonHalogen',
      name: 'Neon Halogen',
      bar: neonHalogenBarTheme,
      button: neonHalogenButtonTheme,
      hole: neonHalogenHoleTheme,
    },
  ];

  // --- ACTIVE SELECTION INDICES ---
  private static bgIndex: number = 0;
  private static ballIndex: number = 0;
  private static surfaceIndex: number = 0;
  private static initialized: boolean = false;

  // --- LISTENERS ---
  private static listeners: Set<(theme: GameTheme) => void> = new Set();
  private static bgListeners: Set<(bg: BackgroundTheme) => void> = new Set();
  private static ballListeners: Set<(ball: MarbleTheme) => void> = new Set();
  private static surfaceListeners: Set<(surface: SurfacePackage) => void> = new Set();

  private static ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(ThemeManager.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.bgId) {
            const idx = this.backgroundOptions.findIndex((b) => b.id === parsed.bgId);
            if (idx !== -1) this.bgIndex = idx;
          }
          if (parsed.ballId) {
            const idx = this.ballOptions.findIndex((b) => b.id === parsed.ballId);
            if (idx !== -1) this.ballIndex = idx;
          }
          if (parsed.surfaceId) {
            const idx = this.surfaceOptions.findIndex((s) => s.id === parsed.surfaceId);
            if (idx !== -1) this.surfaceIndex = idx;
          }
        }
      }
    } catch (err) {
      console.warn('Unable to load theme preferences from localStorage:', err);
    }
  }

  private static savePreferences(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = {
          bgId: this.backgroundOptions[this.bgIndex].id,
          ballId: this.ballOptions[this.ballIndex].id,
          surfaceId: this.surfaceOptions[this.surfaceIndex].id,
        };
        window.localStorage.setItem(ThemeManager.STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Unable to save theme preferences to localStorage:', err);
    }
  }

  // --- ACTIVE ACCESSORS ---

  public static getActiveBackground(): BackgroundTheme {
    this.ensureInitialized();
    return this.backgroundOptions[this.bgIndex];
  }

  public static getActiveBall(): MarbleTheme {
    this.ensureInitialized();
    return this.ballOptions[this.ballIndex];
  }

  public static getActiveSurfacePackage(): SurfacePackage {
    this.ensureInitialized();
    return this.surfaceOptions[this.surfaceIndex];
  }

  public static getActiveSurface(): BarTheme {
    return this.getActiveSurfacePackage().bar;
  }

  public static getActiveTheme(): GameTheme {
    this.ensureInitialized();
    const bg = this.getActiveBackground();
    const ball = this.getActiveBall();
    const surf = this.getActiveSurfacePackage();

    return {
      id: `${bg.id}_${ball.id}_${surf.id}`,
      name: `${bg.name} / ${ball.name} / ${surf.name}`,
      background: bg,
      marble: ball,
      bar: surf.bar,
      button: surf.button,
      hole: surf.hole,
    };
  }

  // --- OPTIONS LISTS ---

  public static getBackgroundOptions(): { id: string; name: string }[] {
    return this.backgroundOptions.map((b) => ({ id: b.id, name: b.name }));
  }

  public static getBallOptions(): { id: string; name: string }[] {
    return this.ballOptions.map((b) => ({ id: b.id, name: b.name }));
  }

  public static getSurfaceOptions(): { id: string; name: string }[] {
    return this.surfaceOptions.map((s) => ({ id: s.id, name: s.name }));
  }

  // --- CYCLING METHODS ---

  /**
   * Cycles background texture. direction: 1 (right/next) or -1 (left/prev).
   * Wraps around automatically.
   */
  public static cycleBackground(direction: 1 | -1): BackgroundTheme {
    this.ensureInitialized();
    const count = this.backgroundOptions.length;
    this.bgIndex = (((this.bgIndex + direction) % count) + count) % count;
    this.savePreferences();

    const activeBg = this.backgroundOptions[this.bgIndex];
    this.bgListeners.forEach((cb) => cb(activeBg));
    this.notifyGeneralListeners();
    return activeBg;
  }

  /**
   * Cycles ball texture. direction: 1 (right/next) or -1 (left/prev).
   * Wraps around automatically.
   */
  public static cycleBall(direction: 1 | -1): MarbleTheme {
    this.ensureInitialized();
    const count = this.ballOptions.length;
    this.ballIndex = (((this.ballIndex + direction) % count) + count) % count;
    this.savePreferences();

    const activeBall = this.ballOptions[this.ballIndex];
    this.ballListeners.forEach((cb) => cb(activeBall));
    this.notifyGeneralListeners();
    return activeBall;
  }

  /**
   * Cycles surface/bar texture. direction: 1 (right/next) or -1 (left/prev).
   * Wraps around automatically.
   */
  public static cycleSurface(direction: 1 | -1): SurfacePackage {
    this.ensureInitialized();
    const count = this.surfaceOptions.length;
    this.surfaceIndex = (((this.surfaceIndex + direction) % count) + count) % count;
    this.savePreferences();

    const activeSurf = this.surfaceOptions[this.surfaceIndex];
    this.surfaceListeners.forEach((cb) => cb(activeSurf));
    this.notifyGeneralListeners();
    return activeSurf;
  }

  // --- EVENT SUBSCRIPTIONS ---

  public static onBackgroundChanged(listener: (bg: BackgroundTheme) => void): () => void {
    this.bgListeners.add(listener);
    return () => this.bgListeners.delete(listener);
  }

  public static onBallChanged(listener: (ball: MarbleTheme) => void): () => void {
    this.ballListeners.add(listener);
    return () => this.ballListeners.delete(listener);
  }

  public static onSurfaceChanged(listener: (surface: SurfacePackage) => void): () => void {
    this.surfaceListeners.add(listener);
    return () => this.surfaceListeners.delete(listener);
  }

  public static onThemeChanged(listener: (theme: GameTheme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notifyGeneralListeners(): void {
    const fullTheme = this.getActiveTheme();
    this.listeners.forEach((cb) => cb(fullTheme));
  }
}
