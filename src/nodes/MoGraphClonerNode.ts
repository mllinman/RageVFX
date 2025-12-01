/**
 * MoGraphClonerNode - Cinema 4D-style cloner for procedural duplication
 * Version 3.6 - Cinema 4D Tools
 * 
 * Creates multiple copies of objects with various distribution patterns
 * like Cinema 4D's MoGraph Cloner
 */

import { Node, DataType } from '../core/Node';

interface CloneInstance {
  index: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number; a: number };
  visibility: number;
}

export class MoGraphClonerNode extends Node {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private cloneCache: CloneInstance[] = [];

  constructor(id: string) {
    super(id, 'MoGraphCloner', 'MoGraph Cloner');
    this.metadata.category = 'MotionGraphics';
    this.metadata.description = 'Cinema 4D-style cloner for procedural duplication with multiple distribution modes';
    this.metadata.version = '3.6.0';
    
    // Inputs
    this.addInput('object', 'Object', DataType.GEOMETRY_3D);
    this.addInput('spline', 'Spline Path', DataType.ANY);
    this.addInput('effector', 'Effector', DataType.ANY);
    
    // Outputs
    this.addOutput('clones', 'Clone Instances', DataType.GEOMETRY_3D);
    this.addOutput('matrix', 'Matrix Data', DataType.MATRIX);
    this.addOutput('instanceData', 'Instance Data', DataType.ANY);
    
    // Mode Settings
    this.setParameter('mode', 'linear'); // linear, radial, grid, object, spline, random, honeycomb
    this.setParameter('count', 10);
    this.setParameter('seed', 12345);
    
    // Linear Mode
    this.setParameter('offset', { x: 100, y: 0, z: 0 });
    
    // Radial Mode
    this.setParameter('radius', 200);
    this.setParameter('startAngle', 0);
    this.setParameter('endAngle', 360);
    this.setParameter('plane', 'xy'); // xy, xz, yz
    
    // Grid Mode
    this.setParameter('gridSize', { x: 5, y: 5, z: 1 });
    this.setParameter('gridSpacing', { x: 100, y: 100, z: 100 });
    
    // Honeycomb Mode
    this.setParameter('honeycombSize', 50);
    this.setParameter('honeycombRows', 5);
    this.setParameter('honeycombCols', 5);
    
    // Object Mode
    this.setParameter('distributionObject', null);
    this.setParameter('distributionMode', 'vertices'); // vertices, edges, faces, volume
    
    // Spline Mode
    this.setParameter('splineSteps', 20);
    this.setParameter('splineOffset', 0);
    this.setParameter('alignToSpline', true);
    
    // Random Mode
    this.setParameter('randomBounds', { x: 500, y: 500, z: 500 });
    this.setParameter('randomCenter', { x: 0, y: 0, z: 0 });
    
    // Transform Settings
    this.setParameter('globalTransform', { 
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    });
    
    // Per-Clone Variation
    this.setParameter('randomRotation', { x: 0, y: 0, z: 0 }); // Random range in degrees
    this.setParameter('randomScale', { min: 1, max: 1 });
    this.setParameter('randomPosition', { x: 0, y: 0, z: 0 }); // Random jitter
    
    // Step Effector (built-in)
    this.setParameter('stepRotation', { x: 0, y: 0, z: 0 }); // Rotation per clone
    this.setParameter('stepScale', { x: 0, y: 0, z: 0 }); // Scale change per clone
    this.setParameter('stepPosition', { x: 0, y: 0, z: 0 }); // Position offset per clone
    
    // Color Settings
    this.setParameter('colorMode', 'none'); // none, gradient, random, index
    this.setParameter('colorStart', { r: 255, g: 100, b: 0, a: 255 });
    this.setParameter('colorEnd', { r: 100, g: 200, b: 255, a: 255 });
    this.setParameter('randomColorVariation', 0);
    
    // Visibility
    this.setParameter('visibilityStart', 1.0);
    this.setParameter('visibilityEnd', 1.0);
    
    // Animation
    this.setParameter('timeOffset', 0);
    this.setParameter('timeOffsetPerClone', 0);
    
    // Instance Optimization
    this.setParameter('instanceRendering', true);
    this.setParameter('lodDistance', 1000); // Level of detail switching distance
  }

  async process(): Promise<void> {
    const objectInput = this.inputs.get('object');
    const splineInput = this.inputs.get('spline');
    const effectorInput = this.inputs.get('effector');
    
    const clonesOutput = this.outputs.get('clones');
    const matrixOutput = this.outputs.get('matrix');
    const instanceDataOutput = this.outputs.get('instanceData');
    
    if (!objectInput?.value || !clonesOutput) {
      return;
    }
    
    // Generate clone instances based on mode
    const mode = this.getParameter('mode') as string;
    const count = this.getParameter('count') as number;
    
    this.cloneCache = [];
    
    switch (mode) {
      case 'linear':
        this.generateLinearClones(count);
        break;
      case 'radial':
        this.generateRadialClones(count);
        break;
      case 'grid':
        this.generateGridClones();
        break;
      case 'honeycomb':
        this.generateHoneycombClones();
        break;
      case 'spline':
        this.generateSplineClones(count, splineInput?.value);
        break;
      case 'random':
        this.generateRandomClones(count);
        break;
      case 'object':
        this.generateObjectClones(objectInput.value);
        break;
    }
    
    // Apply effectors if provided
    if (effectorInput?.value) {
      this.applyEffector(effectorInput.value);
    }
    
    // Apply step effector
    this.applyStepEffector();
    
    // Apply color modes
    this.applyColorMode();
    
    // Output clone data
    clonesOutput.value = this.cloneCache;
    if (matrixOutput) {
      matrixOutput.value = this.generateMatrixData();
    }
    if (instanceDataOutput) {
      instanceDataOutput.value = this.cloneCache;
    }
  }
  
