/**
 * AnimationTimelineNode - Animation timeline to adjust length and keyframes for VFX nodes
 */

import { Node, DataType } from '../core/Node';

export interface Keyframe {
  frame: number;
  value: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier' | 'step';
  bezierHandles?: { inX: number; inY: number; outX: number; outY: number };
}

export interface AnimationTrack {
  name: string;
  property: string;
  keyframes: Keyframe[];
  enabled: boolean;
}

export class AnimationTimelineNode extends Node {
  private tracks: Map<string, AnimationTrack> = new Map();
  private currentFrame: number = 0;

  constructor(id: string) {
    super(id, 'AnimationTimeline', 'Animation Timeline');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Animation timeline for keyframe-based animation control';
    this.metadata.version = '2.1.0';
    
    this.addInput('frame', 'Current Frame', DataType.NUMBER);
    this.addOutput('value', 'Animated Value', DataType.NUMBER);
    this.addOutput('normalizedTime', 'Normalized Time', DataType.NUMBER);
    this.addOutput('trackValues', 'Track Values', DataType.ANY);
    
    // Timeline settings
    this.setParameter('startFrame', 0);
    this.setParameter('endFrame', 100);
    this.setParameter('fps', 24);
    this.setParameter('loop', false);
    this.setParameter('pingPong', false);
    this.setParameter('playbackSpeed', 1.0);
    
    // Default track for main value
    this.setParameter('defaultValue', 0);
    this.setParameter('defaultEasing', 'ease-in-out');
    
    // Initialize with a default track
    this.tracks.set('main', {
      name: 'Main',
      property: 'value',
      keyframes: [
        { frame: 0, value: 0, easing: 'ease-in-out' },
        { frame: 100, value: 1, easing: 'ease-in-out' }
      ],
      enabled: true
    });
  }

  async process(): Promise<void> {
    const frameInput = this.inputs.get('frame');
    const valueOutput = this.outputs.get('value');
    const normalizedTimeOutput = this.outputs.get('normalizedTime');
    const trackValuesOutput = this.outputs.get('trackValues');
    
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    const loop = this.getParameter('loop');
    const pingPong = this.getParameter('pingPong');
    const playbackSpeed = this.getParameter('playbackSpeed');
    
    // Get current frame from input or use internal frame counter
    let frame = frameInput?.value ?? this.currentFrame;
    frame *= playbackSpeed;
    
    // Handle looping and ping-pong
    const duration = endFrame - startFrame;
    if (duration > 0) {
      if (loop || pingPong) {
        if (pingPong) {
          const cycle = Math.floor((frame - startFrame) / duration);
          const t = ((frame - startFrame) % duration) / duration;
          frame = cycle % 2 === 0 
            ? startFrame + t * duration 
            : endFrame - t * duration;
        } else {
          frame = startFrame + ((frame - startFrame) % duration);
        }
      } else {
        frame = Math.max(startFrame, Math.min(endFrame, frame));
      }
    }
    
    this.currentFrame = frame;
    
    // Calculate normalized time
    const normalizedTime = duration > 0 
      ? (frame - startFrame) / duration 
      : 0;
    
    if (normalizedTimeOutput) {
      normalizedTimeOutput.value = normalizedTime;
    }
    
    // Evaluate all tracks at current frame
    const trackValues: Record<string, number> = {};
    
    for (const [trackId, track] of this.tracks) {
      if (track.enabled && track.keyframes.length > 0) {
        trackValues[trackId] = this.evaluateTrack(track, frame);
      }
    }
    
    // Output main track value
    if (valueOutput) {
      valueOutput.value = trackValues['main'] ?? this.getParameter('defaultValue');
    }
    
    // Output all track values
    if (trackValuesOutput) {
      trackValuesOutput.value = trackValues;
    }
    
    this.currentFrame++;
  }

