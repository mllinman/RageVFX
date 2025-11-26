/**
 * CloudsNode - Generates procedural cloud effects
 */

import { Node, DataType } from '../core/Node';

export class CloudsNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Clouds', 'Clouds');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate procedural cloud effects';
    
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('depth', 'Depth', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('coverage', 0.5);
    this.setParameter('scale', 0.002);
    this.setParameter('speed', 0.5);
    this.setParameter('windDirection', 45);
    this.setParameter('layers', 3);
    this.setParameter('fluffiness', 0.6);
    this.setParameter('color', { r: 255, g: 255, b: 255 });
    this.setParameter('shadowColor', { r: 180, g: 180, b: 200 });
    this.setParameter('skyColor', { r: 135, g: 206, b: 235 });
    this.setParameter('octaves', 6);
    this.setParameter('type', 'cumulus'); // cumulus, stratus, cirrus
    this.setParameter('seed', 11111);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 11111;
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
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const coverage = this.getParameter('coverage');
    const scale = this.getParameter('scale');
    const speed = this.getParameter('speed');
    const windDirection = this.getParameter('windDirection') * Math.PI / 180;
    const layers = this.getParameter('layers');
    const fluffiness = this.getParameter('fluffiness');
    const color = this.getParameter('color');
    const shadowColor = this.getParameter('shadowColor');
    const skyColor = this.getParameter('skyColor');
    const octaves = this.getParameter('octaves');
    const cloudType = this.getParameter('type');
    
    this.time += 0.016 * speed;
    
    const windX = Math.cos(windDirection) * this.time * 100;
    const windY = Math.sin(windDirection) * this.time * 100;
    
    const data = new Uint8Array(width * height * 4);
    const depthData = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Accumulate cloud density from multiple layers
        let totalDensity = 0;
        let totalDepth = 0;
        
        for (let layer = 0; layer < layers; layer++) {
          const layerScale = scale * (1 + layer * 0.5);
          const layerOffset = layer * 1000;
          
          // Calculate cloud noise
          let cloudValue = this.getCloudNoise(
            (x + windX * (1 + layer * 0.2) + layerOffset) * layerScale,
            (y + windY * (1 + layer * 0.2)) * layerScale,
            octaves,
            cloudType,
            fluffiness
          );
          
          // Apply coverage threshold
          cloudValue = Math.max(0, cloudValue - (1 - coverage)) / coverage;
          
          // Accumulate with depth falloff
          const layerWeight = 1 / (layer + 1);
          totalDensity += cloudValue * layerWeight;
          totalDepth += cloudValue * (layer + 1) / layers;
        }
        
        totalDensity = Math.min(1, totalDensity);
        
        // Calculate lighting (simple top-down)
        const lightFactor = this.getShadowFactor(x, y, windX, windY, scale, octaves, cloudType, fluffiness);
        
        // Mix cloud color with shadow
        const lit = 0.5 + lightFactor * 0.5;
        const cloudR = shadowColor.r + (color.r - shadowColor.r) * lit;
        const cloudG = shadowColor.g + (color.g - shadowColor.g) * lit;
        const cloudB = shadowColor.b + (color.b - shadowColor.b) * lit;
        
        // Mix with sky based on density
        data[idx] = skyColor.r + (cloudR - skyColor.r) * totalDensity;
        data[idx + 1] = skyColor.g + (cloudG - skyColor.g) * totalDensity;
        data[idx + 2] = skyColor.b + (cloudB - skyColor.b) * totalDensity;
        data[idx + 3] = 255;
        
        // Store depth
        const depthValue = Math.floor(totalDepth * 255);
        depthData[idx] = depthValue;
        depthData[idx + 1] = depthValue;
        depthData[idx + 2] = depthValue;
        depthData[idx + 3] = 255;
      }
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
    
    const depthOutput = this.outputs.get('depth');
    if (depthOutput) {
      depthOutput.value = {
        width,
        height,
        channels: 4,
        data: depthData,
        format: 'rgba'
      };
    }
  }

  private getCloudNoise(
    x: number,
    y: number,
    octaves: number,
    type: string,
    fluffiness: number
  ): number {
    let noise = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    const persistence = type === 'cirrus' ? 0.4 : type === 'stratus' ? 0.6 : 0.5;
    
    for (let i = 0; i < octaves; i++) {
      noise += this.perlinNoise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    noise = (noise / maxValue + 1) * 0.5;
    
    // Apply cloud type characteristics
    switch (type) {
      case 'cumulus':
        noise = Math.pow(noise, 1 - fluffiness * 0.5);
        break;
      case 'stratus':
        noise = Math.pow(noise, 0.5);
        noise = noise * 0.6 + 0.2;
        break;
      case 'cirrus':
        noise = Math.pow(noise, 2);
        break;
    }
    
    return noise;
  }

  private getShadowFactor(
    x: number,
    y: number,
    windX: number,
    windY: number,
    scale: number,
    octaves: number,
    type: string,
    fluffiness: number
  ): number {
    // Sample at offset position for shadow
    const shadowX = (x + windX - 5) * scale;
    const shadowY = (y + windY - 5) * scale;
    
    const offsetNoise = this.getCloudNoise(shadowX, shadowY, octaves, type, fluffiness);
    const currentNoise = this.getCloudNoise((x + windX) * scale, (y + windY) * scale, octaves, type, fluffiness);
    
    return Math.max(0, Math.min(1, currentNoise - offsetNoise * 0.5 + 0.5));
  }

  private perlinNoise2D(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = this.fade(xf);
    const v = this.fade(yf);
    
    const a = this.permutation[xi] + yi;
    const b = this.permutation[xi + 1] + yi;
    
    return this.lerp(v,
      this.lerp(u, this.grad2(this.permutation[a], xf, yf),
                   this.grad2(this.permutation[b], xf - 1, yf)),
      this.lerp(u, this.grad2(this.permutation[a + 1], xf, yf - 1),
                   this.grad2(this.permutation[b + 1], xf - 1, yf - 1))
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad2(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}
