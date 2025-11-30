# Episode 9: Tracking & Stabilization

**Duration**: 25 minutes  
**Level**: Intermediate  
**Prerequisites**: Episodes 1-8

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 1:00)

> Motion tracking is what makes VFX elements feel like they belong in the scene. Whether you're attaching graphics to a moving object or removing camera shake, tracking is an essential skill.
>
> In this tutorial, we'll cover point tracking, planar tracking, and stabilization techniques.

**Key Learning Objectives:**
- Understand tracking concepts
- Use point trackers for element attachment
- Master planar tracking for screen replacement
- Stabilize shaky footage
- Analyze optical flow

---

### Part 1: Tracking Fundamentals (1:00 - 4:00)

#### What is Tracking?

Tracking analyzes motion frame-by-frame to:
- Follow features through a shot
- Extract position/rotation/scale data
- Apply motion to other elements

#### Types of Tracking

| Type | Dimensions | Use Case |
|------|------------|----------|
| **Point Tracking** | 2D position | Element attachment |
| **Planar Tracking** | 2D + perspective | Screen replacement |
| **3D Camera Tracking** | Full 3D | CG integration |
| **Stabilization** | Inverse tracking | Remove shake |

#### Good Tracking Features

Look for:
- High contrast areas
- Unique patterns
- Consistent appearance
- No occlusions

---

### Part 2: Point Tracking (4:00 - 10:00)

#### PointTrackerNode

Track individual points through footage.

```
[Source Footage] → [PointTracker] → [Tracking Data Output]
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| searchArea | Size of search region |
| trackSize | Size of feature pattern |
| offsetX/Y | Track offset from center |
| subpixel | Sub-pixel accuracy |

#### Setting Up a Point Track

**Step 1: Position Tracker**
1. Move playhead to first frame
2. Set initial track position
3. Position on high-contrast feature

**Step 2: Configure Search**
```
searchArea: 50-100 pixels
trackSize: 20-40 pixels
```

**Step 3: Track Forward**
1. Click Track Forward
2. Monitor for drift
3. Adjust if tracking fails

#### Using Track Data

Apply tracked motion to elements:

```
[PointTracker] → [TrackingData] → [Transform] → [Element]
```

The element now follows the tracked motion!

---

### Part 3: Planar Tracking (10:00 - 16:00)

#### What is Planar Tracking?

Tracks a flat surface through perspective changes:
- Screen replacement
- Sign replacement
- Floor/wall tracking

#### PlanarTrackerNode

```
[Source] → [PlanarTracker] → [CornerPin Data] → [Screen Replacement]
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| region | Define tracking area |
| perspective | Track perspective changes |
| motionBlur | Track through blur |
| searchRange | Frame search distance |

#### Planar Tracking Workflow

**Step 1: Define Region**
1. Set four corners of planar surface
2. Ensure region contains texture
3. Avoid edges of frame

**Step 2: Track**
1. Track forward through shot
2. Monitor for drift
3. Keyframe corrections if needed

**Step 3: Apply to Element**

```
[PlanarTracker] → [CornerPin] → [Replacement Image]
                                        ↓
                               [Merge] → [Output]
                                  ↑
                            [Background]
```

#### Screen Replacement Example

```
[TV Footage] ────────────────────────────────────────────────────┐
    ↓                                                            │
[PlanarTracker] → [CornerPin] → [New Screen Content]            │
                                        ↓                        │
                                 [Color Match] → [Merge] → [Output]
```

---

### Part 4: Stabilization (16:00 - 21:00)

#### StabilizerNode

Remove unwanted camera shake.

```
[Shaky Footage] → [Stabilizer] → [Stable Output]
```

#### Stabilization Methods

| Method | Tracks | Best For |
|--------|--------|----------|
| **Transform** | Position, rotation | Handheld shake |
| **Warp** | Perspective | Rolling shutter |
| **Smooth** | Average motion | Drone footage |

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| smoothing | How much to stabilize (0-1) |
| zoomToFit | Zoom to hide edges |
| method | transform/warp |
| translation | Stabilize position |
| rotation | Stabilize rotation |
| scale | Stabilize scale |

#### Stabilization Workflow

**Step 1: Analyze**
```
1. Add Stabilizer node
2. Connect shaky footage
3. Run analysis
```

**Step 2: Adjust Smoothing**
```
smoothing: 0.5 - Natural smoothing
smoothing: 1.0 - Locked off look
```

**Step 3: Handle Edges**
```
zoomToFit: true - Zoom to fill frame
zoomToFit: false - Show black edges
```

#### When to Stabilize

- Before color grading
- Before keying
- Before any position-sensitive work

---

### Part 5: Optical Flow (21:00 - 24:00)

#### OpticalFlowNode

Analyze motion vectors between frames.

#### Use Cases

1. **Motion blur** - Add realistic blur
2. **Frame interpolation** - Slow motion
3. **Motion vectors** - Visualize movement

#### MotionVectorsNode

Visualize optical flow as arrows:

```
[Source] → [OpticalFlow] → [MotionVectors Visualization]
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| gridSize | Arrow density |
| scale | Arrow length multiplier |
| color | Arrow color |
| thickness | Arrow line width |

---

### Part 6: TrackingData Node (24:00 - 25:00)

#### Storing and Managing Tracks

The TrackingDataNode stores track points:

| Feature | Purpose |
|---------|---------|
| Multi-point storage | Store many tracks |
| Interpolation | Smooth between keyframes |
| Smoothing | Reduce jitter |
| Export/Import | Share tracking data |

#### Smoothing Tracks

```
[Raw Track] → [TrackingData] → [Smooth Output]

smoothWindow: 3-5 frames
```

---

### Summary

**What You Learned:**
- ✅ Tracking fundamentals
- ✅ Point tracking for attachment
- ✅ Planar tracking for replacement
- ✅ Stabilization techniques
- ✅ Optical flow analysis
- ✅ Managing tracking data

**Practice Exercise:**
1. Track a moving object (point track)
2. Attach text that follows the object
3. Stabilize the shot
4. Replace a screen (planar track)

**Next Tutorial:**
[Episode 10: Procedural VFX Effects](10-procedural-effects.md)

---

## 🎯 Tracking Tips

### Getting Better Tracks

1. **High contrast features** - Look for distinct edges
2. **Consistent features** - Avoid occluded areas
3. **Good lighting** - Well-lit features track better
4. **Multiple tracks** - Use several points for stability

### Fixing Lost Tracks

1. Go to frame where tracking failed
2. Reposition tracker manually
3. Resume tracking
4. Use keyframe interpolation

### Screen Replacement Checklist

- [ ] Planar surface clearly defined
- [ ] Tracking through entire shot
- [ ] Corner pin applied correctly
- [ ] Lighting matches original
- [ ] Reflections/glare considered
- [ ] Motion blur matched

---

*Continue to [Episode 10: Procedural VFX Effects](10-procedural-effects.md)!*
