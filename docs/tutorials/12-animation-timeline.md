# Episode 12: Animation & Timeline

**Duration**: 28 minutes  
**Level**: Intermediate  
**Prerequisites**: Episodes 1-11

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 1:00)

> Static effects become truly magical when they move through time. RageVFX includes a professional animation system with keyframes, curves, and timeline controls that rival any industry tool.
>
> In this tutorial, we'll master the art of animation—from simple parameter changes to complex curve editing.

**Key Learning Objectives:**
- Understand keyframe animation concepts
- Use the timeline panel effectively
- Work with easing and interpolation
- Master the curve editor
- Create smooth, professional animations

---

### Part 1: Animation Fundamentals (1:00 - 5:00)

#### What is Keyframe Animation?

Animation stores values at specific frames:
- **Keyframe**: A saved value at a specific time
- **Interpolation**: Values calculated between keyframes
- **Curve**: Visual representation of change over time

```
Frame 1 ────── Interpolation ────── Frame 24
Value: 0                           Value: 100
```

#### The Timeline Panel

```
┌─────────────────────────────────────────────────────────────┐
│ ◀◀  ◀  ▶/⏸  ▶  ▶▶ │ Frame: 012 │ FPS: 24 │ 1-100         │
├─────────────────────────────────────────────────────────────┤
│ Track: Position X    ◆─────────────◆────────────◆          │
│ Track: Opacity       ◆────────────────────────────────◆    │
├─────────────────────────────────────────────────────────────┤
│ ▼────────────────│─────────────────────────────────────▼   │
│ 0        25        50        75       100                   │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Transport controls**: Play, pause, scrub
- **Tracks**: Animation channels
- **Keyframes**: Diamond markers (◆)
- **Playhead**: Current frame indicator

---

### Part 2: AnimationTimelineNode (5:00 - 12:00)

#### Setting Up Animation

```
[AnimationTimeline] → [Target Node Parameter]
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| startFrame | Animation start |
| endFrame | Animation end |
| fps | Frames per second |
| currentFrame | Current position |
| loopMode | once/loop/pingpong |
| playbackSpeed | Speed multiplier |

#### Creating Keyframes

**Step 1: Set Time**
1. Move playhead to desired frame
2. Or set currentFrame parameter

**Step 2: Set Value**
1. Adjust the parameter you want to animate
2. The value at this frame is stored

**Step 3: Move and Repeat**
1. Move to another frame
2. Change value
3. Keyframe created automatically

#### Loop Modes

| Mode | Behavior |
|------|----------|
| **once** | Play once and stop |
| **loop** | Repeat from start |
| **pingpong** | Forward then backward |

---

### Part 3: Easing Types (12:00 - 17:00)

#### What is Easing?

How animation accelerates/decelerates:

```
Linear:    |──────────────|  Constant speed
Ease Out:  |━━━━───────────|  Starts fast, slows
Ease In:   |───────────━━━━|  Starts slow, speeds up
Ease Both: |─────━━━━─────|  Smooth start and end
```

#### Available Easing Types

**Basic:**
| Type | Effect |
|------|--------|
| linear | Constant speed |
| smooth | Natural acceleration |
| stepped | Hold until next keyframe |

**Standard Easing:**
| Type | Effect |
|------|--------|
| easeIn | Slow start |
| easeOut | Slow end |
| easeInOut | Slow both |

**Dramatic Easing:**
| Type | Effect |
|------|--------|
| bounce | Bouncing effect |
| elastic | Spring-like |
| back | Overshoot |

**Mathematical:**
| Type | Effect |
|------|--------|
| expo | Exponential |
| circ | Circular |
| sine | Sinusoidal |
| quad | Quadratic |
| cubic | Cubic |
| quart | Quartic |
| quint | Quintic |

#### Choosing Easing

| Animation | Recommended |
|-----------|-------------|
| UI motion | easeOut |
| Camera move | easeInOut |
| Bouncing ball | bounce |
| Mechanical | linear |
| Organic | elastic |

