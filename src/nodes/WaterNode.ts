/**
 * WaterNode - Generates procedural water surface/wave effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class WaterNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'Water', 'Water');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate procedural water surface and wave effects';
    
    this.addInput('reflection', 'Reflection', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('normalMap', 'Normal Map', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('waveScale', 0.02);
    this.setParameter('waveSpeed', 1.0);
    this.setParameter('waveAmplitude', 0.5);
    this.setParameter('waveFrequency', 2.0);
    this.setParameter('rippleCount', 3);
    this.setParameter('foam', 0.2);
    this.setParameter('colorDeep', { r: 10, g: 50, b: 100 });
    this.setParameter('colorShallow', { r: 50, g: 150, b: 200 });
    this.setParameter('reflectivity', 0.5);
    this.setParameter('transparency', 0.7);
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const waveScale = this.getParameter('waveScale');
    const waveSpeed = this.getParameter('waveSpeed');
    const waveAmplitude = this.getParameter('waveAmplitude');
    const waveFrequency = this.getParameter('waveFrequency');
    const rippleCount = this.getParameter('rippleCount');
    const foam = this.getParameter('foam');
    const colorDeep = this.getParameter('colorDeep');
    const colorShallow = this.getParameter('colorShallow');
    const reflectivity = this.getParameter('reflectivity');
    
    this.time += 0.016 * waveSpeed;
    
    const data = new Uint8Array(width * height * 4);
    const normalData = new Uint8Array(width * height * 4);
    
    const reflectionInput = this.inputs.get('reflection');
    const reflection = reflectionInput?.value as ImageData | undefined;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate wave height using multiple sine waves
        let waveHeight = 0;
        for (let i = 0; i < rippleCount; i++) {
          const phase = i * Math.PI / rippleCount;
          const freq = waveFrequency * (1 + i * 0.5);
          waveHeight += Math.sin(x * waveScale * freq + this.time * 2 + phase) *
                        Math.cos(y * waveScale * freq * 0.7 + this.time * 1.5 + phase) *
                        waveAmplitude / (i + 1);
        }
        
        // Normalize wave height
        waveHeight = (waveHeight + 1) * 0.5;
        
        // Calculate normal from wave derivatives
        const dx = this.getWaveDerivative(x, y, waveScale, waveFrequency, rippleCount, 'x');
        const dy = this.getWaveDerivative(x, y, waveScale, waveFrequency, rippleCount, 'y');
        
        // Store normal map
        normalData[idx] = Math.floor((dx * 0.5 + 0.5) * 255);
        normalData[idx + 1] = Math.floor((dy * 0.5 + 0.5) * 255);
        normalData[idx + 2] = 255; // Z always up
        normalData[idx + 3] = 255;
        
        // Calculate foam based on wave peaks
        const foamAmount = Math.max(0, (waveHeight - 0.7) * foam * 10);
        
        // Depth-based color mixing
        const depthFactor = y / height;
        
        // Base water color
        let r = colorDeep.r + (colorShallow.r - colorDeep.r) * (1 - depthFactor);
        let g = colorDeep.g + (colorShallow.g - colorDeep.g) * (1 - depthFactor);
        let b = colorDeep.b + (colorShallow.b - colorDeep.b) * (1 - depthFactor);
        
        // Apply wave brightness variation
        r = r * (0.8 + waveHeight * 0.4);
        g = g * (0.8 + waveHeight * 0.4);
        b = b * (0.8 + waveHeight * 0.4);
        
        // Apply reflection if available
        if (reflection) {
          const distortX = Math.floor(x + dx * 20);
          const distortY = Math.floor(y + dy * 20);
          if (distortX >= 0 && distortX < reflection.width &&
              distortY >= 0 && distortY < reflection.height) {
            const refIdx = (distortY * reflection.width + distortX) * reflection.channels;
            r = r * (1 - reflectivity) + reflection.data[refIdx] * reflectivity;
            g = g * (1 - reflectivity) + reflection.data[refIdx + 1] * reflectivity;
            b = b * (1 - reflectivity) + reflection.data[refIdx + 2] * reflectivity;
          }
        }
        
        // Add foam
        r = Math.min(255, r + foamAmount * 255);
        g = Math.min(255, g + foamAmount * 255);
        b = Math.min(255, b + foamAmount * 255);
        
        data[idx] = Math.floor(r);
        data[idx + 1] = Math.floor(g);
        data[idx + 2] = Math.floor(b);
        data[idx + 3] = 255;
      }
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width,
        height,
        channels: 4,
        data,
        format: 'rgba'
      };
    }
    
    const normalOutput = this.outputs.get('normalMap');
    if (normalOutput) {
      normalOutput.value = {
        width,
        height,
        channels: 4,
        data: normalData,
        format: 'rgba'
      };
    }
  }

  private getWaveDerivative(
    x: number,
    y: number,
    scale: number,
    freq: number,
    ripples: number,
    axis: 'x' | 'y'
  ): number {
    let derivative = 0;
    const amplitude = this.getParameter('waveAmplitude');
    
    for (let i = 0; i < ripples; i++) {
      const phase = i * Math.PI / ripples;
      const f = freq * (1 + i * 0.5);
      
      if (axis === 'x') {
        derivative += Math.cos(x * scale * f + this.time * 2 + phase) *
                      Math.cos(y * scale * f * 0.7 + this.time * 1.5 + phase) *
                      scale * f * amplitude / (i + 1);
      } else {
        derivative += Math.sin(x * scale * f + this.time * 2 + phase) *
                      -Math.sin(y * scale * f * 0.7 + this.time * 1.5 + phase) *
                      scale * f * 0.7 * amplitude / (i + 1);
      }
    }
    
    return Math.max(-1, Math.min(1, derivative));
  }
}
