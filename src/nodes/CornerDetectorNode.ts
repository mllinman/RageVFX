/**
 * CornerDetectorNode - Detects corner features for tracking
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface CornerFeature {
  x: number;
  y: number;
  score: number;
}

export class CornerDetectorNode extends Node {
  constructor(id: string) {
    super(id, 'CornerDetector', 'Corner Detector');
    this.metadata.category = 'Tracker';
    this.metadata.description = 'Detect corner features using Harris corner detection';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('features', 'Features', DataType.ANY);
    
    this.setParameter('threshold', 0.01);
    this.setParameter('maxFeatures', 100);
    this.setParameter('minDistance', 10);
    this.setParameter('blockSize', 3);
    this.setParameter('kFactor', 0.04);
    this.setParameter('showOverlay', true);
    this.setParameter('overlayColor', { r: 255, g: 0, b: 255 });
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const threshold = this.getParameter('threshold');
    const maxFeatures = this.getParameter('maxFeatures');
    const minDistance = this.getParameter('minDistance');
    const blockSize = this.getParameter('blockSize');
    const kFactor = this.getParameter('kFactor');
    const showOverlay = this.getParameter('showOverlay');
    const overlayColor = this.getParameter('overlayColor');
    
    const { width, height, channels, data: srcData } = inputImage;
    
    // Convert to grayscale
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * channels;
      gray[i] = (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255;
    }
    
    // Calculate gradients
    const gradX = new Float32Array(width * height);
    const gradY = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        gradX[idx] = (gray[idx + 1] - gray[idx - 1]) / 2;
        gradY[idx] = (gray[idx + width] - gray[idx - width]) / 2;
      }
    }
    
    // Harris corner response
    const harris = new Float32Array(width * height);
    const halfBlock = Math.floor(blockSize / 2);
    
    for (let y = halfBlock; y < height - halfBlock; y++) {
      for (let x = halfBlock; x < width - halfBlock; x++) {
        // Calculate structure tensor elements
        let Ixx = 0, Iyy = 0, Ixy = 0;
        
        for (let by = -halfBlock; by <= halfBlock; by++) {
          for (let bx = -halfBlock; bx <= halfBlock; bx++) {
            const idx = (y + by) * width + (x + bx);
            const gx = gradX[idx];
            const gy = gradY[idx];
            Ixx += gx * gx;
            Iyy += gy * gy;
            Ixy += gx * gy;
          }
        }
        
        // Harris response: det(M) - k * trace(M)^2
        const det = Ixx * Iyy - Ixy * Ixy;
        const trace = Ixx + Iyy;
        harris[y * width + x] = det - kFactor * trace * trace;
      }
    }
    
    // Non-maximum suppression and feature extraction
    const features: CornerFeature[] = [];
    
    for (let y = halfBlock; y < height - halfBlock; y++) {
      for (let x = halfBlock; x < width - halfBlock; x++) {
        const idx = y * width + x;
        const response = harris[idx];
        
        if (response < threshold) continue;
        
        // Check if local maximum
        let isMax = true;
        for (let by = -1; by <= 1 && isMax; by++) {
          for (let bx = -1; bx <= 1 && isMax; bx++) {
            if (by === 0 && bx === 0) continue;
            if (harris[(y + by) * width + (x + bx)] >= response) {
              isMax = false;
            }
          }
        }
        
        if (isMax) {
          features.push({ x, y, score: response });
        }
      }
    }
    
    // Sort by score and apply non-maximum suppression by distance
    features.sort((a, b) => b.score - a.score);
    
    const selectedFeatures: CornerFeature[] = [];
    for (const feature of features) {
      if (selectedFeatures.length >= maxFeatures) break;
      
      // Check distance from existing features
      let tooClose = false;
      for (const selected of selectedFeatures) {
        const dx = feature.x - selected.x;
        const dy = feature.y - selected.y;
        if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        selectedFeatures.push(feature);
      }
    }
    
    // Create output image
    const outData = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      outData[outIdx] = srcData[srcIdx];
      outData[outIdx + 1] = srcData[srcIdx + 1];
      outData[outIdx + 2] = srcData[srcIdx + 2];
      outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
    }
    
    // Draw overlay
    if (showOverlay) {
      for (const feature of selectedFeatures) {
        this.drawFeatureMarker(outData, width, height, feature.x, feature.y, overlayColor);
      }
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
    
    // Output features
    const featuresOutput = this.outputs.get('features');
    if (featuresOutput) {
      featuresOutput.value = selectedFeatures.map(f => ({
        x: f.x / width,
        y: f.y / height,
        score: f.score
      }));
    }
  }

  private drawFeatureMarker(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    color: { r: number; g: number; b: number }
  ): void {
    const size = 4;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    
    // Draw cross
    for (let d = -size; d <= size; d++) {
      if (ix + d >= 0 && ix + d < width && iy >= 0 && iy < height) {
        const idx = (iy * width + ix + d) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
      }
      
      if (ix >= 0 && ix < width && iy + d >= 0 && iy + d < height) {
        const idx = ((iy + d) * width + ix) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
      }
    }
  }
}
