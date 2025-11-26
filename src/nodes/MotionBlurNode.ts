/**
 * MotionBlurNode - Directional motion blur effect
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class MotionBlurNode extends Node {
  constructor(id: string) {
    super(id, 'MotionBlur', 'Motion Blur');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Apply directional motion blur';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('motionVector', 'Motion Vector', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('angle', 0); // Degrees
    this.setParameter('distance', 10);
    this.setParameter('samples', 16);
    this.setParameter('useMotionVector', false);
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
    this.setParameter('radial', false);
    this.setParameter('zoom', false);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const angle = this.getParameter('angle') * Math.PI / 180;
    const distance = this.getParameter('distance');
    const samples = this.getParameter('samples');
    const radial = this.getParameter('radial');
    const zoom = this.getParameter('zoom');
    const centerX = this.getParameter('centerX');
    const centerY = this.getParameter('centerY');
    
    const motionInput = this.inputs.get('motionVector');
    const motionVector = motionInput?.value as ImageData | undefined;
    const useMotionVector = this.getParameter('useMotionVector') && motionVector;
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const outIdx = (y * width + x) * 4;
        
        // Calculate motion vector for this pixel
        let dx: number, dy: number;
        
        if (useMotionVector && motionVector) {
          // Read motion from motion vector image (RG = XY motion)
          const mvIdx = (y * motionVector.width + x) * motionVector.channels;
          dx = ((motionVector.data[mvIdx] / 255) - 0.5) * 2 * distance;
          dy = ((motionVector.data[mvIdx + 1] / 255) - 0.5) * 2 * distance;
        } else if (radial) {
          // Radial blur from center
          const px = x / width - centerX;
          const py = y / height - centerY;
          const dist = Math.sqrt(px * px + py * py);
          dx = px * distance * dist;
          dy = py * distance * dist;
        } else if (zoom) {
          // Zoom blur from center
          const px = x / width - centerX;
          const py = y / height - centerY;
          dx = px * distance;
          dy = py * distance;
        } else {
          // Linear motion blur
          dx = Math.cos(angle) * distance;
          dy = Math.sin(angle) * distance;
        }
        
        // Accumulate samples along motion direction
        let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
        let count = 0;
        
        for (let s = 0; s < samples; s++) {
          const t = (s / (samples - 1)) - 0.5; // -0.5 to 0.5
          const sampleX = x + dx * t;
          const sampleY = y + dy * t;
          
          // Bilinear sample
          const x0 = Math.floor(sampleX);
          const y0 = Math.floor(sampleY);
          
          if (x0 >= 0 && x0 < width - 1 && y0 >= 0 && y0 < height - 1) {
            const fx = sampleX - x0;
            const fy = sampleY - y0;
            
            for (let c = 0; c < Math.min(channels, 4); c++) {
              const v00 = srcData[(y0 * width + x0) * channels + c];
              const v10 = srcData[(y0 * width + x0 + 1) * channels + c];
              const v01 = srcData[((y0 + 1) * width + x0) * channels + c];
              const v11 = srcData[((y0 + 1) * width + x0 + 1) * channels + c];
              
              const v = v00 * (1 - fx) * (1 - fy) +
                        v10 * fx * (1 - fy) +
                        v01 * (1 - fx) * fy +
                        v11 * fx * fy;
              
              if (c === 0) sumR += v;
              else if (c === 1) sumG += v;
              else if (c === 2) sumB += v;
              else sumA += v;
            }
            
            if (channels < 4) sumA += 255;
            count++;
          }
        }
        
        if (count > 0) {
          outData[outIdx] = Math.floor(sumR / count);
          outData[outIdx + 1] = Math.floor(sumG / count);
          outData[outIdx + 2] = Math.floor(sumB / count);
          outData[outIdx + 3] = Math.floor(sumA / count);
        } else {
          // Fallback to original pixel
          const srcIdx = (y * width + x) * channels;
          outData[outIdx] = srcData[srcIdx];
          outData[outIdx + 1] = srcData[srcIdx + 1];
          outData[outIdx + 2] = srcData[srcIdx + 2];
          outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
        }
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
}
