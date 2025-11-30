# Episode 13: Physics Simulation

**Duration**: 40 minutes  
**Level**: Advanced  
**Prerequisites**: Episodes 1-12

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 2:00)

> Physics simulation brings realism to VFX that's impossible to achieve with keyframe animation alone. In RageVFX, the Physics Engine provides real-world physics for rigid bodies, cloth, and fluids.
>
> In this advanced tutorial, we'll explore the complete physics system and create realistic simulations.

**Key Learning Objectives:**
- Understand physics engine concepts
- Configure rigid body dynamics
- Simulate cloth and soft bodies
- Create fluid simulations
- Cache simulations for performance

---

### Part 1: Physics Engine Overview (2:00 - 8:00)

#### PhysicsEngineNode

The unified physics simulation system.

```
[Geometry] → [PhysicsEngine] → [Scene]
```

#### Key Concepts

| Concept | Description |
|---------|-------------|
| **Dynamic** | Objects affected by physics |
| **Static** | Immovable objects (floors, walls) |
| **Forces** | Gravity, wind, etc. |
| **Constraints** | Joints connecting objects |
| **Collision** | Object interaction |

#### 70+ Physics Controls

The PhysicsEngineNode includes extensive controls:

**Object Properties:**
- static/dynamic toggle
- mass, friction, restitution
- damping (linear/angular)

**Forces:**
- gravity (XYZ)
- wind direction and strength
- turbulence

**Collision:**
- collision shape (box, sphere, mesh)
- collision margin
- collision groups

**Constraints:**
- fixed, hinge, slider
- ball, distance, spring

---

### Part 2: Rigid Body Physics (8:00 - 16:00)

#### Setting Up Rigid Bodies

```
[Geometry3D] → [PhysicsEngine: dynamic] → [Scene]
[Geometry3D] → [PhysicsEngine: static] → [Scene]  ← Ground
```

#### Dynamic vs Static

| Property | Dynamic | Static |
|----------|---------|--------|
| Affected by gravity | Yes | No |
| Responds to forces | Yes | No |
| Moves on collision | Yes | No |
| Affects other objects | Yes | Yes |

#### Key Parameters

**Mass and Inertia:**
```
mass: 1.0-100.0        # Object weight
inertia: auto/custom   # Rotation resistance
```

**Surface Properties:**
```
friction: 0.0-1.0      # Sliding resistance
restitution: 0.0-1.0   # Bounciness
```

**Damping:**
```
linearDamping: 0.0-1.0   # Slows movement
angularDamping: 0.0-1.0  # Slows rotation
```

#### Collision Shapes

| Shape | Use Case |
|-------|----------|
| box | Crates, buildings |
| sphere | Balls, planets |
| capsule | Characters |
| cylinder | Cans, pillars |
| mesh | Complex objects |
| convex | Optimized complex |

#### Example: Falling Objects

```
[Box Geometry] → [PhysicsEngine: dynamic]
  mass: 1.0
  friction: 0.5
  restitution: 0.3

[Plane Geometry] → [PhysicsEngine: static]
  friction: 0.8
```

Objects fall under gravity and bounce realistically!

---

### Part 3: Forces (16:00 - 22:00)

#### Gravity

Default: Y = -9.81 (Earth gravity)

```
gravityX: 0
gravityY: -9.81
gravityZ: 0
gravityStrength: 1.0
```

**Variations:**
- Moon: gravityStrength = 0.166
- Space: gravityStrength = 0
- Upward: gravityY = 9.81

#### Wind Force

```
windEnabled: true
windDirection: [1, 0, 0]  # X direction
windStrength: 5.0
windTurbulence: 0.3
windFrequency: 1.0
```

#### Custom Forces

```
forceX/Y/Z: 0-100
torqueX/Y/Z: 0-100
impulseMode: continuous/once
```

---

### Part 4: Constraints (22:00 - 28:00)

#### Available Constraints

| Type | Description | Use |
|------|-------------|-----|
| fixed | Rigid connection | Attached objects |
| hinge | Rotates on axis | Doors, hinges |
| slider | Moves on axis | Drawers, pistons |
| ball | Spherical joint | Arms, chains |
| distance | Maintains distance | Ropes, springs |
| spring | Elastic connection | Bouncy links |

#### Hinge Example (Door)

