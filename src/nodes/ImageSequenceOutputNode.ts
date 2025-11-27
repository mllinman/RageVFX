/**
 * ImageSequenceOutputNode - Output node for image sequence exports
 * Supports PNG, JPEG, TIFF, EXR sequences with frame numbering
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export interface ImageSequenceSettings {
  basePath: string;
  baseName: string;
  format: 'png' | 'jpeg' | 'tiff' | 'exr' | 'dpx';
  startFrame: number;
  endFrame: number;
  frameStep: number;
  padding: number;
  bitDepth: 8 | 16 | 32;
  compression: string;
  colorSpace: string;
}

export class ImageSequenceOutputNode extends Node {
  private frameBuffer: Map<number, ImageData> = new Map();
  private currentExportFrame: number = 0;
  private isExporting: boolean = false;

  constructor(id: string) {
    super(id, 'ImageSequenceOutput', 'Image Sequence Output');
    this.metadata.category = 'Output';
    this.metadata.description = 'Export image sequences (PNG, JPEG, TIFF, EXR, DPX)';
    this.metadata.version = '2.1.0';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('frame', 'Frame Number', DataType.NUMBER);
    
    // File settings
    this.setParameter('basePath', './output/');
    this.setParameter('baseName', 'frame');
    this.setParameter('format', 'exr');
    this.setParameter('padding', 4); // frame_0001.exr
    
    // Range settings
    this.setParameter('startFrame', 1);
    this.setParameter('endFrame', 100);
    this.setParameter('frameStep', 1);
    
    // Format-specific settings
    this.setParameter('bitDepth', 16); // 8, 16, 32 (float)
    this.setParameter('compression', 'zip'); // none, rle, zip, piz (EXR), lzw (TIFF), etc.
    this.setParameter('quality', 100); // JPEG quality
    
    // Color settings
    this.setParameter('colorSpace', 'ACEScg');
    this.setParameter('gamma', 1.0);
    this.setParameter('premultiplyAlpha', true);
    
    // Metadata
    this.setParameter('embedMetadata', true);
    this.setParameter('copyright', '');
    this.setParameter('comment', '');
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    const frameInput = this.inputs.get('frame');
    
    if (!imageInput?.value) {
      return;
    }

    const inputImage = imageInput.value as ImageData;
    const frame = frameInput?.value ?? this.currentExportFrame;
    
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    const frameStep = this.getParameter('frameStep');
    
    // Check if frame is within range and on step
    if (frame < startFrame || frame > endFrame) {
      return;
    }
    
    if ((frame - startFrame) % frameStep !== 0) {
      return;
    }
    
    // Convert and store frame
    const convertedImage = this.convertImage(inputImage);
    this.frameBuffer.set(frame, convertedImage);
    
    // Generate filename
    const filename = this.generateFilename(frame);
    
    // Store export info in cache for external processing
    this.cache.set('lastExportedFrame', frame);
    this.cache.set('lastFilename', filename);
    this.cache.set('frameData', convertedImage);
    
    this.currentExportFrame++;
  }

  /**
   * Convert image to output format/bit depth
   */
  private convertImage(image: ImageData): ImageData {
    const bitDepth = this.getParameter('bitDepth');
    const premultiplyAlpha = this.getParameter('premultiplyAlpha');
    
    let outData: Uint8Array | Uint16Array | Float32Array;
    let format: ImageData['format'];
    
    switch (bitDepth) {
      case 8:
        outData = new Uint8Array(image.width * image.height * 4);
        format = 'rgba8';
        break;
      case 16:
        outData = new Uint16Array(image.width * image.height * 4);
        format = 'rgba16';
        break;
      case 32:
        outData = new Float32Array(image.width * image.height * 4);
        format = 'rgba32f';
        break;
      default:
        outData = new Uint8Array(image.width * image.height * 4);
        format = 'rgba8';
    }
    
    // Convert data
    for (let i = 0; i < image.width * image.height; i++) {
      const srcIdx = i * image.channels;
      const dstIdx = i * 4;
      
      let r = this.normalizeValue(image.data[srcIdx], image.format);
      let g = this.normalizeValue(image.data[srcIdx + 1], image.format);
      let b = this.normalizeValue(image.data[srcIdx + 2], image.format);
      const a = image.channels === 4 
        ? this.normalizeValue(image.data[srcIdx + 3], image.format) 
        : 1.0;
      
      // Premultiply alpha if requested
      if (premultiplyAlpha && a < 1.0) {
        r *= a;
        g *= a;
        b *= a;
      }
      
      // Convert to output bit depth
      switch (bitDepth) {
        case 8:
          (outData as Uint8Array)[dstIdx] = Math.round(r * 255);
          (outData as Uint8Array)[dstIdx + 1] = Math.round(g * 255);
          (outData as Uint8Array)[dstIdx + 2] = Math.round(b * 255);
          (outData as Uint8Array)[dstIdx + 3] = Math.round(a * 255);
          break;
        case 16:
          (outData as Uint16Array)[dstIdx] = Math.round(r * 65535);
          (outData as Uint16Array)[dstIdx + 1] = Math.round(g * 65535);
          (outData as Uint16Array)[dstIdx + 2] = Math.round(b * 65535);
          (outData as Uint16Array)[dstIdx + 3] = Math.round(a * 65535);
          break;
        case 32:
          (outData as Float32Array)[dstIdx] = r;
          (outData as Float32Array)[dstIdx + 1] = g;
          (outData as Float32Array)[dstIdx + 2] = b;
          (outData as Float32Array)[dstIdx + 3] = a;
          break;
      }
    }
    
    return {
      width: image.width,
      height: image.height,
      channels: 4,
      data: outData,
      format,
      colorSpace: this.getParameter('colorSpace')
    };
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
   * Generate filename for a frame
   */
  private generateFilename(frame: number): string {
    const basePath = this.getParameter('basePath');
    const baseName = this.getParameter('baseName');
    const format = this.getParameter('format');
    const padding = this.getParameter('padding');
    
    const frameStr = frame.toString().padStart(padding, '0');
    const extension = this.getFileExtension(format);
    
    return `${basePath}${baseName}.${frameStr}.${extension}`;
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: string): string {
    switch (format) {
      case 'png': return 'png';
      case 'jpeg': return 'jpg';
      case 'tiff': return 'tif';
      case 'exr': return 'exr';
      case 'dpx': return 'dpx';
      default: return 'png';
    }
  }

  /**
   * Get export settings
   */
  getExportSettings(): ImageSequenceSettings {
    return {
      basePath: this.getParameter('basePath'),
      baseName: this.getParameter('baseName'),
      format: this.getParameter('format'),
      startFrame: this.getParameter('startFrame'),
      endFrame: this.getParameter('endFrame'),
      frameStep: this.getParameter('frameStep'),
      padding: this.getParameter('padding'),
      bitDepth: this.getParameter('bitDepth'),
      compression: this.getParameter('compression'),
      colorSpace: this.getParameter('colorSpace')
    };
  }

  /**
   * Start export process
   */
  startExport(): void {
    this.isExporting = true;
    this.currentExportFrame = this.getParameter('startFrame');
    this.frameBuffer.clear();
  }

  /**
   * End export process
   */
  endExport(): void {
    this.isExporting = false;
  }

  /**
   * Get export progress
   */
  getExportProgress(): number {
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    const total = endFrame - startFrame + 1;
    const current = this.currentExportFrame - startFrame;
    return total > 0 ? current / total : 0;
  }

  /**
   * Get buffered frames
   */
  getFrameBuffer(): Map<number, ImageData> {
    return new Map(this.frameBuffer);
  }

  /**
   * Clear frame buffer
   */
  clearBuffer(): void {
    this.frameBuffer.clear();
  }
}
