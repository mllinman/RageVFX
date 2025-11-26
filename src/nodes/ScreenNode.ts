/**
 * ScreenNode - Screen blending mode compositing
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class ScreenNode extends Node {
  constructor(id: string) {
    super(id, 'Screen', 'Screen');
    this.metadata.category = 'Composite';
    this.metadata.description = 'Screen blend mode - lightens by inverting, multiplying, and inverting again';
    
    this.addInput('foreground', 'Foreground', DataType.IMAGE);
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
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
    const mix = this.getParameter('mix');
    
    const width = Math.max(foreground.width, background.width);
    const height = Math.max(foreground.height, background.height);
    const channels = 4;
    const data = new Uint8Array(width * height * channels);
    
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
        
        // Screen blend: 1 - (1-A) * (1-B)
        const screenR = 1 - (1 - fgR) * (1 - bgR);
        const screenG = 1 - (1 - fgG) * (1 - bgG);
        const screenB = 1 - (1 - fgB) * (1 - bgB);
        
        // Apply mix and opacity
        const effectiveOpacity = opacity * fgA;
        const mixFactor = mix * effectiveOpacity;
        
        const outR = bgR * (1 - mixFactor) + screenR * mixFactor;
        const outG = bgG * (1 - mixFactor) + screenG * mixFactor;
        const outB = bgB * (1 - mixFactor) + screenB * mixFactor;
        const outA = Math.min(1, fgA + bgA * (1 - fgA));
        
        data[outIdx] = Math.floor(outR * 255);
        data[outIdx + 1] = Math.floor(outG * 255);
        data[outIdx + 2] = Math.floor(outB * 255);
        data[outIdx + 3] = Math.floor(outA * 255);
      }
    }
    
    output.value = {
      width,
      height,
      channels,
      data,
      format: 'rgba'
    };
  }
}
