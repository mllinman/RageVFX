/**
 * FrameHoldNode - Hold a specific frame
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class FrameHoldNode extends Node {
  private heldFrame: ImageData | null = null;
  private currentFrame: number = 0;

  constructor(id: string) {
    super(id, 'FrameHold', 'Frame Hold');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Hold a specific frame from the input';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('holdFrame', 'Hold Frame', DataType.NUMBER);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('holdFrame', 0);
    this.setParameter('mode', 'specific'); // specific, first, current
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    const holdFrameInput = this.inputs.get('holdFrame');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const mode = this.getParameter('mode');
    const holdFrame = holdFrameInput?.value ?? this.getParameter('holdFrame');
    
    let shouldCapture = false;
    
    switch (mode) {
      case 'first':
        // Capture only the first frame
        shouldCapture = this.heldFrame === null;
        break;
      case 'specific':
        // Capture when we reach the specific frame
        shouldCapture = this.currentFrame === holdFrame;
        break;
      case 'current':
        // Always use current frame (passthrough)
        shouldCapture = true;
        break;
    }
    
    if (shouldCapture) {
      // Clone the image data
      this.heldFrame = {
        width: inputImage.width,
        height: inputImage.height,
        channels: inputImage.channels,
        data: new Uint8Array(inputImage.data),
        format: inputImage.format
      };
    }
    
    // Output the held frame or current frame if not captured yet
    output.value = this.heldFrame || inputImage;
    
    this.currentFrame++;
  }

  reset(): void {
    this.heldFrame = null;
    this.currentFrame = 0;
  }
}
