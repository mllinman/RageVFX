/**
 * OutputNode - Final output node for the render
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class OutputNode extends Node {
  constructor(id: string) {
    super(id, 'Output', 'Output');
    this.metadata.category = 'Output';
    this.metadata.description = 'Final output for rendering (supports EXR and high-bit-depth)';
    this.metadata.version = '1.2.0';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    
    this.setParameter('format', 'png'); // png, jpeg, exr, tiff
    this.setParameter('quality', 100);
    this.setParameter('bitDepth', 8); // 8, 16, 32
    this.setParameter('compression', 'zip'); // none, zip, rle, piz (for EXR)
    this.setParameter('colorSpace', 'sRGB'); // sRGB, Linear, ACEScg
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    
    if (!input?.value) {
      return;
    }

    const format = this.getParameter('format');
    const bitDepth = this.getParameter('bitDepth');
    const compression = this.getParameter('compression');
    const colorSpace = this.getParameter('colorSpace');

    // Store the final output with metadata
    this.cache.set('finalOutput', input.value);
    this.cache.set('outputFormat', format);
    this.cache.set('outputBitDepth', bitDepth);
    this.cache.set('outputCompression', compression);
    this.cache.set('outputColorSpace', colorSpace);
  }

  getFinalOutput(): ImageData | null {
    return this.cache.get('finalOutput') || null;
  }

  getOutputMetadata(): any {
    return {
      format: this.cache.get('outputFormat'),
      bitDepth: this.cache.get('outputBitDepth'),
      compression: this.cache.get('outputCompression'),
      colorSpace: this.cache.get('outputColorSpace')
    };
  }
}
