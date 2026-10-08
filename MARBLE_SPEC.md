# Marble Mechanics & Game Over Specification (Feature 3)

This document records the exact parameters, physics models, visual styling, and design decisions for the metallic steel marble and the frosted glass Game Over screen in *Marble Mountain*. Reference this specification when adding holes, score tracking, or progression mechanics.

---

## 1. Overview & Objectives
- **Core Objective**: The marble is the main game objective; players tilt the mechanical bar to keep the marble balanced and roll it without falling off the tips.
- **Physical Feel**: Heavy metallic steel sphere with physical inertia, high friction ensuring pure rolling without slipping, and rapid braking when countering bar tilt.
- **Arrival Inertia**: Centered on the bar as it arrives from below; lifts up off the bar on arrival stop, falls back down, and bounces once before settling.
- **Failure State**: Rolling off the bar tips and falling off-screen triggers the Game Over state, heavily blurring the game view with frosted glass and displaying the Game Over modal.

---

## 2. Geometry & Marble Dimensions
*Target Viewport*: $720 \times 1280$ (Portrait).  
*Configuration*: [`src/config/marbleConfig.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/config/marbleConfig.ts)  
*Component Implementation*: [`src/components/Marble.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/components/Marble.ts)

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Marble Radius ($R$)** | `25 px` | Diameter $50\text{px}$ (calibrated to match user-drawn circle & OS taskbar icons). |
| **Center Offset from Bar** | $H_{\text{bar}}/2 + R = 36\text{px}$ | Distance from bar centerline to marble center when resting on the bar surface. |
| **Drop Shadow Radius** | $1.5 R \times 6\text{px}$ | Elliptical contact shadow on the wood surface; scales and fades when airborne. |

---

## 3. Reflective Shiny Steel Ball Bearing Visuals
- **Authentic Polished Bearing Design**:
  - The marble renders as a clean, mirror-polished chrome steel ball bearing.
  - Artificial visual aids (circumference lines, equator seams, surface grain arcs, and separate lighting overlays) have been completely removed.
- **Spherical Specular Shading**:
  - Blinding hot-white specular core (`#ffffff`) centered at $(-0.32 R, -0.32 R)$.
  - Smooth silver transition (`#f0f5fa` $\rightarrow$ `#d4dee6` $\rightarrow$ `#8e9da8`).
  - Subtle ambient underside ground reflection (`rgba(215, 230, 245, 0.24)`) on the lower crescent.
  - Crisp outer steel contour rim (`#1c2024`).
- **Decoupled Texture Architecture**:
  - The ball bearing texture and contact drop shadow are generated and managed by [`src/themes/defaultTheme.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/themes/defaultTheme.ts) and [`src/themes/themeManager.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/themes/themeManager.ts).
  - Clean separation allows the marble appearance to be themed or swapped seamlessly.

---

## 4. Kinematics & Pure Rolling Physics Model
Let $\theta$ be the bar deflection angle in radians, and $s$ be the distance along the bar from the pinned center ($-W_{\text{half}} \le s \le W_{\text{half}}$).

### 1. Rolling Without Slipping Equation
For a solid sphere of mass $M$, radius $R$, and moment of inertia $I = \frac{2}{5} M R^2$:
$$a_{\text{gravity}} = \frac{g \sin\theta}{1 + \frac{I}{M R^2}} = \frac{5}{7} g \sin\theta$$
With $g = 1400\text{px/s}^2$, at maximum tilt ($20^\circ$):
$$a_{\text{gravity}} \approx \frac{5}{7}(1400)(0.342) \approx 342\text{px/s}^2$$

### 2. Centrifugal Acceleration
When the bar rotates with angular velocity $\omega$:
$$a_{\text{centrifugal}} = s \cdot \omega^2$$

### 3. Friction & Rapid Braking
$$a_{\text{friction}} = -\text{sign}(v_s) \cdot \min(\mu_{\text{roll}}, |v_s| / dt) \quad (\mu_{\text{roll}} = 22\text{px/s}^2)$$
$$a_{\text{drag}} = -v_s \cdot D_{\text{roll}} \quad (D_{\text{roll}} = 0.30)$$
- **Gentle Roll Threshold**: Lowering $\mu_{\text{roll}}$ to $22\text{px/s}^2$ allows the marble to begin rolling smoothly at just $\approx 1.3^\circ$ tilt (instead of $>10^\circ$).
- **Counter-Tilt Braking**: When reversing the bar tilt ($\sin\theta$ opposes $v_s$), gravitational slope deceleration ($>250\text{px/s}^2$) and rolling resistance combine to bring the ball to a full stop in $\approx 0.4$ seconds.
- **Static Hold Threshold**: When $|\sin\theta| < 0.010\text{ rad}$ ($\approx 0.57^\circ$) and $|v_s| < 1.0\text{px/s}$, the marble remains stationary without micro-drift.

