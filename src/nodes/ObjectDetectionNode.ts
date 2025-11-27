/**
 * ObjectDetectionNode - Object detection and segmentation using AI
 * Version 2.0 - Machine Learning Powered Tools
 */

import { Node, DataType } from '../core/Node';

export interface DetectedObject {
  id: number;
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  mask?: Uint8Array;
  keypoints?: Array<{ x: number; y: number; confidence: number; name: string }>;
}

export class ObjectDetectionNode extends Node {
  private detections: DetectedObject[] = [];

  constructor(id: string) {
    super(id, 'ObjectDetection', 'Object Detection');
    this.metadata.category = 'ML';
    this.metadata.description = 'AI-powered object detection and segmentation';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('image', 'Image', DataType.IMAGE);
    
    // Outputs
    this.addOutput('image', 'Annotated Image', DataType.IMAGE);
    this.addOutput('mask', 'Segmentation Mask', DataType.IMAGE);
    this.addOutput('detections', 'Detections', DataType.ANY);
    this.addOutput('mattes', 'Object Mattes', DataType.ANY);
    
    // Model settings
    this.setParameter('model', 'yolo'); // yolo, mask-rcnn, sam, detectron2
    this.setParameter('modelPath', '');
    this.setParameter('task', 'detection'); // detection, segmentation, keypoints
    
    // Detection parameters
    this.setParameter('confidenceThreshold', 0.5);
    this.setParameter('nmsThreshold', 0.4); // Non-max suppression
    this.setParameter('maxDetections', 100);
    
    // Class filtering
    this.setParameter('classFilter', []); // Empty = all classes
    this.setParameter('excludeClasses', []);
    
    // Output settings
    this.setParameter('drawBoxes', true);
    this.setParameter('drawLabels', true);
    this.setParameter('drawMasks', true);
    this.setParameter('drawKeypoints', false);
    this.setParameter('boxColor', { r: 0, g: 255, b: 0 });
    this.setParameter('boxThickness', 2);
    this.setParameter('labelFontSize', 12);
    
    // SAM-specific settings
    this.setParameter('samPoints', []); // Click points for SAM
    this.setParameter('samBoxes', []); // Box prompts for SAM
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    
    if (!imageInput?.value) {
      return;
    }
    
    const width = imageInput.value.width;
    const height = imageInput.value.height;
    const srcData = imageInput.value.data;
    
    const outputData = new Uint8Array(width * height * 4);
    const maskData = new Uint8Array(width * height * 4);
    
    // Copy source to output
    outputData.set(srcData);
    
    // Placeholder detection - simulates object detection
    // In a real implementation, this would use ONNX Runtime or TensorFlow.js
    this.detections = this.simulateDetection(srcData, width, height);
    
    // Apply confidence threshold
    const confidenceThreshold = this.getParameter('confidenceThreshold');
    this.detections = this.detections.filter(d => d.confidence >= confidenceThreshold);
    
    // Apply NMS
    this.detections = this.nonMaxSuppression(this.detections, this.getParameter('nmsThreshold'));
    
    // Limit detections
    this.detections = this.detections.slice(0, this.getParameter('maxDetections'));
    
    // Generate masks
    const mattes: Map<number, Uint8Array> = new Map();
    for (const detection of this.detections) {
      const matte = this.generateObjectMatte(width, height, detection);
      mattes.set(detection.id, matte);
      
      // Add to combined mask
      for (let y = detection.bbox.y; y < detection.bbox.y + detection.bbox.height && y < height; y++) {
        for (let x = detection.bbox.x; x < detection.bbox.x + detection.bbox.width && x < width; x++) {
          const i = (y * width + x) * 4;
          const mi = ((y - detection.bbox.y) * detection.bbox.width + (x - detection.bbox.x));
          
          if (detection.mask && detection.mask[mi] > 128) {
            // Use detection-specific color
            const hue = (detection.id * 137) % 360;
            const color = this.hslToRgb(hue / 360, 0.7, 0.5);
            
            maskData[i] = color.r;
            maskData[i + 1] = color.g;
            maskData[i + 2] = color.b;
            maskData[i + 3] = 255;
          }
        }
      }
    }
    
    // Draw annotations
    if (this.getParameter('drawBoxes')) {
      this.drawBoundingBoxes(outputData, width, height, this.detections);
    }
    
    if (this.getParameter('drawLabels')) {
      this.drawLabels(outputData, width, height, this.detections);
    }
    
    if (this.getParameter('drawMasks')) {
      this.overlayMasks(outputData, width, height, this.detections, 0.4);
    }
    
    if (this.getParameter('drawKeypoints')) {
      this.drawKeypoints(outputData, width, height, this.detections);
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width,
        height,
        channels: 4,
        data: outputData,
        format: 'rgba'
      };
    }
    
