/**
 * SharpenNode - Image sharpening filter
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class SharpenNode extends Node {
  constructor(id: string) {
    super(id, 'Sharpen', 'Sharpen');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Sharpen image using unsharp mask';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('amount', 0.5);
    this.setParameter('radius', 1.0);
    this.setParameter('threshold', 0.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const amount = this.getParameter('amount');
    const radius = this.getParameter('radius');
    const threshold = this.getParameter('threshold');
    
    const { width, height, channels, data: srcData } = inputImage;
    
    // Create blurred version
    const blurred = this.gaussianBlur(srcData, width, height, channels, radius);
    
    // Unsharp mask: original + amount * (original - blurred)
    const outData = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      
      for (let c = 0; c < 3; c++) {
        const original = srcData[srcIdx + c];
        const blur = blurred[srcIdx + c];
        const diff = original - blur;
        
        // Apply threshold
        if (Math.abs(diff) > threshold * 255) {
          const sharpened = original + amount * diff;
          outData[outIdx + c] = Math.max(0, Math.min(255, sharpened));
        } else {
          outData[outIdx + c] = original;
        }
      }
      
      outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private gaussianBlur(
    data: Uint8Array | Float32Array,
    width: number,
    height: number,
    channels: number,
    radius: number
  ): Uint8Array {
    const kernelSize = Math.ceil(radius * 3) * 2 + 1;
    const sigma = radius;
    const kernel: number[] = [];
    let sum = 0;
    
    // Generate Gaussian kernel
    for (let i = 0; i < kernelSize; i++) {
      const x = i - Math.floor(kernelSize / 2);
      const g = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel.push(g);
      sum += g;
    }
    
    // Normalize kernel
    for (let i = 0; i < kernelSize; i++) {
      kernel[i] /= sum;
    }
    
    const temp = new Float32Array(width * height * channels);
    const output = new Uint8Array(width * height * channels);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < channels; c++) {
          let value = 0;
          
          for (let k = 0; k < kernelSize; k++) {
            const sx = Math.max(0, Math.min(width - 1, x + k - Math.floor(kernelSize / 2)));
            value += data[(y * width + sx) * channels + c] * kernel[k];
          }
          
          temp[(y * width + x) * channels + c] = value;
        }
      }
    }
    
    // Vertical pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < channels; c++) {
          let value = 0;
          
          for (let k = 0; k < kernelSize; k++) {
            const sy = Math.max(0, Math.min(height - 1, y + k - Math.floor(kernelSize / 2)));
            value += temp[(sy * width + x) * channels + c] * kernel[k];
          }
          
          output[(y * width + x) * channels + c] = Math.max(0, Math.min(255, value));
        }
      }
    }
    
    return output;
  }
}
