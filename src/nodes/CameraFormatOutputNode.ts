/**
 * CameraFormatOutputNode - Output node for camera-specific format exports
 * Supports various camera formats: RED R3D, ARRI ProRes, Blackmagic RAW, Sony RAW
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export interface CameraFormatSettings {
  outputPath: string;
  cameraFormat: string;
  resolution: string;
  colorSpace: string;
  gamma: string;
  compression: string;
}

export class CameraFormatOutputNode extends Node {
  private frameBuffer: ImageData[] = [];
  private currentFrame: number = 0;

  constructor(id: string) {
    super(id, 'CameraFormatOutput', 'Camera Format Output');
    this.metadata.category = 'Output';
    this.metadata.description = 'Export in camera-native formats (RED, ARRI, Blackmagic, Sony)';
    this.metadata.version = '2.1.0';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('frame', 'Frame Number', DataType.NUMBER);
    
    // Output settings
    this.setParameter('outputPath', './output/');
    this.setParameter('baseName', 'camera_export');
    
    // Camera format
    this.setParameter('cameraFormat', 'arriraw'); // arriraw, r3d, braw, sonyraw
    
    // Resolution presets
    this.setParameter('resolution', '4k'); // hd, 2k, 4k, 6k, 8k
    this.setParameter('width', 4096);
    this.setParameter('height', 2160);
    this.setParameter('aspectRatio', '1.89:1');
    
    // Color settings by camera
    this.setParameter('colorSpace', 'arri-wide-gamut'); // arri-wide-gamut, red-wide-gamut, bmd-film-gen5, s-gamut3
    this.setParameter('gamma', 'log-c4'); // log-c4, log3g10, bmd-film, s-log3
    this.setParameter('whiteBalance', 5600); // Kelvin
    this.setParameter('tint', 0);
    
    // Compression settings
    this.setParameter('compression', 'lossless'); // lossless, 3:1, 5:1, 8:1, 12:1
    this.setParameter('bitDepth', 16);
    
    // Frame range
    this.setParameter('startFrame', 1);
    this.setParameter('endFrame', 100);
    this.setParameter('fps', 24);
    
    // Metadata
    this.setParameter('reel', 'A001');
    this.setParameter('clipName', 'C001');
    this.setParameter('takeNumber', 1);
    this.setParameter('cameraSerialNumber', '');
    this.setParameter('lensSerialNumber', '');
    this.setParameter('lensInfo', '');
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const frameInput = this.inputs.get('frame');
    
    if (!imageInput?.value) {
      return;
    }

    const inputImage = imageInput.value as ImageData;
    const frame = frameInput?.value ?? this.currentFrame;
    
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    
    // Check if frame is within range
    if (frame < startFrame || frame > endFrame) {
      return;
    }
    
    // Convert to camera format color space
    const convertedImage = this.convertToCameraFormat(inputImage);
    
    // Store frame
    this.frameBuffer.push(convertedImage);
    
    // Store export info
    this.cache.set('lastProcessedFrame', frame);
    this.cache.set('frameData', convertedImage);
    this.cache.set('exportSettings', this.getExportSettings());
    
    this.currentFrame++;
  }

  /**
   * Convert image to camera-specific format
   */
  private convertToCameraFormat(image: ImageData): ImageData {
    const cameraFormat = this.getParameter('cameraFormat');
    const colorSpace = this.getParameter('colorSpace');
    const gamma = this.getParameter('gamma');
    const bitDepth = this.getParameter('bitDepth');
    
    // Allocate output buffer based on bit depth
    let outData: Uint8Array | Uint16Array | Float32Array;
    let format: ImageData['format'];
    
    if (bitDepth === 32) {
      outData = new Float32Array(image.width * image.height * 4);
      format = 'rgba32f';
    } else if (bitDepth === 16) {
      outData = new Uint16Array(image.width * image.height * 4);
      format = 'rgba16';
    } else {
      outData = new Uint8Array(image.width * image.height * 4);
      format = 'rgba8';
    }
    
    // Process each pixel
    for (let i = 0; i < image.width * image.height; i++) {
      const srcIdx = i * image.channels;
      const dstIdx = i * 4;
      
      // Normalize input
      let r = this.normalizeValue(image.data[srcIdx], image.format);
      let g = this.normalizeValue(image.data[srcIdx + 1], image.format);
      let b = this.normalizeValue(image.data[srcIdx + 2], image.format);
      const a = image.channels === 4 
        ? this.normalizeValue(image.data[srcIdx + 3], image.format) 
        : 1.0;
      
      // Apply camera-specific color transform
      [r, g, b] = this.applyColorTransform(r, g, b, cameraFormat, colorSpace, gamma);
      
      // Write output
      if (bitDepth === 32) {
        (outData as Float32Array)[dstIdx] = r;
        (outData as Float32Array)[dstIdx + 1] = g;
        (outData as Float32Array)[dstIdx + 2] = b;
        (outData as Float32Array)[dstIdx + 3] = a;
      } else if (bitDepth === 16) {
        (outData as Uint16Array)[dstIdx] = Math.round(Math.max(0, Math.min(1, r)) * 65535);
        (outData as Uint16Array)[dstIdx + 1] = Math.round(Math.max(0, Math.min(1, g)) * 65535);
        (outData as Uint16Array)[dstIdx + 2] = Math.round(Math.max(0, Math.min(1, b)) * 65535);
        (outData as Uint16Array)[dstIdx + 3] = Math.round(Math.max(0, Math.min(1, a)) * 65535);
      } else {
        (outData as Uint8Array)[dstIdx] = Math.round(Math.max(0, Math.min(1, r)) * 255);
        (outData as Uint8Array)[dstIdx + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
        (outData as Uint8Array)[dstIdx + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
        (outData as Uint8Array)[dstIdx + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255);
      }
    }
    
    return {
      width: image.width,
      height: image.height,
      channels: 4,
      data: outData,
      format,
      colorSpace
    };
  }

  /**
   * Apply camera-specific color transform
   */
  private applyColorTransform(
    r: number, 
    g: number, 
    b: number, 
    cameraFormat: string, 
    colorSpace: string, 
    gamma: string
  ): [number, number, number] {
    // Apply log encoding based on camera type
    switch (gamma) {
      case 'log-c4':
        // ARRI LogC4
        r = this.encodeLogC4(r);
        g = this.encodeLogC4(g);
        b = this.encodeLogC4(b);
        break;
        
      case 'log3g10':
        // RED Log3G10
        r = this.encodeLog3G10(r);
        g = this.encodeLog3G10(g);
        b = this.encodeLog3G10(b);
        break;
        
      case 'bmd-film':
        // Blackmagic Film Gen5
        r = this.encodeBMDFilm(r);
        g = this.encodeBMDFilm(g);
        b = this.encodeBMDFilm(b);
        break;
        
      case 's-log3':
        // Sony S-Log3
        r = this.encodeSLog3(r);
        g = this.encodeSLog3(g);
        b = this.encodeSLog3(b);
        break;
    }
    
    return [r, g, b];
  }

  /**
   * ARRI LogC4 encoding
   */
  private encodeLogC4(linear: number): number {
    const a = 2231.82630906769;
    const b = 64.0;
    const c = 0.0740005733303622;
    const t = 0.00010591;
    
    if (linear < t) {
      return (linear - t) / a + c;
    } else {
      return (Math.log2(linear + b) + 6.0) / 14.0;
    }
  }

  /**
   * RED Log3G10 encoding
   */
  private encodeLog3G10(linear: number): number {
    const a = 155.975327;
    const logBase = 2.0;
    const offset = 0.01;
    
    if (linear < 0) {
      return linear * 8.0;
    } else {
      return Math.log10(linear * a + 1.0) / logBase + offset;
    }
  }

  /**
   * Blackmagic Film Gen5 encoding
   */
  private encodeBMDFilm(linear: number): number {
    const linearScale = 0.09246575342;
    const logScale = 0.5300133392;
    const logGamma = 0.09529463918;
    const logOffset = 0.0849326897;
    const linearCut = 0.004623288632;
    
    if (linear < linearCut) {
      return linearScale * linear + logOffset;
    } else {
      return logScale * Math.pow(linear, logGamma) + 0.3802487575;
    }
  }

  /**
   * Sony S-Log3 encoding
   */
  private encodeSLog3(linear: number): number {
    const linearCut = 0.01125000;
    
    if (linear >= linearCut) {
      return (420.0 + Math.log10((linear + 0.01) / (0.18 + 0.01)) * 261.5) / 1023.0;
    } else {
      return (linear * (171.2102946929 - 95.0) / 0.01125000 + 95.0) / 1023.0;
    }
  }

  /**
   * Normalize pixel value to 0-1 range
   */
  private normalizeValue(value: number, format: string): number {
    if (format === 'rgba32f' || format === 'float' || format === 'exr') {
      return value;
    } else if (format === 'rgba16') {
      return value / 65535;
    } else {
      return value / 255;
    }
  }

  /**
   * Get export settings
   */
  getExportSettings(): CameraFormatSettings {
    return {
      outputPath: this.getParameter('outputPath'),
      cameraFormat: this.getParameter('cameraFormat'),
      resolution: this.getParameter('resolution'),
      colorSpace: this.getParameter('colorSpace'),
      gamma: this.getParameter('gamma'),
      compression: this.getParameter('compression')
    };
  }

  /**
   * Get camera format details
   */
  getCameraFormatDetails(): Record<string, any> {
    const format = this.getParameter('cameraFormat');
    
    switch (format) {
      case 'arriraw':
        return {
          name: 'ARRI RAW',
          extension: 'ari',
          colorSpaces: ['arri-wide-gamut'],
          gammas: ['log-c4', 'log-c3'],
          bitDepths: [12, 16],
          maxResolution: { width: 6560, height: 3100 }
        };
        
      case 'r3d':
        return {
          name: 'RED R3D',
          extension: 'r3d',
          colorSpaces: ['red-wide-gamut', 'dragon-color2'],
          gammas: ['log3g10', 'log3g12'],
          bitDepths: [16],
          maxResolution: { width: 8192, height: 4320 }
        };
        
      case 'braw':
        return {
          name: 'Blackmagic RAW',
          extension: 'braw',
          colorSpaces: ['bmd-film-gen5', 'bmd-wide-gamut'],
          gammas: ['bmd-film', 'bmd-video'],
          bitDepths: [12, 16],
          maxResolution: { width: 6144, height: 3456 }
        };
        
      case 'sonyraw':
        return {
          name: 'Sony RAW',
          extension: 'mxf',
          colorSpaces: ['s-gamut3', 's-gamut3.cine'],
          gammas: ['s-log3', 's-log2'],
          bitDepths: [16],
          maxResolution: { width: 4096, height: 2160 }
        };
        
      default:
        return { name: 'Unknown', extension: 'raw' };
    }
  }

  /**
   * Get frame buffer
   */
  getFrameBuffer(): ImageData[] {
    return [...this.frameBuffer];
  }

  /**
   * Clear frame buffer
   */
  clearBuffer(): void {
    this.frameBuffer = [];
    this.currentFrame = 0;
  }
}
