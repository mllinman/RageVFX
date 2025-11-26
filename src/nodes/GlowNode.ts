/**
 * GlowNode - Bloom/glow effect
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class GlowNode extends Node {
  constructor(id: string) {
    super(id, 'Glow', 'Glow');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Add bloom/glow effect to bright areas';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('threshold', 0.7);
    this.setParameter('intensity', 1.0);
    this.setParameter('radius', 10);
    this.setParameter('iterations', 3);
    this.setParameter('color', { r: 255, g: 255, b: 255 });
    this.setParameter('colorize', false);
    this.setParameter('mix', 1.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const threshold = this.getParameter('threshold');
    const intensity = this.getParameter('intensity');
    const radius = this.getParameter('radius');
    const iterations = this.getParameter('iterations');
    const glowColor = this.getParameter('color');
    const colorize = this.getParameter('colorize');
    const mix = this.getParameter('mix');
    
    const { width, height, channels, data: srcData } = inputImage;
    
    // Extract bright areas
    const bright = new Float32Array(width * height * 3);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const brightIdx = i * 3;
      
      const r = srcData[srcIdx] / 255;
      const g = srcData[srcIdx + 1] / 255;
      const b = srcData[srcIdx + 2] / 255;
      
      const luminance = r * 0.299 + g * 0.587 + b * 0.114;
      
      if (luminance > threshold) {
        const factor = (luminance - threshold) / (1 - threshold);
        if (colorize) {
          bright[brightIdx] = factor * glowColor.r / 255;
          bright[brightIdx + 1] = factor * glowColor.g / 255;
          bright[brightIdx + 2] = factor * glowColor.b / 255;
        } else {
          bright[brightIdx] = r * factor;
          bright[brightIdx + 1] = g * factor;
          bright[brightIdx + 2] = b * factor;
        }
      }
    }
    
    // Progressive blur
    let blurred: Float32Array = bright;
    for (let i = 0; i < iterations; i++) {
      blurred = this.boxBlur(blurred, width, height, 3, radius);
    }
    
    // Combine
    const outData = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      const blurIdx = i * 3;
      
      const r = srcData[srcIdx] / 255;
      const g = srcData[srcIdx + 1] / 255;
      const b = srcData[srcIdx + 2] / 255;
      
      // Additive blend
      const glowR = blurred[blurIdx] * intensity;
      const glowG = blurred[blurIdx + 1] * intensity;
      const glowB = blurred[blurIdx + 2] * intensity;
      
      outData[outIdx] = Math.min(255, (r + glowR * mix) * 255);
      outData[outIdx + 1] = Math.min(255, (g + glowG * mix) * 255);
      outData[outIdx + 2] = Math.min(255, (b + glowB * mix) * 255);
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

  private boxBlur(
    data: Float32Array,
    width: number,
    height: number,
    channels: number,
    radius: number
  ): Float32Array {
    const output = new Float32Array(width * height * channels);
    
    // Horizontal pass
    const temp = new Float32Array(width * height * channels);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < channels; c++) {
          let sum = 0;
          let count = 0;
          
          for (let k = -radius; k <= radius; k++) {
            const sx = Math.max(0, Math.min(width - 1, x + k));
            sum += data[(y * width + sx) * channels + c];
            count++;
          }
          
          temp[(y * width + x) * channels + c] = sum / count;
        }
      }
    }
    
    // Vertical pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < channels; c++) {
          let sum = 0;
          let count = 0;
          
          for (let k = -radius; k <= radius; k++) {
            const sy = Math.max(0, Math.min(height - 1, y + k));
            sum += temp[(sy * width + x) * channels + c];
            count++;
          }
          
          output[(y * width + x) * channels + c] = sum / count;
        }
      }
    }
    
    return output;
  }
}
