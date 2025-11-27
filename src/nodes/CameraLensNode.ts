/**
 * CameraLensNode - Camera lens adjustment with focal length, aperture, and sensor size controls
 * Simulates various lens characteristics including breathing, focus falloff, and bokeh
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export interface LensPreset {
  name: string;
  manufacturer: string;
  focalLengthMin: number;
  focalLengthMax: number;
  apertureMin: number;
  apertureMax: number;
  bladeCount: number;
  bladeShape: 'circular' | 'straight' | 'curved';
  distortionType: 'barrel' | 'pincushion' | 'mustache';
  breathing: number;
  chromaticAberration: number;
  vignetting: number;
  coverage: number; // image circle diameter in mm
}

// Popular lens presets
export const LENS_PRESETS: Record<string, LensPreset> = {
  // ARRI Signature Primes
  'arri-signature-35': {
    name: 'ARRI Signature Prime 35mm',
    manufacturer: 'ARRI',
    focalLengthMin: 35,
    focalLengthMax: 35,
    apertureMin: 1.8,
    apertureMax: 22,
    bladeCount: 11,
    bladeShape: 'curved',
    distortionType: 'barrel',
    breathing: 0.02,
    chromaticAberration: 0.01,
    vignetting: 0.05,
    coverage: 46
  },
  'arri-signature-50': {
    name: 'ARRI Signature Prime 50mm',
    manufacturer: 'ARRI',
    focalLengthMin: 50,
    focalLengthMax: 50,
    apertureMin: 1.8,
    apertureMax: 22,
    bladeCount: 11,
    bladeShape: 'curved',
    distortionType: 'pincushion',
    breathing: 0.015,
    chromaticAberration: 0.008,
    vignetting: 0.03,
    coverage: 46
  },
  
  // Zeiss Master Primes
  'zeiss-master-25': {
    name: 'Zeiss Master Prime 25mm',
    manufacturer: 'Zeiss',
    focalLengthMin: 25,
    focalLengthMax: 25,
    apertureMin: 1.3,
    apertureMax: 22,
    bladeCount: 14,
    bladeShape: 'curved',
    distortionType: 'barrel',
    breathing: 0.01,
    chromaticAberration: 0.005,
    vignetting: 0.04,
    coverage: 43
  },
  'zeiss-master-50': {
    name: 'Zeiss Master Prime 50mm',
    manufacturer: 'Zeiss',
    focalLengthMin: 50,
    focalLengthMax: 50,
    apertureMin: 1.3,
    apertureMax: 22,
    bladeCount: 14,
    bladeShape: 'curved',
    distortionType: 'pincushion',
    breathing: 0.008,
    chromaticAberration: 0.003,
    vignetting: 0.02,
    coverage: 43
  },
  
  // Cooke Anamorphic
  'cooke-anamorphic-40': {
    name: 'Cooke Anamorphic 40mm',
    manufacturer: 'Cooke',
    focalLengthMin: 40,
    focalLengthMax: 40,
    apertureMin: 2.3,
    apertureMax: 22,
    bladeCount: 9,
    bladeShape: 'straight',
    distortionType: 'barrel',
    breathing: 0.04,
    chromaticAberration: 0.02,
    vignetting: 0.08,
    coverage: 35
  },
  
  // Panavision Primo
  'panavision-primo-35': {
    name: 'Panavision Primo 35mm',
    manufacturer: 'Panavision',
    focalLengthMin: 35,
    focalLengthMax: 35,
    apertureMin: 1.9,
    apertureMax: 22,
    bladeCount: 9,
    bladeShape: 'curved',
    distortionType: 'barrel',
    breathing: 0.015,
    chromaticAberration: 0.01,
    vignetting: 0.04,
    coverage: 43
  },
  
  // Atlas Anamorphic
  'atlas-orion-40': {
    name: 'Atlas Orion 40mm 2x',
    manufacturer: 'Atlas',
    focalLengthMin: 40,
    focalLengthMax: 40,
    apertureMin: 2.0,
    apertureMax: 22,
    bladeCount: 11,
    bladeShape: 'straight',
    distortionType: 'barrel',
    breathing: 0.03,
    chromaticAberration: 0.025,
    vignetting: 0.1,
    coverage: 34
  }
};

export class CameraLensNode extends Node {
  constructor(id: string) {
    super(id, 'CameraLens', 'Camera Lens');
    this.metadata.category = 'Camera';
    this.metadata.description = 'Camera lens adjustments with focal length, aperture, and optical characteristics';
    this.metadata.version = '2.1.0';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('depthMap', 'Depth Map', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('lensData', 'Lens Data', DataType.ANY);
    
    // Lens preset
    this.setParameter('preset', 'custom');
    
    // Core lens parameters
    this.setParameter('focalLength', 50); // mm
    this.setParameter('aperture', 2.8); // f-stop
    this.setParameter('focusDistance', 3.0); // meters
    this.setParameter('sensorWidth', 36.0); // mm (Full Frame)
    this.setParameter('sensorHeight', 24.0); // mm
    
    // Optical characteristics
    this.setParameter('distortionAmount', 0.0); // -1 to 1 (barrel to pincushion)
    this.setParameter('distortionType', 'barrel');
    this.setParameter('breathing', 0.0); // FOV shift during focus (0-1)
    this.setParameter('anamorphicSqueeze', 1.0); // 1.0 = spherical, 2.0 = 2x anamorphic
    
    // Bokeh settings
    this.setParameter('bladeCount', 9);
    this.setParameter('bladeRotation', 0);
    this.setParameter('bladeCurvature', 1.0); // 0 = straight, 1 = fully curved
    this.setParameter('bokehBrightness', 1.0);
    this.setParameter('catEyeAmount', 0.3);
    
    // Aberrations
    this.setParameter('chromaticAberration', 0.0);
    this.setParameter('sphericalAberration', 0.0);
    this.setParameter('comaAmount', 0.0);
    
    // Vignetting
    this.setParameter('vignettingAmount', 0.0);
    this.setParameter('vignettingMidpoint', 0.5);
    this.setParameter('vignettingFeather', 0.5);
    
    // Enable/disable effects
    this.setParameter('enableDistortion', true);
    this.setParameter('enableVignette', true);
    this.setParameter('enableDOF', false);
    this.setParameter('enableAberrations', true);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const output = this.outputs.get('image');
    const lensDataOutput = this.outputs.get('lensData');
    
    if (!imageInput?.value || !output) {
      return;
    }

    const inputImage = imageInput.value as ImageData;
    let result = inputImage;
    
    // Apply lens preset if selected
    this.applyPresetIfNeeded();
    
    // Apply lens effects in order
    if (this.getParameter('enableDistortion')) {
      result = this.applyDistortion(result);
    }
    
    if (this.getParameter('enableVignette')) {
      result = this.applyVignetting(result);
    }
    
    if (this.getParameter('enableAberrations')) {
      result = this.applyChromaticAberration(result);
    }
    
    output.value = result;
    
    // Output lens data
    if (lensDataOutput) {
      lensDataOutput.value = this.getLensData();
    }
  }

  /**
   * Apply preset settings if a preset is selected
   */
  private applyPresetIfNeeded(): void {
    const presetId = this.getParameter('preset');
    if (presetId !== 'custom' && LENS_PRESETS[presetId]) {
      const preset = LENS_PRESETS[presetId];
      this.setParameter('focalLength', preset.focalLengthMin);
      this.setParameter('distortionAmount', preset.distortionType === 'barrel' ? -0.02 : 0.02);
      this.setParameter('distortionType', preset.distortionType);
      this.setParameter('breathing', preset.breathing);
      this.setParameter('chromaticAberration', preset.chromaticAberration);
      this.setParameter('vignettingAmount', preset.vignetting);
      this.setParameter('bladeCount', preset.bladeCount);
      this.setParameter('bladeCurvature', preset.bladeShape === 'curved' ? 1.0 : 0.0);
    }
  }

  /**
   * Apply lens distortion
   */
  private applyDistortion(image: ImageData): ImageData {
    const distortionAmount = this.getParameter('distortionAmount');
    if (Math.abs(distortionAmount) < 0.001) {
      return image;
    }
    
    const { width, height, channels, data: srcData } = image;
    const outData = new Uint8Array(width * height * 4);
    
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);
    const anamorphicSqueeze = this.getParameter('anamorphicSqueeze');
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Normalize coordinates
        let nx = (x - cx) / maxRadius;
        const ny = (y - cy) / maxRadius;
        
        // Apply anamorphic squeeze
        nx *= anamorphicSqueeze;
        
        const r = Math.sqrt(nx * nx + ny * ny);
        
        // Apply radial distortion
        let factor: number;
        const k = distortionAmount * 0.5;
        
        if (Math.abs(k) > 0.001) {
          factor = 1.0 + k * r * r;
        } else {
          factor = 1.0;
        }
        
        // Calculate source position
        let srcX = cx + (nx / anamorphicSqueeze) * factor * maxRadius;
        let srcY = cy + ny * factor * maxRadius;
        
        // Sample source image
        srcX = Math.max(0, Math.min(width - 1, srcX));
        srcY = Math.max(0, Math.min(height - 1, srcY));
        
        const outIdx = (y * width + x) * 4;
        const sx = Math.floor(srcX);
        const sy = Math.floor(srcY);
        const srcIdx = (sy * width + sx) * channels;
        
        outData[outIdx] = srcData[srcIdx];
        outData[outIdx + 1] = srcData[srcIdx + 1];
        outData[outIdx + 2] = srcData[srcIdx + 2];
        outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
      }
    }
    
    return {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  /**
   * Apply vignetting effect
   */
  private applyVignetting(image: ImageData): ImageData {
    const vignettingAmount = this.getParameter('vignettingAmount');
    if (vignettingAmount < 0.001) {
      return image;
    }
    
    const { width, height, channels, data: srcData } = image;
    const outData = new Uint8Array(width * height * 4);
    
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);
    const midpoint = this.getParameter('vignettingMidpoint');
    const feather = this.getParameter('vignettingFeather');
    const anamorphicSqueeze = this.getParameter('anamorphicSqueeze');
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - cx) * anamorphicSqueeze;
        const dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy) / maxRadius;
        
        // Calculate vignette factor
        let vignette = 1.0;
        if (r > midpoint - feather) {
          const t = Math.max(0, (r - (midpoint - feather)) / (feather * 2));
          vignette = 1.0 - vignettingAmount * Math.pow(t, 2);
        }
        
        const srcIdx = (y * width + x) * channels;
        const outIdx = (y * width + x) * 4;
        
        outData[outIdx] = Math.round(srcData[srcIdx] * vignette);
        outData[outIdx + 1] = Math.round(srcData[srcIdx + 1] * vignette);
        outData[outIdx + 2] = Math.round(srcData[srcIdx + 2] * vignette);
        outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
      }
    }
    
    return {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  /**
   * Apply chromatic aberration
   */
  private applyChromaticAberration(image: ImageData): ImageData {
    const caAmount = this.getParameter('chromaticAberration');
    if (caAmount < 0.001) {
      return image;
    }
    
    const { width, height, channels, data: srcData } = image;
    const outData = new Uint8Array(width * height * 4);
    
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy) / maxRadius;
        
        // Calculate offsets for each channel
        const redOffset = caAmount * r * 3;
        const blueOffset = -caAmount * r * 3;
        
        // Sample each channel at different positions
        const redX = Math.max(0, Math.min(width - 1, x + dx / maxRadius * redOffset));
        const redY = Math.max(0, Math.min(height - 1, y + dy / maxRadius * redOffset));
        const blueX = Math.max(0, Math.min(width - 1, x + dx / maxRadius * blueOffset));
        const blueY = Math.max(0, Math.min(height - 1, y + dy / maxRadius * blueOffset));
        
        const outIdx = (y * width + x) * 4;
        const srcIdx = (y * width + x) * channels;
        const redIdx = (Math.floor(redY) * width + Math.floor(redX)) * channels;
        const blueIdx = (Math.floor(blueY) * width + Math.floor(blueX)) * channels;
        
        outData[outIdx] = srcData[redIdx];
        outData[outIdx + 1] = srcData[srcIdx + 1];
        outData[outIdx + 2] = srcData[blueIdx + 2];
        outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
      }
    }
    
    return {
      width,
      height,
      channels: 4,
      data: outData,
      format: 'rgba'
    };
  }

  /**
   * Get lens data for output
   */
  getLensData(): Record<string, any> {
    const focalLength = this.getParameter('focalLength');
    const sensorWidth = this.getParameter('sensorWidth');
    const sensorHeight = this.getParameter('sensorHeight');
    
    // Calculate FOV
    const horizontalFOV = 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI);
    const verticalFOV = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
    const diagonalFOV = 2 * Math.atan(Math.sqrt(sensorWidth * sensorWidth + sensorHeight * sensorHeight) / (2 * focalLength)) * (180 / Math.PI);
    
    return {
      focalLength,
      aperture: this.getParameter('aperture'),
      focusDistance: this.getParameter('focusDistance'),
      sensorWidth,
      sensorHeight,
      horizontalFOV,
      verticalFOV,
      diagonalFOV,
      anamorphicSqueeze: this.getParameter('anamorphicSqueeze'),
      distortion: this.getParameter('distortionAmount'),
      breathing: this.getParameter('breathing'),
      vignetting: this.getParameter('vignettingAmount')
    };
  }

  /**
   * Get available presets
   */
  static getAvailablePresets(): string[] {
    return ['custom', ...Object.keys(LENS_PRESETS)];
  }

  /**
   * Get preset details
   */
  static getPresetDetails(presetId: string): LensPreset | undefined {
    return LENS_PRESETS[presetId];
  }
}
