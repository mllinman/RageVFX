/**
 * Resolution8KNode - 8K+ Ultra High Resolution Pipeline Support
 * Version 3.3 - 8K+ Resolution Support
 */

import { Node, DataType } from '../core/Node';

export interface ResolutionPreset {
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  pixelCount: number;
  format: string;
}

export interface TileInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  totalTiles: number;
}

export class Resolution8KNode extends Node {
  // Industry-standard resolution presets
  private readonly resolutionPresets: Record<string, ResolutionPreset> = {
    // Standard HD
    'HD 720p': { name: 'HD 720p', width: 1280, height: 720, aspectRatio: 16/9, pixelCount: 921600, format: 'HD' },
    'HD 1080p': { name: 'HD 1080p', width: 1920, height: 1080, aspectRatio: 16/9, pixelCount: 2073600, format: 'HD' },
    
    // 2K Cinema
    '2K Flat': { name: '2K Flat', width: 1998, height: 1080, aspectRatio: 1.85, pixelCount: 2157840, format: '2K' },
    '2K Scope': { name: '2K Scope', width: 2048, height: 858, aspectRatio: 2.39, pixelCount: 1757184, format: '2K' },
    '2K DCI': { name: '2K DCI', width: 2048, height: 1080, aspectRatio: 1.896, pixelCount: 2211840, format: '2K' },
    '2K Full': { name: '2K Full', width: 2048, height: 1556, aspectRatio: 1.316, pixelCount: 3186688, format: '2K' },
    
    // UHD
    'UHD': { name: 'UHD', width: 3840, height: 2160, aspectRatio: 16/9, pixelCount: 8294400, format: 'UHD' },
    'UHD+': { name: 'UHD+', width: 5120, height: 2880, aspectRatio: 16/9, pixelCount: 14745600, format: 'UHD+' },
    
    // 4K Cinema
    '4K Flat': { name: '4K Flat', width: 3996, height: 2160, aspectRatio: 1.85, pixelCount: 8631360, format: '4K' },
    '4K Scope': { name: '4K Scope', width: 4096, height: 1716, aspectRatio: 2.39, pixelCount: 7028736, format: '4K' },
    '4K DCI': { name: '4K DCI', width: 4096, height: 2160, aspectRatio: 1.896, pixelCount: 8847360, format: '4K' },
    '4K Full': { name: '4K Full', width: 4096, height: 3112, aspectRatio: 1.316, pixelCount: 12746752, format: '4K' },
    
    // 6K
    '6K': { name: '6K', width: 6144, height: 3240, aspectRatio: 1.896, pixelCount: 19906560, format: '6K' },
    '6K Scope': { name: '6K Scope', width: 6144, height: 2574, aspectRatio: 2.39, pixelCount: 15814656, format: '6K' },
    '6K Full': { name: '6K Full', width: 6144, height: 4668, aspectRatio: 1.316, pixelCount: 28672128, format: '6K' },
    
    // 8K UHD
    '8K UHD': { name: '8K UHD', width: 7680, height: 4320, aspectRatio: 16/9, pixelCount: 33177600, format: '8K' },
    '8K DCI': { name: '8K DCI', width: 8192, height: 4320, aspectRatio: 1.896, pixelCount: 35389440, format: '8K' },
    '8K Flat': { name: '8K Flat', width: 7992, height: 4320, aspectRatio: 1.85, pixelCount: 34525440, format: '8K' },
    '8K Scope': { name: '8K Scope', width: 8192, height: 3432, aspectRatio: 2.39, pixelCount: 28114944, format: '8K' },
    '8K Full': { name: '8K Full', width: 8192, height: 6224, aspectRatio: 1.316, pixelCount: 50978816, format: '8K' },
    
    // 10K+ Cinema (Emerging)
    '10K': { name: '10K', width: 10240, height: 5400, aspectRatio: 1.896, pixelCount: 55296000, format: '10K' },
    
    // 12K
    '12K': { name: '12K', width: 12288, height: 6480, aspectRatio: 1.896, pixelCount: 79626240, format: '12K' },
    '12K Scope': { name: '12K Scope', width: 12288, height: 5148, aspectRatio: 2.39, pixelCount: 63258624, format: '12K' },
    
    // 16K (Future-proof)
    '16K': { name: '16K', width: 15360, height: 8640, aspectRatio: 16/9, pixelCount: 132710400, format: '16K' },
    '16K DCI': { name: '16K DCI', width: 16384, height: 8640, aspectRatio: 1.896, pixelCount: 141557760, format: '16K' },
    
    // IMAX
    'IMAX Digital': { name: 'IMAX Digital', width: 4096, height: 3072, aspectRatio: 1.33, pixelCount: 12582912, format: 'IMAX' },
    'IMAX Laser': { name: 'IMAX Laser', width: 5616, height: 4096, aspectRatio: 1.37, pixelCount: 23003136, format: 'IMAX' },
    
    // VR/360
    'VR 4K': { name: 'VR 4K', width: 4096, height: 4096, aspectRatio: 1, pixelCount: 16777216, format: 'VR' },
    'VR 8K': { name: 'VR 8K', width: 8192, height: 8192, aspectRatio: 1, pixelCount: 67108864, format: 'VR' },
    '360 Stereo 8K': { name: '360 Stereo 8K', width: 8192, height: 8192, aspectRatio: 1, pixelCount: 67108864, format: '360' },
    
    // Social Media
    'Instagram Square': { name: 'Instagram Square', width: 1080, height: 1080, aspectRatio: 1, pixelCount: 1166400, format: 'Social' },
    'Instagram Portrait': { name: 'Instagram Portrait', width: 1080, height: 1350, aspectRatio: 0.8, pixelCount: 1458000, format: 'Social' },
    'TikTok Vertical': { name: 'TikTok Vertical', width: 1080, height: 1920, aspectRatio: 9/16, pixelCount: 2073600, format: 'Social' },
    'YouTube 4K': { name: 'YouTube 4K', width: 3840, height: 2160, aspectRatio: 16/9, pixelCount: 8294400, format: 'Social' },
    'YouTube 8K': { name: 'YouTube 8K', width: 7680, height: 4320, aspectRatio: 16/9, pixelCount: 33177600, format: 'Social' }
  };

