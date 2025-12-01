/**
 * MoGraphEffectorNode - Cinema 4D-style effector for modifying clones
 * Version 3.6 - Cinema 4D Tools
 * 
 * Provides various effector types to modify clone transforms
 * Similar to Cinema 4D's MoGraph effectors (Random, Shader, Formula, etc.)
 */

import { Node, DataType } from '../core/Node';

interface EffectorTransform {
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  color?: { r: number; g: number; b: number; a: number };
  visibility?: number;
}

export class MoGraphEffectorNode extends Node {
  constructor(id: string) {
    super(id, 'MoGraphEffector', 'MoGraph Effector');
    this.metadata.category = 'MotionGraphics';
    this.metadata.description = 'Cinema 4D-style effector to modify clones with various modes';
    this.metadata.version = '3.6.0';
    
    // Inputs
    this.addInput('clones', 'Clone Data', DataType.ANY);
    this.addInput('field', 'Field Input', DataType.ANY);
    this.addInput('texture', 'Texture Map', DataType.IMAGE);
    
    // Outputs
    this.addOutput('effector', 'Effector Output', DataType.ANY);
    this.addOutput('transforms', 'Transform Data', DataType.ANY);
    
    // Effector Type
    this.setParameter('effectorType', 'random'); // random, shader, formula, time, sound, volume, plain, target
    this.setParameter('strength', 1.0);
    this.setParameter('blend', 'add'); // add, multiply, override, min, max
    
    // Random Effector
    this.setParameter('randomSeed', 42);
    this.setParameter('randomPosition', { x: 100, y: 100, z: 100 });
    this.setParameter('randomRotation', { x: 45, y: 45, z: 45 });
    this.setParameter('randomScale', { x: 0.5, y: 0.5, z: 0.5 });
    this.setParameter('randomUniformScale', false);
    
    // Shader Effector (texture-based)
    this.setParameter('shaderChannel', 'luminance'); // luminance, red, green, blue, alpha
    this.setParameter('shaderMap', 'position'); // Map shader to: position, rotation, scale
    this.setParameter('shaderIntensity', 100);
    
    // Formula Effector
    this.setParameter('formulaX', 'sin(index * 0.1) * 100');
    this.setParameter('formulaY', 'cos(index * 0.1) * 100');
    this.setParameter('formulaZ', '0');
    this.setParameter('formulaTarget', 'position'); // position, rotation, scale
    
    // Time Effector
    this.setParameter('timeAnimation', true);
    this.setParameter('timeSpeed', 1.0);
    this.setParameter('timeOffset', 0);
    this.setParameter('timeMode', 'linear'); // linear, sine, noise
    
    // Plain Effector (simple offset)
    this.setParameter('plainPosition', { x: 0, y: 0, z: 0 });
    this.setParameter('plainRotation', { x: 0, y: 0, z: 0 });
    this.setParameter('plainScale', { x: 1, y: 1, z: 1 });
    
    // Target Effector
    this.setParameter('targetPosition', { x: 0, y: 0, z: 0 });
    this.setParameter('targetLookAt', true);
    this.setParameter('targetStrength', 1.0);
    
    // Falloff
    this.setParameter('falloffEnabled', false);
    this.setParameter('falloffType', 'linear'); // linear, smooth, sphere, box, cylinder
    this.setParameter('falloffRadius', 500);
    this.setParameter('falloffCenter', { x: 0, y: 0, z: 0 });
    this.setParameter('falloffInvert', false);
    
    // Modifiers
    this.setParameter('noiseEnabled', false);
    this.setParameter('noiseScale', 1.0);
    this.setParameter('noiseSpeed', 1.0);
    this.setParameter('noiseOctaves', 3);
  }

