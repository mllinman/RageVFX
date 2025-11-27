/**
 * AuroraNode - Northern lights / Aurora Borealis effects
 * Creates beautiful animated aurora borealis/australis patterns
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class AuroraNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Aurora', 'Aurora');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate northern lights / aurora borealis effects';
    
    this.addInput('image', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Position
    this.setParameter('horizonY', 0.7);
    this.setParameter('verticalSpread', 0.4);
    
    // Aurora structure
    this.setParameter('curtainCount', 5);
    this.setParameter('curtainWidth', 0.1);
    this.setParameter('waveFrequency', 3.0);
    this.setParameter('waveAmplitude', 0.15);
    this.setParameter('verticalWaves', true);
    
    // Colors
    this.setParameter('primaryColor', { r: 0, g: 255, b: 100 });
    this.setParameter('secondaryColor', { r: 100, g: 200, b: 255 });
    this.setParameter('accentColor', { r: 255, g: 50, b: 200 });
    this.setParameter('colorMixSpeed', 0.5);
    
    // Animation
    this.setParameter('speed', 1.0);
    this.setParameter('flowSpeed', 0.3);
    this.setParameter('flickerSpeed', 5.0);
    this.setParameter('flickerIntensity', 0.2);
    
    // Intensity
    this.setParameter('brightness', 1.0);
    this.setParameter('opacity', 0.8);
    this.setParameter('falloff', 2.0);
    
    // Stars
    this.setParameter('stars', true);
    this.setParameter('starDensity', 0.002);
    this.setParameter('starTwinkle', true);
    
    this.setParameter('seed', 42);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 42;
    this.permutation = [];
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = Math.floor(this.seededRandom(seed + i) * 256);
    }
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    const horizonY = this.getParameter('horizonY');
    const verticalSpread = this.getParameter('verticalSpread');
    const curtainCount = this.getParameter('curtainCount');
    const curtainWidth = this.getParameter('curtainWidth');
    const waveFrequency = this.getParameter('waveFrequency');
    const waveAmplitude = this.getParameter('waveAmplitude');
    const verticalWaves = this.getParameter('verticalWaves');
    const primaryColor = this.getParameter('primaryColor');
    const secondaryColor = this.getParameter('secondaryColor');
    const accentColor = this.getParameter('accentColor');
    const colorMixSpeed = this.getParameter('colorMixSpeed');
    const speed = this.getParameter('speed');
    const flowSpeed = this.getParameter('flowSpeed');
    const flickerSpeed = this.getParameter('flickerSpeed');
    const flickerIntensity = this.getParameter('flickerIntensity');
    const brightness = this.getParameter('brightness');
    const opacity = this.getParameter('opacity');
    const falloff = this.getParameter('falloff');
    const stars = this.getParameter('stars');
    const starDensity = this.getParameter('starDensity');
    const starTwinkle = this.getParameter('starTwinkle');
    
    this.time += 0.016 * speed;
    
    const width = inputImage?.width || this.getParameter('width');
    const height = inputImage?.height || this.getParameter('height');
    
    const outData = new Uint8Array(width * height * 4);
    
    // Copy background or initialize to dark sky
    if (inputImage) {
      for (let i = 0; i < width * height; i++) {
        const srcIdx = i * inputImage.channels;
        const outIdx = i * 4;
        outData[outIdx] = inputImage.data[srcIdx];
        outData[outIdx + 1] = inputImage.data[srcIdx + 1];
        outData[outIdx + 2] = inputImage.data[srcIdx + 2];
        outData[outIdx + 3] = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
      }
    } else {
      // Dark sky gradient
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const skyGradient = y / height;
          outData[idx] = Math.floor(5 + skyGradient * 15);
          outData[idx + 1] = Math.floor(5 + skyGradient * 20);
          outData[idx + 2] = Math.floor(20 + skyGradient * 30);
          outData[idx + 3] = 255;
        }
      }
    }
    
    // Add stars
    if (stars) {
      for (let y = 0; y < height * horizonY; y++) {
        for (let x = 0; x < width; x++) {
          const starHash = this.seededRandom(x * 7919 + y * 6967 + this.getParameter('seed'));
          if (starHash < starDensity) {
            const idx = (y * width + x) * 4;
            let starBrightness = (0.5 + starHash / starDensity * 0.5);
            
            if (starTwinkle) {
              const twinkle = Math.sin(this.time * (3 + starHash * 5) + starHash * 100);
              starBrightness *= 0.7 + 0.3 * twinkle;
            }
            
            outData[idx] = Math.min(255, outData[idx] + 255 * starBrightness);
            outData[idx + 1] = Math.min(255, outData[idx + 1] + 255 * starBrightness);
            outData[idx + 2] = Math.min(255, outData[idx + 2] + 255 * starBrightness);
          }
        }
      }
    }
    
    // Aurora curtains
    for (let y = 0; y < height; y++) {
      const normalizedY = y / height;
      
      // Only render aurora above horizon
      if (normalizedY > horizonY) continue;
      
      // Vertical position within aurora band
      const auroraY = 1 - (normalizedY / horizonY);
      const auroraIntensity = Math.pow(auroraY, falloff) * (auroraY < 0.5 ? auroraY * 2 : 1);
      
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const normalizedX = x / width;
        
        let totalIntensity = 0;
        let colorR = 0, colorG = 0, colorB = 0;
        
        for (let c = 0; c < curtainCount; c++) {
          // Curtain base position with slow horizontal drift
          const curtainBase = (c + 0.5) / curtainCount;
          const curtainDrift = Math.sin(this.time * flowSpeed + c * 2) * 0.1;
          const curtainX = curtainBase + curtainDrift;
          
          // Vertical wave distortion
          let waveOffset = 0;
          if (verticalWaves) {
            waveOffset = Math.sin(auroraY * waveFrequency * Math.PI * 2 + this.time + c) * waveAmplitude;
            waveOffset += Math.sin(auroraY * waveFrequency * 2 * Math.PI * 2 + this.time * 1.5 + c * 0.5) * waveAmplitude * 0.5;
          }
          
          // Horizontal wave
          const horizontalWave = Math.sin(normalizedX * 5 + this.time * 0.5 + c) * 0.02;
          
          // Distance from curtain center
          const distFromCurtain = Math.abs(normalizedX - (curtainX + waveOffset + horizontalWave));
          
          // Curtain intensity
          if (distFromCurtain < curtainWidth) {
            const curtainIntensity = Math.pow(1 - distFromCurtain / curtainWidth, 2);
            
            // Flickering
            const flicker = 1 - flickerIntensity + flickerIntensity * 
              (Math.sin(this.time * flickerSpeed + c * 10 + auroraY * 20) + 1) * 0.5;
            
            const intensity = curtainIntensity * auroraIntensity * flicker;
            
            // Color based on height and time
            const colorPhase = (auroraY + this.time * colorMixSpeed + c * 0.2) % 1;
            let r, g, b;
            
            if (colorPhase < 0.33) {
              const t = colorPhase * 3;
              r = primaryColor.r * (1 - t) + secondaryColor.r * t;
              g = primaryColor.g * (1 - t) + secondaryColor.g * t;
              b = primaryColor.b * (1 - t) + secondaryColor.b * t;
            } else if (colorPhase < 0.66) {
              const t = (colorPhase - 0.33) * 3;
              r = secondaryColor.r * (1 - t) + accentColor.r * t;
              g = secondaryColor.g * (1 - t) + accentColor.g * t;
              b = secondaryColor.b * (1 - t) + accentColor.b * t;
            } else {
              const t = (colorPhase - 0.66) * 3;
              r = accentColor.r * (1 - t) + primaryColor.r * t;
              g = accentColor.g * (1 - t) + primaryColor.g * t;
              b = accentColor.b * (1 - t) + primaryColor.b * t;
            }
            
            colorR += r * intensity;
            colorG += g * intensity;
            colorB += b * intensity;
            totalIntensity += intensity;
          }
        }
        
        // Add to output with opacity
        if (totalIntensity > 0) {
          const blendFactor = Math.min(1, totalIntensity) * opacity * brightness;
          
          outData[idx] = Math.min(255, outData[idx] + colorR * blendFactor);
          outData[idx + 1] = Math.min(255, outData[idx + 1] + colorG * blendFactor);
          outData[idx + 2] = Math.min(255, outData[idx + 2] + colorB * blendFactor);
        }
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
}
