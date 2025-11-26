/**
 * SmokeNode - Generates volumetric smoke simulation effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class SmokeNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Smoke', 'Smoke');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate volumetric smoke effects';
    
    this.addInput('mask', 'Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('density', 0.8);
    this.setParameter('scale', 0.003);
    this.setParameter('riseSpeed', 1.0);
    this.setParameter('turbulence', 2.5);
    this.setParameter('dispersal', 0.5);
    this.setParameter('color', { r: 80, g: 80, b: 90 });
    this.setParameter('opacity', 0.7);
    this.setParameter('octaves', 5);
    this.setParameter('sourceY', 0.8); // Bottom 80% of image
    this.setParameter('spreadRate', 0.3);
    this.setParameter('seed', 98765);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 98765;
    this.permutation = [];
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = Math.floor(this.seededRandom(seed + i) * 256);
    }
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const density = this.getParameter('density');
    const scale = this.getParameter('scale');
    const riseSpeed = this.getParameter('riseSpeed');
    const turbulence = this.getParameter('turbulence');
    const dispersal = this.getParameter('dispersal');
    const color = this.getParameter('color');
    const opacity = this.getParameter('opacity');
    const octaves = this.getParameter('octaves');
    const sourceY = this.getParameter('sourceY');
    const spreadRate = this.getParameter('spreadRate');
    
    this.time += 0.016 * riseSpeed;
    
    const data = new Uint8Array(width * height * 4);
    const maskInput = this.inputs.get('mask');
    const mask = maskInput?.value as ImageData | undefined;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Normalize coordinates
        const nx = x / width;
        const ny = y / height;
        
        // Calculate height-based factor (smoke rises and spreads)
        const heightFactor = 1 - ny;
        const riseMask = Math.max(0, 1 - Math.pow(ny / sourceY, 2));
        
        // Horizontal spread increases with height
        const spreadFactor = 1 + heightFactor * spreadRate * 2;
        
        // Multi-octave turbulent noise for smoke
        let smokeValue = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
          // Add upward flow distortion
          const flowY = ny - this.time * 0.5 * (1 + i * 0.2);
          const flowX = nx + Math.sin(ny * 5 + this.time) * 0.02 * dispersal;
          
          smokeValue += this.turbulentNoise(
            flowX * width * frequency * spreadFactor,
            flowY * height * frequency,
            this.time * 0.5
          ) * amplitude;
          
          maxValue += amplitude;
          amplitude *= 0.5;
          frequency *= turbulence;
        }
        
        smokeValue = (smokeValue / maxValue + 1) * 0.5;
        
        // Apply density and height mask
        smokeValue = smokeValue * density * riseMask;
        
        // Apply source mask if provided
        if (mask && x < mask.width && y < mask.height) {
          const maskIdx = (y * mask.width + x) * mask.channels;
          const maskValue = mask.data[maskIdx] / 255;
          smokeValue *= maskValue;
        }
        
        // Soft threshold for smoke appearance
        smokeValue = Math.pow(Math.max(0, smokeValue - 0.2) * 1.25, 0.8);
        smokeValue = Math.max(0, Math.min(1, smokeValue));
        
        // Apply color and opacity
        const alpha = smokeValue * opacity * 255;
        
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = Math.floor(alpha);
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

  private turbulentNoise(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    
    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);
    
    const a = this.permutation[xi] + yi;
    const aa = this.permutation[a] + zi;
    const ab = this.permutation[a + 1] + zi;
    const b = this.permutation[xi + 1] + yi;
    const ba = this.permutation[b] + zi;
    const bb = this.permutation[b + 1] + zi;
    
    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad3(this.permutation[aa], xf, yf, zf),
                     this.grad3(this.permutation[ba], xf - 1, yf, zf)),
        this.lerp(u, this.grad3(this.permutation[ab], xf, yf - 1, zf),
                     this.grad3(this.permutation[bb], xf - 1, yf - 1, zf))),
      this.lerp(v,
        this.lerp(u, this.grad3(this.permutation[aa + 1], xf, yf, zf - 1),
                     this.grad3(this.permutation[ba + 1], xf - 1, yf, zf - 1)),
        this.lerp(u, this.grad3(this.permutation[ab + 1], xf, yf - 1, zf - 1),
                     this.grad3(this.permutation[bb + 1], xf - 1, yf - 1, zf - 1)))
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad3(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}
