/**
 * RigidBodyNode - Rigid body physics simulation
 * Version 2.0 - Physics Simulation
 */

import { Node, DataType } from '../core/Node';

export interface RigidBody {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  mass: number;
  friction: number;
  restitution: number;
  shape: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'mesh';
  dimensions: { x: number; y: number; z: number };
  isStatic: boolean;
  isKinematic: boolean;
  isSleeping: boolean;
}

export class RigidBodyNode extends Node {
  private bodies: Map<string, RigidBody> = new Map();
  private time: number = 0;
  private accumulator: number = 0;
  private readonly fixedDeltaTime: number = 1 / 60;

  constructor(id: string) {
    super(id, 'RigidBody', 'Rigid Body');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Rigid body physics simulation';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addInput('colliders', 'Colliders', DataType.ANY);
    this.addInput('forces', 'Forces', DataType.ANY);
    
    // Outputs
    this.addOutput('bodies', 'Bodies', DataType.ANY);
    this.addOutput('transforms', 'Transforms', DataType.ANY);
    this.addOutput('collisions', 'Collisions', DataType.ANY);
    
    // Body properties
    this.setParameter('mass', 1.0);
    this.setParameter('friction', 0.5);
    this.setParameter('restitution', 0.3);
    this.setParameter('linearDamping', 0.01);
    this.setParameter('angularDamping', 0.05);
    
    // Shape
    this.setParameter('shape', 'box');
    this.setParameter('dimensions', { x: 1, y: 1, z: 1 });
    this.setParameter('convexHull', false);
    
    // Body type
    this.setParameter('isStatic', false);
    this.setParameter('isKinematic', false);
    this.setParameter('isTrigger', false);
    
    // Initial state
    this.setParameter('position', { x: 0, y: 0, z: 0 });
    this.setParameter('rotation', { x: 0, y: 0, z: 0 });
    this.setParameter('initialVelocity', { x: 0, y: 0, z: 0 });
    this.setParameter('initialAngularVelocity', { x: 0, y: 0, z: 0 });
    
    // Simulation settings
    this.setParameter('gravity', { x: 0, y: -9.81, z: 0 });
    this.setParameter('substeps', 4);
    this.setParameter('solverIterations', 10);
    this.setParameter('sleepThreshold', 0.005);
    this.setParameter('continuousCollision', true);
  }

