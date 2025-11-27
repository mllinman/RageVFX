/**
 * PlasmaNode - Procedural plasma and energy effects
 * Creates dynamic flowing energy patterns
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class PlasmaNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'Plasma', 'Plasma');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Generate procedural plasma and energy effects';
    
    this.addInput('mask', 'Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Plasma structure
    this.setParameter('scale', 3.0);
    this.setParameter('complexity', 5);
    this.setParameter('sharpness', 1.0);
    
    // Colors
    this.setParameter('color1', { r: 0, g: 100, b: 255 });
    this.setParameter('color2', { r: 255, g: 0, b: 255 });
    this.setParameter('color3', { r: 255, g: 255, b: 255 });
    this.setParameter('colorCycleSpeed', 0.5);
    
    // Animation
    this.setParameter('speed', 1.0);
    this.setParameter('flowDirection', 0.0);
    this.setParameter('turbulence', 1.0);
    
    // Intensity
    this.setParameter('brightness', 1.0);
    this.setParameter('contrast', 1.0);
    this.setParameter('glow', 0.5);
    
    // Electric arcs
    this.setParameter('arcs', false);
    this.setParameter('arcFrequency', 0.1);
    this.setParameter('arcIntensity', 1.0);
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const scale = this.getParameter('scale');
    const complexity = this.getParameter('complexity');
    const sharpness = this.getParameter('sharpness');
    const color1 = this.getParameter('color1');
    const color2 = this.getParameter('color2');
    const color3 = this.getParameter('color3');
    const colorCycleSpeed = this.getParameter('colorCycleSpeed');
    const speed = this.getParameter('speed');
    const flowDirection = this.getParameter('flowDirection');
    const turbulence = this.getParameter('turbulence');
    const brightness = this.getParameter('brightness');
    const contrast = this.getParameter('contrast');
    const glow = this.getParameter('glow');
    const arcs = this.getParameter('arcs');
    const arcFrequency = this.getParameter('arcFrequency');
    const arcIntensity = this.getParameter('arcIntensity');
    
    this.time += 0.016 * speed;
    
    const data = new Uint8Array(width * height * 4);
    const maskInput = this.inputs.get('mask');
    const mask = maskInput?.value as ImageData | undefined;
    
    const flowX = Math.cos(flowDirection) * this.time * 50;
    const flowY = Math.sin(flowDirection) * this.time * 50;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Normalize coordinates
        const nx = x / width;
        const ny = y / height;
        
        // Calculate plasma value using multiple sine waves
        let plasma = 0;
        
        for (let i = 1; i <= complexity; i++) {
          const freq = i * scale;
          const timeOffset = this.time * (1 + i * 0.2);
          
          // Horizontal wave
          plasma += Math.sin((nx * freq + flowX * 0.01 + timeOffset) * Math.PI * 2);
          
          // Vertical wave
          plasma += Math.sin((ny * freq + flowY * 0.01 + timeOffset * 1.1) * Math.PI * 2);
          
          // Diagonal wave
          plasma += Math.sin(((nx + ny) * freq * 0.7 + timeOffset * 0.9) * Math.PI * 2);
          
          // Circular wave
          const cx = 0.5 + Math.sin(timeOffset * 0.5) * 0.2 * turbulence;
          const cy = 0.5 + Math.cos(timeOffset * 0.3) * 0.2 * turbulence;
          const dist = Math.sqrt((nx - cx) * (nx - cx) + (ny - cy) * (ny - cy));
          plasma += Math.sin(dist * freq * 2 + timeOffset) * turbulence;
        }
        
        // Normalize to 0-1
        plasma = (plasma / (complexity * 4) + 1) * 0.5;
        
        // Apply sharpness
        plasma = Math.pow(plasma, sharpness);
        
        // Apply contrast
        plasma = (plasma - 0.5) * contrast + 0.5;
        plasma = Math.max(0, Math.min(1, plasma));
        
        // Color cycle offset
        const colorOffset = this.time * colorCycleSpeed;
        
        // Three-color gradient
        let r, g, b;
        const cycledPlasma = (plasma + colorOffset) % 1;
        
        if (cycledPlasma < 0.33) {
          const t = cycledPlasma * 3;
          r = color1.r * (1 - t) + color2.r * t;
          g = color1.g * (1 - t) + color2.g * t;
          b = color1.b * (1 - t) + color2.b * t;
        } else if (cycledPlasma < 0.66) {
          const t = (cycledPlasma - 0.33) * 3;
          r = color2.r * (1 - t) + color3.r * t;
          g = color2.g * (1 - t) + color3.g * t;
          b = color2.b * (1 - t) + color3.b * t;
        } else {
          const t = (cycledPlasma - 0.66) * 3;
          r = color3.r * (1 - t) + color1.r * t;
          g = color3.g * (1 - t) + color1.g * t;
          b = color3.b * (1 - t) + color1.b * t;
        }
        
        // Apply brightness and glow
        const glowFactor = 1 + glow * plasma;
        r = r * brightness * glowFactor;
        g = g * brightness * glowFactor;
        b = b * brightness * glowFactor;
        
        // Add electric arcs
        if (arcs) {
          const arcNoise = this.arcNoise(x, y, this.time);
          if (arcNoise > 1 - arcFrequency) {
            const arcBrightness = (arcNoise - (1 - arcFrequency)) / arcFrequency * arcIntensity;
            r = Math.min(255, r + 255 * arcBrightness);
            g = Math.min(255, g + 255 * arcBrightness);
            b = Math.min(255, b + 255 * arcBrightness);
          }
        }
        
        // Apply mask if provided
        let alpha = 255;
        if (mask && x < mask.width && y < mask.height) {
          const maskIdx = (y * mask.width + x) * mask.channels;
          const maskValue = mask.data[maskIdx] / 255;
          r *= maskValue;
          g *= maskValue;
          b *= maskValue;
          alpha = maskValue * 255;
        }
        
        data[idx] = Math.min(255, Math.max(0, r));
        data[idx + 1] = Math.min(255, Math.max(0, g));
        data[idx + 2] = Math.min(255, Math.max(0, b));
        data[idx + 3] = alpha;
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
  }

  private arcNoise(x: number, y: number, t: number): number {
    const scale = 0.01;
    let val = Math.sin(x * scale + t * 2) * Math.cos(y * scale + t * 1.5);
    val += Math.sin((x + y) * scale * 0.5 + t * 3) * 0.5;
    return (val + 1.5) / 3;
  }
}
