# Changelog

All notable changes to RageVFX will be documented in this file.

## [2.2.0] - 2025-11-27

### Changed - Version 2.2 Upgrades

#### Dependency Upgrades
- **Electron**: 27.0.0 → 39.2.4 (major upgrade with latest Chromium and Node.js)
- **Three.js**: 0.158.0 → 0.181.2 (new features and performance improvements)
- **TypeScript**: 5.3.2 → 5.9.3 (latest stable with improved type checking)
- **ESLint**: 8.54.0 → 9.39.1 (new flat config format)
- **typescript-eslint**: 6.11.0 → 8.48.0 (compatibility with ESLint 9)
- **Jest**: 29.7.0 → 30.2.0 (latest testing framework)
- **@types/node**: 20.9.0 → 24.10.1 (latest Node.js types)

#### Configuration Updates
- Migrated to ESLint 9 flat configuration format (eslint.config.js)
- Updated Node.js engine requirement to >=20.0.0
- Resolved all linting errors in codebase

### Fixed
- Fixed unused variable warnings in CloudVolumeNode
- Fixed unused variable errors in ObjectDetectionNode
- Fixed unused variable errors in VolumetricFogNode
- Removed unnecessary eslint-disable comments in CornerPinNode
- Removed unnecessary eslint-disable comments in PlanarTrackerNode

## [2.1.0] - 2025-11-27

### Added - Version 2.1 Features

#### Animation Timeline
- **AnimationTimelineNode**: Keyframe animation system for VFX nodes
  - Multi-track animation support with named tracks
  - Keyframe interpolation with multiple easing types (linear, ease-in, ease-out, ease-in-out, bezier, step)
  - Custom bezier curve handles for precise timing control
  - Loop and ping-pong playback modes
  - Configurable playback speed
  - Frame range controls (start frame, end frame)
  - Normalized time output for procedural effects

#### Output Nodes
- **ImageSequenceOutputNode**: Image sequence exports
  - Support for PNG, JPEG, TIFF, EXR, and DPX formats
  - Configurable bit depth (8-bit, 16-bit, 32-bit float)
  - Compression options (ZIP, RLE, PIZ for EXR, LZW for TIFF)
  - Frame padding and naming conventions
  - Color space conversion with premultiplied alpha support
  - Embedded metadata

- **VideoSequenceOutputNode**: Video export
  - Container support: MP4, MOV, MXF, AVI, WebM
  - Codec support: H.264, H.265, ProRes (422 Proxy to 4444 XQ), DNxHD/DNxHR, VP9, AV1
  - Professional color space handling (BT.709, BT.2020)
  - CRF and bitrate controls for quality
  - ProRes and DNxHD profile selection
  - FFmpeg command generation for external processing

- **CameraFormatOutputNode**: Camera-native format exports
  - ARRI RAW (.ari) with LogC4/LogC3 and ARRI Wide Gamut
  - RED R3D with Log3G10 and RED Wide Gamut RGB
  - Blackmagic RAW (.braw) with BMD Film Gen5
  - Sony RAW with S-Log3 and S-Gamut3
  - Camera metadata (reel, clip name, take number)

#### Camera Nodes
- **CameraPresetNode**: Cinema camera presets with accurate sensor specifications
  - RED V-RAPTOR XL 8K, RED KOMODO 6K
  - ARRI ALEXA 35, ALEXA LF, ALEXA Mini LF
  - Blackmagic URSA Mini Pro 12K, Pocket 6K G2
  - Sony VENICE 2 8K, FX6
  - Canon EOS C70, C500 Mark II
  - Accurate sensor dimensions, crop factors, and color science
  - Native ISO and dynamic range information
  - Resolution presets per camera

- **CameraLensNode**: Professional lens simulation
  - Lens presets: ARRI Signature, Zeiss Master Prime, Cooke Anamorphic, Panavision Primo, Atlas Orion
  - Focal length and aperture controls
  - Anamorphic squeeze support (2x, 1.33x, spherical)
  - Lens distortion simulation (barrel, pincushion)
  - Chromatic aberration and vignetting
  - Bokeh blade count and curvature
  - Focus breathing simulation

- **LensDistortionCorrectionNode**: Lens undistortion for VFX matching
  - Brown-Conrady distortion model
  - Fisheye distortion model
  - Anamorphic distortion support
  - Predefined profiles for GoPro, DJI drones, cinema lenses
  - ST Map generation for external tools
  - Grid overlay for visualization
  - Bilinear filtering for high-quality resampling

