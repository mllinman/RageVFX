# Episode 3: Understanding Nodes

**Duration**: 18 minutes  
**Level**: Beginner  
**Prerequisites**: Episodes 1-2

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 0:45)

> The node system is the heart of RageVFX. Every effect, every transformation, every composite is built by connecting nodes together. Understanding how nodes work will unlock your ability to create anything you can imagine.
>
> In this tutorial, we'll explore node anatomy, data types, and how information flows through your graphs.

**Key Learning Objectives:**
- Understand node structure and components
- Learn all data types and their uses
- Master connection rules and data flow
- Use the caching system effectively

---

### Part 1: Node Anatomy (0:45 - 4:00)

Every node in RageVFX follows the same structure:

```
          ┌─────────────────────────────┐
          │       NODE TITLE            │ ← Type name
          │       [Category Badge]      │ ← Category indicator
          ├─────────────────────────────┤
     ○────│  Input 1                    │ ← Input socket
     ○────│  Input 2                    │ ← Another input
          │                             │
          │  ┌─────────────────────┐   │
          │  │  Parameter 1: ═══   │   │ ← Internal parameters
          │  │  Parameter 2: [✓]   │   │
          │  └─────────────────────┘   │
          │                             │
          │               Output 1  │───○ ← Output socket
          │               Output 2  │───○ ← Another output
          └─────────────────────────────┘
```

#### Components Explained

**Title Bar:**
- Shows node type (e.g., "Blur", "Color Correct")
- Color-coded by category
- Click to select node

**Input Sockets (Left Side):**
- Circles on left side receive data
- Each has a name and data type
- Some are required, some optional

**Output Sockets (Right Side):**
- Circles on right side send data
- One output can connect to many inputs
- Provides processed result

**Parameters:**
- Internal settings you can adjust
- Shown in Properties Panel when selected
- Control how the node processes data

---

### Part 2: Data Types (4:00 - 8:00)

Different nodes work with different types of data. Understanding data types is crucial for making valid connections.

#### Primary Data Types

| Type | Symbol | Description | Common Nodes |
|------|--------|-------------|--------------|
| **IMAGE** | 🖼️ | Raster image (RGBA pixels) | Most nodes |
| **NUMBER** | 🔢 | Single numeric value | Math, Time |
| **COLOR** | 🎨 | RGB/RGBA color value | Color nodes |
| **GEOMETRY_3D** | 📦 | 3D mesh data | 3D pipeline |
| **PARTICLES** | ✨ | Particle system data | Particle nodes |
| **MASK** | ⬛ | Alpha/matte channel | Keying nodes |
| **MATRIX** | 📐 | Transform matrices | Transform nodes |
| **ANY** | ⚪ | Universal type | Utility nodes |

#### Secondary Data Types

| Type | Description | Common Uses |
|------|-------------|-------------|
| **VECTOR** | 2D/3D vector | Position, direction |
| **ANIMATION** | Keyframe data | Timeline |
| **AUDIO** | Sound data | Future audio support |
| **SCRIPT** | Script execution | Python nodes |

#### Type Compatibility

```
IMAGE ←→ IMAGE      ✓ Compatible
IMAGE ←→ NUMBER     ✗ Incompatible
ANY ←→ (anything)   ✓ Universal
MASK ←→ IMAGE       ✓ Auto-converts
```

When you drag a connection, RageVFX highlights compatible inputs in green.

---

### Part 3: Creating Connections (8:00 - 11:00)

#### Basic Connection Workflow

**Step 1: Identify Output**
- Locate the output socket on source node
- Outputs are always on the right side
- Hover to see data type tooltip

**Step 2: Drag Connection**
- Click and hold on output socket
- Drag toward destination
- Line follows your cursor

**Step 3: Connect to Input**
- Compatible inputs highlight green
- Incompatible inputs stay gray
- Release on valid input to connect

#### Connection Rules

1. **Type Matching**: Data types must be compatible
2. **Single Input**: Each input accepts one connection only
3. **Multiple Outputs**: Outputs can connect to many inputs
4. **No Cycles**: Connections cannot create loops

#### Managing Connections

**Replace Connection:**
- Drag new connection to already-connected input
- Old connection is automatically removed

**Delete Connection:**
- Click on connection line (turns yellow)
- Press Delete or Backspace

**Redirect Connection:**
- Click on input end of connection
- Drag to new source
- Release to rewire

---

### Part 4: Data Flow (11:00 - 14:00)

Understanding how data moves through your graph is essential.

#### The Flow Principle

```
INPUT → PROCESS → PROCESS → OUTPUT
  ↓         ↓         ↓         ↓
 Load     Filter    Color     Export
Image      Blur     Correct    Result
```

