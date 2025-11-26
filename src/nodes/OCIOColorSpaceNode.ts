/**
 * OCIOColorSpaceNode - OpenColorIO color space conversion
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class OCIOColorSpaceNode extends Node {
  constructor(id: string) {
    super(id, 'OCIOColorSpace', 'OCIO Color Space');
    this.metadata.category = 'Color';
    this.metadata.description = 'OpenColorIO color space conversion';
    this.metadata.version = '1.2.0';
    
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Common color spaces
    this.setParameter('sourceColorSpace', 'Linear');
    this.setParameter('targetColorSpace', 'sRGB');
    this.setParameter('config', 'aces_1.2');
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    if (!imageInput?.value) {
      return;
    }

    const inputCanvas = imageInput.value as HTMLCanvasElement;
    const inputCtx = inputCanvas.getContext('2d');
    if (!inputCtx) return;

    const width = inputCanvas.width;
    const height = inputCanvas.height;
    const sourceColorSpace = this.getParameter('sourceColorSpace');
    const targetColorSpace = this.getParameter('targetColorSpace');
    // const config = this.getParameter('config'); // TODO: Use config for OCIO library integration

    // In a real implementation, this would use OpenColorIO library
    // For now, we'll implement basic color space conversions
    
    const inputData = inputCtx.getImageData(0, 0, width, height);
    const outputData = new ImageData(width, height);

    for (let i = 0; i < inputData.data.length; i += 4) {
      let r = inputData.data[i] / 255;
      let g = inputData.data[i + 1] / 255;
      let b = inputData.data[i + 2] / 255;
      const a = inputData.data[i + 3];

      // Simple color space conversion (placeholder)
      if (sourceColorSpace === 'Linear' && targetColorSpace === 'sRGB') {
        // Linear to sRGB gamma correction
        r = this.linearToSRGB(r);
        g = this.linearToSRGB(g);
        b = this.linearToSRGB(b);
      } else if (sourceColorSpace === 'sRGB' && targetColorSpace === 'Linear') {
        // sRGB to Linear
        r = this.sRGBToLinear(r);
        g = this.sRGBToLinear(g);
        b = this.sRGBToLinear(b);
      }

      outputData.data[i] = Math.round(r * 255);
      outputData.data[i + 1] = Math.round(g * 255);
      outputData.data[i + 2] = Math.round(b * 255);
      outputData.data[i + 3] = a;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.putImageData(outputData, 0, 0);
    }

    const output = this.outputs.get('image');
    if (output) {
      output.value = canvas;
    }
  }

  private linearToSRGB(value: number): number {
    if (value <= 0.0031308) {
      return value * 12.92;
    }
    return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }

  private sRGBToLinear(value: number): number {
    if (value <= 0.04045) {
      return value / 12.92;
    }
    return Math.pow((value + 0.055) / 1.055, 2.4);
  }
}
