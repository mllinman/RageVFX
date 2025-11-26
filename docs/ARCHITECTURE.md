# RageVFX Architecture

## Overview

RageVFX is built with a modular, extensible architecture designed for high-performance visual effects processing. The system is divided into several key layers:

## Layer Architecture

```
┌─────────────────────────────────────────────┐
│           User Interface (UI)                │
│  - Node Graph Editor                         │
│  - Property Panels                           │
│  - Viewport Preview                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Application Layer (Core)              │
│  - RageVFXApp                                │
│  - Project Management                        │
│  - Node Registry                             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│       Node Graph Engine (Core)               │
│  - NodeGraph                                 │
│  - Execution Manager                         │
│  - Connection Manager                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Node Implementations                │
│  - Base Node Class                           │
│  - VFX Node Types                            │
│  - Custom Nodes                              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Rendering Engine                     │
│  - WebGL2 Context                            │
│  - Shader Programs                           │
│  - GPU Processing                            │
└─────────────────────────────────────────────┘
```

## Core Components

### 1. Node System

#### Base Node Class
The `Node` class provides the foundation for all node types:

- **Inputs/Outputs**: Type-safe socket system
- **Parameters**: Configurable node properties
- **Processing**: Abstract `process()` method for custom logic
- **Caching**: Built-in caching for optimization
- **Dirty Tracking**: Automatic invalidation on changes

```typescript
abstract class Node {
  protected inputs: Map<string, NodeInput>;
  protected outputs: Map<string, NodeOutput>;
  protected parameters: Map<string, any>;
  
  abstract process(): Promise<void>;
}
```

#### Node Graph
The `NodeGraph` manages the network of nodes:

- **Topology**: Maintains node connections
- **Execution Order**: Topological sort for correct processing
- **Cycle Detection**: Prevents circular dependencies
- **Data Flow**: Automatic data propagation

### 2. Render Engine

The `RenderEngine` provides GPU-accelerated processing:

- **WebGL2 Context**: Hardware acceleration
- **Texture Management**: Efficient GPU memory usage
- **Shader Library**: Pre-compiled effect shaders
- **Framebuffer Operations**: Multi-pass rendering

#### Shader Pipeline

```
Input Texture → Vertex Shader → Fragment Shader → Output Texture
```

### 3. Data Flow

The system uses a pull-based execution model:

1. **Mark Dirty**: Nodes marked for reprocessing
2. **Calculate Order**: Topological sort determines execution sequence
3. **Transfer Data**: Connected nodes exchange data
4. **Execute**: Process nodes in order
5. **Cache**: Store results for reuse

```
Input → Process → Cache → Output
  ↑                           ↓
  └─────────── Dirty ─────────┘
```

## Node Types

### Input Nodes
- Load data from external sources
- Generate procedural content
- Provide constant values

### Processing Nodes
- Transform data
- Apply effects
- Perform calculations

### Output Nodes
- Export results
- Display previews
- Save to disk

## Extension System

### Creating Custom Nodes

1. **Extend Base Class**
```typescript
class CustomNode extends Node {
  constructor(id: string) {
    super(id, 'Custom', 'Custom Node');
    this.addInput('in', 'Input', DataType.IMAGE);
    this.addOutput('out', 'Output', DataType.IMAGE);
  }
  
  async process(): Promise<void> {
    // Custom processing logic
  }
}
```

2. **Register Node Type**
```typescript
app.registerNodeType('Custom', CustomNode);
```

3. **Use in Graph**
```typescript
const node = app.createNode('Custom', 'custom1');
graph.addNode(node);
```

## Performance Optimizations

### 1. Smart Caching
- Results cached per node
- Invalidated on parameter changes
- Reused when possible

### 2. Lazy Evaluation
- Only dirty nodes reprocessed
- Skips unchanged branches
- Minimal computation

### 3. GPU Acceleration
- WebGL2 for image processing
- Shader-based effects
- Parallel computation

### 4. Memory Management
- Automatic resource cleanup
- Texture pooling
- Efficient data structures

## Threading Model

```
Main Thread
├── UI Updates
├── Node Graph Management
└── Coordination

Render Thread
├── WebGL Context
├── Shader Compilation
└── GPU Operations

Worker Threads (planned)
├── CPU-intensive operations
├── File I/O
└── Background processing
```

## Data Types

### Supported Types
- **IMAGE**: Raster image data (RGBA, RGB, Float)
- **GEOMETRY**: 3D mesh data (vertices, faces, normals)
- **VECTOR**: Mathematical vectors (2D, 3D, 4D)
- **NUMBER**: Scalar values
- **COLOR**: RGB/RGBA color values
- **MATRIX**: Transformation matrices
- **ANY**: Generic data type

### Type Safety
- Connections validated by type
- Automatic type conversion (where possible)
- Error reporting for incompatible types

## File Formats

### Project Files (.ragevfx)
JSON-based project format:
```json
{
  "version": "1.0.0",
  "graph": {
    "nodes": [...],
    "connections": [...]
  }
}
```

### Image Formats
- PNG, JPEG (8-bit)
- EXR (planned, 16/32-bit float)
- TIFF (planned)

## Future Architecture

### Planned Enhancements
1. **Distributed Rendering**: Network-based processing
2. **Python Scripting**: Embedded Python interpreter
3. **Plugin System**: Dynamic node loading
4. **GPU Compute**: Compute shader support
5. **Multi-GPU**: Parallel GPU utilization

## Design Principles

1. **Modularity**: Loosely coupled components
2. **Extensibility**: Easy to add new features
3. **Performance**: Optimized for speed
4. **Reliability**: Robust error handling
5. **Maintainability**: Clean, documented code

## Dependencies

- **Electron**: Desktop application framework
- **TypeScript**: Type-safe language
- **WebGL2**: GPU acceleration
- **Three.js**: 3D rendering (planned)
- **gl-matrix**: Matrix operations

## Build System

```
TypeScript → Compiler → JavaScript → Electron → Application
```

Build process:
1. TypeScript compilation
2. Asset bundling
3. Electron packaging
4. Platform-specific builds

---

This architecture enables RageVFX to provide professional-grade VFX capabilities while maintaining excellent performance and extensibility.
