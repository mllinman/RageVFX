/**
 * Web version entry point for RageVFX
 * This module provides a browser-compatible version of the VFX application
 * Uses a minimal implementation for the web demo
 */

// Re-export the DataType enum
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

export interface NodeMetadata {
  id: string;
  type: string;
  name: string;
  category: string;
  description: string;
  version: string;
}

/**
 * Simplified RageVFXApp for web demonstration
 */
export class RageVFXApp {
  private nodes: Map<string, WebNode> = new Map();
  private connections: Map<string, WebConnection> = new Map();

  constructor() {
    console.log('RageVFX Web App initialized');
  }

  createNode(nodeType: string, nodeId: string): boolean {
    const node = new WebNode(nodeId, nodeType);
    this.nodes.set(nodeId, node);
    console.log(`Created node: ${nodeType} (${nodeId})`);
    return true;
  }

  connectNodes(sourceId: string, sourceOutput: string, targetId: string, targetInput: string): boolean {
    const connectionId = `${sourceId}.${sourceOutput}->${targetId}.${targetInput}`;
    this.connections.set(connectionId, {
      id: connectionId,
      sourceId,
      sourceOutput,
      targetId,
      targetInput
    });
    console.log(`Connected: ${connectionId}`);
    return true;
  }

  async executeGraph(): Promise<void> {
    console.log('Executing graph with', this.nodes.size, 'nodes and', this.connections.size, 'connections');
    
    // Simulate processing
    for (const [id, node] of this.nodes) {
      await node.process();
    }
    
    console.log('Graph execution complete');
  }

  getGraph() {
    return {
      nodes: this.nodes,
      connections: this.connections
    };
  }

  dispose(): void {
    this.nodes.clear();
    this.connections.clear();
  }
}

interface WebConnection {
  id: string;
  sourceId: string;
  sourceOutput: string;
  targetId: string;
  targetInput: string;
}

class WebNode {
  private id: string;
  private type: string;
  private metadata: NodeMetadata;
  private parameters: Map<string, unknown> = new Map();

  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
    this.metadata = {
      id,
      type,
      name: type,
      category: 'General',
      description: '',
      version: '2.0.0'
    };
  }

  async process(): Promise<void> {
    console.log(`Processing node: ${this.type} (${this.id})`);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  getMetadata(): NodeMetadata {
    return { ...this.metadata };
  }

  setParameter(key: string, value: unknown): void {
    this.parameters.set(key, value);
  }

  getParameter(key: string): unknown {
    return this.parameters.get(key);
  }
}

// Global application instance
let app: RageVFXApp | null = null;

/**
 * Initialize the RageVFX web application
 */
export function initializeApp(): RageVFXApp {
  if (!app) {
    app = new RageVFXApp();
    console.log('RageVFX Web initialized');
  }
  return app;
}

/**
 * Get the current application instance
 */
export function getApp(): RageVFXApp | null {
  return app;
}

/**
 * Dispose of the application
 */
export function disposeApp(): void {
  if (app) {
    app.dispose();
    app = null;
  }
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).RageVFX = {
    initializeApp,
    getApp,
    disposeApp,
    RageVFXApp,
    DataType
  };
}
