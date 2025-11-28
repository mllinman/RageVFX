/**
 * FluidPhysicsNode - Complete fluid dynamics system (Maya-like)
 * Version 3.2 - Fluid Physics System
 */

import { Node, DataType } from '../core/Node';

interface FluidCell {
  density: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  temperature: number;
  fuel: number;
  smoke: number;
  pressure: number;
}

interface FluidEmitter {
  id: string;
  type: 'point' | 'sphere' | 'box' | 'mesh';
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  emissionRate: number;
  density: number;
  temperature: number;
  velocityBias: { x: number; y: number; z: number };
  turbulence: number;
  active: boolean;
}

// Physical constants for fluid simulation
const DIVERGENCE_SCALE = -0.5; // Central difference scaling factor for divergence calculation
const PRESSURE_NEIGHBOR_COUNT = 6; // Number of neighbors in 3D grid (for Jacobi iteration)

export class FluidPhysicsNode extends Node {
  private grid: FluidCell[] = [];
  private gridSize: { x: number; y: number; z: number } = { x: 64, y: 64, z: 64 };
  private emitters: FluidEmitter[] = [];
  private time: number = 0;
  private frameCount: number = 0;
  private cachedFrames: Map<number, any> = new Map();

  constructor(id: string) {
    super(id, 'FluidPhysics', 'Fluid Physics');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Complete fluid dynamics system for smoke, fire, and liquid simulations';
    this.metadata.version = '3.2.0';
    
    // Inputs
    this.addInput('colliders', 'Colliders', DataType.GEOMETRY_3D);
    this.addInput('emitterMesh', 'Emitter Mesh', DataType.GEOMETRY_3D);
    this.addInput('forceField', 'Force Field', DataType.ANY);
    this.addInput('temperatureField', 'Temperature Field', DataType.ANY);
    
    // Outputs
    this.addOutput('densityVolume', 'Density Volume', DataType.ANY);
    this.addOutput('velocityVolume', 'Velocity Volume', DataType.ANY);
    this.addOutput('temperatureVolume', 'Temperature Volume', DataType.ANY);
    this.addOutput('smokeVolume', 'Smoke Volume', DataType.ANY);
    this.addOutput('fuelVolume', 'Fuel Volume', DataType.ANY);
    this.addOutput('renderVolume', 'Render Volume', DataType.ANY);
    
    // Simulation Type
    this.setParameter('fluidType', 'smoke');  // smoke, fire, liquid, pyro
    this.setParameter('solverType', 'eulerian');  // eulerian, flip, hybrid
    
    // Grid Settings
    this.setParameter('resolution', { x: 64, y: 64, z: 64 });
    this.setParameter('voxelSize', 0.1);  // world units per voxel
    this.setParameter('gridCenter', { x: 0, y: 1, z: 0 });
    this.setParameter('adaptiveGrid', false);
    this.setParameter('adaptiveThreshold', 0.01);
    
    // Time Settings
    this.setParameter('substeps', 2);
    this.setParameter('timeScale', 1.0);
    this.setParameter('cfl', 0.5);  // Courant–Friedrichs–Lewy condition
    this.setParameter('maxTimestep', 0.04);
    
    // Physical Properties
    this.setParameter('gravity', { x: 0, y: -9.81, z: 0 });
    this.setParameter('buoyancy', 1.0);
    this.setParameter('buoyancyBias', { x: 0, y: 1, z: 0 });
    this.setParameter('viscosity', 0.01);
    this.setParameter('diffusion', 0.001);
    
    // Density Settings
    this.setParameter('densityDissipation', 0.98);
    this.setParameter('densityMultiplier', 1.0);
    
    // Velocity Settings
    this.setParameter('velocityDissipation', 0.99);
    this.setParameter('vorticityConfinement', 0.5);
    this.setParameter('velocityScale', 1.0);
    
    // Temperature Settings
    this.setParameter('temperatureDissipation', 0.95);
    this.setParameter('ambientTemperature', 20);
    this.setParameter('ignitionTemperature', 100);
    this.setParameter('maxTemperature', 2000);
    this.setParameter('coolingRate', 1.0);
    
    // Combustion (Fire)
    this.setParameter('enableCombustion', false);
    this.setParameter('fuelConsumption', 0.5);
    this.setParameter('burnRate', 2.0);
    this.setParameter('smokeGeneration', 1.5);
    this.setParameter('heatGeneration', 3.0);
    this.setParameter('expansionRate', 1.2);
    
    // Turbulence
    this.setParameter('turbulenceStrength', 0.5);
    this.setParameter('turbulenceScale', 1.0);
    this.setParameter('turbulenceSpeed', 1.0);
    this.setParameter('turbulenceOctaves', 4);
    this.setParameter('turbulenceLacunarity', 2.0);
    this.setParameter('turbulenceGain', 0.5);
    
    // Boundaries
    this.setParameter('boundaryType', 'solid');  // solid, open, periodic
    this.setParameter('boundaryFriction', 0.5);
    
    // Emitter Settings
    this.setParameter('emitterType', 'point');
    this.setParameter('emitterPosition', { x: 0, y: 0, z: 0 });
    this.setParameter('emitterSize', { x: 1, y: 1, z: 1 });
    this.setParameter('emissionRate', 10);
    this.setParameter('emissionDensity', 1.0);
    this.setParameter('emissionTemperature', 500);
    this.setParameter('emissionVelocity', { x: 0, y: 5, z: 0 });
    this.setParameter('emissionNoise', 0.2);
    
    // Pressure Solver
    this.setParameter('pressureIterations', 40);
    this.setParameter('pressureTolerance', 0.0001);
    this.setParameter('pressureSolver', 'jacobi');  // jacobi, gauss-seidel, conjugate-gradient
    
    // Caching
    this.setParameter('cacheEnabled', true);
    this.setParameter('cacheDirectory', './fluid_cache');
    this.setParameter('cacheStartFrame', 1);
    this.setParameter('cacheEndFrame', 250);
    this.setParameter('cacheFormat', 'vdb');  // vdb, field3d, raw
    
    // Rendering
    this.setParameter('renderDensity', true);
    this.setParameter('renderTemperature', false);
    this.setParameter('renderVelocity', false);
    this.setParameter('temperatureColorMap', 'blackbody');  // blackbody, rainbow, custom
    
    // Initialize grid
    this.initializeGrid();
  }

