/**
 * TransformNode - Applies 2D transformations to images
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class TransformNode extends Node {
  constructor(id: string) {
    super(id, 'Transform', 'Transform 2D');
    this.metadata.category = 'Transform';
    this.metadata.description = 'Apply 2D transformations (translate, rotate, scale)';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('translateX', 0);
    this.setParameter('translateY', 0);
    this.setParameter('rotation', 0);
    this.setParameter('scaleX', 1.0);
    this.setParameter('scaleY', 1.0);
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const translateX = this.getParameter('translateX');
    const translateY = this.getParameter('translateY');
    const rotation = this.getParameter('rotation');
    const scaleX = this.getParameter('scaleX');
    const scaleY = this.getParameter('scaleY');
    const centerX = this.getParameter('centerX');
    const centerY = this.getParameter('centerY');
    
    const result = this.applyTransform(
      inputImage,
      translateX,
      translateY,
      rotation,
      scaleX,
      scaleY,
      centerX,
      centerY
    );
    
    output.value = result;
  }

  private applyTransform(
    image: ImageData,
    tx: number,
    ty: number,
    rotation: number,
    sx: number,
    sy: number,
    cx: number,
    cy: number
  ): ImageData {
    const { width, height, channels } = image;
    const output = new Uint8Array(width * height * channels);
    
    const rad = (rotation * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);
    
    const centerPixelX = width * cx;
    const centerPixelY = height * cy;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Transform coordinates
        let newX = x - centerPixelX;
        let newY = y - centerPixelY;
        
        // Apply scale
        newX /= sx;
        newY /= sy;
        
        // Apply rotation
        const rotX = newX * cosR - newY * sinR;
        const rotY = newX * sinR + newY * cosR;
        
        // Apply translation
        newX = rotX + centerPixelX - tx;
        newY = rotY + centerPixelY - ty;
        
        const outIdx = (y * width + x) * channels;
        
        // Sample from source image with bilinear interpolation
        if (newX >= 0 && newX < width - 1 && newY >= 0 && newY < height - 1) {
          const x0 = Math.floor(newX);
          const x1 = x0 + 1;
          const y0 = Math.floor(newY);
          const y1 = y0 + 1;
          
          const fx = newX - x0;
          const fy = newY - y0;
          
          for (let c = 0; c < channels; c++) {
            const v00 = image.data[(y0 * width + x0) * channels + c];
            const v10 = image.data[(y0 * width + x1) * channels + c];
            const v01 = image.data[(y1 * width + x0) * channels + c];
            const v11 = image.data[(y1 * width + x1) * channels + c];
            
            const v0 = v00 * (1 - fx) + v10 * fx;
            const v1 = v01 * (1 - fx) + v11 * fx;
            const v = v0 * (1 - fy) + v1 * fy;
            
            output[outIdx + c] = v;
          }
        } else {
          // Out of bounds - fill with transparent/black
          for (let c = 0; c < channels; c++) {
            output[outIdx + c] = 0;
          }
        }
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