    const maskOutput = this.outputs.get('mask');
    if (maskOutput) {
      maskOutput.value = {
        width,
        height,
        channels: 4,
        data: maskData,
        format: 'rgba'
      };
    }
    
    const detectionsOutput = this.outputs.get('detections');
    if (detectionsOutput) {
      detectionsOutput.value = this.detections;
    }
    
    const mattesOutput = this.outputs.get('mattes');
    if (mattesOutput) {
      mattesOutput.value = Object.fromEntries(mattes);
    }
  }

  private simulateDetection(data: Uint8Array, width: number, height: number): DetectedObject[] {
    // Simulate object detection based on image analysis
    // This is a placeholder - real implementation would use a neural network
    
    const detections: DetectedObject[] = [];
    const labels = ['person', 'car', 'dog', 'cat', 'chair', 'table'];
    
    // Find regions of interest based on edge density
    const blockSize = 64;
    let detectionId = 0;
    
    for (let by = 0; by < height - blockSize; by += blockSize) {
      for (let bx = 0; bx < width - blockSize; bx += blockSize) {
        // Calculate edge density in this block
        let edgeSum = 0;
        let count = 0;
        
        for (let y = by + 1; y < by + blockSize - 1; y += 2) {
          for (let x = bx + 1; x < bx + blockSize - 1; x += 2) {
            // Calculate index positions for edge detection
            const iL = ((y) * width + (x - 1)) * 4;
            const iR = ((y) * width + (x + 1)) * 4;
            const iT = ((y - 1) * width + x) * 4;
            const iB = ((y + 1) * width + x) * 4;
            
            const grayL = (data[iL] + data[iL + 1] + data[iL + 2]) / 3;
            const grayR = (data[iR] + data[iR + 1] + data[iR + 2]) / 3;
            const grayT = (data[iT] + data[iT + 1] + data[iT + 2]) / 3;
            const grayB = (data[iB] + data[iB + 1] + data[iB + 2]) / 3;
            
            const edgeX = Math.abs(grayR - grayL);
            const edgeY = Math.abs(grayB - grayT);
            edgeSum += Math.sqrt(edgeX * edgeX + edgeY * edgeY);
            count++;
          }
        }
        
        const avgEdge = edgeSum / count;
        
        // Create detection if sufficient edge activity
        if (avgEdge > 15 && Math.random() < 0.3) {
          const confidence = 0.4 + Math.random() * 0.5;
          const label = labels[Math.floor(Math.random() * labels.length)];
          
          // Create a simple elliptical mask
          const mask = new Uint8Array(blockSize * blockSize);
          const cx = blockSize / 2;
          const cy = blockSize / 2;
          const rx = blockSize / 2 * 0.8;
          const ry = blockSize / 2 * 0.8;
          
          for (let my = 0; my < blockSize; my++) {
            for (let mx = 0; mx < blockSize; mx++) {
              const dx = (mx - cx) / rx;
              const dy = (my - cy) / ry;
              if (dx * dx + dy * dy <= 1) {
                mask[my * blockSize + mx] = 255;
              }
            }
          }
          
          detections.push({
            id: detectionId++,
            label,
            confidence,
            bbox: {
              x: bx,
              y: by,
              width: blockSize,
              height: blockSize
            },
            mask
          });
        }
      }
    }
    
    return detections;
  }

  private nonMaxSuppression(detections: DetectedObject[], threshold: number): DetectedObject[] {
    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);
    
    const keep: DetectedObject[] = [];
    const suppressed: Set<number> = new Set();
    
    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue;
      
      keep.push(detections[i]);
      
      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue;
        
        const iou = this.calculateIoU(detections[i].bbox, detections[j].bbox);
        if (iou > threshold) {
          suppressed.add(j);
        }
      }
    }
    
    return keep;
  }

  private calculateIoU(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.width, b.x + b.width);
    const y2 = Math.min(a.y + a.height, b.y + b.height);
    
    if (x2 < x1 || y2 < y1) return 0;
    
    const intersection = (x2 - x1) * (y2 - y1);
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    
    return intersection / (areaA + areaB - intersection);
  }

  private generateObjectMatte(width: number, height: number, detection: DetectedObject): Uint8Array {
    const matte = new Uint8Array(width * height);
    
    if (detection.mask) {
      for (let y = 0; y < detection.bbox.height && detection.bbox.y + y < height; y++) {
        for (let x = 0; x < detection.bbox.width && detection.bbox.x + x < width; x++) {
          const mi = y * detection.bbox.width + x;
          const oi = (detection.bbox.y + y) * width + (detection.bbox.x + x);
          matte[oi] = detection.mask[mi];
        }
      }
    }
    
    return matte;
  }

  private drawBoundingBoxes(data: Uint8Array, width: number, height: number, detections: DetectedObject[]): void {
    const color = this.getParameter('boxColor');
    const thickness = this.getParameter('boxThickness');
    
    for (const det of detections) {
      // Draw rectangle
      const x1 = Math.floor(det.bbox.x);
      const y1 = Math.floor(det.bbox.y);
      const x2 = Math.floor(det.bbox.x + det.bbox.width);
      const y2 = Math.floor(det.bbox.y + det.bbox.height);
      
      // Top and bottom edges
      for (let x = x1; x <= x2; x++) {
        for (let t = 0; t < thickness; t++) {
          this.setPixel(data, width, height, x, y1 + t, color.r, color.g, color.b);
          this.setPixel(data, width, height, x, y2 - t, color.r, color.g, color.b);
        }
      }
      
      // Left and right edges
      for (let y = y1; y <= y2; y++) {
        for (let t = 0; t < thickness; t++) {
          this.setPixel(data, width, height, x1 + t, y, color.r, color.g, color.b);
          this.setPixel(data, width, height, x2 - t, y, color.r, color.g, color.b);
        }
      }
    }
  }

  private drawLabels(data: Uint8Array, width: number, height: number, detections: DetectedObject[]): void {
    // Simple label drawing (in a real app, would use proper text rendering)
    for (const det of detections) {
      const label = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      const x = Math.floor(det.bbox.x);
      const y = Math.floor(det.bbox.y) - 5;
      
      // Draw background
      for (let dy = -12; dy < 2; dy++) {
        for (let dx = 0; dx < label.length * 7; dx++) {
          this.setPixel(data, width, height, x + dx, y + dy, 0, 0, 0);
        }
      }
    }
  }

  private overlayMasks(data: Uint8Array, width: number, height: number, detections: DetectedObject[], opacity: number): void {
    for (const det of detections) {
      if (!det.mask) continue;
      
      const hue = (det.id * 137) % 360;
      const color = this.hslToRgb(hue / 360, 0.7, 0.5);
      
      for (let y = 0; y < det.bbox.height && det.bbox.y + y < height; y++) {
        for (let x = 0; x < det.bbox.width && det.bbox.x + x < width; x++) {
          const mi = y * det.bbox.width + x;
          const i = ((det.bbox.y + y) * width + (det.bbox.x + x)) * 4;
          
          if (det.mask[mi] > 128) {
            data[i] = Math.round(data[i] * (1 - opacity) + color.r * opacity);
            data[i + 1] = Math.round(data[i + 1] * (1 - opacity) + color.g * opacity);
            data[i + 2] = Math.round(data[i + 2] * (1 - opacity) + color.b * opacity);
          }
        }
      }
    }
  }

  private drawKeypoints(data: Uint8Array, width: number, height: number, detections: DetectedObject[]): void {
    for (const det of detections) {
      if (!det.keypoints) continue;
      
      for (const kp of det.keypoints) {
        if (kp.confidence < 0.5) continue;
        
        // Draw a small circle
        const radius = 3;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
              this.setPixel(data, width, height, Math.round(kp.x + dx), Math.round(kp.y + dy), 255, 0, 0);
            }
          }
        }
      }
    }
  }

  private setPixel(data: Uint8Array, width: number, height: number, x: number, y: number, r: number, g: number, b: number): void {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = (y * width + x) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  getDetections(): DetectedObject[] {
    return this.detections;
  }
}