## [2.0.0] - 2025-11-26

### Added - Version 2.0 Features

#### Full 3D Rendering Pipeline
- **SceneNode**: Scene graph management for 3D rendering
  - Organize 3D objects, lights, and cameras in a scene graph
  - Background color and fog support
  - Ambient light configuration
- **Renderer3DNode**: Advanced 3D scene renderer
  - ACES filmic tone mapping
  - Configurable anti-aliasing with MSAA
  - Shadow map support (Basic, PCF, PCF Soft, VSM)
  - Depth and normal output passes
- **MaterialNode**: Advanced PBR material system
  - Standard, Physical, Basic, Lambert, Phong, and Toon materials
  - Full PBR properties (metalness, roughness, clearcoat, sheen)
  - Texture map support (albedo, normal, roughness, metalness, AO, emissive, displacement)
- **EnvironmentMapNode**: HDR environment mapping
  - Equirectangular and cube map support
  - Procedural gradient environment with sun
  - Irradiance map output for IBL
- **ShadowMapNode**: Dynamic shadow mapping
  - Per-light shadow configuration
  - Directional, spot, and point light shadows
  - Shadow bias and normal bias controls

#### Volumetric Effects
- **VolumetricFogNode**: Atmospheric fog rendering
  - Ray-marched volumetric fog
  - Height-based density falloff
  - Scattering and absorption controls
  - Animation support with wind
- **VolumetricLightNode**: God rays and light shaft effects
  - Radial light scattering from light source
  - Configurable samples, density, and decay
  - Multiple blend modes (add, screen, overlay)
- **VolumeRenderNode**: 3D volume data rendering
  - Ray casting, MIP, average, and isosurface render modes
  - Multiple color maps (grayscale, rainbow, hot, cool)
  - Window/level controls for medical imaging
  - Point cloud output for 3D visualization
- **CloudVolumeNode**: Procedural volumetric clouds
  - Ray-marched volumetric cloud rendering
  - Multi-octave noise for cloud shapes
  - Sun lighting with silver lining effect
  - Wind animation and turbulence

#### Physics Simulation
- **RigidBodyNode**: Rigid body physics simulation
  - Euler integration with Verlet
  - Multiple collision shapes (box, sphere, capsule, cylinder, mesh)
  - Sleep detection for performance
  - External force application
- **SoftBodyNode**: Soft body and deformable physics
  - Mass-spring system with position-based dynamics
  - Structural, shear, and bending springs
  - Ground and collider collision
  - Stress map output for visualization
- **FluidSimNode**: SPH fluid dynamics simulation
  - Smoothed Particle Hydrodynamics (SPH) method
  - Density and pressure computation
  - Viscosity and boundary collision
  - Density and velocity field outputs
- **ClothSimNode**: Cloth and fabric simulation
  - Verlet integration for stability
  - Wind force with turbulence
  - Pinning modes (top edge, corners, custom)
  - Self-collision detection
- **CollisionNode**: Collision detection system
  - AABB broad phase collision
  - Sphere-sphere, sphere-box, box-box narrow phase
  - Trigger and collision event outputs

#### Machine Learning Powered Tools
- **StyleTransferNode**: Neural style transfer
  - Content and style image blending
  - Histogram and luminance color transfer modes
  - Edge-aware stylization
  - Style map output
- **UpscaleNode**: AI-powered image upscaling
  - Bicubic interpolation with enhancement
  - Configurable scale (2x, 4x, 8x)
  - Denoising and sharpening
  - Edge enhancement for detail preservation
- **DenoiseNode**: AI-powered denoising
  - Non-local means filtering
  - Adaptive strength based on noise estimation
  - Detail and color preservation
  - Noise mask output
- **ObjectDetectionNode**: Object detection and segmentation
  - Bounding box and mask detection
  - Non-max suppression (NMS)
  - Configurable confidence threshold
  - Segmentation mask and matte outputs
- **InpaintNode**: Content-aware inpainting
  - PatchMatch-based texture synthesis
  - Mask dilation and feathering
  - Distance-based fill ordering
- **DepthEstimationNode**: Monocular depth estimation
  - Multi-cue depth estimation
  - Multiple color maps (turbo, magma, viridis, inferno)
  - Hole filling and smoothing
  - Point cloud generation

### Changed
- Updated package version from 1.2.0 to 2.0.0
- Enhanced DataType enum to support new node types
- Updated README.md with Version 2.0 features and roadmap
- Added 20 new nodes expanding the total node count to 87

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
