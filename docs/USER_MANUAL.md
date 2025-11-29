# RageVFX User Manual

**Version 3.5 - Comprehensive Guide**

Welcome to the official RageVFX User Manual. This comprehensive guide covers everything you need to know to master RageVFX, from basic concepts to advanced professional techniques.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Requirements & Installation](#2-system-requirements--installation)
3. [Interface Overview](#3-interface-overview)
4. [Getting Started](#4-getting-started)
5. [Working with Nodes](#5-working-with-nodes)
6. [Complete Node Reference](#6-complete-node-reference)
7. [Professional Workflows](#7-professional-workflows)
8. [3D Pipeline](#8-3d-pipeline)
9. [Physics Simulation](#9-physics-simulation)
10. [Machine Learning Tools](#10-machine-learning-tools)
11. [Animation & Timeline](#11-animation--timeline)
12. [Motion Graphics](#12-motion-graphics)
13. [Color Management](#13-color-management)
14. [Pipeline Integration](#14-pipeline-integration)
15. [Settings & Customization](#15-settings--customization)
16. [Keyboard Shortcuts](#16-keyboard-shortcuts)
17. [Performance Optimization](#17-performance-optimization)
18. [Troubleshooting](#18-troubleshooting)
19. [Advanced Topics](#19-advanced-topics)
20. [Appendices](#appendices)

---

## 1. Introduction

### What is RageVFX?

RageVFX is a next-generation visual effects software designed to rival industry leaders like **Nuke**, **Houdini**, **Maya**, and **Redshift/V-Ray**. It combines the power of:

- **Node-based compositing** (Nuke-style)
- **Procedural generation** (Houdini-style)
- **GPU-accelerated rendering** (Redshift/V-Ray-style)
- **3D pipeline integration** (Maya-style)
- **Machine Learning-powered tools**
- **Real-time preview and interaction**

### Key Features

| Category | Features |
|----------|----------|
| **Compositing** | Deep compositing, Cryptomatte, multishot workflows, IBK keying |
| **3D Pipeline** | Full 3D rendering, PBR materials, environment mapping, shadow maps |
| **Physics** | Rigid body, soft body, fluid simulation, cloth, collision detection |
| **VFX Effects** | 40+ procedural effects (fire, water, lightning, portals, etc.) |
| **ML Tools** | Style transfer, upscaling, denoising, object detection, segmentation |
| **Animation** | Keyframe animation, curve editor, motion graphics, transitions |
| **Color** | OCIO support, LUTs, CDL, professional color grading |
| **Pipeline** | USD, Alembic, version control, review tools |

### Version History

- **v3.5**: Motion Graphics, Array Modifiers, Transitions, Curve Editor
- **v3.4**: Glitch Effects, Energy Fields, Magic Particles, Backdrops
- **v3.3**: 8K+ Resolution, Stereoscopic 3D, Transform3D with WASD controls
- **v3.2**: Projection Painting, Fluid Physics, 3D Camera Tracking
- **v3.1**: Physics Engine, Pipeline Tools, Extended ML
- **v3.0**: Path Tracer, Crowd Sim, Procedural Terrain

---

## 2. System Requirements & Installation

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 10, macOS 10.14, Ubuntu 20.04 |
| **CPU** | Dual-core 2.0 GHz |
| **RAM** | 8 GB |
| **GPU** | WebGL2-compatible graphics card |
| **Storage** | 500 MB |
| **Node.js** | Version 20.0.0 or higher |

### Recommended Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 11, macOS 12+, Ubuntu 22.04 |
| **CPU** | Quad-core 3.0 GHz |
| **RAM** | 16 GB or more |
| **GPU** | Dedicated GPU with 4GB+ VRAM |
| **Storage** | 1 GB SSD |

### Optimal Requirements (8K+ / Complex Simulations)

| Component | Requirement |
|-----------|-------------|
| **CPU** | 8+ cores, 4.0 GHz+ |
| **RAM** | 32 GB or more |
| **GPU** | RTX 3080+, RX 6800+ with 8GB+ VRAM |
| **Storage** | NVMe SSD with 100GB+ free |

### Installation

#### Development Installation
```bash
git clone https://github.com/mllinman/RageVFX.git
cd RageVFX
npm install
npm run build
npm start
```

#### Web Version
```bash
npm run dev:web    # Development at localhost:3000
npm run build:web  # Production build
npm run preview:web
```

#### Platform Builds
```bash
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux (AppImage, deb, rpm)
npm run dist:all    # All platforms
```

---

## 3. Interface Overview

### Main Window Layout

```
+------------------------------------------------------------------------+
|                        Menu Bar & Toolbar                               |
+------------+-------------------------------------------+----------------+
|            |                                           |                |
|    Node    |           Node Graph Editor               |   Properties   |
|   Library  |                                           |     Panel      |
|            |                                           |                |
|            |                                           +----------------+
|            |                                           |                |
|            |                                           |    Viewport    |
|            |                                           |                |
+------------+-------------------------------------------+----------------+
|                        Timeline (Animation)                             |
+------------------------------------------------------------------------+
```

### 3.1 Menu Bar

| Menu | Functions |
|------|-----------|
| **File** | New, Open, Save, Export, Import |
| **Edit** | Undo, Redo, Cut, Copy, Paste, Delete |
| **View** | Zoom, Pan, Frame All, Show/Hide Panels |
| **Node** | Create Node, Group, Disable/Enable |
| **Execute** | Execute Graph, Stop Execution |
| **Settings** | Open Settings (13 categories) |
| **Help** | Documentation, About |

### 3.2 Node Library (Left Panel)

Contains all 140+ nodes organized by category:

**Categories:**
- Input/Output - Image loading/saving
- Generator - Noise, Gradient
- Filter - Blur, Sharpen, Glow
- Color - Color Correct, Grade, LUT
- Composite - Merge, Deep Composite
- Transform - 2D transforms, Corner Pin
- Keying - Chroma Key, IBK Keyer
- VFX Effects - Fire, Water, Portals
- 3D - Scene, Mesh, Camera, Light
- Physics - Rigid Body, Fluid, Cloth
- ML - Style Transfer, Upscale
- Tracker - Point/Planar Tracking
- Animation - Timeline, Curve Editor
- Motion Graphics - Shape layers, Arrays
- Pipeline - USD, Alembic, Version Control

**Adding Nodes:**
- Drag from library to graph
- Double-click to add at cursor
- Use search to filter nodes

### 3.3 Node Graph Editor (Center)

**Navigation:**
- **Pan**: Drag on empty space / Middle Mouse Button
- **Zoom**: Scroll wheel / +/- buttons
- **Frame All**: Home key
- **Frame Selected**: F key

**Node Operations:**
- **Select**: Click
- **Multi-select**: Shift+Click or drag rectangle
- **Move**: Drag selected nodes
- **Delete**: Delete/Backspace key
- **Duplicate**: Ctrl/Cmd+D
- **Disable**: D key

**Connections:**
- Click output socket -> drag to input socket
- Delete connection: Click line -> Delete key

### 3.4 Properties Panel (Right Top)

Shows parameters for selected node:
- Node name (editable)
- All adjustable parameters
- Input/output socket info

**Parameter Types:**
- Sliders for continuous values
- Number fields for exact values
- Color pickers
- Dropdowns for options
- Checkboxes for toggles

### 3.5 Viewport Panel (Right Bottom)

**2D Controls:**
- Pan: Click and drag
- Zoom: Scroll wheel
- Reset: Double-click

**3D Controls:**
- Orbit: Left Mouse + Drag
- Pan: Middle Mouse + Drag
- Dolly: Scroll wheel

**3D WASD Controls:**
- W/A/S/D: Move forward/left/back/right
- Q/E: Move up/down
- Shift: Fast movement (3x)
- Alt: Precision movement (0.1x)
- G: Translate mode
- R: Rotate mode
- T: Scale mode
- F: Set keyframe

**Viewport Settings:**
- Shading: Solid, Wireframe, Material, Rendered
- Background: Gradient, Solid, HDRI, Transparent
- Options: Ground plane, AO, Bounding boxes

### 3.6 Timeline Panel (Bottom)

**Components:**
- Track area with animation tracks
- Keyframe markers (diamonds)
- Timeline markers
- Playhead indicator

**Controls:**
- Play/Pause: Spacebar
- Scrub: Click/drag on timeline
- Zoom: Scroll on timeline

### 3.7 Backdrop System

Organize nodes with visual groups:

1. Select multiple nodes
2. Right-click -> Create Backdrop
3. Enter label and color
4. Resize/move as needed
5. Lock to prevent changes

---

## 4. Getting Started

### 4.1 Your First Project

**Step 1: Create New Project**
- File -> New Project (Ctrl/Cmd+N)

**Step 2: Add Input Node**
- Drag "Image Input" from Node Library
- Load an image in Properties panel

**Step 3: Add Effect Node**
- Drag "Blur" node to the right
- Adjust Blur Amount slider

**Step 4: Add Output Node**
- Drag "Output" node to the right

**Step 5: Connect Nodes**
```
[Image Input] -> [Blur] -> [Output]
```

**Step 6: Execute**
- Click Execute button (Play icon)
- View result in Viewport

**Step 7: Save**
- File -> Save (Ctrl/Cmd+S)

### 4.2 Understanding Data Flow

RageVFX uses a directed acyclic graph (DAG):

```
Input Nodes -> Processing Nodes -> Output Nodes
```

**Key Concepts:**
- Data flows left to right
- Multiple branches supported
- Circular connections prevented
- Nodes cache their output

### 4.3 Node Color Coding

| Color | Category |
|-------|----------|
| Red | VFX Fire/Explosion |
| Blue | VFX Water/Ice |
| Purple | VFX Magic/Energy |
| Cyan | VFX Tech/Cyber |
| Green | Color nodes |
| Orange | 3D nodes |
| Pink | Physics nodes |
| Cyan | ML nodes |
| Yellow | Tracker nodes |

---

## 5. Working with Nodes

### 5.1 Node Anatomy

```
     +---------------------+
     |    NODE TITLE       |  <- Type name
     +---------------------+
  O--|  Input 1            |  <- Input sockets (left)
  O--|  Input 2            |
     |                     |
     |  [Parameters...]    |  <- Internal settings
     |                     |
     |         Output 1  |--O  <- Output sockets (right)
     |         Output 2  |--O
     +---------------------+
```

### 5.2 Data Types

| Type | Description | Examples |
|------|-------------|----------|
| IMAGE | Raster image | Most common |
| GEOMETRY_3D | 3D mesh data | Scene, Mesh |
| PARTICLES | Particle system | Particle nodes |
| NUMBER | Scalar value | Math operations |
| COLOR | RGBA color | Color parameters |
| MATRIX | Transform matrix | 3D transforms |
| MASK | Alpha/matte | Keying output |
| ANIMATION | Keyframe data | Timeline |

### 5.3 Creating Connections

1. Click output socket (right side)
2. Drag connection line
3. Release on compatible input socket

**Rules:**
- Only compatible types connect
- One input = one connection
- One output = multiple connections
- No cycles allowed

### 5.4 Caching System

- Nodes cache their output
- Unchanged nodes use cache
- Parameter changes mark node "dirty"
- Dirty nodes reprocess on execute

---

## 6. Complete Node Reference

### 6.1 Input/Output Nodes

#### ImageInputNode
Load images from files.

| Parameter | Default | Description |
|-----------|---------|-------------|
| width | 1920 | Image width |
| height | 1080 | Image height |
| format | rgba8 | rgba8/rgba16/rgba32f/exr |
| colorSpace | sRGB | sRGB/Linear/ACEScg |

#### OutputNode
Export final render.

| Parameter | Default | Description |
|-----------|---------|-------------|
| format | png | png/jpeg/exr/tiff |
| quality | 100 | Output quality 0-100 |
| bitDepth | 8 | 8/16/32 bit |

#### ImageSequenceOutputNode
Export image sequences.

#### VideoSequenceOutputNode
Export video (H.264, ProRes, DNxHD).

### 6.2 Generator Nodes

#### NoiseNode
Procedural noise patterns.

| Parameter | Default | Description |
|-----------|---------|-------------|
| type | perlin | perlin/simplex/worley/fbm |
| scale | 50 | Noise scale |
| octaves | 4 | Detail levels |
| seed | 0 | Random seed |

#### GradientNode
Linear or radial gradients.

### 6.3 Filter Nodes

#### BlurNode
Gaussian/box blur.

| Parameter | Default | Description |
|-----------|---------|-------------|
| blurAmount | 5 | Blur radius |
| quality | preview | draft/preview/production |

#### SharpenNode
Enhance image sharpness.

#### EdgeDetectNode
Sobel edge detection.

#### GlowNode
Add glow to bright areas.

#### MotionBlurNode
Directional motion blur.

#### ChromaticAberrationNode
Lens chromatic aberration.

#### FilmGrainNode
Film-like grain texture.

#### VignetteNode
Corner darkening effect.

#### DepthOfFieldNode
Camera depth of field.

### 6.4 Color Nodes

#### ColorCorrectNode
Basic brightness/contrast/saturation/hue.

#### GradeNode
Professional lift/gamma/gain.

#### CurvesNode
Curve-based color adjustment.

#### LevelsNode
Input/output levels.

#### HSLNode
Hue/Saturation/Lightness.

#### LUTLoaderNode
Apply 3D LUTs (11 presets).

#### CDLNode
ASC Color Decision List.

#### ColorMatchNode
Match colors from reference.

### 6.5 Composite Nodes

#### MergeNode
Combine images (over/add/multiply/screen).

#### ScreenNode, OverlayNode
Blend mode compositing.

#### DissolveNode
Cross-dissolve between images.

#### DeepCompositeNode
Depth-aware compositing.

#### CryptomatteNode
ID matte extraction.

#### AOVManagerNode
Combine render passes.

### 6.6 Transform Nodes

#### TransformNode
2D translation/rotation/scale.

#### CornerPinNode
4-point perspective transform.

#### LensDistortionCorrectionNode
Correct lens distortion.

### 6.7 Keying Nodes

#### ChromaKeyNode
Green/blue screen removal.

#### LuminanceKeyNode
Brightness-based keying.

#### DifferenceNode
Difference matte.

#### IBKKeyerNode
Professional IBK-style keying.

| Parameter | Description |
|-----------|-------------|
| screenColor | Auto-detect screen |
| algorithm | simple/adaptive/ibk_color/ibk_gizmo |
| spillMethod | average/max/min/replacement |

#### SpillSuppressionNode
Remove color spill.

#### EdgeMatteNode
Refine matte edges.

#### RotoscopeNode
Manual masking.

### 6.8 VFX Effect Nodes (40+ Effects)

#### Fire/Explosion
- **FireNode**: Procedural flames
- **ExplosionNode**: Explosion effect
- **SparkNode**: Spark particles

#### Water/Weather
- **WaterNode**: Water surface
- **RainNode**: Rain particles
- **SnowNode**: Snow particles

#### Atmospheric
- **SmokeNode**: Volumetric smoke
- **CloudsNode**: Procedural clouds
- **FogNode**: Atmospheric fog

#### Energy/Electric
- **LightningNode**: Electric bolts
- **PlasmaNode**: Energy plasma
- **EnergyFieldNode**: Force fields

#### Sci-Fi/Magic
- **PortalNode**: Dimensional portals
- **HologramNode**: Holographic displays
- **MagicParticlesNode**: Sparkles/fairy dust

#### Space
- **NebulaNode**: Space nebulae
- **AuroraNode**: Northern lights

#### Distortion
- **ShockwaveNode**: Expanding distortion
- **HeatDistortionNode**: Heat shimmer
- **GlitchNode**: Digital glitch

#### Other Effects
- **LensFlareNode**: Lens flares
- **AnamorphicFlareNode**: Anamorphic streaks
- **CausticsNode**: Water caustics
- **DebrisNode**: Debris particles
- **TornadoNode**: Tornado/vortex
- **TimeWarpNode**: Temporal effects
- **TextOverlayNode**: Text rendering


### 6.9 3D Nodes

#### SceneNode
Manage 3D scene graph.

| Parameter | Description |
|-----------|-------------|
| backgroundColor | Scene background |
| fogEnabled | Enable fog |
| fogColor | Fog color |
| ambientLight | Ambient intensity |

#### Renderer3DNode
Render 3D scenes.

| Parameter | Description |
|-----------|-------------|
| width/height | Render resolution |
| samples | Anti-aliasing samples |
| toneMapping | ACES/Reinhard/Filmic |
| shadowType | Basic/PCF/PCFSoft/VSM |

#### Geometry3DNode
Create 3D primitives.

| Parameter | Description |
|-----------|-------------|
| type | box/sphere/plane/cylinder/torus |
| width/height/depth | Dimensions |
| segments | Tessellation |

#### MeshNode
Create meshes with materials.

| Parameter | Description |
|-----------|-------------|
| color | Base color |
| metalness | 0-1 |
| roughness | 0-1 |
| wireframe | Show wireframe |

#### CameraNode
3D perspective camera.

| Parameter | Description |
|-----------|-------------|
| fov | Field of view |
| near/far | Clipping planes |
| position | Camera position |
| lookAt | Target point |

#### LightNode
Scene lighting.

| Parameter | Description |
|-----------|-------------|
| type | point/directional/spot/ambient |
| color | Light color |
| intensity | Light strength |
| castShadow | Enable shadows |

#### MaterialNode
Advanced PBR materials.

#### EnvironmentMapNode
HDR environment lighting.

#### ShadowMapNode
Dynamic shadow mapping.

### 6.10 Physics Nodes

#### PhysicsEngineNode
Unified physics simulation.

| Parameter | Description |
|-----------|-------------|
| enabled | Enable physics |
| static | Static vs dynamic |
| mass | Object mass |
| gravityX/Y/Z | Gravity vector |
| windStrength | Wind force |
| windDirection | Wind direction |
| drag | Air resistance |
| restitution | Bounciness |
| friction | Surface friction |

**70+ parameters including:**
- Collision shapes
- Constraints (fixed, hinge, slider, ball, spring)
- Sleep detection
- Boundary types
- Volumetric/buoyancy
- Parenting system

#### PhysicsWorldNode
Global physics settings.

#### RigidBodyNode
Rigid body dynamics.

#### SoftBodyNode
Deformable physics.

#### FluidSimNode
SPH fluid dynamics.

#### ClothSimNode
Cloth simulation.

#### CollisionNode
Collision detection.

#### FluidPhysicsNode
Eulerian fluid dynamics.

| Parameter | Description |
|-----------|-------------|
| fluidType | smoke/fire/liquid/pyro |
| resolution | Grid resolution |
| viscosity | Fluid viscosity |
| turbulence | Turbulence amount |
| combustion | Fire simulation |

#### FluidCacheNode
Cache fluid simulations.

### 6.11 Machine Learning Nodes

#### StyleTransferNode
Neural style transfer.

| Parameter | Description |
|-----------|-------------|
| styleStrength | Effect intensity |
| preserveColor | Keep original colors |
| mode | histogram/luminance |

#### UpscaleNode
AI-powered upscaling.

| Parameter | Description |
|-----------|-------------|
| scale | 2x/4x/8x |
| denoise | Denoising amount |
| sharpen | Sharpening |

#### DenoiseNode
AI denoising.

#### ObjectDetectionNode
Detect and segment objects.

#### InpaintNode
Content-aware fill.

#### DepthEstimationNode
Estimate depth from single image.

#### NeuralNetTrainerNode
Train custom neural networks (CopyCat-like).

| Parameter | Description |
|-----------|-------------|
| architecture | UNet/ResNet/Autoencoder/GAN |
| epochs | Training iterations |
| learningRate | Training rate |
| augmentation | Data augmentation |

#### SegmentAnythingNode
AI instant segmentation.

#### BackgroundRemovalNode
One-click background removal.

#### FaceEnhancementNode
AI face restoration.

#### MotionPredictionNode
AI frame interpolation.

### 6.12 Tracker Nodes

#### PointTrackerNode
Track individual points.

| Parameter | Description |
|-----------|-------------|
| searchArea | Search region size |
| trackSize | Track pattern size |
| offset | Track offset |

#### PlanarTrackerNode
Track planar surfaces.

#### OpticalFlowNode
Compute motion vectors.

#### StabilizerNode
Stabilize footage.

| Parameter | Description |
|-----------|-------------|
| smoothing | Stabilization amount |
| zoomToFit | Fill frame |
| method | transform/warp |

#### MotionVectorsNode
Visualize motion.

#### TrackingDataNode
Store tracking data.

#### Camera3DTrackingNode
3D camera tracking from footage.

| Parameter | Description |
|-----------|-------------|
| detector | SIFT/ORB/AKAZE/Harris |
| distortionModel | Brown-Conrady/Fisheye |
| exportFormat | FBX/Alembic/Maya/Nuke |

#### CornerDetectorNode
Detect image corners.

### 6.13 Camera Nodes

#### CameraPresetNode
Cinema camera presets.

**Supported Cameras:**
- RED V-RAPTOR XL 8K, KOMODO 6K
- ARRI ALEXA 35, LF, Mini LF
- Blackmagic URSA Mini Pro 12K
- Sony VENICE 2 8K, FX6
- Canon EOS C70, C500 Mark II

#### CameraLensNode
Professional lens simulation.

**Lens Presets:**
- ARRI Signature Prime
- Zeiss Master Prime
- Cooke Anamorphic
- Panavision Primo
- Atlas Orion

| Parameter | Description |
|-----------|-------------|
| focalLength | Lens focal length |
| aperture | f-stop |
| distortion | Lens distortion |
| anamorphic | Squeeze ratio |

#### RealWorldCameraNode
Create camera from real specs.

### 6.14 Animation Nodes

#### AnimationTimelineNode
Keyframe animation system.

| Parameter | Description |
|-----------|-------------|
| startFrame | Animation start |
| endFrame | Animation end |
| fps | Frames per second |
| loopMode | once/loop/pingpong |

#### CurveEditorNode
Maya-style curve editor.

| Parameter | Description |
|-----------|-------------|
| tangentType | auto/smooth/linear/stepped/flat |
| infinityPre | constant/linear/cycle/oscillate |
| infinityPost | constant/linear/cycle/oscillate |
| weighted | Enable weighted tangents |

**Features:**
- Full bezier curve control
- Tangent handles
- Pre/post infinity behavior
- Curve baking
- Multi-curve support

#### TransitionNode
Timeline transitions.

**17 Easing Types:**
smooth, linear, stepped, custom, easeIn, easeOut, easeInOut, bounce, elastic, back, expo, circ, sine, quad, cubic, quart, quint

**14 Visual Effects:**
cut, dissolve, fade, wipe, slide, zoom, iris, push, reveal, morph, blur, pixelate, swirl, glitch

### 6.15 Motion Graphics Nodes

#### MotionGraphicsNode
Complete motion graphics system.

| Parameter | Description |
|-----------|-------------|
| shapeType | rectangle/ellipse/polygon/star/path/text |
| fillColor | Shape fill |
| strokeColor | Outline color |
| strokeWidth | Outline width |
| cornerRadius | Rounded corners |
| animationPreset | fadeIn/fadeOut/scaleUp/bounce/elastic/spin |

**Features:**
- Shape layers
- Position/rotation/scale animation
- Motion path following
- Orient-to-path
- Blend modes

#### ArrayModifierNode
Advanced array tool (Cinema 4D style).

| Parameter | Description |
|-----------|-------------|
| mode | linear/radial/grid/spiral/random |
| count | Number of copies |
| offsetX/Y/Z | Position offset |
| rotationOffset | Rotation per copy |
| scaleOffset | Scale per copy |
| colorMode | gradient/random/hueShift |

**Array Modes:**
- **Linear**: Position/rotation/scale offset
- **Radial**: Circle arrangement with radius
- **Grid**: X/Y grid with spacing
- **Spiral**: Expanding spiral
- **Random**: Seeded random placement

### 6.16 Resolution & Stereo Nodes

#### Resolution8KNode
Ultra-high resolution support.

**35+ Presets:**
- HD, 2K, 4K, 6K, 8K, 10K, 12K, 16K
- Cinema: Flat, Scope, DCI, Full
- IMAX Digital, IMAX Laser
- VR: 4K, 8K, 360 Stereo
- Social: Instagram, TikTok, YouTube

| Parameter | Description |
|-----------|-------------|
| preset | Resolution preset |
| tileRendering | Enable tiled render |
| tileSize | Tile dimensions |
| scaling | nearest/bilinear/bicubic/lanczos |

#### StereoCamera3DNode
Stereoscopic 3D camera.

**8 Stereo Presets:**
- Human Vision (65mm)
- Cinema Standard (63.5mm)
- IMAX 3D (75mm)
- VR Headset (64mm)
- Macro Stereo (20mm)
- Architectural (100mm)
- Aerial/Landscape (300mm)
- Miniature (10mm)

| Parameter | Description |
|-----------|-------------|
| stereoMode | toe-in/parallel/off-axis |
| interaxial | Eye separation |
| convergence | Convergence distance |
| outputFormat | separate/side-by-side/top-bottom/anaglyph |

#### StereoCompositorNode
Stereoscopic compositing.

**7 Anaglyph Modes:**
red-cyan, green-magenta, amber-blue, true-anaglyph, gray-anaglyph, optimized, Dubois

#### Transform3DNode
3D object transformation.

| Parameter | Description |
|-----------|-------------|
| mode | translate/rotate/scale |
| space | world/local/view/screen |
| snapTranslation | Position snap |
| snapRotation | Angle snap |
| pivot | center/origin/boundingBox/cursor |

### 6.17 Pipeline Nodes

#### USDNode
Universal Scene Description.

| Parameter | Description |
|-----------|-------------|
| filepath | USD file path |
| format | usda/usdc/usdz |
| operation | import/export |
| variantSets | USD variants |

#### AlembicNode
Alembic geometry caching.

| Parameter | Description |
|-----------|-------------|
| filepath | Alembic file |
| format | Ogawa/HDF5 |
| streaming | Enable streaming |

#### PipelineManagerNode
Shot/asset management.

**Features:**
- Shot versioning
- Asset tracking
- Task management
- Path templates
- ShotGrid/ftrack/Kitsu ready

#### ReviewToolNode
Built-in review system.

**Features:**
- Frame-accurate annotations
- Drawing tools
- Version comparison (A/B, wipe, onion skin)
- Comment threading
- Approval workflow
- Export: JSON, PDF, HTML, video burn-in

#### VersionControlNode
Git-based versioning.

**Features:**
- Full git integration
- Branch management
- LFS support
- Remote sync

### 6.18 Model Import/Export

#### ModelImportNode
Import 3D models.

**Formats:** OBJ, FBX, glTF/GLB, USD, Alembic, DAE, 3DS, STL, PLY

| Parameter | Description |
|-----------|-------------|
| importMaterials | Include materials |
| importAnimations | Include animation |
| scale | Import scale |
| upAxis | Y-up or Z-up |

#### ModelExportNode
Export 3D models.

**Features:**
- DRACO/Meshopt compression
- Material embedding
- Animation baking
- LOD export

### 6.19 Utility Nodes

#### DotNode
Reroute connections.

#### SwitchNode
Switch between inputs.

#### MathNode
Mathematical operations.

#### TimeNode
Current time/frame output.

#### TimeOffsetNode
Offset time by frames.

#### FrameHoldNode
Hold frame at specified time.

---

## 7. Professional Workflows

### 7.1 Basic Compositing

**Simple Overlay:**
```
[Background] --\
                --> [Merge: Over] --> [Output]
[Foreground] --/
```

**Color Correction Pipeline:**
```
[Input] --> [ColorCorrect] --> [Grade] --> [LUTLoader] --> [Output]
```

**Keying Pipeline:**
```
[Input] --> [IBKKeyer] --> [SpillSuppression] --> [EdgeMatte] --> [Merge] --> [Output]
                                                        |              |
                                                 [Background]---------/
```

### 7.2 Multishot Workflow

Using MultiShotNode for batch processing:

1. Create shot variants in MultiShotNode
2. Define graph scope variables
3. Link expressions across shots
4. Batch process all shots

### 7.3 Deep Compositing

```
[3D Render A] --> [DeepComposite] --> [Output]
[3D Render B] --/
[3D Render A Depth] --/
[3D Render B Depth] --/
```

### 7.4 VFX Integration

**Fire Composite:**
```
[Background] --\
                --> [Screen] --> [ColorCorrect] --> [Output]
[FireNode] -----/
```

**Portal Effect:**
```
[Plate] --> [CornerPin] --> [Merge] --> [Glow] --> [Output]
[PortalNode] ----------------/
```

---

## 8. 3D Pipeline

### 8.1 Scene Setup

**Basic 3D Scene:**
```
[Geometry3D] --> [Mesh] --> [Scene] --> [Renderer3D] --> [Output]
[Camera] ------------------/
[Light] -------------------/
```

### 8.2 PBR Materials

Create physically-based materials:

1. Add MaterialNode
2. Set base color, metalness, roughness
3. Connect texture maps if needed
4. Link to MeshNode

### 8.3 Lighting Setup

**Three-Point Lighting:**
- Key light: Main illumination
- Fill light: Shadow softening
- Rim light: Edge definition

### 8.4 Environment Mapping

Use EnvironmentMapNode for:
- Image-based lighting (IBL)
- Reflections
- Sky backgrounds

### 8.5 Camera Tracking

**Workflow:**
1. Add Camera3DTrackingNode
2. Connect footage
3. Detect features
4. Solve camera
5. Export to scene

### 8.6 Real-World Cameras

Create accurate camera setups:

1. Add RealWorldCameraNode
2. Select camera body (ARRI, RED, Sony, etc.)
3. Choose lens preset
4. Adjust aperture, focus, exposure

---

## 9. Physics Simulation

### 9.1 Physics Engine Setup

**Basic Physics:**
```
[Geometry3D] --> [PhysicsEngineNode] --> [Scene] --> [Renderer3D]
```

### 9.2 Static vs Dynamic

- **Static**: Objects that don't move (floors, walls)
- **Dynamic**: Objects affected by physics (falling, bouncing)

Toggle with the `static` parameter.

### 9.3 Forces

Configure real-world forces:

| Force | Parameters |
|-------|------------|
| Gravity | X, Y, Z direction, strength |
| Wind | Direction, strength, turbulence |
| Drag | Linear, angular damping |
| Buoyancy | Fluid density |

### 9.4 Constraints

Available constraint types:
- **Fixed**: Lock objects together
- **Hinge**: Rotate around axis
- **Slider**: Move along axis
- **Ball**: Spherical joint
- **Distance**: Maintain distance
- **Spring**: Elastic connection

### 9.5 Fluid Simulation

**Smoke/Fire:**
```
[FluidPhysicsNode: smoke/fire] --> [FluidCacheNode] --> [VolumeRender] --> [Output]
```

**Liquid:**
```
[FluidPhysicsNode: liquid] --> [FluidCacheNode] --> [MeshNode] --> [Renderer3D]
```

### 9.6 Cloth Simulation

```
[Geometry3D: plane] --> [ClothSimNode] --> [MeshNode] --> [Scene]
```

Configure:
- Pinning (top edge, corners, custom)
- Wind force
- Self-collision
- Stiffness

---

## 10. Machine Learning Tools

### 10.1 Style Transfer

Apply artistic styles to images:

```
[Content Image] --> [StyleTransferNode] --> [Output]
[Style Image] -----/
```

### 10.2 AI Upscaling

Upscale images with AI:

```
[Low-res Input] --> [UpscaleNode: 4x] --> [SharpenNode] --> [Output]
```

### 10.3 Object Segmentation

**Segment Anything:**
```
[Input] --> [SegmentAnythingNode] --> [CryptomatteNode] --> [Matte Output]
```

### 10.4 Background Removal

```
[Input] --> [BackgroundRemovalNode] --> [Merge] --> [Output]
                                           |
[New Background] -------------------------/
```

### 10.5 Training Custom Models

Using NeuralNetTrainerNode:

1. Prepare training data
2. Select architecture (UNet, ResNet, etc.)
3. Configure augmentation
4. Train model
5. Export to ONNX/TensorFlow/PyTorch

### 10.6 Frame Interpolation

Create slow motion:

```
[Input Sequence] --> [MotionPredictionNode: 4x] --> [Output Sequence]
```

---

## 11. Animation & Timeline

### 11.1 Timeline Basics

**Timeline Components:**
- Tracks: Animation channels
- Keyframes: Value at specific time
- Curves: Interpolation between keyframes
- Markers: Reference points

### 11.2 Adding Keyframes

1. Select a node
2. Adjust parameter to desired value
3. Click "Set Keyframe" or press F key
4. Move to different frame
5. Adjust parameter and set another keyframe

### 11.3 Easing Types

| Easing | Effect |
|--------|--------|
| linear | Constant speed |
| smooth | Gradual acceleration/deceleration |
| easeIn | Slow start |
| easeOut | Slow end |
| bounce | Bouncing effect |
| elastic | Spring-like motion |
| back | Overshoot |

### 11.4 Curve Editor

CurveEditorNode provides Maya-style control:

**Tangent Types:**
- Auto: Automatic smooth tangents
- Smooth: Smooth bezier
- Linear: Straight segments
- Stepped: Hold until next keyframe
- Flat: Horizontal tangents
- Free: Independent in/out tangents

**Infinity Modes:**
- Constant: Hold last value
- Linear: Continue linearly
- Cycle: Repeat animation
- Oscillate: Ping-pong repeat

### 11.5 Transitions

TransitionNode for timeline edits:

1. Connect A and B inputs
2. Select transition type
3. Set duration
4. Choose easing
5. Animate mix parameter

---

## 12. Motion Graphics

### 12.1 Shape Layers

Create shapes with MotionGraphicsNode:

**Shape Types:**
- Rectangle (with corner radius)
- Ellipse
- Polygon (configurable sides)
- Star (configurable points)
- Path (custom shape)
- Text

### 12.2 Animation Presets

Built-in animations:
- fadeIn / fadeOut
- scaleUp / scaleDown
- slideIn / slideOut
- bounce
- elastic
- spin

### 12.3 Motion Paths

Animate along a path:

1. Define path points
2. Enable "Motion Path"
3. Set "Orient to Path" for automatic rotation
4. Animate progress along path

### 12.4 Array Modifiers

Create repeating patterns:

**Linear Array:**
- Offset position, rotation, scale per copy
- Create rows or sequences

**Radial Array:**
- Arrange in circle
- Control radius and angle range
- Orient to center

**Grid Array:**
- X/Y count and spacing
- Stagger option

**Spiral Array:**
- Expansion rate
- Turn count

**Random Array:**
- Seeded randomization
- Position, rotation, scale variance

### 12.5 Color Variations

Array color modes:
- **Gradient**: Color interpolation across array
- **Random**: Random colors per instance
- **Hue Shift**: Progressive hue rotation

---

## 13. Color Management

### 13.1 Working Color Spaces

| Space | Use Case |
|-------|----------|
| sRGB | Web, video display |
| Linear | Compositing, rendering |
| ACEScg | Film production |

### 13.2 OCIO Integration

Using OCIOColorSpaceNode:

```
[Input: sRGB] --> [OCIOColorSpace: sRGB to Linear] --> [Processing] --> [OCIOColorSpace: Linear to sRGB] --> [Output]
```

### 13.3 LUT Workflow

Apply look-up tables:

1. Add LUTLoaderNode
2. Select preset or load custom LUT
3. Adjust intensity
4. Connect to pipeline

**Built-in Presets:**
- Cinematic Warm/Cool
- Vintage
- Bleach Bypass
- Orange & Teal
- Night Vision
- Cross Process

### 13.4 CDL (Color Decision List)

Professional color grading workflow:

| Control | Effect |
|---------|--------|
| Slope | Multiply (gain) |
| Offset | Add (lift) |
| Power | Gamma |
| Saturation | Color intensity |

### 13.5 Color Matching

Match colors between shots:

```
[Shot A] --> [ColorMatchNode] --> [Output]
[Reference] ----/
```

Methods:
- Histogram matching
- Reinhard color transfer
- Pitié optimal transport

---

## 14. Pipeline Integration

### 14.1 USD Workflow

**Import:**
```
[USDNode: import] --> [Scene] --> [Renderer3D]
```

**Export:**
```
[Scene] --> [USDNode: export] --> File
```

### 14.2 Alembic Caching

Cache animations and simulations:

```
[Physics Sim] --> [AlembicNode: export] --> .abc file
```

Playback cached data:

```
[AlembicNode: import] --> [Scene]
```

### 14.3 Version Control

Track project changes:

1. Initialize repository (VersionControlNode)
2. Commit changes regularly
3. Create branches for variants
4. Push to remote for collaboration

### 14.4 Review Process

Using ReviewToolNode:

1. Submit version for review
2. Add annotations and comments
3. Compare versions (A/B, wipe, onion skin)
4. Request changes or approve
5. Export review notes

### 14.5 Asset Management

PipelineManagerNode features:

- Shot/asset organization
- Version tracking
- Task assignment
- Status updates
- Path templating

---

## 15. Settings & Customization

### 15.1 Settings Categories

Access via Settings button or menu:

| Category | Options |
|----------|---------|
| General | Language, auto-save, undo history |
| Appearance | Theme, accent color, UI scale, font |
| Performance | GPU, memory limits, threading, preview quality |
| Project | Resolution, frame rate, bit depth |
| Rendering | Format, quality, anti-aliasing, path tracing |
| Physics | Fluid resolution, substeps, time scale |
| Camera | Default camera, lens profiles |
| Viewport | Grid, axes, shadows, camera controls |
| Timeline | Playback, keyframe interpolation |
| Caching | Disk/memory cache settings |
| Color Management | Working space, OCIO config |
| Shortcuts | Keyboard customization |
| Advanced | Debug mode, experimental features |

### 15.2 Theme Customization

**Available Themes:**
- Dark (default)
- Light
- Custom accent colors

### 15.3 Performance Settings

| Setting | Recommendation |
|---------|----------------|
| GPU Rendering | Enable if available |
| Memory Limit | 75% of system RAM |
| Preview Quality | Draft for fast iteration |
| Thread Count | Match CPU cores |

### 15.4 Project Defaults

Set defaults for new projects:
- Resolution (1920x1080, 4K, etc.)
- Frame rate (24, 25, 30, 60 fps)
- Frame range
- Bit depth

---

## 16. Keyboard Shortcuts

### 16.1 General

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+N | New project |
| Ctrl/Cmd+O | Open project |
| Ctrl/Cmd+S | Save project |
| Ctrl/Cmd+Shift+S | Save as |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z | Redo |
| Ctrl/Cmd+Q | Quit |

### 16.2 Node Graph

| Shortcut | Action |
|----------|--------|
| Delete | Delete selected |
| Ctrl/Cmd+D | Duplicate |
| Ctrl/Cmd+A | Select all |
| Escape | Deselect all |
| D | Disable/enable node |
| Home | Frame all |
| F | Frame selected |

### 16.3 Viewport Navigation

| Shortcut | Action |
|----------|--------|
| Middle Mouse | Pan |
| Scroll | Zoom |
| Left Mouse | Orbit (3D) |
| Right Mouse | Context menu |

### 16.4 3D Object Manipulation

| Shortcut | Action |
|----------|--------|
| W | Move forward |
| A | Move left |
| S | Move backward |
| D | Move right |
| Q | Move up |
| E | Move down |
| G | Translate mode |
| R | Rotate mode |
| T | Scale mode |
| F | Set keyframe |
| Shift | Fast movement |
| Alt | Precision movement |

### 16.5 Timeline

| Shortcut | Action |
|----------|--------|
| Spacebar | Play/pause |
| Left Arrow | Previous frame |
| Right Arrow | Next frame |
| Home | Go to start |
| End | Go to end |

---

## 17. Performance Optimization

### 17.1 General Tips

1. **Use Draft Quality** for iteration
2. **Disable unused nodes** with D key
3. **Cache heavy computations**
4. **Use proxy images** for large files
5. **Close unused panels**

### 17.2 Node Graph Optimization

- Keep graphs organized
- Minimize node count where possible
- Use backdrops for large graphs
- Avoid redundant processing

### 17.3 GPU Optimization

- Enable GPU rendering
- Update graphics drivers
- Monitor VRAM usage
- Reduce texture sizes if needed

### 17.4 Memory Management

- Set appropriate memory limits
- Enable disk caching
- Clear cache periodically
- Use image sequences over video

### 17.5 Physics Optimization

- Use simple collision shapes
- Enable sleep detection
- Reduce solver iterations for preview
- Cache simulations

### 17.6 8K+ Workflow

- Enable tiled rendering
- Use lower preview resolution
- Render in passes
- Monitor memory usage

---

## 18. Troubleshooting

### 18.1 Application Issues

**Won't Start:**
- Check Node.js version (20+)
- Verify WebGL2 support
- Update graphics drivers
- Try web version

**Crashes:**
- Reduce memory usage
- Update GPU drivers
- Check for circular dependencies
- Review console for errors

### 18.2 Node Issues

**Nodes Not Connecting:**
- Check data type compatibility
- Verify socket types match
- Look for error messages

**Black/Empty Output:**
- Ensure all nodes connected
- Check input has data
- Execute graph
- Look for errors

**Slow Processing:**
- Use draft quality
- Reduce resolution
- Check node efficiency
- Disable unnecessary nodes

### 18.3 Rendering Issues

**Artifacts:**
- Increase sample count
- Check for clipping
- Verify bit depth

**Wrong Colors:**
- Check color space settings
- Verify OCIO config
- Review color nodes

### 18.4 3D Issues

**Missing Objects:**
- Check scene connections
- Verify camera setup
- Review transforms

**No Shadows:**
- Enable shadows on light
- Check shadow settings
- Verify renderer config

### 18.5 Physics Issues

**Objects Pass Through:**
- Check collision shapes
- Verify static/dynamic settings
- Increase solver iterations

**Unstable Simulation:**
- Reduce time step
- Increase substeps
- Check for interpenetration

---

## 19. Advanced Topics

### 19.1 Custom Node Development

Create custom nodes by extending Node class:

```typescript
import { Node, DataType } from '../core/Node';

class CustomNode extends Node {
  constructor(id: string) {
    super(id, 'Custom', 'My Custom Node');
    this.metadata.category = 'Custom';
    
    this.addInput('input', 'Input', DataType.IMAGE);
    this.addOutput('output', 'Output', DataType.IMAGE);
    
    this.setParameter('strength', 1.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('input');
    const output = this.outputs.get('output');
    
    if (input?.value && output) {
      // Process data
      output.value = this.processData(input.value);
    }
  }
}
```

### 19.2 Python Scripting

Using PythonScriptNode:

```python
# Available: input_image, value1, value2
# Return: output_image, result

import numpy as np

# Process image
output_image = input_image.copy()
# Your processing logic

result = {'success': True}
```

### 19.3 Network Rendering

**Setting Up Render Farm:**

1. Add RenderFarmNode
2. Configure server URL
3. Set worker count
4. Define chunk size

**Adding Render Client:**

1. Add NetworkClientNode
2. Connect to farm server
3. Configure resources
4. Enable auto-connect

### 19.4 Shader Development

Custom shaders for RenderEngine:

```glsl
// Fragment shader
precision highp float;

uniform sampler2D uTexture;
uniform float uAmount;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(uTexture, vUv);
  // Custom processing
  gl_FragColor = color;
}
```

### 19.5 Expression Linking

In MultiShotNode, use expressions:

```javascript
// Math functions
sin(frame), cos(frame), lerp(a, b, t), clamp(v, min, max)

// Shot variables
shot.version, shot.name, shot.variant

// Time
frame, time, fps
```

### 19.6 Procedural Generation

Using ProceduralTerrainNode:

1. Configure noise type
2. Set erosion parameters
3. Define biome rules
4. Generate vegetation
5. Export heightmap

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **AOV** | Arbitrary Output Variable - render pass |
| **CDL** | Color Decision List |
| **DAG** | Directed Acyclic Graph |
| **FBX** | Autodesk file format |
| **glTF** | Graphics Library Transmission Format |
| **HDR** | High Dynamic Range |
| **IBL** | Image-Based Lighting |
| **LUT** | Look-Up Table |
| **OCIO** | OpenColorIO |
| **PBR** | Physically Based Rendering |
| **SPH** | Smoothed Particle Hydrodynamics |
| **UDIM** | UV tile addressing |
| **USD** | Universal Scene Description |
| **VDB** | Volumetric database format |

### Appendix B: File Formats

**Image Formats:**
- PNG: Lossless, 8/16-bit
- JPEG: Lossy, 8-bit
- EXR: HDR, 16/32-bit float
- TIFF: Lossless, 8/16/32-bit
- DPX: Film format

**3D Formats:**
- OBJ: Simple geometry
- FBX: Autodesk format
- glTF/GLB: Modern, efficient
- USD: Industry standard
- Alembic: Animation cache

**Video Formats:**
- MP4 (H.264/H.265)
- MOV (ProRes)
- MXF (DNxHD)
- WebM (VP9/AV1)

### Appendix C: Resolution Presets

| Name | Resolution |
|------|------------|
| HD | 1920 × 1080 |
| 2K | 2048 × 1080 |
| 4K UHD | 3840 × 2160 |
| 4K DCI | 4096 × 2160 |
| 6K | 6144 × 3456 |
| 8K UHD | 7680 × 4320 |
| 8K DCI | 8192 × 4320 |
| 10K | 10240 × 5760 |
| 12K | 12288 × 6480 |
| 16K | 15360 × 8640 |

### Appendix D: Camera Specs

**ARRI ALEXA 35:**
- Sensor: 4.6K (4608 × 3164)
- Dynamic Range: 17+ stops
- Native ISO: 800

**RED V-RAPTOR XL 8K:**
- Sensor: 8K (8192 × 4320)
- Dynamic Range: 17 stops
- Native ISO: 800

**Sony VENICE 2 8K:**
- Sensor: 8.6K (8640 × 5760)
- Dynamic Range: 16 stops
- Native ISO: 800/3200

### Appendix E: Color Spaces

| Space | Use |
|-------|-----|
| sRGB | Web, consumer video |
| Rec.709 | HD television |
| DCI-P3 | Digital cinema |
| Rec.2020 | UHD/HDR |
| ACEScg | VFX compositing |
| ACES2065-1 | Archival |
| Linear | Internal processing |

### Appendix F: Physics Constants

| Property | Default | Range |
|----------|---------|-------|
| Gravity | -9.81 m/s² | -100 to 100 |
| Air Drag | 0.01 | 0 to 1 |
| Restitution | 0.3 | 0 to 1 |
| Friction | 0.5 | 0 to 1 |
| Linear Damping | 0.01 | 0 to 1 |
| Angular Damping | 0.01 | 0 to 1 |

---

## Support & Resources

### Documentation
- README.md - Feature overview
- API.md - Complete API reference
- ARCHITECTURE.md - System design
- CHANGELOG.md - Version history
- ROADMAP.md - Development plans

### Community
- Discord: [discord.gg/ragevfx](https://discord.gg/ragevfx)
- GitHub: [github.com/mllinman/RageVFX](https://github.com/mllinman/RageVFX)
- Email: support@ragevfx.com

### Learning Resources
- Tutorial videos (coming soon)
- Example projects in /examples
- Community forums

---

**RageVFX** - *The Future of Visual Effects*

© 2025 RageVFX. MIT License.
