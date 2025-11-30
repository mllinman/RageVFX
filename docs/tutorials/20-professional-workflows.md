# Episode 20: Professional Workflows

**Duration**: 45 minutes  
**Level**: Advanced  
**Prerequisites**: Episodes 1-19

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 2:00)

> In this final tutorial, we bring everything together into professional workflows used in film and television production. We'll cover multishot workflows, deep compositing, and working at 8K+ resolutions.
>
> These techniques will prepare you for production-level VFX work.

**Key Learning Objectives:**
- Master multishot workflows
- Implement deep compositing
- Work efficiently at 8K+ resolution
- Organize complex projects
- Deliver production-quality results

---

### Part 1: Multishot Workflow (2:00 - 14:00)

#### MultiShotNode

Manage multiple shots in one project.

```
[MultiShot] → [Shot Variables] → [Processing]
```

#### Shot Management

```
shots:
  - name: SH010
    version: 3
    variant: hero
    frameRange: [1001, 1100]
    
  - name: SH020
    version: 2
    variant: wide
    frameRange: [1001, 1150]
```

#### Graph Scope Variables

Variables accessible across the graph:

```
variables:
  shot_name: SH010
  version: 3
  artist: "john"
  frame: 1001
  shot_path: "/shots/SH010/"
```

Use in expressions:

```
filepath: "{shot_path}comp/{shot_name}_v{version:03d}.exr"
```

#### Expression Linking

| Function | Description |
|----------|-------------|
| sin(x) | Sine wave |
| cos(x) | Cosine wave |
| lerp(a,b,t) | Linear interpolation |
| clamp(v,min,max) | Clamp value |
| frame | Current frame |
| time | Frame/fps |

Example:
```
opacity: lerp(0, 1, clamp((frame-1001)/24, 0, 1))
```

#### Batch Processing

Process multiple shots:

```
batchProcess: true
shotList: [SH010, SH020, SH030]
parallelShots: 2
outputPath: "{project}/render/{shot}/{shot}_comp_v{version}.####.exr"
```

#### Template-Based Shots

Create shots from templates:

```
template: "standard_comp"
applyTo: [SH010, SH020, SH030]

template_nodes:
  - ImageInput (plate)
  - ColorCorrect (primary)
  - Grade (secondary)
  - Output (comp)
```

---

### Part 2: Deep Compositing (14:00 - 24:00)

#### What is Deep Compositing?

Traditional compositing: 2D layers in order
Deep compositing: Per-pixel depth information

```
Traditional:  [BG] → [FG] → [Output]
              Layer order determines result

Deep:         [BG+Depth] → [DeepComposite] → [Output]
              [FG+Depth] ↗
              Depth determines per-pixel order
```

#### DeepCompositeNode

```
[Render A + Depth A] → [DeepComposite] → [Deep Result]
[Render B + Depth B] ↗
```

#### Deep Data

Each pixel contains:
- Color (RGBA)
- Depth (Z)
- Possibly multiple samples

#### Deep Merge Modes

| Mode | Behavior |
|------|----------|
| depth | Sort by depth value |
| over | Standard over |
| under | Standard under |
| plus | Additive |
| holdout | Cut out shape |

#### Deep Workflow

**Step 1: Render with Depth**
```
[Scene] → [Renderer3D]
  outputDepth: true
  depthFormat: float32
```

**Step 2: Deep Composite**
```
[Render A] → [DeepComposite] → [Result]
[Depth A] ↗       ↑
[Render B] ───────↗
[Depth B] ────────↗
```

**Step 3: Flatten**
```
[DeepComposite] → [DeepFlatten] → [Regular Image]
```

#### Benefits

1. **Correct intersections** - Objects properly intersect
2. **Motion blur** - Depth-correct motion blur
3. **Transparency** - Multiple transparent layers
4. **Flexibility** - Reorder without re-render

---

### Part 3: 8K+ Production (24:00 - 32:00)

#### Resolution8KNode

Ultra-high resolution support.

#### Resolution Presets

| Preset | Resolution | Use |
|--------|------------|-----|
| 4K DCI | 4096×2160 | Cinema |
| 6K | 6144×3456 | High-end |
| 8K UHD | 7680×4320 | Future TV |
| 8K DCI | 8192×4320 | IMAX |
| IMAX Laser | 12288×5184 | IMAX venues |

#### Tiled Rendering

For memory efficiency:

```
tileRendering: true
tileSize: 2048
tileOverlap: 64
```

Process:
1. Divide image into tiles
2. Render each tile separately
3. Blend overlapping areas
4. Stitch final image

#### Proxy Workflow

Work at lower resolution, render at full:

```
Working:   1920×1080 (proxy)
Preview:   3840×2160 (half)
Final:     7680×4320 (full)
```

#### Memory Management

| Resolution | Memory Needed |
|------------|---------------|
| 4K 16-bit | ~500MB/frame |
| 8K 16-bit | ~2GB/frame |
| 12K 16-bit | ~4.5GB/frame |

Tips:
- Enable disk caching
- Use proxy for interaction
- Render in passes
- Monitor memory usage

---

### Part 4: Project Organization (32:00 - 38:00)

#### Folder Structure

```
/SHOW_NAME
  /assets
    /char           # Characters
    /env            # Environments
    /prop           # Props
    /fx             # Effects elements
  /shots
    /SEQ01
      /SH010
        /plates     # Original footage
        /roto       # Roto masks
        /comp       # Comp scripts
        /render     # Final renders
  /ref              # Reference material
  /docs             # Documentation
  /delivery         # Final delivery
```

#### File Naming

```
Convention: {show}_{seq}_{shot}_{element}_{task}_v{version}.{ext}

Examples:
HERO_SEQ01_SH010_plate_grade_v003.exr
HERO_SEQ01_SH010_comp_final_v012.mov
HERO_SEQ01_SH010_cg_car_v005.####.exr
```

#### Version Control

| Version | Status |
|---------|--------|
| v001-v009 | Development |
| v010-v019 | First submission |
| v020-v029 | After notes |
| v030+ | Final |

#### Node Graph Organization

Use backdrops for sections:

```
[BACKDROP: Plate Prep - Blue]
  ImageInput → Grade → Denoise

[BACKDROP: CG Integration - Orange]
  CG_Import → ColorMatch → Merge

[BACKDROP: Final Grade - Green]
  LUT → Grain → Output
```

---

### Part 5: Quality Control (38:00 - 42:00)

#### QC Checklist

**Technical:**
- [ ] Correct resolution
- [ ] Proper color space
- [ ] Frame range complete
- [ ] No missing frames
- [ ] File naming correct

**Creative:**
- [ ] Color matches reference
- [ ] Elements integrate properly
- [ ] Motion matches plate
- [ ] Edges are clean
- [ ] No artifacts

**Delivery:**
- [ ] Format correct
- [ ] Compression settings right
- [ ] Metadata present
- [ ] Checksum verified

#### Common Issues

| Issue | Solution |
|-------|----------|
| Color shift | Check color management |
| Edge fringing | Refine keys/masks |
| Flickering | Temporal filtering |
| Grain mismatch | Match grain node |
| Registration | Re-track or adjust |

---

### Part 6: Delivery (42:00 - 45:00)

#### Delivery Specifications

**Film/DCP:**
```
Format: DPX or EXR
Resolution: 4K DCI (4096×2048)
Color Space: XYZ
Frame Rate: 24fps
```

**Broadcast:**
```
Format: ProRes 422 HQ
Resolution: 1920×1080
Color Space: Rec.709
Frame Rate: 23.976/25fps
```

**Streaming:**
```
Format: H.264/H.265
Resolution: 4K UHD
Color Space: Rec.709 or HDR
Frame Rate: 23.976-60fps
```

#### Final Output

```
[Final Composite] → [Output]
  format: exr
  colorSpace: ACEScg
  bitDepth: 16

[Final Composite] → [VideoOutput]
  codec: ProRes4444
  colorSpace: Rec709
  resolution: 4096×2160
```

---

### Summary

**What You Learned:**
- ✅ Multishot workflow management
- ✅ Expression linking and variables
- ✅ Deep compositing techniques
- ✅ 8K+ resolution handling
- ✅ Professional project organization
- ✅ Quality control processes
- ✅ Delivery specifications

**Course Complete!**

You've completed the entire RageVFX video tutorial series. You now have the knowledge to:
- Create stunning visual effects
- Work in professional pipelines
- Collaborate with teams
- Deliver production-quality results

---

## 📊 Quick Reference

### Color Space Pipeline

```
Plate (Rec.709) → Linear → [Processing] → Linear → Output (Rec.709/ACEScg)
```

### Frame Padding

| Digits | Format |
|--------|--------|
| 4 | 0001.exr |
| 5 | 00001.exr |

### Resolution Ladder

```
Proxy:    25% (1920×1080)
Half:     50% (3840×2160)
Full:    100% (7680×4320)
```

---

## 🎓 Certificate of Completion

Congratulations on completing the RageVFX Video Tutorial Series!

You've mastered:
- 20 comprehensive tutorials
- 500+ minutes of training
- Beginner to advanced techniques
- Professional workflows

**Keep creating amazing visual effects!**

---

*Thank you for learning with RageVFX!*