---

## 5. Arrival Sequence (Entry from Title Screen)
1. **Entering State & Upward Travel**: The bar and marble slide UP together from $Y = 1362\text{px}$ toward $Y = 1132.8\text{px}$ ($440\text{ms}$, `Cubic.easeOut`).
2. **Continuous Inertia Lift-Off**: As the bar begins braking near its resting position ($Y_{\text{bar}} \le Y_{\text{rest}} + 32\text{px}$), the marble **does not wait or stop**; its upward vertical momentum naturally carries it into the air ($v_h = 280\text{px/s}$) in one unbroken, fluid upward trajectory.
3. **Bar Halts Underneath**: While the marble continues soaring upward to its apex ($h_{\text{apex}} \approx 26\text{px}-28\text{px}$), the bar decelerates to a complete stop at $1132.8\text{px}$ underneath it.
4. **Descent & Tactile Bounce**:
   - Gravity pulls the marble down onto the now stationary bar.
   - Rebound velocity on first contact: $v_{\text{bounce}} \approx 106\text{px/s}$ ($h_{\text{rebound}} \approx 5\text{px}-6\text{px}$).
   - On second contact, the marble settles ($h = 0, v_h = 0$) and transitions to active rolling.

---

## 6. Departure & Game Over Modal
*Component Implementation*: [`src/ui/GameOverModal.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/ui/GameOverModal.ts)

### 1. Departure from Bar Tips
- Condition: $|s| > W_{\text{half}} = 331.2\text{px}$.
- Converts bar velocity into free-fall projectile world coordinates:
  $$V_x = v_s \cos\theta - s \omega \sin\theta$$
  $$V_y = v_s \sin\theta + s \omega \cos\theta$$
- Gravity accelerates the ball downwards ($V_y += g \cdot dt$).
- Off-screen boundary: $Y > 1280 + 70\text{px}$ or $X \notin [-70, 790]$.

### 2. Frosted Glass Effect
- Background scene camera and play area container receive post-processing Gaussian blur (`postFX.addBlur(2, 4, 4, 2)`).
- Fullscreen translucent frosted glass backdrop (`rgba(244, 237, 228, 0.60)`) overlays the scene, heavily blurring the bar and pastel gradient while leaving them visible underneath.

### 3. Modal Card & Controls
- **Card**: Centered rounded-edge card ($520\text{px} \times 560\text{px}$, corner radius $24\text{px}$, drop shadow).
- **Title**: `'Game over!'` ($52\text{px}$, font weight `'900'`, `#3a2415`).
- **Tactile Wood Buttons**: Side-by-side:
  - **'Try Again'**: Clears frosted blur, resets bar angle to 0, centers marble on bar, and resumes play.
  - **'Main Menu'**: Clears frosted blur and switches to `TitleScene`.
- **Highscore Chart**:
  - Blank list with columns ('Highscore', 'Score', 'Time').
  - Soft semi-transparent grey vertical divider lines (`0x888888`, $\alpha = 0.22$) between columns; no outer borders.

---

## 7. Centralized Theme Architecture & Skinning
To support simultaneously changing visual themes (e.g., from classic wood to glowing neon or retro chrome) in a future feature without cluttering gameplay logic:

1. **Theme Contracts** ([`src/themes/types.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/themes/types.ts)):
   - `MarbleTheme`: Texture generation (`ensureTexture`) and drop shadow rendering (`drawShadow`), with an optional `rotatesTexture` flag.
   - `BarTheme`: Bar surface and bevel rendering (`drawBar`).
   - `ButtonTheme`: Base extrusion (`drawBase`), movable face plate (`drawFace`), dark press shading (`drawPressShade`), font stack, and text colors.
   - `GameTheme`: Aggregates `MarbleTheme`, `BarTheme`, and `ButtonTheme`.
2. **Central Theme Manager** ([`src/themes/themeManager.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/themes/themeManager.ts)):
   - Singleton registry holding active theme and registered themes.
   - Reactive pub-sub listener (`onThemeChanged`) notifying game elements of runtime theme swaps.
3. **Unified Tactile Button** ([`src/ui/TactileButton.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/ui/TactileButton.ts)):
   - Central button factory consumed across all screens ([`TitleScene.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/scenes/TitleScene.ts) and [`GameOverModal.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/ui/GameOverModal.ts)).
   - Automatically adopts active theme aesthetics and updates dynamically upon theme changes.
4. **Player-Facing UI Constraint**:
   - As specified, no player-facing settings or options UI are exposed at this stage. The architecture strictly provides the foundation for future theme packs.
