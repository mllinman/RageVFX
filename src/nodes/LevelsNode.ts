/**
 * LevelsNode - Levels adjustment
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class LevelsNode extends Node {
  constructor(id: string) {
    super(id, 'Levels', 'Levels');
    this.metadata.category = 'Color';
    this.metadata.description = 'Adjust input/output levels';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Input levels
    this.setParameter('inputBlack', 0);
    this.setParameter('inputWhite', 1);
    this.setParameter('inputGamma', 1);
    
    // Output levels
    this.setParameter('outputBlack', 0);
    this.setParameter('outputWhite', 1);
    
    // Per-channel
    this.setParameter('inputBlackR', 0);
    this.setParameter('inputWhiteR', 1);
    this.setParameter('inputBlackG', 0);
    this.setParameter('inputWhiteG', 1);
    this.setParameter('inputBlackB', 0);
    this.setParameter('inputWhiteB', 1);
    
    this.setParameter('perChannel', false);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    
    const inputBlack = this.getParameter('inputBlack');
    const inputWhite = this.getParameter('inputWhite');
    const inputGamma = this.getParameter('inputGamma');
    const outputBlack = this.getParameter('outputBlack');
    const outputWhite = this.getParameter('outputWhite');
    const perChannel = this.getParameter('perChannel');
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    // Build LUTs for efficiency
    const masterLUT = this.buildLUT(inputBlack, inputWhite, inputGamma, outputBlack, outputWhite);
    
    let redLUT: Uint8Array, greenLUT: Uint8Array, blueLUT: Uint8Array;
    
    if (perChannel) {
      redLUT = this.buildLUT(
        this.getParameter('inputBlackR'),
        this.getParameter('inputWhiteR'),
        inputGamma,
        outputBlack,
        outputWhite
      );
      greenLUT = this.buildLUT(
        this.getParameter('inputBlackG'),
        this.getParameter('inputWhiteG'),
        inputGamma,
        outputBlack,
        outputWhite
      );
      blueLUT = this.buildLUT(
        this.getParameter('inputBlackB'),
        this.getParameter('inputWhiteB'),
        inputGamma,
        outputBlack,
        outputWhite
      );
    } else {
      redLUT = greenLUT = blueLUT = masterLUT;
    }
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      
      outData[outIdx] = redLUT[srcData[srcIdx]];
      outData[outIdx + 1] = greenLUT[srcData[srcIdx + 1]];
      outData[outIdx + 2] = blueLUT[srcData[srcIdx + 2]];
      outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private buildLUT(
    inputBlack: number,
    inputWhite: number,
    gamma: number,
    outputBlack: number,
    outputWhite: number
  ): Uint8Array {
    const lut = new Uint8Array(256);
    
    const inputRange = inputWhite - inputBlack;
    const outputRange = outputWhite - outputBlack;
    
    for (let i = 0; i < 256; i++) {
      let value = i / 255;
      
      // Input levels
      value = (value - inputBlack) / (inputRange || 0.001);
      value = Math.max(0, Math.min(1, value));
      
      // Gamma
      if (gamma !== 1) {
        value = Math.pow(value, 1 / gamma);
      }
      
      // Output levels
      value = outputBlack + value * outputRange;
      
      lut[i] = Math.max(0, Math.min(255, Math.round(value * 255)));
    }
    
    return lut;
  }
}
