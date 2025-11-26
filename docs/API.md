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

## Version 1.1 & 1.2 Node API

### 3D Nodes (v1.1)

#### Geometry3DNode

Create 3D primitive geometries using Three.js.

```typescript
const geometry = new Geometry3DNode('geo1');
geometry.setParameter('type', 'sphere'); // box, sphere, plane, cylinder, torus
geometry.setParameter('width', 2);
geometry.setParameter('height', 2);
geometry.setParameter('depth', 2);
geometry.setParameter('segments', 32);
await geometry.process();
```

#### MeshNode

Create 3D meshes with PBR materials.

```typescript
const mesh = new MeshNode('mesh1');
mesh.setParameter('color', { r: 255, g: 128, b: 64 });
mesh.setParameter('metalness', 0.8);
mesh.setParameter('roughness', 0.2);
mesh.setParameter('emissive', { r: 0, g: 0, b: 0 });
mesh.setParameter('opacity', 1.0);
mesh.setParameter('wireframe', false);
```

#### CameraNode

3D perspective camera with positioning controls.

```typescript
const camera = new CameraNode('cam1');
camera.setParameter('fov', 50);
camera.setParameter('aspect', 16/9);
camera.setParameter('near', 0.1);
camera.setParameter('far', 1000);
camera.setParameter('position', { x: 0, y: 0, z: 5 });
camera.setParameter('lookAt', { x: 0, y: 0, z: 0 });
```

#### LightNode

Scene lighting with multiple types.

```typescript
const light = new LightNode('light1');
light.setParameter('type', 'point'); // point, directional, spot, ambient
light.setParameter('color', { r: 255, g: 255, b: 255 });
light.setParameter('intensity', 1.0);
light.setParameter('position', { x: 5, y: 5, z: 5 });
light.setParameter('castShadow', true);
```

### Particle System Nodes (v1.1)

#### ParticleSystemNode

GPU-accelerated particle generation and rendering.

```typescript
const particles = new ParticleSystemNode('particles1');
particles.setParameter('width', 1920);
particles.setParameter('height', 1080);
particles.setParameter('maxParticles', 10000);
particles.setParameter('emissionRate', 100);
particles.setParameter('particleLife', 2.0);
particles.setParameter('particleSize', 3.0);
particles.setParameter('velocityMin', { x: -50, y: -100 });
particles.setParameter('velocityMax', { x: 50, y: -200 });
particles.setParameter('gravity', { x: 0, y: 100 });
particles.setParameter('colorStart', { r: 255, g: 255, b: 255, a: 255 });
particles.setParameter('colorEnd', { r: 255, g: 255, b: 255, a: 0 });
particles.setParameter('blendMode', 'add');
```

#### ParticleEmitterNode

Control particle emission properties.

```typescript
const emitter = new ParticleEmitterNode('emitter1');
emitter.setParameter('position', { x: 960, y: 540 });
emitter.setParameter('shape', 'circle'); // point, circle, rectangle, line
emitter.setParameter('radius', 50);
emitter.setParameter('angle', 0);
emitter.setParameter('spread', 360);
```

#### ParticleForceNode

Apply physics forces to particles.

```typescript
const force = new ParticleForceNode('force1');
force.setParameter('type', 'gravity'); // gravity, wind, vortex, turbulence, drag
force.setParameter('strength', 100);
force.setParameter('direction', { x: 0, y: 1 });
force.setParameter('falloff', 1.0);
```

### Enhanced Tracking Nodes (v1.1)

#### MotionVectorsNode

Visualize optical flow as motion vectors.

```typescript
const vectors = new MotionVectorsNode('vectors1');
vectors.setParameter('scale', 1.0);
vectors.setParameter('gridSize', 16);
vectors.setParameter('color', { r: 0, g: 255, b: 0 });
vectors.setParameter('thickness', 2);
vectors.setParameter('showBackground', true);
```

#### TrackingDataNode

Store and manage tracking data with interpolation.

```typescript
const trackData = new TrackingDataNode('track1');
trackData.setParameter('currentFrame', 0);
trackData.setParameter('smoothing', 5);
trackData.setParameter('interpolation', 'linear'); // linear, cubic, none
```

### Keying & Rotoscoping Nodes (v1.1)

#### RotoscopeNode

Manual masking and rotoscoping with per-frame control.

