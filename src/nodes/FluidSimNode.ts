/**
 * FluidSimNode - Fluid dynamics simulation using SPH
 * Version 2.0 - Physics Simulation
 */

import { Node, DataType } from '../core/Node';

interface FluidParticle {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  density: number;
  pressure: number;
  force: { x: number; y: number; z: number };
}

export class FluidSimNode extends Node {
  private particles: FluidParticle[] = [];
  private time: number = 0;
  private readonly smoothingRadius: number = 0.1;

  constructor(id: string) {
    super(id, 'FluidSim', 'Fluid Simulation');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Fluid dynamics simulation using SPH';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('emitter', 'Emitter', DataType.ANY);
    this.addInput('colliders', 'Colliders', DataType.ANY);
    this.addInput('forces', 'Forces', DataType.ANY);
    
    // Outputs
    this.addOutput('particles', 'Particles', DataType.PARTICLES);
    this.addOutput('mesh', 'Mesh', DataType.GEOMETRY_3D);
    this.addOutput('density', 'Density Field', DataType.IMAGE);
    this.addOutput('velocity', 'Velocity Field', DataType.IMAGE);
    
    // Simulation type
    this.setParameter('method', 'sph'); // sph, flip, pbf (position based fluids)
    
    // Resolution
    this.setParameter('particleCount', 1000);
    this.setParameter('particleRadius', 0.02);
    this.setParameter('gridResolution', 64);
    
    // Physical properties
    this.setParameter('restDensity', 1000); // kg/m³ (water)
    this.setParameter('viscosity', 0.1);
    this.setParameter('stiffness', 100);
    this.setParameter('surfaceTension', 0.0728);
    
    // Simulation
    this.setParameter('gravity', { x: 0, y: -9.81, z: 0 });
    this.setParameter('substeps', 4);
    this.setParameter('timeScale', 1.0);
    
    // Bounds
    this.setParameter('boundsMin', { x: -1, y: 0, z: -1 });
    this.setParameter('boundsMax', { x: 1, y: 2, z: 1 });
    this.setParameter('boundaryDamping', 0.5);
    
    // Initialization
    this.setParameter('initShape', 'cube'); // cube, sphere, dam
    this.setParameter('initPosition', { x: 0, y: 1, z: 0 });
    this.setParameter('initSize', { x: 0.5, y: 0.5, z: 0.5 });
    
    // Rendering
    this.setParameter('renderMode', 'particles'); // particles, mesh, both
    this.setParameter('meshThreshold', 0.5);
  }

  async process(): Promise<void> {
    const deltaTime = 0.016 * this.getParameter('timeScale');
    this.time += deltaTime;
    
    // Initialize particles if needed
    if (this.particles.length === 0) {
      this.initializeParticles();
    }
    
    const substeps = this.getParameter('substeps');
    const dt = deltaTime / substeps;
    const gravity = this.getParameter('gravity');
    
    for (let step = 0; step < substeps; step++) {
      // Compute density and pressure for all particles
      this.computeDensityPressure();
      
      // Compute forces (pressure, viscosity, external)
      this.computeForces(gravity);
      
      // Apply external forces
      const forcesInput = this.inputs.get('forces');
      if (forcesInput?.value) {
        this.applyExternalForces(forcesInput.value);
      }
      
      // Integration
      this.integrate(dt);
      
      // Handle collisions
      this.handleBoundaryCollisions();
    }
    
    // Output particles
    const particlesOutput = this.outputs.get('particles');
    if (particlesOutput) {
      particlesOutput.value = this.particles.map(p => ({
        x: p.position.x,
        y: p.position.y,
        z: p.position.z,
        vx: p.velocity.x,
        vy: p.velocity.y,
        vz: p.velocity.z,
        density: p.density,
        pressure: p.pressure
      }));
    }
    
    // Output mesh (marching cubes would be used here)
    const meshOutput = this.outputs.get('mesh');
    if (meshOutput) {
      meshOutput.value = this.generateMesh();
    }
    
    // Output density field
    const densityOutput = this.outputs.get('density');
    if (densityOutput) {
      densityOutput.value = this.generateDensityField();
    }
    
    // Output velocity field
    const velocityOutput = this.outputs.get('velocity');
    if (velocityOutput) {
      velocityOutput.value = this.generateVelocityField();
    }
  }

