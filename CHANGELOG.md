# Changelog

All notable changes to RageVFX will be documented in this file.

## [3.2.0] - 2025-11-27

### Added - Version 3.2 Complete Feature Release

RageVFX 3.2 introduces comprehensive projection mapping and painting, fluid physics, 3D camera tracking, model import/export, and a robust settings system.

#### Projection Mapping & Painting System (Mari-like) (1 node)
- **ProjectionPaintNode**: Complete projection painting system for 3D texturing
  - Multi-layer painting with 16+ blend modes (normal, multiply, screen, overlay, etc.)
  - Projection modes: perspective, orthographic, cylindrical, spherical, planar, triplanar
  - Brush system with pressure sensitivity, size dynamics, hardness, flow, spacing
  - Paint modes: paint, project, clone, fill, erase
  - UV/UDIM support with multiple channels
  - Normal map and displacement map generation
  - Undo/redo with configurable history
  - Up to 4K/8K texture resolution support
  - Real-time preview and GPU acceleration
  - Symmetry modes: X, Y, Z, radial

#### 3D Object Import/Export System (2 nodes)
- **ModelImportNode**: Import 3D models from various formats
  - Formats: OBJ, FBX, glTF/GLB, USD/USDA/USDC, Alembic, DAE, 3DS, STL, PLY
  - Import options: materials, animations, skeleton, cameras, lights
  - Geometry processing: normal computation, tangent generation, vertex merging
  - Transform options: scale, up axis conversion, center pivot
  - LOD generation support
  - UV channel management

- **ModelExportNode**: Export 3D models and textures
  - Export formats: glTF/GLB, OBJ, FBX, USD, STL, PLY, DAE
  - DRACO/Meshopt compression for glTF
  - Material and texture embedding
  - Animation baking
  - LOD export

#### 3D Camera Tracking and Creation (3DSMax/Maya-like) (2 nodes)
- **Camera3DTrackingNode**: 3D camera tracking from footage
  - Automatic feature detection (SIFT, ORB, AKAZE, Harris, Shi-Tomasi)
  - Feature tracking with bidirectional verification
  - Camera model support: perspective, fisheye, spherical
  - Lens distortion models: Brown-Conrady, fisheye
  - Bundle adjustment optimization
  - Ground plane detection and scene orientation
  - Point cloud generation
  - Camera path smoothing
  - Solve quality reporting with recommendations
  - Export to FBX, Alembic, Maya, Nuke

- **RealWorldCameraNode**: Create camera based on real-world camera and lens
  - 14 camera body presets: ARRI ALEXA 35, ARRI ALEXA LF, RED V-RAPTOR XL 8K, RED KOMODO 6K, Sony VENICE 2 8K, Sony FX6, Blackmagic URSA Mini Pro 12K, Canon EOS C70, Canon EOS C500 Mark II, Full Frame 35mm, Super 35mm, APS-C, Micro Four Thirds
  - 10 lens presets: ARRI Signature Prime (35mm, 50mm), Zeiss Master Prime (25mm, 75mm), Cooke Anamorphic 40mm, Panavision Primo 70mm, Atlas Orion 1.33x 40mm, Generic Prime (24mm, 85mm), Generic Zoom 24-70mm
  - Complete lens characteristics: distortion coefficients, chromatic aberration, vignette, blade count/curvature
  - Exposure control: aperture, shutter angle/speed, ISO, exposure compensation
  - Depth of field calculation with circle of confusion
  - Focus settings with hyperfocal distance calculation
  - Physical camera motion simulation: handheld, breathing
  - Film back settings with gate presets

#### Fluid Physics System (Maya-like) (2 nodes)
- **FluidPhysicsNode**: Complete Eulerian fluid dynamics
  - Fluid types: smoke, fire, liquid, pyro
  - Solver types: Eulerian, FLIP, hybrid
  - Grid resolution up to 256³
  - Navier-Stokes based pressure solver
  - Vorticity confinement for turbulent detail
  - Combustion system for fire with fuel, burn rate, heat generation
  - Advection for density, velocity, temperature, smoke
  - Buoyancy forces (temperature and density based)
  - Turbulence with noise parameters
  - Configurable boundaries: solid, open, periodic
  - Emitter system with position, size, velocity, temperature
  - Time scaling and substeps control
  - Real-time preview

