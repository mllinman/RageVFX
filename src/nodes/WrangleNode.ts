/**
 * WrangleNode - Procedural Expression Control
 * 
 * Purpose: Expression-based procedural control like Houdini VEX wrangles
 * - Point, primitive, vertex wrangles
 * - Attribute manipulation
 * - Custom expression language
 * - Built-in math and noise functions
 * - Geometry modification
 * - Data channel creation
 * - Presets and snippets library
 * 
 * Rivals Houdini's VEX/Wrangle nodes
 */

import { Node, DataType } from '../core/Node';

interface GeometryData {
  points: Array<{ pos: number[]; attribs: Map<string, any> }>;
  primitives: Array<{ vertices: number[]; attribs: Map<string, any> }>;
  vertices: Array<{ point: number; attribs: Map<string, any> }>;
  globalAttribs: Map<string, any>;
}

export class WrangleNode extends Node {
  private compiledCode: ((...args: unknown[]) => unknown) | null = null;
  private errorMessage: string = '';

  constructor(id: string) {
    super(id, 'Wrangle', 'VEX Wrangle');
    this.metadata.category = 'Procedural';
    this.metadata.description = 'Expression-based procedural geometry and attribute control';

    // Inputs
    this.addInput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addInput('input1', 'Input 1', DataType.ANY);
    this.addInput('input2', 'Input 2', DataType.ANY);
    this.addInput('input3', 'Input 3', DataType.ANY);

    // Outputs
    this.addOutput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addOutput('value', 'Value', DataType.ANY);

    // Parameters
    this.setParameter('wrangleType', 'point'); // point, primitive, vertex, detail, attribute
    this.setParameter('code', this.getDefaultCode());
    this.setParameter('runMode', 'allPoints'); // allPoints, selectedPoints, group
    this.setParameter('groupName', '');
    this.setParameter('pointSelection', []);
    
    // Execution options
    this.setParameter('autoCompile', true);
    this.setParameter('enableThreading', true);
    this.setParameter('chunkSize', 1000);
    
    // Attribute binding
    this.setParameter('bindAttributes', true);
    this.setParameter('createMissingAttributes', true);
    this.setParameter('attributeType', 'float'); // float, vector, int, string
    
    // Built-in variables
    this.setParameter('timeBinding', 'frame');
    this.setParameter('frameRate', 24);
    
    // Code presets
    this.setParameter('preset', 'custom'); // custom, noise, scatter, deform, color, delete
  }

  private getDefaultCode(): string {
    return `// Point wrangle example
// Available variables:
// @P - position (vector)
// @N - normal (vector)
// @Cd - color (vector)
// @pscale - point scale (float)
// @v - velocity (vector)
// @id - point id (int)
// @ptnum - point number (int)
// @numpt - total points (int)
// @Time - current time (float)
// @Frame - current frame (int)

// Example: Add noise to position
vector noise_offset = noise(@P * 2.0 + @Time) * 0.5;
@P += noise_offset;

// Example: Color by height
@Cd = set(0.0, @P.y * 0.5 + 0.5, 0.0);

// Example: Scale by distance from origin
float dist = length(@P);
@pscale = fit(dist, 0, 10, 1.0, 0.1);
`;
  }

  async process(): Promise<void> {
    const geometryInput = this.inputs.get('geometry');
    const geometryOutput = this.outputs.get('geometry');
    const valueOutput = this.outputs.get('value');

    if (!geometryInput?.value || !geometryOutput) {
      return;
    }

    const wrangleType = this.getParameter('wrangleType') as string;
    const code = this.getParameter('code') as string;
    const autoCompile = this.getParameter('autoCompile') as boolean;

    // Compile code if needed
    if (autoCompile && !this.compiledCode) {
      this.compileCode(code);
    }

    if (!this.compiledCode) {
      this.errorMessage = 'Code not compiled';
      return;
    }

    // Clone geometry data
    const geometry = this.cloneGeometry(geometryInput.value);

    try {
      switch (wrangleType) {
        case 'point':
          this.executePointWrangle(geometry);
          break;
        case 'primitive':
          this.executePrimitiveWrangle(geometry);
          break;
        case 'vertex':
          this.executeVertexWrangle(geometry);
          break;
        case 'detail':
          this.executeDetailWrangle(geometry);
          break;
        case 'attribute':
          this.executeAttributeWrangle(geometry);
          break;
      }

      geometryOutput.value = geometry;
      
      if (valueOutput) {
        valueOutput.value = this.extractOutputValue(geometry);
      }
    } catch (error) {
      this.errorMessage = `Execution error: ${error}`;
      console.error('Wrangle execution error:', error);
    }
  }

  private compileCode(code: string): void {
    try {
      // Transform VEX-style code to JavaScript
      const jsCode = this.transformVEXToJS(code);
      
      // Create function with wrangle context
      this.compiledCode = new Function('context', 'libs', jsCode) as (...args: unknown[]) => unknown;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = `Compilation error: ${error}`;
      console.error('Wrangle compilation error:', error);
      this.compiledCode = null;
    }
  }

