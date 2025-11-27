/**
 * DebrisNode - Particle debris and destruction effects
 * Creates flying debris and particle effects for destruction scenes
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  color: { r: number; g: number; b: number };
  type: 'square' | 'triangle' | 'circle' | 'shard';
}

export class DebrisNode extends Node {
  private time: number = 0;
  private particles: DebrisParticle[] = [];
  private lastSpawnTime: number = 0;

  constructor(id: string) {
    super(id, 'Debris', 'Debris');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Create particle debris and destruction effects';
    
    this.addInput('image', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Emission
    this.setParameter('emitterX', 0.5);
    this.setParameter('emitterY', 0.5);
    this.setParameter('emitterRadius', 0.05);
    this.setParameter('emissionRate', 50);
    this.setParameter('burstMode', false);
    this.setParameter('burstCount', 100);
    
    // Particle properties
    this.setParameter('particleSize', 10);
    this.setParameter('sizeVariation', 0.5);
    this.setParameter('speed', 200);
    this.setParameter('speedVariation', 0.5);
    this.setParameter('direction', -90); // degrees, -90 = up
    this.setParameter('spread', 60); // degrees
    this.setParameter('lifespan', 2.0);
    this.setParameter('lifespanVariation', 0.3);
    
    // Physics
    this.setParameter('gravity', 400);
    this.setParameter('drag', 0.1);
    this.setParameter('rotationSpeed', 360);
    this.setParameter('bounce', false);
    this.setParameter('bounceFactor', 0.5);
    
    // Appearance
    this.setParameter('color1', { r: 100, g: 100, b: 100 });
    this.setParameter('color2', { r: 60, g: 60, b: 60 });
    this.setParameter('colorVariation', 0.2);
    this.setParameter('fadeOut', true);
    this.setParameter('shrink', true);
    
    // Motion blur
    this.setParameter('motionBlur', true);
    this.setParameter('motionBlurLength', 0.5);
    
    // Glow
    this.setParameter('glow', false);
    this.setParameter('glowColor', { r: 255, g: 150, b: 50 });
    this.setParameter('glowIntensity', 0.5);
    
    this.setParameter('seed', 12345);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    const emitterX = this.getParameter('emitterX');
    const emitterY = this.getParameter('emitterY');
    const emitterRadius = this.getParameter('emitterRadius');
    const emissionRate = this.getParameter('emissionRate');
    const burstMode = this.getParameter('burstMode');
    const burstCount = this.getParameter('burstCount');
    const particleSize = this.getParameter('particleSize');
    const sizeVariation = this.getParameter('sizeVariation');
    const speed = this.getParameter('speed');
    const speedVariation = this.getParameter('speedVariation');
    const direction = this.getParameter('direction');
    const spread = this.getParameter('spread');
    const lifespan = this.getParameter('lifespan');
    const lifespanVariation = this.getParameter('lifespanVariation');
    const gravity = this.getParameter('gravity');
    const drag = this.getParameter('drag');
    const rotationSpeed = this.getParameter('rotationSpeed');
    const bounce = this.getParameter('bounce');
    const bounceFactor = this.getParameter('bounceFactor');
    const color1 = this.getParameter('color1');
    const color2 = this.getParameter('color2');
    const colorVariation = this.getParameter('colorVariation');
    const fadeOut = this.getParameter('fadeOut');
    const shrink = this.getParameter('shrink');
    const motionBlur = this.getParameter('motionBlur');
    const motionBlurLength = this.getParameter('motionBlurLength');
    const glow = this.getParameter('glow');
    const glowColor = this.getParameter('glowColor');
    const glowIntensity = this.getParameter('glowIntensity');
    
    const dt = 0.016;
    this.time += dt;
    
    const width = inputImage?.width || this.getParameter('width');
    const height = inputImage?.height || this.getParameter('height');
    
    // Spawn new particles
    if (burstMode) {
      if (this.particles.length === 0) {
        for (let i = 0; i < burstCount; i++) {
          this.spawnParticle(width, height, emitterX, emitterY, emitterRadius, 
                            particleSize, sizeVariation, speed, speedVariation, 
                            direction, spread, lifespan, lifespanVariation, 
                            rotationSpeed, color1, color2, colorVariation);
        }
      }
    } else {
      const spawnInterval = 1 / emissionRate;
      while (this.time - this.lastSpawnTime >= spawnInterval) {
        this.spawnParticle(width, height, emitterX, emitterY, emitterRadius, 
                          particleSize, sizeVariation, speed, speedVariation, 
                          direction, spread, lifespan, lifespanVariation, 
                          rotationSpeed, color1, color2, colorVariation);
        this.lastSpawnTime += spawnInterval;
      }
    }
    
    // Update particles
    for (const p of this.particles) {
      // Apply gravity
      p.vy += gravity * dt;
      
      // Apply drag
      p.vx *= 1 - drag * dt;
      p.vy *= 1 - drag * dt;
      
      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Update rotation
      p.rotation += p.rotationSpeed * dt;
      
      // Update life
      p.life -= dt;
      
      // Bounce off bottom
      if (bounce && p.y > height - p.size) {
        p.y = height - p.size;
        p.vy = -p.vy * bounceFactor;
        p.vx *= bounceFactor;
      }
    }
    
    // Remove dead particles
    this.particles = this.particles.filter(p => p.life > 0);
    
    // Render
    const outData = new Uint8Array(width * height * 4);
    
    // Copy background
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
    
    // Draw particles (back to front)
    const sortedParticles = [...this.particles].sort((a, b) => a.size - b.size);
    
    for (const p of sortedParticles) {
      const lifeRatio = p.life / p.maxLife;
      
      // Calculate alpha and size based on life
      let alpha = 1.0;
      let currentSize = p.size;
      
      if (fadeOut) {
        alpha = lifeRatio;
      }
      
      if (shrink) {
        currentSize = p.size * lifeRatio;
      }
      
      // Draw glow
      if (glow) {
        this.drawGlow(outData, width, height, p.x, p.y, currentSize * 3, 
                      glowColor, glowIntensity * alpha);
      }
      
      // Draw motion blur trail
      if (motionBlur && (Math.abs(p.vx) > 10 || Math.abs(p.vy) > 10)) {
        const trailLength = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * motionBlurLength * dt * 10;
        const steps = Math.min(10, Math.ceil(trailLength / 5));
        
        for (let s = steps; s > 0; s--) {
          const t = s / steps;
          const tx = p.x - p.vx * dt * t * motionBlurLength;
          const ty = p.y - p.vy * dt * t * motionBlurLength;
          const trailAlpha = alpha * (1 - t) * 0.3;
          const trailSize = currentSize * (1 - t * 0.5);
          
          this.drawParticle(outData, width, height, tx, ty, trailSize, 
                           p.rotation, p.type, p.color, trailAlpha);
        }
      }
      
      // Draw particle
      this.drawParticle(outData, width, height, p.x, p.y, currentSize, 
                       p.rotation, p.type, p.color, alpha);
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private spawnParticle(
    width: number, height: number,
    emitterX: number, emitterY: number, emitterRadius: number,
    size: number, sizeVar: number,
    speed: number, speedVar: number,
    direction: number, spread: number,
    life: number, lifeVar: number,
    rotSpeed: number,
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number },
    colorVar: number
  ): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * emitterRadius * Math.min(width, height);
    
    const x = emitterX * width + Math.cos(angle) * radius;
    const y = emitterY * height + Math.sin(angle) * radius;
    
    const dirRad = (direction + (Math.random() - 0.5) * spread) * Math.PI / 180;
    const spd = speed * (1 + (Math.random() - 0.5) * speedVar);
    
    const vx = Math.cos(dirRad) * spd;
    const vy = Math.sin(dirRad) * spd;
    
    const particleLife = life * (1 + (Math.random() - 0.5) * lifeVar);
    const particleSize = size * (1 + (Math.random() - 0.5) * sizeVar);
    
    // Mix colors with variation
    const colorMix = Math.random();
    const colorJitter = (Math.random() - 0.5) * colorVar * 255;
    const color = {
      r: Math.max(0, Math.min(255, color1.r * (1 - colorMix) + color2.r * colorMix + colorJitter)),
      g: Math.max(0, Math.min(255, color1.g * (1 - colorMix) + color2.g * colorMix + colorJitter)),
      b: Math.max(0, Math.min(255, color1.b * (1 - colorMix) + color2.b * colorMix + colorJitter))
    };
    
    const types: Array<'square' | 'triangle' | 'circle' | 'shard'> = ['square', 'triangle', 'circle', 'shard'];
    
    this.particles.push({
      x, y, vx, vy,
      size: particleSize,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * rotSpeed,
      life: particleLife,
      maxLife: particleLife,
      color,
      type: types[Math.floor(Math.random() * types.length)]
    });
  }

  private drawParticle(
    data: Uint8Array, width: number, height: number,
    x: number, y: number, size: number, rotation: number,
    type: string, color: { r: number; g: number; b: number }, alpha: number
  ): void {
    const halfSize = size / 2;
    const cos = Math.cos(rotation * Math.PI / 180);
    const sin = Math.sin(rotation * Math.PI / 180);
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        // Rotate point
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        
        const px = Math.floor(x + rx);
        const py = Math.floor(y + ry);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          let inside = false;
          
          switch (type) {
            case 'square':
              inside = Math.abs(dx) <= halfSize * 0.8 && Math.abs(dy) <= halfSize * 0.8;
              break;
            case 'circle':
              inside = dx * dx + dy * dy <= halfSize * halfSize;
              break;
            case 'triangle':
              inside = dy >= -halfSize * 0.5 && 
                      dy <= halfSize * 0.8 - Math.abs(dx) * 1.3;
              break;
            case 'shard':
              inside = Math.abs(dx) <= halfSize * (1 - Math.abs(dy) / halfSize) * 0.5;
              break;
          }
          
          if (inside) {
            const idx = (py * width + px) * 4;
            data[idx] = Math.min(255, data[idx] * (1 - alpha) + color.r * alpha);
            data[idx + 1] = Math.min(255, data[idx + 1] * (1 - alpha) + color.g * alpha);
            data[idx + 2] = Math.min(255, data[idx + 2] * (1 - alpha) + color.b * alpha);
          }
        }
      }
    }
  }

  private drawGlow(
    data: Uint8Array, width: number, height: number,
    x: number, y: number, radius: number,
    color: { r: number; g: number; b: number }, intensity: number
  ): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const falloff = Math.pow(1 - dist / radius, 2) * intensity;
            const idx = (py * width + px) * 4;
            
            data[idx] = Math.min(255, data[idx] + color.r * falloff);
            data[idx + 1] = Math.min(255, data[idx + 1] + color.g * falloff);
            data[idx + 2] = Math.min(255, data[idx + 2] + color.b * falloff);
          }
        }
      }
    }
  }
}
