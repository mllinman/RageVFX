/**
 * VDBSmokeNode - Procedural VDB Smoke Generation
 * Version 3.10 - VDB Procedural Tools
 * 
 * Purpose: Generate volumetric smoke effects in VDB format
 * - Rising smoke simulation
 * - Turbulence and swirling
 * - Temperature-driven advection
 * - Dissipation over time
 */

import { Node, DataType } from '../core/Node';

export class VDBSmokeNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'VDBSmoke', 'VDB Smoke');
    this.metadata.category = 'Volumetric';
    this.metadata.description = 'Generate procedural smoke in OpenVDB format';
    this.metadata.version = '3.10.0';

    this.addInput('emitter', 'Emitter', DataType.GEOMETRY_3D);
    this.addOutput('vdbVolume', 'VDB Volume', DataType.GEOMETRY_3D);
    this.addOutput('temperature', 'Temperature', DataType.GEOMETRY_3D);
    this.addOutput('velocity', 'Velocity', DataType.GEOMETRY_3D);
    this.addOutput('preview', 'Preview', DataType.IMAGE);

    this.setParameter('voxelSize', 0.1);
    this.setParameter('volumeSize', [20, 40, 20]);
    this.setParameter('density', 0.8);
    this.setParameter('temperature', 400); // Kelvin above ambient
    this.setParameter('buoyancy', 2.0);
    this.setParameter('turbulence', 1.5);
    this.setParameter('swirl', 0.5);
    this.setParameter('dissipation', 0.02);
    this.setParameter('velocityScale', 1.0);
    this.setParameter('noiseScale', 0.05);
    this.setParameter('noiseOctaves', 4);
    this.setParameter('animated', true);
    this.setParameter('seed', 12345);
    
    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 12345;
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

    const vdbOutput = this.outputs.get('vdbVolume');
    if (vdbOutput) {
      vdbOutput.value = this.generateSmokeVDB();
    }
  }

  private generateSmokeVDB(): any {
    const voxelSize = this.getParameter('voxelSize') as number;
    const volumeSize = this.getParameter('volumeSize') as number[];
    const density = this.getParameter('density') as number;
    const buoyancy = this.getParameter('buoyancy') as number;
    
    const vdbGrid = new Map<string, number>();
    const gridDims = volumeSize.map(s => Math.floor(s / voxelSize));

    for (let z = 0; z < gridDims[2]; z++) {
      for (let y = 0; y < gridDims[1]; y++) {
        for (let x = 0; x < gridDims[0]; x++) {
          const wx = (x - gridDims[0] / 2) * voxelSize;
          const wy = y * voxelSize;
          const wz = (z - gridDims[2] / 2) * voxelSize;

          // Smoke rises and dissipates
          const heightFactor = Math.exp(-wy / (volumeSize[1] * 0.3));
          const timeFactor = Math.exp(-this.time * (this.getParameter('dissipation') as number));
          
          // Turbulent noise
          const noise = this.turbulentNoise(wx, wy + this.time * buoyancy, wz);
          
          const smokeDensity = noise * heightFactor * timeFactor * density;
          
          if (smokeDensity > 0.01) {
            vdbGrid.set(`${x},${y},${z}`, smokeDensity);
          }
        }
      }
    }

    return {
      name: 'density',
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

  private turbulentNoise(x: number, y: number, z: number): number {
    const scale = this.getParameter('noiseScale') as number;
    const octaves = this.getParameter('noiseOctaves') as number;
    const turbulence = this.getParameter('turbulence') as number;

    let total = 0;
    let frequency = scale;
    let amplitude = 1.0;

    for (let i = 0; i < octaves; i++) {
      total += Math.abs(this.perlinNoise3D(x * frequency, y * frequency, z * frequency)) * amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return total * turbulence;
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
