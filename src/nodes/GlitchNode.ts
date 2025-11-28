/**
 * GlitchNode - Digital glitch and distortion effects
 * Version 3.4 - Advanced VFX
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class GlitchNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'Glitch', 'Glitch');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate digital glitch and distortion effects';
    
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('intensity', 0.5);
    this.setParameter('speed', 1.0);
    this.setParameter('blockSize', 32);
    this.setParameter('colorShift', 0.1);
    this.setParameter('scanLines', true);
    this.setParameter('scanLineIntensity', 0.3);
    this.setParameter('rgbShift', 0.02);
    this.setParameter('noise', 0.1);
    this.setParameter('seed', 42);
    this.setParameter('waveDistortion', 0.05);
    this.setParameter('chromatic', true);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const intensity = this.getParameter('intensity');
    const speed = this.getParameter('speed');
    const blockSize = this.getParameter('blockSize');
    const colorShift = this.getParameter('colorShift');
    const scanLines = this.getParameter('scanLines');
    const scanLineIntensity = this.getParameter('scanLineIntensity');
    const rgbShift = this.getParameter('rgbShift');
    const noise = this.getParameter('noise');
    const seed = this.getParameter('seed');
    const waveDistortion = this.getParameter('waveDistortion');
    const chromatic = this.getParameter('chromatic');
    
    this.time += 0.016 * speed;
    
    const inputData = this.inputs.get('image')?.value as ImageData | undefined;
    const data = new Uint8Array(width * height * 4);
    
    // Initialize with input or black
    if (inputData) {
      for (let i = 0; i < width * height * 4; i++) {
        data[i] = inputData.data[i] || 0;
      }
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Block glitch
        const blockY = Math.floor(y / blockSize);
        const blockRandom = this.seededRandom(seed + blockY + Math.floor(this.time * 10));
        
        let srcX = x;
        let srcY = y;
        
        // Random block shift
        if (blockRandom < intensity * 0.3) {
          const shift = Math.floor((this.seededRandom(seed + blockY * 2) - 0.5) * width * 0.1 * intensity);
          srcX = Math.max(0, Math.min(width - 1, x + shift));
        }
        
        // Wave distortion
        if (waveDistortion > 0) {
          const wave = Math.sin(y * 0.01 + this.time * 5) * width * waveDistortion * intensity;
          srcX = Math.max(0, Math.min(width - 1, srcX + Math.floor(wave)));
        }
        
        const srcIdx = (srcY * width + srcX) * 4;
        
        // RGB shift (chromatic aberration effect)
        let rX = srcX, gX = srcX, bX = srcX;
        if (chromatic && rgbShift > 0) {
          const shift = Math.floor(width * rgbShift * intensity);
          rX = Math.max(0, Math.min(width - 1, srcX - shift));
          bX = Math.max(0, Math.min(width - 1, srcX + shift));
        }
        
        const rIdx = (srcY * width + rX) * 4;
        const gIdx = srcIdx;
        const bIdx = (srcY * width + bX) * 4;
        
        // Get colors from different positions for RGB split
        let r = inputData ? (inputData.data[rIdx] || 0) : 128;
        let g = inputData ? (inputData.data[gIdx + 1] || 0) : 128;
        let b = inputData ? (inputData.data[bIdx + 2] || 0) : 128;
        let a = inputData ? (inputData.data[srcIdx + 3] || 255) : 255;
        
        // Color shift
        if (colorShift > 0 && this.seededRandom(seed + x + y + Math.floor(this.time * 5)) < intensity * colorShift) {
          const hueShift = this.seededRandom(seed + x * y) * 360;
          const shifted = this.shiftHue(r, g, b, hueShift);
          r = shifted.r;
          g = shifted.g;
          b = shifted.b;
        }
        
        // Scan lines
        if (scanLines && y % 2 === 0) {
          const scanMult = 1 - scanLineIntensity;
          r *= scanMult;
          g *= scanMult;
          b *= scanMult;
        }
        
        // Random noise
        if (noise > 0 && this.seededRandom(seed + idx + this.time) < noise * intensity) {
          const noiseValue = this.seededRandom(seed + idx) * 255;
          r = r * 0.7 + noiseValue * 0.3;
          g = g * 0.7 + noiseValue * 0.3;
          b = b * 0.7 + noiseValue * 0.3;
        }
        
        data[idx] = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b));
        data[idx + 3] = a;
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
  }

  private shiftHue(r: number, g: number, b: number, degrees: number): { r: number; g: number; b: number } {
    // Convert to HSL, shift hue, convert back
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r / 255) h = ((g - b) / 255 / d + (g < b ? 6 : 0)) / 6;
      else if (max === g / 255) h = ((b - r) / 255 / d + 2) / 6;
      else h = ((r - g) / 255 / d + 4) / 6;
    }

    h = (h + degrees / 360) % 1;
    if (h < 0) h += 1;

    // HSL to RGB
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let newR: number, newG: number, newB: number;
    if (s === 0) {
      newR = newG = newB = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      newR = hue2rgb(p, q, h + 1/3);
      newG = hue2rgb(p, q, h);
      newB = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(newR * 255),
      g: Math.round(newG * 255),
      b: Math.round(newB * 255)
    };
  }
}
