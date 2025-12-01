/**
 * RampNode - Generates smooth color ramps with multiple interpolation modes
 */

import { Node, DataType } from '../core/Node';

export class RampNode extends Node {
  constructor(id: string) {
    super(id, 'Ramp', 'Color Ramp Generator');
    this.metadata.category = 'Generator';
    this.metadata.description = 'Generate color ramps with multiple stops and interpolation modes';
    
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('direction', 'horizontal'); // horizontal, vertical, diagonal
    this.setParameter('interpolation', 'linear'); // linear, smooth, step
    this.setParameter('colors', [
      { position: 0.0, r: 0, g: 0, b: 0, a: 255 },
      { position: 0.5, r: 128, g: 128, b: 128, a: 255 },
      { position: 1.0, r: 255, g: 255, b: 255, a: 255 }
    ]);
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const direction = this.getParameter('direction');
    const interpolation = this.getParameter('interpolation');
    const colors = this.getParameter('colors');
    
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate position along ramp (0 to 1)
        let t: number;
        if (direction === 'horizontal') {
          t = x / width;
        } else if (direction === 'vertical') {
          t = y / height;
        } else { // diagonal
          t = (x / width + y / height) / 2;
        }
        
        // Apply interpolation
        if (interpolation === 'smooth') {
          t = t * t * (3 - 2 * t); // Smoothstep
        } else if (interpolation === 'step') {
          t = Math.floor(t * 10) / 10; // Stepped
        }
        
        // Find colors to interpolate between
        const color = this.interpolateColors(t, colors);
        
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = color.a;
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

  private interpolateColors(t: number, colors: any[]): any {
    // Find the two colors to interpolate between
    let color1 = colors[0];
    let color2 = colors[colors.length - 1];
    
    for (let i = 0; i < colors.length - 1; i++) {
      if (t >= colors[i].position && t <= colors[i + 1].position) {
        color1 = colors[i];
        color2 = colors[i + 1];
        break;
      }
    }
    
    // Calculate local t between the two colors
    const range = color2.position - color1.position;
    const localT = range === 0 ? 0 : (t - color1.position) / range;
    
    // Linear interpolation
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * localT),
      g: Math.round(color1.g + (color2.g - color1.g) * localT),
      b: Math.round(color1.b + (color2.b - color1.b) * localT),
      a: Math.round(color1.a + (color2.a - color1.a) * localT)
    };
  }
}
