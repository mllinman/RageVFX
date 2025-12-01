/**
 * PhysicsParticlesNode - Blender-style physics-based particle system
 * Version 3.6 - Blender Tools
 * 
 * Advanced particle system with physics simulation similar to Blender
 */

import { Node, DataType } from '../core/Node';

interface Particle {
  id: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  mass: number;
  size: number;
  lifetime: number;
  age: number;
  color: { r: number; g: number; b: number; a: number };
  rotation: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  alive: boolean;
}

export class PhysicsParticlesNode extends Node {
  private particles: Particle[] = [];
  private particleId: number = 0;
  private time: number = 0;

  constructor(id: string) {
    super(id, 'PhysicsParticles', 'Physics Particles');
    this.metadata.category = 'Particles';
    this.metadata.description = 'Blender-style physics-based particle system with forces and collisions';
    this.metadata.version = '3.6.0';
    
    // Inputs
    this.addInput('emitter', 'Emitter', DataType.GEOMETRY_3D);
    this.addInput('forceField', 'Force Field', DataType.ANY);
    this.addInput('colliders', 'Colliders', DataType.GEOMETRY_3D);
    
    // Outputs
    this.addOutput('particles', 'Particle Data', DataType.PARTICLES);
    this.addOutput('instances', 'Instance Transforms', DataType.ANY);
    this.addOutput('count', 'Particle Count', DataType.NUMBER);
    
    // Particle Type
    this.setParameter('particleType', 'emitter'); // emitter, hair, reactor
    this.setParameter('physicsType', 'newtonian'); // newtonian, boids, fluid
    
    // Emission
    this.setParameter('emissionSource', 'verts'); // verts, faces, volume
    this.setParameter('emissionRate', 100); // Particles per second
    this.setParameter('emissionFrameStart', 1);
    this.setParameter('emissionFrameEnd', 250);
    this.setParameter('emissionRandomOrder', false);
    this.setParameter('emissionUseModifierStack', false);
    
    // Particle Settings
    this.setParameter('lifetime', 50); // Frames
    this.setParameter('lifetimeRandom', 0); // Random variation (0-1)
    this.setParameter('mass', 1.0);
    this.setParameter('size', 0.05);
    this.setParameter('sizeRandom', 0);
    
    // Initial Velocity
    this.setParameter('velocityNormal', 1.0); // Along surface normal
    this.setParameter('velocityTangent', 0);
    this.setParameter('velocityRandom', 0);
    this.setParameter('velocityObject', { x: 0, y: 0, z: 0 });
    this.setParameter('velocityParticleSystem', { x: 0, y: 0, z: 0 });
    
    // Physics
    this.setParameter('gravityEnabled', true);
    this.setParameter('gravity', { x: 0, y: -9.81, z: 0 });
    this.setParameter('damping', 0.1);
    this.setParameter('drag', 0.0);
    this.setParameter('brownianMotion', 0);
    
    // Force Fields
    this.setParameter('windEnabled', false);
    this.setParameter('windStrength', 1.0);
    this.setParameter('windDirection', { x: 1, y: 0, z: 0 });
    this.setParameter('windNoise', 0);
    
    this.setParameter('vortexEnabled', false);
    this.setParameter('vortexStrength', 1.0);
    this.setParameter('vortexCenter', { x: 0, y: 0, z: 0 });
    this.setParameter('vortexAxis', { x: 0, y: 1, z: 0 });
    
    this.setParameter('turbulenceEnabled', false);
    this.setParameter('turbulenceStrength', 1.0);
    this.setParameter('turbulenceScale', 1.0);
    
    // Collision
    this.setParameter('collisionEnabled', false);
    this.setParameter('collisionBounciness', 0.5);
    this.setParameter('collisionFriction', 0.5);
    this.setParameter('collisionKillParticles', false);
    
    // Render
    this.setParameter('renderType', 'halo'); // halo, billboard, object, path
    this.setParameter('colorStart', { r: 255, g: 255, b: 255, a: 255 });
    this.setParameter('colorEnd', { r: 255, g: 255, b: 255, a: 255 });
    
    // Rotation
    this.setParameter('rotationEnabled', false);
    this.setParameter('rotationMode', 'velocity'); // velocity, random, spin
    this.setParameter('angularVelocity', { x: 0, y: 0, z: 0 });
    this.setParameter('angularVelocityRandom', 0);
    
    // Children (secondary particles)
    this.setParameter('childrenEnabled', false);
    this.setParameter('childrenType', 'simple'); // simple, interpolated
    this.setParameter('childrenCount', 10);
    
    // Cache
    this.setParameter('cacheEnabled', false);
    this.setParameter('cacheFrameStart', 1);
    this.setParameter('cacheFrameEnd', 250);
  }

