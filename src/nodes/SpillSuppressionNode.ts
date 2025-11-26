/**
 * SpillSuppressionNode - Remove color spill from keying
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class SpillSuppressionNode extends Node {
  constructor(id: string) {
    super(id, 'SpillSuppression', 'Spill Suppression');
    this.metadata.category = 'Keying';
    this.metadata.description = 'Remove color spill from chroma keying';
    this.metadata.version = '1.1.0';
    
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addInput('matte', 'Matte', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('spillColor', { r: 0, g: 255, b: 0 });
    this.setParameter('amount', 1.0);
    this.setParameter('algorithm', 'simple'); // simple, advanced
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    if (!imageInput?.value) {
      return;
    }

    const inputCanvas = imageInput.value as HTMLCanvasElement;
    const inputCtx = inputCanvas.getContext('2d');
    if (!inputCtx) return;

    const width = inputCanvas.width;
    const height = inputCanvas.height;
    const spillColor = this.getParameter('spillColor');
    const amount = this.getParameter('amount');
    const algorithm = this.getParameter('algorithm');

    const inputData = inputCtx.getImageData(0, 0, width, height);
    const outputData = new ImageData(width, height);

    // Determine spill channel (with tie-breaking: green > blue > red in case of equal values)
    const spillChannel = spillColor.g >= spillColor.r && spillColor.g >= spillColor.b ? 1 :
                        spillColor.b > spillColor.r ? 2 : 0;

    for (let i = 0; i < inputData.data.length; i += 4) {
      const r = inputData.data[i];
      const g = inputData.data[i + 1];
      const b = inputData.data[i + 2];
      const a = inputData.data[i + 3];

      if (algorithm === 'simple') {
        // Simple spill suppression
        if (spillChannel === 1) { // Green spill
          const spill = Math.max(0, g - Math.max(r, b));
          outputData.data[i] = r;
          outputData.data[i + 1] = g - spill * amount;
          outputData.data[i + 2] = b;
        } else if (spillChannel === 2) { // Blue spill
          const spill = Math.max(0, b - Math.max(r, g));
          outputData.data[i] = r;
          outputData.data[i + 1] = g;
          outputData.data[i + 2] = b - spill * amount;
        } else { // Red spill
          const spill = Math.max(0, r - Math.max(g, b));
          outputData.data[i] = r - spill * amount;
          outputData.data[i + 1] = g;
          outputData.data[i + 2] = b;
        }
      } else {
        // Advanced spill suppression with color preservation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;

        if (spillChannel === 1 && g > r && g > b) {
          const avgOther = (r + b) / 2;
          const newG = avgOther + (g - avgOther) * (1 - amount * saturation);
          outputData.data[i] = r;
          outputData.data[i + 1] = Math.max(avgOther, newG);
          outputData.data[i + 2] = b;
        } else {
          outputData.data[i] = r;
          outputData.data[i + 1] = g;
          outputData.data[i + 2] = b;
        }
      }
      
      outputData.data[i + 3] = a;
    }

    // Create output canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.putImageData(outputData, 0, 0);
    }

    const output = this.outputs.get('image');
    if (output) {
      output.value = canvas;
    }
  }
}
