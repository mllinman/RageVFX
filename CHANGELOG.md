# Changelog

All notable changes to RageVFX will be documented in this file.

## [3.11.0] - 2025-12-08

### Added - Version 3.11 Camera Import and Background Card System

RageVFX 3.11 adds comprehensive camera import capabilities from Nuke, Maya, Blender, and commercial cameras, plus a camera-from-video analyzer and a versatile background card system for VFX placement.

#### Camera Import Node
- **CameraImportNode**: Import camera data from multiple professional formats
  - Nuke/NukeX camera import (.nk files with camera node parsing)
  - Maya camera import (.ma, .mb with ASCII/binary support)
  - Blender camera import (.blend, FBX exports)
  - USD/Alembic camera import for pipeline integration
  - Commercial camera metadata (ARRI, RED, Sony, Canon)
  - EXIF/XMP metadata extraction from footage
  - Animation keyframe import with smoothing
  - Coordinate system conversion (Y-up, Z-up)
  - Unit conversion (mm, cm, m, inches, feet)
  - Lens distortion parameter import
  - Focal length and sensor size extraction
  - Frame range and timing controls
  - Camera path generation from keyframes

#### Camera from Video Analysis
- **CameraFromVideoNode**: Analyze video/images and generate matching 3D camera
  - Automatic feature tracking (SIFT, ORB, AKAZE, Shi-Tomasi, FAST)
  - Optical flow and feature matching methods
  - Structure from Motion (SfM) solver
  - Bundle adjustment for camera optimization
  - Essential matrix and homography estimation
  - PnP (Perspective-n-Point) solving
  - Distortion model estimation (Brown, fisheye, polynomial)
  - Principal point estimation
  - Camera path smoothing and stabilization
  - Motion constraint options (planar, vertical, horizontal)
  - Depth prior integration support
  - Feature point cloud generation
  - Tracking statistics and quality reports
  - Reprojection error analysis
  - Multiple camera models (perspective, fisheye, spherical)

#### Background Card System
- **BackgroundCardNode**: Create background planes for VFX placement
  - Multiple modes: 3D, 2D, camera-facing, screen-space
  - Image and video texture support
  - Image sequence playback
  - Automatic aspect ratio preservation
  - Billboard modes (spherical, cylindrical)
  - Screen-space positioning and alignment
  - UV mapping and transformation controls
  - Material blending modes (normal, additive, multiply, screen)
  - Texture filtering and wrapping options
  - Video playback controls (loop, speed, start time)
  - Color correction (brightness, contrast, saturation, hue)
  - Subdivision for mesh deformation
  - Shadow casting and receiving
  - Double-sided rendering option
  - Integration with camera nodes for 2D compositing

**New Node Count**: 179 professional nodes (3 new camera/background nodes)

## [3.10.0] - 2025-12-08

### Added - Version 3.10 VDB Import/Export and Blender Integration

RageVFX 3.10 adds comprehensive OpenVDB import/export tools, procedural VDB nodes for clouds, smoke, fire, water, and snow, plus a professional Blender integration addon.

#### VDB Import/Export Nodes (2 nodes)
- **VDBImportNode**: Import OpenVDB files with full grid support
  - Multi-grid import (density, velocity, temperature, fuel, pressure)
  - Frame sequence support with pattern-based naming
  - Automatic grid detection and parsing
  - Configurable voxel size scaling
  - Memory-efficient caching and streaming
  - Clip bounds and resampling options
  - Preview slice generation
  - Statistics tracking (voxel count, memory usage)

- **VDBExportNode**: Export volumes to OpenVDB files
  - Multiple grid export (density, temperature, velocity, fuel, pressure)
  - Compression options (none, ZIP, Blosc)
  - Half-float precision for reduced file size
  - Frame sequence export for animations
  - Grid type and class specification
  - Metadata embedding with custom properties
  - Transform and voxel size control
  - Inactive voxel pruning for sparse storage

#### Procedural VDB Nodes (5 nodes)
- **VDBCloudNode**: Procedural cloud generation in VDB format
  - Cloud types: cumulus, stratocumulus, cumulonimbus, cirrus, stratus
  - Multi-octave Perlin/Worley noise
  - Detail noise for wispy features
  - Wind and turbulence simulation
  - Density variation and erosion
  - Anvil top for cumulonimbus
  - Height and edge falloff controls
  - Sparse VDB storage with pruning

- **VDBSmokeNode**: Volumetric smoke simulation to VDB
  - Rising smoke with buoyancy
  - Turbulence and swirling effects
  - Temperature-driven advection
  - Dissipation over time
  - Multi-octave turbulent noise
  - VDB fog volume output