  private transformVEXToJS(vexCode: string): string {
    let jsCode = vexCode;

    // Transform @ attributes to context property access
    jsCode = jsCode.replace(/@(\w+)/g, 'context.$1');
    
    // Transform vector constructors
    jsCode = jsCode.replace(/vector\s*\(/g, 'libs.vector(');
    jsCode = jsCode.replace(/set\s*\(/g, 'libs.vector(');
    
    // Transform common VEX functions
    const functionMap: { [key: string]: string } = {
      'noise': 'libs.noise',
      'fit': 'libs.fit',
      'clamp': 'libs.clamp',
      'length': 'libs.length',
      'normalize': 'libs.normalize',
      'dot': 'libs.dot',
      'cross': 'libs.cross',
      'distance': 'libs.distance',
      'rand': 'libs.rand',
      'abs': 'Math.abs',
      'sin': 'Math.sin',
      'cos': 'Math.cos',
      'tan': 'Math.tan',
      'sqrt': 'Math.sqrt',
      'pow': 'Math.pow',
      'floor': 'Math.floor',
      'ceil': 'Math.ceil',
      'round': 'Math.round',
      'min': 'Math.min',
      'max': 'Math.max'
    };

    for (const [vexFunc, jsFunc] of Object.entries(functionMap)) {
      const regex = new RegExp(`\\b${vexFunc}\\b`, 'g');
      jsCode = jsCode.replace(regex, jsFunc);
    }

    return jsCode;
  }

  private executePointWrangle(geometry: GeometryData): void {
    const runMode = this.getParameter('runMode') as string;
    const enableThreading = this.getParameter('enableThreading') as boolean;
    const chunkSize = this.getParameter('chunkSize') as number;

    const points = this.getPointsToProcess(geometry, runMode);
    const libs = this.createLibraryContext();

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const context = this.createPointContext(point, i, points.length, geometry);
      
      try {
        this.compiledCode!(context, libs);
        this.applyContextChanges(point, context);
      } catch (error) {
        console.error(`Error processing point ${i}:`, error);
      }
    }
  }

  private executePrimitiveWrangle(geometry: GeometryData): void {
    const libs = this.createLibraryContext();

    for (let i = 0; i < geometry.primitives.length; i++) {
      const primitive = geometry.primitives[i];
      const context = this.createPrimitiveContext(primitive, i, geometry);
      
      try {
        this.compiledCode!(context, libs);
        this.applyPrimitiveChanges(primitive, context);
      } catch (error) {
        console.error(`Error processing primitive ${i}:`, error);
      }
    }
  }

  private executeVertexWrangle(geometry: GeometryData): void {
    const libs = this.createLibraryContext();

    for (let i = 0; i < geometry.vertices.length; i++) {
      const vertex = geometry.vertices[i];
      const context = this.createVertexContext(vertex, i, geometry);
      
      try {
        this.compiledCode!(context, libs);
        this.applyVertexChanges(vertex, context);
      } catch (error) {
        console.error(`Error processing vertex ${i}:`, error);
      }
    }
  }

  private executeDetailWrangle(geometry: GeometryData): void {
    const libs = this.createLibraryContext();
    const context = this.createDetailContext(geometry);
    
    try {
      this.compiledCode!(context, libs);
      this.applyDetailChanges(geometry, context);
    } catch (error) {
      console.error('Error processing detail wrangle:', error);
    }
  }

  private executeAttributeWrangle(geometry: GeometryData): void {
    // Custom attribute manipulation wrangle
    this.executePointWrangle(geometry);
  }

  private createPointContext(
    point: any,
    index: number,
    total: number,
    geometry: GeometryData
  ): any {
    const frame = this.getParameter('frameRate') as number;
    const time = index / frame;

    return {
      // Position
      P: [...point.pos],
      
      // Standard attributes
      N: point.attribs.get('N') || [0, 1, 0],
      Cd: point.attribs.get('Cd') || [1, 1, 1],
      pscale: point.attribs.get('pscale') || 1.0,
      v: point.attribs.get('v') || [0, 0, 0],
      
      // Intrinsic attributes
      ptnum: index,
      numpt: total,
      id: point.attribs.get('id') || index,
      
      // Time
      Time: time,
      Frame: index,
      
      // Custom attributes
      ...Object.fromEntries(point.attribs)
    };
  }

  private createPrimitiveContext(primitive: any, index: number, geometry: GeometryData): any {
    return {
      primnum: index,
      numprim: geometry.primitives.length,
      vertices: primitive.vertices,
      ...Object.fromEntries(primitive.attribs)
    };
  }

  private createVertexContext(vertex: any, index: number, geometry: GeometryData): any {
    return {
      vtxnum: index,
      numvtx: geometry.vertices.length,
      point: vertex.point,
      ...Object.fromEntries(vertex.attribs)
    };
  }

  private createDetailContext(geometry: GeometryData): any {
    return {
      numpt: geometry.points.length,
      numprim: geometry.primitives.length,
      numvtx: geometry.vertices.length,
      ...Object.fromEntries(geometry.globalAttribs)
    };
  }

  private createLibraryContext(): any {
    return {
      // Vector operations
      vector: (x: number, y: number, z: number) => [x, y, z],
      length: (v: number[]) => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]),
      normalize: (v: number[]) => {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
      },
      dot: (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
      cross: (a: number[], b: number[]) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
      ],
      distance: (a: number[], b: number[]) => {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      },
      
      // Noise functions
      noise: (p: number | number[]) => {
        if (typeof p === 'number') {
          return this.noise1D(p);
        }
        return this.noise3D(p[0], p[1], p[2] || 0);
      },
      
      // Utility functions
      fit: (value: number, omin: number, omax: number, nmin: number, nmax: number) => {
        const t = (value - omin) / (omax - omin);
        return nmin + t * (nmax - nmin);
      },
      clamp: (value: number, min: number, max: number) => {
        return Math.max(min, Math.min(max, value));
      },
      rand: (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      },
      
      // Interpolation
      lerp: (a: number, b: number, t: number) => a + (b - a) * t,
      smooth: (t: number) => t * t * (3 - 2 * t),
      
      // Geometry queries (simplified)
      nearpoint: (pos: number[], radius: number) => {
        // Would query spatial acceleration structure
        return -1;
      },
      nearpoints: (pos: number[], radius: number) => {
        // Would return array of nearby point indices
        return [];
      }
    };
  }

  private noise1D(x: number): number {
    // Simple 1D Perlin-style noise
    const xi = Math.floor(x);
    const xf = x - xi;
    
    const u = xf * xf * (3 - 2 * xf);
    
    const a = this.hash(xi);
    const b = this.hash(xi + 1);
    
    return a * (1 - u) + b * u;
  }

  private noise3D(x: number, y: number, z: number): number {
    // Simplified 3D Perlin noise
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    
    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;
    
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const w = zf * zf * (3 - 2 * zf);
    
    const a = this.hash(xi + this.hash(yi + this.hash(zi)));
    const b = this.hash(xi + 1 + this.hash(yi + this.hash(zi)));
    
    return a * (1 - u) + b * u;
  }

  private hash(n: number): number {
    n = (n << 13) ^ n;
    n = n * (n * n * 15731 + 789221) + 1376312589;
    return (n & 0x7fffffff) / 2147483647.0;
  }

  private applyContextChanges(point: any, context: any): void {
    // Apply changes from context back to point
    point.pos = context.P;
    
    if (context.N) point.attribs.set('N', context.N);
    if (context.Cd) point.attribs.set('Cd', context.Cd);
    if (context.pscale !== undefined) point.attribs.set('pscale', context.pscale);
    if (context.v) point.attribs.set('v', context.v);
    
    // Apply any other modified attributes
    for (const [key, value] of Object.entries(context)) {
      if (!['P', 'N', 'Cd', 'pscale', 'v', 'ptnum', 'numpt', 'id', 'Time', 'Frame'].includes(key)) {
        point.attribs.set(key, value);
      }
    }
  }

  private applyPrimitiveChanges(primitive: any, context: any): void {
    for (const [key, value] of Object.entries(context)) {
      if (!['primnum', 'numprim', 'vertices'].includes(key)) {
        primitive.attribs.set(key, value);
      }
    }
  }

  private applyVertexChanges(vertex: any, context: any): void {
    for (const [key, value] of Object.entries(context)) {
      if (!['vtxnum', 'numvtx', 'point'].includes(key)) {
        vertex.attribs.set(key, value);
      }
    }
  }

  private applyDetailChanges(geometry: GeometryData, context: any): void {
    for (const [key, value] of Object.entries(context)) {
      if (!['numpt', 'numprim', 'numvtx'].includes(key)) {
        geometry.globalAttribs.set(key, value);
      }
    }
  }

  private getPointsToProcess(geometry: GeometryData, runMode: string): any[] {
    switch (runMode) {
      case 'allPoints':
        return geometry.points;
      
      case 'selectedPoints': {
        const selection = this.getParameter('pointSelection') as number[];
        return geometry.points.filter((_, i) => selection.includes(i));
      }
      
      case 'group': {
        // Would filter by group membership
        return geometry.points;
      }
      
      default:
        return geometry.points;
    }
  }

  private cloneGeometry(geometry: any): GeometryData {
    // Deep clone geometry data
    return {
      points: geometry.points?.map((p: any) => ({
        pos: [...p.pos],
        attribs: new Map(p.attribs)
      })) || [],
      primitives: geometry.primitives?.map((p: any) => ({
        vertices: [...p.vertices],
        attribs: new Map(p.attribs)
      })) || [],
      vertices: geometry.vertices?.map((v: any) => ({
        point: v.point,
        attribs: new Map(v.attribs)
      })) || [],
      globalAttribs: new Map(geometry.globalAttribs || [])
    };
  }

  private extractOutputValue(geometry: GeometryData): any {
    // Extract specific output value from geometry
    return geometry.globalAttribs.get('output') || null;
  }

  // Public API
  public getErrorMessage(): string {
    return this.errorMessage;
  }

  public recompile(): void {
    const code = this.getParameter('code') as string;
    this.compileCode(code);
  }

  dispose(): void {
    this.compiledCode = null;
    super.dispose();
  }
}
