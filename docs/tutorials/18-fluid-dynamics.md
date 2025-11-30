# Episode 18: Fluid Dynamics

**Duration**: 40 minutes  
**Level**: Advanced  
**Prerequisites**: Episodes 1-17 (especially Episode 13)

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 2:00)

> Fluid simulation brings some of the most visually stunning effects to life—from wispy smoke to roaring fire to splashing water. RageVFX includes a complete Eulerian fluid dynamics system.
>
> In this tutorial, we'll master fluid simulation from the ground up.

**Key Learning Objectives:**
- Understand Eulerian fluid dynamics
- Create smoke, fire, and liquid simulations
- Configure emitters and forces
- Cache simulations efficiently
- Render volumetric fluids

---

### Part 1: Fluid Dynamics Basics (2:00 - 8:00)

#### What is Eulerian Simulation?

Grid-based fluid simulation:
- Space divided into voxels
- Properties stored per voxel
- Solves Navier-Stokes equations
- Good for gases and liquids

#### FluidPhysicsNode

Complete fluid simulation system.

```
[FluidPhysics] → [FluidCache] → [VolumeRender] → [Output]
```

#### Fluid Types

| Type | Use Case |
|------|----------|
| smoke | Atmospheric effects |
| fire | Flames, combustion |
| liquid | Water, fluids |
| pyro | Explosions |

---

### Part 2: Grid Setup (8:00 - 14:00)

#### Grid Resolution

| Resolution | Voxels | Quality | Memory |
|------------|--------|---------|--------|
| 64³ | 262K | Preview | ~50MB |
| 128³ | 2M | Draft | ~400MB |
| 256³ | 16.7M | Production | ~3GB |
| 512³ | 134M | High-end | ~24GB |

```
resolution: 128
gridSize: [10, 10, 10]  # World units
```

#### Boundary Conditions

| Boundary | Effect |
|----------|--------|
| solid | Fluid stops |
| open | Fluid exits |
| periodic | Wraps around |

```
boundaryX: open
boundaryY: open
boundaryZ: open
```

---

### Part 3: Smoke Simulation (14:00 - 20:00)

#### Basic Smoke Setup

```
fluidType: smoke
density: 1.0
temperature: 0.0
buoyancy: 1.0
dissipation: 0.01
```

#### Smoke Parameters

| Parameter | Effect |
|-----------|--------|
| density | Opacity of smoke |
| buoyancy | Rise speed |
| dissipation | Fade over time |
| vorticity | Swirl detail |
| diffusion | Spread rate |

#### Turbulence

```
turbulence: 0.5
turbulenceOctaves: 4
turbulenceFrequency: 2.0
turbulenceAmplitude: 1.0
```

Higher values = more chaotic motion.

#### Example: Chimney Smoke

```
fluidType: smoke
resolution: 128
buoyancy: 0.8
dissipation: 0.02
vorticity: 0.3
turbulence: 0.4

Emitter:
  position: [0, 0, 0]
  size: [0.5, 0.2, 0.5]
  density: 0.8
  velocity: [0, 2, 0]
```

---

### Part 4: Fire Simulation (20:00 - 28:00)

#### Fire Setup

```
fluidType: fire
combustionEnabled: true
burnRate: 0.5
fuelAmount: 1.0
heatGeneration: 2.0
ignitionTemperature: 0.5
```

#### Combustion System

The fire simulation models:
1. **Fuel** - Material that burns
2. **Temperature** - Heat in system
3. **Burn Rate** - Consumption speed
4. **Heat Generation** - Fire produces heat
5. **Buoyancy** - Hot air rises

#### Fire Parameters

| Parameter | Purpose |
|-----------|---------|
| burnRate | How fast fuel burns |
| fuelAmount | Fuel density |
| heatGeneration | Heat from burning |
| ignitionTemperature | When fuel ignites |
| coolingRate | Heat dissipation |

#### Example: Campfire

```
fluidType: fire
resolution: 128
combustionEnabled: true

burnRate: 0.4
fuelAmount: 0.8
heatGeneration: 1.5
ignitionTemperature: 0.3
coolingRate: 0.1

Emitter:
  position: [0, 0, 0]
  size: [1, 0.2, 1]
  fuel: 1.0
  temperature: 1.0
  velocity: [0, 1, 0]
```

