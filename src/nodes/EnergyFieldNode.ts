/**
 * EnergyFieldNode - Procedural energy field and force field effects
 * Version 3.4 - Advanced VFX
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class EnergyFieldNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'EnergyField', 'EnergyField');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate procedural energy field and force field effects';
    
    this.addInput('mask', 'Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('intensity', 1.0);
    this.setParameter('speed', 1.0);
    this.setParameter('scale', 0.008);
    this.setParameter('fieldType', 'hexagonal'); // hexagonal, grid, circular, organic
    this.setParameter('primaryColor', { r: 0, g: 180, b: 255 });
    this.setParameter('secondaryColor', { r: 180, g: 0, b: 255 });
    this.setParameter('glowIntensity', 1.5);
    this.setParameter('pulseSpeed', 2.0);
    this.setParameter('edgeSharpness', 0.8);
    this.setParameter('noiseAmount', 0.3);
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
    const intensity = this.getParameter('intensity');
    const speed = this.getParameter('speed');
    const scale = this.getParameter('scale');
    const fieldType = this.getParameter('fieldType');
    const primaryColor = this.getParameter('primaryColor');
    const secondaryColor = this.getParameter('secondaryColor');
    const glowIntensity = this.getParameter('glowIntensity');
    const pulseSpeed = this.getParameter('pulseSpeed');
    const edgeSharpness = this.getParameter('edgeSharpness');
    const noiseAmount = this.getParameter('noiseAmount');
    
    this.time += 0.016 * speed;
    
    const data = new Uint8Array(width * height * 4);
    const maskInput = this.inputs.get('mask');
    const mask = maskInput?.value as ImageData | undefined;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Normalized coordinates
        const nx = x * scale;
        const ny = y * scale;
        
        // Calculate field pattern based on type
        let fieldValue = 0;
        
        switch (fieldType) {
          case 'hexagonal':
            fieldValue = this.hexagonalField(nx, ny);
            break;
          case 'grid':
            fieldValue = this.gridField(nx, ny);
            break;
          case 'circular':
            fieldValue = this.circularField(x, y, width, height);
            break;
          case 'organic':
            fieldValue = this.organicField(nx, ny);
            break;
          default:
            fieldValue = this.hexagonalField(nx, ny);
        }
        
        // Add noise for organic feel
        if (noiseAmount > 0) {
          const noise = this.turbulentNoise(nx * 2, ny * 2, this.time * 0.5);
          fieldValue += noise * noiseAmount;
        }
        
        // Pulsing animation
        const pulse = 0.5 + 0.5 * Math.sin(this.time * pulseSpeed + fieldValue * 10);
        fieldValue *= pulse;
        
        // Edge sharpness
        fieldValue = Math.pow(Math.max(0, Math.min(1, fieldValue)), 1 / edgeSharpness);
        
        // Apply intensity
        fieldValue *= intensity;
        
        // Apply mask if provided
        if (mask && x < mask.width && y < mask.height) {
          const maskIdx = (y * mask.width + x) * mask.channels;
          const maskValue = mask.data[maskIdx] / 255;
          fieldValue *= maskValue;
        }
        
        // Color interpolation
        const colorMix = 0.5 + 0.5 * Math.sin(this.time * 0.5 + fieldValue * 5);
        
        // Glow effect
        const glow = Math.pow(fieldValue, 0.5) * glowIntensity;
        
        const r = primaryColor.r + (secondaryColor.r - primaryColor.r) * colorMix;
        const g = primaryColor.g + (secondaryColor.g - primaryColor.g) * colorMix;
        const b = primaryColor.b + (secondaryColor.b - primaryColor.b) * colorMix;
        
        data[idx] = Math.min(255, r * glow);
        data[idx + 1] = Math.min(255, g * glow);
        data[idx + 2] = Math.min(255, b * glow);
        data[idx + 3] = Math.min(255, fieldValue * 255);
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

  private hexagonalField(x: number, y: number): number {
    // Hexagonal grid pattern
    const q = (Math.sqrt(3) / 3 * x - 1/3 * y);
    const r = (2/3 * y);
    
    const roundedQ = Math.round(q);
    const roundedR = Math.round(r);
    
    const hexX = roundedQ;
    const hexY = roundedR;
    
    // Distance to hex center
    const centerX = Math.sqrt(3) * (hexX + hexY / 2);
    const centerY = 3/2 * hexY;
    
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    // Create edge glow
    const edgeDist = Math.abs(dist - 0.5);
    const edge = 1 - Math.min(1, edgeDist * 10);
    
    return edge;
  }

  private gridField(x: number, y: number): number {
    const gridX = Math.abs(Math.sin(x * Math.PI));
    const gridY = Math.abs(Math.sin(y * Math.PI));
    
    const grid = Math.max(gridX, gridY);
    const edge = Math.pow(grid, 8);
    
    return edge;
  }

  private circularField(x: number, y: number, width: number, height: number): number {
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    
    const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    const normalizedDist = dist / maxDist;
    
    // Concentric rings
    const rings = Math.abs(Math.sin(normalizedDist * 20 + this.time * 2));
    
    return rings * (1 - normalizedDist);
  }

  private organicField(x: number, y: number): number {
    // Voronoi-like organic pattern
    let minDist = 10;
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const cellX = Math.floor(x) + i;
        const cellY = Math.floor(y) + j;
        
        const seed = cellX * 12345 + cellY * 67890;
        const offsetX = this.seededRandom(seed);
        const offsetY = this.seededRandom(seed + 1);
        
        const pointX = cellX + offsetX;
        const pointY = cellY + offsetY;
        
        const dist = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
        minDist = Math.min(minDist, dist);
      }
    }
    
    return 1 - Math.min(1, minDist * 2);
  }

  private turbulentNoise(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const w = zf * zf * (3 - 2 * zf);
    
    const a = this.permutation[xi] + yi;
    const aa = this.permutation[a % 256] + zi;
    const ab = this.permutation[(a + 1) % 256] + zi;
    const b = this.permutation[(xi + 1) % 256] + yi;
    const ba = this.permutation[b % 256] + zi;
    const bb = this.permutation[(b + 1) % 256] + zi;
    
    const lerp = (t: number, a: number, b: number) => a + t * (b - a);
    
    return lerp(w,
      lerp(v,
        lerp(u, this.permutation[aa % 256] / 255, this.permutation[ba % 256] / 255),
        lerp(u, this.permutation[ab % 256] / 255, this.permutation[bb % 256] / 255)),
      lerp(v,
        lerp(u, this.permutation[(aa + 1) % 256] / 255, this.permutation[(ba + 1) % 256] / 255),
        lerp(u, this.permutation[(ab + 1) % 256] / 255, this.permutation[(bb + 1) % 256] / 255))
    ) * 2 - 1;
  }
}
