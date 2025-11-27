/**
 * ProceduralTerrainNode - Houdini-Style Procedural Terrain Generation
 * 
 * Procedural terrain generation matching Houdini's world-building capabilities
 * with erosion simulation, biome classification, and vegetation scatter.
 */

import { Node, DataType } from '../core/Node';

interface TerrainData {
  heightmap: Float32Array;
  normals: Float32Array;
  moisture: Float32Array;
  erosion: Float32Array;
  biomeMap: Uint8Array;
  width: number;
  height: number;
}

interface BiomeConfig {
  id: number;
  name: string;
  minHeight: number;
  maxHeight: number;
  minMoisture: number;
  maxMoisture: number;
  color: { r: number; g: number; b: number };
}

interface VegetationInstance {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  type: string;
}

export class ProceduralTerrainNode extends Node {
  private terrainData: TerrainData | null = null;
  private biomes: BiomeConfig[] = [];
  private vegetationInstances: VegetationInstance[] = [];
  private waterBodies: { x: number; y: number; radius: number; level: number }[] = [];

  constructor(id: string) {
    super(id, 'ProceduralTerrain', 'Procedural Terrain');
    this.metadata.category = '3D';
    this.metadata.description = 'Houdini-style procedural terrain generation with erosion and biomes';
    this.metadata.version = '3.0.0';

    // Inputs
    this.addInput('heightmapSeed', 'Heightmap Seed', DataType.IMAGE); // Optional seed image
    this.addInput('maskInput', 'Mask', DataType.IMAGE); // Optional mask for selective generation

    // Outputs
    this.addOutput('heightmap', 'Heightmap', DataType.IMAGE);
    this.addOutput('normalMap', 'Normal Map', DataType.IMAGE);
    this.addOutput('biomeMap', 'Biome Map', DataType.IMAGE);
    this.addOutput('erosionMap', 'Erosion Map', DataType.IMAGE);
    this.addOutput('moistureMap', 'Moisture Map', DataType.IMAGE);
    this.addOutput('terrainGeometry', 'Terrain Geometry', DataType.GEOMETRY_3D);
    this.addOutput('vegetationData', 'Vegetation Instances', DataType.ANY);

    // Terrain size parameters
    this.setParameter('resolution', 512); // Grid resolution
    this.setParameter('worldSize', 1000); // World units
    this.setParameter('heightScale', 100); // Max height

    // Noise parameters for base terrain
    this.setParameter('noiseType', 'fbm'); // 'simplex', 'perlin', 'fbm', 'ridged', 'voronoi'
    this.setParameter('octaves', 8);
    this.setParameter('frequency', 0.002);
    this.setParameter('amplitude', 1.0);
    this.setParameter('persistence', 0.5);
    this.setParameter('lacunarity', 2.0);
    this.setParameter('seed', 12345);

    // Ridged noise parameters
    this.setParameter('ridgeOffset', 1.0);
    this.setParameter('ridgeGain', 2.0);

    // Erosion parameters
    this.setParameter('enableErosion', true);
    this.setParameter('erosionType', 'hydraulic'); // 'thermal', 'hydraulic', 'both'
    this.setParameter('erosionIterations', 50000);
    this.setParameter('erosionStrength', 0.3);
    this.setParameter('depositionRate', 0.3);
    this.setParameter('evaporationRate', 0.02);
    this.setParameter('sedimentCapacity', 4.0);
    this.setParameter('minSlope', 0.01);

    // Thermal erosion parameters
    this.setParameter('thermalRate', 0.5);
    this.setParameter('talusAngle', 0.6); // Angle of repose

    // Biome parameters
    this.setParameter('enableBiomes', true);
    this.setParameter('biomeBlend', 0.1);

    // Vegetation parameters
    this.setParameter('enableVegetation', true);
    this.setParameter('vegetationDensity', 100); // Instances per 100x100 units
    this.setParameter('vegetationMinSlope', 0);
    this.setParameter('vegetationMaxSlope', 0.7);
    this.setParameter('vegetationMinHeight', 0.1);
    this.setParameter('vegetationMaxHeight', 0.8);

    // Water parameters
    this.setParameter('enableWater', true);
    this.setParameter('waterLevel', 0.3); // Normalized height
    this.setParameter('riverCarving', true);
    this.setParameter('riverWidth', 5);
    this.setParameter('riverDepth', 0.02);

    // Initialize default biomes
    this.initializeDefaultBiomes();
  }

