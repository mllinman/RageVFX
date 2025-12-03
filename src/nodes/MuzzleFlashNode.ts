/**
 * MuzzleFlashNode - Generates realistic muzzle flash effects
 * Professional gun muzzle flash with blast, smoke, sparks, and heat distortion
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface FlashElement {
  x: number;
  y: number;
  type: 'blast' | 'spark' | 'smoke' | 'shockwave' | 'ejection';
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  intensity: number;
  vx?: number;
  vy?: number;
  color: { r: number; g: number; b: number };
}

export class MuzzleFlashNode extends Node {
  private time: number = 0;
  private elements: FlashElement[] = [];
  private flashTriggered: boolean = false;
  private flashStartTime: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'MuzzleFlash', 'Muzzle Flash');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate realistic gun muzzle flash effects with blast, smoke, sparks, heat distortion, and shell ejection';
    
    this.addInput('image', 'Background', DataType.IMAGE);
    this.addInput('trigger', 'Trigger', DataType.NUMBER);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Canvas size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Position and orientation
    this.setParameter('positionX', 0.5);
    this.setParameter('positionY', 0.5);
    this.setParameter('direction', 0); // degrees, 0 = right
    this.setParameter('scale', 1.0);
    
    // Flash type
    this.setParameter('weaponType', 'rifle'); // rifle, pistol, shotgun, machinegun, cannon, sniper
    this.setParameter('caliber', 'medium'); // small, medium, large, heavy
    
    // Blast properties
    this.setParameter('blastIntensity', 1.0);
    this.setParameter('blastDuration', 0.1);
    this.setParameter('blastSize', 100);
    this.setParameter('blastShape', 'starburst'); // starburst, circular, directional, cross
    this.setParameter('blastPoints', 8);
    this.setParameter('blastPointVariation', 0.4);
    this.setParameter('blastRotation', 0);
    this.setParameter('blastRotationSpeed', 360);
    
    // Core flash
    this.setParameter('coreIntensity', 2.0);
    this.setParameter('coreSize', 40);
    this.setParameter('coreColor', { r: 255, g: 240, b: 200 }); // bright yellow-white
    this.setParameter('corePulse', true);
    this.setParameter('corePulseSpeed', 20);
    
    // Secondary flash
    this.setParameter('secondaryFlash', true);
    this.setParameter('secondaryIntensity', 0.7);
    this.setParameter('secondarySize', 80);
    this.setParameter('secondaryColor', { r: 255, g: 150, b: 50 }); // orange
    this.setParameter('secondaryDelay', 0.02);
    
    // Sparks
    this.setParameter('enableSparks', true);
    this.setParameter('sparkCount', 30);
    this.setParameter('sparkSpeed', 400);
    this.setParameter('sparkSpeedVariation', 0.6);
    this.setParameter('sparkSize', 3);
    this.setParameter('sparkLife', 0.3);
    this.setParameter('sparkColor', { r: 255, g: 200, b: 100 });
    this.setParameter('sparkTrails', true);
    this.setParameter('sparkTrailLength', 5);
    this.setParameter('sparkGravity', 300);
    
    // Smoke
    this.setParameter('enableSmoke', true);
    this.setParameter('smokeCount', 15);
    this.setParameter('smokeSpeed', 50);
    this.setParameter('smokeSize', 60);
    this.setParameter('smokeLife', 1.5);
    this.setParameter('smokeColor', { r: 100, g: 100, b: 100 });
    this.setParameter('smokeExpansion', 1.5);
    this.setParameter('smokeDissipation', 0.8);
    this.setParameter('smokeRotation', true);
    this.setParameter('smokeRotationSpeed', 90);
    
    // Shockwave
    this.setParameter('enableShockwave', true);
    this.setParameter('shockwaveSpeed', 800);
    this.setParameter('shockwaveSize', 200);
    this.setParameter('shockwaveIntensity', 0.4);
    this.setParameter('shockwaveColor', { r: 255, g: 255, b: 255 });
    this.setParameter('shockwaveThickness', 10);
    
    // Heat distortion
    this.setParameter('enableHeatDistortion', true);
    this.setParameter('heatDistortionAmount', 0.3);
    this.setParameter('heatDistortionSize', 150);
    this.setParameter('heatDistortionDuration', 0.5);
    
    // Shell ejection
    this.setParameter('enableShellEjection', true);
    this.setParameter('shellCount', 1);
    this.setParameter('shellSpeed', 200);
    this.setParameter('shellEjectionAngle', 45); // relative to weapon direction
    this.setParameter('shellSize', 8);
    this.setParameter('shellColor', { r: 180, g: 160, b: 100 }); // brass
    this.setParameter('shellRotationSpeed', 720);
    this.setParameter('shellGravity', 600);
    this.setParameter('shellBounce', true);
    
    // Light emission (for lighting background)
    this.setParameter('enableLightEmission', true);
    this.setParameter('lightRadius', 300);
    this.setParameter('lightIntensity', 0.6);
    this.setParameter('lightColor', { r: 255, g: 200, b: 100 });
    this.setParameter('lightFalloff', 2.0);
    
    // Glow and bloom
    this.setParameter('enableGlow', true);
    this.setParameter('glowRadius', 150);
    this.setParameter('glowIntensity', 0.8);
    this.setParameter('glowColor', { r: 255, g: 200, b: 100 });
    
    // Advanced effects
    this.setParameter('chromaticAberration', true);
    this.setParameter('chromaticAmount', 0.02);
    this.setParameter('filmicResponse', true);
    this.setParameter('exposureCompensation', 1.2);
    this.setParameter('motionBlur', true);
    this.setParameter('motionBlurLength', 0.5);
    
    // Animation
    this.setParameter('autoRetrigger', false);
    this.setParameter('retriggerDelay', 0.5);
    this.setParameter('randomTiming', false);
    this.setParameter('timingVariation', 0.1);
    
    // Performance
    this.setParameter('maxElements', 200);
    this.setParameter('lodDistance', 1000);
    this.setParameter('culling', true);
    
    this.setParameter('seed', 98765);
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 98765;
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
    const output = this.outputs.get('image');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    const triggered = triggerInput?.value === 1;
    
    const width = inputImage?.width || this.getParameter('width');
    const height = inputImage?.height || this.getParameter('height');
    
    const dt = 0.016;
    this.time += dt;
    
    // Trigger flash
    if (triggered && !this.flashTriggered) {
      this.triggerFlash(width, height);
      this.flashTriggered = true;
      this.flashStartTime = this.time;
    }
    
    if (!triggered) {
      this.flashTriggered = false;
    }
    
    // Auto retrigger
    if (this.getParameter('autoRetrigger')) {
      const retriggerDelay = this.getParameter('retriggerDelay');
      if (this.time - this.flashStartTime >= retriggerDelay) {
        this.triggerFlash(width, height);
        this.flashStartTime = this.time;
      }
    }
    
    // Update elements
    for (const elem of this.elements) {
      elem.life -= dt;
      
      if (elem.type === 'spark' || elem.type === 'smoke' || elem.type === 'ejection') {
        if (elem.vx !== undefined && elem.vy !== undefined) {
          elem.x += elem.vx * dt;
          elem.y += elem.vy * dt;
          
          // Apply gravity
          if (elem.type === 'spark') {
            const sparkGravity = this.getParameter('sparkGravity');
            elem.vy += sparkGravity * dt;
          } else if (elem.type === 'ejection') {
            const shellGravity = this.getParameter('shellGravity');
            elem.vy += shellGravity * dt;
            elem.rotation += this.getParameter('shellRotationSpeed') * dt;
            
            // Shell bounce
            if (this.getParameter('shellBounce') && elem.y > height - elem.size) {
              elem.y = height - elem.size;
              elem.vy = -elem.vy * 0.4;
              elem.vx *= 0.7;
            }
          }
          
          // Drag
          const drag = elem.type === 'smoke' ? 0.95 : 0.98;
          elem.vx *= drag;
          elem.vy *= drag;
        }
        
        // Smoke expansion
        if (elem.type === 'smoke') {
          const expansion = this.getParameter('smokeExpansion');
          elem.size += expansion * dt * 30;
          
          if (this.getParameter('smokeRotation')) {
            elem.rotation += this.getParameter('smokeRotationSpeed') * dt;
          }
        }
      }
      
      if (elem.type === 'shockwave') {
        const shockwaveSpeed = this.getParameter('shockwaveSpeed');
        elem.size += shockwaveSpeed * dt;
      }
    }
    
    // Remove dead elements
    this.elements = this.elements.filter(e => e.life > 0);
    
    // Limit elements
    const maxElements = this.getParameter('maxElements');
    if (this.elements.length > maxElements) {
      this.elements = this.elements.slice(0, maxElements);
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
    
    // Apply light emission to background
    if (this.getParameter('enableLightEmission')) {
      const flashAge = this.time - this.flashStartTime;
      const blastDuration = this.getParameter('blastDuration');
      
      if (flashAge < blastDuration * 2) {
        const lightIntensity = this.getParameter('lightIntensity') * 
                              Math.max(0, 1 - flashAge / (blastDuration * 2));
        this.applyLightEmission(outData, width, height, lightIntensity);
      }
    }
    
    // Sort elements by type for proper layering
    const sortedElements = [...this.elements].sort((a, b) => {
      const order = { shockwave: 0, smoke: 1, blast: 2, spark: 3, ejection: 4 };
      return order[a.type] - order[b.type];
    });
    
    // Draw elements
    for (const elem of sortedElements) {
      const lifeRatio = elem.life / elem.maxLife;
      
      switch (elem.type) {
        case 'blast':
          this.drawBlast(outData, width, height, elem, lifeRatio);
          break;
        case 'spark':
          this.drawSpark(outData, width, height, elem, lifeRatio);
          break;
        case 'smoke':
          this.drawSmoke(outData, width, height, elem, lifeRatio);
          break;
        case 'shockwave':
          this.drawShockwave(outData, width, height, elem, lifeRatio);
          break;
        case 'ejection':
          this.drawShell(outData, width, height, elem, lifeRatio);
          break;
      }
    }
    
    // Apply glow
    if (this.getParameter('enableGlow')) {
      const flashAge = this.time - this.flashStartTime;
      const blastDuration = this.getParameter('blastDuration');
      
      if (flashAge < blastDuration * 3) {
        this.applyGlow(outData, width, height);
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private triggerFlash(width: number, height: number): void {
    this.elements = [];
    
    const posX = this.getParameter('positionX') * width;
    const posY = this.getParameter('positionY') * height;
    const direction = this.getParameter('direction') * Math.PI / 180;
    const scale = this.getParameter('scale');
    const blastDuration = this.getParameter('blastDuration');
    const seed = this.getParameter('seed') + this.time * 1000;
    
    // Main blast
    const blastShape = this.getParameter('blastShape');
    const blastPoints = this.getParameter('blastPoints');
    const blastSize = this.getParameter('blastSize') * scale;
    const coreSize = this.getParameter('coreSize') * scale;
    const secondarySize = this.getParameter('secondarySize') * scale;
    
    // Core flash
    this.elements.push({
      x: posX,
      y: posY,
      type: 'blast',
      life: blastDuration,
      maxLife: blastDuration,
      size: coreSize,
      rotation: this.seededRandom(seed) * 360,
      intensity: this.getParameter('coreIntensity'),
      color: this.getParameter('coreColor')
    });
    
    // Secondary flash
    if (this.getParameter('secondaryFlash')) {
      const secondaryDelay = this.getParameter('secondaryDelay');
      this.elements.push({
        x: posX,
        y: posY,
        type: 'blast',
        life: blastDuration + secondaryDelay,
        maxLife: blastDuration,
        size: secondarySize,
        rotation: this.seededRandom(seed + 1) * 360,
        intensity: this.getParameter('secondaryIntensity'),
        color: this.getParameter('secondaryColor')
      });
    }
    
    // Sparks
    if (this.getParameter('enableSparks')) {
      const sparkCount = this.getParameter('sparkCount');
      const sparkSpeed = this.getParameter('sparkSpeed');
      const sparkSpeedVariation = this.getParameter('sparkSpeedVariation');
      const sparkLife = this.getParameter('sparkLife');
      const sparkSize = this.getParameter('sparkSize') * scale;
      const sparkColor = this.getParameter('sparkColor');
      const spread = Math.PI / 3; // 60 degree cone
      
      for (let i = 0; i < sparkCount; i++) {
        const angle = direction + (this.seededRandom(seed + i + 100) - 0.5) * spread;
        const speed = sparkSpeed * (1 + (this.seededRandom(seed + i + 200) - 0.5) * sparkSpeedVariation);
        
        this.elements.push({
          x: posX + Math.cos(direction) * coreSize * 0.5,
          y: posY + Math.sin(direction) * coreSize * 0.5,
          type: 'spark',
          life: sparkLife * (0.5 + this.seededRandom(seed + i + 300) * 0.5),
          maxLife: sparkLife,
          size: sparkSize * (0.5 + this.seededRandom(seed + i + 400) * 0.5),
          rotation: 0,
          intensity: 1.0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: sparkColor
        });
      }
    }
    
    // Smoke
    if (this.getParameter('enableSmoke')) {
      const smokeCount = this.getParameter('smokeCount');
      const smokeSpeed = this.getParameter('smokeSpeed');
      const smokeLife = this.getParameter('smokeLife');
      const smokeSize = this.getParameter('smokeSize') * scale;
      const smokeColor = this.getParameter('smokeColor');
      
      for (let i = 0; i < smokeCount; i++) {
        const angle = direction + (this.seededRandom(seed + i + 500) - 0.5) * Math.PI;
        const speed = smokeSpeed * (0.5 + this.seededRandom(seed + i + 600) * 0.5);
        
        this.elements.push({
          x: posX + Math.cos(direction) * coreSize * 0.3,
          y: posY + Math.sin(direction) * coreSize * 0.3,
          type: 'smoke',
          life: smokeLife * (0.8 + this.seededRandom(seed + i + 700) * 0.4),
          maxLife: smokeLife,
          size: smokeSize * (0.7 + this.seededRandom(seed + i + 800) * 0.6),
          rotation: this.seededRandom(seed + i + 900) * 360,
          intensity: 0.7,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: smokeColor
        });
      }
    }
    
    // Shockwave
    if (this.getParameter('enableShockwave')) {
      this.elements.push({
        x: posX,
        y: posY,
        type: 'shockwave',
        life: this.getParameter('shockwaveSize') / this.getParameter('shockwaveSpeed'),
        maxLife: this.getParameter('shockwaveSize') / this.getParameter('shockwaveSpeed'),
        size: 0,
        rotation: 0,
        intensity: this.getParameter('shockwaveIntensity'),
        color: this.getParameter('shockwaveColor')
      });
    }
    
    // Shell ejection
    if (this.getParameter('enableShellEjection')) {
      const shellCount = this.getParameter('shellCount');
      const shellSpeed = this.getParameter('shellSpeed');
      const shellEjectionAngle = this.getParameter('shellEjectionAngle') * Math.PI / 180;
      const shellSize = this.getParameter('shellSize') * scale;
      const shellColor = this.getParameter('shellColor');
      
      for (let i = 0; i < shellCount; i++) {
        const angle = direction + shellEjectionAngle + (this.seededRandom(seed + i + 1000) - 0.5) * 0.3;
        const speed = shellSpeed * (0.8 + this.seededRandom(seed + i + 1100) * 0.4);
        
        this.elements.push({
          x: posX,
          y: posY,
          type: 'ejection',
          life: 2.0,
          maxLife: 2.0,
          size: shellSize,
          rotation: this.seededRandom(seed + i + 1200) * 360,
          intensity: 1.0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 100,
          color: shellColor
        });
      }
    }
  }

  private drawBlast(
    data: Uint8Array,
    width: number,
    height: number,
    elem: FlashElement,
    lifeRatio: number
  ): void {
    const blastShape = this.getParameter('blastShape');
    const blastPoints = this.getParameter('blastPoints');
    const blastPointVariation = this.getParameter('blastPointVariation');
    
    // Pulse effect
    let size = elem.size;
    if (this.getParameter('corePulse')) {
      const corePulseSpeed = this.getParameter('corePulseSpeed');
      const pulse = Math.sin(this.time * corePulseSpeed);
      size *= 1 + pulse * 0.2 * lifeRatio;
    }
    
    // Fade in quickly, fade out
    const fadeIn = Math.min(1, (1 - lifeRatio) / 0.1);
    const fadeOut = Math.pow(lifeRatio, 0.5);
    const alpha = elem.intensity * fadeIn * fadeOut;
    
    const radius = size / 2;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(elem.x + dx);
        const py = Math.floor(elem.y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= radius) {
            let intensity = 1 - dist / radius;
            
            // Apply shape
            if (blastShape === 'starburst') {
              const angle = Math.atan2(dy, dx) + elem.rotation * Math.PI / 180;
              const pointAngle = Math.PI * 2 / blastPoints;
              const angleOffset = (angle % pointAngle) / pointAngle;
              const starPattern = 1 - Math.abs(angleOffset - 0.5) * 2;
              intensity *= 0.3 + 0.7 * Math.pow(starPattern, 2);
            } else if (blastShape === 'directional') {
              const direction = this.getParameter('direction') * Math.PI / 180;
              const angle = Math.atan2(dy, dx);
              const angleDiff = Math.abs(angle - direction);
              intensity *= Math.pow(Math.cos(angleDiff), 2);
            }
            
            const idx = (py * width + px) * 4;
            const pixelAlpha = alpha * intensity;
            
            // Additive blending for bright flash
            data[idx] = Math.min(255, data[idx] + elem.color.r * pixelAlpha);
            data[idx + 1] = Math.min(255, data[idx + 1] + elem.color.g * pixelAlpha);
            data[idx + 2] = Math.min(255, data[idx + 2] + elem.color.b * pixelAlpha);
          }
        }
      }
    }
  }

  private drawSpark(
    data: Uint8Array,
    width: number,
    height: number,
    elem: FlashElement,
    lifeRatio: number
  ): void {
    const alpha = lifeRatio;
    const radius = elem.size / 2;
    
    // Draw trail
    if (this.getParameter('sparkTrails') && elem.vx !== undefined && elem.vy !== undefined) {
      const trailLength = this.getParameter('sparkTrailLength');
      const speed = Math.sqrt(elem.vx * elem.vx + elem.vy * elem.vy);
      const trailLen = Math.min(trailLength, speed * 0.1);
      
      const dx = -elem.vx / speed;
      const dy = -elem.vy / speed;
      
      for (let t = 0; t < trailLen; t++) {
        const tx = elem.x + dx * t;
        const ty = elem.y + dy * t;
        const trailAlpha = alpha * (1 - t / trailLen) * 0.5;
        
        this.drawPoint(data, width, height, tx, ty, radius * 0.7, elem.color, trailAlpha);
      }
    }
    
    // Draw spark
    this.drawPoint(data, width, height, elem.x, elem.y, radius, elem.color, alpha);
  }

  private drawSmoke(
    data: Uint8Array,
    width: number,
    height: number,
    elem: FlashElement,
    lifeRatio: number
  ): void {
    const smokeDissipation = this.getParameter('smokeDissipation');
    const alpha = elem.intensity * Math.pow(lifeRatio, smokeDissipation);
    const radius = elem.size / 2;
    
    const cos = Math.cos(elem.rotation * Math.PI / 180);
    const sin = Math.sin(elem.rotation * Math.PI / 180);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        
        const px = Math.floor(elem.x + rx);
        const py = Math.floor(elem.y + ry);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= radius) {
            const intensity = Math.pow(1 - dist / radius, 1.5);
            
            // Add turbulence
            const noise = this.simpleNoise(px * 0.05, py * 0.05, this.time * 2);
            const noiseFactor = 0.7 + noise * 0.3;
            
            const idx = (py * width + px) * 4;
            const pixelAlpha = alpha * intensity * noiseFactor;
            
            // Alpha blend
            const srcAlpha = pixelAlpha;
            const dstAlpha = data[idx + 3] / 255;
            const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);
            
            if (outAlpha > 0) {
              data[idx] = (elem.color.r * srcAlpha + data[idx] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 1] = (elem.color.g * srcAlpha + data[idx + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 2] = (elem.color.b * srcAlpha + data[idx + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 3] = Math.min(255, outAlpha * 255);
            }
          }
        }
      }
    }
  }

  private drawShockwave(
    data: Uint8Array,
    width: number,
    height: number,
    elem: FlashElement,
    lifeRatio: number
  ): void {
    const alpha = elem.intensity * lifeRatio;
    const thickness = this.getParameter('shockwaveThickness');
    const outerRadius = elem.size / 2;
    const innerRadius = Math.max(0, outerRadius - thickness);
    
    for (let dy = -outerRadius; dy <= outerRadius; dy++) {
      for (let dx = -outerRadius; dx <= outerRadius; dx++) {
        const px = Math.floor(elem.x + dx);
        const py = Math.floor(elem.y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist >= innerRadius && dist <= outerRadius) {
            const distFromEdge = Math.min(dist - innerRadius, outerRadius - dist);
            const intensity = distFromEdge / thickness;
            
            const idx = (py * width + px) * 4;
            const pixelAlpha = alpha * intensity;
            
            // Additive blending
            data[idx] = Math.min(255, data[idx] + elem.color.r * pixelAlpha);
            data[idx + 1] = Math.min(255, data[idx + 1] + elem.color.g * pixelAlpha);
            data[idx + 2] = Math.min(255, data[idx + 2] + elem.color.b * pixelAlpha);
          }
        }
      }
    }
  }

  private drawShell(
    data: Uint8Array,
    width: number,
    height: number,
    elem: FlashElement,
    lifeRatio: number
  ): void {
    const alpha = 1.0;
    const halfSize = elem.size / 2;
    
    const cos = Math.cos(elem.rotation * Math.PI / 180);
    const sin = Math.sin(elem.rotation * Math.PI / 180);
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize * 2; dx <= halfSize * 2; dx++) {
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        
        const px = Math.floor(elem.x + rx);
        const py = Math.floor(elem.y + ry);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          // Cylindrical shell shape
          if (Math.abs(dy) <= halfSize && Math.abs(dx) <= halfSize * 2) {
            const idx = (py * width + px) * 4;
            
            // Simple shading
            const shade = 0.7 + 0.3 * Math.cos(dx / halfSize * Math.PI);
            
            // Alpha blend
            const srcAlpha = alpha;
            const dstAlpha = data[idx + 3] / 255;
            const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);
            
            if (outAlpha > 0) {
              data[idx] = (elem.color.r * shade * srcAlpha + data[idx] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 1] = (elem.color.g * shade * srcAlpha + data[idx + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 2] = (elem.color.b * shade * srcAlpha + data[idx + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;
              data[idx + 3] = Math.min(255, outAlpha * 255);
            }
          }
        }
      }
    }
  }

  private drawPoint(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    radius: number,
    color: { r: number; g: number; b: number },
    alpha: number
  ): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= radius) {
            const idx = (py * width + px) * 4;
            const falloff = Math.pow(1 - dist / radius, 2);
            const pixelAlpha = alpha * falloff;
            
            // Additive blending
            data[idx] = Math.min(255, data[idx] + color.r * pixelAlpha);
            data[idx + 1] = Math.min(255, data[idx + 1] + color.g * pixelAlpha);
            data[idx + 2] = Math.min(255, data[idx + 2] + color.b * pixelAlpha);
          }
        }
      }
    }
  }

  private applyLightEmission(
    data: Uint8Array,
    width: number,
    height: number,
    intensity: number
  ): void {
    const posX = this.getParameter('positionX') * width;
    const posY = this.getParameter('positionY') * height;
    const lightRadius = this.getParameter('lightRadius');
    const lightColor = this.getParameter('lightColor');
    const lightFalloff = this.getParameter('lightFalloff');
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - posX;
        const dy = y - posY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < lightRadius) {
          const falloff = Math.pow(1 - dist / lightRadius, lightFalloff);
          const lightAmount = intensity * falloff;
          
          const idx = (y * width + x) * 4;
          data[idx] = Math.min(255, data[idx] + lightColor.r * lightAmount * 0.5);
          data[idx + 1] = Math.min(255, data[idx + 1] + lightColor.g * lightAmount * 0.5);
          data[idx + 2] = Math.min(255, data[idx + 2] + lightColor.b * lightAmount * 0.5);
        }
      }
    }
  }

  private applyGlow(
    data: Uint8Array,
    width: number,
    height: number
  ): void {
    const posX = this.getParameter('positionX') * width;
    const posY = this.getParameter('positionY') * height;
    const glowRadius = this.getParameter('glowRadius');
    const glowIntensity = this.getParameter('glowIntensity');
    const glowColor = this.getParameter('glowColor');
    const flashAge = this.time - this.flashStartTime;
    const blastDuration = this.getParameter('blastDuration');
    const alpha = glowIntensity * Math.max(0, 1 - flashAge / (blastDuration * 3));
    
    for (let dy = -glowRadius; dy <= glowRadius; dy++) {
      for (let dx = -glowRadius; dx <= glowRadius; dx++) {
        const px = Math.floor(posX + dx);
        const py = Math.floor(posY + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= glowRadius) {
            const falloff = Math.pow(1 - dist / glowRadius, 3);
            const idx = (py * width + px) * 4;
            
            // Additive glow
            data[idx] = Math.min(255, data[idx] + glowColor.r * falloff * alpha);
            data[idx + 1] = Math.min(255, data[idx + 1] + glowColor.g * falloff * alpha);
            data[idx + 2] = Math.min(255, data[idx + 2] + glowColor.b * falloff * alpha);
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
