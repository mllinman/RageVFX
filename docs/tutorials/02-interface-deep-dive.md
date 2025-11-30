# Episode 2: Interface Deep Dive

**Duration**: 20 minutes  
**Level**: Beginner  
**Prerequisites**: Episode 1 - Getting Started

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 0:45)

> Now that you have RageVFX installed and running, let's take a deep dive into the interface. Understanding every aspect of the UI will make you much more efficient as you build complex VFX projects.
>
> In this tutorial, we'll explore each panel in detail, learn navigation shortcuts, and discover customization options.

**Key Learning Objectives:**
- Master navigation in the Node Graph Editor
- Understand the Node Library organization
- Customize the Properties Panel workflow
- Configure Viewport settings
- Use the Timeline effectively

---

### Part 1: Menu Bar & Toolbar (0:45 - 3:00)

The menu bar at the top provides access to all major functions.

#### File Menu
| Option | Shortcut | Description |
|--------|----------|-------------|
| New | Ctrl/Cmd+N | Create blank project |
| Open | Ctrl/Cmd+O | Load existing project |
| Save | Ctrl/Cmd+S | Save current project |
| Save As | Ctrl/Cmd+Shift+S | Save with new name |
| Export | - | Export rendered output |
| Import | - | Import assets/nodes |

#### Edit Menu
| Option | Shortcut | Description |
|--------|----------|-------------|
| Undo | Ctrl/Cmd+Z | Undo last action |
| Redo | Ctrl/Cmd+Shift+Z | Redo undone action |
| Cut | Ctrl/Cmd+X | Cut selected nodes |
| Copy | Ctrl/Cmd+C | Copy selected nodes |
| Paste | Ctrl/Cmd+V | Paste copied nodes |
| Delete | Delete/Backspace | Remove selected |
| Select All | Ctrl/Cmd+A | Select all nodes |

#### Toolbar Quick Access
- **▶ Execute**: Run the node graph
- **⏸ Pause**: Pause execution
- **⚙ Settings**: Open settings modal

---

### Part 2: Node Library Mastery (3:00 - 7:00)

The Node Library (left panel) contains all 140+ nodes organized by category.

#### Category Overview

| Category | Color Code | Node Count | Purpose |
|----------|------------|------------|---------|
| Input/Output | 🟢 Green/Orange | 8+ | Load/export media |
| Generator | ⬜ Gray | 5+ | Create procedural content |
| Filter | 🔵 Blue | 15+ | Image processing |
| Color | 🟢 Green | 10+ | Color grading |
| Composite | 🟣 Purple | 10+ | Blend images |
| Transform | 🟡 Yellow | 6+ | Spatial transforms |
| Keying | 🔵 Blue | 8+ | Green screen/mattes |
| VFX Effects | 🔴 Red | 40+ | Fire, water, magic |
| 3D | 🟠 Orange | 20+ | 3D scene |
| Physics | 💗 Pink | 10+ | Simulations |
| ML | 🔵 Cyan | 12+ | AI-powered tools |
| Tracker | 🟡 Yellow | 8+ | Motion tracking |
| Animation | 🟣 Purple | 4+ | Keyframe animation |
| Motion Graphics | 💗 Pink | 2+ | Shape layers, arrays |
| Pipeline | ⬜ Gray | 8+ | USD, Alembic, versioning |

#### Searching for Nodes

1. Click the **Search bar** at the top of Node Library
2. Type partial node name (e.g., "blur", "fire", "color")
3. Results filter in real-time
4. Press **Enter** to add first result
5. Press **Escape** to clear search

**Pro Tip**: Search supports category names too! Type "VFX" to see all VFX nodes.

#### Adding Nodes

**Method 1: Drag and Drop**
1. Find node in library
2. Click and hold
3. Drag to Node Graph Editor
4. Release to place

**Method 2: Double-Click**
1. Find node in library
2. Double-click
3. Node appears at center of view

**Method 3: Right-Click Menu**
1. Right-click in Node Graph Editor
2. Select "Add Node"
3. Navigate category hierarchy
4. Click node to add

---

### Part 3: Node Graph Editor Navigation (7:00 - 12:00)

The center panel is where you build your VFX pipeline.

#### Canvas Navigation

| Action | Method 1 | Method 2 |
|--------|----------|----------|
| **Pan** | Middle mouse drag | Spacebar + drag |
| **Zoom** | Mouse wheel | +/- buttons |
| **Frame All** | Home key | Double-click empty |
| **Frame Selected** | F key | - |
| **Reset View** | Home → zoom to fit | - |

#### Node Operations

**Selecting Nodes:**
- **Single select**: Click on node
- **Multi-select**: Shift + click additional nodes
- **Box select**: Drag rectangle around nodes
- **Select all**: Ctrl/Cmd + A
- **Deselect**: Escape or click empty space

**Moving Nodes:**
- Click and drag selected nodes
- Hold Shift for axis-constrained movement
- Nodes snap to grid (configurable)

**Deleting Nodes:**
- Select nodes
- Press Delete or Backspace
- Connections are automatically removed

**Duplicating Nodes:**
- Select nodes
- Ctrl/Cmd + D
- Or Copy (Ctrl/Cmd+C) then Paste (Ctrl/Cmd+V)

#### Working with Connections

**Creating Connections:**
1. Click output socket (right side of node)
2. Drag line toward input socket
3. Compatible inputs highlight
4. Release on input socket

**Connection Rules:**
- Data types must be compatible (IMAGE → IMAGE)
- One input can have only one connection
- One output can have multiple connections
- Circular connections are prevented

