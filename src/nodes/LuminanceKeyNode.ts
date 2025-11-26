/**
 * LuminanceKeyNode - Luminance-based keying
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class LuminanceKeyNode extends Node {
  constructor(id: string) {
    super(id, 'LuminanceKey', 'Luminance Key');
    this.metadata.category = 'Keying';
    this.metadata.description = 'Create matte based on luminance values';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('matte', 'Matte', DataType.IMAGE);
    
    this.setParameter('lowThreshold', 0.0);
    this.setParameter('highThreshold', 1.0);
    this.setParameter('softness', 0.1);
    this.setParameter('keyMode', 'luminance'); // luminance, highlights, shadows, midtones
    this.setParameter('invert', false);
    this.setParameter('premultiply', true);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    const matteOutput = this.outputs.get('matte');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const lowThreshold = this.getParameter('lowThreshold');
    const highThreshold = this.getParameter('highThreshold');
    const softness = this.getParameter('softness');
    const keyMode = this.getParameter('keyMode');
    const invert = this.getParameter('invert');
    const premultiply = this.getParameter('premultiply');
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    const matteData = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      
      const r = srcData[srcIdx] / 255;
      const g = srcData[srcIdx + 1] / 255;
      const b = srcData[srcIdx + 2] / 255;
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Calculate matte based on mode
      let matteValue: number;
      
      switch (keyMode) {
        case 'highlights':
          matteValue = this.smoothstep(highThreshold - softness, highThreshold, luminance);
          break;
        case 'shadows':
          matteValue = 1 - this.smoothstep(lowThreshold, lowThreshold + softness, luminance);
          break;
        case 'midtones': {
          const midLow = this.smoothstep(lowThreshold, lowThreshold + softness, luminance);
          const midHigh = 1 - this.smoothstep(highThreshold - softness, highThreshold, luminance);
          matteValue = midLow * midHigh;
          break;
        }
        default: {
          // luminance range
          const low = this.smoothstep(lowThreshold - softness, lowThreshold, luminance);
          const high = 1 - this.smoothstep(highThreshold, highThreshold + softness, luminance);
          matteValue = low * high;
        }
      }
      
      if (invert) {
        matteValue = 1 - matteValue;
      }
      
      // Output RGB (optionally premultiplied)
      const alpha = matteValue;
      if (premultiply) {
        outData[outIdx] = Math.floor(r * alpha * 255);
        outData[outIdx + 1] = Math.floor(g * alpha * 255);
        outData[outIdx + 2] = Math.floor(b * alpha * 255);
      } else {
        outData[outIdx] = Math.floor(r * 255);
        outData[outIdx + 1] = Math.floor(g * 255);
        outData[outIdx + 2] = Math.floor(b * 255);
      }
      outData[outIdx + 3] = Math.floor(alpha * 255);
      
      // Matte output
      const matteInt = Math.floor(matteValue * 255);
      matteData[outIdx] = matteInt;
      matteData[outIdx + 1] = matteInt;
      matteData[outIdx + 2] = matteInt;
      matteData[outIdx + 3] = 255;
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
    
    if (matteOutput) {
      matteOutput.value = {
        width,
        height,
        channels: 4,
        data: matteData,
        format: 'rgba'
      };
    }
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
}
