/**
 * VDBCloudNode - Procedural VDB Cloud Generation
 * Version 3.10 - VDB Procedural Tools
 * 
 * Purpose: Generate realistic volumetric clouds in VDB format
 * - Multiple cloud types (cumulus, stratocumulus, cumulonimbus, cirrus)
 * - Perlin/Worley noise-based generation
 * - Wind and turbulence simulation
 * - Density variation and wispy details
 * - Direct VDB output for efficient rendering
 */

import { Node, DataType } from '../core/Node';

export class VDBCloudNode extends Node {
  private time: number = 0;
  private permutation: number[] = [];

  constructor(id: string) {
    super(id, 'VDBCloud', 'VDB Cloud');
    this.metadata.category = 'Volumetric';
    this.metadata.description = 'Generate procedural clouds in OpenVDB format';
    this.metadata.version = '3.10.0';

    // Inputs (optional modifiers)
    this.addInput('mask', 'Mask', DataType.IMAGE);
    this.addInput('windField', 'Wind Field', DataType.GEOMETRY_3D);

    // Outputs
    this.addOutput('vdbVolume', 'VDB Volume', DataType.GEOMETRY_3D);
    this.addOutput('density', 'Density Field', DataType.IMAGE);
    this.addOutput('preview', 'Preview', DataType.IMAGE);

    // Cloud Type
    this.setParameter('cloudType', 'cumulus'); // cumulus, stratocumulus, cumulonimbus, cirrus, stratus
    this.setParameter('seed', 42);

    // Volume Dimensions
    this.setParameter('voxelSize', 0.5); // meters per voxel
    this.setParameter('volumeSize', [100, 50, 100]); // [width, height, depth] in meters
    this.setParameter('centerPosition', [0, 25, 0]);

    // Cloud Shape
    this.setParameter('coverage', 0.45); // 0-1, how much of volume is cloud
    this.setParameter('density', 0.8); // Base density
    this.setParameter('densityVariation', 0.3); // Random density variation
    this.setParameter('baseFalloff', 0.3); // Fade at cloud base
    this.setParameter('topFalloff', 0.4); // Fade at cloud top
    this.setParameter('edgeFalloff', 0.5); // Fade at cloud edges

    // Noise Settings - Primary Shape
    this.setParameter('noiseType', 'perlin'); // perlin, worley, mixed
    this.setParameter('noiseScale', 0.02); // Frequency
    this.setParameter('noiseOctaves', 6);
    this.setParameter('noisePersistence', 0.5);
    this.setParameter('noiseLacunarity', 2.0);

    // Detail Noise - Wispy Details
    this.setParameter('detailNoise', true);
    this.setParameter('detailScale', 0.1);
    this.setParameter('detailOctaves', 3);
    this.setParameter('detailStrength', 0.3);
    this.setParameter('wispiness', 0.4); // Adds wispy tendrils

    // Erosion and Shape Refinement
    this.setParameter('erosion', 0.2); // Erodes cloud edges
    this.setParameter('billowy', 0.5); // Makes clouds puffier
    this.setParameter('anvil', false); // Cumulonimbus anvil top
    this.setParameter('anvilHeight', 0.8); // Normalized height of anvil
    this.setParameter('anvilSpread', 1.5); // Anvil spread multiplier

    // Animation
    this.setParameter('animated', true);
    this.setParameter('windSpeed', [5, 0, 2]); // m/s in x,y,z
    this.setParameter('windTurbulence', 0.2);
    this.setParameter('evolutionSpeed', 0.3); // Cloud evolution over time

    // Lighting (for preview)
    this.setParameter('sunDirection', [0.5, 0.8, 0.3]);
    this.setParameter('sunIntensity', 1.0);
    this.setParameter('ambientIntensity', 0.3);

    // VDB Export Settings
    this.setParameter('gridName', 'density');
    this.setParameter('gridClass', 'fog');
    this.setParameter('pruneThreshold', 0.01); // Remove voxels below this density

    this.initPermutation();
  }

  private initPermutation(): void {
    const seed = this.getParameter('seed') || 42;
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
    const vdbOutput = this.outputs.get('vdbVolume');
    const densityOutput = this.outputs.get('density');
    const previewOutput = this.outputs.get('preview');

    if (!vdbOutput) return;

    // Update animation time
    if (this.getParameter('animated')) {
      this.time += 0.016; // Assuming 60fps
    }

    // Generate VDB cloud volume
    const vdbData = this.generateCloudVDB();
    vdbOutput.value = vdbData;

    // Generate preview/density field
    if (densityOutput || previewOutput) {
      const preview = this.generatePreview(vdbData);
      if (densityOutput) densityOutput.value = preview;
      if (previewOutput) previewOutput.value = preview;
    }
  }

