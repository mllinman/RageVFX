/**
 * ParticleSystemNode - Advanced particle system for VFX
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
  color: { r: number; g: number; b: number; a: number };
}

export class ParticleSystemNode extends Node {
  private particles: Particle[] = [];
  private time: number = 0;

  constructor(id: string) {
    super(id, 'ParticleSystem', 'Particle System');
    this.metadata.category = 'Particles';
    this.metadata.description = 'Advanced particle system';
    this.metadata.version = '1.1.0';
    
    this.addInput('emitter', 'Emitter', DataType.VECTOR);
    this.addInput('forces', 'Forces', DataType.PARTICLES);
    this.addOutput('particles', 'Particles', DataType.PARTICLES);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('maxParticles', 10000);
    this.setParameter('emissionRate', 100);
    this.setParameter('particleLife', 2.0);
    this.setParameter('particleSize', 3.0);
    this.setParameter('velocityMin', { x: -50, y: -100 });
    this.setParameter('velocityMax', { x: 50, y: -200 });
    this.setParameter('gravity', { x: 0, y: 100 });
    this.setParameter('colorStart', { r: 255, g: 255, b: 255, a: 255 });
    this.setParameter('colorEnd', { r: 255, g: 255, b: 255, a: 0 });
    this.setParameter('blendMode', 'add'); // add, normal, multiply
  }

  async process(): Promise<void> {
    const deltaTime = 0.016; // Default 60fps, TODO: Make configurable or calculate from actual frame time
    this.time += deltaTime;

    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const maxParticles = this.getParameter('maxParticles');
    const emissionRate = this.getParameter('emissionRate');
    const particleLife = this.getParameter('particleLife');
    const particleSize = this.getParameter('particleSize');
    const velocityMin = this.getParameter('velocityMin');
    const velocityMax = this.getParameter('velocityMax');
    const gravity = this.getParameter('gravity');
    const colorStart = this.getParameter('colorStart');
    const colorEnd = this.getParameter('colorEnd');

    // Emit new particles
    const particlesToEmit = Math.floor(emissionRate * deltaTime);
    for (let i = 0; i < particlesToEmit && this.particles.length < maxParticles; i++) {
      this.particles.push({
        x: width / 2,
        y: height / 2,
        vx: velocityMin.x + Math.random() * (velocityMax.x - velocityMin.x),
        vy: velocityMin.y + Math.random() * (velocityMax.y - velocityMin.y),
        life: particleLife,
        maxLife: particleLife,
        size: particleSize,
        color: { ...colorStart }
      });
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.life -= deltaTime;
      if (p.life <= 0) return false;

      p.vx += gravity.x * deltaTime;
      p.vy += gravity.y * deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      // Interpolate color
      const t = 1 - (p.life / p.maxLife);
      p.color.r = colorStart.r + (colorEnd.r - colorStart.r) * t;
      p.color.g = colorStart.g + (colorEnd.g - colorStart.g) * t;
      p.color.b = colorStart.b + (colorEnd.b - colorStart.b) * t;
      p.color.a = colorStart.a + (colorEnd.a - colorStart.a) * t;

      return true;
    });

    // Render particles to image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      
      for (const particle of this.particles) {
        ctx.globalAlpha = particle.color.a / 255;
        ctx.fillStyle = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particlesOutput = this.outputs.get('particles');
    if (particlesOutput) {
      particlesOutput.value = this.particles;
    }

    const imageOutput = this.outputs.get('image');
    if (imageOutput) {
      imageOutput.value = canvas;
    }
  }
}
