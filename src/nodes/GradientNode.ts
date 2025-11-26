/**
 * GradientNode - Generates color gradients
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class GradientNode extends Node {
  constructor(id: string) {
    super(id, 'Gradient', 'Gradient');
    this.metadata.category = 'Generator';
    this.metadata.description = 'Generate linear or radial gradients';
    
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('type', 'linear'); // linear, radial
    this.setParameter('angle', 0); // for linear
    this.setParameter('color1', { r: 0, g: 0, b: 0, a: 255 });
    this.setParameter('color2', { r: 255, g: 255, b: 255, a: 255 });
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const type = this.getParameter('type');
    const angle = this.getParameter('angle');
    const color1 = this.getParameter('color1');
    const color2 = this.getParameter('color2');
    
    const data = new Uint8Array(width * height * 4);
    
    if (type === 'linear') {
      this.generateLinearGradient(data, width, height, angle, color1, color2);
    } else if (type === 'radial') {
      this.generateRadialGradient(data, width, height, color1, color2);
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

  private generateLinearGradient(
    data: Uint8Array,
    width: number,
    height: number,
    angle: number,
    color1: any,
    color2: any
  ): void {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Normalized coordinates
        const nx = (x / width) - 0.5;
        const ny = (y / height) - 0.5;
        
        // Project onto gradient direction
        const t = Math.max(0, Math.min(1, (nx * cos + ny * sin) + 0.5));
        
        // Interpolate colors
        data[idx] = color1.r + (color2.r - color1.r) * t;
        data[idx + 1] = color1.g + (color2.g - color1.g) * t;
        data[idx + 2] = color1.b + (color2.b - color1.b) * t;
        data[idx + 3] = color1.a + (color2.a - color1.a) * t;
      }
    }
  }

  private generateRadialGradient(
    data: Uint8Array,
    width: number,
    height: number,
    color1: any,
    color2: any
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const t = Math.min(1, dist / maxDist);
        
        // Interpolate colors
        data[idx] = color1.r + (color2.r - color1.r) * t;
        data[idx + 1] = color1.g + (color2.g - color1.g) * t;
        data[idx + 2] = color1.b + (color2.b - color1.b) * t;
        data[idx + 3] = color1.a + (color2.a - color1.a) * t;
      }
    }
  }
}
