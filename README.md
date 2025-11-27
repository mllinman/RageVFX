# RageVFX

**The Industry-Rivaling Node-Based Visual Effects Platform**

RageVFX is a next-generation visual effects software designed to rival industry leaders like **Nuke**, **Houdini**, and **Redshift/V-Ray**. Combining the power of node-based compositing, procedural generation, and GPU-accelerated rendering, RageVFX provides a comprehensive solution for creating blockbuster-quality visual effects.

![RageVFX](https://img.shields.io/badge/version-3.0.0-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Web-lightgrey)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Nodes](https://img.shields.io/badge/nodes-105%2B-green)

## 🏆 Industry Competition

RageVFX 3.0 introduces features that directly compete with industry-standard tools:

| Feature | Nuke | Houdini | Redshift/V-Ray | RageVFX |
|---------|------|---------|----------------|---------|
| Node-based compositing | ✅ | ✅ | - | ✅ |
| Deep compositing | ✅ | - | - | ✅ |
| Multishot workflow | ✅ | - | - | ✅ 3.0 |
| IBK-style keying | ✅ | - | - | ✅ 3.0 |
| Procedural terrain | - | ✅ | - | ✅ 3.0 |
| Crowd simulation | - | ✅ | - | ✅ 3.0 |
| Path tracing | - | ✅ | ✅ | ✅ 3.0 |
| Light mixing | - | - | ✅ | ✅ 3.0 |
| Physics simulation | - | ✅ | - | ✅ |
| ML-powered tools | ✅ | - | - | ✅ |

## 🚀 Try It Now

### Web Version (No Installation Required)
Try RageVFX directly in your browser - no download, no installation, just start creating!

```bash
# Clone and run the web version locally
git clone https://github.com/mllinman/RageVFX.git
cd RageVFX
npm install
npm run dev:web
```

### Desktop Version
Download the Windows installer or portable version from the [Releases](https://github.com/mllinman/RageVFX/releases) page.

## Features

### 🎨 Comprehensive Node System
- **Flexible Node Graph**: Intuitive node-based workflow for complex VFX pipelines
- **Smart Connections**: Type-safe connections with automatic data flow validation
- **Execution Optimization**: Intelligent topological sorting for efficient processing
- **Circular Dependency Detection**: Automatic detection and prevention of circular dependencies

### 🚀 GPU-Accelerated Rendering
- **WebGL2 Support**: Hardware-accelerated image processing and rendering
- **Custom Shader Library**: Extensive collection of optimized GPU shaders
- **Real-time Preview**: Instant feedback with real-time viewport updates
- **High-Quality Output**: Production-ready rendering with multiple quality settings

### 🎬 Professional VFX Nodes

#### Input/Output
- **Image Input**: Load images from files or memory (supports 8/16/32-bit, EXR)
- **Output**: Export rendered results in various formats (PNG, JPEG, EXR, TIFF)

#### Color Operations
- **Color Correct**: Adjust brightness, contrast, saturation, and hue
- **Color Grade**: Advanced color grading with lift, gamma, gain controls

#### Filters
- **Blur**: Gaussian and box blur with quality settings
- **Sharpen**: Edge enhancement and detail preservation
- **Edge Detection**: Sobel-based edge detection

#### Compositing
- **Merge**: Advanced compositing with multiple blend modes (over, add, multiply, screen)
- **Alpha Operations**: Premultiply, unpremultiply, and alpha manipulation

#### Transform
- **Transform 2D**: Scale, rotate, translate with pivot control
- **Lens Distortion**: Barrel and pincushion distortion
- **Perspective Transform**: 4-point perspective warping

#### 3D Nodes (v1.1)
- **Geometry 3D**: Create and manipulate 3D primitives (box, sphere, plane, cylinder, torus)
- **Mesh**: Apply materials and textures to 3D geometry
- **Camera**: 3D perspective camera with position and look-at controls
- **Light**: Scene lighting (point, directional, spot, ambient)

#### Particle Systems (v1.1)
- **Particle System**: GPU-accelerated particle generation and rendering
- **Particle Emitter**: Control emission shape, rate, and properties
- **Particle Force**: Apply physics forces (gravity, wind, vortex, turbulence, drag)

#### Tracking Nodes (v1.1)
- **Motion Vectors**: Visualize optical flow as motion vectors
- **Tracking Data**: Store and manage tracking information with interpolation

#### Scripting Nodes (v1.2)
- **Python Script**: Execute custom Python scripts for image processing
- **Custom Logic**: Implement complex algorithms via scripting

#### Color Management (v1.2)
- **OCIO Color Space**: OpenColorIO color space conversion (Linear, sRGB, ACEScg)
- **OCIO Look**: Apply OCIO look transforms with adjustable strength

#### Network Rendering (v1.2)
- **Render Farm**: Coordinate distributed rendering across multiple machines
- **Network Client**: Render client with auto-discovery and load balancing

#### Full 3D Rendering Pipeline (v2.0)
- **Scene**: Scene graph management for organizing 3D objects, lights, and cameras
- **Renderer 3D**: Full 3D scene rendering with advanced options (ACES tone mapping, shadow maps)
- **Material**: Advanced PBR material system with physical properties
- **Environment Map**: HDR environment mapping for image-based lighting
- **Shadow Map**: Dynamic shadow mapping with PCF soft shadows

#### Volumetric Effects (v2.0)
- **Volumetric Fog**: Atmospheric fog rendering with height falloff and scattering
- **Volumetric Light**: God rays and light shaft effects
- **Volume Render**: 3D volume rendering (ray casting, MIP, isosurface)
- **Cloud Volume**: Procedural volumetric cloud rendering with animation

#### Physics Simulation (v2.0)
- **Rigid Body**: Rigid body physics with collision detection and response
- **Soft Body**: Deformable soft body simulation (mass-spring system)
- **Fluid Sim**: SPH-based fluid dynamics simulation
- **Cloth Sim**: Realistic cloth and fabric simulation with wind forces
- **Collision**: Advanced collision detection (AABB, sphere, box)

#### Machine Learning Powered Tools (v2.0)
- **Style Transfer**: Neural style transfer for artistic effects
- **Upscale**: AI-powered image upscaling with edge enhancement
- **Denoise**: AI-powered denoising with edge preservation
- **Object Detection**: Object detection and instance segmentation
- **Inpaint**: AI-powered content-aware fill and inpainting
- **Depth Estimation**: Monocular depth estimation with colormap visualization

#### Animation Timeline (v2.1)
- **Animation Timeline**: Keyframe animation system for VFX nodes
  - Multi-track animation with keyframe control
  - Multiple easing types (linear, ease-in/out, bezier, step)
  - Loop and ping-pong playback modes
  - Normalized time output for procedural effects

#### Output Nodes (v2.1)
- **Image Sequence Output**: Export image sequences (PNG, JPEG, TIFF, EXR, DPX)
  - Configurable bit depth (8/16/32-bit)
  - Compression options and color space conversion
- **Video Sequence Output**: Export video files (MP4, MOV, MXF)
  - H.264, H.265, ProRes, DNxHD codecs
  - Professional color space handling
- **Camera Format Output**: Export in camera-native formats
  - ARRI RAW, RED R3D, Blackmagic RAW, Sony RAW
  - Log encoding and wide gamut color spaces

#### Camera Nodes (v2.1)
- **Camera Preset**: Professional cinema camera presets
  - RED, ARRI, Blackmagic, Sony, Canon cameras
  - Accurate sensor specifications and color science
- **Camera Lens**: Lens simulation and adjustment
  - ARRI, Zeiss, Cooke, Panavision lens presets
  - Anamorphic squeeze, distortion, vignetting
- **Lens Distortion Correction**: Undistort lens distortion for VFX
  - Brown-Conrady, fisheye, anamorphic models
  - GoPro, DJI, cinema lens profiles
  - ST Map generation

#### Advanced VFX Effects (v2.3)
- **Anamorphic Flare**: Professional anamorphic lens flares with horizontal streaks
- **Nebula**: Procedural space nebula with star fields and dust lanes
- **Shockwave**: Expanding radial distortion effects with chromatic aberration
- **Plasma**: Dynamic energy and plasma effects with color cycling
- **Portal**: Dimensional portals with vortex and particle effects
- **Hologram**: Sci-fi holographic displays with scan lines and glitches
- **Caustics**: Water caustic lighting patterns with refraction
- **Aurora**: Northern lights with animated curtains
- **Heat Distortion**: Realistic heat shimmer effects
- **Debris**: Particle debris for destruction effects

#### Professional Compositing (v2.3)
- **Deep Composite**: Depth-aware compositing with per-pixel depth
- **Cryptomatte**: ID matte extraction for object isolation
- **AOV Manager**: Combine and manipulate render passes

#### Professional Color Grading (v2.3)
- **LUT Loader**: Load and apply 3D LUTs with 11 built-in presets
- **CDL**: ASC Color Decision List with slope, offset, power controls

#### 🆕 Nuke-Rivaling Compositing (v3.0)
- **MultiShot**: Multishot workflow with graph scope variables
  - Shot versioning and variant management
  - Expression linking with math functions (sin, cos, lerp, clamp)
  - Batch processing across multiple shots
  - Template-based shot creation
  - Pipeline-ready JSON export/import
- **IBK Keyer**: Advanced IBK-style keying
  - Auto-detect screen color with picker
  - Adaptive algorithm for uneven screens
  - Core matte with erosion/blur
  - Multi-pass spill suppression
  - Status keyer output

#### 🆕 Houdini-Rivaling Procedural Tools (v3.0)
- **Procedural Terrain**: Full terrain generation pipeline
  - Multi-octave noise (simplex, perlin, FBM, ridged, voronoi)
  - Hydraulic and thermal erosion simulation
  - Automatic biome classification
  - River carving and water bodies
  - Vegetation scatter with biome awareness
  - Normal map and erosion map outputs
- **Crowd Sim**: Agent-based crowd simulation
  - Multiple agent types with state machines
  - Steering behaviors (separation, cohesion, alignment)
  - Flow field and goal-seeking navigation
  - Obstacle avoidance with terrain detection
  - LOD system for massive crowds (10,000+ agents)
  - Instance matrix output for rendering

#### 🆕 Redshift/V-Ray-Rivaling Rendering (v3.0)
- **Path Tracer**: Production-quality path tracing
  - Unbiased physically-based rendering
  - Multiple importance sampling (MIS)
  - Next event estimation (NEE)
  - Russian roulette termination
  - ACES, Reinhard, Filmic tone mapping
  - Progressive rendering with accumulation
  - Depth of field with aperture control
- **Light Mixer**: Interactive post-render light control
  - Per-light intensity and color adjustment
  - Light group management with master controls
  - Solo/mute for individual lights
  - Environment, GI, emission, caustics control
  - Preset saving and interpolation
  - Shadow intensity adjustment

### 💼 Project Management
- **Save/Load Projects**: Preserve your node graphs and settings
- **Version Control Ready**: JSON-based project format
- **Batch Processing**: Process multiple projects automatically

### 🎯 Modern Architecture
- **TypeScript**: Type-safe, maintainable codebase
- **Electron**: Cross-platform desktop application
- **Modular Design**: Extensible plugin architecture
- **Clean Code**: Well-documented, professional implementation

## Installation

### Prerequisites
- Node.js 20.0.0 or higher
- npm or yarn package manager

### Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/mllinman/RageVFX.git
   cd RageVFX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Start RageVFX**
   ```bash
   npm start
   ```

### 🌐 Web Version (No Installation Required)

Try RageVFX directly in your browser without any installation:

1. **Development server**
   ```bash
   npm run dev:web
   ```
   Opens at http://localhost:3000

2. **Build for production**
   ```bash
   npm run build:web
   ```
   Creates optimized files in `dist-web/`

3. **Preview production build**
   ```bash
   npm run preview:web
   ```

### 💿 Windows Installation

Download and install RageVFX on Windows:

#### Option 1: Installer (Recommended)
1. Download the latest `.exe` installer from [Releases](https://github.com/mllinman/RageVFX/releases)
2. Run the installer and follow the prompts
3. Launch RageVFX from the Start Menu or Desktop shortcut

#### Option 2: Portable Version
1. Download the portable `.exe` from [Releases](https://github.com/mllinman/RageVFX/releases)
2. Run directly - no installation required

#### Building Windows Installer from Source
```bash
# Install dependencies
npm install

# Build Windows installer (NSIS + Portable)
npm run dist:win
```
Output files will be in the `release/` directory.

### 🍎 macOS Installation

```bash
# Build macOS installer
npm run dist:mac
```

### 🐧 Linux Installation

```bash
# Build Linux packages (AppImage, deb, rpm)
npm run dist:linux
```

### Building for All Platforms

```bash
# Build for Windows, macOS, and Linux
npm run dist:all
```

## Usage

### Basic Workflow

1. **Create Nodes**: Drag nodes from the library to the node editor
2. **Connect Nodes**: Click and drag between output and input sockets
3. **Adjust Parameters**: Select nodes to modify their properties
4. **Execute Graph**: Click the Execute button to process your VFX pipeline
5. **Preview Results**: View the output in the viewport panel

### Example: Simple Blur Effect

```typescript
// Create nodes
const input = new ImageInputNode('input1');
const blur = new BlurNode('blur1');
const output = new OutputNode('output1');

// Configure parameters
blur.setParameter('blurAmount', 10.0);

// Build graph
graph.addNode(input);
graph.addNode(blur);
graph.addNode(output);

// Connect nodes
graph.connect('input1', 'image', 'blur1', 'image');
graph.connect('blur1', 'image', 'output1', 'image');

// Execute
await graph.execute();
```

### Example: Color Correction Pipeline

```typescript
// Create a color grading pipeline
const input = new ImageInputNode('input1');
const colorCorrect = new ColorCorrectNode('cc1');
const output = new OutputNode('output1');

// Adjust color properties
colorCorrect.setParameter('brightness', 0.1);
colorCorrect.setParameter('contrast', 1.2);
colorCorrect.setParameter('saturation', 1.3);

// Build and execute
graph.addNode(input);
graph.addNode(colorCorrect);
graph.addNode(output);
graph.connect('input1', 'image', 'cc1', 'image');
graph.connect('cc1', 'image', 'output1', 'image');
await graph.execute();
```

## Architecture

### Core Components

```
RageVFX/
├── src/
│   ├── core/              # Core engine components
│   │   ├── Node.ts        # Base node class
│   │   ├── NodeGraph.ts   # Graph management
│   │   └── RageVFXApp.ts  # Main application
│   ├── nodes/             # Node implementations
│   │   ├── ImageInputNode.ts
│   │   ├── BlurNode.ts
│   │   ├── ColorCorrectNode.ts
│   │   ├── MergeNode.ts
│   │   ├── TransformNode.ts
│   │   └── OutputNode.ts
│   ├── renderer/          # Rendering engine
│   │   ├── RenderEngine.ts
│   │   └── ShaderLibrary.ts
│   ├── ui/                # User interface
│   └── main.ts            # Application entry point
└── ui/                    # HTML/CSS/JS assets
    ├── index.html
    ├── styles.css
    └── renderer.js
```

### Node System

RageVFX uses a powerful node-based architecture:

- **Base Node Class**: Abstract foundation for all nodes
- **Type Safety**: Strongly-typed socket connections
- **Data Flow**: Automatic data propagation through the graph
- **Caching**: Intelligent caching to avoid redundant processing
- **Dirty Tracking**: Optimized execution of only changed nodes

### Render Engine

The rendering system leverages modern GPU capabilities:

- **WebGL2 Context**: Hardware-accelerated processing
- **Shader Programs**: Optimized GLSL shaders for effects
- **Framebuffers**: Efficient multi-pass rendering
- **Texture Management**: Smart resource handling

## Development

### Building from Source

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Creating Custom Nodes

Extend the `Node` base class to create custom nodes:

```typescript
import { Node, DataType } from '../core/Node';

export class CustomNode extends Node {
  constructor(id: string) {
    super(id, 'Custom', 'My Custom Node');
    this.metadata.category = 'Custom';
    this.metadata.description = 'Custom node implementation';
    
    // Define inputs
    this.addInput('input1', 'Input', DataType.IMAGE);
    
    // Define outputs
    this.addOutput('output1', 'Output', DataType.IMAGE);
    
    // Set parameters
    this.setParameter('strength', 1.0);
  }

  async process(): Promise<void> {
    // Implement your processing logic
    const input = this.inputs.get('input1');
    const output = this.outputs.get('output1');
    
    if (input?.value && output) {
      // Process data
      output.value = this.processData(input.value);
    }
  }
  
  private processData(data: any): any {
    // Your custom processing
    return data;
  }
}
```

## Performance

RageVFX is optimized for professional workflows:

- **GPU Acceleration**: Leverages WebGL2 for hardware-accelerated processing
- **Smart Caching**: Avoids redundant computations
- **Lazy Evaluation**: Only processes nodes that need updating
- **Multi-threading**: Uses Web Workers for CPU-intensive operations
- **Memory Management**: Efficient resource cleanup and disposal

## Roadmap

### Version 1.1 ✅
- [x] 3D geometry support with Three.js integration
- [x] Advanced particle systems
- [x] Motion tracking nodes
- [x] Keying and rotoscoping tools

### Version 1.2 ✅
- [x] Python scripting support
- [x] OpenColorIO integration
- [x] EXR and high-bit-depth format support
- [x] Network rendering

### Version 2.0 ✅
- [x] Full 3D rendering pipeline (Scene, Renderer3D, Material, EnvironmentMap, ShadowMap)
- [x] Volumetric effects (VolumetricFog, VolumetricLight, VolumeRender, CloudVolume)
- [x] Physics simulation nodes (RigidBody, SoftBody, FluidSim, ClothSim, Collision)
- [x] Machine learning-powered tools (StyleTransfer, Upscale, Denoise, ObjectDetection, Inpaint, DepthEstimation)

### Version 3.0 ✅ (Industry Competition Release)
- [x] **Nuke-rivaling compositing**: MultiShot with graph scope variables, IBK-style keying
- [x] **Houdini-rivaling procedural tools**: Procedural terrain with erosion, crowd simulation
- [x] **Redshift/V-Ray-rivaling rendering**: Path tracer with MIS/NEE, interactive light mixer
- [x] Comprehensive competitive analysis and roadmap (ROADMAP.md)

### Version 3.1 (Future - Pipeline Integration)
- [ ] USD/Alembic import/export
- [ ] Neural network training (CopyCat-style)
- [ ] Segment Anything integration
- [ ] Built-in review and annotation tools
- [ ] Git-based version control for projects

### Version 3.2 (Future - Performance & Scale)
- [ ] WebGPU rendering for 10x performance
- [ ] Cloud-native distributed rendering
- [ ] 8K+ resolution support
- [ ] Stereoscopic 3D workflow
- [ ] Live link to Unreal/Unity

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with TypeScript, Electron, and WebGL2
- Inspired by industry-standard VFX tools (Nuke, Houdini, Redshift, V-Ray)
- Designed for professional artists and developers

## Support

- 📧 Email: support@ragevfx.com
- 💬 Discord: [Join our community](https://discord.gg/ragevfx)
- 📖 Documentation: [docs.ragevfx.com](https://docs.ragevfx.com)
- 🐛 Issues: [GitHub Issues](https://github.com/mllinman/RageVFX/issues)

---

**RageVFX** - *The Future of Visual Effects*
