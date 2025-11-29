/**
 * ArrayModifierNode - Advanced array tool for creating repeated/arrayed copies
 * Version 3.5 - Motion Graphics
 * 
 * Similar to After Effects/Cinema 4D array tools with linear, radial, and grid modes
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

// Array instance interface
interface ArrayInstance {
  index: number;
  position: { x: number; y: number };
  rotation: number;
  scale: { x: number; y: number };
  opacity: number;
  color: { r: number; g: number; b: number; a: number };
}

export class ArrayModifierNode extends Node {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  constructor(id: string) {
    super(id, 'ArrayModifier', 'Array Modifier');
    this.metadata.category = 'MotionGraphics';
    this.metadata.description = 'Create repeated/arrayed copies with transformations - linear, radial, and grid modes';
    this.metadata.version = '3.5.0';
    
    this.addInput('image', 'Source Image', DataType.IMAGE);
    this.addInput('mask', 'Mask', DataType.MASK);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('instances', 'Instance Data', DataType.ANY);
    
    // Canvas dimensions
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    
    // Array mode
    this.setParameter('arrayMode', 'linear'); // linear, radial, grid, spiral, random
    
    // Number of copies
    this.setParameter('count', 5);
    this.setParameter('countX', 5); // For grid mode
    this.setParameter('countY', 5); // For grid mode
    
    // Linear array parameters
    this.setParameter('offsetX', 100); // Pixels between copies
    this.setParameter('offsetY', 0);
    this.setParameter('rotationOffset', 0); // Degrees per copy
    this.setParameter('scaleOffset', 0); // Scale change per copy (0 = no change)
    this.setParameter('opacityFalloff', 0); // Opacity reduction per copy
    
    // Radial array parameters
    this.setParameter('centerX', 0.5); // Normalized center position
    this.setParameter('centerY', 0.5);
    this.setParameter('radius', 200); // Distance from center
    this.setParameter('startAngle', 0); // Starting angle in degrees
    this.setParameter('endAngle', 360); // Ending angle (360 = full circle)
    this.setParameter('orientToCenter', true); // Rotate copies to face center
    
    // Grid array parameters
    this.setParameter('spacingX', 100);
    this.setParameter('spacingY', 100);
    this.setParameter('staggerOffset', 0); // Horizontal offset for alternating rows
    
    // Spiral array parameters
    this.setParameter('spiralExpansion', 10); // Radius increase per rotation
    this.setParameter('spiralTurns', 3); // Number of spiral turns
    
    // Random array parameters
    this.setParameter('randomSeed', 42);
    this.setParameter('randomPositionRange', { x: 500, y: 500 });
    this.setParameter('randomRotationRange', 45); // +/- degrees
    this.setParameter('randomScaleRange', { min: 0.5, max: 1.5 });
    
    // Color variation
    this.setParameter('colorVariation', false);
    this.setParameter('colorStart', { r: 255, g: 107, b: 53 });
    this.setParameter('colorEnd', { r: 74, g: 158, b: 255 });
    this.setParameter('colorMode', 'gradient'); // gradient, random, hueShift
    
    // Animation
    this.setParameter('time', 0); // Normalized time 0-1
    this.setParameter('animatePosition', false);
    this.setParameter('animateRotation', false);
    this.setParameter('animateScale', false);
    this.setParameter('animateOpacity', false);
    this.setParameter('staggerDelay', 0.1); // Delay between copies in animation
    
    // Transform
    this.setParameter('globalScale', 1.0);
    this.setParameter('globalRotation', 0);
    this.setParameter('globalOffsetX', 0);
    this.setParameter('globalOffsetY', 0);
    
    // Initialize offscreen canvas if in browser environment
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }
  }

  /**
   * Pseudo-random number generator with seed
   */
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  /**
   * Generate array instances based on mode
   */
  private generateInstances(): ArrayInstance[] {
    const mode = this.getParameter('arrayMode');
    const count = this.getParameter('count');
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    
    const instances: ArrayInstance[] = [];
    
    switch (mode) {
      case 'linear':
        return this.generateLinearInstances(count, width, height);
      case 'radial':
        return this.generateRadialInstances(count, width, height);
      case 'grid':
        return this.generateGridInstances(width, height);
      case 'spiral':
        return this.generateSpiralInstances(count, width, height);
      case 'random':
        return this.generateRandomInstances(count, width, height);
      default:
        return instances;
    }
  }

  /**
   * Generate linear array instances
   */
  private generateLinearInstances(count: number, width: number, height: number): ArrayInstance[] {
    const offsetX = this.getParameter('offsetX');
    const offsetY = this.getParameter('offsetY');
    const rotationOffset = this.getParameter('rotationOffset');
    const scaleOffset = this.getParameter('scaleOffset');
    const opacityFalloff = this.getParameter('opacityFalloff');
    const colorVariation = this.getParameter('colorVariation');
    
    const instances: ArrayInstance[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      
      instances.push({
        index: i,
        position: {
          x: centerX + offsetX * (i - (count - 1) / 2),
          y: centerY + offsetY * (i - (count - 1) / 2)
        },
        rotation: rotationOffset * i,
        scale: {
          x: 1 + scaleOffset * i,
          y: 1 + scaleOffset * i
        },
        opacity: Math.max(0, 1 - opacityFalloff * i),
        color: colorVariation ? this.getColorAtT(t) : { r: 255, g: 255, b: 255, a: 255 }
      });
    }
    
    return instances;
  }

  /**
   * Generate radial array instances
   */
  private generateRadialInstances(count: number, width: number, height: number): ArrayInstance[] {
    const centerX = this.getParameter('centerX') * width;
    const centerY = this.getParameter('centerY') * height;
    const radius = this.getParameter('radius');
    const startAngle = this.getParameter('startAngle');
    const endAngle = this.getParameter('endAngle');
    const orientToCenter = this.getParameter('orientToCenter');
    const colorVariation = this.getParameter('colorVariation');
    
    const instances: ArrayInstance[] = [];
    const angleRange = endAngle - startAngle;
    const angleStep = count > 1 ? angleRange / count : 0;
    
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      const angle = (startAngle + angleStep * i) * Math.PI / 180;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      instances.push({
        index: i,
        position: { x, y },
        rotation: orientToCenter ? (startAngle + angleStep * i + 90) : 0,
        scale: { x: 1, y: 1 },
        opacity: 1,
        color: colorVariation ? this.getColorAtT(t) : { r: 255, g: 255, b: 255, a: 255 }
      });
    }
    
    return instances;
  }

  /**
   * Generate grid array instances
   */
  private generateGridInstances(width: number, height: number): ArrayInstance[] {
    const countX = this.getParameter('countX');
    const countY = this.getParameter('countY');
    const spacingX = this.getParameter('spacingX');
    const spacingY = this.getParameter('spacingY');
    const staggerOffset = this.getParameter('staggerOffset');
    const colorVariation = this.getParameter('colorVariation');
    
    const instances: ArrayInstance[] = [];
    const totalWidth = spacingX * (countX - 1);
    const totalHeight = spacingY * (countY - 1);
    const startX = (width - totalWidth) / 2;
    const startY = (height - totalHeight) / 2;
    
    let index = 0;
    for (let y = 0; y < countY; y++) {
      for (let x = 0; x < countX; x++) {
        const t = (countX * countY) > 1 ? index / (countX * countY - 1) : 0;
        const stagger = y % 2 === 1 ? staggerOffset : 0;
        
        instances.push({
          index,
          position: {
            x: startX + x * spacingX + stagger,
            y: startY + y * spacingY
          },
          rotation: 0,
          scale: { x: 1, y: 1 },
          opacity: 1,
          color: colorVariation ? this.getColorAtT(t) : { r: 255, g: 255, b: 255, a: 255 }
        });
        index++;
      }
    }
    
    return instances;
  }

  /**
   * Generate spiral array instances
   */
  private generateSpiralInstances(count: number, width: number, height: number): ArrayInstance[] {
    const centerX = this.getParameter('centerX') * width;
    const centerY = this.getParameter('centerY') * height;
    const spiralExpansion = this.getParameter('spiralExpansion');
    const spiralTurns = this.getParameter('spiralTurns');
    const colorVariation = this.getParameter('colorVariation');
    
    const instances: ArrayInstance[] = [];
    const totalAngle = spiralTurns * Math.PI * 2;
    const angleStep = count > 1 ? totalAngle / (count - 1) : 0;
    
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      const angle = angleStep * i;
      const radius = spiralExpansion * (angle / (Math.PI * 2));
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      instances.push({
        index: i,
        position: { x, y },
        rotation: angle * 180 / Math.PI,
        scale: { x: 1, y: 1 },
        opacity: 1,
        color: colorVariation ? this.getColorAtT(t) : { r: 255, g: 255, b: 255, a: 255 }
      });
    }
    
    return instances;
  }

  /**
   * Generate random array instances
   */
  private generateRandomInstances(count: number, width: number, height: number): ArrayInstance[] {
    const seed = this.getParameter('randomSeed');
    const posRange = this.getParameter('randomPositionRange');
    const rotRange = this.getParameter('randomRotationRange');
    const scaleRange = this.getParameter('randomScaleRange');
    const colorVariation = this.getParameter('colorVariation');
    
    const random = this.seededRandom(seed);
    const instances: ArrayInstance[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      const scale = scaleRange.min + random() * (scaleRange.max - scaleRange.min);
      
      instances.push({
        index: i,
        position: {
          x: centerX + (random() - 0.5) * posRange.x,
          y: centerY + (random() - 0.5) * posRange.y
        },
        rotation: (random() - 0.5) * rotRange * 2,
        scale: { x: scale, y: scale },
        opacity: 0.5 + random() * 0.5,
        color: colorVariation ? this.getColorAtT(random()) : { r: 255, g: 255, b: 255, a: 255 }
      });
    }
    
    return instances;
  }

  /**
   * Get interpolated color at normalized position t
   */
  private getColorAtT(t: number): { r: number; g: number; b: number; a: number } {
    const colorMode = this.getParameter('colorMode');
    const colorStart = this.getParameter('colorStart');
    const colorEnd = this.getParameter('colorEnd');
    
    switch (colorMode) {
      case 'gradient':
        return {
          r: Math.round(colorStart.r + (colorEnd.r - colorStart.r) * t),
          g: Math.round(colorStart.g + (colorEnd.g - colorStart.g) * t),
          b: Math.round(colorStart.b + (colorEnd.b - colorStart.b) * t),
          a: 255
        };
      case 'hueShift':
        {
          // Convert to HSL, shift hue, convert back
          const hue = t * 360;
          const rgb = this.hslToRgb(hue / 360, 0.7, 0.5);
          return { r: rgb.r, g: rgb.g, b: rgb.b, a: 255 };
        }
      default:
        return { ...colorStart, a: 255 };
    }
  }

  /**
   * Convert HSL to RGB
   */
  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r: number, g: number, b: number;
    
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

  /**
   * Apply animation to instances
   */
  private applyAnimation(instances: ArrayInstance[]): ArrayInstance[] {
    const time = this.getParameter('time');
    const staggerDelay = this.getParameter('staggerDelay');
    const animatePosition = this.getParameter('animatePosition');
    const animateRotation = this.getParameter('animateRotation');
    const animateScale = this.getParameter('animateScale');
    const animateOpacity = this.getParameter('animateOpacity');
    
    if (!animatePosition && !animateRotation && !animateScale && !animateOpacity) {
      return instances;
    }
    
    return instances.map((instance, i) => {
      const localTime = Math.max(0, Math.min(1, (time - i * staggerDelay) / (1 - (instances.length - 1) * staggerDelay)));
      const easedTime = this.easeInOutCubic(localTime);
      
      const animated = { ...instance };
      
      if (animateScale) {
        animated.scale = {
          x: instance.scale.x * easedTime,
          y: instance.scale.y * easedTime
        };
      }
      
      if (animateOpacity) {
        animated.opacity = instance.opacity * easedTime;
      }
      
      if (animateRotation) {
        animated.rotation = instance.rotation + 360 * localTime;
      }
      
      return animated;
    });
  }

  /**
   * Ease in out cubic
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const globalScale = this.getParameter('globalScale');
    const globalRotation = this.getParameter('globalRotation');
    const globalOffsetX = this.getParameter('globalOffsetX');
    const globalOffsetY = this.getParameter('globalOffsetY');
    
    const data = new Uint8Array(width * height * 4);
    const inputData = this.inputs.get('image')?.value as ImageData | undefined;
    
    if (!inputData || !this.offscreenCanvas || !this.offscreenCtx) {
      // Output blank if no input
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
      return;
    }
    
    // Generate instances
    let instances = this.generateInstances();
    
    // Apply animation
    instances = this.applyAnimation(instances);
    
    // Set up canvas
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, width, height);
    
    // Create source image data
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = inputData.width;
    srcCanvas.height = inputData.height;
    const srcCtx = srcCanvas.getContext('2d');
    
    if (srcCtx) {
      const srcImageData = srcCtx.createImageData(inputData.width, inputData.height);
      for (let i = 0; i < inputData.width * inputData.height; i++) {
        const srcIdx = i * inputData.channels;
        const dstIdx = i * 4;
        srcImageData.data[dstIdx] = inputData.data[srcIdx];
        srcImageData.data[dstIdx + 1] = inputData.data[srcIdx + 1] || inputData.data[srcIdx];
        srcImageData.data[dstIdx + 2] = inputData.data[srcIdx + 2] || inputData.data[srcIdx];
        srcImageData.data[dstIdx + 3] = inputData.channels === 4 ? inputData.data[srcIdx + 3] : 255;
      }
      srcCtx.putImageData(srcImageData, 0, 0);
    }
    
    // Draw each instance
    for (const instance of instances) {
      ctx.save();
      
      // Apply global transform
      ctx.translate(width / 2, height / 2);
      ctx.rotate(globalRotation * Math.PI / 180);
      ctx.scale(globalScale, globalScale);
      ctx.translate(-width / 2 + globalOffsetX, -height / 2 + globalOffsetY);
      
      // Apply instance transform
      ctx.translate(instance.position.x, instance.position.y);
      ctx.rotate(instance.rotation * Math.PI / 180);
      ctx.scale(instance.scale.x, instance.scale.y);
      ctx.globalAlpha = instance.opacity;
      
      // Apply color tint if enabled
      if (instance.color.r !== 255 || instance.color.g !== 255 || instance.color.b !== 255) {
        ctx.filter = `sepia(1) saturate(0) brightness(1) contrast(1)`;
        // Note: Full color tinting would require additional processing
      }
      
      // Draw centered
      ctx.drawImage(srcCanvas, -inputData.width / 2, -inputData.height / 2);
      
      ctx.restore();
    }
    
    // Get final image data
    const resultImageData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < width * height * 4; i++) {
      data[i] = resultImageData.data[i];
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
    
    // Output instance data for external use
    const instanceOutput = this.outputs.get('instances');
    if (instanceOutput) {
      instanceOutput.value = instances;
    }
  }
}
