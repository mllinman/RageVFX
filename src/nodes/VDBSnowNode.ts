/**
 * VDBSnowNode - Procedural VDB Snow Generation
 * Version 3.10 - VDB Procedural Tools
 * 
 * Purpose: Generate volumetric snow effects in VDB format
 * - Falling snow particles to VDB
 * - Snow accumulation
 * - Powder and packed snow
 * - Wind influence
 */

import { Node, DataType } from '../core/Node';

export class VDBSnowNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'VDBSnow', 'VDB Snow');
    this.metadata.category = 'Volumetric';
    this.metadata.description = 'Generate procedural snow in OpenVDB format';
    this.metadata.version = '3.10.0';

    this.addInput('windField', 'Wind Field', DataType.GEOMETRY_3D);
    this.addOutput('density', 'Density', DataType.GEOMETRY_3D);
    this.addOutput('velocity', 'Velocity', DataType.GEOMETRY_3D);
    this.addOutput('accumulation', 'Accumulation', DataType.GEOMETRY_3D);
    this.addOutput('preview', 'Preview', DataType.IMAGE);

    this.setParameter('voxelSize', 0.05);
    this.setParameter('volumeSize', [30, 50, 30]);
    this.setParameter('particleCount', 10000);
    this.setParameter('particleSize', 0.02);
    this.setParameter('fallSpeed', 2.0);
    this.setParameter('windSpeed', [0.5, 0, 0.3]);
    this.setParameter('turbulence', 0.3);
    this.setParameter('density', 0.3);
    this.setParameter('flakiness', 0.7); // How flake-like vs round
    this.setParameter('accumulate', true);
    this.setParameter('accumulationRate', 0.1);
    this.setParameter('melt', false);
    this.setParameter('meltRate', 0.05);
    this.setParameter('animated', true);
    this.setParameter('seed', 99999);

    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 99999;
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
    const velocityOut = this.outputs.get('velocity');

    if (densityOut) densityOut.value = this.generateSnowVDB();
    if (velocityOut) velocityOut.value = this.generateVelocityField();
  }

  private generateSnowVDB(): any {
    const voxelSize = this.getParameter('voxelSize') as number;
    const volumeSize = this.getParameter('volumeSize') as number[];
    const particleCount = this.getParameter('particleCount') as number;
    const particleSize = this.getParameter('particleSize') as number;
    const fallSpeed = this.getParameter('fallSpeed') as number;
    const windSpeed = this.getParameter('windSpeed') as number[];
    const density = this.getParameter('density') as number;
    
    const vdbGrid = new Map<string, number>();
    const gridDims = volumeSize.map(s => Math.floor(s / voxelSize));

    // Generate snow particles falling through volume
    for (let i = 0; i < particleCount; i++) {
      const seed = this.getParameter('seed') as number + i;
      
      // Particle position
      const px = (this.seededRandom(seed) - 0.5) * volumeSize[0];
      const py = volumeSize[1] - (this.seededRandom(seed + 1) * volumeSize[1] + this.time * fallSpeed) % volumeSize[1];
      const pz = (this.seededRandom(seed + 2) - 0.5) * volumeSize[2];

      // Add wind drift
      const driftX = windSpeed[0] * this.time + this.turbulence(px, py, pz) * 2;
      const driftZ = windSpeed[2] * this.time + this.turbulence(px + 100, py, pz) * 2;

      // Convert to voxel coordinates
      const vx = Math.floor((px + driftX) / voxelSize + gridDims[0] / 2);
      const vy = Math.floor(py / voxelSize);
      const vz = Math.floor((pz + driftZ) / voxelSize + gridDims[2] / 2);

      // Rasterize particle
      const radiusVoxels = Math.ceil(particleSize / voxelSize);
      for (let dz = -radiusVoxels; dz <= radiusVoxels; dz++) {
        for (let dy = -radiusVoxels; dy <= radiusVoxels; dy++) {
          for (let dx = -radiusVoxels; dx <= radiusVoxels; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) * voxelSize;
            if (dist <= particleSize) {
              const ix = vx + dx;
              const iy = vy + dy;
              const iz = vz + dz;
              
              if (ix >= 0 && ix < gridDims[0] && iy >= 0 && iy < gridDims[1] && iz >= 0 && iz < gridDims[2]) {
                const key = `${ix},${iy},${iz}`;
                const falloff = 1.0 - (dist / particleSize);
                const current = vdbGrid.get(key) || 0;
                vdbGrid.set(key, Math.min(1, current + falloff * density));
              }
            }
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

  private generateVelocityField(): any {
    const voxelSize = this.getParameter('voxelSize') as number;
    const volumeSize = this.getParameter('volumeSize') as number[];
    const fallSpeed = this.getParameter('fallSpeed') as number;
    const windSpeed = this.getParameter('windSpeed') as number[];
    
    const vdbGrid = new Map<string, number[]>();
    const gridDims = volumeSize.map(s => Math.floor(s / voxelSize));

    // Sample velocity field at key points
    for (let z = 0; z < gridDims[2]; z += 4) {
      for (let y = 0; y < gridDims[1]; y += 4) {
        for (let x = 0; x < gridDims[0]; x += 4) {
          const wx = (x - gridDims[0] / 2) * voxelSize;
          const wy = y * voxelSize;
          const wz = (z - gridDims[2] / 2) * voxelSize;

          const turbX = this.turbulence(wx, wy, wz);
          const turbZ = this.turbulence(wx + 100, wy, wz);

          const vx = windSpeed[0] + turbX;
          const vy = -fallSpeed;
          const vz = windSpeed[2] + turbZ;

          vdbGrid.set(`${x},${y},${z}`, [vx, vy, vz]);
        }
      }
    }

    return {
      name: 'vel',
      type: 'vec3',
      class: 'staggered',
      values: vdbGrid,
      transform: {
        translate: [0, 0, 0],
        rotate: [0, 0, 0],
        scale: [1, 1, 1],
        voxelSize
      },
      background: [0, 0, 0],
      activeVoxels: vdbGrid.size
    };
  }

  private turbulence(x: number, y: number, z: number): number {
    const turbulence = this.getParameter('turbulence') as number;
    return this.perlinNoise3D(x * 0.1, y * 0.1 + this.time, z * 0.1) * turbulence;
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
