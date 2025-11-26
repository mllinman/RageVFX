# Changelog

All notable changes to RageVFX will be documented in this file.

## [1.2.0] - 2025-11-26

### Added - Version 1.2 Features

#### Python Scripting Support
- **PythonScriptNode**: Execute custom Python scripts for advanced image processing
  - Supports input images and numeric values
  - Returns processed images and custom results
  - Auto-execution mode for real-time updates
  - Placeholder for future Python bridge integration (python-shell or pyodide)

#### OpenColorIO Integration
- **OCIOColorSpaceNode**: Professional color space conversion
  - Support for Linear, sRGB, and ACEScg color spaces
  - ACES 1.2 configuration support
  - Proper gamma correction and color transformations
- **OCIOLookNode**: Apply OCIO look transforms
  - Forward and inverse directions
  - Adjustable strength parameter
  - Placeholder for full OCIO library integration

#### EXR and High-Bit-Depth Format Support
- Enhanced **ImageInputNode**:
  - Support for 8-bit (rgba8), 16-bit (rgba16), and 32-bit float (rgba32f) formats
  - EXR format support
  - Color space metadata (sRGB, Linear, ACEScg)
- Enhanced **OutputNode**:
  - Export to PNG, JPEG, EXR, TIFF formats
  - Bit depth control (8, 16, 32-bit)
  - Compression options (none, zip, rle, piz for EXR)
  - Color space preservation
- Updated **RenderEngine**:
  - Extended ImageData interface to support Uint16Array and Float32Array
  - High-bit-depth processing pipeline

#### Network Rendering
- **RenderFarmNode**: Distributed rendering coordination
  - Job queue management
  - Priority-based scheduling (low, normal, high)
  - Configurable chunk size for work distribution
  - Timeout handling
  - Job status tracking
- **NetworkClientNode**: Render client for distributed rendering
  - Auto-connect to render farm server
  - Worker capability reporting (CPU, GPU, memory)
  - Status monitoring (idle, connected, rendering)
  - Configurable resource limits

### Added - Version 1.1 Features

#### 3D Geometry Support with Three.js Integration
- **Geometry3DNode**: Create 3D primitives
  - Box, sphere, plane, cylinder, and torus geometries
  - Adjustable dimensions and segment counts
  - Proper resource disposal
- **MeshNode**: Create 3D meshes with materials
  - PBR material support (metalness, roughness)
  - Texture mapping from image inputs
  - Color, emissive, opacity, and wireframe controls
- **CameraNode**: 3D perspective camera
  - Configurable FOV, aspect ratio, near/far planes
  - Position and look-at controls
- **LightNode**: Scene lighting
  - Point, directional, spot, and ambient lights
  - Configurable color, intensity, and position
  - Shadow casting support
- Added **GEOMETRY_3D** data type to core Node system
- Installed **@types/three** for TypeScript support

#### Advanced Particle Systems
- **ParticleSystemNode**: GPU-accelerated particle generation
  - Configurable max particles and emission rate
  - Particle life cycle management
  - Velocity ranges and gravity simulation
  - Color interpolation from start to end
  - Multiple blend modes (add, normal, multiply)
  - Real-time particle updates at 60fps
- **ParticleEmitterNode**: Emission control
  - Multiple emission shapes (point, circle, rectangle, line)
  - Angle and spread controls
  - Radius and dimension parameters
- **ParticleForceNode**: Physics forces
  - Multiple force types (gravity, wind, vortex, turbulence, drag)
  - Strength and direction controls
  - Radius and falloff parameters
- Added **PARTICLES** data type to core Node system

#### Motion Tracking Nodes
- **MotionVectorsNode**: Visualize optical flow
  - Motion vector visualization with arrows
  - Configurable grid size and scale
  - Customizable color and thickness
  - Optional background display
- **TrackingDataNode**: Tracking data management
  - Multi-frame tracking point storage
  - Linear interpolation between frames
  - Smoothing with configurable window
  - Confidence tracking
  - Easy data export and import

#### Keying and Rotoscoping Tools
- **RotoscopeNode**: Manual masking and rotoscoping
  - Multi-frame mask support
  - Closed and open path shapes
  - Feathering controls
  - Opacity and invert options
  - Per-frame mask management
- **SpillSuppressionNode**: Chroma key cleanup
  - Remove color spill from green/blue screen keying
  - Simple and advanced algorithms
  - Adjustable suppression amount
  - Color preservation in advanced mode
- **EdgeMatteNode**: Alpha matte refinement
  - Shrink and grow (erosion/dilation) operations
  - Edge choke for hard edges
  - Blur and soften controls
  - Non-destructive edge refinement

### Changed
- Updated DataType enum to include GEOMETRY_3D, PARTICLES, and SCRIPT types
- Enhanced ImageInputNode to support multiple bit depths and formats
- Enhanced OutputNode with format options and metadata
- Updated RenderEngine ImageData interface for high-bit-depth support
- Updated ChromaticAberrationNode to handle Uint16Array data
- Updated SharpenNode to handle Uint16Array data
- Bumped version from 1.0.0 to 1.2.0 in package.json
- Updated README.md with completed roadmap items

### Fixed
- Fixed TypeScript type compatibility for typed arrays in image processing nodes
- Removed unused imports to satisfy linting requirements

## [1.0.0] - Initial Release

### Added
- Core node-based architecture
- WebGL2 rendering engine
- Comprehensive node library:
  - Input/Output nodes
  - Generator nodes (Noise, Gradient)
  - Filter nodes (Blur, EdgeDetect, Sharpen, Glow, MotionBlur, etc.)
  - Color nodes (ColorCorrect, Grade, Curves, Levels, HSL)
  - Composite nodes (Merge, Screen, Overlay)
  - Transform nodes (Transform, CornerPin)
  - Keying nodes (ChromaKey, LuminanceKey, Difference)
  - VFX Effect nodes (Fire, Water, Rain, Snow, Smoke, Clouds, etc.)
  - Tracker nodes (PointTracker, PlanarTracker, OpticalFlow, Stabilizer)
  - Utility nodes (Time, Math, Switch, Dot, FrameHold, TimeOffset)
- Project save/load functionality
- Electron-based desktop application
- Cross-platform support (Windows, macOS, Linux)
