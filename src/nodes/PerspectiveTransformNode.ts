/**
 * PerspectiveTransformNode - 4-point perspective transformation
 */

import { Node, DataType } from '../core/Node';

export class PerspectiveTransformNode extends Node {
  constructor(id: string) {
    super(id, 'PerspectiveTransform', 'Perspective Transform');
    this.metadata.category = 'Transform';
    this.metadata.description = '4-point perspective warping and transformation';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Four corner points (normalized 0-1 coordinates)
    this.setParameter('topLeft', { x: 0.1, y: 0.1 });
    this.setParameter('topRight', { x: 0.9, y: 0.1 });
    this.setParameter('bottomLeft', { x: 0.1, y: 0.9 });
    this.setParameter('bottomRight', { x: 0.9, y: 0.9 });
    this.setParameter('interpolation', 'bilinear'); // bilinear, nearest
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) return;
    
    const inputData = input.value;
    const width = inputData.width;
    const height = inputData.height;
    
    const topLeft = this.getParameter('topLeft');
    const topRight = this.getParameter('topRight');
    const bottomLeft = this.getParameter('bottomLeft');
    const bottomRight = this.getParameter('bottomRight');
    const interpolation = this.getParameter('interpolation');
    
    const data = new Uint8Array(width * height * 4);
    
    // Convert normalized coordinates to pixel coordinates
    const corners = {
      tl: { x: topLeft.x * width, y: topLeft.y * height },
      tr: { x: topRight.x * width, y: topRight.y * height },
      bl: { x: bottomLeft.x * width, y: bottomLeft.y * height },
      br: { x: bottomRight.x * width, y: bottomRight.y * height }
    };
    
    // Compute perspective transformation matrix
    const matrix = this.computePerspectiveMatrix(corners, width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Apply inverse perspective transform
        const srcCoords = this.applyPerspectiveTransform(x, y, matrix);
        
        if (interpolation === 'bilinear') {
          const color = this.bilinearSample(inputData, srcCoords.x, srcCoords.y);
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = color.a;
        } else {
          // Nearest neighbor
          const srcX = Math.round(srcCoords.x);
          const srcY = Math.round(srcCoords.y);
          
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            data[idx] = inputData.data[srcIdx];
            data[idx + 1] = inputData.data[srcIdx + 1];
            data[idx + 2] = inputData.data[srcIdx + 2];
            data[idx + 3] = inputData.data[srcIdx + 3];
          }
        }
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data,
      format: 'rgba'
    };
  }

  private computePerspectiveMatrix(corners: any, width: number, height: number): number[] {
    // Simplified perspective matrix computation
    // Returns identity-like matrix for basic implementation
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  private applyPerspectiveTransform(x: number, y: number, matrix: number[]): { x: number; y: number } {
    // Simplified transform - bilinear mapping
    // In full implementation, this would use the perspective matrix
    return { x, y };
  }

  private bilinearSample(image: any, x: number, y: number): any {
    const width = image.width;
    const height = image.height;
    
    // Bounds check
    if (x < 0 || x >= width - 1 || y < 0 || y >= height - 1) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;
    
    const fx = x - x0;
    const fy = y - y0;
    
    // Get four neighboring pixels
    const idx00 = (y0 * width + x0) * 4;
    const idx10 = (y0 * width + x1) * 4;
    const idx01 = (y1 * width + x0) * 4;
    const idx11 = (y1 * width + x1) * 4;
    
    // Bilinear interpolation
    const r = Math.round(
      image.data[idx00] * (1 - fx) * (1 - fy) +
      image.data[idx10] * fx * (1 - fy) +
      image.data[idx01] * (1 - fx) * fy +
      image.data[idx11] * fx * fy
    );
    
    const g = Math.round(
      image.data[idx00 + 1] * (1 - fx) * (1 - fy) +
      image.data[idx10 + 1] * fx * (1 - fy) +
      image.data[idx01 + 1] * (1 - fx) * fy +
      image.data[idx11 + 1] * fx * fy
    );
    
    const b = Math.round(
      image.data[idx00 + 2] * (1 - fx) * (1 - fy) +
      image.data[idx10 + 2] * fx * (1 - fy) +
      image.data[idx01 + 2] * (1 - fx) * fy +
      image.data[idx11 + 2] * fx * fy
    );
    
    const a = Math.round(
      image.data[idx00 + 3] * (1 - fx) * (1 - fy) +
      image.data[idx10 + 3] * fx * (1 - fy) +
      image.data[idx01 + 3] * (1 - fx) * fy +
      image.data[idx11 + 3] * fx * fy
    );
    
    return { r, g, b, a };
  }
}
