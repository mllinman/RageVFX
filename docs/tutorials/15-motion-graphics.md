# Episode 15: Motion Graphics

**Duration**: 38 minutes  
**Level**: Advanced  
**Prerequisites**: Episodes 1-14

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 2:00)

> Motion graphics bring static designs to life with animation and movement. RageVFX 3.5 introduces powerful motion graphics capabilities similar to After Effects, including shape layers, animation presets, and advanced array tools.
>
> In this tutorial, we'll create professional motion graphics from scratch.

**Key Learning Objectives:**
- Create and animate shape layers
- Use animation presets
- Master array modifiers
- Apply transitions
- Build complete motion graphics sequences

---

### Part 1: Shape Layers (2:00 - 10:00)

#### MotionGraphicsNode

Create and animate vector shapes.

```
[MotionGraphics] → [Output]
```

#### Shape Types

| Type | Description |
|------|-------------|
| rectangle | Rectangular shape |
| ellipse | Circle/oval |
| polygon | Multi-sided shape |
| star | Star shape |
| path | Custom bezier path |
| text | Text rendering |

#### Shape Parameters

**Rectangle:**
```
shapeType: rectangle
width: 200
height: 100
cornerRadius: 10
```

**Polygon:**
```
shapeType: polygon
sides: 6        # Hexagon
size: 100
```

**Star:**
```
shapeType: star
points: 5
outerRadius: 100
innerRadius: 40
```

#### Styling Properties

| Property | Purpose |
|----------|---------|
| fillColor | Shape fill |
| strokeColor | Outline color |
| strokeWidth | Outline thickness |
| opacity | Transparency |
| blendMode | Compositing mode |

---

### Part 2: Animation Presets (10:00 - 18:00)

#### Built-in Animation Presets

| Preset | Effect |
|--------|--------|
| fadeIn | Fade from transparent |
| fadeOut | Fade to transparent |
| scaleUp | Grow from small |
| scaleDown | Shrink to nothing |
| slideIn | Enter from side |
| slideOut | Exit to side |
| bounce | Bouncy entrance |
| elastic | Springy motion |
| spin | Rotation animation |

#### Applying Presets

```
animationPreset: bounce
animationDuration: 24  # frames
animationDelay: 0
easingMode: smooth
```

#### Easing Modes

| Mode | Effect |
|------|--------|
| linear | Constant speed |
| smooth | Natural motion |
| stepped | No interpolation |
| bezier | Custom curve |

#### Combining Animations

Layer multiple animations:

```
Frame 0-24:   fadeIn + scaleUp
Frame 24-48:  position animation
Frame 48-72:  rotation animation
Frame 72-96:  fadeOut + scaleDown
```

---

### Part 3: Motion Paths (18:00 - 24:00)

#### Following a Path

Animate along a custom path:

```
motionPathEnabled: true
motionPath: [[0,0], [100,50], [200,0], [300,100]]
orientToPath: true
pathProgress: animated 0-1
```

#### Catmull-Rom Splines

Smooth path interpolation:
- Automatic smooth curves
- Natural motion
- No sharp corners

#### Orient to Path

```
orientToPath: true
```

Shape rotates to face movement direction—essential for vehicles, arrows, characters.

---

### Part 4: Array Modifier (24:00 - 32:00)

#### ArrayModifierNode

Create repeated patterns.

```
[Shape] → [ArrayModifier] → [Pattern Output]
```

#### Array Modes

**Linear Array:**
```
mode: linear
count: 10
offsetX: 50
offsetY: 0
rotationOffset: 5
scaleOffset: 0.95
opacityOffset: -0.1
```

**Radial Array:**
```
mode: radial
count: 12
centerX: 400
centerY: 300
radius: 150
angleStart: 0
angleEnd: 360
orientToCenter: true
```

**Grid Array:**
```
mode: grid
countX: 5
countY: 4
spacingX: 100
spacingY: 80
staggerOffset: 50  # Brick pattern
```

**Spiral Array:**
```
mode: spiral
count: 20
expansionRate: 5
turns: 3
```

**Random Array:**
```
mode: random
count: 50
seed: 12345
positionVariance: 100
rotationVariance: 180
scaleVariance: 0.5
```

#### Color Variations

| Mode | Effect |
|------|--------|
| gradient | Color interpolation |
| random | Random colors |
| hueShift | Progressive hue |

```
colorMode: hueShift
hueShiftAmount: 30  # degrees per instance
```

#### Animation with Arrays

```
staggerDelay: 2  # frames between instances
```

Creates cascading animations through the array!

---

### Part 5: Transitions (32:00 - 36:00)

#### TransitionNode

Professional transitions between clips.

```
[Clip A] → [Transition] → [Output]
[Clip B] ────┘
```

#### Transition Types

**Cut Transitions:**
| Type | Effect |
|------|--------|
| cut | Instant switch |
| dissolve | Cross-fade |
| fade | Fade through black |

**Wipe Transitions:**
| Type | Parameters |
|------|------------|
| wipe | angle, softness |
| iris | shape (circle, diamond, star) |
| push | direction |
| slide | direction |
| reveal | direction |

**Effect Transitions:**
| Type | Effect |
|------|--------|
| blur | Blur transition |
| pixelate | Pixelate transition |
| swirl | Spiral warp |
| glitch | Digital glitch |
| zoom | Zoom in/out |

#### Transition Parameters

```
transitionType: iris
irisShape: circle
duration: 24
easing: easeInOut
reverse: false
```

#### Easing for Transitions

All 17 easing types available:
- Standard: linear, easeIn, easeOut, easeInOut
- Dramatic: bounce, elastic, back
- Mathematical: expo, circ, sine, quad, cubic, quart, quint

---

### Part 6: Complete Motion Graphics Project (36:00 - 38:00)

#### Project: Animated Logo Reveal

```
[Background Gradient] ───────────────────────────────────────┐
                                                             ↓
[Logo Shape: star] → [ArrayModifier: radial] → [Transition: dissolve] → [Merge] → [Output]
```

**Step 1: Background**
```
[Gradient: radial]
  colors: [#1a1a2e, #16213e]
```

**Step 2: Logo Elements**
```
[MotionGraphics: star]
  fillColor: #ffd700
  animation: scaleUp + spin
```

**Step 3: Array**
```
[ArrayModifier: radial]
  count: 8
  radius: 200
  colorMode: hueShift
  staggerDelay: 3
```

**Step 4: Transition**
```
[Transition: iris]
  shape: star
  duration: 30
  easing: elastic
```

---

### Summary

**What You Learned:**
- ✅ Shape layer creation
- ✅ Animation presets
- ✅ Motion path animation
- ✅ Array modifiers (5 modes)
- ✅ Professional transitions
- ✅ Complete motion graphics workflow

**Practice Project:**
Create a 5-second intro with:
1. Animated text
2. Shape layer background
3. Array pattern decoration
4. Logo reveal transition
5. Final text animation

**Next Tutorial:**
[Episode 16: Advanced 3D Rendering](16-advanced-3d-rendering.md)

---

## 📊 Array Mode Quick Reference

| Mode | Best For |
|------|----------|
| linear | Rows, sequences |
| radial | Circular patterns |
| grid | Backgrounds, tiles |
| spiral | Dynamic patterns |
| random | Organic scatter |

## 🎨 Transition Quick Reference

| Transition | Style |
|------------|-------|
| dissolve | Elegant |
| wipe | Professional |
| iris | Dramatic |
| zoom | Energetic |
| glitch | Modern |
| blur | Dreamy |

---

*Continue to [Episode 16: Advanced 3D Rendering](16-advanced-3d-rendering.md)!*
