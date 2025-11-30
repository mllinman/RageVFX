# Episode 8: Green Screen Keying

**Duration**: 28 minutes  
**Level**: Intermediate  
**Prerequisites**: Episodes 1-7

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 1:00)

> Green screen keying is one of the most common VFX tasks, but achieving a clean key is both art and science. In this tutorial, we'll master professional keying techniques that deliver broadcast-quality results.
>
> RageVFX includes the powerful IBK Keyer, modeled after industry-standard tools used in Hollywood productions.

**Key Learning Objectives:**
- Understand chroma keying principles
- Master the IBK Keyer
- Handle difficult keying situations
- Suppress spill professionally
- Refine edges for seamless composites

---

### Part 1: Keying Fundamentals (1:00 - 4:00)

#### How Chroma Keying Works

Keying removes pixels based on color:
1. Identify the key color (green/blue)
2. Calculate color difference
3. Generate transparency matte
4. Remove background

#### Why Green and Blue?

- Farthest from skin tones
- Minimal contamination on subjects
- Green: More common, luminant (digital)
- Blue: Classic (film), less spill

#### The Perfect Key Requires:

1. **Even lighting** on green screen
2. **Separation** between subject and screen
3. **No green** on subject
4. **Proper exposure** - not too bright/dark

---

### Part 2: Basic ChromaKey Node (4:00 - 8:00)

For simple keying situations.

#### Adding ChromaKey

```
[Green Screen Footage] → [ChromaKey] → [Merge: over] → [Output]
                                            ↑
[New Background] ───────────────────────────┘
```

#### Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| keyColor | Green | Color to remove |
| threshold | 0.3 | How much green to remove |
| softness | 0.1 | Edge softness |

#### Adjusting the Key

**Step 1: Set Key Color**
1. Select ChromaKey node
2. Click color picker
3. Sample green from footage
4. Or use RGB values: (0, 177, 64)

**Step 2: Adjust Threshold**
- Start at 0.3
- Increase to remove more green
- Decrease if subject is affected

**Step 3: Soften Edges**
- softness: 0.1-0.3 for natural edges
- Too much = blurry edges
- Too little = harsh edges

---

### Part 3: IBK Keyer (8:00 - 16:00)

Professional-grade keying for difficult shots.

#### What Makes IBK Different?

- Adaptive algorithm for uneven screens
- Multi-pass processing
- Better edge handling
- Core matte control
- Advanced spill suppression

#### IBKKeyerNode Parameters

**Screen Setup:**
| Parameter | Purpose |
|-----------|---------|
| screenColor | Auto-detect or pick |
| autoDetect | Sample screen automatically |
| screenSize | Search area for auto |

**Key Algorithm:**
| Parameter | Options | Purpose |
|-----------|---------|---------|
| algorithm | simple, adaptive, ibk_color, ibk_gizmo | Method |
| despillStrength | 0-1 | Remove green from subject |
| tolerance | 0-1 | Color range |
| softness | 0-1 | Edge blend |

**Core Matte:**
| Parameter | Purpose |
|-----------|---------|
| coreErosion | Shrink core for safety |
| coreBlur | Soften core edges |
| coreTolerance | Core threshold |

**Spill Suppression:**
| Parameter | Options |
|-----------|---------|
| spillMethod | average, max, min, replacement |
| spillAmount | Strength of suppression |

#### IBK Workflow

**Step 1: Set Screen Color**
```
1. Enable autoDetect
2. Or click screenColor picker
3. Sample darkest screen area
```

**Step 2: Choose Algorithm**
- `simple`: Even screens
- `adaptive`: Uneven lighting
- `ibk_color`: Color-based (best)
- `ibk_gizmo`: Full Nuke-style

**Step 3: Initial Key**
```
tolerance: 0.5
softness: 0.1
```

**Step 4: Refine Core**
```
coreErosion: 2-5
coreBlur: 1-3
```

**Step 5: Spill Suppression**
```
spillMethod: average
spillAmount: 0.5-0.8
```

