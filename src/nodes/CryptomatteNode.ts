/**
 * CryptomatteNode - Cryptomatte ID matte extraction
 * Extract mattes from Cryptomatte render passes for professional compositing
 */

import { Node, DataType } from '../core/Node';
import { ImageData } from '../renderer/RenderEngine';

interface CryptoObject {
  id: string;
  name: string;
  color: { r: number; g: number; b: number };
  selected: boolean;
}

export class CryptomatteNode extends Node {
  private objectRegistry: Map<string, CryptoObject> = new Map();

  constructor(id: string) {
    super(id, 'Cryptomatte', 'Cryptomatte');
    this.metadata.category = 'Composite';
    this.metadata.description = 'Extract mattes from Cryptomatte ID passes';
    
    this.addInput('crypto_00', 'Crypto 00', DataType.IMAGE);
    this.addInput('crypto_01', 'Crypto 01', DataType.IMAGE);
    this.addInput('crypto_02', 'Crypto 02', DataType.IMAGE);
    this.addInput('image', 'Beauty', DataType.IMAGE);
    this.addOutput('matte', 'Matte', DataType.IMAGE);
    this.addOutput('selected_rgb', 'Selected RGB', DataType.IMAGE);
    this.addOutput('preview', 'ID Preview', DataType.IMAGE);
    
    // Selection
    this.setParameter('selectedIds', []); // Array of selected object IDs
    this.setParameter('pickX', -1);
    this.setParameter('pickY', -1);
    this.setParameter('addToSelection', true);
    
    // Matte processing
    this.setParameter('matteOutput', 'combined'); // combined, separate
    this.setParameter('antiAliasing', true);
    this.setParameter('edgeQuality', 'high'); // low, medium, high
    
    // Edge treatment
    this.setParameter('matteBlur', 0.0);
    this.setParameter('matteExpand', 0.0);
    this.setParameter('matteGamma', 1.0);
    
    // Preview
    this.setParameter('previewMode', 'colors'); // colors, grayscale, selected
    this.setParameter('previewSaturation', 0.8);
  }

