# Episode 4: Your First VFX Effect

**Duration**: 25 minutes  
**Level**: Beginner  
**Prerequisites**: Episodes 1-3

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 1:00)

> Now it's time to create something amazing! In this tutorial, we'll build a complete fire composite from scratch. You'll learn how to combine procedural effects with live footage for a professional-looking result.
>
> By the end, you'll have a complete understanding of the VFX compositing workflow.

**Key Learning Objectives:**
- Create procedural fire effects
- Composite VFX over background plates
- Use blend modes effectively
- Add finishing touches with color grading

**Project Overview:**
We'll composite fire onto a background plate, add glow effects, and color grade the final result.

---

### Part 1: Project Setup (1:00 - 4:00)

#### Step 1: Create New Project

1. File → New Project (Ctrl/Cmd+N)
2. Save immediately (Ctrl/Cmd+S)
3. Name it "Fire_Composite_Tutorial"

#### Step 2: Set Up Background

1. From Node Library, drag **Image Input** to the canvas
2. Position it on the left side
3. This will be our background plate

**For this tutorial, we'll simulate having an image loaded.**

#### Step 3: Plan Your Graph

Our final graph will look like:

```
[Background] ──────────────────────────────┐
                                           ├→ [Merge] → [Glow] → [Color Grade] → [Output]
[Fire Node] → [Blur] → [Color Correct] ────┘
```

---

### Part 2: Creating the Fire Effect (4:00 - 9:00)

#### Adding the Fire Node

1. In Node Library, expand **VFX Effects** category
2. Find **Fire** node (should have 🔴 red indicator)
3. Drag it to the canvas, below the Image Input

#### Fire Node Parameters

Select the Fire node and explore its parameters:

| Parameter | Default | Recommended | Purpose |
|-----------|---------|-------------|---------|
| intensity | 1.0 | 1.2 | Overall brightness |
| scale | 1.0 | 0.8 | Size of flames |
| speed | 1.0 | 0.7 | Animation speed |
| turbulence | 0.5 | 0.6 | Randomness |
| innerColor | Orange | #FF6600 | Hot center color |
| outerColor | Red | #FF0000 | Cooler edge color |

#### Adjusting Fire Parameters

1. **Select** the Fire node
2. In Properties panel, adjust:
   - **intensity**: `1.2` - Makes flames brighter
   - **scale**: `0.8` - Slightly smaller flames
   - **turbulence**: `0.6` - More chaotic movement

**Pro Tip**: The Fire node is procedural—it generates flames mathematically, so no external assets needed!

#### Adding Motion Blur to Fire

For more realistic fire:

1. Add a **Blur** node from Filter category
2. Position it to the right of Fire node
3. Connect: Fire → Blur

**Blur Settings:**
- **blurAmount**: `2.0` - Subtle softening
- **quality**: `preview` - Fast for now

#### Color Correcting the Fire

1. Add a **Color Correct** node
2. Connect: Blur → Color Correct

**Color Correct Settings:**
- **brightness**: `0.1` - Slightly brighter
- **contrast**: `1.3` - More punch
- **saturation**: `1.2` - More vivid colors

---

### Part 3: Compositing (9:00 - 15:00)

#### Adding the Merge Node

1. Find **Merge** in Composite category
2. Drag to canvas, right of your fire chain

#### Understanding Merge Modes

The Merge node combines two images. Key parameters:

| Mode | Effect | Best For |
|------|--------|----------|
| **over** | Layer A over B with alpha | Standard compositing |
| **add** | Add colors together | Fire, glow, light effects |
| **multiply** | Darken overlay | Shadows, dirt |
| **screen** | Lighten overlay | Glow, highlights |

For fire effects, **screen** or **add** modes work best because they blend the bright fire while keeping the background visible.

#### Making Connections

1. Connect **Background (Image Input)** → Merge input A (background)
2. Connect **Color Correct** (fire) → Merge input B (foreground)

#### Configuring Merge

Select Merge node:
- **operation**: `screen` - Fire blends naturally
- **opacity**: `0.9` - Subtle transparency
- **mix**: `1.0` - Full effect

**Screen mode** adds brightness without completely obscuring the background—perfect for fire!

---

### Part 4: Adding Glow (15:00 - 18:00)

Fire looks more realistic with a glow around it.

#### Adding Glow Node

