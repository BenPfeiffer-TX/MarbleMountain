# Procedural Wall Holes & Speed Gauge Specification (Feature 4)

This document specifies the exact geometry, procedural generation rules, physics detection, visual styling, and animation parameters for the scrolling wall obstacles in *Marble Mountain*.

---

## 1. Overview & Gameplay Rules
- **Core Obstacle**: The mountain wall behind the bar contains deep holes (receding pits) that scroll slowly downward toward the player.
- **Procedural Shapes**: Holes consist of procedurally generated rectangles and triangles.
- **Solvability Invariant**: Every horizontal slice across the playable wall width is mathematically guaranteed to contain at least one safe passage corridor ($W_{\text{safe}} \ge 110\text{px}$, well exceeding the $50\text{px}$ marble diameter) where the marble can rest without falling through.
- **Emergence Timing**: Hole patterns begin emerging at the top of the screen ($Y \le 0$) as soon as the marble completes its arrival bounce sequence and settles into active rolling.
- **Lose Condition**: If the marble center passes over the surface of any hole, the marble falls into the pit (scaling down and shading into the dark void), triggering Game Over.
- **Speed Gauge (Tick Marks)**: Altitude notches / tick marks along the left and right edges scroll synchronously with the wall, calibrated so exactly one tick mark passes the bar every second.

---

## 2. Geometry & Coordinate System
*Target Viewport*: $720 \times 1280$ (Portrait).  
*Bar Location*: Center $Y = 1132.8\text{px}$, playable horizontal span $X \in [45\text{px}, 675\text{px}]$.  
*Marble Radius*: $R = 25\text{px}$ (Diameter $50\text{px}$).

### Hole Geometries
1. **Rectangles**:
   - Width: $70\text{px} - 150\text{px}$
   - Height: $50\text{px} - 90\text{px}$
   - Corner Radius: $8\text{px}$
2. **Triangles**:
   - Base: $80\text{px} - 130\text{px}$
   - Height: $65\text{px} - 95\text{px}$
   - Orientation: Upright ($\Delta$) or Inverted ($\nabla$).

---

## 3. Mathematical Solvability Invariant
Let $X \in [X_{\text{min}}, X_{\text{max}}] = [45, 675]$ be the playable horizontal range.
For any vertical coordinate $y$:
$$\text{FreeSpace}(y) = [X_{\text{min}}, X_{\text{max}}] \setminus \bigcup_{i} \text{Hole}_i(y)$$
The generation algorithm guarantees:
$$\max_{\text{interval} \subset \text{FreeSpace}(y)} \text{width}(\text{interval}) \ge W_{\text{safe}} \quad (W_{\text{safe}} = 110\text{px} > 2R)$$
This is achieved by dividing vertical generation into bands ($H_{\text{band}} = 160\text{px}$, separated by $60\text{px}$ maneuvering gaps). In each band, a designated safe corridor $[S_{\text{start}}, S_{\text{end}}]$ with width $\ge 110\text{px}$ is explicitly reserved before procedural placement of holes in the remaining spaces. Consecutive corridors shift by at most $160\text{px}$, ensuring smooth navigateable paths.

---

## 4. Visual Design & Theme Integration
- **Hole Interior**: Deep pitch black (`#050507`), representing an abyss through the mountain wall.
- **Inner Shadow / Recessed Rim**: Soft top/left ambient occlusion shadow (`rgba(0, 0, 0, 0.45)`) creating the optical illusion of wall thickness.
- **Theme-Textured Border**: Thin border ($2.5\text{px}$) matching the active theme (warm wood with contour bevel in the default theme, neon glow in future neon theme).
- **Speed Gauge Ticks**: Clean minimalist tick marks along $X \in [8\text{px}, 24\text{px}]$ (left) and $X \in [696\text{px}, 712\text{px}]$ (right). Every 5th tick is an extended major mark.

---

## 5. Wall Motion & Tick Calibration
- **Scroll Speed ($V_{\text{wall}}$)**: $70\text{px/sec}$.
- **Tick Spacing ($S_{\text{tick}}$)**: $70\text{px}$.
- **Rate**: $\frac{V_{\text{wall}}}{S_{\text{tick}}} = \frac{70\text{px/s}}{70\text{px}} = 1.0\text{ tick/second}$ passing the bar.

---

## 6. Point-in-Hole Detection & Pit Fall Animation
- **Detection**:
  - Rectangles: Axis-aligned bounding box test with rounded corners: $x_1 \le x_c \le x_2 \land y_1 \le y_c \le y_2$.
  - Triangles: Barycentric coordinate / cross-product orientation test.
- **Pit Fall Sequence**:
  - Drop shadow vanishes immediately.
  - Scale shrinks $1.0 \rightarrow 0.20$ (`Quad.easeIn`, $550\text{ms}$).
  - Tint shades to deep black (`0x0a0a0c`).
  - On complete: triggers frosted glass Game Over modal.
