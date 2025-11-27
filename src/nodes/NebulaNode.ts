/**
 * NebulaNode - Procedural nebula and cosmic cloud effects
 * Creates beautiful space nebula with multiple layers and emission
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class NebulaNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Nebula', 'Nebula');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate procedural space nebula and cosmic cloud effects';
    
    this.addInput('mask', 'Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Nebula structure
    this.setParameter('scale', 0.003);
    this.setParameter('octaves', 6);
    this.setParameter('persistence', 0.5);
    this.setParameter('lacunarity', 2.0);
    this.setParameter('density', 1.0);
    
    // Primary color
    this.setParameter('primaryColor', { r: 100, g: 50, b: 200 });
    this.setParameter('secondaryColor', { r: 255, g: 100, b: 150 });
    this.setParameter('emissionColor', { r: 255, g: 200, b: 255 });
    
    // Emission and glow
    this.setParameter('emissionIntensity', 0.5);
    this.setParameter('emissionThreshold', 0.6);
    this.setParameter('glowRadius', 20);
    this.setParameter('glowIntensity', 0.3);
    
    // Star field
    this.setParameter('starDensity', 0.001);
    this.setParameter('starBrightness', 1.0);
    this.setParameter('starVariation', 0.5);
    
    // Animation
    this.setParameter('animate', false);
    this.setParameter('speed', 0.5);
    
    // Dust lanes
    this.setParameter('dustLanes', true);
    this.setParameter('dustOpacity', 0.3);
    
    this.setParameter('seed', 42);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 42;
    this.permutation = [];
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = Math.floor(this.seededRandom(seed + i) * 256);
    }
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const scale = this.getParameter('scale');
    const octaves = this.getParameter('octaves');
    const persistence = this.getParameter('persistence');
    const lacunarity = this.getParameter('lacunarity');
    const density = this.getParameter('density');
    const primaryColor = this.getParameter('primaryColor');
    const secondaryColor = this.getParameter('secondaryColor');
    const emissionColor = this.getParameter('emissionColor');
    const emissionIntensity = this.getParameter('emissionIntensity');
    const emissionThreshold = this.getParameter('emissionThreshold');
    const starDensity = this.getParameter('starDensity');
    const starBrightness = this.getParameter('starBrightness');
    const starVariation = this.getParameter('starVariation');
    const animate = this.getParameter('animate');
    const speed = this.getParameter('speed');
    const dustLanes = this.getParameter('dustLanes');
    const dustOpacity = this.getParameter('dustOpacity');
    
    if (animate) {
      this.time += 0.016 * speed;
    }
    
    const data = new Uint8Array(width * height * 4);
    const maskInput = this.inputs.get('mask');
    const mask = maskInput?.value as ImageData | undefined;
    
    // Generate base nebula
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Multi-layer nebula noise
        let nebulaNoise = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let o = 0; o < octaves; o++) {
          nebulaNoise += this.noise3D(
            x * frequency,
            y * frequency,
            this.time * 0.1
          ) * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          frequency *= lacunarity;
        }
        
        nebulaNoise = (nebulaNoise / maxValue + 1) * 0.5;
        nebulaNoise = Math.pow(nebulaNoise, 1.5) * density;
        
        // Secondary noise layer for variation
        let secondaryNoise = this.noise3D(
          x * scale * 2,
          y * scale * 2,
          this.time * 0.15 + 100
        );
        secondaryNoise = (secondaryNoise + 1) * 0.5;
        
        // Dust lane noise (darker areas)
        let dustNoise = 0;
        if (dustLanes) {
          dustNoise = this.noise3D(
            x * scale * 0.5,
            y * scale * 0.5,
            this.time * 0.05 + 200
          );
          dustNoise = Math.pow(Math.max(0, (dustNoise + 1) * 0.5), 2);
        }
        
        // Color blending based on noise layers
        const colorMix = secondaryNoise;
        const baseR = primaryColor.r * (1 - colorMix) + secondaryColor.r * colorMix;
        const baseG = primaryColor.g * (1 - colorMix) + secondaryColor.g * colorMix;
        const baseB = primaryColor.b * (1 - colorMix) + secondaryColor.b * colorMix;
        
        // Apply nebula opacity
        let r = baseR * nebulaNoise;
        let g = baseG * nebulaNoise;
        let b = baseB * nebulaNoise;
        
        // Add emission in bright areas
        if (nebulaNoise > emissionThreshold) {
          const emissionMix = (nebulaNoise - emissionThreshold) / (1 - emissionThreshold);
          r += emissionColor.r * emissionMix * emissionIntensity;
          g += emissionColor.g * emissionMix * emissionIntensity;
          b += emissionColor.b * emissionMix * emissionIntensity;
        }
        
        // Apply dust lanes (darken)
        if (dustLanes) {
          const dustFactor = 1 - dustNoise * dustOpacity;
          r *= dustFactor;
          g *= dustFactor;
          b *= dustFactor;
        }
        
        // Apply mask if provided
        if (mask && x < mask.width && y < mask.height) {
          const maskIdx = (y * mask.width + x) * mask.channels;
          const maskValue = mask.data[maskIdx] / 255;
          r *= maskValue;
          g *= maskValue;
          b *= maskValue;
        }
        
        // Add stars
        const starHash = this.seededRandom(x * 7919 + y * 6967 + this.getParameter('seed'));
        if (starHash < starDensity) {
          const starIntensity = (0.5 + starHash / starDensity * 0.5) * starBrightness;
          const starSize = 1 + starHash * starVariation * 2;
          
          // Star color variation
          const starTemp = this.seededRandom(x * 5419 + y * 4729);
          let starR = 255, starG = 255, starB = 255;
          if (starTemp < 0.3) {
            // Blue star
            starR = 200; starG = 220; starB = 255;
          } else if (starTemp > 0.8) {
            // Red/orange star
            starR = 255; starG = 200; starB = 150;
          }
          
          r = Math.min(255, r + starR * starIntensity * starSize);
          g = Math.min(255, g + starG * starIntensity * starSize);
          b = Math.min(255, b + starB * starIntensity * starSize);
        }
        
        data[idx] = Math.min(255, Math.max(0, r));
        data[idx + 1] = Math.min(255, Math.max(0, g));
        data[idx + 2] = Math.min(255, Math.max(0, b));
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

  private noise3D(x: number, y: number, z: number): number {
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
