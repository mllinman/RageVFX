/**
 * GeometryNodesNode - Blender-style procedural geometry system
 * Version 3.6 - Blender Tools
 * 
 * Provides node-based geometry manipulation similar to Blender's Geometry Nodes
 */

import { Node, DataType } from '../core/Node';

interface GeometryData {
  vertices: Array<{ x: number; y: number; z: number }>;
  normals: Array<{ x: number; y: number; z: number }>;
  uvs: Array<{ u: number; v: number }>;
  faces: number[][];
  attributes: Map<string, any[]>;
}

export class GeometryNodesNode extends Node {
  private geometryCache: GeometryData | null = null;

  constructor(id: string) {
    super(id, 'GeometryNodes', 'Geometry Nodes');
    this.metadata.category = '3D';
    this.metadata.description = 'Blender-style procedural geometry manipulation with node-based operations';
    this.metadata.version = '3.6.0';
    
    // Inputs
    this.addInput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addInput('selection', 'Selection', DataType.ANY);
    this.addInput('curve', 'Curve', DataType.ANY);
    
    // Outputs
    this.addOutput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addOutput('attributes', 'Attributes', DataType.ANY);
    this.addOutput('instances', 'Instances', DataType.ANY);
    
    // Operation Mode
    this.setParameter('operationMode', 'transform'); // transform, extrude, subdivide, bevel, boolean, scatter, array
    this.setParameter('operationChain', []); // Array of operations to perform
    
    // Transform Operations
    this.setParameter('translation', { x: 0, y: 0, z: 0 });
    this.setParameter('rotation', { x: 0, y: 0, z: 0 });
    this.setParameter('scale', { x: 1, y: 1, z: 1 });
    
    // Extrude
    this.setParameter('extrudeDistance', 1.0);
    this.setParameter('extrudeIndividual', false);
    
    // Subdivide
    this.setParameter('subdivisionLevel', 1);
    this.setParameter('subdivisionType', 'catmull-clark'); // catmull-clark, simple, loop
    
    // Bevel
    this.setParameter('bevelWidth', 0.1);
    this.setParameter('bevelSegments', 2);
    this.setParameter('bevelProfile', 'linear'); // linear, convex, concave
    
    // Boolean Operations
    this.setParameter('booleanOperation', 'union'); // union, difference, intersect
    this.setParameter('booleanSolver', 'fast'); // fast, exact
    
    // Point Scatter
    this.setParameter('scatterCount', 100);
    this.setParameter('scatterDensity', 1.0);
    this.setParameter('scatterSeed', 42);
    this.setParameter('scatterMode', 'random'); // random, poisson, grid
    this.setParameter('scatterInstanceObject', null);
    
    // Curve to Mesh
    this.setParameter('curveResolution', 12);
    this.setParameter('curveRadius', 0.1);
    this.setParameter('curveFillCaps', true);
    
    // Mesh to Curve
    this.setParameter('edgeDetection', 'all'); // all, boundary, sharp
    
    // Attribute Operations
    this.setParameter('attributeName', 'position');
    this.setParameter('attributeOperation', 'set'); // set, add, multiply, mix
    this.setParameter('attributeValue', { x: 0, y: 0, z: 0 });
    
    // Proximity
    this.setParameter('proximityTarget', null);
    this.setParameter('proximityMode', 'points'); // points, edges, faces
    this.setParameter('proximityMaxDistance', 10.0);
    
    // Mesh Primitives
    this.setParameter('primitiveType', 'cube'); // cube, sphere, cylinder, cone, torus, plane, grid
    this.setParameter('primitiveSize', { x: 2, y: 2, z: 2 });
    this.setParameter('primitiveSegments', { u: 32, v: 16 });
    
    // Modifiers
    this.setParameter('noiseEnabled', false);
    this.setParameter('noiseScale', 1.0);
    this.setParameter('noiseStrength', 0.5);
    this.setParameter('noiseOctaves', 3);
    
    // Selection
    this.setParameter('selectionMode', 'all'); // all, vertices, edges, faces, random, bounding_box
    this.setParameter('selectionPercentage', 100);
    this.setParameter('selectionSeed', 123);
  }

