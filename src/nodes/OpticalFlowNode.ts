/**
 * OpticalFlowNode - Motion analysis using optical flow
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class OpticalFlowNode extends Node {
  private previousFrame: ImageData | null = null;

  constructor(id: string) {
    super(id, 'OpticalFlow', 'Optical Flow');
    this.metadata.category = 'Tracker';
    this.metadata.description = 'Calculate optical flow between frames';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('flow', 'Flow', DataType.IMAGE);
    this.addOutput('visualization', 'Visualization', DataType.IMAGE);
    
    this.setParameter('windowSize', 15);
    this.setParameter('pyramidLevels', 3);
    this.setParameter('iterations', 10);
    this.setParameter('threshold', 0.01);
    this.setParameter('visualizationType', 'color'); // color, arrows, magnitude
    this.setParameter('flowScale', 10);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const flowOutput = this.outputs.get('flow');
    const visOutput = this.outputs.get('visualization');
    
    if (!input?.value || !flowOutput) {
      return;
    }

    const currentFrame = input.value as ImageData;
    const { width, height, channels } = currentFrame;
    
    // Convert to grayscale
    const current = this.toGrayscale(currentFrame);
    
    // Initialize flow output
    const flowData = new Uint8Array(width * height * 4);
    const visData = new Uint8Array(width * height * 4);
    
    if (this.previousFrame) {
      const previous = this.toGrayscale(this.previousFrame);
      
      // Lucas-Kanade optical flow
      const flow = this.calculateOpticalFlow(previous, current, width, height);
      
      const visualizationType = this.getParameter('visualizationType');
      const flowScale = this.getParameter('flowScale');
      
      // Generate outputs
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const flowIdx = (y * width + x) * 2;
          
          const flowX = flow[flowIdx];
          const flowY = flow[flowIdx + 1];
          
          // Store flow as normalized values (0.5 = no motion)
          flowData[idx] = Math.floor((flowX / flowScale + 0.5) * 255);
          flowData[idx + 1] = Math.floor((flowY / flowScale + 0.5) * 255);
          flowData[idx + 2] = 128;
          flowData[idx + 3] = 255;
          
          // Visualization
          if (visualizationType === 'color') {
            // HSV-based visualization
            const magnitude = Math.sqrt(flowX * flowX + flowY * flowY);
            const angle = Math.atan2(flowY, flowX);
            
            const hue = (angle + Math.PI) / (2 * Math.PI);
            const saturation = Math.min(1, magnitude / flowScale);
            const value = Math.min(1, magnitude / flowScale * 2);
            
            const rgb = this.hsvToRgb(hue, saturation, value);
            visData[idx] = rgb.r;
            visData[idx + 1] = rgb.g;
            visData[idx + 2] = rgb.b;
            visData[idx + 3] = 255;
          } else if (visualizationType === 'magnitude') {
            const magnitude = Math.sqrt(flowX * flowX + flowY * flowY);
            const mag = Math.min(255, magnitude * 255 / flowScale);
            visData[idx] = mag;
            visData[idx + 1] = mag;
            visData[idx + 2] = mag;
            visData[idx + 3] = 255;
          } else {
            // Copy original with arrows overlay
            const srcIdx = (y * width + x) * channels;
            visData[idx] = currentFrame.data[srcIdx];
            visData[idx + 1] = currentFrame.data[srcIdx + 1];
            visData[idx + 2] = currentFrame.data[srcIdx + 2];
            visData[idx + 3] = 255;
          }
        }
      }
      
      // Draw arrows for 'arrows' visualization
      if (visualizationType === 'arrows') {
        const step = 20;
        for (let y = step; y < height - step; y += step) {
          for (let x = step; x < width - step; x += step) {
            const flowIdx = (y * width + x) * 2;
            const flowX = flow[flowIdx] * flowScale;
            const flowY = flow[flowIdx + 1] * flowScale;
            
            this.drawArrow(visData, width, height, x, y, flowX, flowY);
          }
        }
      }
    } else {
      // No previous frame - output zero flow
      for (let i = 0; i < width * height * 4; i += 4) {
        flowData[i] = 128;
        flowData[i + 1] = 128;
        flowData[i + 2] = 128;
        flowData[i + 3] = 255;
        
        visData[i] = 0;
        visData[i + 1] = 0;
        visData[i + 2] = 0;
        visData[i + 3] = 255;
      }
    }
    
    // Store current frame for next iteration
    this.previousFrame = currentFrame;
    
    flowOutput.value = {
      width,
      height,
      channels: 4,
      data: flowData,
      format: 'rgba'
    };
    
    if (visOutput) {
      visOutput.value = {
        width,
        height,
        channels: 4,
        data: visData,
        format: 'rgba'
      };
    }
  }

  private toGrayscale(image: ImageData): Float32Array {
    const gray = new Float32Array(image.width * image.height);
    for (let i = 0; i < image.width * image.height; i++) {
      const idx = i * image.channels;
      gray[i] = (image.data[idx] * 0.299 + image.data[idx + 1] * 0.587 + image.data[idx + 2] * 0.114) / 255;
    }
    return gray;
  }

  private calculateOpticalFlow(
    prev: Float32Array,
    current: Float32Array,
    width: number,
    height: number
  ): Float32Array {
    const windowSize = this.getParameter('windowSize');
    const halfWindow = Math.floor(windowSize / 2);
    const threshold = this.getParameter('threshold');
    
    const flow = new Float32Array(width * height * 2);
    
    // Calculate gradients
    const Ix = new Float32Array(width * height);
    const Iy = new Float32Array(width * height);
    const It = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Spatial gradients (average of both frames)
        Ix[idx] = ((prev[idx + 1] - prev[idx - 1]) + (current[idx + 1] - current[idx - 1])) / 4;
        Iy[idx] = ((prev[idx + width] - prev[idx - width]) + (current[idx + width] - current[idx - width])) / 4;
        
        // Temporal gradient
        It[idx] = current[idx] - prev[idx];
      }
    }
    
    // Lucas-Kanade for each pixel
    for (let y = halfWindow; y < height - halfWindow; y++) {
      for (let x = halfWindow; x < width - halfWindow; x++) {
        // Build A^T A and A^T b
        let sumIxIx = 0, sumIyIy = 0, sumIxIy = 0;
        let sumIxIt = 0, sumIyIt = 0;
        
        for (let wy = -halfWindow; wy <= halfWindow; wy++) {
          for (let wx = -halfWindow; wx <= halfWindow; wx++) {
            const idx = (y + wy) * width + (x + wx);
            sumIxIx += Ix[idx] * Ix[idx];
            sumIyIy += Iy[idx] * Iy[idx];
            sumIxIy += Ix[idx] * Iy[idx];
            sumIxIt += Ix[idx] * It[idx];
            sumIyIt += Iy[idx] * It[idx];
          }
        }
        
        // Solve 2x2 system
        const det = sumIxIx * sumIyIy - sumIxIy * sumIxIy;
        const flowIdx = (y * width + x) * 2;
        
        if (Math.abs(det) > threshold) {
          flow[flowIdx] = (sumIyIy * (-sumIxIt) - sumIxIy * (-sumIyIt)) / det;
          flow[flowIdx + 1] = (sumIxIx * (-sumIyIt) - sumIxIy * (-sumIxIt)) / det;
        } else {
          flow[flowIdx] = 0;
          flow[flowIdx + 1] = 0;
        }
      }
    }
    
    return flow;
  }

  private hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    let r = 0, g = 0, b = 0;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    
    return {
      r: Math.floor(r * 255),
      g: Math.floor(g * 255),
      b: Math.floor(b * 255)
    };
  }

  private drawArrow(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    dx: number,
    dy: number
  ): void {
    const endX = x + dx;
    const endY = y + dy;
    
    // Draw line
    this.drawLine(data, width, height, x, y, endX, endY, { r: 0, g: 255, b: 0 });
    
    // Draw arrowhead
    const angle = Math.atan2(dy, dx);
    const headLen = 5;
    
    this.drawLine(data, width, height,
      endX, endY,
      endX - headLen * Math.cos(angle - Math.PI / 6),
      endY - headLen * Math.sin(angle - Math.PI / 6),
      { r: 0, g: 255, b: 0 }
    );
    
    this.drawLine(data, width, height,
      endX, endY,
      endX - headLen * Math.cos(angle + Math.PI / 6),
      endY - headLen * Math.sin(angle + Math.PI / 6),
      { r: 0, g: 255, b: 0 }
    );
  }

  private drawLine(
    data: Uint8Array,
    width: number,
    height: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: { r: number; g: number; b: number }
  ): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    let x = Math.floor(x0);
    let y = Math.floor(y0);
    const endX = Math.floor(x1);
    const endY = Math.floor(y1);
    
     
    while (true) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
      }
      
      if (x === endX && y === endY) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  reset(): void {
    this.previousFrame = null;
  }
}
