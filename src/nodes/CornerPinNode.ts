/**
 * CornerPinNode - Four-corner perspective transformation
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class CornerPinNode extends Node {
  constructor(id: string) {
    super(id, 'CornerPin', 'Corner Pin');
    this.metadata.category = 'Transform';
    this.metadata.description = 'Four-corner perspective pin transformation';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Default corners (normalized 0-1 coordinates)
    this.setParameter('topLeftX', 0);
    this.setParameter('topLeftY', 0);
    this.setParameter('topRightX', 1);
    this.setParameter('topRightY', 0);
    this.setParameter('bottomLeftX', 0);
    this.setParameter('bottomLeftY', 1);
    this.setParameter('bottomRightX', 1);
    this.setParameter('bottomRightY', 1);
    this.setParameter('filter', 'bilinear'); // nearest, bilinear
    this.setParameter('outputWidth', 1920);
    this.setParameter('outputHeight', 1080);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const filter = this.getParameter('filter');
    const outputWidth = this.getParameter('outputWidth');
    const outputHeight = this.getParameter('outputHeight');
    
    // Get corner positions (normalized)
    const corners = {
      tl: { x: this.getParameter('topLeftX'), y: this.getParameter('topLeftY') },
      tr: { x: this.getParameter('topRightX'), y: this.getParameter('topRightY') },
      bl: { x: this.getParameter('bottomLeftX'), y: this.getParameter('bottomLeftY') },
      br: { x: this.getParameter('bottomRightX'), y: this.getParameter('bottomRightY') }
    };
    
    const data = new Uint8Array(outputWidth * outputHeight * 4);
    
    // Calculate inverse perspective transform
    // We need to map output coordinates back to source coordinates
    // Matrix calculation reserved for future implementation
    
    for (let y = 0; y < outputHeight; y++) {
      for (let x = 0; x < outputWidth; x++) {
        const outIdx = (y * outputWidth + x) * 4;
        
        // Apply inverse perspective transform
        const srcCoords = this.applyPerspective(x / outputWidth, y / outputHeight, corners);
        const srcX = srcCoords.x * inputImage.width;
        const srcY = srcCoords.y * inputImage.height;
        
        // Check bounds
        if (srcX < 0 || srcX >= inputImage.width || srcY < 0 || srcY >= inputImage.height) {
          data[outIdx] = 0;
          data[outIdx + 1] = 0;
          data[outIdx + 2] = 0;
          data[outIdx + 3] = 0;
          continue;
        }
        
        if (filter === 'bilinear') {
          this.sampleBilinear(inputImage, srcX, srcY, data, outIdx);
        } else {
          this.sampleNearest(inputImage, srcX, srcY, data, outIdx);
        }
      }
    }
    
    output.value = {
      width: outputWidth,
      height: outputHeight,
      channels: 4,
      data,
      format: 'rgba'
    };
  }

  private applyPerspective(
    u: number,
    v: number,
    corners: { tl: { x: number; y: number }; tr: { x: number; y: number }; bl: { x: number; y: number }; br: { x: number; y: number } }
  ): { x: number; y: number } {
    // Bilinear interpolation of corner positions
    // This is a simplified approach - for true perspective, use homogeneous coordinates
    const topX = corners.tl.x + (corners.tr.x - corners.tl.x) * u;
    const topY = corners.tl.y + (corners.tr.y - corners.tl.y) * u;
    const bottomX = corners.bl.x + (corners.br.x - corners.bl.x) * u;
    const bottomY = corners.bl.y + (corners.br.y - corners.bl.y) * u;
    
    const x = topX + (bottomX - topX) * v;
    const y = topY + (bottomY - topY) * v;
    
    return { x, y };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateInverseMatrix(
    _corners: { tl: { x: number; y: number }; tr: { x: number; y: number }; bl: { x: number; y: number }; br: { x: number; y: number } },
    _width: number,
    _height: number
  ): number[] {
    // Placeholder for perspective matrix calculation
    // In a full implementation, this would compute the homography matrix
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  private sampleNearest(
    image: ImageData,
    x: number,
    y: number,
    data: Uint8Array,
    outIdx: number
  ): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    
    if (ix >= 0 && ix < image.width && iy >= 0 && iy < image.height) {
      const srcIdx = (iy * image.width + ix) * image.channels;
      data[outIdx] = image.data[srcIdx];
      data[outIdx + 1] = image.data[srcIdx + 1];
      data[outIdx + 2] = image.data[srcIdx + 2];
      data[outIdx + 3] = image.channels === 4 ? image.data[srcIdx + 3] : 255;
    }
  }

  private sampleBilinear(
    image: ImageData,
    x: number,
    y: number,
    data: Uint8Array,
    outIdx: number
  ): void {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, image.width - 1);
    const y1 = Math.min(y0 + 1, image.height - 1);
    
    const fx = x - x0;
    const fy = y - y0;
    
    const { channels } = image;
    
    for (let c = 0; c < Math.min(channels, 4); c++) {
      const v00 = image.data[(y0 * image.width + x0) * channels + c];
      const v10 = image.data[(y0 * image.width + x1) * channels + c];
      const v01 = image.data[(y1 * image.width + x0) * channels + c];
      const v11 = image.data[(y1 * image.width + x1) * channels + c];
      
      const v0 = v00 * (1 - fx) + v10 * fx;
      const v1 = v01 * (1 - fx) + v11 * fx;
      const v = v0 * (1 - fy) + v1 * fy;
      
      data[outIdx + c] = Math.floor(v);
    }
    
    if (channels < 4) {
      data[outIdx + 3] = 255;
    }
  }
}