  async process(): Promise<void> {
    const geometryInput = this.inputs.get('geometry');
    const selectionInput = this.inputs.get('selection');
    const curveInput = this.inputs.get('curve');
    
    const geometryOutput = this.outputs.get('geometry');
    const attributesOutput = this.outputs.get('attributes');
    const instancesOutput = this.outputs.get('instances');
    
    if (!geometryOutput) return;
    
    // Get or create geometry
    let geometry = geometryInput?.value || this.createPrimitiveGeometry();
    
    // Apply operations
    const operationMode = this.getParameter('operationMode') as string;
    const selection = selectionInput?.value;
    
    switch (operationMode) {
      case 'transform':
        geometry = this.applyTransform(geometry, selection);
        break;
      case 'extrude':
        geometry = this.applyExtrude(geometry, selection);
        break;
      case 'subdivide':
        geometry = this.applySubdivide(geometry, selection);
        break;
      case 'bevel':
        geometry = this.applyBevel(geometry, selection);
        break;
      case 'scatter':
        geometry = this.applyScatter(geometry);
        break;
      case 'boolean':
        geometry = this.applyBoolean(geometry);
        break;
      case 'curve_to_mesh':
        geometry = this.curveToMesh(curveInput?.value);
        break;
    }
    
    // Apply noise modifier if enabled
    if (this.getParameter('noiseEnabled')) {
      geometry = this.applyNoise(geometry);
    }
    
    // Output
    geometryOutput.value = geometry;
    
    if (attributesOutput && geometry.attributes) {
      attributesOutput.value = Object.fromEntries(geometry.attributes);
    }
    
    this.geometryCache = geometry;
  }
  
  private createPrimitiveGeometry(): GeometryData {
    const primitiveType = this.getParameter('primitiveType') as string;
    const size = this.getParameter('primitiveSize') as { x: number; y: number; z: number };
    const segments = this.getParameter('primitiveSegments') as { u: number; v: number };
    
    switch (primitiveType) {
      case 'cube':
        return this.createCube(size);
      case 'sphere':
        return this.createSphere(size.x / 2, segments.u, segments.v);
      case 'cylinder':
        return this.createCylinder(size.x / 2, size.y, segments.u);
      case 'plane':
        return this.createPlane(size.x, size.z, segments.u, segments.v);
      case 'grid':
        return this.createGrid(size.x, size.z, segments.u, segments.v);
      default:
        return this.createCube(size);
    }
  }
  
  private createCube(size: { x: number; y: number; z: number }): GeometryData {
    const sx = size.x / 2, sy = size.y / 2, sz = size.z / 2;
    
    return {
      vertices: [
        { x: -sx, y: -sy, z: -sz }, { x: sx, y: -sy, z: -sz },
        { x: sx, y: sy, z: -sz }, { x: -sx, y: sy, z: -sz },
        { x: -sx, y: -sy, z: sz }, { x: sx, y: -sy, z: sz },
        { x: sx, y: sy, z: sz }, { x: -sx, y: sy, z: sz }
      ],
      normals: [
        { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 },
        { x: 0, y: -1, z: 0 }, { x: 0, y: 1, z: 0 },
        { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }
      ],
      uvs: [],
      faces: [
        [0, 1, 2, 3], [4, 5, 6, 7], // Front and back
        [0, 4, 5, 1], [2, 6, 7, 3], // Bottom and top
        [0, 4, 7, 3], [1, 5, 6, 2]  // Left and right
      ],
      attributes: new Map()
    };
  }
  