  async process(): Promise<void> {
    const emitterInput = this.inputs.get('emitter');
    const forceFieldInput = this.inputs.get('forceField');
    const collidersInput = this.inputs.get('colliders');
    
    const particlesOutput = this.outputs.get('particles');
    const instancesOutput = this.outputs.get('instances');
    const countOutput = this.outputs.get('count');
    
    if (!particlesOutput) return;
    
    // Update time
    const deltaTime = 1 / 60; // Assuming 60 FPS
    this.time += deltaTime;
    
    // Emit new particles
    this.emitParticles(emitterInput?.value, deltaTime);
    
    // Update existing particles
    this.updateParticles(deltaTime, forceFieldInput?.value, collidersInput?.value);
    
    // Remove dead particles
    this.particles = this.particles.filter(p => p.alive);
    
    // Output
    particlesOutput.value = this.particles;
    
    if (instancesOutput) {
      instancesOutput.value = this.generateInstanceData();
    }
    
    if (countOutput) {
      countOutput.value = this.particles.length;
    }
  }
  
  private emitParticles(emitter: any, deltaTime: number): void {
    const emissionRate = this.getParameter('emissionRate') as number;
    const lifetime = this.getParameter('lifetime') as number;
    const lifetimeRandom = this.getParameter('lifetimeRandom') as number;
    const mass = this.getParameter('mass') as number;
    const size = this.getParameter('size') as number;
    const sizeRandom = this.getParameter('sizeRandom') as number;
    
    const particlesToEmit = Math.floor(emissionRate * deltaTime);
    
    for (let i = 0; i < particlesToEmit; i++) {
      const particle: Particle = {
        id: this.particleId++,
        position: this.getEmissionPosition(emitter),
        velocity: this.getInitialVelocity(emitter),
        acceleration: { x: 0, y: 0, z: 0 },
        mass: mass,
        size: size * (1 + (Math.random() - 0.5) * sizeRandom),
        lifetime: lifetime * (1 + (Math.random() - 0.5) * lifetimeRandom),
        age: 0,
        color: { r: 255, g: 255, b: 255, a: 255 },
        rotation: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        alive: true
      };
      
      this.particles.push(particle);
    }
  }
  
  private getEmissionPosition(emitter: any): { x: number; y: number; z: number } {
    const emissionSource = this.getParameter('emissionSource') as string;
    
    // Simplified emission from a point
    // In a full implementation, would sample from mesh vertices/faces
    return {
      x: (Math.random() - 0.5) * 2,
      y: 0,
      z: (Math.random() - 0.5) * 2
    };
  }
  
  private getInitialVelocity(emitter: any): { x: number; y: number; z: number } {
    const velocityNormal = this.getParameter('velocityNormal') as number;
    const velocityRandom = this.getParameter('velocityRandom') as number;
    const velocityObject = this.getParameter('velocityObject') as { x: number; y: number; z: number };
    
    // Simplified: emit upward with some randomness
    return {
      x: velocityObject.x + (Math.random() - 0.5) * velocityRandom,
      y: velocityNormal + (Math.random() - 0.5) * velocityRandom,
      z: velocityObject.z + (Math.random() - 0.5) * velocityRandom
    };
  }
  
  private updateParticles(deltaTime: number, forceField: any, colliders: any): void {
    for (const particle of this.particles) {
      // Update age
      particle.age += deltaTime * 60; // Convert to frames
      if (particle.age >= particle.lifetime) {
        particle.alive = false;
        continue;
      }
      
      // Reset acceleration
      particle.acceleration = { x: 0, y: 0, z: 0 };
      
      // Apply gravity
      if (this.getParameter('gravityEnabled')) {
        const gravity = this.getParameter('gravity') as { x: number; y: number; z: number };
        particle.acceleration.x += gravity.x;
        particle.acceleration.y += gravity.y;
        particle.acceleration.z += gravity.z;
      }
      
      // Apply wind
      if (this.getParameter('windEnabled')) {
        this.applyWind(particle);
      }
      
      // Apply vortex
      if (this.getParameter('vortexEnabled')) {
        this.applyVortex(particle);
      }
      
      // Apply turbulence
      if (this.getParameter('turbulenceEnabled')) {
        this.applyTurbulence(particle);
      }
      
      // Apply external force field
      if (forceField) {
        this.applyForceField(particle, forceField);
      }
      
      // Apply damping
      const damping = this.getParameter('damping') as number;
      particle.velocity.x *= (1 - damping * deltaTime);
      particle.velocity.y *= (1 - damping * deltaTime);
      particle.velocity.z *= (1 - damping * deltaTime);
      
      // Update velocity
      particle.velocity.x += particle.acceleration.x * deltaTime;
      particle.velocity.y += particle.acceleration.y * deltaTime;
      particle.velocity.z += particle.acceleration.z * deltaTime;
      
      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;
      
      // Update rotation
      if (this.getParameter('rotationEnabled')) {
        particle.rotation.x += particle.angularVelocity.x * deltaTime;
        particle.rotation.y += particle.angularVelocity.y * deltaTime;
        particle.rotation.z += particle.angularVelocity.z * deltaTime;
      }
      
      // Update color (fade over lifetime)
      const t = particle.age / particle.lifetime;
      const colorStart = this.getParameter('colorStart') as { r: number; g: number; b: number; a: number };
      const colorEnd = this.getParameter('colorEnd') as { r: number; g: number; b: number; a: number };
      
      particle.color = {
        r: colorStart.r + (colorEnd.r - colorStart.r) * t,
        g: colorStart.g + (colorEnd.g - colorStart.g) * t,
        b: colorStart.b + (colorEnd.b - colorStart.b) * t,
        a: colorStart.a + (colorEnd.a - colorStart.a) * t
      };
      
      // Handle collisions
      if (this.getParameter('collisionEnabled') && colliders) {
        this.handleCollisions(particle, colliders);
      }
    }
  }
  