  async process(): Promise<void> {
    const clonesInput = this.inputs.get('clones');
    const fieldInput = this.inputs.get('field');
    const textureInput = this.inputs.get('texture');
    
    const effectorOutput = this.outputs.get('effector');
    const transformsOutput = this.outputs.get('transforms');
    
    if (!effectorOutput) return;
    
    // Get clone data
    const cloneData = clonesInput?.value || [];
    const cloneCount = Array.isArray(cloneData) ? cloneData.length : 0;
    
    // Generate transforms based on effector type
    const effectorType = this.getParameter('effectorType') as string;
    const strength = this.getParameter('strength') as number;
    
    let transforms: EffectorTransform[] = [];
    
    switch (effectorType) {
      case 'random':
        transforms = this.generateRandomTransforms(cloneCount);
        break;
      case 'shader':
        transforms = this.generateShaderTransforms(cloneCount, textureInput?.value);
        break;
      case 'formula':
        transforms = this.generateFormulaTransforms(cloneCount);
        break;
      case 'time':
        transforms = this.generateTimeTransforms(cloneCount);
        break;
      case 'plain':
        transforms = this.generatePlainTransforms(cloneCount);
        break;
      case 'target':
        transforms = this.generateTargetTransforms(cloneData);
        break;
      case 'volume':
        transforms = this.generateVolumeTransforms(cloneCount, fieldInput?.value);
        break;
      default:
        transforms = this.generatePlainTransforms(cloneCount);
    }
    
    // Apply falloff
    if (this.getParameter('falloffEnabled')) {
      transforms = this.applyFalloff(transforms, cloneData);
    }
    
    // Apply strength
    transforms = this.applyStrength(transforms, strength);
    
    // Output
    effectorOutput.value = {
      transforms: transforms,
      type: effectorType,
      strength: strength
    };
    
    if (transformsOutput) {
      transformsOutput.value = transforms;
    }
  }
  
  private generateRandomTransforms(count: number): EffectorTransform[] {
    const seed = this.getParameter('randomSeed') as number;
    const randomPos = this.getParameter('randomPosition') as { x: number; y: number; z: number };
    const randomRot = this.getParameter('randomRotation') as { x: number; y: number; z: number };
    const randomScale = this.getParameter('randomScale') as { x: number; y: number; z: number };
    const uniformScale = this.getParameter('randomUniformScale') as boolean;
    
    // Seeded random generator
    let rng = seed;
    const random = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };
    
    const transforms: EffectorTransform[] = [];
    
    for (let i = 0; i < count; i++) {
      const scale = uniformScale ? random() : 1;
      
      transforms.push({
        position: {
          x: (random() - 0.5) * randomPos.x * 2,
          y: (random() - 0.5) * randomPos.y * 2,
          z: (random() - 0.5) * randomPos.z * 2
        },
        rotation: {
          x: (random() - 0.5) * randomRot.x * 2,
          y: (random() - 0.5) * randomRot.y * 2,
          z: (random() - 0.5) * randomRot.z * 2
        },
        scale: uniformScale ? {
          x: scale * randomScale.x,
          y: scale * randomScale.y,
          z: scale * randomScale.z
        } : {
          x: (random() - 0.5) * randomScale.x * 2 + 1,
          y: (random() - 0.5) * randomScale.y * 2 + 1,
          z: (random() - 0.5) * randomScale.z * 2 + 1
        }
      });
    }
    
