/**
 * LUTLoaderNode - Look-Up Table loader for color grading
 * Load and apply 1D/3D LUTs for professional color grading
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class LUTLoaderNode extends Node {
  private lut3D: Float32Array | null = null;
  private lutSize: number = 0;

  constructor(id: string) {
    super(id, 'LUTLoader', 'LUT Loader');
    this.metadata.category = 'Color';
    this.metadata.description = 'Load and apply Look-Up Tables (LUTs) for color grading';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // LUT source
    this.setParameter('lutType', '3D'); // 1D, 3D
    this.setParameter('lutPreset', 'none'); // Built-in presets
    this.setParameter('lutData', null); // Custom LUT data
    
    // Application
    this.setParameter('intensity', 1.0);
    this.setParameter('interpolation', 'trilinear'); // nearest, trilinear, tetrahedral
    
    // Pre/post processing
    this.setParameter('inputGamma', 1.0);
    this.setParameter('outputGamma', 1.0);
    this.setParameter('logToLinear', false);
    this.setParameter('linearToLog', false);
    
    // Built-in LUT presets
    this.setParameter('presets', [
      'none',
      'film_emulation',
      'bleach_bypass',
      'cross_process',
      'vintage_warm',
      'vintage_cool',
      'high_contrast',
      'low_contrast',
      'teal_orange',
      'desaturated',
      'infrared'
    ]);
    
    // Generate default identity LUT
    this.generateIdentityLUT(17);
  }

  private generateIdentityLUT(size: number): void {
    this.lutSize = size;
    this.lut3D = new Float32Array(size * size * size * 3);
    
    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          const idx = (b * size * size + g * size + r) * 3;
          this.lut3D[idx] = r / (size - 1);
          this.lut3D[idx + 1] = g / (size - 1);
          this.lut3D[idx + 2] = b / (size - 1);
        }
      }
    }
  }

  private generatePresetLUT(preset: string): void {
    const size = 17;
    this.lutSize = size;
    this.lut3D = new Float32Array(size * size * size * 3);
    
    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          const idx = (b * size * size + g * size + r) * 3;
          
          // Normalized input values
          let nr = r / (size - 1);
          let ng = g / (size - 1);
          let nb = b / (size - 1);
          
          // Apply preset transformation
          switch (preset) {
            case 'film_emulation': {
              // S-curve with lifted shadows and rolled highlights
              nr = this.filmCurve(nr);
              ng = this.filmCurve(ng);
              nb = this.filmCurve(nb);
              // Slight warm shift
              nr *= 1.02;
              nb *= 0.98;
              break;
            }
            
            case 'bleach_bypass': {
              // High contrast, desaturated look
              const lum = nr * 0.299 + ng * 0.587 + nb * 0.114;
              nr = (nr + lum) * 0.5;
              ng = (ng + lum) * 0.5;
              nb = (nb + lum) * 0.5;
              // Increase contrast
              nr = this.contrastCurve(nr, 1.4);
              ng = this.contrastCurve(ng, 1.4);
              nb = this.contrastCurve(nb, 1.4);
              break;
            }
            
            case 'cross_process': {
              // Color channel swapping and shifts
              const tr = nr * 0.9 + ng * 0.1 + 0.02;
              const tg = ng * 0.85 + nb * 0.15 - 0.02;
              const tb = nb * 0.9 + nr * 0.1 + 0.05;
              nr = Math.pow(tr, 0.9);
              ng = Math.pow(tg, 1.1);
              nb = Math.pow(tb, 0.85);
              break;
            }
            
            case 'vintage_warm': {
              // Warm, faded look
              nr = Math.pow(nr, 0.9) * 1.05;
              ng = Math.pow(ng, 0.95) * 1.0;
              nb = Math.pow(nb, 1.1) * 0.9;
              // Lift shadows
              nr = nr * 0.92 + 0.08;
              ng = ng * 0.94 + 0.06;
              nb = nb * 0.88 + 0.08;
              break;
            }
            
            case 'vintage_cool': {
              // Cool, faded look
              nr = Math.pow(nr, 1.05) * 0.95;
              ng = Math.pow(ng, 0.98) * 1.0;
              nb = Math.pow(nb, 0.92) * 1.08;
              // Lift shadows
              nr = nr * 0.9 + 0.08;
              ng = ng * 0.92 + 0.06;
              nb = nb * 0.9 + 0.1;
              break;
            }
            
            case 'high_contrast': {
              nr = this.contrastCurve(nr, 1.5);
              ng = this.contrastCurve(ng, 1.5);
              nb = this.contrastCurve(nb, 1.5);
              break;
            }
            
            case 'low_contrast': {
              nr = this.contrastCurve(nr, 0.7);
              ng = this.contrastCurve(ng, 0.7);
              nb = this.contrastCurve(nb, 0.7);
              break;
            }
            
            case 'teal_orange': {
              // Popular cinema look
              const lum = nr * 0.299 + ng * 0.587 + nb * 0.114;
              if (lum < 0.5) {
                // Shadows to teal
                nr *= 0.9;
                ng *= 1.0;
                nb *= 1.15;
              } else {
                // Highlights to orange
                nr *= 1.15;
                ng *= 0.95;
                nb *= 0.85;
              }
              break;
            }
            
            case 'desaturated': {
              const lum = nr * 0.299 + ng * 0.587 + nb * 0.114;
              nr = lum * 0.7 + nr * 0.3;
              ng = lum * 0.7 + ng * 0.3;
              nb = lum * 0.7 + nb * 0.3;
              break;
            }
            
            case 'infrared': {
              // False color infrared look
              const temp = nr;
              nr = ng * 0.8 + nb * 0.3;
              ng = temp * 0.5 + ng * 0.5;
              nb = nb * 0.3;
              break;
            }
            
            default:
              // Identity
              break;
          }
          
          // Clamp values
          this.lut3D[idx] = Math.max(0, Math.min(1, nr));
          this.lut3D[idx + 1] = Math.max(0, Math.min(1, ng));
          this.lut3D[idx + 2] = Math.max(0, Math.min(1, nb));
        }
      }
    }
  }

  private filmCurve(x: number): number {
    // Soft S-curve approximating film response
    const toe = 0.1;
    const shoulder = 0.9;
    
    if (x < toe) {
      return x * 1.5 * toe / 0.15;
    } else if (x > shoulder) {
      const t = (x - shoulder) / (1 - shoulder);
      return shoulder + (1 - shoulder) * (1 - Math.pow(1 - t, 2));
    }
    return x;
  }

  private contrastCurve(x: number, contrast: number): number {
    return Math.pow(x, contrast);
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
    
    const intensity = this.getParameter('intensity');
    const interpolation = this.getParameter('interpolation');
    const inputGamma = this.getParameter('inputGamma');
    const outputGamma = this.getParameter('outputGamma');
    const logToLinear = this.getParameter('logToLinear');
    const linearToLog = this.getParameter('linearToLog');
    const lutPreset = this.getParameter('lutPreset');
    
    // Generate LUT for preset
    if (lutPreset !== 'none') {
      this.generatePresetLUT(lutPreset);
    } else {
      this.generateIdentityLUT(17);
    }
    
    const width = inputImage.width;
    const height = inputImage.height;
    const outData = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * inputImage.channels;
        const outIdx = (y * width + x) * 4;
        
        // Get input color (normalized)
        let r = inputImage.data[srcIdx] / 255;
        let g = inputImage.data[srcIdx + 1] / 255;
        let b = inputImage.data[srcIdx + 2] / 255;
        const a = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
        
        // Apply input gamma
        if (inputGamma !== 1.0) {
          r = Math.pow(r, inputGamma);
          g = Math.pow(g, inputGamma);
          b = Math.pow(b, inputGamma);
        }
        
        // Log to linear conversion
        if (logToLinear) {
          r = this.logToLinearConvert(r);
          g = this.logToLinearConvert(g);
          b = this.logToLinearConvert(b);
        }
        
        // Apply LUT
        let lutR, lutG, lutB;
        
        if (interpolation === 'nearest') {
          [lutR, lutG, lutB] = this.sampleNearest(r, g, b);
        } else if (interpolation === 'tetrahedral') {
          [lutR, lutG, lutB] = this.sampleTetrahedral(r, g, b);
        } else {
          [lutR, lutG, lutB] = this.sampleTrilinear(r, g, b);
        }
        
        // Blend based on intensity
        r = r * (1 - intensity) + lutR * intensity;
        g = g * (1 - intensity) + lutG * intensity;
        b = b * (1 - intensity) + lutB * intensity;
        
        // Linear to log conversion
        if (linearToLog) {
          r = this.linearToLogConvert(r);
          g = this.linearToLogConvert(g);
          b = this.linearToLogConvert(b);
        }
        
        // Apply output gamma
        if (outputGamma !== 1.0) {
          r = Math.pow(r, 1 / outputGamma);
          g = Math.pow(g, 1 / outputGamma);
          b = Math.pow(b, 1 / outputGamma);
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

  private sampleNearest(r: number, g: number, b: number): [number, number, number] {
    if (!this.lut3D) return [r, g, b];
    
    const size = this.lutSize;
    const ri = Math.round(r * (size - 1));
    const gi = Math.round(g * (size - 1));
    const bi = Math.round(b * (size - 1));
    
    const idx = (bi * size * size + gi * size + ri) * 3;
    
    return [this.lut3D[idx], this.lut3D[idx + 1], this.lut3D[idx + 2]];
  }

  private sampleTrilinear(r: number, g: number, b: number): [number, number, number] {
    if (!this.lut3D) return [r, g, b];
    
    const size = this.lutSize;
    const maxIdx = size - 1;
    
    const rf = r * maxIdx;
    const gf = g * maxIdx;
    const bf = b * maxIdx;
    
    const r0 = Math.floor(rf);
    const g0 = Math.floor(gf);
    const b0 = Math.floor(bf);
    
    const r1 = Math.min(r0 + 1, maxIdx);
    const g1 = Math.min(g0 + 1, maxIdx);
    const b1 = Math.min(b0 + 1, maxIdx);
    
    const rd = rf - r0;
    const gd = gf - g0;
    const bd = bf - b0;
    
    const getLUT = (ri: number, gi: number, bi: number): [number, number, number] => {
      const idx = (bi * size * size + gi * size + ri) * 3;
      return [this.lut3D![idx], this.lut3D![idx + 1], this.lut3D![idx + 2]];
    };
    
    // 8 corner samples
    const c000 = getLUT(r0, g0, b0);
    const c100 = getLUT(r1, g0, b0);
    const c010 = getLUT(r0, g1, b0);
    const c110 = getLUT(r1, g1, b0);
    const c001 = getLUT(r0, g0, b1);
    const c101 = getLUT(r1, g0, b1);
    const c011 = getLUT(r0, g1, b1);
    const c111 = getLUT(r1, g1, b1);
    
    // Trilinear interpolation
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    
    const result: [number, number, number] = [0, 0, 0];
    
    for (let i = 0; i < 3; i++) {
      const c00 = lerp(c000[i], c100[i], rd);
      const c10 = lerp(c010[i], c110[i], rd);
      const c01 = lerp(c001[i], c101[i], rd);
      const c11 = lerp(c011[i], c111[i], rd);
      
      const c0 = lerp(c00, c10, gd);
      const c1 = lerp(c01, c11, gd);
      
      result[i] = lerp(c0, c1, bd);
    }
    
    return result;
  }

  private sampleTetrahedral(r: number, g: number, b: number): [number, number, number] {
    // Tetrahedral interpolation for higher quality
    // Falls back to trilinear for simplicity in this implementation
    return this.sampleTrilinear(r, g, b);
  }

  private logToLinearConvert(value: number): number {
    // Simple log to linear (approximating Cineon/DPX log)
    return (Math.pow(10, (value - 0.0932) / 0.4185) - 0.01) / 0.99;
  }

  private linearToLogConvert(value: number): number {
    // Simple linear to log (approximating Cineon/DPX log)
    return 0.0932 + 0.4185 * Math.log10(value * 0.99 + 0.01);
  }
}