- **VDBFireNode**: Fire simulation in VDB format
  - Combustion simulation with fuel, temperature, density
  - Flame height and width controls
  - Flickering and turbulence
  - Burn rate and fuel density
  - Multiple VDB grid outputs
  - Cone-shaped flame profile

- **VDBWaterNode**: Liquid simulation in VDB level set format
  - Level set surface representation
  - Wave simulation with amplitude and frequency
  - Surface tension modeling
  - Velocity field output
  - Narrow band storage
  - Gravity and fluid properties

- **VDBSnowNode**: Snow particle to VDB conversion
  - Falling snow particle system
  - Wind drift and turbulence
  - Snow accumulation
  - Particle rasterization to VDB
  - Density and velocity field outputs
  - Configurable flake size and density

#### Blender Integration Tool
- **RageVFX Blender Addon**: Professional VDB import/export for Blender
  - File menu integration (Import/Export > OpenVDB)
  - VDB import operator with grid selection
  - VDB export operator with compression options
  - Frame sequence support for animations
  - Convert mesh to VDB volume
  - Custom sidebar panel in 3D View
  - VDB settings and grid name mapping
  - Volume properties display
  - Live preview and auto-import options
  - Compatible with Blender 3.0+

### UI Improvements
- Added dedicated "VDB Tools" category in node library
- Modern icons for VDB nodes (📥📤☁️💨🔥💧❄️)
- New node category badge with 🆕 indicator
- Organized VDB nodes separate from general volumetric nodes

