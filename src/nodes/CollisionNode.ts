/**
 * CollisionNode - Collision detection for physics simulation
 * Version 2.0 - Physics Simulation
 */

import { Node, DataType } from '../core/Node';

export interface Collider {
  id: string;
  type: 'sphere' | 'box' | 'capsule' | 'plane' | 'mesh';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  dimensions: { x: number; y: number; z: number };
  isTrigger: boolean;
  friction: number;
  restitution: number;
}

export interface CollisionContact {
  colliderA: string;
  colliderB: string;
  point: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  depth: number;
  impulse: number;
}

export class CollisionNode extends Node {
  private colliders: Map<string, Collider> = new Map();
  private contacts: CollisionContact[] = [];

  constructor(id: string) {
    super(id, 'Collision', 'Collision Detection');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Collision detection and response';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('collidersA', 'Colliders A', DataType.ANY);
    this.addInput('collidersB', 'Colliders B', DataType.ANY);
    this.addInput('mesh', 'Mesh Collider', DataType.GEOMETRY_3D);
    
    // Outputs
    this.addOutput('contacts', 'Contacts', DataType.ANY);
    this.addOutput('collisions', 'Collision Events', DataType.ANY);
    this.addOutput('triggers', 'Trigger Events', DataType.ANY);
    
    // Detection settings
    this.setParameter('broadPhase', 'aabb'); // aabb, spatial_hash, bvh
    this.setParameter('narrowPhase', 'gjk'); // gjk, sat
    this.setParameter('continuous', false);
    this.setParameter('layers', 0xFFFFFFFF); // Collision layers bitmask
    
    // Response settings
    this.setParameter('responseEnabled', true);
    this.setParameter('friction', 0.5);
    this.setParameter('restitution', 0.3);
    
    // Collision shape
    this.setParameter('shape', 'sphere');
    this.setParameter('position', { x: 0, y: 0, z: 0 });
    this.setParameter('rotation', { x: 0, y: 0, z: 0 });
    this.setParameter('dimensions', { x: 1, y: 1, z: 1 });
    this.setParameter('isTrigger', false);
    
    // Debug visualization
    this.setParameter('debugDraw', false);
    this.setParameter('showContacts', false);
    this.setParameter('showAABB', false);
  }

  async process(): Promise<void> {
    this.contacts = [];
    const collisionEvents: any[] = [];
    const triggerEvents: any[] = [];
    
    // Collect all colliders
    const allColliders: Collider[] = [];
    
    // Add colliders from inputs
    const collidersAInput = this.inputs.get('collidersA');
    if (collidersAInput?.value) {
      const colliders = Array.isArray(collidersAInput.value) ? collidersAInput.value : [collidersAInput.value];
      colliders.forEach((c: any, i: number) => {
        allColliders.push(this.normalizeCollider(c, `a_${i}`));
      });
    }
    
    const collidersBInput = this.inputs.get('collidersB');
    if (collidersBInput?.value) {
      const colliders = Array.isArray(collidersBInput.value) ? collidersBInput.value : [collidersBInput.value];
      colliders.forEach((c: any, i: number) => {
        allColliders.push(this.normalizeCollider(c, `b_${i}`));
      });
    }
    
    // Add node's own collider
    const nodeCollider: Collider = {
      id: this.metadata.id,
      type: this.getParameter('shape'),
      position: this.getParameter('position'),
      rotation: this.eulerToQuaternion(this.getParameter('rotation')),
      dimensions: this.getParameter('dimensions'),
      isTrigger: this.getParameter('isTrigger'),
      friction: this.getParameter('friction'),
      restitution: this.getParameter('restitution')
    };
    allColliders.push(nodeCollider);
    
    // Update colliders map
    this.colliders.clear();
    for (const collider of allColliders) {
      this.colliders.set(collider.id, collider);
    }
    
    // Broad phase collision detection
    const potentialPairs = this.broadPhase(allColliders);
    
    // Narrow phase collision detection
    for (const [a, b] of potentialPairs) {
      const contact = this.narrowPhase(a, b);
      
      if (contact) {
        if (a.isTrigger || b.isTrigger) {
          triggerEvents.push({
            type: 'trigger',
            colliderA: a.id,
            colliderB: b.id,
            point: contact.point
          });
        } else {
          this.contacts.push(contact);
          collisionEvents.push({
            type: 'collision',
            colliderA: a.id,
            colliderB: b.id,
            contact
          });
        }
      }
    }
    
    // Output contacts
    const contactsOutput = this.outputs.get('contacts');
    if (contactsOutput) {
      contactsOutput.value = this.contacts;
    }
    
    // Output collision events
    const collisionsOutput = this.outputs.get('collisions');
    if (collisionsOutput) {
      collisionsOutput.value = collisionEvents;
    }
    
    // Output trigger events
    const triggersOutput = this.outputs.get('triggers');
    if (triggersOutput) {
      triggersOutput.value = triggerEvents;
    }
  }

