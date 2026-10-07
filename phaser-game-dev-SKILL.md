---
name: phaser-game-dev
description: Skill for developing, building, and testing 2D mobile games using Vite, TypeScript, and Phaser on Android Laptop
---

# Phaser Mobile Game Development Skill

This skill governs the development of 2D mobile games using Vite, TypeScript, and Phaser 3 within the headless Linux VM on Android Laptop.

--------------------------------------------------------------------------------

## 1. Environment & I/O Optimization (Mandatory)

The project lives on the shared Android storage (`/storage/emulated/10`), which uses `virtiofs`. To prevent I/O slowdowns from thousands of cache files:

1. **Always redirect npm caches to the VM's local ext4 filesystem**:
   ```bash
   PROJECT_CACHE_DIR="$HOME/.cache/projects/$(basename "$PWD")-$(pwd -P | sha1sum | cut -c1-8)"
   npm install --cache "$PROJECT_CACHE_DIR/npm"
   ```
2. **Always bind the dev server to the host**:
   The Linux VM must expose the Vite server so the Android host browser can access it:
   ```bash
   npm run dev -- --host
   ```
   Preview URL: `http://localhost:5173` (or the IP displayed in the console).

--------------------------------------------------------------------------------

## 2. Mobile-First Phaser Architecture

All game configurations MUST be designed for mobile touchscreens:

### A. Viewport & Scale Manager
Never use fixed canvas coordinates without scaling. Always configure `Phaser.Scale.FIT`:

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 720,  // Standard mobile reference width (portrait or landscape equivalent)
  height: 1280,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600, x: 0 },
      debug: false
    }
  },
  input: {
    activePointers: 3 // Enable multi-touch for virtual controls
  }
};
```

### B. Mobile Touch Controls
- Do **not** rely solely on keyboard `cursors`.
- Always implement on-screen touch zones, virtual D-pads, or swipe/tap listeners using `this.input.on('pointerdown', ...)` and `pointer.isDown`.
- Ensure multi-touch is supported so a player can move and tap an action button simultaneously.

--------------------------------------------------------------------------------

## 3. Agentic Development & Verification Loop

Before reporting changes to the user or requesting manual spot checks, follow this verification flow:

1. **Headless Type & Syntax Check**:
   Run TypeScript compiler validation to catch runtime typos and broken Phaser signatures:
   ```bash
   npx tsc --noEmit
   ```
2. **Production Asset Build Verification**:
   Ensure Vite can bundle the game without missing assets or circular dependencies:
   ```bash
   npm run build
   ```
3. **Spot Check Prompt**:
   Once verified, inform the user to test the game at `http://localhost:5173` in Android Chrome.

--------------------------------------------------------------------------------

## 4. Packaging to Android Native APK (When Requested)

When the game is ready to export to a native Android APK:

1. Install Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android --cache "$PROJECT_CACHE_DIR/npm"
   npx cap init "[Game Name]" "com.[username].[gamename]" --web-dir "dist"
   npx cap add android
   ```
2. Build web assets and sync:
   ```bash
   npm run build
   ```
