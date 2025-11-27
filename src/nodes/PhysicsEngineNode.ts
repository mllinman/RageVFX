/**
 * PhysicsEngineNode - Built-in physics engine for handling static and dynamic objects
 * Version 3.1 - Advanced Physics System
 * 
 * Features:
 * - Static/Dynamic object toggle
 * - Real-world forces: gravity, wind, inertia, momentum
 * - Volumetrics, boundaries, constraints
 * - Parenting system
 * - Easy-to-use sliders and checkboxes
 */

import { Node, DataType } from '../core/Node';

// Physics object interface
export interface PhysicsObject {
  id: string;
  name: string;
  
  // Transform
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
  
  // Velocity and momentum
  velocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  
  // Physical properties
  mass: number;
  density: number;
  volume: number;
  
  // Dynamic state
  isDynamic: boolean;
  isKinematic: boolean;
  isSleeping: boolean;
  
  // Material properties
  friction: number;
  restitution: number; // Bounciness
  drag: number; // Air resistance
  angularDrag: number;
  
  // Collision shape
  colliderType: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'mesh';
  colliderDimensions: { x: number; y: number; z: number };
  
  // Parenting
  parentId: string | null;
  childIds: string[];
  
  // Constraints
  constraints: PhysicsConstraint[];
  
  // Forces applied this frame
  accumulatedForce: { x: number; y: number; z: number };
  accumulatedTorque: { x: number; y: number; z: number };
}

// Constraint interface
export interface PhysicsConstraint {
  id: string;
  type: 'fixed' | 'hinge' | 'slider' | 'ball' | 'distance' | 'spring';
  targetId: string | null;
  localAnchor: { x: number; y: number; z: number };
  targetAnchor: { x: number; y: number; z: number };
  axis: { x: number; y: number; z: number };
  
  // Limits
  minLimit: number;
  maxLimit: number;
  
  // Spring settings
  stiffness: number;
  damping: number;
  
  // Enabled
  enabled: boolean;
}

// Boundary interface
export interface PhysicsBoundary {
  id: string;
  type: 'plane' | 'box' | 'sphere' | 'cylinder';
  position: { x: number; y: number; z: number };
  dimensions: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  restitution: number;
  friction: number;
  enabled: boolean;
}

export class PhysicsEngineNode extends Node {
  private objects: Map<string, PhysicsObject> = new Map();
  private boundaries: Map<string, PhysicsBoundary> = new Map();
  private time: number = 0;
  private accumulator: number = 0;
  private readonly fixedDeltaTime: number = 1 / 60;

  constructor(id: string) {
    super(id, 'PhysicsEngine', 'Physics Engine');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Built-in physics engine with static/dynamic objects, real-world forces, and easy-to-use controls';
    this.metadata.version = '3.1.0';
    
    // Inputs
    this.addInput('objects', 'Objects', DataType.ANY);
    this.addInput('externalForces', 'External Forces', DataType.ANY);
    this.addInput('boundaries', 'Boundaries', DataType.ANY);
    this.addInput('constraints', 'Constraints', DataType.ANY);
    
    // Outputs
    this.addOutput('simulatedObjects', 'Simulated Objects', DataType.ANY);
    this.addOutput('transforms', 'Transforms', DataType.ANY);
    this.addOutput('collisions', 'Collisions', DataType.ANY);
    this.addOutput('debug', 'Debug Info', DataType.ANY);
    
    // === SIMULATION SETTINGS (Sliders/Checkboxes) ===
    
    // Master Controls
    this.setParameter('enabled', true); // Checkbox
    this.setParameter('substeps', 4); // Slider 1-16
    this.setParameter('solverIterations', 10); // Slider 1-50
    this.setParameter('timeScale', 1.0); // Slider 0.0-2.0
    
    // === GRAVITY CONTROLS (Sliders/Checkboxes) ===
    this.setParameter('gravityEnabled', true); // Checkbox
    this.setParameter('gravityX', 0.0); // Slider -20.0 to 20.0
    this.setParameter('gravityY', -9.81); // Slider -20.0 to 20.0
    this.setParameter('gravityZ', 0.0); // Slider -20.0 to 20.0
    
    // === WIND CONTROLS (Sliders/Checkboxes) ===
    this.setParameter('windEnabled', false); // Checkbox
    this.setParameter('windDirectionX', 1.0); // Slider -1.0 to 1.0
    this.setParameter('windDirectionY', 0.0); // Slider -1.0 to 1.0
    this.setParameter('windDirectionZ', 0.0); // Slider -1.0 to 1.0
    this.setParameter('windStrength', 5.0); // Slider 0.0 to 50.0
    this.setParameter('windTurbulence', 0.5); // Slider 0.0 to 1.0
    this.setParameter('windFrequency', 2.0); // Slider 0.1 to 10.0
    
    // === INERTIA & MOMENTUM CONTROLS (Sliders/Checkboxes) ===
    this.setParameter('inertiaEnabled', true); // Checkbox
    this.setParameter('momentumConservation', true); // Checkbox
    this.setParameter('linearDamping', 0.01); // Slider 0.0 to 1.0
    this.setParameter('angularDamping', 0.05); // Slider 0.0 to 1.0
    
    // === COLLISION CONTROLS (Sliders/Checkboxes) ===
    this.setParameter('collisionsEnabled', true); // Checkbox
    this.setParameter('continuousCollision', false); // Checkbox
    this.setParameter('collisionMargin', 0.01); // Slider 0.0 to 0.1
    this.setParameter('defaultFriction', 0.5); // Slider 0.0 to 1.0
    this.setParameter('defaultRestitution', 0.3); // Slider 0.0 to 1.0
    
    // === BOUNDARY CONTROLS (Sliders/Checkboxes) ===
    this.setParameter('boundariesEnabled', true); // Checkbox
    this.setParameter('worldBoundsEnabled', true); // Checkbox
    this.setParameter('worldBoundsMinX', -10); // Slider
    this.setParameter('worldBoundsMinY', 0); // Slider
    this.setParameter('worldBoundsMinZ', -10); // Slider
    this.setParameter('worldBoundsMaxX', 10); // Slider
    this.setParameter('worldBoundsMaxY', 20); // Slider
    this.setParameter('worldBoundsMaxZ', 10); // Slider
    
    // === CONSTRAINT CONTROLS (Sliders/Checkboxes) ===
    this.setParameter('constraintsEnabled', true); // Checkbox
    this.setParameter('constraintIterations', 4); // Slider 1-16
    
    // === VOLUMETRIC CONTROLS (Sliders/Checkboxes) ===
    this.setParameter('volumetricsEnabled', true); // Checkbox
    this.setParameter('buoyancyEnabled', false); // Checkbox
    this.setParameter('fluidDensity', 1000); // Slider 0-2000 (water = 1000)
    
    // === PARENTING CONTROLS (Checkbox) ===
    this.setParameter('parentingEnabled', true); // Checkbox
    this.setParameter('inheritVelocity', true); // Checkbox
    
    // === SLEEP CONTROLS (Sliders/Checkboxes) ===
    this.setParameter('sleepEnabled', true); // Checkbox
    this.setParameter('sleepThreshold', 0.005); // Slider 0.001 to 0.1
    this.setParameter('sleepTimeThreshold', 0.5); // Slider 0.1 to 2.0
    
    // === DEBUG CONTROLS (Checkboxes) ===
    this.setParameter('debugDraw', false); // Checkbox
    this.setParameter('showVelocities', false); // Checkbox
    this.setParameter('showForces', false); // Checkbox
    this.setParameter('showColliders', false); // Checkbox
    this.setParameter('showBoundaries', false); // Checkbox
    
    // Initialize default boundaries
    this.initializeDefaultBoundaries();
  }

