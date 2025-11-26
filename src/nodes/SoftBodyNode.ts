/**
 * SoftBodyNode - Soft body / deformable physics simulation
 * Version 2.0 - Physics Simulation
 */

import { Node, DataType } from '../core/Node';

interface Particle {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  mass: number;
  invMass: number;
  pinned: boolean;
}

interface Spring {
  p1: number;
  p2: number;
  restLength: number;
  stiffness: number;
  damping: number;
}

export class SoftBodyNode extends Node {
  private particles: Particle[] = [];
  private springs: Spring[] = [];
  private time: number = 0;

  constructor(id: string) {
    super(id, 'SoftBody', 'Soft Body');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Soft body and deformable physics simulation';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('mesh', 'Input Mesh', DataType.GEOMETRY_3D);
    this.addInput('forces', 'Forces', DataType.ANY);
    this.addInput('colliders', 'Colliders', DataType.ANY);
    
    // Outputs
    this.addOutput('mesh', 'Deformed Mesh', DataType.GEOMETRY_3D);
    this.addOutput('particles', 'Particles', DataType.ANY);
    this.addOutput('stressMap', 'Stress Map', DataType.IMAGE);
    
    // Soft body type
    this.setParameter('type', 'mass-spring'); // mass-spring, position-based, FEM
    
    // Grid dimensions (for procedural soft body)
    this.setParameter('gridWidth', 10);
    this.setParameter('gridHeight', 10);
    this.setParameter('gridSpacing', 0.1);
    
    // Physical properties
    this.setParameter('mass', 1.0);
    this.setParameter('stiffness', 100.0);
    this.setParameter('damping', 0.1);
    this.setParameter('bendingStiffness', 10.0);
    this.setParameter('volumeStiffness', 100.0);
    
    // Constraints
    this.setParameter('stretchLimit', 1.1); // Max stretch ratio
    this.setParameter('compressionLimit', 0.9); // Min compression ratio
    
    // Simulation
    this.setParameter('gravity', { x: 0, y: -9.81, z: 0 });
    this.setParameter('iterations', 10);
    this.setParameter('substeps', 4);
    
    // Pinned vertices
    this.setParameter('pinnedVertices', []); // Array of vertex indices to pin
    this.setParameter('pinTop', true); // Pin top row of grid
    
    // Collision
    this.setParameter('selfCollision', false);
    this.setParameter('collisionRadius', 0.05);
    this.setParameter('friction', 0.5);
  }

  async process(): Promise<void> {
    const deltaTime = 0.016;
    this.time += deltaTime;
    
    // Initialize particles if needed
    if (this.particles.length === 0) {
      this.initializeGrid();
    }
    
    const substeps = this.getParameter('substeps');
    const iterations = this.getParameter('iterations');
    const gravity = this.getParameter('gravity');
    const dt = deltaTime / substeps;
    
    // Apply external forces
    const forcesInput = this.inputs.get('forces');
    
    for (let step = 0; step < substeps; step++) {
      // Apply gravity and external forces
      for (const particle of this.particles) {
        if (particle.pinned) continue;
        
        particle.acceleration.x = gravity.x;
        particle.acceleration.y = gravity.y;
        particle.acceleration.z = gravity.z;
        
        // Apply external forces
        if (forcesInput?.value) {
          const forces = Array.isArray(forcesInput.value) ? forcesInput.value : [forcesInput.value];
          for (const force of forces) {
            particle.acceleration.x += force.x * particle.invMass;
            particle.acceleration.y += force.y * particle.invMass;
            particle.acceleration.z += force.z * particle.invMass;
          }
        }
      }
      
      // Velocity Verlet integration - velocity half step
      for (const particle of this.particles) {
        if (particle.pinned) continue;
        
        particle.velocity.x += particle.acceleration.x * dt * 0.5;
        particle.velocity.y += particle.acceleration.y * dt * 0.5;
        particle.velocity.z += particle.acceleration.z * dt * 0.5;
      }
      
      // Position update
      for (const particle of this.particles) {
        if (particle.pinned) continue;
        
        particle.position.x += particle.velocity.x * dt;
        particle.position.y += particle.velocity.y * dt;
        particle.position.z += particle.velocity.z * dt;
      }
      
      // Constraint solving
      for (let iter = 0; iter < iterations; iter++) {
        this.solveSpringConstraints();
        
        if (this.getParameter('selfCollision')) {
          this.solveSelfCollision();
        }
      }
      
      // Ground collision
      this.solveGroundCollision();
      
      // Update velocities after constraint solving
      for (const particle of this.particles) {
        if (particle.pinned) continue;
        
        particle.velocity.x += particle.acceleration.x * dt * 0.5;
        particle.velocity.y += particle.acceleration.y * dt * 0.5;
        particle.velocity.z += particle.acceleration.z * dt * 0.5;
        
        // Apply damping
        const damping = 1 - this.getParameter('damping');
        particle.velocity.x *= damping;
        particle.velocity.y *= damping;
        particle.velocity.z *= damping;
      }
    }
    
    // Output particles
    const particlesOutput = this.outputs.get('particles');
    if (particlesOutput) {
      particlesOutput.value = this.particles.map(p => ({
        position: { ...p.position },
        velocity: { ...p.velocity },
        pinned: p.pinned
      }));
    }
    
    // Output mesh (create from particles)
    const meshOutput = this.outputs.get('mesh');
    if (meshOutput) {
      meshOutput.value = this.createMeshFromParticles();
    }
    
    // Output stress map
    const stressOutput = this.outputs.get('stressMap');
    if (stressOutput) {
      stressOutput.value = this.calculateStressMap();
    }
  }

