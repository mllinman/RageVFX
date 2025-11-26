/**
 * RotoscopeNode - Manual masking and rotoscoping
 */

import { Node, DataType } from '../core/Node';

interface MaskPoint {
  x: number;
  y: number;
}

interface MaskShape {
  points: MaskPoint[];
  closed: boolean;
  feather: number;
}

export class RotoscopeNode extends Node {
  private masks: Map<number, MaskShape[]> = new Map();

  constructor(id: string) {
    super(id, 'Rotoscope', 'Rotoscope');
    this.metadata.category = 'Keying';
    this.metadata.description = 'Manual masking and rotoscoping';
    this.metadata.version = '1.1.0';
    
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addOutput('matte', 'Matte', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('currentFrame', 0);
    this.setParameter('feather', 5);
    this.setParameter('opacity', 1.0);
    this.setParameter('invert', false);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    if (!imageInput?.value) {
      return;
    }

    const inputCanvas = imageInput.value as HTMLCanvasElement;
    const width = inputCanvas.width;
    const height = inputCanvas.height;
    const currentFrame = this.getParameter('currentFrame');
    const feather = this.getParameter('feather');
    const opacity = this.getParameter('opacity');
    const invert = this.getParameter('invert');

    // Create matte canvas
    const matteCanvas = document.createElement('canvas');
    matteCanvas.width = width;
    matteCanvas.height = height;
    const matteCtx = matteCanvas.getContext('2d');
    
    if (!matteCtx) return;

    // Draw masks for current frame
    const frameMasks = this.masks.get(currentFrame) || [];
    
    matteCtx.fillStyle = invert ? 'white' : 'black';
    matteCtx.fillRect(0, 0, width, height);

    for (const mask of frameMasks) {
      if (mask.points.length < 2) continue;

      matteCtx.fillStyle = invert ? 'black' : 'white';
      matteCtx.beginPath();
      matteCtx.moveTo(mask.points[0].x, mask.points[0].y);
      
      for (let i = 1; i < mask.points.length; i++) {
        matteCtx.lineTo(mask.points[i].x, mask.points[i].y);
      }
      
      if (mask.closed) {
        matteCtx.closePath();
      }
      
      matteCtx.fill();
    }

    // Apply feathering
    if (feather > 0) {
      matteCtx.filter = `blur(${feather}px)`;
      matteCtx.drawImage(matteCanvas, 0, 0);
      matteCtx.filter = 'none';
    }

    // Create output with applied matte
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (outputCtx) {
      outputCtx.drawImage(inputCanvas, 0, 0);
      outputCtx.globalCompositeOperation = 'destination-in';
      outputCtx.globalAlpha = opacity;
      outputCtx.drawImage(matteCanvas, 0, 0);
    }

    const matteOutput = this.outputs.get('matte');
    if (matteOutput) {
      matteOutput.value = matteCanvas;
    }

    const imageOutput = this.outputs.get('image');
    if (imageOutput) {
      imageOutput.value = outputCanvas;
    }
  }

  addMask(frame: number, mask: MaskShape): void {
    if (!this.masks.has(frame)) {
      this.masks.set(frame, []);
    }
    this.masks.get(frame)!.push(mask);
    this.markDirty();
  }

  clearMasks(frame?: number): void {
    if (frame !== undefined) {
      this.masks.delete(frame);
    } else {
      this.masks.clear();
    }
    this.markDirty();
  }
}
