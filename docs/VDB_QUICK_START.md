# RageVFX VDB Quick Start Guide

Get started with OpenVDB import/export and procedural VDB tools in 5 minutes.

## 🚀 Quick Examples

### Example 1: Create Procedural Clouds

```
1. Add VDBCloudNode to your graph
2. Set parameters:
   - cloudType: cumulus
   - voxelSize: 0.5
   - volumeSize: [100, 50, 100]
   - coverage: 0.45
   - animated: true
3. Connect output to VolumeRender
4. Render!
```

### Example 2: Generate Smoke Effect

```
1. Add VDBSmokeNode
2. Configure:
   - density: 0.8
   - buoyancy: 2.0
   - turbulence: 1.5
3. Connect to VDBExport
4. Set filepath: "smoke.vdb"
5. Export
```

### Example 3: Import Existing VDB

```
1. Add VDBImportNode
2. Set filepath to your .vdb file
3. Connect density output to downstream nodes
4. Done!
```

## 📦 Node Overview

| Node | Purpose | Key Outputs |
|------|---------|-------------|
| **VDBImport** | Load .vdb files | density, velocity, temperature |
| **VDBExport** | Save to .vdb | - |
| **VDBCloud** | Procedural clouds | VDB volume, preview |
| **VDBSmoke** | Rising smoke | VDB volume, temperature |
| **VDBFire** | Fire simulation | density, temperature, fuel |
| **VDBWater** | Liquid surface | level set, velocity |
| **VDBSnow** | Falling snow | density, velocity |

## 🎨 Blender Integration

### Install Addon

1. Copy `blender-tools` folder to:
   - Windows: `%APPDATA%\Blender Foundation\Blender\3.x\scripts\addons\`
   - Mac: `~/Library/Application Support/Blender/3.x/scripts/addons/`
   - Linux: `~/.config/blender/3.x/scripts/addons/`

2. Enable in Blender:
   - Edit > Preferences > Add-ons
   - Search "RageVFX"
   - Check the box

### Use in Blender

**Import VDB:**
- File > Import > OpenVDB (.vdb)

**Export VDB:**
- File > Export > OpenVDB (.vdb)

**Convert Mesh:**
- Select object
- Press N > RageVFX tab
- Click "Convert to VDB"

## ⚡ Performance Tips

1. **Start Small**: Use 0.5-1.0 voxel size for testing
2. **Compress**: Always use Blosc compression
3. **Prune**: Enable inactive voxel pruning
4. **Stream**: Enable for files > 1GB

## 📊 Recommended Settings

### For Clouds
- voxelSize: 0.5m
- volumeSize: [100, 50, 100]
- compression: blosc

### For Fire/Smoke
- voxelSize: 0.1m
- volumeSize: [20, 40, 20]
- compression: blosc

### For Water
- voxelSize: 0.05m
- narrowBandWidth: 3
- compression: blosc

## 🔗 Common Workflows

### Workflow 1: RageVFX → Blender

```
RageVFX:
  VDBSmoke → VDBExport → "smoke.vdb"

Blender:
  File > Import > OpenVDB → "smoke.vdb"
  Edit/Render in Blender
```

### Workflow 2: Animated Sequence

```
VDBFire
  → VDBExport
    filepath: "fire.####.vdb"
    frameSequence: true
    startFrame: 1
    endFrame: 240
```

### Workflow 3: Multi-Grid Export

```
Simulation
  → density → VDBExport.density
  → velocity → VDBExport.velocity
  → temperature → VDBExport.temperature
```

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| File not found | Check absolute/relative path |
| Empty import | Verify grid names match |
| Large files | Enable Blosc compression |
| Slow import | Enable streaming |
| Blender addon missing | Check installation directory |

## 📚 Learn More

- **Full Guide**: See `VDB_GUIDE.md` for complete documentation
- **API Reference**: Check individual node TypeScript files
- **Examples**: Browse `examples/` directory

## 🎯 Next Steps

1. Try the quick examples above
2. Experiment with different cloud types
3. Create animated smoke/fire sequences
4. Export to Blender for final rendering
5. Read the full VDB Guide for advanced features

---

**Ready to create amazing VFX? Start with VDBCloudNode!** ☁️

For detailed documentation, see [VDB_GUIDE.md](VDB_GUIDE.md)
