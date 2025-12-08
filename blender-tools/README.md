# RageVFX Blender Integration Tool

Professional OpenVDB import/export and integration addon for Blender 3.0+

## Features

### VDB Import
- Import OpenVDB (.vdb) files directly into Blender
- Support for multiple grids (density, velocity, temperature, fuel, pressure)
- Automatic volume object creation
- Voxel size scaling on import
- Frame sequence support

### VDB Export
- Export Blender volumes to OpenVDB format
- Multiple compression options (None, ZIP, Blosc)
- Half-float precision for smaller files
- Frame sequence export for animations
- Support for density, velocity, and temperature grids

### Object Conversion
- Convert any Blender mesh to VDB level set
- Configurable voxel size
- Interior/exterior narrow band width control
- Automatic volume creation

### UI Integration
- Clean, modern sidebar panel in 3D View
- Organized import/export buttons
- Real-time VDB settings
- Volume properties display

## Installation

1. Download or copy the `blender-tools` folder
2. Open Blender preferences (Edit > Preferences)
3. Go to Add-ons section
4. Click "Install..." and select the `blender-tools` folder (or the __init__.py file)
5. Enable "RageVFX Integration" addon
6. The RageVFX panel will appear in the 3D View sidebar (press N to show/hide)

## Usage

### Importing VDB Files

1. Go to File > Import > OpenVDB (.vdb)
2. Navigate to your .vdb file
3. Configure import options:
   - Import Density: Include density grid
   - Import Velocity: Include velocity grid
   - Import Temperature: Include temperature grid
   - Voxel Size Multiplier: Scale voxel dimensions
4. Click "Import VDB"

### Exporting VDB Files

1. Select your volume object or simulation cache
2. Go to File > Export > OpenVDB (.vdb)
3. Configure export options:
   - Export Density/Velocity/Temperature: Choose grids to export
   - Voxel Size: Set VDB voxel dimensions
   - Compression: Choose compression type (Blosc recommended)
   - Half Float: Use 16-bit float for smaller files
   - Frame Sequence: Export animation as sequence
4. Click "Export VDB"

### Converting Objects to VDB

1. Select a mesh object in the 3D viewport
2. Open the RageVFX panel in the sidebar (N key > RageVFX tab)
3. Click "Convert to VDB"
4. Configure conversion parameters:
   - Voxel Size: Resolution of the VDB grid
   - Exterior/Interior Band Width: Narrow band settings
5. A new volume object will be created

### Using the RageVFX Panel

The sidebar panel (3D View > N key > RageVFX tab) provides:

**VDB Operations:**
- Quick Import/Export buttons
- Convert to VDB button

**VDB Settings:**
- Grid name mappings (density, velocity, temperature)
- Customize grid names for import/export

**Preview:**
- Live Preview: Real-time VDB visualization
- Auto Import: Automatically reload on file changes

## Integration with RageVFX

This addon is designed to work seamlessly with RageVFX:

1. **Export from RageVFX**: Use VDBExportNode to save volumes
2. **Import to Blender**: Use this addon to load VDB files
3. **Edit/Render in Blender**: Use Blender's volume rendering
4. **Export back to RageVFX**: Export modified volumes for further compositing

## Technical Notes

### Supported Grid Types
- **float**: Single-channel scalar data (density, temperature, pressure)
- **vec3**: Three-channel vector data (velocity)
- **levelset**: Signed distance fields for surfaces

### Compression
- **None**: No compression, fastest but largest files
- **ZIP**: Standard ZIP compression, moderate size reduction
- **Blosc**: High-performance compression, best balance (recommended)

### Frame Sequences
Use the pattern `filename.####.vdb` where #### will be replaced with frame numbers:
- Example: `smoke.0001.vdb`, `smoke.0002.vdb`, etc.

## Requirements

- Blender 3.0 or higher
- For production use, install `pyopenvdb` Python package for full VDB support

## Future Enhancements

- Direct pyopenvdb integration for native VDB I/O
- Real-time VDB preview in viewport
- VDB editing tools
- Shader node integration
- RageVFX project file import

## Support

For issues, feature requests, or contributions:
- GitHub: https://github.com/mllinman/RageVFX
- Documentation: See RageVFX main documentation

## License

MIT License - See LICENSE file in the RageVFX repository
