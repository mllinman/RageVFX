/**
 * ShockwaveNode - Expanding shockwave distortion effects
 * Creates radial distortion waves for explosion and impact effects
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class ShockwaveNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'Shockwave', 'Shockwave');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Create expanding shockwave distortion effects';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('mask', 'Mask', DataType.IMAGE);
    
    // Position
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
    
    // Wave properties
    this.setParameter('radius', 0.3);
    this.setParameter('thickness', 0.1);
    this.setParameter('distortion', 0.05);
    this.setParameter('falloff', 2.0);
    
    // Expansion animation
    this.setParameter('animate', true);
    this.setParameter('speed', 1.0);
    this.setParameter('maxRadius', 1.5);
    this.setParameter('loop', true);
    
    // Multiple waves
    this.setParameter('waveCount', 1);
    this.setParameter('waveDelay', 0.2);
    
    // Edge effects
    this.setParameter('edgeGlow', true);
    this.setParameter('edgeColor', { r: 255, g: 200, b: 100 });
    this.setParameter('edgeIntensity', 0.5);
    
    // Chromatic aberration
    this.setParameter('chromaticAberration', 0.0);
    
    // Refraction
    this.setParameter('refractionIndex', 1.0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    const maskOutput = this.outputs.get('mask');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    const centerX = this.getParameter('centerX');
    const centerY = this.getParameter('centerY');
    const baseRadius = this.getParameter('radius');
    const thickness = this.getParameter('thickness');
    const distortion = this.getParameter('distortion');
    const falloff = this.getParameter('falloff');
    const animate = this.getParameter('animate');
    const speed = this.getParameter('speed');
    const maxRadius = this.getParameter('maxRadius');
    const loop = this.getParameter('loop');
    const waveCount = this.getParameter('waveCount');
    const waveDelay = this.getParameter('waveDelay');
    const edgeGlow = this.getParameter('edgeGlow');
    const edgeColor = this.getParameter('edgeColor');
    const edgeIntensity = this.getParameter('edgeIntensity');
    const chromaticAberration = this.getParameter('chromaticAberration');
    
    const width = inputImage?.width || 1920;
    const height = inputImage?.height || 1080;
    const aspectRatio = width / height;
    
    if (animate) {
      this.time += 0.016 * speed;
      if (loop && this.time > maxRadius / speed) {
        this.time = 0;
      }
    }
    
    const outData = new Uint8Array(width * height * 4);
    const maskData = new Uint8Array(width * height * 4);
    
    // Initialize output
    if (!inputImage) {
      outData.fill(0);
      for (let i = 3; i < outData.length; i += 4) {
        outData[i] = 255;
      }
    }
    
    const cx = centerX * width;
    const cy = centerY * height;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate distance from center (normalized)
        const dx = (x - cx) / width;
        const dy = (y - cy) / height * aspectRatio;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Calculate total wave displacement
        let totalDisplacement = 0;
        let maxWaveIntensity = 0;
        
        for (let w = 0; w < waveCount; w++) {
          const waveTime = Math.max(0, this.time - w * waveDelay);
          const currentRadius = animate ? baseRadius * waveTime * speed : baseRadius;
          
          if (currentRadius > 0 && currentRadius < maxRadius) {
            // Distance from wave front
            const waveDist = Math.abs(dist - currentRadius);
            const halfThickness = thickness / 2;
            
            if (waveDist < halfThickness) {
              // Wave intensity based on distance from wave edge
              const waveIntensity = Math.pow(1 - waveDist / halfThickness, falloff);
              
              // Direction of displacement (outward from center)
              const displacement = distortion * waveIntensity * (dist < currentRadius ? -1 : 1);
              
              totalDisplacement += displacement;
              maxWaveIntensity = Math.max(maxWaveIntensity, waveIntensity);
            }
          }
        }
        
        // Sample with displacement
        let sampledR = 0, sampledG = 0, sampledB = 0, sampledA = 255;
        
        if (inputImage) {
          if (chromaticAberration > 0) {
            // Sample each color channel with different displacement
            const displacements = [
              totalDisplacement * (1 + chromaticAberration),
              totalDisplacement,
              totalDisplacement * (1 - chromaticAberration)
            ];
            
            for (let c = 0; c < 3; c++) {
              const sampleX = cx + Math.cos(angle) * (dist + displacements[c]) * width;
              const sampleY = cy + Math.sin(angle) * (dist + displacements[c]) / aspectRatio * height;
              
              const sx = Math.floor(Math.max(0, Math.min(width - 1, sampleX)));
              const sy = Math.floor(Math.max(0, Math.min(height - 1, sampleY)));
              const sampleIdx = (sy * inputImage.width + sx) * inputImage.channels;
              
              if (c === 0) sampledR = inputImage.data[sampleIdx];
              if (c === 1) sampledG = inputImage.data[sampleIdx + 1];
              if (c === 2) sampledB = inputImage.data[sampleIdx + 2];
            }
            
            const sampleX = cx + Math.cos(angle) * (dist + totalDisplacement) * width;
            const sampleY = cy + Math.sin(angle) * (dist + totalDisplacement) / aspectRatio * height;
            const sx = Math.floor(Math.max(0, Math.min(width - 1, sampleX)));
            const sy = Math.floor(Math.max(0, Math.min(height - 1, sampleY)));
            const sampleIdx = (sy * inputImage.width + sx) * inputImage.channels;
            sampledA = inputImage.channels === 4 ? inputImage.data[sampleIdx + 3] : 255;
          } else {
            // Simple displacement
            const sampleX = cx + Math.cos(angle) * (dist + totalDisplacement) * width;
            const sampleY = cy + Math.sin(angle) * (dist + totalDisplacement) / aspectRatio * height;
            
            const sx = Math.floor(Math.max(0, Math.min(width - 1, sampleX)));
            const sy = Math.floor(Math.max(0, Math.min(height - 1, sampleY)));
            const sampleIdx = (sy * inputImage.width + sx) * inputImage.channels;
            
            sampledR = inputImage.data[sampleIdx];
            sampledG = inputImage.data[sampleIdx + 1];
            sampledB = inputImage.data[sampleIdx + 2];
            sampledA = inputImage.channels === 4 ? inputImage.data[sampleIdx + 3] : 255;
          }
        }
        
        // Add edge glow
        if (edgeGlow && maxWaveIntensity > 0) {
          const glowAmount = maxWaveIntensity * edgeIntensity;
          sampledR = Math.min(255, sampledR + edgeColor.r * glowAmount);
          sampledG = Math.min(255, sampledG + edgeColor.g * glowAmount);
          sampledB = Math.min(255, sampledB + edgeColor.b * glowAmount);
        }
        
        outData[idx] = sampledR;
        outData[idx + 1] = sampledG;
        outData[idx + 2] = sampledB;
        outData[idx + 3] = sampledA;
        
        // Mask output
        const maskValue = Math.min(255, maxWaveIntensity * 255);
        maskData[idx] = maskValue;
        maskData[idx + 1] = maskValue;
        maskData[idx + 2] = maskValue;
        maskData[idx + 3] = 255;
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
    
    if (maskOutput) {
      maskOutput.value = {
        width,
        height,
        channels: 4,
        data: maskData,
        format: 'rgba'
      };
    }
  }
}
