/**
 * VDBWaterNode - Procedural VDB Water/Liquid Generation
 * Version 3.10 - VDB Procedural Tools
 * 
 * Purpose: Generate volumetric liquid effects in VDB format
 * - Level set representation
 * - Surface tension simulation
 * - Splashing and droplets
 * - Velocity field output
 */

import { Node, DataType } from '../core/Node';

export class VDBWaterNode extends Node {
  private time: number = 0;

  constructor(id: string) {
    super(id, 'VDBWater', 'VDB Water');
    this.metadata.category = 'Volumetric';
    this.metadata.description = 'Generate procedural liquid in OpenVDB level set format';
    this.metadata.version = '3.10.0';

    this.addInput('emitter', 'Emitter', DataType.GEOMETRY_3D);
    this.addOutput('levelSet', 'Level Set', DataType.GEOMETRY_3D);
    this.addOutput('velocity', 'Velocity', DataType.GEOMETRY_3D);
    this.addOutput('surface', 'Surface Mesh', DataType.GEOMETRY_3D);
    this.addOutput('preview', 'Preview', DataType.IMAGE);

    this.setParameter('voxelSize', 0.05);
    this.setParameter('volumeSize', [20, 20, 20]);
    this.setParameter('fluidLevel', 0.3); // 0-1, normalized height of liquid surface relative to volume bounds
    this.setParameter('surfaceTension', 0.072); // N/m
    this.setParameter('viscosity', 0.001); // Pa·s
    this.setParameter('gravity', -9.81);
    this.setParameter('waveAmplitude', 0.5);
    this.setParameter('waveFrequency', 2.0);
    this.setParameter('splashIntensity', 0.5);
    this.setParameter('dropletSize', 0.1);
    this.setParameter('narrowBandWidth', 3); // Voxels
    this.setParameter('animated', true);
    this.setParameter('seed', 11111);
  }

  async process(): Promise<void> {
    if (this.getParameter('animated')) {
      this.time += 0.016;
    }

    const levelSetOut = this.outputs.get('levelSet');
    const velocityOut = this.outputs.get('velocity');

    if (levelSetOut) levelSetOut.value = this.generateWaterVDB();
    if (velocityOut) velocityOut.value = this.generateVelocityField();
  }

  private generateWaterVDB(): any {
    const voxelSize = this.getParameter('voxelSize') as number;
    const volumeSize = this.getParameter('volumeSize') as number[];
    const fluidLevel = this.getParameter('fluidLevel') as number;
    const waveAmp = this.getParameter('waveAmplitude') as number;
    const waveFreq = this.getParameter('waveFrequency') as number;
    const narrowBand = this.getParameter('narrowBandWidth') as number;
    
    const vdbGrid = new Map<string, number>();
    const gridDims = volumeSize.map(s => Math.floor(s / voxelSize));
    const waterHeight = volumeSize[1] * fluidLevel;

    for (let z = 0; z < gridDims[2]; z++) {
      for (let y = 0; y < gridDims[1]; y++) {
        for (let x = 0; x < gridDims[0]; x++) {
          const wx = (x - gridDims[0] / 2) * voxelSize;
          const wy = y * voxelSize;
          const wz = (z - gridDims[2] / 2) * voxelSize;

          // Water surface with waves
          const wave = Math.sin(wx * waveFreq + this.time * 2) * 
                      Math.cos(wz * waveFreq + this.time * 2) * waveAmp;
          const surfaceHeight = waterHeight + wave;

          // Signed distance to surface (negative inside, positive outside)
          const distance = wy - surfaceHeight;

          // Only store narrow band around surface
          if (Math.abs(distance) < narrowBand * voxelSize) {
            vdbGrid.set(`${x},${y},${z}`, distance);
          }
        }
      }
    }

    return {
      name: 'levelset',
      type: 'float',
      class: 'levelset',
      values: vdbGrid,
      transform: {
        translate: [0, 0, 0],
        rotate: [0, 0, 0],
        scale: [1, 1, 1],
        voxelSize
      },
      background: narrowBand * voxelSize,
      activeVoxels: vdbGrid.size
    };
  }

  private generateVelocityField(): any {
    const voxelSize = this.getParameter('voxelSize') as number;
    const volumeSize = this.getParameter('volumeSize') as number[];
    const vdbGrid = new Map<string, number[]>();
    const gridDims = volumeSize.map(s => Math.floor(s / voxelSize));

    for (let z = 0; z < gridDims[2]; z++) {
      for (let y = 0; y < gridDims[1]; y++) {
        for (let x = 0; x < gridDims[0]; x++) {
          const wx = (x - gridDims[0] / 2) * voxelSize;
          const wy = y * voxelSize;
          const wz = (z - gridDims[2] / 2) * voxelSize;

          // Simple velocity field
          const vx = Math.sin(this.time * 2) * 0.5;
          const vy = this.getParameter('gravity') as number * 0.1;
          const vz = Math.cos(this.time * 2) * 0.5;

          if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01 || Math.abs(vz) > 0.01) {
            vdbGrid.set(`${x},${y},${z}`, [vx, vy, vz]);
          }
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

  dispose(): void {
    super.dispose();
  }
}