  private applyWind(particle: Particle): void {
    const strength = this.getParameter('windStrength') as number;
    const direction = this.getParameter('windDirection') as { x: number; y: number; z: number };
    const noise = this.getParameter('windNoise') as number;
    
    const noiseFactor = noise > 0 ? 1 + this.noise3D(
      particle.position.x * 0.1 + this.time,
      particle.position.y * 0.1,
      particle.position.z * 0.1
    ) * noise : 1;
    
    particle.acceleration.x += direction.x * strength * noiseFactor;
    particle.acceleration.y += direction.y * strength * noiseFactor;
    particle.acceleration.z += direction.z * strength * noiseFactor;
  }
  
  private applyVortex(particle: Particle): void {
    const strength = this.getParameter('vortexStrength') as number;
    const center = this.getParameter('vortexCenter') as { x: number; y: number; z: number };
    const axis = this.getParameter('vortexAxis') as { x: number; y: number; z: number };
    
    const dx = particle.position.x - center.x;
    const dy = particle.position.y - center.y;
    const dz = particle.position.z - center.z;
    
    // Calculate tangential force
    const cross = {
      x: axis.y * dz - axis.z * dy,
      y: axis.z * dx - axis.x * dz,
      z: axis.x * dy - axis.y * dx
    };
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const force = distance > 0 ? strength / (distance + 0.1) : 0;
    
    particle.acceleration.x += cross.x * force;
    particle.acceleration.y += cross.y * force;
    particle.acceleration.z += cross.z * force;
  }
  
  private applyTurbulence(particle: Particle): void {
    const strength = this.getParameter('turbulenceStrength') as number;
    const scale = this.getParameter('turbulenceScale') as number;
    
    const nx = this.noise3D(particle.position.x * scale, particle.position.y * scale, particle.position.z * scale + this.time);
    const ny = this.noise3D(particle.position.x * scale + 100, particle.position.y * scale, particle.position.z * scale + this.time);
    const nz = this.noise3D(particle.position.x * scale, particle.position.y * scale + 100, particle.position.z * scale + this.time);
    
    particle.acceleration.x += nx * strength;
    particle.acceleration.y += ny * strength;
    particle.acceleration.z += nz * strength;
  }
  
  private applyForceField(particle: Particle, forceField: any): void {
    // Apply external force field (simplified)
    if (forceField.force) {
      particle.acceleration.x += forceField.force.x;
      particle.acceleration.y += forceField.force.y;
      particle.acceleration.z += forceField.force.z;
    }
  }
  
  private handleCollisions(particle: Particle, colliders: any): void {
    const bounciness = this.getParameter('collisionBounciness') as number;
    const friction = this.getParameter('collisionFriction') as number;
    const killOnCollision = this.getParameter('collisionKillParticles') as boolean;
    
    // Simplified ground plane collision
    if (particle.position.y < 0) {
      particle.position.y = 0;
      particle.velocity.y = -particle.velocity.y * bounciness;
      particle.velocity.x *= (1 - friction);
      particle.velocity.z *= (1 - friction);
      
      if (killOnCollision) {
        particle.alive = false;
      }
    }
  }
  
  private generateInstanceData(): any[] {
    return this.particles.map(p => ({
      position: p.position,
      rotation: p.rotation,
      scale: { x: p.size, y: p.size, z: p.size },
      color: p.color
    }));
  }
  
  private noise3D(x: number, y: number, z: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }
  
  dispose(): void {
    this.particles = [];
    super.dispose();
  }
}
