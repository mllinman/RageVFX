/**
 * StyleTransferNode - Neural style transfer for artistic effects
 * Version 2.0 - Machine Learning Powered Tools
 */

import { Node, DataType } from '../core/Node';

export class StyleTransferNode extends Node {
  constructor(id: string) {
    super(id, 'StyleTransfer', 'Style Transfer');
    this.metadata.category = 'ML';
    this.metadata.description = 'Neural style transfer for artistic effects';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('content', 'Content Image', DataType.IMAGE);
    this.addInput('style', 'Style Image', DataType.IMAGE);
    
    // Outputs
    this.addOutput('image', 'Stylized Image', DataType.IMAGE);
    this.addOutput('styleMap', 'Style Map', DataType.IMAGE);
    
    // Model settings
    this.setParameter('model', 'fast'); // fast, arbitrary, gatys
    this.setParameter('modelPath', '');
    
    // Style parameters
    this.setParameter('styleStrength', 1.0);
    this.setParameter('contentWeight', 1.0);
    this.setParameter('styleWeight', 100.0);
    
    // Quality settings
    this.setParameter('iterations', 100); // For Gatys method
    this.setParameter('resolution', 512);
    this.setParameter('preserveColor', false);
    
    // Region control
    this.setParameter('styleMask', null);
    this.setParameter('contentMask', null);
    
    // Advanced
    this.setParameter('tvWeight', 0.0001); // Total variation loss weight
    this.setParameter('styleScales', [0.25, 0.5, 1.0]); // Multi-scale style
    this.setParameter('colorTransfer', 'none'); // none, luminance, histogram
  }

