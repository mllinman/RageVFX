/**
 * VolumeRenderNode - 3D volume rendering for medical/scientific visualization
 * Version 2.0 - Volumetric Effects
 */

import { Node, DataType } from '../core/Node';

export interface VolumeData {
  width: number;
  height: number;
  depth: number;
  data: Float32Array | Uint8Array;
  spacing: { x: number; y: number; z: number };
}

export class VolumeRenderNode extends Node {
  private volumeData: VolumeData | null = null;

  constructor(id: string) {
    super(id, 'VolumeRender', 'Volume Render');
    this.metadata.category = 'Volumetric';
    this.metadata.description = '3D volume rendering for data visualization';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('volume', 'Volume Data', DataType.ANY);
    this.addInput('transferFunction', 'Transfer Function', DataType.IMAGE);
    
    // Outputs
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('depth', 'Depth', DataType.IMAGE);
    
    // Render settings
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('renderMode', 'raycast'); // raycast, mip, average, isosurface
    this.setParameter('samples', 256);
    this.setParameter('quality', 'high');
    
    // Camera/view settings
    this.setParameter('cameraPosition', { x: 0, y: 0, z: 2 });
    this.setParameter('cameraTarget', { x: 0, y: 0, z: 0 });
    this.setParameter('fov', 60);
    
    // Volume properties
    this.setParameter('densityScale', 1.0);
    this.setParameter('brightness', 1.0);
    this.setParameter('contrast', 1.0);
    
    // Isosurface settings
    this.setParameter('isoValue', 0.5);
    this.setParameter('isoSmoothing', 0.01);
    
    // Transfer function (color mapping)
    this.setParameter('colorMapType', 'grayscale'); // grayscale, rainbow, hot, cool, custom
    this.setParameter('alphaScale', 1.0);
    this.setParameter('windowCenter', 0.5);
    this.setParameter('windowWidth', 1.0);
    
    // Lighting for isosurface
    this.setParameter('lighting', true);
    this.setParameter('lightDirection', { x: 0.5, y: 0.5, z: 1 });
    this.setParameter('ambient', 0.2);
    this.setParameter('diffuse', 0.7);
    this.setParameter('specular', 0.3);
    this.setParameter('shininess', 32);
    
    // Clipping planes
    this.setParameter('clipX', { min: 0, max: 1 });
    this.setParameter('clipY', { min: 0, max: 1 });
    this.setParameter('clipZ', { min: 0, max: 1 });
  }