#### Fire Color

Temperature-based coloring:
- Low temp: Red/orange
- Medium temp: Yellow
- High temp: White/blue

---

### Part 5: Liquid Simulation (28:00 - 34:00)

#### Liquid Setup

```
fluidType: liquid
solverType: FLIP
viscosity: 0.01
surfaceTension: 0.1
```

#### Solver Types

| Solver | Description | Best For |
|--------|-------------|----------|
| Eulerian | Pure grid | Thick liquids |
| FLIP | Particles + grid | Splashing |
| Hybrid | Combined | General |

#### Liquid Parameters

| Parameter | Effect |
|-----------|--------|
| viscosity | Thickness |
| surfaceTension | Droplet formation |
| density | Weight |
| cohesion | Sticks together |

#### Example: Water Pour

```
fluidType: liquid
solverType: FLIP
resolution: 128
viscosity: 0.001
surfaceTension: 0.07

Emitter:
  type: stream
  position: [0, 5, 0]
  radius: 0.2
  velocity: [0, -3, 0]
```

---

### Part 6: Caching (34:00 - 38:00)

#### FluidCacheNode

Store simulation to disk.

```
[FluidPhysics] → [FluidCache] → [Playback]
```

#### Cache Formats

| Format | Compression | Quality |
|--------|-------------|---------|
| OpenVDB | Best | Industry standard |
| Field3D | Good | Compatible |
| Raw | None | Fastest |

#### Cache Parameters

```
cacheFormat: openvdb
compression: blosc
cachePath: /cache/fluid/
frameRange: [1, 100]
channels: [density, velocity, temperature, fuel]
```

#### Memory vs Disk Cache

```
memoryCacheFrames: 50    # Frames in RAM
diskCacheEnabled: true   # Write to disk
asyncWrite: true         # Background saving
```

---

### Part 7: Rendering Fluids (38:00 - 40:00)

#### VolumeRenderNode

Render volumetric data.

```
[FluidCache] → [VolumeRender] → [Output]
```

#### Render Modes

| Mode | Description |
|------|-------------|
| raycast | Ray marching |
| MIP | Maximum intensity |
| average | Average along ray |
| isosurface | Surface extraction |

#### Shading Parameters

```
renderMode: raycast
stepSize: 0.01
density: 1.0
shadowDensity: 0.5
colorRamp: fire_gradient
```

#### Compositing Fluids

```
[Background] → [Merge: screen] → [Output]
                    ↑
           [VolumeRender]
```

Use **screen** or **add** blend for fire/smoke.

---

### Summary

**What You Learned:**
- ✅ Eulerian fluid dynamics
- ✅ Smoke simulation
- ✅ Fire with combustion
- ✅ Liquid simulation
- ✅ Caching workflows
- ✅ Volume rendering

**Practice Project:**
Create a scene with:
1. Smoke rising from ground
2. Fire at base of smoke
3. Water puddle below
4. All cached to disk
5. Rendered and composited

**Next Tutorial:**
[Episode 19: Pipeline & Collaboration](19-pipeline-collaboration.md)

---

## 📊 Fluid Settings Reference

### Smoke Presets

| Effect | Buoyancy | Dissipation | Vorticity |
|--------|----------|-------------|-----------|
| Cigarette | 0.3 | 0.03 | 0.2 |
| Campfire | 0.8 | 0.02 | 0.4 |
| Explosion | 1.5 | 0.01 | 0.6 |
| Fog | 0.1 | 0.005 | 0.1 |

### Fire Presets

| Effect | Burn Rate | Heat Gen | Cooling |
|--------|-----------|----------|---------|
| Candle | 0.2 | 0.5 | 0.05 |
| Campfire | 0.4 | 1.5 | 0.1 |
| Torch | 0.6 | 2.0 | 0.15 |
| Explosion | 0.9 | 3.0 | 0.2 |

### Liquid Presets

| Fluid | Viscosity | Surface Tension |
|-------|-----------|-----------------|
| Water | 0.001 | 0.07 |
| Honey | 5.0 | 0.05 |
| Oil | 0.1 | 0.04 |
| Mercury | 0.001 | 0.5 |

---

*Continue to [Episode 19: Pipeline & Collaboration](19-pipeline-collaboration.md)!*
