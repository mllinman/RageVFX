/**
 * OceanModifierNode - Maya-style ocean surface modifier
 * Version 3.6 - Maya Tools
 * 
 * Creates realistic ocean surfaces using FFT-based simulation
 */

import { Node, DataType } from '../core/Node';

export class OceanModifierNode extends Node {
  private oceanGrid: Float32Array | null = null;
  private time: number = 0;

  constructor(id: string) {
    super(id, 'OceanModifier', 'Ocean Modifier');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Maya-style ocean surface generation with FFT-based wave simulation';
    this.metadata.version = '3.6.0';
    
    // Inputs
    this.addInput('mesh', 'Base Mesh', DataType.GEOMETRY_3D);
    
    // Outputs
    this.addOutput('ocean', 'Ocean Surface', DataType.GEOMETRY_3D);
    this.addOutput('displacement', 'Displacement Map', DataType.IMAGE);
    this.addOutput('foam', 'Foam Map', DataType.IMAGE);
    this.addOutput('normals', 'Normal Map', DataType.IMAGE);
    
    // Ocean Properties
    this.setParameter('oceanScale', 100.0); // Overall ocean scale
    this.setParameter('resolution', 512); // Grid resolution (power of 2)
    this.setParameter('oceanDepth', 10000.0); // Ocean depth in meters
    
    // Wave Parameters
    this.setParameter('waveScale', 1.0); // Wave height multiplier
    this.setParameter('waveSpeed', 1.0); // Animation speed
    this.setParameter('waveDirection', { x: 1, y: 0 }); // Primary wave direction
    this.setParameter('windSpeed', 30.0); // Wind speed in m/s
    this.setParameter('windAlign', 0.5); // Wind alignment (0-1)
    this.setParameter('fetch', 100000.0); // Fetch distance in meters
    this.setParameter('chopAmount', 1.0); // Choppiness (0-5)
    
    // Wave Spectrum
    this.setParameter('spectrumType', 'phillips'); // phillips, jonswap, pierson-moskowitz
    this.setParameter('peakOmega', 0.84); // For JONSWAP spectrum
    this.setParameter('peakEnhancement', 3.3); // For JONSWAP spectrum
    
    // Detail Waves
    this.setParameter('smallWavesEnabled', true);
    this.setParameter('smallWavesScale', 0.1);
    this.setParameter('smallWavesSpeed', 2.0);
    
    // Foam
    this.setParameter('foamEnabled', true);
    this.setParameter('foamThreshold', 0.5);
    this.setParameter('foamIntensity', 1.0);
    this.setParameter('foamDecay', 0.95);
    this.setParameter('foamCoverage', 0.3);
    
    // Displacement
    this.setParameter('displacementEnabled', true);
    this.setParameter('displacementHeight', 1.0);
    this.setParameter('horizontalDisplacement', true);
    
    // Time
    this.setParameter('time', 0);
    this.setParameter('timeScale', 1.0);
    this.setParameter('loop', true);
    this.setParameter('loopDuration', 1000); // Frames
    
    // Advanced
    this.setParameter('repeatX', 1);
    this.setParameter('repeatY', 1);
    this.setParameter('damping', 0.001);
    this.setParameter('suppressSmallWaves', 0.0001);
  }

  async process(): Promise<void> {
    const meshInput = this.inputs.get('mesh');
    
    const oceanOutput = this.outputs.get('ocean');
    const displacementOutput = this.outputs.get('displacement');
    const foamOutput = this.outputs.get('foam');
    const normalsOutput = this.outputs.get('normals');
    
    if (!oceanOutput) return;
    
    // Update time
    const timeScale = this.getParameter('timeScale') as number;
    const waveSpeed = this.getParameter('waveSpeed') as number;
    this.time += 1 / 60 * timeScale * waveSpeed;
    
    // Generate ocean surface
    const resolution = this.getParameter('resolution') as number;
    const oceanScale = this.getParameter('oceanScale') as number;
    
    // Initialize ocean grid if needed
    if (!this.oceanGrid || this.oceanGrid.length !== resolution * resolution * 3) {
      this.oceanGrid = new Float32Array(resolution * resolution * 3);
    }
    
    // Generate wave heightfield using Gerstner waves (simplified FFT simulation)
    this.generateOceanWaves(resolution, oceanScale);
    
    // Generate foam
    if (this.getParameter('foamEnabled')) {
      this.generateFoam(resolution);
    }
    
    // Output ocean data
    oceanOutput.value = {
      vertices: this.oceanGrid,
      resolution: resolution,
      scale: oceanScale
    };
    
    if (displacementOutput) {
      displacementOutput.value = this.generateDisplacementMap(resolution);
    }
    
    if (foamOutput) {
      foamOutput.value = this.generateFoamMap(resolution);
    }
    
    if (normalsOutput) {
      normalsOutput.value = this.generateNormalMap(resolution);
    }
  }
  
