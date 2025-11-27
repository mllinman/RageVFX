/**
 * CDLNode - Color Decision List (ASC-CDL) color grading
 * Professional color correction using industry-standard ASC-CDL values
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class CDLNode extends Node {
  constructor(id: string) {
    super(id, 'CDL', 'CDL (Color Decision List)');
    this.metadata.category = 'Color';
    this.metadata.description = 'Apply ASC-CDL color grading with slope, offset, power, and saturation';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Slope (gain/multiply)
    this.setParameter('slopeR', 1.0);
    this.setParameter('slopeG', 1.0);
    this.setParameter('slopeB', 1.0);
    this.setParameter('slopeMaster', 1.0);
    
    // Offset (add)
    this.setParameter('offsetR', 0.0);
    this.setParameter('offsetG', 0.0);
    this.setParameter('offsetB', 0.0);
    this.setParameter('offsetMaster', 0.0);
    
    // Power (gamma)
    this.setParameter('powerR', 1.0);
    this.setParameter('powerG', 1.0);
    this.setParameter('powerB', 1.0);
    this.setParameter('powerMaster', 1.0);
    
    // Saturation
    this.setParameter('saturation', 1.0);
    
    // Processing options
    this.setParameter('clampNegative', true);
    this.setParameter('clampHighlight', true);
    this.setParameter('direction', 'forward'); // forward, inverse
    
    // Working color space
    this.setParameter('workingSpace', 'linear'); // linear, log, video
    
    // Presets (stored as CDL values)
    this.setParameter('presets', {
      'reset': { slope: [1, 1, 1], offset: [0, 0, 0], power: [1, 1, 1], saturation: 1 },
      'warm': { slope: [1.1, 1.0, 0.9], offset: [0.02, 0, -0.02], power: [0.95, 1.0, 1.05], saturation: 1.0 },
      'cool': { slope: [0.9, 1.0, 1.1], offset: [-0.02, 0, 0.02], power: [1.05, 1.0, 0.95], saturation: 1.0 },
      'high_contrast': { slope: [1.2, 1.2, 1.2], offset: [-0.05, -0.05, -0.05], power: [0.9, 0.9, 0.9], saturation: 1.1 },
      'low_contrast': { slope: [0.85, 0.85, 0.85], offset: [0.08, 0.08, 0.08], power: [1.1, 1.1, 1.1], saturation: 0.9 },
      'bleach': { slope: [1.0, 1.0, 1.0], offset: [0, 0, 0], power: [1.0, 1.0, 1.0], saturation: 0.5 },
      'punch': { slope: [1.1, 1.1, 1.1], offset: [0, 0, 0], power: [0.95, 0.95, 0.95], saturation: 1.2 }
    });
    
    // Mask
    this.setParameter('maskChannel', 'luminance'); // luminance, alpha, red, green, blue
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    
    if (!inputImage) {
      output.value = null;
      return;
    }
    
    const slopeR = this.getParameter('slopeR') * this.getParameter('slopeMaster');
    const slopeG = this.getParameter('slopeG') * this.getParameter('slopeMaster');
    const slopeB = this.getParameter('slopeB') * this.getParameter('slopeMaster');
    
    const offsetR = this.getParameter('offsetR') + this.getParameter('offsetMaster');
    const offsetG = this.getParameter('offsetG') + this.getParameter('offsetMaster');
    const offsetB = this.getParameter('offsetB') + this.getParameter('offsetMaster');
    
    const powerR = this.getParameter('powerR') * this.getParameter('powerMaster');
    const powerG = this.getParameter('powerG') * this.getParameter('powerMaster');
    const powerB = this.getParameter('powerB') * this.getParameter('powerMaster');
    
    const saturation = this.getParameter('saturation');
    const clampNegative = this.getParameter('clampNegative');
    const clampHighlight = this.getParameter('clampHighlight');
    const direction = this.getParameter('direction');
    const workingSpace = this.getParameter('workingSpace');
    
    const width = inputImage.width;
    const height = inputImage.height;
    const outData = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * inputImage.channels;
        const outIdx = (y * width + x) * 4;
        
        // Get input color (normalized to 0-1)
        let r = inputImage.data[srcIdx] / 255;
        let g = inputImage.data[srcIdx + 1] / 255;
        let b = inputImage.data[srcIdx + 2] / 255;
        const a = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
        
        // Convert to working space
        if (workingSpace === 'video') {
          // sRGB to linear
          r = this.srgbToLinear(r);
          g = this.srgbToLinear(g);
          b = this.srgbToLinear(b);
        } else if (workingSpace === 'log') {
          // Log to linear (Cineon-style)
          r = this.logToLinear(r);
          g = this.logToLinear(g);
          b = this.logToLinear(b);
        }
        
        if (direction === 'forward') {
          // Forward CDL: out = (in * slope + offset) ^ power
          
          // Step 1: Slope (multiply)
          r = r * slopeR;
          g = g * slopeG;
          b = b * slopeB;
          
          // Step 2: Offset (add)
          r = r + offsetR;
          g = g + offsetG;
          b = b + offsetB;
          
          // Clamp negative before power
          if (clampNegative) {
            r = Math.max(0, r);
            g = Math.max(0, g);
            b = Math.max(0, b);
          }
          
          // Step 3: Power (gamma)
          r = Math.pow(r, powerR);
          g = Math.pow(g, powerG);
          b = Math.pow(b, powerB);
          
          // Step 4: Saturation
          if (saturation !== 1.0) {
            const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
            r = lum + (r - lum) * saturation;
            g = lum + (g - lum) * saturation;
            b = lum + (b - lum) * saturation;
          }
        } else {
          // Inverse CDL: out = ((in ^ (1/power)) - offset) / slope
          
          // Step 1: Inverse Saturation
          if (saturation !== 1.0) {
            const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
            r = lum + (r - lum) / saturation;
            g = lum + (g - lum) / saturation;
            b = lum + (b - lum) / saturation;
          }
          
          // Clamp negative before inverse power
          if (clampNegative) {
            r = Math.max(0, r);
            g = Math.max(0, g);
            b = Math.max(0, b);
          }
          
          // Step 2: Inverse Power
          r = Math.pow(r, 1 / powerR);
          g = Math.pow(g, 1 / powerG);
          b = Math.pow(b, 1 / powerB);
          
          // Step 3: Inverse Offset
          r = r - offsetR;
          g = g - offsetG;
          b = b - offsetB;
          
          // Step 4: Inverse Slope
          r = r / slopeR;
          g = g / slopeG;
          b = b / slopeB;
        }
        
        // Convert back from working space
        if (workingSpace === 'video') {
          r = this.linearToSrgb(r);
          g = this.linearToSrgb(g);
          b = this.linearToSrgb(b);
        } else if (workingSpace === 'log') {
          r = this.linearToLog(r);
          g = this.linearToLog(g);
          b = this.linearToLog(b);
        }
        
        // Final clamping
        if (clampNegative) {
          r = Math.max(0, r);
          g = Math.max(0, g);
          b = Math.max(0, b);
        }
        
        if (clampHighlight) {
          r = Math.min(1, r);
          g = Math.min(1, g);
          b = Math.min(1, b);
        }
        
        outData[outIdx] = Math.min(255, Math.max(0, r * 255));
        outData[outIdx + 1] = Math.min(255, Math.max(0, g * 255));
        outData[outIdx + 2] = Math.min(255, Math.max(0, b * 255));
        outData[outIdx + 3] = a;
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private srgbToLinear(value: number): number {
    if (value <= 0.04045) {
      return value / 12.92;
    }
    return Math.pow((value + 0.055) / 1.055, 2.4);
  }

  private linearToSrgb(value: number): number {
    if (value <= 0.0031308) {
      return value * 12.92;
    }
    return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }

  private logToLinear(value: number): number {
    // Cineon-style log to linear
    return (Math.pow(10, (value - 0.0932) / 0.4185) - 0.01) / 0.99;
  }

  private linearToLog(value: number): number {
    // Cineon-style linear to log
    const clampedValue = Math.max(0.00001, value);
    return 0.0932 + 0.4185 * Math.log10(clampedValue * 0.99 + 0.01);
  }

  /**
   * Apply a preset to the node
   */
  applyPreset(presetName: string): void {
    const presets = this.getParameter('presets');
    const preset = presets[presetName];
    
    if (preset) {
      this.setParameter('slopeR', preset.slope[0]);
      this.setParameter('slopeG', preset.slope[1]);
      this.setParameter('slopeB', preset.slope[2]);
      this.setParameter('offsetR', preset.offset[0]);
      this.setParameter('offsetG', preset.offset[1]);
      this.setParameter('offsetB', preset.offset[2]);
      this.setParameter('powerR', preset.power[0]);
      this.setParameter('powerG', preset.power[1]);
      this.setParameter('powerB', preset.power[2]);
      this.setParameter('saturation', preset.saturation);
    }
  }

  /**
   * Export CDL values as XML (ASC-CDL format)
   */
  exportCDL(): string {
    const slope = `${this.getParameter('slopeR')} ${this.getParameter('slopeG')} ${this.getParameter('slopeB')}`;
    const offset = `${this.getParameter('offsetR')} ${this.getParameter('offsetG')} ${this.getParameter('offsetB')}`;
    const power = `${this.getParameter('powerR')} ${this.getParameter('powerG')} ${this.getParameter('powerB')}`;
    const saturation = this.getParameter('saturation');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<ColorDecisionList xmlns="urn:ASC:CDL:v1.01">
  <ColorDecision>
    <ColorCorrection>
      <SOPNode>
        <Slope>${slope}</Slope>
        <Offset>${offset}</Offset>
        <Power>${power}</Power>
      </SOPNode>
      <SatNode>
        <Saturation>${saturation}</Saturation>
      </SatNode>
    </ColorCorrection>
  </ColorDecision>
</ColorDecisionList>`;
  }
}