```
[Door] → [PhysicsEngine]
  constraintType: hinge
  hingeAxis: [0, 1, 0]  # Y-axis rotation
  hingeLower: 0
  hingeUpper: 90
  
[Frame] → [PhysicsEngine: static]
```

#### Chain Example

```
[Link 1] ─ ball ─ [Link 2] ─ ball ─ [Link 3] ...
```

Each link connected to next with ball constraint.

---

### Part 5: Cloth Simulation (28:00 - 32:00)

#### ClothSimNode

Realistic fabric simulation.

```
[Plane Geometry] → [ClothSim] → [Mesh] → [Scene]
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| stiffness | Fabric rigidity |
| damping | Motion dampening |
| mass | Cloth weight |
| gravity | Gravity multiplier |
| wind | Wind influence |
| collision | Collision objects |

#### Pinning Modes

| Mode | Pins | Use |
|------|------|-----|
| topEdge | Top row | Curtains |
| corners | 4 corners | Tablecloth |
| custom | Selected vertices | Flags |
| none | Free falling | Dropped cloth |

#### Wind on Cloth

```
windEnabled: true
windStrength: 3.0
windTurbulence: 0.5
```

Creates realistic billowing fabric!

---

### Part 6: Fluid Simulation (32:00 - 38:00)

#### FluidPhysicsNode

Complete Eulerian fluid dynamics.

```
[FluidPhysics] → [FluidCache] → [VolumeRender] → [Output]
```

#### Fluid Types

| Type | Use |
|------|-----|
| smoke | Atmosphere, fog |
| fire | Flames, combustion |
| liquid | Water, liquids |
| pyro | Explosions |

#### Key Parameters

```
fluidType: smoke
resolution: 128        # Grid resolution
viscosity: 0.1         # Thickness
density: 1.0           # Heavy/light
temperature: 0.0       # Heat
buoyancy: 1.0         # Rise factor
turbulence: 0.5       # Chaos
```

#### Emitter Settings

```
emitterPosition: [0, 0, 0]
emitterSize: [1, 1, 1]
emitterVelocity: [0, 5, 0]
emitterDensity: 1.0
emitterTemperature: 1.0  # For fire
```

#### Fire Simulation

```
fluidType: fire
combustionEnabled: true
burnRate: 0.5
fuelAmount: 1.0
heatGeneration: 2.0
```

#### FluidCacheNode

Cache simulations to disk.

```
cacheFormat: openvdb/field3d/raw
compression: blosc/zip/lz4
cacheDir: /path/to/cache/
```

---

### Part 7: Performance Tips (38:00 - 40:00)

#### Optimization Strategies

1. **Use simple collision shapes**
   - Box/sphere faster than mesh
   
2. **Enable sleep detection**
   - Static objects don't compute
   
3. **Reduce solver iterations**
   - Lower = faster but less accurate
   
4. **Cache simulations**
   - Pre-compute, playback cached
   
5. **Lower fluid resolution for preview**
   - 64 for preview, 256 for final

#### Sleep System

```
sleepEnabled: true
sleepThreshold: 0.1
sleepLinearVelocity: 0.1
sleepAngularVelocity: 0.1
```

Objects that stop moving enter sleep mode—no computation!

---

### Summary

**What You Learned:**
- ✅ Physics engine setup
- ✅ Rigid body dynamics
- ✅ Forces (gravity, wind)
- ✅ Constraints (joints)
- ✅ Cloth simulation
- ✅ Fluid dynamics
- ✅ Performance optimization

**Practice Project:**
Create a scene with:
1. Falling rigid body boxes
2. Cloth curtain with wind
3. Smoke rising from floor
4. All interacting physically

**Next Tutorial:**
[Episode 14: Machine Learning Tools](14-machine-learning-tools.md)

---

## 📊 Physics Quick Reference

### Material Presets

| Material | Friction | Restitution |
|----------|----------|-------------|
| Steel | 0.6 | 0.5 |
| Wood | 0.4 | 0.3 |
| Rubber | 0.9 | 0.8 |
| Ice | 0.1 | 0.1 |
| Concrete | 0.7 | 0.2 |

### Gravity Presets

| Location | Gravity Y |
|----------|-----------|
| Earth | -9.81 |
| Moon | -1.62 |
| Mars | -3.72 |
| Jupiter | -24.79 |
| Zero-G | 0 |

---

*Continue to [Episode 14: Machine Learning Tools](14-machine-learning-tools.md)!*
