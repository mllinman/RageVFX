/**
 * FilmGrainNode - Film grain simulation
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class FilmGrainNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'FilmGrain', 'Film Grain');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Simulate film grain texture';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('intensity', 0.3);
    this.setParameter('size', 1.0);
    this.setParameter('softness', 0.5);
    this.setParameter('animated', true);
    this.setParameter('colorNoise', 0.0);
    this.setParameter('responseHighlights', 0.5);
    this.setParameter('responseShadows', 1.0);
    this.setParameter('seed', 88888);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const intensity = this.getParameter('intensity');
    const grainSize = this.getParameter('size');
    const softness = this.getParameter('softness');
    const animated = this.getParameter('animated');
    const colorNoise = this.getParameter('colorNoise');
    const responseHighlights = this.getParameter('responseHighlights');
    const responseShadows = this.getParameter('responseShadows');
    const seed = this.getParameter('seed');
    
    if (animated) {
      this.time++;
    }
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    // Generate grain at potentially lower resolution for size > 1
    const grainWidth = Math.ceil(width / grainSize);
    const grainHeight = Math.ceil(height / grainSize);
    const grain = new Float32Array(grainWidth * grainHeight * 3);
    
    for (let i = 0; i < grainWidth * grainHeight; i++) {
      const grainSeed = seed + i + this.time * 10000;
      
      // Generate base noise
      const noiseBase = (this.seededRandom(grainSeed) - 0.5) * 2;
      
      // Add color noise component
      const noiseR = noiseBase + (this.seededRandom(grainSeed + 1) - 0.5) * colorNoise;
      const noiseG = noiseBase + (this.seededRandom(grainSeed + 2) - 0.5) * colorNoise;
      const noiseB = noiseBase + (this.seededRandom(grainSeed + 3) - 0.5) * colorNoise;
      
      grain[i * 3] = noiseR;
      grain[i * 3 + 1] = noiseG;
      grain[i * 3 + 2] = noiseB;
    }
    
    // Apply grain to image
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * channels;
        const outIdx = (y * width + x) * 4;
        
        const r = srcData[srcIdx] / 255;
        const g = srcData[srcIdx + 1] / 255;
        const b = srcData[srcIdx + 2] / 255;
        
        // Calculate luminance for response curve
        const luminance = r * 0.299 + g * 0.587 + b * 0.114;
        
        // Response curve - more grain in shadows, less in highlights
        const response = responseShadows * (1 - luminance) + responseHighlights * luminance;
        
        // Sample grain (with bilinear interpolation if softness > 0)
        const gx = x / grainSize;
        const gy = y / grainSize;
        
        let grainR: number, grainG: number, grainB: number;
        
        if (softness > 0) {
          // Bilinear interpolation
          const gx0 = Math.floor(gx);
          const gy0 = Math.floor(gy);
          const gx1 = Math.min(gx0 + 1, grainWidth - 1);
          const gy1 = Math.min(gy0 + 1, grainHeight - 1);
          const fx = (gx - gx0) * softness;
          const fy = (gy - gy0) * softness;
          
          const sampleGrain = (px: number, py: number, channel: number) => {
            return grain[(py * grainWidth + px) * 3 + channel];
          };
          
          grainR = sampleGrain(gx0, gy0, 0) * (1-fx) * (1-fy) +
                   sampleGrain(gx1, gy0, 0) * fx * (1-fy) +
                   sampleGrain(gx0, gy1, 0) * (1-fx) * fy +
                   sampleGrain(gx1, gy1, 0) * fx * fy;
          grainG = sampleGrain(gx0, gy0, 1) * (1-fx) * (1-fy) +
                   sampleGrain(gx1, gy0, 1) * fx * (1-fy) +
                   sampleGrain(gx0, gy1, 1) * (1-fx) * fy +
                   sampleGrain(gx1, gy1, 1) * fx * fy;
          grainB = sampleGrain(gx0, gy0, 2) * (1-fx) * (1-fy) +
                   sampleGrain(gx1, gy0, 2) * fx * (1-fy) +
                   sampleGrain(gx0, gy1, 2) * (1-fx) * fy +
                   sampleGrain(gx1, gy1, 2) * fx * fy;
        } else {
          const gi = (Math.floor(gy) * grainWidth + Math.floor(gx)) * 3;
          grainR = grain[gi];
          grainG = grain[gi + 1];
          grainB = grain[gi + 2];
        }
        
        // Apply grain
        const effectiveIntensity = intensity * response;
        
        outData[outIdx] = Math.max(0, Math.min(255, (r + grainR * effectiveIntensity) * 255));
        outData[outIdx + 1] = Math.max(0, Math.min(255, (g + grainG * effectiveIntensity) * 255));
        outData[outIdx + 2] = Math.max(0, Math.min(255, (b + grainB * effectiveIntensity) * 255));
        outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }
}
