/**
 * MagicParticlesNode - Magical sparkles and fairy dust particle effects
 * Version 3.4 - Advanced VFX
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  brightness: number;
  trail: { x: number; y: number }[];
}

export class MagicParticlesNode extends Node {
  private particles: Particle[] = [];
  private time: number = 0;

  constructor(id: string) {
    super(id, 'MagicParticles', 'MagicParticles');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate magical sparkles and fairy dust particle effects';
    
    this.addInput('mask', 'Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('particleCount', 500);
    this.setParameter('emissionRate', 20);
    this.setParameter('particleLife', 2.0);
    this.setParameter('particleSize', 4);
    this.setParameter('sizeVariation', 0.5);
    this.setParameter('speed', 50);
    this.setParameter('gravity', -20); // Negative for rising particles
    this.setParameter('spread', 360);
    this.setParameter('hueRange', { min: 180, max: 300 }); // Purple to cyan
    this.setParameter('brightness', 1.5);
    this.setParameter('trailLength', 8);
    this.setParameter('twinkle', true);
    this.setParameter('twinkleSpeed', 10);
    this.setParameter('glowRadius', 12);
    this.setParameter('seed', 42);
    this.setParameter('emitterX', 0.5); // Normalized position
    this.setParameter('emitterY', 0.5);
    this.setParameter('emitterWidth', 0.2);
    this.setParameter('emitterHeight', 0.1);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const particleCount = this.getParameter('particleCount');
    const emissionRate = this.getParameter('emissionRate');
    const particleLife = this.getParameter('particleLife');
    const baseSize = this.getParameter('particleSize');
    const sizeVariation = this.getParameter('sizeVariation');
    const speed = this.getParameter('speed');
    const gravity = this.getParameter('gravity');
    const spread = this.getParameter('spread');
    const hueRange = this.getParameter('hueRange');
    const brightness = this.getParameter('brightness');
    const trailLength = this.getParameter('trailLength');
    const twinkle = this.getParameter('twinkle');
    const twinkleSpeed = this.getParameter('twinkleSpeed');
    const glowRadius = this.getParameter('glowRadius');
    const seed = this.getParameter('seed');
    const emitterX = this.getParameter('emitterX');
    const emitterY = this.getParameter('emitterY');
    const emitterWidth = this.getParameter('emitterWidth');
    const emitterHeight = this.getParameter('emitterHeight');
    
    this.time += 0.016;
    
    const data = new Uint8Array(width * height * 4);
    
    // Emit new particles
    for (let i = 0; i < emissionRate && this.particles.length < particleCount; i++) {
      const angle = (this.seededRandom(seed + this.time * 1000 + i) * spread - spread / 2) * Math.PI / 180;
      const spd = speed * (0.5 + this.seededRandom(seed + i * 2) * 0.5);
      
      this.particles.push({
        x: (emitterX + (this.seededRandom(seed + i * 3) - 0.5) * emitterWidth) * width,
        y: (emitterY + (this.seededRandom(seed + i * 4) - 0.5) * emitterHeight) * height,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: particleLife,
        maxLife: particleLife,
        size: baseSize * (1 + (this.seededRandom(seed + i * 5) - 0.5) * sizeVariation),
        hue: hueRange.min + this.seededRandom(seed + i * 6) * (hueRange.max - hueRange.min),
        brightness: 0.7 + this.seededRandom(seed + i * 7) * 0.3,
        trail: []
      });
    }
    
    // Update and render particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Store trail position
      if (trailLength > 0) {
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > trailLength) {
          p.trail.pop();
        }
      }
      
      // Update physics
      p.vy += gravity * 0.016;
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.life -= 0.016;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Calculate alpha based on life
      const lifeRatio = p.life / p.maxLife;
      let alpha = lifeRatio;
      
      // Fade in at start, fade out at end
      if (lifeRatio > 0.8) {
        alpha = (1 - lifeRatio) * 5;
      } else if (lifeRatio < 0.2) {
        alpha = lifeRatio * 5;
      } else {
        alpha = 1;
      }
      
      // Twinkle effect
      if (twinkle) {
        const twinkleFactor = 0.5 + 0.5 * Math.sin(this.time * twinkleSpeed + i * 2);
        alpha *= 0.5 + twinkleFactor * 0.5;
      }
      
      // Convert HSL to RGB
      const rgb = this.hslToRgb(p.hue / 360, 1, 0.5 + alpha * 0.3);
      
      // Draw trail
      for (let t = 0; t < p.trail.length; t++) {
        const trailAlpha = alpha * (1 - t / p.trail.length) * 0.5;
        const trailSize = p.size * (1 - t / p.trail.length * 0.5);
        this.drawGlow(data, width, height, p.trail[t].x, p.trail[t].y, trailSize, glowRadius * 0.5, rgb, trailAlpha * brightness);
      }
      
      // Draw main particle with glow
      this.drawGlow(data, width, height, p.x, p.y, p.size, glowRadius, rgb, alpha * brightness * p.brightness);
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

  private drawGlow(
    data: Uint8Array, 
    width: number, 
    height: number, 
    cx: number, 
    cy: number, 
    coreSize: number, 
    glowRadius: number, 
    rgb: { r: number; g: number; b: number }, 
    alpha: number
  ): void {
    const radius = coreSize + glowRadius;
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        
        if (dist > radius) continue;
        
        let intensity: number;
        if (dist < coreSize) {
          intensity = 1;
        } else {
          intensity = 1 - (dist - coreSize) / glowRadius;
          intensity = Math.pow(intensity, 2); // Smoother falloff
        }
        
        intensity *= alpha;
        
        const idx = (y * width + x) * 4;
        
        // Additive blending
        data[idx] = Math.min(255, data[idx] + rgb.r * intensity);
        data[idx + 1] = Math.min(255, data[idx + 1] + rgb.g * intensity);
        data[idx + 2] = Math.min(255, data[idx + 2] + rgb.b * intensity);
        data[idx + 3] = Math.min(255, data[idx + 3] + 255 * intensity);
      }
    }
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
}
