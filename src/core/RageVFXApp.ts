/**
 * RageVFXApp - Main application controller
 */

import { NodeGraph } from './NodeGraph';
import { Node } from './Node';

// Input/Output nodes
import { ImageInputNode } from '../nodes/ImageInputNode';
import { OutputNode } from '../nodes/OutputNode';

// Generator nodes
import { NoiseNode } from '../nodes/NoiseNode';
import { GradientNode } from '../nodes/GradientNode';

// Filter nodes
import { BlurNode } from '../nodes/BlurNode';
import { EdgeDetectNode } from '../nodes/EdgeDetectNode';
import { SharpenNode } from '../nodes/SharpenNode';
import { GlowNode } from '../nodes/GlowNode';
import { MotionBlurNode } from '../nodes/MotionBlurNode';
import { DepthOfFieldNode } from '../nodes/DepthOfFieldNode';
import { ChromaticAberrationNode } from '../nodes/ChromaticAberrationNode';
import { VignetteNode } from '../nodes/VignetteNode';
import { FilmGrainNode } from '../nodes/FilmGrainNode';

// Color nodes
import { ColorCorrectNode } from '../nodes/ColorCorrectNode';
import { GradeNode } from '../nodes/GradeNode';
import { CurvesNode } from '../nodes/CurvesNode';
import { LevelsNode } from '../nodes/LevelsNode';
import { HSLNode } from '../nodes/HSLNode';

// Composite nodes
import { MergeNode } from '../nodes/MergeNode';
import { ScreenNode } from '../nodes/ScreenNode';
import { OverlayNode } from '../nodes/OverlayNode';

// Transform nodes
import { TransformNode } from '../nodes/TransformNode';
import { CornerPinNode } from '../nodes/CornerPinNode';

// Keying nodes
import { ChromaKeyNode } from '../nodes/ChromaKeyNode';
import { LuminanceKeyNode } from '../nodes/LuminanceKeyNode';
import { DifferenceNode } from '../nodes/DifferenceNode';

// VFX Effect nodes
import { FireNode } from '../nodes/FireNode';
import { WaterNode } from '../nodes/WaterNode';
import { RainNode } from '../nodes/RainNode';
import { SnowNode } from '../nodes/SnowNode';
import { SmokeNode } from '../nodes/SmokeNode';
import { CloudsNode } from '../nodes/CloudsNode';
import { ExplosionNode } from '../nodes/ExplosionNode';
import { TornadoNode } from '../nodes/TornadoNode';
import { FogNode } from '../nodes/FogNode';
import { LightningNode } from '../nodes/LightningNode';
import { SparkNode } from '../nodes/SparkNode';
import { DissolveNode } from '../nodes/DissolveNode';
import { LensFlareNode } from '../nodes/LensFlareNode';

// Tracker nodes
import { PointTrackerNode } from '../nodes/PointTrackerNode';
import { PlanarTrackerNode } from '../nodes/PlanarTrackerNode';
import { CornerDetectorNode } from '../nodes/CornerDetectorNode';
import { OpticalFlowNode } from '../nodes/OpticalFlowNode';
import { StabilizerNode } from '../nodes/StabilizerNode';

// Utility nodes
import { TimeNode } from '../nodes/TimeNode';
import { MathNode } from '../nodes/MathNode';
import { SwitchNode } from '../nodes/SwitchNode';
import { DotNode } from '../nodes/DotNode';
import { FrameHoldNode } from '../nodes/FrameHoldNode';
import { TimeOffsetNode } from '../nodes/TimeOffsetNode';

// Version 1.1 - 3D nodes
import { Geometry3DNode } from '../nodes/Geometry3DNode';
import { MeshNode } from '../nodes/MeshNode';
import { CameraNode } from '../nodes/CameraNode';
import { LightNode } from '../nodes/LightNode';

// Version 1.1 - Particle nodes
import { ParticleSystemNode } from '../nodes/ParticleSystemNode';
import { ParticleEmitterNode } from '../nodes/ParticleEmitterNode';
import { ParticleForceNode } from '../nodes/ParticleForceNode';

// Version 1.1 - Enhanced tracking nodes
import { MotionVectorsNode } from '../nodes/MotionVectorsNode';
import { TrackingDataNode } from '../nodes/TrackingDataNode';

// Version 1.1 - Keying and rotoscoping nodes
import { RotoscopeNode } from '../nodes/RotoscopeNode';
import { SpillSuppressionNode } from '../nodes/SpillSuppressionNode';
import { EdgeMatteNode } from '../nodes/EdgeMatteNode';

// Version 1.2 - Scripting nodes
import { PythonScriptNode } from '../nodes/PythonScriptNode';

// Version 1.2 - Color management nodes
import { OCIOColorSpaceNode } from '../nodes/OCIOColorSpaceNode';
import { OCIOLookNode } from '../nodes/OCIOLookNode';

