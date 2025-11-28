/**
 * ColorMatchNode - Professional color matching between images
 * Version 3.4 - Color
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class ColorMatchNode extends Node {
  constructor(id: string) {
    super(id, 'ColorMatch', 'ColorMatch');
    this.metadata.category = 'Color';
    this.metadata.description = 'Match colors from a reference image to your source image';
    
    this.addInput('source', 'Source', DataType.IMAGE);
    this.addInput('reference', 'Reference', DataType.IMAGE);
    this.addInput('mask', 'Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('method', 'histogram'); // histogram, reinhard, pitie
    this.setParameter('strength', 1.0);
    this.setParameter('preserveLuminance', false);
    this.setParameter('matchShadows', true);
    this.setParameter('matchMidtones', true);
    this.setParameter('matchHighlights', true);
    this.setParameter('fadeAmount', 0);
    this.setParameter('clipBlacks', 0);
    this.setParameter('clipWhites', 0);
  }

  async process(): Promise<void> {
    const sourceInput = this.inputs.get('source')?.value as ImageData | undefined;
    const referenceInput = this.inputs.get('reference')?.value as ImageData | undefined;
    const maskInput = this.inputs.get('mask')?.value as ImageData | undefined;
    
    if (!sourceInput) {
      return;
    }

    const width = sourceInput.width;
    const height = sourceInput.height;
    const method = this.getParameter('method');
    const strength = this.getParameter('strength');
    const preserveLuminance = this.getParameter('preserveLuminance');
    
    const data = new Uint8Array(width * height * 4);
    
    // Copy source to output
    for (let i = 0; i < sourceInput.data.length; i++) {
      data[i] = sourceInput.data[i];
    }
    
    // If no reference, just output the source
    if (!referenceInput) {
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
      return;
    }

    // Calculate statistics for both images
    const sourceStats = this.calculateStats(sourceInput);
    const refStats = this.calculateStats(referenceInput);
    
    switch (method) {
      case 'histogram':
        this.histogramMatch(data, width, height, sourceStats, refStats);
        break;
      case 'reinhard':
        this.reinhardMatch(data, width, height, sourceStats, refStats);
        break;
      case 'pitie':
        this.pitieMatch(data, width, height, sourceStats, refStats);
        break;
    }
    
    // Preserve original luminance if requested
    if (preserveLuminance) {
      this.preserveOriginalLuminance(data, sourceInput.data, width, height);
    }
    
    // Blend with original based on strength
    if (strength < 1.0) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = sourceInput.data[i] * (1 - strength) + data[i] * strength;
        data[i + 1] = sourceInput.data[i + 1] * (1 - strength) + data[i + 1] * strength;
        data[i + 2] = sourceInput.data[i + 2] * (1 - strength) + data[i + 2] * strength;
      }
    }
    
    // Apply mask if provided
    if (maskInput) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const maskIdx = (Math.min(y, maskInput.height - 1) * maskInput.width + Math.min(x, maskInput.width - 1)) * maskInput.channels;
          const maskValue = maskInput.data[maskIdx] / 255;
          
          data[idx] = sourceInput.data[idx] * (1 - maskValue) + data[idx] * maskValue;
          data[idx + 1] = sourceInput.data[idx + 1] * (1 - maskValue) + data[idx + 1] * maskValue;
          data[idx + 2] = sourceInput.data[idx + 2] * (1 - maskValue) + data[idx + 2] * maskValue;
        }
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

  private calculateStats(image: ImageData): {
    mean: { r: number; g: number; b: number };
    std: { r: number; g: number; b: number };
    min: { r: number; g: number; b: number };
    max: { r: number; g: number; b: number };
  } {
    let sumR = 0, sumG = 0, sumB = 0;
    let sumR2 = 0, sumG2 = 0, sumB2 = 0;
    let minR = 255, minG = 255, minB = 255;
    let maxR = 0, maxG = 0, maxB = 0;
    
    const pixelCount = image.width * image.height;
    
    for (let i = 0; i < image.data.length; i += image.channels) {
      const r = image.data[i];
      const g = image.data[i + 1] || r;
      const b = image.data[i + 2] || r;
      
      sumR += r;
      sumG += g;
      sumB += b;
      
      sumR2 += r * r;
      sumG2 += g * g;
      sumB2 += b * b;
      
      minR = Math.min(minR, r);
      minG = Math.min(minG, g);
      minB = Math.min(minB, b);
      
      maxR = Math.max(maxR, r);
      maxG = Math.max(maxG, g);
      maxB = Math.max(maxB, b);
    }
    
    const meanR = sumR / pixelCount;
    const meanG = sumG / pixelCount;
    const meanB = sumB / pixelCount;
    
    const stdR = Math.sqrt(Math.max(0, sumR2 / pixelCount - meanR * meanR));
    const stdG = Math.sqrt(Math.max(0, sumG2 / pixelCount - meanG * meanG));
    const stdB = Math.sqrt(Math.max(0, sumB2 / pixelCount - meanB * meanB));
    
    // Use small epsilon for zero variance to avoid division by zero
    // while preserving near-constant colors
    const epsilon = 0.001;
    
    return {
      mean: { r: meanR, g: meanG, b: meanB },
      std: { 
        r: stdR > epsilon ? stdR : epsilon, 
        g: stdG > epsilon ? stdG : epsilon, 
        b: stdB > epsilon ? stdB : epsilon 
      },
      min: { r: minR, g: minG, b: minB },
      max: { r: maxR, g: maxG, b: maxB }
    };
  }

  private histogramMatch(
    data: Uint8Array,
    width: number,
    height: number,
    sourceStats: ReturnType<typeof this.calculateStats>,
    refStats: ReturnType<typeof this.calculateStats>
  ): void {
    // Simple linear histogram matching using mean and std
    for (let i = 0; i < data.length; i += 4) {
      // Normalize source pixel
      const nR = (data[i] - sourceStats.mean.r) / sourceStats.std.r;
      const nG = (data[i + 1] - sourceStats.mean.g) / sourceStats.std.g;
      const nB = (data[i + 2] - sourceStats.mean.b) / sourceStats.std.b;
      
      // Transfer to reference distribution
      data[i] = Math.max(0, Math.min(255, nR * refStats.std.r + refStats.mean.r));
      data[i + 1] = Math.max(0, Math.min(255, nG * refStats.std.g + refStats.mean.g));
      data[i + 2] = Math.max(0, Math.min(255, nB * refStats.std.b + refStats.mean.b));
    }
  }

  private reinhardMatch(
    data: Uint8Array,
    width: number,
    height: number,
    sourceStats: ReturnType<typeof this.calculateStats>,
    refStats: ReturnType<typeof this.calculateStats>
  ): void {
    // Reinhard color transfer in Lab color space (simplified RGB version)
    for (let i = 0; i < data.length; i += 4) {
      // Convert to L*a*b* approximation
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      const L = 0.299 * r + 0.587 * g + 0.114 * b;
      const a = r - g;
      const bb = (r + g) / 2 - b;
      
      // Transfer
      const sL = (sourceStats.mean.r * 0.299 + sourceStats.mean.g * 0.587 + sourceStats.mean.b * 0.114) / 255;
      const tL = (refStats.mean.r * 0.299 + refStats.mean.g * 0.587 + refStats.mean.b * 0.114) / 255;
      
      const newL = (L - sL) + tL;
      const scale = newL / (L || 1);
      
      data[i] = Math.max(0, Math.min(255, data[i] * scale));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * scale));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * scale));
    }
  }

  private pitieMatch(
    data: Uint8Array,
    width: number,
    height: number,
    sourceStats: ReturnType<typeof this.calculateStats>,
    refStats: ReturnType<typeof this.calculateStats>
  ): void {
    // Simplified Pitié color transfer
    const iterations = 3;
    
    for (let iter = 0; iter < iterations; iter++) {
      // Apply linear transformation per channel
      this.histogramMatch(data, width, height, sourceStats, refStats);
    }
  }

  private preserveOriginalLuminance(
    data: Uint8Array,
    originalData: Uint8Array | Uint16Array | Float32Array,
    width: number,
    height: number
  ): void {
    for (let i = 0; i < data.length; i += 4) {
      const origLum = 0.299 * originalData[i] + 0.587 * originalData[i + 1] + 0.114 * originalData[i + 2];
      const newLum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      const scale = origLum / (newLum || 1);
      
      data[i] = Math.max(0, Math.min(255, data[i] * scale));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * scale));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * scale));
    }
  }
}