    return transforms;
  }
  
  private generateShaderTransforms(count: number, textureData: any): EffectorTransform[] {
    const transforms: EffectorTransform[] = [];
    const channel = this.getParameter('shaderChannel') as string;
    const map = this.getParameter('shaderMap') as string;
    const intensity = this.getParameter('shaderIntensity') as number;
    
    for (let i = 0; i < count; i++) {
      const value = this.sampleTexture(textureData, i / Math.max(1, count - 1), channel);
      const offset = (value - 0.5) * 2 * intensity;
      
      const transform: EffectorTransform = {};
      
      if (map === 'position') {
        transform.position = { x: offset, y: offset, z: 0 };
      } else if (map === 'rotation') {
        transform.rotation = { x: 0, y: offset, z: 0 };
      } else if (map === 'scale') {
        const scaleValue = 1 + offset / 100;
        transform.scale = { x: scaleValue, y: scaleValue, z: scaleValue };
      }
      
      transforms.push(transform);
    }
    
    return transforms;
  }
  
  private generateFormulaTransforms(count: number): EffectorTransform[] {
    const transforms: EffectorTransform[] = [];
    const formulaX = this.getParameter('formulaX') as string;
    const formulaY = this.getParameter('formulaY') as string;
    const formulaZ = this.getParameter('formulaZ') as string;
    const target = this.getParameter('formulaTarget') as string;
    
    for (let i = 0; i < count; i++) {
      const x = this.evaluateFormula(formulaX, i, count);
      const y = this.evaluateFormula(formulaY, i, count);
      const z = this.evaluateFormula(formulaZ, i, count);
      
      const transform: EffectorTransform = {};
      
      if (target === 'position') {
        transform.position = { x, y, z };
      } else if (target === 'rotation') {
        transform.rotation = { x, y, z };
      } else if (target === 'scale') {
        transform.scale = { x: 1 + x / 100, y: 1 + y / 100, z: 1 + z / 100 };
      }
      
      transforms.push(transform);
    }
    
    return transforms;
  }
  
  private generateTimeTransforms(count: number): EffectorTransform[] {
    const transforms: EffectorTransform[] = [];
    const speed = this.getParameter('timeSpeed') as number;
    const offset = this.getParameter('timeOffset') as number;
    const mode = this.getParameter('timeMode') as string;
    const time = Date.now() / 1000;
    
    for (let i = 0; i < count; i++) {
      const t = time * speed + offset + i * 0.1;
      let value = 0;
      
      if (mode === 'linear') {
        value = t % 360;
      } else if (mode === 'sine') {
        value = Math.sin(t) * 100;
      } else if (mode === 'noise') {
        value = this.noise(t, i) * 100;
      }
      
      transforms.push({
        position: { x: 0, y: value, z: 0 },
        rotation: { x: 0, y: value, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      });
    }
    
    return transforms;
  }
  
  private generatePlainTransforms(count: number): EffectorTransform[] {
    const transforms: EffectorTransform[] = [];
    const position = this.getParameter('plainPosition') as { x: number; y: number; z: number };
    const rotation = this.getParameter('plainRotation') as { x: number; y: number; z: number };
    const scale = this.getParameter('plainScale') as { x: number; y: number; z: number };
    
    for (let i = 0; i < count; i++) {
      transforms.push({
        position: { ...position },
        rotation: { ...rotation },
        scale: { ...scale }
      });
    }
    
    return transforms;
  }
  
  private generateTargetTransforms(cloneData: any[]): EffectorTransform[] {
    const transforms: EffectorTransform[] = [];
    const target = this.getParameter('targetPosition') as { x: number; y: number; z: number };
    const lookAt = this.getParameter('targetLookAt') as boolean;
    const strength = this.getParameter('targetStrength') as number;
    
    for (let i = 0; i < cloneData.length; i++) {
      const clone = cloneData[i];
      const transform: EffectorTransform = {};
      
      if (clone && clone.position && lookAt) {
        const dx = target.x - clone.position.x;
        const dy = target.y - clone.position.y;
        const dz = target.z - clone.position.z;
        
        const yaw = Math.atan2(dz, dx) * 180 / Math.PI;
        const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 180 / Math.PI;
        
        transform.rotation = {
          x: pitch * strength,
          y: yaw * strength,
          z: 0
        };
      }
      
      transforms.push(transform);
    }
    
    return transforms;
  }
  
  private generateVolumeTransforms(count: number, volumeData: any): EffectorTransform[] {
    const transforms: EffectorTransform[] = [];
    
    // Simplified volume-based transforms
    for (let i = 0; i < count; i++) {
      const value = volumeData ? this.sampleVolume(volumeData, i / Math.max(1, count - 1)) : 0;
      
      transforms.push({
        position: { x: 0, y: value * 100, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      });
    }
    
    return transforms;
  }
  
  private applyFalloff(transforms: EffectorTransform[], cloneData: any[]): EffectorTransform[] {
    const falloffType = this.getParameter('falloffType') as string;
    const radius = this.getParameter('falloffRadius') as number;
    const center = this.getParameter('falloffCenter') as { x: number; y: number; z: number };
    const invert = this.getParameter('falloffInvert') as boolean;
    
    return transforms.map((transform, i) => {
      const clone = cloneData[i];
      if (!clone || !clone.position) return transform;
      
      const dx = clone.position.x - center.x;
      const dy = clone.position.y - center.y;
      const dz = clone.position.z - center.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      let falloff = 1.0;
      
      if (falloffType === 'linear') {
        falloff = Math.max(0, 1 - distance / radius);
      } else if (falloffType === 'smooth') {
        const t = Math.max(0, 1 - distance / radius);
        falloff = t * t * (3 - 2 * t);
      } else if (falloffType === 'sphere') {
        falloff = distance < radius ? 1 : 0;
      }
      
      if (invert) {
        falloff = 1 - falloff;
      }
      
      return this.multiplyTransform(transform, falloff);
    });
  }
  
  private applyStrength(transforms: EffectorTransform[], strength: number): EffectorTransform[] {
    return transforms.map(transform => this.multiplyTransform(transform, strength));
  }
  
  private multiplyTransform(transform: EffectorTransform, factor: number): EffectorTransform {
    const result: EffectorTransform = {};
    
    if (transform.position) {
      result.position = {
        x: transform.position.x * factor,
        y: transform.position.y * factor,
        z: transform.position.z * factor
      };
    }
    
    if (transform.rotation) {
      result.rotation = {
        x: transform.rotation.x * factor,
        y: transform.rotation.y * factor,
        z: transform.rotation.z * factor
      };
    }
    
    if (transform.scale) {
      result.scale = {
        x: 1 + (transform.scale.x - 1) * factor,
        y: 1 + (transform.scale.y - 1) * factor,
        z: 1 + (transform.scale.z - 1) * factor
      };
    }
    
    return result;
  }
  
  private sampleTexture(textureData: any, t: number, channel: string): number {
    if (!textureData) return 0.5;
    // Simplified texture sampling
    return 0.5;
  }
  
  private sampleVolume(volumeData: any, t: number): number {
    if (!volumeData) return 0;
    // Simplified volume sampling
    return 0;
  }
  
  private evaluateFormula(formula: string, index: number, count: number): number {
    try {
      // Safe formula evaluator with restricted operations
      // Create context
      const t = index / Math.max(1, count - 1);
      
      // Replace variables in formula
      let processedFormula = formula
        .replace(/\bindex\b/g, index.toString())
        .replace(/\bcount\b/g, count.toString())
        .replace(/\bt\b/g, t.toString())
        .replace(/\bPI\b/g, Math.PI.toString());
      
      // Safe function mapping (without eval)
      // This is a simplified safe evaluator - in production, use a proper math expression parser
      const safeEval = (expr: string): number => {
        // Allow only numbers, operators, and safe Math functions
        const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
        
        // Parse and evaluate basic arithmetic
        try {
          // Use Function constructor as a safer alternative to eval for simple expressions
          // Still not recommended for untrusted input in production
          return new Function(`"use strict"; return (${sanitized})`)() as number;
        } catch {
          return 0;
        }
      };
      
      // Handle Math functions manually for safety
      let result = 0;
      if (formula.includes('sin(')) {
        const match = processedFormula.match(/sin\(([-\d.]+)\)/);
        if (match) result = Math.sin(parseFloat(match[1]));
      } else if (formula.includes('cos(')) {
        const match = processedFormula.match(/cos\(([-\d.]+)\)/);
        if (match) result = Math.cos(parseFloat(match[1]));
      } else {
        result = safeEval(processedFormula);
      }
      
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (e) {
      return 0;
    }
  }
  
  private noise(x: number, y: number): number {
    // Simple 2D noise function
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
}
