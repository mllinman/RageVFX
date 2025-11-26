/**
 * GradeNode - Professional color grading
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class GradeNode extends Node {
  constructor(id: string) {
    super(id, 'Grade', 'Grade');
    this.metadata.category = 'Color';
    this.metadata.description = 'Professional color grading with lift/gamma/gain';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Lift (shadows)
    this.setParameter('liftR', 0);
    this.setParameter('liftG', 0);
    this.setParameter('liftB', 0);
    this.setParameter('liftMaster', 0);
    
    // Gamma (midtones)
    this.setParameter('gammaR', 1);
    this.setParameter('gammaG', 1);
    this.setParameter('gammaB', 1);
    this.setParameter('gammaMaster', 1);
    
    // Gain (highlights)
    this.setParameter('gainR', 1);
    this.setParameter('gainG', 1);
    this.setParameter('gainB', 1);
    this.setParameter('gainMaster', 1);
    
    // Offset
    this.setParameter('offsetR', 0);
    this.setParameter('offsetG', 0);
    this.setParameter('offsetB', 0);
    
    // Saturation
    this.setParameter('saturation', 1);
    
    // Mix
    this.setParameter('mix', 1);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    
    // Get all parameters
    const lift = {
      r: this.getParameter('liftR') + this.getParameter('liftMaster'),
      g: this.getParameter('liftG') + this.getParameter('liftMaster'),
      b: this.getParameter('liftB') + this.getParameter('liftMaster')
    };
    
    const gamma = {
      r: this.getParameter('gammaR') * this.getParameter('gammaMaster'),
      g: this.getParameter('gammaG') * this.getParameter('gammaMaster'),
      b: this.getParameter('gammaB') * this.getParameter('gammaMaster')
    };
    
    const gain = {
      r: this.getParameter('gainR') * this.getParameter('gainMaster'),
      g: this.getParameter('gainG') * this.getParameter('gainMaster'),
      b: this.getParameter('gainB') * this.getParameter('gainMaster')
    };
    
    const offset = {
      r: this.getParameter('offsetR'),
      g: this.getParameter('offsetG'),
      b: this.getParameter('offsetB')
    };
    
    const saturation = this.getParameter('saturation');
    const mix = this.getParameter('mix');
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      
      // Get original values
      const origR = srcData[srcIdx] / 255;
      const origG = srcData[srcIdx + 1] / 255;
      const origB = srcData[srcIdx + 2] / 255;
      
      // Apply lift/gamma/gain formula:
      // result = gain * (lift * (1 - input) + input)^(1/gamma)
      let r = this.applyLiftGammaGain(origR, lift.r, gamma.r, gain.r) + offset.r;
      let g = this.applyLiftGammaGain(origG, lift.g, gamma.g, gain.g) + offset.g;
      let b = this.applyLiftGammaGain(origB, lift.b, gamma.b, gain.b) + offset.b;
      
      // Apply saturation
      if (saturation !== 1) {
        const luma = r * 0.299 + g * 0.587 + b * 0.114;
        r = luma + (r - luma) * saturation;
        g = luma + (g - luma) * saturation;
        b = luma + (b - luma) * saturation;
      }
      
      // Mix with original
      if (mix < 1) {
        r = origR + (r - origR) * mix;
        g = origG + (g - origG) * mix;
        b = origB + (b - origB) * mix;
      }
      
      // Clamp and output
      outData[outIdx] = Math.max(0, Math.min(255, r * 255));
      outData[outIdx + 1] = Math.max(0, Math.min(255, g * 255));
      outData[outIdx + 2] = Math.max(0, Math.min(255, b * 255));
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

  private applyLiftGammaGain(
    input: number,
    lift: number,
    gamma: number,
    gain: number
  ): number {
    // Lift affects shadows (low values), gain affects highlights
    // result = gain * pow(lift * (1 - input) + input, 1/gamma)
    const lifted = lift * (1 - input) + input;
    const gammaApplied = gamma > 0 ? Math.pow(Math.max(0, lifted), 1 / gamma) : 0;
    return gain * gammaApplied;
  }
}
