/**
 * KeyframeManager - Manages keyframe animation for node parameters
 * Provides timeline-based animation support for all node parameters
 */

export interface Keyframe {
  frame: number;
  value: any;
  interpolation: 'linear' | 'bezier' | 'step' | 'smooth';
  easing?: string;
}

export interface AnimationTrack {
  nodeId: string;
  parameterKey: string;
  keyframes: Keyframe[];
  enabled: boolean;
}

export class KeyframeManager {
  private tracks: Map<string, AnimationTrack[]> = new Map();
  private currentFrame: number = 0;
  private fps: number = 24;
  private startFrame: number = 1;
  private endFrame: number = 100;

  constructor() {
    this.tracks = new Map();
  }

  /**
   * Set the current frame
   */
  setCurrentFrame(frame: number): void {
    this.currentFrame = frame;
  }

  /**
   * Get the current frame
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * Set timeline range
   */
  setTimelineRange(start: number, end: number, fps: number = 24): void {
    this.startFrame = start;
    this.endFrame = end;
    this.fps = fps;
  }

  /**
   * Get timeline range
   */
  getTimelineRange(): { start: number; end: number; fps: number } {
    return {
      start: this.startFrame,
      end: this.endFrame,
      fps: this.fps
    };
  }

  /**
   * Add a keyframe for a node parameter
   */
  addKeyframe(
    nodeId: string,
    parameterKey: string,
    frame: number,
    value: any,
    interpolation: 'linear' | 'bezier' | 'step' | 'smooth' = 'linear'
  ): void {
    const trackKey = `${nodeId}_${parameterKey}`;
    
    if (!this.tracks.has(nodeId)) {
      this.tracks.set(nodeId, []);
    }

    const nodeTracks = this.tracks.get(nodeId)!;
    let track = nodeTracks.find(t => t.parameterKey === parameterKey);

    if (!track) {
      track = {
        nodeId,
        parameterKey,
        keyframes: [],
        enabled: true
      };
      nodeTracks.push(track);
    }

    // Remove existing keyframe at this frame if any
    track.keyframes = track.keyframes.filter(k => k.frame !== frame);

    // Add new keyframe
    track.keyframes.push({
      frame,
      value,
      interpolation,
      easing: 'ease-in-out'
    });

    // Sort keyframes by frame
    track.keyframes.sort((a, b) => a.frame - b.frame);
  }

  /**
   * Remove a keyframe
   */
  removeKeyframe(nodeId: string, parameterKey: string, frame: number): void {
    const nodeTracks = this.tracks.get(nodeId);
    if (!nodeTracks) return;

    const track = nodeTracks.find(t => t.parameterKey === parameterKey);
    if (!track) return;

    track.keyframes = track.keyframes.filter(k => k.frame !== frame);
  }

  /**
   * Get interpolated value for a parameter at the current frame
   */
  getValueAtFrame(nodeId: string, parameterKey: string, frame: number = this.currentFrame): any {
    const nodeTracks = this.tracks.get(nodeId);
    if (!nodeTracks) return null;

    const track = nodeTracks.find(t => t.parameterKey === parameterKey);
    if (!track || !track.enabled || track.keyframes.length === 0) return null;

    // Find surrounding keyframes
    let prevKeyframe: Keyframe | null = null;
    let nextKeyframe: Keyframe | null = null;

    for (let i = 0; i < track.keyframes.length; i++) {
      const kf = track.keyframes[i];
      
      if (kf.frame === frame) {
        return kf.value;
      }
      
      if (kf.frame < frame) {
        prevKeyframe = kf;
      } else if (kf.frame > frame && !nextKeyframe) {
        nextKeyframe = kf;
        break;
      }
    }

    // If no surrounding keyframes, return the closest one
    if (!prevKeyframe && !nextKeyframe) {
      return null;
    }
    if (!prevKeyframe) {
      return nextKeyframe!.value;
    }
    if (!nextKeyframe) {
      return prevKeyframe.value;
    }

    // Interpolate between keyframes
    const t = (frame - prevKeyframe.frame) / (nextKeyframe.frame - prevKeyframe.frame);
    return this.interpolate(prevKeyframe, nextKeyframe, t);
  }

