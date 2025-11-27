/**
 * AOVManagerNode - Arbitrary Output Variable manager for render passes
 * Combine and manipulate multiple AOV/render passes for compositing
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

type BlendMode = 'add' | 'multiply' | 'screen' | 'overlay' | 'normal';

interface AOVLayer {
  name: string;
  enabled: boolean;
  opacity: number;
  blendMode: BlendMode;
}

export class AOVManagerNode extends Node {
  constructor(id: string) {
    super(id, 'AOVManager', 'AOV Manager');
    this.metadata.category = 'Composite';
    this.metadata.description = 'Manage and combine Arbitrary Output Variables (render passes)';
    
    // Standard AOV inputs
    this.addInput('beauty', 'Beauty', DataType.IMAGE);
    this.addInput('diffuse', 'Diffuse', DataType.IMAGE);
    this.addInput('specular', 'Specular', DataType.IMAGE);
    this.addInput('reflection', 'Reflection', DataType.IMAGE);
    this.addInput('refraction', 'Refraction', DataType.IMAGE);
    this.addInput('emission', 'Emission', DataType.IMAGE);
    this.addInput('sss', 'SSS', DataType.IMAGE);
    this.addInput('ao', 'Ambient Occlusion', DataType.IMAGE);
    this.addInput('shadow', 'Shadow', DataType.IMAGE);
    this.addInput('normal', 'Normal', DataType.IMAGE);
    this.addInput('depth', 'Depth', DataType.IMAGE);
    this.addInput('motion', 'Motion Vectors', DataType.IMAGE);
    this.addInput('crypto', 'Crypto/ID', DataType.IMAGE);
    
    // Outputs
    this.addOutput('combined', 'Combined', DataType.IMAGE);
    this.addOutput('selected', 'Selected AOV', DataType.IMAGE);
    
    // Layer configuration
    this.setParameter('layers', [
      { name: 'diffuse', enabled: true, opacity: 1.0, blendMode: 'add' as BlendMode },
      { name: 'specular', enabled: true, opacity: 1.0, blendMode: 'add' as BlendMode },
      { name: 'reflection', enabled: true, opacity: 1.0, blendMode: 'add' as BlendMode },
      { name: 'refraction', enabled: true, opacity: 1.0, blendMode: 'add' as BlendMode },
      { name: 'emission', enabled: true, opacity: 1.0, blendMode: 'add' as BlendMode },
      { name: 'sss', enabled: true, opacity: 1.0, blendMode: 'add' as BlendMode }
    ]);
    
    // Global adjustments
    this.setParameter('exposure', 0.0);
    this.setParameter('gamma', 1.0);
    this.setParameter('saturation', 1.0);
    
    // AO settings
    this.setParameter('aoEnabled', true);
    this.setParameter('aoIntensity', 1.0);
    this.setParameter('aoBlendMode', 'multiply');
    
    // Shadow settings
    this.setParameter('shadowEnabled', false);
    this.setParameter('shadowIntensity', 1.0);
    this.setParameter('shadowColor', { r: 0, g: 0, b: 0 });
    
    // Output selection
    this.setParameter('selectedAOV', 'beauty');
    this.setParameter('useBeautyAsBase', false);
  }

  async process(): Promise<void> {
    const combinedOutput = this.outputs.get('combined');
    const selectedOutput = this.outputs.get('selected');
    
    if (!combinedOutput && !selectedOutput) return;

    const beauty = this.inputs.get('beauty')?.value as ImageData | undefined;
    const diffuse = this.inputs.get('diffuse')?.value as ImageData | undefined;
    const specular = this.inputs.get('specular')?.value as ImageData | undefined;
    const reflection = this.inputs.get('reflection')?.value as ImageData | undefined;
    const refraction = this.inputs.get('refraction')?.value as ImageData | undefined;
    const emission = this.inputs.get('emission')?.value as ImageData | undefined;
    const sss = this.inputs.get('sss')?.value as ImageData | undefined;
    const ao = this.inputs.get('ao')?.value as ImageData | undefined;
    const shadow = this.inputs.get('shadow')?.value as ImageData | undefined;
    const normal = this.inputs.get('normal')?.value as ImageData | undefined;
    const depth = this.inputs.get('depth')?.value as ImageData | undefined;
    const motion = this.inputs.get('motion')?.value as ImageData | undefined;
    const crypto = this.inputs.get('crypto')?.value as ImageData | undefined;
    
    // Get reference dimensions
    const ref = beauty || diffuse || specular || normal || depth;
    if (!ref) return;
    
    const width = ref.width;
    const height = ref.height;
    
    const layers = this.getParameter('layers') as AOVLayer[];
    const exposure = this.getParameter('exposure');
    const gamma = this.getParameter('gamma');
    const saturation = this.getParameter('saturation');
    const aoEnabled = this.getParameter('aoEnabled');
    const aoIntensity = this.getParameter('aoIntensity');
    const aoBlendMode = this.getParameter('aoBlendMode');
    const shadowEnabled = this.getParameter('shadowEnabled');
    const shadowIntensity = this.getParameter('shadowIntensity');
    const shadowColor = this.getParameter('shadowColor');
    const selectedAOV = this.getParameter('selectedAOV');
    const useBeautyAsBase = this.getParameter('useBeautyAsBase');
    
    // Map of AOV names to images
    const aovMap: Record<string, ImageData | undefined> = {
      beauty, diffuse, specular, reflection, refraction, emission, sss, ao, shadow, normal, depth, motion, crypto
    };
    
    // Combined output
    if (combinedOutput) {
      const combinedData = new Uint8Array(width * height * 4);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Start with black or beauty
          let r = 0, g = 0, b = 0, a = 255;
          
          if (useBeautyAsBase && beauty) {
            const srcIdx = (y * beauty.width + x) * beauty.channels;
            r = beauty.data[srcIdx];
            g = beauty.data[srcIdx + 1];
            b = beauty.data[srcIdx + 2];
          } else {
            // Combine AOV layers
            for (const layer of layers) {
              if (!layer.enabled) continue;
              
              const aov = aovMap[layer.name];
              if (!aov) continue;
              
              const srcIdx = (y * aov.width + x) * aov.channels;
              const lr = aov.data[srcIdx] * layer.opacity;
              const lg = aov.data[srcIdx + 1] * layer.opacity;
              const lb = aov.data[srcIdx + 2] * layer.opacity;
              
              // Apply blend mode
              switch (layer.blendMode) {
                case 'add':
                  r += lr;
                  g += lg;
                  b += lb;
                  break;
                case 'multiply':
                  r = r * lr / 255;
                  g = g * lg / 255;
                  b = b * lb / 255;
                  break;
                case 'screen':
                  r = 255 - (255 - r) * (255 - lr) / 255;
                  g = 255 - (255 - g) * (255 - lg) / 255;
                  b = 255 - (255 - b) * (255 - lb) / 255;
                  break;
                case 'overlay':
                  r = r < 128 ? 2 * r * lr / 255 : 255 - 2 * (255 - r) * (255 - lr) / 255;
                  g = g < 128 ? 2 * g * lg / 255 : 255 - 2 * (255 - g) * (255 - lg) / 255;
                  b = b < 128 ? 2 * b * lb / 255 : 255 - 2 * (255 - b) * (255 - lb) / 255;
                  break;
                case 'normal':
                  r = lr;
                  g = lg;
                  b = lb;
                  break;
              }
            }
          }
          
          // Apply AO
          if (aoEnabled && ao) {
            const aoIdx = (y * ao.width + x) * ao.channels;
            const aoValue = ao.data[aoIdx] / 255;
            const aoFactor = 1 - (1 - aoValue) * aoIntensity;
            
            if (aoBlendMode === 'multiply') {
              r *= aoFactor;
              g *= aoFactor;
              b *= aoFactor;
            }
          }
          
          // Apply shadow
          if (shadowEnabled && shadow) {
            const shadowIdx = (y * shadow.width + x) * shadow.channels;
            const shadowValue = shadow.data[shadowIdx] / 255;
            const shadowFactor = shadowValue * shadowIntensity;
            
            r = r * (1 - shadowFactor) + shadowColor.r * shadowFactor;
            g = g * (1 - shadowFactor) + shadowColor.g * shadowFactor;
            b = b * (1 - shadowFactor) + shadowColor.b * shadowFactor;
          }
          
          // Apply exposure
          if (exposure !== 0) {
            const expFactor = Math.pow(2, exposure);
            r *= expFactor;
            g *= expFactor;
            b *= expFactor;
          }
          
          // Apply gamma
          if (gamma !== 1.0) {
            r = Math.pow(r / 255, 1 / gamma) * 255;
            g = Math.pow(g / 255, 1 / gamma) * 255;
            b = Math.pow(b / 255, 1 / gamma) * 255;
          }
          
          // Apply saturation
          if (saturation !== 1.0) {
            const lum = r * 0.299 + g * 0.587 + b * 0.114;
            r = lum + (r - lum) * saturation;
            g = lum + (g - lum) * saturation;
            b = lum + (b - lum) * saturation;
          }
          
          combinedData[idx] = Math.min(255, Math.max(0, r));
          combinedData[idx + 1] = Math.min(255, Math.max(0, g));
          combinedData[idx + 2] = Math.min(255, Math.max(0, b));
          combinedData[idx + 3] = a;
        }
      }
      
      combinedOutput.value = {
        width,
        height,
        channels: 4,
        data: combinedData,
        format: 'rgba'
      };
    }
    
    // Selected AOV output
    if (selectedOutput) {
      const selectedAOVImage = aovMap[selectedAOV];
      
      if (selectedAOVImage) {
        const selectedData = new Uint8Array(width * height * 4);
        
        for (let i = 0; i < width * height; i++) {
          const srcIdx = i * selectedAOVImage.channels;
          const outIdx = i * 4;
          
          selectedData[outIdx] = selectedAOVImage.data[srcIdx];
          selectedData[outIdx + 1] = selectedAOVImage.data[srcIdx + 1];
          selectedData[outIdx + 2] = selectedAOVImage.data[srcIdx + 2];
          selectedData[outIdx + 3] = selectedAOVImage.channels === 4 
            ? selectedAOVImage.data[srcIdx + 3] : 255;
        }
        
        selectedOutput.value = {
          width,
          height,
          channels: 4,
          data: selectedData,
          format: 'rgba'
        };
      } else {
        selectedOutput.value = null;
      }
    }
  }
}
