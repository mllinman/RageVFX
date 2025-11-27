/**
 * VideoSequenceOutputNode - Output node for video sequence exports
 * Supports MP4 (H.264, H.265), ProRes, DNxHD, and other video codecs
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export interface VideoCodecSettings {
  codec: string;
  profile: string;
  bitrate: number;
  crf: number;
  preset: string;
}

export interface VideoSequenceSettings {
  outputPath: string;
  container: 'mp4' | 'mov' | 'mxf' | 'avi' | 'webm';
  codec: 'h264' | 'h265' | 'prores' | 'dnxhd' | 'dnxhr' | 'vp9' | 'av1';
  width: number;
  height: number;
  fps: number;
  startFrame: number;
  endFrame: number;
  colorSpace: string;
}

export class VideoSequenceOutputNode extends Node {
  private frameQueue: ImageData[] = [];
  private currentFrame: number = 0;
  private isEncoding: boolean = false;

  constructor(id: string) {
    super(id, 'VideoSequenceOutput', 'Video Sequence Output');
    this.metadata.category = 'Output';
    this.metadata.description = 'Export video sequences (MP4, ProRes, DNxHD)';
    this.metadata.version = '2.1.0';
    
    this.addInput('image', 'Input', DataType.IMAGE);
    this.addInput('frame', 'Frame Number', DataType.NUMBER);
    
    // Output settings
    this.setParameter('outputPath', './output/render.mp4');
    this.setParameter('container', 'mp4');
    
    // Codec settings
    this.setParameter('codec', 'h264');
    this.setParameter('codecProfile', 'high');
    this.setParameter('codecLevel', '4.2');
    
    // Quality settings
    this.setParameter('bitrate', 50000000); // 50 Mbps
    this.setParameter('maxBitrate', 100000000); // 100 Mbps
    this.setParameter('crf', 18); // Constant Rate Factor (0-51, lower = better)
    this.setParameter('preset', 'medium'); // ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
    
    // Resolution and frame rate
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('fps', 24);
    this.setParameter('pixelAspectRatio', 1.0);
    
    // Frame range
    this.setParameter('startFrame', 1);
    this.setParameter('endFrame', 100);
    
    // Color settings
    this.setParameter('colorSpace', 'bt709'); // bt709, bt2020, srgb
    this.setParameter('colorPrimaries', 'bt709');
    this.setParameter('transferCharacteristics', 'bt709');
    this.setParameter('matrixCoefficients', 'bt709');
    
    // ProRes specific settings
    this.setParameter('proresProfile', '422hq'); // 422proxy, 422lt, 422, 422hq, 4444, 4444xq
    
    // DNxHD/DNxHR specific settings
    this.setParameter('dnxProfile', 'dnxhq'); // dnxlb, dnxsq, dnxhq, dnxhqx, dnx444
    
    // Audio settings (for future expansion)
    this.setParameter('audioEnabled', false);
    this.setParameter('audioCodec', 'aac');
    this.setParameter('audioBitrate', 320000);
    this.setParameter('audioChannels', 2);
    this.setParameter('audioSampleRate', 48000);
    
    // Metadata
    this.setParameter('title', '');
    this.setParameter('artist', '');
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
    const frame = frameInput?.value ?? this.currentFrame;
    
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    
    // Check if frame is within range
    if (frame < startFrame || frame > endFrame) {
      return;
    }
    
    // Convert frame to video format (8-bit RGB/YUV)
    const convertedFrame = this.convertToVideoFormat(inputImage);
    
    // Add to frame queue
    this.frameQueue.push(convertedFrame);
    
    // Store frame info in cache
    this.cache.set('lastProcessedFrame', frame);
    this.cache.set('frameData', convertedFrame);
    this.cache.set('encoderSettings', this.getEncoderSettings());
    
    this.currentFrame++;
  }

  /**
   * Convert image to video-compatible format
   */
  private convertToVideoFormat(image: ImageData): ImageData {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    
    // Scale image if needed
    const scaledData = this.scaleImage(image, width, height);
    
    // Convert to 8-bit RGB for video encoding
    const outData = new Uint8Array(width * height * 3);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * scaledData.channels;
      const dstIdx = i * 3;
      
      let r = this.normalizeValue(scaledData.data[srcIdx], scaledData.format);
      let g = this.normalizeValue(scaledData.data[srcIdx + 1], scaledData.format);
      let b = this.normalizeValue(scaledData.data[srcIdx + 2], scaledData.format);
      
      // Apply gamma correction for video
      r = Math.pow(r, 1/2.2);
      g = Math.pow(g, 1/2.2);
      b = Math.pow(b, 1/2.2);
      
      // Clamp and convert to 8-bit
      outData[dstIdx] = Math.max(0, Math.min(255, Math.round(r * 255)));
      outData[dstIdx + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
      outData[dstIdx + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
    }
    
    return {
      width,
      height,
      channels: 3,
      data: outData,
      format: 'rgb',
      colorSpace: this.getParameter('colorSpace')
    };
  }

  /**
   * Scale image to target resolution
   */
  private scaleImage(image: ImageData, targetWidth: number, targetHeight: number): ImageData {
    if (image.width === targetWidth && image.height === targetHeight) {
      return image;
    }
    
    // Bilinear interpolation scaling
    const channels = image.channels;
    const outData = new Uint8Array(targetWidth * targetHeight * channels);
    
    const xRatio = image.width / targetWidth;
    const yRatio = image.height / targetHeight;
    
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = x * xRatio;
        const srcY = y * yRatio;
        
        const x0 = Math.floor(srcX);
        const y0 = Math.floor(srcY);
        const x1 = Math.min(x0 + 1, image.width - 1);
        const y1 = Math.min(y0 + 1, image.height - 1);
        
        const fx = srcX - x0;
        const fy = srcY - y0;
        
        for (let c = 0; c < channels; c++) {
          const v00 = image.data[(y0 * image.width + x0) * channels + c];
          const v10 = image.data[(y0 * image.width + x1) * channels + c];
          const v01 = image.data[(y1 * image.width + x0) * channels + c];
          const v11 = image.data[(y1 * image.width + x1) * channels + c];
          
          const value = v00 * (1 - fx) * (1 - fy) +
                        v10 * fx * (1 - fy) +
                        v01 * (1 - fx) * fy +
                        v11 * fx * fy;
          
          outData[(y * targetWidth + x) * channels + c] = Math.round(value);
        }
      }
    }
    
    return {
      width: targetWidth,
      height: targetHeight,
      channels,
      data: outData,
      format: image.format
    };
  }

  /**
   * Normalize pixel value to 0-1 range
   */
  private normalizeValue(value: number, format: string): number {
    if (format === 'rgba32f' || format === 'float' || format === 'exr') {
      return Math.max(0, Math.min(1, value));
    } else if (format === 'rgba16') {
      return value / 65535;
    } else {
      return value / 255;
    }
  }

  /**
   * Get encoder settings based on current parameters
   */
  getEncoderSettings(): VideoCodecSettings {
    const codec = this.getParameter('codec');
    
    switch (codec) {
      case 'h264':
      case 'h265':
        return {
          codec,
          profile: this.getParameter('codecProfile'),
          bitrate: this.getParameter('bitrate'),
          crf: this.getParameter('crf'),
          preset: this.getParameter('preset')
        };
        
      case 'prores':
        return {
          codec: 'prores',
          profile: this.getParameter('proresProfile'),
          bitrate: 0, // ProRes is always intra-frame
          crf: 0,
          preset: 'default'
        };
        
      case 'dnxhd':
      case 'dnxhr':
        return {
          codec: 'dnxhd',
          profile: this.getParameter('dnxProfile'),
          bitrate: this.getParameter('bitrate'),
          crf: 0,
          preset: 'default'
        };
        
      default:
        return {
          codec,
          profile: 'default',
          bitrate: this.getParameter('bitrate'),
          crf: this.getParameter('crf'),
          preset: this.getParameter('preset')
        };
    }
  }

  /**
   * Get export settings
   */
  getExportSettings(): VideoSequenceSettings {
    return {
      outputPath: this.getParameter('outputPath'),
      container: this.getParameter('container'),
      codec: this.getParameter('codec'),
      width: this.getParameter('width'),
      height: this.getParameter('height'),
      fps: this.getParameter('fps'),
      startFrame: this.getParameter('startFrame'),
      endFrame: this.getParameter('endFrame'),
      colorSpace: this.getParameter('colorSpace')
    };
  }

  /**
   * Start encoding process
   */
  startEncoding(): void {
    this.isEncoding = true;
    this.currentFrame = this.getParameter('startFrame');
    this.frameQueue = [];
  }

  /**
   * End encoding process
   */
  endEncoding(): void {
    this.isEncoding = false;
  }

  /**
   * Get encoding progress
   */
  getEncodingProgress(): number {
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    const total = endFrame - startFrame + 1;
    const current = this.currentFrame - startFrame;
    return total > 0 ? current / total : 0;
  }

  /**
   * Get frame queue for encoding
   */
  getFrameQueue(): ImageData[] {
    return [...this.frameQueue];
  }

  /**
   * Clear frame queue
   */
  clearQueue(): void {
    this.frameQueue = [];
  }

  /**
   * Get FFmpeg command for encoding (for external processing)
   */
  getFFmpegCommand(): string {
    const settings = this.getExportSettings();
    const codecSettings = this.getEncoderSettings();
    
    let cmd = `ffmpeg -y -f rawvideo -pix_fmt rgb24 -s ${settings.width}x${settings.height} -r ${settings.fps} -i -`;
    
    switch (settings.codec) {
      case 'h264':
        cmd += ` -c:v libx264 -profile:v ${codecSettings.profile} -preset ${codecSettings.preset} -crf ${codecSettings.crf}`;
        break;
      case 'h265':
        cmd += ` -c:v libx265 -preset ${codecSettings.preset} -crf ${codecSettings.crf}`;
        break;
      case 'prores':
        cmd += ` -c:v prores_ks -profile:v ${this.getProResProfileNumber()}`;
        break;
      case 'dnxhd':
        cmd += ` -c:v dnxhd -b:v ${codecSettings.bitrate}`;
        break;
    }
    
    cmd += ` "${settings.outputPath}"`;
    
    return cmd;
  }

  /**
   * Get ProRes profile number
   */
  private getProResProfileNumber(): number {
    const profile = this.getParameter('proresProfile');
    switch (profile) {
      case '422proxy': return 0;
      case '422lt': return 1;
      case '422': return 2;
      case '422hq': return 3;
      case '4444': return 4;
      case '4444xq': return 5;
      default: return 3;
    }
  }
}