**Deleting Connections:**
- Click on the connection line
- Press Delete
- Or: Click output socket, drag away, release

**Rewiring:**
- Click existing input connection
- Drag to new output socket
- Release to rewire

#### Backdrop System

Organize complex graphs with backdrops:

1. Select multiple nodes
2. Right-click → Create Backdrop
3. Enter label and choose color
4. Resize by dragging corners
5. Move backdrop to move all contained nodes
6. Lock backdrop to prevent accidental changes

---

### Part 4: Properties Panel (12:00 - 15:00)

The Properties Panel (right-top) shows parameters for the selected node.

#### Parameter Types

**Sliders:**
- Click and drag to adjust
- Click number to enter exact value
- Hold Shift for fine control
- Double-click to reset to default

**Number Fields:**
- Click and type value
- Use arrow keys to increment
- Tab to move to next field

**Color Pickers:**
- Click color swatch
- Use color wheel or enter RGB/Hex
- Eyedropper for sampling

**Dropdowns:**
- Click to open menu
- Select option
- Type to filter (when focused)

**Checkboxes:**
- Click to toggle on/off
- Spacebar when focused

#### Node Information

At the top of Properties Panel:
- **Node Type**: Type of node (e.g., "Blur")
- **Node ID**: Unique identifier
- **Category**: Node category
- **Description**: What the node does

---

### Part 5: Viewport Panel (15:00 - 17:30)

The Viewport (right-bottom) previews your output.

#### 2D Viewport Controls

| Action | Control |
|--------|---------|
| Pan | Click + drag |
| Zoom | Mouse wheel |
| Fit | Double-click |
| Reset | R key |

#### 3D Viewport Controls

| Action | Control |
|--------|---------|
| Orbit | Left mouse + drag |
| Pan | Middle mouse + drag |
| Dolly | Mouse wheel |
| Reset | Home key |

#### WASD Controls (3D)

When working with 3D scenes:
- **W/A/S/D**: Move forward/left/backward/right
- **Q/E**: Move up/down
- **Shift**: Speed boost (3x)
- **Alt**: Precision (0.1x)

#### Viewport Settings

Click the gear icon in Viewport for options:
- **Shading Mode**: Solid, Wireframe, Material, Rendered
- **Background**: Gradient, Solid, HDRI, Transparent
- **Show Grid**: Toggle ground grid
- **Show Axes**: Toggle XYZ axes
- **Show Bounding Boxes**: Toggle object bounds

---

### Part 6: Timeline Panel (17:30 - 19:30)

The Timeline (bottom) controls animation playback.

#### Timeline Components

```
┌─────────────────────────────────────────────────────────────┐
│ ◀◀  ◀  ▶/⏸  ▶  ▶▶ │ Frame: 001 │ FPS: 24 │ In: 1 │ Out: 100 │
├─────────────────────────────────────────────────────────────┤
│ Track 1: Position    ◆───────◆──────────◆                   │
│ Track 2: Rotation    ◆───────────────────────◆              │
│ Track 3: Scale       ◆                                      │
├─────────────────────────────────────────────────────────────┤
│ ▼────────────────────────────────────────────────────────▼  │
│ 0        25        50        75       100                   │
└─────────────────────────────────────────────────────────────┘
```

#### Playback Controls

| Button | Shortcut | Action |
|--------|----------|--------|
| ◀◀ | Home | Go to start |
| ◀ | ← | Previous frame |
| ▶/⏸ | Spacebar | Play/Pause |
| ▶ | → | Next frame |
| ▶▶ | End | Go to end |

#### Timeline Navigation

- **Scrub**: Click and drag on timeline ruler
- **Zoom**: Scroll wheel over timeline
- **Set In Point**: I key
- **Set Out Point**: O key

---

### Summary & Practice (19:30 - 20:00)

**What You Learned:**
- ✅ Complete menu bar and toolbar functions
- ✅ Node Library organization and search
- ✅ Node Graph navigation and operations
- ✅ Backdrop system for organization
- ✅ Properties Panel parameter types
- ✅ Viewport modes and controls
- ✅ Timeline and animation basics

**Practice Exercise:**
1. Create a new project
2. Add 5-6 different nodes from various categories
3. Connect them in sequence
4. Create a backdrop around a group of nodes
5. Navigate using keyboard shortcuts only
6. Experiment with Viewport settings

**Next Tutorial:**
In [Episode 3: Understanding Nodes](03-node-basics.md), we'll explore the node system in depth—data types, socket connections, and how data flows through your graph.

---

## ⌨️ Complete Keyboard Shortcut Reference

### General
| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+N | New project |
| Ctrl/Cmd+O | Open project |
| Ctrl/Cmd+S | Save project |
| Ctrl/Cmd+Shift+S | Save as |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z | Redo |
| Ctrl/Cmd+Q | Quit |

### Node Graph
| Shortcut | Action |
|----------|--------|
| Delete/Backspace | Delete selected |
| Ctrl/Cmd+D | Duplicate |
| Ctrl/Cmd+A | Select all |
| Escape | Deselect |
| D | Disable/enable node |
| Home | Frame all |
| F | Frame selected |

### Timeline
| Shortcut | Action |
|----------|--------|
| Spacebar | Play/pause |
| ← | Previous frame |
| → | Next frame |
| Home | Go to start |
| End | Go to end |
| I | Set in point |
| O | Set out point |

---

*Continue to [Episode 3: Understanding Nodes](03-node-basics.md)!*