Data flows **left to right** through your node graph:
1. **Input nodes** bring data into the graph
2. **Processing nodes** transform the data
3. **Output nodes** export the final result

#### Execution Order

RageVFX uses **topological sorting** to determine execution order:

1. Nodes with no inputs execute first
2. Then nodes whose inputs are satisfied
3. Continues until all nodes complete

**Example Graph:**
```
[Image A] ──┐
            ├──→ [Merge] ──→ [Blur] ──→ [Output]
[Image B] ──┘
```

**Execution Order:**
1. Image A (no inputs)
2. Image B (no inputs)
3. Merge (both inputs ready)
4. Blur (input ready)
5. Output (input ready)

#### Parallel Branches

Multiple branches can exist in one graph:

```
[Input 1] → [Effect A] → [Merge] → [Output]
                             ↑
[Input 2] → [Effect B] ──────┘
```

Both branches execute, then merge together.

---

### Part 5: Caching System (14:00 - 16:30)

RageVFX caches processed results for efficiency.

#### How Caching Works

1. **First Execute**: Node processes input, stores result
2. **Next Execute**: If nothing changed, uses cached result
3. **Parameter Change**: Marks node "dirty," reprocesses

#### Dirty Propagation

When you change a parameter:
- That node is marked dirty
- All downstream nodes are marked dirty
- Only dirty nodes reprocess on execute

```
[Input] → [Blur*] → [Color*] → [Output*]
              ↑
         Changed blur amount
         (downstream is dirty)
```

#### Cache Benefits

- **Speed**: Unchanged nodes don't reprocess
- **Efficiency**: Only affected parts update
- **Preview**: Faster iteration on changes

#### Forcing Refresh

To clear cache and reprocess everything:
- Close and reopen project
- Or: Delete and reconnect a node

---

### Part 6: Node Categories Deep Dive (16:30 - 17:30)

#### Input/Output Nodes
Start and end points of your pipeline.
- **Image Input**: Load images
- **Output**: Export results
- **Image Sequence Output**: Export frame sequences
- **Video Sequence Output**: Export video files

#### Generator Nodes
Create content from nothing.
- **Noise**: Procedural noise patterns
- **Gradient**: Color gradients

#### Filter Nodes
Process and transform images.
- **Blur**: Smooth/soften
- **Sharpen**: Enhance detail
- **Edge Detect**: Find edges
- **Glow**: Add bloom

#### Color Nodes
Adjust color properties.
- **Color Correct**: Basic adjustments
- **Grade**: Lift/gamma/gain
- **LUT Loader**: Apply LUTs

#### Composite Nodes
Combine multiple images.
- **Merge**: Layer images together
- **Deep Composite**: Depth-aware compositing

#### VFX Effect Nodes
Create visual effects.
- **Fire, Smoke, Lightning, Portal, etc.**
- 40+ procedural effects

---

### Summary (17:30 - 18:00)

**What You Learned:**
- ✅ Node structure: inputs, outputs, parameters
- ✅ All data types and compatibility
- ✅ How to create and manage connections
- ✅ Data flow and execution order
- ✅ Caching system for efficiency
- ✅ Node category purposes

**Practice Exercise:**
1. Create a graph with 3+ branches
2. Connect a Noise node to:
   - Path A: Blur → Color Correct → Merge (input A)
   - Path B: Edge Detect → Merge (input B)
   - Output from Merge
3. Experiment with changing parameters
4. Notice which nodes re-execute

**Next Tutorial:**
In [Episode 4: Your First VFX Effect](04-first-vfx-effect.md), we'll create a complete fire composite from scratch!

---

## 📊 Data Type Quick Reference

| Type | Compatible With | Example Connection |
|------|-----------------|-------------------|
| IMAGE | IMAGE, MASK, ANY | Blur → Color Correct |
| NUMBER | NUMBER, ANY | Time → Math |
| COLOR | COLOR, ANY | ColorPicker → Grade |
| GEOMETRY_3D | GEOMETRY_3D, ANY | Geometry → Mesh |
| PARTICLES | PARTICLES, ANY | Emitter → System |
| MASK | MASK, IMAGE, ANY | Key → Merge (mask) |
| ANY | All types | Dot (reroute) |

---

## 🔍 Common Connection Issues

**Problem: Can't connect nodes**
- Check data type compatibility
- Verify you're connecting output → input
- Look for type indicator tooltip

**Problem: Graph won't execute**
- Look for disconnected nodes
- Check for required inputs
- Ensure Output node exists

**Problem: Wrong output**
- Trace connections from Output backward
- Check intermediate node parameters
- Verify input images are loaded

---

*Continue to [Episode 4: Your First VFX Effect](04-first-vfx-effect.md)!*