  constructor(id: string) {
    super(id, 'Resolution8K', 'Resolution 8K+');
    this.metadata.category = 'Output';
    this.metadata.description = 'Ultra-high resolution pipeline support from HD to 16K+ with tiled rendering for memory efficiency';
    this.metadata.version = '3.3.0';

    // Inputs
    this.addInput('image', 'Image', DataType.IMAGE);
    this.addInput('customWidth', 'Custom Width', DataType.NUMBER);
    this.addInput('customHeight', 'Custom Height', DataType.NUMBER);

    // Outputs
    this.addOutput('image', 'Scaled Image', DataType.IMAGE);
    this.addOutput('resolutionData', 'Resolution Data', DataType.ANY);
    this.addOutput('tiles', 'Render Tiles', DataType.ANY);

    // Resolution Selection
    this.setParameter('preset', 'UHD');
    this.setParameter('useCustom', false);
    this.setParameter('customWidth', 3840);
    this.setParameter('customHeight', 2160);
    this.setParameter('maintainAspectRatio', true);
    this.setParameter('aspectRatioSource', 'preset'); // preset, custom, input

    // Scaling Method
    this.setParameter('scalingMethod', 'lanczos'); // nearest, bilinear, bicubic, lanczos, mitchell
    this.setParameter('sharpening', 0.5); // 0-1, applied after upscale
    this.setParameter('antialiasing', true);

    // Tiled Rendering (for memory-efficient 8K+ processing)
    this.setParameter('useTiledRendering', true);
    this.setParameter('tileSize', 2048); // tile size in pixels
    this.setParameter('tileOverlap', 64); // overlap for seamless blending
    this.setParameter('maxMemoryGB', 8); // auto-adjust tile size based on available memory

    // Output Format
    this.setParameter('bitDepth', 16); // 8, 16, 32
    this.setParameter('colorSpace', 'linear'); // sRGB, linear, ACEScg, Rec2020
    this.setParameter('premultipliedAlpha', true);

    // Performance
    this.setParameter('gpuAccelerated', true);
    this.setParameter('progressiveRefinement', true);
    this.setParameter('previewScale', 0.25); // preview at 25% resolution

    // Proxy/Preview Settings
    this.setParameter('useProxy', false);
    this.setParameter('proxyScale', 0.5);
    this.setParameter('generateProxyOnLoad', true);

    // Super Resolution (AI Upscaling placeholder)
    this.setParameter('useSuperResolution', false);
    this.setParameter('superResModel', 'default'); // default, film, animation, detail
    this.setParameter('superResFactor', 2); // 2x, 4x, 8x
  }

