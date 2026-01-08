/**
 * LightningNode - Generates electrical discharge/lightning effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface LightningBolt {
  segments: Array<{ x: number; y: number }>;
  brightness: number;
  width: number;
}

export class LightningNode extends Node {
  private bolts: LightningBolt[] = [];
  private time: number = 0;
  private nextFlash: number = 0;

  constructor(id: string) {
    super(id, 'Lightning', 'Lightning');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate electrical discharge effects';
    
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('startX', 0.5);
    this.setParameter('startY', 0);
    this.setParameter('endX', 0.5);
    this.setParameter('endY', 1.0);
    this.setParameter('branches', 3);
    this.setParameter('branchProbability', 0.3);
    this.setParameter('jaggedness', 50);
    this.setParameter('segments', 20);
    this.setParameter('coreColor', { r: 255, g: 255, b: 255 });
    this.setParameter('glowColor', { r: 150, g: 150, b: 255 });
    this.setParameter('glowSize', 20);
    this.setParameter('boltWidth', 3);
    this.setParameter('flashDuration', 0.2);
    this.setParameter('flashInterval', 1.0);
    this.setParameter('continuous', false);
    this.setParameter('seed', 44444);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private generateBolt(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    segments: number,
    jaggedness: number,
    seed: number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Direction perpendicular to bolt
    const perpX = -dy / length;
    const perpY = dx / length;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const baseX = startX + dx * t;
      const baseY = startY + dy * t;
      
      // Add randomness (less at endpoints)
      const edgeFactor = 4 * t * (1 - t); // Parabola, 0 at ends, 1 in middle
      const offset = (this.seededRandom(seed + i) - 0.5) * jaggedness * edgeFactor;
      
      points.push({
        x: baseX + perpX * offset,
        y: baseY + perpY * offset
      });
    }
    
    return points;
  }

  private generateLightning(): void {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const startX = this.getParameter('startX') * width;
    const startY = this.getParameter('startY') * height;
    const endX = this.getParameter('endX') * width;
    const endY = this.getParameter('endY') * height;
    const branches = this.getParameter('branches');
    const branchProbability = this.getParameter('branchProbability');
    const jaggedness = this.getParameter('jaggedness');
    const segments = this.getParameter('segments');
    const boltWidth = this.getParameter('boltWidth');
    const seed = this.getParameter('seed') + Math.floor(this.time * 1000);
    
    this.bolts = [];
    
    // Main bolt
    const mainBolt: LightningBolt = {
      segments: this.generateBolt(startX, startY, endX, endY, segments, jaggedness, seed),
      brightness: 1.0,
      width: boltWidth
    };
    this.bolts.push(mainBolt);
    
    // Generate branches
    for (let b = 0; b < branches; b++) {
      // Pick a random point on main bolt to branch from
      const branchIdx = Math.floor(this.seededRandom(seed + b * 100) * (segments - 2)) + 1;
      const branchPoint = mainBolt.segments[branchIdx];
      
      if (this.seededRandom(seed + b * 200) < branchProbability || b === 0) {
        // Branch direction
        const branchAngle = (this.seededRandom(seed + b * 300) - 0.5) * Math.PI * 0.5;
        const mainAngle = Math.atan2(endY - startY, endX - startX);
        const finalAngle = mainAngle + branchAngle;
        
        const branchLength = (endY - startY) * (0.3 + this.seededRandom(seed + b * 400) * 0.4);
        const branchEndX = branchPoint.x + Math.cos(finalAngle) * branchLength;
        const branchEndY = branchPoint.y + Math.sin(finalAngle) * branchLength;
        
        const branchBolt: LightningBolt = {
          segments: this.generateBolt(
            branchPoint.x, branchPoint.y,
            branchEndX, branchEndY,
            Math.floor(segments * 0.6),
            jaggedness * 0.7,
            seed + b * 1000
          ),
          brightness: 0.7,
          width: boltWidth * 0.6
        };
        this.bolts.push(branchBolt);
      }
    }
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const coreColor = this.getParameter('coreColor');
    const glowColor = this.getParameter('glowColor');
    const glowSize = this.getParameter('glowSize');
    const flashDuration = this.getParameter('flashDuration');
    const flashInterval = this.getParameter('flashInterval');
    const continuous = this.getParameter('continuous');
    
    this.time += 0.016;
    
    // Check if it's time for a new flash
    if (this.time >= this.nextFlash) {
      this.generateLightning();
      this.nextFlash = this.time + flashInterval;
    }
    
    const bgInput = this.inputs.get('background');
    const background = bgInput?.value as ImageData | undefined;
    
    const data = new Uint8Array(width * height * 4);
    
    // Copy background
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
    
    // Calculate flash intensity
    const timeSinceFlash = this.time - (this.nextFlash - flashInterval);
    let intensity = 1;
    
    if (!continuous) {
      if (timeSinceFlash < flashDuration) {
        // Flash on with flicker
        intensity = 0.7 + Math.random() * 0.3;
        if (timeSinceFlash > flashDuration * 0.8) {
          intensity *= (flashDuration - timeSinceFlash) / (flashDuration * 0.2);
        }
      } else {
        intensity = 0;
      }
    }
    
    if (intensity <= 0) {
      const output = this.outputs.get('image');
      if (output) {
        output.value = { width, height, channels: 4, data, format: 'rgba' };
      }
      return;
    }
    
    // Draw lightning bolts
    for (const bolt of this.bolts) {
      // Draw glow first (larger radius)
      this.drawBoltGlow(data, width, height, bolt, glowColor, glowSize, intensity);
      
      // Draw core
      this.drawBoltCore(data, width, height, bolt, coreColor, intensity);
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

  private drawBoltGlow(
    data: Uint8Array,
    width: number,
    height: number,
    bolt: LightningBolt,
    color: { r: number; g: number; b: number },
    glowSize: number,
    intensity: number
  ): void {
    const effectiveGlow = glowSize * bolt.brightness;
    
    for (let i = 0; i < bolt.segments.length - 1; i++) {
      const p1 = bolt.segments[i];
      const p2 = bolt.segments[i + 1];
      
      // Draw glow along segment
      const segLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const steps = Math.ceil(segLength);
      
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = p1.x + (p2.x - p1.x) * t;
        const py = p1.y + (p2.y - p1.y) * t;
        
        // Draw glow circle
        for (let dy = -effectiveGlow; dy <= effectiveGlow; dy++) {
          for (let dx = -effectiveGlow; dx <= effectiveGlow; dx++) {
            const gx = Math.floor(px + dx);
            const gy = Math.floor(py + dy);
            
            if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= effectiveGlow) {
                const idx = (gy * width + gx) * 4;
                const falloff = 1 - dist / effectiveGlow;
                const alpha = falloff * falloff * intensity * bolt.brightness * 0.3;
                
                data[idx] = Math.min(255, data[idx] + color.r * alpha);
                data[idx + 1] = Math.min(255, data[idx + 1] + color.g * alpha);
                data[idx + 2] = Math.min(255, data[idx + 2] + color.b * alpha);
              }
            }
          }
        }
      }
    }
  }

  private drawBoltCore(
    data: Uint8Array,
    width: number,
    height: number,
    bolt: LightningBolt,
    color: { r: number; g: number; b: number },
    intensity: number
  ): void {
    for (let i = 0; i < bolt.segments.length - 1; i++) {
      const p1 = bolt.segments[i];
      const p2 = bolt.segments[i + 1];
      
      this.drawLine(data, width, height, p1.x, p1.y, p2.x, p2.y, color, bolt.width, intensity * bolt.brightness);
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
    lineWidth: number,
    intensity: number
  ): void {
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
      const halfWidth = Math.ceil(lineWidth / 2);
      for (let wy = -halfWidth; wy <= halfWidth; wy++) {
        for (let wx = -halfWidth; wx <= halfWidth; wx++) {
          const px = x + wx;
          const py = y + wy;
          
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const dist = Math.sqrt(wx * wx + wy * wy);
            if (dist <= lineWidth / 2) {
              const idx = (py * width + px) * 4;
              const falloff = 1 - dist / (lineWidth / 2);
              
              data[idx] = Math.min(255, data[idx] + color.r * intensity * falloff);
              data[idx + 1] = Math.min(255, data[idx + 1] + color.g * intensity * falloff);
              data[idx + 2] = Math.min(255, data[idx + 2] + color.b * intensity * falloff);
              data[idx + 3] = Math.min(255, data[idx + 3] + 255 * intensity * falloff);
            }
          }
        }
      }
      
      if (x === endX && y === endY) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }
}
