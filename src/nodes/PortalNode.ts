/**
 * PortalNode - Dimensional portal and wormhole effects
 * Creates swirling vortex effects for sci-fi portals
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class PortalNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'Portal', 'Portal');
    this.metadata.category = 'VFX';
    this.metadata.description = 'Create dimensional portal and wormhole effects';
    
    this.addInput('background', 'Background', DataType.IMAGE);
    this.addInput('portal_view', 'Portal View', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Position and size
    this.setParameter('centerX', 0.5);
    this.setParameter('centerY', 0.5);
    this.setParameter('radius', 0.3);
    this.setParameter('innerRadius', 0.15);
    
    // Size
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Vortex properties
    this.setParameter('rotationSpeed', 1.0);
    this.setParameter('spiralArms', 4);
    this.setParameter('spiralTightness', 3.0);
    this.setParameter('warpStrength', 0.5);
    
    // Ring properties
    this.setParameter('ringCount', 5);
    this.setParameter('ringWidth', 0.02);
    this.setParameter('ringGlow', 0.8);
    
    // Colors
    this.setParameter('primaryColor', { r: 100, g: 200, b: 255 });
    this.setParameter('secondaryColor', { r: 200, g: 50, b: 255 });
    this.setParameter('coreColor', { r: 255, g: 255, b: 255 });
    
    // Energy effects
    this.setParameter('energyParticles', true);
    this.setParameter('particleCount', 100);
    this.setParameter('particleSpeed', 1.0);
    
    // Distortion
    this.setParameter('edgeDistortion', 0.1);
    this.setParameter('depthEffect', 0.5);
    
    // Animation
    this.setParameter('animate', true);
    this.setParameter('pulsate', true);
    this.setParameter('pulsateSpeed', 2.0);
    this.setParameter('pulsateAmount', 0.1);
    
    this.setParameter('seed', 12345);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 12345;
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = Math.floor(this.seededRandom(seed + i) * 256);
      this.permutation[i + 256] = this.permutation[i];
    }
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  async process(): Promise<void> {
    const background = this.inputs.get('background')?.value as ImageData | undefined;
    const portalView = this.inputs.get('portal_view')?.value as ImageData | undefined;
    const output = this.outputs.get('image');
    
    if (!output) return;

    const centerX = this.getParameter('centerX');
    const centerY = this.getParameter('centerY');
    let radius = this.getParameter('radius');
    let innerRadius = this.getParameter('innerRadius');
    const width = background?.width || this.getParameter('width');
    const height = background?.height || this.getParameter('height');
    const rotationSpeed = this.getParameter('rotationSpeed');
    const spiralArms = this.getParameter('spiralArms');
    const spiralTightness = this.getParameter('spiralTightness');
    const warpStrength = this.getParameter('warpStrength');
    const ringCount = this.getParameter('ringCount');
    const ringWidth = this.getParameter('ringWidth');
    const ringGlow = this.getParameter('ringGlow');
    const primaryColor = this.getParameter('primaryColor');
    const secondaryColor = this.getParameter('secondaryColor');
    const coreColor = this.getParameter('coreColor');
    const energyParticles = this.getParameter('energyParticles');
    const particleCount = this.getParameter('particleCount');
    const particleSpeed = this.getParameter('particleSpeed');
    const edgeDistortion = this.getParameter('edgeDistortion');
    const depthEffect = this.getParameter('depthEffect');
    const animate = this.getParameter('animate');
    const pulsate = this.getParameter('pulsate');
    const pulsateSpeed = this.getParameter('pulsateSpeed');
    const pulsateAmount = this.getParameter('pulsateAmount');
    
    if (animate) {
      this.time += 0.016;
    }
    
    // Apply pulsation
    if (pulsate) {
      const pulse = Math.sin(this.time * pulsateSpeed) * pulsateAmount;
      radius *= (1 + pulse);
      innerRadius *= (1 + pulse * 0.5);
    }
    
    const outData = new Uint8Array(width * height * 4);
    
    const cx = centerX * width;
    const cy = centerY * height;
    const radiusPx = radius * Math.min(width, height);
    const innerRadiusPx = innerRadius * Math.min(width, height);
    const rotation = this.time * rotationSpeed;
    
    // Pre-calculate particle positions
    const particles: Array<{ angle: number; dist: number; brightness: number }> = [];
    if (energyParticles) {
      for (let i = 0; i < particleCount; i++) {
        const baseAngle = (i / particleCount) * Math.PI * 2;
        const timeOffset = this.seededRandom(i * 1000 + this.getParameter('seed'));
        const particleTime = (this.time * particleSpeed + timeOffset) % 1;
        
        particles.push({
          angle: baseAngle + rotation + particleTime * Math.PI * 2,
          dist: innerRadiusPx + (radiusPx - innerRadiusPx) * particleTime,
          brightness: Math.sin(particleTime * Math.PI)
        });
      }
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate distance and angle from center
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        
        // Normalize distance
        const normalizedDist = dist / radiusPx;
        
        let r = 0, g = 0, b = 0, a = 0;
        
        if (dist < radiusPx) {
          // Inside portal area
          const ringDist = normalizedDist;
          
          // Spiral distortion
          const spiralOffset = Math.sin((angle + rotation) * spiralArms + ringDist * spiralTightness * Math.PI * 2) * warpStrength;
          const distortedAngle = angle + spiralOffset;
          
          // Ring pattern
          let ringIntensity = 0;
          for (let ring = 0; ring < ringCount; ring++) {
            const ringPos = (ring + 0.5) / ringCount;
            const ringDelta = Math.abs(ringDist - ringPos);
            if (ringDelta < ringWidth) {
              ringIntensity = Math.max(ringIntensity, 1 - ringDelta / ringWidth);
            }
          }
          
          // Color based on distance and spiral
          const colorMix = (Math.sin(distortedAngle * spiralArms + this.time * 2) + 1) * 0.5;
          const baseR = primaryColor.r * (1 - colorMix) + secondaryColor.r * colorMix;
          const baseG = primaryColor.g * (1 - colorMix) + secondaryColor.g * colorMix;
          const baseB = primaryColor.b * (1 - colorMix) + secondaryColor.b * colorMix;
          
          if (dist < innerRadiusPx) {
            // Inner core area - show portal view or core color
            const coreFade = 1 - dist / innerRadiusPx;
            
            if (portalView) {
              // Warp the view through the portal
              const warpAngle = distortedAngle + rotation;
              const warpDist = dist / innerRadiusPx;
              const sampleX = width / 2 + Math.cos(warpAngle) * warpDist * innerRadiusPx * (1 - depthEffect * 0.5);
              const sampleY = height / 2 + Math.sin(warpAngle) * warpDist * innerRadiusPx * (1 - depthEffect * 0.5);
              
              const sx = Math.floor(Math.max(0, Math.min(portalView.width - 1, sampleX % portalView.width)));
              const sy = Math.floor(Math.max(0, Math.min(portalView.height - 1, sampleY % portalView.height)));
              const sampleIdx = (sy * portalView.width + sx) * portalView.channels;
              
              r = portalView.data[sampleIdx];
              g = portalView.data[sampleIdx + 1];
              b = portalView.data[sampleIdx + 2];
            } else {
              // Core glow
              r = coreColor.r * coreFade + baseR * (1 - coreFade);
              g = coreColor.g * coreFade + baseG * (1 - coreFade);
              b = coreColor.b * coreFade + baseB * (1 - coreFade);
            }
            
            a = 255;
          } else {
            // Vortex ring area
            const vortexIntensity = 1 - (dist - innerRadiusPx) / (radiusPx - innerRadiusPx);
            const spiralPattern = (Math.sin((angle + rotation) * spiralArms + ringDist * spiralTightness * Math.PI * 4) + 1) * 0.5;
            
            const intensity = (vortexIntensity * 0.5 + spiralPattern * 0.3 + ringIntensity * ringGlow);
            
            r = baseR * intensity;
            g = baseG * intensity;
            b = baseB * intensity;
            a = intensity * 255;
          }
          
          // Add edge distortion glow
          const edgeDist = Math.abs(dist - radiusPx);
          if (edgeDist < radiusPx * edgeDistortion) {
            const edgeFactor = 1 - edgeDist / (radiusPx * edgeDistortion);
            r = Math.min(255, r + primaryColor.r * edgeFactor * 0.5);
            g = Math.min(255, g + primaryColor.g * edgeFactor * 0.5);
            b = Math.min(255, b + primaryColor.b * edgeFactor * 0.5);
          }
          
          // Add energy particles
          if (energyParticles) {
            for (const particle of particles) {
              const px = cx + Math.cos(particle.angle) * particle.dist;
              const py = cy + Math.sin(particle.angle) * particle.dist;
              const particleDist = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
              
              if (particleDist < 5) {
                const particleIntensity = (1 - particleDist / 5) * particle.brightness;
                r = Math.min(255, r + 255 * particleIntensity);
                g = Math.min(255, g + 255 * particleIntensity);
                b = Math.min(255, b + 255 * particleIntensity);
              }
            }
          }
        } else {
          // Outside portal - use background
          if (background) {
            const srcIdx = (y * background.width + x) * background.channels;
            r = background.data[srcIdx];
            g = background.data[srcIdx + 1];
            b = background.data[srcIdx + 2];
            a = background.channels === 4 ? background.data[srcIdx + 3] : 255;
          } else {
            r = 0; g = 0; b = 0; a = 255;
          }
          
          // Add outer glow
          const glowDist = (dist - radiusPx) / (radiusPx * 0.3);
          if (glowDist < 1) {
            const glowIntensity = Math.pow(1 - glowDist, 2) * 0.5;
            r = Math.min(255, r + primaryColor.r * glowIntensity);
            g = Math.min(255, g + primaryColor.g * glowIntensity);
            b = Math.min(255, b + primaryColor.b * glowIntensity);
          }
        }
        
        outData[idx] = Math.min(255, Math.max(0, r));
        outData[idx + 1] = Math.min(255, Math.max(0, g));
        outData[idx + 2] = Math.min(255, Math.max(0, b));
        outData[idx + 3] = Math.min(255, Math.max(0, a));
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
}
