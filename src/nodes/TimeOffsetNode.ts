/**
 * TimeOffsetNode - Offset input in time
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class TimeOffsetNode extends Node {
  private frameBuffer: ImageData[] = [];
  private maxBufferSize: number = 100;

  constructor(id: string) {
    super(id, 'TimeOffset', 'Time Offset');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Offset input frames in time';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('offset', 'Offset', DataType.NUMBER);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('offset', 0); // Negative = delay, Positive = advance
    this.setParameter('mode', 'frames'); // frames, seconds
    this.setParameter('fps', 24);
    this.setParameter('behavior', 'hold'); // hold, loop, black
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    const offsetInput = this.inputs.get('offset');
    
    if (!output) {
      return;
    }

    const inputImage = input?.value as ImageData | undefined;
    const offsetValue = offsetInput?.value ?? this.getParameter('offset');
    const mode = this.getParameter('mode');
    const fps = this.getParameter('fps');
    const behavior = this.getParameter('behavior');
    
    // Convert offset to frames
    const offsetFrames = Math.round(mode === 'seconds' ? offsetValue * fps : offsetValue);
    
    // Store current frame in buffer
    if (inputImage) {
      // Clone the frame data
      const clonedFrame: ImageData = {
        width: inputImage.width,
        height: inputImage.height,
        channels: inputImage.channels,
        data: new Uint8Array(inputImage.data),
        format: inputImage.format
      };
      
      this.frameBuffer.push(clonedFrame);
      
      // Limit buffer size
      while (this.frameBuffer.length > this.maxBufferSize) {
        this.frameBuffer.shift();
      }
    }
    
    // Calculate which frame to output
    let outputIndex = this.frameBuffer.length - 1 + offsetFrames;
    
    if (outputIndex < 0) {
      // Requesting a frame before the start
      switch (behavior) {
        case 'hold':
          outputIndex = 0;
          break;
        case 'loop':
          outputIndex = ((outputIndex % this.frameBuffer.length) + this.frameBuffer.length) % this.frameBuffer.length;
          break;
        case 'black':
          // Output black frame
          if (inputImage) {
            output.value = this.createBlackFrame(inputImage.width, inputImage.height);
          }
          return;
      }
    } else if (outputIndex >= this.frameBuffer.length) {
      // Requesting a frame after the end
      switch (behavior) {
        case 'hold':
          outputIndex = this.frameBuffer.length - 1;
          break;
        case 'loop':
          outputIndex = outputIndex % this.frameBuffer.length;
          break;
        case 'black':
          if (inputImage) {
            output.value = this.createBlackFrame(inputImage.width, inputImage.height);
          }
          return;
      }
    }
    
    // Output the requested frame
    if (outputIndex >= 0 && outputIndex < this.frameBuffer.length) {
      output.value = this.frameBuffer[outputIndex];
    } else if (inputImage) {
      output.value = inputImage;
    }
  }

  private createBlackFrame(width: number, height: number): ImageData {
    const data = new Uint8Array(width * height * 4);
    data.fill(0);
    // Set alpha to 255
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 255;
    }
    
    return {
      width,
      height,
      channels: 4,
      data,
      format: 'rgba'
    };
  }

  reset(): void {
    this.frameBuffer = [];
  }
}