// Version 1.2 - Network rendering nodes
import { RenderFarmNode } from '../nodes/RenderFarmNode';
import { NetworkClientNode } from '../nodes/NetworkClientNode';

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
    this.nodeRegistry.set('Sharpen', SharpenNode as any);
    this.nodeRegistry.set('Glow', GlowNode as any);
    this.nodeRegistry.set('MotionBlur', MotionBlurNode as any);
    this.nodeRegistry.set('DepthOfField', DepthOfFieldNode as any);
    this.nodeRegistry.set('ChromaticAberration', ChromaticAberrationNode as any);
    this.nodeRegistry.set('Vignette', VignetteNode as any);
    this.nodeRegistry.set('FilmGrain', FilmGrainNode as any);
    
    // Color nodes
    this.nodeRegistry.set('ColorCorrect', ColorCorrectNode as any);
    this.nodeRegistry.set('Grade', GradeNode as any);
    this.nodeRegistry.set('Curves', CurvesNode as any);
    this.nodeRegistry.set('Levels', LevelsNode as any);
    this.nodeRegistry.set('HSL', HSLNode as any);
    
    // Composite nodes
    this.nodeRegistry.set('Merge', MergeNode as any);
    this.nodeRegistry.set('Screen', ScreenNode as any);
    this.nodeRegistry.set('Overlay', OverlayNode as any);
    
    // Transform nodes
    this.nodeRegistry.set('Transform', TransformNode as any);
    this.nodeRegistry.set('CornerPin', CornerPinNode as any);
    
    // Keying nodes
    this.nodeRegistry.set('ChromaKey', ChromaKeyNode as any);
    this.nodeRegistry.set('LuminanceKey', LuminanceKeyNode as any);
    this.nodeRegistry.set('Difference', DifferenceNode as any);
    
    // VFX Effect nodes
    this.nodeRegistry.set('Fire', FireNode as any);
    this.nodeRegistry.set('Water', WaterNode as any);
    this.nodeRegistry.set('Rain', RainNode as any);
    this.nodeRegistry.set('Snow', SnowNode as any);
    this.nodeRegistry.set('Smoke', SmokeNode as any);
    this.nodeRegistry.set('Clouds', CloudsNode as any);
    this.nodeRegistry.set('Explosion', ExplosionNode as any);
    this.nodeRegistry.set('Tornado', TornadoNode as any);
    this.nodeRegistry.set('Fog', FogNode as any);
    this.nodeRegistry.set('Lightning', LightningNode as any);
    this.nodeRegistry.set('Spark', SparkNode as any);
    this.nodeRegistry.set('Dissolve', DissolveNode as any);
    this.nodeRegistry.set('LensFlare', LensFlareNode as any);
    
    // Tracker nodes
    this.nodeRegistry.set('PointTracker', PointTrackerNode as any);
    this.nodeRegistry.set('PlanarTracker', PlanarTrackerNode as any);
    this.nodeRegistry.set('CornerDetector', CornerDetectorNode as any);
    this.nodeRegistry.set('OpticalFlow', OpticalFlowNode as any);
    this.nodeRegistry.set('Stabilizer', StabilizerNode as any);
    
    // Utility nodes
    this.nodeRegistry.set('Time', TimeNode as any);
    this.nodeRegistry.set('Math', MathNode as any);
    this.nodeRegistry.set('Switch', SwitchNode as any);
    this.nodeRegistry.set('Dot', DotNode as any);
    this.nodeRegistry.set('FrameHold', FrameHoldNode as any);
    this.nodeRegistry.set('TimeOffset', TimeOffsetNode as any);
    
    // Version 1.1 - 3D nodes
    this.nodeRegistry.set('Geometry3D', Geometry3DNode as any);
    this.nodeRegistry.set('Mesh', MeshNode as any);
    this.nodeRegistry.set('Camera', CameraNode as any);
    this.nodeRegistry.set('Light', LightNode as any);
    
    // Version 1.1 - Particle nodes
    this.nodeRegistry.set('ParticleSystem', ParticleSystemNode as any);
    this.nodeRegistry.set('ParticleEmitter', ParticleEmitterNode as any);
    this.nodeRegistry.set('ParticleForce', ParticleForceNode as any);
    
    // Version 1.1 - Enhanced tracking nodes
    this.nodeRegistry.set('MotionVectors', MotionVectorsNode as any);
    this.nodeRegistry.set('TrackingData', TrackingDataNode as any);
    
    // Version 1.1 - Keying and rotoscoping nodes
    this.nodeRegistry.set('Rotoscope', RotoscopeNode as any);
    this.nodeRegistry.set('SpillSuppression', SpillSuppressionNode as any);
    this.nodeRegistry.set('EdgeMatte', EdgeMatteNode as any);
    
    // Version 1.2 - Scripting nodes
    this.nodeRegistry.set('PythonScript', PythonScriptNode as any);
    
    // Version 1.2 - Color management nodes
    this.nodeRegistry.set('OCIOColorSpace', OCIOColorSpaceNode as any);
    this.nodeRegistry.set('OCIOLook', OCIOLookNode as any);
    
    // Version 1.2 - Network rendering nodes
    this.nodeRegistry.set('RenderFarm', RenderFarmNode as any);
    this.nodeRegistry.set('NetworkClient', NetworkClientNode as any);
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
