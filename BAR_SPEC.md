# Bar & Tilt Controls Specification (Feature 1)

This document records the exact parameters, mechanics, and design decisions for the tilting bar in *Marble Mountain*. Reference this specification when adjusting or building dependent features (e.g., marble physics, wall scrolling, cutouts).

---

## 1. Overview & Mechanics
- **Concept**: Mechanical tilting bar based on the arcade game *Ice Cold Beer*.
- **Center Pivot**: The bar is pinned at its geometric center $(X = 360, Y = 1132.8)$. The center remains stationary in space; the only movement allowed is rotation clockwise or counter-clockwise.
- **Deflection Range**: Clamped to $\pm 20.0^\circ$ ($\pm 0.349\text{ rad}$).
- **Release Behavior**: `autoCenterOnRelease: false` (mechanical rack hold — the bar preserves its current tilt angle when fingers are lifted from the screen).

---

## 2. Geometry & Spatial Layout
*Target Viewport*: $720 \times 1280$ (Portrait, `Phaser.Scale.FIT`, `autoCenter: Phaser.Scale.CENTER_BOTH`).

| Property | Value | Calculation / Notes |
| :--- | :--- | :--- |
| **Bar Width Ratio** | `0.92` | $720 \times 0.92 = 662.4\text{px}$ total span ($W_{\text{bar}}$). |
| **Half Width ($W_{\text{half}}$)** | `331.2px` | Center to either tip. |
| **Bar Height / Thickness** | `22px` | $H_{\text{bar}} = 22\text{px}$ ($+10\%$ thicker than initial $20\text{px}$). |
| **Corner Radius** | `8px` | Rounded corners on the wood rectangle. |
| **Center Pivot Y (`barYRatio`)** | `0.885` | $1280 \times 0.885 = 1132.8\text{px}$ ($Y_c$). |
| **Max Tip Drop at $20^\circ$** | `123.6px` | $Y'_{\text{max}} = W_{\text{half}}\sin(20^\circ) + \frac{H}{2}\cos(20^\circ) = 331.2(0.3420) + 11(0.9397)$. |
| **Max Deflection Tip Y** | `1256.4px` | Lowest corner reaches $Y = 1132.8 + 123.6 = 1256.4\text{px}$. |
| **Bottom Edge Margin** | `23.6px` | Clearance between lowest tip and bottom edge of screen ($1280 - 1256.4$). |

---

## 3. Touch Controls & Dual-Touch Math
- **Hit Areas**: Two dedicated, invisible `Phaser.GameObjects.Zone` instances positioned along the outer left and right edges.
  - **Zone Width**: `touchZoneWidthRatio = 0.35` ($252\text{px}$ on left and right sides).
  - **Zone Height**: `460px` vertical thumb reach centered around the bar.
  - **Zone Margin / Padding**: `+30px` extra padding (`touchZonePadding: 30`) to eliminate dropped touches.
- **Dual-Finger Mode (Both Thumbs Active)**:
  - Line angle between left and right touches:
    $$\Delta Y = (Y_{\text{right}} - Y_{\text{left}}) \times \text{touchSensitivity}$$
    $$\theta_{\text{target}} = \text{atan2}(\Delta Y, 2 \cdot W_{\text{half}})$$
- **Single-Finger Mode (One Thumb Active)**:
  - Left finger active: $\theta_{\text{target}} = \text{atan2}((Y_c - Y_{\text{left}}) \times \text{touchSensitivity}, W_{\text{half}})$
  - Right finger active: $\theta_{\text{target}} = \text{atan2}((Y_{\text{right}} - Y_c) \times \text{touchSensitivity}, W_{\text{half}})$
- **Persistent Dragging**: Scene-wide pointer listeners track active pointers once engaged, preventing touch drops if thumbs drift outside initial zone boundaries.

---

## 4. Deadzone & Physical Inertia Model
To prevent micro-tremors and give the bar physical mass, touch input is filtered and applied through a second-order critically damped angular model:

1. **Movement Deadzone (`touchDeadzonePx: 7`)**:
   - Micro-displacements under $7\text{px}$ are absorbed.
   - When displacement exceeds $7\text{px}$, the movement anchor slides continuously with the finger, ensuring 1:1 control with zero abrupt jumping.
2. **Sensitivity Multiplier (`touchSensitivity: 0.80`)**:
   - Scales vertical movement for deliberate, fine control.
3. **Angular Inertia Simulation**:
   $$\text{Torque}_{\text{spring}} = (\theta_{\text{target}} - \theta_{\text{current}}) \times \text{inertiaStiffness}$$
   $$\text{Torque}_{\text{damping}} = -\omega \times \text{inertiaDamping}$$
   $$\alpha = \text{Torque}_{\text{spring}} + \text{Torque}_{\text{damping}}$$
   $$\omega_{\text{new}} = \text{clamp}(\omega + \alpha \cdot \Delta t, -\text{maxAngularSpeed}, +\text{maxAngularSpeed})$$
   $$\theta_{\text{new}} = \theta_{\text{current}} + \omega_{\text{new}} \cdot \Delta t$$
4. **Mechanical Hard Stops**:
   - If $\theta$ reaches $\pm 20^\circ$, it is hard-clamped and $\omega$ is immediately zeroed.

---

## 5. Visual Styling
- **Minimalist Aesthetic**: No visible HUD, telemetry, pivot pins, end stops, or guide boxes.
- **Background**: Construction paper (`0xdfd5c0`) with procedural fibers and subtle vignette.
- **Bar**: Solid wood grain rectangle (`0x9c6638`) with longitudinal fiber accents (`0x7c4e27` / `0xb57c4c`) and soft contact shadow (`0x3a2c1d`, alpha 0.26).

---

## 6. Configuration Parameter Reference (`BAR_CONFIG`)

```typescript
export const BAR_CONFIG = {
  // Positioning & Dimensions
  barYRatio: 0.885,           // Vertical center pivot ratio (1132.8px on 1280px screen)
  barWidthRatio: 0.92,        // Bar width fraction (662.4px on 720px screen)
  barHeight: 22,              // Bar thickness in pixels
  barCornerRadius: 8,         // Rounded corner radius

  // Motion & Rotation Limits
  maxDeflectionDeg: 20,       // Maximum deflection angle (+-20 degrees)
  autoCenterOnRelease: false, // false = hold tilt position; true = spring to 0 deg

  // Touch Input Deadzone & Sensitivity
  touchDeadzonePx: 7,         // Minimum movement threshold in pixels before motion registers
  touchSensitivity: 0.80,     // Sensitivity scaling multiplier

  // Inertia & Physics Feel
  inertiaStiffness: 55,       // Angular acceleration force towards target
  inertiaDamping: 15,         // Friction damping against angular velocity
  maxAngularSpeed: 3.5,       // Max angular velocity in rad/sec (~200 deg/s)

  // Touch Zones (Outer Edges - invisible hit areas)
  touchZoneWidthRatio: 0.35,  // 35% screen width for each outer grip
  touchZoneHeight: 460,       // 460px vertical thumb reach
  touchZonePadding: 30,       // +30px extra hit area padding

  // Visual Styling
  paperColor: 0xdfd5c0,       // Construction paper tint
  woodBaseColor: 0x9c6638,    // Base wood tone
  woodGrainDarkColor: 0x7c4e27,
  woodGrainLightColor: 0xb57c4c,
};
```
