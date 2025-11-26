/**
 * VolumetricLightNode - God rays / light shafts effect
 * Version 2.0 - Volumetric Effects
 */

import { Node, DataType } from '../core/Node';

export class VolumetricLightNode extends Node {
  constructor(id: string) {
    super(id, 'VolumetricLight', 'Volumetric Light');
    this.metadata.category = 'Volumetric';
    this.metadata.description = 'God rays and light shaft effects';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addInput('occlusionMask', 'Occlusion Mask', DataType.IMAGE);
    this.addInput('depth', 'Depth', DataType.IMAGE);
    
    // Outputs
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('rays', 'Rays Only', DataType.IMAGE);
    
    // Light source
    this.setParameter('lightPosition', { x: 0.5, y: 0.3 }); // Screen space position
    this.setParameter('lightColor', { r: 255, g: 240, b: 200 });
    this.setParameter('lightIntensity', 1.0);
    
    // Ray properties
    this.setParameter('samples', 100);
    this.setParameter('density', 1.0);
    this.setParameter('weight', 0.01);
    this.setParameter('decay', 0.96);
    this.setParameter('exposure', 0.2);
    
    // Quality settings
    this.setParameter('quality', 'high'); // low, medium, high
    this.setParameter('blur', false);
    this.setParameter('blurRadius', 2.0);
    
    // Blend mode
    this.setParameter('blendMode', 'add'); // add, screen, overlay
    this.setParameter('blendOpacity', 1.0);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const occlusionInput = this.inputs.get('occlusionMask');
    
    const lightPos = this.getParameter('lightPosition');
    const lightColor = this.getParameter('lightColor');
    const lightIntensity = this.getParameter('lightIntensity');
    const samples = this.getParameter('samples');
    const density = this.getParameter('density');
    const weight = this.getParameter('weight');
    const decay = this.getParameter('decay');
    const exposure = this.getParameter('exposure');
    const blendMode = this.getParameter('blendMode');
    const blendOpacity = this.getParameter('blendOpacity');
    
    // Default dimensions
    let width = 1920;
    let height = 1080;
    
    if (imageInput?.value) {
      width = imageInput.value.width || width;
      height = imageInput.value.height || height;
    }

    const outputData = new Uint8Array(width * height * 4);
    const raysData = new Uint8Array(width * height * 4);
    
    const srcData = imageInput?.value?.data;
    const occlusionData = occlusionInput?.value?.data;
    
    // Light position in pixels
    const lightX = lightPos.x * width;
    const lightY = lightPos.y * height;
    
    // Process each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Direction from light to current pixel
        const dx = x - lightX;
        const dy = y - lightY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 0;
        
        // Step size for ray marching
        const stepX = -dirX * density * dist / samples;
        const stepY = -dirY * density * dist / samples;
        
        // Start at current pixel
        let sampleX = x;
        let sampleY = y;
        
        // Accumulated light
        let illuminationR = 0;
        let illuminationG = 0;
        let illuminationB = 0;
        let illuminationDecay = 1.0;
        
        // Ray march towards light source
        for (let s = 0; s < samples; s++) {
          sampleX += stepX;
          sampleY += stepY;
          
          // Sample coordinates
          const sx = Math.floor(Math.max(0, Math.min(width - 1, sampleX)));
          const sy = Math.floor(Math.max(0, Math.min(height - 1, sampleY)));
          const si = (sy * width + sx) * 4;
          
          // Sample occlusion (bright areas let light through)
          let occlusion = 1.0;
          if (occlusionData) {
            occlusion = occlusionData[si] / 255.0;
          } else if (srcData) {
            // Use luminance from source as occlusion
            const lumR = srcData[si] || 0;
            const lumG = srcData[si + 1] || 0;
            const lumB = srcData[si + 2] || 0;
            occlusion = (0.2126 * lumR + 0.7152 * lumG + 0.0722 * lumB) / 255.0;
          }
          
          // Accumulate with decay
          illuminationR += occlusion * illuminationDecay * weight;
          illuminationG += occlusion * illuminationDecay * weight;
          illuminationB += occlusion * illuminationDecay * weight;
          
          illuminationDecay *= decay;
        }
        
        // Apply exposure and light color
        const rayR = Math.min(255, illuminationR * exposure * lightColor.r * lightIntensity);
        const rayG = Math.min(255, illuminationG * exposure * lightColor.g * lightIntensity);
        const rayB = Math.min(255, illuminationB * exposure * lightColor.b * lightIntensity);
        
        // Store rays-only output
        raysData[i] = Math.round(rayR);
        raysData[i + 1] = Math.round(rayG);
        raysData[i + 2] = Math.round(rayB);
        raysData[i + 3] = 255;
        
        // Get source color
        let srcR = 0, srcG = 0, srcB = 0, srcA = 255;
        if (srcData) {
          srcR = srcData[i];
          srcG = srcData[i + 1];
          srcB = srcData[i + 2];
          srcA = srcData[i + 3];
        }
        
        // Blend with source
        let outR = srcR, outG = srcG, outB = srcB;
        
        switch (blendMode) {
          case 'add':
            outR = Math.min(255, srcR + rayR * blendOpacity);
            outG = Math.min(255, srcG + rayG * blendOpacity);
            outB = Math.min(255, srcB + rayB * blendOpacity);
            break;
          case 'screen':
            outR = 255 - (255 - srcR) * (255 - rayR * blendOpacity) / 255;
            outG = 255 - (255 - srcG) * (255 - rayG * blendOpacity) / 255;
            outB = 255 - (255 - srcB) * (255 - rayB * blendOpacity) / 255;
            break;
          case 'overlay':
            outR = srcR < 128 
              ? (2 * srcR * rayR * blendOpacity / 255)
              : (255 - 2 * (255 - srcR) * (255 - rayR * blendOpacity) / 255);
            outG = srcG < 128
              ? (2 * srcG * rayG * blendOpacity / 255)
              : (255 - 2 * (255 - srcG) * (255 - rayG * blendOpacity) / 255);
            outB = srcB < 128
              ? (2 * srcB * rayB * blendOpacity / 255)
              : (255 - 2 * (255 - srcB) * (255 - rayB * blendOpacity) / 255);
            break;
        }
        
        outputData[i] = Math.round(outR);
        outputData[i + 1] = Math.round(outG);
        outputData[i + 2] = Math.round(outB);
        outputData[i + 3] = srcA;
      }
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width,
        height,
        channels: 4,
        data: outputData,
        format: 'rgba'
      };
    }
    
    const raysOutput = this.outputs.get('rays');
    if (raysOutput) {
      raysOutput.value = {
        width,
        height,
        channels: 4,
        data: raysData,
        format: 'rgba'
      };
    }
  }
}
