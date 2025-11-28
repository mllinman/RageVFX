/**
 * TimeWarpNode - Temporal effects including echo, motion trails, and time displacement
 * Version 3.4 - Advanced VFX
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class TimeWarpNode extends Node {
  private frameBuffer: Uint8Array[] = [];
  private frameIndex: number = 0;

  constructor(id: string) {
    super(id, 'TimeWarp', 'TimeWarp');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Temporal effects including echo, motion trails, and time displacement';
    
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('mode', 'echo'); // echo, trail, displacement, stroboscopic
    this.setParameter('echoFrames', 10);
    this.setParameter('echoDecay', 0.9);
    this.setParameter('echoOffset', { x: 0, y: 0 });
    this.setParameter('trailBlendMode', 'add'); // add, screen, overlay
    this.setParameter('displacementStrength', 50);
    this.setParameter('displacementDirection', 'radial'); // radial, directional, wave
    this.setParameter('strobeInterval', 3);
    this.setParameter('timeScale', 1.0);
    this.setParameter('motionBlur', 0.5);
    this.setParameter('colorShift', true);
    this.setParameter('colorShiftAmount', 0.1);
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const mode = this.getParameter('mode');
    const echoFrames = this.getParameter('echoFrames');
    const echoDecay = this.getParameter('echoDecay');
    const echoOffset = this.getParameter('echoOffset');
    const trailBlendMode = this.getParameter('trailBlendMode');
    const colorShift = this.getParameter('colorShift');
    const colorShiftAmount = this.getParameter('colorShiftAmount');
    
    const inputData = this.inputs.get('image')?.value as ImageData | undefined;
    const data = new Uint8Array(width * height * 4);
    
    // Store current frame in buffer
    if (inputData) {
      const frameData = new Uint8Array(inputData.data.length);
      frameData.set(inputData.data);
      
      this.frameBuffer.unshift(frameData);
      if (this.frameBuffer.length > echoFrames) {
        this.frameBuffer.pop();
      }
    }
    
    this.frameIndex++;
    
    switch (mode) {
      case 'echo':
        this.processEcho(data, width, height, echoDecay, echoOffset, colorShift, colorShiftAmount);
        break;
      case 'trail':
        this.processTrail(data, width, height, trailBlendMode, colorShift, colorShiftAmount);
        break;
      case 'displacement':
        this.processDisplacement(data, width, height);
        break;
      case 'stroboscopic':
        this.processStroboscopic(data, width, height);
        break;
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

  private processEcho(
    data: Uint8Array, 
    width: number, 
    height: number, 
    decay: number, 
    offset: { x: number; y: number },
    colorShift: boolean,
    colorShiftAmount: number
  ): void {
    // Start with current frame
    if (this.frameBuffer.length > 0) {
      data.set(this.frameBuffer[0]);
    }
    
    // Blend in previous frames with decay
    for (let f = 1; f < this.frameBuffer.length; f++) {
      const frame = this.frameBuffer[f];
      const alpha = Math.pow(decay, f);
      
      const offsetX = Math.round(offset.x * f);
      const offsetY = Math.round(offset.y * f);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = x - offsetX;
          const srcY = y - offsetY;
          
          if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) continue;
          
          const dstIdx = (y * width + x) * 4;
          const srcIdx = (srcY * width + srcX) * 4;
          
          // Color shift for rainbow trail effect
          let r = frame[srcIdx];
          let g = frame[srcIdx + 1];
          let b = frame[srcIdx + 2];
          
          if (colorShift) {
            const hueShift = f * colorShiftAmount * 360;
            const shifted = this.shiftHue(r, g, b, hueShift);
            r = shifted.r;
            g = shifted.g;
            b = shifted.b;
          }
          
          // Additive blend
          data[dstIdx] = Math.min(255, data[dstIdx] + r * alpha);
          data[dstIdx + 1] = Math.min(255, data[dstIdx + 1] + g * alpha);
          data[dstIdx + 2] = Math.min(255, data[dstIdx + 2] + b * alpha);
          data[dstIdx + 3] = Math.min(255, data[dstIdx + 3] + frame[srcIdx + 3] * alpha);
        }
      }
    }
  }

  private processTrail(
    data: Uint8Array, 
    width: number, 
    height: number, 
    blendMode: string,
    colorShift: boolean,
    colorShiftAmount: number
  ): void {
    // Accumulate all frames with specified blend mode
    for (let f = 0; f < this.frameBuffer.length; f++) {
      const frame = this.frameBuffer[f];
      const alpha = 1 - f / this.frameBuffer.length;
      
      for (let i = 0; i < width * height * 4; i += 4) {
        let r = frame[i];
        let g = frame[i + 1];
        let b = frame[i + 2];
        
        if (colorShift) {
          const hueShift = f * colorShiftAmount * 360;
          const shifted = this.shiftHue(r, g, b, hueShift);
          r = shifted.r;
          g = shifted.g;
          b = shifted.b;
        }
        
        switch (blendMode) {
          case 'add':
            data[i] = Math.min(255, data[i] + r * alpha);
            data[i + 1] = Math.min(255, data[i + 1] + g * alpha);
            data[i + 2] = Math.min(255, data[i + 2] + b * alpha);
            break;
          case 'screen':
            data[i] = Math.min(255, 255 - (255 - data[i]) * (255 - r * alpha) / 255);
            data[i + 1] = Math.min(255, 255 - (255 - data[i + 1]) * (255 - g * alpha) / 255);
            data[i + 2] = Math.min(255, 255 - (255 - data[i + 2]) * (255 - b * alpha) / 255);
            break;
          case 'overlay':
            data[i] = data[i] < 128 ? 2 * data[i] * r * alpha / 255 : 255 - 2 * (255 - data[i]) * (255 - r * alpha) / 255;
            data[i + 1] = data[i + 1] < 128 ? 2 * data[i + 1] * g * alpha / 255 : 255 - 2 * (255 - data[i + 1]) * (255 - g * alpha) / 255;
            data[i + 2] = data[i + 2] < 128 ? 2 * data[i + 2] * b * alpha / 255 : 255 - 2 * (255 - data[i + 2]) * (255 - b * alpha) / 255;
            break;
        }
        
        data[i + 3] = Math.min(255, data[i + 3] + frame[i + 3] * alpha);
      }
    }
  }

  private processDisplacement(data: Uint8Array, width: number, height: number): void {
    const strength = this.getParameter('displacementStrength');
    const direction = this.getParameter('displacementDirection');
    
    if (this.frameBuffer.length < 2) {
      if (this.frameBuffer.length > 0) {
        data.set(this.frameBuffer[0]);
      }
      return;
    }
    
    const current = this.frameBuffer[0];
    const previous = this.frameBuffer[1];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate motion/displacement
        let dx = 0, dy = 0;
        
        switch (direction) {
          case 'radial': {
            const cx = width / 2;
            const cy = height / 2;
            const angle = Math.atan2(y - cy, x - cx);
            const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
            const factor = strength * Math.sin(dist * 0.01 + this.frameIndex * 0.1);
            dx = Math.cos(angle) * factor;
            dy = Math.sin(angle) * factor;
            break;
          }
          case 'directional': {
            const motionDiff = (current[idx] - previous[idx] + current[idx + 1] - previous[idx + 1] + current[idx + 2] - previous[idx + 2]) / 3;
            dx = motionDiff * strength * 0.1;
            break;
          }
          case 'wave': {
            dx = Math.sin(y * 0.02 + this.frameIndex * 0.1) * strength;
            dy = Math.cos(x * 0.02 + this.frameIndex * 0.1) * strength * 0.5;
            break;
          }
        }
        
        const srcX = Math.max(0, Math.min(width - 1, Math.round(x + dx)));
        const srcY = Math.max(0, Math.min(height - 1, Math.round(y + dy)));
        const srcIdx = (srcY * width + srcX) * 4;
        
        data[idx] = current[srcIdx];
        data[idx + 1] = current[srcIdx + 1];
        data[idx + 2] = current[srcIdx + 2];
        data[idx + 3] = current[srcIdx + 3];
      }
    }
  }

  private processStroboscopic(data: Uint8Array, width: number, height: number): void {
    const interval = this.getParameter('strobeInterval');
    
    // Select frames at regular intervals
    const selectedFrames: Uint8Array[] = [];
    for (let i = 0; i < this.frameBuffer.length; i += interval) {
      selectedFrames.push(this.frameBuffer[i]);
    }
    
    // Average selected frames
    for (let i = 0; i < width * height * 4; i += 4) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (const frame of selectedFrames) {
        r += frame[i];
        g += frame[i + 1];
        b += frame[i + 2];
        a += frame[i + 3];
      }
      
      const count = selectedFrames.length || 1;
      data[i] = r / count;
      data[i + 1] = g / count;
      data[i + 2] = b / count;
      data[i + 3] = a / count;
    }
  }

  private shiftHue(r: number, g: number, b: number, degrees: number): { r: number; g: number; b: number } {
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