  private initializeDefaultBoundaries(): void {
    // Ground plane
    this.boundaries.set('ground', {
      id: 'ground',
      type: 'plane',
      position: { x: 0, y: 0, z: 0 },
      dimensions: { x: 100, y: 1, z: 100 },
      normal: { x: 0, y: 1, z: 0 },
      restitution: 0.3,
      friction: 0.5,
      enabled: true
    });
  }

  async process(): Promise<void> {
    if (!this.getParameter('enabled')) {
      // Just pass through objects unchanged
      const objectsInput = this.inputs.get('objects');
      const simulatedOutput = this.outputs.get('simulatedObjects');
      if (simulatedOutput && objectsInput?.value) {
        simulatedOutput.value = objectsInput.value;
      }
      return;
    }
    
    const deltaTime = 0.016 * this.getParameter('timeScale');
    this.time += deltaTime;
    this.accumulator += deltaTime;
    
    // Process input objects
    this.processInputObjects();
    
    // Process input boundaries
    this.processInputBoundaries();
    
    // Process input constraints
    this.processInputConstraints();
    
    const substeps = this.getParameter('substeps');
    const dt = this.fixedDeltaTime / substeps;
    
    // Fixed timestep physics update
    while (this.accumulator >= this.fixedDeltaTime) {
      for (let i = 0; i < substeps; i++) {
        // Apply forces to dynamic objects
        this.applyForces(dt);
        
        // Integrate velocities
        this.integrateVelocities(dt);
        
        // Solve constraints
        if (this.getParameter('constraintsEnabled')) {
          this.solveConstraints();
        }
        
        // Detect and resolve collisions
        if (this.getParameter('collisionsEnabled')) {
          this.detectAndResolveCollisions();
        }
        
        // Handle boundary collisions
        if (this.getParameter('boundariesEnabled')) {
          this.handleBoundaryCollisions();
        }
        
        // Integrate positions
        this.integratePositions(dt);
        
        // Update parent-child relationships
        if (this.getParameter('parentingEnabled')) {
          this.updateParenting();
        }
        
        // Check for sleep
        if (this.getParameter('sleepEnabled')) {
          this.updateSleepStates();
        }
      }
      
      this.accumulator -= this.fixedDeltaTime;
    }
    
    // Generate outputs
    this.generateOutputs();
  }

  private processInputObjects(): void {
    const objectsInput = this.inputs.get('objects');
    if (!objectsInput?.value) return;
    
    const inputObjects = Array.isArray(objectsInput.value) ? objectsInput.value : [objectsInput.value];
    
    for (const obj of inputObjects) {
      const id = obj.id || `obj_${this.objects.size}`;
      
      if (!this.objects.has(id)) {
        // Create new physics object
        const physObj = this.createPhysicsObject(id, obj);
        this.objects.set(id, physObj);
      } else {
        // Update existing object's target properties
        const existing = this.objects.get(id)!;
        if (obj.isDynamic !== undefined) existing.isDynamic = obj.isDynamic;
        if (obj.mass !== undefined) existing.mass = obj.mass;
        if (obj.friction !== undefined) existing.friction = obj.friction;
        if (obj.restitution !== undefined) existing.restitution = obj.restitution;
      }
    }
  }

  private createPhysicsObject(id: string, input: any): PhysicsObject {
    const pos = input.position || { x: 0, y: 0, z: 0 };
    const scale = input.scale || input.dimensions || { x: 1, y: 1, z: 1 };
    const volume = scale.x * scale.y * scale.z;
    const density = input.density || 1.0;
    const mass = input.mass || (volume * density);
    
    return {
      id,
      name: input.name || id,
      position: { ...pos },
      rotation: input.rotation || { x: 0, y: 0, z: 0, w: 1 },
      scale: { ...scale },
      velocity: input.velocity || { x: 0, y: 0, z: 0 },
      angularVelocity: input.angularVelocity || { x: 0, y: 0, z: 0 },
      mass,
      density,
      volume,
      isDynamic: input.isDynamic !== undefined ? input.isDynamic : true,
      isKinematic: input.isKinematic || false,
      isSleeping: false,
      friction: input.friction !== undefined ? input.friction : this.getParameter('defaultFriction'),
      restitution: input.restitution !== undefined ? input.restitution : this.getParameter('defaultRestitution'),
      drag: input.drag !== undefined ? input.drag : 0.01,
      angularDrag: input.angularDrag !== undefined ? input.angularDrag : 0.05,
      colliderType: input.colliderType || input.shape || 'box',
      colliderDimensions: input.colliderDimensions || scale,
      parentId: input.parentId || null,
      childIds: input.childIds || [],
      constraints: input.constraints || [],
      accumulatedForce: { x: 0, y: 0, z: 0 },
      accumulatedTorque: { x: 0, y: 0, z: 0 }
    };
  }

