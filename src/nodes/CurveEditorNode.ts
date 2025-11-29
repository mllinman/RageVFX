/**
 * CurveEditorNode - Animation curve editor similar to Maya's Graph Editor
 * Version 3.5 - Animation
 * 
 * Provides bezier curves to control animation smoothness with full tangent control
 */

import { Node, DataType } from '../core/Node';

// Curve tangent type
export enum TangentType {
  AUTO = 'auto',
  SMOOTH = 'smooth',
  LINEAR = 'linear',
  STEPPED = 'stepped',
  FLAT = 'flat',
  FREE = 'free',
  CLAMPED = 'clamped',
  PLATEAU = 'plateau'
}

// Curve infinity type (behavior before first / after last keyframe)
export enum InfinityType {
  CONSTANT = 'constant',
  LINEAR = 'linear',
  CYCLE = 'cycle',
  CYCLE_OFFSET = 'cycleOffset',
  OSCILLATE = 'oscillate'
}

// Weighted tangent mode
export enum WeightedMode {
  NONE = 'none',
  IN = 'in',
  OUT = 'out',
  BOTH = 'both'
}

// Animation curve keyframe with full tangent control
export interface CurveKeyframe {
  id: string;
  time: number;           // Frame number or time
  value: number;          // Value at keyframe
  inTangent: {            // Incoming tangent
    type: TangentType;
    angle: number;        // Angle in degrees
    weight: number;       // Weight 0-1
  };
  outTangent: {           // Outgoing tangent
    type: TangentType;
    angle: number;
    weight: number;
  };
  weightedMode: WeightedMode;
  locked: boolean;        // Lock tangents together
  selected: boolean;
}

// Animation curve
export interface AnimationCurve {
  id: string;
  name: string;
  property: string;       // Property being animated (e.g., "position.x")
  nodeId: string;         // Target node ID
  keyframes: CurveKeyframe[];
  preInfinity: InfinityType;
  postInfinity: InfinityType;
  color: string;
  visible: boolean;
  locked: boolean;
}

// Curve evaluation result
export interface CurveEvaluation {
  value: number;
  velocity: number;       // Rate of change
  acceleration: number;   // Second derivative
}

export class CurveEditorNode extends Node {
  private curves: Map<string, AnimationCurve> = new Map();
  private keyframeIdCounter: number = 1;
  private curveIdCounter: number = 1;

  constructor(id: string) {
    super(id, 'CurveEditor', 'Curve Editor');
    this.metadata.category = 'Animation';
    this.metadata.description = 'Animation curve editor with bezier control similar to Maya\'s Graph Editor';
    this.metadata.version = '3.5.0';
    
    this.addInput('time', 'Time', DataType.NUMBER);
    this.addOutput('value', 'Value', DataType.NUMBER);
    this.addOutput('velocity', 'Velocity', DataType.NUMBER);
    this.addOutput('curves', 'Curve Data', DataType.ANIMATION);
    
    // Editor settings
    this.setParameter('currentTime', 0);
    this.setParameter('startTime', 0);
    this.setParameter('endTime', 100);
    this.setParameter('fps', 24);
    
    // Default tangent settings
    this.setParameter('defaultInTangent', TangentType.AUTO);
    this.setParameter('defaultOutTangent', TangentType.AUTO);
    this.setParameter('autoTangentWeight', 0.33);
    
    // Display settings
    this.setParameter('showTangents', true);
    this.setParameter('showGrid', true);
    this.setParameter('snapToGrid', false);
    this.setParameter('gridSnapValue', 1);
    this.setParameter('gridSnapTime', 1);
    
    // Value range for display
    this.setParameter('minValue', -100);
    this.setParameter('maxValue', 100);
    
    // Active curve ID
    this.setParameter('activeCurveId', '');
    
    // Initialize with a default curve
    this.createCurve('default', 'Value', '', '#ff6b35');
  }

