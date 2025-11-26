/**
 * PointTrackerNode - Single point motion tracking
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface TrackPoint {
  x: number;
  y: number;
  confidence: number;
  frame: number;
}

export class PointTrackerNode extends Node {
  private trackData: TrackPoint[] = [];
  private previousFrame: ImageData | null = null;
  private currentFrame: number = 0;

  constructor(id: string) {
    super(id, 'PointTracker', 'Point Tracker');
    this.metadata.category = 'Tracker';
    this.metadata.description = 'Track a single point through the footage';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('trackData', 'Track Data', DataType.ANY);
    this.addOutput('position', 'Position', DataType.VECTOR);
    
    this.setParameter('trackPointX', 0.5);
    this.setParameter('trackPointY', 0.5);
    this.setParameter('searchRadius', 50);
    this.setParameter('patternSize', 21);
    this.setParameter('autoTrack', true);
    this.setParameter('showOverlay', true);
    this.setParameter('overlayColor', { r: 0, g: 255, b: 0 });
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const autoTrack = this.getParameter('autoTrack');
    const showOverlay = this.getParameter('showOverlay');
    const overlayColor = this.getParameter('overlayColor');
    
    let trackX = this.getParameter('trackPointX') * inputImage.width;
    let trackY = this.getParameter('trackPointY') * inputImage.height;
    
    // If we have a previous frame and auto-track is enabled, find the point
    if (autoTrack && this.previousFrame && this.trackData.length > 0) {
      const lastTrack = this.trackData[this.trackData.length - 1];
      const tracked = this.trackPoint(
        this.previousFrame,
        inputImage,
        lastTrack.x,
        lastTrack.y
      );
      
      if (tracked.confidence > 0.5) {
        trackX = tracked.x;
        trackY = tracked.y;
        
        // Update stored track point
        this.setParameter('trackPointX', trackX / inputImage.width);
        this.setParameter('trackPointY', trackY / inputImage.height);
      }
    }
    
    // Store track data
    this.trackData.push({
      x: trackX,
      y: trackY,
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
      this.drawTrackOverlay(outData, width, height, trackX, trackY, overlayColor);
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
    
    // Output track data
    const trackDataOutput = this.outputs.get('trackData');
    if (trackDataOutput) {
      trackDataOutput.value = this.trackData;
    }
    
    const positionOutput = this.outputs.get('position');
    if (positionOutput) {
      positionOutput.value = {
        x: trackX / width,
        y: trackY / height
      };
    }
  }

  private trackPoint(
    prevImage: ImageData,
    currentImage: ImageData,
    startX: number,
    startY: number
  ): { x: number; y: number; confidence: number } {
    const searchRadius = this.getParameter('searchRadius');
    const patternSize = this.getParameter('patternSize');
    const halfPattern = Math.floor(patternSize / 2);
    
    // Extract pattern from previous frame
    const pattern = this.extractPattern(prevImage, startX, startY, patternSize);
    
    // Search in current frame
    let bestMatch = { x: startX, y: startY, confidence: 0 };
    let bestScore = Infinity;
    
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const testX = startX + dx;
        const testY = startY + dy;
        
        // Check bounds
        if (testX - halfPattern < 0 || testX + halfPattern >= currentImage.width ||
            testY - halfPattern < 0 || testY + halfPattern >= currentImage.height) {
          continue;
        }
        
        // Calculate SSD (Sum of Squared Differences)
        let ssd = 0;
        for (let py = 0; py < patternSize; py++) {
          for (let px = 0; px < patternSize; px++) {
            const patternValue = pattern[py * patternSize + px];
            
            const imgX = Math.floor(testX - halfPattern + px);
            const imgY = Math.floor(testY - halfPattern + py);
            const imgIdx = (imgY * currentImage.width + imgX) * currentImage.channels;
            
            // Use grayscale
            const imgValue = (
              currentImage.data[imgIdx] * 0.299 +
              currentImage.data[imgIdx + 1] * 0.587 +
              currentImage.data[imgIdx + 2] * 0.114
            );
            
            const diff = patternValue - imgValue;
            ssd += diff * diff;
          }
        }
        
        if (ssd < bestScore) {
          bestScore = ssd;
          bestMatch = {
            x: testX,
            y: testY,
            confidence: 1 - Math.min(1, ssd / (patternSize * patternSize * 255 * 255))
          };
        }
      }
    }
    
    return bestMatch;
  }

  private extractPattern(
    image: ImageData,
    centerX: number,
    centerY: number,
    size: number
  ): Float32Array {
    const pattern = new Float32Array(size * size);
    const halfSize = Math.floor(size / 2);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const imgX = Math.floor(centerX - halfSize + x);
        const imgY = Math.floor(centerY - halfSize + y);
        
        if (imgX >= 0 && imgX < image.width && imgY >= 0 && imgY < image.height) {
          const idx = (imgY * image.width + imgX) * image.channels;
          // Grayscale
          pattern[y * size + x] = (
            image.data[idx] * 0.299 +
            image.data[idx + 1] * 0.587 +
            image.data[idx + 2] * 0.114
          );
        }
      }
    }
    
    return pattern;
  }

  private drawTrackOverlay(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    color: { r: number; g: number; b: number }
  ): void {
    const crossSize = 10;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    
    // Draw crosshair
    for (let d = -crossSize; d <= crossSize; d++) {
      // Horizontal line
      if (ix + d >= 0 && ix + d < width && iy >= 0 && iy < height) {
        const idx = (iy * width + ix + d) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 255;
      }
      
      // Vertical line
      if (ix >= 0 && ix < width && iy + d >= 0 && iy + d < height) {
        const idx = ((iy + d) * width + ix) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 255;
      }
    }
    
    // Draw circle
    const radius = 15;
    for (let angle = 0; angle < 360; angle += 5) {
      const rad = angle * Math.PI / 180;
      const cx = Math.floor(x + Math.cos(rad) * radius);
      const cy = Math.floor(y + Math.sin(rad) * radius);
      
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        const idx = (cy * width + cx) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 255;
      }
    }
  }

  resetTracking(): void {
    this.trackData = [];
    this.previousFrame = null;
    this.currentFrame = 0;
  }
}