---

### Part 4: Curve Editor (17:00 - 23:00)

#### CurveEditorNode

Professional animation curve control.

#### Tangent Types

How curves connect at keyframes:

| Type | Behavior |
|------|----------|
| **auto** | Automatic smooth |
| **smooth** | Smooth bezier |
| **linear** | Straight segments |
| **stepped** | Hold value |
| **flat** | Horizontal tangent |
| **free** | Independent in/out |
| **clamped** | Limited angle |
| **plateau** | Flat at peaks |

#### Working with Tangents

**Breaking Tangents:**
1. Select keyframe
2. Set tangent to "free"
3. Adjust in/out independently

**Weighted Tangents:**
1. Enable "weighted"
2. Adjust in/out weights
3. Control curve tension

#### Infinity Modes

What happens before/after animation:

| Mode | Effect |
|------|--------|
| constant | Hold first/last value |
| linear | Continue slope |
| cycle | Repeat animation |
| cycleOffset | Repeat with offset |
| oscillate | Ping-pong forever |

#### Baking Curves

Convert complex curves to keyframes:
1. Select curve
2. Set bake parameters
3. Create keyframe per frame
4. Useful for export

---

### Part 5: Practical Animation (23:00 - 27:00)

#### Example: Fade In/Out

```
Frame 1:   opacity = 0
Frame 24:  opacity = 1   (easeOut)
Frame 72:  opacity = 1
Frame 96:  opacity = 0   (easeIn)
```

#### Example: Camera Move

```
Frame 1:   position = [0, 0, 10]
Frame 48:  position = [5, 2, 8]   (easeInOut)
Frame 96:  position = [0, 5, 6]   (easeInOut)
```

#### Example: Bounce Animation

```
Frame 1:   position.y = 0
Frame 12:  position.y = 5   (easeOut)
Frame 24:  position.y = 0   (bounce)
```

#### Connecting Animation

```
[AnimationTimeline] → [Time Output] → [Node Parameter]
```

The time output drives animated parameters.

---

### Part 6: Timeline Workflow (27:00 - 28:00)

#### Professional Workflow

1. **Plan animation** - Sketch key poses
2. **Block keyframes** - Major positions only
3. **Add easing** - Refine timing
4. **Adjust curves** - Fine-tune motion
5. **Review playback** - Check flow
6. **Polish** - Final adjustments

#### Timeline Shortcuts

| Shortcut | Action |
|----------|--------|
| Spacebar | Play/Pause |
| ← → | Previous/Next frame |
| Home/End | Go to start/end |
| I | Set in point |
| O | Set out point |
| K | Add keyframe |

---

### Summary

**What You Learned:**
- ✅ Keyframe animation concepts
- ✅ Timeline panel navigation
- ✅ Easing types and uses
- ✅ Curve editor techniques
- ✅ Practical animation examples
- ✅ Professional workflow

**Practice Exercise:**
1. Create a 100-frame animation
2. Animate: position, scale, opacity
3. Use different easing on each
4. Adjust curves for polish
5. Add looping

**Next Tutorial:**
[Episode 13: Physics Simulation](13-physics-simulation.md)

---

## 📊 Easing Quick Reference

| Motion Type | Easing |
|-------------|--------|
| Button hover | easeOut |
| Modal appear | easeOut |
| Modal dismiss | easeIn |
| Camera pan | easeInOut |
| Bounce | bounce |
| Springy | elastic |
| Mechanical | linear |
| Attention grab | back |

---

## 🎯 Animation Checklist

- [ ] Keyframes at key poses
- [ ] Appropriate easing applied
- [ ] Curves reviewed and polished
- [ ] Motion feels natural
- [ ] Timing matches content
- [ ] Looping works (if needed)

---

*Continue to [Episode 13: Physics Simulation](13-physics-simulation.md)!*