  /**
   * Create a new animation curve
   */
  createCurve(name: string, property: string, nodeId: string, color: string = '#4a9eff'): AnimationCurve {
    const curve: AnimationCurve = {
      id: `curve_${this.curveIdCounter++}`,
      name,
      property,
      nodeId,
      keyframes: [],
      preInfinity: InfinityType.CONSTANT,
      postInfinity: InfinityType.CONSTANT,
      color,
      visible: true,
      locked: false
    };
    
    this.curves.set(curve.id, curve);
    this.setParameter('activeCurveId', curve.id);
    this.markDirty();
    
    return curve;
  }

  /**
   * Delete a curve
   */
  deleteCurve(curveId: string): boolean {
    const deleted = this.curves.delete(curveId);
    if (deleted) {
      this.markDirty();
    }
    return deleted;
  }

  /**
   * Add a keyframe to a curve
   */
  addKeyframe(curveId: string, time: number, value: number): CurveKeyframe | null {
    const curve = this.curves.get(curveId);
    if (!curve || curve.locked) return null;
    
    const defaultInTangent = this.getParameter('defaultInTangent') as TangentType;
    const defaultOutTangent = this.getParameter('defaultOutTangent') as TangentType;
    
    const keyframe: CurveKeyframe = {
      id: `kf_${this.keyframeIdCounter++}`,
      time,
      value,
      inTangent: {
        type: defaultInTangent,
        angle: 0,
        weight: 0.33
      },
      outTangent: {
        type: defaultOutTangent,
        angle: 0,
        weight: 0.33
      },
      weightedMode: WeightedMode.NONE,
      locked: true,
      selected: false
    };
    
    // Insert in sorted order
    const insertIndex = curve.keyframes.findIndex(k => k.time > time);
    if (insertIndex === -1) {
      curve.keyframes.push(keyframe);
    } else {
      curve.keyframes.splice(insertIndex, 0, keyframe);
    }
    
    // Recalculate auto tangents
    this.recalculateAutoTangents(curve);
    this.markDirty();
    
    return keyframe;
  }

  /**
   * Remove a keyframe
   */
  removeKeyframe(curveId: string, keyframeId: string): boolean {
    const curve = this.curves.get(curveId);
    if (!curve || curve.locked) return false;
    
    const index = curve.keyframes.findIndex(k => k.id === keyframeId);
    if (index === -1) return false;
    
    curve.keyframes.splice(index, 1);
    this.recalculateAutoTangents(curve);
    this.markDirty();
    
    return true;
  }

  /**
   * Update a keyframe
   */
  updateKeyframe(curveId: string, keyframeId: string, updates: Partial<CurveKeyframe>): boolean {
    const curve = this.curves.get(curveId);
    if (!curve || curve.locked) return false;
    
    const keyframe = curve.keyframes.find(k => k.id === keyframeId);
    if (!keyframe) return false;
    
    Object.assign(keyframe, updates);
    
    // Re-sort if time changed
    if (updates.time !== undefined) {
      curve.keyframes.sort((a, b) => a.time - b.time);
    }
    
    this.recalculateAutoTangents(curve);
    this.markDirty();
    
    return true;
  }

  /**
   * Set tangent type for selected keyframes
   */
  setTangentType(curveId: string, keyframeIds: string[], tangentSide: 'in' | 'out' | 'both', type: TangentType): void {
    const curve = this.curves.get(curveId);
    if (!curve || curve.locked) return;
    
    for (const kfId of keyframeIds) {
      const keyframe = curve.keyframes.find(k => k.id === kfId);
      if (!keyframe) continue;
      
      if (tangentSide === 'in' || tangentSide === 'both') {
        keyframe.inTangent.type = type;
      }
      if (tangentSide === 'out' || tangentSide === 'both') {
        keyframe.outTangent.type = type;
      }
    }
    
    this.recalculateAutoTangents(curve);
    this.markDirty();
  }