  private generateOceanWaves(resolution: number, scale: number): void {
    const waveScale = this.getParameter('waveScale') as number;
    const windSpeed = this.getParameter('windSpeed') as number;
    const windAlign = this.getParameter('windAlign') as number;
    const waveDirection = this.getParameter('waveDirection') as { x: number; y: number };
    const chopAmount = this.getParameter('chopAmount') as number;
    
    // Normalize wind direction
    const windDirLength = Math.sqrt(waveDirection.x * waveDirection.x + waveDirection.y * waveDirection.y);
    const windDirNorm = {
      x: waveDirection.x / windDirLength,
      y: waveDirection.y / windDirLength
    };
    
    // Generate Gerstner waves
    const numWaves = 8;
    const gravity = 9.81;
    
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const px = (x / resolution - 0.5) * scale;
        const py = (y / resolution - 0.5) * scale;
        
        let height = 0;
        let displacementX = 0;
        let displacementY = 0;
        
        // Sum multiple wave components
        for (let i = 0; i < numWaves; i++) {
          const wavelength = 10 * Math.pow(2, i);
          const k = 2 * Math.PI / wavelength;
          const amplitude = waveScale * (1.0 / (i + 1));
          const omega = Math.sqrt(gravity * k);
          
          // Wave direction variation
          const angle = i * Math.PI / 4;
          const dirX = windDirNorm.x * Math.cos(angle) - windDirNorm.y * Math.sin(angle);
          const dirY = windDirNorm.x * Math.sin(angle) + windDirNorm.y * Math.cos(angle);
          
          const phase = k * (dirX * px + dirY * py) - omega * this.time;
          const cosPhase = Math.cos(phase);
          const sinPhase = Math.sin(phase);
          
          // Height
          height += amplitude * sinPhase;
          
          // Horizontal displacement (choppiness)
          if (chopAmount > 0) {
            displacementX += chopAmount * dirX * amplitude * cosPhase;
            displacementY += chopAmount * dirY * amplitude * cosPhase;
          }
        }
        
        // Store vertex data
        const index = (y * resolution + x) * 3;
        this.oceanGrid![index] = px + displacementX;
        this.oceanGrid![index + 1] = height;
        this.oceanGrid![index + 2] = py + displacementY;
      }
    }
  }
  
  private generateFoam(resolution: number): void {
    // Foam generation based on wave curvature and velocity
    const foamThreshold = this.getParameter('foamThreshold') as number;
    const foamIntensity = this.getParameter('foamIntensity') as number;
    
    // This would calculate foam based on Jacobian of displacement field
    // Simplified for now
  }
  
  private generateDisplacementMap(resolution: number): any {
    if (!this.oceanGrid) return null;
    
    // Create displacement texture from heightfield
    const displacementHeight = this.getParameter('displacementHeight') as number;
    
    // Create canvas for displacement map
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const imageData = ctx.createImageData(resolution, resolution);
        
        for (let i = 0; i < resolution * resolution; i++) {
          const height = this.oceanGrid[i * 3 + 1];
          const normalized = (height / displacementHeight + 1) * 0.5;
          const value = Math.max(0, Math.min(255, normalized * 255));
          
          imageData.data[i * 4] = value;
          imageData.data[i * 4 + 1] = value;
          imageData.data[i * 4 + 2] = value;
          imageData.data[i * 4 + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      }
    }
    
    return null;
  }
  
  private generateFoamMap(resolution: number): any {
    if (!this.oceanGrid) return null;
    
    const foamIntensity = this.getParameter('foamIntensity') as number;
    
    // Create canvas for foam map
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const imageData = ctx.createImageData(resolution, resolution);
        
        // Calculate foam based on wave steepness
        for (let y = 0; y < resolution; y++) {
          for (let x = 0; x < resolution; x++) {
            const i = y * resolution + x;
            
            // Calculate gradient for foam
            const dx = x < resolution - 1 ? 
              this.oceanGrid[(i + 1) * 3 + 1] - this.oceanGrid[i * 3 + 1] : 0;
            const dy = y < resolution - 1 ? 
              this.oceanGrid[(i + resolution) * 3 + 1] - this.oceanGrid[i * 3 + 1] : 0;
            
            const gradient = Math.sqrt(dx * dx + dy * dy);
            const foam = Math.min(1, gradient * foamIntensity * 10);
            const foamValue = Math.floor(foam * 255);
            
            imageData.data[i * 4] = foamValue;
            imageData.data[i * 4 + 1] = foamValue;
            imageData.data[i * 4 + 2] = foamValue;
            imageData.data[i * 4 + 3] = 255;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      }
    }
    
    return null;
  }
  
  private generateNormalMap(resolution: number): any {
    if (!this.oceanGrid) return null;
    
    // Create canvas for normal map
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const imageData = ctx.createImageData(resolution, resolution);
        
        // Calculate normals from heightfield
        for (let y = 0; y < resolution; y++) {
          for (let x = 0; x < resolution; x++) {
            const i = y * resolution + x;
            
            // Get neighboring heights
            const hL = x > 0 ? this.oceanGrid[(i - 1) * 3 + 1] : this.oceanGrid[i * 3 + 1];
            const hR = x < resolution - 1 ? this.oceanGrid[(i + 1) * 3 + 1] : this.oceanGrid[i * 3 + 1];
            const hD = y > 0 ? this.oceanGrid[(i - resolution) * 3 + 1] : this.oceanGrid[i * 3 + 1];
            const hU = y < resolution - 1 ? this.oceanGrid[(i + resolution) * 3 + 1] : this.oceanGrid[i * 3 + 1];
            
            // Calculate normal
            const nx = hL - hR;
            const ny = 2.0; // Vertical scale
            const nz = hD - hU;
            
            // Normalize
            const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
            const normalizedX = (nx / length + 1) * 0.5;
            const normalizedY = (ny / length + 1) * 0.5;
            const normalizedZ = (nz / length + 1) * 0.5;
            
            imageData.data[i * 4] = Math.floor(normalizedX * 255);
            imageData.data[i * 4 + 1] = Math.floor(normalizedY * 255);
            imageData.data[i * 4 + 2] = Math.floor(normalizedZ * 255);
            imageData.data[i * 4 + 3] = 255;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      }
    }
    
    return null;
  }
  
  dispose(): void {
    this.oceanGrid = null;
    super.dispose();
  }
}