  private normalizeCollider(input: any, defaultId: string): Collider {
    return {
      id: input.id || defaultId,
      type: input.type || 'sphere',
      position: input.position || { x: 0, y: 0, z: 0 },
      rotation: input.rotation || { x: 0, y: 0, z: 0, w: 1 },
      dimensions: input.dimensions || input.size || { x: 1, y: 1, z: 1 },
      isTrigger: input.isTrigger || false,
      friction: input.friction || 0.5,
      restitution: input.restitution || 0.3
    };
  }

  private broadPhase(colliders: Collider[]): Array<[Collider, Collider]> {
    const pairs: Array<[Collider, Collider]> = [];
    const broadPhaseType = this.getParameter('broadPhase');
    
    if (broadPhaseType === 'aabb') {
      // AABB broad phase
      for (let i = 0; i < colliders.length; i++) {
        for (let j = i + 1; j < colliders.length; j++) {
          const a = colliders[i];
          const b = colliders[j];
          
          const aabbA = this.getAABB(a);
          const aabbB = this.getAABB(b);
          
          if (this.aabbIntersect(aabbA, aabbB)) {
            pairs.push([a, b]);
          }
        }
      }
    } else {
      // Simple O(n²) for other methods (placeholder)
      for (let i = 0; i < colliders.length; i++) {
        for (let j = i + 1; j < colliders.length; j++) {
          pairs.push([colliders[i], colliders[j]]);
        }
      }
    }
    
    return pairs;
  }

  private getAABB(collider: Collider): { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } {
    const pos = collider.position;
    const dim = collider.dimensions;
    
    switch (collider.type) {
      case 'sphere': {
        const radius = dim.x / 2;
        return {
          min: { x: pos.x - radius, y: pos.y - radius, z: pos.z - radius },
          max: { x: pos.x + radius, y: pos.y + radius, z: pos.z + radius }
        };
      }
        
      case 'box':
        return {
          min: { x: pos.x - dim.x / 2, y: pos.y - dim.y / 2, z: pos.z - dim.z / 2 },
          max: { x: pos.x + dim.x / 2, y: pos.y + dim.y / 2, z: pos.z + dim.z / 2 }
        };
        
      default:
        return {
          min: { x: pos.x - 1, y: pos.y - 1, z: pos.z - 1 },
          max: { x: pos.x + 1, y: pos.y + 1, z: pos.z + 1 }
        };
    }
  }

