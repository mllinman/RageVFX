/**
 * RainNode - Generates particle-based rain effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

export class RainNode extends Node {
  private drops: RainDrop[] = [];
  private initialized: boolean = false;

  constructor(id: string) {
    super(id, 'Rain', 'Rain');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate particle-based rain effects';
    
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('dropCount', 500);
    this.setParameter('dropSpeed', 15.0);
    this.setParameter('dropSpeedVariation', 5.0);
    this.setParameter('dropLength', 20);
    this.setParameter('dropLengthVariation', 10);
    this.setParameter('dropWidth', 1);
    this.setParameter('angle', 0); // Degrees from vertical
    this.setParameter('windVariation', 5);
    this.setParameter('color', { r: 200, g: 200, b: 220 });
    this.setParameter('opacity', 0.6);
    this.setParameter('blur', 0.5);
    this.setParameter('splash', true);
    this.setParameter('seed', 42);
  }

  private initializeDrops(): void {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const dropCount = this.getParameter('dropCount');
    const dropSpeed = this.getParameter('dropSpeed');
    const dropSpeedVariation = this.getParameter('dropSpeedVariation');
    const dropLength = this.getParameter('dropLength');
    const dropLengthVariation = this.getParameter('dropLengthVariation');
    const seed = this.getParameter('seed');
    
    this.drops = [];
    
    for (let i = 0; i < dropCount; i++) {
      const random = this.seededRandom(seed + i);
      const random2 = this.seededRandom(seed + i + 1000);
      const random3 = this.seededRandom(seed + i + 2000);
      
      this.drops.push({
        x: random * width,
        y: random2 * height,
        speed: dropSpeed + (random3 - 0.5) * 2 * dropSpeedVariation,
        length: dropLength + (this.seededRandom(seed + i + 3000) - 0.5) * 2 * dropLengthVariation,
        opacity: 0.5 + this.seededRandom(seed + i + 4000) * 0.5
      });
    }
    
    this.initialized = true;
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    if (!this.initialized) {
      this.initializeDrops();
    }

    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const angle = this.getParameter('angle') * Math.PI / 180;
    const windVariation = this.getParameter('windVariation') * Math.PI / 180;
    const color = this.getParameter('color');
    const opacity = this.getParameter('opacity');
    const dropWidth = this.getParameter('dropWidth');
    const splash = this.getParameter('splash');
    
    const bgInput = this.inputs.get('background');
    const background = bgInput?.value as ImageData | undefined;
    
    // Initialize output with background or transparent
    const data = new Uint8Array(width * height * 4);
    
    if (background) {
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const srcIdx = i * background.channels;
        data[idx] = background.data[srcIdx];
        data[idx + 1] = background.data[srcIdx + 1];
        data[idx + 2] = background.data[srcIdx + 2];
        data[idx + 3] = background.channels === 4 ? background.data[srcIdx + 3] : 255;
      }
    } else {
      data.fill(0);
    }
    
    // Update and draw each raindrop
    for (const drop of this.drops) {
      // Calculate wind-affected angle
      const dropAngle = angle + (this.seededRandom(drop.x + drop.y) - 0.5) * 2 * windVariation;
      
      // Calculate drop end position
      const dx = Math.sin(dropAngle) * drop.length;
      const dy = Math.cos(dropAngle) * drop.length;
      
      // Draw the raindrop line
      this.drawLine(
        data, width, height,
        drop.x, drop.y,
        drop.x + dx, drop.y + dy,
        color, opacity * drop.opacity, dropWidth
      );
      
      // Draw splash at bottom
      if (splash && drop.y >= height - 10) {
        this.drawSplash(data, width, height, drop.x, height - 5, color, opacity * 0.3);
      }
      
      // Update drop position
      drop.y += drop.speed;
      drop.x += Math.sin(dropAngle) * drop.speed;
      
      // Reset drop if it goes off screen
      if (drop.y > height + drop.length) {
        drop.y = -drop.length;
        drop.x = this.seededRandom(drop.x * drop.y + Date.now() % 1000) * width;
      }
      
      // Wrap horizontally
      if (drop.x < 0) drop.x += width;
      if (drop.x > width) drop.x -= width;
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

  private drawLine(
    data: Uint8Array,
    width: number,
    height: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: { r: number; g: number; b: number },
    opacity: number,
    lineWidth: number
  ): void {
    // Bresenham's line algorithm with width
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    let x = Math.floor(x0);
    let y = Math.floor(y0);
    const endX = Math.floor(x1);
    const endY = Math.floor(y1);
    
     
    while (true) {
      // Draw with width
      for (let wx = -Math.floor(lineWidth / 2); wx <= Math.floor(lineWidth / 2); wx++) {
        const px = x + wx;
        if (px >= 0 && px < width && y >= 0 && y < height) {
          const idx = (y * width + px) * 4;
          data[idx] = Math.min(255, data[idx] + color.r * opacity);
          data[idx + 1] = Math.min(255, data[idx + 1] + color.g * opacity);
          data[idx + 2] = Math.min(255, data[idx + 2] + color.b * opacity);
          data[idx + 3] = Math.min(255, data[idx + 3] + 255 * opacity);
        }
      }
      
      if (x === endX && y === endY) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private drawSplash(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    color: { r: number; g: number; b: number },
    opacity: number
  ): void {
    const splashRadius = 3;
    
    for (let dy = -splashRadius; dy <= 0; dy++) {
      for (let dx = -splashRadius; dx <= splashRadius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= splashRadius) {
          const px = Math.floor(x + dx);
          const py = Math.floor(y + dy);
          
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            const falloff = 1 - dist / splashRadius;
            
            data[idx] = Math.min(255, data[idx] + color.r * opacity * falloff);
            data[idx + 1] = Math.min(255, data[idx + 1] + color.g * opacity * falloff);
            data[idx + 2] = Math.min(255, data[idx + 2] + color.b * opacity * falloff);
            data[idx + 3] = Math.min(255, data[idx + 3] + 255 * opacity * falloff);
          }
        }
      }
    }
  }
}
