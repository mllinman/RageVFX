/**
 * TimeNode - Outputs time and frame information
 */

import { Node, DataType } from '../core/Node';

export class TimeNode extends Node {
  private frame: number = 0;
  private startTime: number = Date.now();

  constructor(id: string) {
    super(id, 'Time', 'Time');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Output time and frame information';
    
    this.addOutput('frame', 'Frame', DataType.NUMBER);
    this.addOutput('time', 'Time', DataType.NUMBER);
    this.addOutput('normalizedTime', 'Normalized Time', DataType.NUMBER);
    this.addOutput('fps', 'FPS', DataType.NUMBER);
    
    this.setParameter('fps', 24);
    this.setParameter('duration', 100); // frames
    this.setParameter('loop', true);
    this.setParameter('startFrame', 0);
    this.setParameter('endFrame', 100);
  }

  async process(): Promise<void> {
    const fps = this.getParameter('fps');
    const loop = this.getParameter('loop');
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    
    // Calculate current frame
    let currentFrame = this.frame;
    
    if (loop) {
      currentFrame = startFrame + ((this.frame - startFrame) % (endFrame - startFrame + 1));
    } else {
      currentFrame = Math.min(this.frame, endFrame);
    }
    
    // Calculate time values
    const time = currentFrame / fps;
    const normalizedTime = (currentFrame - startFrame) / (endFrame - startFrame);
    
    // Set outputs
    const frameOutput = this.outputs.get('frame');
    if (frameOutput) {
      frameOutput.value = currentFrame;
    }
    
    const timeOutput = this.outputs.get('time');
    if (timeOutput) {
      timeOutput.value = time;
    }
    
    const normalizedOutput = this.outputs.get('normalizedTime');
    if (normalizedOutput) {
      normalizedOutput.value = normalizedTime;
    }
    
    const fpsOutput = this.outputs.get('fps');
    if (fpsOutput) {
      fpsOutput.value = fps;
    }
    
    // Increment frame
    this.frame++;
  }

  setFrame(frame: number): void {
    this.frame = frame;
    this.markDirty();
  }

  reset(): void {
    this.frame = 0;
    this.startTime = Date.now();
  }
}
