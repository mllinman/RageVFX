/**
 * UpscaleNode - AI-powered image upscaling using super-resolution
 * Version 2.0 - Machine Learning Powered Tools
 */

import { Node, DataType } from '../core/Node';

export class UpscaleNode extends Node {
  constructor(id: string) {
    super(id, 'Upscale', 'AI Upscale');
    this.metadata.category = 'ML';
    this.metadata.description = 'AI-powered image upscaling using super-resolution';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('image', 'Image', DataType.IMAGE);
    
    // Outputs
    this.addOutput('image', 'Upscaled Image', DataType.IMAGE);
    
    // Upscale settings
    this.setParameter('scale', 2); // 2x, 4x, 8x
    this.setParameter('model', 'esrgan'); // esrgan, real-esrgan, waifu2x, anime4k
    this.setParameter('modelPath', '');
    
    // Quality settings
    this.setParameter('denoise', 0.5); // 0-1
    this.setParameter('sharpness', 0.5); // 0-1
    this.setParameter('enhanceDetails', true);
    
    // Tile processing for large images
    this.setParameter('tileSize', 256);
    this.setParameter('tileOverlap', 16);
    
    // Face enhancement
    this.setParameter('faceEnhance', false);
    this.setParameter('faceEnhanceStrength', 0.5);
    
    // Output settings
    this.setParameter('outputFormat', 'rgba');
    this.setParameter('outputBitDepth', 8);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    
    const scale = this.getParameter('scale');
    const denoise = this.getParameter('denoise');
    const sharpness = this.getParameter('sharpness');
    const enhanceDetails = this.getParameter('enhanceDetails');
    
    if (!imageInput?.value) {
      return;
    }
    
    const srcWidth = imageInput.value.width;
    const srcHeight = imageInput.value.height;
    const srcData = imageInput.value.data;
    
    const dstWidth = srcWidth * scale;
    const dstHeight = srcHeight * scale;
    const outputData = new Uint8Array(dstWidth * dstHeight * 4);
    
    // Placeholder implementation using bicubic interpolation with edge enhancement
    // In a real implementation, this would use ONNX Runtime or TensorFlow.js with ESRGAN model
    
    for (let y = 0; y < dstHeight; y++) {
      for (let x = 0; x < dstWidth; x++) {
        const i = (y * dstWidth + x) * 4;
        
        // Map to source coordinates
        const srcX = x / scale;
        const srcY = y / scale;
        
        // Bicubic interpolation with edge enhancement
        const color = this.bicubicSample(srcData, srcWidth, srcHeight, srcX, srcY);
        
        let r = color.r;
        let g = color.g;
        let b = color.b;
        const a = color.a;
        
        // Apply denoising (simple bilateral filter approximation)
        if (denoise > 0) {
          const smoothed = this.denoiseSample(srcData, srcWidth, srcHeight, srcX, srcY, denoise);
          r = r * (1 - denoise * 0.5) + smoothed.r * denoise * 0.5;
          g = g * (1 - denoise * 0.5) + smoothed.g * denoise * 0.5;
          b = b * (1 - denoise * 0.5) + smoothed.b * denoise * 0.5;
        }
        
        // Apply sharpening
        if (sharpness > 0 && enhanceDetails) {
          const sharp = this.sharpenSample(srcData, srcWidth, srcHeight, srcX, srcY, sharpness);
          r = Math.min(255, Math.max(0, r + sharp.r));
          g = Math.min(255, Math.max(0, g + sharp.g));
          b = Math.min(255, Math.max(0, b + sharp.b));
        }
        
        // Enhance edges for detail preservation
        if (enhanceDetails) {
          const edge = this.edgeEnhance(srcData, srcWidth, srcHeight, srcX, srcY);
          r = Math.min(255, Math.max(0, r + edge * 10));
          g = Math.min(255, Math.max(0, g + edge * 10));
          b = Math.min(255, Math.max(0, b + edge * 10));
        }
        
        outputData[i] = Math.round(r);
        outputData[i + 1] = Math.round(g);
        outputData[i + 2] = Math.round(b);
        outputData[i + 3] = Math.round(a);
      }
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width: dstWidth,
        height: dstHeight,
        channels: 4,
        data: outputData,
        format: 'rgba'
      };
    }
  }

  private bicubicSample(data: Uint8Array, width: number, height: number, x: number, y: number): { r: number; g: number; b: number; a: number } {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    
    const sample = (px: number, py: number) => {
      px = Math.max(0, Math.min(width - 1, px));
      py = Math.max(0, Math.min(height - 1, py));
      const i = (py * width + px) * 4;
      return {
        r: data[i] || 0,
        g: data[i + 1] || 0,
        b: data[i + 2] || 0,
        a: data[i + 3] || 255
      };
    };
    
    const cubic = (t: number, a: number, b: number, c: number, d: number) => {
      return b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
    };
    
    const result = { r: 0, g: 0, b: 0, a: 0 };
    const rows: Array<{ r: number; g: number; b: number; a: number }> = [];
    
    for (let dy = -1; dy <= 2; dy++) {
      const s0 = sample(x0 - 1, y0 + dy);
      const s1 = sample(x0, y0 + dy);
      const s2 = sample(x0 + 1, y0 + dy);
      const s3 = sample(x0 + 2, y0 + dy);
      
      rows.push({
        r: cubic(fx, s0.r, s1.r, s2.r, s3.r),
        g: cubic(fx, s0.g, s1.g, s2.g, s3.g),
        b: cubic(fx, s0.b, s1.b, s2.b, s3.b),
        a: cubic(fx, s0.a, s1.a, s2.a, s3.a)
      });
    }
    
    result.r = Math.max(0, Math.min(255, cubic(fy, rows[0].r, rows[1].r, rows[2].r, rows[3].r)));
    result.g = Math.max(0, Math.min(255, cubic(fy, rows[0].g, rows[1].g, rows[2].g, rows[3].g)));
    result.b = Math.max(0, Math.min(255, cubic(fy, rows[0].b, rows[1].b, rows[2].b, rows[3].b)));
    result.a = Math.max(0, Math.min(255, cubic(fy, rows[0].a, rows[1].a, rows[2].a, rows[3].a)));
    
    return result;
  }

  private denoiseSample(data: Uint8Array, width: number, height: number, x: number, y: number, strength: number): { r: number; g: number; b: number } {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const radius = 2;
    
    let sumR = 0, sumG = 0, sumB = 0, totalWeight = 0;
    
    const centerI = (Math.max(0, Math.min(height - 1, y0)) * width + Math.max(0, Math.min(width - 1, x0))) * 4;
    const centerR = data[centerI] || 0;
    const centerG = data[centerI + 1] || 0;
    const centerB = data[centerI + 2] || 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.max(0, Math.min(width - 1, x0 + dx));
        const py = Math.max(0, Math.min(height - 1, y0 + dy));
        const i = (py * width + px) * 4;
        
        const r = data[i] || 0;
        const g = data[i + 1] || 0;
        const b = data[i + 2] || 0;
        
        // Spatial weight
        const spatialDist = Math.sqrt(dx * dx + dy * dy);
        const spatialWeight = Math.exp(-spatialDist * spatialDist / (2 * radius * radius));
        
        // Color weight (bilateral filter)
        const colorDist = Math.sqrt(
          Math.pow(r - centerR, 2) + 
          Math.pow(g - centerG, 2) + 
          Math.pow(b - centerB, 2)
        );
        const colorWeight = Math.exp(-colorDist * colorDist / (2 * 30 * 30 * strength));
        
        const weight = spatialWeight * colorWeight;
        sumR += r * weight;
        sumG += g * weight;
        sumB += b * weight;
        totalWeight += weight;
      }
    }
    
    return {
      r: sumR / totalWeight,
      g: sumG / totalWeight,
      b: sumB / totalWeight
    };
  }

  private sharpenSample(data: Uint8Array, width: number, height: number, x: number, y: number, strength: number): { r: number; g: number; b: number } {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    
    const sample = (px: number, py: number) => {
      px = Math.max(0, Math.min(width - 1, px));
      py = Math.max(0, Math.min(height - 1, py));
      const i = (py * width + px) * 4;
      return {
        r: data[i] || 0,
        g: data[i + 1] || 0,
        b: data[i + 2] || 0
      };
    };
    
    const center = sample(x0, y0);
    const left = sample(x0 - 1, y0);
    const right = sample(x0 + 1, y0);
    const top = sample(x0, y0 - 1);
    const bottom = sample(x0, y0 + 1);
    
    // Unsharp mask
    const laplacianR = center.r * 4 - left.r - right.r - top.r - bottom.r;
    const laplacianG = center.g * 4 - left.g - right.g - top.g - bottom.g;
    const laplacianB = center.b * 4 - left.b - right.b - top.b - bottom.b;
    
    return {
      r: laplacianR * strength,
      g: laplacianG * strength,
      b: laplacianB * strength
    };
  }

  private edgeEnhance(data: Uint8Array, width: number, height: number, x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    
    if (x0 <= 0 || x0 >= width - 1 || y0 <= 0 || y0 >= height - 1) return 0;
    
    const getGray = (px: number, py: number) => {
      const i = (py * width + px) * 4;
      return ((data[i] || 0) + (data[i + 1] || 0) + (data[i + 2] || 0)) / 3;
    };
    
    // Sobel edge detection
    const gx = 
      -getGray(x0 - 1, y0 - 1) + getGray(x0 + 1, y0 - 1) +
      -2 * getGray(x0 - 1, y0) + 2 * getGray(x0 + 1, y0) +
      -getGray(x0 - 1, y0 + 1) + getGray(x0 + 1, y0 + 1);
    
    const gy = 
      -getGray(x0 - 1, y0 - 1) - 2 * getGray(x0, y0 - 1) - getGray(x0 + 1, y0 - 1) +
      getGray(x0 - 1, y0 + 1) + 2 * getGray(x0, y0 + 1) + getGray(x0 + 1, y0 + 1);
    
    return Math.sqrt(gx * gx + gy * gy) / 1020;
  }
}
