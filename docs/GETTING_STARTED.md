# Getting Started with RageVFX

Welcome to RageVFX! This guide will help you get up and running with the most powerful node-based visual effects software.

## Installation

### System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 20.04+)
- **Node.js**: Version 20.0.0 or higher
- **RAM**: 8 GB minimum, 16 GB recommended
- **GPU**: WebGL2-compatible graphics card
- **Disk Space**: 500 MB for installation

### Quick Install

1. **Install Node.js**
   
   Download and install from [nodejs.org](https://nodejs.org/)

2. **Clone RageVFX**
   ```bash
   git clone https://github.com/mllinman/RageVFX.git
   cd RageVFX
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build the Application**
   ```bash
   npm run build
   ```

5. **Launch RageVFX**
   ```bash
   npm start
   ```

## First Steps

### Understanding the Interface

RageVFX's interface is divided into four main areas:

```
┌─────────────────────────────────────────────┐
│           Menu Bar & Toolbar                │
├──────────┬──────────────────┬───────────────┤
│          │                  │               │
│  Node    │   Node Graph     │  Properties   │
│ Library  │     Editor       │  & Viewport   │
│          │                  │               │
└──────────┴──────────────────┴───────────────┘
```

1. **Menu Bar**: Access file operations, settings, and help
2. **Node Library** (Left): Browse and drag nodes to the editor
3. **Node Graph Editor** (Center): Create and connect nodes
4. **Properties Panel** (Right Top): Adjust node parameters
5. **Viewport** (Right Bottom): Preview your results

### Creating Your First Effect

Let's create a simple blur effect:

#### Step 1: Add an Input Node

1. Find **Image Input** in the Node Library under "Input/Output"
2. Drag it onto the Node Graph Editor
3. The node appears in the editor

#### Step 2: Add a Blur Node

1. Find **Blur** in the Node Library under "Filter"
2. Drag it onto the graph, to the right of the Image Input
3. The Blur node is now in your scene

#### Step 3: Add an Output Node

1. Find **Output** in the Node Library under "Input/Output"
2. Drag it to the right of the Blur node
3. This will be your final render output

#### Step 4: Connect the Nodes

1. Click on the **output socket** (right side) of Image Input
2. Drag to the **input socket** (left side) of Blur
3. A connection line appears
4. Connect Blur's output to Output's input

Your pipeline should look like:
```
[Image Input] → [Blur] → [Output]
```

#### Step 5: Adjust Parameters

1. Click on the Blur node to select it
2. In the Properties panel, adjust "Blur Amount"
3. Try values between 5 and 20

#### Step 6: Execute

1. Click the **Execute** button (▶️) in the toolbar
2. Watch the Viewport for your rendered result
3. The blur effect is applied!

## Common Workflows

### Color Grading

Create professional color grades:

```
[Image Input] → [Color Correct] → [Output]
```

Parameters to adjust:
- **Brightness**: -1.0 to 1.0
- **Contrast**: 0.0 to 2.0
- **Saturation**: 0.0 to 2.0

### Compositing

Combine multiple images:

```
[Background Image] ──┐
                     ├→ [Merge] → [Output]
[Foreground Image] ──┘
```

Set Merge parameters:
- **Operation**: Over, Add, or Multiply
- **Opacity**: 0.0 to 1.0

### Chroma Keying (Green Screen)

Remove backgrounds:

```
[Image Input] → [Chroma Key] → [Output]
```

Adjust:
- **Key Color**: RGB values of background (default green)
- **Threshold**: 0.0 to 1.0
- **Softness**: 0.0 to 1.0

### Procedural Generation

Create textures from scratch:

```
[Noise] → [Color Correct] → [Output]
```

Or:

```
[Gradient] → [Blur] → [Output]
```

## Node Categories Explained

### Input/Output
- **Image Input**: Load images from files
- **Output**: Export your final result

### Generator
- **Noise**: Create Perlin/simplex noise patterns
- **Gradient**: Generate linear or radial gradients

### Color
- **Color Correct**: Adjust brightness, contrast, saturation

### Filter
- **Blur**: Apply Gaussian blur
- **Edge Detect**: Find edges using Sobel operator

### Composite
- **Merge**: Combine images with various blend modes

### Transform
- **Transform 2D**: Scale, rotate, translate images

### Keying
- **Chroma Key**: Remove colored backgrounds

## Tips & Tricks

### Navigation

- **Pan**: Click and drag on empty space
- **Zoom**: Use zoom buttons or mouse wheel
- **Select**: Click on a node
- **Multi-select**: Hold Shift and click nodes

### Keyboard Shortcuts (Planned)

- `Ctrl/Cmd + N`: New project
- `Ctrl/Cmd + S`: Save project
- `Ctrl/Cmd + Z`: Undo
- `Delete`: Delete selected nodes
- `Space + Drag`: Pan canvas

### Best Practices

1. **Name Your Nodes**: Keep track of complex graphs
2. **Use Comments**: Document your pipeline
3. **Group Operations**: Keep related nodes together
4. **Save Often**: Save your work regularly
5. **Test Incrementally**: Execute after each major change

### Performance Tips

1. **Lower Resolution Preview**: Use draft quality for faster iteration
2. **Cache Results**: RageVFX automatically caches node results
3. **Minimize Connections**: Simpler graphs execute faster
4. **Use GPU Nodes**: GPU-accelerated nodes are faster

## Troubleshooting

### Application Won't Start

**Problem**: Error about WebGL or Electron

**Solution**: 
- Update your graphics drivers
- Ensure WebGL2 is supported: Visit [get.webgl.org](https://get.webgl.org/)

### Nodes Not Connecting

**Problem**: Can't create connections between nodes

**Solution**:
- Check that socket types match (IMAGE → IMAGE)
- Ensure you're dragging from output to input
- Look for type compatibility

### Slow Performance

**Problem**: Graph executes slowly

**Solution**:
- Lower resolution for preview
- Reduce blur amounts and effect iterations
- Close other GPU-intensive applications
- Check Task Manager for GPU usage

### Blank Output

**Problem**: Output is black or empty

**Solution**:
- Verify all nodes are connected
- Check that Image Input has valid data
- Execute the graph again
- Look for error messages in the console

## Advanced Topics

### Creating Custom Nodes

See [API.md](API.md) for detailed instructions on extending RageVFX with custom nodes.

### Scripting

Python scripting support is planned for version 1.1.

### Network Rendering

Distributed rendering is planned for version 1.2.

## Next Steps

1. **Explore Examples**: Check the `/examples` directory
2. **Read the API**: See [API.md](API.md) for programmatic usage
3. **Review Architecture**: Understand the system in [ARCHITECTURE.md](ARCHITECTURE.md)
4. **Join Community**: Connect with other users
5. **Build Something Amazing**: Create your first VFX shot!

## Learning Resources

### Tutorials (Coming Soon)
- Basic compositing techniques
- Advanced color grading
- Green screen keying
- Procedural texture generation

### Community
- Discord: [Join us](https://discord.gg/ragevfx)
- Forum: [discuss.ragevfx.com](https://discuss.ragevfx.com)
- YouTube: Tutorials and showcases

### Documentation
- [README.md](../README.md): Feature overview
- [API.md](API.md): Complete API reference
- [ARCHITECTURE.md](ARCHITECTURE.md): System design

## Getting Help

- 📧 Email: support@ragevfx.com
- 💬 Discord: Ask the community
- 🐛 Issues: Report bugs on GitHub
- 📖 Docs: Check the documentation

---

**Welcome to the future of visual effects!**

Start creating amazing VFX with RageVFX today.