  private createSphere(radius: number, segmentsU: number, segmentsV: number): GeometryData {
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    const normals: Array<{ x: number; y: number; z: number }> = [];
    const faces: number[][] = [];
    
    // Generate vertices
    for (let v = 0; v <= segmentsV; v++) {
      const theta = (v / segmentsV) * Math.PI;
      for (let u = 0; u <= segmentsU; u++) {
        const phi = (u / segmentsU) * 2 * Math.PI;
        
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);
        
        vertices.push({ x, y, z });
        normals.push({ 
          x: x / radius, 
          y: y / radius, 
          z: z / radius 
        });
      }
    }
    
    // Generate faces
    for (let v = 0; v < segmentsV; v++) {
      for (let u = 0; u < segmentsU; u++) {
        const i0 = v * (segmentsU + 1) + u;
        const i1 = i0 + 1;
        const i2 = i0 + segmentsU + 1;
        const i3 = i2 + 1;
        
        faces.push([i0, i1, i3, i2]);
      }
    }
    
    return { vertices, normals, uvs: [], faces, attributes: new Map() };
  }
  
  private createCylinder(radius: number, height: number, segments: number): GeometryData {
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    const normals: Array<{ x: number; y: number; z: number }> = [];
    const faces: number[][] = [];
    
    const halfHeight = height / 2;
    
    // Bottom and top circles
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      vertices.push({ x, y: -halfHeight, z });
      vertices.push({ x, y: halfHeight, z });
      
      normals.push({ x: x / radius, y: 0, z: z / radius });
      normals.push({ x: x / radius, y: 0, z: z / radius });
    }
    
    // Generate side faces
    for (let i = 0; i < segments; i++) {
      const i0 = i * 2;
      const i1 = i0 + 1;
      const i2 = (i + 1) * 2;
      const i3 = i2 + 1;
      
      faces.push([i0, i2, i3, i1]);
    }
    
    return { vertices, normals, uvs: [], faces, attributes: new Map() };
  }
  
  private createPlane(width: number, height: number, segmentsX: number, segmentsY: number): GeometryData {
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    const normals: Array<{ x: number; y: number; z: number }> = [];
    const faces: number[][] = [];
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    for (let y = 0; y <= segmentsY; y++) {
      for (let x = 0; x <= segmentsX; x++) {
        const px = (x / segmentsX - 0.5) * width;
        const py = 0;
        const pz = (y / segmentsY - 0.5) * height;
        
        vertices.push({ x: px, y: py, z: pz });
        normals.push({ x: 0, y: 1, z: 0 });
      }
    }
    
    for (let y = 0; y < segmentsY; y++) {
      for (let x = 0; x < segmentsX; x++) {
        const i0 = y * (segmentsX + 1) + x;
        const i1 = i0 + 1;
        const i2 = i0 + segmentsX + 1;
        const i3 = i2 + 1;
        
        faces.push([i0, i1, i3, i2]);
      }
    }
    
    return { vertices, normals, uvs: [], faces, attributes: new Map() };
  }
  
  private createGrid(width: number, height: number, segmentsX: number, segmentsY: number): GeometryData {
    return this.createPlane(width, height, segmentsX, segmentsY);
  }
  
  private applyTransform(geometry: GeometryData, selection: any): GeometryData {
    const translation = this.getParameter('translation') as { x: number; y: number; z: number };
    const rotation = this.getParameter('rotation') as { x: number; y: number; z: number };
    const scale = this.getParameter('scale') as { x: number; y: number; z: number };
    
    const result = { ...geometry };
    result.vertices = geometry.vertices.map(v => {
      // Apply scale
      let x = v.x * scale.x;
      let y = v.y * scale.y;
      let z = v.z * scale.z;
      
      // Apply rotation (simplified - using Euler angles)
      const rx = rotation.x * Math.PI / 180;
      const ry = rotation.y * Math.PI / 180;
      const rz = rotation.z * Math.PI / 180;
      
      // Rotate around X
      let ny = y * Math.cos(rx) - z * Math.sin(rx);
      let nz = y * Math.sin(rx) + z * Math.cos(rx);
      y = ny;
      z = nz;
      
      // Rotate around Y
      let nx = x * Math.cos(ry) + z * Math.sin(ry);
      nz = -x * Math.sin(ry) + z * Math.cos(ry);
      x = nx;
      z = nz;
      
      // Rotate around Z
      nx = x * Math.cos(rz) - y * Math.sin(rz);
      ny = x * Math.sin(rz) + y * Math.cos(rz);
      x = nx;
      y = ny;
      
      // Apply translation
      return {
        x: x + translation.x,
        y: y + translation.y,
        z: z + translation.z
      };
    });
    
    return result;
  }
  
  private applyExtrude(geometry: GeometryData, selection: any): GeometryData {
    const distance = this.getParameter('extrudeDistance') as number;
    const individual = this.getParameter('extrudeIndividual') as boolean;
    
    // Simplified extrude: offset vertices along normals
    const result = { ...geometry };
    result.vertices = geometry.vertices.map((v, i) => {
      const normal = geometry.normals[i] || { x: 0, y: 1, z: 0 };
      return {
        x: v.x + normal.x * distance,
        y: v.y + normal.y * distance,
        z: v.z + normal.z * distance
      };
    });
    
    return result;
  }
  
  private applySubdivide(geometry: GeometryData, selection: any): GeometryData {
    const level = this.getParameter('subdivisionLevel') as number;
    
    // Simplified subdivision (just return original for now)
    // A full Catmull-Clark subdivision would be complex
    return geometry;
  }
  
  private applyBevel(geometry: GeometryData, selection: any): GeometryData {
    const width = this.getParameter('bevelWidth') as number;
    const segments = this.getParameter('bevelSegments') as number;
    
    // Simplified bevel
    return geometry;
  }
  
  private applyScatter(geometry: GeometryData): GeometryData {
    const count = this.getParameter('scatterCount') as number;
    const seed = this.getParameter('scatterSeed') as number;
    
    // Generate random points on surface
    const result = { ...geometry };
    const scatterPoints: Array<{ x: number; y: number; z: number }> = [];
    
    let rng = seed;
    const random = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };
    
    for (let i = 0; i < count; i++) {
      // Random barycentric coordinates for face sampling
      const faceIndex = Math.floor(random() * geometry.faces.length);
      const face = geometry.faces[faceIndex];
      
      if (face && face.length >= 3) {
        const v0 = geometry.vertices[face[0]];
        const v1 = geometry.vertices[face[1]];
        const v2 = geometry.vertices[face[2]];
        
        const u = random();
        const v = random();
        const w = 1 - u - v;
        
        if (w >= 0) {
          scatterPoints.push({
            x: v0.x * u + v1.x * v + v2.x * w,
            y: v0.y * u + v1.y * v + v2.y * w,
            z: v0.z * u + v1.z * v + v2.z * w
          });
        }
      }
    }
    
    result.vertices = [...result.vertices, ...scatterPoints];
    
    return result;
  }
  
  private applyBoolean(geometry: GeometryData): GeometryData {
    // Simplified boolean operation
    return geometry;
  }
  
  private curveToMesh(curveData: any): GeometryData {
    if (!curveData) {
      return this.createPrimitiveGeometry();
    }
    
    // Simplified curve to mesh conversion
    return this.createCylinder(0.1, 1, 12);
  }
  
  private applyNoise(geometry: GeometryData): GeometryData {
    const scale = this.getParameter('noiseScale') as number;
    const strength = this.getParameter('noiseStrength') as number;
    
    const result = { ...geometry };
    result.vertices = geometry.vertices.map((v, i) => {
      const noiseValue = this.noise3D(v.x * scale, v.y * scale, v.z * scale);
      const normal = geometry.normals[i] || { x: 0, y: 1, z: 0 };
      
      return {
        x: v.x + normal.x * noiseValue * strength,
        y: v.y + normal.y * noiseValue * strength,
        z: v.z + normal.z * noiseValue * strength
      };
    });
    
    return result;
  }
  
  private noise3D(x: number, y: number, z: number): number {
    // Simple 3D noise
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }
  
  dispose(): void {
    this.geometryCache = null;
    super.dispose();
  }
}
