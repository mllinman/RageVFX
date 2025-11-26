/**
 * FireNode - Generates procedural fire effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class FireNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Fire', 'Fire');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate procedural fire effects';
    
    this.addInput('mask', 'Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('intensity', 1.0);
    this.setParameter('speed', 1.0);
    this.setParameter('turbulence', 2.0);
    this.setParameter('scale', 0.005);
    this.setParameter('colorBase', { r: 255, g: 100, b: 0 });
    this.setParameter('colorTip', { r: 255, g: 220, b: 100 });
    this.setParameter('height_falloff', 0.7);
    this.setParameter('seed', 12345);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 12345;
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
    const intensity = this.getParameter('intensity');
    const speed = this.getParameter('speed');
    const turbulence = this.getParameter('turbulence');
    const scale = this.getParameter('scale');
    const colorBase = this.getParameter('colorBase');
    const colorTip = this.getParameter('colorTip');
    const heightFalloff = this.getParameter('height_falloff');
    
    this.time += 0.016 * speed;
    
    const data = new Uint8Array(width * height * 4);
    const maskInput = this.inputs.get('mask');
    const mask = maskInput?.value as ImageData | undefined;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Height-based falloff (fire rises)
        const normalizedY = 1 - (y / height);
        const heightMask = Math.pow(normalizedY, heightFalloff);
        
        // Multi-octave turbulent noise
        let noise = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let i = 0; i < 4; i++) {
          noise += this.turbulentNoise(
            x * frequency,
            y * frequency - this.time * 50,
            this.time
          ) * amplitude;
          maxValue += amplitude;
          amplitude *= 0.5;
          frequency *= turbulence;
        }
        
        noise = (noise / maxValue + 1) * 0.5;
        
        // Apply height falloff and intensity
        let fireValue = noise * heightMask * intensity;
        
        // Apply mask if provided
        if (mask && x < mask.width && y < mask.height) {
          const maskIdx = (y * mask.width + x) * mask.channels;
          const maskValue = mask.data[maskIdx] / 255;
          fireValue *= maskValue;
        }
        
        // Clamp fire value
        fireValue = Math.max(0, Math.min(1, fireValue));
        
        // Color interpolation based on fire intensity
        const t = Math.pow(fireValue, 0.5);
        
        data[idx] = colorBase.r + (colorTip.r - colorBase.r) * t;
        data[idx + 1] = colorBase.g + (colorTip.g - colorBase.g) * t;
        data[idx + 2] = colorBase.b + (colorTip.b - colorBase.b) * t;
        data[idx + 3] = Math.min(255, fireValue * 255 * 2);
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
    // Simplified 3D turbulent noise
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
