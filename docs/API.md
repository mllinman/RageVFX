# RageVFX API Documentation

## Core API

### Node Class

Base class for all node types.

```typescript
abstract class Node {
  constructor(id: string, type: string, name: string)
  
  // Abstract methods
  abstract process(): Promise<void>
  
  // Input/Output management
  protected addInput(id: string, name: string, type: DataType): void
  protected addOutput(id: string, name: string, type: DataType): void
  
  setInput(id: string, value: any): void
  getOutput(id: string): any
  
  // Parameter management
  setParameter(key: string, value: any): void
  getParameter(key: string): any
  
  // State management
  markDirty(): void
  isDirty(): boolean
  
  // Metadata
  getMetadata(): NodeMetadata
  getInputs(): NodeInput[]
  getOutputs(): NodeOutput[]
  
  // Serialization
  serialize(): any
  dispose(): void
}
```

### NodeGraph Class

Manages the node network.

```typescript
class NodeGraph {
  // Node management
  addNode(node: Node): void
  removeNode(nodeId: string): void
  getNode(nodeId: string): Node | undefined
  getAllNodes(): Node[]
  
  // Connection management
  connect(
    sourceNodeId: string,
    sourceOutputId: string,
    targetNodeId: string,
    targetInputId: string
  ): boolean
  
  disconnect(connectionId: string): void
  getAllConnections(): Connection[]
  
  // Execution
  async execute(): Promise<void>
  
  // Serialization
  serialize(): any
  clear(): void
}
```

### RenderEngine Class

GPU-accelerated rendering system.

```typescript
class RenderEngine {
  constructor(width?: number, height?: number)
  
  // Texture management
  createTexture(id: string, imageData: ImageData): boolean
  
  // Shader management
  compileShader(
    id: string,
    vertexSource: string,
    fragmentSource: string
  ): boolean
  
  // Rendering
  render(
    shaderId: string,
    inputTextures: Map<string, string>,
    outputId: string
  ): boolean
  
  readPixels(width: number, height: number): ImageData
  
  // Configuration
  resize(width: number, height: number): void
  getCanvas(): HTMLCanvasElement | OffscreenCanvas
  
  // Cleanup
  dispose(): void
}
```

### RageVFXApp Class

Main application controller.

```typescript
class RageVFXApp {
  constructor()
  
  // Node management
  createNode(nodeType: string, nodeId: string): boolean
  connectNodes(
    sourceId: string,
    sourceOutput: string,
    targetId: string,
    targetInput: string
  ): boolean
  
  // Execution
  async executeGraph(): Promise<void>
  getFinalOutput(): any
  
  // Project management
  async saveProject(filepath: string): Promise<boolean>
  async loadProject(filepath: string): Promise<boolean>
  
  // Access
  getGraph(): NodeGraph
  getRenderEngine(): RenderEngine
  
  // Cleanup
  dispose(): void
}
```

## Node Types

### ImageInputNode

```typescript
class ImageInputNode extends Node {
  constructor(id: string)
  
  setImageData(imageData: ImageData): void
  
  // Parameters:
  // - width: number (default: 1920)
  // - height: number (default: 1080)
  // - filepath: string
  
  // Outputs:
  // - image: IMAGE
}
```

### BlurNode

```typescript
class BlurNode extends Node {
  constructor(id: string)
  
  // Parameters:
  // - blurAmount: number (default: 5.0)
  // - quality: 'draft' | 'preview' | 'production'
  
  // Inputs:
  // - image: IMAGE
  
  // Outputs:
  // - image: IMAGE
}
```

### ColorCorrectNode

```typescript
class ColorCorrectNode extends Node {
  constructor(id: string)
  
  // Parameters:
  // - brightness: number (default: 0.0, range: -1.0 to 1.0)
  // - contrast: number (default: 1.0, range: 0.0 to 2.0)
  // - saturation: number (default: 1.0, range: 0.0 to 2.0)
  // - hue: number (default: 0.0, range: -180 to 180)
  
  // Inputs:
  // - image: IMAGE
  
  // Outputs:
  // - image: IMAGE
}
```

### MergeNode

