# Episode 1: Getting Started with RageVFX

**Duration**: 15 minutes  
**Level**: Beginner  
**Prerequisites**: None

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 1:00)

> Welcome to RageVFX! In this first episode of our tutorial series, we'll get you up and running with the most powerful node-based visual effects software available today.
>
> By the end of this tutorial, you'll have RageVFX installed, understand the basic interface, and create your very first project.

**Key Learning Objectives:**
- Install RageVFX on your system
- Launch and explore the interface
- Create and save your first project

---

### Part 1: System Requirements (1:00 - 2:30)

Before we install, let's make sure your system is ready for RageVFX.

**Minimum Requirements:**
| Component | Requirement |
|-----------|-------------|
| Operating System | Windows 10+, macOS 10.14+, Ubuntu 20.04+ |
| CPU | Dual-core 2.0 GHz |
| RAM | 8 GB |
| GPU | WebGL2-compatible |
| Storage | 500 MB free |
| Node.js | Version 20.0.0+ |

**Recommended for best experience:**
| Component | Recommendation |
|-----------|----------------|
| CPU | Quad-core 3.0 GHz+ |
| RAM | 16 GB+ |
| GPU | Dedicated GPU with 4GB+ VRAM |
| Storage | SSD with 1 GB+ free |

**Check Your Setup:**
1. Verify Node.js is installed: Open terminal and type `node --version`
2. Check WebGL2 support: Visit [get.webgl.org](https://get.webgl.org)

---

### Part 2: Installation (2:30 - 5:00)

**Step 1: Clone the Repository**

Open your terminal or command prompt and run:

```bash
git clone https://github.com/mllinman/RageVFX.git
cd RageVFX
```

**Step 2: Install Dependencies**

```bash
npm install
```

This may take a few minutes as it downloads all required packages.

**Step 3: Build the Application**

```bash
npm run build
```

Wait for the build to complete successfully.

**Step 4: Launch RageVFX**

```bash
npm start
```

🎉 **RageVFX should now open!**

**Alternative: Web Version**

If you want to try RageVFX without a full installation:

```bash
npm run dev:web
```

Then open your browser to `http://localhost:3000`

---

### Part 3: Interface Overview (5:00 - 10:00)

When RageVFX launches, you'll see the main workspace divided into several panels:

```
┌─────────────────────────────────────────────────────────────┐
│                    Menu Bar & Toolbar                        │
├──────────────┬────────────────────────────┬─────────────────┤
│              │                            │                  │
│    Node      │      Node Graph            │   Properties     │
│   Library    │        Editor              │     Panel        │
│              │                            │                  │
│              │                            ├─────────────────┤
│              │                            │                 │
│              │                            │    Viewport     │
│              │                            │                 │
├──────────────┴────────────────────────────┴─────────────────┤
│                      Timeline Panel                          │
└─────────────────────────────────────────────────────────────┘
```

**Let's explore each area:**

#### Menu Bar & Toolbar
- **File Menu**: New, Open, Save, Export
- **Edit Menu**: Undo, Redo, Cut, Copy, Paste
- **Execute Button (▶)**: Run your node graph
- **Settings (⚙)**: Application preferences

#### Node Library (Left Panel)
- Contains all 140+ available nodes
- Organized by category (Input/Output, Filter, Color, VFX, etc.)
- **Search bar** at top for quick finding
- **Drag and drop** nodes to the editor

#### Node Graph Editor (Center)
- Main workspace for creating VFX
- **Pan**: Click and drag on empty space
- **Zoom**: Use mouse wheel or +/- buttons
- Nodes connect left-to-right

#### Properties Panel (Right Top)
- Shows parameters for selected node
- Adjust settings with sliders and inputs
- Real-time preview updates

#### Viewport (Right Bottom)
- Preview your final output
- **Pan**: Click and drag
- **Zoom**: Mouse wheel

#### Timeline Panel (Bottom)
- Animation keyframes
- Playback controls
- Frame navigation

---

### Part 4: Creating Your First Project (10:00 - 13:30)

Let's create a simple project to see RageVFX in action!

**Step 1: Add an Image Input Node**

1. In the Node Library, find **"Image Input"** under "Input/Output"
2. **Drag** it onto the Node Graph Editor
3. The node appears in the canvas

**Step 2: Add a Color Correction Node**

1. Find **"Color Correct"** under "Color"
2. **Drag** it to the right of Image Input
3. Position it nearby

**Step 3: Add an Output Node**

1. Find **"Output"** under "Input/Output"
2. **Drag** it to the right of Color Correct

**Step 4: Connect the Nodes**

1. Click on the **output socket** (right side circle) of Image Input
2. **Drag** the connection line to the **input socket** (left side circle) of Color Correct
3. Release to create the connection
4. Repeat: Connect Color Correct's output to Output's input

Your graph should look like:
```
[Image Input] ──→ [Color Correct] ──→ [Output]
```

**Step 5: Adjust Parameters**

1. **Click** on the Color Correct node to select it
2. In the Properties panel, adjust:
   - **Brightness**: Try 0.1 (slightly brighter)
   - **Contrast**: Try 1.2 (more contrast)
   - **Saturation**: Try 1.3 (more vivid colors)

**Step 6: Execute the Graph**

1. Click the **Execute** button (▶) in the toolbar
2. Watch the Viewport panel for results
3. The processed image appears!

---

### Part 5: Saving Your Project (13:30 - 15:00)

Always save your work!

**Save Project:**
1. Go to **File → Save** (or press `Ctrl/Cmd + S`)
2. Choose a location and filename
3. Click **Save**

Projects are saved as `.json` files that contain:
- All your nodes and connections
- Parameter settings
- Layout information

**Open Project:**
1. **File → Open** (or `Ctrl/Cmd + O`)
2. Navigate to your saved file
3. Click **Open**

---

### Summary & Next Steps

**What You Learned:**
- ✅ How to install RageVFX
- ✅ The main interface panels
- ✅ How to add and connect nodes
- ✅ How to adjust node parameters
- ✅ How to execute and preview
- ✅ How to save and open projects

**Practice Exercise:**
1. Create a new project
2. Add: Image Input → Blur → Output
3. Adjust the blur amount
4. Execute and preview
5. Save your project

**Next Tutorial:**
In [Episode 2: Interface Deep Dive](02-interface-deep-dive.md), we'll explore every aspect of the RageVFX interface in detail, including navigation shortcuts and customization options.

---

## ⌨️ Keyboard Shortcuts Used

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + S | Save project |
| Ctrl/Cmd + O | Open project |
| Ctrl/Cmd + N | New project |
| Mouse wheel | Zoom in/out |
| Click + drag | Pan canvas |

---

## ❓ Troubleshooting

**Problem: Application won't start**
- Verify Node.js 20+ is installed
- Try running `npm install` again
- Check for error messages in terminal

**Problem: Blank viewport after execute**
- Ensure all nodes are connected
- Check that Image Input has data
- Click Execute again

**Problem: Slow performance**
- Close other GPU-intensive applications
- Reduce image resolution for testing
- Check System Requirements

---

*Ready for more? Continue to [Episode 2: Interface Deep Dive](02-interface-deep-dive.md)!*
