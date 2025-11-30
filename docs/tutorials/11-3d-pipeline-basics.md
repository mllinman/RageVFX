# Episode 11: 3D Pipeline Basics

**Duration**: 35 minutes  
**Level**: Intermediate  
**Prerequisites**: Episodes 1-10

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 1:30)

> Modern VFX requires seamless integration of 3D elements with live-action footage. RageVFX includes a complete 3D pipeline with scene management, materials, lighting, and rendering.
>
> In this tutorial, we'll build a 3D scene from scratch and learn the fundamentals of working in three dimensions.

**Key Learning Objectives:**
- Understand the 3D pipeline in RageVFX
- Create and manipulate 3D geometry
- Apply materials and textures
- Set up lighting and cameras
- Render 3D scenes

---

### Part 1: 3D Pipeline Overview (1:30 - 5:00)

#### The 3D Workflow

```
[Geometry] → [Mesh] → [Scene] → [Renderer3D] → [Output]
              ↑         ↑↑
         [Material]  [Light][Camera]
```

#### Key Components

| Component | Purpose |
|-----------|---------|
| **Geometry** | 3D shape data |
| **Mesh** | Geometry + material |
| **Material** | Surface appearance |
| **Light** | Scene illumination |
| **Camera** | View perspective |
| **Scene** | Organizes all elements |
| **Renderer** | Creates final image |

---

### Part 2: Creating Geometry (5:00 - 10:00)

#### Geometry3DNode

Create 3D primitives.

**Available Shapes:**

| Type | Description |
|------|-------------|
| box | Rectangular solid |
| sphere | Round ball |
| plane | Flat surface |
| cylinder | Round column |
| torus | Donut shape |

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| type | Shape type |
| width | X dimension |
| height | Y dimension |
| depth | Z dimension |
| segments | Tessellation detail |

#### Creating Multiple Objects

```
[Geometry3D: box] ────→ [Mesh A] → [Scene]
[Geometry3D: sphere] ─→ [Mesh B] ↗
```

Each object needs its own Geometry → Mesh chain.

---

### Part 3: Materials (10:00 - 16:00)

#### MaterialNode

Define surface properties.

**Material Types:**

| Type | Use Case |
|------|----------|
| **standard** | General purpose |
| **physical** | Realistic PBR |
| **basic** | Unlit color |
| **lambert** | Diffuse only |
| **phong** | Specular highlights |
| **toon** | Cartoon shading |

#### PBR Material Properties

| Property | Range | Effect |
|----------|-------|--------|
| color | RGB | Base color |
| metalness | 0-1 | Metal vs dielectric |
| roughness | 0-1 | Shiny vs matte |
| emissive | RGB | Self-illumination |
| opacity | 0-1 | Transparency |

#### Texture Maps

Connect image nodes for detailed surfaces:

| Map Type | Purpose |
|----------|---------|
| albedo | Color texture |
| normal | Surface detail |
| roughness | Variable roughness |
| metalness | Variable metalness |
| emissive | Glow areas |
| displacement | Actual geometry |
| ao | Ambient occlusion |

#### Example: Chrome Material

```
material: physical
metalness: 1.0
roughness: 0.1
color: #C0C0C0
```

#### Example: Rough Stone

```
material: standard
metalness: 0.0
roughness: 0.8
color: #808080
```

---

### Part 4: Lighting (16:00 - 22:00)

#### LightNode

Illuminate your scene.

**Light Types:**

| Type | Description | Shadows |
|------|-------------|---------|
| point | Omnidirectional | Optional |
| directional | Parallel rays (sun) | Yes |
| spot | Cone of light | Yes |
| ambient | Overall fill | No |

#### Light Parameters

| Parameter | Purpose |
|-----------|---------|
| type | Light type |
| color | Light color |
| intensity | Brightness |
| position | Location (point/spot) |
| direction | Aim (directional/spot) |
| castShadow | Enable shadows |
| shadowMapSize | Shadow quality |

#### Three-Point Lighting Setup

Classic film lighting:

