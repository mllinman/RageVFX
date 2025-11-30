# Episode 7: Color Grading Masterclass

**Duration**: 35 minutes  
**Level**: Intermediate  
**Prerequisites**: Episodes 1-6

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 1:30)

> Color grading is what transforms good footage into cinematic masterpieces. It's not just about making things look pretty—it's about guiding emotion, establishing mood, and unifying your visual story.
>
> In this masterclass, we'll explore every color tool in RageVFX and learn professional grading techniques used in Hollywood.

**Key Learning Objectives:**
- Master primary and secondary color correction
- Work with LUTs professionally
- Implement OCIO color management
- Use CDL for collaborative workflows
- Create signature looks

---

### Part 1: Color Theory Fundamentals (1:30 - 6:00)

#### The Color Wheel

Understanding complementary colors is essential:

```
         Yellow
           │
  Orange ──┼── Green
           │
    Red ───┼─── Cyan
           │
Magenta ───┼─── Blue
```

**Complementary pairs:**
- Orange ↔ Teal (most popular film look)
- Red ↔ Cyan
- Yellow ↔ Purple

#### Primary Color Correction

Adjusts the entire image:
- **Lift**: Dark tones (shadows)
- **Gamma**: Mid tones
- **Gain**: Bright tones (highlights)

#### Secondary Color Correction

Targets specific colors or areas:
- Hue-based selection
- Luminance-based selection
- Mask-based isolation

---

### Part 2: ColorCorrect Node (6:00 - 12:00)

The workhorse of basic color adjustment.

#### Parameters

| Parameter | Range | Purpose |
|-----------|-------|---------|
| brightness | -1 to 1 | Overall lightness |
| contrast | 0 to 2 | Tonal range |
| saturation | 0 to 2 | Color intensity |
| hue | -180 to 180 | Color rotation |

#### Practical Applications

**Increase Drama:**
```
brightness: -0.05
contrast: 1.2
saturation: 1.1
```

**Vintage/Faded:**
```
brightness: 0.1
contrast: 0.85
saturation: 0.75
```

**High Key (Bright):**
```
brightness: 0.15
contrast: 0.95
saturation: 1.0
```

---

### Part 3: Grade Node (12:00 - 18:00)

Professional lift/gamma/gain control.

#### Understanding Lift/Gamma/Gain

| Control | Affects | Visual |
|---------|---------|--------|
| **Lift** | Shadows | Darkest areas |
| **Gamma** | Midtones | Middle values |
| **Gain** | Highlights | Brightest areas |

#### Color Wheels

Each control has RGB channels:
- Push toward color to add tint
- Pull opposite to remove tint

**Example: Orange & Teal Look**
```
Lift: Push toward teal (shadows cool)
Gain: Push toward orange (highlights warm)
Gamma: Neutral or slight warm
```

#### Offset

Global shift applied to entire image.
Use for overall temperature adjustment.

---

### Part 4: LUT Loader (18:00 - 23:00)

#### What is a LUT?

**L**ook-**U**p **T**able: Mathematical transform that maps input colors to output colors.

Types:
- **1D LUT**: Single curve, basic correction
- **3D LUT**: Full color transform, complex looks

#### Built-in Presets

RageVFX includes 11 preset looks:

| Preset | Style |
|--------|-------|
| Cinematic Warm | Orange highlights, blue shadows |
| Cinematic Cool | Teal overall |
| Vintage | Faded, warm |
| Bleach Bypass | Desaturated, high contrast |
| Orange & Teal | Classic film look |
| Night Vision | Green tint |
| Cross Process | Color shifts |
| High Contrast | Strong blacks/whites |
| Soft | Low contrast, gentle |
| Vibrant | Saturated |
| Muted | Desaturated |

#### Using LUTLoaderNode

1. Add LUTLoader node
2. Select preset or load .cube file
3. Adjust intensity (0-1)
4. Blend with original

#### LUT Workflow Best Practices

1. **Grade first, LUT second**: Primary correction before LUT
2. **Use intensity slider**: Full LUT can be harsh
3. **Stack multiple LUTs**: Layer for complex looks
4. **Create technical LUTs**: Log-to-linear, color space

---

### Part 5: CDL (Color Decision List) (23:00 - 27:00)

#### What is CDL?

