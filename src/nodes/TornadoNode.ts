/**
 * TornadoNode - Generates vortex/tornado effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class TornadoNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Tornado', 'Tornado');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate vortex/tornado effects';
    
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('centerX', 0.5);
    this.setParameter('baseY', 0.9);
    this.setParameter('height_factor', 0.8);
    this.setParameter('baseRadius', 100);
    this.setParameter('topRadius', 20);
    this.setParameter('rotationSpeed', 2.0);
    this.setParameter('turbulence', 1.5);
    this.setParameter('debrisAmount', 0.5);
    this.setParameter('dustColor', { r: 139, g: 119, b: 101 });
    this.setParameter('cloudColor', { r: 70, g: 70, b: 80 });
    this.setParameter('opacity', 0.8);
    this.setParameter('swayAmount', 20);
    this.setParameter('swaySpeed', 0.5);
    this.setParameter('seed', 33333);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 33333;
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
    const centerX = this.getParameter('centerX') * width;
    const baseY = this.getParameter('baseY') * height;
    const heightFactor = this.getParameter('height_factor');
    const baseRadius = this.getParameter('baseRadius');
    const topRadius = this.getParameter('topRadius');
    const rotationSpeed = this.getParameter('rotationSpeed');
    const turbulence = this.getParameter('turbulence');
    const debrisAmount = this.getParameter('debrisAmount');
    const dustColor = this.getParameter('dustColor');
    const cloudColor = this.getParameter('cloudColor');
    const opacity = this.getParameter('opacity');
    const swayAmount = this.getParameter('swayAmount');
    const swaySpeed = this.getParameter('swaySpeed');
    
    this.time += 0.016;
    
    const bgInput = this.inputs.get('background');
    const background = bgInput?.value as ImageData | undefined;
    
    const data = new Uint8Array(width * height * 4);
    
    // Copy background or fill with transparent
    if (background) {
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const srcIdx = i * background.channels;
        data[idx] = background.data[srcIdx];
        data[idx + 1] = background.data[srcIdx + 1];
        data[idx + 2] = background.data[srcIdx + 2];
        data[idx + 3] = background.channels === 4 ? background.data[srcIdx + 3] : 255;
      }
    } else {
      data.fill(0);
    }
    
    // Calculate tornado parameters
    const tornadoHeight = height * heightFactor;
    const topY = baseY - tornadoHeight;
    
    // Sway animation
    const sway = Math.sin(this.time * swaySpeed) * swayAmount;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Check if pixel is in tornado region
        if (y < topY || y > baseY) continue;
        
        // Calculate normalized height within tornado
        const normalizedHeight = (baseY - y) / tornadoHeight;
        
        // Calculate radius at this height (cone shape)
        const currentRadius = baseRadius - (baseRadius - topRadius) * normalizedHeight;
        
        // Calculate center with sway
        const swayOffset = sway * normalizedHeight;
        const currentCenterX = centerX + swayOffset;
        
        // Distance from center
        const dx = x - currentCenterX;
        const dy = (baseY - y);
        const distFromCenter = Math.abs(dx);
        
        // Skip if outside tornado
        if (distFromCenter > currentRadius * 1.5) continue;
        
        // Calculate spiral angle
        const angle = Math.atan2(dx, dy) + this.time * rotationSpeed * (1 + normalizedHeight);
        
        // Turbulent noise
        const noiseX = x * 0.02 + this.time * 2;
        const noiseY = y * 0.02;
        const turbNoise = this.turbulentNoise(noiseX, noiseY, this.time) * turbulence;
        
        // Calculate tornado density
        let density = 0;
        
        // Core density
        const coreRadius = currentRadius * 0.3;
        if (distFromCenter < coreRadius) {
          density = 1 - distFromCenter / coreRadius;
        }
        
        // Wall density with spiral pattern
        const wallInner = currentRadius * 0.5;
        const wallOuter = currentRadius * 1.2;
        if (distFromCenter >= wallInner && distFromCenter <= wallOuter) {
          const wallPos = (distFromCenter - wallInner) / (wallOuter - wallInner);
          const spiralFactor = Math.sin(angle * 3 + normalizedHeight * 10) * 0.5 + 0.5;
          density = Math.max(density, (1 - Math.abs(wallPos - 0.5) * 2) * spiralFactor);
        }
        
        // Add turbulence
        density += turbNoise * 0.3;
        density = Math.max(0, Math.min(1, density));
        
        // Add debris
        if (debrisAmount > 0 && density > 0.3) {
          const debrisNoise = this.simpleNoise(x * 0.1 + this.time * 20, y * 0.1, angle);
          if (debrisNoise > 1 - debrisAmount * 0.3) {
            density = Math.min(1, density + 0.5);
          }
        }
        
        if (density <= 0) continue;
        
        // Color mixing based on height
        const colorMix = normalizedHeight;
        const r = dustColor.r + (cloudColor.r - dustColor.r) * colorMix;
        const g = dustColor.g + (cloudColor.g - dustColor.g) * colorMix;
        const b = dustColor.b + (cloudColor.b - dustColor.b) * colorMix;
        
        // Apply with opacity
        const alpha = density * opacity;
        
        data[idx] = data[idx] * (1 - alpha) + r * alpha;
        data[idx + 1] = data[idx + 1] * (1 - alpha) + g * alpha;
        data[idx + 2] = data[idx + 2] * (1 - alpha) + b * alpha;
        data[idx + 3] = Math.min(255, data[idx + 3] + alpha * 255);
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

  private simpleNoise(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    
    const hash = this.permutation[(this.permutation[(this.permutation[xi] + yi) & 255] + zi) & 255];
    return (hash / 255) * 2 - 1;
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
