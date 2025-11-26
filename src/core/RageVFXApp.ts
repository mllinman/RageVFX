/**
 * RageVFXApp - Main application controller
 */

import { NodeGraph } from './NodeGraph';
import { Node } from './Node';
import { ImageInputNode } from '../nodes/ImageInputNode';
import { BlurNode } from '../nodes/BlurNode';
import { ColorCorrectNode } from '../nodes/ColorCorrectNode';
import { MergeNode } from '../nodes/MergeNode';
import { TransformNode } from '../nodes/TransformNode';
import { OutputNode } from '../nodes/OutputNode';
import { NoiseNode } from '../nodes/NoiseNode';
import { GradientNode } from '../nodes/GradientNode';
import { ChromaKeyNode } from '../nodes/ChromaKeyNode';
import { EdgeDetectNode } from '../nodes/EdgeDetectNode';
import { RenderEngine } from '../renderer/RenderEngine';

export class RageVFXApp {
  private graph: NodeGraph;
  private renderEngine: RenderEngine;
  private nodeRegistry: Map<string, typeof Node>;

  constructor() {
    this.graph = new NodeGraph();
    this.renderEngine = new RenderEngine();
    this.nodeRegistry = new Map();
    
    this.registerNodes();
  }

  /**
   * Register all available node types
   */
  private registerNodes(): void {
    // Input/Output nodes
    this.nodeRegistry.set('ImageInput', ImageInputNode as any);
    this.nodeRegistry.set('Output', OutputNode as any);
    
    // Generator nodes
    this.nodeRegistry.set('Noise', NoiseNode as any);
    this.nodeRegistry.set('Gradient', GradientNode as any);
    
    // Filter nodes
    this.nodeRegistry.set('Blur', BlurNode as any);
    this.nodeRegistry.set('EdgeDetect', EdgeDetectNode as any);
    
    // Color nodes
    this.nodeRegistry.set('ColorCorrect', ColorCorrectNode as any);
    
    // Composite nodes
    this.nodeRegistry.set('Merge', MergeNode as any);
    
    // Transform nodes
    this.nodeRegistry.set('Transform', TransformNode as any);
    
    // Keying nodes
    this.nodeRegistry.set('ChromaKey', ChromaKeyNode as any);
  }

  /**
   * Create a new node of the specified type
   */
  createNode(nodeType: string, nodeId: string): boolean {
    const NodeClass = this.nodeRegistry.get(nodeType);
    if (!NodeClass) {
      console.error(`Unknown node type: ${nodeType}`);
      return false;
    }

    const node = new (NodeClass as any)(nodeId);
    this.graph.addNode(node);
    return true;
  }

  /**
   * Connect two nodes
   */
  connectNodes(
    sourceId: string,
    sourceOutput: string,
    targetId: string,
    targetInput: string
  ): boolean {
    return this.graph.connect(sourceId, sourceOutput, targetId, targetInput);
  }

  /**
   * Execute the node graph
   */
  async executeGraph(): Promise<void> {
    await this.graph.execute();
  }

  /**
   * Get the final rendered output
   */
  getFinalOutput(): any {
    const nodes = this.graph.getAllNodes();
    const outputNode = nodes.find(
      node => node.getMetadata().type === 'Output'
    ) as OutputNode | undefined;
    
    if (outputNode) {
      return outputNode.getFinalOutput();
    }
    
    return null;
  }

  /**
   * Save project to file
   */
  async saveProject(filepath: string): Promise<boolean> {
    try {
      const projectData = {
        version: '1.0.0',
        graph: this.graph.serialize()
      };
      
      // In a real implementation, this would write to filesystem
      console.log('Saving project to:', filepath);
      console.log('Project data:', JSON.stringify(projectData, null, 2));
      
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  /**
   * Load project from file
   */
  async loadProject(filepath: string): Promise<boolean> {
    try {
      // In a real implementation, this would read from filesystem
      console.log('Loading project from:', filepath);
      
      // Clear current graph
      this.graph.clear();
      
      return true;
    } catch (error) {
      console.error('Failed to load project:', error);
      return false;
    }
  }

  /**
   * Get the node graph
   */
  getGraph(): NodeGraph {
    return this.graph;
  }

  /**
   * Get the render engine
   */
  getRenderEngine(): RenderEngine {
    return this.renderEngine;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.graph.clear();
    this.renderEngine.dispose();
  }
}
