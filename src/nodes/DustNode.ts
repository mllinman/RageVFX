/**
 * DustNode - Generates realistic dust and particle effects
 * Professional dust effects with various types: ambient, kicked-up, impact, wind-blown, settling
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface DustParticle {
  x: number;
  y: number;
  z: number; // depth for parallax
  vx: number;
  vy: number;
  vz: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  type: 'mote' | 'clump' | 'wisp' | 'cloud' | 'fine';
  density: number;
  opacity: number;
  color: { r: number; g: number; b: number };
  illumination: number;
  turbulence: { x: number; y: number; phase: number };
}

export class DustNode extends Node {
  private time: number = 0;
  private particles: DustParticle[] = [];
  private lastSpawnTime: number = 0;
  private windPhase: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Dust', 'Dust');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate realistic dust and particle effects with ambient, impact, wind, and volumetric simulation';
    
    this.addInput('image', 'Background', DataType.IMAGE);
    this.addInput('trigger', 'Trigger', DataType.NUMBER);
    this.addInput('windForce', 'Wind Force', DataType.NUMBER);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Canvas size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Emission mode
    this.setParameter('emissionMode', 'continuous'); // continuous, burst, impact, ambient
    this.setParameter('emitterType', 'point'); // point, line, area, volume
    this.setParameter('emitterX', 0.5);
    this.setParameter('emitterY', 0.8);
    this.setParameter('emitterWidth', 0.3);
    this.setParameter('emitterHeight', 0.2);
    this.setParameter('emissionRate', 150);
    this.setParameter('burstCount', 300);
    this.setParameter('burstIntensity', 1.5);
    
    // Particle properties
    this.setParameter('particleCount', 1000);
    this.setParameter('particleSize', 4);
    this.setParameter('sizeVariation', 0.8);
    this.setParameter('minSize', 1);
    this.setParameter('maxSize', 15);
    this.setParameter('sizeByDepth', true);
    this.setParameter('depthScale', 0.5);
    
    // Velocity settings
    this.setParameter('initialSpeed', 80);
    this.setParameter('speedVariation', 0.7);
    this.setParameter('direction', -90); // degrees, -90 = up
    this.setParameter('spread', 120); // cone angle
    this.setParameter('velocityInheritance', 0.3);
    
    // Physics and motion
    this.setParameter('gravity', 50);
    this.setParameter('gravityVariation', 0.3);
    this.setParameter('drag', 0.95);
    this.setParameter('dragBySize', true);
    this.setParameter('airResistance', 0.02);
    this.setParameter('brownianMotion', 0.5);
    this.setParameter('turbulence', 0.8);
    this.setParameter('turbulenceScale', 0.1);
    this.setParameter('turbulenceSpeed', 1.0);
    
    // Wind effects
    this.setParameter('enableWind', true);
    this.setParameter('windSpeed', 30);
    this.setParameter('windDirection', 0); // degrees
    this.setParameter('windVariation', 0.4);
    this.setParameter('windGustiness', 0.6);
    this.setParameter('windGustFrequency', 0.5);
    this.setParameter('windAffectBySize', true);
    
    // Settling behavior
    this.setParameter('enableSettling', true);
    this.setParameter('settlingSpeed', 20);
    this.setParameter('settlingThreshold', 0.9); // height ratio
    this.setParameter('groundLevel', 0.95);
    this.setParameter('resuspension', true);
    this.setParameter('resuspensionChance', 0.1);
    
    // Lifetime settings
    this.setParameter('lifespan', 8.0);
    this.setParameter('lifespanVariation', 0.5);
    this.setParameter('fadeIn', true);
    this.setParameter('fadeInDuration', 0.2);
    this.setParameter('fadeOut', true);
    this.setParameter('fadeOutDuration', 2.0);
    
    // Appearance
    this.setParameter('dustColor', { r: 200, g: 180, b: 150 }); // tan/beige
    this.setParameter('dustColorVariation', 0.2);
    this.setParameter('opacity', 0.6);
    this.setParameter('opacityVariation', 0.3);
    this.setParameter('opacityByDepth', true);
    this.setParameter('depthOpacityFactor', 0.7);
    
    // Particle type distribution
    this.setParameter('moteRatio', 0.5); // small specks
    this.setParameter('clumpRatio', 0.2); // larger clumps
    this.setParameter('wispRatio', 0.15); // elongated wisps
    this.setParameter('cloudRatio', 0.1); // diffuse clouds
    this.setParameter('fineRatio', 0.05); // very fine particles
    
    // Lighting and depth
    this.setParameter('enableLighting', true);
    this.setParameter('lightDirection', 45); // degrees
    this.setParameter('lightElevation', 30); // degrees
    this.setParameter('ambientLight', 0.4);
    this.setParameter('diffuseLight', 0.6);
    this.setParameter('backlight', 0.3);
    this.setParameter('backlightColor', { r: 255, g: 240, b: 200 });
    
    // Volumetric rendering
    this.setParameter('enableVolumetric', true);
    this.setParameter('volumetricDensity', 0.5);
    this.setParameter('volumetricScattering', 0.7);
    this.setParameter('volumetricDepthLayers', 5);
    this.setParameter('volumetricFalloff', 2.0);
    
    // Advanced effects
    this.setParameter('enableBlur', true);
    this.setParameter('motionBlur', true);
    this.setParameter('motionBlurLength', 0.4);
    this.setParameter('depthOfField', true);
    this.setParameter('dofFocalDepth', 0.5);
    this.setParameter('dofAmount', 0.3);
    
    // Texture and detail
    this.setParameter('particleTexture', 'soft'); // soft, hard, wispy, clumpy
    this.setParameter('textureDetail', 0.5);
    this.setParameter('addNoise', true);
    this.setParameter('noiseScale', 0.2);
    this.setParameter('noiseIntensity', 0.4);
    this.setParameter('edgeSoftness', 0.7);
    
    // Interaction
    this.setParameter('groundInteraction', true);
    this.setParameter('groundPuffing', true);
    this.setParameter('puffRadius', 30);
    this.setParameter('puffIntensity', 0.8);
    
    // Performance
    this.setParameter('maxParticles', 2000);
    this.setParameter('culling', true);
    this.setParameter('cullMargin', 100);
    this.setParameter('lodEnabled', true);
    this.setParameter('lodDistance', 500);
    
    this.setParameter('seed', 13579);
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 13579;
    this.permutation = [];
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = Math.floor(this.seededRandom(seed + i) * 256);
    }
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const triggerInput = this.inputs.get('trigger');
    const windForceInput = this.inputs.get('windForce');
    const output = this.outputs.get('image');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    const triggered = triggerInput?.value === 1;
    const externalWindForce = (windForceInput?.value as number) || 0;
    
    const width = inputImage?.width || this.getParameter('width');
    const height = inputImage?.height || this.getParameter('height');
    
    const dt = 0.016;
    this.time += dt;
    this.windPhase += dt * this.getParameter('windGustFrequency');
    
    // Get parameters
    const emissionMode = this.getParameter('emissionMode');
    const emissionRate = this.getParameter('emissionRate');
    const burstCount = this.getParameter('burstCount');
    const maxParticles = this.getParameter('maxParticles');
    
    // Emission logic
    if (emissionMode === 'burst' && triggered && this.particles.length < burstCount) {
      for (let i = 0; i < burstCount; i++) {
        this.spawnParticle(width, height);
      }
    } else if (emissionMode === 'impact' && triggered) {
      this.spawnImpactDust(width, height);
    } else if (emissionMode === 'continuous' || emissionMode === 'ambient') {
      const spawnInterval = 1 / emissionRate;
      while (this.time - this.lastSpawnTime >= spawnInterval && this.particles.length < maxParticles) {
        this.spawnParticle(width, height);
        this.lastSpawnTime += spawnInterval;
      }
    }
    
    // Update particles
    this.updateParticles(width, height, dt, externalWindForce);
    
    // Remove dead particles
    this.particles = this.particles.filter(p => p.life > 0);
    
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
    
    // Sort particles by depth (back to front)
    const sortedParticles = [...this.particles].sort((a, b) => b.z - a.z);
    
    // Render particles
    for (const p of sortedParticles) {
      if (this.getParameter('culling')) {
        const cullMargin = this.getParameter('cullMargin');
        if (p.x < -cullMargin || p.x > width + cullMargin ||
            p.y < -cullMargin || p.y > height + cullMargin) {
          continue;
        }
      }
      
      this.renderParticle(outData, width, height, p);
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
    
    const emitterType = this.getParameter('emitterType');
    const emitterX = this.getParameter('emitterX');
    const emitterY = this.getParameter('emitterY');
    const emitterWidth = this.getParameter('emitterWidth');
    const emitterHeight = this.getParameter('emitterHeight');
    
    // Position
    let x, y;
    switch (emitterType) {
      case 'point':
        x = emitterX * width;
        y = emitterY * height;
        break;
      case 'line':
        x = (emitterX + (this.seededRandom(seed) - 0.5) * emitterWidth) * width;
        y = emitterY * height;
        break;
      case 'area':
        x = (emitterX + (this.seededRandom(seed) - 0.5) * emitterWidth) * width;
        y = (emitterY + (this.seededRandom(seed + 1) - 0.5) * emitterHeight) * height;
        break;
      case 'volume':
      default:
        x = (emitterX + (this.seededRandom(seed) - 0.5) * emitterWidth) * width;
        y = (emitterY + (this.seededRandom(seed + 1) - 0.5) * emitterHeight) * height;
        break;
    }
    
    const z = this.seededRandom(seed + 2); // depth 0-1
    
    // Velocity
    const direction = this.getParameter('direction') * Math.PI / 180;
    const spread = this.getParameter('spread') * Math.PI / 180;
    const initialSpeed = this.getParameter('initialSpeed');
    const speedVariation = this.getParameter('speedVariation');
    
    const angle = direction + (this.seededRandom(seed + 3) - 0.5) * spread;
    const speed = initialSpeed * (1 + (this.seededRandom(seed + 4) - 0.5) * speedVariation);
    
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const vz = (this.seededRandom(seed + 5) - 0.5) * speed * 0.3;
    
    // Size
    const particleSize = this.getParameter('particleSize');
    const sizeVariation = this.getParameter('sizeVariation');
    const minSize = this.getParameter('minSize');
    const maxSize = this.getParameter('maxSize');
    const size = Math.max(minSize, Math.min(maxSize,
      particleSize * (1 + (this.seededRandom(seed + 6) - 0.5) * sizeVariation)));
    
    // Type
    const typeRand = this.seededRandom(seed + 7);
    const moteRatio = this.getParameter('moteRatio');
    const clumpRatio = this.getParameter('clumpRatio');
    const wispRatio = this.getParameter('wispRatio');
    const cloudRatio = this.getParameter('cloudRatio');
    
    let type: 'mote' | 'clump' | 'wisp' | 'cloud' | 'fine';
    const total = moteRatio + clumpRatio + wispRatio + cloudRatio;
    const r1 = moteRatio / total;
    const r2 = r1 + clumpRatio / total;
    const r3 = r2 + wispRatio / total;
    const r4 = r3 + cloudRatio / total;
    
    if (typeRand < r1) type = 'mote';
    else if (typeRand < r2) type = 'clump';
    else if (typeRand < r3) type = 'wisp';
    else if (typeRand < r4) type = 'cloud';
    else type = 'fine';
    
    // Properties
    const lifespan = this.getParameter('lifespan');
    const lifespanVariation = this.getParameter('lifespanVariation');
    const life = lifespan * (1 + (this.seededRandom(seed + 8) - 0.5) * lifespanVariation);
    
    const dustColor = this.getParameter('dustColor');
    const dustColorVariation = this.getParameter('dustColorVariation');
    const color = {
      r: Math.max(0, Math.min(255, dustColor.r + (this.seededRandom(seed + 9) - 0.5) * dustColorVariation * 100)),
      g: Math.max(0, Math.min(255, dustColor.g + (this.seededRandom(seed + 10) - 0.5) * dustColorVariation * 100)),
      b: Math.max(0, Math.min(255, dustColor.b + (this.seededRandom(seed + 11) - 0.5) * dustColorVariation * 100))
    };
    
    const opacity = this.getParameter('opacity');
    const opacityVariation = this.getParameter('opacityVariation');
    const particleOpacity = Math.max(0, Math.min(1,
      opacity + (this.seededRandom(seed + 12) - 0.5) * opacityVariation));
    
    this.particles.push({
      x, y, z, vx, vy, vz,
      size,
      rotation: this.seededRandom(seed + 13) * 360,
      rotationSpeed: (this.seededRandom(seed + 14) - 0.5) * 30,
      life,
      maxLife: life,
      type,
      density: 0.5 + this.seededRandom(seed + 15) * 0.5,
      opacity: particleOpacity,
      color,
      illumination: 1.0,
      turbulence: {
        x: this.seededRandom(seed + 16) * 1000,
        y: this.seededRandom(seed + 17) * 1000,
        phase: this.seededRandom(seed + 18) * Math.PI * 2
      }
    });
  }

  private spawnImpactDust(width: number, height: number): void {
    const burstCount = this.getParameter('burstCount');
    const burstIntensity = this.getParameter('burstIntensity');
    
    for (let i = 0; i < burstCount; i++) {
      this.spawnParticle(width, height);
      
      // Modify last spawned particle for impact
      const p = this.particles[this.particles.length - 1];
      p.vx *= burstIntensity;
      p.vy *= burstIntensity * 1.5;
      p.vz *= burstIntensity;
    }
    
    // Create ground puff if enabled
    if (this.getParameter('groundPuffing')) {
      this.createGroundPuff(width, height);
    }
  }

  private createGroundPuff(width: number, height: number): void {
    const emitterX = this.getParameter('emitterX') * width;
    const emitterY = this.getParameter('emitterY') * height;
    const puffRadius = this.getParameter('puffRadius');
    const puffIntensity = this.getParameter('puffIntensity');
    
    // Create radial burst from impact point
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const seed = this.getParameter('seed') + this.time * 1000 + i;
      
      this.particles.push({
        x: emitterX,
        y: emitterY,
        z: 0.5,
        vx: Math.cos(angle) * puffRadius * puffIntensity,
        vy: Math.sin(angle) * puffRadius * puffIntensity * 0.3 - 50,
        vz: 0,
        size: this.getParameter('particleSize') * 2,
        rotation: this.seededRandom(seed) * 360,
        rotationSpeed: (this.seededRandom(seed + 1) - 0.5) * 60,
        life: 1.5,
        maxLife: 1.5,
        type: 'cloud',
        density: 0.7,
        opacity: this.getParameter('opacity') * puffIntensity,
        color: this.getParameter('dustColor'),
        illumination: 1.0,
        turbulence: {
          x: this.seededRandom(seed + 2) * 1000,
          y: this.seededRandom(seed + 3) * 1000,
          phase: this.seededRandom(seed + 4) * Math.PI * 2
        }
      });
    }
  }

  private updateParticles(width: number, height: number, dt: number, externalWindForce: number): void {
    const gravity = this.getParameter('gravity');
    const gravityVariation = this.getParameter('gravityVariation');
    const drag = this.getParameter('drag');
    const airResistance = this.getParameter('airResistance');
    const brownianMotion = this.getParameter('brownianMotion');
    const turbulence = this.getParameter('turbulence');
    const turbulenceScale = this.getParameter('turbulenceScale');
    const turbulenceSpeed = this.getParameter('turbulenceSpeed');
    const enableWind = this.getParameter('enableWind');
    const windSpeed = this.getParameter('windSpeed');
    const windDirection = this.getParameter('windDirection') * Math.PI / 180;
    const windVariation = this.getParameter('windVariation');
    const windGustiness = this.getParameter('windGustiness');
    const windAffectBySize = this.getParameter('windAffectBySize');
    const enableSettling = this.getParameter('enableSettling');
    const settlingSpeed = this.getParameter('settlingSpeed');
    const settlingThreshold = this.getParameter('settlingThreshold');
    const groundLevel = this.getParameter('groundLevel');
    const dragBySize = this.getParameter('dragBySize');
    
    for (const p of this.particles) {
      // Gravity
      const particleGravity = gravity * (1 + (Math.random() - 0.5) * gravityVariation);
      p.vy += particleGravity * dt;
      
      // Wind
      if (enableWind) {
        const gustPhase = Math.sin(this.windPhase + p.turbulence.phase);
        const gustFactor = 1 + gustPhase * windGustiness;
        const windForce = (windSpeed + externalWindForce) * gustFactor;
        const windEffect = windAffectBySize ? (1 - p.size / this.getParameter('maxSize')) : 1;
        
        p.vx += Math.cos(windDirection) * windForce * windEffect * dt;
        p.vy += Math.sin(windDirection) * windForce * windEffect * dt * 0.3;
      }
      
      // Turbulence
      if (turbulence > 0) {
        const turbX = this.perlinNoise3D(
          (p.x + p.turbulence.x) * turbulenceScale,
          (p.y + p.turbulence.y) * turbulenceScale,
          this.time * turbulenceSpeed
        );
        const turbY = this.perlinNoise3D(
          (p.x + p.turbulence.x + 100) * turbulenceScale,
          (p.y + p.turbulence.y + 100) * turbulenceScale,
          this.time * turbulenceSpeed + 100
        );
        
        p.vx += turbX * turbulence * 50 * dt;
        p.vy += turbY * turbulence * 50 * dt;
      }
      
      // Brownian motion
      if (brownianMotion > 0) {
        p.vx += (Math.random() - 0.5) * brownianMotion * 20 * dt;
        p.vy += (Math.random() - 0.5) * brownianMotion * 20 * dt;
        p.vz += (Math.random() - 0.5) * brownianMotion * 10 * dt;
      }
      
      // Drag
      const particleDrag = dragBySize ? 
        drag * (1 - (1 - p.size / this.getParameter('maxSize')) * 0.3) : 
        drag;
      
      p.vx *= Math.pow(particleDrag, dt * 60);
      p.vy *= Math.pow(particleDrag, dt * 60);
      p.vz *= Math.pow(particleDrag, dt * 60);
      
      // Air resistance
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 0) {
        const resistance = airResistance * speed * p.size / this.getParameter('maxSize');
        p.vx -= (p.vx / speed) * resistance * dt * 100;
        p.vy -= (p.vy / speed) * resistance * dt * 100;
      }
      
      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt * 0.1;
      p.z = Math.max(0, Math.min(1, p.z));
      
      // Rotation
      p.rotation += p.rotationSpeed * dt;
      
      // Settling
      if (enableSettling && p.y / height > settlingThreshold) {
        p.vy += settlingSpeed * dt;
        
        if (p.y >= height * groundLevel) {
          p.y = height * groundLevel;
          p.vy = 0;
          p.vx *= 0.9;
          
          // Resuspension
          if (this.getParameter('resuspension')) {
            const resuspensionChance = this.getParameter('resuspensionChance');
            if (Math.random() < resuspensionChance * dt) {
              p.vy = -Math.random() * 30;
            }
          }
        }
      }
      
      // Update life
      p.life -= dt;
      
      // Update illumination based on lighting
      if (this.getParameter('enableLighting')) {
        this.updateParticleIllumination(p);
      }
    }
  }

  private updateParticleIllumination(p: DustParticle): void {
    const lightDirection = this.getParameter('lightDirection') * Math.PI / 180;
    const lightElevation = this.getParameter('lightElevation') * Math.PI / 180;
    const ambientLight = this.getParameter('ambientLight');
    const diffuseLight = this.getParameter('diffuseLight');
    const backlight = this.getParameter('backlight');
    
    // Simple normal based on particle rotation and type
    const normalAngle = p.rotation * Math.PI / 180;
    const normalX = Math.cos(normalAngle);
    const normalY = Math.sin(normalAngle);
    
    // Light direction vector
    const lightX = Math.cos(lightDirection) * Math.cos(lightElevation);
    const lightY = Math.sin(lightDirection) * Math.cos(lightElevation);
    
    // Dot product for diffuse
    const dot = normalX * lightX + normalY * lightY;
    const diffuse = Math.max(0, dot) * diffuseLight;
    
    // Backlight
    const backlightAmount = Math.max(0, -dot) * backlight;
    
    p.illumination = ambientLight + diffuse + backlightAmount;
  }

  private renderParticle(
    data: Uint8Array,
    width: number,
    height: number,
    p: DustParticle
  ): void {
    const lifeRatio = p.life / p.maxLife;
    
    // Fade in/out
    let alpha = p.opacity;
    
    if (this.getParameter('fadeIn')) {
      const fadeInDuration = this.getParameter('fadeInDuration');
      const age = p.maxLife - p.life;
      if (age < fadeInDuration) {
        alpha *= age / fadeInDuration;
      }
    }
    
    if (this.getParameter('fadeOut')) {
      const fadeOutDuration = this.getParameter('fadeOutDuration');
      if (p.life < fadeOutDuration) {
        alpha *= p.life / fadeOutDuration;
      }
    }
    
    // Depth effects
    let size = p.size;
    if (this.getParameter('sizeByDepth')) {
      const depthScale = this.getParameter('depthScale');
      size *= 1 - (1 - p.z) * depthScale;
    }
    
    if (this.getParameter('opacityByDepth')) {
      const depthOpacityFactor = this.getParameter('depthOpacityFactor');
      alpha *= 1 - (1 - p.z) * depthOpacityFactor;
    }
    
    // Depth of field
    if (this.getParameter('depthOfField')) {
      const dofFocalDepth = this.getParameter('dofFocalDepth');
      const dofAmount = this.getParameter('dofAmount');
      const depthDiff = Math.abs(p.z - dofFocalDepth);
      alpha *= 1 - depthDiff * dofAmount;
    }
    
    // LOD
    if (this.getParameter('lodEnabled')) {
      const lodDistance = this.getParameter('lodDistance');
      const distFromCenter = Math.sqrt(
        Math.pow(p.x - width / 2, 2) + 
        Math.pow(p.y - height / 2, 2)
      );
      if (distFromCenter > lodDistance) {
        size *= 0.5;
        alpha *= 0.7;
      }
    }
    
    const halfSize = size / 2;
    const cos = Math.cos(p.rotation * Math.PI / 180);
    const sin = Math.sin(p.rotation * Math.PI / 180);
    
    const edgeSoftness = this.getParameter('edgeSoftness');
    const addNoise = this.getParameter('addNoise');
    const noiseScale = this.getParameter('noiseScale');
    const noiseIntensity = this.getParameter('noiseIntensity');
    
    // Apply lighting
    const litColor = {
      r: p.color.r * p.illumination,
      g: p.color.g * p.illumination,
      b: p.color.b * p.illumination
    };
    
    // Backlight color
    if (this.getParameter('enableLighting') && p.illumination > 1.5) {
      const backlightColor = this.getParameter('backlightColor');
      const backlightAmount = (p.illumination - 1.5) * 0.3;
      litColor.r = litColor.r * (1 - backlightAmount) + backlightColor.r * backlightAmount;
      litColor.g = litColor.g * (1 - backlightAmount) + backlightColor.g * backlightAmount;
      litColor.b = litColor.b * (1 - backlightAmount) + backlightColor.b * backlightAmount;
    }
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        
        const px = Math.floor(p.x + rx);
        const py = Math.floor(p.y + ry);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          let inside = false;
          let distFactor = 1.0;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          switch (p.type) {
            case 'mote':
              inside = dist <= halfSize;
              distFactor = Math.pow(1 - dist / halfSize, 1.5);
              break;
            case 'clump':
              inside = dist <= halfSize;
              distFactor = 1 - dist / halfSize;
              break;
            case 'wisp':
              inside = Math.abs(dx) <= halfSize * 1.5 && Math.abs(dy) <= halfSize * 0.5;
              distFactor = 1 - Math.abs(dy) / (halfSize * 0.5);
              break;
            case 'cloud':
              inside = dist <= halfSize;
              distFactor = Math.pow(1 - dist / halfSize, 2);
              break;
            case 'fine':
              inside = dist <= halfSize * 0.5;
              distFactor = Math.pow(1 - dist / (halfSize * 0.5), 2);
              break;
          }
          
          if (inside) {
            // Add noise
            let noiseVal = 1.0;
            if (addNoise) {
              noiseVal = 0.5 + 0.5 * this.perlinNoise3D(
                px * noiseScale,
                py * noiseScale,
                this.time + p.z
              );
              noiseVal = 1 - noiseIntensity + noiseIntensity * noiseVal;
            }
            
            // Apply edge softness
            distFactor = Math.pow(distFactor, 1 / edgeSoftness);
            
            const idx = (py * width + px) * 4;
            const pixelAlpha = alpha * distFactor * noiseVal * p.density;
            
            // Alpha blend
            const srcAlpha = pixelAlpha;
            const dstAlpha = data[idx + 3] / 255;
            const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);
            
            if (outAlpha > 0) {
              data[idx] = (litColor.r * srcAlpha + data[idx] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 1] = (litColor.g * srcAlpha + data[idx + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 2] = (litColor.b * srcAlpha + data[idx + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 3] = Math.min(255, outAlpha * 255);
            }
          }
        }
      }
    }
  }

  private perlinNoise3D(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    
    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);
    
    const a = this.permutation[xi] + yi;
    const b = this.permutation[xi + 1] + yi;
    
    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad3(this.permutation[a + zi], xf, yf, zf),
                     this.grad3(this.permutation[b + zi], xf - 1, yf, zf)),
        this.lerp(u, this.grad3(this.permutation[a + zi + 1], xf, yf - 1, zf),
                     this.grad3(this.permutation[b + zi + 1], xf - 1, yf - 1, zf))),
      this.lerp(v,
        this.lerp(u, this.grad3(this.permutation[a + zi + 1], xf, yf, zf - 1),
                     this.grad3(this.permutation[b + zi + 1], xf - 1, yf, zf - 1)),
        this.lerp(u, this.grad3(this.permutation[a + zi + 2], xf, yf - 1, zf - 1),
                     this.grad3(this.permutation[b + zi + 2], xf - 1, yf - 1, zf - 1)))
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad3(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}
