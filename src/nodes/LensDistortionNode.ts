/**
 * LensDistortionNode - Applies lens distortion effects (barrel, pincushion)
 */

import { Node, DataType } from '../core/Node';

export class LensDistortionNode extends Node {
  constructor(id: string) {
    super(id, 'LensDistortion', 'Lens Distortion');
    this.metadata.category = 'Transform';
    this.metadata.description = 'Apply barrel or pincushion lens distortion';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('distortionAmount', 0.0); // -1 to 1 (negative=pincushion, positive=barrel)
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
    this.setParameter('scale', 1.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) return;
    
    const inputData = input.value;
    const width = inputData.width;
    const height = inputData.height;
    const distortion = this.getParameter('distortionAmount');
    const centerX = this.getParameter('centerX');
    const centerY = this.getParameter('centerY');
    const scale = this.getParameter('scale');
    
    const data = new Uint8Array(width * height * 4);
    
    const cx = width * centerX;
    const cy = height * centerY;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate distance from center
        const dx = x - cx;
        const dy = y - cy;
        const radius = Math.sqrt(dx * dx + dy * dy);
        const normalizedRadius = radius / maxRadius;
        
        // Apply distortion
        const distortionFactor = 1 + distortion * normalizedRadius * normalizedRadius;
        
        // Calculate source coordinates
        const srcX = Math.round(cx + dx * distortionFactor / scale);
        const srcY = Math.round(cy + dy * distortionFactor / scale);
        
        // Sample from source (with bounds checking)
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const srcIdx = (srcY * width + srcX) * 4;
          data[idx] = inputData.data[srcIdx];
          data[idx + 1] = inputData.data[srcIdx + 1];
          data[idx + 2] = inputData.data[srcIdx + 2];
          data[idx + 3] = inputData.data[srcIdx + 3];
        } else {
          // Out of bounds - black
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        }
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data,
      format: 'rgba'
    };
  }
}
