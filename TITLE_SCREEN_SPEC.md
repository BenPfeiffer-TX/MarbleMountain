# Title Screen & Persistent Background Specification (Feature 2)

This document records the exact parameters, mechanics, styling, and design decisions for the Title Screen and Persistent Background in *Marble Mountain*. Reference this specification when adjusting visuals, adding menu options, or hooking in future scenes.

---

## 1. Overview & Architecture
- **Persistent Background**: Managed by `BackgroundScene` running continuously at the base layer (`sendToBack()`). It does not reset, pause, or hitch across scene changes.
- **Title Screen Scene**: Managed by `TitleScene` layered directly above `BackgroundScene`. Transparent camera allows the persistent background to show through.
- **Options Screen**: Sub-view within `TitleScene` transitioning horizontally on the X-axis.
- **Kinetic Scroll Illusion**: Pressing 'Play' initiates a continuous upward scrolling camera feel: title/buttons accelerate UP off-screen, and the wooden bar enters from below off-screen and decelerates UP into resting position over the uninterrupted background.

---

## 2. Persistent Background Specification
*Configuration File*: [`src/config/backgroundConfig.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/config/backgroundConfig.ts)  
*Scene Implementation*: [`src/scenes/BackgroundScene.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/scenes/BackgroundScene.ts)

### Parameters & Visuals
| Property | Value | Notes |
| :--- | :--- | :--- |
| **Scroll Speed** | `40 px/s` | Upward travel speed (`scrollDirection: 'up'`). |
| **Canvas Loop Height** | `1536 px` | Offscreen canvas texture height for seamless looping interpolation. |
| **Texture Key** | `'diffusePastelGradient'` | Cached in Phaser TextureManager. |
| **Paper Texture** | `enabled: true` | Procedural construction paper grain overlay with 700 fibers. |
| **Paper Seed / Alphas** | `seed: 77, α: [0.02, 0.07]` | Dark fiber color `0x8a7a60`, light fiber color `0xffffff`. |

### Color Palette (Ordered Cycle)
1. `{ r: 253, g: 243, b: 219 }` – Soft Cream / Buttercup
2. `{ r: 250, g: 212, b: 192 }` – Pastel Peach / Apricot
3. `{ r: 244, g: 206, b: 216 }` – Soft Rose / Blush
4. `{ r: 226, g: 214, b: 237 }` – Pale Lavender
5. `{ r: 214, g: 230, b: 245 }` – Misty Sky Blue
6. `{ r: 222, g: 240, b: 226 }` – Pale Mint / Sage
*(First color appended at end to create a seamless infinite loop)*

---

## 3. Title Typography Specification
*Configuration File*: [`src/scenes/TitleScene.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/scenes/TitleScene.ts)

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Font Family** | `"Quicksand", "Nunito", sans-serif` | Imported in `index.html`. Soft, rounded sans-serif. |
| **Text Content** | `'Marble\nMountain'` | Center-aligned, separated by a line break. |
| **Title Center Y** | `330 px` | Positioned in the upper half of the 1280px viewport. |
| **Font Size** | `82 px` | Large, bold title presence. |
| **Font Weight / Style** | `'900'` | Extra bold weight. |
| **Line Spacing** | `-10 px` | Snug vertical line spacing between lines. |
| **Text Color** | `#fdf6e7` | Light beige (matches button label text). |
| **Contour Stroke Color** | `#3a2415` | Dark warm contour for crisp legibility against pastel background. |
| **Stroke Thickness** | `3 px` | Clean contour width. |

---

## 4. Tactile 3D Wood Squircle Buttons
Buttons are implemented with physical depth layers, spring recoil, and press shading:

### Geometry & Layout
| Property | Value | Notes |
| :--- | :--- | :--- |
| **Width & Height** | `290 px × 74 px` | Squircle button dimensions. |
| **Corner Radius** | `22 px` | Rounded corners. |
| **Play Button Y** | `720 px` | Main menu primary action. |
| **Options Button Y** | `825 px` | Main menu secondary action. |
| **Back Button Y** | `780 px` | Options view return button. |
| **Touch Zone Padding** | `+30 px` | Dedicated invisible `Zone` at local `(0, 0)` with margin. |

### Visual Layers & Tactile Interaction
1. **Drop Shadow & Extrusion Base**:
   - Cast shadow: `0x3a2c1d`, alpha 0.28, $+8\text{px}$ Y offset.
   - Dark extrusion bevel: `woodDarkEdgeColor: 0x5a3617`, $+4\text{px}$ Y offset.
2. **Movable Face Plate**:
   - Resting position: $Y = -6\text{px}$ (raised above the base).
   - Wood grain texture: base color `0x9c6638`, highlights `0xb57c4c`, dark grain fibers `0x7c4e27`.
   - Text label: `26px`, font weight `'700'`, light beige `#fdf6e7`.
3. **Press Interaction**:
   - `pointerdown`: Instantly sinks from $-6\text{px}$ down to $0\text{px}$ and displays a dark tint overlay (`alpha: 1.0`).
   - Release: After an 80ms press hold, springs upward to $-7\text{px}$ with `Back.easeOut` (100ms) with punchy physical recoil, fades the dark overlay, and triggers action callback.

---

## 5. Scene Transitions & Scroll Continuity

### Play Transition (Upward Scroll)
1. **Title Exit**:
   - `mainContainer` animates from $Y = 0$ to $Y = -1049\text{px}$ over $440\text{ms}$ with `Cubic.easeIn`.
   - Target calculation:
     $$\text{exitTargetY} = -(\text{optionsButtonY} + \text{buttonHeight} + 150) = -(825 + 74 + 150) = -1049\text{px}$$
   - This ensures the lowest element ('Options' button) exits completely past $Y = 0$ ($> 180\text{px}$ above screen) with zero hitching or freezing.
   - `onComplete` transitions directly to `MainScene` without camera fade.
2. **MainScene Bar Arrival**:
   - Bar initial position:
     $$\text{offscreenBottomY} = \text{height} + \text{barHeight} + 60 = 1280 + 22 + 60 = 1362\text{px}$$
   - Because $1362 - 11 = 1351\text{px} > 1280\text{px}$, the bar is completely below the viewport on frame 0 (**zero pop-in**).
   - Tweens **UP** to `barCenterY` ($1132.8\text{px}$) over $440\text{ms}$ with `Cubic.easeOut`.
   - Result: Accelerate UP out $\rightarrow$ Decelerate UP in over a seamless persistent background.

### Options View (Horizontal Slide)
- **Open Options**: `mainContainer` slides to $X = -720$, `optionsContainer` slides from $X = 720$ to $X = 0$ ($420\text{ms}$, `Cubic.easeInOut`).
- **Back to Menu**: `optionsContainer` slides to $X = 720$, `mainContainer` slides from $X = -720$ to $X = 0$ ($420\text{ms}$, `Cubic.easeInOut`).
