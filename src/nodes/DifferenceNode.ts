/**
 * DifferenceNode - Difference blending mode and difference keying
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class DifferenceNode extends Node {
  constructor(id: string) {
    super(id, 'Difference', 'Difference');
    this.metadata.category = 'Keying';
    this.metadata.description = 'Difference keying and blending - subtracts colors and returns absolute value';
    
    this.addInput('imageA', 'Image A', DataType.IMAGE);
    this.addInput('imageB', 'Image B', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('matte', 'Matte', DataType.IMAGE);
    
    this.setParameter('mode', 'blend'); // blend, key
    this.setParameter('threshold', 0.1);
    this.setParameter('gain', 1.0);
    this.setParameter('invertMatte', false);
  }

  async process(): Promise<void> {
    const imageAInput = this.inputs.get('imageA');
    const imageBInput = this.inputs.get('imageB');
    const output = this.outputs.get('image');
    const matteOutput = this.outputs.get('matte');
    
    if (!imageAInput?.value || !imageBInput?.value || !output) {
      return;
    }

    const imageA = imageAInput.value as ImageData;
    const imageB = imageBInput.value as ImageData;
    const mode = this.getParameter('mode');
    const threshold = this.getParameter('threshold');
    const gain = this.getParameter('gain');
    const invertMatte = this.getParameter('invertMatte');
    
    const width = Math.max(imageA.width, imageB.width);
    const height = Math.max(imageA.height, imageB.height);
    const channels = 4;
    const data = new Uint8Array(width * height * channels);
    const matteData = new Uint8Array(width * height * channels);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const outIdx = (y * width + x) * channels;
        
        // Get image A pixel
        let aR = 0, aG = 0, aB = 0;
        if (x < imageA.width && y < imageA.height) {
          const aIdx = (y * imageA.width + x) * imageA.channels;
          aR = imageA.data[aIdx] / 255;
          aG = imageA.data[aIdx + 1] / 255;
          aB = imageA.data[aIdx + 2] / 255;
        }
        
        // Get image B pixel
        let bR = 0, bG = 0, bB = 0;
        if (x < imageB.width && y < imageB.height) {
          const bIdx = (y * imageB.width + x) * imageB.channels;
          bR = imageB.data[bIdx] / 255;
          bG = imageB.data[bIdx + 1] / 255;
          bB = imageB.data[bIdx + 2] / 255;
        }
        
        // Calculate difference
        const diffR = Math.abs(aR - bR);
        const diffG = Math.abs(aG - bG);
        const diffB = Math.abs(aB - bB);
        
        if (mode === 'blend') {
          // Standard difference blend
          data[outIdx] = Math.floor(diffR * 255);
          data[outIdx + 1] = Math.floor(diffG * 255);
          data[outIdx + 2] = Math.floor(diffB * 255);
          data[outIdx + 3] = 255;
        } else {
          // Difference keying mode - use image A with generated matte
          data[outIdx] = Math.floor(aR * 255);
          data[outIdx + 1] = Math.floor(aG * 255);
          data[outIdx + 2] = Math.floor(aB * 255);
          data[outIdx + 3] = 255;
        }
        
        // Generate matte based on difference magnitude
        const diffMagnitude = (diffR + diffG + diffB) / 3;
        let matteValue = (diffMagnitude - threshold) * gain;
        matteValue = Math.max(0, Math.min(1, matteValue));
        
        if (invertMatte) {
          matteValue = 1 - matteValue;
        }
        
        const matteInt = Math.floor(matteValue * 255);
        matteData[outIdx] = matteInt;
        matteData[outIdx + 1] = matteInt;
        matteData[outIdx + 2] = matteInt;
        matteData[outIdx + 3] = 255;
      }
    }
    
    output.value = {
      width,
      height,
      channels,
      data,
      format: 'rgba'
    };
    
    if (matteOutput) {
      matteOutput.value = {
        width,
        height,
        channels,
        data: matteData,
        format: 'rgba'
      };
    }
  }
}
