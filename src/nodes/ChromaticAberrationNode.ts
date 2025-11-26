/**
 * ChromaticAberrationNode - Color fringing effect
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class ChromaticAberrationNode extends Node {
  constructor(id: string) {
    super(id, 'ChromaticAberration', 'Chromatic Aberration');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Simulate lens chromatic aberration';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('redOffset', 2);
    this.setParameter('blueOffset', -2);
    this.setParameter('type', 'radial'); // radial, lateral
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
    this.setParameter('falloff', 1.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const redOffset = this.getParameter('redOffset');
    const blueOffset = this.getParameter('blueOffset');
    const aberrationType = this.getParameter('type');
    const centerX = this.getParameter('centerX');
    const centerY = this.getParameter('centerY');
    const falloff = this.getParameter('falloff');
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    const cx = centerX * width;
    const cy = centerY * height;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const outIdx = (y * width + x) * 4;
        
        // Calculate offset based on distance from center
        let redDx: number, redDy: number;
        let blueDx: number, blueDy: number;
        
        if (aberrationType === 'radial') {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const factor = Math.pow(dist / maxDist, falloff);
          
          if (dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            
            redDx = nx * redOffset * factor;
            redDy = ny * redOffset * factor;
            blueDx = nx * blueOffset * factor;
            blueDy = ny * blueOffset * factor;
          } else {
            redDx = redDy = blueDx = blueDy = 0;
          }
        } else {
          // Lateral aberration (same direction everywhere)
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const factor = Math.pow(dist / maxDist, falloff);
          
          redDx = redOffset * factor;
          redDy = 0;
          blueDx = blueOffset * factor;
          blueDy = 0;
        }
        
        // Sample red channel
        const redX = Math.max(0, Math.min(width - 1, x + redDx));
        const redY = Math.max(0, Math.min(height - 1, y + redDy));
        const redValue = this.sampleBilinear(srcData, width, height, channels, redX, redY, 0);
        
        // Green stays at original position
        const srcIdx = (y * width + x) * channels;
        const greenValue = srcData[srcIdx + 1];
        
        // Sample blue channel
        const blueX = Math.max(0, Math.min(width - 1, x + blueDx));
        const blueY = Math.max(0, Math.min(height - 1, y + blueDy));
        const blueValue = this.sampleBilinear(srcData, width, height, channels, blueX, blueY, 2);
        
        outData[outIdx] = redValue;
        outData[outIdx + 1] = greenValue;
        outData[outIdx + 2] = blueValue;
        outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private sampleBilinear(
    data: Uint8Array | Uint16Array | Float32Array,
    width: number,
    height: number,
    channels: number,
    x: number,
    y: number,
    channel: number
  ): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    
    const fx = x - x0;
    const fy = y - y0;
    
    const v00 = data[(y0 * width + x0) * channels + channel];
    const v10 = data[(y0 * width + x1) * channels + channel];
    const v01 = data[(y1 * width + x0) * channels + channel];
    const v11 = data[(y1 * width + x1) * channels + channel];
    
    return v00 * (1 - fx) * (1 - fy) +
           v10 * fx * (1 - fy) +
           v01 * (1 - fx) * fy +
           v11 * fx * fy;
  }
}
