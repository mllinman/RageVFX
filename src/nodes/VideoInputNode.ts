/**
 * VideoInputNode - Loads and decodes video files for VFX processing
 * Supports multiple video codecs and formats including MP4, MOV, MKV, AVI, WebM
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class VideoInputNode extends Node {
  private videoFrames: ImageData[] = [];
  private currentFrame: number = 0;
  private isLoaded: boolean = false;

  constructor(id: string) {
    super(id, 'VideoInput', 'Video Input');
    this.metadata.category = 'Input';
    this.metadata.description = 'Load video files with codec support (H.264, H.265, ProRes, VP9, AV1)';
    this.metadata.version = '1.0.0';
    
    // Outputs
    this.addOutput('image', 'Current Frame', DataType.IMAGE);
    this.addOutput('frameNumber', 'Frame Number', DataType.NUMBER);
    this.addOutput('duration', 'Duration (frames)', DataType.NUMBER);
    this.addOutput('fps', 'FPS', DataType.NUMBER);
    
    // File parameters
    this.setParameter('filepath', '');
    this.setParameter('startFrame', 0);
    this.setParameter('endFrame', -1); // -1 means end of video
    this.setParameter('frameOffset', 0); // Offset in frames
    
    // Codec and format settings
    this.setParameter('codec', 'auto'); // auto, h264, h265, prores, vp9, av1, dnxhd
    this.setParameter('colorSpace', 'sRGB'); // sRGB, Linear, Rec709, Rec2020, Log
    this.setParameter('bitDepth', '8'); // 8, 10, 12, 16
    
    // Playback controls
    this.setParameter('loop', true);
    this.setParameter('reverse', false);
    this.setParameter('speed', 1.0); // Playback speed multiplier
    
    // Cache settings
    this.setParameter('cacheFrames', true);
    this.setParameter('cacheSize', 100); // Number of frames to cache
    this.setParameter('preload', false); // Preload all frames
    
    // Advanced options
    this.setParameter('deinterlace', false);
    this.setParameter('fieldOrder', 'auto'); // auto, top, bottom
    this.setParameter('pixelAspect', 1.0);
    this.setParameter('gamma', 2.2);
  }

  async process(): Promise<void> {
    const filepath = this.getParameter('filepath') as string;
    const startFrame = this.getParameter('startFrame') as number;
    const endFrame = this.getParameter('endFrame') as number;
    const frameOffset = this.getParameter('frameOffset') as number;
    const loop = this.getParameter('loop') as boolean;
    const reverse = this.getParameter('reverse') as boolean;
    const speed = this.getParameter('speed') as number;
    
    // In a real implementation, this would use FFmpeg or similar to decode video
    // For now, generate placeholder frames
    if (!this.isLoaded && filepath) {
      await this.loadVideo(filepath);
    }
    
    // Calculate current frame based on parameters
    let frameIndex = this.currentFrame + frameOffset;
    
    if (reverse) {
      frameIndex = this.videoFrames.length - 1 - frameIndex;
    }
    
    // Handle looping
    if (loop && this.videoFrames.length > 0) {
      frameIndex = frameIndex % this.videoFrames.length;
    }
    
    // Clamp to valid range
    frameIndex = Math.max(0, Math.min(frameIndex, this.videoFrames.length - 1));
    
    // Get frame data
    const currentFrameData = this.videoFrames[frameIndex] || this.generatePlaceholderFrame();
    
    // Set outputs
    const imageOutput = this.outputs.get('image');
    if (imageOutput) {
      imageOutput.value = currentFrameData;
    }
    
    const frameNumberOutput = this.outputs.get('frameNumber');
    if (frameNumberOutput) {
      frameNumberOutput.value = frameIndex;
    }
    
    const durationOutput = this.outputs.get('duration');
    if (durationOutput) {
      durationOutput.value = this.videoFrames.length;
    }
    
    const fpsOutput = this.outputs.get('fps');
    if (fpsOutput) {
      fpsOutput.value = 24; // Default FPS, would be read from video metadata
    }
    
    // Advance frame for next process
    this.currentFrame = (this.currentFrame + speed) % (this.videoFrames.length || 1);
  }

  private async loadVideo(filepath: string): Promise<void> {
    // TODO: Implement actual video loading with FFmpeg or browser Video API
    // For now, generate sample frames
    console.log(`Loading video: ${filepath}`);
    
    // Generate 120 sample frames (5 seconds at 24fps)
    const numFrames = 120;
    this.videoFrames = [];
    
    for (let i = 0; i < numFrames; i++) {
      this.videoFrames.push(this.generatePlaceholderFrame(i, numFrames));
    }
    
    this.isLoaded = true;
  }

  private generatePlaceholderFrame(frame: number = 0, totalFrames: number = 100): ImageData {
    const width = 1920;
    const height = 1080;
    const data = new Uint8Array(width * height * 4);
    
    // Generate animated gradient based on frame
    const phase = (frame / totalFrames) * Math.PI * 2;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const nx = x / width;
        const ny = y / height;
        
        // Animated gradient
        data[idx] = Math.floor(128 + 127 * Math.sin(nx * Math.PI * 2 + phase));
        data[idx + 1] = Math.floor(128 + 127 * Math.sin(ny * Math.PI * 2 + phase));
        data[idx + 2] = Math.floor(128 + 127 * Math.cos((nx + ny) * Math.PI + phase));
        data[idx + 3] = 255;
      }
    }
    
    return {
      width,
      height,
      channels: 4,
      data,
      format: 'rgba8',
      colorSpace: this.getParameter('colorSpace') as string
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
    this.videoFrames = [];
    this.isLoaded = false;
    super.dispose();
  }
}
