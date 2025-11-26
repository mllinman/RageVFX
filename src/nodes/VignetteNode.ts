/**
 * VignetteNode - Vignette effect
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class VignetteNode extends Node {
  constructor(id: string) {
    super(id, 'Vignette', 'Vignette');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Add vignette darkening effect';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('size', 0.5);
    this.setParameter('softness', 0.5);
    this.setParameter('roundness', 1.0);
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
    this.setParameter('color', { r: 0, g: 0, b: 0 });
    this.setParameter('strength', 1.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const size = this.getParameter('size');
    const softness = this.getParameter('softness');
    const roundness = this.getParameter('roundness');
    const centerX = this.getParameter('centerX');
    const centerY = this.getParameter('centerY');
    const vignetteColor = this.getParameter('color');
    const strength = this.getParameter('strength');
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    const cx = centerX * width;
    const cy = centerY * height;
    
    // Calculate normalization factors for ellipse
    const aspectRatio = width / height;
    const radiusX = width * (1 - size) * 0.5;
    const radiusY = height * (1 - size) * 0.5 / (roundness + (1 - roundness) / aspectRatio);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * channels;
        const outIdx = (y * width + x) * 4;
        
        // Calculate distance from center (elliptical)
        const dx = (x - cx) / radiusX;
        const dy = (y - cy) / radiusY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate vignette factor
        let vignette = 1.0;
        if (dist > 1 - softness) {
          if (dist > 1) {
            vignette = 0;
          } else {
            vignette = 1 - (dist - (1 - softness)) / softness;
          }
        }
        
        // Apply smoothstep for better falloff
        vignette = vignette * vignette * (3 - 2 * vignette);
        
        // Invert so edges are dark
        const darkening = 1 - (1 - vignette) * strength;
        
        // Mix original with vignette color
        const r = srcData[srcIdx] * darkening + vignetteColor.r * (1 - darkening);
        const g = srcData[srcIdx + 1] * darkening + vignetteColor.g * (1 - darkening);
        const b = srcData[srcIdx + 2] * darkening + vignetteColor.b * (1 - darkening);
        
        outData[outIdx] = Math.max(0, Math.min(255, r));
        outData[outIdx + 1] = Math.max(0, Math.min(255, g));
        outData[outIdx + 2] = Math.max(0, Math.min(255, b));
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
}
