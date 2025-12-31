# RageVFX Web MVP - Quick Start Guide

![RageVFX Web Interface](https://github.com/user-attachments/assets/511cab1b-c1c7-4fa9-a09d-59a7ae2a61f8)

## Overview

RageVFX Web MVP is a browser-based visual effects application featuring a professional node-based workflow. This MVP demonstrates the core capabilities of RageVFX running entirely in your web browser with no installation required.

## Features

### ✅ Core MVP Features

1. **Node-Based Workflow**
   - Drag-and-drop node graph editor
   - 176+ professional VFX nodes across 24 categories
   - Visual node connections with bezier curves
   - Category-colored nodes for easy identification

2. **Comprehensive Node Library**
   - **Input/Output**: Image input, output nodes
   - **Generators**: Noise, gradients
   - **VFX Effects**: Fire, water, smoke, explosions, lightning, and 20+ more
   - **Color Tools**: Color correction, grading, curves, levels, LUTs
   - **Filters**: Blur, sharpen, glow, motion blur, depth of field
   - **Compositing**: Merge, screen, overlay, deep composite, cryptomatte
   - **3D Pipeline**: Scene, camera, lights, materials, rendering
   - **ML Tools**: Style transfer, upscaling, denoising, segmentation
   - **And many more...**

3. **Professional UI**
   - Dark theme optimized for VFX work
   - Collapsible node library with search
   - Node properties panel
   - Multi-mode viewport (2D/3D/Render)
   - Professional timeline with keyframe animation
   - Zoom, pan, and fit controls

4. **Real-Time Preview**
   - Live viewport rendering
   - Multiple viewing modes
   - Zoom and navigation controls

5. **Project Management**
   - Save/load projects
   - Clear workspace
   - Graph execution

## Getting Started

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mllinman/RageVFX.git
   cd RageVFX
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev:web
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Building for Production

To create an optimized production build:

```bash
npm run build:web
```

The built files will be in the `dist-web/` directory.

To preview the production build:

```bash
npm run preview:web
```

## Using the MVP

### Creating Your First Node Graph

1. **Add Nodes**
   - Browse the Node Library on the left
   - Click on any node category to expand it
   - Drag a node (e.g., "Image Input") onto the canvas

2. **Connect Nodes**
   - Drag from an output socket (right side) to an input socket (left side)
   - Connections will show as bezier curves

3. **Edit Properties**
   - Click on any node to select it
   - View and edit properties in the right panel

4. **Execute Graph**
   - Click the orange "▶️ Execute" button in the toolbar
   - View results in the Viewport panel

5. **Preview Output**
   - The viewport on the right shows the rendered output
   - Switch between 2D View, 3D View, and Render View

### Example Workflow

Try this simple workflow to get started:

1. Add an **Image Input** node
2. Add a **Color Correct** node
3. Add a **Blur** node
4. Add an **Output** node
5. Connect them: Input → Color Correct → Blur → Output
6. Click **Execute** to see the result

### Keyboard Shortcuts

- **Ctrl+Enter**: Execute graph
- **Delete**: Delete selected node
- **Ctrl+D**: Duplicate node
- **F**: Fit view to window
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Space**: Play/Pause timeline

### Timeline Animation

- Use the timeline at the bottom for keyframe animation
- Set keyframes for node parameters
- Scrub through time to preview animations
- Adjust frame rate (default 24fps)

## Technical Details

### Technology Stack

- **TypeScript**: Type-safe application code
- **Vite**: Fast build tool and dev server
- **WebGL**: GPU-accelerated rendering
- **HTML5 Canvas**: Node graph visualization
- **Three.js**: 3D rendering capabilities

### Browser Requirements

- Modern browser with WebGL 2.0 support
- Chrome, Firefox, Safari, or Edge (latest versions)
- Recommended: 8GB+ RAM for complex scenes

### Performance

- Runs entirely in the browser
- No server required after build
- GPU-accelerated rendering
- Optimized for 60fps UI

## Node Categories

The MVP includes 24 categories with 176+ professional nodes:

1. **Input/Output** - Image and data I/O
2. **Generator** - Procedural pattern generation
3. **VFX Effects** - Fire, water, explosions, particles
4. **Color** - Color correction and grading
5. **Filter** - Blur, sharpen, effects
6. **Composite** - Blend and composite operations
7. **Transform** - 2D transformations
8. **Keying** - Chroma and luminance keying
9. **Tracker** - Motion tracking
10. **3D Pipeline** - 3D scene management
11. **Volumetric** - Fog and volume rendering
12. **VDB Tools** - OpenVDB support
13. **Physics** - Simulation systems
14. **Projection & Painting** - Texture painting
15. **Camera & Tracking** - Camera systems
16. **3D Import/Export** - Model I/O
17. **Pipeline & Collaboration** - Studio pipeline
18. **ML Tools** - AI-powered effects
19. **Utility** - Helper nodes
20. **Motion Graphics** - Motion design
21. **Animation** - Animation tools
22. **8K+ Resolution** - High-res rendering
23. **Procedural Generation** - Terrain and cities
24. **Advanced Rendering** - Path tracing

## MVP Limitations

This MVP demonstrates core functionality. Some features are simulated:

- Actual image processing is simplified for demo purposes
- Advanced 3D rendering uses basic WebGL
- ML nodes show UI but don't run full models
- File I/O uses browser storage APIs

## Next Steps

Want to explore more? Check out:

- **README.md** - Full project documentation
- **ROADMAP.md** - Future development plans
- **ARCHITECTURE.md** - Technical architecture details
- **marketing/** - Subscription and pricing info

## Support

- 📧 Email: support@ragevfx.com
- 💬 Discord: [Join our community](https://discord.gg/ragevfx)
- 📖 Documentation: [docs.ragevfx.com](https://docs.ragevfx.com)
- 🐛 Issues: [GitHub Issues](https://github.com/mllinman/RageVFX/issues)

## License

MIT License - See LICENSE file for details

---

**RageVFX Web MVP** - *Professional Visual Effects in Your Browser*