1. **Key Light** (directional/spot)
   - Main illumination
   - Creates shadows
   - Position: 45° from camera

2. **Fill Light** (point/directional)
   - Soften shadows
   - Lower intensity
   - Position: Opposite key

3. **Rim Light** (spot/point)
   - Edge definition
   - Behind subject
   - Creates separation

---

### Part 5: Cameras (22:00 - 26:00)

#### CameraNode

Define scene view.

**Parameters:**

| Parameter | Purpose |
|-----------|---------|
| fov | Field of view |
| near | Near clip plane |
| far | Far clip plane |
| position | Camera location |
| lookAt | Target point |

#### Camera Positioning

```
position: [0, 2, 10]    # X, Y, Z
lookAt: [0, 0, 0]       # Looking at origin
fov: 50                 # Degrees
```

#### Depth of Field

For shallow focus effects:

| Parameter | Effect |
|-----------|--------|
| aperture | f-stop (lower = more blur) |
| focusDistance | In-focus distance |
| focalLength | Lens length |

---

### Part 6: Scene Assembly (26:00 - 30:00)

#### SceneNode

Combines all 3D elements.

```
[Mesh A] ─────→ [Scene] → [Renderer3D]
[Mesh B] ─────↗
[Light] ──────↗
[Camera] ─────↗
```

#### Scene Parameters

| Parameter | Purpose |
|-----------|---------|
| backgroundColor | Scene background |
| fogEnabled | Enable fog |
| fogColor | Fog tint |
| fogDensity | Fog thickness |
| ambientLight | Overall fill |
| ambientColor | Ambient tint |

---

### Part 7: Rendering (30:00 - 34:00)

#### Renderer3DNode

Create final image from 3D scene.

**Parameters:**

| Parameter | Options |
|-----------|---------|
| width/height | Resolution |
| samples | Anti-aliasing |
| toneMapping | ACES/Reinhard/Filmic |
| shadowType | Basic/PCF/PCFSoft/VSM |
| outputAlpha | Include alpha |

#### Render Passes

| Output | Content |
|--------|---------|
| image | Final render |
| depth | Distance from camera |
| normal | Surface direction |
| alpha | Transparency |

#### Shadow Types

| Type | Quality | Speed |
|------|---------|-------|
| Basic | Low | Fast |
| PCF | Medium | Medium |
| PCFSoft | High | Slower |
| VSM | Highest | Slowest |

---

### Part 8: Complete Example (34:00 - 35:00)

#### Simple 3D Scene

```
[Geometry3D: sphere] → [Mesh] ─────────────────────┐
                                                   ↓
[Material: chrome] ─────────────────────────────→ [Scene] → [Renderer3D] → [Output]
                                                   ↑↑↑
[LightNode: key] ──────────────────────────────────┘││
[LightNode: fill] ──────────────────────────────────┘│
[CameraNode] ───────────────────────────────────────┘
```

---

### Summary

**What You Learned:**
- ✅ 3D pipeline components
- ✅ Creating geometry
- ✅ Applying materials
- ✅ Setting up lighting
- ✅ Configuring cameras
- ✅ Assembling scenes
- ✅ Rendering outputs

**Practice Exercise:**
1. Create scene with 3 objects
2. Different material on each
3. Three-point lighting
4. Camera animation
5. Render with shadows

**Next Tutorial:**
[Episode 12: Animation & Timeline](12-animation-timeline.md)

---

## 📊 Material Quick Reference

| Surface | Metalness | Roughness | Example |
|---------|-----------|-----------|---------|
| Chrome | 1.0 | 0.1 | Car bumper |
| Brushed metal | 1.0 | 0.4 | Steel |
| Plastic | 0.0 | 0.3 | Phone case |
| Rubber | 0.0 | 0.9 | Tire |
| Glass | 0.0 | 0.0 | Window |
| Wood | 0.0 | 0.6 | Table |
| Fabric | 0.0 | 0.8 | Cloth |

---

*Continue to [Episode 12: Animation & Timeline](12-animation-timeline.md)!*
