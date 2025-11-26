/**
 * DissolveNode - Creates dissolve transition effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class DissolveNode extends Node {
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Dissolve', 'Dissolve');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Create dissolve transition effects';
    
    this.addInput('imageA', 'Image A', DataType.IMAGE);
    this.addInput('imageB', 'Image B', DataType.IMAGE);
    this.addInput('matte', 'Matte', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('progress', 0.5);
    this.setParameter('type', 'noise'); // noise, linear, radial, wipe
    this.setParameter('noiseScale', 0.01);
    this.setParameter('edgeSoftness', 0.1);
    this.setParameter('edgeColor', { r: 255, g: 150, b: 50 });
    this.setParameter('edgeGlow', 0.3);
    this.setParameter('direction', 0); // For wipe: angle in degrees
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
    this.setParameter('seed', 66666);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 66666;
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
    const progress = this.getParameter('progress');
    const dissolveType = this.getParameter('type');
    const noiseScale = this.getParameter('noiseScale');
    const edgeSoftness = this.getParameter('edgeSoftness');
    const edgeColor = this.getParameter('edgeColor');
    const edgeGlow = this.getParameter('edgeGlow');
    const direction = this.getParameter('direction') * Math.PI / 180;
    const centerX = this.getParameter('centerX');
    const centerY = this.getParameter('centerY');
    
    const imageAInput = this.inputs.get('imageA');
    const imageBInput = this.inputs.get('imageB');
    const matteInput = this.inputs.get('matte');
    
    const imageA = imageAInput?.value as ImageData | undefined;
    const imageB = imageBInput?.value as ImageData | undefined;
    const matte = matteInput?.value as ImageData | undefined;
    
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate dissolve value based on type
        let dissolveValue: number;
        
        if (matte && x < matte.width && y < matte.height) {
          // Use matte if provided
          const matteIdx = (y * matte.width + x) * matte.channels;
          dissolveValue = matte.data[matteIdx] / 255;
        } else {
          // Generate dissolve pattern based on type
          const nx = x / width;
          const ny = y / height;
          
          switch (dissolveType) {
            case 'noise':
              dissolveValue = this.perlinNoise2D(x * noiseScale, y * noiseScale);
              dissolveValue = (dissolveValue + 1) * 0.5;
              break;
              
            case 'linear':
              dissolveValue = Math.cos(direction) * nx + Math.sin(direction) * ny;
              break;
              
            case 'radial': {
              const dx = nx - centerX;
              const dy = ny - centerY;
              dissolveValue = Math.sqrt(dx * dx + dy * dy) * Math.sqrt(2);
              break;
            }
              
            case 'wipe':
              dissolveValue = Math.cos(direction) * (nx - 0.5) + Math.sin(direction) * (ny - 0.5) + 0.5;
              break;
              
            default:
              dissolveValue = 0.5;
          }
        }
        
        // Calculate blend factor with edge softness
        const threshold = progress;
        let blendFactor: number;
        let edgeFactor: number;
        
        if (edgeSoftness > 0) {
          const halfSoftness = edgeSoftness / 2;
          blendFactor = Math.max(0, Math.min(1, (dissolveValue - threshold + halfSoftness) / edgeSoftness));
          
          // Edge glow calculation
          const distFromEdge = Math.abs(dissolveValue - threshold);
          edgeFactor = distFromEdge < halfSoftness ? 1 - distFromEdge / halfSoftness : 0;
          edgeFactor *= edgeGlow;
        } else {
          blendFactor = dissolveValue > threshold ? 1 : 0;
          edgeFactor = 0;
        }
        
        // Get pixel values from both images
        let aR = 0, aG = 0, aB = 0, aA = 255;
        let bR = 0, bG = 0, bB = 0, bA = 255;
        
        if (imageA && x < imageA.width && y < imageA.height) {
          const aIdx = (y * imageA.width + x) * imageA.channels;
          aR = imageA.data[aIdx];
          aG = imageA.data[aIdx + 1];
          aB = imageA.data[aIdx + 2];
          aA = imageA.channels === 4 ? imageA.data[aIdx + 3] : 255;
        }
        
        if (imageB && x < imageB.width && y < imageB.height) {
          const bIdx = (y * imageB.width + x) * imageB.channels;
          bR = imageB.data[bIdx];
          bG = imageB.data[bIdx + 1];
          bB = imageB.data[bIdx + 2];
          bA = imageB.channels === 4 ? imageB.data[bIdx + 3] : 255;
        }
        
        // Blend images
        let outR = aR * (1 - blendFactor) + bR * blendFactor;
        let outG = aG * (1 - blendFactor) + bG * blendFactor;
        let outB = aB * (1 - blendFactor) + bB * blendFactor;
        const outA = aA * (1 - blendFactor) + bA * blendFactor;
        
        // Add edge glow
        if (edgeFactor > 0) {
          outR = Math.min(255, outR + edgeColor.r * edgeFactor);
          outG = Math.min(255, outG + edgeColor.g * edgeFactor);
          outB = Math.min(255, outB + edgeColor.b * edgeFactor);
        }
        
        data[idx] = outR;
        data[idx + 1] = outG;
        data[idx + 2] = outB;
        data[idx + 3] = outA;
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
