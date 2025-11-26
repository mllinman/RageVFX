/**
 * NoiseNode - Generates procedural noise patterns
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class NoiseNode extends Node {
  constructor(id: string) {
    super(id, 'Noise', 'Noise Generator');
    this.metadata.category = 'Generator';
    this.metadata.description = 'Generate Perlin or simplex noise';
    
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('scale', 0.01);
    this.setParameter('octaves', 4);
    this.setParameter('persistence', 0.5);
    this.setParameter('type', 'perlin');
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const scale = this.getParameter('scale');
    const octaves = this.getParameter('octaves');
    const persistence = this.getParameter('persistence');
    
    const data = new Uint8Array(width * height * 4);
    
    // Simple noise generation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Multi-octave noise
        let noise = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
          noise += this.perlinNoise(x * frequency, y * frequency) * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          frequency *= 2;
        }
        
        noise = noise / maxValue;
        const value = ((noise + 1) / 2) * 255; // Normalize to 0-255
        
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
        data[idx + 3] = 255;
      }
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width,
        height,
        channels: 4,
        data,
        format: 'rgba'
      };
    }
  }

  private perlinNoise(x: number, y: number): number {
    // Simplified Perlin noise implementation
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = this.fade(xf);
    const v = this.fade(yf);
    
    // Hash coordinates
    const a = this.hash(xi) + yi;
    const b = this.hash(xi + 1) + yi;
    
    // Interpolate
    return this.lerp(v,
      this.lerp(u, this.grad(this.hash(a), xf, yf), this.grad(this.hash(b), xf - 1, yf)),
      this.lerp(u, this.grad(this.hash(a + 1), xf, yf - 1), this.grad(this.hash(b + 1), xf - 1, yf - 1))
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  private hash(n: number): number {
    // Simple hash function
    n = (n << 13) ^ n;
    return (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
  }
}
