/**
 * HologramNode - Holographic display effects
 * Creates sci-fi hologram visuals with scan lines and glitches
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class HologramNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'Hologram', 'Hologram');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Create sci-fi holographic display effects';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Base color
    this.setParameter('primaryColor', { r: 0, g: 200, b: 255 });
    this.setParameter('secondaryColor', { r: 0, g: 100, b: 200 });
    this.setParameter('colorMix', 0.3);
    
    // Scan lines
    this.setParameter('scanLines', true);
    this.setParameter('scanLineFrequency', 100);
    this.setParameter('scanLineIntensity', 0.3);
    this.setParameter('scanLineSpeed', 1.0);
    
    // Flickering
    this.setParameter('flicker', true);
    this.setParameter('flickerIntensity', 0.1);
    this.setParameter('flickerSpeed', 10.0);
    
    // Glitch effects
    this.setParameter('glitch', true);
    this.setParameter('glitchFrequency', 0.05);
    this.setParameter('glitchIntensity', 0.2);
    this.setParameter('glitchBlockSize', 20);
    
    // Chromatic aberration
    this.setParameter('chromaticAberration', 0.02);
    
    // Edge glow
    this.setParameter('edgeGlow', true);
    this.setParameter('edgeGlowIntensity', 0.5);
    this.setParameter('edgeThreshold', 0.1);
    
    // Noise
    this.setParameter('noise', true);
    this.setParameter('noiseIntensity', 0.1);
    
    // Transparency
    this.setParameter('transparency', 0.8);
    
    // Interlacing
    this.setParameter('interlace', true);
    this.setParameter('interlaceOffset', 1);
    
    // Brightness boost for highlights
    this.setParameter('brightnessBoost', 1.2);
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
    
    const primaryColor = this.getParameter('primaryColor');
    const secondaryColor = this.getParameter('secondaryColor');
    const colorMix = this.getParameter('colorMix');
    const scanLines = this.getParameter('scanLines');
    const scanLineFrequency = this.getParameter('scanLineFrequency');
    const scanLineIntensity = this.getParameter('scanLineIntensity');
    const scanLineSpeed = this.getParameter('scanLineSpeed');
    const flicker = this.getParameter('flicker');
    const flickerIntensity = this.getParameter('flickerIntensity');
    const flickerSpeed = this.getParameter('flickerSpeed');
    const glitch = this.getParameter('glitch');
    const glitchFrequency = this.getParameter('glitchFrequency');
    const glitchIntensity = this.getParameter('glitchIntensity');
    const glitchBlockSize = this.getParameter('glitchBlockSize');
    const chromaticAberration = this.getParameter('chromaticAberration');
    const edgeGlow = this.getParameter('edgeGlow');
    const edgeGlowIntensity = this.getParameter('edgeGlowIntensity');
    const edgeThreshold = this.getParameter('edgeThreshold');
    const noise = this.getParameter('noise');
    const noiseIntensity = this.getParameter('noiseIntensity');
    const transparency = this.getParameter('transparency');
    const interlace = this.getParameter('interlace');
    const interlaceOffset = this.getParameter('interlaceOffset');
    const brightnessBoost = this.getParameter('brightnessBoost');
    
    this.time += 0.016;
    
    const width = inputImage.width;
    const height = inputImage.height;
    
    const outData = new Uint8Array(width * height * 4);
    
    // Calculate global flicker
    const globalFlicker = flicker 
      ? 1 - flickerIntensity * (Math.random() * 0.5 + 0.5 * Math.sin(this.time * flickerSpeed))
      : 1;
    
    // Generate glitch blocks
    const glitchBlocks: Array<{ y: number; height: number; offsetX: number }> = [];
    if (glitch && Math.random() < glitchFrequency) {
      const blockCount = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < blockCount; i++) {
        glitchBlocks.push({
          y: Math.floor(Math.random() * height),
          height: Math.floor(Math.random() * glitchBlockSize) + 5,
          offsetX: Math.floor((Math.random() - 0.5) * width * glitchIntensity)
        });
      }
    }
    
    // Pre-calculate edge detection for glow
    const edgeMap = new Float32Array(width * height);
    if (edgeGlow) {
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          
          // Simple Sobel edge detection on luminance
          const getLum = (px: number, py: number): number => {
            const i = (py * width + px) * inputImage.channels;
            return (inputImage.data[i] * 0.299 + inputImage.data[i + 1] * 0.587 + inputImage.data[i + 2] * 0.114) / 255;
          };
          
          const gx = -getLum(x-1, y-1) - 2*getLum(x-1, y) - getLum(x-1, y+1) +
                     getLum(x+1, y-1) + 2*getLum(x+1, y) + getLum(x+1, y+1);
          const gy = -getLum(x-1, y-1) - 2*getLum(x, y-1) - getLum(x+1, y-1) +
                     getLum(x-1, y+1) + 2*getLum(x, y+1) + getLum(x+1, y+1);
          
          edgeMap[idx] = Math.sqrt(gx * gx + gy * gy);
        }
      }
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Apply glitch offset
        let sampleX = x;
        for (const block of glitchBlocks) {
          if (y >= block.y && y < block.y + block.height) {
            sampleX = (x + block.offsetX + width) % width;
            break;
          }
        }
        
        // Apply interlacing offset
        if (interlace && y % 2 === Math.floor(this.time * 30) % 2) {
          sampleX = (sampleX + interlaceOffset) % width;
        }
        
        // Sample with chromatic aberration
        let r, g, b;
        const aberrationPx = Math.floor(chromaticAberration * width);
        
        const sampleR = Math.max(0, Math.min(width - 1, sampleX - aberrationPx));
        const sampleB = Math.max(0, Math.min(width - 1, sampleX + aberrationPx));
        
        const idxR = (y * width + sampleR) * inputImage.channels;
        const idxG = (y * width + sampleX) * inputImage.channels;
        const idxB = (y * width + sampleB) * inputImage.channels;
        
        r = inputImage.data[idxR];
        g = inputImage.data[idxG + 1];
        b = inputImage.data[idxB + 2];
        
        // Convert to luminance
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        
        // Apply hologram coloring
        const holoR = primaryColor.r * (1 - colorMix) + secondaryColor.r * colorMix;
        const holoG = primaryColor.g * (1 - colorMix) + secondaryColor.g * colorMix;
        const holoB = primaryColor.b * (1 - colorMix) + secondaryColor.b * colorMix;
        
        r = lum * holoR * brightnessBoost;
        g = lum * holoG * brightnessBoost;
        b = lum * holoB * brightnessBoost;
        
        // Apply scan lines
        if (scanLines) {
          const scanY = y + this.time * scanLineSpeed * 100;
          const scanValue = (Math.sin(scanY / height * Math.PI * scanLineFrequency) + 1) * 0.5;
          const scanFactor = 1 - scanLineIntensity * scanValue;
          r *= scanFactor;
          g *= scanFactor;
          b *= scanFactor;
        }
        
        // Apply edge glow
        if (edgeGlow) {
          const edgeValue = edgeMap[y * width + x];
          if (edgeValue > edgeThreshold) {
            const glowAmount = Math.min(1, (edgeValue - edgeThreshold) / (1 - edgeThreshold)) * edgeGlowIntensity;
            r = Math.min(255, r + primaryColor.r * glowAmount);
            g = Math.min(255, g + primaryColor.g * glowAmount);
            b = Math.min(255, b + primaryColor.b * glowAmount);
          }
        }
        
        // Apply noise
        if (noise) {
          const n = (Math.random() - 0.5) * 255 * noiseIntensity;
          r = Math.max(0, Math.min(255, r + n));
          g = Math.max(0, Math.min(255, g + n));
          b = Math.max(0, Math.min(255, b + n));
        }
        
        // Apply global flicker
        r *= globalFlicker;
        g *= globalFlicker;
        b *= globalFlicker;
        
        // Calculate alpha based on luminance and transparency
        const alpha = lum * transparency * 255;
        
        outData[idx] = Math.min(255, Math.max(0, r));
        outData[idx + 1] = Math.min(255, Math.max(0, g));
        outData[idx + 2] = Math.min(255, Math.max(0, b));
        outData[idx + 3] = Math.min(255, Math.max(0, alpha));
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