- **FluidCacheNode**: File caching for fluid simulations
  - Cache formats: OpenVDB, Field3D, raw binary
  - Compression: none, BLOSC, ZIP, LZ4
  - Per-channel caching: density, velocity, temperature, smoke, fuel
  - Memory cache with configurable frame count
  - Background async read/write
  - Cache validation and statistics
  - Max cache size management
  - Frame range and offset support
  - Version control for cache files

#### Robust Settings Tab
- **Comprehensive Settings Modal** on main menu bar
  - 13 settings categories with extensive customization:
    - **General**: Language, time format, auto-save, undo history
    - **Appearance**: Theme, accent color, UI scale, font size, node editor style
    - **Performance**: GPU settings, memory limits, threading, preview quality
    - **Project**: Resolution presets, frame rate, bit depth, frame range
    - **Rendering**: Output format, quality presets, anti-aliasing, path tracing settings
    - **Physics**: Fluid resolution, substeps, time scale, cache settings, gravity
    - **Camera**: Default camera/lens, tracking quality, lens profiles
    - **Viewport**: Grid, axes, shadows, camera control speeds
    - **Timeline**: Playback settings, keyframe interpolation, auto-key
    - **Caching**: Disk/memory cache settings, cache management
    - **Color Management**: Working/display color space, OCIO config, view transform
    - **Shortcuts**: Customizable keyboard shortcuts
    - **Advanced**: Debug mode, experimental features, reset options
  - Settings persistence and import/export
  - Apply/Save/Cancel functionality

#### UI/UX Improvements
- New node categories in Node Library: Projection & Painting, Camera & Tracking, 3D Import/Export
- Updated node category colors with Projection category
- Enhanced settings button in menu bar

## [3.1.0] - 2025-11-27

### Added - Version 3.1 Complete Feature Release

RageVFX 3.1 introduces a comprehensive suite of professional features including advanced physics engine, pipeline collaboration tools, and extended machine learning capabilities.

#### Built-in Physics Engine (2 nodes)
- **PhysicsEngineNode**: Complete physics simulation engine
  - Static/Dynamic object toggle - any object can switch between static and dynamic
  - Dynamic objects interact, bounce off, and are affected by static objects
  - Static objects do not react to physics unless made dynamic
  - 70+ slider/checkbox controls for intuitive control

- **PhysicsWorldNode**: Global physics world management
  - World-wide physics settings
  - Global gravity, time scale, and solver controls
  - Debug visualization options

#### Pipeline & Collaboration (5 new nodes)
- **USDNode**: Universal Scene Description import/export
  - USD file import/export (usda, usdc, usdz)
  - Stage and layer management
  - Layer composition and references
  - Variant sets support
  - Time sampling for animation
  - Asset resolution

- **AlembicNode**: Alembic geometry caching
  - Alembic file import/export
  - Geometry caching with streaming
  - Camera and transform support
  - Point cloud and curve support
  - Archive compression

- **PipelineManagerNode**: Shot/asset management
  - Shot management with versioning
  - Asset tracking and linking
  - Task management and status
  - Publish/subscribe workflow
  - Path templates for work/publish files
  - Integration ready for ShotGrid, ftrack, Kitsu

- **ReviewToolNode**: Built-in review and annotation
  - Frame-accurate annotation tools
  - Drawing tools (brush, line, shape, text)
  - Version comparison (A/B, wipe, onion skin)
  - Review status and approval workflow
  - Comment threading
  - Export annotations (JSON, PDF, HTML)

- **VersionControlNode**: Git-based version control
  - Full git integration
  - Branch management
  - Commit history and diff
  - LFS support for large files
  - Remote sync (push/pull/fetch)

#### Extended Machine Learning (5 new nodes)
- **NeuralNetTrainerNode**: Train custom neural networks (CopyCat-like)
  - Multiple architectures (UNet, ResNet, Autoencoder)
  - Data augmentation
  - Training visualization with loss graphs
  - Transfer learning support
  - Model export (ONNX, TensorFlow, PyTorch)
  - Hyperparameter tuning

