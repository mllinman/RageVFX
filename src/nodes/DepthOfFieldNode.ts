/**
 * DepthOfFieldNode - Simulates camera depth of field blur
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class DepthOfFieldNode extends Node {
  constructor(id: string) {
    super(id, 'DepthOfField', 'Depth of Field');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Simulate camera depth of field blur';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('depth', 'Depth', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('focalDistance', 0.5);
    this.setParameter('focalRange', 0.1);
    this.setParameter('maxBlur', 20);
    this.setParameter('blurQuality', 'medium'); // low, medium, high
    this.setParameter('bokehShape', 'circle'); // circle, hexagon, octagon
    this.setParameter('bokehRotation', 0);
    this.setParameter('highlightBoost', 1.0);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const depthInput = this.inputs.get('depth');
    const output = this.outputs.get('image');
    
    if (!imageInput?.value || !output) {
      return;
    }

    const inputImage = imageInput.value as ImageData;
    const depthImage = depthInput?.value as ImageData | undefined;
    
    const focalDistance = this.getParameter('focalDistance');
    const focalRange = this.getParameter('focalRange');
    const maxBlur = this.getParameter('maxBlur');
    const quality = this.getParameter('blurQuality');
    const bokehShape = this.getParameter('bokehShape');
    const highlightBoost = this.getParameter('highlightBoost');
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    // Determine sample count based on quality
    const sampleCounts: Record<string, number> = {
      low: 8,
      medium: 16,
      high: 32
    };
    const samples = sampleCounts[quality] || 16;
    
    // Generate bokeh sample pattern
    const pattern = this.generateBokehPattern(bokehShape, samples);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const outIdx = (y * width + x) * 4;
        
        // Get depth at this pixel
        let depth = 0.5; // Default mid-distance
        if (depthImage && x < depthImage.width && y < depthImage.height) {
          const depthIdx = (y * depthImage.width + x) * depthImage.channels;
          depth = depthImage.data[depthIdx] / 255;
        }
        
        // Calculate blur amount based on distance from focal plane
        const distFromFocus = Math.abs(depth - focalDistance);
        const blurAmount = Math.max(0, (distFromFocus - focalRange) / (1 - focalRange)) * maxBlur;
        
        if (blurAmount < 1) {
          // In focus - just copy
          const srcIdx = (y * width + x) * channels;
          outData[outIdx] = srcData[srcIdx];
          outData[outIdx + 1] = srcData[srcIdx + 1];
          outData[outIdx + 2] = srcData[srcIdx + 2];
          outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
        } else {
          // Apply blur
          let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
          let totalWeight = 0;
          
          for (const sample of pattern) {
            const sampleX = x + sample.x * blurAmount;
            const sampleY = y + sample.y * blurAmount;
            
            // Clamp to image bounds
            const sx = Math.max(0, Math.min(width - 1, Math.floor(sampleX)));
            const sy = Math.max(0, Math.min(height - 1, Math.floor(sampleY)));
            
            const srcIdx = (sy * width + sx) * channels;
            
            // Get pixel value
            let r = srcData[srcIdx];
            let g = srcData[srcIdx + 1];
            let b = srcData[srcIdx + 2];
            const a = channels === 4 ? srcData[srcIdx + 3] : 255;
            
            // Boost highlights for bokeh effect
            if (highlightBoost > 1) {
              const luminance = (r + g + b) / 3 / 255;
              if (luminance > 0.7) {
                const boost = 1 + (luminance - 0.7) * (highlightBoost - 1) * 3;
                r = Math.min(255, r * boost);
                g = Math.min(255, g * boost);
                b = Math.min(255, b * boost);
              }
            }
            
            sumR += r * sample.weight;
            sumG += g * sample.weight;
            sumB += b * sample.weight;
            sumA += a * sample.weight;
            totalWeight += sample.weight;
          }
          
          outData[outIdx] = Math.floor(sumR / totalWeight);
          outData[outIdx + 1] = Math.floor(sumG / totalWeight);
          outData[outIdx + 2] = Math.floor(sumB / totalWeight);
          outData[outIdx + 3] = Math.floor(sumA / totalWeight);
        }
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

  private generateBokehPattern(shape: string, samples: number): Array<{ x: number; y: number; weight: number }> {
    const pattern: Array<{ x: number; y: number; weight: number }> = [];
    
    switch (shape) {
      case 'hexagon':
        for (let i = 0; i < samples; i++) {
          const angle = (i / samples) * Math.PI * 2;
          const r = 0.5 + 0.5 * Math.cos(6 * angle);
          pattern.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            weight: 1
          });
        }
        break;
        
      case 'octagon':
        for (let i = 0; i < samples; i++) {
          const angle = (i / samples) * Math.PI * 2;
          const r = 0.5 + 0.5 * Math.cos(8 * angle);
          pattern.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            weight: 1
          });
        }
        break;
        
      default: // circle
        for (let i = 0; i < samples; i++) {
          const angle = (i / samples) * Math.PI * 2;
          const r = Math.sqrt(i / samples); // Uniform disk distribution
          pattern.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            weight: 1
          });
        }
    }
    
    // Add center sample
    pattern.push({ x: 0, y: 0, weight: 1 });
    
    return pattern;
  }
}
