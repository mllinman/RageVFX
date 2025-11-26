/**
 * EdgeMatteNode - Refine edges of alpha matte
 */

import { Node, DataType } from '../core/Node';

export class EdgeMatteNode extends Node {
  constructor(id: string) {
    super(id, 'EdgeMatte', 'Edge Matte');
    this.metadata.category = 'Keying';
    this.metadata.description = 'Refine edges of alpha matte';
    this.metadata.version = '1.1.0';
    
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addInput('matte', 'Matte', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('shrink', 0);
    this.setParameter('grow', 0);
    this.setParameter('blur', 0);
    this.setParameter('choke', 0);
    this.setParameter('soften', 0);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const matteInput = this.inputs.get('matte');
    
    if (!imageInput?.value) {
      return;
    }

    const inputCanvas = imageInput.value as HTMLCanvasElement;
    const matteCanvas = matteInput?.value as HTMLCanvasElement || inputCanvas;
    const width = inputCanvas.width;
    const height = inputCanvas.height;

    const shrink = this.getParameter('shrink');
    const grow = this.getParameter('grow');
    const blur = this.getParameter('blur');
    const choke = this.getParameter('choke');
    const soften = this.getParameter('soften');

    // Process matte
    const processedMatte = document.createElement('canvas');
    processedMatte.width = width;
    processedMatte.height = height;
    const matteCtx = processedMatte.getContext('2d');
    
    if (!matteCtx) return;

    matteCtx.drawImage(matteCanvas, 0, 0);

    // Apply shrink/grow (erosion/dilation)
    const delta = grow - shrink;
    if (delta !== 0) {
      matteCtx.filter = delta > 0 ? `blur(${Math.abs(delta)}px)` : 'none';
      matteCtx.globalCompositeOperation = 'source-over';
      
      for (let i = 0; i < Math.abs(delta); i++) {
        matteCtx.drawImage(processedMatte, 0, 0);
      }
      
      matteCtx.filter = 'none';
    }

    // Apply choke (contract edges)
    if (choke !== 0) {
      const chokeData = matteCtx.getImageData(0, 0, width, height);
      
      for (let i = 0; i < chokeData.data.length; i += 4) {
        const alpha = chokeData.data[i + 3];
        const newAlpha = Math.pow(alpha / 255, 1 + choke) * 255;
        chokeData.data[i + 3] = newAlpha;
      }
      
      matteCtx.putImageData(chokeData, 0, 0);
    }

    // Apply blur
    if (blur > 0) {
      matteCtx.filter = `blur(${blur}px)`;
      matteCtx.drawImage(processedMatte, 0, 0);
      matteCtx.filter = 'none';
    }

    // Apply soften (feather edges)
    if (soften > 0) {
      const softenData = matteCtx.getImageData(0, 0, width, height);
      
      for (let i = 0; i < softenData.data.length; i += 4) {
        const alpha = softenData.data[i + 3];
        const normalized = alpha / 255;
        const softened = normalized < 0.5 
          ? 2 * normalized * normalized 
          : 1 - 2 * (1 - normalized) * (1 - normalized);
        softenData.data[i + 3] = softened * 255 * (1 - soften) + alpha * soften;
      }
      
      matteCtx.putImageData(softenData, 0, 0);
    }

    // Composite with original image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (outputCtx) {
      outputCtx.drawImage(inputCanvas, 0, 0);
      outputCtx.globalCompositeOperation = 'destination-in';
      outputCtx.drawImage(processedMatte, 0, 0);
    }

    const output = this.outputs.get('image');
    if (output) {
      output.value = outputCanvas;
    }
  }
}