- **SegmentAnythingNode**: AI-powered instant segmentation
  - Point-based prompting
  - Box-based prompting
  - Automatic mask generation
  - Multi-mask output
  - Real-time preview
  - Mask refinement

- **BackgroundRemovalNode**: One-click background removal
  - Multiple removal algorithms (rembg, u2net, modnet)
  - Edge refinement with defringing
  - Alpha matte generation
  - Background replacement
  - Temporal stability for video

- **FaceEnhancementNode**: AI face restoration
  - Face detection and alignment
  - Super resolution for faces
  - Skin retouching
  - Eye and teeth enhancement
  - Age modification
  - Expression transfer
  - Makeup application

- **MotionPredictionNode**: AI motion prediction
  - Frame interpolation (RIFE, FILM, IFRNet)
  - Slow motion generation (2x-16x)
  - Motion prediction
  - Optical flow estimation
  - Occlusion handling
  - Temporal consistency

#### Core Improvements
- Added MASK and ANIMATION data types for better node communication
- Updated DataType enum with AUDIO type for future audio support
- Total node count now exceeds 120 nodes
- Enhanced node category organization

### Changed
- Version bump from 3.0.0 to 3.1.0
- Updated package description with pipeline and ML features
- Expanded node registry with 12 new nodes

## [3.0.0] - 2025-11-27

### Added - Version 3.0 Industry Competition Release

RageVFX 3.0 introduces industry-rivaling features targeting Nuke, Houdini, and Redshift/V-Ray capabilities.

#### Nuke-Rivaling Compositing Nodes (2 new nodes)
- **MultiShotNode**: Nuke-style multishot workflow with graph scope variables
  - Graph scope variable propagation across shots
  - Shot versioning and variant management
  - Expression linking with built-in math functions
  - Batch processing with parallel execution
  - Template-based shot creation
  - JSON export/import for pipeline integration
  - Production-ready multishot workflows

- **IBKKeyerNode**: Advanced IBK-style keying matching Nuke's IBK
  - Screen color auto-sampling with picker
  - Adaptive algorithm for uneven screens
  - Multiple keying algorithms (simple, adaptive, ibk_color, ibk_gizmo)
  - Edge color correction with grow/shrink
  - Core matte generation with erosion/blur
  - Multi-pass spill suppression (average, max, min, replacement)
  - Status keyer output for QC
  - Clean plate support for better edge handling

#### Houdini-Rivaling Procedural Nodes (2 new nodes)
- **ProceduralTerrainNode**: Procedural terrain generation matching Houdini
  - Multi-octave noise terrain (simplex, perlin, FBM, ridged, voronoi)
  - Hydraulic and thermal erosion simulation
  - Biome classification based on height and moisture
  - River carving and water body detection
  - Procedural vegetation scatter with biome awareness
  - Normal map and erosion map outputs
  - Real-world scale terrain generation
  - Seed-based reproducible generation

- **CrowdSimNode**: Agent-based crowd simulation like Houdini Crowds
  - Multiple agent types with state machines
  - State transitions with probability-based triggers
  - Steering behaviors (separation, cohesion, alignment)
  - Goal seeking and flow field navigation
  - Obstacle avoidance with terrain slope detection
  - Spatial hash for efficient neighbor queries
  - LOD support for massive crowds
  - Visualization output for debugging
  - Instance matrix output for rendering

#### Redshift/V-Ray-Rivaling Rendering Nodes (2 new nodes)
- **PathTracerNode**: Production-quality unbiased path tracing
  - Physically-based path tracing core
  - Multiple importance sampling (MIS)
  - Next event estimation (NEE) for direct lighting
  - Russian roulette termination for efficiency
  - Depth of field with aperture and focus distance
  - Progressive rendering with accumulation
  - ACES, Reinhard, and Filmic tone mapping
  - Environment map sampling with rotation
  - Clamp value to prevent fireflies
  - PBR material support

- **LightMixerNode**: Interactive light mixing like V-Ray Light Mix
  - Post-render light intensity adjustment
  - Per-light color modification
  - Light group management with master controls
  - Solo/mute functionality for individual lights
  - Environment, GI, emission, and caustics control
  - Shadow intensity and color adjustment
  - Preset saving and loading
  - Preset interpolation for animation
  - JSON export/import of light mix settings
  - Color space conversion (linear, sRGB, ACES)

