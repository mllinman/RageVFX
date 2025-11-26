/**
 * BlurNode - Applies Gaussian blur to an image
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class BlurNode extends Node {
  constructor(id: string) {
    super(id, 'Blur', 'Blur');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Apply Gaussian blur to image';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('blurAmount', 5.0);
    this.setParameter('quality', 'preview');
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const blurAmount = this.getParameter('blurAmount');
    
    // Simple box blur implementation for CPU processing
    const result = this.applyBoxBlur(inputImage, blurAmount);
    
    output.value = result;
  }

  private applyBoxBlur(image: ImageData, radius: number): ImageData {
    const { width, height, channels, data } = image;
    const output = new Uint8Array(data.length);
    const kernelSize = Math.floor(radius);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sums = new Array(channels).fill(0);
        let count = 0;
        
        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
          const sx = Math.max(0, Math.min(width - 1, x + kx));
          const idx = (y * width + sx) * channels;
          
          for (let c = 0; c < channels; c++) {
            sums[c] += data[idx + c];
          }
          count++;
        }
        
        const outIdx = (y * width + x) * channels;
        for (let c = 0; c < channels; c++) {
          output[outIdx + c] = sums[c] / count;
        }
      }
    }
    
    return {
      width,
      height,
      channels,
      data: output,
      format: image.format
    };
  }
}