  async process(): Promise<void> {
    const crypto00Input = this.inputs.get('crypto_00');
    const crypto01Input = this.inputs.get('crypto_01');
    const crypto02Input = this.inputs.get('crypto_02');
    const beautyInput = this.inputs.get('image');
    const matteOutput = this.outputs.get('matte');
    const selectedRgbOutput = this.outputs.get('selected_rgb');
    const previewOutput = this.outputs.get('preview');
    
    if (!matteOutput && !previewOutput) return;

    const crypto00 = crypto00Input?.value as ImageData | undefined;
    const crypto01 = crypto01Input?.value as ImageData | undefined;
    const crypto02 = crypto02Input?.value as ImageData | undefined;
    const beauty = beautyInput?.value as ImageData | undefined;
    
    // Use first available crypto pass or beauty for dimensions
    const refImage = crypto00 || crypto01 || crypto02 || beauty;
    if (!refImage) {
      return;
    }
    
    const selectedIds = this.getParameter('selectedIds') as string[];
    const pickX = this.getParameter('pickX');
    const pickY = this.getParameter('pickY');
    const addToSelection = this.getParameter('addToSelection');
    const antiAliasing = this.getParameter('antiAliasing');
    const matteBlur = this.getParameter('matteBlur');
    const matteExpand = this.getParameter('matteExpand');
    const matteGamma = this.getParameter('matteGamma');
    const previewMode = this.getParameter('previewMode');
    const previewSaturation = this.getParameter('previewSaturation');
    
    const width = refImage.width;
    const height = refImage.height;
    
    // Handle picking
    if (pickX >= 0 && pickX < width && pickY >= 0 && pickY < height) {
      const pickedId = this.getIdAtPixel(crypto00, crypto01, crypto02, pickX, pickY);
      if (pickedId) {
        if (addToSelection) {
          if (!selectedIds.includes(pickedId)) {
            selectedIds.push(pickedId);
            this.setParameter('selectedIds', selectedIds);
          }
        } else {
          const idx = selectedIds.indexOf(pickedId);
          if (idx >= 0) {
            selectedIds.splice(idx, 1);
            this.setParameter('selectedIds', selectedIds);
          }
        }
      }
      // Reset pick position
      this.setParameter('pickX', -1);
      this.setParameter('pickY', -1);
    }
    
    const matteData = new Uint8Array(width * height * 4);
    const selectedRgbData = new Uint8Array(width * height * 4);
    const previewData = new Uint8Array(width * height * 4);
    
    // Build ID to color map for preview
    const idColorMap = new Map<string, { r: number; g: number; b: number }>();
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get coverage values from crypto passes
        const coverage = this.getCoverageAtPixel(
          crypto00, crypto01, crypto02, 
          x, y, selectedIds, antiAliasing
        );
        
        // Generate matte value
        let matteValue = coverage;
        
        // Apply gamma
        if (matteGamma !== 1.0) {
          matteValue = Math.pow(matteValue, 1 / matteGamma);
        }
        
        matteValue = Math.max(0, Math.min(1, matteValue)) * 255;
        
        matteData[idx] = matteValue;
        matteData[idx + 1] = matteValue;
        matteData[idx + 2] = matteValue;
        matteData[idx + 3] = 255;
        
        // Selected RGB output (beauty * matte)
        if (beauty) {
          const srcIdx = (y * beauty.width + x) * beauty.channels;
          const matteFactor = coverage;
          selectedRgbData[idx] = beauty.data[srcIdx] * matteFactor;
          selectedRgbData[idx + 1] = beauty.data[srcIdx + 1] * matteFactor;
          selectedRgbData[idx + 2] = beauty.data[srcIdx + 2] * matteFactor;
          selectedRgbData[idx + 3] = matteFactor * 255;
        }
        
        // Preview output
        const pixelId = this.getIdAtPixel(crypto00, crypto01, crypto02, x, y);
        
        if (previewMode === 'selected') {
          // Show selected objects only
          if (selectedIds.includes(pixelId || '')) {
            previewData[idx] = 255;
            previewData[idx + 1] = 255;
            previewData[idx + 2] = 255;
          } else {
            previewData[idx] = 50;
            previewData[idx + 1] = 50;
            previewData[idx + 2] = 50;
          }
          previewData[idx + 3] = 255;
        } else if (previewMode === 'grayscale') {
          // Grayscale ID visualization
          const hash = this.hashId(pixelId || '') * 255;
          previewData[idx] = hash;
          previewData[idx + 1] = hash;
          previewData[idx + 2] = hash;
          previewData[idx + 3] = 255;
        } else {
          // Color ID visualization
          if (!pixelId) {
            previewData[idx] = 0;
            previewData[idx + 1] = 0;
            previewData[idx + 2] = 0;
          } else {
            if (!idColorMap.has(pixelId)) {
              idColorMap.set(pixelId, this.generateIdColor(pixelId, previewSaturation));
            }
            const color = idColorMap.get(pixelId)!;
            
            // Highlight selected objects
            const isSelected = selectedIds.includes(pixelId);
            const brightnessMod = isSelected ? 1.2 : 1.0;
            
            previewData[idx] = Math.min(255, color.r * brightnessMod);
            previewData[idx + 1] = Math.min(255, color.g * brightnessMod);
            previewData[idx + 2] = Math.min(255, color.b * brightnessMod);
          }
          previewData[idx + 3] = 255;
        }
      }
    }
    
    // Apply matte blur and expand if needed
    if (matteBlur > 0 || matteExpand !== 0) {
      this.processMatteEdges(matteData, width, height, matteBlur, matteExpand);
    }
    
    if (matteOutput) {
      matteOutput.value = {
        width,
        height,
        channels: 4,
        data: matteData,
        format: 'rgba'
      };
    }
    
    if (selectedRgbOutput) {
      selectedRgbOutput.value = {
        width,
        height,
        channels: 4,
        data: selectedRgbData,
        format: 'rgba'
      };
    }
    
    if (previewOutput) {
      previewOutput.value = {
        width,
        height,
        channels: 4,
        data: previewData,
        format: 'rgba'
      };
    }
  }

  private getIdAtPixel(
    crypto00: ImageData | undefined,
    crypto01: ImageData | undefined,
    crypto02: ImageData | undefined,
    x: number, y: number
  ): string | null {
    // In a real Cryptomatte, IDs are encoded in RGBA channels
    // Here we simulate by using color values as IDs
    const crypto = crypto00 || crypto01 || crypto02;
    if (!crypto) return null;
    
    const idx = (y * crypto.width + x) * crypto.channels;
    const r = crypto.data[idx];
    const g = crypto.data[idx + 1];
    const b = crypto.data[idx + 2];
    
    // Generate ID from color values
    if (r === 0 && g === 0 && b === 0) return null;
    
    return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private getCoverageAtPixel(
    crypto00: ImageData | undefined,
    crypto01: ImageData | undefined,
    crypto02: ImageData | undefined,
    x: number, y: number,
    selectedIds: string[],
    antiAliasing: boolean
  ): number {
    const id = this.getIdAtPixel(crypto00, crypto01, crypto02, x, y);
    
    if (!id || !selectedIds.includes(id)) {
      return 0;
    }
    
    // In real Cryptomatte, coverage is stored in alpha
    // Here we return 1 for selected, 0 for not
    let coverage = 1;
    
    // Apply anti-aliasing by checking neighbors
    if (antiAliasing) {
      const crypto = crypto00 || crypto01 || crypto02;
      if (crypto) {
        let sameCount = 0;
        let total = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < crypto.width && ny >= 0 && ny < crypto.height) {
              const neighborId = this.getIdAtPixel(crypto00, crypto01, crypto02, nx, ny);
              if (selectedIds.includes(neighborId || '')) {
                sameCount++;
              }
              total++;
            }
          }
        }
        
        // Soften edges where neighboring pixels are different
        if (total > 0 && sameCount < total) {
          coverage = 0.5 + (sameCount / total) * 0.5;
        }
      }
    }
    
    return coverage;
  }

  private hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  }

  private generateIdColor(id: string, saturation: number): { r: number; g: number; b: number } {
    const hash = this.hashId(id);
    const hue = hash * 360;
    
    // Convert HSL to RGB
    const h = hue / 60;
    const c = saturation;
    const x = c * (1 - Math.abs(h % 2 - 1));
    
    let r = 0, g = 0, b = 0;
    
    if (h < 1) { r = c; g = x; }
    else if (h < 2) { r = x; g = c; }
    else if (h < 3) { g = c; b = x; }
    else if (h < 4) { g = x; b = c; }
    else if (h < 5) { r = x; b = c; }
    else { r = c; b = x; }
    
    const m = 0.5 - c / 2;
    
    return {
      r: Math.floor((r + m) * 255),
      g: Math.floor((g + m) * 255),
      b: Math.floor((b + m) * 255)
    };
  }

  private processMatteEdges(
    data: Uint8Array,
    width: number,
    height: number,
    blur: number,
    expand: number
  ): void {
    // Simple box blur implementation
    if (blur > 0) {
      const radius = Math.ceil(blur);
      const temp = new Uint8Array(data.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let count = 0;
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= blur) {
                  const weight = 1 - dist / (blur + 1);
                  sum += data[(ny * width + nx) * 4] * weight;
                  count += weight;
                }
              }
            }
          }
          
          const idx = (y * width + x) * 4;
          const value = count > 0 ? sum / count : 0;
          temp[idx] = value;
          temp[idx + 1] = value;
          temp[idx + 2] = value;
          temp[idx + 3] = 255;
        }
      }
      
      data.set(temp);
    }
    
    // Expand/contract matte
    if (expand !== 0) {
      const temp = new Uint8Array(data.length);
      const radius = Math.abs(expand);
      const expanding = expand > 0;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let extreme = expanding ? 0 : 255;
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const value = data[(ny * width + nx) * 4];
                extreme = expanding ? Math.max(extreme, value) : Math.min(extreme, value);
              }
            }
          }
          
          const idx = (y * width + x) * 4;
          temp[idx] = extreme;
          temp[idx + 1] = extreme;
          temp[idx + 2] = extreme;
          temp[idx + 3] = 255;
        }
      }
      
      data.set(temp);
    }
  }
}
