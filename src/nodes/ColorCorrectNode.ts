/**
 * ColorCorrectNode - Adjusts color properties of an image
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class ColorCorrectNode extends Node {
  constructor(id: string) {
    super(id, 'ColorCorrect', 'Color Correct');
    this.metadata.category = 'Color';
    this.metadata.description = 'Adjust brightness, contrast, saturation, and color';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('brightness', 0.0);
    this.setParameter('contrast', 1.0);
    this.setParameter('saturation', 1.0);
    this.setParameter('hue', 0.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const brightness = this.getParameter('brightness');
    const contrast = this.getParameter('contrast');
    const saturation = this.getParameter('saturation');
    
    const result = this.applyColorCorrection(inputImage, brightness, contrast, saturation);
    
    output.value = result;
  }

  private applyColorCorrection(
    image: ImageData,
    brightness: number,
    contrast: number,
    saturation: number
  ): ImageData {
    const { width, height, channels, data } = image;
    const output = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i += channels) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;
      
      // Apply brightness
      r += brightness;
      g += brightness;
      b += brightness;
      
      // Apply contrast
      r = (r - 0.5) * contrast + 0.5;
      g = (g - 0.5) * contrast + 0.5;
      b = (b - 0.5) * contrast + 0.5;
      
      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturation;
      g = gray + (g - gray) * saturation;
      b = gray + (b - gray) * saturation;
      
      // Clamp values
      output[i] = Math.max(0, Math.min(255, r * 255));
      output[i + 1] = Math.max(0, Math.min(255, g * 255));
      output[i + 2] = Math.max(0, Math.min(255, b * 255));
      
      if (channels === 4) {
        output[i + 3] = data[i + 3];
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
