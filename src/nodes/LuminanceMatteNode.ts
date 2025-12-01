/**
 * LuminanceMatteNode - Creates matte based on luminance values
 */

import { Node, DataType } from '../core/Node';

export class LuminanceMatteNode extends Node {
  constructor(id: string) {
    super(id, 'LuminanceMatte', 'Luminance Matte');
    this.metadata.category = 'Keying';
    this.metadata.description = 'Generate matte from luminance values with adjustable threshold';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('matte', 'Matte', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('threshold', 0.5); // 0-1
    this.setParameter('softness', 0.1); // Edge softness
    this.setParameter('invert', false);
    this.setParameter('mode', 'relative'); // relative, absolute
    this.setParameter('minLuminance', 0.0);
    this.setParameter('maxLuminance', 1.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const matteOutput = this.outputs.get('matte');
    const imageOutput = this.outputs.get('image');
    
    if (!input?.value) return;
    
    const inputData = input.value;
    const width = inputData.width;
    const height = inputData.height;
    
    const threshold = this.getParameter('threshold');
    const softness = this.getParameter('softness');
    const invert = this.getParameter('invert');
    const mode = this.getParameter('mode');
    const minLum = this.getParameter('minLuminance');
    const maxLum = this.getParameter('maxLuminance');
    
    const matteData = new Uint8Array(width * height * 4);
    const outputData = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        const r = inputData.data[idx];
        const g = inputData.data[idx + 1];
        const b = inputData.data[idx + 2];
        const a = inputData.data[idx + 3];
        
        // Calculate luminance (Rec. 709)
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        
        // Apply threshold with softness
        let alpha: number;
        
        if (mode === 'relative') {
          // Relative to threshold
          const diff = luminance - threshold;
          if (Math.abs(diff) < softness / 2) {
            alpha = 0.5 + (diff / softness);
          } else {
            alpha = diff > 0 ? 1 : 0;
          }
        } else {
          // Absolute range
          if (luminance < minLum) {
            alpha = 0;
          } else if (luminance > maxLum) {
            alpha = 1;
          } else {
            alpha = (luminance - minLum) / (maxLum - minLum);
          }
        }
        
        // Apply softness
        if (softness > 0 && mode === 'absolute') {
          const lowerEdge = minLum + softness / 2;
          const upperEdge = maxLum - softness / 2;
          
          if (luminance < lowerEdge) {
            alpha *= (luminance - minLum) / (softness / 2);
          } else if (luminance > upperEdge) {
            alpha *= (maxLum - luminance) / (softness / 2);
          }
        }
        
        // Clamp
        alpha = Math.max(0, Math.min(1, alpha));
        
        // Invert if needed
        if (invert) {
          alpha = 1 - alpha;
        }
        
        const alphaValue = Math.round(alpha * 255);
        
        // Matte output (grayscale)
        matteData[idx] = alphaValue;
        matteData[idx + 1] = alphaValue;
        matteData[idx + 2] = alphaValue;
        matteData[idx + 3] = 255;
        
        // Image output with alpha applied
        outputData[idx] = r;
        outputData[idx + 1] = g;
        outputData[idx + 2] = b;
        outputData[idx + 3] = alphaValue;
      }
    }
    
    if (matteOutput) {
      matteOutput.value = {
        width,
        height,
        channels: 4,
        data: matteData,
        format: 'rgba'
      };
    }
    
    if (imageOutput) {
      imageOutput.value = {
        width,
        height,
        channels: 4,
        data: outputData,
        format: 'rgba'
      };
    }
  }
}