  async process(): Promise<void> {
    const contentInput = this.inputs.get('content');
    const styleInput = this.inputs.get('style');
    
    const styleStrength = this.getParameter('styleStrength');
    const preserveColor = this.getParameter('preserveColor');
    const colorTransfer = this.getParameter('colorTransfer');
    
    let width = 512;
    let height = 512;
    
    if (contentInput?.value) {
      width = contentInput.value.width || width;
      height = contentInput.value.height || height;
    }
    
    const outputData = new Uint8Array(width * height * 4);
    const styleMapData = new Uint8Array(width * height * 4);
    
    const contentData = contentInput?.value?.data;
    const styleData = styleInput?.value?.data;
    
    // Placeholder implementation - simulates style transfer effect
    // In a real implementation, this would use TensorFlow.js or ONNX Runtime
    
    if (contentData && styleData) {
      // Calculate style statistics
      const styleStats = this.calculateColorStats(styleData, styleInput.value.width, styleInput.value.height);
      const contentStats = this.calculateColorStats(contentData, width, height);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          
          // Get content color
          let r = contentData[i] || 0;
          let g = contentData[i + 1] || 0;
          let b = contentData[i + 2] || 0;
          const a = contentData[i + 3] || 255;
          
          if (preserveColor) {
            // Keep original colors but add stylization to luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Apply style-influenced texture pattern
            const pattern = this.getStylePattern(x, y, styleData, styleInput.value.width, styleInput.value.height);
            const styledLum = luminance * (1 - styleStrength * 0.3) + pattern * styleStrength * 0.3 * 255;
            
            const lumScale = styledLum / Math.max(luminance, 1);
            r = Math.min(255, r * lumScale);
            g = Math.min(255, g * lumScale);
            b = Math.min(255, b * lumScale);
          } else {
            // Apply color transfer from style
            switch (colorTransfer) {
              case 'histogram':
                // Histogram matching
                r = this.matchHistogram(r, contentStats.r, styleStats.r);
                g = this.matchHistogram(g, contentStats.g, styleStats.g);
                b = this.matchHistogram(b, contentStats.b, styleStats.b);
                break;
                
              case 'luminance': {
                // Preserve content luminance, apply style colors
                const contentLum = 0.299 * r + 0.587 * g + 0.114 * b;
                const styleR = this.sampleStyle(x, y, 0, styleData, styleInput.value.width, styleInput.value.height);
                const styleG = this.sampleStyle(x, y, 1, styleData, styleInput.value.width, styleInput.value.height);
                const styleB = this.sampleStyle(x, y, 2, styleData, styleInput.value.width, styleInput.value.height);
                const styleLum = 0.299 * styleR + 0.587 * styleG + 0.114 * styleB;
                
                const lumRatio = styleLum > 0 ? contentLum / styleLum : 1;
                r = Math.min(255, styleR * lumRatio * styleStrength + r * (1 - styleStrength));
                g = Math.min(255, styleG * lumRatio * styleStrength + g * (1 - styleStrength));
                b = Math.min(255, styleB * lumRatio * styleStrength + b * (1 - styleStrength));
                break;
              }
                
              default: {
                // Blend content and style colors with edge-aware blending
                const edgeWeight = this.calculateEdgeWeight(x, y, contentData, width, height);
                const styleBlend = styleStrength * (0.7 + 0.3 * edgeWeight);
                
                const sr = this.sampleStyle(x, y, 0, styleData, styleInput.value.width, styleInput.value.height);
                const sg = this.sampleStyle(x, y, 1, styleData, styleInput.value.width, styleInput.value.height);
                const sb = this.sampleStyle(x, y, 2, styleData, styleInput.value.width, styleInput.value.height);
                
                r = r * (1 - styleBlend) + sr * styleBlend;
                g = g * (1 - styleBlend) + sg * styleBlend;
                b = b * (1 - styleBlend) + sb * styleBlend;
              }
            }
          }
          
          outputData[i] = Math.round(Math.max(0, Math.min(255, r)));
          outputData[i + 1] = Math.round(Math.max(0, Math.min(255, g)));
          outputData[i + 2] = Math.round(Math.max(0, Math.min(255, b)));
          outputData[i + 3] = a;
          
          // Style map shows how much style was applied
          const styleAmount = Math.round(styleStrength * 255);
          styleMapData[i] = styleAmount;
          styleMapData[i + 1] = styleAmount;
          styleMapData[i + 2] = styleAmount;
          styleMapData[i + 3] = 255;
        }
      }
    } else if (contentData) {
      // No style image, just pass through content
      outputData.set(contentData);
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
    
    const styleMapOutput = this.outputs.get('styleMap');
    if (styleMapOutput) {
      styleMapOutput.value = {
        width,
        height,
        channels: 4,
        data: styleMapData,
        format: 'rgba'
      };
    }
  }

  private calculateColorStats(data: Uint8Array, width: number, height: number): { r: { mean: number; std: number }; g: { mean: number; std: number }; b: { mean: number; std: number } } {
    let sumR = 0, sumG = 0, sumB = 0;
    let sumR2 = 0, sumG2 = 0, sumB2 = 0;
    const count = width * height;
    
    for (let i = 0; i < count; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      
      sumR += r;
      sumG += g;
      sumB += b;
      sumR2 += r * r;
      sumG2 += g * g;
      sumB2 += b * b;
    }
    
    const meanR = sumR / count;
    const meanG = sumG / count;
    const meanB = sumB / count;
    
    return {
      r: { mean: meanR, std: Math.sqrt(sumR2 / count - meanR * meanR) },
      g: { mean: meanG, std: Math.sqrt(sumG2 / count - meanG * meanG) },
      b: { mean: meanB, std: Math.sqrt(sumB2 / count - meanB * meanB) }
    };
  }

  private matchHistogram(value: number, srcStats: { mean: number; std: number }, dstStats: { mean: number; std: number }): number {
    const normalized = (value - srcStats.mean) / Math.max(srcStats.std, 1);
    return normalized * dstStats.std + dstStats.mean;
  }

  private sampleStyle(x: number, y: number, channel: number, styleData: Uint8Array, styleWidth: number, styleHeight: number): number {
    // Sample with wrapping
    const sx = x % styleWidth;
    const sy = y % styleHeight;
    return styleData[(sy * styleWidth + sx) * 4 + channel];
  }

  private getStylePattern(x: number, y: number, styleData: Uint8Array, styleWidth: number, styleHeight: number): number {
    // Extract texture pattern from style
    const sx = x % styleWidth;
    const sy = y % styleHeight;
    const si = (sy * styleWidth + sx) * 4;
    
    return (styleData[si] + styleData[si + 1] + styleData[si + 2]) / 765; // Normalized 0-1
  }

  private calculateEdgeWeight(x: number, y: number, data: Uint8Array, width: number, height: number): number {
    // Sobel edge detection for edge-aware stylization
    if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return 0;
    
    const getGray = (px: number, py: number) => {
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    const gx = 
      -getGray(x - 1, y - 1) + getGray(x + 1, y - 1) +
      -2 * getGray(x - 1, y) + 2 * getGray(x + 1, y) +
      -getGray(x - 1, y + 1) + getGray(x + 1, y + 1);
    
    const gy = 
      -getGray(x - 1, y - 1) - 2 * getGray(x, y - 1) - getGray(x + 1, y - 1) +
      getGray(x - 1, y + 1) + 2 * getGray(x, y + 1) + getGray(x + 1, y + 1);
    
    return Math.min(1, Math.sqrt(gx * gx + gy * gy) / 255);
  }
}
