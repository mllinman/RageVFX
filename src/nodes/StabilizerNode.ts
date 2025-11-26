/**
 * StabilizerNode - Image stabilization using motion analysis
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface MotionVector {
  dx: number;
  dy: number;
  rotation: number;
  scale: number;
  frame: number;
}

export class StabilizerNode extends Node {
  private previousFrame: ImageData | null = null;
  private motionHistory: MotionVector[] = [];
  private currentFrame: number = 0;

  constructor(id: string) {
    super(id, 'Stabilizer', 'Stabilizer');
    this.metadata.category = 'Tracker';
    this.metadata.description = 'Stabilize footage by compensating for camera motion';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('smoothing', 0.8);
    this.setParameter('stabilizeTranslation', true);
    this.setParameter('stabilizeRotation', true);
    this.setParameter('stabilizeScale', false);
    this.setParameter('cropMode', 'dynamic'); // none, fixed, dynamic
    this.setParameter('maxTranslation', 100);
    this.setParameter('maxRotation', 5);
    this.setParameter('borderMode', 'reflect'); // black, reflect, repeat
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const currentImage = input.value as ImageData;
    const smoothing = this.getParameter('smoothing');
    const stabilizeTranslation = this.getParameter('stabilizeTranslation');
    const stabilizeRotation = this.getParameter('stabilizeRotation');
    const stabilizeScale = this.getParameter('stabilizeScale');
    const borderMode = this.getParameter('borderMode');
    
    const { width, height } = currentImage;
    
    // Detect motion
    let motion: MotionVector = { dx: 0, dy: 0, rotation: 0, scale: 1, frame: this.currentFrame };
    
    if (this.previousFrame) {
      motion = this.detectMotion(this.previousFrame, currentImage);
      this.motionHistory.push(motion);
    }
    
    // Calculate smoothed compensation
    const compensation = this.calculateCompensation(smoothing);
    
    // Apply stabilization
    const outData = new Uint8Array(width * height * 4);
    
    // Build transform
    const cx = width / 2;
    const cy = height / 2;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const outIdx = (y * width + x) * 4;
        
        // Calculate source coordinates
        let srcX = x - cx;
        let srcY = y - cy;
        
        // Apply inverse compensation (to sample from original)
        if (stabilizeScale) {
          srcX *= compensation.scale;
          srcY *= compensation.scale;
        }
        
        if (stabilizeRotation) {
          const cosR = Math.cos(-compensation.rotation);
          const sinR = Math.sin(-compensation.rotation);
          const rotX = srcX * cosR - srcY * sinR;
          const rotY = srcX * sinR + srcY * cosR;
          srcX = rotX;
          srcY = rotY;
        }
        
        if (stabilizeTranslation) {
          srcX -= compensation.dx;
          srcY -= compensation.dy;
        }
        
        srcX += cx;
        srcY += cy;
        
        // Sample with border handling
        const pixel = this.sampleWithBorder(currentImage, srcX, srcY, borderMode);
        
        outData[outIdx] = pixel.r;
        outData[outIdx + 1] = pixel.g;
        outData[outIdx + 2] = pixel.b;
        outData[outIdx + 3] = pixel.a;
      }
    }
    
    // Store for next frame
    this.previousFrame = currentImage;
    this.currentFrame++;
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private detectMotion(prev: ImageData, current: ImageData): MotionVector {
    const width = prev.width;
    const height = prev.height;
    
    // Convert to grayscale
    const prevGray = this.toGrayscale(prev);
    const currGray = this.toGrayscale(current);
    
    // Use phase correlation for translation
    const translation = this.phaseCorrelation(prevGray, currGray, width, height);
    
    // Simplified rotation estimation (would need feature matching for accuracy)
    const rotation = 0;
    const scale = 1;
    
    return {
      dx: translation.dx,
      dy: translation.dy,
      rotation,
      scale,
      frame: this.currentFrame
    };
  }

  private toGrayscale(image: ImageData): Float32Array {
    const gray = new Float32Array(image.width * image.height);
    for (let i = 0; i < image.width * image.height; i++) {
      const idx = i * image.channels;
      gray[i] = image.data[idx] * 0.299 + image.data[idx + 1] * 0.587 + image.data[idx + 2] * 0.114;
    }
    return gray;
  }

  private phaseCorrelation(
    prev: Float32Array,
    current: Float32Array,
    width: number,
    height: number
  ): { dx: number; dy: number } {
    // Simplified cross-correlation (phase correlation would use FFT)
    // Here we use a windowed search
    const searchRadius = 30;
    const sampleStep = 4;
    
    let bestDx = 0;
    let bestDy = 0;
    let bestScore = Infinity;
    
    for (let dy = -searchRadius; dy <= searchRadius; dy += sampleStep) {
      for (let dx = -searchRadius; dx <= searchRadius; dx += sampleStep) {
        let diff = 0;
        let count = 0;
        
        // Sample difference at multiple points
        for (let y = searchRadius; y < height - searchRadius; y += 20) {
          for (let x = searchRadius; x < width - searchRadius; x += 20) {
            const prevIdx = y * width + x;
            const currIdx = (y + dy) * width + (x + dx);
            
            if (currIdx >= 0 && currIdx < width * height) {
              diff += Math.abs(prev[prevIdx] - current[currIdx]);
              count++;
            }
          }
        }
        
        const score = diff / count;
        if (score < bestScore) {
          bestScore = score;
          bestDx = dx;
          bestDy = dy;
        }
      }
    }
    
    // Refine with smaller step
    const refinedSearch = 4;
    for (let dy = bestDy - refinedSearch; dy <= bestDy + refinedSearch; dy++) {
      for (let dx = bestDx - refinedSearch; dx <= bestDx + refinedSearch; dx++) {
        let diff = 0;
        let count = 0;
        
        for (let y = searchRadius; y < height - searchRadius; y += 10) {
          for (let x = searchRadius; x < width - searchRadius; x += 10) {
            const prevIdx = y * width + x;
            const currIdx = (y + dy) * width + (x + dx);
            
            if (currIdx >= 0 && currIdx < width * height) {
              diff += Math.abs(prev[prevIdx] - current[currIdx]);
              count++;
            }
          }
        }
        
        const score = diff / count;
        if (score < bestScore) {
          bestScore = score;
          bestDx = dx;
          bestDy = dy;
        }
      }
    }
    
    return { dx: bestDx, dy: bestDy };
  }

  private calculateCompensation(smoothing: number): MotionVector {
    if (this.motionHistory.length === 0) {
      return { dx: 0, dy: 0, rotation: 0, scale: 1, frame: 0 };
    }
    
    // Calculate cumulative motion
    let cumDx = 0;
    let cumDy = 0;
    let cumRotation = 0;
    let cumScale = 1;
    
    for (const motion of this.motionHistory) {
      cumDx += motion.dx;
      cumDy += motion.dy;
      cumRotation += motion.rotation;
      cumScale *= motion.scale;
    }
    
    // Calculate smoothed trajectory
    const windowSize = Math.ceil(this.motionHistory.length * (1 - smoothing) + 1);
    
    let smoothDx = 0;
    let smoothDy = 0;
    let smoothRotation = 0;
    let smoothScale = 0;
    
    const startIdx = Math.max(0, this.motionHistory.length - windowSize);
    for (let i = startIdx; i < this.motionHistory.length; i++) {
      smoothDx += this.motionHistory[i].dx;
      smoothDy += this.motionHistory[i].dy;
      smoothRotation += this.motionHistory[i].rotation;
      smoothScale += this.motionHistory[i].scale;
    }
    
    const count = this.motionHistory.length - startIdx;
    smoothDx /= count;
    smoothDy /= count;
    smoothRotation /= count;
    smoothScale /= count;
    
    // Compensation is the difference between actual and smoothed
    return {
      dx: (cumDx - smoothDx * this.motionHistory.length) * smoothing,
      dy: (cumDy - smoothDy * this.motionHistory.length) * smoothing,
      rotation: (cumRotation - smoothRotation * this.motionHistory.length) * smoothing,
      scale: 1 + (cumScale - smoothScale * this.motionHistory.length) * smoothing,
      frame: this.currentFrame
    };
  }

  private sampleWithBorder(
    image: ImageData,
    x: number,
    y: number,
    borderMode: string
  ): { r: number; g: number; b: number; a: number } {
    const { width, height, channels, data } = image;
    
    // Handle out of bounds
    if (x < 0 || x >= width || y < 0 || y >= height) {
      switch (borderMode) {
        case 'black':
          return { r: 0, g: 0, b: 0, a: 255 };
        case 'reflect':
          if (x < 0) x = -x;
          if (x >= width) x = 2 * width - x - 2;
          if (y < 0) y = -y;
          if (y >= height) y = 2 * height - y - 2;
          break;
        case 'repeat':
          x = ((x % width) + width) % width;
          y = ((y % height) + height) % height;
          break;
      }
    }
    
    // Clamp for safety
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    
    // Bilinear interpolation
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    
    const fx = x - x0;
    const fy = y - y0;
    
    const sample = (sx: number, sy: number, c: number) => {
      const idx = (sy * width + sx) * channels;
      return data[idx + c];
    };
    
    const interpolate = (c: number) => {
      const v00 = sample(x0, y0, c);
      const v10 = sample(x1, y0, c);
      const v01 = sample(x0, y1, c);
      const v11 = sample(x1, y1, c);
      
      return v00 * (1 - fx) * (1 - fy) +
             v10 * fx * (1 - fy) +
             v01 * (1 - fx) * fy +
             v11 * fx * fy;
    };
    
    return {
      r: interpolate(0),
      g: interpolate(1),
      b: interpolate(2),
      a: channels === 4 ? interpolate(3) : 255
    };
  }

  reset(): void {
    this.previousFrame = null;
    this.motionHistory = [];
    this.currentFrame = 0;
  }
}