  /**
   * Interpolate between two keyframes
   */
  private interpolate(prev: Keyframe, next: Keyframe, t: number): any {
    const prevValue = prev.value;
    const nextValue = next.value;

    // Handle different interpolation types
    switch (prev.interpolation) {
      case 'step':
        return prevValue;

      case 'linear':
        if (typeof prevValue === 'number' && typeof nextValue === 'number') {
          return prevValue + (nextValue - prevValue) * t;
        }
        // For objects (like colors, vectors), interpolate each component
        if (typeof prevValue === 'object' && typeof nextValue === 'object') {
          const result: any = {};
          for (const key in prevValue) {
            if (typeof prevValue[key] === 'number' && typeof nextValue[key] === 'number') {
              result[key] = prevValue[key] + (nextValue[key] - prevValue[key]) * t;
            } else {
              result[key] = t < 0.5 ? prevValue[key] : nextValue[key];
            }
          }
          return result;
        }
        return t < 0.5 ? prevValue : nextValue;

      case 'smooth':
        // Smooth step (ease-in-out)
        const smoothT = t * t * (3 - 2 * t);
        if (typeof prevValue === 'number' && typeof nextValue === 'number') {
          return prevValue + (nextValue - prevValue) * smoothT;
        }
        if (typeof prevValue === 'object' && typeof nextValue === 'object') {
          const result: any = {};
          for (const key in prevValue) {
            if (typeof prevValue[key] === 'number' && typeof nextValue[key] === 'number') {
              result[key] = prevValue[key] + (nextValue[key] - prevValue[key]) * smoothT;
            } else {
              result[key] = smoothT < 0.5 ? prevValue[key] : nextValue[key];
            }
          }
          return result;
        }
        return smoothT < 0.5 ? prevValue : nextValue;

      case 'bezier':
        // Simple bezier (could be enhanced with control points)
        const bezierT = t * t * t * (t * (t * 6 - 15) + 10);
        if (typeof prevValue === 'number' && typeof nextValue === 'number') {
          return prevValue + (nextValue - prevValue) * bezierT;
        }
        if (typeof prevValue === 'object' && typeof nextValue === 'object') {
          const result: any = {};
          for (const key in prevValue) {
            if (typeof prevValue[key] === 'number' && typeof nextValue[key] === 'number') {
              result[key] = prevValue[key] + (nextValue[key] - prevValue[key]) * bezierT;
            } else {
              result[key] = bezierT < 0.5 ? prevValue[key] : nextValue[key];
            }
          }
          return result;
        }
        return bezierT < 0.5 ? prevValue : nextValue;

      default:
        return prevValue;
    }
  }

  /**
   * Get all tracks for a node
   */
  getNodeTracks(nodeId: string): AnimationTrack[] {
    return this.tracks.get(nodeId) || [];
  }

  /**
   * Get all keyframes for a specific parameter
   */
  getKeyframes(nodeId: string, parameterKey: string): Keyframe[] {
    const nodeTracks = this.tracks.get(nodeId);
    if (!nodeTracks) return [];

    const track = nodeTracks.find(t => t.parameterKey === parameterKey);
    return track ? track.keyframes : [];
  }

  /**
   * Enable/disable a track
   */
  setTrackEnabled(nodeId: string, parameterKey: string, enabled: boolean): void {
    const nodeTracks = this.tracks.get(nodeId);
    if (!nodeTracks) return;

    const track = nodeTracks.find(t => t.parameterKey === parameterKey);
    if (track) {
      track.enabled = enabled;
    }
  }

  /**
   * Clear all keyframes for a node
   */
  clearNodeKeyframes(nodeId: string): void {
    this.tracks.delete(nodeId);
  }

  /**
   * Clear all keyframes
   */
  clearAllKeyframes(): void {
    this.tracks.clear();
  }

  /**
   * Export animation data
   */
  exportAnimation(): any {
    const data: any = {
      timeline: {
        start: this.startFrame,
        end: this.endFrame,
        fps: this.fps
      },
      tracks: []
    };

    this.tracks.forEach((nodeTracks, nodeId) => {
      nodeTracks.forEach(track => {
        data.tracks.push({
          nodeId: track.nodeId,
          parameterKey: track.parameterKey,
          enabled: track.enabled,
          keyframes: track.keyframes
        });
      });
    });

    return data;
  }

  /**
   * Import animation data
   */
  importAnimation(data: any): void {
    if (data.timeline) {
      this.startFrame = data.timeline.start;
      this.endFrame = data.timeline.end;
      this.fps = data.timeline.fps;
    }

    if (data.tracks) {
      this.tracks.clear();
      data.tracks.forEach((trackData: any) => {
        const nodeId = trackData.nodeId;
        if (!this.tracks.has(nodeId)) {
          this.tracks.set(nodeId, []);
        }
        this.tracks.get(nodeId)!.push({
          nodeId: trackData.nodeId,
          parameterKey: trackData.parameterKey,
          enabled: trackData.enabled !== false,
          keyframes: trackData.keyframes
        });
      });
    }
  }
}
