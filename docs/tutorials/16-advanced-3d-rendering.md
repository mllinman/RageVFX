# Episode 16: Advanced 3D Rendering

**Duration**: 42 minutes  
**Level**: Advanced  
**Prerequisites**: Episodes 1-15 (especially Episode 11)

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 2:00)

> Beyond basic 3D rendering, RageVFX offers production-quality path tracing, interactive light mixing, and stereoscopic 3D workflows. These advanced features rival dedicated renderers like Redshift and V-Ray.
>
> In this tutorial, we'll push 3D rendering to the professional level.

**Key Learning Objectives:**
- Understand path tracing concepts
- Use the PathTracer for photoreal results
- Master light mixing for flexibility
- Work with stereoscopic 3D
- Optimize for 8K+ resolution

---

### Part 1: Path Tracing Fundamentals (2:00 - 10:00)

#### What is Path Tracing?

Physically-based light simulation:
- Traces light rays from camera
- Bounces realistically in scene
- Produces photorealistic results
- Slower but highest quality

#### PathTracerNode

Production-quality unbiased rendering.

```
[Scene] → [PathTracer] → [Output]
```

#### Key Parameters

| Parameter | Purpose |
|-----------|---------|
| samples | Quality (more = better) |
| bounces | Light bounce depth |
| resolution | Output size |
| progressive | Show updates |

#### Advanced Parameters

**Sampling:**
```
samples: 256-4096      # Quality level
minBounces: 2          # Minimum bounces
maxBounces: 8          # Maximum bounces
russianRoulette: true  # Efficiency
```

**Importance Sampling:**
```
misEnabled: true       # Multiple importance sampling
neeEnabled: true       # Next event estimation
clampValue: 10         # Firefly reduction
```

**Depth of Field:**
```
dofEnabled: true
aperture: 2.8
focusDistance: 5.0
```

#### Tone Mapping

| Mode | Character |
|------|-----------|
| ACES | Film-like, industry standard |
| Reinhard | Simple, natural |
| Filmic | Cinema look |
| Linear | No mapping |

---

### Part 2: Light Mixing (10:00 - 18:00)

#### LightMixerNode

Adjust lights AFTER rendering.

```
[PathTracer] → [LightMixer] → [Final Output]
```

#### Why Light Mixing?

- Adjust lighting without re-rendering
- Creative flexibility in post
- Client revisions are instant
- Try multiple looks quickly

#### Light Groups

Organize lights into controllable groups:

```
Group: Key Lights
  - Sun
  - Fill_01
  
Group: Practical Lights
  - Lamp_A
  - Lamp_B
  
Group: Rim Lights
  - Rim_Back
  - Rim_Side
```

#### Per-Light Controls

| Control | Purpose |
|---------|---------|
| intensity | Light brightness |
| color | Light tint |
| saturation | Color strength |
| solo | View only this light |
| mute | Disable light |

#### Global Controls

| Control | Purpose |
|---------|---------|
| masterIntensity | Overall brightness |
| environment | HDRI contribution |
| gi | Global illumination |
| emission | Emissive materials |
| caustics | Caustic strength |
| shadowIntensity | Shadow darkness |
| shadowColor | Shadow tint |

#### Presets

Save and recall light setups:

```
savePreset: "Dramatic"
loadPreset: "Natural"
interpolatePresets: ["Dramatic", "Natural"], mix: 0.5
```

---

### Part 3: Stereoscopic 3D (18:00 - 28:00)

#### StereoCamera3DNode

Professional stereo camera rig.

```
[Scene] → [StereoCamera3D] → [Left/Right Output]
```

#### Stereo Presets

| Preset | Interaxial | Use |
|--------|------------|-----|
| Human Vision | 65mm | Natural viewing |
| Cinema Standard | 63.5mm | Film production |
| IMAX 3D | 75mm | Large format |
| VR Headset | 64mm | VR content |
| Macro Stereo | 20mm | Small subjects |
| Architectural | 100mm | Buildings |
| Aerial | 300mm | Landscapes |
| Miniature | 10mm | Small scale |

#### Stereo Modes

| Mode | Description |
|------|-------------|
| **toe-in** | Cameras angle inward |
| **parallel** | Cameras parallel |
| **off-axis** | Shifted frustums (best) |

#### Parameters

```
stereoMode: off-axis
interaxial: 65          # Eye separation (mm)
convergence: 2000       # Convergence distance (mm)
eyeSwap: false          # Swap left/right
```

