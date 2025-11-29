/**
 * TransitionNode - Timeline transitions between edits and VFX frames
 * Version 3.5 - Animation
 * 
 * Provides smooth, linear, stepped, and custom transition types
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

// Transition type enum
export enum TransitionType {
  SMOOTH = 'smooth',
  LINEAR = 'linear',
  STEPPED = 'stepped',
  CUSTOM = 'custom',
  EASE_IN = 'easeIn',
  EASE_OUT = 'easeOut',
  EASE_IN_OUT = 'easeInOut',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
  BACK = 'back',
  EXPO = 'expo',
  CIRC = 'circ',
  SINE = 'sine',
  QUAD = 'quad',
  CUBIC = 'cubic',
  QUART = 'quart',
  QUINT = 'quint'
}

// Visual transition effect
export enum TransitionEffect {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE = 'fade',
  WIPE = 'wipe',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  IRIS = 'iris',
  PUSH = 'push',
  REVEAL = 'reveal',
  MORPH = 'morph',
  BLUR = 'blur',
  PIXELATE = 'pixelate',
  SWIRL = 'swirl',
  GLITCH = 'glitch'
}

// Custom bezier curve control point
interface BezierControlPoint {
  x: number;
  y: number;
}

// Transition keyframe
interface TransitionKeyframe {
  time: number;
  value: number;
  bezierIn?: BezierControlPoint;
  bezierOut?: BezierControlPoint;
}

export class TransitionNode extends Node {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private customCurve: TransitionKeyframe[] = [];

  constructor(id: string) {
    super(id, 'Transition', 'Transition');
    this.metadata.category = 'Animation';
    this.metadata.description = 'Create timeline transitions between edits with smooth, linear, stepped, and custom interpolation';
    this.metadata.version = '3.5.0';
    
    this.addInput('imageA', 'Image A (From)', DataType.IMAGE);
    this.addInput('imageB', 'Image B (To)', DataType.IMAGE);
    this.addInput('mask', 'Custom Mask', DataType.MASK);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('progress', 'Progress Value', DataType.NUMBER);
    
    // Canvas dimensions
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Transition timing
    this.setParameter('time', 0.5); // Normalized transition progress 0-1
    this.setParameter('duration', 1.0); // Duration in seconds
    this.setParameter('startFrame', 0);
    this.setParameter('endFrame', 24);
    
    // Transition type
    this.setParameter('transitionType', TransitionType.SMOOTH);
    this.setParameter('transitionEffect', TransitionEffect.DISSOLVE);
    
    // Easing parameters
    this.setParameter('easingPower', 2.0); // Power for polynomial easing
    this.setParameter('elasticAmplitude', 1.0);
    this.setParameter('elasticPeriod', 0.3);
    this.setParameter('backOvershoot', 1.70158);
    
    // Visual effect parameters
    this.setParameter('wipeAngle', 0); // degrees
    this.setParameter('wipeSoftness', 0.1);
    this.setParameter('slideDirection', 'left'); // left, right, up, down
    this.setParameter('zoomCenter', { x: 0.5, y: 0.5 });
    this.setParameter('irisShape', 'circle'); // circle, diamond, square, star
    this.setParameter('pushDirection', 'left');
    
    // Glitch parameters
    this.setParameter('glitchIntensity', 0.5);
    this.setParameter('glitchBlockSize', 10);
    
    // Blur parameters
    this.setParameter('blurAmount', 20);
    
    // Pixelate parameters
    this.setParameter('pixelSize', 20);
    
    // Swirl parameters
    this.setParameter('swirlStrength', 10);
    
    // Custom curve keyframes
    this.setParameter('customCurve', [
      { time: 0, value: 0 },
      { time: 0.5, value: 0.5, bezierIn: { x: 0.25, y: 0 }, bezierOut: { x: 0.75, y: 1 } },
      { time: 1, value: 1 }
    ] as TransitionKeyframe[]);
    
    // Stepped transition
    this.setParameter('stepCount', 4);
    
    // Reverse transition
    this.setParameter('reverse', false);
    
    // Initialize offscreen canvas if in browser environment
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }
  }

  /**
   * Calculate eased progress based on transition type
   */
  private calculateEasedProgress(t: number): number {
    const type = this.getParameter('transitionType') as TransitionType;
    const reverse = this.getParameter('reverse') as boolean;
    
    if (reverse) {
      t = 1 - t;
    }
    
    // Clamp t to 0-1 range
    t = Math.max(0, Math.min(1, t));
    
    switch (type) {
      case TransitionType.LINEAR:
        return t;
        
      case TransitionType.SMOOTH:
        // Smooth step (Hermite interpolation)
        return t * t * (3 - 2 * t);
        
      case TransitionType.STEPPED:
        {
          const steps = this.getParameter('stepCount') as number;
          return Math.floor(t * steps) / steps;
        }
        
      case TransitionType.CUSTOM:
        return this.evaluateCustomCurve(t);
        
      case TransitionType.EASE_IN:
        {
          const power = this.getParameter('easingPower') as number;
          return Math.pow(t, power);
        }
        
      case TransitionType.EASE_OUT:
        {
          const power = this.getParameter('easingPower') as number;
          return 1 - Math.pow(1 - t, power);
        }
        
      case TransitionType.EASE_IN_OUT:
        {
          const power = this.getParameter('easingPower') as number;
          return t < 0.5
            ? Math.pow(2, power - 1) * Math.pow(t, power)
            : 1 - Math.pow(-2 * t + 2, power) / 2;
        }
        
      case TransitionType.BOUNCE:
        return this.bounceEase(t);
        
      case TransitionType.ELASTIC:
        return this.elasticEase(t);
        
      case TransitionType.BACK:
        return this.backEase(t);
        
      case TransitionType.EXPO:
        return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2;
        
      case TransitionType.CIRC:
        return t < 0.5
          ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
          : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
        
      case TransitionType.SINE:
        return -(Math.cos(Math.PI * t) - 1) / 2;
        
      case TransitionType.QUAD:
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        
      case TransitionType.CUBIC:
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
      case TransitionType.QUART:
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
        
      case TransitionType.QUINT:
        return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
        
      default:
        return t;
    }
  }

  /**
   * Bounce easing function
   */
  private bounceEase(t: number): number {
    const bounceOut = (x: number): number => {
      const n1 = 7.5625;
      const d1 = 2.75;
      
      if (x < 1 / d1) {
        return n1 * x * x;
      } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
      } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
      } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
      }
    };
    
    return t < 0.5
      ? (1 - bounceOut(1 - 2 * t)) / 2
      : (1 + bounceOut(2 * t - 1)) / 2;
  }

  /**
   * Elastic easing function
   */
  private elasticEase(t: number): number {
    const amplitude = this.getParameter('elasticAmplitude') as number;
    const period = this.getParameter('elasticPeriod') as number;
    
    if (t === 0 || t === 1) return t;
    
    const c4 = (2 * Math.PI) / period;
    const s = amplitude < 1
      ? period / 4
      : period / (2 * Math.PI) * Math.asin(1 / amplitude);
    
    if (t < 0.5) {
      return -(amplitude * Math.pow(2, 20 * t - 10) * 
        Math.sin((20 * t - 10 - s * (2 * Math.PI / period)) * c4)) / 2;
    }
    
    return amplitude * Math.pow(2, -20 * t + 10) * 
      Math.sin((20 * t - 10 - s * (2 * Math.PI / period)) * c4) / 2 + 1;
  }

  /**
   * Back easing function (overshoot)
   */
  private backEase(t: number): number {
    const s = this.getParameter('backOvershoot') as number;
    const c2 = s * 1.525;
    
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  }

  /**
   * Evaluate custom bezier curve at time t
   */
  private evaluateCustomCurve(t: number): number {
    const keyframes = this.getParameter('customCurve') as TransitionKeyframe[];
    
    if (keyframes.length === 0) return t;
    if (keyframes.length === 1) return keyframes[0].value;
    
    // Find surrounding keyframes
    let startKf = keyframes[0];
    let endKf = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
        startKf = keyframes[i];
        endKf = keyframes[i + 1];
        break;
      }
    }
    
    // Calculate local t within segment
    const segmentDuration = endKf.time - startKf.time;
    const localT = segmentDuration > 0 ? (t - startKf.time) / segmentDuration : 0;
    
    // Simple cubic bezier interpolation
    if (startKf.bezierOut && endKf.bezierIn) {
      const p0 = startKf.value;
      const p1 = startKf.bezierOut.y;
      const p2 = endKf.bezierIn.y;
      const p3 = endKf.value;
      
      const oneMinusT = 1 - localT;
      return oneMinusT * oneMinusT * oneMinusT * p0 +
        3 * oneMinusT * oneMinusT * localT * p1 +
        3 * oneMinusT * localT * localT * p2 +
        localT * localT * localT * p3;
    }
    
    // Linear fallback
    return startKf.value + (endKf.value - startKf.value) * localT;
  }

  /**
   * Apply visual transition effect
   */
  private applyTransitionEffect(
    dataA: Uint8Array, 
    dataB: Uint8Array, 
    output: Uint8Array, 
    width: number, 
    height: number, 
    progress: number
  ): void {
    const effect = this.getParameter('transitionEffect') as TransitionEffect;
    
    switch (effect) {
      case TransitionEffect.CUT:
        this.applyCut(dataA, dataB, output, progress);
        break;
      case TransitionEffect.DISSOLVE:
        this.applyDissolve(dataA, dataB, output, progress);
        break;
      case TransitionEffect.FADE:
        this.applyFade(dataA, dataB, output, width, height, progress);
        break;
      case TransitionEffect.WIPE:
        this.applyWipe(dataA, dataB, output, width, height, progress);
        break;
      case TransitionEffect.SLIDE:
        this.applySlide(dataA, dataB, output, width, height, progress);
        break;
      case TransitionEffect.ZOOM:
        this.applyZoom(dataA, dataB, output, width, height, progress);
        break;
      case TransitionEffect.IRIS:
        this.applyIris(dataA, dataB, output, width, height, progress);
        break;
      case TransitionEffect.PUSH:
        this.applyPush(dataA, dataB, output, width, height, progress);
        break;
      case TransitionEffect.BLUR:
        this.applyBlur(dataA, dataB, output, width, height, progress);
        break;
      case TransitionEffect.PIXELATE:
        this.applyPixelate(dataA, dataB, output, width, height, progress);
        break;
      default:
        this.applyDissolve(dataA, dataB, output, progress);
    }
  }

  private applyCut(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, progress: number): void {
    const source = progress < 0.5 ? dataA : dataB;
    for (let i = 0; i < output.length; i++) {
      output[i] = source[i];
    }
  }

  private applyDissolve(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, progress: number): void {
    for (let i = 0; i < output.length; i++) {
      output[i] = Math.round(dataA[i] * (1 - progress) + dataB[i] * progress);
    }
  }

  private applyFade(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, width: number, height: number, progress: number): void {
    // Fade through black
    const midPoint = 0.5;
    
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      
      if (progress < midPoint) {
        const fadeOut = 1 - (progress / midPoint);
        output[idx] = Math.round(dataA[idx] * fadeOut);
        output[idx + 1] = Math.round(dataA[idx + 1] * fadeOut);
        output[idx + 2] = Math.round(dataA[idx + 2] * fadeOut);
        output[idx + 3] = dataA[idx + 3];
      } else {
        const fadeIn = (progress - midPoint) / (1 - midPoint);
        output[idx] = Math.round(dataB[idx] * fadeIn);
        output[idx + 1] = Math.round(dataB[idx + 1] * fadeIn);
        output[idx + 2] = Math.round(dataB[idx + 2] * fadeIn);
        output[idx + 3] = dataB[idx + 3];
      }
    }
  }

  private applyWipe(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, width: number, height: number, progress: number): void {
    const angle = (this.getParameter('wipeAngle') as number) * Math.PI / 180;
    const softness = this.getParameter('wipeSoftness') as number;
    
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Rotated coordinate for wipe direction
        const nx = x / width - 0.5;
        const ny = y / height - 0.5;
        const rotated = nx * cosAngle + ny * sinAngle + 0.5;
        
        // Calculate blend factor with softness
        let blend = (rotated - progress + softness) / (2 * softness);
        blend = Math.max(0, Math.min(1, blend));
        blend = 1 - blend;
        
        output[idx] = Math.round(dataA[idx] * (1 - blend) + dataB[idx] * blend);
        output[idx + 1] = Math.round(dataA[idx + 1] * (1 - blend) + dataB[idx + 1] * blend);
        output[idx + 2] = Math.round(dataA[idx + 2] * (1 - blend) + dataB[idx + 2] * blend);
        output[idx + 3] = Math.round(dataA[idx + 3] * (1 - blend) + dataB[idx + 3] * blend);
      }
    }
  }

  private applySlide(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, width: number, height: number, progress: number): void {
    const direction = this.getParameter('slideDirection') as string;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        let srcXA = x, srcYA = y;
        let srcXB = x, srcYB = y;
        
        switch (direction) {
          case 'left':
            srcXA = x + Math.round(width * progress);
            srcXB = x - Math.round(width * (1 - progress));
            break;
          case 'right':
            srcXA = x - Math.round(width * progress);
            srcXB = x + Math.round(width * (1 - progress));
            break;
          case 'up':
            srcYA = y + Math.round(height * progress);
            srcYB = y - Math.round(height * (1 - progress));
            break;
          case 'down':
            srcYA = y - Math.round(height * progress);
            srcYB = y + Math.round(height * (1 - progress));
            break;
        }
        
        // Determine which image to show
        let useA = srcXA >= 0 && srcXA < width && srcYA >= 0 && srcYA < height;
        let useB = srcXB >= 0 && srcXB < width && srcYB >= 0 && srcYB < height;
        
        if (useA && !useB) {
          const srcIdx = (srcYA * width + srcXA) * 4;
          output[idx] = dataA[srcIdx];
          output[idx + 1] = dataA[srcIdx + 1];
          output[idx + 2] = dataA[srcIdx + 2];
          output[idx + 3] = dataA[srcIdx + 3];
        } else if (useB) {
          const srcIdx = (srcYB * width + srcXB) * 4;
          output[idx] = dataB[srcIdx];
          output[idx + 1] = dataB[srcIdx + 1];
          output[idx + 2] = dataB[srcIdx + 2];
          output[idx + 3] = dataB[srcIdx + 3];
        } else {
          output[idx] = output[idx + 1] = output[idx + 2] = 0;
          output[idx + 3] = 255;
        }
      }
    }
  }

  private applyZoom(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, width: number, height: number, progress: number): void {
    const center = this.getParameter('zoomCenter') as { x: number; y: number };
    const centerX = center.x * width;
    const centerY = center.y * height;
    
    // Zoom out A and zoom in B
    const scaleA = 1 + progress * 2;
    const scaleB = (1 - progress) * 0.5 + 0.5;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Sample from A (zooming out)
        const srcXA = Math.round(centerX + (x - centerX) / scaleA);
        const srcYA = Math.round(centerY + (y - centerY) / scaleA);
        
        // Sample from B (zooming in)  
        const srcXB = Math.round(centerX + (x - centerX) / scaleB);
        const srcYB = Math.round(centerY + (y - centerY) / scaleB);
        
        let rA = 0, gA = 0, bA = 0, aA = 0;
        let rB = 0, gB = 0, bB = 0, aB = 0;
        
        if (srcXA >= 0 && srcXA < width && srcYA >= 0 && srcYA < height) {
          const srcIdx = (srcYA * width + srcXA) * 4;
          rA = dataA[srcIdx];
          gA = dataA[srcIdx + 1];
          bA = dataA[srcIdx + 2];
          aA = dataA[srcIdx + 3];
        }
        
        if (srcXB >= 0 && srcXB < width && srcYB >= 0 && srcYB < height) {
          const srcIdx = (srcYB * width + srcXB) * 4;
          rB = dataB[srcIdx];
          gB = dataB[srcIdx + 1];
          bB = dataB[srcIdx + 2];
          aB = dataB[srcIdx + 3];
        }
        
        output[idx] = Math.round(rA * (1 - progress) + rB * progress);
        output[idx + 1] = Math.round(gA * (1 - progress) + gB * progress);
        output[idx + 2] = Math.round(bA * (1 - progress) + bB * progress);
        output[idx + 3] = Math.round(aA * (1 - progress) + aB * progress);
      }
    }
  }

  private applyIris(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, width: number, height: number, progress: number): void {
    const shape = this.getParameter('irisShape') as string;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    const currentRadius = progress * maxRadius;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        
        let dist: number;
        
        switch (shape) {
          case 'diamond':
            dist = Math.abs(dx) + Math.abs(dy);
            break;
          case 'square':
            dist = Math.max(Math.abs(dx), Math.abs(dy)) * Math.sqrt(2);
            break;
          case 'star':
            {
              const angle = Math.atan2(dy, dx);
              const starFactor = 0.5 + 0.5 * Math.cos(5 * angle);
              dist = Math.sqrt(dx * dx + dy * dy) / starFactor;
            }
            break;
          default: // circle
            dist = Math.sqrt(dx * dx + dy * dy);
        }
        
        if (dist < currentRadius) {
          output[idx] = dataB[idx];
          output[idx + 1] = dataB[idx + 1];
          output[idx + 2] = dataB[idx + 2];
          output[idx + 3] = dataB[idx + 3];
        } else {
          output[idx] = dataA[idx];
          output[idx + 1] = dataA[idx + 1];
          output[idx + 2] = dataA[idx + 2];
          output[idx + 3] = dataA[idx + 3];
        }
      }
    }
  }

  private applyPush(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, width: number, height: number, progress: number): void {
    const direction = this.getParameter('pushDirection') as string;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        let srcXA = x, srcYA = y;
        let srcXB = x, srcYB = y;
        
        switch (direction) {
          case 'left':
            srcXA = x + Math.round(width * progress);
            srcXB = x - Math.round(width * (1 - progress));
            break;
          case 'right':
            srcXA = x - Math.round(width * progress);
            srcXB = x + Math.round(width * (1 - progress));
            break;
          case 'up':
            srcYA = y + Math.round(height * progress);
            srcYB = y - Math.round(height * (1 - progress));
            break;
          case 'down':
            srcYA = y - Math.round(height * progress);
            srcYB = y + Math.round(height * (1 - progress));
            break;
        }
        
        if (srcXA >= 0 && srcXA < width && srcYA >= 0 && srcYA < height) {
          const srcIdx = (srcYA * width + srcXA) * 4;
          output[idx] = dataA[srcIdx];
          output[idx + 1] = dataA[srcIdx + 1];
          output[idx + 2] = dataA[srcIdx + 2];
          output[idx + 3] = dataA[srcIdx + 3];
        } else if (srcXB >= 0 && srcXB < width && srcYB >= 0 && srcYB < height) {
          const srcIdx = (srcYB * width + srcXB) * 4;
          output[idx] = dataB[srcIdx];
          output[idx + 1] = dataB[srcIdx + 1];
          output[idx + 2] = dataB[srcIdx + 2];
          output[idx + 3] = dataB[srcIdx + 3];
        }
      }
    }
  }

  private applyBlur(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, width: number, height: number, progress: number): void {
    // Blur transition - blur both at mid-point
    const blurAmount = this.getParameter('blurAmount') as number;
    const midBlur = Math.sin(progress * Math.PI) * blurAmount;
    
    // Simple box blur approximation
    const radius = Math.max(1, Math.round(midBlur));
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const srcIdx = (ny * width + nx) * 4;
            
            const src = progress < 0.5 ? dataA : dataB;
            rSum += src[srcIdx];
            gSum += src[srcIdx + 1];
            bSum += src[srcIdx + 2];
            aSum += src[srcIdx + 3];
            count++;
          }
        }
        
        // Blend with other image
        const blend = progress;
        output[idx] = Math.round((rSum / count) * (1 - blend) + (dataB[idx] * blend));
        output[idx + 1] = Math.round((gSum / count) * (1 - blend) + (dataB[idx + 1] * blend));
        output[idx + 2] = Math.round((bSum / count) * (1 - blend) + (dataB[idx + 2] * blend));
        output[idx + 3] = Math.round((aSum / count) * (1 - blend) + (dataB[idx + 3] * blend));
      }
    }
  }

  private applyPixelate(dataA: Uint8Array, dataB: Uint8Array, output: Uint8Array, width: number, height: number, progress: number): void {
    const maxPixelSize = this.getParameter('pixelSize') as number;
    const pixelSize = Math.max(1, Math.round(Math.sin(progress * Math.PI) * maxPixelSize));
    
    const src = progress < 0.5 ? dataA : dataB;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get pixelated coordinate
        const px = Math.floor(x / pixelSize) * pixelSize + Math.floor(pixelSize / 2);
        const py = Math.floor(y / pixelSize) * pixelSize + Math.floor(pixelSize / 2);
        
        const srcIdx = (Math.min(py, height - 1) * width + Math.min(px, width - 1)) * 4;
        
        output[idx] = src[srcIdx];
        output[idx + 1] = src[srcIdx + 1];
        output[idx + 2] = src[srcIdx + 2];
        output[idx + 3] = src[srcIdx + 3];
      }
    }
    
    // Blend with dissolve for smooth transition
    if (progress > 0.4 && progress < 0.6) {
      const dissolveBlend = (progress - 0.4) / 0.2;
      for (let i = 0; i < output.length; i += 4) {
        output[i] = Math.round(output[i] * (1 - dissolveBlend) + dataB[i] * dissolveBlend);
        output[i + 1] = Math.round(output[i + 1] * (1 - dissolveBlend) + dataB[i + 1] * dissolveBlend);
        output[i + 2] = Math.round(output[i + 2] * (1 - dissolveBlend) + dataB[i + 2] * dissolveBlend);
        output[i + 3] = Math.round(output[i + 3] * (1 - dissolveBlend) + dataB[i + 3] * dissolveBlend);
      }
    }
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const time = this.getParameter('time');
    
    const inputA = this.inputs.get('imageA')?.value as ImageData | undefined;
    const inputB = this.inputs.get('imageB')?.value as ImageData | undefined;
    
    const dataA = new Uint8Array(width * height * 4);
    const dataB = new Uint8Array(width * height * 4);
    const output = new Uint8Array(width * height * 4);
    
    // Copy input images
    if (inputA) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const srcIdx = (Math.min(y, inputA.height - 1) * inputA.width + Math.min(x, inputA.width - 1)) * inputA.channels;
          dataA[idx] = inputA.data[srcIdx];
          dataA[idx + 1] = inputA.data[srcIdx + 1] || inputA.data[srcIdx];
          dataA[idx + 2] = inputA.data[srcIdx + 2] || inputA.data[srcIdx];
          dataA[idx + 3] = inputA.channels === 4 ? inputA.data[srcIdx + 3] : 255;
        }
      }
    }
    
    if (inputB) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const srcIdx = (Math.min(y, inputB.height - 1) * inputB.width + Math.min(x, inputB.width - 1)) * inputB.channels;
          dataB[idx] = inputB.data[srcIdx];
          dataB[idx + 1] = inputB.data[srcIdx + 1] || inputB.data[srcIdx];
          dataB[idx + 2] = inputB.data[srcIdx + 2] || inputB.data[srcIdx];
          dataB[idx + 3] = inputB.channels === 4 ? inputB.data[srcIdx + 3] : 255;
        }
      }
    }
    
    // Calculate eased progress
    const easedProgress = this.calculateEasedProgress(time);
    
    // Apply transition effect
    this.applyTransitionEffect(dataA, dataB, output, width, height, easedProgress);
    
    // Set outputs
    const imageOutput = this.outputs.get('image');
    if (imageOutput) {
      imageOutput.value = {
        width,
        height,
        channels: 4,
        data: output,
        format: 'rgba'
      };
    }
    
    const progressOutput = this.outputs.get('progress');
    if (progressOutput) {
      progressOutput.value = easedProgress;
    }
  }
}