  private initializeParticles(): void {
    const count = this.getParameter('particleCount');
    const shape = this.getParameter('initShape');
    const pos = this.getParameter('initPosition');
    const size = this.getParameter('initSize');
    const radius = this.getParameter('particleRadius');
    
    this.particles = [];
    
    // Calculate number of particles per dimension
    const nx = Math.ceil(size.x / (radius * 2));
    const ny = Math.ceil(size.y / (radius * 2));
    const nz = Math.ceil(size.z / (radius * 2));
    
    let created = 0;
    const spacing = radius * 2;
    
    for (let ix = 0; ix < nx && created < count; ix++) {
      for (let iy = 0; iy < ny && created < count; iy++) {
        for (let iz = 0; iz < nz && created < count; iz++) {
          const x = pos.x - size.x / 2 + ix * spacing + spacing / 2;
          const y = pos.y - size.y / 2 + iy * spacing + spacing / 2;
          const z = pos.z - size.z / 2 + iz * spacing + spacing / 2;
          
          let include = true;
          
          if (shape === 'sphere') {
            const dx = x - pos.x;
            const dy = y - pos.y;
            const dz = z - pos.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            include = dist <= Math.min(size.x, size.y, size.z) / 2;
          } else if (shape === 'dam') {
            // Dam break - fill left side
            include = x < pos.x;
          }
          
          if (include) {
            this.particles.push({
              position: { x, y, z },
              velocity: { x: 0, y: 0, z: 0 },
              density: 0,
              pressure: 0,
              force: { x: 0, y: 0, z: 0 }
            });
            created++;
          }
        }
      }
    }
  }

  private computeDensityPressure(): void {
    const restDensity = this.getParameter('restDensity');
    const stiffness = this.getParameter('stiffness');
    const h = this.smoothingRadius;
    const h2 = h * h;
    
    // Poly6 kernel coefficient
    const poly6Coeff = 315 / (64 * Math.PI * Math.pow(h, 9));
    
    for (const pi of this.particles) {
      pi.density = 0;
      
      for (const pj of this.particles) {
        const dx = pj.position.x - pi.position.x;
        const dy = pj.position.y - pi.position.y;
        const dz = pj.position.z - pi.position.z;
        const r2 = dx * dx + dy * dy + dz * dz;
        
        if (r2 < h2) {
          const diff = h2 - r2;
          pi.density += poly6Coeff * diff * diff * diff;
        }
      }
      
      // Compute pressure using equation of state
      pi.pressure = stiffness * (pi.density - restDensity);
    }
  }

  private computeForces(gravity: { x: number; y: number; z: number }): void {
    const viscosity = this.getParameter('viscosity');
    const h = this.smoothingRadius;
    const h2 = h * h;
    
    // Spiky gradient kernel coefficient
    const spikyGradCoeff = -45 / (Math.PI * Math.pow(h, 6));
    
    // Viscosity Laplacian kernel coefficient
    const viscLapCoeff = 45 / (Math.PI * Math.pow(h, 6));
    
    for (const pi of this.particles) {
      // Reset force
      pi.force.x = 0;
      pi.force.y = 0;
      pi.force.z = 0;
      
      for (const pj of this.particles) {
        if (pi === pj) continue;
        
        const dx = pj.position.x - pi.position.x;
        const dy = pj.position.y - pi.position.y;
        const dz = pj.position.z - pi.position.z;
        const r2 = dx * dx + dy * dy + dz * dz;
        
        if (r2 < h2 && r2 > 0.0001) {
          const r = Math.sqrt(r2);
          const diff = h - r;
          
          // Pressure force (Spiky kernel gradient)
          const pressureMag = -spikyGradCoeff * diff * diff * 
            (pi.pressure + pj.pressure) / (2 * pj.density + 0.0001);
          
          pi.force.x += pressureMag * dx / r;
          pi.force.y += pressureMag * dy / r;
          pi.force.z += pressureMag * dz / r;
          
          // Viscosity force (Viscosity kernel Laplacian)
          const viscMag = viscosity * viscLapCoeff * diff / (pj.density + 0.0001);
          
          pi.force.x += viscMag * (pj.velocity.x - pi.velocity.x);
          pi.force.y += viscMag * (pj.velocity.y - pi.velocity.y);
          pi.force.z += viscMag * (pj.velocity.z - pi.velocity.z);
        }
      }
      
      // Add gravity
      pi.force.x += gravity.x * pi.density;
      pi.force.y += gravity.y * pi.density;
      pi.force.z += gravity.z * pi.density;
    }
  }