1. Find **Glow** in Filter category
2. Position after Merge
3. Connect: Merge → Glow

#### Glow Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| intensity | 0.7 | Glow brightness |
| size | 15 | Glow spread |
| threshold | 0.5 | What glows |
| softness | 0.8 | Glow falloff |

**Adjustments:**
1. **intensity**: `0.7` - Visible but not overpowering
2. **size**: `15` - Wide spread
3. **threshold**: `0.5` - Only bright areas glow

This creates the light-spill effect you see with real fire.

---

### Part 5: Color Grading (18:00 - 22:00)

Professional composites always include color grading to unify the elements.

#### Adding Final Color Grade

1. Add another **Color Correct** node
2. Position after Glow
3. Connect: Glow → Color Correct (final)

#### Grading for Fire Scene

For a scene with fire, we want:
- Warmer overall tone
- Slightly increased contrast
- Subtle desaturation of non-fire areas

**Settings:**
- **brightness**: `0.05` - Slight lift
- **contrast**: `1.1` - Subtle punch
- **saturation**: `0.95` - Slight desaturation
- **hue**: `5` - Warm shift (if available)

#### Alternative: LUT Loader

For more cinematic looks:

1. Replace final Color Correct with **LUT Loader**
2. Try presets like:
   - "Cinematic Warm" - Orange/teal look
   - "Bleach Bypass" - Desaturated contrast

---

### Part 6: Output and Execution (22:00 - 24:00)

#### Adding Output Node

1. Add **Output** node from Input/Output
2. Position at far right
3. Connect: Final Color Correct → Output

#### Your Complete Graph

```
[Image Input] ─────────────────────────────────────┐
                                                   │
                                                   ↓
[Fire] → [Blur] → [Color Correct] → [Merge: screen] → [Glow] → [Color Grade] → [Output]
```

#### Executing the Graph

1. Click **Execute** button (▶) in toolbar
2. Watch progress indicator
3. View result in Viewport

#### Inspecting the Result

In Viewport:
- **Pan** around to see full image
- **Zoom** in to check details
- Check fire integration edges
- Verify glow looks natural

---

### Part 7: Refinements (24:00 - 25:00)

#### Common Adjustments

**Fire too bright?**
- Reduce Fire intensity
- Lower Merge opacity

**Fire edges too hard?**
- Increase Blur amount
- Adjust Glow threshold

**Colors don't match?**
- Adjust final Color Correct
- Match fire tones to background

#### Save Your Project

1. File → Save (Ctrl/Cmd+S)
2. Your project is safely stored

---

### Summary

**What You Created:**
- ✅ Procedural fire effect
- ✅ Softened fire with blur
- ✅ Color-corrected fire
- ✅ Screen-blended composite
- ✅ Added glow for realism
- ✅ Final color grade

**Complete Node Graph:**
```
[Background] ──────────────────────────────────────────┐
                                                       ↓
[Fire] → [Blur] → [Color Correct A] → [Merge (screen)] → [Glow] → [Color Correct B] → [Output]
```

**Key Techniques Learned:**
- Procedural VFX generation
- Screen blend mode for light effects
- Multi-stage color correction
- Glow for realism

**Practice Variations:**
1. Try other blend modes (add, overlay)
2. Experiment with different fire colors
3. Add multiple fire sources
4. Create smoke behind the fire

**Next Tutorial:**
In [Episode 5: Saving & Exporting](05-saving-and-exporting.md), we'll learn all the output options—image sequences, video formats, and professional delivery specs.

---

## 🎨 Fire Effect Quick Settings

### Campfire Style
- intensity: 0.8
- scale: 0.7
- turbulence: 0.4
- innerColor: #FF9900
- outerColor: #FF3300

### Inferno Style
- intensity: 1.5
- scale: 1.2
- turbulence: 0.8
- innerColor: #FFFF00
- outerColor: #FF0000

### Blue Magic Fire
- intensity: 1.0
- scale: 0.6
- turbulence: 0.5
- innerColor: #00FFFF
- outerColor: #0066FF

---

## 💡 Pro Tips

1. **Layer multiple fire nodes** for more complex flames
2. **Use masks** to control where fire appears
3. **Add embers** with Spark or Debris nodes
4. **Animate parameters** over time for variation
5. **Match color temperature** between fire and scene

---

*Continue to [Episode 5: Saving & Exporting](05-saving-and-exporting.md)!*
