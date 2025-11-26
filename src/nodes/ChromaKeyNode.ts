/**
 * ChromaKeyNode - Green screen / blue screen keying
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class ChromaKeyNode extends Node {
  constructor(id: string) {
    super(id, 'ChromaKey', 'Chroma Key');
    this.metadata.category = 'Keying';
    this.metadata.description = 'Remove background based on color (green/blue screen)';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('keyColor', { r: 0, g: 255, b: 0 }); // Default green
    this.setParameter('threshold', 0.4);
    this.setParameter('softness', 0.1);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const keyColor = this.getParameter('keyColor');
    const threshold = this.getParameter('threshold');
    const softness = this.getParameter('softness');
    
    const result = this.applyChromaKey(inputImage, keyColor, threshold, softness);
    
    output.value = result;
  }

  private applyChromaKey(
    image: ImageData,
    keyColor: { r: number; g: number; b: number },
    threshold: number,
    softness: number
  ): ImageData {
    const { width, height, channels, data } = image;
    const output = new Uint8Array(data.length);
    
    // Normalize key color
    const keyR = keyColor.r / 255;
    const keyG = keyColor.g / 255;
    const keyB = keyColor.b / 255;
    
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Calculate color difference
      const dr = r - keyR;
      const dg = g - keyG;
      const db = b - keyB;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);
      
      // Calculate alpha based on distance to key color
      let alpha = 1.0;
      if (distance < threshold) {
        if (distance < threshold - softness) {
          alpha = 0.0;
        } else {
          // Soft edge
          alpha = (distance - (threshold - softness)) / softness;
        }
      }
      
      output[i] = data[i];
      output[i + 1] = data[i + 1];
      output[i + 2] = data[i + 2];
      
      if (channels === 4) {
        output[i + 3] = Math.min(data[i + 3], alpha * 255);
      } else {
        output[i + 3] = alpha * 255;
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
