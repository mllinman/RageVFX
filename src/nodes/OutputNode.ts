/**
 * OutputNode - Final output node for the render
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class OutputNode extends Node {
  constructor(id: string) {
    super(id, 'Output', 'Output');
    this.metadata.category = 'Output';
    this.metadata.description = 'Final output for rendering';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    
    this.setParameter('format', 'png');
    this.setParameter('quality', 100);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    
    if (!input?.value) {
      return;
    }

    // Store the final output
    this.cache.set('finalOutput', input.value);
  }

  getFinalOutput(): ImageData | null {
    return this.cache.get('finalOutput') || null;
  }
}