  /**
   * Recalculate auto tangents for a curve
   */
  private recalculateAutoTangents(curve: AnimationCurve): void {
    const keyframes = curve.keyframes;
    
    for (let i = 0; i < keyframes.length; i++) {
      const kf = keyframes[i];
      const prev = i > 0 ? keyframes[i - 1] : null;
      const next = i < keyframes.length - 1 ? keyframes[i + 1] : null;
      
      // Calculate auto tangents
      if (kf.inTangent.type === TangentType.AUTO || kf.inTangent.type === TangentType.SMOOTH) {
        if (prev && next) {
          // Catmull-Rom style smooth tangent
          const dt = next.time - prev.time;
          const dv = next.value - prev.value;
          kf.inTangent.angle = Math.atan2(dv, dt) * 180 / Math.PI;
        } else if (prev) {
          const dt = kf.time - prev.time;
          const dv = kf.value - prev.value;
          kf.inTangent.angle = Math.atan2(dv, dt) * 180 / Math.PI;
        } else {
          kf.inTangent.angle = 0;
        }
      }
      
      if (kf.outTangent.type === TangentType.AUTO || kf.outTangent.type === TangentType.SMOOTH) {
        if (prev && next) {
          // Catmull-Rom style smooth tangent
          const dt = next.time - prev.time;
          const dv = next.value - prev.value;
          kf.outTangent.angle = Math.atan2(dv, dt) * 180 / Math.PI;
        } else if (next) {
          const dt = next.time - kf.time;
          const dv = next.value - kf.value;
          kf.outTangent.angle = Math.atan2(dv, dt) * 180 / Math.PI;
        } else {
          kf.outTangent.angle = 0;
        }
      }
      
      // Handle flat tangents
      if (kf.inTangent.type === TangentType.FLAT) {
        kf.inTangent.angle = 0;
      }
      if (kf.outTangent.type === TangentType.FLAT) {
        kf.outTangent.angle = 0;
      }
      
      // Handle linear tangents
      if (kf.inTangent.type === TangentType.LINEAR && prev) {
        const dt = kf.time - prev.time;
        const dv = kf.value - prev.value;
        kf.inTangent.angle = Math.atan2(dv, dt) * 180 / Math.PI;
      }
      if (kf.outTangent.type === TangentType.LINEAR && next) {
        const dt = next.time - kf.time;
        const dv = next.value - kf.value;
        kf.outTangent.angle = Math.atan2(dv, dt) * 180 / Math.PI;
      }
      
      // Plateau tangent - flatten at peaks/valleys
      if (kf.inTangent.type === TangentType.PLATEAU || kf.outTangent.type === TangentType.PLATEAU) {
        const isPeak = (!prev || kf.value >= prev.value) && (!next || kf.value >= next.value);
        const isValley = (!prev || kf.value <= prev.value) && (!next || kf.value <= next.value);
        
        if (isPeak || isValley) {
          if (kf.inTangent.type === TangentType.PLATEAU) {
            kf.inTangent.angle = 0;
          }
          if (kf.outTangent.type === TangentType.PLATEAU) {
            kf.outTangent.angle = 0;
          }
        }
      }
      
      // Sync locked tangents
      if (kf.locked && kf.inTangent.type !== TangentType.FREE && kf.outTangent.type !== TangentType.FREE) {
        // Average the angles for smooth continuity
        const avgAngle = (kf.inTangent.angle + kf.outTangent.angle) / 2;
        kf.inTangent.angle = avgAngle;
        kf.outTangent.angle = avgAngle;
      }
    }
  }