```typescript
class MergeNode extends Node {
  constructor(id: string)
  
  // Parameters:
  // - operation: 'over' | 'add' | 'multiply'
  // - opacity: number (default: 1.0, range: 0.0 to 1.0)
  // - mix: number (default: 1.0, range: 0.0 to 1.0)
  
  // Inputs:
  // - foreground: IMAGE
  // - background: IMAGE
  
  // Outputs:
  // - image: IMAGE
}
```

### TransformNode

```typescript
class TransformNode extends Node {
  constructor(id: string)
  
  // Parameters:
  // - translateX: number (default: 0)
  // - translateY: number (default: 0)
  // - rotation: number (default: 0, degrees)
  // - scaleX: number (default: 1.0)
  // - scaleY: number (default: 1.0)
  // - centerX: number (default: 0.5, normalized)
  // - centerY: number (default: 0.5, normalized)
  
  // Inputs:
  // - image: IMAGE
  
  // Outputs:
  // - image: IMAGE
}
```

### OutputNode

```typescript
class OutputNode extends Node {
  constructor(id: string)
  
  getFinalOutput(): ImageData | null
  
  // Parameters:
  // - format: 'png' | 'jpeg' | 'exr'
  // - quality: number (default: 100, range: 0-100)
  
  // Inputs:
  // - image: IMAGE
}
```

## Data Types

### ImageData

```typescript
interface ImageData {
  width: number
  height: number
  channels: number
  data: Float32Array | Uint8Array
  format: 'rgba' | 'rgb' | 'float'
}
```

### DataType Enum

```typescript
enum DataType {
  IMAGE = 'image',
  GEOMETRY = 'geometry',
  VECTOR = 'vector',
  NUMBER = 'number',
  COLOR = 'color',
  MATRIX = 'matrix',
  ANY = 'any'
}
```

### NodeMetadata

```typescript
interface NodeMetadata {
  id: string
  type: string
  name: string
  category: string
  description: string
  version: string
}
```

### Connection

```typescript
interface Connection {
  id: string
  sourceNodeId: string
  sourceOutputId: string
  targetNodeId: string
  targetInputId: string
}
```

## Usage Examples

### Basic Pipeline

```typescript
import { RageVFXApp } from './core/RageVFXApp';

const app = new RageVFXApp();

// Create nodes
app.createNode('ImageInput', 'input1');
app.createNode('Blur', 'blur1');
app.createNode('Output', 'output1');

// Configure
const blurNode = app.getGraph().getNode('blur1');
blurNode?.setParameter('blurAmount', 10);

// Connect
app.connectNodes('input1', 'image', 'blur1', 'image');
app.connectNodes('blur1', 'image', 'output1', 'image');

// Execute
await app.executeGraph();
const result = app.getFinalOutput();
```

### Custom Node

```typescript
import { Node, DataType } from './core/Node';

class InvertNode extends Node {
  constructor(id: string) {
    super(id, 'Invert', 'Invert Colors');
    this.metadata.category = 'Color';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
  }
  
  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (input?.value && output) {
      const imageData = input.value;
      const inverted = this.invertColors(imageData);
      output.value = inverted;
    }
  }
  
  private invertColors(image: ImageData): ImageData {
    const data = new Uint8Array(image.data.length);
    for (let i = 0; i < image.data.length; i += 4) {
      data[i] = 255 - image.data[i];
      data[i + 1] = 255 - image.data[i + 1];
      data[i + 2] = 255 - image.data[i + 2];
      data[i + 3] = image.data[i + 3];
    }
    return { ...image, data };
  }
}
```

## Events (Future)

```typescript
// Node events
node.on('parameter-changed', (param: string, value: any) => {});
node.on('processing-started', () => {});
node.on('processing-completed', () => {});

// Graph events
graph.on('node-added', (node: Node) => {});
graph.on('connection-created', (conn: Connection) => {});
graph.on('execution-started', () => {});
graph.on('execution-completed', () => {});
```

## Error Handling

All async operations may throw errors:

```typescript
try {
  await graph.execute();
} catch (error) {
  if (error.message.includes('Circular dependency')) {
    console.error('Graph contains a cycle');
  }
}
```

---

For more examples, see the `/examples` directory.
