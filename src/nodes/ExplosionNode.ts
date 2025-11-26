/**
 * ExplosionNode - Generates procedural explosion effects
 */

import { Node, DataType } from '../core/Node';

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'fire' | 'smoke' | 'spark' | 'debris';
}

export class ExplosionNode extends Node {
  private time: number = 0;
  private particles: ExplosionParticle[] = [];
  private exploded: boolean = false;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Explosion', 'Explosion');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate procedural explosion effects';
    
    this.addInput('trigger', 'Trigger', DataType.NUMBER);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
    this.setParameter('intensity', 1.0);
    this.setParameter('scale', 1.0);
    this.setParameter('particleCount', 200);
    this.setParameter('fireColor', { r: 255, g: 150, b: 50 });
    this.setParameter('smokeColor', { r: 50, g: 50, b: 50 });
    this.setParameter('sparkColor', { r: 255, g: 255, b: 200 });
    this.setParameter('duration', 2.0);
    this.setParameter('gravity', 0.5);
    this.setParameter('autoTrigger', true);
    this.setParameter('loop', true);
    this.setParameter('seed', 77777);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 77777;
    this.permutation = [];
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = Math.floor(this.seededRandom(seed + i) * 256);
    }
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private initExplosion(): void {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const centerX = this.getParameter('centerX') * width;
    const centerY = this.getParameter('centerY') * height;
    const particleCount = this.getParameter('particleCount');
    const scale = this.getParameter('scale');
    const intensity = this.getParameter('intensity');
    const duration = this.getParameter('duration');
    const seed = this.getParameter('seed');
    
    this.particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = this.seededRandom(seed + i) * Math.PI * 2;
      const speed = (0.5 + this.seededRandom(seed + i + 1000) * 0.5) * intensity * 10 * scale;
      const typeRand = this.seededRandom(seed + i + 2000);
      
      let type: 'fire' | 'smoke' | 'spark' | 'debris';
      if (typeRand < 0.4) type = 'fire';
      else if (typeRand < 0.7) type = 'smoke';
      else if (typeRand < 0.9) type = 'spark';
      else type = 'debris';
      
      const lifeMultiplier = type === 'smoke' ? 2 : type === 'spark' ? 0.5 : 1;
      
      this.particles.push({
        x: centerX + (this.seededRandom(seed + i + 3000) - 0.5) * 20 * scale,
        y: centerY + (this.seededRandom(seed + i + 4000) - 0.5) * 20 * scale,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'smoke' ? 2 : 0),
        life: duration * lifeMultiplier,
        maxLife: duration * lifeMultiplier,
        size: (5 + this.seededRandom(seed + i + 5000) * 15) * scale * (type === 'spark' ? 0.3 : 1),
        type
      });
    }
    
    this.exploded = true;
    this.time = 0;
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const autoTrigger = this.getParameter('autoTrigger');
    const loop = this.getParameter('loop');
    const gravity = this.getParameter('gravity');
    const fireColor = this.getParameter('fireColor');
    const smokeColor = this.getParameter('smokeColor');
    const sparkColor = this.getParameter('sparkColor');
    
    // Check trigger
    const triggerInput = this.inputs.get('trigger');
    const triggered = triggerInput?.value === 1 || (autoTrigger && !this.exploded);
    
    if (triggered && !this.exploded) {
      this.initExplosion();
    }
    
    // Reset if looping
    if (loop && this.exploded && this.particles.every(p => p.life <= 0)) {
      this.exploded = false;
    }
    
    this.time += 0.016;
    
    const data = new Uint8Array(width * height * 4);
    data.fill(0);
    
    // Update and render particles
    for (const particle of this.particles) {
      if (particle.life <= 0) continue;
      
      // Update physics
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += gravity * (particle.type === 'smoke' ? -0.5 : 1);
      
      // Apply drag
      const drag = particle.type === 'smoke' ? 0.98 : 0.99;
      particle.vx *= drag;
      particle.vy *= drag;
      
      particle.life -= 0.016;
      
      // Calculate life factor
      const lifeFactor = Math.max(0, particle.life / particle.maxLife);
      
      // Get color based on type
      let color: { r: number; g: number; b: number };
      let alpha: number;
      
      switch (particle.type) {
        case 'fire':
          // Fire transitions from bright to darker
          color = {
            r: fireColor.r,
            g: fireColor.g * lifeFactor,
            b: fireColor.b * lifeFactor * lifeFactor
          };
          alpha = lifeFactor;
          break;
        case 'smoke':
          color = smokeColor;
          alpha = lifeFactor * 0.5;
          break;
        case 'spark':
          color = sparkColor;
          alpha = lifeFactor;
          break;
        case 'debris':
          color = { r: 100, g: 80, b: 60 };
          alpha = lifeFactor;
          break;
        default:
          color = fireColor;
          alpha = lifeFactor;
      }
      
      // Draw particle
      this.drawParticle(data, width, height, particle, color, alpha, lifeFactor);
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

  private drawParticle(
    data: Uint8Array,
    width: number,
    height: number,
    particle: ExplosionParticle,
    color: { r: number; g: number; b: number },
    alpha: number,
    lifeFactor: number
  ): void {
    const size = particle.size * (particle.type === 'smoke' ? (2 - lifeFactor) : lifeFactor);
    const radius = Math.max(1, Math.floor(size / 2));
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(particle.x + dx);
        const py = Math.floor(particle.y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= radius) {
            const idx = (py * width + px) * 4;
            let intensity = 1 - dist / radius;
            
            // Add noise for fire/smoke
            if (particle.type === 'fire' || particle.type === 'smoke') {
              const noiseVal = this.simpleNoise(px * 0.1, py * 0.1, this.time * 5);
              intensity *= 0.7 + noiseVal * 0.3;
            }
            
            const pixelAlpha = intensity * alpha;
            
            // Additive blending for fire/sparks
            if (particle.type === 'fire' || particle.type === 'spark') {
              data[idx] = Math.min(255, data[idx] + color.r * pixelAlpha);
              data[idx + 1] = Math.min(255, data[idx + 1] + color.g * pixelAlpha);
              data[idx + 2] = Math.min(255, data[idx + 2] + color.b * pixelAlpha);
            } else {
              // Alpha blending for smoke/debris
              const srcAlpha = pixelAlpha;
              const dstAlpha = data[idx + 3] / 255;
              const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);
              
              if (outAlpha > 0) {
                data[idx] = (color.r * srcAlpha + data[idx] * dstAlpha * (1 - srcAlpha)) / outAlpha;
                data[idx + 1] = (color.g * srcAlpha + data[idx + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
                data[idx + 2] = (color.b * srcAlpha + data[idx + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              }
            }
            
            data[idx + 3] = Math.min(255, Math.max(data[idx + 3], pixelAlpha * 255));
          }
        }
      }
    }
  }

  private simpleNoise(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    
    const hash = this.permutation[(this.permutation[(this.permutation[xi] + yi) & 255] + zi) & 255];
    return (hash / 255) * 2 - 1;
  }
}
