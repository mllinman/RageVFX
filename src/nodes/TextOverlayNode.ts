/**
 * TextOverlayNode - Professional text overlay with effects
 * Version 3.4 - Utility
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class TextOverlayNode extends Node {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  constructor(id: string) {
    super(id, 'TextOverlay', 'TextOverlay');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Add professional text overlays with effects';
    
    this.addInput('image', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('text', 'RageVFX');
    this.setParameter('fontFamily', 'Arial');
    this.setParameter('fontSize', 72);
    this.setParameter('fontWeight', 'bold'); // normal, bold, bolder, lighter
    this.setParameter('fontStyle', 'normal'); // normal, italic, oblique
    this.setParameter('textAlign', 'center'); // left, center, right
    this.setParameter('textBaseline', 'middle'); // top, middle, bottom
    this.setParameter('positionX', 0.5); // Normalized 0-1
    this.setParameter('positionY', 0.5);
    this.setParameter('color', { r: 255, g: 255, b: 255 });
    this.setParameter('opacity', 1.0);
    this.setParameter('strokeEnabled', false);
    this.setParameter('strokeColor', { r: 0, g: 0, b: 0 });
    this.setParameter('strokeWidth', 2);
    this.setParameter('shadowEnabled', true);
    this.setParameter('shadowColor', { r: 0, g: 0, b: 0 });
    this.setParameter('shadowBlur', 10);
    this.setParameter('shadowOffsetX', 4);
    this.setParameter('shadowOffsetY', 4);
    this.setParameter('glowEnabled', false);
    this.setParameter('glowColor', { r: 255, g: 200, b: 100 });
    this.setParameter('glowBlur', 20);
    this.setParameter('letterSpacing', 0);
    this.setParameter('rotation', 0); // degrees
    this.setParameter('scaleX', 1.0);
    this.setParameter('scaleY', 1.0);
    
    // Initialize offscreen canvas if in browser environment
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const text = this.getParameter('text');
    const fontFamily = this.getParameter('fontFamily');
    const fontSize = this.getParameter('fontSize');
    const fontWeight = this.getParameter('fontWeight');
    const fontStyle = this.getParameter('fontStyle');
    const textAlign = this.getParameter('textAlign');
    const textBaseline = this.getParameter('textBaseline');
    const positionX = this.getParameter('positionX');
    const positionY = this.getParameter('positionY');
    const color = this.getParameter('color');
    const opacity = this.getParameter('opacity');
    const strokeEnabled = this.getParameter('strokeEnabled');
    const strokeColor = this.getParameter('strokeColor');
    const strokeWidth = this.getParameter('strokeWidth');
    const shadowEnabled = this.getParameter('shadowEnabled');
    const shadowColor = this.getParameter('shadowColor');
    const shadowBlur = this.getParameter('shadowBlur');
    const shadowOffsetX = this.getParameter('shadowOffsetX');
    const shadowOffsetY = this.getParameter('shadowOffsetY');
    const glowEnabled = this.getParameter('glowEnabled');
    const glowColor = this.getParameter('glowColor');
    const glowBlur = this.getParameter('glowBlur');
    const rotation = this.getParameter('rotation');
    const scaleX = this.getParameter('scaleX');
    const scaleY = this.getParameter('scaleY');
    
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
    
    // Use canvas for text rendering if available
    if (this.offscreenCanvas && this.offscreenCtx) {
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      const ctx = this.offscreenCtx;
      
      // Clear with transparent background
      ctx.clearRect(0, 0, width, height);
      
      // Set up text rendering
      ctx.save();
      
      const x = width * positionX;
      const y = height * positionY;
      
      // Apply transformations
      ctx.translate(x, y);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.scale(scaleX, scaleY);
      
      // Set font
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = textAlign as CanvasTextAlign;
      ctx.textBaseline = textBaseline as CanvasTextBaseline;
      ctx.globalAlpha = opacity;
      
      // Draw glow layer first (if enabled)
      if (glowEnabled) {
        ctx.shadowColor = `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`;
        ctx.shadowBlur = glowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`;
        ctx.fillText(text, 0, 0);
      }
      
      // Draw shadow
      if (shadowEnabled) {
        ctx.shadowColor = `rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, 0.8)`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      
      // Draw text
      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.fillText(text, 0, 0);
      
      // Draw stroke
      if (strokeEnabled) {
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = `rgb(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b})`;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(text, 0, 0);
      }
      
      ctx.restore();
      
      // Get rendered text data
      const textImageData = ctx.getImageData(0, 0, width, height);
      
      // Composite text over background
      for (let i = 0; i < width * height * 4; i += 4) {
        const textAlpha = textImageData.data[i + 3] / 255;
        
        if (textAlpha > 0) {
          const invAlpha = 1 - textAlpha;
          data[i] = Math.min(255, data[i] * invAlpha + textImageData.data[i] * textAlpha);
          data[i + 1] = Math.min(255, data[i + 1] * invAlpha + textImageData.data[i + 1] * textAlpha);
          data[i + 2] = Math.min(255, data[i + 2] * invAlpha + textImageData.data[i + 2] * textAlpha);
          data[i + 3] = Math.min(255, Math.max(data[i + 3], textImageData.data[i + 3]));
        }
      }
    } else {
      // Fallback: simple text rendering without canvas
      // In a real implementation, this would use a proper font rendering library
      console.log(`TextOverlay: Rendering "${text}" at (${positionX * width}, ${positionY * height})`);
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
  }
}