  private applyExternalForces(forces: any): void {
    const forceList = Array.isArray(forces) ? forces : [forces];
    
    for (const pi of this.particles) {
      for (const force of forceList) {
        if (force.type === 'point') {
          // Point force with falloff
          const dx = force.position.x - pi.position.x;
          const dy = force.position.y - pi.position.y;
          const dz = force.position.z - pi.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < force.radius && dist > 0) {
            const strength = force.strength * (1 - dist / force.radius);
            pi.force.x += (dx / dist) * strength;
            pi.force.y += (dy / dist) * strength;
            pi.force.z += (dz / dist) * strength;
          }
        } else if (force.type === 'directional') {
          pi.force.x += force.direction.x * force.strength;
          pi.force.y += force.direction.y * force.strength;
          pi.force.z += force.direction.z * force.strength;
        }
      }
    }
  }

  private integrate(dt: number): void {
    for (const pi of this.particles) {
      // Acceleration = Force / Density
      const invDensity = 1 / (pi.density + 0.0001);
      
      pi.velocity.x += pi.force.x * invDensity * dt;
      pi.velocity.y += pi.force.y * invDensity * dt;
      pi.velocity.z += pi.force.z * invDensity * dt;
      
      pi.position.x += pi.velocity.x * dt;
      pi.position.y += pi.velocity.y * dt;
      pi.position.z += pi.velocity.z * dt;
    }
  }

  private handleBoundaryCollisions(): void {
    const boundsMin = this.getParameter('boundsMin');
    const boundsMax = this.getParameter('boundsMax');
    const damping = this.getParameter('boundaryDamping');
    const radius = this.getParameter('particleRadius');
    
    for (const pi of this.particles) {
      // X bounds
      if (pi.position.x < boundsMin.x + radius) {
        pi.position.x = boundsMin.x + radius;
        pi.velocity.x = -pi.velocity.x * damping;
      }
      if (pi.position.x > boundsMax.x - radius) {
        pi.position.x = boundsMax.x - radius;
        pi.velocity.x = -pi.velocity.x * damping;
      }
      
      // Y bounds
      if (pi.position.y < boundsMin.y + radius) {
        pi.position.y = boundsMin.y + radius;
        pi.velocity.y = -pi.velocity.y * damping;
      }
      if (pi.position.y > boundsMax.y - radius) {
        pi.position.y = boundsMax.y - radius;
        pi.velocity.y = -pi.velocity.y * damping;
      }
      
      // Z bounds
      if (pi.position.z < boundsMin.z + radius) {
        pi.position.z = boundsMin.z + radius;
        pi.velocity.z = -pi.velocity.z * damping;
      }
      if (pi.position.z > boundsMax.z - radius) {
        pi.position.z = boundsMax.z - radius;
        pi.velocity.z = -pi.velocity.z * damping;
      }
    }
  }

  private generateMesh(): any {
    // Placeholder for marching cubes mesh generation
    // In a real implementation, this would create a surface mesh from the particles
    return {
      type: 'fluid_mesh',
      particleCount: this.particles.length
    };
  }

  private generateDensityField(): any {
    const resolution = this.getParameter('gridResolution');
    const boundsMin = this.getParameter('boundsMin');
    const boundsMax = this.getParameter('boundsMax');
    
    const data = new Float32Array(resolution * resolution);
    const h = this.smoothingRadius;
    const h2 = h * h;
    const poly6Coeff = 315 / (64 * Math.PI * Math.pow(h, 9));
    
    const cellSizeX = (boundsMax.x - boundsMin.x) / resolution;
    const cellSizeY = (boundsMax.y - boundsMin.y) / resolution;
    
    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const x = boundsMin.x + (ix + 0.5) * cellSizeX;
        const y = boundsMin.y + (iy + 0.5) * cellSizeY;
        
        let density = 0;
        for (const pi of this.particles) {
          const dx = pi.position.x - x;
          const dy = pi.position.y - y;
          const r2 = dx * dx + dy * dy;
          
          if (r2 < h2) {
            const diff = h2 - r2;
            density += poly6Coeff * diff * diff * diff;
          }
        }
        
        data[iy * resolution + ix] = density;
      }
    }
    
    return {
      width: resolution,
      height: resolution,
      channels: 1,
      data,
      format: 'float'
    };
  }

  private generateVelocityField(): any {
    const resolution = this.getParameter('gridResolution');
    const boundsMin = this.getParameter('boundsMin');
    const boundsMax = this.getParameter('boundsMax');
    
    const data = new Float32Array(resolution * resolution * 4);
    
    const cellSizeX = (boundsMax.x - boundsMin.x) / resolution;
    const cellSizeY = (boundsMax.y - boundsMin.y) / resolution;
    const h = this.smoothingRadius;
    
    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const x = boundsMin.x + (ix + 0.5) * cellSizeX;
        const y = boundsMin.y + (iy + 0.5) * cellSizeY;
        
        let vx = 0, vy = 0, vz = 0, weight = 0;
        
        for (const pi of this.particles) {
          const dx = pi.position.x - x;
          const dy = pi.position.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < h) {
            const w = 1 - dist / h;
            vx += pi.velocity.x * w;
            vy += pi.velocity.y * w;
            vz += pi.velocity.z * w;
            weight += w;
          }
        }
        
        if (weight > 0) {
          vx /= weight;
          vy /= weight;
          vz /= weight;
        }
        
        const idx = (iy * resolution + ix) * 4;
        data[idx] = vx;
        data[idx + 1] = vy;
        data[idx + 2] = vz;
        data[idx + 3] = weight;
      }
    }
    
    return {
      width: resolution,
      height: resolution,
      channels: 4,
      data,
      format: 'rgba32f'
    };
  }

  reset(): void {
    this.particles = [];
    this.time = 0;
  }

  dispose(): void {
    this.particles = [];
    super.dispose();
  }
}
