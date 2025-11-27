/**
 * DeepCompositeNode - Deep compositing with per-pixel depth information
 * Professional deep image compositing for complex VFX shots
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface DeepSample {
  color: { r: number; g: number; b: number; a: number };
  depth: number;
  coverage: number;
}

export class DeepCompositeNode extends Node {
  constructor(id: string) {
    super(id, 'DeepComposite', 'Deep Composite');
    this.metadata.category = 'Composite';
    this.metadata.description = 'Deep compositing with per-pixel depth information';
    
    this.addInput('foreground', 'Foreground', DataType.IMAGE);
    this.addInput('foreground_depth', 'FG Depth', DataType.IMAGE);
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addInput('background_depth', 'BG Depth', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('depth', 'Combined Depth', DataType.IMAGE);
    
    // Deep compositing settings
    this.setParameter('mergeMode', 'depth'); // depth, over, under, plus
    this.setParameter('depthTolerance', 0.001);
    this.setParameter('antiAliasing', true);
    
    // Depth range mapping
    this.setParameter('fgDepthMin', 0.0);
    this.setParameter('fgDepthMax', 1.0);
    this.setParameter('bgDepthMin', 0.0);
    this.setParameter('bgDepthMax', 1.0);
    this.setParameter('depthOffset', 0.0);
    
    // Holdout
    this.setParameter('holdout', false);
    this.setParameter('holdoutDepthRange', 0.01);
    
    // Edge handling
    this.setParameter('edgeBlend', 0.0);
    this.setParameter('matteEdge', 0.0);
  }

  async process(): Promise<void> {
    const fgInput = this.inputs.get('foreground');
    const fgDepthInput = this.inputs.get('foreground_depth');
    const bgInput = this.inputs.get('background');
    const bgDepthInput = this.inputs.get('background_depth');
    const output = this.outputs.get('image');
    const depthOutput = this.outputs.get('depth');
    
    if (!output) return;

    const fg = fgInput?.value as ImageData | undefined;
    const fgDepth = fgDepthInput?.value as ImageData | undefined;
    const bg = bgInput?.value as ImageData | undefined;
    const bgDepth = bgDepthInput?.value as ImageData | undefined;
    
    if (!fg && !bg) {
      output.value = null;
      return;
    }
    
    const mergeMode = this.getParameter('mergeMode');
    const depthTolerance = this.getParameter('depthTolerance');
    const antiAliasing = this.getParameter('antiAliasing');
    const fgDepthMin = this.getParameter('fgDepthMin');
    const fgDepthMax = this.getParameter('fgDepthMax');
    const bgDepthMin = this.getParameter('bgDepthMin');
    const bgDepthMax = this.getParameter('bgDepthMax');
    const depthOffset = this.getParameter('depthOffset');
    const holdout = this.getParameter('holdout');
    const holdoutDepthRange = this.getParameter('holdoutDepthRange');
    const edgeBlend = this.getParameter('edgeBlend');
    
    const width = fg?.width || bg?.width || 1920;
    const height = fg?.height || bg?.height || 1080;
    
    const outData = new Uint8Array(width * height * 4);
    const outDepthData = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get foreground sample
        let fgR = 0, fgG = 0, fgB = 0, fgA = 0, fgZ = 1.0;
        if (fg) {
          const srcIdx = (y * fg.width + x) * fg.channels;
          fgR = fg.data[srcIdx];
          fgG = fg.data[srcIdx + 1];
          fgB = fg.data[srcIdx + 2];
          fgA = fg.channels === 4 ? fg.data[srcIdx + 3] / 255 : 1;
          
          if (fgDepth) {
            const depthIdx = (y * fgDepth.width + x) * fgDepth.channels;
            const rawDepth = fgDepth.data[depthIdx] / 255;
            fgZ = fgDepthMin + rawDepth * (fgDepthMax - fgDepthMin) + depthOffset;
          }
        }
        
        // Get background sample
        let bgR = 0, bgG = 0, bgB = 0, bgA = 0, bgZ = 1.0;
        if (bg) {
          const srcIdx = (y * bg.width + x) * bg.channels;
          bgR = bg.data[srcIdx];
          bgG = bg.data[srcIdx + 1];
          bgB = bg.data[srcIdx + 2];
          bgA = bg.channels === 4 ? bg.data[srcIdx + 3] / 255 : 1;
          
          if (bgDepth) {
            const depthIdx = (y * bgDepth.width + x) * bgDepth.channels;
            const rawDepth = bgDepth.data[depthIdx] / 255;
            bgZ = bgDepthMin + rawDepth * (bgDepthMax - bgDepthMin);
          }
        }
        
        let r, g, b, a, z;
        
        switch (mergeMode) {
          case 'depth': {
            // Deep merge based on depth
            const depthDiff = Math.abs(fgZ - bgZ);
            
            if (depthDiff < depthTolerance) {
              // Depths are similar - blend based on alpha
              const totalAlpha = fgA + bgA * (1 - fgA);
              if (totalAlpha > 0) {
                r = (fgR * fgA + bgR * bgA * (1 - fgA)) / totalAlpha;
                g = (fgG * fgA + bgG * bgA * (1 - fgA)) / totalAlpha;
                b = (fgB * fgA + bgB * bgA * (1 - fgA)) / totalAlpha;
                a = totalAlpha;
                z = Math.min(fgZ, bgZ);
              } else {
                r = g = b = 0;
                a = 0;
                z = 1;
              }
            } else if (fgZ < bgZ) {
              // Foreground is closer
              if (antiAliasing && edgeBlend > 0 && fgA < 1) {
                const blend = fgA * (1 + edgeBlend);
                r = fgR * blend + bgR * (1 - blend);
                g = fgG * blend + bgG * (1 - blend);
                b = fgB * blend + bgB * (1 - blend);
                a = Math.min(1, blend + bgA * (1 - blend));
              } else {
                r = fgR * fgA + bgR * (1 - fgA);
                g = fgG * fgA + bgG * (1 - fgA);
                b = fgB * fgA + bgB * (1 - fgA);
                a = fgA + bgA * (1 - fgA);
              }
              z = fgZ;
            } else {
              // Background is closer
              if (holdout && Math.abs(fgZ - bgZ) < holdoutDepthRange) {
                // Holdout - cut hole in foreground
                r = bgR;
                g = bgG;
                b = bgB;
                a = bgA;
              } else {
                r = bgR * bgA + fgR * (1 - bgA);
                g = bgG * bgA + fgG * (1 - bgA);
                b = bgB * bgA + fgB * (1 - bgA);
                a = bgA + fgA * (1 - bgA);
              }
              z = bgZ;
            }
            break;
          }
          
          case 'over': {
            r = fgR * fgA + bgR * (1 - fgA);
            g = fgG * fgA + bgG * (1 - fgA);
            b = fgB * fgA + bgB * (1 - fgA);
            a = fgA + bgA * (1 - fgA);
            z = fgZ < bgZ ? fgZ : bgZ;
            break;
          }
          
          case 'under': {
            r = bgR * bgA + fgR * (1 - bgA);
            g = bgG * bgA + fgG * (1 - bgA);
            b = bgB * bgA + fgB * (1 - bgA);
            a = bgA + fgA * (1 - bgA);
            z = bgZ < fgZ ? bgZ : fgZ;
            break;
          }
          
          case 'plus': {
            r = Math.min(255, fgR + bgR);
            g = Math.min(255, fgG + bgG);
            b = Math.min(255, fgB + bgB);
            a = Math.min(1, fgA + bgA);
            z = Math.min(fgZ, bgZ);
            break;
          }
          
          default:
            r = fgR || bgR;
            g = fgG || bgG;
            b = fgB || bgB;
            a = fgA || bgA;
            z = fgZ < bgZ ? fgZ : bgZ;
        }
        
        outData[idx] = Math.min(255, Math.max(0, r));
        outData[idx + 1] = Math.min(255, Math.max(0, g));
        outData[idx + 2] = Math.min(255, Math.max(0, b));
        outData[idx + 3] = Math.min(255, Math.max(0, a * 255));
        
        // Output depth
        const normalizedZ = Math.max(0, Math.min(1, z)) * 255;
        outDepthData[idx] = normalizedZ;
        outDepthData[idx + 1] = normalizedZ;
        outDepthData[idx + 2] = normalizedZ;
        outDepthData[idx + 3] = 255;
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
    
    if (depthOutput) {
      depthOutput.value = {
        width,
        height,
        channels: 4,
        data: outDepthData,
        format: 'rgba'
      };
    }
  }
}
