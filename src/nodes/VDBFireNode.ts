/**
 * VDBFireNode - Procedural VDB Fire Generation
 * Version 3.10 - VDB Procedural Tools
 * 
 * Purpose: Generate volumetric fire effects in VDB format
 * - Fuel, temperature, and density fields
 * - Combustion simulation
 * - Rising flame behavior
 * - Multiple outputs for rendering
 */

import { Node, DataType } from '../core/Node';

export class VDBFireNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'VDBFire', 'VDB Fire');
    this.metadata.category = 'Volumetric';
    this.metadata.description = 'Generate procedural fire in OpenVDB format';
    this.metadata.version = '3.10.0';

    this.addInput('emitter', 'Emitter', DataType.GEOMETRY_3D);
    this.addOutput('density', 'Density', DataType.GEOMETRY_3D);
    this.addOutput('temperature', 'Temperature', DataType.GEOMETRY_3D);
    this.addOutput('fuel', 'Fuel', DataType.GEOMETRY_3D);
    this.addOutput('velocity', 'Velocity', DataType.GEOMETRY_3D);
    this.addOutput('preview', 'Preview', DataType.IMAGE);

    this.setParameter('voxelSize', 0.05);
    this.setParameter('volumeSize', [10, 20, 10]);
    this.setParameter('intensity', 1.0);
    this.setParameter('temperature', 1500); // Kelvin above ambient (typically 1200-1800K for flame temperature)
    this.setParameter('flameHeight', 5.0);
    this.setParameter('flameWidth', 2.0);
    this.setParameter('buoyancy', 3.0);
    this.setParameter('turbulence', 2.0);
    this.setParameter('flickering', 0.3);
    this.setParameter('burnRate', 0.5);
    this.setParameter('fuelDensity', 0.8);
    this.setParameter('noiseScale', 0.1);
    this.setParameter('animated', true);
    this.setParameter('seed', 67890);

    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 67890;
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
    if (this.getParameter('animated')) {
      this.time += 0.016;
    }

    const densityOut = this.outputs.get('density');
    const tempOut = this.outputs.get('temperature');
    const fuelOut = this.outputs.get('fuel');

    if (densityOut) densityOut.value = this.generateFireVDB('density');
    if (tempOut) tempOut.value = this.generateFireVDB('temperature');
    if (fuelOut) fuelOut.value = this.generateFireVDB('fuel');
  }

  private generateFireVDB(gridType: string): any {
    const voxelSize = this.getParameter('voxelSize') as number;
    const volumeSize = this.getParameter('volumeSize') as number[];
    const flameHeight = this.getParameter('flameHeight') as number;
    const intensity = this.getParameter('intensity') as number;
    
    const vdbGrid = new Map<string, number>();
    const gridDims = volumeSize.map(s => Math.floor(s / voxelSize));

    for (let z = 0; z < gridDims[2]; z++) {
      for (let y = 0; y < gridDims[1]; y++) {
        for (let x = 0; x < gridDims[0]; x++) {
          const wx = (x - gridDims[0] / 2) * voxelSize;
          const wy = y * voxelSize;
          const wz = (z - gridDims[2] / 2) * voxelSize;

          // Fire shape - cone from base
          const distFromCenter = Math.sqrt(wx * wx + wz * wz);
          const heightFactor = 1.0 - (wy / flameHeight);
          
          if (heightFactor > 0 && heightFactor < 1) {
            // Cone shape with noise
            const coneRadius = (this.getParameter('flameWidth') as number) * heightFactor;
            if (distFromCenter < coneRadius) {
              const noise = this.fireNoise(wx, wy + this.time * (this.getParameter('buoyancy') as number), wz);
              const radialFalloff = 1.0 - (distFromCenter / coneRadius);
              
              let value = noise * heightFactor * radialFalloff * intensity;
              
              // Grid-specific adjustments
              if (gridType === 'temperature') {
                value *= this.getParameter('temperature') as number;
              } else if (gridType === 'fuel') {
                value *= this.getParameter('fuelDensity') as number;
              }

              if (value > 0.01) {
                vdbGrid.set(`${x},${y},${z}`, value);
              }
            }
          }
        }
      }
    }

    return {
      name: gridType,
      type: 'float',
      class: 'fog',
      values: vdbGrid,
      transform: {
        translate: [0, 0, 0],
        rotate: [0, 0, 0],
        scale: [1, 1, 1],
        voxelSize
      },
      background: 0,
      activeVoxels: vdbGrid.size
    };
  }

  private fireNoise(x: number, y: number, z: number): number {
    const scale = this.getParameter('noiseScale') as number;
    const turbulence = this.getParameter('turbulence') as number;
    const flickering = this.getParameter('flickering') as number;
    
    let noise = this.perlinNoise3D(x * scale, y * scale, z * scale);
    noise += this.perlinNoise3D(x * scale * 2, y * scale * 2, z * scale * 2) * 0.5;
    noise += this.perlinNoise3D(x * scale * 4, y * scale * 4, z * scale * 4) * 0.25;
    
    // Add flickering
    noise += Math.sin(this.time * 10) * flickering;
    
    return Math.max(0, noise * turbulence);
  }

  private perlinNoise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;
    return this.lerp(w,
      this.lerp(v, this.lerp(u, this.grad(this.permutation[AA], x, y, z),
                                this.grad(this.permutation[BA], x - 1, y, z)),
                  this.lerp(u, this.grad(this.permutation[AB], x, y - 1, z),
                                this.grad(this.permutation[BB], x - 1, y - 1, z))),
      this.lerp(v, this.lerp(u, this.grad(this.permutation[AA + 1], x, y, z - 1),
                                this.grad(this.permutation[BA + 1], x - 1, y, z - 1)),
                  this.lerp(u, this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
                                this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))));
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  dispose(): void {
    this.permutation = [];
    super.dispose();
  }
}
