/**
 * ImageSequenceInputNode - Loads image sequences for VFX processing
 * Supports standard naming conventions like filename.####.ext or filename_####.ext
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class ImageSequenceInputNode extends Node {
  private imageFrames: ImageData[] = [];
  private currentFrame: number = 0;
  private isLoaded: boolean = false;
  private frameCount: number = 0;

  constructor(id: string) {
    super(id, 'ImageSequence', 'Image Sequence');
    this.metadata.category = 'Input';
    this.metadata.description = 'Load image sequences (EXR, DPX, PNG, TIFF, JPG) with frame padding support';
    this.metadata.version = '1.0.0';
    
    // Outputs
    this.addOutput('image', 'Current Frame', DataType.IMAGE);
    this.addOutput('frameNumber', 'Frame Number', DataType.NUMBER);
    this.addOutput('frameCount', 'Frame Count', DataType.NUMBER);
    
    // File parameters
    this.setParameter('directory', '');
    this.setParameter('filePattern', 'frame.####.exr'); // Supports ####, %04d, etc.
    this.setParameter('startFrame', 1);
    this.setParameter('endFrame', 100);
    this.setParameter('padding', 4); // Number of digits in frame number
    
    // Format settings
    this.setParameter('format', 'auto'); // auto, exr, dpx, png, tiff, jpg
    this.setParameter('bitDepth', 'auto'); // auto, 8, 16, 32
    this.setParameter('colorSpace', 'Linear'); // Linear, sRGB, ACEScg, Rec709, Rec2020
    this.setParameter('channels', 'rgba'); // rgba, rgb, r, g, b, a
    
    // Playback controls
    this.setParameter('loop', true);
    this.setParameter('reverse', false);
    this.setParameter('hold', false); // Hold first/last frame when out of range
    this.setParameter('speed', 1.0); // Playback speed multiplier
    this.setParameter('frameOffset', 0);
    
    // Missing frames handling
    this.setParameter('missingFrameMode', 'black'); // black, hold, error, skip
    
    // Cache settings
    this.setParameter('cacheFrames', true);
    this.setParameter('cacheSize', 50); // Number of frames to keep in memory
    this.setParameter('preloadAll', false); // Load entire sequence into memory
    
    // Advanced options
    this.setParameter('gamma', 1.0); // Gamma correction
    this.setParameter('exposure', 0.0); // Exposure adjustment in stops
    this.setParameter('flipVertical', false);
    this.setParameter('flipHorizontal', false);
    
    // Metadata
    this.setParameter('readMetadata', true);
    this.setParameter('copyMetadata', false); // Copy EXIF/metadata to output
  }

  async process(): Promise<void> {
    const directory = this.getParameter('directory') as string;
    const filePattern = this.getParameter('filePattern') as string;
    const startFrame = this.getParameter('startFrame') as number;
    const endFrame = this.getParameter('endFrame') as number;
    const frameOffset = this.getParameter('frameOffset') as number;
    const loop = this.getParameter('loop') as boolean;
    const reverse = this.getParameter('reverse') as boolean;
    const hold = this.getParameter('hold') as boolean;
    const speed = this.getParameter('speed') as number;
    
    // Load sequence if not loaded
    if (!this.isLoaded && directory && filePattern) {
      await this.loadSequence(directory, filePattern, startFrame, endFrame);
    }
    
    // Calculate current frame based on parameters
    let frameIndex = Math.floor(this.currentFrame * speed) + frameOffset;
    
    if (reverse) {
      frameIndex = this.frameCount - 1 - frameIndex;
    }
    
    // Handle out-of-range frames
    if (this.frameCount > 0) {
      if (loop) {
        frameIndex = ((frameIndex % this.frameCount) + this.frameCount) % this.frameCount;
      } else if (hold) {
        frameIndex = Math.max(0, Math.min(frameIndex, this.frameCount - 1));
      } else {
        frameIndex = Math.max(0, Math.min(frameIndex, this.frameCount - 1));
      }
    }
    
    // Get frame data
    const currentFrameData = this.imageFrames[frameIndex] || this.generatePlaceholderFrame();
    
    // Apply transformations
    const flipVertical = this.getParameter('flipVertical') as boolean;
    const flipHorizontal = this.getParameter('flipHorizontal') as boolean;
    const exposure = this.getParameter('exposure') as number;
    const gamma = this.getParameter('gamma') as number;
    
    let processedFrame = currentFrameData;
    if (flipVertical || flipHorizontal || exposure !== 0 || gamma !== 1.0) {
      processedFrame = this.applyTransformations(currentFrameData, {
        flipVertical,
        flipHorizontal,
        exposure,
        gamma
      });
    }
    
    // Set outputs
    const imageOutput = this.outputs.get('image');
    if (imageOutput) {
      imageOutput.value = processedFrame;
    }
    
    const frameNumberOutput = this.outputs.get('frameNumber');
    if (frameNumberOutput) {
      frameNumberOutput.value = frameIndex + startFrame;
    }
    
    const frameCountOutput = this.outputs.get('frameCount');
    if (frameCountOutput) {
      frameCountOutput.value = this.frameCount;
    }
    
    // Advance frame for next process
    this.currentFrame++;
  }

  private async loadSequence(
    directory: string,
    filePattern: string,
    startFrame: number,
    endFrame: number
  ): Promise<void> {
    // TODO: Implement actual file loading
    // For now, generate sample frames
    console.log(`Loading sequence from ${directory}/${filePattern}`);
    console.log(`Frame range: ${startFrame}-${endFrame}`);
    
    this.frameCount = endFrame - startFrame + 1;
    this.imageFrames = [];
    
    // Generate sample frames
    for (let i = 0; i < this.frameCount; i++) {
      this.imageFrames.push(this.generatePlaceholderFrame(i, this.frameCount));
    }
    
    this.isLoaded = true;
  }

  private generatePlaceholderFrame(frame: number = 0, totalFrames: number = 100): ImageData {
    const width = 2048;
    const height = 2048;
    const bitDepth = this.getParameter('bitDepth') as string;
    
    // Support different bit depths
    let data: Uint8Array | Uint16Array | Float32Array;
    const format = bitDepth === '32' ? 'rgba32f' : bitDepth === '16' ? 'rgba16' : 'rgba8';
    
    switch (format) {
      case 'rgba16':
        data = new Uint16Array(width * height * 4);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const phase = (frame / totalFrames) * Math.PI * 2;
            data[idx] = Math.floor(32768 + 32767 * Math.sin(x / width * Math.PI + phase));
            data[idx + 1] = Math.floor(32768 + 32767 * Math.sin(y / height * Math.PI + phase));
            data[idx + 2] = Math.floor(32768 + 32767 * Math.cos((x + y) / (width + height) * Math.PI + phase));
            data[idx + 3] = 65535;
          }
        }
        break;
      case 'rgba32f':
        data = new Float32Array(width * height * 4);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const phase = (frame / totalFrames) * Math.PI * 2;
            data[idx] = 0.5 + 0.5 * Math.sin(x / width * Math.PI + phase);
            data[idx + 1] = 0.5 + 0.5 * Math.sin(y / height * Math.PI + phase);
            data[idx + 2] = 0.5 + 0.5 * Math.cos((x + y) / (width + height) * Math.PI + phase);
            data[idx + 3] = 1.0;
          }
        }
        break;
      default: // rgba8
        data = new Uint8Array(width * height * 4);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const phase = (frame / totalFrames) * Math.PI * 2;
            data[idx] = Math.floor(128 + 127 * Math.sin(x / width * Math.PI + phase));
            data[idx + 1] = Math.floor(128 + 127 * Math.sin(y / height * Math.PI + phase));
            data[idx + 2] = Math.floor(128 + 127 * Math.cos((x + y) / (width + height) * Math.PI + phase));
            data[idx + 3] = 255;
          }
        }
    }
    
    return {
      width,
      height,
      channels: 4,
      data,
      format: format as any,
      colorSpace: this.getParameter('colorSpace') as string
    };
  }

  private applyTransformations(
    imageData: ImageData,
    transforms: {
      flipVertical: boolean;
      flipHorizontal: boolean;
      exposure: number;
      gamma: number;
    }
  ): ImageData {
    // Clone image data for transformation
    const newData = new Uint8Array(imageData.data.length);
    newData.set(imageData.data as Uint8Array);
    
    // TODO: Implement actual transformations
    // For now, just return the original
    
    return {
      ...imageData,
      data: newData
    };
  }

  setCurrentFrame(frame: number): void {
    this.currentFrame = frame;
    this.markDirty();
  }

  reset(): void {
    this.currentFrame = 0;
    this.markDirty();
  }

  dispose(): void {
    this.imageFrames = [];
    this.isLoaded = false;
    super.dispose();
  }
}
