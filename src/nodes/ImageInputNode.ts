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
    this.metadata.description = 'Load image from file or memory (supports EXR and high-bit-depth)';
    this.metadata.version = '1.2.0';
    
    this.addOutput('image', 'Image', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('filepath', '');
    this.setParameter('format', 'rgba8'); // rgba8, rgba16, rgba32f, exr
    this.setParameter('colorSpace', 'sRGB'); // sRGB, Linear, ACEScg
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const format = this.getParameter('format');
    const colorSpace = this.getParameter('colorSpace');
    // const filepath = this.getParameter('filepath'); // TODO: Implement file loading
    
    // Create a placeholder image if no file is loaded
    if (!this.imageData) {
      let data: Uint8Array | Uint16Array | Float32Array;
      
      // Support different bit depths
      switch (format) {
        case 'rgba16':
          data = new Uint16Array(width * height * 4);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              data[idx] = (x / width) * 65535;
              data[idx + 1] = (y / height) * 65535;
              data[idx + 2] = 32768;
              data[idx + 3] = 65535;
            }
          }
          break;
        case 'rgba32f':
        case 'exr':
          data = new Float32Array(width * height * 4);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              data[idx] = x / width;
              data[idx + 1] = y / height;
              data[idx + 2] = 0.5;
              data[idx + 3] = 1.0;
            }
          }
          break;
        default: // rgba8
          data = new Uint8Array(width * height * 4);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              data[idx] = (x / width) * 255;
              data[idx + 1] = (y / height) * 255;
              data[idx + 2] = 128;
              data[idx + 3] = 255;
            }
          }
      }
      
      this.imageData = {
        width,
        height,
        channels: 4,
        data,
        format: format as any,
        colorSpace
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