  async process(): Promise<void> {
    const volumeInput = this.inputs.get('volume');
    
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const renderMode = this.getParameter('renderMode');
    const samples = this.getParameter('samples');
    const densityScale = this.getParameter('densityScale');
    const brightness = this.getParameter('brightness');
    
    // Camera setup
    const camPos = this.getParameter('cameraPosition');
    const camTarget = this.getParameter('cameraTarget');
    const fov = this.getParameter('fov');
    
    const outputData = new Uint8Array(width * height * 4);
    const depthData = new Float32Array(width * height);
    
    // Check for volume input
    if (volumeInput?.value) {
      this.volumeData = volumeInput.value as VolumeData;
    }
    
    // Create demo volume if none provided
    if (!this.volumeData) {
      this.volumeData = this.createDemoVolume();
    }
    
    const volume = this.volumeData;
    
    // Calculate ray direction for each pixel
    const aspectRatio = width / height;
    const fovRad = fov * Math.PI / 180;
    const tanFov = Math.tan(fovRad / 2);
    
    // View direction (normalized)
    const viewDirX = camTarget.x - camPos.x;
    const viewDirY = camTarget.y - camPos.y;
    const viewDirZ = camTarget.z - camPos.z;
    const viewLen = Math.sqrt(viewDirX * viewDirX + viewDirY * viewDirY + viewDirZ * viewDirZ);
    const normViewX = viewDirX / viewLen;
    const normViewY = viewDirY / viewLen;
    const normViewZ = viewDirZ / viewLen;
    
    // Right and up vectors (simplified - assumes up is Y)
    const rightX = normViewZ;
    const rightY = 0;
    const rightZ = -normViewX;
    const upX = 0;
    const upY = 1;
    const upZ = 0;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const i = (py * width + px) * 4;
        const di = py * width + px;
        
        // Calculate ray direction in normalized device coordinates
        const ndcX = (2 * px / width - 1) * aspectRatio * tanFov;
        const ndcY = (1 - 2 * py / height) * tanFov;
        
        // Ray direction
        const rayDirX = normViewX + ndcX * rightX + ndcY * upX;
        const rayDirY = normViewY + ndcX * rightY + ndcY * upY;
        const rayDirZ = normViewZ + ndcX * rightZ + ndcY * upZ;
        const rayLen = Math.sqrt(rayDirX * rayDirX + rayDirY * rayDirY + rayDirZ * rayDirZ);
        const normRayX = rayDirX / rayLen;
        const normRayY = rayDirY / rayLen;
        const normRayZ = rayDirZ / rayLen;
        
        // Ray march through volume
        let accumR = 0, accumG = 0, accumB = 0, accumA = 0;
        let hitDepth = 1000;
        
        const stepSize = 2.0 / samples;
        let maxValue = 0;
        let avgSum = 0;
        let avgCount = 0;
        
        for (let s = 0; s < samples && accumA < 0.99; s++) {
          const t = s * stepSize;
          
          // Sample position (normalized 0-1)
          const sampleX = (camPos.x + normRayX * t + 1) / 2;
          const sampleY = (camPos.y + normRayY * t + 1) / 2;
          const sampleZ = (camPos.z + normRayZ * t + 1) / 2;
          
          // Check bounds
          if (sampleX < 0 || sampleX > 1 || sampleY < 0 || sampleY > 1 || sampleZ < 0 || sampleZ > 1) {
            continue;
          }
          
          // Sample volume
          const vx = Math.floor(sampleX * (volume.width - 1));
          const vy = Math.floor(sampleY * (volume.height - 1));
          const vz = Math.floor(sampleZ * (volume.depth - 1));
          const vi = vz * volume.width * volume.height + vy * volume.width + vx;
          
          let density = 0;
          if (volume.data instanceof Float32Array) {
            density = volume.data[vi] || 0;
          } else {
            density = (volume.data[vi] || 0) / 255;
          }
          
          density *= densityScale;
          
          switch (renderMode) {
            case 'mip':
              // Maximum Intensity Projection
              maxValue = Math.max(maxValue, density);
              break;
              
            case 'average':
              // Average Intensity Projection
              avgSum += density;
              avgCount++;
              break;
              
            case 'isosurface': {
              // Isosurface rendering
              const isoValue = this.getParameter('isoValue');
              if (density >= isoValue && hitDepth === 1000) {
                hitDepth = t;
                accumR = density * brightness;
                accumG = density * brightness;
                accumB = density * brightness;
                accumA = 1;
              }
              break;
            }
              
            default: {
              // raycast with compositing
              const alpha = density * 0.1 * this.getParameter('alphaScale');
              const color = this.applyColorMap(density);
              
              // Front-to-back compositing
              accumR += (1 - accumA) * color.r * alpha;
              accumG += (1 - accumA) * color.g * alpha;
              accumB += (1 - accumA) * color.b * alpha;
              accumA += (1 - accumA) * alpha;
              
              if (accumA > 0.01 && hitDepth === 1000) {
                hitDepth = t;
              }
              break;
            }
          }
        }
        
        // Apply render mode results
        switch (renderMode) {
          case 'mip': {
            const mipColor = this.applyColorMap(maxValue);
            accumR = mipColor.r * brightness;
            accumG = mipColor.g * brightness;
            accumB = mipColor.b * brightness;
            accumA = maxValue;
            break;
          }
            
          case 'average': {
            const avgValue = avgCount > 0 ? avgSum / avgCount : 0;
            const avgColor = this.applyColorMap(avgValue);
            accumR = avgColor.r * brightness;
            accumG = avgColor.g * brightness;
            accumB = avgColor.b * brightness;
            accumA = avgValue;
            break;
          }
        }
        
        // Write output
        outputData[i] = Math.round(Math.min(255, accumR * 255));
        outputData[i + 1] = Math.round(Math.min(255, accumG * 255));
        outputData[i + 2] = Math.round(Math.min(255, accumB * 255));
        outputData[i + 3] = Math.round(Math.min(255, accumA * 255));
        
        depthData[di] = hitDepth;
      }
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width,
        height,
        channels: 4,
        data: outputData,
        format: 'rgba'
      };
    }
    
    const depthOutput = this.outputs.get('depth');
    if (depthOutput) {
      depthOutput.value = {
        width,
        height,
        channels: 1,
        data: depthData,
        format: 'float'
      };
    }
  }

  private applyColorMap(value: number): { r: number; g: number; b: number } {
    const colorMapType = this.getParameter('colorMapType');
    const center = this.getParameter('windowCenter');
    const width = this.getParameter('windowWidth');
    
    // Apply window/level
    value = (value - (center - width / 2)) / width;
    value = Math.max(0, Math.min(1, value));
    
    switch (colorMapType) {
      case 'rainbow': {
        const h = (1 - value) * 240 / 360;
        return this.hsvToRgb(h, 1, value);
      }
        
      case 'hot':
        return {
          r: Math.min(1, value * 3),
          g: Math.max(0, Math.min(1, (value - 0.33) * 3)),
          b: Math.max(0, Math.min(1, (value - 0.67) * 3))
        };
        
      case 'cool':
        return {
          r: value,
          g: 1 - value,
          b: 1
        };
        
      default: // grayscale
        return { r: value, g: value, b: value };
    }
  }

  private hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: return { r: v, g: t, b: p };
      case 1: return { r: q, g: v, b: p };
      case 2: return { r: p, g: v, b: t };
      case 3: return { r: p, g: q, b: v };
      case 4: return { r: t, g: p, b: v };
      default: return { r: v, g: p, b: q };
    }
  }

  private createDemoVolume(): VolumeData {
    const size = 64;
    const data = new Float32Array(size * size * size);
    
    // Create a sphere in the center
    const center = size / 2;
    const radius = size / 3;
    
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - center;
          const dy = y - center;
          const dz = z - center;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          const value = Math.max(0, 1 - dist / radius);
          data[z * size * size + y * size + x] = value;
        }
      }
    }
    
    return {
      width: size,
      height: size,
      depth: size,
      data,
      spacing: { x: 1, y: 1, z: 1 }
    };
  }

  dispose(): void {
    this.volumeData = null;
    super.dispose();
  }
}
