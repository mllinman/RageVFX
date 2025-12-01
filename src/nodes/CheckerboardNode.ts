/**
 * CheckerboardNode - Generates checkerboard patterns
 */

import { Node, DataType } from '../core/Node';

export class CheckerboardNode extends Node {
  constructor(id: string) {
    super(id, 'Checkerboard', 'Checkerboard Generator');
    this.metadata.category = 'Generator';
    this.metadata.description = 'Generate checkerboard pattern with configurable size and colors';
    
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('squareSize', 64);
    this.setParameter('color1', { r: 0, g: 0, b: 0, a: 255 });
    this.setParameter('color2', { r: 255, g: 255, b: 255, a: 255 });
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const squareSize = this.getParameter('squareSize');
    const color1 = this.getParameter('color1');
    const color2 = this.getParameter('color2');
    
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Determine which square we're in
        const squareX = Math.floor(x / squareSize);
        const squareY = Math.floor(y / squareSize);
        
        // Alternate colors in checkerboard pattern
        const useColor1 = (squareX + squareY) % 2 === 0;
        const color = useColor1 ? color1 : color2;
        
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
}
