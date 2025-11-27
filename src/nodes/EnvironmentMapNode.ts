/**
 * EnvironmentMapNode - HDR environment mapping for 3D scenes
 * Version 2.0 - Full 3D rendering pipeline
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export class EnvironmentMapNode extends Node {
  private envMap: THREE.Texture | null = null;
  private pmremGenerator: THREE.PMREMGenerator | null = null;

  constructor(id: string) {
    super(id, 'EnvironmentMap', 'Environment Map');
    this.metadata.category = '3D Pipeline';
    this.metadata.description = 'HDR environment mapping for IBL';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('hdrImage', 'HDR Image', DataType.IMAGE);
    this.addInput('cubeMap', 'Cube Map', DataType.IMAGE);
    
    // Outputs
    this.addOutput('envMap', 'Environment Map', DataType.ANY);
    this.addOutput('background', 'Background', DataType.ANY);
    this.addOutput('irradiance', 'Irradiance Map', DataType.ANY);
    
    // Parameters
    this.setParameter('type', 'equirectangular'); // equirectangular, cube, gradient
    this.setParameter('intensity', 1.0);
    this.setParameter('rotation', 0);
    this.setParameter('blur', 0);
    this.setParameter('useAsBackground', true);
    
    // Gradient parameters (for procedural environment)
    this.setParameter('skyColor', { r: 135, g: 206, b: 235 });
    this.setParameter('horizonColor', { r: 255, g: 220, b: 180 });
    this.setParameter('groundColor', { r: 100, g: 80, b: 60 });
    this.setParameter('sunEnabled', true);
    this.setParameter('sunDirection', { x: 0.5, y: 0.5, z: 0.5 });
    this.setParameter('sunColor', { r: 255, g: 240, b: 200 });
    this.setParameter('sunIntensity', 1.0);
    this.setParameter('sunSize', 0.01);
  }

  async process(): Promise<void> {
    const type = this.getParameter('type');
    const intensity = this.getParameter('intensity');

    // Dispose previous environment map
    if (this.envMap) {
      this.envMap.dispose();
      this.envMap = null;
    }

    switch (type) {
      case 'gradient':
        this.createGradientEnvironment();
        break;
      case 'cube':
        await this.processCubeMap();
        break;
      default: // equirectangular
        await this.processEquirectangular();
        break;
    }

    // Apply rotation
    if (this.envMap) {
      // Rotation would be applied here
    }

    const envMapOutput = this.outputs.get('envMap');
    if (envMapOutput) {
      envMapOutput.value = {
        texture: this.envMap,
        intensity,
        rotation: this.getParameter('rotation')
      };
    }

    const backgroundOutput = this.outputs.get('background');
    if (backgroundOutput && this.getParameter('useAsBackground')) {
      backgroundOutput.value = this.envMap;
    }

    // Irradiance map for diffuse lighting
    const irradianceOutput = this.outputs.get('irradiance');
    if (irradianceOutput) {
      // PMREM generation would create irradiance map
      irradianceOutput.value = this.envMap;
    }
  }

  private createGradientEnvironment(): void {
    // Create a procedural gradient environment
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size * 2;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const skyColor = this.getParameter('skyColor');
      const horizonColor = this.getParameter('horizonColor');
      const groundColor = this.getParameter('groundColor');
      
      // Create gradient from ground to sky
      const gradient = ctx.createLinearGradient(0, size, 0, 0);
      gradient.addColorStop(0, `rgb(${groundColor.r}, ${groundColor.g}, ${groundColor.b})`);
      gradient.addColorStop(0.4, `rgb(${horizonColor.r}, ${horizonColor.g}, ${horizonColor.b})`);
      gradient.addColorStop(0.5, `rgb(${horizonColor.r}, ${horizonColor.g}, ${horizonColor.b})`);
      gradient.addColorStop(1, `rgb(${skyColor.r}, ${skyColor.g}, ${skyColor.b})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size * 2, size);
      
      // Add sun if enabled
      if (this.getParameter('sunEnabled')) {
        const sunDir = this.getParameter('sunDirection');
        const sunColor = this.getParameter('sunColor');
        const sunSize = this.getParameter('sunSize');
        const sunIntensity = this.getParameter('sunIntensity');
        
        // Convert sun direction to UV coordinates
        const phi = Math.atan2(sunDir.z, sunDir.x);
        const theta = Math.asin(Math.max(-1, Math.min(1, sunDir.y)));
        
        const u = (phi + Math.PI) / (2 * Math.PI);
        const v = (theta + Math.PI / 2) / Math.PI;
        
        const sunX = u * size * 2;
        const sunY = (1 - v) * size;
        const sunRadius = sunSize * size;
        
        // Draw sun glow
        const glowGradient = ctx.createRadialGradient(
          sunX, sunY, 0,
          sunX, sunY, sunRadius * 5
        );
        glowGradient.addColorStop(0, `rgba(${sunColor.r}, ${sunColor.g}, ${sunColor.b}, ${sunIntensity})`);
        glowGradient.addColorStop(0.2, `rgba(${sunColor.r}, ${sunColor.g}, ${sunColor.b}, ${sunIntensity * 0.5})`);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, size * 2, size);
        
        // Draw sun disk
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${sunColor.r}, ${sunColor.g}, ${sunColor.b})`;
        ctx.fill();
      }

      // Create texture from canvas
      this.envMap = new THREE.CanvasTexture(canvas);
      this.envMap.mapping = THREE.EquirectangularReflectionMapping;
    }
  }

  private async processEquirectangular(): Promise<void> {
    const hdrInput = this.inputs.get('hdrImage');
    if (hdrInput?.value) {
      // Create texture from input image data
      // This is a placeholder - actual implementation would handle HDR data
      const width = hdrInput.value.width || 1024;
      const height = hdrInput.value.height || 512;
      
      const data = new Uint8Array(width * height * 4);
      if (hdrInput.value.data) {
        data.set(hdrInput.value.data);
      }
      
      const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.needsUpdate = true;
      
      this.envMap = texture;
    } else {
      // Create default environment
      this.createGradientEnvironment();
    }
  }

  private async processCubeMap(): Promise<void> {
    const cubeInput = this.inputs.get('cubeMap');
    if (cubeInput?.value) {
      // Process cube map faces
      // This is a placeholder for cube map loading
    }
    
    // Fallback to gradient if no cube map provided
    if (!this.envMap) {
      this.createGradientEnvironment();
    }
  }

  dispose(): void {
    if (this.envMap) {
      this.envMap.dispose();
      this.envMap = null;
    }
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }
    super.dispose();
  }
}