  private generateCloudVDB(): any {
    const voxelSize = this.getParameter('voxelSize') as number;
    const volumeSize = this.getParameter('volumeSize') as number[];
    const centerPos = this.getParameter('centerPosition') as number[];
    const coverage = this.getParameter('coverage') as number;
    const baseDensity = this.getParameter('density') as number;
    const cloudType = this.getParameter('cloudType') as string;

    // Calculate grid dimensions
    const gridDims = [
      Math.floor(volumeSize[0] / voxelSize),
      Math.floor(volumeSize[1] / voxelSize),
      Math.floor(volumeSize[2] / voxelSize)
    ];

    // Create sparse VDB grid
    const vdbGrid = new Map<string, number>();

    // Generate cloud based on type
    for (let z = 0; z < gridDims[2]; z++) {
      for (let y = 0; y < gridDims[1]; y++) {
        for (let x = 0; x < gridDims[0]; x++) {
          // Convert to world space
          const wx = (x - gridDims[0] / 2) * voxelSize + centerPos[0];
          const wy = (y - gridDims[1] / 2) * voxelSize + centerPos[1];
          const wz = (z - gridDims[2] / 2) * voxelSize + centerPos[2];

          // Calculate density at this position
          const density = this.calculateCloudDensity(wx, wy, wz, gridDims, cloudType);

          // Only store if above threshold (sparse storage)
          const pruneThreshold = this.getParameter('pruneThreshold') as number;
          if (density > pruneThreshold) {
            const key = `${x},${y},${z}`;
            vdbGrid.set(key, density);
          }
        }
      }
    }

    return {
      name: this.getParameter('gridName'),
      type: 'float',
      class: this.getParameter('gridClass'),
      values: vdbGrid,
      transform: {
        translate: centerPos,
        rotate: [0, 0, 0],
        scale: [1, 1, 1],
        voxelSize
      },
      background: 0,
      activeVoxels: vdbGrid.size,
      bounds: {
        min: [centerPos[0] - volumeSize[0] / 2, centerPos[1] - volumeSize[1] / 2, centerPos[2] - volumeSize[2] / 2],
        max: [centerPos[0] + volumeSize[0] / 2, centerPos[1] + volumeSize[1] / 2, centerPos[2] + volumeSize[2] / 2]
      }
    };
  }

  private calculateCloudDensity(x: number, y: number, z: number, gridDims: number[], cloudType: string): number {
    const coverage = this.getParameter('coverage') as number;
    const baseDensity = this.getParameter('density') as number;
    const windSpeed = this.getParameter('windSpeed') as number[];

    // Apply wind offset
    const windOffset = {
      x: windSpeed[0] * this.time,
      y: windSpeed[1] * this.time,
      z: windSpeed[2] * this.time
    };

    // Normalized position (0-1)
    const volumeSize = this.getParameter('volumeSize') as number[];
    const centerPos = this.getParameter('centerPosition') as number[];
    const nx = (x - centerPos[0]) / volumeSize[0] + 0.5;
    const ny = (y - centerPos[1]) / volumeSize[1] + 0.5;
    const nz = (z - centerPos[2]) / volumeSize[2] + 0.5;

    // Base shape noise
    const baseNoise = this.sampleNoise(x + windOffset.x, y + windOffset.y, z + windOffset.z);
    
    // Detail noise
    const detailNoise = this.getParameter('detailNoise') 
      ? this.sampleDetailNoise(x + windOffset.x, y + windOffset.y, z + windOffset.z)
      : 0;

    // Combine noises
    let density = baseNoise - (1.0 - coverage);
    density += detailNoise * this.getParameter('detailStrength') as number;

    // Apply falloffs
    density *= this.applyFalloffs(nx, ny, nz);

    // Cloud type specific modifications
    density = this.applyCloudTypeModifications(density, nx, ny, nz, cloudType);

    // Clamp and scale
    density = Math.max(0, Math.min(1, density)) * baseDensity;

    return density;
  }