  async process(): Promise<void> {
    const inputImage = this.inputs.get('image')?.value as ImageData | undefined;
    const customWidthInput = this.inputs.get('customWidth')?.value as number | undefined;
    const customHeightInput = this.inputs.get('customHeight')?.value as number | undefined;

    // Get target resolution
    const resolution = this.getTargetResolution(customWidthInput, customHeightInput);
    const targetWidth = resolution.width;
    const targetHeight = resolution.height;

    // Prepare resolution data output
    const resolutionData = {
      targetWidth,
      targetHeight,
      aspectRatio: targetWidth / targetHeight,
      pixelCount: targetWidth * targetHeight,
      megapixels: (targetWidth * targetHeight) / 1000000,
      preset: this.getParameter('useCustom') ? 'Custom' : this.getParameter('preset'),
      sourceWidth: inputImage?.width || 0,
      sourceHeight: inputImage?.height || 0,
      scaleFactor: inputImage ? targetWidth / inputImage.width : 1,
      bitDepth: this.getParameter('bitDepth'),
      colorSpace: this.getParameter('colorSpace'),
      estimatedMemoryMB: this.estimateMemoryUsage(targetWidth, targetHeight)
    };

    // Generate tile information
    const tiles = this.generateTileInfo(targetWidth, targetHeight);

    // Set resolution data output
    const resDataOutput = this.outputs.get('resolutionData');
    if (resDataOutput) resDataOutput.value = resolutionData;

    // Set tiles output
    const tilesOutput = this.outputs.get('tiles');
    if (tilesOutput) tilesOutput.value = tiles;

    // Process image if provided
    if (inputImage) {
      let outputImage: ImageData;

      if (inputImage.width === targetWidth && inputImage.height === targetHeight) {
        // No scaling needed
        outputImage = inputImage;
      } else if (this.getParameter('useTiledRendering') && resolutionData.estimatedMemoryMB > 1000) {
        // Use tiled rendering for large outputs
        outputImage = await this.processWithTiles(inputImage, targetWidth, targetHeight, tiles);
      } else {
        // Direct scaling
        outputImage = this.scaleImage(inputImage, targetWidth, targetHeight);
      }

      // Apply post-processing
      if (this.getParameter('sharpening') > 0) {
        outputImage = this.applySharpen(outputImage, this.getParameter('sharpening'));
      }

      const imageOutput = this.outputs.get('image');
      if (imageOutput) imageOutput.value = outputImage;
    }

    this.dirty = false;
  }

  private getTargetResolution(customWidth?: number, customHeight?: number): { width: number; height: number } {
    if (this.getParameter('useCustom')) {
      return {
        width: customWidth || this.getParameter('customWidth'),
        height: customHeight || this.getParameter('customHeight')
      };
    }

    const presetName = this.getParameter('preset');
    const preset = this.resolutionPresets[presetName];
    
    if (preset) {
      return { width: preset.width, height: preset.height };
    }

    // Default to UHD if preset not found
    return { width: 3840, height: 2160 };
  }