  async process(): Promise<void> {
    const deltaTime = 0.016; // Default 60fps
    this.time += deltaTime;
    this.accumulator += deltaTime;
    
    const substeps = this.getParameter('substeps');
    const gravity = this.getParameter('gravity');
    const linearDamping = this.getParameter('linearDamping');
    const angularDamping = this.getParameter('angularDamping');
    const sleepThreshold = this.getParameter('sleepThreshold');
    
    // Initialize body if not exists
    const bodyId = this.metadata.id + '_body';
    if (!this.bodies.has(bodyId)) {
      const pos = this.getParameter('position');
      const rot = this.getParameter('rotation');
      const vel = this.getParameter('initialVelocity');
      const angVel = this.getParameter('initialAngularVelocity');
      
      this.bodies.set(bodyId, {
        id: bodyId,
        position: { ...pos },
        rotation: this.eulerToQuaternion(rot.x, rot.y, rot.z),
        velocity: { ...vel },
        angularVelocity: { ...angVel },
        mass: this.getParameter('mass'),
        friction: this.getParameter('friction'),
        restitution: this.getParameter('restitution'),
        shape: this.getParameter('shape'),
        dimensions: this.getParameter('dimensions'),
        isStatic: this.getParameter('isStatic'),
        isKinematic: this.getParameter('isKinematic'),
        isSleeping: false
      });
    }
    
    // Apply external forces
    const forcesInput = this.inputs.get('forces');
    if (forcesInput?.value) {
      const forces = Array.isArray(forcesInput.value) ? forcesInput.value : [forcesInput.value];
      forces.forEach((force: any) => {
        this.applyForce(bodyId, force);
      });
    }
    
    // Fixed timestep physics update
    while (this.accumulator >= this.fixedDeltaTime) {
      const dt = this.fixedDeltaTime / substeps;
      
      for (let i = 0; i < substeps; i++) {
        this.bodies.forEach((body) => {
          if (body.isStatic || body.isSleeping) return;
          
          // Apply gravity
          if (!body.isKinematic) {
            body.velocity.x += gravity.x * dt;
            body.velocity.y += gravity.y * dt;
            body.velocity.z += gravity.z * dt;
          }
          
          // Apply damping
          body.velocity.x *= (1 - linearDamping);
          body.velocity.y *= (1 - linearDamping);
          body.velocity.z *= (1 - linearDamping);
          body.angularVelocity.x *= (1 - angularDamping);
          body.angularVelocity.y *= (1 - angularDamping);
          body.angularVelocity.z *= (1 - angularDamping);
          
          // Integrate position
          body.position.x += body.velocity.x * dt;
          body.position.y += body.velocity.y * dt;
          body.position.z += body.velocity.z * dt;
          
          // Integrate rotation
          this.integrateRotation(body, dt);
          
          // Check for sleep
          const speed = Math.sqrt(
            body.velocity.x * body.velocity.x +
            body.velocity.y * body.velocity.y +
            body.velocity.z * body.velocity.z
          );
          const angSpeed = Math.sqrt(
            body.angularVelocity.x * body.angularVelocity.x +
            body.angularVelocity.y * body.angularVelocity.y +
            body.angularVelocity.z * body.angularVelocity.z
          );
          
          if (speed < sleepThreshold && angSpeed < sleepThreshold) {
            body.isSleeping = true;
          }
        });
        
        // Collision detection and resolution would happen here
        this.detectCollisions();
      }
      
      this.accumulator -= this.fixedDeltaTime;
    }
    
    // Output bodies
    const bodiesOutput = this.outputs.get('bodies');
    if (bodiesOutput) {
      bodiesOutput.value = Array.from(this.bodies.values());
    }
    
    // Output transforms for rendering
    const transformsOutput = this.outputs.get('transforms');
    if (transformsOutput) {
      const transforms: any[] = [];
      this.bodies.forEach((body) => {
        transforms.push({
          id: body.id,
          position: body.position,
          rotation: body.rotation,
          scale: body.dimensions
        });
      });
      transformsOutput.value = transforms;
    }
    
    // Output collision events
    const collisionsOutput = this.outputs.get('collisions');
    if (collisionsOutput) {
      collisionsOutput.value = []; // Would contain collision events
    }
  }

  private applyForce(bodyId: string, force: any): void {
    const body = this.bodies.get(bodyId);
    if (!body || body.isStatic) return;
    
    const dt = this.fixedDeltaTime;
    const acceleration = {
      x: force.x / body.mass,
      y: force.y / body.mass,
      z: force.z / body.mass
    };
    
    body.velocity.x += acceleration.x * dt;
    body.velocity.y += acceleration.y * dt;
    body.velocity.z += acceleration.z * dt;
    
    // Wake up body
    body.isSleeping = false;
  }

  private integrateRotation(body: RigidBody, dt: number): void {
    const q = body.rotation;
    const w = body.angularVelocity;
    
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
    q.x /= len;
    q.y /= len;
    q.z /= len;
    q.w /= len;
  }

  private eulerToQuaternion(x: number, y: number, z: number): { x: number; y: number; z: number; w: number } {
    const cx = Math.cos(x * 0.5);
    const sx = Math.sin(x * 0.5);
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cz = Math.cos(z * 0.5);
    const sz = Math.sin(z * 0.5);
    
    return {
      x: sx * cy * cz - cx * sy * sz,
      y: cx * sy * cz + sx * cy * sz,
      z: cx * cy * sz - sx * sy * cz,
      w: cx * cy * cz + sx * sy * sz
    };
  }

  private detectCollisions(): void {
    // Simple ground collision for demonstration
    this.bodies.forEach((body) => {
      if (body.isStatic) return;
      
      const groundY = 0;
      const radius = body.dimensions.y / 2;
      
      if (body.position.y - radius < groundY) {
        // Position correction
        body.position.y = groundY + radius;
        
        // Velocity reflection
        body.velocity.y = -body.velocity.y * body.restitution;
        
        // Friction
        body.velocity.x *= (1 - body.friction);
        body.velocity.z *= (1 - body.friction);
      }
    });
  }

  reset(): void {
    this.bodies.clear();
    this.time = 0;
    this.accumulator = 0;
  }

  dispose(): void {
    this.bodies.clear();
    super.dispose();
  }
}