  private initializeDefaultBiomes(): void {
    this.biomes = [
      { id: 0, name: 'DeepWater', minHeight: 0, maxHeight: 0.2, minMoisture: 0, maxMoisture: 1, color: { r: 20, g: 50, b: 120 } },
      { id: 1, name: 'ShallowWater', minHeight: 0.2, maxHeight: 0.3, minMoisture: 0, maxMoisture: 1, color: { r: 40, g: 90, b: 150 } },
      { id: 2, name: 'Beach', minHeight: 0.3, maxHeight: 0.35, minMoisture: 0, maxMoisture: 1, color: { r: 210, g: 190, b: 140 } },
      { id: 3, name: 'Desert', minHeight: 0.35, maxHeight: 0.6, minMoisture: 0, maxMoisture: 0.2, color: { r: 210, g: 180, b: 100 } },
      { id: 4, name: 'Grassland', minHeight: 0.35, maxHeight: 0.6, minMoisture: 0.2, maxMoisture: 0.5, color: { r: 100, g: 150, b: 50 } },
      { id: 5, name: 'Forest', minHeight: 0.35, maxHeight: 0.6, minMoisture: 0.5, maxMoisture: 0.8, color: { r: 50, g: 100, b: 30 } },
      { id: 6, name: 'Jungle', minHeight: 0.35, maxHeight: 0.6, minMoisture: 0.8, maxMoisture: 1, color: { r: 30, g: 80, b: 20 } },
      { id: 7, name: 'Hills', minHeight: 0.6, maxHeight: 0.75, minMoisture: 0, maxMoisture: 1, color: { r: 80, g: 120, b: 60 } },
      { id: 8, name: 'Mountain', minHeight: 0.75, maxHeight: 0.9, minMoisture: 0, maxMoisture: 1, color: { r: 100, g: 100, b: 90 } },
      { id: 9, name: 'Snow', minHeight: 0.9, maxHeight: 1, minMoisture: 0, maxMoisture: 1, color: { r: 255, g: 255, b: 255 } },
    ];
  }

  /**
   * Add or update a custom biome
   */
  setBiome(biome: BiomeConfig): void {
    const existing = this.biomes.findIndex(b => b.id === biome.id);
    if (existing >= 0) {
      this.biomes[existing] = biome;
    } else {
      this.biomes.push(biome);
    }
    this.markDirty();
  }

  async process(): Promise<void> {
    const resolution = this.getParameter('resolution') as number;
    const heightScale = this.getParameter('heightScale') as number;
    
    // Initialize terrain data
    const pixels = resolution * resolution;
    this.terrainData = {
      heightmap: new Float32Array(pixels),
      normals: new Float32Array(pixels * 3),
      moisture: new Float32Array(pixels),
      erosion: new Float32Array(pixels),
      biomeMap: new Uint8Array(pixels),
      width: resolution,
      height: resolution
    };

    // Step 1: Generate base heightmap
    this.generateBaseHeightmap();

    // Step 2: Apply optional seed image
    const seedInput = this.inputs.get('heightmapSeed');
    if (seedInput?.value) {
      this.blendSeedHeightmap(seedInput.value as ImageData);
    }

    // Step 3: Apply erosion
    if (this.getParameter('enableErosion')) {
      const erosionType = this.getParameter('erosionType') as string;
      
      if (erosionType === 'thermal' || erosionType === 'both') {
        this.applyThermalErosion();
      }
      
      if (erosionType === 'hydraulic' || erosionType === 'both') {
        this.applyHydraulicErosion();
      }
    }

    // Step 4: Generate moisture map
    this.generateMoistureMap();

    // Step 5: Apply water and river carving
    if (this.getParameter('enableWater')) {
      this.carveWaterBodies();
    }

    // Step 6: Calculate normals
    this.calculateNormals();

    // Step 7: Classify biomes
    if (this.getParameter('enableBiomes')) {
      this.classifyBiomes();
    }

    // Step 8: Generate vegetation instances
    if (this.getParameter('enableVegetation')) {
      this.generateVegetation();
    }

    // Step 9: Apply mask if provided
    const maskInput = this.inputs.get('maskInput');
    if (maskInput?.value) {
      this.applyMask(maskInput.value as ImageData);
    }

    // Create output images
    this.createOutputs(resolution, heightScale);

    this.dirty = false;
  }

