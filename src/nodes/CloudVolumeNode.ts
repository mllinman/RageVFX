/**
 * CloudVolumeNode - Volumetric cloud rendering
 * Version 2.0 - Volumetric Effects
 */

import { Node, DataType } from '../core/Node';

export class CloudVolumeNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'CloudVolume', 'Cloud Volume');
    this.metadata.category = 'Volumetric';
    this.metadata.description = 'Volumetric cloud rendering';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addInput('depth', 'Depth', DataType.IMAGE);
    
    // Outputs
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('cloudMask', 'Cloud Mask', DataType.IMAGE);
    this.addOutput('cloudDepth', 'Cloud Depth', DataType.IMAGE);
    
    // Render settings
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('samples', 64);
    this.setParameter('quality', 'high');
    
    // Cloud shape
    this.setParameter('coverage', 0.5);
    this.setParameter('cloudHeight', 2000);
    this.setParameter('cloudThickness', 500);
    this.setParameter('density', 0.05);
    this.setParameter('detail', 0.5);
    
    // Cloud layers
    this.setParameter('layers', 1);
    this.setParameter('layerSpacing', 1000);
    
    // Noise settings
    this.setParameter('noiseScale', 0.001);
    this.setParameter('noiseOctaves', 4);
    this.setParameter('noisePersistence', 0.5);
    this.setParameter('noiseOffset', { x: 0, y: 0, z: 0 });
    
    // Animation
    this.setParameter('animated', true);
    this.setParameter('windSpeed', { x: 10, y: 0, z: 5 });
    this.setParameter('windTurbulence', 0.1);
    
    // Lighting
    this.setParameter('sunDirection', { x: 0.5, y: 0.8, z: 0.3 });
    this.setParameter('sunColor', { r: 255, g: 250, b: 230 });
    this.setParameter('sunIntensity', 1.5);
    this.setParameter('ambientColor', { r: 150, g: 180, b: 220 });
    this.setParameter('ambientIntensity', 0.3);
    
    // Scattering
    this.setParameter('scattering', 0.7);
    this.setParameter('absorption', 0.05);
    this.setParameter('silverLining', 0.5);
    this.setParameter('silverIntensity', 1.0);
    
    // Appearance
    this.setParameter('cloudColor', { r: 255, g: 255, b: 255 });
    this.setParameter('shadowColor', { r: 100, g: 110, b: 130 });
    this.setParameter('shadowStrength', 0.5);
  }

  async process(): Promise<void> {
    const bgInput = this.inputs.get('background');
    
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const samples = this.getParameter('samples');
    const coverage = this.getParameter('coverage');
    const cloudHeight = this.getParameter('cloudHeight');
    const cloudThickness = this.getParameter('cloudThickness');
    const density = this.getParameter('density');
    const noiseScale = this.getParameter('noiseScale');
    const sunDir = this.getParameter('sunDirection');
    const sunColor = this.getParameter('sunColor');
    const sunIntensity = this.getParameter('sunIntensity');
    const cloudColor = this.getParameter('cloudColor');
    const shadowColor = this.getParameter('shadowColor');
    const windSpeed = this.getParameter('windSpeed');
    
    // Update time for animation
    if (this.getParameter('animated')) {
      this.time += 0.016; // Assuming 60fps
    }
    
    const outputData = new Uint8Array(width * height * 4);
    const cloudMaskData = new Uint8Array(width * height * 4);
    const cloudDepthData = new Float32Array(width * height);
    
    const bgData = bgInput?.value?.data;
    
    // Normalize sun direction
    const sunLen = Math.sqrt(sunDir.x * sunDir.x + sunDir.y * sunDir.y + sunDir.z * sunDir.z);
    const normSunX = sunDir.x / sunLen;
    const normSunY = sunDir.y / sunLen;
    const normSunZ = sunDir.z / sunLen;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const i = (py * width + px) * 4;
        const di = py * width + px;
        
        // Ray direction (simplified perspective projection)
        const ndcX = (2 * px / width - 1);
        const ndcY = (1 - 2 * py / height);
        
        const rayDirX = ndcX * 0.5;
        const rayDirY = ndcY * 0.5 + 0.3; // Look slightly up
        const rayDirZ = 1;
        const rayLen = Math.sqrt(rayDirX * rayDirX + rayDirY * rayDirY + rayDirZ * rayDirZ);
        const normRayX = rayDirX / rayLen;
        const normRayY = rayDirY / rayLen;
        const normRayZ = rayDirZ / rayLen;
        
        // Ray march through cloud layer
        let lightEnergy = 1.0;
        let transmittance = 1.0;
        let cloudHitDepth = 10000;
        
        // Calculate entry/exit points for cloud layer
        if (normRayY > 0.001) { // Ray going up
          const tEntry = (cloudHeight - 0) / normRayY;
          const tExit = (cloudHeight + cloudThickness) / normRayY;
          
          const stepSize = (tExit - tEntry) / samples;
          
          for (let s = 0; s < samples && transmittance > 0.01; s++) {
            const t = tEntry + s * stepSize;
            
            // Sample position
            const sampleX = normRayX * t + windSpeed.x * this.time;
            const sampleY = normRayY * t;
            const sampleZ = normRayZ * t + windSpeed.z * this.time;
            
            // Sample cloud density using noise
            const noise = this.sampleCloudNoise(sampleX * noiseScale, sampleY * noiseScale, sampleZ * noiseScale);
            const localDensity = Math.max(0, noise - (1 - coverage)) * density;
            
            if (localDensity > 0) {
              if (cloudHitDepth === 10000) {
                cloudHitDepth = t;
              }
              
              // Light sampling towards sun
              let lightDensity = 0;
              const lightSamples = 6;
              for (let ls = 1; ls <= lightSamples; ls++) {
                const lightT = ls * 50;
                const lightX = sampleX + normSunX * lightT;
                const lightY = sampleY + normSunY * lightT;
                const lightZ = sampleZ + normSunZ * lightT;
                
                const lightNoise = this.sampleCloudNoise(lightX * noiseScale, lightY * noiseScale, lightZ * noiseScale);
                lightDensity += Math.max(0, lightNoise - (1 - coverage)) * density;
              }
              
              // Beer-Lambert law for light attenuation
              const lightTransmittance = Math.exp(-lightDensity * 0.5);
              lightEnergy = lightTransmittance;
              
              // Accumulate cloud
              const absorption = localDensity * stepSize * this.getParameter('absorption');
              transmittance *= Math.exp(-absorption);
            }
          }
        }
        
        const cloudAmount = 1 - transmittance;
        
        // Get background color
        let bgR = 135, bgG = 206, bgB = 235; // Default sky blue
        if (bgData) {
          bgR = bgData[i] || bgR;
          bgG = bgData[i + 1] || bgG;
          bgB = bgData[i + 2] || bgB;
        }
        
        // Calculate cloud color with lighting
        const litColor = {
          r: cloudColor.r * (lightEnergy * sunIntensity) + shadowColor.r * (1 - lightEnergy),
          g: cloudColor.g * (lightEnergy * sunIntensity) + shadowColor.g * (1 - lightEnergy),
          b: cloudColor.b * (lightEnergy * sunIntensity) + shadowColor.b * (1 - lightEnergy)
        };
        
        // Add sun-facing silver lining
        const dotSun = normRayX * normSunX + normRayY * normSunY + normRayZ * normSunZ;
        const silverLining = Math.pow(Math.max(0, dotSun), 8) * this.getParameter('silverIntensity') * cloudAmount;
        
        litColor.r = Math.min(255, litColor.r + sunColor.r * silverLining);
        litColor.g = Math.min(255, litColor.g + sunColor.g * silverLining);
        litColor.b = Math.min(255, litColor.b + sunColor.b * silverLining);
        
        // Blend cloud with background
        outputData[i] = Math.round(bgR * transmittance + litColor.r * cloudAmount);
        outputData[i + 1] = Math.round(bgG * transmittance + litColor.g * cloudAmount);
        outputData[i + 2] = Math.round(bgB * transmittance + litColor.b * cloudAmount);
        outputData[i + 3] = 255;
        
        // Cloud mask
        const maskValue = Math.round(cloudAmount * 255);
        cloudMaskData[i] = maskValue;
        cloudMaskData[i + 1] = maskValue;
        cloudMaskData[i + 2] = maskValue;
        cloudMaskData[i + 3] = 255;
        
        // Cloud depth
        cloudDepthData[di] = cloudHitDepth;
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
    
    const maskOutput = this.outputs.get('cloudMask');
    if (maskOutput) {
      maskOutput.value = {
        width,
        height,
        channels: 4,
        data: cloudMaskData,
        format: 'rgba'
      };
    }
    
    const depthOutput = this.outputs.get('cloudDepth');
    if (depthOutput) {
      depthOutput.value = {
        width,
        height,
        channels: 1,
        data: cloudDepthData,
        format: 'float'
      };
    }
  }

  private sampleCloudNoise(x: number, y: number, z: number): number {
    const octaves = this.getParameter('noiseOctaves');
    const persistence = this.getParameter('noisePersistence');
    const offset = this.getParameter('noiseOffset');
    
    x += offset.x;
    y += offset.y;
    z += offset.z;
    
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let o = 0; o < octaves; o++) {
      value += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    return value / maxValue;
  }

  private noise3D(x: number, y: number, z: number): number {
    // Simple gradient noise implementation
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    
    // Hash coordinates
    const hash = (n: number) => {
      n = (n << 13) ^ n;
      return (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    };
    
    const n000 = hash(X + Y * 57 + Z * 113);
    const n001 = hash(X + Y * 57 + (Z + 1) * 113);
    const n010 = hash(X + (Y + 1) * 57 + Z * 113);
    const n011 = hash(X + (Y + 1) * 57 + (Z + 1) * 113);
    const n100 = hash((X + 1) + Y * 57 + Z * 113);
    const n101 = hash((X + 1) + Y * 57 + (Z + 1) * 113);
    const n110 = hash((X + 1) + (Y + 1) * 57 + Z * 113);
    const n111 = hash((X + 1) + (Y + 1) * 57 + (Z + 1) * 113);
    
    const x00 = this.lerp(n000, n100, u);
    const x01 = this.lerp(n001, n101, u);
    const x10 = this.lerp(n010, n110, u);
    const x11 = this.lerp(n011, n111, u);
    
    const y0 = this.lerp(x00, x10, v);
    const y1 = this.lerp(x01, x11, v);
    
    return (this.lerp(y0, y1, w) + 1) / 2;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
}
