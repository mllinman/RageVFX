/**
 * MotionGraphicsNode - Motion graphics creation similar to After Effects
 * Version 3.5 - Motion Graphics
 * 
 * Creates animated shape layers, motion paths, and keyframe-driven graphics
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

// Motion path point interface
interface MotionPathPoint {
  x: number;
  y: number;
  time: number;  // Normalized time 0-1
  easing: string;
  tangentIn?: { x: number; y: number };
  tangentOut?: { x: number; y: number };
}

// Shape layer interface
interface ShapeLayer {
  id: string;
  type: 'rectangle' | 'ellipse' | 'polygon' | 'star' | 'path' | 'text';
  position: { x: number; y: number };
  rotation: number;
  scale: { x: number; y: number };
  opacity: number;
  fill: { r: number; g: number; b: number; a: number };
  stroke: { r: number; g: number; b: number; a: number };
  strokeWidth: number;
  // Shape-specific properties
  width?: number;
  height?: number;
  radius?: number;
  points?: number;
  innerRadius?: number;
  cornerRadius?: number;
  pathPoints?: { x: number; y: number }[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

// Animation keyframe
interface AnimationKeyframe {
  time: number;
  value: number | { x: number; y: number } | { r: number; g: number; b: number; a: number };
  easing: 'linear' | 'smooth' | 'stepped' | 'bezier';
  bezierHandles?: {
    in: { x: number; y: number };
    out: { x: number; y: number };
  };
}

// Animated property
interface AnimatedProperty {
  name: string;
  keyframes: AnimationKeyframe[];
}

export class MotionGraphicsNode extends Node {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private shapeLayers: ShapeLayer[] = [];
  private motionPath: MotionPathPoint[] = [];
  private animatedProperties: Map<string, AnimatedProperty> = new Map();

  constructor(id: string) {
    super(id, 'MotionGraphics', 'Motion Graphics');
    this.metadata.category = 'MotionGraphics';
    this.metadata.description = 'Create motion graphics with animated shapes, motion paths, and keyframe animation similar to After Effects';
    this.metadata.version = '3.5.0';
    
    this.addInput('image', 'Background', DataType.IMAGE);
    this.addInput('animation', 'Animation Data', DataType.ANIMATION);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('animation', 'Animation', DataType.ANIMATION);
    
    // Canvas dimensions
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Time parameters
    this.setParameter('time', 0); // Current time normalized 0-1
    this.setParameter('duration', 5.0); // Duration in seconds
    this.setParameter('fps', 24);
    
    // Motion path settings
    this.setParameter('motionPathEnabled', false);
    this.setParameter('motionPath', [
      { x: 0.2, y: 0.5, time: 0, easing: 'smooth' },
      { x: 0.5, y: 0.3, time: 0.33, easing: 'smooth' },
      { x: 0.8, y: 0.5, time: 0.66, easing: 'smooth' },
      { x: 0.5, y: 0.7, time: 1, easing: 'smooth' }
    ]);
    this.setParameter('motionPathClosed', true);
    this.setParameter('orientToPath', false);
    
    // Default shape layer
    this.setParameter('shapeLayers', [
      {
        id: 'layer_1',
        type: 'rectangle',
        position: { x: 0.5, y: 0.5 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        opacity: 1,
        fill: { r: 255, g: 107, b: 53, a: 255 },
        stroke: { r: 255, g: 255, b: 255, a: 255 },
        strokeWidth: 2,
        width: 200,
        height: 150,
        cornerRadius: 10
      }
    ] as ShapeLayer[]);
    
    // Animation presets
    this.setParameter('animationPreset', 'none'); // none, fadeIn, fadeOut, scaleUp, scaleDown, slideIn, slideOut, bounce, elastic, spin
    this.setParameter('animationDirection', 'left'); // left, right, up, down
    this.setParameter('animationEasing', 'smooth'); // linear, smooth, stepped, bezier
    
    // Blend mode
    this.setParameter('blendMode', 'normal'); // normal, add, multiply, screen, overlay
    
    // Initialize offscreen canvas if in browser environment
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }
  }

  /**
   * Add a shape layer
   */
  addShapeLayer(layer: ShapeLayer): void {
    const layers = this.getParameter('shapeLayers') as ShapeLayer[];
    layers.push(layer);
    this.setParameter('shapeLayers', layers);
    this.markDirty();
  }

  /**
   * Add a motion path point
   */
  addMotionPathPoint(point: MotionPathPoint): void {
    const path = this.getParameter('motionPath') as MotionPathPoint[];
    path.push(point);
    // Sort by time
    path.sort((a, b) => a.time - b.time);
    this.setParameter('motionPath', path);
    this.markDirty();
  }

  /**
   * Interpolate value based on easing
   */
  private interpolateEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'smooth':
        // Smooth step (ease in-out)
        return t * t * (3 - 2 * t);
      case 'stepped':
        return Math.floor(t);
      case 'bezier':
        // Cubic bezier approximation (ease in-out)
        return t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t;
    }
  }

  /**
   * Get position on motion path at time t
   */
  private getMotionPathPosition(t: number): { x: number; y: number; angle: number } {
    const path = this.getParameter('motionPath') as MotionPathPoint[];
    const closed = this.getParameter('motionPathClosed') as boolean;
    
    if (path.length === 0) {
      return { x: 0.5, y: 0.5, angle: 0 };
    }
    
    if (path.length === 1) {
      return { x: path[0].x, y: path[0].y, angle: 0 };
    }
    
    // Handle looping for closed paths
    if (closed) {
      t = t % 1;
      if (t < 0) t += 1;
    } else {
      t = Math.max(0, Math.min(1, t));
    }
    
    // Find the segment
    let startIdx = 0;
    let endIdx = 1;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (t >= path[i].time && t <= path[i + 1].time) {
        startIdx = i;
        endIdx = i + 1;
        break;
      }
    }
    
    // Handle closed path wrapping
    if (closed && t >= path[path.length - 1].time) {
      startIdx = path.length - 1;
      endIdx = 0;
    }
    
    const p1 = path[startIdx];
    const p2 = path[endIdx];
    
    // Calculate segment progress
    let segmentDuration = p2.time - p1.time;
    if (closed && segmentDuration < 0) {
      segmentDuration = 1 - p1.time + p2.time;
    }
    
    let segmentT = (t - p1.time) / segmentDuration;
    if (closed && segmentT < 0) {
      segmentT = (t + 1 - p1.time) / segmentDuration;
    }
    
    // Apply easing
    segmentT = this.interpolateEasing(segmentT, p1.easing);
    
    // Catmull-Rom spline interpolation for smooth curves
    const p0 = path[(startIdx - 1 + path.length) % path.length];
    const p3 = path[(endIdx + 1) % path.length];
    
    const tt = segmentT;
    const tt2 = tt * tt;
    const tt3 = tt2 * tt;
    
    // Catmull-Rom coefficients
    const x = 0.5 * ((2 * p1.x) +
      (-p0.x + p2.x) * tt +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tt3);
    
    const y = 0.5 * ((2 * p1.y) +
      (-p0.y + p2.y) * tt +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tt3);
    
    // Calculate tangent angle for orient to path
    const dx = (-p0.x + p2.x) +
      (4 * p0.x - 10 * p1.x + 8 * p2.x - 2 * p3.x) * tt +
      (-3 * p0.x + 9 * p1.x - 9 * p2.x + 3 * p3.x) * tt2;
    const dy = (-p0.y + p2.y) +
      (4 * p0.y - 10 * p1.y + 8 * p2.y - 2 * p3.y) * tt +
      (-3 * p0.y + 9 * p1.y - 9 * p2.y + 3 * p3.y) * tt2;
    
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    return { x, y, angle };
  }

  /**
   * Apply animation preset
   */
  private applyAnimationPreset(
    layer: ShapeLayer, 
    t: number, 
    preset: string, 
    direction: string,
    easing: string
  ): { position: { x: number; y: number }; rotation: number; scale: { x: number; y: number }; opacity: number } {
    const easedT = this.interpolateEasing(t, easing);
    
    const position = { x: layer.position.x, y: layer.position.y };
    let rotation = layer.rotation;
    const scale = { x: layer.scale.x, y: layer.scale.y };
    let opacity = layer.opacity;
    
    switch (preset) {
      case 'fadeIn':
        opacity = layer.opacity * easedT;
        break;
      case 'fadeOut':
        opacity = layer.opacity * (1 - easedT);
        break;
      case 'scaleUp':
        scale.x = layer.scale.x * easedT;
        scale.y = layer.scale.y * easedT;
        break;
      case 'scaleDown':
        scale.x = layer.scale.x * (1 - easedT);
        scale.y = layer.scale.y * (1 - easedT);
        break;
      case 'slideIn':
        {
          const offset = 1 - easedT;
          switch (direction) {
            case 'left': position.x -= offset; break;
            case 'right': position.x += offset; break;
            case 'up': position.y -= offset; break;
            case 'down': position.y += offset; break;
          }
        }
        break;
      case 'slideOut':
        {
          const offset = easedT;
          switch (direction) {
            case 'left': position.x -= offset; break;
            case 'right': position.x += offset; break;
            case 'up': position.y -= offset; break;
            case 'down': position.y += offset; break;
          }
        }
        break;
      case 'bounce':
        {
          // Bounce easing
          const bounce = Math.abs(Math.sin(easedT * Math.PI * 3) * (1 - easedT));
          scale.x = layer.scale.x * (1 + bounce * 0.3);
          scale.y = layer.scale.y * (1 + bounce * 0.3);
        }
        break;
      case 'elastic':
        {
          // Elastic easing
          const elastic = Math.sin(easedT * Math.PI * 4) * Math.exp(-easedT * 3);
          scale.x = layer.scale.x * (1 + elastic * 0.2);
          scale.y = layer.scale.y * (1 + elastic * 0.2);
        }
        break;
      case 'spin':
        rotation = layer.rotation + easedT * 360;
        break;
    }
    
    return { position, rotation, scale, opacity };
  }

  /**
   * Draw a shape layer
   */
  private drawShapeLayer(ctx: CanvasRenderingContext2D, layer: ShapeLayer, width: number, height: number): void {
    ctx.save();
    
    // Transform to layer position
    const x = layer.position.x * width;
    const y = layer.position.y * height;
    
    ctx.translate(x, y);
    ctx.rotate(layer.rotation * Math.PI / 180);
    ctx.scale(layer.scale.x, layer.scale.y);
    ctx.globalAlpha = layer.opacity;
    
    // Set styles
    ctx.fillStyle = `rgba(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b}, ${layer.fill.a / 255})`;
    ctx.strokeStyle = `rgba(${layer.stroke.r}, ${layer.stroke.g}, ${layer.stroke.b}, ${layer.stroke.a / 255})`;
    ctx.lineWidth = layer.strokeWidth;
    
    ctx.beginPath();
    
    switch (layer.type) {
      case 'rectangle':
        {
          const w = layer.width || 100;
          const h = layer.height || 100;
          const r = layer.cornerRadius || 0;
          
          if (r > 0) {
            // Rounded rectangle
            ctx.moveTo(-w/2 + r, -h/2);
            ctx.lineTo(w/2 - r, -h/2);
            ctx.arcTo(w/2, -h/2, w/2, -h/2 + r, r);
            ctx.lineTo(w/2, h/2 - r);
            ctx.arcTo(w/2, h/2, w/2 - r, h/2, r);
            ctx.lineTo(-w/2 + r, h/2);
            ctx.arcTo(-w/2, h/2, -w/2, h/2 - r, r);
            ctx.lineTo(-w/2, -h/2 + r);
            ctx.arcTo(-w/2, -h/2, -w/2 + r, -h/2, r);
          } else {
            ctx.rect(-w/2, -h/2, w, h);
          }
        }
        break;
        
      case 'ellipse':
        {
          const rx = (layer.width || 100) / 2;
          const ry = (layer.height || 100) / 2;
          ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        }
        break;
        
      case 'polygon':
        {
          const points = layer.points || 6;
          const radius = layer.radius || 50;
          
          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (i === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.closePath();
        }
        break;
        
      case 'star':
        {
          const points = layer.points || 5;
          const outerRadius = layer.radius || 50;
          const innerRadius = layer.innerRadius || 25;
          
          for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (i === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.closePath();
        }
        break;
        
      case 'path':
        {
          const pathPoints = layer.pathPoints || [];
          if (pathPoints.length > 0) {
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (let i = 1; i < pathPoints.length; i++) {
              ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
            }
          }
        }
        break;
        
      case 'text':
        {
          const text = layer.text || 'Text';
          const fontSize = layer.fontSize || 48;
          const fontFamily = layer.fontFamily || 'Arial';
          
          ctx.font = `${fontSize}px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (layer.fill.a > 0) {
            ctx.fillText(text, 0, 0);
          }
          if (layer.stroke.a > 0 && layer.strokeWidth > 0) {
            ctx.strokeText(text, 0, 0);
          }
          ctx.restore();
          return;
        }
    }
    
    // Fill and stroke
    if (layer.fill.a > 0) {
      ctx.fill();
    }
    if (layer.stroke.a > 0 && layer.strokeWidth > 0) {
      ctx.stroke();
    }
    
    ctx.restore();
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const time = this.getParameter('time');
    const shapeLayers = this.getParameter('shapeLayers') as ShapeLayer[];
    const motionPathEnabled = this.getParameter('motionPathEnabled');
    const orientToPath = this.getParameter('orientToPath');
    const animationPreset = this.getParameter('animationPreset');
    const animationDirection = this.getParameter('animationDirection');
    const animationEasing = this.getParameter('animationEasing');
    
    const data = new Uint8Array(width * height * 4);
    const inputData = this.inputs.get('image')?.value as ImageData | undefined;
    
    // Copy input image if available
    if (inputData) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const srcIdx = (Math.min(y, inputData.height - 1) * inputData.width + Math.min(x, inputData.width - 1)) * inputData.channels;
          data[idx] = inputData.data[srcIdx];
          data[idx + 1] = inputData.data[srcIdx + 1] || inputData.data[srcIdx];
          data[idx + 2] = inputData.data[srcIdx + 2] || inputData.data[srcIdx];
          data[idx + 3] = inputData.channels === 4 ? inputData.data[srcIdx + 3] : 255;
        }
      }
    }
    
    // Use canvas for rendering
    if (this.offscreenCanvas && this.offscreenCtx) {
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      const ctx = this.offscreenCtx;
      
      ctx.clearRect(0, 0, width, height);
      
      // Get motion path position if enabled
      let motionPathPos = { x: 0.5, y: 0.5, angle: 0 };
      if (motionPathEnabled) {
        motionPathPos = this.getMotionPathPosition(time);
      }
      
      // Draw each shape layer
      for (const layer of shapeLayers) {
        // Create a working copy of the layer
        const workingLayer = { ...layer };
        
        // Apply motion path if enabled
        if (motionPathEnabled) {
          workingLayer.position = { x: motionPathPos.x, y: motionPathPos.y };
          if (orientToPath) {
            workingLayer.rotation = (layer.rotation || 0) + motionPathPos.angle;
          }
        }
        
        // Apply animation preset
        if (animationPreset !== 'none') {
          const animated = this.applyAnimationPreset(
            workingLayer, 
            time, 
            animationPreset, 
            animationDirection,
            animationEasing
          );
          workingLayer.position = animated.position;
          workingLayer.rotation = animated.rotation;
          workingLayer.scale = animated.scale;
          workingLayer.opacity = animated.opacity;
        }
        
        this.drawShapeLayer(ctx, workingLayer, width, height);
      }
      
      // Get rendered graphics data
      const graphicsImageData = ctx.getImageData(0, 0, width, height);
      
      // Composite graphics over background
      const blendMode = this.getParameter('blendMode');
      
      for (let i = 0; i < width * height * 4; i += 4) {
        const gfxAlpha = graphicsImageData.data[i + 3] / 255;
        
        if (gfxAlpha > 0) {
          const srcR = graphicsImageData.data[i];
          const srcG = graphicsImageData.data[i + 1];
          const srcB = graphicsImageData.data[i + 2];
          const dstR = data[i];
          const dstG = data[i + 1];
          const dstB = data[i + 2];
          
          let outR: number, outG: number, outB: number;
          
          switch (blendMode) {
            case 'add':
              outR = Math.min(255, dstR + srcR * gfxAlpha);
              outG = Math.min(255, dstG + srcG * gfxAlpha);
              outB = Math.min(255, dstB + srcB * gfxAlpha);
              break;
            case 'multiply':
              outR = (dstR * srcR / 255) * gfxAlpha + dstR * (1 - gfxAlpha);
              outG = (dstG * srcG / 255) * gfxAlpha + dstG * (1 - gfxAlpha);
              outB = (dstB * srcB / 255) * gfxAlpha + dstB * (1 - gfxAlpha);
              break;
            case 'screen':
              outR = (255 - (255 - dstR) * (255 - srcR) / 255) * gfxAlpha + dstR * (1 - gfxAlpha);
              outG = (255 - (255 - dstG) * (255 - srcG) / 255) * gfxAlpha + dstG * (1 - gfxAlpha);
              outB = (255 - (255 - dstB) * (255 - srcB) / 255) * gfxAlpha + dstB * (1 - gfxAlpha);
              break;
            case 'overlay':
              outR = dstR < 128 
                ? (2 * dstR * srcR / 255) * gfxAlpha + dstR * (1 - gfxAlpha)
                : (255 - 2 * (255 - dstR) * (255 - srcR) / 255) * gfxAlpha + dstR * (1 - gfxAlpha);
              outG = dstG < 128 
                ? (2 * dstG * srcG / 255) * gfxAlpha + dstG * (1 - gfxAlpha)
                : (255 - 2 * (255 - dstG) * (255 - srcG) / 255) * gfxAlpha + dstG * (1 - gfxAlpha);
              outB = dstB < 128 
                ? (2 * dstB * srcB / 255) * gfxAlpha + dstB * (1 - gfxAlpha)
                : (255 - 2 * (255 - dstB) * (255 - srcB) / 255) * gfxAlpha + dstB * (1 - gfxAlpha);
              break;
            default: // normal
              outR = srcR * gfxAlpha + dstR * (1 - gfxAlpha);
              outG = srcG * gfxAlpha + dstG * (1 - gfxAlpha);
              outB = srcB * gfxAlpha + dstB * (1 - gfxAlpha);
          }
          
          data[i] = Math.min(255, Math.max(0, outR));
          data[i + 1] = Math.min(255, Math.max(0, outG));
          data[i + 2] = Math.min(255, Math.max(0, outB));
          data[i + 3] = Math.min(255, Math.max(data[i + 3], graphicsImageData.data[i + 3]));
        }
      }
    }
    
    const output = this.outputs.get('image');
    if (output) {
      output.value = {
        width,
        height,
        channels: 4,
        data,
        format: 'rgba'
      };
    }
    
    // Output animation data
    const animOutput = this.outputs.get('animation');
    if (animOutput) {
      animOutput.value = {
        time,
        shapeLayers,
        motionPath: this.getParameter('motionPath'),
        animationPreset,
        animationEasing
      };
    }
  }
}
