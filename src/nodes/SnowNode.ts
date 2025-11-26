/**
 * SnowNode - Generates procedural snowfall particle effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface Snowflake {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  opacity: number;
  rotation: number;
}

export class SnowNode extends Node {
  private flakes: Snowflake[] = [];
  private initialized: boolean = false;
  private time: number = 0;

  constructor(id: string) {
    super(id, 'Snow', 'Snow');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate procedural snowfall effects';
    
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('flakeCount', 300);
    this.setParameter('minSize', 2);
    this.setParameter('maxSize', 8);
    this.setParameter('speed', 2.0);
    this.setParameter('speedVariation', 1.0);
    this.setParameter('wobbleAmount', 30);
    this.setParameter('windSpeed', 0);
    this.setParameter('color', { r: 255, g: 255, b: 255 });
    this.setParameter('opacity', 0.8);
    this.setParameter('blur', 0.3);
    this.setParameter('accumulation', false);
    this.setParameter('seed', 54321);
  }

  private initializeFlakes(): void {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const flakeCount = this.getParameter('flakeCount');
    const minSize = this.getParameter('minSize');
    const maxSize = this.getParameter('maxSize');
    const speed = this.getParameter('speed');
    const speedVariation = this.getParameter('speedVariation');
    const wobbleAmount = this.getParameter('wobbleAmount');
    const seed = this.getParameter('seed');
    
    this.flakes = [];
    
    for (let i = 0; i < flakeCount; i++) {
      const random = () => this.seededRandom(seed + i + this.flakes.length * 100);
      
      this.flakes.push({
        x: random() * width,
        y: random() * height,
        size: minSize + random() * (maxSize - minSize),
        speed: speed + (random() - 0.5) * 2 * speedVariation,
        wobble: wobbleAmount * random(),
        wobbleSpeed: 1 + random() * 2,
        wobbleOffset: random() * Math.PI * 2,
        opacity: 0.5 + random() * 0.5,
        rotation: random() * Math.PI * 2
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
      this.initializeFlakes();
    }

    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const windSpeed = this.getParameter('windSpeed');
    const color = this.getParameter('color');
    const opacity = this.getParameter('opacity');
    const blur = this.getParameter('blur');
    
    this.time += 0.016;
    
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
    
    // Update and draw each snowflake
    for (const flake of this.flakes) {
      // Calculate wobble offset
      const wobbleX = Math.sin(this.time * flake.wobbleSpeed + flake.wobbleOffset) * flake.wobble;
      
      // Draw the snowflake
      this.drawSnowflake(
        data, width, height,
        flake.x + wobbleX, flake.y,
        flake.size, flake.rotation,
        color, opacity * flake.opacity, blur
      );
      
      // Update position
      flake.y += flake.speed;
      flake.x += windSpeed * 0.5;
      flake.rotation += 0.01;
      
      // Reset if off screen
      if (flake.y > height + flake.size) {
        flake.y = -flake.size * 2;
        flake.x = this.seededRandom(flake.x * flake.y + Date.now() % 1000) * width;
      }
      
      // Wrap horizontally
      if (flake.x < -flake.size) flake.x += width + flake.size * 2;
      if (flake.x > width + flake.size) flake.x -= width + flake.size * 2;
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

  private drawSnowflake(
    data: Uint8Array,
    width: number,
    height: number,
    cx: number,
    cy: number,
    size: number,
    rotation: number,
    color: { r: number; g: number; b: number },
    opacity: number,
    blur: number
  ): void {
    const radius = size / 2;
    const blurRadius = radius * (1 + blur);
    
    // Draw a soft circular snowflake with 6-point star pattern hint
    for (let dy = -blurRadius; dy <= blurRadius; dy++) {
      for (let dx = -blurRadius; dx <= blurRadius; dx++) {
        const px = Math.floor(cx + dx);
        const py = Math.floor(cy + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= blurRadius) {
            // Calculate angle for star pattern
            const angle = Math.atan2(dy, dx) + rotation;
            const starFactor = 0.8 + 0.2 * Math.cos(angle * 6);
            
            // Soft falloff
            let intensity = 1 - (dist / (radius * starFactor));
            intensity = Math.max(0, Math.min(1, intensity));
            
            // Apply blur falloff
            if (dist > radius) {
              intensity *= 1 - (dist - radius) / (blurRadius - radius);
            }
            
            const idx = (py * width + px) * 4;
            const alpha = intensity * opacity;
            
            // Additive blending for glow effect
            data[idx] = Math.min(255, data[idx] + color.r * alpha);
            data[idx + 1] = Math.min(255, data[idx + 1] + color.g * alpha);
            data[idx + 2] = Math.min(255, data[idx + 2] + color.b * alpha);
            data[idx + 3] = Math.min(255, Math.max(data[idx + 3], 255 * alpha));
          }
        }
      }
    }
  }
}
