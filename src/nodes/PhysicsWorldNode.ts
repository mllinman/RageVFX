/**
 * PhysicsWorldNode - Global physics world management
 * Version 3.1 - Advanced Physics System
 * 
 * Manages the physics simulation world and global settings
 */

import { Node, DataType } from '../core/Node';

export interface PhysicsWorldSettings {
  // Time settings
  fixedTimeStep: number;
  maxSubsteps: number;
  timeScale: number;
  
  // Gravity
  gravity: { x: number; y: number; z: number };
  
  // Solver settings
  solverIterations: number;
  velocitySolverIterations: number;
  
  // Collision settings
  broadphase: 'naive' | 'aabb' | 'octree' | 'spatial_hash';
  allowSleep: boolean;
  sleepThreshold: number;
  
  // World bounds
  bounds: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}

export class PhysicsWorldNode extends Node {
  private worldSettings: PhysicsWorldSettings;
  private paused: boolean = false;
  private stepCount: number = 0;

  constructor(id: string) {
    super(id, 'PhysicsWorld', 'Physics World');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Global physics world settings and management';
    this.metadata.version = '3.1.0';
    
    // Outputs
    this.addOutput('worldSettings', 'World Settings', DataType.ANY);
    this.addOutput('statistics', 'Statistics', DataType.ANY);
    
    // === SIMULATION CONTROLS (Sliders/Checkboxes) ===
    
    // Time controls
    this.setParameter('enabled', true); // Checkbox
    this.setParameter('paused', false); // Checkbox
    this.setParameter('timeScale', 1.0); // Slider 0.0-4.0
    this.setParameter('fixedTimeStep', 1/60); // Slider 1/120 to 1/30
    this.setParameter('maxSubsteps', 8); // Slider 1-16
    
    // Gravity controls
    this.setParameter('gravityEnabled', true); // Checkbox
    this.setParameter('gravityX', 0); // Slider -50 to 50
    this.setParameter('gravityY', -9.81); // Slider -50 to 50
    this.setParameter('gravityZ', 0); // Slider -50 to 50
    this.setParameter('gravityMultiplier', 1.0); // Slider 0.0-5.0
    
    // Solver controls
    this.setParameter('solverIterations', 10); // Slider 1-50
    this.setParameter('velocitySolverIterations', 8); // Slider 1-20
    this.setParameter('solverTolerance', 0.001); // Slider 0.0001-0.01
    
    // Collision controls
    this.setParameter('collisionDetection', true); // Checkbox
    this.setParameter('broadphaseAlgorithm', 'aabb'); // Dropdown: naive, aabb, octree, spatial_hash
    this.setParameter('narrowphaseAlgorithm', 'gjk'); // Dropdown: gjk, sat
    this.setParameter('continuousCollision', false); // Checkbox
    this.setParameter('collisionMargin', 0.01); // Slider 0.0-0.1
    
    // Sleep controls
    this.setParameter('sleepEnabled', true); // Checkbox
    this.setParameter('sleepThreshold', 0.1); // Slider 0.01-1.0
    this.setParameter('sleepTimeThreshold', 0.5); // Slider 0.1-5.0
    
    // World bounds
    this.setParameter('worldBoundsEnabled', true); // Checkbox
    this.setParameter('worldMinX', -100); // Slider
    this.setParameter('worldMinY', -10); // Slider
    this.setParameter('worldMinZ', -100); // Slider
    this.setParameter('worldMaxX', 100); // Slider
    this.setParameter('worldMaxY', 100); // Slider
    this.setParameter('worldMaxZ', 100); // Slider
    
    // Performance controls
    this.setParameter('multithreaded', false); // Checkbox
    this.setParameter('gpuAccelerated', false); // Checkbox
    this.setParameter('maxObjects', 10000); // Slider 100-100000
    
    // Debug controls
    this.setParameter('debugMode', false); // Checkbox
    this.setParameter('showColliders', false); // Checkbox
    this.setParameter('showVelocities', false); // Checkbox
    this.setParameter('showContactPoints', false); // Checkbox
    this.setParameter('showBroadphase', false); // Checkbox
    
    // Initialize world settings
    this.worldSettings = this.buildWorldSettings();
  }

  private buildWorldSettings(): PhysicsWorldSettings {
    const gravityMult = this.getParameter('gravityMultiplier');
    
    return {
      fixedTimeStep: this.getParameter('fixedTimeStep'),
      maxSubsteps: this.getParameter('maxSubsteps'),
      timeScale: this.getParameter('timeScale'),
      gravity: {
        x: this.getParameter('gravityX') * gravityMult,
        y: this.getParameter('gravityY') * gravityMult,
        z: this.getParameter('gravityZ') * gravityMult
      },
      solverIterations: this.getParameter('solverIterations'),
      velocitySolverIterations: this.getParameter('velocitySolverIterations'),
      broadphase: this.getParameter('broadphaseAlgorithm'),
      allowSleep: this.getParameter('sleepEnabled'),
      sleepThreshold: this.getParameter('sleepThreshold'),
      bounds: {
        min: {
          x: this.getParameter('worldMinX'),
          y: this.getParameter('worldMinY'),
          z: this.getParameter('worldMinZ')
        },
        max: {
          x: this.getParameter('worldMaxX'),
          y: this.getParameter('worldMaxY'),
          z: this.getParameter('worldMaxZ')
        }
      }
    };
  }

  async process(): Promise<void> {
    this.paused = this.getParameter('paused');
    
    if (!this.getParameter('enabled')) {
      return;
    }
    
    // Update world settings
    this.worldSettings = this.buildWorldSettings();
    this.stepCount++;
    
    // Output world settings
    const settingsOutput = this.outputs.get('worldSettings');
    if (settingsOutput) {
      settingsOutput.value = this.worldSettings;
    }
    
    // Output statistics
    const statsOutput = this.outputs.get('statistics');
    if (statsOutput) {
      statsOutput.value = {
        stepCount: this.stepCount,
        timeScale: this.worldSettings.timeScale,
        gravity: this.worldSettings.gravity,
        paused: this.paused,
        debugMode: this.getParameter('debugMode')
      };
    }
  }

  // Public API
  
  pause(): void {
    this.setParameter('paused', true);
    this.paused = true;
  }
  
  resume(): void {
    this.setParameter('paused', false);
    this.paused = false;
  }
  
  isPaused(): boolean {
    return this.paused;
  }
  
  setGravity(x: number, y: number, z: number): void {
    this.setParameter('gravityX', x);
    this.setParameter('gravityY', y);
    this.setParameter('gravityZ', z);
  }
  
  setTimeScale(scale: number): void {
    this.setParameter('timeScale', Math.max(0, Math.min(4, scale)));
  }
  
  getWorldSettings(): PhysicsWorldSettings {
    return this.worldSettings;
  }
  
  reset(): void {
    this.stepCount = 0;
    this.paused = false;
    this.setParameter('paused', false);
  }

  dispose(): void {
    super.dispose();
  }
}