  /**
   * Evaluate a curve at a specific time
   */
  evaluateCurve(curveId: string, time: number): CurveEvaluation {
    const curve = this.curves.get(curveId);
    if (!curve || curve.keyframes.length === 0) {
      return { value: 0, velocity: 0, acceleration: 0 };
    }
    
    const keyframes = curve.keyframes;
    
    // Handle time before first keyframe
    if (time <= keyframes[0].time) {
      return this.handlePreInfinity(curve, time);
    }
    
    // Handle time after last keyframe
    if (time >= keyframes[keyframes.length - 1].time) {
      return this.handlePostInfinity(curve, time);
    }
    
    // Find surrounding keyframes
    let startIdx = 0;
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        startIdx = i;
        break;
      }
    }
    
    const kf1 = keyframes[startIdx];
    const kf2 = keyframes[startIdx + 1];
    
    // Handle stepped tangent
    if (kf1.outTangent.type === TangentType.STEPPED) {
      return { value: kf1.value, velocity: 0, acceleration: 0 };
    }
    
    // Calculate segment parameters
    const dt = kf2.time - kf1.time;
    const dv = kf2.value - kf1.value;
    const t = (time - kf1.time) / dt; // Normalized time within segment
    
    // Bezier curve evaluation
    const outAngle = kf1.outTangent.angle * Math.PI / 180;
    const inAngle = kf2.inTangent.angle * Math.PI / 180;
    const outWeight = kf1.outTangent.weight;
    const inWeight = kf2.inTangent.weight;
    
    // Control points for cubic bezier
    const p0 = kf1.value;
    const p1 = kf1.value + Math.tan(outAngle) * dt * outWeight;
    const p2 = kf2.value - Math.tan(inAngle) * dt * inWeight;
    const p3 = kf2.value;
    
    // Cubic bezier evaluation
    const oneMinusT = 1 - t;
    const value = oneMinusT * oneMinusT * oneMinusT * p0 +
                  3 * oneMinusT * oneMinusT * t * p1 +
                  3 * oneMinusT * t * t * p2 +
                  t * t * t * p3;
    
    // First derivative (velocity)
    const velocity = (3 * oneMinusT * oneMinusT * (p1 - p0) +
                      6 * oneMinusT * t * (p2 - p1) +
                      3 * t * t * (p3 - p2)) / dt;
    
    // Second derivative (acceleration)
    const acceleration = (6 * oneMinusT * (p2 - 2 * p1 + p0) +
                          6 * t * (p3 - 2 * p2 + p1)) / (dt * dt);
    
    return { value, velocity, acceleration };
  }

  /**
   * Handle pre-infinity behavior
   */
  private handlePreInfinity(curve: AnimationCurve, time: number): CurveEvaluation {
    const firstKf = curve.keyframes[0];
    
    switch (curve.preInfinity) {
      case InfinityType.CONSTANT:
        return { value: firstKf.value, velocity: 0, acceleration: 0 };
        
      case InfinityType.LINEAR:
        {
          if (curve.keyframes.length < 2) {
            return { value: firstKf.value, velocity: 0, acceleration: 0 };
          }
          const secondKf = curve.keyframes[1];
          const slope = (secondKf.value - firstKf.value) / (secondKf.time - firstKf.time);
          const dt = time - firstKf.time;
          return { value: firstKf.value + slope * dt, velocity: slope, acceleration: 0 };
        }
        
      case InfinityType.CYCLE:
        {
          const lastKf = curve.keyframes[curve.keyframes.length - 1];
          const duration = lastKf.time - firstKf.time;
          if (duration <= 0) return { value: firstKf.value, velocity: 0, acceleration: 0 };
          
          let cycledTime = firstKf.time + ((time - firstKf.time) % duration);
          if (cycledTime < firstKf.time) cycledTime += duration;
          
          return this.evaluateCurve(curve.id, cycledTime);
        }
        
      case InfinityType.OSCILLATE:
        {
          const lastKf = curve.keyframes[curve.keyframes.length - 1];
          const duration = lastKf.time - firstKf.time;
          if (duration <= 0) return { value: firstKf.value, velocity: 0, acceleration: 0 };
          
          const cycleCount = Math.floor((firstKf.time - time) / duration);
          let cycledTime = firstKf.time - ((firstKf.time - time) % duration);
          
          if (cycleCount % 2 === 0) {
            cycledTime = firstKf.time + (firstKf.time - cycledTime);
          }
          
          return this.evaluateCurve(curve.id, cycledTime);
        }
        
      default:
        return { value: firstKf.value, velocity: 0, acceleration: 0 };
    }
  }

  /**
   * Handle post-infinity behavior
   */
  private handlePostInfinity(curve: AnimationCurve, time: number): CurveEvaluation {
    const lastKf = curve.keyframes[curve.keyframes.length - 1];
    const firstKf = curve.keyframes[0];
    
    switch (curve.postInfinity) {
      case InfinityType.CONSTANT:
        return { value: lastKf.value, velocity: 0, acceleration: 0 };
        
      case InfinityType.LINEAR:
        {
          if (curve.keyframes.length < 2) {
            return { value: lastKf.value, velocity: 0, acceleration: 0 };
          }
          const prevKf = curve.keyframes[curve.keyframes.length - 2];
          const slope = (lastKf.value - prevKf.value) / (lastKf.time - prevKf.time);
          const dt = time - lastKf.time;
          return { value: lastKf.value + slope * dt, velocity: slope, acceleration: 0 };
        }
        
      case InfinityType.CYCLE:
        {
          const duration = lastKf.time - firstKf.time;
          if (duration <= 0) return { value: lastKf.value, velocity: 0, acceleration: 0 };
          
          const cycledTime = firstKf.time + ((time - firstKf.time) % duration);
          return this.evaluateCurve(curve.id, cycledTime);
        }
        
      case InfinityType.CYCLE_OFFSET:
        {
          const duration = lastKf.time - firstKf.time;
          if (duration <= 0) return { value: lastKf.value, velocity: 0, acceleration: 0 };
          
          const cycleCount = Math.floor((time - firstKf.time) / duration);
          const cycledTime = firstKf.time + ((time - firstKf.time) % duration);
          const valueOffset = cycleCount * (lastKf.value - firstKf.value);
          
          const result = this.evaluateCurve(curve.id, cycledTime);
          return { ...result, value: result.value + valueOffset };
        }
        
      case InfinityType.OSCILLATE:
        {
          const duration = lastKf.time - firstKf.time;
          if (duration <= 0) return { value: lastKf.value, velocity: 0, acceleration: 0 };
          
          const cycleCount = Math.floor((time - firstKf.time) / duration);
          let cycledTime = firstKf.time + ((time - firstKf.time) % duration);
          
          if (cycleCount % 2 === 1) {
            cycledTime = lastKf.time - (cycledTime - firstKf.time);
          }
          
          return this.evaluateCurve(curve.id, cycledTime);
        }
        
      default:
        return { value: lastKf.value, velocity: 0, acceleration: 0 };
    }
  }

  /**
   * Flatten selected keyframes (make tangents horizontal)
   */
  flattenKeyframes(curveId: string, keyframeIds: string[]): void {
    const curve = this.curves.get(curveId);
    if (!curve || curve.locked) return;
    
    for (const kfId of keyframeIds) {
      const keyframe = curve.keyframes.find(k => k.id === kfId);
      if (keyframe) {
        keyframe.inTangent.angle = 0;
        keyframe.outTangent.angle = 0;
        keyframe.inTangent.type = TangentType.FLAT;
        keyframe.outTangent.type = TangentType.FLAT;
      }
    }
    
    this.markDirty();
  }

  /**
   * Break tangents (allow in/out to differ)
   */
  breakTangents(curveId: string, keyframeIds: string[]): void {
    const curve = this.curves.get(curveId);
    if (!curve || curve.locked) return;
    
    for (const kfId of keyframeIds) {
      const keyframe = curve.keyframes.find(k => k.id === kfId);
      if (keyframe) {
        keyframe.locked = false;
        keyframe.inTangent.type = TangentType.FREE;
        keyframe.outTangent.type = TangentType.FREE;
      }
    }
    
    this.markDirty();
  }

  /**
   * Unify tangents (lock in/out together)
   */
  unifyTangents(curveId: string, keyframeIds: string[]): void {
    const curve = this.curves.get(curveId);
    if (!curve || curve.locked) return;
    
    for (const kfId of keyframeIds) {
      const keyframe = curve.keyframes.find(k => k.id === kfId);
      if (keyframe) {
        keyframe.locked = true;
        // Average the angles
        const avgAngle = (keyframe.inTangent.angle + keyframe.outTangent.angle) / 2;
        keyframe.inTangent.angle = avgAngle;
        keyframe.outTangent.angle = avgAngle;
      }
    }
    
    this.markDirty();
  }

  /**
   * Get all curves
   */
  getCurves(): AnimationCurve[] {
    return Array.from(this.curves.values());
  }

  /**
   * Get a specific curve
   */
  getCurve(curveId: string): AnimationCurve | undefined {
    return this.curves.get(curveId);
  }

  /**
   * Bake curve to keyframes at regular intervals
   */
  bakeCurve(curveId: string, startTime: number, endTime: number, interval: number): CurveKeyframe[] {
    const bakedKeyframes: CurveKeyframe[] = [];
    
    for (let time = startTime; time <= endTime; time += interval) {
      const eval_ = this.evaluateCurve(curveId, time);
      bakedKeyframes.push({
        id: `baked_${this.keyframeIdCounter++}`,
        time,
        value: eval_.value,
        inTangent: { type: TangentType.LINEAR, angle: 0, weight: 0.33 },
        outTangent: { type: TangentType.LINEAR, angle: 0, weight: 0.33 },
        weightedMode: WeightedMode.NONE,
        locked: true,
        selected: false
      });
    }
    
    return bakedKeyframes;
  }

  /**
   * Simplify curve by removing redundant keyframes
   */
  simplifyCurve(curveId: string, tolerance: number): void {
    const curve = this.curves.get(curveId);
    if (!curve || curve.locked || curve.keyframes.length < 3) return;
    
    const simplified: CurveKeyframe[] = [curve.keyframes[0]];
    
    for (let i = 1; i < curve.keyframes.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = curve.keyframes[i];
      const next = curve.keyframes[i + 1];
      
      // Linear interpolation between prev and next
      const t = (curr.time - prev.time) / (next.time - prev.time);
      const interpolated = prev.value + (next.value - prev.value) * t;
      
      // Keep keyframe if it deviates significantly
      if (Math.abs(curr.value - interpolated) > tolerance) {
        simplified.push(curr);
      }
    }
    
    simplified.push(curve.keyframes[curve.keyframes.length - 1]);
    curve.keyframes = simplified;
    
    this.recalculateAutoTangents(curve);
    this.markDirty();
  }

  async process(): Promise<void> {
    const time = this.inputs.get('time')?.value as number ?? this.getParameter('currentTime');
    const activeCurveId = this.getParameter('activeCurveId') as string;
    
    let evaluation: CurveEvaluation = { value: 0, velocity: 0, acceleration: 0 };
    
    if (activeCurveId && this.curves.has(activeCurveId)) {
      evaluation = this.evaluateCurve(activeCurveId, time);
    }
    
    // Set outputs
    const valueOutput = this.outputs.get('value');
    if (valueOutput) {
      valueOutput.value = evaluation.value;
    }
    
    const velocityOutput = this.outputs.get('velocity');
    if (velocityOutput) {
      velocityOutput.value = evaluation.velocity;
    }
    
    const curvesOutput = this.outputs.get('curves');
    if (curvesOutput) {
      curvesOutput.value = {
        curves: Array.from(this.curves.values()),
        currentTime: time,
        evaluation
      };
    }
  }

  /**
   * Serialize curves for saving
   */
  serializeCurves(): string {
    const data = {
      curves: Array.from(this.curves.entries()),
      keyframeIdCounter: this.keyframeIdCounter,
      curveIdCounter: this.curveIdCounter
    };
    return JSON.stringify(data);
  }

  /**
   * Deserialize curves from saved data
   */
  deserializeCurves(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      this.curves = new Map(data.curves);
      this.keyframeIdCounter = data.keyframeIdCounter;
      this.curveIdCounter = data.curveIdCounter;
      this.markDirty();
    } catch (e) {
      console.error('Failed to deserialize curves:', e);
    }
  }
}
