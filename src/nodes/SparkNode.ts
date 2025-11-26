/**
 * SparkNode - Generates particle spark effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  trail: Array<{ x: number; y: number }>;
}

export class SparkNode extends Node {
  private sparks: Spark[] = [];
  private time: number = 0;

  constructor(id: string) {
    super(id, 'Spark', 'Spark');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate particle spark effects';
    
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('emitterX', 0.5);
    this.setParameter('emitterY', 0.5);
    this.setParameter('emissionRate', 20);
    this.setParameter('sparkSpeed', 8.0);
    this.setParameter('sparkSpeedVariation', 3.0);
    this.setParameter('emissionAngle', 270); // Degrees, 0 = right, 270 = up
    this.setParameter('emissionSpread', 60); // Cone angle
    this.setParameter('gravity', 0.3);
    this.setParameter('drag', 0.02);
    this.setParameter('sparkLife', 1.0);
    this.setParameter('sparkLifeVariation', 0.3);
    this.setParameter('sparkSize', 3);
    this.setParameter('trailLength', 5);
    this.setParameter('color', { r: 255, g: 200, b: 100 });
    this.setParameter('colorEnd', { r: 255, g: 100, b: 50 });
    this.setParameter('seed', 55555);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private emitSpark(): void {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const emitterX = this.getParameter('emitterX') * width;
    const emitterY = this.getParameter('emitterY') * height;
    const sparkSpeed = this.getParameter('sparkSpeed');
    const speedVariation = this.getParameter('sparkSpeedVariation');
    const emissionAngle = this.getParameter('emissionAngle') * Math.PI / 180;
    const emissionSpread = this.getParameter('emissionSpread') * Math.PI / 180;
    const sparkLife = this.getParameter('sparkLife');
    const lifeVariation = this.getParameter('sparkLifeVariation');
    const sparkSize = this.getParameter('sparkSize');
    const seed = this.getParameter('seed') + this.sparks.length + this.time * 1000;
    
    const angle = emissionAngle + (this.seededRandom(seed) - 0.5) * emissionSpread;
    const speed = sparkSpeed + (this.seededRandom(seed + 1) - 0.5) * 2 * speedVariation;
    const life = sparkLife + (this.seededRandom(seed + 2) - 0.5) * 2 * lifeVariation;
    
    this.sparks.push({
      x: emitterX + (this.seededRandom(seed + 3) - 0.5) * 10,
      y: emitterY + (this.seededRandom(seed + 4) - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: sparkSize * (0.5 + this.seededRandom(seed + 5) * 0.5),
      trail: []
    });
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const emissionRate = this.getParameter('emissionRate');
    const gravity = this.getParameter('gravity');
    const drag = this.getParameter('drag');
    const trailLength = this.getParameter('trailLength');
    const color = this.getParameter('color');
    const colorEnd = this.getParameter('colorEnd');
    
    this.time += 0.016;
    
    // Emit new sparks
    const sparksToEmit = Math.floor(emissionRate * 0.016 + (Math.random() < (emissionRate * 0.016 % 1) ? 1 : 0));
    for (let i = 0; i < sparksToEmit; i++) {
      this.emitSpark();
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
    
    // Update and draw sparks
    const aliveSparks: Spark[] = [];
    
    for (const spark of this.sparks) {
      if (spark.life <= 0) continue;
      
      // Store position in trail
      spark.trail.unshift({ x: spark.x, y: spark.y });
      if (spark.trail.length > trailLength) {
        spark.trail.pop();
      }
      
      // Update physics
      spark.vy += gravity;
      spark.vx *= (1 - drag);
      spark.vy *= (1 - drag);
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= 0.016;
      
      // Calculate life factor
      const lifeFactor = Math.max(0, spark.life / spark.maxLife);
      
      // Interpolate color
      const sparkColor = {
        r: color.r + (colorEnd.r - color.r) * (1 - lifeFactor),
        g: color.g + (colorEnd.g - color.g) * (1 - lifeFactor),
        b: color.b + (colorEnd.b - color.b) * (1 - lifeFactor)
      };
      
      // Draw trail
      for (let t = 0; t < spark.trail.length; t++) {
        const trailPoint = spark.trail[t];
        const trailFactor = 1 - t / spark.trail.length;
        const trailSize = spark.size * trailFactor * 0.5;
        
        this.drawSparkPoint(
          data, width, height,
          trailPoint.x, trailPoint.y,
          trailSize,
          sparkColor,
          lifeFactor * trailFactor * 0.5
        );
      }
      
      // Draw spark head
      this.drawSparkPoint(
        data, width, height,
        spark.x, spark.y,
        spark.size * lifeFactor,
        sparkColor,
        lifeFactor
      );
      
      if (spark.life > 0) {
        aliveSparks.push(spark);
      }
    }
    
    this.sparks = aliveSparks;
    
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

  private drawSparkPoint(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    size: number,
    color: { r: number; g: number; b: number },
    alpha: number
  ): void {
    const radius = Math.max(1, Math.ceil(size));
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= radius) {
            const idx = (py * width + px) * 4;
            const falloff = Math.pow(1 - dist / radius, 2);
            const pixelAlpha = falloff * alpha;
            
            // Additive blending for glow
            data[idx] = Math.min(255, data[idx] + color.r * pixelAlpha);
            data[idx + 1] = Math.min(255, data[idx + 1] + color.g * pixelAlpha);
            data[idx + 2] = Math.min(255, data[idx + 2] + color.b * pixelAlpha);
            data[idx + 3] = Math.min(255, Math.max(data[idx + 3], 255 * pixelAlpha));
          }
        }
      }
    }
  }
}