  private processInputBoundaries(): void {
    const boundariesInput = this.inputs.get('boundaries');
    if (!boundariesInput?.value) return;
    
    const inputBoundaries = Array.isArray(boundariesInput.value) ? boundariesInput.value : [boundariesInput.value];
    
    for (const bound of inputBoundaries) {
      const id = bound.id || `boundary_${this.boundaries.size}`;
      this.boundaries.set(id, {
        id,
        type: bound.type || 'plane',
        position: bound.position || { x: 0, y: 0, z: 0 },
        dimensions: bound.dimensions || { x: 100, y: 1, z: 100 },
        normal: bound.normal || { x: 0, y: 1, z: 0 },
        restitution: bound.restitution !== undefined ? bound.restitution : 0.3,
        friction: bound.friction !== undefined ? bound.friction : 0.5,
        enabled: bound.enabled !== undefined ? bound.enabled : true
      });
    }
  }

  private processInputConstraints(): void {
    const constraintsInput = this.inputs.get('constraints');
    if (!constraintsInput?.value) return;
    
    const inputConstraints = Array.isArray(constraintsInput.value) ? constraintsInput.value : [constraintsInput.value];
    
    for (const constraint of inputConstraints) {
      const objectId = constraint.objectId;
      if (objectId && this.objects.has(objectId)) {
        const obj = this.objects.get(objectId)!;
        obj.constraints.push({
          id: constraint.id || `constraint_${obj.constraints.length}`,
          type: constraint.type || 'fixed',
          targetId: constraint.targetId || null,
          localAnchor: constraint.localAnchor || { x: 0, y: 0, z: 0 },
          targetAnchor: constraint.targetAnchor || { x: 0, y: 0, z: 0 },
          axis: constraint.axis || { x: 0, y: 1, z: 0 },
          minLimit: constraint.minLimit || -Math.PI,
          maxLimit: constraint.maxLimit || Math.PI,
          stiffness: constraint.stiffness || 1.0,
          damping: constraint.damping || 0.1,
          enabled: constraint.enabled !== undefined ? constraint.enabled : true
        });
      }
    }
  }