  private generateLinearClones(count: number): void {
    const offset = this.getParameter('offset') as { x: number; y: number; z: number };
    
    for (let i = 0; i < count; i++) {
      this.cloneCache.push({
        index: i,
        position: {
          x: offset.x * i,
          y: offset.y * i,
          z: offset.z * i
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 255, g: 255, b: 255, a: 255 },
        visibility: 1
      });
    }
  }
  
  private generateRadialClones(count: number): void {
    const radius = this.getParameter('radius') as number;
    const startAngle = (this.getParameter('startAngle') as number) * Math.PI / 180;
    const endAngle = (this.getParameter('endAngle') as number) * Math.PI / 180;
    const plane = this.getParameter('plane') as string;
    
    const angleStep = (endAngle - startAngle) / Math.max(1, count - 1);
    
    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      let pos = { x: 0, y: 0, z: 0 };
      
      switch (plane) {
        case 'xy':
          pos = { 
            x: Math.cos(angle) * radius, 
            y: Math.sin(angle) * radius, 
            z: 0 
          };
          break;
        case 'xz':
          pos = { 
            x: Math.cos(angle) * radius, 
            y: 0,
            z: Math.sin(angle) * radius
          };
          break;
        case 'yz':
          pos = { 
            x: 0,
            y: Math.cos(angle) * radius, 
            z: Math.sin(angle) * radius
          };
          break;
      }
      
      this.cloneCache.push({
        index: i,
        position: pos,
        rotation: { x: 0, y: angle * 180 / Math.PI, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 255, g: 255, b: 255, a: 255 },
        visibility: 1
      });
    }
  }
  
  private generateGridClones(): void {
    const gridSize = this.getParameter('gridSize') as { x: number; y: number; z: number };
    const spacing = this.getParameter('gridSpacing') as { x: number; y: number; z: number };
    
    let index = 0;
    for (let z = 0; z < gridSize.z; z++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
          this.cloneCache.push({
            index: index++,
            position: {
              x: x * spacing.x - (gridSize.x - 1) * spacing.x / 2,
              y: y * spacing.y - (gridSize.y - 1) * spacing.y / 2,
              z: z * spacing.z - (gridSize.z - 1) * spacing.z / 2
            },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: { r: 255, g: 255, b: 255, a: 255 },
            visibility: 1
          });
        }
      }
    }
  }
  
  private generateHoneycombClones(): void {
    const size = this.getParameter('honeycombSize') as number;
    const rows = this.getParameter('honeycombRows') as number;
    const cols = this.getParameter('honeycombCols') as number;
    
    const width = size * Math.sqrt(3);
    const height = size * 1.5;
    
    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = (row % 2) * width / 2;
        this.cloneCache.push({
          index: index++,
          position: {
            x: col * width + offsetX - cols * width / 2,
            y: row * height - rows * height / 2,
            z: 0
          },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: { r: 255, g: 255, b: 255, a: 255 },
          visibility: 1
        });
      }
    }
  }
  
  private generateSplineClones(count: number, splineData: any): void {
    if (!splineData) {
      this.generateLinearClones(count);
      return;
    }
    
    const alignToSpline = this.getParameter('alignToSpline') as boolean;
    
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const pos = this.evaluateSpline(splineData, t);
      const tangent = this.evaluateSplineTangent(splineData, t);
      
      const rotation = alignToSpline ? {
        x: 0,
        y: Math.atan2(tangent.z, tangent.x) * 180 / Math.PI,
        z: 0
      } : { x: 0, y: 0, z: 0 };
      
      this.cloneCache.push({
        index: i,
        position: pos,
        rotation: rotation,
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 255, g: 255, b: 255, a: 255 },
        visibility: 1
      });
    }
  }
  
  private generateRandomClones(count: number): void {
    const bounds = this.getParameter('randomBounds') as { x: number; y: number; z: number };
    const center = this.getParameter('randomCenter') as { x: number; y: number; z: number };
    const seed = this.getParameter('seed') as number;
    
    // Simple seeded random
    let rng = seed;
    const random = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };
    
    for (let i = 0; i < count; i++) {
      this.cloneCache.push({
        index: i,
        position: {
          x: center.x + (random() - 0.5) * bounds.x,
          y: center.y + (random() - 0.5) * bounds.y,
          z: center.z + (random() - 0.5) * bounds.z
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 255, g: 255, b: 255, a: 255 },
        visibility: 1
      });
    }
  }
  
  private generateObjectClones(objectData: any): void {
    // Simplified object-based distribution
    const distributionMode = this.getParameter('distributionMode') as string;
    const count = this.getParameter('count') as number;
    
    // For now, just distribute along a simple path
    this.generateLinearClones(count);
  }
  
  private applyStepEffector(): void {
    const stepRotation = this.getParameter('stepRotation') as { x: number; y: number; z: number };
    const stepScale = this.getParameter('stepScale') as { x: number; y: number; z: number };
    const stepPosition = this.getParameter('stepPosition') as { x: number; y: number; z: number };
    
    for (let i = 0; i < this.cloneCache.length; i++) {
      const clone = this.cloneCache[i];
      
      clone.rotation.x += stepRotation.x * i;
      clone.rotation.y += stepRotation.y * i;
      clone.rotation.z += stepRotation.z * i;
      
      clone.scale.x += stepScale.x * i;
      clone.scale.y += stepScale.y * i;
      clone.scale.z += stepScale.z * i;
      
      clone.position.x += stepPosition.x * i;
      clone.position.y += stepPosition.y * i;
      clone.position.z += stepPosition.z * i;
    }
  }
  
  private applyColorMode(): void {
    const colorMode = this.getParameter('colorMode') as string;
    const colorStart = this.getParameter('colorStart') as { r: number; g: number; b: number; a: number };
    const colorEnd = this.getParameter('colorEnd') as { r: number; g: number; b: number; a: number };
    
    if (colorMode === 'none') return;
    
    for (let i = 0; i < this.cloneCache.length; i++) {
      const clone = this.cloneCache[i];
      const t = i / Math.max(1, this.cloneCache.length - 1);
      
      if (colorMode === 'gradient') {
        clone.color = {
          r: colorStart.r + (colorEnd.r - colorStart.r) * t,
          g: colorStart.g + (colorEnd.g - colorStart.g) * t,
          b: colorStart.b + (colorEnd.b - colorStart.b) * t,
          a: colorStart.a + (colorEnd.a - colorStart.a) * t
        };
      } else if (colorMode === 'index') {
        const hue = (i * 360 / this.cloneCache.length) % 360;
        const rgb = this.hslToRgb(hue / 360, 0.7, 0.5);
        clone.color = { r: rgb.r, g: rgb.g, b: rgb.b, a: 255 };
      }
    }
  }
  
  private applyEffector(effectorData: any): void {
    // Apply external effector data to clones
    if (!effectorData || !effectorData.transforms) return;
    
    for (let i = 0; i < Math.min(this.cloneCache.length, effectorData.transforms.length); i++) {
      const transform = effectorData.transforms[i];
      const clone = this.cloneCache[i];
      
      if (transform.position) {
        clone.position.x += transform.position.x || 0;
        clone.position.y += transform.position.y || 0;
        clone.position.z += transform.position.z || 0;
      }
      
      if (transform.rotation) {
        clone.rotation.x += transform.rotation.x || 0;
        clone.rotation.y += transform.rotation.y || 0;
        clone.rotation.z += transform.rotation.z || 0;
      }
      
      if (transform.scale) {
        clone.scale.x *= transform.scale.x || 1;
        clone.scale.y *= transform.scale.y || 1;
        clone.scale.z *= transform.scale.z || 1;
      }
    }
  }
  
  private evaluateSpline(splineData: any, t: number): { x: number; y: number; z: number } {
    // Simple linear interpolation for now
    if (!splineData.points || splineData.points.length < 2) {
      return { x: 0, y: 0, z: 0 };
    }
    
    const segmentT = t * (splineData.points.length - 1);
    const index = Math.floor(segmentT);
    const localT = segmentT - index;
    
    const p0 = splineData.points[Math.min(index, splineData.points.length - 1)];
    const p1 = splineData.points[Math.min(index + 1, splineData.points.length - 1)];
    
    return {
      x: p0.x + (p1.x - p0.x) * localT,
      y: p0.y + (p1.y - p0.y) * localT,
      z: p0.z + (p1.z - p0.z) * localT
    };
  }
  
  private evaluateSplineTangent(splineData: any, t: number): { x: number; y: number; z: number } {
    const epsilon = 0.001;
    const p0 = this.evaluateSpline(splineData, Math.max(0, t - epsilon));
    const p1 = this.evaluateSpline(splineData, Math.min(1, t + epsilon));
    
    return {
      x: p1.x - p0.x,
      y: p1.y - p0.y,
      z: p1.z - p0.z
    };
  }
  
  private generateMatrixData(): number[][] {
    // Generate transformation matrices for instancing
    return this.cloneCache.map(clone => {
      // Simplified 4x4 matrix (position, rotation, scale)
      return [
        clone.scale.x, 0, 0, clone.position.x,
        0, clone.scale.y, 0, clone.position.y,
        0, 0, clone.scale.z, clone.position.z,
        0, 0, 0, 1
      ];
    });
  }
  
  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r: number, g: number, b: number;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
  
  dispose(): void {
    this.cloneCache = [];
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    super.dispose();
  }
}