  private aabbIntersect(
    a: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
    b: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }
  ): boolean {
    return (
      a.min.x <= b.max.x && a.max.x >= b.min.x &&
      a.min.y <= b.max.y && a.max.y >= b.min.y &&
      a.min.z <= b.max.z && a.max.z >= b.min.z
    );
  }

  private narrowPhase(a: Collider, b: Collider): CollisionContact | null {
    // Sphere vs Sphere
    if (a.type === 'sphere' && b.type === 'sphere') {
      return this.sphereSphereTest(a, b);
    }
    
    // Sphere vs Box
    if (a.type === 'sphere' && b.type === 'box') {
      return this.sphereBoxTest(a, b);
    }
    if (a.type === 'box' && b.type === 'sphere') {
      const contact = this.sphereBoxTest(b, a);
      if (contact) {
        // Swap and flip normal
        contact.normal.x = -contact.normal.x;
        contact.normal.y = -contact.normal.y;
        contact.normal.z = -contact.normal.z;
        [contact.colliderA, contact.colliderB] = [contact.colliderB, contact.colliderA];
      }
      return contact;
    }
    
    // Box vs Box
    if (a.type === 'box' && b.type === 'box') {
      return this.boxBoxTest(a, b);
    }
    
    // Sphere vs Plane
    if (a.type === 'sphere' && b.type === 'plane') {
      return this.spherePlaneTest(a, b);
    }
    
    return null;
  }

  private sphereSphereTest(a: Collider, b: Collider): CollisionContact | null {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dz = b.position.z - a.position.z;
    
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const radiusA = a.dimensions.x / 2;
    const radiusB = b.dimensions.x / 2;
    const minDist = radiusA + radiusB;
    
    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      
      return {
        colliderA: a.id,
        colliderB: b.id,
        point: {
          x: a.position.x + nx * radiusA,
          y: a.position.y + ny * radiusA,
          z: a.position.z + nz * radiusA
        },
        normal: { x: nx, y: ny, z: nz },
        depth: minDist - dist,
        impulse: 0
      };
    }
    
    return null;
  }

  private sphereBoxTest(sphere: Collider, box: Collider): CollisionContact | null {
    const radius = sphere.dimensions.x / 2;
    const halfExtents = {
      x: box.dimensions.x / 2,
      y: box.dimensions.y / 2,
      z: box.dimensions.z / 2
    };
    
    // Find closest point on box to sphere center
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
        nx /= dist;
        ny /= dist;
        nz /= dist;
      } else {
        // Sphere center inside box
        nx = 0;
        ny = 1;
        nz = 0;
      }
      
      return {
        colliderA: sphere.id,
        colliderB: box.id,
        point: {
          x: box.position.x + closestPoint.x,
          y: box.position.y + closestPoint.y,
          z: box.position.z + closestPoint.z
        },
        normal: { x: nx, y: ny, z: nz },
        depth: radius - dist,
        impulse: 0
      };
    }
    
    return null;
  }

  private boxBoxTest(a: Collider, b: Collider): CollisionContact | null {
    // Simplified AABB vs AABB test
    const aabbA = this.getAABB(a);
    const aabbB = this.getAABB(b);
    
    if (!this.aabbIntersect(aabbA, aabbB)) {
      return null;
    }
    
    // Calculate overlap on each axis
    const overlapX = Math.min(aabbA.max.x - aabbB.min.x, aabbB.max.x - aabbA.min.x);
    const overlapY = Math.min(aabbA.max.y - aabbB.min.y, aabbB.max.y - aabbA.min.y);
    const overlapZ = Math.min(aabbA.max.z - aabbB.min.z, aabbB.max.z - aabbA.min.z);
    
    // Find minimum overlap axis
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
    
    // Contact point at center of overlap
    const point = {
      x: (Math.max(aabbA.min.x, aabbB.min.x) + Math.min(aabbA.max.x, aabbB.max.x)) / 2,
      y: (Math.max(aabbA.min.y, aabbB.min.y) + Math.min(aabbA.max.y, aabbB.max.y)) / 2,
      z: (Math.max(aabbA.min.z, aabbB.min.z) + Math.min(aabbA.max.z, aabbB.max.z)) / 2
    };
    
    return {
      colliderA: a.id,
      colliderB: b.id,
      point,
      normal,
      depth,
      impulse: 0
    };
  }

  private spherePlaneTest(sphere: Collider, plane: Collider): CollisionContact | null {
    const radius = sphere.dimensions.x / 2;
    
    // Assume plane normal is up (0, 1, 0) and plane is at plane.position.y
    const dist = sphere.position.y - plane.position.y;
    
    if (dist < radius) {
      return {
        colliderA: sphere.id,
        colliderB: plane.id,
        point: {
          x: sphere.position.x,
          y: plane.position.y,
          z: sphere.position.z
        },
        normal: { x: 0, y: 1, z: 0 },
        depth: radius - dist,
        impulse: 0
      };
    }
    
    return null;
  }

  private eulerToQuaternion(euler: { x: number; y: number; z: number }): { x: number; y: number; z: number; w: number } {
    const cx = Math.cos(euler.x * 0.5);
    const sx = Math.sin(euler.x * 0.5);
    const cy = Math.cos(euler.y * 0.5);
    const sy = Math.sin(euler.y * 0.5);
    const cz = Math.cos(euler.z * 0.5);
    const sz = Math.sin(euler.z * 0.5);
    
    return {
      x: sx * cy * cz - cx * sy * sz,
      y: cx * sy * cz + sx * cy * sz,
      z: cx * cy * sz - sx * sy * cz,
      w: cx * cy * cz + sx * sy * sz
    };
  }

  dispose(): void {
    this.colliders.clear();
    this.contacts = [];
    super.dispose();
  }
}
