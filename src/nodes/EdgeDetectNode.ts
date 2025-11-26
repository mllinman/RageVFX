/**
 * EdgeDetectNode - Detects edges in images using Sobel operator
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class EdgeDetectNode extends Node {
  constructor(id: string) {
    super(id, 'EdgeDetect', 'Edge Detect');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Detect edges using Sobel operator';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('threshold', 0.1);
    this.setParameter('outputMode', 'edges'); // edges, overlay
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const threshold = this.getParameter('threshold');
    const mode = this.getParameter('outputMode');
    
    const result = this.detectEdges(inputImage, threshold, mode);
    
    output.value = result;
  }

  private detectEdges(image: ImageData, threshold: number, mode: string): ImageData {
    const { width, height, channels } = image;
    const output = new Uint8Array(width * height * 4);
    
    // Convert to grayscale first
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * channels;
      gray[i] = (image.data[idx] * 0.299 + image.data[idx + 1] * 0.587 + image.data[idx + 2] * 0.114) / 255;
    }
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;
        
        // Apply Sobel operator
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const ki = (ky + 1) * 3 + (kx + 1);
            gx += gray[idx] * sobelX[ki];
            gy += gray[idx] * sobelY[ki];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const edge = magnitude > threshold ? 255 : 0;
        
        const outIdx = (y * width + x) * 4;
        
        if (mode === 'edges') {
          output[outIdx] = edge;
          output[outIdx + 1] = edge;
          output[outIdx + 2] = edge;
          output[outIdx + 3] = 255;
        } else if (mode === 'overlay') {
          const srcIdx = (y * width + x) * channels;
          output[outIdx] = Math.min(255, image.data[srcIdx] + edge * 0.5);
          output[outIdx + 1] = Math.min(255, image.data[srcIdx + 1] + edge * 0.5);
          output[outIdx + 2] = Math.min(255, image.data[srcIdx + 2] + edge * 0.5);
          output[outIdx + 3] = channels === 4 ? image.data[srcIdx + 3] : 255;
        }
      }
    }
    
    return {
      width,
      height,
      channels: 4,
      data: output,
      format: 'rgba'
    };
  }
}
