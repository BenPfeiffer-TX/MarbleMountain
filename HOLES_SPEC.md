# Procedural Wall Holes & Speed Gauge Specification (Feature 4)

This document specifies the exact geometry, procedural generation rules, physics detection, visual styling, and animation parameters for the scrolling wall obstacles in *Marble Mountain*.

---

## 1. Overview & Gameplay Rules
- **Core Obstacle**: The mountain wall behind the bar contains deep holes (receding pits) that scroll slowly downward toward the player.
- **Procedural Shapes**: Holes consist of procedurally generated rectangles and triangles.
- **Solvability Invariant**: Every horizontal slice across the playable wall width is mathematically guaranteed to contain at least one safe passage corridor ($W_{\text{safe}} \ge 110\text{px}$, well exceeding the $50\text{px}$ marble diameter) where the marble can rest without falling through.
- **Emergence Timing & Position**: Hole patterns populate the mountain wall starting halfway down the screen ($Y \approx 640\text{px}$, 50% viewport height) and scroll continuously downward right from the start of the game, eliminating empty waiting time.
- **Lose Condition**: If the marble center passes over the surface of any hole, the marble falls into the pit (scaling down and shading into the dark void), triggering Game Over.
- **Speed Gauge (Tick Marks)**: Altitude notches / tick marks along the left and right edges scroll synchronously with the wall, calibrated so exactly one tick mark passes the bar every second.

---

## 2. Geometry & Coordinate System
*Target Viewport*: $720 \times 1280$ (Portrait).  
*Bar Location*: Center $Y = 1132.8\text{px}$, playable horizontal span $X \in [45\text{px}, 675\text{px}]$.  
*Marble Radius*: $R = 25\text{px}$ (Diameter $50\text{px}$).

### Hole Geometries
1. **Rectangles**:
   - Width: $90\text{px} - 180\text{px}$
   - Height: $70\text{px} - 125\text{px}$
   - Corner Radius: $10\text{px}$
2. **Triangles**:
   - Base: $95\text{px} - 175\text{px}$
   - Height: $75\text{px} - 130\text{px}$
   - Orientation: Upright ($\Delta$) or Inverted ($\nabla$).

---

## 3. Mathematical Solvability Invariant & Continuous Distribution
Let $X \in [X_{\text{min}}, X_{\text{max}}] = [45, 675]$ be the playable horizontal range.
For any vertical coordinate $y$:
$$\text{FreeSpace}(y) = [X_{\text{min}}, X_{\text{max}}] \setminus \bigcup_{i} \text{Hole}_i(y)$$
The generation algorithm guarantees:
$$\max_{\text{interval} \subset \text{FreeSpace}(y)} \text{width}(\text{interval}) \ge W_{\text{safe}} \quad (W_{\text{safe}} = 115\text{px} > 2.3R)$$

### Continuous Meandering Corridor Architecture
Instead of discrete horizontal bands/rows, obstacles are continuously and organically distributed across the mountain wall:
1. **Smoothstep Spine**: Control anchors are spaced every $90\text{px}$ of $Y$ with drift $\le 95\text{px}$. The corridor center $X_{\text{safe}}(y)$ is evaluated continuously via smoothstep $s(t) = 3t^2 - 2t^3$.
2. **Continuous Envelope Reservation**: For any obstacle spanning $[y_1, y_2]$, the corridor envelope $[\min S_{\text{left}}, \max S_{\text{right}}]$ with buffer $14\text{px}$ is strictly reserved.
3. **Organic Jittered Spacing**: Generation advances upward in fine-grained steps ($\Delta Y = 48\text{--}70\text{px}$) with random vertical jitter ($\pm 30\text{px}$) on each candidate, breaking any perceived horizontal lines or rows.
4. **Collision Packing**: Adjacent holes maintain a minimum clearance gap ($20\text{px}$) to keep their thick wooden borders distinct, producing a dense, natural obstacle course of $14\text{--}20$ holes on screen simultaneously.

---

## 4. Visual Design & Theme Integration
- **Hole Interior**: Deep pitch black (`#050507`), representing an abyss through the mountain wall.
- **Inner Shadow / Recessed Rim**: Soft top-left ambient occlusion shadow (`rgba(0, 0, 0, 0.45)`) creating the optical illusion of carved wall depth.
- **Theme-Textured Border**: Thick border ($4.5\text{px}$) with outer dark contour ($1.5\text{px}$) and warm top highlight bevel matching the active theme.
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