#### Documentation
- **ROADMAP.md**: Comprehensive competitive analysis and development roadmap
  - Feature comparison with Nuke, Houdini, Redshift, V-Ray
  - Detailed node specifications for v3.1 and v3.2
  - Development priority matrix
  - Implementation timeline through Q4 2025

### Changed
- Version bump from 2.3.0 to 3.0.0
- Updated package description to reflect industry-rivaling capabilities
- Expanded node registry with 6 new professional nodes
- Total node count now exceeds 105 nodes

## [2.3.0] - 2025-11-27

### Added - Version 2.3 Professional VFX Expansion

#### Advanced VFX Nodes (10 new nodes)
- **AnamorphicFlareNode**: Professional anamorphic lens flare with horizontal streaks
  - Chromatic aberration and color shifts
  - Starburst patterns and flare elements
  - Configurable streak count and spacing
  - Bloom and glow effects

- **NebulaNode**: Procedural space nebula and cosmic cloud effects
  - Multi-octave turbulent noise for structure
  - Primary, secondary, and emission colors
  - Star field generation with twinkling
  - Dust lane simulation

- **ShockwaveNode**: Expanding shockwave distortion effects
  - Multiple wave support with configurable delay
  - Chromatic aberration on distortion
  - Edge glow effects
  - Mask output for compositing

- **PlasmaNode**: Procedural plasma and energy effects
  - Multi-frequency wave patterns
  - Three-color gradient cycling
  - Electric arc generation
  - Flow direction and turbulence controls

- **PortalNode**: Dimensional portal and wormhole effects
  - Spiral vortex with configurable arms
  - Energy particle effects
  - Inner portal view warping
  - Ring patterns and pulsation

- **HologramNode**: Sci-fi holographic display effects
  - Scan lines and interlacing
  - Glitch and flicker effects
  - Chromatic aberration
  - Edge detection glow

- **CausticsNode**: Water caustic light patterns
  - Voronoi-based caustic generation
  - Multi-layer animation
  - Refraction displacement
  - Multiple blend modes

- **AuroraNode**: Northern lights / Aurora Borealis effects
  - Animated curtain patterns
  - Color cycling with three colors
  - Star field with twinkling
  - Vertical wave distortion

- **HeatDistortionNode**: Heat shimmer distortion effects
  - Multi-octave wave distortion
  - Gradient or mask-based regions
  - Chromatic aberration
  - Motion blur simulation

- **DebrisNode**: Particle debris and destruction effects
  - Multiple particle shapes
  - Physics simulation with gravity and drag
  - Motion blur trails
  - Glow effects for hot debris

#### Professional Compositing Nodes (3 new nodes)
- **DeepCompositeNode**: Deep compositing with per-pixel depth
  - Depth-aware merging
  - Multiple merge modes (depth, over, under, plus)
  - Anti-aliasing and edge blending
  - Holdout support

- **CryptomatteNode**: Cryptomatte ID matte extraction
  - Interactive object picking
  - Anti-aliased matte edges
  - Multiple crypto pass support
  - Color and grayscale preview modes

- **AOVManagerNode**: Arbitrary Output Variable manager
  - 12 standard AOV inputs
  - Configurable layer blending
  - Global exposure, gamma, saturation
  - AO and shadow integration

#### Professional Color Grading Nodes (2 new nodes)
- **LUTLoaderNode**: Look-Up Table loader for color grading
  - 3D LUT support with trilinear interpolation
  - 11 built-in preset looks
  - Log/linear color space conversion
  - Intensity blending

- **CDLNode**: ASC Color Decision List grading
  - Slope, Offset, Power controls per channel
  - Saturation adjustment
  - Forward and inverse processing
  - Multiple working color spaces
  - CDL XML export

#### UI/UX Improvements
- Added 7 new category colors for better visual organization
- Enhanced node categorization with new categories:
  - Tracker, Utility, Transform, Generator, Output, Camera
- Extended VFX glow effects to new node types
- Improved node search and filtering

### Changed
- Version bump to 2.3.0
- Updated node registry with 15 new professional nodes
- Enhanced web renderer with expanded category support

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
