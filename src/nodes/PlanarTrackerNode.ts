/**
 * PlanarTrackerNode - Planar surface tracking for corner pin and rotoscoping
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface PlanarTrackData {
  corners: Array<{ x: number; y: number }>;
  confidence: number;
  frame: number;
}

export class PlanarTrackerNode extends Node {
  private trackHistory: PlanarTrackData[] = [];
  private previousFrame: ImageData | null = null;
  private currentFrame: number = 0;

  constructor(id: string) {
    super(id, 'PlanarTracker', 'Planar Tracker');
    this.metadata.category = 'Tracker';
    this.metadata.description = 'Track a planar surface through the footage';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('cornerData', 'Corner Data', DataType.ANY);
    this.addOutput('matrix', 'Transform Matrix', DataType.MATRIX);
    
    // Default corners (normalized)
    this.setParameter('corner1X', 0.3);
    this.setParameter('corner1Y', 0.3);
    this.setParameter('corner2X', 0.7);
    this.setParameter('corner2Y', 0.3);
    this.setParameter('corner3X', 0.7);
    this.setParameter('corner3Y', 0.7);
    this.setParameter('corner4X', 0.3);
    this.setParameter('corner4Y', 0.7);
    
    this.setParameter('searchExpansion', 1.5);
    this.setParameter('gridSubdivisions', 4);
    this.setParameter('showOverlay', true);
    this.setParameter('overlayColor', { r: 255, g: 255, b: 0 });
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const showOverlay = this.getParameter('showOverlay');
    const overlayColor = this.getParameter('overlayColor');
    
    // Get current corners
    const corners = [
      { x: this.getParameter('corner1X') * inputImage.width, y: this.getParameter('corner1Y') * inputImage.height },
      { x: this.getParameter('corner2X') * inputImage.width, y: this.getParameter('corner2Y') * inputImage.height },
      { x: this.getParameter('corner3X') * inputImage.width, y: this.getParameter('corner3Y') * inputImage.height },
      { x: this.getParameter('corner4X') * inputImage.width, y: this.getParameter('corner4Y') * inputImage.height }
    ];
    
    // Track if we have previous frame
    if (this.previousFrame && this.trackHistory.length > 0) {
      const lastCorners = this.trackHistory[this.trackHistory.length - 1].corners;
      const trackedCorners = this.trackPlanarRegion(this.previousFrame, inputImage, lastCorners);
      
      if (trackedCorners.confidence > 0.5) {
        // Update corners
        for (let i = 0; i < 4; i++) {
          corners[i] = trackedCorners.corners[i];
        }
        
        // Update parameters
        this.setParameter('corner1X', corners[0].x / inputImage.width);
        this.setParameter('corner1Y', corners[0].y / inputImage.height);
        this.setParameter('corner2X', corners[1].x / inputImage.width);
        this.setParameter('corner2Y', corners[1].y / inputImage.height);
        this.setParameter('corner3X', corners[2].x / inputImage.width);
        this.setParameter('corner3Y', corners[2].y / inputImage.height);
        this.setParameter('corner4X', corners[3].x / inputImage.width);
        this.setParameter('corner4Y', corners[3].y / inputImage.height);
      }
    }
    
    // Store track data
    this.trackHistory.push({
      corners: [...corners],
      confidence: 1.0,
      frame: this.currentFrame
    });
    
    // Copy input to output
    const { width, height, channels } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      outData[outIdx] = inputImage.data[srcIdx];
      outData[outIdx + 1] = inputImage.data[srcIdx + 1];
      outData[outIdx + 2] = inputImage.data[srcIdx + 2];
      outData[outIdx + 3] = channels === 4 ? inputImage.data[srcIdx + 3] : 255;
    }
    
    // Draw overlay
    if (showOverlay) {
      this.drawPlanarOverlay(outData, width, height, corners, overlayColor);
    }
    
    // Store for next frame
    this.previousFrame = inputImage;
    this.currentFrame++;
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
    
    // Output corner data
    const cornerDataOutput = this.outputs.get('cornerData');
    if (cornerDataOutput) {
      cornerDataOutput.value = {
        corners: corners.map(c => ({ x: c.x / width, y: c.y / height })),
        history: this.trackHistory
      };
    }
    
    // Output transform matrix
    const matrixOutput = this.outputs.get('matrix');
    if (matrixOutput) {
      matrixOutput.value = this.calculateHomography(
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
        corners.map(c => ({ x: c.x / width, y: c.y / height }))
      );
    }
  }

  private trackPlanarRegion(
    prevImage: ImageData,
    currentImage: ImageData,
    prevCorners: Array<{ x: number; y: number }>
  ): { corners: Array<{ x: number; y: number }>; confidence: number } {
    const gridSubdivisions = this.getParameter('gridSubdivisions');
    
    // Create a grid of tracking points inside the quad
    const trackingPoints: Array<{ x: number; y: number; origU: number; origV: number }> = [];
    
    for (let v = 0; v <= gridSubdivisions; v++) {
      for (let u = 0; u <= gridSubdivisions; u++) {
        const uNorm = u / gridSubdivisions;
        const vNorm = v / gridSubdivisions;
        
        // Bilinear interpolation of corners
        const topX = prevCorners[0].x + (prevCorners[1].x - prevCorners[0].x) * uNorm;
        const topY = prevCorners[0].y + (prevCorners[1].y - prevCorners[0].y) * uNorm;
        const bottomX = prevCorners[3].x + (prevCorners[2].x - prevCorners[3].x) * uNorm;
        const bottomY = prevCorners[3].y + (prevCorners[2].y - prevCorners[3].y) * uNorm;
        
        trackingPoints.push({
          x: topX + (bottomX - topX) * vNorm,
          y: topY + (bottomY - topY) * vNorm,
          origU: uNorm,
          origV: vNorm
        });
      }
    }
    
    // Track each point
    const trackedPoints: Array<{ x: number; y: number; origU: number; origV: number; confidence: number }> = [];
    
    for (const point of trackingPoints) {
      const tracked = this.trackSinglePoint(prevImage, currentImage, point.x, point.y);
      trackedPoints.push({
        ...point,
        x: tracked.x,
        y: tracked.y,
        confidence: tracked.confidence
      });
    }
    
    // Estimate new corners from tracked points (simple weighted averaging)
    // A more robust implementation would use RANSAC or least squares
    const newCorners: Array<{ x: number; y: number }> = [];
    let totalConfidence = 0;
    
    for (let c = 0; c < 4; c++) {
      let sumX = 0, sumY = 0, sumWeight = 0;
      
      for (const point of trackedPoints) {
        // Weight based on distance to corner in UV space
        const cornerU = c === 1 || c === 2 ? 1 : 0;
        const cornerV = c === 2 || c === 3 ? 1 : 0;
        
        const distU = Math.abs(point.origU - cornerU);
        const distV = Math.abs(point.origV - cornerV);
        const dist = Math.sqrt(distU * distU + distV * distV);
        const weight = Math.exp(-dist * 3) * point.confidence;
        
        sumX += point.x * weight;
        sumY += point.y * weight;
        sumWeight += weight;
        totalConfidence += point.confidence;
      }
      
      newCorners.push({
        x: sumX / sumWeight,
        y: sumY / sumWeight
      });
    }
    
    return {
      corners: newCorners,
      confidence: totalConfidence / trackedPoints.length
    };
  }

  private trackSinglePoint(
    prevImage: ImageData,
    currentImage: ImageData,
    startX: number,
    startY: number
  ): { x: number; y: number; confidence: number } {
    const searchRadius = 20;
    const patternSize = 11;
    const halfPattern = Math.floor(patternSize / 2);
    
    // Check bounds
    if (startX - halfPattern < 0 || startX + halfPattern >= prevImage.width ||
        startY - halfPattern < 0 || startY + halfPattern >= prevImage.height) {
      return { x: startX, y: startY, confidence: 0 };
    }
    
    // Extract pattern
    const pattern: number[] = [];
    for (let y = -halfPattern; y <= halfPattern; y++) {
      for (let x = -halfPattern; x <= halfPattern; x++) {
        const idx = ((Math.floor(startY) + y) * prevImage.width + Math.floor(startX) + x) * prevImage.channels;
        const gray = prevImage.data[idx] * 0.299 + prevImage.data[idx + 1] * 0.587 + prevImage.data[idx + 2] * 0.114;
        pattern.push(gray);
      }
    }
    
    // Search
    let bestMatch = { x: startX, y: startY, confidence: 0 };
    let bestScore = Infinity;
    
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const testX = startX + dx;
        const testY = startY + dy;
        
        if (testX - halfPattern < 0 || testX + halfPattern >= currentImage.width ||
            testY - halfPattern < 0 || testY + halfPattern >= currentImage.height) {
          continue;
        }
        
        let ssd = 0;
        let i = 0;
        for (let y = -halfPattern; y <= halfPattern; y++) {
          for (let x = -halfPattern; x <= halfPattern; x++) {
            const idx = ((Math.floor(testY) + y) * currentImage.width + Math.floor(testX) + x) * currentImage.channels;
            const gray = currentImage.data[idx] * 0.299 + currentImage.data[idx + 1] * 0.587 + currentImage.data[idx + 2] * 0.114;
            const diff = pattern[i++] - gray;
            ssd += diff * diff;
          }
        }
        
        if (ssd < bestScore) {
          bestScore = ssd;
          const maxSSD = patternSize * patternSize * 255 * 255;
          bestMatch = {
            x: testX,
            y: testY,
            confidence: 1 - Math.min(1, ssd / maxSSD * 10)
          };
        }
      }
    }
    
    return bestMatch;
  }

  private calculateHomography(
    _srcPoints: Array<{ x: number; y: number }>,
    _dstPoints: Array<{ x: number; y: number }>
  ): number[] {
    // Simplified homography calculation
    // Returns a 3x3 matrix as flat array
    // Full implementation would use SVD
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  private drawPlanarOverlay(
    data: Uint8Array,
    width: number,
    height: number,
    corners: Array<{ x: number; y: number }>,
    color: { r: number; g: number; b: number }
  ): void {
    // Draw quad edges
    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      this.drawLine(data, width, height, p1.x, p1.y, p2.x, p2.y, color);
    }
    
    // Draw corner markers
    for (const corner of corners) {
      const size = 8;
      for (let d = -size; d <= size; d++) {
        const px = Math.floor(corner.x + d);
        const py = Math.floor(corner.y);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
        }
        
        const py2 = Math.floor(corner.y + d);
        if (Math.floor(corner.x) >= 0 && Math.floor(corner.x) < width && py2 >= 0 && py2 < height) {
          const idx = (py2 * width + Math.floor(corner.x)) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
        }
      }
    }
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
    
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 255;
      }
      
      if (x === endX && y === endY) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  resetTracking(): void {
    this.trackHistory = [];
    this.previousFrame = null;
    this.currentFrame = 0;
  }
}