### Technical Features
- Full sparse VDB grid support
- Multiple grid types (float, vec3, int32, bool)
- Grid classes (fog, levelset, staggered)
- Compression algorithms (ZIP, Blosc)
- Metadata embedding and custom properties
- Transform and voxel size control
- Memory-efficient streaming for large files
- Frame sequence pattern support (####)

## [3.9.0] - 2025-12-03

### Added - Version 3.9 Enhanced VFX Nodes

RageVFX 3.9 adds comprehensive VFX nodes for realistic blood, muzzle flash, dust effects, and enhances existing explosion and spark nodes with extensive professional settings.

#### New VFX Nodes (3 nodes)
- **BloodSplatterNode**: Realistic blood splatter and spray effects (150+ parameters)
  - Emission modes: continuous, burst, impact
  - Particle types: droplet, spray, splatter, drip, mist with individual physics
  - Advanced physics: gravity, drag, viscosity, bounce, wall collision
  - Drip generation from splatters with pooling simulation
  - Blood aging effects: fresh to coagulated color transitions
  - Subsurface scattering for realistic translucency
  - Motion blur with configurable samples
  - Trail system with fade rate control
  - Impact splatter patterns with radial burst and starburst
  - Pooling system with growth rate and opacity
  - Texture detail: noise, edge roughness, coagulation
  - Performance: max particles, culling with margins

- **MuzzleFlashNode**: Professional gun muzzle flash effects (100+ parameters)
  - Weapon types: rifle, pistol, shotgun, machinegun, cannon, sniper
  - Caliber settings: small, medium, large, heavy
  - Flash components: core flash, secondary flash with delay
  - Blast shapes: starburst, circular, directional, cross with rotation
  - Spark system with trails, gravity, and shell ejection
  - Volumetric smoke with expansion and dissipation
  - Shockwave ring with configurable speed and thickness
  - Heat distortion effects
  - Shell ejection with physics, rotation, and bounce
  - Light emission for background illumination with falloff
  - Glow and bloom effects
  - Advanced: chromatic aberration, filmic response, motion blur
  - Auto-retrigger with timing variation

- **DustNode**: Realistic dust and particle simulation (120+ parameters)
  - Emission modes: continuous, burst, impact, ambient
  - Emitter types: point, line, area, volume
  - Particle types: mote, clump, wisp, cloud, fine with unique behaviors
  - Advanced physics: gravity, drag, air resistance, brownian motion
  - Wind system: speed, direction, gusts, size-based affect
  - Turbulence with 3D Perlin noise and configurable scale
  - Settling behavior with ground interaction and resuspension
  - Depth-based parallax with 3D positioning
  - Volumetric rendering with density layers
  - Lighting system: ambient, diffuse, backlight with direction/elevation
  - Depth of field simulation
  - Level of detail (LOD) system
  - Ground puffing for impact effects
  - Motion blur and particle texture options

#### Enhanced Existing VFX Nodes
- **ExplosionNode**: Enhanced with 60+ parameters
  - Explosion types: standard, fireball, shockwave, nuclear, shaped charge
  - Directional shaped charges with charge direction
  - Shockwave system with speed and intensity
  - Initial flash with configurable intensity and duration
  - Heat distortion effects
  - Ember particles with extended lifetime
  - Mushroom cloud formation with rise speed and spread
  - Light emission with radius and falloff
  - Camera shake output values
  - Advanced particle physics: vorticity, turbulence, radial force
  - Color temperature progression: hot to cool
  - Loop delay for repeated explosions

- **SparkNode**: Enhanced with 70+ parameters
  - Spark types: standard, hot, molten, electric, plasma
  - Emission modes: continuous, burst, arc-weld, grinding
  - Advanced physics: bounce, friction, angular velocity
  - Electric branching with configurable branch count and length
  - Molten effects: glow, drips with chance probability
  - Particle splitting with configurable angle
  - Color progression: start, mid, end with temperature shift
  - Flicker effect with frequency and intensity
  - Trail system with fade rate and width control
  - Glow effects with radius and intensity
  - Motion blur with sample count
  - Performance: max sparks, culling

### Technical Improvements
- All new nodes follow existing RageVFX patterns and conventions
- Extensive parameter sets for maximum artist control
- Seeded random functions for reproducible results
- Efficient particle systems with culling and LOD
- Alpha blending and additive blending for proper compositing
- Perlin noise for realistic turbulence and texture
- Type-safe TypeScript implementations
- Proper resource management and particle lifecycle

## [3.8.0] - 2025-12-02

### Added - Version 3.8 Complete ROADMAP v3.0 Features

RageVFX 3.8 completes the major ROADMAP v3.0 features with Smart Vector motion-aware painting, OpenVDB volume support, and VEX-style procedural wrangles.

#### Nuke-Rivaling Compositing Enhancement (1 node)
- **SmartVectorNode**: Motion-aware painting with motion vector integration
  - Paint effects that stick to motion tracked surfaces
  - Motion vector integration for paint warping
  - Sub-frame interpolation for smooth motion
  - Temporal consistency across frames
  - Paint stroke lifetime management with fade in/out
  - Multiple vector field support
  - Clone source with motion tracking
  - Multiple paint modes: paint, clone, reveal, conceal
  - Brush parameters: size, hardness, opacity, color
  - Motion blur with configurable samples
  - Blend modes: normal, add, multiply, screen, overlay
  - Confidence threshold for reliable tracking
  - Adaptive detail and stroke preservation
  - Outputs: painted image, stroke mask, motion path

#### Houdini-Rivaling Procedural Tools (2 nodes)
- **VDBNode**: Industry-standard OpenVDB sparse volume support
  - VDB file import/export with compression
  - Level set operations: union, intersect, difference
  - Fog volume generation and manipulation
  - VDB filtering and smoothing (Gaussian, median, mean, Laplacian)
  - Particle to VDB conversion with radius control
  - Mesh to VDB conversion (level set and fog modes)
  - VDB to mesh conversion with marching cubes
  - Sparse volume representation for memory efficiency
  - Morphology operations: dilate, erode, open, close
  - Multiple grid types: float, vec3, int32
  - Configurable voxel size and background values
  - Interior and exterior band width controls
  - Adaptivity for mesh conversion quality
  - Density field visualization output

- **WrangleNode**: VEX-style procedural expression control
  - Point, primitive, vertex, detail, and attribute wrangles
  - Custom expression language based on VEX syntax
  - Attribute manipulation with @ notation
  - Built-in math functions: sin, cos, tan, sqrt, pow, etc.
  - Built-in noise functions: noise, fit, clamp, rand
  - Vector operations: length, normalize, dot, cross, distance
  - Interpolation functions: lerp, smooth
  - Geometry modification and deformation
  - Data channel creation and manipulation
  - Code compilation with JavaScript backend
  - Error handling and debugging support
  - Threading support for performance
  - Group and selection filtering
  - Temporal variables: @Time, @Frame
  - Standard attributes: @P, @N, @Cd, @pscale, @v, @id
  - Procedural snippets and presets

- **ProceduralCityNode**: Urban environment generation system
  - Street network generation: L-systems, agent-based, grid, radial, organic
  - Building footprint placement with lot subdivision
  - Procedural building facades with style variants
  - Infrastructure: bridges, tunnels, parking lots, street lights
  - Vegetation and park generation with tree placement
  - Traffic and pedestrian flow simulation
  - Day/night lighting variation
  - Architecture styles: modern, classic, industrial, mixed
  - Building types: residential, commercial, industrial, landmark
  - Configurable city size, density, and block parameters
  - Terrain adaptation and water body integration

- **AdaptiveSamplerNode**: Intelligent rendering with adaptive sampling
  - Variance-based sample distribution
  - Error threshold controls for convergence
  - Noise estimation per pixel with statistical methods
  - Region-based sample budgeting
  - Progressive refinement with multiple passes
  - Stratified sampling for better distribution
  - Firefly suppression and clamping
  - Denoiser integration (bilateral filter)
  - AOV-aware sampling with weighted importance
  - Real-time preview sampling modes
  - Sample and variance map outputs
  - Comprehensive rendering statistics

### Changed
- Updated package version from 3.7.0 to 3.8.0
- Total node count increased from 161 to 166 nodes
- Enhanced ROADMAP v3.0 completion status (80% complete)
- Improved procedural and compositing capabilities
- Added urban environment generation
- Enhanced rendering optimization with adaptive sampling

### Technical Details
- SmartVectorNode uses motion accumulation for precise tracking
- VDBNode implements sparse voxel storage for memory efficiency
- WrangleNode transforms VEX-style code to JavaScript at runtime
- All nodes follow existing TypeScript patterns and conventions
- Proper dispose() methods for resource cleanup
- Integration with existing node registry system

## [3.7.0] - 2025-12-02

### Added - Version 3.7 2D to 3D Stereoscopic Conversion

RageVFX 3.7 introduces professional 2D-to-3D conversion capabilities, making RageVFX extremely competitive with industry tools like Nuke and specialized stereoscopic conversion software.

#### 2D to 3D Conversion System (2 nodes)
- **DepthMapGeneratorNode**: Professional depth map generation from 2D images
  - 7 depth estimation algorithms: edge-based, luminance, contrast, defocus, atmospheric, multi-cue, hybrid
  - Multi-cue algorithm combines multiple depth cues for superior results
  - Edge-based depth: Sobel operator with configurable threshold
  - Luminance-based: Brightness to depth with gamma control and inversion
  - Contrast-based: Local contrast analysis with window size control
  - Defocus-based: Variance analysis for blur-based depth
  - Atmospheric: Haze/fog analysis for distance estimation
  - Edge-preserving bilateral filtering for smooth yet sharp depth maps
  - Gaussian smoothing with adjustable radius
  - User-guided depth hints with blending strength control
  - Depth range normalization with bias and contrast
  - Depth inpainting with diffusion to fill holes
  - 4 visualization modes: grayscale, heatmap, rainbow, terrain
  - Quality presets: low, medium, high, ultra
  - Multiple outputs: depth map, normalized depth, inverted depth, visualized depth

- **StereoConverterNode**: Convert 2D images to stereoscopic 3D using depth maps
  - 5 conversion algorithms: DIBR, simple shift, layered, multi-plane, advanced
  - DIBR (Depth Image Based Rendering) - industry-standard forward warping
  - Intelligent occlusion handling: inpaint, blur, mirror, or none
  - Occlusion inpainting with configurable radius
  - Edge-preserving enhancement using source image
  - Adjustable stereo strength (0-1, percentage of screen width)
  - Convergence distance control (0=near, 1=far)
  - Interaxial distance in meters (default 65mm for human vision)
  - 5 output formats: separate, side-by-side, top-bottom, anaglyph, interlaced
  - 4 anaglyph modes: red-cyan, green-magenta, optimized, Dubois
  - Dubois optimized matrices for superior color reproduction
  - Half-resolution mode for 3D TV compatibility
  - Eye swap for cross-eye viewing
  - Antialiasing and subpixel accuracy options
  - Depth smoothing and contrast adjustment
  - Supersampling (1x, 2x, 4x) for higher quality
  - Fast mode for real-time preview
  - Depth visualization output

#### Competitive Enhancement
- **Industry-Standard 2D to 3D**: Matches capabilities of specialized conversion tools
- **8K+ Compatible**: Works seamlessly with existing 8K+ resolution pipeline
- **Stereoscopic 3D Integration**: Integrates with existing StereoCamera3DNode and StereoCompositorNode
- **Professional Quality**: DIBR algorithm with occlusion handling matches industry standards
- **Artist-Friendly**: User hints and multiple quality presets for production workflows

### Changed
- Updated package version from 3.6.0 to 3.7.0
- Total node count increased from 159 to 161 nodes
- Enhanced stereoscopic 3D workflow with conversion capabilities
- Extended 8K+ support with depth-based stereo conversion

### Technical Details
- Depth estimation uses multiple computer vision algorithms
- DIBR forward warping with depth-based pixel shifting
- Bilateral filtering preserves edges while smoothing depth
- Inpainting fills disocclusions using diffusion algorithm
- Dubois matrices provide optimal anaglyph color reproduction
- All algorithms optimized for real-time processing
- Memory-efficient processing for 8K+ resolutions

## [3.6.0] - 2025-12-01

### Added - Version 3.6 Cinema 4D, Blender, Maya, and Fusion Tools

RageVFX 3.6 introduces comprehensive tools from Cinema 4D (MoGraph), Blender (Geometry Nodes & Physics Particles), Maya (Ocean Modifier), and Fusion (Dual Viewer System), plus a complete VFX Asset Database.

#### Cinema 4D-Style MoGraph Tools (2 nodes)
- **MoGraphClonerNode**: Professional cloner for procedural duplication
  - 7 distribution modes: linear, radial, grid, honeycomb, spline, random, object
  - Per-clone transformation (position, rotation, scale)
  - Built-in step effector for progressive changes
  - Color variation (gradient, random, index-based)
  - Spline path following with auto-alignment
  - Instance optimization for performance
  - Matrix data output for rendering
  - Global transform controls

- **MoGraphEffectorNode**: Modify clones with various effector types
  - 7 effector types: random, shader, formula, time, plain, target, volume
  - Random effector with seeded randomization
  - Shader effector with texture/channel mapping
  - Formula effector with expression evaluation (sin, cos, custom math)
  - Time-based animation with multiple modes
  - Target effector with look-at functionality
  - Falloff system (linear, smooth, sphere, box, cylinder)
  - Noise and turbulence modifiers
  - Blend modes (add, multiply, override, min, max)

#### Blender-Style Tools (2 nodes)
- **GeometryNodesNode**: Procedural geometry manipulation system
  - 8 operation modes: transform, extrude, subdivide, bevel, scatter, boolean, curve_to_mesh, primitives
  - Transform with rotation, scale, translation
  - Mesh operations (extrude, subdivide, bevel)
  - Point scatter with Poisson disk, grid, random modes
  - Primitive generation (cube, sphere, cylinder, plane, grid, torus, cone)
  - Attribute operations (set, add, multiply, mix)
  - Selection modes (all, vertices, edges, faces, random, bounding_box)
  - Noise displacement with octaves
  - Curve to mesh conversion

- **PhysicsParticlesNode**: Advanced physics-based particle system
  - 3 particle types: emitter, hair, reactor
  - 3 physics types: Newtonian, boids, fluid
  - Emission from vertices, faces, or volume
  - Configurable lifetime and size with randomization
  - Initial velocity (normal, tangent, random, object, system)
  - Force fields: gravity, wind, vortex, turbulence
  - Collision detection with bounciness and friction
  - Rotation with angular velocity
  - Color fading over particle lifetime
  - Cache system for animation playback
  - Children particles (simple, interpolated)

#### Maya-Style Tools (1 node)
- **OceanModifierNode**: FFT-based ocean surface generation
  - Gerstner wave synthesis with multiple components
  - Wave parameters: scale, speed, direction, chopiness
  - 3 spectrum types: Phillips, JONSWAP, Pierson-Moskowitz
  - Foam generation based on wave curvature
  - Displacement, foam, and normal map outputs
  - Small wave detail layers
  - Wind speed and alignment controls
  - Configurable resolution (power of 2)
  - Time controls with looping support
  - Horizontal displacement for realistic chop

#### Fusion-Style Viewer (1 component)
- **FusionViewer**: Professional dual viewer system
  - 7 view modes: single, dual, quad, A/B compare, wipe, difference, onion skin
  - 6 channel modes: RGB, Red, Green, Blue, Alpha, Luminance
  - Interactive wipe slider for A/B comparison
  - Grid overlay with customizable spacing
  - Composition guides (center cross, rule of thirds)
  - Safe area visualization
  - Zoom controls (25%, 50%, 100%, 200%, 400%, Fit)
  - Pan support (middle mouse button or Alt+drag)
  - Pixel color readout at cursor position
  - Status bar with resolution, pixel info, zoom level
  - Customizable toolbar with button states

#### VFX Asset Database (1 node)
- **VFXAssetDatabaseNode**: Complete asset management system
  - 6 asset types: texture, model, material, preset, HDRI, LUT
  - Automatic thumbnail generation
  - Tag-based organization and search
  - Advanced filtering (type, category, rating, date, tags)
  - Multiple sort modes (name, date, rating, usage, size)
  - Collection management (create, organize, favorites)
  - Asset metadata (resolution, format, color space, author, description)
  - Usage tracking and rating system
  - Auto-tagging based on filename analysis
  - Import/export database (JSON format)
  - 3 view modes: grid, list, detail
  - Pagination for large asset libraries
  - Cache management with size limits

### Changed
- Updated package version from 3.5.0 to 3.6.0
- Extended industry competition table to include Cinema 4D, Blender, and Fusion
- Total node count now exceeds 155 nodes
- Enhanced description to highlight multi-application feature parity

### Technical Details
- All new nodes follow existing TypeScript patterns
- Proper dispose() methods for memory cleanup
- Consistent parameter naming and structure
- Integration with existing node registry system
- Web-based Fusion viewer with Canvas API
- Asset database with Map-based indexing for performance

## [3.5.0] - 2025-11-29

### Added - Version 3.5 Motion Graphics & Animation Tools

RageVFX 3.5 introduces comprehensive motion graphics capabilities similar to After Effects, advanced array tools, timeline transitions, and a professional curve editor for animation control similar to Maya's Graph Editor.

#### Motion Graphics System (2 nodes)
- **MotionGraphicsNode**: Complete motion graphics creation system
  - Shape layer support: rectangle, ellipse, polygon, star, path, text
  - Position, rotation, scale, and opacity animation
  - Motion path following with Catmull-Rom spline interpolation
  - Orient-to-path option for automatic rotation
  - Animation presets: fadeIn, fadeOut, scaleUp, scaleDown, slideIn, slideOut, bounce, elastic, spin
  - Four easing modes: linear, smooth, stepped, bezier
  - Multiple blend modes: normal, add, multiply, screen, overlay
  - Full stroke and fill color control
  - Corner radius support for rounded rectangles
  - Real-time animation preview

- **ArrayModifierNode**: Advanced array tool similar to Cinema 4D/After Effects
  - Five array modes: linear, radial, grid, spiral, random
  - Linear array with position, rotation, scale, and opacity offset
  - Radial array with center position, radius, angle range, and orient-to-center
  - Grid array with X/Y count, spacing, and stagger offset
  - Spiral array with expansion rate and turn count
  - Random array with seeded randomization for position, rotation, and scale
  - Color variation modes: gradient, random, hue shift
  - Animation support with stagger delay
  - Instance data output for external use
  - Global transform controls

#### Timeline Transitions (1 node)
- **TransitionNode**: Professional timeline transitions between edits
  - 17 transition types: smooth, linear, stepped, custom, easeIn, easeOut, easeInOut, bounce, elastic, back, expo, circ, sine, quad, cubic, quart, quint
  - 14 visual effects: cut, dissolve, fade, wipe, slide, zoom, iris, push, reveal, morph, blur, pixelate, swirl, glitch
  - Custom bezier curve support for precise timing control
  - Wipe transitions with angle and softness control
  - Slide transitions with directional control (left, right, up, down)
  - Iris transitions with shape options (circle, diamond, square, star)
  - Zoom transitions with center position control
  - Blur and pixelate transitions with intensity control
  - Elastic easing with amplitude and period parameters
  - Back easing with overshoot control
  - Reverse transition option

#### Animation Curve Editor (1 node)
- **CurveEditorNode**: Maya-style animation curve editor
  - Full bezier curve animation control
  - Tangent types: auto, smooth, linear, stepped, flat, free, clamped, plateau
  - Infinity types: constant, linear, cycle, cycleOffset, oscillate
  - Weighted tangent support with in/out weight control
  - Lock/unlock tangents for unified or broken control
  - Curve evaluation with value, velocity, and acceleration output
  - Pre/post infinity behavior for animation looping
  - Bake curve to keyframes functionality
  - Curve simplification with tolerance control
  - Catmull-Rom style auto-tangent calculation
  - Plateau tangent mode for peaks/valleys
  - JSON serialization for curve data
  - Multi-curve support with color coding

#### Extended Timeline Features
- **New Easing Types**: 13 new easing types added to the timeline system
  - smooth: Hermite smooth interpolation
  - stepped: Hold value until next keyframe
  - custom: User-defined bezier curve
  - back: Overshoot easing
  - expo: Exponential easing
  - circ: Circular easing
  - sine: Sinusoidal easing
  - quad: Quadratic easing
  - cubic: Cubic easing
  - quart: Quartic easing
  - quint: Quintic easing

#### UI/UX Improvements
- New node categories: "MotionGraphics" and "Animation"
- Category colors for Motion Graphics (pink #ff6b9d) and Animation (purple #9966ff)
- Node category detection for new nodes
- Enhanced node palette organization

### Changed
- Updated package version from 3.4.0 to 3.5.0
- Extended EasingType enum with 13 new easing types
- Total node count now exceeds 130 nodes

## [3.4.0] - 2025-11-28

### Added - Version 3.4 Advanced VFX, Backdrops, & Professional Polish

RageVFX 3.4 introduces new VFX effect nodes, a comprehensive backdrop system for node organization, enhanced color coding, expanded settings, and professional UI improvements.

#### New VFX Effects (4 nodes)
- **GlitchNode**: Digital glitch and distortion effects
  - Block-based glitching with customizable block sizes
  - RGB channel shift and color separation
  - Scan line effects with adjustable intensity
  - Wave distortion for organic glitch movement
  - Chromatic aberration simulation
  - Random noise injection
  - Speed and intensity controls

- **EnergyFieldNode**: Energy field and force field effects
  - Multiple field patterns: hexagonal, grid, circular, organic
  - Primary and secondary color customization
  - Adjustable glow intensity and edge sharpness
  - Pulsing animation with speed control
  - Turbulent noise overlay for organic feel
  - Perfect for sci-fi shields and magical barriers

- **MagicParticlesNode**: Magical sparkles and fairy dust particles
  - Particle system with customizable emission rate
  - Configurable particle life, size, and speed
  - Hue range selection for color variety
  - Trail rendering with adjustable length
  - Twinkle effect with speed control
  - Emitter position and size configuration
  - Gravity and spread controls

- **TimeWarpNode**: Temporal effects including echo, motion trails, and time displacement
  - Echo mode with frame decay and offset
  - Trail mode with blend modes (add, screen, overlay)
  - Displacement mode with radial, directional, and wave options
  - Stroboscopic mode for freeze-frame effects
  - Color shift option for rainbow trails
  - Frame buffer system for temporal effects

#### Professional Tools (2 nodes)
- **TextOverlayNode**: Professional text overlay with effects
  - Full font customization (family, size, weight, style)
  - Position and alignment controls
  - Stroke and shadow effects
  - Glow effect with color control
  - Rotation and scale transforms
  - Perfect for titles, watermarks, and HUD elements

- **ColorMatchNode**: Color matching between images
  - Multiple matching methods: histogram, Reinhard, Pitié
  - Strength control for subtle adjustments
  - Preserve luminance option
  - Shadow, midtone, and highlight matching
  - Mask input for selective color matching

#### Backdrop System
- **Customizable Backdrops**: Group and organize nodes visually
  - Create backdrops around selected nodes
  - Customizable label, color, and font size
  - Drag to move and resize handles
  - Lock/unlock capability for protection
  - Z-index layering for backdrop stacking
  - Title bar with backdrop name
  - Edit backdrop modal for properties
  - Context menu integration

#### Enhanced Color Coding
- **Comprehensive Node Color System**: 
  - VFX nodes (Fire/Explosion): Red (#ff4444)
  - VFX nodes (Water/Ice): Blue (#4488ff)  
  - VFX nodes (Magic/Energy): Purple (#aa44ff)
  - VFX nodes (Tech/Cyber): Cyan (#00dddd)
  - Color nodes: Green (#44cc88)
  - Filter nodes: Blue (#4488ff)
  - Composite nodes: Purple (#aa44ff)
  - 3D nodes: Orange (#ff8844)
  - Physics nodes: Pink (#dd4488)
  - ML nodes: Cyan (#44dddd)
  - Tracker nodes: Yellow (#ffdd44)
  - Utility nodes: Gray (#888888)
  - Input nodes: Green (#44bb44)
  - Output nodes: Orange (#ff9944)
  - Stereo nodes: Magenta (#ff00ff)
  - Category header color indicators

#### Expanded Viewport Settings
- **3D Viewport Enhancements**:
  - Ground plane toggle
  - Ambient occlusion option
  - Wireframe overlay mode
  - Bounding boxes display
  - Transform gizmo size adjustment
  - Grid snap with configurable size
  - Shading modes: solid, wireframe, material, rendered
  - Background options: gradient, solid color, HDRI, transparent
  - Crane speed control
  - Smooth camera toggle
  - Selection highlight option

- **Viewport API Enhancements**:
  - setShadingMode() for mesh display modes
  - setBackground() for viewport background
  - frameSelected() for focus on selection
  - frameAll() for focus on entire scene
  - setShadowsEnabled() and setShadowQuality()
  - showBoundingBoxes() for visualization
  - getSceneStats() for object/vertex/triangle counts

#### UI Polish & Improvements
- Enhanced button ripple effects
- Smooth scrolling for all panels
- Enhanced focus states for accessibility
- Property input styling improvements
- Quick-add node tooltip framework
- Version badge styling
- Node type badge on hover
- Professional loading overlay styles

## [3.3.0] - 2025-11-28

### Added - Version 3.3 8K+ Resolution & Stereoscopic 3D Support

RageVFX 3.3 introduces comprehensive 8K+ resolution support, professional stereoscopic 3D workflow, and advanced 3D object manipulation tools with WASD controls and keyframe animation.

#### 8K+ Ultra High Resolution Support (1 node)
- **Resolution8KNode**: Ultra-high resolution pipeline support from HD to 16K+
  - 35+ resolution presets including HD, 2K, 4K, 6K, 8K, 10K, 12K, 16K
  - Cinema formats: Flat, Scope, DCI, Full for all resolutions
  - IMAX Digital and IMAX Laser support
  - VR/360 formats: VR 4K, VR 8K, 360 Stereo 8K
  - Social media presets: Instagram, TikTok, YouTube
  - Tiled rendering for memory-efficient 8K+ processing
  - Advanced scaling methods: nearest, bilinear, bicubic, Lanczos
  - Automatic tile overlap blending for seamless output
  - Sharpening and antialiasing options
  - GPU acceleration support
  - Progressive refinement for preview
  - Memory usage estimation

#### Stereoscopic 3D Workflow (2 nodes)
- **StereoCamera3DNode**: Professional stereoscopic 3D camera rig
  - 8 stereo presets: Human Vision (65mm), Cinema Standard (63.5mm), IMAX 3D (75mm), VR Headset (64mm), Macro Stereo (20mm), Architectural (100mm), Aerial/Landscape (300mm), Miniature (10mm)
  - Stereo modes: toe-in, parallel, off-axis
  - Interaxial distance and convergence distance controls
  - Eye swap for cross-eye viewing
  - Horizontal and vertical image translation
  - Depth budget controls (positive/negative parallax limits)
  - Comfort zone warnings
  - Output formats: separate, side-by-side, top-bottom, anaglyph

- **StereoCompositorNode**: Stereoscopic 3D compositing and output
  - Output formats: separate, side-by-side, top-bottom, anaglyph, interlaced, checkerboard
  - Half-width/height mode for 3D TVs
  - 7 anaglyph modes: red-cyan, green-magenta, amber-blue, true-anaglyph, gray-anaglyph, optimized, Dubois
  - Dubois optimized matrices for accurate color reproduction
  - Floating window (stereo masking) controls
  - Depth-based color grading
  - Stereo adjustment controls: horizontal/vertical offset, convergence adjustment, depth strength
  - Real-time anaglyph preview

#### 3D Object Manipulation Tools (1 node)
- **Transform3DNode**: Professional 3D object transformation
  - Transform modes: translate, rotate, scale
  - Transform spaces: world, local, view, screen
  - Snap controls for translation, rotation, and scale
  - Pivot modes: center, origin, bounding box, cursor, custom
  - Euler and quaternion rotation support
  - Multiple rotation orders: XYZ, XZY, YXZ, YZX, ZXY, ZYX
  - Uniform and non-uniform scaling
  - Transform constraints per axis
  - Min/max limits for translation and scale
  - Look-at target support

#### Screenspace Manipulation & Interactive Controls
- **WASD Object Controls**: Move selected objects in 3D scene
  - W/A/S/D for forward/left/backward/right movement
  - Q/E for up/down movement
  - Shift modifier for faster movement (3x)
  - Alt modifier for precision movement (0.1x)
  - G key for translate mode (grab)
  - R key for rotate mode
  - T key for scale mode

- **F Key Keyframe**: Set keyframe on timeline for selected object
  - Records position, rotation, and scale
  - Integration with timeline system
  - Visual feedback on keyframe creation

- **View Through Camera**: Look through scene camera
  - Toggle view-through-camera mode in 3D viewport
  - Maintains camera aspect ratio
  - Useful for shot composition

- **Object Selection**: Click to select 3D objects
  - Visual selection highlight (BoxHelper)
  - Raycasting for accurate object picking
  - Escape to deselect
  - Selection callback for external integrations

#### UI/UX Improvements
- New node category: "8K+ Resolution & Stereo 3D"
- Transform tools bar in 3D viewport
- WASD control hint text in viewport
- View through camera checkbox
- Keyframe button in viewport controls
- Resolution badges for different quality levels
- Stereo indicator with gradient styling

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