ASC (American Society of Cinematographers) standard for:
- Communicating color decisions
- On-set looks
- Cross-platform compatibility

#### CDL Controls

**Slope**: Multiply (like Gain)
```
RGB separately controllable
Value of 1.0 = no change
```

**Offset**: Add (like Lift)
```
RGB separately controllable
Value of 0.0 = no change
```

**Power**: Gamma
```
RGB separately controllable
Value of 1.0 = no change
```

**Saturation**: Global saturation
```
Value of 1.0 = normal
```

#### CDL Formula

```
output = (input × slope + offset) ^ power
```

#### CDL Workflow

1. Colorist creates CDL values
2. Export as .cdl or .cc file
3. Apply in VFX pipeline
4. Maintains creative intent

---

### Part 6: Color Matching (27:00 - 30:00)

#### ColorMatchNode

Match colors between different shots or reference images.

#### Matching Methods

| Method | Description | Best For |
|--------|-------------|----------|
| Histogram | Match distribution | General matching |
| Reinhard | Statistical color transfer | Style transfer |
| Pitié | Optimal transport | Precise matching |

#### Using ColorMatch

```
[Target Shot] ─────→ [ColorMatch] → [Output]
[Reference Shot] ───┘
```

Parameters:
- **method**: Choose algorithm
- **strength**: Blend amount (0-1)
- **preserveLuminance**: Keep original brightness

---

### Part 7: OCIO Color Management (30:00 - 33:00)

#### What is OCIO?

**O**pen**C**olor**IO**: Industry-standard color management.

Ensures consistent color across:
- Different software
- Different displays
- Different delivery formats

#### Color Spaces

| Space | Use |
|-------|-----|
| **Linear** | Internal compositing |
| **sRGB** | Web, monitors |
| **ACEScg** | VFX production |
| **Log** | Camera footage |
| **Rec.709** | HD broadcast |
| **Rec.2020** | HDR, UHD |

#### OCIOColorSpaceNode

Convert between color spaces:

```
[Log Footage] → [OCIO: Log to Linear] → [Compositing] → [OCIO: Linear to sRGB] → [Output]
```

#### OCIOLookNode

Apply OCIO look transforms:
- Creative looks
- Show LUTs
- Technical transforms

---

### Part 8: Creating a Look (33:00 - 35:00)

#### Building a Signature Look

Layer your color operations:

```
[Input] → [Primary Grade] → [Secondary Correction] → [LUT] → [Final Adjust] → [Output]
```

#### Example: Cinematic Look

**Step 1: Primary Grade (GradeNode)**
```
lift: RGB(0.02, 0.02, 0.05) - Blue shadows
gamma: RGB(1.0, 1.0, 1.0) - Neutral mids
gain: RGB(1.1, 1.0, 0.95) - Warm highlights
```

**Step 2: Contrast (ColorCorrectNode)**
```
contrast: 1.15
saturation: 0.95
```

**Step 3: LUT (LUTLoaderNode)**
```
preset: "Cinematic Warm"
intensity: 0.5
```

**Step 4: Final (ColorCorrectNode)**
```
brightness: -0.03
saturation: 1.05
```

---

### Summary

**What You Learned:**
- ✅ Color theory fundamentals
- ✅ ColorCorrect for basic adjustment
- ✅ Grade for lift/gamma/gain
- ✅ LUT workflow
- ✅ CDL for collaboration
- ✅ Color matching techniques
- ✅ OCIO color management
- ✅ Building looks from scratch

**Practice Exercise:**
1. Take any image
2. Create three different looks:
   - Warm cinematic
   - Cold thriller
   - Vintage nostalgic
3. Save as node presets

**Next Tutorial:**
[Episode 8: Green Screen Keying](08-green-screen-keying.md)

---

## 🎨 Look Recipes

### Blockbuster Teal & Orange
```
Grade: Lift teal, Gain orange
ColorCorrect: Contrast 1.2
Saturation: 1.1
```

### Horror Cold
```
Grade: Overall blue shift
ColorCorrect: Contrast 1.3
Saturation: 0.85
Brightness: -0.1
```

### Romantic Warm
```
Grade: Lift warm, Gamma soft
ColorCorrect: Contrast 0.9
Saturation: 1.15
Add golden highlight glow
```

---

*Continue to [Episode 8: Green Screen Keying](08-green-screen-keying.md)!*
