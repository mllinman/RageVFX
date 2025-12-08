# RageVFX OpenVDB Guide

Complete guide to using OpenVDB import/export and procedural VDB tools in RageVFX 3.10

## Table of Contents

1. [Introduction](#introduction)
2. [VDB Import Node](#vdb-import-node)
3. [VDB Export Node](#vdb-export-node)
4. [Procedural VDB Nodes](#procedural-vdb-nodes)
5. [Blender Integration](#blender-integration)
6. [Workflow Examples](#workflow-examples)
7. [Performance Tips](#performance-tips)
8. [Troubleshooting](#troubleshooting)

## Introduction

OpenVDB is an industry-standard format for storing volumetric data developed by DreamWorks Animation. RageVFX 3.10 provides comprehensive VDB support including:

- **Import/Export**: Read and write .vdb files with multiple grids
- **Procedural Generation**: Create clouds, smoke, fire, water, and snow volumes
- **Blender Integration**: Seamless workflow between RageVFX and Blender
- **Optimization**: Sparse storage, compression, and streaming for large datasets

### What is OpenVDB?

OpenVDB uses a hierarchical tree structure to store volumetric data efficiently:
- **Sparse Storage**: Only active voxels are stored (not empty space)
- **Multiple Grids**: Single file can contain density, velocity, temperature, etc.
- **Level Sets**: Signed distance fields for surfaces
- **Fog Volumes**: Density fields for volumetric rendering

## VDB Import Node

The VDB Import Node loads .vdb files into RageVFX.

### Basic Usage

1. Add VDB Import node to your graph
2. Set the `filepath` parameter to your .vdb file
3. Connect outputs (density, velocity, temperature) to downstream nodes

### Parameters

#### File Settings
- **filepath**: Path to .vdb file
- **autoLoad**: Automatically load on parameter change
- **frameSequence**: Enable for animated sequences
- **frame**: Current frame number
- **framePattern**: Pattern for sequences (e.g., `####` for 4-digit padding)

#### Grid Selection
- **loadAllGrids**: Import all grids or selected only
- **selectedGrids**: Array of grid names to load
- **densityGrid**: Name of density grid (default: "density")
- **velocityGrid**: Name of velocity grid (default: "vel")
- **temperatureGrid**: Name of temperature grid

#### Import Options
- **resample**: Resample voxel size on import
- **resampleVoxelSize**: Target voxel size for resampling
- **clipBounds**: Limit import to bounding box
- **clipMin/Max**: Bounding box coordinates

#### Memory Management
- **useMemoryCache**: Cache loaded data
- **maxCacheSize**: Maximum cache size in MB
- **streamLargeFiles**: Stream instead of loading all at once

### Outputs

- **density**: Density grid output
- **temperature**: Temperature grid output
- **velocity**: Velocity vector field
- **fuel**: Fuel grid (for combustion)
- **pressure**: Pressure grid
- **allGrids**: All loaded grids as a collection
- **metadata**: File metadata and information

### Example: Loading a Smoke Simulation

```
VDBImport
  filepath: "smoke_sim.0001.vdb"
  frameSequence: true
  frame: 1-240
  loadAllGrids: true
  → density → VolumeRender
  → velocity → MotionBlur
```

## VDB Export Node

The VDB Export Node writes volume data to .vdb files.

### Basic Usage

1. Connect volume data to input ports
2. Set output `filepath`
3. Configure compression and grid names
4. Enable `exportOnProcess` or call `triggerExport()` manually

### Parameters

#### File Settings
- **filepath**: Output file path
- **exportOnProcess**: Auto-export on each process
- **overwriteExisting**: Overwrite if file exists
- **frameSequence**: Export as sequence
- **startFrame/endFrame**: Frame range for sequences

#### Grid Naming
- **densityGridName**: Name for density grid (default: "density")
- **velocityGridName**: Name for velocity grid (default: "vel")
- **temperatureGridName**: Name for temperature grid

#### Compression
- **compressionType**: none, zip, blosc (recommended: blosc)
- **compressionLevel**: 1-9 (higher = more compression)
- **halfFloat**: Use 16-bit float (smaller files)

#### Optimization
- **pruneInactive**: Remove voxels below threshold
- **pruneThreshold**: Minimum value to keep
- **optimizeForStreaming**: Optimize for sequential access

#### Transform
- **voxelSize**: Size of voxels in world units
- **worldTranslate/Rotate/Scale**: Volume transform

### Inputs

- **density**: Density field to export
- **temperature**: Temperature field
- **velocity**: Velocity vector field
- **fuel**: Fuel field
- **pressure**: Pressure field
- **custom1-3**: Custom grids
- **metadata**: Additional metadata to embed

### Example: Exporting Fire Simulation

```
FireSimulation
  → density → VDBExport.density
  → temperature → VDBExport.temperature
  → velocity → VDBExport.velocity

VDBExport
  filepath: "fire.####.vdb"
  frameSequence: true
  startFrame: 1
  endFrame: 240
  compressionType: blosc
  compressionLevel: 5
```

## Procedural VDB Nodes

Generate volumetric effects directly in VDB format.

### VDB Cloud Node

Generate realistic procedural clouds.

**Cloud Types:**
- **cumulus**: Puffy fair-weather clouds
- **stratocumulus**: Low layered clouds
- **cumulonimbus**: Tall thunderstorm clouds with anvil
- **cirrus**: High wispy clouds
- **stratus**: Flat uniform layer

**Key Parameters:**
- **voxelSize**: Resolution (0.5m recommended)
- **volumeSize**: Dimensions [width, height, depth]
- **coverage**: Cloud coverage 0-1
- **density**: Base cloud density
- **noiseScale**: Noise frequency
- **detailNoise**: Add wispy details
- **windSpeed**: Animation speed [x,y,z]
- **anvil**: Enable for cumulonimbus

**Example:**
```
VDBCloud
  cloudType: cumulonimbus
  voxelSize: 0.5
  volumeSize: [100, 50, 100]
  coverage: 0.45
  anvil: true
  windSpeed: [5, 0, 2]
  → VDBExport
```

### VDB Smoke Node

Rising smoke with turbulence.

**Key Parameters:**
- **density**: Smoke opacity
- **buoyancy**: Rise speed
- **turbulence**: Amount of swirling
- **dissipation**: Fade rate
- **swirl**: Rotational component

### VDB Fire Node

Fire simulation with fuel and temperature.

**Outputs:**
- density (smoke)
- temperature (heat)
- fuel (burning material)
- velocity (advection)

**Key Parameters:**
- **intensity**: Overall brightness
- **temperature**: Heat in Kelvin
- **flameHeight/Width**: Flame shape
- **flickering**: Random variation
- **burnRate**: Fuel consumption

### VDB Water Node

Liquid simulation using level sets.

**Key Features:**
- Level set surface representation
- Wave simulation
- Surface tension
- Velocity field

**Key Parameters:**
- **fluidLevel**: Water height 0-1
- **waveAmplitude/Frequency**: Wave properties
- **narrowBandWidth**: Storage optimization
- **gravity**: Gravity strength

### VDB Snow Node

Falling snow particles to VDB.

**Key Parameters:**
- **particleCount**: Number of snowflakes
- **particleSize**: Flake size
- **fallSpeed**: Descent rate
- **windSpeed**: Drift velocity [x,y,z]
- **turbulence**: Random motion

## Blender Integration

The RageVFX Blender addon provides seamless VDB workflow.

### Installation

1. Copy `blender-tools` folder to Blender addons directory:
   - Windows: `%APPDATA%\Blender Foundation\Blender\3.x\scripts\addons\`
   - Mac: `~/Library/Application Support/Blender/3.x/scripts/addons/`
   - Linux: `~/.config/blender/3.x/scripts/addons/`

2. Open Blender Preferences (Edit > Preferences)
3. Go to Add-ons section
4. Search for "RageVFX"
5. Enable the addon

### Using the Addon

**Import VDB:**
1. File > Import > OpenVDB (.vdb)
2. Select .vdb file
3. Configure import options
4. Volume object is created automatically

**Export VDB:**
1. Select volume object or simulation cache
2. File > Export > OpenVDB (.vdb)
3. Configure export options
4. Choose compression (Blosc recommended)

**Convert Mesh to VDB:**
1. Select mesh object
2. Open RageVFX panel (N key > RageVFX tab)
3. Click "Convert to VDB"
4. Set voxel size and band widths

**RageVFX Panel:**
- Located in 3D View sidebar (N key)
- Quick import/export buttons
- VDB settings and grid names
- Volume properties display

### Workflow: RageVFX → Blender → RageVFX

1. **Export from RageVFX:**
   ```
   VDBSmoke → VDBExport
     filepath: "smoke.vdb"
   ```

2. **Import to Blender:**
   - File > Import > OpenVDB
   - Select "smoke.vdb"
   - Edit/render in Blender

3. **Export from Blender:**
   - File > Export > OpenVDB
   - Save as "smoke_edited.vdb"

4. **Import back to RageVFX:**
   ```
   VDBImport
     filepath: "smoke_edited.vdb"
     → VolumeRender
   ```

## Workflow Examples

### Example 1: Procedural Cloud Scene

```
# Generate cloud
VDBCloud
  cloudType: cumulus
  voxelSize: 0.5
  volumeSize: [200, 100, 200]
  coverage: 0.5
  animated: true
  windSpeed: [3, 0, 1]
  → VDBExport
    filepath: "clouds.####.vdb"
    frameSequence: true

# Import and render
VDBImport
  filepath: "clouds.####.vdb"
  frameSequence: true
  → VolumeRender
    → Output
```

### Example 2: Fire with Smoke

```
# Generate fire
VDBFire
  intensity: 1.0
  temperature: 1500
  flameHeight: 5.0
  → density → Merge.A
  → temperature → VolumeRender (as temp channel)

# Generate smoke
VDBSmoke
  buoyancy: 2.0
  turbulence: 1.5
  → Merge.B

# Combine
Merge
  → VDBExport
    filepath: "fire_smoke.vdb"
```

### Example 3: Water Surface

```
VDBWater
  fluidLevel: 0.3
  waveAmplitude: 0.5
  waveFrequency: 2.0
  → levelSet → VDBExport
  → velocity → MotionBlur

VDBExport
  filepath: "water.vdb"
  compressionType: blosc
```

### Example 4: Snow Scene

```
VDBSnow
  particleCount: 10000
  fallSpeed: 2.0
  windSpeed: [0.5, 0, 0.3]
  turbulence: 0.3
  → VDBExport
    filepath: "snow.####.vdb"
    frameSequence: true
    startFrame: 1
    endFrame: 240
```

## Performance Tips

### Memory Management

1. **Use Sparse Storage**: VDB only stores active voxels
2. **Prune Inactive Voxels**: Remove below threshold
3. **Streaming**: Enable for large files (>1GB)
4. **Cache Management**: Set appropriate cache limits

### File Size Optimization

1. **Compression**: Use Blosc for best balance
2. **Half Float**: Enable for 50% size reduction
3. **Prune Threshold**: Increase to remove more voxels
4. **Voxel Size**: Use larger voxels when possible

### Rendering Performance

1. **Narrow Band**: For level sets, use narrow band (3-6 voxels)
2. **LOD**: Generate multiple resolutions
3. **Culling**: Clip bounds for visible area only
4. **Resolution**: Start low, increase for final render

### Best Practices

- **Resolution**: 0.5-1.0m voxels for distant clouds, 0.05-0.1m for close-up
- **Frame Padding**: Use #### pattern for sequences
- **Metadata**: Embed creator, date, and custom info
- **Validation**: Check grid names match between import/export
- **Backup**: Keep uncompressed versions during production

## Troubleshooting

### Problem: "File not found" error

**Solution:**
- Check filepath is absolute or relative to project
- Verify file extension is .vdb
- Check file permissions

### Problem: Imported VDB appears empty

**Solution:**
- Verify grid names match (densityGrid parameter)
- Check voxel values aren't too small (below threshold)
- Enable all grids and check metadata

### Problem: Large file sizes

**Solution:**
- Enable Blosc compression
- Increase prune threshold
- Use half float precision
- Check for unnecessary grids

### Problem: Slow import

**Solution:**
- Enable streaming for large files
- Reduce cache size if memory constrained
- Consider resampling to lower resolution
- Clip bounds to visible area

### Problem: Blender addon not appearing

**Solution:**
- Check addon is in correct directory
- Restart Blender after installation
- Enable in Preferences > Add-ons
- Check Blender version (3.0+ required)

### Problem: Frame sequence not working

**Solution:**
- Use #### pattern (not %04d)
- Check frame range is correct
- Verify all files exist in sequence
- Check filename matches pattern exactly

## Advanced Topics

### Custom Grid Types

Create custom grids for specialized data:
```
VDBExport
  custom1GridName: "custom_data"
  custom1 → yourCustomData
```

### Metadata Embedding

Add production metadata:
```
VDBExport
  embedMetadata: true
  customMetadata: {
    "shot": "010_020",
    "artist": "John Doe",
    "notes": "Hero explosion"
  }
```

### Multi-Grid Workflows

Export multiple related grids:
```
Simulation
  → density → VDBExport.density
  → temperature → VDBExport.temperature
  → velocity → VDBExport.velocity
  → fuel → VDBExport.fuel
```

### Level Set Operations

Combine level sets:
```
VDB (levelset A)
  → VDBNode.volumeA

VDB (levelset B)
  → VDBNode.volumeB

VDBNode
  operation: union  # or intersect, difference
  → VDBExport
```

## Resources

- **OpenVDB Homepage**: https://www.openvdb.org/
- **VDB Format Spec**: https://www.openvdb.org/documentation/
- **RageVFX Docs**: https://github.com/mllinman/RageVFX
- **Blender VDB**: https://docs.blender.org/manual/en/latest/modeling/volumes/

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/mllinman/RageVFX/issues
- Documentation: See main RageVFX documentation
- Examples: Check `examples/` directory

---

**Version**: RageVFX 3.10.0  
**Last Updated**: December 2025  
**License**: MIT
