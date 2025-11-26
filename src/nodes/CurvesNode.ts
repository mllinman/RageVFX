/**
 * CurvesNode - RGB curves adjustment
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface CurvePoint {
  x: number;
  y: number;
}

export class CurvesNode extends Node {
  private masterLUT: Uint8Array = new Uint8Array(256);
  private redLUT: Uint8Array = new Uint8Array(256);
  private greenLUT: Uint8Array = new Uint8Array(256);
  private blueLUT: Uint8Array = new Uint8Array(256);

  constructor(id: string) {
    super(id, 'Curves', 'Curves');
    this.metadata.category = 'Color';
    this.metadata.description = 'Adjust image with RGB curves';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Default curve points (linear)
    const defaultCurve: CurvePoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ];
    
    this.setParameter('masterCurve', defaultCurve);
    this.setParameter('redCurve', defaultCurve);
    this.setParameter('greenCurve', defaultCurve);
    this.setParameter('blueCurve', defaultCurve);
    
    // Initialize LUTs
    this.updateLUTs();
  }

  private updateLUTs(): void {
    this.buildLUT(this.getParameter('masterCurve'), this.masterLUT);
    this.buildLUT(this.getParameter('redCurve'), this.redLUT);
    this.buildLUT(this.getParameter('greenCurve'), this.greenLUT);
    this.buildLUT(this.getParameter('blueCurve'), this.blueLUT);
  }

  private buildLUT(curve: CurvePoint[], lut: Uint8Array): void {
    if (!curve || curve.length < 2) {
      // Linear fallback
      for (let i = 0; i < 256; i++) {
        lut[i] = i;
      }
      return;
    }
    
    // Sort points by x
    const points = [...curve].sort((a, b) => a.x - b.x);
    
    // Generate LUT using spline interpolation
    for (let i = 0; i < 256; i++) {
      const x = i / 255;
      const y = this.interpolateCurve(points, x);
      lut[i] = Math.max(0, Math.min(255, Math.round(y * 255)));
    }
  }

  private interpolateCurve(points: CurvePoint[], x: number): number {
    // Find surrounding points
    let p0 = points[0];
    let p1 = points[points.length - 1];
    
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) {
        p0 = points[i];
        p1 = points[i + 1];
        break;
      }
    }
    
    if (x <= p0.x) return p0.y;
    if (x >= p1.x) return p1.y;
    
    // Linear interpolation (could be upgraded to cubic spline)
    const t = (x - p0.x) / (p1.x - p0.x);
    
    // Smoothstep for nicer curves
    const smoothT = t * t * (3 - 2 * t);
    
    return p0.y + (p1.y - p0.y) * smoothT;
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    
    // Update LUTs
    this.updateLUTs();
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      
      // Apply channel curves, then master
      const r = srcData[srcIdx];
      const g = srcData[srcIdx + 1];
      const b = srcData[srcIdx + 2];
      
      outData[outIdx] = this.masterLUT[this.redLUT[r]];
      outData[outIdx + 1] = this.masterLUT[this.greenLUT[g]];
      outData[outIdx + 2] = this.masterLUT[this.blueLUT[b]];
      outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }
}
