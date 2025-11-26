/**
 * Base Node class for the RageVFX node graph system
 * Provides the foundation for all node types in the VFX pipeline
 */

export enum DataType {
  IMAGE = 'image',
  GEOMETRY = 'geometry',
  GEOMETRY_3D = 'geometry_3d',
  VECTOR = 'vector',
  NUMBER = 'number',
  COLOR = 'color',
  MATRIX = 'matrix',
  PARTICLES = 'particles',
  SCRIPT = 'script',
  ANY = 'any'
}

export interface SocketData {
  id: string;
  name: string;
  type: DataType;
  value?: any;
  connected: boolean;
}

export interface NodeInput extends SocketData {
  connection?: { nodeId: string; outputId: string };
}

export interface NodeOutput extends SocketData {
  connections: Array<{ nodeId: string; inputId: string }>;
}

export interface NodeMetadata {
  id: string;
  type: string;
  name: string;
  category: string;
  description: string;
  version: string;
}

export abstract class Node {
  protected metadata: NodeMetadata;
  protected inputs: Map<string, NodeInput> = new Map();
  protected outputs: Map<string, NodeOutput> = new Map();
  protected parameters: Map<string, any> = new Map();
  protected dirty: boolean = true;
  protected cache: Map<string, any> = new Map();

  constructor(id: string, type: string, name: string) {
    this.metadata = {
      id,
      type,
      name,
      category: 'Base',
      description: '',
      version: '1.0.0'
    };
  }

  /**
   * Abstract method to be implemented by derived node types
   * This is where the node's main processing logic occurs
   */
  abstract process(): Promise<void>;

  /**
   * Add an input socket to the node
   */
  protected addInput(id: string, name: string, type: DataType): void {
    this.inputs.set(id, {
      id,
      name,
      type,
      connected: false
    });
  }

  /**
   * Add an output socket to the node
   */
  protected addOutput(id: string, name: string, type: DataType): void {
    this.outputs.set(id, {
      id,
      name,
      type,
      connected: false,
      connections: []
    });
  }

  /**
   * Set input value
   */
  setInput(id: string, value: any): void {
    const input = this.inputs.get(id);
    if (input) {
      input.value = value;
      this.markDirty();
    }
  }

  /**
   * Get output value
   */
  getOutput(id: string): any {
    return this.outputs.get(id)?.value;
  }

  /**
   * Set parameter value
   */
  setParameter(key: string, value: any): void {
    this.parameters.set(key, value);
    this.markDirty();
  }

  /**
   * Get parameter value
   */
  getParameter(key: string): any {
    return this.parameters.get(key);
  }

  /**
   * Mark node as needing reprocessing
   */
  markDirty(): void {
    this.dirty = true;
    this.cache.clear();
  }

  /**
   * Check if node needs reprocessing
   */
  isDirty(): boolean {
    return this.dirty;
  }

  /**
   * Get node metadata
   */
  getMetadata(): NodeMetadata {
    return { ...this.metadata };
  }

  /**
   * Get all inputs
   */
  getInputs(): NodeInput[] {
    return Array.from(this.inputs.values());
  }

  /**
   * Get all outputs
   */
  getOutputs(): NodeOutput[] {
    return Array.from(this.outputs.values());
  }

  /**
   * Serialize node to JSON
   */
  serialize(): any {
    return {
      metadata: this.metadata,
      inputs: Array.from(this.inputs.entries()),
      outputs: Array.from(this.outputs.entries()),
      parameters: Array.from(this.parameters.entries())
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cache.clear();
    this.inputs.clear();
    this.outputs.clear();
    this.parameters.clear();
  }
}
