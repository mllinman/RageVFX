# Episode 6: Compositing Essentials

**Duration**: 30 minutes  
**Level**: Intermediate  
**Prerequisites**: Episodes 1-5

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 1:00)

> Compositing is the art of combining multiple images into a seamless final result. It's the foundation of all visual effects work—from simple layering to complex multi-element scenes.
>
> In this tutorial, we'll master the essential compositing techniques that form the backbone of professional VFX.

**Key Learning Objectives:**
- Understand alpha channels and premultiplication
- Master all blend modes
- Work with layers effectively
- Use masks and mattes
- Create seamless composites

---

### Part 1: Alpha Channels (1:00 - 5:00)

#### What is Alpha?

Alpha is the fourth channel in RGBA images that defines transparency:
- **0 (black)**: Fully transparent
- **255 (white)**: Fully opaque
- **1-254 (gray)**: Semi-transparent

```
RGB Channels:     Alpha Channel:     Result:
[Color info]  +   [Transparency]  =  [Final image]
```

#### Premultiplied vs Straight Alpha

**Straight Alpha:**
- RGB channels contain full color
- Alpha is applied at render time
- Best for: Rotoscoping, text, graphics

**Premultiplied Alpha:**
- RGB channels already multiplied by alpha
- Edges appear darker against black
- Best for: CG renders, compositing

#### Checking Alpha

To view alpha channel:
1. Connect output to **Split RGBA** node (if available)
2. View alpha output separately
3. Or use Viewport alpha display mode

---

### Part 2: Merge Node Deep Dive (5:00 - 12:00)

The **Merge** node is your primary compositing tool.

#### Merge Inputs

| Input | Name | Purpose |
|-------|------|---------|
| A | Background | Bottom layer |
| B | Foreground | Top layer |
| mask | Mask | Optional transparency control |

#### All Blend Modes Explained

**Basic Operations:**

| Mode | Formula | Use Case |
|------|---------|----------|
| **over** | B over A | Standard layering |
| **under** | A over B | Reverse layering |
| **plus** | A + B | Add colors |
| **minus** | A - B | Subtract |

**Lightening Modes:**

| Mode | Effect | Use Case |
|------|--------|----------|
| **screen** | Lightens | Fire, glow, light |
| **add** | Adds directly | Lens flares, sparks |
| **lighten** | Max value | Light effects |
| **dodge** | Brightens | Highlights |

**Darkening Modes:**

| Mode | Effect | Use Case |
|------|--------|----------|
| **multiply** | Darkens | Shadows, dirt |
| **darken** | Min value | Dark effects |
| **burn** | Deepens | Shadows |

**Contrast Modes:**

| Mode | Effect | Use Case |
|------|--------|----------|
| **overlay** | Contrast boost | Color grading |
| **softLight** | Subtle contrast | Gentle grading |
| **hardLight** | Strong contrast | Dramatic effects |

#### Opacity and Mix

- **opacity**: Overall transparency (0-1)
- **mix**: Blend between original and result (0-1)

```
mix=0: Pure A input
mix=1: Full blend result
mix=0.5: Half blend
```

#### Practical Example: Fire Composite

```
[Background Plate]
        ↓
     [Merge: screen]  ←── [Fire Effect]
        ↓
     [Output]
```

Settings:
- operation: `screen`
- opacity: `0.8`

---

### Part 3: Layering Multiple Elements (12:00 - 17:00)

Complex scenes require multiple layers.

#### Layer Stacking

Build composites in layers:

```
Layer 4: Lens flares, glows (screen)
Layer 3: Effects, particles (screen/add)
Layer 2: Foreground elements (over)
Layer 1: Background plate (base)
```

#### Example: Complex Scene

```
[Background] ──────────────────────────────────────────────┐
                                                           ↓
[Foreground Person] → [Color Correct] → [Merge A: over] ──→ [Merge B: screen] → [Merge C: add] → [Output]
                                              ↑                    ↑                ↑
[Rotoscope Matte] ────────────────────────────┘                    │                │
                                                                   │                │
[Smoke Effect] → [Color Correct] ──────────────────────────────────┘                │
                                                                                    │
[Spark Particles] ──────────────────────────────────────────────────────────────────┘
```

