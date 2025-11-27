/**
 * InpaintNode - AI-powered inpainting for content removal and fill
 * Version 2.0 - Machine Learning Powered Tools
 */

import { Node, DataType } from '../core/Node';

export class InpaintNode extends Node {
  constructor(id: string) {
    super(id, 'Inpaint', 'AI Inpaint');
    this.metadata.category = 'ML';
    this.metadata.description = 'AI-powered inpainting for content removal and fill';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addInput('mask', 'Inpaint Mask', DataType.IMAGE);
    
    // Outputs
    this.addOutput('image', 'Inpainted Image', DataType.IMAGE);
    
    // Model settings
    this.setParameter('model', 'lama'); // lama, stable-diffusion, mat, deepfill
    this.setParameter('modelPath', '');
    
    // Inpainting parameters
    this.setParameter('mode', 'fill'); // fill, expand, remove
    this.setParameter('patchSize', 7);
    this.setParameter('searchRadius', 100);
    
    // Generation settings (for diffusion-based)
    this.setParameter('prompt', '');
    this.setParameter('negativePrompt', '');
    this.setParameter('guidanceScale', 7.5);
    this.setParameter('steps', 20);
    this.setParameter('seed', -1); // -1 for random
    
    // Quality settings
    this.setParameter('coherence', 0.5);
    this.setParameter('edgeBlend', 0.3);
    this.setParameter('textureMatch', true);
    
    // Advanced
    this.setParameter('dilationRadius', 3); // Expand mask
    this.setParameter('featherRadius', 5); // Blend edges
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const maskInput = this.inputs.get('mask');
    
    if (!imageInput?.value || !maskInput?.value) {
      if (imageInput?.value) {
        const output = this.outputs.get('image');
        if (output) {
          output.value = imageInput.value;
        }
      }
      return;
    }
    
    const width = imageInput.value.width;
    const height = imageInput.value.height;
    const srcData = imageInput.value.data;
    const maskData = maskInput.value.data;
    
    const outputData = new Uint8Array(width * height * 4);
    outputData.set(srcData);
    
    // Dilate mask
    const dilatedMask = this.dilateMask(maskData, width, height, this.getParameter('dilationRadius'));
    
    // PatchMatch-based inpainting (simplified)
    // In a real implementation, this would use a neural network
    const patchSize = this.getParameter('patchSize');
    const searchRadius = this.getParameter('searchRadius');
    
    // Find all pixels to inpaint
    const inpaintPixels: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (dilatedMask[i] > 128) {
          inpaintPixels.push({ x, y });
        }
      }
    }
    
    // Sort by distance from edge (inpaint from outside in)
    const distanceMap = this.computeDistanceFromEdge(dilatedMask, width, height);
    inpaintPixels.sort((a, b) => {
      const dA = distanceMap[a.y * width + a.x];
      const dB = distanceMap[b.y * width + b.x];
      return dA - dB;
    });
    
    // Inpaint each pixel
    for (const pixel of inpaintPixels) {
      const bestPatch = this.findBestPatch(
        outputData, dilatedMask, width, height,
        pixel.x, pixel.y, patchSize, searchRadius
      );
      
      if (bestPatch) {
        // Copy center pixel from best matching patch
        const srcI = (bestPatch.y * width + bestPatch.x) * 4;
        const dstI = (pixel.y * width + pixel.x) * 4;
        
        outputData[dstI] = outputData[srcI];
        outputData[dstI + 1] = outputData[srcI + 1];
        outputData[dstI + 2] = outputData[srcI + 2];
        outputData[dstI + 3] = outputData[srcI + 3];
        
        // Mark as filled
        dilatedMask[dstI] = 0;
      }
    }
    
    // Feather edges
    const featherRadius = this.getParameter('featherRadius');
    if (featherRadius > 0) {
      this.featherEdges(outputData, srcData, maskData, width, height, featherRadius);
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
  }

  private dilateMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
    const dilated = new Uint8Array(mask.length);
    dilated.set(mask);
    
    for (let r = 0; r < radius; r++) {
      const temp = new Uint8Array(dilated.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          
          // Check if any neighbor is masked
          let maxVal = dilated[i];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const ni = (ny * width + nx) * 4;
                maxVal = Math.max(maxVal, dilated[ni]);
              }
            }
          }
          
          temp[i] = maxVal;
          temp[i + 1] = maxVal;
          temp[i + 2] = maxVal;
          temp[i + 3] = 255;
        }
      }
      
      dilated.set(temp);
    }
    
    return dilated;
  }

  private computeDistanceFromEdge(mask: Uint8Array, width: number, height: number): Float32Array {
    const distance = new Float32Array(width * height);
    
    // Initialize: 0 for non-masked, Infinity for masked
    for (let i = 0; i < width * height; i++) {
      distance[i] = mask[i * 4] > 128 ? Infinity : 0;
    }
    
    // Forward pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (distance[i] === 0) continue;
        
        if (x > 0) distance[i] = Math.min(distance[i], distance[i - 1] + 1);
        if (y > 0) distance[i] = Math.min(distance[i], distance[i - width] + 1);
      }
    }
    
    // Backward pass
    for (let y = height - 1; y >= 0; y--) {
      for (let x = width - 1; x >= 0; x--) {
        const i = y * width + x;
        if (distance[i] === 0) continue;
        
        if (x < width - 1) distance[i] = Math.min(distance[i], distance[i + 1] + 1);
        if (y < height - 1) distance[i] = Math.min(distance[i], distance[i + width] + 1);
      }
    }
    
    return distance;
  }

  private findBestPatch(
    data: Uint8Array, mask: Uint8Array, width: number, height: number,
    cx: number, cy: number, patchSize: number, searchRadius: number
  ): { x: number; y: number } | null {
    const halfPatch = Math.floor(patchSize / 2);
    
    let bestScore = Infinity;
    let bestX = -1;
    let bestY = -1;
    
    // Collect valid pixels in the target patch (not masked)
    const targetPixels: Array<{ dx: number; dy: number }> = [];
    for (let dy = -halfPatch; dy <= halfPatch; dy++) {
      for (let dx = -halfPatch; dx <= halfPatch; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          if (mask[i] <= 128) {
            targetPixels.push({ dx, dy });
          }
        }
      }
    }
    
    if (targetPixels.length === 0) {
      // All pixels masked, use neighbor average
      return this.findNearestValidPixel(mask, width, height, cx, cy);
    }
    
    // Search for best matching patch
    const step = Math.max(1, Math.floor(searchRadius / 50)); // Sparse search for speed
    
    for (let sy = -searchRadius; sy <= searchRadius; sy += step) {
      for (let sx = -searchRadius; sx <= searchRadius; sx += step) {
        const px = cx + sx;
        const py = cy + sy;
        
        if (px < halfPatch || px >= width - halfPatch ||
            py < halfPatch || py >= height - halfPatch) {
          continue;
        }
        
        // Check if source patch center is valid (not masked)
        const srcI = (py * width + px) * 4;
        if (mask[srcI] > 128) continue;
        
        // Calculate patch similarity
        let score = 0;
        let validCount = 0;
        
        for (const { dx, dy } of targetPixels) {
          const tx = cx + dx;
          const ty = cy + dy;
          const sxx = px + dx;
          const syy = py + dy;
          
          if (sxx >= 0 && sxx < width && syy >= 0 && syy < height) {
            const ti = (ty * width + tx) * 4;
            const si = (syy * width + sxx) * 4;
            
            if (mask[si] <= 128) {
              const dr = data[ti] - data[si];
              const dg = data[ti + 1] - data[si + 1];
              const db = data[ti + 2] - data[si + 2];
              score += dr * dr + dg * dg + db * db;
              validCount++;
            }
          }
        }
        
        if (validCount > 0) {
          score /= validCount;
          
          if (score < bestScore) {
            bestScore = score;
            bestX = px;
            bestY = py;
          }
        }
      }
    }
    
    return bestX >= 0 ? { x: bestX, y: bestY } : null;
  }

  private findNearestValidPixel(mask: Uint8Array, width: number, height: number, cx: number, cy: number): { x: number; y: number } | null {
    for (let r = 1; r < Math.max(width, height); r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          
          const x = cx + dx;
          const y = cy + dy;
          
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const i = (y * width + x) * 4;
            if (mask[i] <= 128) {
              return { x, y };
            }
          }
        }
      }
    }
    
    return null;
  }

  private featherEdges(output: Uint8Array, original: Uint8Array, mask: Uint8Array, width: number, height: number, radius: number): void {
    // Create distance field from mask edge
    const dist = this.computeDistanceFromEdge(mask, width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const d = dist[y * width + x];
        
        if (d > 0 && d <= radius) {
          // Blend between inpainted and original based on distance
          const t = d / radius;
          output[i] = Math.round(output[i] * t + original[i] * (1 - t));
          output[i + 1] = Math.round(output[i + 1] * t + original[i + 1] * (1 - t));
          output[i + 2] = Math.round(output[i + 2] * t + original[i + 2] * (1 - t));
        }
      }
    }
  }
}