  private applyForces(dt: number): void {
    // Get gravity settings
    const gravityEnabled = this.getParameter('gravityEnabled');
    const gravity = {
      x: this.getParameter('gravityX'),
      y: this.getParameter('gravityY'),
      z: this.getParameter('gravityZ')
    };
    
    // Get wind settings
    const windEnabled = this.getParameter('windEnabled');
    const windDir = {
      x: this.getParameter('windDirectionX'),
      y: this.getParameter('windDirectionY'),
      z: this.getParameter('windDirectionZ')
    };
    const windStrength = this.getParameter('windStrength');
    const windTurbulence = this.getParameter('windTurbulence');
    const windFrequency = this.getParameter('windFrequency');
    
    // Get volumetric settings
    const volumetricsEnabled = this.getParameter('volumetricsEnabled');
    const buoyancyEnabled = this.getParameter('buoyancyEnabled');
    const fluidDensity = this.getParameter('fluidDensity');
    
    // Get damping settings
    const linearDamping = this.getParameter('linearDamping');
    const angularDamping = this.getParameter('angularDamping');
    
    // Apply external forces from input
    const externalForcesInput = this.inputs.get('externalForces');
    const externalForces = externalForcesInput?.value 
      ? (Array.isArray(externalForcesInput.value) ? externalForcesInput.value : [externalForcesInput.value])
      : [];
    
    this.objects.forEach((obj) => {
      // Skip static, kinematic, or sleeping objects
      if (!obj.isDynamic || obj.isKinematic || obj.isSleeping) return;
      
      // Reset accumulated forces
      obj.accumulatedForce = { x: 0, y: 0, z: 0 };
      obj.accumulatedTorque = { x: 0, y: 0, z: 0 };
      
      // Apply gravity
      if (gravityEnabled && this.getParameter('inertiaEnabled')) {
        obj.accumulatedForce.x += gravity.x * obj.mass;
        obj.accumulatedForce.y += gravity.y * obj.mass;
        obj.accumulatedForce.z += gravity.z * obj.mass;
      }
      
      // Apply wind force
      if (windEnabled) {
        const windVariation = Math.sin(this.time * windFrequency) * windTurbulence + 1;
        const noise = Math.sin(obj.position.x * 3 + this.time) * 
                     Math.cos(obj.position.y * 2 + this.time * 0.7) *
                     windTurbulence;
        
        const windForce = windStrength * windVariation * (1 + noise);
        
        // Normalize wind direction
        const len = Math.sqrt(windDir.x * windDir.x + windDir.y * windDir.y + windDir.z * windDir.z) || 1;
        
        obj.accumulatedForce.x += (windDir.x / len) * windForce;
        obj.accumulatedForce.y += (windDir.y / len) * windForce;
        obj.accumulatedForce.z += (windDir.z / len) * windForce;
      }
      
      // Apply buoyancy if volumetrics enabled
      if (volumetricsEnabled && buoyancyEnabled && obj.position.y < 0) {
        // Simplified buoyancy - objects below y=0 are in fluid
        const submergedVolume = obj.volume * Math.min(1, -obj.position.y / obj.scale.y);
        const buoyancyForce = submergedVolume * fluidDensity * (-gravity.y);
        obj.accumulatedForce.y += buoyancyForce;
        
        // Fluid drag
        const fluidDrag = 0.5;
        obj.velocity.x *= (1 - fluidDrag * dt);
        obj.velocity.y *= (1 - fluidDrag * dt);
        obj.velocity.z *= (1 - fluidDrag * dt);
      }
      
      // Apply external forces
      for (const force of externalForces) {
        if (force.objectId && force.objectId !== obj.id) continue;
        
        if (force.type === 'point') {
          const dx = force.position.x - obj.position.x;
          const dy = force.position.y - obj.position.y;
          const dz = force.position.z - obj.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < (force.radius || 10) && dist > 0) {
            const strength = force.strength * (1 - dist / (force.radius || 10));
            obj.accumulatedForce.x += (dx / dist) * strength;
            obj.accumulatedForce.y += (dy / dist) * strength;
            obj.accumulatedForce.z += (dz / dist) * strength;
          }
        } else if (force.type === 'directional') {
          obj.accumulatedForce.x += (force.direction?.x || 0) * (force.strength || 1);
          obj.accumulatedForce.y += (force.direction?.y || 0) * (force.strength || 1);
          obj.accumulatedForce.z += (force.direction?.z || 0) * (force.strength || 1);
        } else if (force.type === 'impulse') {
          obj.velocity.x += (force.impulse?.x || 0) / obj.mass;
          obj.velocity.y += (force.impulse?.y || 0) / obj.mass;
          obj.velocity.z += (force.impulse?.z || 0) / obj.mass;
        }
      }
      
      // Apply drag (air resistance)
      const dragFactor = 1 - (obj.drag + linearDamping) * dt;
      const angularDragFactor = 1 - (obj.angularDrag + angularDamping) * dt;
      
      obj.velocity.x *= Math.max(0, dragFactor);
      obj.velocity.y *= Math.max(0, dragFactor);
      obj.velocity.z *= Math.max(0, dragFactor);
      
      obj.angularVelocity.x *= Math.max(0, angularDragFactor);
      obj.angularVelocity.y *= Math.max(0, angularDragFactor);
      obj.angularVelocity.z *= Math.max(0, angularDragFactor);
    });
  }

  private integrateVelocities(dt: number): void {
    if (!this.getParameter('inertiaEnabled')) return;
    
    this.objects.forEach((obj) => {
      if (!obj.isDynamic || obj.isKinematic || obj.isSleeping) return;
      
      // Calculate acceleration from forces
      const invMass = 1 / obj.mass;
      
      // Update velocity (momentum conservation)
      if (this.getParameter('momentumConservation')) {
        obj.velocity.x += obj.accumulatedForce.x * invMass * dt;
        obj.velocity.y += obj.accumulatedForce.y * invMass * dt;
        obj.velocity.z += obj.accumulatedForce.z * invMass * dt;
        
        // Angular velocity from torque
        obj.angularVelocity.x += obj.accumulatedTorque.x * invMass * dt;
        obj.angularVelocity.y += obj.accumulatedTorque.y * invMass * dt;
        obj.angularVelocity.z += obj.accumulatedTorque.z * invMass * dt;
      }
    });
  }

  private integratePositions(dt: number): void {
    this.objects.forEach((obj) => {
      if (!obj.isDynamic || obj.isKinematic || obj.isSleeping) return;
      
      // Update position from velocity
      obj.position.x += obj.velocity.x * dt;
      obj.position.y += obj.velocity.y * dt;
      obj.position.z += obj.velocity.z * dt;
      
      // Update rotation from angular velocity
      this.integrateRotation(obj, dt);
    });
  }

  private integrateRotation(obj: PhysicsObject, dt: number): void {
    const q = obj.rotation;
    const w = obj.angularVelocity;
    
    // Quaternion derivative: dq/dt = 0.5 * w * q
    const dq = {
      x: 0.5 * (w.x * q.w + w.y * q.z - w.z * q.y) * dt,
      y: 0.5 * (w.y * q.w + w.z * q.x - w.x * q.z) * dt,
      z: 0.5 * (w.z * q.w + w.x * q.y - w.y * q.x) * dt,
      w: 0.5 * (-w.x * q.x - w.y * q.y - w.z * q.z) * dt
    };
    
    q.x += dq.x;
    q.y += dq.y;
    q.z += dq.z;
    q.w += dq.w;
    
    // Normalize quaternion
    const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    if (len > 0) {
      q.x /= len;
      q.y /= len;
      q.z /= len;
      q.w /= len;
    }
  }

  private solveConstraints(): void {
    const iterations = this.getParameter('constraintIterations');
    
    for (let iter = 0; iter < iterations; iter++) {
      this.objects.forEach((obj) => {
        for (const constraint of obj.constraints) {
          if (!constraint.enabled) continue;
          
          this.solveConstraint(obj, constraint);
        }
      });
    }
  }

  private solveConstraint(obj: PhysicsObject, constraint: PhysicsConstraint): void {
    const target = constraint.targetId ? this.objects.get(constraint.targetId) : null;
    
    switch (constraint.type) {
      case 'fixed':
        this.solveFixedConstraint(obj, constraint, target);
        break;
      case 'distance':
        this.solveDistanceConstraint(obj, constraint, target);
        break;
      case 'spring':
        this.solveSpringConstraint(obj, constraint, target);
        break;
      case 'hinge':
        this.solveHingeConstraint(obj, constraint, target);
        break;
    }
  }

  private solveFixedConstraint(obj: PhysicsObject, constraint: PhysicsConstraint, target: PhysicsObject | null | undefined): void {
    if (!target) {
      // Fixed to world
      obj.position.x = constraint.targetAnchor.x;
      obj.position.y = constraint.targetAnchor.y;
      obj.position.z = constraint.targetAnchor.z;
      obj.velocity = { x: 0, y: 0, z: 0 };
    } else {
      // Fixed to another object
      obj.position.x = target.position.x + constraint.targetAnchor.x;
      obj.position.y = target.position.y + constraint.targetAnchor.y;
      obj.position.z = target.position.z + constraint.targetAnchor.z;
      
      if (this.getParameter('inheritVelocity')) {
        obj.velocity = { ...target.velocity };
      }
    }
  }

  private solveDistanceConstraint(obj: PhysicsObject, constraint: PhysicsConstraint, target: PhysicsObject | null | undefined): void {
    const targetPos = target ? target.position : constraint.targetAnchor;
    
    const dx = obj.position.x - targetPos.x;
    const dy = obj.position.y - targetPos.y;
    const dz = obj.position.z - targetPos.z;
    
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const restLength = constraint.minLimit; // Use minLimit as rest length
    
    if (dist === 0) return;
    
    const diff = (dist - restLength) / dist;
    
    if (target && target.isDynamic && !target.isSleeping) {
      // Both objects move
      const correction = diff * 0.5;
      obj.position.x -= dx * correction;
      obj.position.y -= dy * correction;
      obj.position.z -= dz * correction;
      target.position.x += dx * correction;
      target.position.y += dy * correction;
      target.position.z += dz * correction;
    } else {
      // Only this object moves
      obj.position.x -= dx * diff;
      obj.position.y -= dy * diff;
      obj.position.z -= dz * diff;
    }
  }

  private solveSpringConstraint(obj: PhysicsObject, constraint: PhysicsConstraint, target: PhysicsObject | null | undefined): void {
    const targetPos = target ? target.position : constraint.targetAnchor;
    
    const dx = obj.position.x - targetPos.x;
    const dy = obj.position.y - targetPos.y;
    const dz = obj.position.z - targetPos.z;
    
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const restLength = constraint.minLimit;
    
    if (dist === 0) return;
    
    // Spring force: F = -k * (x - rest) - c * v
    const displacement = dist - restLength;
    const springForce = -constraint.stiffness * displacement;
    
    // Damping
    const relVelX = target ? (obj.velocity.x - target.velocity.x) : obj.velocity.x;
    const relVelY = target ? (obj.velocity.y - target.velocity.y) : obj.velocity.y;
    const relVelZ = target ? (obj.velocity.z - target.velocity.z) : obj.velocity.z;
    
    const dampingForce = constraint.damping * (relVelX * dx + relVelY * dy + relVelZ * dz) / dist;
    
    const totalForce = springForce - dampingForce;
    
    obj.velocity.x += (dx / dist) * totalForce / obj.mass * this.fixedDeltaTime;
    obj.velocity.y += (dy / dist) * totalForce / obj.mass * this.fixedDeltaTime;
    obj.velocity.z += (dz / dist) * totalForce / obj.mass * this.fixedDeltaTime;
  }

  private solveHingeConstraint(obj: PhysicsObject, constraint: PhysicsConstraint, target: PhysicsObject | null | undefined): void {
    // Simplified hinge - constrain position to target with rotational freedom around axis
    const targetPos = target ? target.position : constraint.targetAnchor;
    
    // Keep object at fixed distance from pivot
    const dx = obj.position.x - targetPos.x;
    const dy = obj.position.y - targetPos.y;
    const dz = obj.position.z - targetPos.z;
    
    // Project onto plane perpendicular to hinge axis
    const axis = constraint.axis;
    const dot = dx * axis.x + dy * axis.y + dz * axis.z;
    
    // Constraint position along axis
    obj.position.x -= axis.x * dot * 0.5;
    obj.position.y -= axis.y * dot * 0.5;
    obj.position.z -= axis.z * dot * 0.5;
  }

  private detectAndResolveCollisions(): void {
    const objectsArray = Array.from(this.objects.values());
    const collisionMargin = this.getParameter('collisionMargin');
    
    // O(n²) collision detection - would use spatial partitioning in production
    for (let i = 0; i < objectsArray.length; i++) {
      for (let j = i + 1; j < objectsArray.length; j++) {
        const a = objectsArray[i];
        const b = objectsArray[j];
        
        // Skip if both are static or sleeping
        if ((!a.isDynamic || a.isSleeping) && (!b.isDynamic || b.isSleeping)) continue;
        
        const contact = this.checkCollision(a, b, collisionMargin);
        if (contact) {
          this.resolveCollision(a, b, contact);
        }
      }
    }
  }

  private checkCollision(a: PhysicsObject, b: PhysicsObject, margin: number): any | null {
    // Sphere vs Sphere for simplicity (would add more shapes in production)
    if (a.colliderType === 'sphere' && b.colliderType === 'sphere') {
      return this.sphereSphereTest(a, b, margin);
    }
    
    // Box vs Box using AABB
    if (a.colliderType === 'box' && b.colliderType === 'box') {
      return this.boxBoxTest(a, b, margin);
    }
    
    // Sphere vs Box
    if (a.colliderType === 'sphere' && b.colliderType === 'box') {
      return this.sphereBoxTest(a, b, margin);
    }
    if (a.colliderType === 'box' && b.colliderType === 'sphere') {
      const contact = this.sphereBoxTest(b, a, margin);
      if (contact) {
        contact.normal.x = -contact.normal.x;
        contact.normal.y = -contact.normal.y;
        contact.normal.z = -contact.normal.z;
      }
      return contact;
    }
    
    // Default AABB test for other shapes
    return this.aabbTest(a, b, margin);
  }

  private sphereSphereTest(a: PhysicsObject, b: PhysicsObject, margin: number): any | null {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dz = b.position.z - a.position.z;
    
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const radiusA = Math.max(a.colliderDimensions.x, a.colliderDimensions.y, a.colliderDimensions.z) / 2;
    const radiusB = Math.max(b.colliderDimensions.x, b.colliderDimensions.y, b.colliderDimensions.z) / 2;
    const minDist = radiusA + radiusB + margin;
    
    if (dist < minDist && dist > 0) {
      return {
        point: {
          x: a.position.x + (dx / dist) * radiusA,
          y: a.position.y + (dy / dist) * radiusA,
          z: a.position.z + (dz / dist) * radiusA
        },
        normal: { x: dx / dist, y: dy / dist, z: dz / dist },
        depth: minDist - dist
      };
    }
    
    return null;
  }

  private boxBoxTest(a: PhysicsObject, b: PhysicsObject, margin: number): any | null {
    const aMin = {
      x: a.position.x - a.colliderDimensions.x / 2 - margin,
      y: a.position.y - a.colliderDimensions.y / 2 - margin,
      z: a.position.z - a.colliderDimensions.z / 2 - margin
    };
    const aMax = {
      x: a.position.x + a.colliderDimensions.x / 2 + margin,
      y: a.position.y + a.colliderDimensions.y / 2 + margin,
      z: a.position.z + a.colliderDimensions.z / 2 + margin
    };
    const bMin = {
      x: b.position.x - b.colliderDimensions.x / 2,
      y: b.position.y - b.colliderDimensions.y / 2,
      z: b.position.z - b.colliderDimensions.z / 2
    };
    const bMax = {
      x: b.position.x + b.colliderDimensions.x / 2,
      y: b.position.y + b.colliderDimensions.y / 2,
      z: b.position.z + b.colliderDimensions.z / 2
    };
    
    // AABB intersection test
    if (aMax.x < bMin.x || aMin.x > bMax.x) return null;
    if (aMax.y < bMin.y || aMin.y > bMax.y) return null;
    if (aMax.z < bMin.z || aMin.z > bMax.z) return null;
    
    // Calculate overlap and normal
    const overlapX = Math.min(aMax.x - bMin.x, bMax.x - aMin.x);
    const overlapY = Math.min(aMax.y - bMin.y, bMax.y - aMin.y);
    const overlapZ = Math.min(aMax.z - bMin.z, bMax.z - aMin.z);
    
    let depth: number;
    let normal: { x: number; y: number; z: number };
    
    if (overlapX <= overlapY && overlapX <= overlapZ) {
      depth = overlapX;
      normal = { x: a.position.x < b.position.x ? -1 : 1, y: 0, z: 0 };
    } else if (overlapY <= overlapZ) {
      depth = overlapY;
      normal = { x: 0, y: a.position.y < b.position.y ? -1 : 1, z: 0 };
    } else {
      depth = overlapZ;
      normal = { x: 0, y: 0, z: a.position.z < b.position.z ? -1 : 1 };
    }
    
    return {
      point: {
        x: (Math.max(aMin.x, bMin.x) + Math.min(aMax.x, bMax.x)) / 2,
        y: (Math.max(aMin.y, bMin.y) + Math.min(aMax.y, bMax.y)) / 2,
        z: (Math.max(aMin.z, bMin.z) + Math.min(aMax.z, bMax.z)) / 2
      },
      normal,
      depth
    };
  }

  private sphereBoxTest(sphere: PhysicsObject, box: PhysicsObject, margin: number): any | null {
    const radius = Math.max(sphere.colliderDimensions.x, sphere.colliderDimensions.y, sphere.colliderDimensions.z) / 2 + margin;
    const halfExtents = {
      x: box.colliderDimensions.x / 2,
      y: box.colliderDimensions.y / 2,
      z: box.colliderDimensions.z / 2
    };
    
    const localPos = {
      x: sphere.position.x - box.position.x,
      y: sphere.position.y - box.position.y,
      z: sphere.position.z - box.position.z
    };
    
    const closestPoint = {
      x: Math.max(-halfExtents.x, Math.min(halfExtents.x, localPos.x)),
      y: Math.max(-halfExtents.y, Math.min(halfExtents.y, localPos.y)),
      z: Math.max(-halfExtents.z, Math.min(halfExtents.z, localPos.z))
    };
    
    const dx = localPos.x - closestPoint.x;
    const dy = localPos.y - closestPoint.y;
    const dz = localPos.z - closestPoint.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (dist < radius) {
      let nx = dx, ny = dy, nz = dz;
      if (dist > 0) {
        nx /= dist; ny /= dist; nz /= dist;
      } else {
        nx = 0; ny = 1; nz = 0;
      }
      
      return {
        point: {
          x: box.position.x + closestPoint.x,
          y: box.position.y + closestPoint.y,
          z: box.position.z + closestPoint.z
        },
        normal: { x: nx, y: ny, z: nz },
        depth: radius - dist
      };
    }
    
    return null;
  }

  private aabbTest(a: PhysicsObject, b: PhysicsObject, margin: number): any | null {
    // Generic AABB test
    const aSize = Math.max(a.colliderDimensions.x, a.colliderDimensions.y, a.colliderDimensions.z);
    const bSize = Math.max(b.colliderDimensions.x, b.colliderDimensions.y, b.colliderDimensions.z);
    
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dz = b.position.z - a.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (dist < (aSize + bSize) / 2 + margin && dist > 0) {
      return {
        point: {
          x: (a.position.x + b.position.x) / 2,
          y: (a.position.y + b.position.y) / 2,
          z: (a.position.z + b.position.z) / 2
        },
        normal: { x: dx / dist, y: dy / dist, z: dz / dist },
        depth: (aSize + bSize) / 2 + margin - dist
      };
    }
    
    return null;
  }

  private resolveCollision(a: PhysicsObject, b: PhysicsObject, contact: any): void {
    // Calculate combined restitution (bounciness)
    const restitution = Math.min(a.restitution, b.restitution);
    const friction = (a.friction + b.friction) / 2;
    
    // Relative velocity at contact point
    const relVel = {
      x: b.velocity.x - a.velocity.x,
      y: b.velocity.y - a.velocity.y,
      z: b.velocity.z - a.velocity.z
    };
    
    // Velocity along collision normal
    const velAlongNormal = relVel.x * contact.normal.x + 
                           relVel.y * contact.normal.y + 
                           relVel.z * contact.normal.z;
    
    // Only resolve if objects are moving toward each other
    if (velAlongNormal > 0) return;
    
    // Calculate impulse magnitude
    const invMassA = a.isDynamic && !a.isSleeping ? 1 / a.mass : 0;
    const invMassB = b.isDynamic && !b.isSleeping ? 1 / b.mass : 0;
    
    const j = -(1 + restitution) * velAlongNormal / (invMassA + invMassB);
    
    // Apply impulse
    if (a.isDynamic && !a.isSleeping) {
      a.velocity.x -= j * invMassA * contact.normal.x;
      a.velocity.y -= j * invMassA * contact.normal.y;
      a.velocity.z -= j * invMassA * contact.normal.z;
    }
    
    if (b.isDynamic && !b.isSleeping) {
      b.velocity.x += j * invMassB * contact.normal.x;
      b.velocity.y += j * invMassB * contact.normal.y;
      b.velocity.z += j * invMassB * contact.normal.z;
    }
    
    // Apply friction
    const tangentX = relVel.x - velAlongNormal * contact.normal.x;
    const tangentY = relVel.y - velAlongNormal * contact.normal.y;
    const tangentZ = relVel.z - velAlongNormal * contact.normal.z;
    const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);
    
    if (tangentLen > 0.001) {
      const frictionImpulse = Math.min(Math.abs(j * friction), tangentLen * (invMassA + invMassB));
      
      if (a.isDynamic && !a.isSleeping) {
        a.velocity.x += frictionImpulse * invMassA * (tangentX / tangentLen);
        a.velocity.y += frictionImpulse * invMassA * (tangentY / tangentLen);
        a.velocity.z += frictionImpulse * invMassA * (tangentZ / tangentLen);
      }
      
      if (b.isDynamic && !b.isSleeping) {
        b.velocity.x -= frictionImpulse * invMassB * (tangentX / tangentLen);
        b.velocity.y -= frictionImpulse * invMassB * (tangentY / tangentLen);
        b.velocity.z -= frictionImpulse * invMassB * (tangentZ / tangentLen);
      }
    }
    
    // Positional correction to prevent sinking
    const correction = contact.depth / (invMassA + invMassB) * 0.8;
    
    if (a.isDynamic && !a.isSleeping) {
      a.position.x -= correction * invMassA * contact.normal.x;
      a.position.y -= correction * invMassA * contact.normal.y;
      a.position.z -= correction * invMassA * contact.normal.z;
    }
    
    if (b.isDynamic && !b.isSleeping) {
      b.position.x += correction * invMassB * contact.normal.x;
      b.position.y += correction * invMassB * contact.normal.y;
      b.position.z += correction * invMassB * contact.normal.z;
    }
    
    // Wake up sleeping objects on collision
    a.isSleeping = false;
    b.isSleeping = false;
  }

  private handleBoundaryCollisions(): void {
    const worldBoundsEnabled = this.getParameter('worldBoundsEnabled');
    
    this.objects.forEach((obj) => {
      if (!obj.isDynamic || obj.isSleeping) return;
      
      // Handle custom boundaries
      this.boundaries.forEach((boundary) => {
        if (!boundary.enabled) return;
        
        this.handleBoundaryCollision(obj, boundary);
      });
      
      // Handle world bounds
      if (worldBoundsEnabled) {
        this.handleWorldBounds(obj);
      }
    });
  }

  private handleBoundaryCollision(obj: PhysicsObject, boundary: PhysicsBoundary): void {
    if (boundary.type === 'plane') {
      // Plane collision
      const normal = boundary.normal;
      const distToPlane = (obj.position.x - boundary.position.x) * normal.x +
                          (obj.position.y - boundary.position.y) * normal.y +
                          (obj.position.z - boundary.position.z) * normal.z;
      
      const radius = Math.max(obj.colliderDimensions.x, obj.colliderDimensions.y, obj.colliderDimensions.z) / 2;
      
      if (distToPlane < radius) {
        // Position correction
        const correction = radius - distToPlane;
        obj.position.x += normal.x * correction;
        obj.position.y += normal.y * correction;
        obj.position.z += normal.z * correction;
        
        // Velocity reflection with restitution
        const velAlongNormal = obj.velocity.x * normal.x + 
                               obj.velocity.y * normal.y + 
                               obj.velocity.z * normal.z;
        
        if (velAlongNormal < 0) {
          obj.velocity.x -= (1 + boundary.restitution) * velAlongNormal * normal.x;
          obj.velocity.y -= (1 + boundary.restitution) * velAlongNormal * normal.y;
          obj.velocity.z -= (1 + boundary.restitution) * velAlongNormal * normal.z;
          
          // Friction on tangent
          const tangentX = obj.velocity.x - velAlongNormal * normal.x;
          const tangentY = obj.velocity.y - velAlongNormal * normal.y;
          const tangentZ = obj.velocity.z - velAlongNormal * normal.z;
          
          obj.velocity.x -= tangentX * boundary.friction;
          obj.velocity.y -= tangentY * boundary.friction;
          obj.velocity.z -= tangentZ * boundary.friction;
        }
        
        obj.isSleeping = false;
      }
    }
  }

  private handleWorldBounds(obj: PhysicsObject): void {
    const minX = this.getParameter('worldBoundsMinX');
    const minY = this.getParameter('worldBoundsMinY');
    const minZ = this.getParameter('worldBoundsMinZ');
    const maxX = this.getParameter('worldBoundsMaxX');
    const maxY = this.getParameter('worldBoundsMaxY');
    const maxZ = this.getParameter('worldBoundsMaxZ');
    
    const radius = Math.max(obj.colliderDimensions.x, obj.colliderDimensions.y, obj.colliderDimensions.z) / 2;
    const restitution = obj.restitution;
    const friction = obj.friction;
    
    // X bounds
    if (obj.position.x - radius < minX) {
      obj.position.x = minX + radius;
      obj.velocity.x = -obj.velocity.x * restitution;
      obj.velocity.y *= (1 - friction);
      obj.velocity.z *= (1 - friction);
    }
    if (obj.position.x + radius > maxX) {
      obj.position.x = maxX - radius;
      obj.velocity.x = -obj.velocity.x * restitution;
      obj.velocity.y *= (1 - friction);
      obj.velocity.z *= (1 - friction);
    }
    
    // Y bounds
    if (obj.position.y - radius < minY) {
      obj.position.y = minY + radius;
      obj.velocity.y = -obj.velocity.y * restitution;
      obj.velocity.x *= (1 - friction);
      obj.velocity.z *= (1 - friction);
    }
    if (obj.position.y + radius > maxY) {
      obj.position.y = maxY - radius;
      obj.velocity.y = -obj.velocity.y * restitution;
      obj.velocity.x *= (1 - friction);
      obj.velocity.z *= (1 - friction);
    }
    
    // Z bounds
    if (obj.position.z - radius < minZ) {
      obj.position.z = minZ + radius;
      obj.velocity.z = -obj.velocity.z * restitution;
      obj.velocity.x *= (1 - friction);
      obj.velocity.y *= (1 - friction);
    }
    if (obj.position.z + radius > maxZ) {
      obj.position.z = maxZ - radius;
      obj.velocity.z = -obj.velocity.z * restitution;
      obj.velocity.x *= (1 - friction);
      obj.velocity.y *= (1 - friction);
    }
  }

  private updateParenting(): void {
    this.objects.forEach((obj) => {
      if (obj.parentId) {
        const parent = this.objects.get(obj.parentId);
        if (parent && !obj.isDynamic) {
          // Static children follow parent
          obj.position.x = parent.position.x;
          obj.position.y = parent.position.y;
          obj.position.z = parent.position.z;
          obj.rotation = { ...parent.rotation };
          
          if (this.getParameter('inheritVelocity')) {
            obj.velocity = { ...parent.velocity };
            obj.angularVelocity = { ...parent.angularVelocity };
          }
        }
      }
    });
  }

  private updateSleepStates(): void {
    const sleepThreshold = this.getParameter('sleepThreshold');
    
    this.objects.forEach((obj) => {
      if (!obj.isDynamic || obj.isKinematic) return;
      
      const speed = Math.sqrt(
        obj.velocity.x * obj.velocity.x +
        obj.velocity.y * obj.velocity.y +
        obj.velocity.z * obj.velocity.z
      );
      const angSpeed = Math.sqrt(
        obj.angularVelocity.x * obj.angularVelocity.x +
        obj.angularVelocity.y * obj.angularVelocity.y +
        obj.angularVelocity.z * obj.angularVelocity.z
      );
      
      if (speed < sleepThreshold && angSpeed < sleepThreshold) {
        obj.isSleeping = true;
        obj.velocity = { x: 0, y: 0, z: 0 };
        obj.angularVelocity = { x: 0, y: 0, z: 0 };
      }
    });
  }

  private generateOutputs(): void {
    const collisions: any[] = [];
    
    // Simulated objects output
    const simulatedOutput = this.outputs.get('simulatedObjects');
    if (simulatedOutput) {
      simulatedOutput.value = Array.from(this.objects.values()).map(obj => ({
        id: obj.id,
        name: obj.name,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale,
        velocity: obj.velocity,
        angularVelocity: obj.angularVelocity,
        isDynamic: obj.isDynamic,
        isSleeping: obj.isSleeping,
        mass: obj.mass
      }));
    }
    
    // Transforms output (for rendering)
    const transformsOutput = this.outputs.get('transforms');
    if (transformsOutput) {
      transformsOutput.value = Array.from(this.objects.values()).map(obj => ({
        id: obj.id,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale
      }));
    }
    
    // Collisions output
    const collisionsOutput = this.outputs.get('collisions');
    if (collisionsOutput) {
      collisionsOutput.value = collisions;
    }
    
    // Debug output
    const debugOutput = this.outputs.get('debug');
    if (debugOutput && this.getParameter('debugDraw')) {
      debugOutput.value = {
        objectCount: this.objects.size,
        boundaryCount: this.boundaries.size,
        time: this.time,
        activeObjects: Array.from(this.objects.values()).filter(o => o.isDynamic && !o.isSleeping).length,
        sleepingObjects: Array.from(this.objects.values()).filter(o => o.isSleeping).length
      };
    }
  }

  // === PUBLIC API FOR RUNTIME CONTROL ===

  /**
   * Set whether an object is dynamic (affected by physics) or static
   */
  setObjectDynamic(objectId: string, isDynamic: boolean): void {
    const obj = this.objects.get(objectId);
    if (obj) {
      obj.isDynamic = isDynamic;
      if (isDynamic) {
        obj.isSleeping = false;
      }
    }
  }

  /**
   * Apply an impulse force to an object
   */
  applyImpulse(objectId: string, impulse: { x: number; y: number; z: number }): void {
    const obj = this.objects.get(objectId);
    if (obj && obj.isDynamic) {
      obj.velocity.x += impulse.x / obj.mass;
      obj.velocity.y += impulse.y / obj.mass;
      obj.velocity.z += impulse.z / obj.mass;
      obj.isSleeping = false;
    }
  }

  /**
   * Set object velocity directly
   */
  setVelocity(objectId: string, velocity: { x: number; y: number; z: number }): void {
    const obj = this.objects.get(objectId);
    if (obj) {
      obj.velocity = { ...velocity };
      obj.isSleeping = false;
    }
  }

  /**
   * Wake up a sleeping object
   */
  wakeUp(objectId: string): void {
    const obj = this.objects.get(objectId);
    if (obj) {
      obj.isSleeping = false;
    }
  }

  /**
   * Put an object to sleep
   */
  sleep(objectId: string): void {
    const obj = this.objects.get(objectId);
    if (obj) {
      obj.isSleeping = true;
      obj.velocity = { x: 0, y: 0, z: 0 };
      obj.angularVelocity = { x: 0, y: 0, z: 0 };
    }
  }

  /**
   * Reset the physics simulation
   */
  reset(): void {
    this.objects.clear();
    this.boundaries.clear();
    this.time = 0;
    this.accumulator = 0;
    this.initializeDefaultBoundaries();
  }

  dispose(): void {
    this.objects.clear();
    this.boundaries.clear();
    super.dispose();
  }
}
