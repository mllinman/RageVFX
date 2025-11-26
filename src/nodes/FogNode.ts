/**
 * FogNode - Generates atmospheric fog effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class FogNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Fog', 'Fog');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate atmospheric fog effects';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('depth', 'Depth', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('density', 0.5);
    this.setParameter('falloff', 1.0);
    this.setParameter('height_falloff', 0.5);
    this.setParameter('color', { r: 180, g: 180, b: 190 });
    this.setParameter('noiseAmount', 0.3);
    this.setParameter('noiseScale', 0.005);
    this.setParameter('animated', true);
    this.setParameter('animSpeed', 0.5);
    this.setParameter('groundFog', false);
    this.setParameter('groundLevel', 0.7);
    this.setParameter('seed', 22222);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 22222;
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
    const falloff = this.getParameter('falloff');
    const heightFalloff = this.getParameter('height_falloff');
    const color = this.getParameter('color');
    const noiseAmount = this.getParameter('noiseAmount');
    const noiseScale = this.getParameter('noiseScale');
    const animated = this.getParameter('animated');
    const animSpeed = this.getParameter('animSpeed');
    const groundFog = this.getParameter('groundFog');
    const groundLevel = this.getParameter('groundLevel');
    
    if (animated) {
      this.time += 0.016 * animSpeed;
    }
    
    const imageInput = this.inputs.get('image');
    const depthInput = this.inputs.get('depth');
    const inputImage = imageInput?.value as ImageData | undefined;
    const depthImage = depthInput?.value as ImageData | undefined;
    
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get source pixel or default
        let srcR = 0, srcG = 0, srcB = 0, srcA = 255;
        if (inputImage && x < inputImage.width && y < inputImage.height) {
          const srcIdx = (y * inputImage.width + x) * inputImage.channels;
          srcR = inputImage.data[srcIdx];
          srcG = inputImage.data[srcIdx + 1];
          srcB = inputImage.data[srcIdx + 2];
          srcA = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
        }
        
        // Get depth value
        let depthValue = 0.5; // Default mid-depth
        if (depthImage && x < depthImage.width && y < depthImage.height) {
          const depthIdx = (y * depthImage.width + x) * depthImage.channels;
          depthValue = depthImage.data[depthIdx] / 255;
        }
        
        // Calculate fog factor based on depth
        let fogFactor = Math.pow(depthValue, falloff) * density;
        
        // Apply height-based falloff
        if (heightFalloff > 0) {
          const normalizedY = y / height;
          if (groundFog) {
            // Ground fog is denser at bottom
            const groundMask = Math.max(0, normalizedY - groundLevel) / (1 - groundLevel);
            fogFactor *= Math.pow(groundMask, 1 / heightFalloff);
          } else {
            // Normal fog is uniform or denser at top
            fogFactor *= 1 - (1 - normalizedY) * heightFalloff;
          }
        }
        
        // Add noise variation
        if (noiseAmount > 0) {
          const noiseValue = this.perlinNoise2D(
            x * noiseScale + this.time * 0.5,
            y * noiseScale + this.time * 0.3
          );
          fogFactor *= 1 + noiseValue * noiseAmount;
        }
        
        // Clamp fog factor
        fogFactor = Math.max(0, Math.min(1, fogFactor));
        
        // Mix source with fog color
        data[idx] = srcR * (1 - fogFactor) + color.r * fogFactor;
        data[idx + 1] = srcG * (1 - fogFactor) + color.g * fogFactor;
        data[idx + 2] = srcB * (1 - fogFactor) + color.b * fogFactor;
        data[idx + 3] = srcA;
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

  private perlinNoise2D(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = this.fade(xf);
    const v = this.fade(yf);
    
    const a = this.permutation[xi] + yi;
    const b = this.permutation[xi + 1] + yi;
    
    return this.lerp(v,
      this.lerp(u, this.grad2(this.permutation[a], xf, yf),
                   this.grad2(this.permutation[b], xf - 1, yf)),
      this.lerp(u, this.grad2(this.permutation[a + 1], xf, yf - 1),
                   this.grad2(this.permutation[b + 1], xf - 1, yf - 1))
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad2(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}
