/**
 * ClothSimNode - Cloth and fabric simulation
 * Version 2.0 - Physics Simulation
 */

import { Node, DataType } from '../core/Node';

interface ClothParticle {
  position: { x: number; y: number; z: number };
  previousPosition: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  mass: number;
  invMass: number;
  pinned: boolean;
}

interface ClothConstraint {
  p1: number;
  p2: number;
  restLength: number;
  type: 'structural' | 'shear' | 'bending';
}

export class ClothSimNode extends Node {
  private particles: ClothParticle[] = [];
  private constraints: ClothConstraint[] = [];
  private time: number = 0;

  constructor(id: string) {
    super(id, 'ClothSim', 'Cloth Simulation');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Cloth and fabric simulation';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('mesh', 'Input Mesh', DataType.GEOMETRY_3D);
    this.addInput('colliders', 'Colliders', DataType.ANY);
    this.addInput('wind', 'Wind', DataType.ANY);
    this.addInput('pinConstraints', 'Pin Constraints', DataType.ANY);
    
    // Outputs
    this.addOutput('mesh', 'Cloth Mesh', DataType.GEOMETRY_3D);
    this.addOutput('normals', 'Normals', DataType.ANY);
    this.addOutput('uvs', 'UVs', DataType.ANY);
    
    // Cloth dimensions
    this.setParameter('width', 2.0);
    this.setParameter('height', 2.0);
    this.setParameter('resolutionX', 32);
    this.setParameter('resolutionY', 32);
    
    // Physical properties
    this.setParameter('mass', 1.0);
    this.setParameter('structuralStiffness', 1.0);
    this.setParameter('shearStiffness', 0.8);
    this.setParameter('bendingStiffness', 0.2);
    this.setParameter('damping', 0.01);
    
    // Simulation
    this.setParameter('gravity', { x: 0, y: -9.81, z: 0 });
    this.setParameter('iterations', 15);
    this.setParameter('substeps', 4);
    
    // Wind
    this.setParameter('windEnabled', true);
    this.setParameter('windDirection', { x: 1, y: 0, z: 0.5 });
    this.setParameter('windStrength', 5.0);
    this.setParameter('windTurbulence', 0.5);
    this.setParameter('windFrequency', 2.0);
    
    // Pinning
    this.setParameter('pinMode', 'topCorners'); // none, topEdge, topCorners, custom
    
    // Collision
    this.setParameter('collisionEnabled', true);
    this.setParameter('selfCollision', false);
    this.setParameter('collisionFriction', 0.5);
    this.setParameter('collisionMargin', 0.01);
    
    // Quality
    this.setParameter('stretchLimit', 1.1);
  }

  async process(): Promise<void> {
    const deltaTime = 0.016;
    this.time += deltaTime;
    
    // Initialize cloth if needed
    if (this.particles.length === 0) {
      this.initializeCloth();
    }
    
    const substeps = this.getParameter('substeps');
    const iterations = this.getParameter('iterations');
    const gravity = this.getParameter('gravity');
    const damping = this.getParameter('damping');
    const dt = deltaTime / substeps;
    
    for (let step = 0; step < substeps; step++) {
      // Apply forces
      this.applyGravity(gravity);
      
      // Apply wind
      if (this.getParameter('windEnabled')) {
        this.applyWind(dt);
      }
      
      // Apply external wind input
      const windInput = this.inputs.get('wind');
      if (windInput?.value) {
        this.applyExternalWind(windInput.value, dt);
      }
      
      // Verlet integration
      for (const particle of this.particles) {
        if (particle.pinned) continue;
        
        // Calculate velocity from position difference
        const vx = particle.position.x - particle.previousPosition.x;
        const vy = particle.position.y - particle.previousPosition.y;
        const vz = particle.position.z - particle.previousPosition.z;
        
        // Store current position
        particle.previousPosition.x = particle.position.x;
        particle.previousPosition.y = particle.position.y;
        particle.previousPosition.z = particle.position.z;
        
        // Update position with velocity and acceleration
        particle.position.x += vx * (1 - damping) + particle.acceleration.x * dt * dt;
        particle.position.y += vy * (1 - damping) + particle.acceleration.y * dt * dt;
        particle.position.z += vz * (1 - damping) + particle.acceleration.z * dt * dt;
        
        // Reset acceleration
        particle.acceleration.x = 0;
        particle.acceleration.y = 0;
        particle.acceleration.z = 0;
      }
      
      // Constraint solving
      for (let iter = 0; iter < iterations; iter++) {
        this.solveConstraints();
      }
      
      // Collision detection
      if (this.getParameter('collisionEnabled')) {
        this.handleCollisions();
      }
      
      if (this.getParameter('selfCollision')) {
        this.handleSelfCollision();
      }
    }
    
    // Calculate normals
    const normals = this.calculateNormals();
    
    // Output mesh
    const meshOutput = this.outputs.get('mesh');
    if (meshOutput) {
      meshOutput.value = this.createMesh();
    }
    
    // Output normals
    const normalsOutput = this.outputs.get('normals');
    if (normalsOutput) {
      normalsOutput.value = normals;
    }
    
    // Output UVs
    const uvsOutput = this.outputs.get('uvs');
    if (uvsOutput) {
      uvsOutput.value = this.createUVs();
    }
  }

