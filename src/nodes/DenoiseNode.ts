/**
 * DenoiseNode - AI-powered image denoising
 * Version 2.0 - Machine Learning Powered Tools
 */

import { Node, DataType } from '../core/Node';

export class DenoiseNode extends Node {
  constructor(id: string) {
    super(id, 'Denoise', 'AI Denoise');
    this.metadata.category = 'ML';
    this.metadata.description = 'AI-powered image denoising';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addInput('noiseMask', 'Noise Mask', DataType.IMAGE);
    
    // Outputs
    this.addOutput('image', 'Denoised Image', DataType.IMAGE);
    this.addOutput('noiseMask', 'Detected Noise', DataType.IMAGE);
    
    // Model settings
    this.setParameter('model', 'default'); // default, low-light, video, cgi
    this.setParameter('modelPath', '');
    
    // Denoise parameters
    this.setParameter('strength', 0.5); // 0-1
    this.setParameter('detailPreserve', 0.7); // 0-1
    this.setParameter('colorPreserve', true);
    
    // Noise type targeting
    this.setParameter('noiseType', 'auto'); // auto, gaussian, salt-pepper, shot, film-grain
    this.setParameter('noiseLevel', 'auto'); // auto, low, medium, high
    
    // Advanced
    this.setParameter('temporalDenoise', false); // For video sequences
    this.setParameter('temporalRadius', 2);
    this.setParameter('adaptiveStrength', true);
    
    // Region control
    this.setParameter('protectMask', null);
    this.setParameter('boostMask', null);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const noiseMaskInput = this.inputs.get('noiseMask');
    
    const strength = this.getParameter('strength');
    const detailPreserve = this.getParameter('detailPreserve');
    const colorPreserve = this.getParameter('colorPreserve');
    const adaptiveStrength = this.getParameter('adaptiveStrength');
    
    if (!imageInput?.value) {
      return;
    }
    
    const width = imageInput.value.width;
    const height = imageInput.value.height;
    const srcData = imageInput.value.data;
    
    const outputData = new Uint8Array(width * height * 4);
    const noiseMaskData = new Uint8Array(width * height * 4);
    
    // Estimate noise level per-pixel
    const noiseMap = this.estimateNoiseMap(srcData, width, height);
    
    // Non-local means denoising (simplified)
    // In a real implementation, this would use a neural network
    const patchRadius = 3;
    const searchRadius = 10;
    const h = strength * 50; // Filter strength
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Get local noise estimate for adaptive strength
        let localStrength = strength;
        if (adaptiveStrength) {
          const noiseLevel = noiseMap[y * width + x];
          localStrength = strength * noiseLevel * 2;
        }
        
        // Apply mask if provided
        if (noiseMaskInput?.value?.data) {
          const maskValue = noiseMaskInput.value.data[i] / 255;
          localStrength *= maskValue;
        }
        
        if (localStrength < 0.01) {
          // Skip denoising for this pixel
          outputData[i] = srcData[i];
          outputData[i + 1] = srcData[i + 1];
          outputData[i + 2] = srcData[i + 2];
          outputData[i + 3] = srcData[i + 3];
        } else {
          // Non-local means filtering
          const result = this.nlMeansFilter(
            srcData, width, height, x, y,
            patchRadius, searchRadius, h * localStrength, colorPreserve
          );
          
          // Blend with original based on detail preservation
          const edge = this.detectEdge(srcData, width, height, x, y);
          const blendFactor = 1 - (edge * detailPreserve);
          
          outputData[i] = Math.round(srcData[i] * (1 - blendFactor * localStrength) + result.r * blendFactor * localStrength);
          outputData[i + 1] = Math.round(srcData[i + 1] * (1 - blendFactor * localStrength) + result.g * blendFactor * localStrength);
          outputData[i + 2] = Math.round(srcData[i + 2] * (1 - blendFactor * localStrength) + result.b * blendFactor * localStrength);
          outputData[i + 3] = srcData[i + 3];
        }
        
        // Store noise mask
        const noiseValue = Math.round(noiseMap[y * width + x] * 255);
        noiseMaskData[i] = noiseValue;
        noiseMaskData[i + 1] = noiseValue;
        noiseMaskData[i + 2] = noiseValue;
        noiseMaskData[i + 3] = 255;
      }
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width,
        height,
        channels: 4,
        data: outputData,
        format: 'rgba'
      };
    }
    
    const noiseMaskOutput = this.outputs.get('noiseMask');
    if (noiseMaskOutput) {
      noiseMaskOutput.value = {
        width,
        height,
        channels: 4,
        data: noiseMaskData,
        format: 'rgba'
      };
    }
  }

  private estimateNoiseMap(data: Uint8Array, width: number, height: number): Float32Array {
    const noiseMap = new Float32Array(width * height);
    const blockSize = 8;
    
    for (let by = 0; by < height; by += blockSize) {
      for (let bx = 0; bx < width; bx += blockSize) {
        // Calculate variance in this block
        let sum = 0, sum2 = 0, count = 0;
        
        for (let dy = 0; dy < blockSize && by + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && bx + dx < width; dx++) {
            const i = ((by + dy) * width + (bx + dx)) * 4;
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += gray;
            sum2 += gray * gray;
            count++;
          }
        }
        
        const mean = sum / count;
        const variance = sum2 / count - mean * mean;
        const noiseEstimate = Math.min(1, Math.sqrt(variance) / 50);
        
        // Fill block with noise estimate
        for (let dy = 0; dy < blockSize && by + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && bx + dx < width; dx++) {
            noiseMap[(by + dy) * width + (bx + dx)] = noiseEstimate;
          }
        }
      }
    }
    
    return noiseMap;
  }

  private nlMeansFilter(
    data: Uint8Array, width: number, height: number,
    x: number, y: number,
    patchRadius: number, searchRadius: number, h: number,
    colorPreserve: boolean
  ): { r: number; g: number; b: number } {
    let sumR = 0, sumG = 0, sumB = 0, totalWeight = 0;
    
    const centerPatch = this.getPatch(data, width, height, x, y, patchRadius);
    
    // Search in neighborhood
    const sr = Math.min(searchRadius, Math.floor(searchRadius / 2)); // Reduced for performance
    
    for (let sy = -sr; sy <= sr; sy += 2) {
      for (let sx = -sr; sx <= sr; sx += 2) {
        const nx = x + sx;
        const ny = y + sy;
        
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        const neighborPatch = this.getPatch(data, width, height, nx, ny, patchRadius);
        
        // Calculate patch distance
        let dist = 0;
        for (let i = 0; i < centerPatch.length; i++) {
          const diff = centerPatch[i] - neighborPatch[i];
          dist += diff * diff;
        }
        dist /= centerPatch.length;
        
        // Calculate weight
        const weight = Math.exp(-dist / (h * h));
        
        const ni = (ny * width + nx) * 4;
        sumR += data[ni] * weight;
        sumG += data[ni + 1] * weight;
        sumB += data[ni + 2] * weight;
        totalWeight += weight;
      }
    }
    
    if (totalWeight > 0) {
      let r = sumR / totalWeight;
      let g = sumG / totalWeight;
      let b = sumB / totalWeight;
      
      if (colorPreserve) {
        // Preserve original color ratios
        const i = (y * width + x) * 4;
        const origLum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const newLum = (r + g + b) / 3;
        
        if (origLum > 0 && newLum > 0) {
          const lumRatio = newLum / origLum;
          r = data[i] * lumRatio;
          g = data[i + 1] * lumRatio;
          b = data[i + 2] * lumRatio;
        }
      }
      
      return {
        r: Math.max(0, Math.min(255, r)),
        g: Math.max(0, Math.min(255, g)),
        b: Math.max(0, Math.min(255, b))
      };
    }
    
    const i = (y * width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  }

  private getPatch(data: Uint8Array, width: number, height: number, cx: number, cy: number, radius: number): Float32Array {
    const size = (radius * 2 + 1) * (radius * 2 + 1) * 3;
    const patch = new Float32Array(size);
    let idx = 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = Math.max(0, Math.min(width - 1, cx + dx));
        const y = Math.max(0, Math.min(height - 1, cy + dy));
        const i = (y * width + x) * 4;
        
        patch[idx++] = data[i];
        patch[idx++] = data[i + 1];
        patch[idx++] = data[i + 2];
      }
    }
    
    return patch;
  }

  private detectEdge(data: Uint8Array, width: number, height: number, x: number, y: number): number {
    if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return 0;
    
    const getGray = (px: number, py: number) => {
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    const gx = Math.abs(getGray(x + 1, y) - getGray(x - 1, y));
    const gy = Math.abs(getGray(x, y + 1) - getGray(x, y - 1));
    
    return Math.min(1, Math.sqrt(gx * gx + gy * gy) / 100);
  }
}
