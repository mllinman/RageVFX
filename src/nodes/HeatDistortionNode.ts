/**
 * HeatDistortionNode - Heat wave distortion effect
 * Creates realistic heat shimmer distortion for hot surfaces
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class HeatDistortionNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'HeatDistortion', 'Heat Distortion');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Create realistic heat shimmer distortion effects';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('mask', 'Heat Mask', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Distortion
    this.setParameter('intensity', 0.02);
    this.setParameter('frequency', 50);
    this.setParameter('verticalBias', 2.0);
    
    // Wave properties
    this.setParameter('waveSpeed', 2.0);
    this.setParameter('waveScale', 1.0);
    this.setParameter('turbulence', 0.5);
    
    // Region
    this.setParameter('useGradient', true);
    this.setParameter('gradientStart', 0.7);
    this.setParameter('gradientEnd', 1.0);
    
    // Additional effects
    this.setParameter('chromatic', 0.0);
    this.setParameter('blur', 0.0);
    
    // Multiple frequencies
    this.setParameter('octaves', 3);
    this.setParameter('persistence', 0.5);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const maskInput = this.inputs.get('mask');
    const output = this.outputs.get('image');
    
    if (!output) return;

    const inputImage = input?.value as ImageData | undefined;
    
    if (!inputImage) {
      output.value = null;
      return;
    }
    
    const mask = maskInput?.value as ImageData | undefined;
    const intensity = this.getParameter('intensity');
    const frequency = this.getParameter('frequency');
    const verticalBias = this.getParameter('verticalBias');
    const waveSpeed = this.getParameter('waveSpeed');
    const waveScale = this.getParameter('waveScale');
    const turbulence = this.getParameter('turbulence');
    const useGradient = this.getParameter('useGradient');
    const gradientStart = this.getParameter('gradientStart');
    const gradientEnd = this.getParameter('gradientEnd');
    const chromatic = this.getParameter('chromatic');
    const blur = this.getParameter('blur');
    const octaves = this.getParameter('octaves');
    const persistence = this.getParameter('persistence');
    
    this.time += 0.016 * waveSpeed;
    
    const width = inputImage.width;
    const height = inputImage.height;
    
    const outData = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate distortion mask
        let distortionMask = 1.0;
        
        if (mask && x < mask.width && y < mask.height) {
          const maskIdx = (y * mask.width + x) * mask.channels;
          distortionMask = mask.data[maskIdx] / 255;
        } else if (useGradient) {
          const normalizedY = y / height;
          if (normalizedY < gradientStart) {
            distortionMask = 0;
          } else if (normalizedY < gradientEnd) {
            distortionMask = (normalizedY - gradientStart) / (gradientEnd - gradientStart);
          }
        }
        
        if (distortionMask <= 0) {
          // No distortion - copy original pixel
          const srcIdx = (y * width + x) * inputImage.channels;
          outData[idx] = inputImage.data[srcIdx];
          outData[idx + 1] = inputImage.data[srcIdx + 1];
          outData[idx + 2] = inputImage.data[srcIdx + 2];
          outData[idx + 3] = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
          continue;
        }
        
        // Multi-octave noise for heat distortion
        let offsetX = 0;
        let offsetY = 0;
        let amplitude = intensity;
        let freq = frequency;
        
        for (let o = 0; o < octaves; o++) {
          // Primary heat wave (mostly vertical movement)
          const wave1 = Math.sin((y * waveScale / freq + this.time) * 0.1);
          const wave2 = Math.sin((x * waveScale / freq * 0.5 + this.time * 1.3) * 0.1);
          
          // Add turbulence
          const turbWave = Math.sin((x + y) * waveScale / freq * 0.3 + this.time * 0.7) * turbulence;
          
          offsetX += (wave1 + turbWave) * amplitude * width;
          offsetY += (wave2 + wave1 * verticalBias) * amplitude * height;
          
          amplitude *= persistence;
          freq *= 0.5;
        }
        
        // Apply distortion mask
        offsetX *= distortionMask;
        offsetY *= distortionMask;
        
        // Sample with distortion
        if (chromatic > 0 && distortionMask > 0) {
          // Chromatic aberration
          const samples = [
            { x: offsetX * (1 + chromatic), y: offsetY * (1 + chromatic) },
            { x: offsetX, y: offsetY },
            { x: offsetX * (1 - chromatic), y: offsetY * (1 - chromatic) }
          ];
          
          for (let c = 0; c < 3; c++) {
            const sampleX = Math.floor(Math.max(0, Math.min(width - 1, x + samples[c].x)));
            const sampleY = Math.floor(Math.max(0, Math.min(height - 1, y + samples[c].y)));
            const srcIdx = (sampleY * width + sampleX) * inputImage.channels;
            
            if (blur > 0 && distortionMask > 0) {
              // Simple blur by averaging neighbors
              outData[idx + c] = this.sampleWithBlur(inputImage, sampleX, sampleY, c, blur * distortionMask);
            } else {
              outData[idx + c] = inputImage.data[srcIdx + c];
            }
          }
          
          const sampleX = Math.floor(Math.max(0, Math.min(width - 1, x + offsetX)));
          const sampleY = Math.floor(Math.max(0, Math.min(height - 1, y + offsetY)));
          const srcIdx = (sampleY * width + sampleX) * inputImage.channels;
          outData[idx + 3] = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
        } else {
          // No chromatic aberration
          const sampleX = Math.floor(Math.max(0, Math.min(width - 1, x + offsetX)));
          const sampleY = Math.floor(Math.max(0, Math.min(height - 1, y + offsetY)));
          
          if (blur > 0 && distortionMask > 0) {
            outData[idx] = this.sampleWithBlur(inputImage, sampleX, sampleY, 0, blur * distortionMask);
            outData[idx + 1] = this.sampleWithBlur(inputImage, sampleX, sampleY, 1, blur * distortionMask);
            outData[idx + 2] = this.sampleWithBlur(inputImage, sampleX, sampleY, 2, blur * distortionMask);
            
            const srcIdx = (sampleY * inputImage.width + sampleX) * inputImage.channels;
            outData[idx + 3] = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
          } else {
            const srcIdx = (sampleY * inputImage.width + sampleX) * inputImage.channels;
            outData[idx] = inputImage.data[srcIdx];
            outData[idx + 1] = inputImage.data[srcIdx + 1];
            outData[idx + 2] = inputImage.data[srcIdx + 2];
            outData[idx + 3] = inputImage.channels === 4 ? inputImage.data[srcIdx + 3] : 255;
          }
        }
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

  private sampleWithBlur(image: ImageData, x: number, y: number, channel: number, radius: number): number {
    const r = Math.ceil(radius);
    let sum = 0;
    let count = 0;
    
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const sx = Math.max(0, Math.min(image.width - 1, x + dx));
        const sy = Math.max(0, Math.min(image.height - 1, y + dy));
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= radius) {
          const weight = 1 - dist / (radius + 1);
          const idx = (sy * image.width + sx) * image.channels + channel;
          sum += image.data[idx] * weight;
          count += weight;
        }
      }
    }
    
    return count > 0 ? sum / count : 0;
  }
}