  private initializeGrid(): void {
    const width = this.getParameter('gridWidth');
    const height = this.getParameter('gridHeight');
    const spacing = this.getParameter('gridSpacing');
    const mass = this.getParameter('mass');
    const stiffness = this.getParameter('stiffness');
    const damping = this.getParameter('damping');
    const bendingStiffness = this.getParameter('bendingStiffness');
    const pinTop = this.getParameter('pinTop');
    const pinnedVertices = this.getParameter('pinnedVertices');
    
    const particleMass = mass / (width * height);
    
    // Create particles
    this.particles = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isPinned = pinTop && y === 0 || pinnedVertices.includes(y * width + x);
        
        this.particles.push({
          position: { x: x * spacing, y: -y * spacing, z: 0 },
          velocity: { x: 0, y: 0, z: 0 },
          acceleration: { x: 0, y: 0, z: 0 },
          mass: particleMass,
          invMass: isPinned ? 0 : 1 / particleMass,
          pinned: isPinned
        });
      }
    }
    
    // Create springs
    this.springs = [];
    
    // Structural springs (horizontal and vertical)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        // Horizontal
        if (x < width - 1) {
          this.springs.push({
            p1: idx,
            p2: idx + 1,
            restLength: spacing,
            stiffness,
            damping
          });
        }
        
        // Vertical
        if (y < height - 1) {
          this.springs.push({
            p1: idx,
            p2: idx + width,
            restLength: spacing,
            stiffness,
            damping
          });
        }
      }
    }
    
    // Shear springs (diagonal)
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const idx = y * width + x;
        const diagLength = spacing * Math.sqrt(2);
        
        this.springs.push({
          p1: idx,
          p2: idx + width + 1,
          restLength: diagLength,
          stiffness: stiffness * 0.5,
          damping
        });
        
        this.springs.push({
          p1: idx + 1,
          p2: idx + width,
          restLength: diagLength,
          stiffness: stiffness * 0.5,
          damping
        });
      }
    }
    
    // Bending springs (skip one particle)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width - 2; x++) {
        const idx = y * width + x;
        this.springs.push({
          p1: idx,
          p2: idx + 2,
          restLength: spacing * 2,
          stiffness: bendingStiffness,
          damping
        });
      }
    }
    
    for (let y = 0; y < height - 2; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        this.springs.push({
          p1: idx,
          p2: idx + width * 2,
          restLength: spacing * 2,
          stiffness: bendingStiffness,
          damping
        });
      }
    }
  }

  private solveSpringConstraints(): void {
    const stretchLimit = this.getParameter('stretchLimit');
    const compressionLimit = this.getParameter('compressionLimit');
    
    for (const spring of this.springs) {
      const p1 = this.particles[spring.p1];
      const p2 = this.particles[spring.p2];
      
      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const dz = p2.position.z - p1.position.z;
      
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist === 0) continue;
      
      // Apply stretch/compression limits
      Math.max(
        spring.restLength * compressionLimit,
        Math.min(spring.restLength * stretchLimit, dist)
      );
      
      const diff = (dist - spring.restLength) / dist;
      const stiffnessCoeff = spring.stiffness * 0.5;
      
      const correction = diff * stiffnessCoeff;
      const correctionX = dx * correction;
      const correctionY = dy * correction;
      const correctionZ = dz * correction;
      
      const totalInvMass = p1.invMass + p2.invMass;
      if (totalInvMass === 0) continue;
      
      const w1 = p1.invMass / totalInvMass;
      const w2 = p2.invMass / totalInvMass;
      
      p1.position.x += correctionX * w1;
      p1.position.y += correctionY * w1;
      p1.position.z += correctionZ * w1;
      
      p2.position.x -= correctionX * w2;
      p2.position.y -= correctionY * w2;
      p2.position.z -= correctionZ * w2;
    }
  }

  private solveSelfCollision(): void {
    const radius = this.getParameter('collisionRadius');
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dz = p2.position.z - p1.position.z;
        
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const minDist = radius * 2;
        
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
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

  private solveGroundCollision(): void {
    const friction = this.getParameter('friction');
    
    for (const particle of this.particles) {
      if (particle.pinned) continue;
      
      if (particle.position.y < 0) {
        particle.position.y = 0;
        particle.velocity.y = -particle.velocity.y * 0.2; // Bounce
        particle.velocity.x *= (1 - friction);
        particle.velocity.z *= (1 - friction);
      }
    }
  }

  private createMeshFromParticles(): any {
    // Create vertex positions from particles
    const positions: number[] = [];
    for (const particle of this.particles) {
      positions.push(particle.position.x, particle.position.y, particle.position.z);
    }
    
    // Create indices for triangles
    const width = this.getParameter('gridWidth');
    const height = this.getParameter('gridHeight');
    const indices: number[] = [];
    
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const i = y * width + x;
        indices.push(i, i + 1, i + width);
        indices.push(i + 1, i + width + 1, i + width);
      }
    }
    
    return {
      positions,
      indices,
      particleCount: this.particles.length
    };
  }

  private calculateStressMap(): any {
    // Calculate stress based on spring stretch
    const stressValues: number[] = [];
    
    for (const spring of this.springs) {
      const p1 = this.particles[spring.p1];
      const p2 = this.particles[spring.p2];
      
      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const dz = p2.position.z - p1.position.z;
      
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const strain = Math.abs(dist - spring.restLength) / spring.restLength;
      
      stressValues.push(strain);
    }
    
    return stressValues;
  }

  reset(): void {
    this.particles = [];
    this.springs = [];
    this.time = 0;
  }

  dispose(): void {
    this.particles = [];
    this.springs = [];
    super.dispose();
  }
}