#### Edge Blending

For seamless edges:
1. Apply slight blur to alpha edges
2. Use **EdgeMatte** node for refinement
3. Color-correct edges to match

---

### Part 4: Masks and Mattes (17:00 - 23:00)

#### Difference Between Masks and Mattes

| Term | Description | Source |
|------|-------------|--------|
| **Mask** | Manually created shape | Rotoscope, drawing |
| **Matte** | Extracted from image | Keying, luma |
| **Alpha** | Existing transparency | Rendered CG |

#### Using Mask Input on Merge

Connect a mask to limit the composite:

```
[Background] ────────────────┐
                             ↓
[Effect] → [Merge: screen] ──→ [Output]
               ↑
[Mask] ────────┘
```

The mask controls WHERE the effect appears.

#### Creating Masks with Rotoscope

1. Add **Rotoscope** node
2. Define mask shape points
3. Animate over time if needed
4. Connect to merge mask input

#### Luma-Based Mattes

Extract matte from brightness:

1. Add **LuminanceKey** node
2. Set low/high thresholds
3. Adjust softness
4. Use output as mask

---

### Part 5: Deep Compositing (23:00 - 27:00)

For 3D-rendered elements with depth.

#### What is Deep Compositing?

Traditional compositing: 2D layers in order
Deep compositing: Per-pixel depth awareness

#### Using DeepCompositeNode

```
[3D Render A] → [Deep Composite] → [Output]
[3D Render B] ──────┘
[Depth A] ──────────┘
[Depth B] ──────────┘
```

Benefits:
- Correct depth sorting
- Proper intersections
- Accurate motion blur

#### Deep Composite Modes

| Mode | Use |
|------|-----|
| depth | Sort by depth |
| over | Standard over |
| under | Standard under |
| plus | Additive |
| holdout | Cut out shape |

---

### Part 6: Cryptomatte Workflow (27:00 - 29:00)

#### What is Cryptomatte?

Automatic ID mattes from 3D renders:
- Each object gets unique ID
- Anti-aliased edges automatically
- Multiple objects selectable

#### Using CryptomatteNode

1. Connect crypto render passes
2. Enter object IDs to select
3. Get perfect matte output

#### Cryptomatte Benefits

- No manual rotoscoping
- Perfect edges
- Easy iteration
- Handle motion blur

---

### Summary (29:00 - 30:00)

**What You Learned:**
- ✅ Alpha channels and premultiplication
- ✅ All Merge blend modes
- ✅ Multi-layer compositing
- ✅ Masks vs mattes
- ✅ Deep compositing
- ✅ Cryptomatte workflow

**Practice Project:**
Create a scene with:
1. Background plate
2. CG element (composited with over)
3. Fire effect (screen mode)
4. Atmospheric haze (add mode)
5. Final color grade

**Next Tutorial:**
[Episode 7: Color Grading Masterclass](07-color-grading-masterclass.md) - Professional color techniques!

---

## 📊 Blend Mode Quick Reference

| Mode | Effect | Alpha | Best For |
|------|--------|-------|----------|
| over | Layer on top | Yes | General |
| add | Brighten | No | Glow, fire |
| screen | Lighten | Yes | Light effects |
| multiply | Darken | Yes | Shadows |
| overlay | Contrast | Yes | Color grading |

---

## 🎯 Compositing Checklist

Before finalizing any composite:

- [ ] Edges blend naturally
- [ ] Color temperature matches
- [ ] Brightness levels consistent
- [ ] Grain/noise matched
- [ ] Motion blur consistent
- [ ] Depth cues correct
- [ ] Lighting direction matches

---

*Continue to [Episode 7: Color Grading Masterclass](07-color-grading-masterclass.md)!*
