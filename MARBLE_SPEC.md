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

## 3. Reflective Shiny Steel Ball Bearing Visuals (2-Layer Composition)
- **Authentic Polished Bearing Design**:
  - The marble renders as a clean, mirror-polished chrome steel ball bearing.
  - Artificial visual aids (circumference lines, equator seams, and surface grain arcs) have been completely removed.
- **2-Layer Composition**:
  - **Layer 1 (Base Body - `ensureBaseTexture`)**:
    - Dark outer steel contour rim (`#1c2024`).
    - Smooth spherical chrome radial base gradient from `#eaf0f5` (bright metallic tone) through `#d0dce4`, `#8e9da8`, `#54606a`, to `#2d3339` ambient edge.
    - Subtle ambient underside ground reflection (`rgba(215, 230, 245, 0.24)`) on the lower crescent.
    - `rotatesBody`: Controls whether the base layer rotates as the marble rolls.
  - **Layer 2 (Stationary Overlay - `ensureOverlayTexture`)**:
    - Hot-white specular flare centered at $(-0.32 R, -0.32 R)$ with blinding white core (`#ffffff`), glare halo, and smooth transparent falloff.
    - Stays completely stationary relative to the overhead light source regardless of ball rolling velocity.
- **Decoupled Architecture**:
  - The base body, specular overlay, and contact drop shadow are generated and managed by [`src/themes/defaultTheme.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/themes/defaultTheme.ts) and [`src/themes/themeManager.ts`](file:///storage/emulated/10/antigravity-projects/Marble%20Mountain/src/themes/themeManager.ts).
  - This 2-layer composition guarantees that future patterned themes (e.g. 8-balls or striped marbles) can physically rotate their pattern on Layer 1 while keeping their 3D specular shine locked to the light source on Layer 2.

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

### 1. Surface Collision & Corner Roll-Off Mechanics
- **Surface Collision Geometry**:
  - Rather than treating the marble as a single point that immediately drops as soon as its center passes the bar tip ($|s| > W_{\text{half}}$), collision is measured against the outer spherical surface of the marble.
  - When the marble rolls past the bar corner ($|s| > W_{\text{half}}$), the marble maintains exact tangential contact with the corner at $(\pm W_{\text{half}}, H_{\text{bar}}/2)$:
    $$u = \frac{H_{\text{bar}}}{2} + \sqrt{R^2 - \Delta s^2} \quad (\Delta s = |s| - W_{\text{half}})$$
    $$\text{distance to corner} = \sqrt{\Delta s^2 + (u - H_{\text{bar}}/2)^2} = R$$
  - As $\Delta s$ increases from $0$ to $R \cdot 0.88$ ($\approx 22\text{px}$), the marble visibly dips and smoothly rounds the corner of the bar without clipping through the end cap.
- **Corner Kinematics & Save Window**:
  - Tangential corner angle: $\alpha = \arcsin(\Delta s / R)$.
  - Effective gravitational slope: $\theta_{\text{eff}} = \theta \pm \alpha$.
  - As the ball rounds the edge, acceleration increases down the curve. However, if the player quickly counters by tilting that side of the bar upward ($|\theta| > \alpha$), $\theta_{\text{eff}}$ reverses, decelerating the ball and allowing skilled players to roll the marble back onto the flat top of the bar.
- **Detachment & Free-Fall Transition**:
  - Detachment threshold: $\Delta s \ge R \times 0.88$ (corner rotation $\alpha \approx 62^\circ$).
  - Once detached, relative velocity components along the tangent arc ($v_s^{\text{bar}} = v_s \cos\alpha, v_u^{\text{bar}} = -|v_s| \sin\alpha$) and bar angular rotation velocity ($\vec{\omega} \times \vec{r}$) are converted into world-space projectile velocities ($V_x, V_y$).
  - The marble launches outward and downward completely clear of the bar's boundary with zero visual clipping.
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
   - `MarbleTheme`: 2-layer composition supporting rolling base body (`ensureBaseTexture`), optional stationary specular gloss overlay (`ensureOverlayTexture`), drop shadow rendering (`drawShadow`), and `rotatesBody` flag.
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
