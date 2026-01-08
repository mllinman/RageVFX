/**
 * CausticsNode - Water caustics light patterns
 * Creates animated caustic lighting effects typical of underwater scenes
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class CausticsNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'Caustics', 'Caustics');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate water caustic light patterns';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('mask', 'Caustics Only', DataType.IMAGE);
    
    // Size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Caustic pattern
    this.setParameter('scale', 0.01);
    this.setParameter('complexity', 3);
    this.setParameter('sharpness', 2.0);
    this.setParameter('brightness', 1.0);
    this.setParameter('contrast', 1.5);
    
    // Color
    this.setParameter('color', { r: 180, g: 220, b: 255 });
    this.setParameter('colorVariation', 0.2);
    
    // Animation
    this.setParameter('speed', 1.0);
    this.setParameter('flowX', 0.0);
    this.setParameter('flowY', 0.0);
    
    // Blending
    this.setParameter('blendMode', 'add'); // add, screen, overlay
    this.setParameter('opacity', 0.7);
    
    // Wave layers
    this.setParameter('layers', 3);
    this.setParameter('layerScale', 1.5);
    this.setParameter('layerSpeedVariation', 0.3);
    
    // Refraction
    this.setParameter('refraction', true);
    this.setParameter('refractionStrength', 0.02);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    const maskOutput = this.outputs.get('mask');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    const scale = this.getParameter('scale');
    const complexity = this.getParameter('complexity');
    const sharpness = this.getParameter('sharpness');
    const brightness = this.getParameter('brightness');
    const contrast = this.getParameter('contrast');
    const color = this.getParameter('color');
    const colorVariation = this.getParameter('colorVariation');
    const speed = this.getParameter('speed');
    const flowX = this.getParameter('flowX');
    const flowY = this.getParameter('flowY');
    const blendMode = this.getParameter('blendMode');
    const opacity = this.getParameter('opacity');
    const layers = this.getParameter('layers');
    const layerScale = this.getParameter('layerScale');
    const layerSpeedVariation = this.getParameter('layerSpeedVariation');
    const refraction = this.getParameter('refraction');
    const refractionStrength = this.getParameter('refractionStrength');
    
    this.time += 0.016 * speed;
    
    const width = inputImage?.width || this.getParameter('width');
    const height = inputImage?.height || this.getParameter('height');
    
    const outData = new Uint8Array(width * height * 4);
    const maskData = new Uint8Array(width * height * 4);
    
    const flowOffsetX = this.time * flowX * 100;
    const flowOffsetY = this.time * flowY * 100;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Generate multi-layer caustic pattern
        let causticValue = 0;
        
        for (let l = 0; l < layers; l++) {
          const layerScaleFactor = Math.pow(layerScale, l);
          const layerSpeed = 1 + l * layerSpeedVariation;
          const layerTime = this.time * layerSpeed;
          
          // Voronoi-based caustic pattern
          const nx = (x + flowOffsetX) * scale * layerScaleFactor;
          const ny = (y + flowOffsetY) * scale * layerScaleFactor;
          
          let minDist1 = 10;
          let minDist2 = 10;
          
          // Check neighboring cells
          const cellX = Math.floor(nx);
          const cellY = Math.floor(ny);
          
          for (let cy = -1; cy <= 1; cy++) {
            for (let cx = -1; cx <= 1; cx++) {
              const seedX = cellX + cx;
              const seedY = cellY + cy;
              
              // Animated cell center
              const hash1 = this.hash(seedX, seedY);
              const hash2 = this.hash(seedX + 100, seedY + 100);
              
              const offsetX = 0.5 + 0.4 * Math.sin(layerTime + hash1 * 10);
              const offsetY = 0.5 + 0.4 * Math.cos(layerTime * 1.1 + hash2 * 10);
              
              const pointX = seedX + offsetX;
              const pointY = seedY + offsetY;
              
              const dist = Math.sqrt((nx - pointX) * (nx - pointX) + (ny - pointY) * (ny - pointY));
              
              if (dist < minDist1) {
                minDist2 = minDist1;
                minDist1 = dist;
              } else if (dist < minDist2) {
                minDist2 = dist;
              }
            }
          }
          
          // Caustic intensity based on cell edge proximity
          const edgeDist = minDist2 - minDist1;
          const layerCaustic = Math.pow(Math.max(0, 1 - edgeDist * complexity), sharpness);
          
          causticValue += layerCaustic / layers;
        }
        
        // Apply contrast
        causticValue = Math.pow(causticValue, 1 / contrast);
        causticValue = Math.min(1, causticValue * brightness);
        
        // Color with variation
        const colorVar = 1 + (Math.sin(x * 0.01 + y * 0.01 + this.time) * colorVariation);
        const causticR = color.r * causticValue * colorVar;
        const causticG = color.g * causticValue;
        const causticB = color.b * causticValue / colorVar;
        
        // Store mask
        const maskValue = causticValue * 255;
        maskData[idx] = maskValue;
        maskData[idx + 1] = maskValue;
        maskData[idx + 2] = maskValue;
        maskData[idx + 3] = 255;
        
        // Get base pixel (with optional refraction)
        let baseR = 0, baseG = 0, baseB = 0, baseA = 255;
        
        if (inputImage) {
          let sampleX = x;
          let sampleY = y;
          
          if (refraction) {
            // Use caustic gradient for refraction
            const dx = this.getCausticGradientX(x, y, width, height, scale, layers, layerScale, layerSpeedVariation);
            const dy = this.getCausticGradientY(x, y, width, height, scale, layers, layerScale, layerSpeedVariation);
            
            sampleX = Math.floor(x + dx * refractionStrength * width);
            sampleY = Math.floor(y + dy * refractionStrength * height);
            sampleX = Math.max(0, Math.min(width - 1, sampleX));
            sampleY = Math.max(0, Math.min(height - 1, sampleY));
          }
          
          const srcIdx = (sampleY * inputImage.width + sampleX) * inputImage.channels;
          baseR = inputImage.data[srcIdx];
          baseG = inputImage.data[srcIdx + 1];
          baseB = inputImage.data[srcIdx + 2];
          baseA = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
        }
        
        // Blend caustics with base
        let r, g, b;
        const blendAmount = opacity * causticValue;
        
        switch (blendMode) {
          case 'add':
            r = baseR + causticR * opacity;
            g = baseG + causticG * opacity;
            b = baseB + causticB * opacity;
            break;
          case 'screen':
            r = 255 - (255 - baseR) * (255 - causticR * opacity) / 255;
            g = 255 - (255 - baseG) * (255 - causticG * opacity) / 255;
            b = 255 - (255 - baseB) * (255 - causticB * opacity) / 255;
            break;
          case 'overlay':
            r = baseR < 128 
              ? 2 * baseR * causticR * blendAmount / 255
              : 255 - 2 * (255 - baseR) * (255 - causticR * blendAmount) / 255;
            g = baseG < 128
              ? 2 * baseG * causticG * blendAmount / 255
              : 255 - 2 * (255 - baseG) * (255 - causticG * blendAmount) / 255;
            b = baseB < 128
              ? 2 * baseB * causticB * blendAmount / 255
              : 255 - 2 * (255 - baseB) * (255 - causticB * blendAmount) / 255;
            break;
          default:
            r = baseR + causticR * opacity;
            g = baseG + causticG * opacity;
            b = baseB + causticB * opacity;
        }
        
        outData[idx] = Math.min(255, Math.max(0, r));
        outData[idx + 1] = Math.min(255, Math.max(0, g));
        outData[idx + 2] = Math.min(255, Math.max(0, b));
        outData[idx + 3] = baseA;
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
    
    if (maskOutput) {
      maskOutput.value = {
        width,
        height,
        channels: 4,
        data: maskData,
        format: 'rgba'
      };
    }
  }

  private hash(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  private getCausticGradientX(
    x: number, y: number, 
    width: number, height: number, 
    scale: number, layers: number, 
    layerScale: number, layerSpeedVariation: number
  ): number {
    const delta = 1;
    const left = this.getCausticValue(x - delta, y, scale, layers, layerScale, layerSpeedVariation);
    const right = this.getCausticValue(x + delta, y, scale, layers, layerScale, layerSpeedVariation);
    return (right - left) / (delta * 2);
  }

  private getCausticGradientY(
    x: number, y: number, 
    width: number, height: number, 
    scale: number, layers: number, 
    layerScale: number, layerSpeedVariation: number
  ): number {
    const delta = 1;
    const top = this.getCausticValue(x, y - delta, scale, layers, layerScale, layerSpeedVariation);
    const bottom = this.getCausticValue(x, y + delta, scale, layers, layerScale, layerSpeedVariation);
    return (bottom - top) / (delta * 2);
  }

  private getCausticValue(
    x: number, y: number, 
    scale: number, layers: number, 
    layerScale: number, layerSpeedVariation: number
  ): number {
    let value = 0;
    
    for (let l = 0; l < layers; l++) {
      const layerScaleFactor = Math.pow(layerScale, l);
      const layerSpeed = 1 + l * layerSpeedVariation;
      const layerTime = this.time * layerSpeed;
      
      const nx = x * scale * layerScaleFactor;
      const ny = y * scale * layerScaleFactor;
      
      let minDist1 = 10;
      let minDist2 = 10;
      
      const cellX = Math.floor(nx);
      const cellY = Math.floor(ny);
      
      for (let cy = -1; cy <= 1; cy++) {
        for (let cx = -1; cx <= 1; cx++) {
          const seedX = cellX + cx;
          const seedY = cellY + cy;
          
          const hash1 = this.hash(seedX, seedY);
          const hash2 = this.hash(seedX + 100, seedY + 100);
          
          const offsetX = 0.5 + 0.4 * Math.sin(layerTime + hash1 * 10);
          const offsetY = 0.5 + 0.4 * Math.cos(layerTime * 1.1 + hash2 * 10);
          
          const pointX = seedX + offsetX;
          const pointY = seedY + offsetY;
          
          const dist = Math.sqrt((nx - pointX) * (nx - pointX) + (ny - pointY) * (ny - pointY));
          
          if (dist < minDist1) {
            minDist2 = minDist1;
            minDist1 = dist;
          } else if (dist < minDist2) {
            minDist2 = dist;
          }
        }
      }
      
      const edgeDist = minDist2 - minDist1;
      value += Math.pow(Math.max(0, 1 - edgeDist * 3), 2) / layers;
    }
    
    return value;
  }
}
