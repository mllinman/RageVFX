/**
 * BlurNode - Applies Gaussian blur to an image
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

export class BlurNode extends Node {
  constructor(id: string) {
    super(id, 'Blur', 'Blur');
    this.metadata.category = 'Filter';
    this.metadata.description = 'Apply Gaussian blur to image';

    this.addInput('image', 'Input', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);

    this.setParameter('blurAmount', 5.0);
    this.setParameter('quality', 'preview');
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image');
    const output = this.outputs.get('image');

    if (!input?.value || !output) {
      return;
    }

    const inputImage = input.value as ImageData;
    const blurAmount = this.getParameter('blurAmount');
    const quality = this.getParameter('quality');

    // For large images (e.g. 4K+), use tiled processing
    if (inputImage.width * inputImage.height > 2000000) {
      const tileSize = quality === 'production' ? 1024 : 512;
      const result = await this.processTiled(inputImage, blurAmount, tileSize);
      output.value = result;
    } else {
      // Small images: standard processing
      output.value = this.applyBoxBlur(inputImage, blurAmount);
    }
  }

  /**
   * Process image in tiles to handle high resolutions without memory issues
   */
  private async processTiled(image: ImageData, radius: number, tileSize: number): Promise<ImageData> {
    const { width, height, channels, format } = image;
    const outputData = new Uint8Array(width * height * channels);

    for (let ty = 0; ty < height; ty += tileSize) {
      for (let tx = 0; tx < width; tx += tileSize) {
        const tw = Math.min(tileSize, width - tx);
        const th = Math.min(tileSize, height - ty);

        // Extract tile with padding for blur radius
        const padding = Math.ceil(radius);
        const tile = this.extractTile(image, tx, ty, tw, th, padding);

        // Process tile
        const processedTile = this.applyBoxBlur(tile, radius);

        // Copy back to output (accounting for padding in the processed tile)
        this.blitTile(processedTile, outputData, width, height, tx, ty, tw, th, padding);
      }
    }

    return { width, height, channels, data: outputData, format };
  }

  private extractTile(image: ImageData, x: number, y: number, w: number, h: number, pad: number): ImageData {
    const { width, height, channels, data } = image;
    const tw = w + pad * 2;
    const th = h + pad * 2;
    const tileData = new Uint8Array(tw * th * channels);

    for (let iy = -pad; iy < h + pad; iy++) {
      for (let ix = -pad; ix < w + pad; ix++) {
        const sx = Math.max(0, Math.min(width - 1, x + ix));
        const sy = Math.max(0, Math.min(height - 1, y + iy));

        const srcIdx = (sy * width + sx) * channels;
        const dstIdx = ((iy + pad) * tw + (ix + pad)) * channels;

        for (let c = 0; c < channels; c++) {
          tileData[dstIdx + c] = data[srcIdx + c];
        }
      }
    }

    return { width: tw, height: th, channels, data: tileData, format: image.format };
  }

  private blitTile(tile: ImageData, dstData: Uint8Array, dw: number, dh: number, tx: number, ty: number, tw: number, th: number, pad: number): void {
    const { width: sw, channels } = tile;

    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const srcIdx = ((y + pad) * sw + (x + pad)) * channels;
        const dstIdx = ((ty + y) * dw + (tx + x)) * channels;

        for (let c = 0; c < channels; c++) {
          dstData[dstIdx + c] = tile.data[srcIdx + c];
        }
      }
    }
  }

  private applyBoxBlur(image: ImageData, radius: number): ImageData {
    const { width, height, channels, data } = image;
    const output = new Uint8Array(data.length);
    const kernelSize = Math.floor(radius);

    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sums = new Array(channels).fill(0);
        let count = 0;

        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
          const sx = Math.max(0, Math.min(width - 1, x + kx));
          const idx = (y * width + sx) * channels;

          for (let c = 0; c < channels; c++) {
            sums[c] += data[idx + c];
          }
          count++;
        }

        const outIdx = (y * width + x) * channels;
        for (let c = 0; c < channels; c++) {
          output[outIdx + c] = sums[c] / count;
        }
      }
    }

    return {
      width,
      height,
      channels,
      data: output,
      format: image.format
    };
  }
}