  private initializeCloth(): void {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const resX = this.getParameter('resolutionX');
    const resY = this.getParameter('resolutionY');
    const mass = this.getParameter('mass');
    const pinMode = this.getParameter('pinMode');
    
    const particleMass = mass / (resX * resY);
    const spacingX = width / (resX - 1);
    const spacingY = height / (resY - 1);
    
    // Create particles
    this.particles = [];
    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        const px = x * spacingX - width / 2;
        const py = -y * spacingY;
        const pz = 0;
        
        let pinned = false;
        
        switch (pinMode) {
          case 'topEdge':
            pinned = y === 0;
            break;
          case 'topCorners':
            pinned = y === 0 && (x === 0 || x === resX - 1);
            break;
          case 'custom':
            // Custom pinning handled by input
            break;
        }
        
        this.particles.push({
          position: { x: px, y: py, z: pz },
          previousPosition: { x: px, y: py, z: pz },
          velocity: { x: 0, y: 0, z: 0 },
          acceleration: { x: 0, y: 0, z: 0 },
          mass: particleMass,
          invMass: pinned ? 0 : 1 / particleMass,
          pinned
        });
      }
    }
    
    // Create constraints
    this.constraints = [];
    
    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        const idx = y * resX + x;
        
        // Structural constraints (horizontal)
        if (x < resX - 1) {
          this.constraints.push({
            p1: idx,
            p2: idx + 1,
            restLength: spacingX,
            type: 'structural'
          });
        }
        
        // Structural constraints (vertical)
        if (y < resY - 1) {
          this.constraints.push({
            p1: idx,
            p2: idx + resX,
            restLength: spacingY,
            type: 'structural'
          });
        }
        
        // Shear constraints (diagonal)
        if (x < resX - 1 && y < resY - 1) {
          const diagLen = Math.sqrt(spacingX * spacingX + spacingY * spacingY);
          
          this.constraints.push({
            p1: idx,
            p2: idx + resX + 1,
            restLength: diagLen,
            type: 'shear'
          });
          
          this.constraints.push({
            p1: idx + 1,
            p2: idx + resX,
            restLength: diagLen,
            type: 'shear'
          });
        }
        
        // Bending constraints (skip one)
        if (x < resX - 2) {
          this.constraints.push({
            p1: idx,
            p2: idx + 2,
            restLength: spacingX * 2,
            type: 'bending'
          });
        }
        
        if (y < resY - 2) {
          this.constraints.push({
            p1: idx,
            p2: idx + resX * 2,
            restLength: spacingY * 2,
            type: 'bending'
          });
        }
      }
    }
  }

  private applyGravity(gravity: { x: number; y: number; z: number }): void {
    for (const particle of this.particles) {
      if (particle.pinned) continue;
      
      particle.acceleration.x += gravity.x;
      particle.acceleration.y += gravity.y;
      particle.acceleration.z += gravity.z;
    }
  }

  private applyWind(_dt: number): void {
    const direction = this.getParameter('windDirection');
    const strength = this.getParameter('windStrength');
    const turbulence = this.getParameter('windTurbulence');
    const frequency = this.getParameter('windFrequency');
    
    // Normalize direction
    const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
    const nx = direction.x / len;
    const ny = direction.y / len;
    const nz = direction.z / len;
    
    // Time-varying wind with turbulence
    const windVariation = Math.sin(this.time * frequency) * turbulence + 1;
    
    for (const particle of this.particles) {
      if (particle.pinned) continue;
      
      // Add some positional variation for more realistic wind
      const noise = Math.sin(particle.position.x * 3 + this.time) * 
                   Math.cos(particle.position.y * 2 + this.time * 0.7) *
                   turbulence;
      
      const windForce = strength * windVariation * (1 + noise);
      
      particle.acceleration.x += nx * windForce;
      particle.acceleration.y += ny * windForce;
      particle.acceleration.z += nz * windForce;
    }
  }

  private applyExternalWind(wind: any, _dt: number): void {
    for (const particle of this.particles) {
      if (particle.pinned) continue;
      
      particle.acceleration.x += wind.x || 0;
      particle.acceleration.y += wind.y || 0;
      particle.acceleration.z += wind.z || 0;
    }
  }

  private solveConstraints(): void {
    const structuralStiffness = this.getParameter('structuralStiffness');
    const shearStiffness = this.getParameter('shearStiffness');
    const bendingStiffness = this.getParameter('bendingStiffness');
    const stretchLimit = this.getParameter('stretchLimit');
    
    for (const constraint of this.constraints) {
      const p1 = this.particles[constraint.p1];
      const p2 = this.particles[constraint.p2];
      
      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const dz = p2.position.z - p1.position.z;
      
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist === 0) continue;
      
      // Clamp stretch
      const maxLen = constraint.restLength * stretchLimit;
      const targetDist = Math.min(dist, maxLen);
      
      const diff = (targetDist - constraint.restLength) / dist;
      
      let stiffness: number;
      switch (constraint.type) {
        case 'structural': stiffness = structuralStiffness; break;
        case 'shear': stiffness = shearStiffness; break;
        case 'bending': stiffness = bendingStiffness; break;
        default: stiffness = 1;
      }
      
      const correction = diff * stiffness * 0.5;
      
      const totalInvMass = p1.invMass + p2.invMass;
      if (totalInvMass === 0) continue;
      
      const w1 = p1.invMass / totalInvMass;
      const w2 = p2.invMass / totalInvMass;
      
      p1.position.x += dx * correction * w1;
      p1.position.y += dy * correction * w1;
      p1.position.z += dz * correction * w1;
      
      p2.position.x -= dx * correction * w2;
      p2.position.y -= dy * correction * w2;
      p2.position.z -= dz * correction * w2;
    }
  }

  private handleCollisions(): void {
    const collisionMargin = this.getParameter('collisionMargin');
    const friction = this.getParameter('collisionFriction');
    
    // Ground collision
    for (const particle of this.particles) {
      if (particle.pinned) continue;
      
      if (particle.position.y < collisionMargin) {
        particle.position.y = collisionMargin;
        
        // Apply friction to velocity (calculated from position difference)
        const vx = particle.position.x - particle.previousPosition.x;
        const vz = particle.position.z - particle.previousPosition.z;
        
        particle.previousPosition.x = particle.position.x - vx * (1 - friction);
        particle.previousPosition.z = particle.position.z - vz * (1 - friction);
        particle.previousPosition.y = particle.position.y;
      }
    }
    
    // Collider input would be processed here
    const collidersInput = this.inputs.get('colliders');
    if (collidersInput?.value) {
      this.handleColliderCollisions(collidersInput.value);
    }
  }

  private handleColliderCollisions(colliders: any): void {
    const colliderList = Array.isArray(colliders) ? colliders : [colliders];
    const margin = this.getParameter('collisionMargin');
    
    for (const collider of colliderList) {
      if (collider.type === 'sphere') {
        const cx = collider.position.x;
        const cy = collider.position.y;
        const cz = collider.position.z;
        const radius = collider.radius + margin;
        
        for (const particle of this.particles) {
          if (particle.pinned) continue;
          
          const dx = particle.position.x - cx;
          const dy = particle.position.y - cy;
          const dz = particle.position.z - cz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < radius && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;
            
            particle.position.x = cx + nx * radius;
            particle.position.y = cy + ny * radius;
            particle.position.z = cz + nz * radius;
          }
        }
      }
    }
  }

  private handleSelfCollision(): void {
    const margin = this.getParameter('collisionMargin');
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        
        if (p1.pinned && p2.pinned) continue;
        
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dz = p2.position.z - p1.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < margin * 2 && dist > 0) {
          const overlap = margin * 2 - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          
          const totalInvMass = p1.invMass + p2.invMass;
          if (totalInvMass === 0) continue;
          
          const w1 = p1.invMass / totalInvMass;
          const w2 = p2.invMass / totalInvMass;
          
          p1.position.x -= nx * overlap * w1;
          p1.position.y -= ny * overlap * w1;
          p1.position.z -= nz * overlap * w1;
          
          p2.position.x += nx * overlap * w2;
          p2.position.y += ny * overlap * w2;
          p2.position.z += nz * overlap * w2;
        }
      }
    }
  }

  private calculateNormals(): Float32Array {
    const resX = this.getParameter('resolutionX');
    const resY = this.getParameter('resolutionY');
    const normals = new Float32Array(this.particles.length * 3);
    
    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        const idx = y * resX + x;
        const p = this.particles[idx];
        
        let nx = 0, ny = 0, nz = 0;
        let count = 0;
        
        // Average normals from adjacent triangles
        if (x < resX - 1 && y < resY - 1) {
          const p1 = this.particles[idx + 1];
          const p2 = this.particles[idx + resX];
          
          const ax = p1.position.x - p.position.x;
          const ay = p1.position.y - p.position.y;
          const az = p1.position.z - p.position.z;
          
          const bx = p2.position.x - p.position.x;
          const by = p2.position.y - p.position.y;
          const bz = p2.position.z - p.position.z;
          
          nx += ay * bz - az * by;
          ny += az * bx - ax * bz;
          nz += ax * by - ay * bx;
          count++;
        }
        
        if (x > 0 && y > 0) {
          const p1 = this.particles[idx - 1];
          const p2 = this.particles[idx - resX];
          
          const ax = p1.position.x - p.position.x;
          const ay = p1.position.y - p.position.y;
          const az = p1.position.z - p.position.z;
          
          const bx = p2.position.x - p.position.x;
          const by = p2.position.y - p.position.y;
          const bz = p2.position.z - p.position.z;
          
          nx += ay * bz - az * by;
          ny += az * bx - ax * bz;
          nz += ax * by - ay * bx;
          count++;
        }
        
        if (count > 0) {
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (len > 0) {
            normals[idx * 3] = nx / len;
            normals[idx * 3 + 1] = ny / len;
            normals[idx * 3 + 2] = nz / len;
          }
        }
      }
    }
    
    return normals;
  }

  private createMesh(): any {
    const positions: number[] = [];
    const indices: number[] = [];
    const resX = this.getParameter('resolutionX');
    const resY = this.getParameter('resolutionY');
    
    for (const particle of this.particles) {
      positions.push(particle.position.x, particle.position.y, particle.position.z);
    }
    
    for (let y = 0; y < resY - 1; y++) {
      for (let x = 0; x < resX - 1; x++) {
        const i = y * resX + x;
        indices.push(i, i + 1, i + resX);
        indices.push(i + 1, i + resX + 1, i + resX);
      }
    }
    
    return { positions, indices };
  }

  private createUVs(): Float32Array {
    const resX = this.getParameter('resolutionX');
    const resY = this.getParameter('resolutionY');
    const uvs = new Float32Array(this.particles.length * 2);
    
    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        const idx = y * resX + x;
        uvs[idx * 2] = x / (resX - 1);
        uvs[idx * 2 + 1] = y / (resY - 1);
      }
    }
    
    return uvs;
  }

  reset(): void {
    this.particles = [];
    this.constraints = [];
    this.time = 0;
  }

  dispose(): void {
    this.particles = [];
    this.constraints = [];
    super.dispose();
  }
}
