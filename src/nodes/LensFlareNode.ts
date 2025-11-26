/**
 * LensFlareNode - Generate lens flare effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface FlareElement {
  position: number;
  size: number;
  brightness: number;
  color: { r: number; g: number; b: number };
  type: 'circle' | 'ring' | 'hex' | 'streak';
}

export class LensFlareNode extends Node {
  constructor(id: string) {
    super(id, 'LensFlare', 'Lens Flare');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate lens flare effects';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('sourceX', 0.5);
    this.setParameter('sourceY', 0.3);
    this.setParameter('brightness', 1.0);
    this.setParameter('size', 1.0);
    this.setParameter('anamorphic', 0.0);
    this.setParameter('chromatic', 0.3);
    this.setParameter('elementCount', 8);
    this.setParameter('bloomSize', 50);
    this.setParameter('bloomIntensity', 0.5);
    this.setParameter('color', { r: 255, g: 220, b: 180 });
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!output) {
      return;
    }

    const inputImage = input?.value as ImageData | undefined;
    const sourceX = this.getParameter('sourceX');
    const sourceY = this.getParameter('sourceY');
    const brightness = this.getParameter('brightness');
    const size = this.getParameter('size');
    const anamorphic = this.getParameter('anamorphic');
    const chromatic = this.getParameter('chromatic');
    const elementCount = this.getParameter('elementCount');
    const bloomSize = this.getParameter('bloomSize');
    const bloomIntensity = this.getParameter('bloomIntensity');
    const color = this.getParameter('color');
    
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
    
    // Calculate flare line from source through center
    const cx = width / 2;
    const cy = height / 2;
    const sx = sourceX * width;
    const sy = sourceY * height;
    
    // Generate flare elements
    const elements: FlareElement[] = [];
    
    for (let i = 0; i < elementCount; i++) {
      const t = (i / (elementCount - 1)) * 2 - 0.5; // -0.5 to 1.5
      
      elements.push({
        position: t,
        size: (0.3 + Math.random() * 0.7) * size * 50,
        brightness: (0.3 + Math.random() * 0.7) * brightness,
        color: {
          r: color.r * (1 - chromatic * (i % 3 === 0 ? 0.3 : 0)),
          g: color.g * (1 - chromatic * (i % 3 === 1 ? 0.3 : 0)),
          b: color.b * (1 - chromatic * (i % 3 === 2 ? 0.3 : 0))
        },
        type: ['circle', 'ring', 'hex', 'circle'][i % 4] as FlareElement['type']
      });
    }
    
    // Draw bloom at source
    this.drawBloom(outData, width, height, sx, sy, bloomSize * size, bloomIntensity * brightness, color, anamorphic);
    
    // Draw anamorphic streak
    if (anamorphic > 0) {
      this.drawStreak(outData, width, height, sx, sy, width * 0.8 * anamorphic, brightness * 0.3, color);
    }
    
    // Draw flare elements
    for (const element of elements) {
      const ex = sx + (cx - sx) * element.position * 2;
      const ey = sy + (cy - sy) * element.position * 2;
      
      this.drawFlareElement(outData, width, height, ex, ey, element);
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
    size: number,
    intensity: number,
    color: { r: number; g: number; b: number },
    anamorphic: number
  ): void {
    const radius = size;
    const scaleX = 1 + anamorphic * 3;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius * scaleX; dx <= radius * scaleX; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt((dx / scaleX) * (dx / scaleX) + dy * dy);
          
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

  private drawStreak(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    length: number,
    intensity: number,
    color: { r: number; g: number; b: number }
  ): void {
    const halfLength = length / 2;
    const thickness = 3;
    
    for (let dx = -halfLength; dx <= halfLength; dx++) {
      for (let dy = -thickness; dy <= thickness; dy++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          const xFalloff = 1 - Math.abs(dx) / halfLength;
          const yFalloff = 1 - Math.abs(dy) / thickness;
          const falloff = Math.pow(xFalloff * yFalloff, 2) * intensity;
          
          data[idx] = Math.min(255, data[idx] + color.r * falloff);
          data[idx + 1] = Math.min(255, data[idx + 1] + color.g * falloff);
          data[idx + 2] = Math.min(255, data[idx + 2] + color.b * falloff);
        }
      }
    }
  }

  private drawFlareElement(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    element: FlareElement
  ): void {
    const radius = element.size;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          let intensity = 0;
          
          switch (element.type) {
            case 'circle':
              if (dist <= radius) {
                intensity = Math.pow(1 - dist / radius, 2);
              }
              break;
            case 'ring': {
              const ringWidth = radius * 0.2;
              const ringDist = Math.abs(dist - radius * 0.7);
              if (ringDist < ringWidth) {
                intensity = 1 - ringDist / ringWidth;
              }
              break;
            }
            case 'hex': {
              const angle = Math.atan2(dy, dx);
              const hexDist = dist / (1 + 0.3 * Math.cos(6 * angle));
              if (hexDist <= radius * 0.8) {
                intensity = 1 - hexDist / (radius * 0.8);
              }
              break;
            }
          }
          
          if (intensity > 0) {
            const idx = (py * width + px) * 4;
            const finalIntensity = intensity * element.brightness;
            
            data[idx] = Math.min(255, data[idx] + element.color.r * finalIntensity);
            data[idx + 1] = Math.min(255, data[idx + 1] + element.color.g * finalIntensity);
            data[idx + 2] = Math.min(255, data[idx + 2] + element.color.b * finalIntensity);
          }
        }
      }
    }
  }
}