  /**
   * Evaluate a track at a specific frame
   */
  private evaluateTrack(track: AnimationTrack, frame: number): number {
    const keyframes = track.keyframes.sort((a, b) => a.frame - b.frame);
    
    if (keyframes.length === 0) {
      return this.getParameter('defaultValue');
    }
    
    if (keyframes.length === 1) {
      return keyframes[0].value;
    }
    
    // Find surrounding keyframes
    let prevKey: Keyframe | null = null;
    let nextKey: Keyframe | null = null;
    
    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].frame <= frame) {
        prevKey = keyframes[i];
      }
      if (keyframes[i].frame >= frame && !nextKey) {
        nextKey = keyframes[i];
      }
    }
    
    // Handle edge cases
    if (!prevKey) return keyframes[0].value;
    if (!nextKey) return keyframes[keyframes.length - 1].value;
    if (prevKey.frame === nextKey.frame) return prevKey.value;
    
    // Calculate interpolation factor
    const t = (frame - prevKey.frame) / (nextKey.frame - prevKey.frame);
    
    // Apply easing
    const easedT = this.applyEasing(t, prevKey.easing, prevKey.bezierHandles);
    
    // Linear interpolation between values
    return prevKey.value + (nextKey.value - prevKey.value) * easedT;
  }

  /**
   * Apply easing function to interpolation factor
   */
  private applyEasing(
    t: number, 
    easing: Keyframe['easing'], 
    bezierHandles?: Keyframe['bezierHandles']
  ): number {
    switch (easing) {
      case 'linear':
        return t;
        
      case 'ease-in':
        return t * t;
        
      case 'ease-out':
        return 1 - Math.pow(1 - t, 2);
        
      case 'ease-in-out':
        return t < 0.5 
          ? 2 * t * t 
          : 1 - Math.pow(-2 * t + 2, 2) / 2;
        
      case 'bezier':
        if (bezierHandles) {
          return this.cubicBezier(
            t,
            bezierHandles.outX,
            bezierHandles.outY,
            bezierHandles.inX,
            bezierHandles.inY
          );
        }
        return t;
        
      case 'step':
        return t < 1 ? 0 : 1;
        
      default:
        return t;
    }
  }

  /**
   * Cubic bezier interpolation
   */
  private cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
    // Simplified cubic bezier calculation
    const cx = 3.0 * x1;
    const bx = 3.0 * (x2 - x1) - cx;
    const ax = 1.0 - cx - bx;
    
    const cy = 3.0 * y1;
    const by = 3.0 * (y2 - y1) - cy;
    const ay = 1.0 - cy - by;
    
    // Solve for t given x using Newton-Raphson
    let currentT = t;
    for (let i = 0; i < 8; i++) {
      const currentX = ((ax * currentT + bx) * currentT + cx) * currentT;
      const currentSlope = (3.0 * ax * currentT + 2.0 * bx) * currentT + cx;
      
      if (Math.abs(currentSlope) < 1e-6) break;
      currentT -= (currentX - t) / currentSlope;
    }
    
    return ((ay * currentT + by) * currentT + cy) * currentT;
  }

  /**
   * Add a keyframe to a track
   */
  addKeyframe(trackId: string, keyframe: Keyframe): void {
    const track = this.tracks.get(trackId);
    if (track) {
      // Remove existing keyframe at same frame
      track.keyframes = track.keyframes.filter(k => k.frame !== keyframe.frame);
      track.keyframes.push(keyframe);
      track.keyframes.sort((a, b) => a.frame - b.frame);
      this.markDirty();
    }
  }

  /**
   * Remove a keyframe from a track
   */
  removeKeyframe(trackId: string, frame: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.keyframes = track.keyframes.filter(k => k.frame !== frame);
      this.markDirty();
    }
  }

  /**
   * Add a new animation track
   */
  addTrack(trackId: string, name: string, property: string): void {
    this.tracks.set(trackId, {
      name,
      property,
      keyframes: [],
      enabled: true
    });
    this.markDirty();
  }

  /**
   * Remove an animation track
   */
  removeTrack(trackId: string): void {
    this.tracks.delete(trackId);
    this.markDirty();
  }

  /**
   * Get all tracks
   */
  getTracks(): Map<string, AnimationTrack> {
    return new Map(this.tracks);
  }

  /**
   * Set the current frame
   */
  setFrame(frame: number): void {
    this.currentFrame = frame;
    this.markDirty();
  }

  /**
   * Get the current frame
   */
  getFrame(): number {
    return this.currentFrame;
  }

  /**
   * Reset timeline to start
   */
  reset(): void {
    this.currentFrame = this.getParameter('startFrame');
    this.markDirty();
  }

  /**
   * Get timeline duration in frames
   */
  getDuration(): number {
    return this.getParameter('endFrame') - this.getParameter('startFrame');
  }

  /**
   * Serialize timeline data
   */
  serialize(): Record<string, unknown> {
    return {
      ...super.serialize(),
      tracks: Array.from(this.tracks.entries()),
      currentFrame: this.currentFrame
    };
  }
}
