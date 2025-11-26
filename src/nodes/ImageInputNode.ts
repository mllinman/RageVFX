/**
 * ImageInputNode - Loads and outputs image data
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class ImageInputNode extends Node {
  private imageData: ImageData | null = null;

  constructor(id: string) {
    super(id, 'ImageInput', 'Image Input');
    this.metadata.category = 'Input';
    this.metadata.description = 'Load image from file or memory';
    
    this.addOutput('image', 'Image', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('filepath', '');
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    
    // Create a placeholder image if no file is loaded
    if (!this.imageData) {
      const data = new Uint8Array(width * height * 4);
      
      // Fill with a gradient pattern
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          data[idx] = (x / width) * 255;     // R
          data[idx + 1] = (y / height) * 255; // G
          data[idx + 2] = 128;                 // B
          data[idx + 3] = 255;                 // A
        }
      }
      
      this.imageData = {
        width,
        height,
        channels: 4,
        data,
        format: 'rgba'
      };
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = this.imageData;
    }
  }

  setImageData(imageData: ImageData): void {
    this.imageData = imageData;
    this.markDirty();
  }
}