#### StereoCompositorNode

Combine stereo pairs for output.

```
[Left Eye] → [StereoCompositor] → [Stereo Output]
[Right Eye] ────┘
```

#### Output Formats

| Format | Description |
|--------|-------------|
| separate | Two files |
| side-by-side | Horizontal pair |
| top-bottom | Vertical pair |
| anaglyph | Red-cyan glasses |
| interlaced | Line-by-line |
| checkerboard | Checker pattern |

#### Anaglyph Modes

| Mode | Glasses |
|------|---------|
| red-cyan | Standard |
| green-magenta | Alternative |
| amber-blue | Better color |
| Dubois | Optimized color |

---

### Part 4: 8K+ Resolution (28:00 - 34:00)

#### Resolution8KNode

Ultra-high resolution support.

```
[Scene] → [Resolution8K] → [8K Output]
```

#### Supported Resolutions

| Preset | Resolution | Megapixels |
|--------|------------|------------|
| HD | 1920×1080 | 2 MP |
| 2K | 2048×1080 | 2.2 MP |
| 4K UHD | 3840×2160 | 8.3 MP |
| 4K DCI | 4096×2160 | 8.8 MP |
| 6K | 6144×3456 | 21 MP |
| 8K UHD | 7680×4320 | 33 MP |
| 8K DCI | 8192×4320 | 35 MP |
| 10K | 10240×5760 | 59 MP |
| 12K | 12288×6480 | 80 MP |
| 16K | 15360×8640 | 133 MP |

#### Tiled Rendering

For memory efficiency:

```
tileRendering: true
tileSize: 1024
tileOverlap: 64
```

Renders in sections, stitches result.

#### Scaling Methods

| Method | Quality | Speed |
|--------|---------|-------|
| nearest | Lowest | Fastest |
| bilinear | Good | Fast |
| bicubic | Better | Medium |
| lanczos | Best | Slowest |

---

### Part 5: Advanced Rendering Techniques (34:00 - 40:00)

#### Multi-Pass Rendering

Render separate passes:

| Pass | Use |
|------|-----|
| beauty | Final image |
| diffuse | Diffuse lighting |
| specular | Specular highlights |
| reflection | Reflections |
| shadow | Shadow contribution |
| ao | Ambient occlusion |
| depth | Z-depth |
| normal | Surface normals |
| motion | Motion vectors |
| cryptomatte | Object IDs |

#### AOV Manager

Combine passes in compositing:

```
[Diffuse Pass] → [AOVManager] → [Composite]
[Specular Pass] ────┘
[Reflection Pass] ──┘
[Shadow Pass] ──────┘
```

#### Environment Mapping

```
[EnvironmentMap] → [Scene]
  type: hdri
  rotation: 45
  intensity: 1.0
  blur: 0
```

HDR environments provide:
- Realistic lighting
- Reflections
- Background

---

### Part 6: Optimization (40:00 - 42:00)

#### Render Optimization Tips

1. **Progressive preview** - Lower samples while working
2. **Adaptive sampling** - More samples where needed
3. **Denoise** - AI denoising on final
4. **GPU acceleration** - Use GPU when available
5. **Tiled rendering** - For high resolution
6. **Light importance** - Sample important lights more

#### Quality vs Speed

| Setting | Preview | Production |
|---------|---------|------------|
| samples | 64 | 4096 |
| bounces | 4 | 8 |
| resolution | 50% | 100% |
| denoise | On | Optional |

---

### Summary

**What You Learned:**
- ✅ Path tracing principles
- ✅ Light mixing workflow
- ✅ Stereoscopic 3D production
- ✅ 8K+ resolution handling
- ✅ Multi-pass rendering
- ✅ Optimization techniques

**Practice Project:**
Create a photoreal 3D scene:
1. Set up path tracer
2. Configure three-point lighting
3. Use light mixer for variations
4. Render in stereo 3D
5. Output at 4K resolution

**Next Tutorial:**
[Episode 17: Camera Tracking & Integration](17-camera-tracking-integration.md)

---

## 📊 Render Settings Quick Reference

### Preview Quality
```
samples: 64
bounces: 4
resolution: 960×540
denoise: On
```

### Production Quality
```
samples: 2048
bounces: 8
resolution: 3840×2160
denoise: Off/Light
toneMapping: ACES
```

---

*Continue to [Episode 17: Camera Tracking & Integration](17-camera-tracking-integration.md)!*