  private sampleNoise(x: number, y: number, z: number): number {
    const scale = this.getParameter('noiseScale') as number;
    const octaves = this.getParameter('noiseOctaves') as number;
    const persistence = this.getParameter('noisePersistence') as number;
    const lacunarity = this.getParameter('noiseLacunarity') as number;

    let total = 0;
    let frequency = scale;
    let amplitude = 1.0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.perlinNoise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  private sampleDetailNoise(x: number, y: number, z: number): number {
    const scale = this.getParameter('detailScale') as number;
    const octaves = this.getParameter('detailOctaves') as number;

    let total = 0;
    let frequency = scale;
    let amplitude = 1.0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.perlinNoise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return total / maxValue;
  }

  private applyFalloffs(nx: number, ny: number, nz: number): number {
    const baseFalloff = this.getParameter('baseFalloff') as number;
    const topFalloff = this.getParameter('topFalloff') as number;
    const edgeFalloff = this.getParameter('edgeFalloff') as number;

    // Height falloff
    let heightFade = 1.0;
    if (ny < baseFalloff) {
      heightFade = ny / baseFalloff;
    } else if (ny > (1.0 - topFalloff)) {
      heightFade = (1.0 - ny) / topFalloff;
    }

    // Edge falloff (radial)
    const dx = (nx - 0.5) * 2;
    const dz = (nz - 0.5) * 2;
    const radialDist = Math.sqrt(dx * dx + dz * dz);
    let edgeFade = 1.0;
    if (radialDist > (1.0 - edgeFalloff)) {
      edgeFade = (1.0 - radialDist) / edgeFalloff;
    }

    return heightFade * edgeFade;
  }

  private applyCloudTypeModifications(density: number, nx: number, ny: number, nz: number, cloudType: string): number {
    const billowy = this.getParameter('billowy') as number;
    const erosion = this.getParameter('erosion') as number;

    // Apply billowy effect
    density = Math.pow(density, 1.0 - billowy * 0.5);

    // Apply erosion
    density -= erosion * 0.3;

    // Cloud type specific
    switch (cloudType) {
      case 'cumulonimbus':
        // Tall, anvil-shaped
        if (this.getParameter('anvil')) {
          const anvilHeight = this.getParameter('anvilHeight') as number;
          const anvilSpread = this.getParameter('anvilSpread') as number;
          if (ny > anvilHeight) {
            const spreadFactor = (ny - anvilHeight) * anvilSpread;
            const dx = (nx - 0.5) * (1.0 + spreadFactor);
            const dz = (nz - 0.5) * (1.0 + spreadFactor);
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 0.5) {
              density *= 1.0 + (1.0 - dist * 2);
            }
          }
        }
        break;

      case 'cirrus':
        // Thin, wispy
        density *= 0.3 + this.getParameter('wispiness') as number * 0.5;
        break;

      case 'stratus':
        // Flat, layered
        density *= 1.0 - Math.abs(ny - 0.5) * 0.5;
        break;
    }

    return density;
  }

  private perlinNoise3D(x: number, y: number, z: number): number {
    // Simplified 3D Perlin noise
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
      this.lerp(v,
        this.lerp(u, this.grad(this.permutation[AA], x, y, z),
                     this.grad(this.permutation[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.permutation[AB], x, y - 1, z),
                     this.grad(this.permutation[BB], x - 1, y - 1, z))),
      this.lerp(v,
        this.lerp(u, this.grad(this.permutation[AA + 1], x, y, z - 1),
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

  private generatePreview(vdbData: any): ImageData {
    const resolution = 512;
    const imageData = new ImageData(resolution, resolution);
    
    // Render a slice through the middle of the volume
    const volumeSize = this.getParameter('volumeSize') as number[];
    const voxelSize = this.getParameter('voxelSize') as number;
    
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        // Map to volume coordinates (XZ slice at middle height)
        const vx = Math.floor((x / resolution) * (volumeSize[0] / voxelSize));
        const vy = Math.floor(volumeSize[1] / voxelSize / 2); // Middle height
        const vz = Math.floor((y / resolution) * (volumeSize[2] / voxelSize));
        
        const key = `${vx},${vy},${vz}`;
        const density = vdbData.values.get(key) || 0;
        
        const brightness = Math.floor(density * 255);
        const idx = (y * resolution + x) * 4;
        imageData.data[idx] = brightness;
        imageData.data[idx + 1] = brightness;
        imageData.data[idx + 2] = brightness;
        imageData.data[idx + 3] = 255;
      }
    }

    return imageData;
  }

  dispose(): void {
    this.permutation = [];
    super.dispose();
  }
}
