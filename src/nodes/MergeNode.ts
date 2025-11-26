/**
 * MergeNode - Composites multiple images together
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class MergeNode extends Node {
  constructor(id: string) {
    super(id, 'Merge', 'Merge');
    this.metadata.category = 'Composite';
    this.metadata.description = 'Composite foreground over background';
    
    this.addInput('foreground', 'Foreground', DataType.IMAGE);
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('operation', 'over');
    this.setParameter('opacity', 1.0);
    this.setParameter('mix', 1.0);
  }

  async process(): Promise<void> {
    const fgInput = this.inputs.get('foreground');
    const bgInput = this.inputs.get('background');
    const output = this.outputs.get('image');
    
    if (!fgInput?.value || !bgInput?.value || !output) {
      return;
    }

    const foreground = fgInput.value as ImageData;
    const background = bgInput.value as ImageData;
    const opacity = this.getParameter('opacity');
    const operation = this.getParameter('operation');
    
    const result = this.composite(foreground, background, opacity, operation);
    
    output.value = result;
  }

  private composite(
    foreground: ImageData,
    background: ImageData,
    opacity: number,
    operation: string
  ): ImageData {
    const width = Math.max(foreground.width, background.width);
    const height = Math.max(foreground.height, background.height);
    const channels = 4;
    const output = new Uint8Array(width * height * channels);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const outIdx = (y * width + x) * channels;
        
        // Get foreground pixel
        let fgR = 0, fgG = 0, fgB = 0, fgA = 0;
        if (x < foreground.width && y < foreground.height) {
          const fgIdx = (y * foreground.width + x) * foreground.channels;
          fgR = foreground.data[fgIdx] / 255;
          fgG = foreground.data[fgIdx + 1] / 255;
          fgB = foreground.data[fgIdx + 2] / 255;
          fgA = foreground.channels === 4 ? foreground.data[fgIdx + 3] / 255 : 1.0;
        }
        
        // Get background pixel
        let bgR = 0, bgG = 0, bgB = 0, bgA = 0;
        if (x < background.width && y < background.height) {
          const bgIdx = (y * background.width + x) * background.channels;
          bgR = background.data[bgIdx] / 255;
          bgG = background.data[bgIdx + 1] / 255;
          bgB = background.data[bgIdx + 2] / 255;
          bgA = background.channels === 4 ? background.data[bgIdx + 3] / 255 : 1.0;
        }
        
        // Apply opacity to foreground
        fgA *= opacity;
        
        // Composite based on operation
        let outR, outG, outB, outA;
        
        switch (operation) {
          case 'over':
            outR = fgR * fgA + bgR * bgA * (1 - fgA);
            outG = fgG * fgA + bgG * bgA * (1 - fgA);
            outB = fgB * fgA + bgB * bgA * (1 - fgA);
            outA = fgA + bgA * (1 - fgA);
            break;
          
          case 'add':
            outR = Math.min(1, fgR + bgR);
            outG = Math.min(1, fgG + bgG);
            outB = Math.min(1, fgB + bgB);
            outA = Math.min(1, fgA + bgA);
            break;
          
          case 'multiply':
            outR = fgR * bgR;
            outG = fgG * bgG;
            outB = fgB * bgB;
            outA = fgA * bgA;
            break;
          
          default:
            outR = fgR;
            outG = fgG;
            outB = fgB;
            outA = fgA;
        }
        
        output[outIdx] = outR * 255;
        output[outIdx + 1] = outG * 255;
        output[outIdx + 2] = outB * 255;
        output[outIdx + 3] = outA * 255;
      }
    }
    
    return {
      width,
      height,
      channels,
      data: output,
      format: 'rgba'
    };
  }
}