---

### Part 4: Spill Suppression (16:00 - 20:00)

#### What is Spill?

Green/blue light bouncing onto the subject:
- Green tint on skin
- Green edges on hair
- Color contamination

#### SpillSuppressionNode

For additional spill control:

```
[IBKKeyer] → [SpillSuppression] → [EdgeMatte] → [Merge]
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| spillColor | Color to remove |
| algorithm | simple, advanced |
| amount | Suppression strength |

#### Advanced Algorithm

Better preserves natural colors:
- Analyzes surrounding pixels
- Replaces spill with neutral
- Maintains luminance

---

### Part 5: Edge Refinement (20:00 - 24:00)

#### EdgeMatteNode

Perfect edges are critical for believability.

```
[Key Output] → [EdgeMatte] → [Final Matte]
```

#### Parameters

| Parameter | Effect |
|-----------|--------|
| shrink | Negative = erode edge |
| grow | Positive = expand edge |
| blur | Soften edge |
| choke | Hard edge adjustment |

#### Typical Settings

**Tight Key (remove fringe):**
```
shrink: -1 to -3
blur: 1-2
```

**Soft Key (feathered edge):**
```
grow: 1-2
blur: 3-5
```

#### Hair Detail

Hair is the hardest part of keying:

1. Use **EdgeMatte** with slight grow
2. Lower blur amount
3. Consider separate hair pass
4. Mix with body key

---

### Part 6: Complete Keying Pipeline (24:00 - 27:00)

#### Full Professional Setup

```
[Source] ─────────────────────────────────────────────────────────────────────┐
    ↓                                                                         │
[IBKKeyer] → [SpillSuppression] → [EdgeMatte] → [ColorCorrect] → [Merge] → [Output]
                                                                    ↑
[Background] ──→ [ColorCorrect] ──→ [Blur (slight)] ────────────────┘
```

#### Step-by-Step Workflow

1. **Load source** - Green screen footage
2. **IBK Key** - Extract initial matte
3. **Spill Suppress** - Remove green contamination
4. **Edge Refine** - Perfect the edges
5. **Color Match** - Match subject to background
6. **Composite** - Merge over new background
7. **Final Grade** - Unify the composite

#### Quality Checks

Look for:
- [ ] No green fringe on edges
- [ ] Hair detail preserved
- [ ] No transparency holes in subject
- [ ] Skin tones natural
- [ ] Edges blend with background

---

### Summary (27:00 - 28:00)

**What You Learned:**
- ✅ Chroma keying principles
- ✅ Basic ChromaKey for simple shots
- ✅ IBK Keyer for professional results
- ✅ Spill suppression techniques
- ✅ Edge refinement
- ✅ Complete keying pipeline

**Practice Exercise:**
1. Download green screen test footage
2. Create clean key with IBK Keyer
3. Suppress all spill
4. Refine edges
5. Composite over a new background
6. Color grade to match

**Next Tutorial:**
[Episode 9: Tracking & Stabilization](09-tracking-and-stabilization.md)

---

## 🔧 Keying Troubleshooting

### Problem: Green fringe on edges
**Solution:**
- Increase despillStrength
- Add SpillSuppression node
- Use EdgeMatte shrink

### Problem: Holes in subject
**Solution:**
- Reduce tolerance
- Lower threshold
- Check core matte

### Problem: Noise in matte
**Solution:**
- Use EdgeMatte blur
- Check source quality
- Consider denoise before key

### Problem: Lost hair detail
**Solution:**
- Increase softness
- Use multiple key passes
- Edge grow + low blur

---

## 📊 Algorithm Comparison

| Algorithm | Best For | Processing |
|-----------|----------|------------|
| simple | Even screens | Fast |
| adaptive | Uneven lighting | Medium |
| ibk_color | Most situations | Medium |
| ibk_gizmo | Problem shots | Slow |

---

*Continue to [Episode 9: Tracking & Stabilization](09-tracking-and-stabilization.md)!*
