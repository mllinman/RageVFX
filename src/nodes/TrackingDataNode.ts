/**
 * TrackingDataNode - Store and manage tracking data
 */

import { Node, DataType } from '../core/Node';

interface TrackPoint {
  frame: number;
  x: number;
  y: number;
  confidence: number;
}

export class TrackingDataNode extends Node {
  private trackData: TrackPoint[] = [];

  constructor(id: string) {
    super(id, 'TrackingData', 'Tracking Data');
    this.metadata.category = 'Tracking';
    this.metadata.description = 'Store and manage tracking data';
    this.metadata.version = '1.1.0';
    
    this.addInput('track', 'Track Input', DataType.VECTOR);
    this.addOutput('position', 'Position', DataType.VECTOR);
    this.addOutput('data', 'Data', DataType.ANY);
    
    this.setParameter('currentFrame', 0);
    this.setParameter('smoothing', 0);
    this.setParameter('interpolation', 'linear'); // linear, cubic, none
  }

  async process(): Promise<void> {
    const trackInput = this.inputs.get('track');
    const currentFrame = this.getParameter('currentFrame');
    const smoothing = this.getParameter('smoothing');
    
    if (trackInput?.value) {
      // Add new tracking point
      const point: TrackPoint = {
        frame: currentFrame,
        x: trackInput.value.x,
        y: trackInput.value.y,
        confidence: trackInput.value.confidence || 1.0
      };
      this.trackData.push(point);
    }

    // Get position for current frame
    const position = this.getPositionAtFrame(currentFrame, smoothing);

    const posOutput = this.outputs.get('position');
    if (posOutput) {
      posOutput.value = position;
    }

    const dataOutput = this.outputs.get('data');
    if (dataOutput) {
      dataOutput.value = this.trackData;
    }
  }

  private getPositionAtFrame(frame: number, smoothing: number): { x: number; y: number } {
    // Find closest tracking points
    const before = this.trackData.filter(p => p.frame <= frame).sort((a, b) => b.frame - a.frame)[0];
    const after = this.trackData.filter(p => p.frame >= frame).sort((a, b) => a.frame - b.frame)[0];

    if (!before && !after) {
      return { x: 0, y: 0 };
    }

    if (!after || before.frame === frame) {
      return { x: before.x, y: before.y };
    }

    if (!before) {
      return { x: after.x, y: after.y };
    }

    // Linear interpolation
    const t = (frame - before.frame) / (after.frame - before.frame);
    const x = before.x + (after.x - before.x) * t;
    const y = before.y + (after.y - before.y) * t;

    // Apply smoothing if needed
    if (smoothing > 0) {
      const window = Math.floor(smoothing);
      const nearby = this.trackData.filter(p => 
        Math.abs(p.frame - frame) <= window
      );
      
      if (nearby.length > 0) {
        const avgX = nearby.reduce((sum, p) => sum + p.x, 0) / nearby.length;
        const avgY = nearby.reduce((sum, p) => sum + p.y, 0) / nearby.length;
        return { x: avgX, y: avgY };
      }
    }

    return { x, y };
  }

  clearTracking(): void {
    this.trackData = [];
  }
}
