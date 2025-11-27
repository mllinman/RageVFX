# RageVFX

**A Powerful Node-Based Visual Effects Program**

RageVFX is a next-generation visual effects software that combines the power of node-based compositing with modern GPU-accelerated rendering. Built with cutting-edge web technologies and designed to rival industry-standard tools, RageVFX provides a comprehensive solution for creating award-winning visual effects.

![RageVFX](https://img.shields.io/badge/version-2.1.0-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Web-lightgrey)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

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
- Node.js 18.0.0 or higher
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

### Version 3.0 (Future)
- [ ] Real-time raytracing with WebGPU
- [ ] Advanced audio reactive nodes
- [ ] Procedural mesh generation
- [ ] Advanced rigging and animation system

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
- Inspired by industry-standard VFX tools
- Designed for professional artists and developers

## Support

- 📧 Email: support@ragevfx.com
- 💬 Discord: [Join our community](https://discord.gg/ragevfx)
- 📖 Documentation: [docs.ragevfx.com](https://docs.ragevfx.com)
- 🐛 Issues: [GitHub Issues](https://github.com/mllinman/RageVFX/issues)

---

**RageVFX** - *The Future of Visual Effects*