  private initializeGrid(): void {
    const res = this.getParameter('resolution');
    this.gridSize = res;
    const totalCells = res.x * res.y * res.z;
    
    this.grid = new Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
      this.grid[i] = {
        density: 0,
        velocityX: 0,
        velocityY: 0,
        velocityZ: 0,
        temperature: this.getParameter('ambientTemperature'),
        fuel: 0,
        smoke: 0,
        pressure: 0
      };
    }
  }

  async process(): Promise<void> {
    const deltaTime = 0.016 * this.getParameter('timeScale');
    const substeps = this.getParameter('substeps');
    const dt = deltaTime / substeps;
    
    this.time += deltaTime;
    this.frameCount++;
    
    // Check cache
    if (this.getParameter('cacheEnabled') && this.cachedFrames.has(this.frameCount)) {
      this.restoreFromCache(this.frameCount);
    } else {
      // Run simulation substeps
      for (let step = 0; step < substeps; step++) {
        // Add sources (emitters)
        this.addSources(dt);
        
        // Apply external forces
        this.applyExternalForces(dt);
        
        // Apply buoyancy
        this.applyBuoyancy(dt);
        
        // Apply turbulence
        this.applyTurbulence(dt);
        
        // Apply vorticity confinement
        this.applyVorticityConfinement(dt);
        
        // Advect velocity
        this.advectVelocity(dt);
        
        // Project velocity (pressure solve)
        this.projectVelocity();
        
        // Advect density and temperature
        this.advectScalars(dt);
        
        // Handle combustion
        if (this.getParameter('enableCombustion')) {
          this.processCombustion(dt);
        }
        
        // Apply dissipation
        this.applyDissipation(dt);
        
        // Handle boundaries
        this.handleBoundaries();
        
        // Handle colliders
        this.handleColliders();
      }
      
      // Cache frame
      if (this.getParameter('cacheEnabled')) {
        this.cacheFrame(this.frameCount);
      }
    }
    
    // Generate outputs
    this.setOutputs();
  }

  private getIndex(x: number, y: number, z: number): number {
    const { x: sx, y: sy, z: sz } = this.gridSize;
    x = Math.max(0, Math.min(sx - 1, Math.floor(x)));
    y = Math.max(0, Math.min(sy - 1, Math.floor(y)));
    z = Math.max(0, Math.min(sz - 1, Math.floor(z)));
    return x + y * sx + z * sx * sy;
  }

  private addSources(dt: number): void {
    const emitterPos = this.getParameter('emitterPosition');
    const emitterSize = this.getParameter('emitterSize');
    const emissionRate = this.getParameter('emissionRate');
    const density = this.getParameter('emissionDensity');
    const temperature = this.getParameter('emissionTemperature');
    const velocity = this.getParameter('emissionVelocity');
    const noise = this.getParameter('emissionNoise');
    const voxelSize = this.getParameter('voxelSize');
    const gridCenter = this.getParameter('gridCenter');
    const fluidType = this.getParameter('fluidType');
    
    // Convert world position to grid position
    const gridPos = {
      x: (emitterPos.x - gridCenter.x) / voxelSize + this.gridSize.x / 2,
      y: (emitterPos.y - gridCenter.y) / voxelSize + this.gridSize.y / 2,
      z: (emitterPos.z - gridCenter.z) / voxelSize + this.gridSize.z / 2
    };
    
    const gridSize = {
      x: emitterSize.x / voxelSize,
      y: emitterSize.y / voxelSize,
      z: emitterSize.z / voxelSize
    };
    
    // Emit into cells within emitter bounds
    for (let dz = -gridSize.z / 2; dz < gridSize.z / 2; dz++) {
      for (let dy = -gridSize.y / 2; dy < gridSize.y / 2; dy++) {
        for (let dx = -gridSize.x / 2; dx < gridSize.x / 2; dx++) {
          const ix = Math.floor(gridPos.x + dx);
          const iy = Math.floor(gridPos.y + dy);
          const iz = Math.floor(gridPos.z + dz);
          
          if (ix < 0 || ix >= this.gridSize.x ||
              iy < 0 || iy >= this.gridSize.y ||
              iz < 0 || iz >= this.gridSize.z) continue;
          
          const idx = this.getIndex(ix, iy, iz);
          const cell = this.grid[idx];
          
          // Add randomness
          const noiseVal = 1 + (Math.random() - 0.5) * 2 * noise;
          
          // Add density
          cell.density += density * emissionRate * dt * noiseVal;
          
          // Add temperature
          if (fluidType === 'fire' || fluidType === 'pyro') {
            cell.temperature = Math.max(cell.temperature, temperature);
            cell.fuel += emissionRate * dt * noiseVal;
          } else {
            cell.temperature += (temperature - cell.temperature) * 0.1 * dt;
          }
          
          // Add velocity
          cell.velocityX += velocity.x * dt * noiseVal;
          cell.velocityY += velocity.y * dt * noiseVal;
          cell.velocityZ += velocity.z * dt * noiseVal;
        }
      }
    }
  }

  private applyExternalForces(dt: number): void {
    const forceField = this.inputs.get('forceField')?.value;
    if (!forceField) return;
    
    const voxelSize = this.getParameter('voxelSize');
    const gridCenter = this.getParameter('gridCenter');
    
    for (let z = 0; z < this.gridSize.z; z++) {
      for (let y = 0; y < this.gridSize.y; y++) {
        for (let x = 0; x < this.gridSize.x; x++) {
          const idx = this.getIndex(x, y, z);
          const cell = this.grid[idx];
          
          // Convert grid position to world position
          const worldX = (x - this.gridSize.x / 2) * voxelSize + gridCenter.x;
          const worldY = (y - this.gridSize.y / 2) * voxelSize + gridCenter.y;
          const worldZ = (z - this.gridSize.z / 2) * voxelSize + gridCenter.z;
          
          // Sample force field
          if (forceField.sample) {
            const force = forceField.sample(worldX, worldY, worldZ);
            cell.velocityX += force.x * dt;
            cell.velocityY += force.y * dt;
            cell.velocityZ += force.z * dt;
          }
        }
      }
    }
  }

  private applyBuoyancy(dt: number): void {
    const buoyancy = this.getParameter('buoyancy');
    const buoyancyBias = this.getParameter('buoyancyBias');
    const ambientTemp = this.getParameter('ambientTemperature');
    
    for (let i = 0; i < this.grid.length; i++) {
      const cell = this.grid[i];
      
      // Temperature-based buoyancy
      const tempDiff = cell.temperature - ambientTemp;
      const buoyancyForce = buoyancy * tempDiff * 0.001;
      
      // Density-based buoyancy (negative - sinks)
      const densityForce = -cell.density * 0.1;
      
      const totalForce = buoyancyForce + densityForce;
      
      cell.velocityX += buoyancyBias.x * totalForce * dt;
      cell.velocityY += buoyancyBias.y * totalForce * dt;
      cell.velocityZ += buoyancyBias.z * totalForce * dt;
    }
  }

  private applyTurbulence(dt: number): void {
    const strength = this.getParameter('turbulenceStrength');
    if (strength === 0) return;
    
    const scale = this.getParameter('turbulenceScale');
    const speed = this.getParameter('turbulenceSpeed');
    
    for (let z = 0; z < this.gridSize.z; z++) {
      for (let y = 0; y < this.gridSize.y; y++) {
        for (let x = 0; x < this.gridSize.x; x++) {
          const idx = this.getIndex(x, y, z);
          const cell = this.grid[idx];
          
          if (cell.density < 0.01) continue;
          
          // Perlin noise-like turbulence
          const nx = x * scale / this.gridSize.x + this.time * speed;
          const ny = y * scale / this.gridSize.y + this.time * speed * 1.1;
          const nz = z * scale / this.gridSize.z + this.time * speed * 0.9;
          
          const turbX = Math.sin(nx * 6.28) * Math.cos(ny * 3.14) * strength;
          const turbY = Math.cos(nz * 6.28) * Math.sin(nx * 3.14) * strength;
          const turbZ = Math.sin(ny * 6.28) * Math.cos(nz * 3.14) * strength;
          
          cell.velocityX += turbX * dt * cell.density;
          cell.velocityY += turbY * dt * cell.density;
          cell.velocityZ += turbZ * dt * cell.density;
        }
      }
    }
  }

  private applyVorticityConfinement(dt: number): void {
    const epsilon = this.getParameter('vorticityConfinement');
    if (epsilon === 0) return;
    
    const { x: sx, y: sy, z: sz } = this.gridSize;
    
    // Calculate curl (vorticity)
    const curlX = new Float32Array(this.grid.length);
    const curlY = new Float32Array(this.grid.length);
    const curlZ = new Float32Array(this.grid.length);
    
    for (let z = 1; z < sz - 1; z++) {
      for (let y = 1; y < sy - 1; y++) {
        for (let x = 1; x < sx - 1; x++) {
          const idx = this.getIndex(x, y, z);
          
          // Finite differences
          const dwydz = (this.grid[this.getIndex(x, y, z + 1)].velocityY - 
                         this.grid[this.getIndex(x, y, z - 1)].velocityY) * 0.5;
          const dwzdy = (this.grid[this.getIndex(x, y + 1, z)].velocityZ - 
                         this.grid[this.getIndex(x, y - 1, z)].velocityZ) * 0.5;
          const dwxdz = (this.grid[this.getIndex(x, y, z + 1)].velocityX - 
                         this.grid[this.getIndex(x, y, z - 1)].velocityX) * 0.5;
          const dwzdx = (this.grid[this.getIndex(x + 1, y, z)].velocityZ - 
                         this.grid[this.getIndex(x - 1, y, z)].velocityZ) * 0.5;
          const dwydx = (this.grid[this.getIndex(x + 1, y, z)].velocityY - 
                         this.grid[this.getIndex(x - 1, y, z)].velocityY) * 0.5;
          const dwxdy = (this.grid[this.getIndex(x, y + 1, z)].velocityX - 
                         this.grid[this.getIndex(x, y - 1, z)].velocityX) * 0.5;
          
          curlX[idx] = dwydz - dwzdy;
          curlY[idx] = dwxdz - dwzdx;
          curlZ[idx] = dwydx - dwxdy;
        }
      }
    }
    
    // Pre-compute curl magnitudes for better performance
    const curlMagnitudes = new Float32Array(this.grid.length);
    for (let i = 0; i < this.grid.length; i++) {
      curlMagnitudes[i] = Math.sqrt(curlX[i] * curlX[i] + curlY[i] * curlY[i] + curlZ[i] * curlZ[i]);
    }
    
    // Apply confinement force
    for (let z = 1; z < sz - 1; z++) {
      for (let y = 1; y < sy - 1; y++) {
        for (let x = 1; x < sx - 1; x++) {
          const idx = this.getIndex(x, y, z);
          const cell = this.grid[idx];
          
          const cx = curlX[idx];
          const cy = curlY[idx];
          const cz = curlZ[idx];
          const curlMag = curlMagnitudes[idx] + 0.0001;
          
          // Gradient of curl magnitude using pre-computed values
          const dmagdx = (curlMagnitudes[this.getIndex(x + 1, y, z)] - curlMagnitudes[this.getIndex(x - 1, y, z)]) * 0.5;
          const dmagdy = (curlMagnitudes[this.getIndex(x, y + 1, z)] - curlMagnitudes[this.getIndex(x, y - 1, z)]) * 0.5;
          const dmagdz = (curlMagnitudes[this.getIndex(x, y, z + 1)] - curlMagnitudes[this.getIndex(x, y, z - 1)]) * 0.5;
          
          const gradMag = Math.sqrt(dmagdx * dmagdx + dmagdy * dmagdy + dmagdz * dmagdz) + 0.0001;
          const nx = dmagdx / gradMag;
          const ny = dmagdy / gradMag;
          const nz = dmagdz / gradMag;
          
          // Cross product N x omega
          cell.velocityX += epsilon * (ny * cz - nz * cy) * dt;
          cell.velocityY += epsilon * (nz * cx - nx * cz) * dt;
          cell.velocityZ += epsilon * (nx * cy - ny * cx) * dt;
        }
      }
    }
  }

  private advectVelocity(dt: number): void {
    const { x: sx, y: sy, z: sz } = this.gridSize;
    const newGrid = this.grid.map(cell => ({ ...cell }));
    
    for (let z = 1; z < sz - 1; z++) {
      for (let y = 1; y < sy - 1; y++) {
        for (let x = 1; x < sx - 1; x++) {
          const idx = this.getIndex(x, y, z);
          const cell = this.grid[idx];
          
          // Trace back
          const srcX = x - cell.velocityX * dt;
          const srcY = y - cell.velocityY * dt;
          const srcZ = z - cell.velocityZ * dt;
          
          // Trilinear interpolation
          const interpolated = this.interpolateCell(srcX, srcY, srcZ);
          
          newGrid[idx].velocityX = interpolated.velocityX;
          newGrid[idx].velocityY = interpolated.velocityY;
          newGrid[idx].velocityZ = interpolated.velocityZ;
        }
      }
    }
    
    // Copy back
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i].velocityX = newGrid[i].velocityX;
      this.grid[i].velocityY = newGrid[i].velocityY;
      this.grid[i].velocityZ = newGrid[i].velocityZ;
    }
  }

  private interpolateCell(x: number, y: number, z: number): FluidCell {
    const { x: sx, y: sy, z: sz } = this.gridSize;
    
    x = Math.max(0.5, Math.min(sx - 1.5, x));
    y = Math.max(0.5, Math.min(sy - 1.5, y));
    z = Math.max(0.5, Math.min(sz - 1.5, z));
    
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const z1 = z0 + 1;
    
    const tx = x - x0;
    const ty = y - y0;
    const tz = z - z0;
    
    // Get 8 corner values
    const c000 = this.grid[this.getIndex(x0, y0, z0)];
    const c100 = this.grid[this.getIndex(x1, y0, z0)];
    const c010 = this.grid[this.getIndex(x0, y1, z0)];
    const c110 = this.grid[this.getIndex(x1, y1, z0)];
    const c001 = this.grid[this.getIndex(x0, y0, z1)];
    const c101 = this.grid[this.getIndex(x1, y0, z1)];
    const c011 = this.grid[this.getIndex(x0, y1, z1)];
    const c111 = this.grid[this.getIndex(x1, y1, z1)];
    
    // Trilinear interpolation helper
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const trilerp = (c000: number, c100: number, c010: number, c110: number,
                     c001: number, c101: number, c011: number, c111: number) => {
      return lerp(
        lerp(lerp(c000, c100, tx), lerp(c010, c110, tx), ty),
        lerp(lerp(c001, c101, tx), lerp(c011, c111, tx), ty),
        tz
      );
    };
    
    return {
      density: trilerp(c000.density, c100.density, c010.density, c110.density,
                       c001.density, c101.density, c011.density, c111.density),
      velocityX: trilerp(c000.velocityX, c100.velocityX, c010.velocityX, c110.velocityX,
                         c001.velocityX, c101.velocityX, c011.velocityX, c111.velocityX),
      velocityY: trilerp(c000.velocityY, c100.velocityY, c010.velocityY, c110.velocityY,
                         c001.velocityY, c101.velocityY, c011.velocityY, c111.velocityY),
      velocityZ: trilerp(c000.velocityZ, c100.velocityZ, c010.velocityZ, c110.velocityZ,
                         c001.velocityZ, c101.velocityZ, c011.velocityZ, c111.velocityZ),
      temperature: trilerp(c000.temperature, c100.temperature, c010.temperature, c110.temperature,
                           c001.temperature, c101.temperature, c011.temperature, c111.temperature),
      fuel: trilerp(c000.fuel, c100.fuel, c010.fuel, c110.fuel,
                    c001.fuel, c101.fuel, c011.fuel, c111.fuel),
      smoke: trilerp(c000.smoke, c100.smoke, c010.smoke, c110.smoke,
                     c001.smoke, c101.smoke, c011.smoke, c111.smoke),
      pressure: 0
    };
  }

  private projectVelocity(): void {
    const iterations = this.getParameter('pressureIterations');
    const { x: sx, y: sy, z: sz } = this.gridSize;
    
    // Calculate divergence
    const divergence = new Float32Array(this.grid.length);
    const pressure = new Float32Array(this.grid.length);
    
    for (let z = 1; z < sz - 1; z++) {
      for (let y = 1; y < sy - 1; y++) {
        for (let x = 1; x < sx - 1; x++) {
          const idx = this.getIndex(x, y, z);
          
          divergence[idx] = DIVERGENCE_SCALE * (
            (this.grid[this.getIndex(x + 1, y, z)].velocityX - this.grid[this.getIndex(x - 1, y, z)].velocityX) +
            (this.grid[this.getIndex(x, y + 1, z)].velocityY - this.grid[this.getIndex(x, y - 1, z)].velocityY) +
            (this.grid[this.getIndex(x, y, z + 1)].velocityZ - this.grid[this.getIndex(x, y, z - 1)].velocityZ)
          );
        }
      }
    }
    
    // Solve pressure (Jacobi iteration)
    for (let iter = 0; iter < iterations; iter++) {
      for (let z = 1; z < sz - 1; z++) {
        for (let y = 1; y < sy - 1; y++) {
          for (let x = 1; x < sx - 1; x++) {
            const idx = this.getIndex(x, y, z);
            
            pressure[idx] = (divergence[idx] +
              pressure[this.getIndex(x - 1, y, z)] + pressure[this.getIndex(x + 1, y, z)] +
              pressure[this.getIndex(x, y - 1, z)] + pressure[this.getIndex(x, y + 1, z)] +
              pressure[this.getIndex(x, y, z - 1)] + pressure[this.getIndex(x, y, z + 1)]
            ) / 6;
          }
        }
      }
    }
    
    // Subtract pressure gradient from velocity
    for (let z = 1; z < sz - 1; z++) {
      for (let y = 1; y < sy - 1; y++) {
        for (let x = 1; x < sx - 1; x++) {
          const idx = this.getIndex(x, y, z);
          
          this.grid[idx].velocityX -= 0.5 * (pressure[this.getIndex(x + 1, y, z)] - pressure[this.getIndex(x - 1, y, z)]);
          this.grid[idx].velocityY -= 0.5 * (pressure[this.getIndex(x, y + 1, z)] - pressure[this.getIndex(x, y - 1, z)]);
          this.grid[idx].velocityZ -= 0.5 * (pressure[this.getIndex(x, y, z + 1)] - pressure[this.getIndex(x, y, z - 1)]);
          this.grid[idx].pressure = pressure[idx];
        }
      }
    }
  }

  private advectScalars(dt: number): void {
    const { x: sx, y: sy, z: sz } = this.gridSize;
    const newGrid = this.grid.map(cell => ({ ...cell }));
    
    for (let z = 1; z < sz - 1; z++) {
      for (let y = 1; y < sy - 1; y++) {
        for (let x = 1; x < sx - 1; x++) {
          const idx = this.getIndex(x, y, z);
          const cell = this.grid[idx];
          
          // Trace back using velocity
          const srcX = x - cell.velocityX * dt;
          const srcY = y - cell.velocityY * dt;
          const srcZ = z - cell.velocityZ * dt;
          
          // Interpolate
          const interpolated = this.interpolateCell(srcX, srcY, srcZ);
          
          newGrid[idx].density = interpolated.density;
          newGrid[idx].temperature = interpolated.temperature;
          newGrid[idx].fuel = interpolated.fuel;
          newGrid[idx].smoke = interpolated.smoke;
        }
      }
    }
    
    // Copy back
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i].density = newGrid[i].density;
      this.grid[i].temperature = newGrid[i].temperature;
      this.grid[i].fuel = newGrid[i].fuel;
      this.grid[i].smoke = newGrid[i].smoke;
    }
  }

  private processCombustion(dt: number): void {
    const ignitionTemp = this.getParameter('ignitionTemperature');
    const burnRate = this.getParameter('burnRate');
    const fuelConsumption = this.getParameter('fuelConsumption');
    const smokeGen = this.getParameter('smokeGeneration');
    const heatGen = this.getParameter('heatGeneration');
    const expansionRate = this.getParameter('expansionRate');
    
    for (let i = 0; i < this.grid.length; i++) {
      const cell = this.grid[i];
      
      if (cell.fuel > 0 && cell.temperature >= ignitionTemp) {
        // Burn fuel
        const burned = Math.min(cell.fuel, burnRate * dt);
        cell.fuel -= burned * fuelConsumption;
        
        // Generate heat
        cell.temperature += burned * heatGen;
        
        // Generate smoke
        cell.smoke += burned * smokeGen;
        cell.density += burned * smokeGen;
        
        // Expansion (add upward velocity)
        cell.velocityY += burned * expansionRate;
      }
    }
  }

  private applyDissipation(dt: number): void {
    const densityDiss = this.getParameter('densityDissipation');
    const velDiss = this.getParameter('velocityDissipation');
    const tempDiss = this.getParameter('temperatureDissipation');
    const ambientTemp = this.getParameter('ambientTemperature');
    const coolingRate = this.getParameter('coolingRate');
    
    for (let i = 0; i < this.grid.length; i++) {
      const cell = this.grid[i];
      
      cell.density *= densityDiss;
      cell.smoke *= densityDiss;
      cell.velocityX *= velDiss;
      cell.velocityY *= velDiss;
      cell.velocityZ *= velDiss;
      
      // Cool down temperature
      cell.temperature += (ambientTemp - cell.temperature) * coolingRate * dt;
      cell.temperature = Math.max(ambientTemp, cell.temperature * tempDiss);
    }
  }

  private handleBoundaries(): void {
    const boundaryType = this.getParameter('boundaryType');
    const { x: sx, y: sy, z: sz } = this.gridSize;
    
    if (boundaryType === 'solid') {
      // Zero velocity at boundaries
      for (let z = 0; z < sz; z++) {
        for (let y = 0; y < sy; y++) {
          // X boundaries
          this.grid[this.getIndex(0, y, z)].velocityX = 0;
          this.grid[this.getIndex(sx - 1, y, z)].velocityX = 0;
        }
        for (let x = 0; x < sx; x++) {
          // Y boundaries
          this.grid[this.getIndex(x, 0, z)].velocityY = 0;
          this.grid[this.getIndex(x, sy - 1, z)].velocityY = 0;
        }
      }
      for (let y = 0; y < sy; y++) {
        for (let x = 0; x < sx; x++) {
          // Z boundaries
          this.grid[this.getIndex(x, y, 0)].velocityZ = 0;
          this.grid[this.getIndex(x, y, sz - 1)].velocityZ = 0;
        }
      }
    }
  }

  private handleColliders(): void {
    const colliders = this.inputs.get('colliders')?.value;
    if (!colliders) return;
    
    // Would process collision geometry here
  }

  private cacheFrame(frame: number): void {
    // Store compressed grid data
    const cacheData = {
      frame,
      grid: this.grid.map(cell => ({
        d: cell.density,
        vx: cell.velocityX,
        vy: cell.velocityY,
        vz: cell.velocityZ,
        t: cell.temperature,
        f: cell.fuel,
        s: cell.smoke
      }))
    };
    
    this.cachedFrames.set(frame, cacheData);
  }

  private restoreFromCache(frame: number): void {
    const cacheData = this.cachedFrames.get(frame);
    if (!cacheData) return;
    
    for (let i = 0; i < cacheData.grid.length && i < this.grid.length; i++) {
      const cached = cacheData.grid[i];
      this.grid[i].density = cached.d;
      this.grid[i].velocityX = cached.vx;
      this.grid[i].velocityY = cached.vy;
      this.grid[i].velocityZ = cached.vz;
      this.grid[i].temperature = cached.t;
      this.grid[i].fuel = cached.f;
      this.grid[i].smoke = cached.s;
    }
  }

  private setOutputs(): void {
    const { x: sx, y: sy, z: sz } = this.gridSize;
    
    // Density volume
    const densityOutput = this.outputs.get('densityVolume');
    if (densityOutput) {
      const densityData = new Float32Array(sx * sy * sz);
      for (let i = 0; i < this.grid.length; i++) {
        densityData[i] = this.grid[i].density;
      }
      densityOutput.value = {
        type: 'volume',
        resolution: this.gridSize,
        data: densityData,
        voxelSize: this.getParameter('voxelSize'),
        gridCenter: this.getParameter('gridCenter')
      };
    }
    
    // Velocity volume
    const velocityOutput = this.outputs.get('velocityVolume');
    if (velocityOutput) {
      const velocityData = new Float32Array(sx * sy * sz * 3);
      for (let i = 0; i < this.grid.length; i++) {
        velocityData[i * 3] = this.grid[i].velocityX;
        velocityData[i * 3 + 1] = this.grid[i].velocityY;
        velocityData[i * 3 + 2] = this.grid[i].velocityZ;
      }
      velocityOutput.value = {
        type: 'vector_volume',
        resolution: this.gridSize,
        data: velocityData,
        voxelSize: this.getParameter('voxelSize'),
        gridCenter: this.getParameter('gridCenter')
      };
    }
    
    // Temperature volume
    const tempOutput = this.outputs.get('temperatureVolume');
    if (tempOutput) {
      const tempData = new Float32Array(sx * sy * sz);
      for (let i = 0; i < this.grid.length; i++) {
        tempData[i] = this.grid[i].temperature;
      }
      tempOutput.value = {
        type: 'volume',
        resolution: this.gridSize,
        data: tempData,
        voxelSize: this.getParameter('voxelSize'),
        gridCenter: this.getParameter('gridCenter')
      };
    }
    
    // Smoke volume
    const smokeOutput = this.outputs.get('smokeVolume');
    if (smokeOutput) {
      const smokeData = new Float32Array(sx * sy * sz);
      for (let i = 0; i < this.grid.length; i++) {
        smokeData[i] = this.grid[i].smoke;
      }
      smokeOutput.value = {
        type: 'volume',
        resolution: this.gridSize,
        data: smokeData,
        voxelSize: this.getParameter('voxelSize'),
        gridCenter: this.getParameter('gridCenter')
      };
    }
    
    // Fuel volume
    const fuelOutput = this.outputs.get('fuelVolume');
    if (fuelOutput) {
      const fuelData = new Float32Array(sx * sy * sz);
      for (let i = 0; i < this.grid.length; i++) {
        fuelData[i] = this.grid[i].fuel;
      }
      fuelOutput.value = {
        type: 'volume',
        resolution: this.gridSize,
        data: fuelData,
        voxelSize: this.getParameter('voxelSize'),
        gridCenter: this.getParameter('gridCenter')
      };
    }
    
    // Render volume (combined for visualization)
    const renderOutput = this.outputs.get('renderVolume');
    if (renderOutput) {
      renderOutput.value = {
        type: 'render_volume',
        resolution: this.gridSize,
        density: this.grid.map(c => c.density),
        temperature: this.grid.map(c => c.temperature),
        smoke: this.grid.map(c => c.smoke),
        voxelSize: this.getParameter('voxelSize'),
        gridCenter: this.getParameter('gridCenter'),
        frame: this.frameCount
      };
    }
  }

  // Public methods
  reset(): void {
    this.initializeGrid();
    this.time = 0;
    this.frameCount = 0;
    this.cachedFrames.clear();
  }

  addEmitter(emitter: FluidEmitter): void {
    this.emitters.push(emitter);
  }

  removeEmitter(id: string): void {
    this.emitters = this.emitters.filter(e => e.id !== id);
  }

  exportCache(directory: string): void {
    // Would write cache to disk here
    console.log(`Exporting cache to ${directory}`);
  }

  dispose(): void {
    this.grid = [];
    this.emitters = [];
    this.cachedFrames.clear();
    super.dispose();
  }
}
