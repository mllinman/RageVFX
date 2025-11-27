/**
 * VolumetricFogNode - Volumetric fog rendering for atmospheric effects
 * Version 2.0 - Volumetric Effects
 */

import { Node, DataType } from '../core/Node';

export class VolumetricFogNode extends Node {
  constructor(id: string) {
    super(id, 'VolumetricFog', 'Volumetric Fog');
    this.metadata.category = 'Volumetric';
    this.metadata.description = 'Volumetric fog rendering for atmospheric effects';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addInput('depth', 'Depth', DataType.IMAGE);
    this.addInput('scene', 'Scene', DataType.ANY);
    
    // Outputs
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('fogMask', 'Fog Mask', DataType.IMAGE);
    
    // Fog properties
    this.setParameter('density', 0.02);
    this.setParameter('height', 10.0);
    this.setParameter('falloff', 0.5);
    this.setParameter('color', { r: 200, g: 200, b: 220 });
    this.setParameter('scattering', 0.5);
    this.setParameter('absorption', 0.1);
    
    // Volume properties
    this.setParameter('near', 1.0);
    this.setParameter('far', 1000.0);
    this.setParameter('steps', 64);
    this.setParameter('jitter', true);
    
    // Animation
    this.setParameter('animated', false);
    this.setParameter('windSpeed', { x: 1.0, y: 0.0, z: 0.5 });
    this.setParameter('turbulence', 0.5);
    this.setParameter('noiseScale', 10.0);
    
    // Lighting interaction
    this.setParameter('receiveShadows', true);
    this.setParameter('lightScattering', true);
    this.setParameter('anisotropy', 0.2); // -1 to 1, Henyey-Greenstein phase function
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const depthInput = this.inputs.get('depth');
    
    const density = this.getParameter('density');
    // height parameter reserved for future height-based fog effects
    this.getParameter('height');
    const falloff = this.getParameter('falloff');
    const fogColor = this.getParameter('color');
    const near = this.getParameter('near');
    const far = this.getParameter('far');
    const steps = this.getParameter('steps');
    
    // Default dimensions
    let width = 1920;
    let height2 = 1080;
    
    if (imageInput?.value) {
      width = imageInput.value.width || width;
      height2 = imageInput.value.height || height2;
    }

    // Create output buffers
    const outputData = new Uint8Array(width * height2 * 4);
    const fogMaskData = new Uint8Array(width * height2 * 4);
    
    // Get source image data
    const srcData = imageInput?.value?.data;
    const depthData = depthInput?.value?.data;
    
    // Ray marching through volumetric fog
    for (let y = 0; y < height2; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Get depth at this pixel
        let depth = 1.0;
        if (depthData) {
          if (depthData instanceof Float32Array) {
            depth = depthData[y * width + x] || 1.0;
          } else {
            depth = depthData[i] / 255.0;
          }
        }
        
        // Calculate ray distance
        const rayDist = near + depth * (far - near);
        
        // Accumulate fog along ray
        let fogAccum = 0;
        const stepSize = rayDist / steps;
        
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          const sampleHeight = 1 - t; // Simplified height along ray
          
          // Exponential height fog
          const localDensity = density * Math.exp(-sampleHeight * falloff);
          fogAccum += localDensity * stepSize;
        }
        
        // Apply Beer-Lambert law for absorption
        const transmission = Math.exp(-fogAccum);
        const fogAmount = Math.min(1, 1 - transmission);
        
        // Get source color
        let srcR = 0, srcG = 0, srcB = 0, srcA = 255;
        if (srcData) {
          srcR = srcData[i];
          srcG = srcData[i + 1];
          srcB = srcData[i + 2];
          srcA = srcData[i + 3];
        }
        
        // Blend with fog color
        outputData[i] = Math.round(srcR * transmission + fogColor.r * fogAmount);
        outputData[i + 1] = Math.round(srcG * transmission + fogColor.g * fogAmount);
        outputData[i + 2] = Math.round(srcB * transmission + fogColor.b * fogAmount);
        outputData[i + 3] = srcA;
        
        // Write fog mask
        const fogMaskValue = Math.round(fogAmount * 255);
        fogMaskData[i] = fogMaskValue;
        fogMaskData[i + 1] = fogMaskValue;
        fogMaskData[i + 2] = fogMaskValue;
        fogMaskData[i + 3] = 255;
      }
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width,
        height: height2,
        channels: 4,
        data: outputData,
        format: 'rgba'
      };
    }
    
    const fogMaskOutput = this.outputs.get('fogMask');
    if (fogMaskOutput) {
      fogMaskOutput.value = {
        width,
        height: height2,
        channels: 4,
        data: fogMaskData,
        format: 'rgba'
      };
    }
  }
}