  private generateTileInfo(width: number, height: number): TileInfo[] {
    const tiles: TileInfo[] = [];
    const tileSize = this.getParameter('tileSize');
    const overlap = this.getParameter('tileOverlap');
    const effectiveTileSize = tileSize - overlap;

    const tilesX = Math.ceil(width / effectiveTileSize);
    const tilesY = Math.ceil(height / effectiveTileSize);
    const totalTiles = tilesX * tilesY;

    let index = 0;
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const x = tx * effectiveTileSize;
        const y = ty * effectiveTileSize;
        const tileWidth = Math.min(tileSize, width - x + overlap);
        const tileHeight = Math.min(tileSize, height - y + overlap);

        tiles.push({
          x,
          y,
          width: tileWidth,
          height: tileHeight,
          index,
          totalTiles
        });
        index++;
      }
    }

    return tiles;
  }

  private estimateMemoryUsage(width: number, height: number): number {
    const bitDepth = this.getParameter('bitDepth');
    const bytesPerPixel = (bitDepth / 8) * 4; // RGBA
    const pixelCount = width * height;
    return (pixelCount * bytesPerPixel) / (1024 * 1024); // MB
  }

  private async processWithTiles(input: ImageData, targetWidth: number, targetHeight: number, tiles: TileInfo[]): Promise<ImageData> {
    const output = new ImageData(targetWidth, targetHeight);
    const overlap = this.getParameter('tileOverlap');

    // Process each tile
    for (const tile of tiles) {
      // Calculate source region for this tile
      const srcX = Math.floor(tile.x * (input.width / targetWidth));
      const srcY = Math.floor(tile.y * (input.height / targetHeight));
      const srcWidth = Math.ceil(tile.width * (input.width / targetWidth));
      const srcHeight = Math.ceil(tile.height * (input.height / targetHeight));

      // Extract source tile
      const srcTile = this.extractTile(input, srcX, srcY, srcWidth, srcHeight);

      // Scale tile to target size
      const scaledTile = this.scaleImage(srcTile, tile.width, tile.height);

      // Blend tile into output with feathered edges for overlap region
      this.blendTile(output, scaledTile, tile.x, tile.y, overlap);
    }

    return output;
  }

  private extractTile(image: ImageData, x: number, y: number, width: number, height: number): ImageData {
    const tile = new ImageData(width, height);
    
    for (let ty = 0; ty < height; ty++) {
      for (let tx = 0; tx < width; tx++) {
        const srcX = Math.min(image.width - 1, Math.max(0, x + tx));
        const srcY = Math.min(image.height - 1, Math.max(0, y + ty));
        const srcIdx = (srcY * image.width + srcX) * 4;
        const dstIdx = (ty * width + tx) * 4;

        tile.data[dstIdx] = image.data[srcIdx];
        tile.data[dstIdx + 1] = image.data[srcIdx + 1];
        tile.data[dstIdx + 2] = image.data[srcIdx + 2];
        tile.data[dstIdx + 3] = image.data[srcIdx + 3];
      }
    }

    return tile;
  }

  private blendTile(output: ImageData, tile: ImageData, x: number, y: number, overlap: number): void {
    for (let ty = 0; ty < tile.height; ty++) {
      for (let tx = 0; tx < tile.width; tx++) {
        const outX = x + tx;
        const outY = y + ty;

        if (outX >= output.width || outY >= output.height) continue;

        const srcIdx = (ty * tile.width + tx) * 4;
        const dstIdx = (outY * output.width + outX) * 4;

        // Calculate blend weight based on distance from edge
        let weight = 1.0;
        if (overlap > 0) {
          const distFromLeft = tx;
          const distFromTop = ty;
          const distFromRight = tile.width - tx - 1;
          const distFromBottom = tile.height - ty - 1;
          const minDist = Math.min(distFromLeft, distFromTop, distFromRight, distFromBottom);
          
          if (minDist < overlap) {
            weight = minDist / overlap;
          }
        }

        // Blend with existing pixel
        const existingWeight = output.data[dstIdx + 3] / 255;
        const totalWeight = existingWeight + weight;

        if (totalWeight > 0) {
          const blendFactor = weight / totalWeight;
          output.data[dstIdx] = Math.round(output.data[dstIdx] * (1 - blendFactor) + tile.data[srcIdx] * blendFactor);
          output.data[dstIdx + 1] = Math.round(output.data[dstIdx + 1] * (1 - blendFactor) + tile.data[srcIdx + 1] * blendFactor);
          output.data[dstIdx + 2] = Math.round(output.data[dstIdx + 2] * (1 - blendFactor) + tile.data[srcIdx + 2] * blendFactor);
          output.data[dstIdx + 3] = Math.min(255, Math.round(totalWeight * 255));
        }
      }
    }
  }

  private scaleImage(input: ImageData, targetWidth: number, targetHeight: number): ImageData {
    const output = new ImageData(targetWidth, targetHeight);
    const method = this.getParameter('scalingMethod');

    const scaleX = input.width / targetWidth;
    const scaleY = input.height / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = x * scaleX;
        const srcY = y * scaleY;
        const dstIdx = (y * targetWidth + x) * 4;

        let r: number, g: number, b: number, a: number;

        switch (method) {
          case 'nearest':
            [r, g, b, a] = this.sampleNearest(input, srcX, srcY);
            break;
          case 'bilinear':
            [r, g, b, a] = this.sampleBilinear(input, srcX, srcY);
            break;
          case 'bicubic':
            [r, g, b, a] = this.sampleBicubic(input, srcX, srcY);
            break;
          case 'lanczos':
          default:
            [r, g, b, a] = this.sampleLanczos(input, srcX, srcY, 3);
            break;
        }

        output.data[dstIdx] = Math.max(0, Math.min(255, Math.round(r)));
        output.data[dstIdx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        output.data[dstIdx + 2] = Math.max(0, Math.min(255, Math.round(b)));
        output.data[dstIdx + 3] = Math.max(0, Math.min(255, Math.round(a)));
      }
    }

    return output;
  }

  private sampleNearest(image: ImageData, x: number, y: number): [number, number, number, number] {
    const px = Math.min(image.width - 1, Math.max(0, Math.round(x)));
    const py = Math.min(image.height - 1, Math.max(0, Math.round(y)));
    const idx = (py * image.width + px) * 4;
    return [image.data[idx], image.data[idx + 1], image.data[idx + 2], image.data[idx + 3]];
  }

  private sampleBilinear(image: ImageData, x: number, y: number): [number, number, number, number] {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(image.width - 1, x0 + 1);
    const y1 = Math.min(image.height - 1, y0 + 1);
    const fx = x - x0;
    const fy = y - y0;

    const getPixel = (px: number, py: number): [number, number, number, number] => {
      px = Math.max(0, Math.min(image.width - 1, px));
      py = Math.max(0, Math.min(image.height - 1, py));
      const idx = (py * image.width + px) * 4;
      return [image.data[idx], image.data[idx + 1], image.data[idx + 2], image.data[idx + 3]];
    };

    const p00 = getPixel(x0, y0);
    const p10 = getPixel(x1, y0);
    const p01 = getPixel(x0, y1);
    const p11 = getPixel(x1, y1);

    const result: [number, number, number, number] = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      const top = p00[i] * (1 - fx) + p10[i] * fx;
      const bottom = p01[i] * (1 - fx) + p11[i] * fx;
      result[i] = top * (1 - fy) + bottom * fy;
    }

    return result;
  }

  private sampleBicubic(image: ImageData, x: number, y: number): [number, number, number, number] {
    const cubicWeight = (t: number): number => {
      const a = -0.5;
      const absT = Math.abs(t);
      if (absT <= 1) {
        return ((a + 2) * absT - (a + 3)) * absT * absT + 1;
      } else if (absT < 2) {
        return a * (((absT - 5) * absT + 8) * absT - 4);
      }
      return 0;
    };

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const result: [number, number, number, number] = [0, 0, 0, 0];

    for (let j = -1; j <= 2; j++) {
      for (let i = -1; i <= 2; i++) {
        const px = Math.max(0, Math.min(image.width - 1, x0 + i));
        const py = Math.max(0, Math.min(image.height - 1, y0 + j));
        const idx = (py * image.width + px) * 4;
        const weight = cubicWeight(x - (x0 + i)) * cubicWeight(y - (y0 + j));

        result[0] += image.data[idx] * weight;
        result[1] += image.data[idx + 1] * weight;
        result[2] += image.data[idx + 2] * weight;
        result[3] += image.data[idx + 3] * weight;
      }
    }

    return result;
  }

  private sampleLanczos(image: ImageData, x: number, y: number, a: number = 3): [number, number, number, number] {
    const lanczosWeight = (t: number, a: number): number => {
      if (t === 0) return 1;
      if (Math.abs(t) >= a) return 0;
      const pit = Math.PI * t;
      return (a * Math.sin(pit) * Math.sin(pit / a)) / (pit * pit);
    };

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const result: [number, number, number, number] = [0, 0, 0, 0];
    let weightSum = 0;

    for (let j = -a + 1; j <= a; j++) {
      for (let i = -a + 1; i <= a; i++) {
        const px = Math.max(0, Math.min(image.width - 1, x0 + i));
        const py = Math.max(0, Math.min(image.height - 1, y0 + j));
        const idx = (py * image.width + px) * 4;
        const weight = lanczosWeight(x - (x0 + i), a) * lanczosWeight(y - (y0 + j), a);

        result[0] += image.data[idx] * weight;
        result[1] += image.data[idx + 1] * weight;
        result[2] += image.data[idx + 2] * weight;
        result[3] += image.data[idx + 3] * weight;
        weightSum += weight;
      }
    }

    if (weightSum > 0) {
      result[0] /= weightSum;
      result[1] /= weightSum;
      result[2] /= weightSum;
      result[3] /= weightSum;
    }

    return result;
  }

  private applySharpen(image: ImageData, amount: number): ImageData {
    const output = new ImageData(
      new Uint8ClampedArray(image.data),
      image.width,
      image.height
    );

    // Unsharp mask
    const kernel = [
      0, -1, 0,
      -1, 4 + (1 / amount), -1,
      0, -1, 0
    ];
    const kSum = kernel.reduce((a, b) => a + b, 0) || 1;

    for (let y = 1; y < image.height - 1; y++) {
      for (let x = 1; x < image.width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let ki = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * image.width + (x + kx)) * 4 + c;
              sum += image.data[idx] * kernel[ki++];
            }
          }
          const dstIdx = (y * image.width + x) * 4 + c;
          const original = image.data[dstIdx];
          const sharpened = sum / kSum;
          output.data[dstIdx] = Math.max(0, Math.min(255, Math.round(original + (sharpened - original) * amount)));
        }
      }
    }

    return output;
  }

  // Public utility methods
  getResolutionPresets(): string[] {
    return Object.keys(this.resolutionPresets);
  }

  getPresetInfo(presetName: string): ResolutionPreset | undefined {
    return this.resolutionPresets[presetName];
  }

  getPresetsByFormat(format: string): string[] {
    return Object.entries(this.resolutionPresets)
      .filter(([_, preset]) => preset.format === format)
      .map(([name]) => name);
  }

  dispose(): void {
    super.dispose();
  }
}
