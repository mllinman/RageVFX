/**
 * BloodSplatterNode - Generates realistic blood splatter and spray effects
 * Professional blood effects with particle systems, drips, splashes, and impact patterns
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface BloodParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  type: 'droplet' | 'spray' | 'splatter' | 'drip' | 'mist';
  viscosity: number;
  opacity: number;
  color: { r: number; g: number; b: number };
  trail: Array<{ x: number; y: number; size: number }>;
  pooled: boolean;
  dripStartY: number;
}

export class BloodSplatterNode extends Node {
  private time: number = 0;
  private particles: BloodParticle[] = [];
  private lastSpawnTime: number = 0;
  private pooledBlood: Array<{ x: number; y: number; radius: number; opacity: number }> = [];

  constructor(id: string) {
    super(id, 'BloodSplatter', 'Blood Splatter');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate realistic blood splatter and spray effects with drips, pools, and impact patterns';
    
    this.addInput('image', 'Background', DataType.IMAGE);
    this.addInput('trigger', 'Trigger', DataType.NUMBER);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Canvas size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Emission settings
    this.setParameter('emitterX', 0.5);
    this.setParameter('emitterY', 0.5);
    this.setParameter('emitterRadius', 0.02);
    this.setParameter('emissionMode', 'continuous'); // continuous, burst, impact
    this.setParameter('emissionRate', 100);
    this.setParameter('burstCount', 200);
    this.setParameter('impactForce', 1.0);
    
    // Particle properties
    this.setParameter('particleCount', 500);
    this.setParameter('particleSize', 8);
    this.setParameter('sizeVariation', 0.6);
    this.setParameter('minSize', 2);
    this.setParameter('maxSize', 20);
    
    // Velocity settings
    this.setParameter('speed', 300);
    this.setParameter('speedVariation', 0.7);
    this.setParameter('direction', -90); // degrees, -90 = up
    this.setParameter('spread', 90); // cone angle
    this.setParameter('directionVariation', 0.3);
    
    // Physics settings
    this.setParameter('gravity', 600);
    this.setParameter('gravityVariation', 0.1);
    this.setParameter('drag', 0.05);
    this.setParameter('viscosity', 0.8); // affects drag and pooling
    this.setParameter('viscosityVariation', 0.2);
    this.setParameter('bounce', false);
    this.setParameter('bounceFactor', 0.2);
    this.setParameter('wallCollision', true);
    
    // Lifetime settings
    this.setParameter('lifespan', 5.0);
    this.setParameter('lifespanVariation', 0.4);
    this.setParameter('fadeOut', true);
    this.setParameter('fadeStartRatio', 0.7);
    
    // Blood appearance
    this.setParameter('bloodColor', { r: 180, g: 0, b: 0 }); // dark red
    this.setParameter('bloodColorVariation', 0.15);
    this.setParameter('freshnessColor', { r: 220, g: 10, b: 10 }); // bright red
    this.setParameter('oldColor', { r: 100, g: 0, b: 0 }); // dark brown-red
    this.setParameter('opacity', 0.9);
    this.setParameter('opacityVariation', 0.2);
    
    // Splatter types
    this.setParameter('dropletRatio', 0.4);
    this.setParameter('sprayRatio', 0.3);
    this.setParameter('splatterRatio', 0.2);
    this.setParameter('dripRatio', 0.05);
    this.setParameter('mistRatio', 0.05);
    
    // Advanced effects
    this.setParameter('enableDrips', true);
    this.setParameter('dripThreshold', 0.6);
    this.setParameter('dripSpeed', 50);
    this.setParameter('dripLength', 30);
    this.setParameter('enablePooling', true);
    this.setParameter('poolingThreshold', 0.3);
    this.setParameter('poolRadius', 15);
    this.setParameter('poolGrowthRate', 0.5);
    
    // Trail settings
    this.setParameter('enableTrails', true);
    this.setParameter('trailLength', 8);
    this.setParameter('trailFadeRate', 0.8);
    
    // Impact splatter pattern
    this.setParameter('impactSprayAngle', 180);
    this.setParameter('impactRadialCount', 12);
    this.setParameter('impactStarburst', true);
    this.setParameter('impactSplatterCount', 20);
    
    // Texture and detail
    this.setParameter('addNoise', true);
    this.setParameter('noiseScale', 0.1);
    this.setParameter('noiseIntensity', 0.3);
    this.setParameter('edgeRoughness', 0.5);
    this.setParameter('coagulation', 0.3);
    
    // Motion blur
    this.setParameter('motionBlur', true);
    this.setParameter('motionBlurLength', 0.8);
    this.setParameter('motionBlurSamples', 5);
    
    // Advanced rendering
    this.setParameter('subsurfaceScattering', true);
    this.setParameter('sssIntensity', 0.3);
    this.setParameter('sssColor', { r: 255, g: 50, b: 50 });
    this.setParameter('specular', 0.2);
    this.setParameter('roughness', 0.8);
    
    // Performance
    this.setParameter('maxParticles', 1000);
    this.setParameter('culling', true);
    this.setParameter('cullMargin', 50);
    
    this.setParameter('seed', 42069);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const triggerInput = this.inputs.get('trigger');
    const output = this.outputs.get('image');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    const triggered = triggerInput?.value === 1;
    
    const width = inputImage?.width || this.getParameter('width');
    const height = inputImage?.height || this.getParameter('height');
    
    // Get all parameters
    const emitterX = this.getParameter('emitterX');
    const emitterY = this.getParameter('emitterY');
    const emitterRadius = this.getParameter('emitterRadius');
    const emissionMode = this.getParameter('emissionMode');
    const emissionRate = this.getParameter('emissionRate');
    const burstCount = this.getParameter('burstCount');
    const impactForce = this.getParameter('impactForce');
    const speed = this.getParameter('speed');
    const speedVariation = this.getParameter('speedVariation');
    const direction = this.getParameter('direction');
    const spread = this.getParameter('spread');
    const gravity = this.getParameter('gravity');
    const drag = this.getParameter('drag');
    const viscosity = this.getParameter('viscosity');
    const bounce = this.getParameter('bounce');
    const bounceFactor = this.getParameter('bounceFactor');
    const lifespan = this.getParameter('lifespan');
    const enableDrips = this.getParameter('enableDrips');
    const dripSpeed = this.getParameter('dripSpeed');
    const enablePooling = this.getParameter('enablePooling');
    const poolRadius = this.getParameter('poolRadius');
    const maxParticles = this.getParameter('maxParticles');
    const culling = this.getParameter('culling');
    const cullMargin = this.getParameter('cullMargin');
    
    const dt = 0.016;
    this.time += dt;
    
    // Emission logic
    if (emissionMode === 'burst' && triggered && this.particles.length === 0) {
      for (let i = 0; i < burstCount; i++) {
        this.spawnParticle(width, height);
      }
    } else if (emissionMode === 'impact' && triggered) {
      this.spawnImpactPattern(width, height);
    } else if (emissionMode === 'continuous') {
      const spawnInterval = 1 / emissionRate;
      while (this.time - this.lastSpawnTime >= spawnInterval && this.particles.length < maxParticles) {
        this.spawnParticle(width, height);
        this.lastSpawnTime += spawnInterval;
      }
    }
    
    // Update particles
    for (const p of this.particles) {
      if (p.pooled) continue;
      
      // Apply forces
      const dragForce = 1 - (drag * (1 + p.viscosity));
      p.vx *= Math.pow(dragForce, dt * 60);
      p.vy *= Math.pow(dragForce, dt * 60);
      p.vy += gravity * dt;
      
      // Store trail
      if (this.getParameter('enableTrails')) {
        p.trail.unshift({ x: p.x, y: p.y, size: p.size });
        const trailLength = this.getParameter('trailLength');
        if (p.trail.length > trailLength) {
          p.trail.pop();
        }
      }
      
      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Update rotation
      p.rotation += p.rotationSpeed * dt;
      
      // Collision detection
      if (bounce && p.y > height - p.size) {
        p.y = height - p.size;
        p.vy = -p.vy * bounceFactor;
        p.vx *= bounceFactor;
        p.rotationSpeed *= 0.5;
      }
      
      // Wall collision
      if (this.getParameter('wallCollision')) {
        if (p.x < p.size || p.x > width - p.size) {
          p.vx = -p.vx * 0.5;
          p.x = Math.max(p.size, Math.min(width - p.size, p.x));
        }
      }
      
      // Pooling check
      if (enablePooling && p.y >= height - p.size * 2 && Math.abs(p.vy) < 50) {
        p.pooled = true;
        const poolingThreshold = this.getParameter('poolingThreshold');
        if (Math.random() < poolingThreshold) {
          this.pooledBlood.push({
            x: p.x,
            y: height - 5,
            radius: poolRadius * (0.5 + Math.random() * 0.5),
            opacity: p.opacity * 0.8
          });
        }
      }
      
      // Drip generation
      if (enableDrips && p.type === 'splatter' && !p.pooled) {
        const dripThreshold = this.getParameter('dripThreshold');
        if (Math.abs(p.vy) < 20 && Math.random() < dripThreshold * dt) {
          this.spawnDrip(p.x, p.y, width, height);
        }
      }
      
      // Update life
      p.life -= dt;
    }
    
    // Remove dead particles
    this.particles = this.particles.filter(p => p.life > 0 || p.pooled);
    
    // Limit particles
    if (this.particles.length > maxParticles) {
      this.particles = this.particles.slice(0, maxParticles);
    }
    
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
    
    // Draw pooled blood first
    for (const pool of this.pooledBlood) {
      this.drawPool(outData, width, height, pool);
    }
    
    // Sort particles by size (back to front)
    const sortedParticles = [...this.particles].sort((a, b) => a.size - b.size);
    
    // Draw particles
    for (const p of sortedParticles) {
      if (culling) {
        if (p.x < -cullMargin || p.x > width + cullMargin ||
            p.y < -cullMargin || p.y > height + cullMargin) {
          continue;
        }
      }
      
      const lifeRatio = p.life / p.maxLife;
      let alpha = p.opacity;
      
      // Fade out
      if (this.getParameter('fadeOut')) {
        const fadeStartRatio = this.getParameter('fadeStartRatio');
        if (lifeRatio < fadeStartRatio) {
          alpha *= lifeRatio / fadeStartRatio;
        }
      }
      
      // Draw motion blur trail
      if (this.getParameter('motionBlur') && (Math.abs(p.vx) > 50 || Math.abs(p.vy) > 50)) {
        const motionBlurLength = this.getParameter('motionBlurLength');
        const motionBlurSamples = this.getParameter('motionBlurSamples');
        
        for (let s = motionBlurSamples; s > 0; s--) {
          const t = s / motionBlurSamples;
          const tx = p.x - p.vx * dt * t * motionBlurLength;
          const ty = p.y - p.vy * dt * t * motionBlurLength;
          const trailAlpha = alpha * (1 - t) * 0.4;
          const trailSize = p.size * (1 - t * 0.3);
          
          this.drawParticle(outData, width, height, tx, ty, trailSize, 
                           p.rotation, p.type, p.color, trailAlpha, lifeRatio);
        }
      }
      
      // Draw particle trails
      if (this.getParameter('enableTrails')) {
        const trailFadeRate = this.getParameter('trailFadeRate');
        for (let t = 0; t < p.trail.length; t++) {
          const trailPoint = p.trail[t];
          const trailFactor = Math.pow(1 - t / p.trail.length, trailFadeRate);
          this.drawParticle(outData, width, height, 
                           trailPoint.x, trailPoint.y, trailPoint.size * 0.7,
                           p.rotation, p.type, p.color, alpha * trailFactor * 0.5, lifeRatio);
        }
      }
      
      // Draw main particle
      this.drawParticle(outData, width, height, p.x, p.y, p.size, 
                       p.rotation, p.type, p.color, alpha, lifeRatio);
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private spawnParticle(width: number, height: number): void {
    const seed = this.getParameter('seed') + this.particles.length + this.time * 1000;
    
    const emitterX = this.getParameter('emitterX') * width;
    const emitterY = this.getParameter('emitterY') * height;
    const emitterRadius = this.getParameter('emitterRadius') * Math.min(width, height);
    
    // Position
    const angle = this.seededRandom(seed) * Math.PI * 2;
    const radius = this.seededRandom(seed + 1) * emitterRadius;
    const x = emitterX + Math.cos(angle) * radius;
    const y = emitterY + Math.sin(angle) * radius;
    
    // Velocity
    const direction = this.getParameter('direction') * Math.PI / 180;
    const spread = this.getParameter('spread') * Math.PI / 180;
    const directionVariation = this.getParameter('directionVariation');
    const velAngle = direction + (this.seededRandom(seed + 2) - 0.5) * spread + 
                     (this.seededRandom(seed + 3) - 0.5) * directionVariation * Math.PI;
    
    const speed = this.getParameter('speed');
    const speedVariation = this.getParameter('speedVariation');
    const spd = speed * (1 + (this.seededRandom(seed + 4) - 0.5) * speedVariation);
    
    const vx = Math.cos(velAngle) * spd;
    const vy = Math.sin(velAngle) * spd;
    
    // Size
    const particleSize = this.getParameter('particleSize');
    const sizeVariation = this.getParameter('sizeVariation');
    const minSize = this.getParameter('minSize');
    const maxSize = this.getParameter('maxSize');
    const size = Math.max(minSize, Math.min(maxSize, 
      particleSize * (1 + (this.seededRandom(seed + 5) - 0.5) * sizeVariation)));
    
    // Type
    const typeRand = this.seededRandom(seed + 6);
    const dropletRatio = this.getParameter('dropletRatio');
    const sprayRatio = this.getParameter('sprayRatio');
    const splatterRatio = this.getParameter('splatterRatio');
    const dripRatio = this.getParameter('dripRatio');
    
    let type: 'droplet' | 'spray' | 'splatter' | 'drip' | 'mist';
    const total = dropletRatio + sprayRatio + splatterRatio + dripRatio;
    const r1 = dropletRatio / total;
    const r2 = r1 + sprayRatio / total;
    const r3 = r2 + splatterRatio / total;
    const r4 = r3 + dripRatio / total;
    
    if (typeRand < r1) type = 'droplet';
    else if (typeRand < r2) type = 'spray';
    else if (typeRand < r3) type = 'splatter';
    else if (typeRand < r4) type = 'drip';
    else type = 'mist';
    
    // Properties
    const viscosity = this.getParameter('viscosity');
    const viscosityVariation = this.getParameter('viscosityVariation');
    const particleViscosity = Math.max(0, Math.min(1, 
      viscosity + (this.seededRandom(seed + 7) - 0.5) * viscosityVariation));
    
    const lifespan = this.getParameter('lifespan');
    const lifespanVariation = this.getParameter('lifespanVariation');
    const life = lifespan * (1 + (this.seededRandom(seed + 8) - 0.5) * lifespanVariation);
    
    // Color
    const bloodColor = this.getParameter('bloodColor');
    const bloodColorVariation = this.getParameter('bloodColorVariation');
    const color = {
      r: Math.max(0, Math.min(255, bloodColor.r + (this.seededRandom(seed + 9) - 0.5) * bloodColorVariation * 100)),
      g: Math.max(0, Math.min(255, bloodColor.g + (this.seededRandom(seed + 10) - 0.5) * bloodColorVariation * 50)),
      b: Math.max(0, Math.min(255, bloodColor.b + (this.seededRandom(seed + 11) - 0.5) * bloodColorVariation * 50))
    };
    
    const opacity = this.getParameter('opacity');
    const opacityVariation = this.getParameter('opacityVariation');
    const particleOpacity = Math.max(0, Math.min(1, 
      opacity + (this.seededRandom(seed + 12) - 0.5) * opacityVariation));
    
    this.particles.push({
      x, y, vx, vy,
      size,
      rotation: this.seededRandom(seed + 13) * 360,
      rotationSpeed: (this.seededRandom(seed + 14) - 0.5) * 360,
      life,
      maxLife: life,
      type,
      viscosity: particleViscosity,
      opacity: particleOpacity,
      color,
      trail: [],
      pooled: false,
      dripStartY: y
    });
  }

  private spawnImpactPattern(width: number, height: number): void {
    const emitterX = this.getParameter('emitterX') * width;
    const emitterY = this.getParameter('emitterY') * height;
    const impactForce = this.getParameter('impactForce');
    const impactSprayAngle = this.getParameter('impactSprayAngle') * Math.PI / 180;
    const impactRadialCount = this.getParameter('impactRadialCount');
    const impactSplatterCount = this.getParameter('impactSplatterCount');
    
    // Radial spray
    for (let i = 0; i < impactRadialCount; i++) {
      const angle = (i / impactRadialCount) * impactSprayAngle;
      const centerAngle = this.getParameter('direction') * Math.PI / 180;
      const finalAngle = centerAngle - impactSprayAngle / 2 + angle;
      
      for (let j = 0; j < 3; j++) {
        const angleVar = (Math.random() - 0.5) * 0.3;
        this.spawnDirectionalParticle(width, height, emitterX, emitterY, 
          finalAngle + angleVar, impactForce * (0.7 + Math.random() * 0.6));
      }
    }
    
    // Impact splatters
    for (let i = 0; i < impactSplatterCount; i++) {
      this.spawnParticle(width, height);
    }
  }

  private spawnDirectionalParticle(
    width: number, height: number, 
    x: number, y: number, 
    angle: number, 
    speedMultiplier: number
  ): void {
    const seed = this.getParameter('seed') + this.particles.length + this.time * 1000;
    const speed = this.getParameter('speed') * speedMultiplier;
    
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    const size = this.getParameter('particleSize') * (0.5 + Math.random() * 1.0);
    const lifespan = this.getParameter('lifespan');
    const bloodColor = this.getParameter('bloodColor');
    
    this.particles.push({
      x, y, vx, vy,
      size,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 360,
      life: lifespan,
      maxLife: lifespan,
      type: 'spray',
      viscosity: this.getParameter('viscosity'),
      opacity: this.getParameter('opacity'),
      color: bloodColor,
      trail: [],
      pooled: false,
      dripStartY: y
    });
  }

  private spawnDrip(x: number, y: number, width: number, height: number): void {
    const dripSpeed = this.getParameter('dripSpeed');
    const lifespan = this.getParameter('lifespan') * 2;
    const bloodColor = this.getParameter('bloodColor');
    
    this.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: dripSpeed,
      size: this.getParameter('particleSize') * 0.3,
      rotation: 0,
      rotationSpeed: 0,
      life: lifespan,
      maxLife: lifespan,
      type: 'drip',
      viscosity: this.getParameter('viscosity') * 1.5,
      opacity: this.getParameter('opacity') * 0.9,
      color: bloodColor,
      trail: [],
      pooled: false,
      dripStartY: y
    });
  }

  private drawParticle(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    size: number,
    rotation: number,
    type: string,
    color: { r: number; g: number; b: number },
    alpha: number,
    lifeRatio: number
  ): void {
    const halfSize = size / 2;
    const cos = Math.cos(rotation * Math.PI / 180);
    const sin = Math.sin(rotation * Math.PI / 180);
    
    const addNoise = this.getParameter('addNoise');
    const noiseScale = this.getParameter('noiseScale');
    const noiseIntensity = this.getParameter('noiseIntensity');
    const edgeRoughness = this.getParameter('edgeRoughness');
    const coagulation = this.getParameter('coagulation');
    
    // Color variation based on freshness
    const freshnessColor = this.getParameter('freshnessColor');
    const oldColor = this.getParameter('oldColor');
    const freshness = Math.pow(lifeRatio, 0.5);
    
    const finalColor = {
      r: oldColor.r + (freshnessColor.r - oldColor.r) * freshness,
      g: oldColor.g + (freshnessColor.g - oldColor.g) * freshness,
      b: oldColor.b + (freshnessColor.b - oldColor.b) * freshness
    };
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        
        const px = Math.floor(x + rx);
        const py = Math.floor(y + ry);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          let inside = false;
          let distFactor = 1.0;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          switch (type) {
            case 'droplet':
              inside = dist <= halfSize;
              distFactor = 1 - dist / halfSize;
              break;
            case 'spray':
              inside = dist <= halfSize * 0.8;
              distFactor = Math.pow(1 - dist / (halfSize * 0.8), 1.5);
              break;
            case 'splatter':
              const splatRadius = halfSize * (1 + Math.sin((dx + dy) * 0.5) * edgeRoughness * 0.3);
              inside = dist <= splatRadius;
              distFactor = 1 - dist / splatRadius;
              break;
            case 'drip':
              inside = Math.abs(dx) <= halfSize * 0.3 && dy >= -halfSize && dy <= halfSize * 2;
              distFactor = 1 - Math.abs(dx) / (halfSize * 0.3);
              break;
            case 'mist':
              inside = dist <= halfSize;
              distFactor = Math.pow(1 - dist / halfSize, 3);
              break;
          }
          
          if (inside) {
            // Add noise texture
            let noiseVal = 1.0;
            if (addNoise) {
              noiseVal = 0.5 + 0.5 * Math.sin(px * noiseScale + py * noiseScale + this.time);
              noiseVal = 1 - noiseIntensity + noiseIntensity * noiseVal;
            }
            
            // Coagulation effect
            if (coagulation > 0 && lifeRatio < 0.5) {
              const coagPattern = Math.sin(px * 0.3) * Math.cos(py * 0.3);
              noiseVal *= 1 - coagulation * (1 - lifeRatio * 2) * Math.max(0, coagPattern);
            }
            
            const idx = (py * width + px) * 4;
            const pixelAlpha = alpha * distFactor * noiseVal;
            
            // Subsurface scattering effect
            let finalR = finalColor.r;
            let finalG = finalColor.g;
            let finalB = finalColor.b;
            
            if (this.getParameter('subsurfaceScattering') && type !== 'mist') {
              const sssIntensity = this.getParameter('sssIntensity');
              const sssColor = this.getParameter('sssColor');
              const sssAmount = sssIntensity * (1 - distFactor) * 0.5;
              
              finalR = finalR * (1 - sssAmount) + sssColor.r * sssAmount;
              finalG = finalG * (1 - sssAmount) + sssColor.g * sssAmount;
              finalB = finalB * (1 - sssAmount) + sssColor.b * sssAmount;
            }
            
            // Alpha blend
            const srcAlpha = pixelAlpha;
            const dstAlpha = data[idx + 3] / 255;
            const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);
            
            if (outAlpha > 0) {
              data[idx] = (finalR * srcAlpha + data[idx] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 1] = (finalG * srcAlpha + data[idx + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 2] = (finalB * srcAlpha + data[idx + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 3] = Math.min(255, outAlpha * 255);
            }
          }
        }
      }
    }
  }

  private drawPool(
    data: Uint8Array,
    width: number,
    height: number,
    pool: { x: number; y: number; radius: number; opacity: number }
  ): void {
    const bloodColor = this.getParameter('bloodColor');
    const oldColor = this.getParameter('oldColor');
    
    // Pools are older, darker blood
    const poolColor = {
      r: oldColor.r * 0.8,
      g: oldColor.g * 0.8,
      b: oldColor.b * 0.8
    };
    
    for (let dy = -pool.radius; dy <= pool.radius; dy++) {
      for (let dx = -pool.radius; dx <= pool.radius; dx++) {
        const px = Math.floor(pool.x + dx);
        const py = Math.floor(pool.y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= pool.radius) {
            const distFactor = 1 - dist / pool.radius;
            const idx = (py * width + px) * 4;
            const pixelAlpha = pool.opacity * Math.pow(distFactor, 1.5);
            
            // Alpha blend
            const srcAlpha = pixelAlpha;
            const dstAlpha = data[idx + 3] / 255;
            const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);
            
            if (outAlpha > 0) {
              data[idx] = (poolColor.r * srcAlpha + data[idx] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 1] = (poolColor.g * srcAlpha + data[idx + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 2] = (poolColor.b * srcAlpha + data[idx + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 3] = Math.min(255, outAlpha * 255);
            }
          }
        }
      }
    }
  }
}
