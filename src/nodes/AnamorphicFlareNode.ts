/**
 * AnamorphicFlareNode - Professional anamorphic lens flare effects
 * Creates horizontal streak flares typical of anamorphic lenses
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface FlareStreak {
  offsetX: number;
  width: number;
  intensity: number;
  color: { r: number; g: number; b: number; a: number };
  falloff: number;
}

export class AnamorphicFlareNode extends Node {
  constructor(id: string) {
    super(id, 'AnamorphicFlare', 'Anamorphic Flare');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Professional anamorphic lens flare with horizontal streaks';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('mask', 'Light Source Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Position and size
    this.setParameter('sourceX', 0.5);
    this.setParameter('sourceY', 0.3);
    this.setParameter('streakLength', 1.0);
    this.setParameter('streakWidth', 0.02);
    
    // Intensity and color
    this.setParameter('intensity', 1.0);
    this.setParameter('color', { r: 255, g: 245, b: 220 });
    this.setParameter('colorShift', 0.3);
    
    // Streak properties
    this.setParameter('streakCount', 3);
    this.setParameter('streakSpacing', 0.1);
    this.setParameter('asymmetry', 0.0);
    
    // Chromatic aberration
    this.setParameter('chromaticAberration', 0.2);
    this.setParameter('chromaticSpread', 0.05);
    
    // Bloom
    this.setParameter('bloomRadius', 30);
    this.setParameter('bloomIntensity', 0.5);
    
    // Additional effects
    this.setParameter('flareElements', true);
    this.setParameter('elementCount', 6);
    this.setParameter('starburstIntensity', 0.3);
    this.setParameter('starburstRays', 8);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    const sourceX = this.getParameter('sourceX');
    const sourceY = this.getParameter('sourceY');
    const streakLength = this.getParameter('streakLength');
    const streakWidth = this.getParameter('streakWidth');
    const intensity = this.getParameter('intensity');
    const color = this.getParameter('color');
    const colorShift = this.getParameter('colorShift');
    const streakCount = this.getParameter('streakCount');
    const streakSpacing = this.getParameter('streakSpacing');
    const asymmetry = this.getParameter('asymmetry');
    const chromaticAberration = this.getParameter('chromaticAberration');
    const chromaticSpread = this.getParameter('chromaticSpread');
    const bloomRadius = this.getParameter('bloomRadius');
    const bloomIntensity = this.getParameter('bloomIntensity');
    const flareElements = this.getParameter('flareElements');
    const elementCount = this.getParameter('elementCount');
    const starburstIntensity = this.getParameter('starburstIntensity');
    const starburstRays = this.getParameter('starburstRays');
    
    const width = inputImage?.width || 1920;
    const height = inputImage?.height || 1080;
    
    const outData = new Uint8Array(width * height * 4);
    
    // Copy input image or initialize to black
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
      outData.fill(0);
      for (let i = 3; i < outData.length; i += 4) {
        outData[i] = 255;
      }
    }
    
    const sx = sourceX * width;
    const sy = sourceY * height;
    const cx = width / 2;
    const cy = height / 2;
    
    // Generate anamorphic streaks
    const streaks: FlareStreak[] = [];
    const halfStreaks = Math.floor(streakCount / 2);
    
    for (let i = -halfStreaks; i <= halfStreaks; i++) {
      const yOffset = i * streakSpacing * height;
      const intensityMod = 1 - Math.abs(i) / (halfStreaks + 1) * 0.5;
      
      // Add chromatic separation
      for (let c = 0; c < 3; c++) {
        const chromOffset = (c - 1) * chromaticSpread * width * chromaticAberration;
        streaks.push({
          offsetX: chromOffset,
          width: streakWidth * height,
          intensity: intensityMod * intensity * (c === 1 ? 1 : 0.7),
          color: {
            r: c === 0 ? color.r : color.r * (1 - colorShift),
            g: c === 1 ? color.g : color.g * (1 - colorShift),
            b: c === 2 ? color.b : color.b * (1 - colorShift),
            a: 1
          },
          falloff: 2.0
        });
      }
    }
    
    // Draw bloom at source
    this.drawBloom(outData, width, height, sx, sy, bloomRadius, bloomIntensity * intensity, color);
    
    // Draw starburst pattern
    if (starburstIntensity > 0) {
      this.drawStarburst(outData, width, height, sx, sy, starburstRays, starburstIntensity * intensity, color);
    }
    
    // Draw anamorphic streaks
    for (const streak of streaks) {
      this.drawStreak(outData, width, height, sx + streak.offsetX, sy, 
                      width * streakLength * (1 + asymmetry), streak);
    }
    
    // Draw flare elements along the optical axis
    if (flareElements) {
      this.drawFlareElements(outData, width, height, sx, sy, cx, cy, 
                            elementCount, intensity, color, chromaticAberration);
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private drawBloom(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    radius: number,
    intensity: number,
    color: { r: number; g: number; b: number }
  ): void {
    // Horizontal stretched bloom for anamorphic look
    const stretchX = 3.0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius * stretchX; dx <= radius * stretchX; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const normalizedDist = Math.sqrt(
            Math.pow(dx / stretchX / radius, 2) + 
            Math.pow(dy / radius, 2)
          );
          
          if (normalizedDist <= 1) {
            const idx = (py * width + px) * 4;
            const falloff = Math.pow(1 - normalizedDist, 3) * intensity;
            
            data[idx] = Math.min(255, data[idx] + color.r * falloff);
            data[idx + 1] = Math.min(255, data[idx + 1] + color.g * falloff);
            data[idx + 2] = Math.min(255, data[idx + 2] + color.b * falloff);
          }
        }
      }
    }
  }

  private drawStarburst(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    rays: number,
    intensity: number,
    color: { r: number; g: number; b: number }
  ): void {
    const rayLength = Math.min(width, height) * 0.15;
    const rayWidth = 2;
    
    for (let r = 0; r < rays; r++) {
      const angle = (r / rays) * Math.PI * 2;
      
      for (let d = 0; d < rayLength; d++) {
        const px = Math.floor(x + Math.cos(angle) * d);
        const py = Math.floor(y + Math.sin(angle) * d);
        
        for (let w = -rayWidth; w <= rayWidth; w++) {
          const wx = Math.floor(px - Math.sin(angle) * w);
          const wy = Math.floor(py + Math.cos(angle) * w);
          
          if (wx >= 0 && wx < width && wy >= 0 && wy < height) {
            const idx = (wy * width + wx) * 4;
            const distFalloff = Math.pow(1 - d / rayLength, 2);
            const widthFalloff = 1 - Math.abs(w) / rayWidth;
            const falloff = distFalloff * widthFalloff * intensity;
            
            data[idx] = Math.min(255, data[idx] + color.r * falloff);
            data[idx + 1] = Math.min(255, data[idx + 1] + color.g * falloff);
            data[idx + 2] = Math.min(255, data[idx + 2] + color.b * falloff);
          }
        }
      }
    }
  }

  private drawStreak(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    length: number,
    streak: FlareStreak
  ): void {
    const halfLength = length / 2;
    const halfWidth = streak.width / 2;
    
    for (let dx = -halfLength; dx <= halfLength; dx++) {
      for (let dy = -halfWidth; dy <= halfWidth; dy++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          
          // Distance falloff from center
          const xFalloff = Math.pow(1 - Math.abs(dx) / halfLength, streak.falloff);
          const yFalloff = 1 - Math.pow(Math.abs(dy) / halfWidth, 2);
          const falloff = xFalloff * yFalloff * streak.intensity;
          
          data[idx] = Math.min(255, data[idx] + streak.color.r * falloff);
          data[idx + 1] = Math.min(255, data[idx + 1] + streak.color.g * falloff);
          data[idx + 2] = Math.min(255, data[idx + 2] + streak.color.b * falloff);
        }
      }
    }
  }

  private drawFlareElements(
    data: Uint8Array,
    width: number,
    height: number,
    sx: number,
    sy: number,
    cx: number,
    cy: number,
    count: number,
    intensity: number,
    color: { r: number; g: number; b: number },
    chromatic: number
  ): void {
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * 2 - 0.5;
      const ex = sx + (cx - sx) * t * 2;
      const ey = sy + (cy - sy) * t * 2;
      
      const size = 10 + Math.random() * 30;
      const elementIntensity = intensity * (0.3 + Math.random() * 0.4);
      
      // Draw with chromatic separation
      const colors = [
        { r: color.r, g: color.g * (1 - chromatic), b: color.b * (1 - chromatic) },
        { r: color.r * (1 - chromatic), g: color.g, b: color.b * (1 - chromatic) },
        { r: color.r * (1 - chromatic), g: color.g * (1 - chromatic), b: color.b }
      ];
      
      for (let c = 0; c < 3; c++) {
        const offset = (c - 1) * 3;
        this.drawCircle(data, width, height, ex + offset, ey, size, elementIntensity / 3, colors[c]);
      }
    }
  }

  private drawCircle(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    radius: number,
    intensity: number,
    color: { r: number; g: number; b: number }
  ): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= radius) {
            const idx = (py * width + px) * 4;
            const falloff = Math.pow(1 - dist / radius, 2) * intensity;
            
            data[idx] = Math.min(255, data[idx] + color.r * falloff);
            data[idx + 1] = Math.min(255, data[idx + 1] + color.g * falloff);
            data[idx + 2] = Math.min(255, data[idx + 2] + color.b * falloff);
          }
        }
      }
    }
  }
}