```typescript
const roto = new RotoscopeNode('roto1');
roto.setParameter('currentFrame', 0);
roto.setParameter('feather', 5);
roto.setParameter('opacity', 1.0);
roto.setParameter('invert', false);

// Add mask programmatically
roto.addMask(0, {
  points: [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 }
  ],
  closed: true,
  feather: 10
});
```

#### SpillSuppressionNode

Remove color spill from chroma keying.

```typescript
const spill = new SpillSuppressionNode('spill1');
spill.setParameter('spillColor', { r: 0, g: 255, b: 0 });
spill.setParameter('amount', 1.0);
spill.setParameter('algorithm', 'advanced'); // simple, advanced
```

#### EdgeMatteNode

Refine alpha matte edges with professional controls.

```typescript
const edge = new EdgeMatteNode('edge1');
edge.setParameter('shrink', 0);
edge.setParameter('grow', 0);
edge.setParameter('blur', 2);
edge.setParameter('choke', 0.5);
edge.setParameter('soften', 0.3);
```

### Scripting Nodes (v1.2)

#### PythonScriptNode

Execute custom Python scripts for image processing.

```typescript
const script = new PythonScriptNode('script1');
script.setParameter('script', `
# Python script
# Available: input_image, value1, value2
# Return: output_image, result

# Your processing code here
output_image = process_image(input_image)
result = { 'processed': True }
`);
script.setParameter('autoExecute', true);
```

### Color Management Nodes (v1.2)

#### OCIOColorSpaceNode

OpenColorIO color space conversion.

```typescript
const colorSpace = new OCIOColorSpaceNode('ocio1');
colorSpace.setParameter('sourceColorSpace', 'Linear');
colorSpace.setParameter('targetColorSpace', 'sRGB');
colorSpace.setParameter('config', 'aces_1.2');
```

#### OCIOLookNode

Apply OCIO look transforms.

```typescript
const look = new OCIOLookNode('look1');
look.setParameter('lookName', 'FilmLook');
look.setParameter('direction', 'forward'); // forward, inverse
look.setParameter('strength', 1.0);
```

### High-Bit-Depth Support (v1.2)

#### Enhanced ImageInputNode

```typescript
const input = new ImageInputNode('input1');
input.setParameter('width', 1920);
input.setParameter('height', 1080);
input.setParameter('format', 'rgba32f'); // rgba8, rgba16, rgba32f, exr
input.setParameter('colorSpace', 'Linear'); // sRGB, Linear, ACEScg
```

#### Enhanced OutputNode

```typescript
const output = new OutputNode('output1');
output.setParameter('format', 'exr'); // png, jpeg, exr, tiff
output.setParameter('quality', 100);
output.setParameter('bitDepth', 32); // 8, 16, 32
output.setParameter('compression', 'zip'); // none, zip, rle, piz
output.setParameter('colorSpace', 'ACEScg');
```

### Network Rendering Nodes (v1.2)

#### RenderFarmNode

Coordinate distributed rendering across multiple machines.

```typescript
const farm = new RenderFarmNode('farm1');
farm.setParameter('serverUrl', 'localhost:8080');
farm.setParameter('numWorkers', 4);
farm.setParameter('chunkSize', 256);
farm.setParameter('priority', 'high'); // low, normal, high
farm.setParameter('timeout', 300);
```

#### NetworkClientNode

Render client for distributed rendering.

```typescript
const client = new NetworkClientNode('client1');
client.setParameter('serverUrl', 'localhost:8080');
client.setParameter('workerName', 'Worker-1');
client.setParameter('cpuThreads', 4);
client.setParameter('gpuEnabled', true);
client.setParameter('maxMemory', 8192); // MB
client.setParameter('autoConnect', true);
```

### Data Types (Updated)

```typescript
enum DataType {
  IMAGE = 'image',
  GEOMETRY = 'geometry',
  GEOMETRY_3D = 'geometry_3d',    // v1.1
  VECTOR = 'vector',
  NUMBER = 'number',
  COLOR = 'color',
  MATRIX = 'matrix',
  PARTICLES = 'particles',        // v1.1
  SCRIPT = 'script',              // v1.2
  ANY = 'any'
}
```

### ImageData Interface (Updated)

```typescript
interface ImageData {
  width: number;
  height: number;
  channels: number;
  data: Float32Array | Uint8Array | Uint16Array;  // Updated for high-bit-depth
  format: 'rgba' | 'rgb' | 'float' | 'rgba8' | 'rgba16' | 'rgba32f' | 'exr';
  colorSpace?: string;
}
```

---

For complete examples using these new features, see the `/examples` directory.
