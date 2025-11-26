/**
 * HSLNode - Hue/Saturation/Lightness adjustment
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class HSLNode extends Node {
  constructor(id: string) {
    super(id, 'HSL', 'HSL');
    this.metadata.category = 'Color';
    this.metadata.description = 'Adjust hue, saturation, and lightness';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    // Master adjustments
    this.setParameter('hue', 0);           // -180 to 180
    this.setParameter('saturation', 0);    // -1 to 1
    this.setParameter('lightness', 0);     // -1 to 1
    
    // Per-color adjustments (reds, yellows, greens, cyans, blues, magentas)
    this.setParameter('redHue', 0);
    this.setParameter('redSaturation', 0);
    this.setParameter('redLightness', 0);
    
    this.setParameter('yellowHue', 0);
    this.setParameter('yellowSaturation', 0);
    this.setParameter('yellowLightness', 0);
    
    this.setParameter('greenHue', 0);
    this.setParameter('greenSaturation', 0);
    this.setParameter('greenLightness', 0);
    
    this.setParameter('cyanHue', 0);
    this.setParameter('cyanSaturation', 0);
    this.setParameter('cyanLightness', 0);
    
    this.setParameter('blueHue', 0);
    this.setParameter('blueSaturation', 0);
    this.setParameter('blueLightness', 0);
    
    this.setParameter('magentaHue', 0);
    this.setParameter('magentaSaturation', 0);
    this.setParameter('magentaLightness', 0);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');
    
    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    
    const masterHue = this.getParameter('hue');
    const masterSat = this.getParameter('saturation');
    const masterLight = this.getParameter('lightness');
    
    const { width, height, channels, data: srcData } = inputImage;
    const outData = new Uint8Array(width * height * 4);
    
    // Color ranges (in degrees)
    const colorRanges = [
      { name: 'red', center: 0, hue: this.getParameter('redHue'), sat: this.getParameter('redSaturation'), light: this.getParameter('redLightness') },
      { name: 'yellow', center: 60, hue: this.getParameter('yellowHue'), sat: this.getParameter('yellowSaturation'), light: this.getParameter('yellowLightness') },
      { name: 'green', center: 120, hue: this.getParameter('greenHue'), sat: this.getParameter('greenSaturation'), light: this.getParameter('greenLightness') },
      { name: 'cyan', center: 180, hue: this.getParameter('cyanHue'), sat: this.getParameter('cyanSaturation'), light: this.getParameter('cyanLightness') },
      { name: 'blue', center: 240, hue: this.getParameter('blueHue'), sat: this.getParameter('blueSaturation'), light: this.getParameter('blueLightness') },
      { name: 'magenta', center: 300, hue: this.getParameter('magentaHue'), sat: this.getParameter('magentaSaturation'), light: this.getParameter('magentaLightness') }
    ];
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * channels;
      const outIdx = i * 4;
      
      const r = srcData[srcIdx] / 255;
      const g = srcData[srcIdx + 1] / 255;
      const b = srcData[srcIdx + 2] / 255;
      
      // Convert to HSL
      let { h, s, l } = this.rgbToHsl(r, g, b);
      
      // Apply per-color adjustments
      const hDeg = h * 360;
      let hueAdj = masterHue;
      let satAdj = masterSat;
      let lightAdj = masterLight;
      
      for (const range of colorRanges) {
        // Calculate weight based on hue distance
        let dist = Math.abs(hDeg - range.center);
        if (dist > 180) dist = 360 - dist;
        
        const rangeWidth = 60; // 60 degree transition
        if (dist < rangeWidth) {
          const weight = 1 - dist / rangeWidth;
          hueAdj += range.hue * weight;
          satAdj += range.sat * weight;
          lightAdj += range.light * weight;
        }
      }
      
      // Apply adjustments
      h = (h + hueAdj / 360 + 1) % 1;
      s = Math.max(0, Math.min(1, s + satAdj));
      l = Math.max(0, Math.min(1, l + lightAdj));
      
      // Convert back to RGB
      const rgb = this.hslToRgb(h, s, l);
      
      outData[outIdx] = Math.max(0, Math.min(255, rgb.r * 255));
      outData[outIdx + 1] = Math.max(0, Math.min(255, rgb.g * 255));
      outData[outIdx + 2] = Math.max(0, Math.min(255, rgb.b * 255));
      outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
    }
    
    output.value = {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    if (max === min) {
      return { h: 0, s: 0, l };
    }
    
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    let h = 0;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
    
    return { h, s, l };
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    if (s === 0) {
      return { r: l, g: l, b: l };
    }
    
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
    
    return {
      r: hue2rgb(p, q, h + 1/3),
      g: hue2rgb(p, q, h),
      b: hue2rgb(p, q, h - 1/3)
    };
  }
}