  private generateBaseHeightmap(): void {
    if (!this.terrainData) return;
    
    const noiseType = this.getParameter('noiseType') as string;
    const octaves = this.getParameter('octaves') as number;
    const frequency = this.getParameter('frequency') as number;
    const persistence = this.getParameter('persistence') as number;
    const lacunarity = this.getParameter('lacunarity') as number;
    const seed = this.getParameter('seed') as number;

    const width = this.terrainData.width;
    const height = this.terrainData.height;

    // Initialize random with seed
    const random = this.seededRandom(seed);

    // Generate offsets for each octave
    const octaveOffsets: { x: number; y: number }[] = [];
    for (let i = 0; i < octaves; i++) {
      octaveOffsets.push({
        x: random() * 10000 - 5000,
        y: random() * 10000 - 5000
      });
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        
        switch (noiseType) {
          case 'simplex':
            value = this.simplex2D(x * frequency + octaveOffsets[0].x, y * frequency + octaveOffsets[0].y);
            break;
          case 'perlin':
            value = this.perlin2D(x * frequency + octaveOffsets[0].x, y * frequency + octaveOffsets[0].y);
            break;
          case 'fbm':
            value = this.fbm(x, y, octaves, frequency, persistence, lacunarity, octaveOffsets);
            break;
          case 'ridged':
            value = this.ridgedNoise(x, y, octaves, frequency, persistence, lacunarity, octaveOffsets);
            break;
          case 'voronoi':
            value = this.voronoi(x, y, frequency);
            break;
          default:
            value = this.fbm(x, y, octaves, frequency, persistence, lacunarity, octaveOffsets);
        }

        // Normalize to 0-1
        value = (value + 1) / 2;
        value = Math.max(0, Math.min(1, value));

        this.terrainData.heightmap[y * width + x] = value;
      }
    }
  }

  private fbm(x: number, y: number, octaves: number, frequency: number, persistence: number, lacunarity: number, offsets: { x: number; y: number }[]): number {
    let value = 0;
    let amplitude = 1;
    let freq = frequency;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.simplex2D(x * freq + offsets[i].x, y * freq + offsets[i].y) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      freq *= lacunarity;
    }

    return value / maxValue;
  }

  private ridgedNoise(x: number, y: number, octaves: number, frequency: number, persistence: number, lacunarity: number, offsets: { x: number; y: number }[]): number {
    const offset = this.getParameter('ridgeOffset') as number;
    const gain = this.getParameter('ridgeGain') as number;

    let value = 0;
    let amplitude = 0.5;
    let freq = frequency;
    let weight = 1;

    for (let i = 0; i < octaves; i++) {
      let signal = this.simplex2D(x * freq + offsets[i].x, y * freq + offsets[i].y);
      signal = offset - Math.abs(signal);
      signal *= signal;
      signal *= weight;
      weight = Math.max(0, Math.min(1, signal * gain));
      value += signal * amplitude;
      amplitude *= persistence;
      freq *= lacunarity;
    }

    return value * 1.25 - 1;
  }

  private voronoi(x: number, y: number, frequency: number): number {
    const px = x * frequency;
    const py = y * frequency;
    const ix = Math.floor(px);
    const iy = Math.floor(py);

    let minDist = 1000;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx;
        const cy = iy + dy;
        
        // Consistent random point in cell
        const hash = this.hashCoord(cx, cy);
        const ox = hash % 1000 / 1000;
        const oy = (hash / 1000) % 1000 / 1000;
        
        const pointX = cx + ox;
        const pointY = cy + oy;
        
        const dist = Math.sqrt((px - pointX) ** 2 + (py - pointY) ** 2);
        minDist = Math.min(minDist, dist);
      }
    }

    return minDist * 2 - 1;
  }

  private applyHydraulicErosion(): void {
    if (!this.terrainData) return;

    const iterations = this.getParameter('erosionIterations') as number;
    const strength = this.getParameter('erosionStrength') as number;
    const depositionRate = this.getParameter('depositionRate') as number;
    const evaporationRate = this.getParameter('evaporationRate') as number;
    const sedimentCapacity = this.getParameter('sedimentCapacity') as number;
    const minSlope = this.getParameter('minSlope') as number;

    const width = this.terrainData.width;
    const height = this.terrainData.height;
    const heightmap = this.terrainData.heightmap;
    const erosionMap = this.terrainData.erosion;

    const seed = this.getParameter('seed') as number;
    const random = this.seededRandom(seed + 1);

    for (let iter = 0; iter < iterations; iter++) {
      // Random starting position
      let x = random() * (width - 1);
      let y = random() * (height - 1);
      let dirX = 0;
      let dirY = 0;
      let speed = 1;
      let water = 1;
      let sediment = 0;

      const maxLifetime = 64;

      for (let lifetime = 0; lifetime < maxLifetime; lifetime++) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);

        if (ix < 0 || ix >= width - 1 || iy < 0 || iy >= height - 1) break;

        // Calculate gradient
        const cellIdx = iy * width + ix;
        const fx = x - ix;
        const fy = y - iy;

        // Heights at corners
        const h00 = heightmap[cellIdx];
        const h10 = heightmap[cellIdx + 1];
        const h01 = heightmap[cellIdx + width];
        const h11 = heightmap[cellIdx + width + 1];

        // Bilinear interpolation
        const currentHeight = (h00 * (1 - fx) + h10 * fx) * (1 - fy) + (h01 * (1 - fx) + h11 * fx) * fy;

        // Calculate gradient
        const gradX = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
        const gradY = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;

        // Update direction with inertia
        dirX = dirX * 0.1 - gradX * 0.9;
        dirY = dirY * 0.1 - gradY * 0.9;

        // Normalize
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len > 0) {
          dirX /= len;
          dirY /= len;
        }

        // Move droplet
        const newX = x + dirX;
        const newY = y + dirY;

        if (newX < 0 || newX >= width - 1 || newY < 0 || newY >= height - 1) break;

        const newIx = Math.floor(newX);
        const newIy = Math.floor(newY);
        const newFx = newX - newIx;
        const newFy = newY - newIy;

        const newH00 = heightmap[newIy * width + newIx];
        const newH10 = heightmap[newIy * width + newIx + 1];
        const newH01 = heightmap[(newIy + 1) * width + newIx];
        const newH11 = heightmap[(newIy + 1) * width + newIx + 1];

        const newHeight = (newH00 * (1 - newFx) + newH10 * newFx) * (1 - newFy) + (newH01 * (1 - newFx) + newH11 * newFy) * newFy;

        const deltaHeight = newHeight - currentHeight;

        // Calculate sediment capacity
        const capacity = Math.max(-deltaHeight, minSlope) * speed * water * sedimentCapacity;

        if (sediment > capacity || deltaHeight > 0) {
          // Deposit sediment
          const amount = deltaHeight > 0 
            ? Math.min(deltaHeight, sediment) 
            : (sediment - capacity) * depositionRate;

          sediment -= amount;

          // Distribute to corners
          heightmap[cellIdx] += amount * (1 - fx) * (1 - fy);
          heightmap[cellIdx + 1] += amount * fx * (1 - fy);
          heightmap[cellIdx + width] += amount * (1 - fx) * fy;
          heightmap[cellIdx + width + 1] += amount * fx * fy;
        } else {
          // Erode
          const amount = Math.min((capacity - sediment) * strength, -deltaHeight);

          sediment += amount;

          // Remove from corners
          heightmap[cellIdx] -= amount * (1 - fx) * (1 - fy);
          heightmap[cellIdx + 1] -= amount * fx * (1 - fy);
          heightmap[cellIdx + width] -= amount * (1 - fx) * fy;
          heightmap[cellIdx + width + 1] -= amount * fx * fy;

          // Record erosion
          erosionMap[cellIdx] += amount * (1 - fx) * (1 - fy);
          erosionMap[cellIdx + 1] += amount * fx * (1 - fy);
          erosionMap[cellIdx + width] += amount * (1 - fx) * fy;
          erosionMap[cellIdx + width + 1] += amount * fx * fy;
        }

        // Update speed and water
        speed = Math.sqrt(speed * speed + deltaHeight * 4);
        water *= 1 - evaporationRate;

        if (water < 0.01) break;

        x = newX;
        y = newY;
      }
    }
  }

  private applyThermalErosion(): void {
    if (!this.terrainData) return;

    const thermalRate = this.getParameter('thermalRate') as number;
    const talusAngle = this.getParameter('talusAngle') as number;
    const iterations = Math.floor((this.getParameter('erosionIterations') as number) / 1000);

    const width = this.terrainData.width;
    const height = this.terrainData.height;
    const heightmap = this.terrainData.heightmap;

    for (let iter = 0; iter < iterations; iter++) {
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const h = heightmap[idx];

          // Check all 8 neighbors
          const neighbors = [
            { dx: -1, dy: 0, idx: idx - 1 },
            { dx: 1, dy: 0, idx: idx + 1 },
            { dx: 0, dy: -1, idx: idx - width },
            { dx: 0, dy: 1, idx: idx + width },
            { dx: -1, dy: -1, idx: idx - width - 1 },
            { dx: 1, dy: -1, idx: idx - width + 1 },
            { dx: -1, dy: 1, idx: idx + width - 1 },
            { dx: 1, dy: 1, idx: idx + width + 1 }
          ];

          let totalDiff = 0;
          let maxDiff = 0;

          for (const n of neighbors) {
            const diff = h - heightmap[n.idx];
            if (diff > talusAngle) {
              totalDiff += diff - talusAngle;
              maxDiff = Math.max(maxDiff, diff);
            }
          }

          if (totalDiff > 0) {
            for (const n of neighbors) {
              const diff = h - heightmap[n.idx];
              if (diff > talusAngle) {
                const move = thermalRate * (diff - talusAngle) / totalDiff * maxDiff * 0.5;
                heightmap[idx] -= move;
                heightmap[n.idx] += move;
              }
            }
          }
        }
      }
    }
  }

  private generateMoistureMap(): void {
    if (!this.terrainData) return;

    const width = this.terrainData.width;
    const height = this.terrainData.height;
    const moisture = this.terrainData.moisture;
    const heightmap = this.terrainData.heightmap;

    // Generate base moisture from noise
    const seed = this.getParameter('seed') as number;
    const random = this.seededRandom(seed + 2);
    const offsets = [{ x: random() * 1000, y: random() * 1000 }];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        // Base moisture from noise
        let m = (this.simplex2D(x * 0.01 + offsets[0].x, y * 0.01 + offsets[0].y) + 1) / 2;
        
        // Modify by height (more moisture at low elevations)
        const h = heightmap[idx];
        m = m * (1 - h * 0.5);
        
        // Increase moisture near water level
        const waterLevel = this.getParameter('waterLevel') as number;
        if (h < waterLevel + 0.1) {
          m = Math.min(1, m + 0.3);
        }

        moisture[idx] = Math.max(0, Math.min(1, m));
      }
    }

    // Simulate moisture spread
    const spreadIterations = 5;
    for (let iter = 0; iter < spreadIterations; iter++) {
      const temp = new Float32Array(moisture);
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const avg = (temp[idx - 1] + temp[idx + 1] + temp[idx - width] + temp[idx + width]) / 4;
          moisture[idx] = temp[idx] * 0.8 + avg * 0.2;
        }
      }
    }
  }

  private carveWaterBodies(): void {
    if (!this.terrainData) return;

    const waterLevel = this.getParameter('waterLevel') as number;
    const width = this.terrainData.width;
    const height = this.terrainData.height;
    const heightmap = this.terrainData.heightmap;

    // Find water bodies (connected regions below water level)
    this.waterBodies = [];
    const visited = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (heightmap[idx] < waterLevel && !visited[idx]) {
          // Flood fill to find water body extent
          let minX = x, maxX = x, minY = y, maxY = y;
          const queue = [{ x, y }];
          visited[idx] = 1;

          while (queue.length > 0) {
            const curr = queue.shift()!;
            
            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
              const nx = curr.x + dx;
              const ny = curr.y + dy;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (!visited[nIdx] && heightmap[nIdx] < waterLevel) {
                  visited[nIdx] = 1;
                  queue.push({ x: nx, y: ny });
                  minX = Math.min(minX, nx);
                  maxX = Math.max(maxX, nx);
                  minY = Math.min(minY, ny);
                  maxY = Math.max(maxY, ny);
                }
              }
            }
          }

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const radius = Math.max(maxX - minX, maxY - minY) / 2;

          this.waterBodies.push({ x: centerX, y: centerY, radius, level: waterLevel });
        }
      }
    }

    // Carve rivers if enabled
    if (this.getParameter('riverCarving')) {
      this.carveRivers();
    }
  }

  private carveRivers(): void {
    if (!this.terrainData) return;

    const width = this.terrainData.width;
    const height = this.terrainData.height;
    const heightmap = this.terrainData.heightmap;
    const erosion = this.terrainData.erosion;
    const riverWidth = this.getParameter('riverWidth') as number;
    const riverDepth = this.getParameter('riverDepth') as number;
    const waterLevel = this.getParameter('waterLevel') as number;

    // Find high erosion paths (natural river beds)
    const seed = this.getParameter('seed') as number;
    const random = this.seededRandom(seed + 3);
    const numRivers = 3;

    for (let r = 0; r < numRivers; r++) {
      // Start from a high point
      let startX = Math.floor(random() * width);
      let startY = Math.floor(random() * height);
      let startIdx = startY * width + startX;

      // Find nearby peak
      for (let i = 0; i < 100; i++) {
        let maxH = heightmap[startIdx];
        let maxIdx = startIdx;

        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = startX + dx;
          const ny = startY + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (heightmap[nIdx] > maxH) {
              maxH = heightmap[nIdx];
              maxIdx = nIdx;
              startX = nx;
              startY = ny;
            }
          }
        }

        if (maxIdx === startIdx) break;
        startIdx = maxIdx;
      }

      // Flow downhill carving river
      let x = startX;
      let y = startY;
      const maxSteps = 1000;

      for (let step = 0; step < maxSteps; step++) {
        const idx = y * width + x;
        
        if (heightmap[idx] < waterLevel) break;

        // Carve river bed
        for (let ry = -riverWidth; ry <= riverWidth; ry++) {
          for (let rx = -riverWidth; rx <= riverWidth; rx++) {
            const dist = Math.sqrt(rx * rx + ry * ry);
            if (dist <= riverWidth) {
              const nx = x + rx;
              const ny = y + ry;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                const carveAmount = riverDepth * (1 - dist / riverWidth);
                heightmap[nIdx] -= carveAmount;
                erosion[nIdx] += carveAmount;
              }
            }
          }
        }

        // Find steepest descent
        let minH = heightmap[idx];
        let nextX = x;
        let nextY = y;

        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (heightmap[nIdx] < minH) {
              minH = heightmap[nIdx];
              nextX = nx;
              nextY = ny;
            }
          }
        }

        if (nextX === x && nextY === y) break;
        x = nextX;
        y = nextY;
      }
    }
  }

  private calculateNormals(): void {
    if (!this.terrainData) return;

    const width = this.terrainData.width;
    const height = this.terrainData.height;
    const heightmap = this.terrainData.heightmap;
    const normals = this.terrainData.normals;
    const scale = this.getParameter('heightScale') as number;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        // Get neighboring heights
        const left = x > 0 ? heightmap[idx - 1] : heightmap[idx];
        const right = x < width - 1 ? heightmap[idx + 1] : heightmap[idx];
        const up = y > 0 ? heightmap[idx - width] : heightmap[idx];
        const down = y < height - 1 ? heightmap[idx + width] : heightmap[idx];

        // Calculate normal
        const nx = (left - right) * scale;
        const ny = 2;
        const nz = (up - down) * scale;

        // Normalize
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        normals[idx * 3] = nx / len;
        normals[idx * 3 + 1] = ny / len;
        normals[idx * 3 + 2] = nz / len;
      }
    }
  }

  private classifyBiomes(): void {
    if (!this.terrainData) return;

    const width = this.terrainData.width;
    const height = this.terrainData.height;
    const heightmap = this.terrainData.heightmap;
    const moisture = this.terrainData.moisture;
    const biomeMap = this.terrainData.biomeMap;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const h = heightmap[idx];
        const m = moisture[idx];

        // Find matching biome
        let bestBiome = this.biomes[0];
        let bestScore = 0;

        for (const biome of this.biomes) {
          if (h >= biome.minHeight && h <= biome.maxHeight &&
              m >= biome.minMoisture && m <= biome.maxMoisture) {
            const heightFit = 1 - Math.abs(h - (biome.minHeight + biome.maxHeight) / 2) / (biome.maxHeight - biome.minHeight);
            const moistureFit = 1 - Math.abs(m - (biome.minMoisture + biome.maxMoisture) / 2) / Math.max(0.01, biome.maxMoisture - biome.minMoisture);
            const score = heightFit * 0.6 + moistureFit * 0.4;

            if (score > bestScore) {
              bestScore = score;
              bestBiome = biome;
            }
          }
        }

        biomeMap[idx] = bestBiome.id;
      }
    }
  }

  private generateVegetation(): void {
    if (!this.terrainData) return;

    this.vegetationInstances = [];

    const width = this.terrainData.width;
    const height = this.terrainData.height;
    const worldSize = this.getParameter('worldSize') as number;
    const heightScale = this.getParameter('heightScale') as number;
    const density = this.getParameter('vegetationDensity') as number;
    const minSlope = this.getParameter('vegetationMinSlope') as number;
    const maxSlope = this.getParameter('vegetationMaxSlope') as number;
    const minHeight = this.getParameter('vegetationMinHeight') as number;
    const maxHeight = this.getParameter('vegetationMaxHeight') as number;

    const heightmap = this.terrainData.heightmap;
    const normals = this.terrainData.normals;
    const biomeMap = this.terrainData.biomeMap;

    const seed = this.getParameter('seed') as number;
    const random = this.seededRandom(seed + 4);

    // Calculate number of instances based on density
    const area = (worldSize * worldSize) / 10000; // Per 100x100 units
    const numInstances = Math.floor(density * area);

    for (let i = 0; i < numInstances; i++) {
      const gx = random() * (width - 1);
      const gy = random() * (height - 1);
      const ix = Math.floor(gx);
      const iy = Math.floor(gy);
      const idx = iy * width + ix;

      const h = heightmap[idx];

      // Check height constraints
      if (h < minHeight || h > maxHeight) continue;

      // Check slope constraints
      const ny = normals[idx * 3 + 1]; // Y component of normal
      const slope = 1 - ny;
      if (slope < minSlope || slope > maxSlope) continue;

      // Check biome allows vegetation
      const biome = biomeMap[idx];
      const biomeName = this.biomes.find(b => b.id === biome)?.name || '';
      if (biomeName === 'DeepWater' || biomeName === 'ShallowWater' || biomeName === 'Beach' || biomeName === 'Snow') {
        continue;
      }

      // Determine vegetation type based on biome
      let vegType = 'tree';
      if (biomeName === 'Desert') vegType = 'cactus';
      else if (biomeName === 'Grassland') vegType = random() < 0.3 ? 'tree' : 'grass';
      else if (biomeName === 'Forest' || biomeName === 'Jungle') vegType = 'tree';
      else if (biomeName === 'Hills' || biomeName === 'Mountain') vegType = random() < 0.5 ? 'shrub' : 'rock';

      // Convert to world coordinates
      const worldX = (gx / width - 0.5) * worldSize;
      const worldZ = (gy / height - 0.5) * worldSize;
      const worldY = h * heightScale;

      this.vegetationInstances.push({
        x: worldX,
        y: worldY,
        z: worldZ,
        scale: 0.5 + random() * 1.0,
        rotation: random() * Math.PI * 2,
        type: vegType
      });
    }
  }

  private blendSeedHeightmap(seed: ImageData): void {
    if (!this.terrainData) return;

    const width = this.terrainData.width;
    const height = this.terrainData.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        // Sample seed image
        const sx = Math.floor(x / width * seed.width);
        const sy = Math.floor(y / height * seed.height);
        const sIdx = (sy * seed.width + sx) * 4;

        const seedValue = seed.data[sIdx] / 255;

        // Blend with generated heightmap
        this.terrainData.heightmap[idx] = this.terrainData.heightmap[idx] * 0.5 + seedValue * 0.5;
      }
    }
  }

  private applyMask(mask: ImageData): void {
    if (!this.terrainData) return;

    const width = this.terrainData.width;
    const height = this.terrainData.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        const mx = Math.floor(x / width * mask.width);
        const my = Math.floor(y / height * mask.height);
        const mIdx = (my * mask.width + mx) * 4;

        const maskValue = mask.data[mIdx] / 255;

        // Blend heightmap towards base level in masked areas
        this.terrainData.heightmap[idx] = this.terrainData.heightmap[idx] * maskValue + 0.5 * (1 - maskValue);
      }
    }
  }

  private createOutputs(resolution: number, heightScale: number): void {
    if (!this.terrainData) return;

    const width = resolution;
    const height = resolution;

    // Heightmap output
    const heightmapImage = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const h = Math.round(this.terrainData.heightmap[i] * 255);
      heightmapImage.data[i * 4] = h;
      heightmapImage.data[i * 4 + 1] = h;
      heightmapImage.data[i * 4 + 2] = h;
      heightmapImage.data[i * 4 + 3] = 255;
    }
    const heightOut = this.outputs.get('heightmap');
    if (heightOut) heightOut.value = heightmapImage;

    // Normal map output
    const normalImage = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      normalImage.data[i * 4] = Math.round((this.terrainData.normals[i * 3] + 1) * 127.5);
      normalImage.data[i * 4 + 1] = Math.round((this.terrainData.normals[i * 3 + 1] + 1) * 127.5);
      normalImage.data[i * 4 + 2] = Math.round((this.terrainData.normals[i * 3 + 2] + 1) * 127.5);
      normalImage.data[i * 4 + 3] = 255;
    }
    const normalOut = this.outputs.get('normalMap');
    if (normalOut) normalOut.value = normalImage;

    // Biome map output
    const biomeImage = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const biomeId = this.terrainData.biomeMap[i];
      const biome = this.biomes.find(b => b.id === biomeId) || this.biomes[0];
      biomeImage.data[i * 4] = biome.color.r;
      biomeImage.data[i * 4 + 1] = biome.color.g;
      biomeImage.data[i * 4 + 2] = biome.color.b;
      biomeImage.data[i * 4 + 3] = 255;
    }
    const biomeOut = this.outputs.get('biomeMap');
    if (biomeOut) biomeOut.value = biomeImage;

    // Erosion map output
    const erosionImage = new ImageData(width, height);
    let maxErosion = 0;
    for (let i = 0; i < width * height; i++) {
      maxErosion = Math.max(maxErosion, this.terrainData.erosion[i]);
    }
    for (let i = 0; i < width * height; i++) {
      const e = maxErosion > 0 ? Math.round(this.terrainData.erosion[i] / maxErosion * 255) : 0;
      erosionImage.data[i * 4] = e;
      erosionImage.data[i * 4 + 1] = e;
      erosionImage.data[i * 4 + 2] = e;
      erosionImage.data[i * 4 + 3] = 255;
    }
    const erosionOut = this.outputs.get('erosionMap');
    if (erosionOut) erosionOut.value = erosionImage;

    // Moisture map output
    const moistureImage = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const m = Math.round(this.terrainData.moisture[i] * 255);
      moistureImage.data[i * 4] = 0;
      moistureImage.data[i * 4 + 1] = 0;
      moistureImage.data[i * 4 + 2] = m;
      moistureImage.data[i * 4 + 3] = 255;
    }
    const moistureOut = this.outputs.get('moistureMap');
    if (moistureOut) moistureOut.value = moistureImage;

    // Geometry output (simplified mesh data)
    const geometryOut = this.outputs.get('terrainGeometry');
    if (geometryOut) {
      geometryOut.value = {
        type: 'terrain',
        width: width,
        height: height,
        worldSize: this.getParameter('worldSize'),
        heightScale: heightScale,
        heightmap: Array.from(this.terrainData.heightmap),
        normals: Array.from(this.terrainData.normals)
      };
    }

    // Vegetation output
    const vegOut = this.outputs.get('vegetationData');
    if (vegOut) vegOut.value = this.vegetationInstances;
  }

  // Noise functions
  private simplex2D(x: number, y: number): number {
    // Simplified Simplex-like noise
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const n0 = this.contribution(x0, y0, i, j);
    const n1 = this.contribution(x1, y1, i + i1, j + j1);
    const n2 = this.contribution(x2, y2, i + 1, j + 1);

    return 70 * (n0 + n1 + n2);
  }

  private contribution(x: number, y: number, i: number, j: number): number {
    let t = 0.5 - x * x - y * y;
    if (t < 0) return 0;

    t *= t;
    const grad = this.gradient(i, j);
    return t * t * (grad.x * x + grad.y * y);
  }

  private gradient(i: number, j: number): { x: number; y: number } {
    const hash = this.hashCoord(i, j) % 8;
    const gradients = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }
    ];
    return gradients[hash];
  }

  private perlin2D(x: number, y: number): number {
    // Simplified Perlin noise
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = this.fade(xf);
    const v = this.fade(yf);
    
    const a = this.hashCoord(X, Y);
    const b = this.hashCoord(X + 1, Y);
    const c = this.hashCoord(X, Y + 1);
    const d = this.hashCoord(X + 1, Y + 1);
    
    const x1 = this.lerp(this.grad(a, xf, yf), this.grad(b, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(c, xf, yf - 1), this.grad(d, xf - 1, yf - 1), u);
    
    return this.lerp(x1, x2, v);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private hashCoord(x: number, y: number): number {
    let hash = x * 374761393 + y * 668265263;
    hash = (hash ^ (hash >> 13)) * 1274126177;
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  dispose(): void {
    this.terrainData = null;
    this.vegetationInstances = [];
    this.waterBodies = [];
    super.dispose();
  }
}
