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

## 3. Reflective Metallic Steel Visuals
- **Spherical Shading**: Radial gradient with off-center specular core positioned at $(-0.32 R, -0.32 R)$:
  - Center/Core: Pure white glare (`#ffffff`).
  - Mid-tone: Bright polished silver (`#e6ebed` $\rightarrow$ `#a6b2ba`).
  - Underside Shadow: Deep steel gray (`#6d7780` $\rightarrow$ `#3e454d`).
  - Outer Edge: Dark rim contour shadow (`#262a2e`).
- **Rotation Indication (Rolling vs Sliding)**:
  - The sphere includes subtle latitudinal equator seams and brushed steel texture that physically rotate with $\Delta \phi = \Delta s / R$.
  - The specular glare overlay remains stationary relative to the top-left light source, clearly proving to the player that the ball is physically rolling without sliding.

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
$$a_{\text{friction}} = -\text{sign}(v_s) \cdot \mu_{\text{roll}} \quad (\mu_{\text{roll}} = 160\text{px/s}^2)$$
- When the player reverses the tilt of the bar ($\sin\theta$ opposes $v_s$), gravity and rolling resistance combine to decelerate the marble rapidly ($\approx 500\text{px/s}^2$), allowing quick stops.
- **Static Hold Threshold**: When $|\sin\theta| < 0.015\text{ rad}$ ($\approx 0.86^\circ$) and $|v_s| < 14\text{px/s}$, the marble remains stationary without drift.

---

## 5. Arrival Sequence (Entry from Title Screen)
1. **Entering State**: Bar slides UP from $Y = 1362\text{px}$ to $Y = 1132.8\text{px}$ over $440\text{ms}$ (`Cubic.easeOut`). The marble rides directly on top at $s = 0$.
2. **Inertia Lift-Off**: The instant the bar reaches $1132.8\text{px}$ and stops, the marble continues upward with inertia:
   $$v_h = 280\text{px/s} \implies h_{\text{apex}} = \frac{v_h^2}{2g} = \frac{280^2}{2800} = 28\text{px}$$
3. **Small Bounce**:
   - Rebound velocity on first contact: $v_{\text{bounce}} = 280 \times 0.38 \approx 106\text{px/s}$ ($h_{\text{rebound}} \approx 5\text{px}-6\text{px}$).
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
