/**
 * LensDistortionCorrectionNode - Undistort lens distortion for VFX matching
 * Supports Brown-Conrady, Fisheye, and custom distortion models
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export interface DistortionProfile {
  name: string;
  model: 'brown-conrady' | 'fisheye' | 'anamorphic' | 'polynomial';
  k1: number; // Radial distortion coefficient
  k2: number;
  k3: number;
  p1: number; // Tangential distortion
  p2: number;
  cx: number; // Principal point offset
  cy: number;
  squeeze: number; // Anamorphic squeeze factor
}

// Predefined distortion profiles for common lenses
export const DISTORTION_PROFILES: Record<string, DistortionProfile> = {
  // GoPro lenses
  'gopro-hero11-wide': {
    name: 'GoPro Hero 11 Wide',
    model: 'fisheye',
    k1: -0.28,
    k2: 0.12,
    k3: -0.02,
    p1: 0.0,
    p2: 0.0,
    cx: 0.0,
    cy: 0.0,
    squeeze: 1.0
  },
  'gopro-hero11-linear': {
    name: 'GoPro Hero 11 Linear',
    model: 'brown-conrady',
    k1: -0.05,
    k2: 0.02,
    k3: 0.0,
    p1: 0.0,
    p2: 0.0,
    cx: 0.0,
    cy: 0.0,
    squeeze: 1.0
  },
  
  // DJI Drone lenses
  'dji-mavic3-hasselblad': {
    name: 'DJI Mavic 3 Hasselblad',
    model: 'brown-conrady',
    k1: -0.12,
    k2: 0.05,
    k3: -0.01,
    p1: 0.001,
    p2: -0.001,
    cx: 0.002,
    cy: -0.001,
    squeeze: 1.0
  },
  'dji-inspire3': {
    name: 'DJI Inspire 3',
    model: 'brown-conrady',
    k1: -0.08,
    k2: 0.03,
    k3: 0.0,
    p1: 0.0,
    p2: 0.0,
    cx: 0.0,
    cy: 0.0,
    squeeze: 1.0
  },
  
  // Anamorphic lenses
  'anamorphic-2x': {
    name: 'Generic Anamorphic 2x',
    model: 'anamorphic',
    k1: -0.08,
    k2: 0.02,
    k3: 0.0,
    p1: 0.0,
    p2: 0.0,
    cx: 0.0,
    cy: 0.0,
    squeeze: 2.0
  },
  'anamorphic-1.33x': {
    name: 'Generic Anamorphic 1.33x',
    model: 'anamorphic',
    k1: -0.05,
    k2: 0.01,
    k3: 0.0,
    p1: 0.0,
    p2: 0.0,
    cx: 0.0,
    cy: 0.0,
    squeeze: 1.33
  },
  
  // Cinema lenses
  'zeiss-superspeed-25': {
    name: 'Zeiss Super Speed 25mm',
    model: 'brown-conrady',
    k1: -0.04,
    k2: 0.01,
    k3: 0.0,
    p1: 0.0,
    p2: 0.0,
    cx: 0.0,
    cy: 0.0,
    squeeze: 1.0
  },
  'cooke-s4-18': {
    name: 'Cooke S4 18mm',
    model: 'brown-conrady',
    k1: -0.06,
    k2: 0.02,
    k3: -0.005,
    p1: 0.001,
    p2: 0.0,
    cx: 0.0,
    cy: 0.0,
    squeeze: 1.0
  }
};

export class LensDistortionCorrectionNode extends Node {
  private lookupTableU: Float32Array | null = null;
  private lookupTableV: Float32Array | null = null;
  private lastWidth: number = 0;
  private lastHeight: number = 0;
  private lastAppliedProfile: string = '';

  constructor(id: string) {
    super(id, 'LensDistortionCorrection', 'Lens Distortion Correction');
    this.metadata.category = 'Camera';
    this.metadata.description = 'Correct or apply lens distortion for VFX matching';
    this.metadata.version = '2.1.0';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('stMap', 'ST Map', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    this.addOutput('stMap', 'Distortion ST Map', DataType.IMAGE);
    
    // Profile selection
    this.setParameter('profile', 'custom');
    
    // Distortion model
    this.setParameter('model', 'brown-conrady'); // brown-conrady, fisheye, anamorphic, polynomial
    
    // Mode: undistort (correct) or distort (apply)
    this.setParameter('mode', 'undistort'); // undistort, distort
    
    // Radial distortion coefficients (Brown-Conrady model)
    this.setParameter('k1', 0.0); // 2nd order radial
    this.setParameter('k2', 0.0); // 4th order radial
    this.setParameter('k3', 0.0); // 6th order radial
    
    // Tangential distortion coefficients
    this.setParameter('p1', 0.0);
    this.setParameter('p2', 0.0);
    
    // Principal point offset (normalized -1 to 1)
    this.setParameter('cx', 0.0);
    this.setParameter('cy', 0.0);
    
    // Anamorphic squeeze factor
    this.setParameter('squeeze', 1.0);
    
    // Focal length for fisheye models
    this.setParameter('focalLength', 50);
    this.setParameter('fov', 180); // Field of view for fisheye
    
    // Additional options
    this.setParameter('crop', true); // Crop to remove black edges
    this.setParameter('cropAmount', 0.0); // Auto-calculated crop
    this.setParameter('filterType', 'bilinear'); // nearest, bilinear, bicubic
    this.setParameter('overscan', 1.0); // Render at higher resolution to avoid edge issues
    
    // Grid overlay for visualization
    this.setParameter('showGrid', false);
    this.setParameter('gridDensity', 20);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const stMapInput = this.inputs.get('stMap');
    const imageOutput = this.outputs.get('image');
    const stMapOutput = this.outputs.get('stMap');
    
    if (!imageInput?.value || !imageOutput) {
      return;
    }

    const inputImage = imageInput.value as ImageData;
    
    // Apply profile settings if selected
    this.applyProfileIfNeeded();
    
    // Use external ST map if provided
    if (stMapInput?.value) {
      imageOutput.value = this.applySTMap(inputImage, stMapInput.value as ImageData);
    } else {
      // Generate distortion map and apply
      const distortedImage = this.applyDistortion(inputImage);
      imageOutput.value = distortedImage;
    }
    
    // Generate ST map output if requested
    if (stMapOutput) {
      stMapOutput.value = this.generateSTMap(inputImage.width, inputImage.height);
    }
  }

  /**
   * Apply profile settings if selected and changed
   */
  private applyProfileIfNeeded(): void {
    const profileId = this.getParameter('profile');
    
    // Skip if profile hasn't changed
    if (profileId === this.lastAppliedProfile) {
      return;
    }
    
    if (profileId !== 'custom' && DISTORTION_PROFILES[profileId]) {
      const profile = DISTORTION_PROFILES[profileId];
      this.setParameter('model', profile.model);
      this.setParameter('k1', profile.k1);
      this.setParameter('k2', profile.k2);
      this.setParameter('k3', profile.k3);
      this.setParameter('p1', profile.p1);
      this.setParameter('p2', profile.p2);
      this.setParameter('cx', profile.cx);
      this.setParameter('cy', profile.cy);
      this.setParameter('squeeze', profile.squeeze);
    }
    
    this.lastAppliedProfile = profileId;
  }

  /**
   * Apply distortion or undistortion to image
   */
  private applyDistortion(image: ImageData): ImageData {
    const { width, height, channels, data: srcData } = image;
    const outData = new Uint8Array(width * height * 4);
    
    const mode = this.getParameter('mode');
    const filterType = this.getParameter('filterType');
    const showGrid = this.getParameter('showGrid');
    const gridDensity = this.getParameter('gridDensity');
    
    // Build lookup table if needed
    if (!this.lookupTableU || !this.lookupTableV || 
        this.lastWidth !== width || this.lastHeight !== height) {
      this.buildLookupTable(width, height);
      this.lastWidth = width;
      this.lastHeight = height;
    }
    
    // Apply remapping
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        let srcX: number, srcY: number;
        
        if (mode === 'undistort') {
          // For undistortion, we sample from distorted coordinates
          srcX = this.lookupTableU![idx] * (width - 1);
          srcY = this.lookupTableV![idx] * (height - 1);
        } else {
          // For distortion, we need to invert the mapping
          const [nx, ny] = this.distortPoint(
            (x / (width - 1)) * 2 - 1,
            (y / (height - 1)) * 2 - 1
          );
          srcX = ((nx + 1) / 2) * (width - 1);
          srcY = ((ny + 1) / 2) * (height - 1);
        }
        
        // Sample the source image
        const outIdx = idx * 4;
        
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          if (filterType === 'bilinear') {
            const [r, g, b, a] = this.sampleBilinear(srcData, width, height, channels, srcX, srcY);
            outData[outIdx] = r;
            outData[outIdx + 1] = g;
            outData[outIdx + 2] = b;
            outData[outIdx + 3] = a;
          } else {
            const sx = Math.floor(srcX);
            const sy = Math.floor(srcY);
            const srcIdx = (sy * width + sx) * channels;
            outData[outIdx] = srcData[srcIdx];
            outData[outIdx + 1] = srcData[srcIdx + 1];
            outData[outIdx + 2] = srcData[srcIdx + 2];
            outData[outIdx + 3] = channels === 4 ? srcData[srcIdx + 3] : 255;
          }
        } else {
          outData[outIdx] = 0;
          outData[outIdx + 1] = 0;
          outData[outIdx + 2] = 0;
          outData[outIdx + 3] = 255;
        }
        
        // Overlay grid if enabled
        if (showGrid) {
          const gridX = x % Math.floor(width / gridDensity);
          const gridY = y % Math.floor(height / gridDensity);
          if (gridX === 0 || gridY === 0) {
            outData[outIdx] = 255;
            outData[outIdx + 1] = 0;
            outData[outIdx + 2] = 0;
          }
        }
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
   * Build lookup table for distortion mapping
   */
  private buildLookupTable(width: number, height: number): void {
    this.lookupTableU = new Float32Array(width * height);
    this.lookupTableV = new Float32Array(width * height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Normalize coordinates to -1 to 1
        const nx = (x / (width - 1)) * 2 - 1;
        const ny = (y / (height - 1)) * 2 - 1;
        
        // Calculate distorted coordinates
        const [dx, dy] = this.distortPoint(nx, ny);
        
        // Store normalized 0-1 coordinates
        const idx = y * width + x;
        this.lookupTableU[idx] = (dx + 1) / 2;
        this.lookupTableV[idx] = (dy + 1) / 2;
      }
    }
  }

  /**
   * Apply distortion to a single point
   */
  private distortPoint(nx: number, ny: number): [number, number] {
    const model = this.getParameter('model');
    const k1 = this.getParameter('k1');
    const k2 = this.getParameter('k2');
    const k3 = this.getParameter('k3');
    const p1 = this.getParameter('p1');
    const p2 = this.getParameter('p2');
    const cx = this.getParameter('cx');
    const cy = this.getParameter('cy');
    const squeeze = this.getParameter('squeeze');
    
    // Apply principal point offset
    let x = nx - cx;
    const y = ny - cy;
    
    // Apply squeeze for anamorphic
    x /= squeeze;
    
    const r2 = x * x + y * y;
    const r4 = r2 * r2;
    const r6 = r2 * r4;
    
    let dx: number, dy: number;
    
    switch (model) {
      case 'brown-conrady': {
        // Radial distortion
        const radialFactor = 1 + k1 * r2 + k2 * r4 + k3 * r6;
        
        // Tangential distortion
        const tangentialX = 2 * p1 * x * y + p2 * (r2 + 2 * x * x);
        const tangentialY = p1 * (r2 + 2 * y * y) + 2 * p2 * x * y;
        
        dx = x * radialFactor + tangentialX;
        dy = y * radialFactor + tangentialY;
        break;
      }
        
      case 'fisheye': {
        const r = Math.sqrt(r2);
        const theta = Math.atan(r);
        const theta2 = theta * theta;
        const theta4 = theta2 * theta2;
        const theta6 = theta2 * theta4;
        const thetaD = theta * (1 + k1 * theta2 + k2 * theta4 + k3 * theta6);
        
        if (r > 0.0001) {
          dx = thetaD * x / r;
          dy = thetaD * y / r;
        } else {
          dx = x;
          dy = y;
        }
        break;
      }
        
      case 'polynomial':
        dx = x * (1 + k1 * r2 + k2 * r4 + k3 * r6);
        dy = y * (1 + k1 * r2 + k2 * r4 + k3 * r6);
        break;
        
      default:
        dx = x;
        dy = y;
    }
    
    // Apply squeeze back for anamorphic
    dx *= squeeze;
    
    // Apply principal point offset back
    dx += cx;
    dy += cy;
    
    return [dx, dy];
  }

  /**
   * Bilinear sampling
   */
  private sampleBilinear(
    data: Uint8Array | Uint16Array | Float32Array,
    width: number,
    height: number,
    channels: number,
    x: number,
    y: number
  ): [number, number, number, number] {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    
    const fx = x - x0;
    const fy = y - y0;
    
    const result: [number, number, number, number] = [0, 0, 0, 255];
    
    for (let c = 0; c < Math.min(channels, 4); c++) {
      const v00 = data[(y0 * width + x0) * channels + c];
      const v10 = data[(y0 * width + x1) * channels + c];
      const v01 = data[(y1 * width + x0) * channels + c];
      const v11 = data[(y1 * width + x1) * channels + c];
      
      result[c] = Math.round(
        v00 * (1 - fx) * (1 - fy) +
        v10 * fx * (1 - fy) +
        v01 * (1 - fx) * fy +
        v11 * fx * fy
      );
    }
    
    return result;
  }

  /**
   * Apply distortion using external ST map
   */
  private applySTMap(image: ImageData, stMap: ImageData): ImageData {
    const { width, height, channels, data: srcData } = image;
    const outData = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const mapIdx = (y * stMap.width + x) * stMap.channels;
        
        // ST map stores normalized coordinates in R and G channels
        const srcX = (stMap.data[mapIdx] / 255) * (width - 1);
        const srcY = (stMap.data[mapIdx + 1] / 255) * (height - 1);
        
        const outIdx = (y * width + x) * 4;
        
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const [r, g, b, a] = this.sampleBilinear(srcData, width, height, channels, srcX, srcY);
          outData[outIdx] = r;
          outData[outIdx + 1] = g;
          outData[outIdx + 2] = b;
          outData[outIdx + 3] = a;
        } else {
          outData[outIdx] = 0;
          outData[outIdx + 1] = 0;
          outData[outIdx + 2] = 0;
          outData[outIdx + 3] = 255;
        }
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
   * Generate ST map for the current distortion settings
   */
  private generateSTMap(width: number, height: number): ImageData {
    const data = new Uint8Array(width * height * 4);
    const mode = this.getParameter('mode');
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x / (width - 1)) * 2 - 1;
        const ny = (y / (height - 1)) * 2 - 1;
        
        const [dx, dy] = mode === 'undistort' 
          ? this.distortPoint(nx, ny)
          : [nx, ny]; // For distort mode, inversion is needed
        
        // Normalize to 0-255 range
        const u = Math.max(0, Math.min(255, Math.round(((dx + 1) / 2) * 255)));
        const v = Math.max(0, Math.min(255, Math.round(((dy + 1) / 2) * 255)));
        
        const idx = (y * width + x) * 4;
        data[idx] = u;
        data[idx + 1] = v;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
    
    return {
      width,
      height,
      channels: 4,
      data,
      format: 'rgba'
    };
  }

  /**
   * Get available profiles
   */
  static getAvailableProfiles(): string[] {
    return ['custom', ...Object.keys(DISTORTION_PROFILES)];
  }

  /**
   * Get profile details
   */
  static getProfileDetails(profileId: string): DistortionProfile | undefined {
    return DISTORTION_PROFILES[profileId];
  }

  /**
   * Invalidate lookup tables (call when parameters change)
   */
  invalidateLookupTable(): void {
    this.lookupTableU = null;
    this.lookupTableV = null;
  }

  /**
   * Override setParameter to invalidate lookup table
   */
  setParameter(key: string, value: unknown): void {
    super.setParameter(key, value);
    
    // Invalidate lookup table if distortion parameters changed
    const distortionParams = ['k1', 'k2', 'k3', 'p1', 'p2', 'cx', 'cy', 'squeeze', 'model', 'mode'];
    if (distortionParams.includes(key)) {
      this.invalidateLookupTable();
    }
    
    // Reset lastAppliedProfile when profile changes to allow reapplication
    if (key === 'profile') {
      this.lastAppliedProfile = '';
    }
  }
}
