/**
 * BackgroundRemovalNode - One-click background removal
 * Version 3.1 - Extended Machine Learning
 * 
 * Features:
 * - Automatic background detection
 * - Multiple removal algorithms
 * - Edge refinement
 * - Foreground/background separation
 * - Green screen replacement
 * - Alpha matte generation
 */

import { Node, DataType } from '../core/Node';

// Background removal result interface
export interface RemovalResult {
  foreground: ImageData;
  background: ImageData;
  alphaMatte: Uint8Array;
  trimap: Uint8Array;
  confidence: number;
  edges: Float32Array;
}

export class BackgroundRemovalNode extends Node {
  private modelLoaded: boolean = false;

  constructor(id: string) {
    super(id, 'BackgroundRemoval', 'Background Removal');
    this.metadata.category = 'ML';
    this.metadata.description = 'AI-powered one-click background removal for images and video';
    this.metadata.version = '3.1.0';
    
    // Inputs
    this.addInput('image', 'Input Image', DataType.IMAGE);
    this.addInput('mask', 'Optional Mask Hint', DataType.MASK);
    this.addInput('trimap', 'Optional Trimap', DataType.MASK);
    this.addInput('background', 'Replacement Background', DataType.IMAGE);
    
    // Outputs
    this.addOutput('foreground', 'Foreground', DataType.IMAGE);
    this.addOutput('background', 'Background', DataType.IMAGE);
    this.addOutput('alphaMatte', 'Alpha Matte', DataType.MASK);
    this.addOutput('composite', 'Composite', DataType.IMAGE);
    this.addOutput('trimap', 'Generated Trimap', DataType.MASK);
    this.addOutput('confidence', 'Confidence Map', DataType.MASK);
    
    // === MODEL SETTINGS ===
    this.setParameter('model', 'rembg'); // rembg, u2net, modnet, isnet, robust_video_matting
    this.setParameter('modelVariant', 'general'); // general, portrait, anime, clothing
    this.setParameter('useGPU', true); // Checkbox
    
    // === DETECTION SETTINGS ===
    this.setParameter('subjectType', 'auto'); // auto, person, animal, object, product
    this.setParameter('multiSubject', false); // Checkbox - detect multiple subjects
    this.setParameter('confidenceThreshold', 0.5); // Slider 0-1
    
    // === MATTE SETTINGS ===
    this.setParameter('outputAlpha', true); // Checkbox
    this.setParameter('alphaCutoff', 0.5); // Slider 0-1
    this.setParameter('alphaGamma', 1.0); // Slider 0.1-3
    this.setParameter('premultiply', true); // Checkbox
    this.setParameter('antialiasing', true); // Checkbox
    
    // === EDGE REFINEMENT ===
    this.setParameter('edgeRefinement', true); // Checkbox
    this.setParameter('edgeRadius', 3); // Slider 1-20
    this.setParameter('edgeSmooth', 0.5); // Slider 0-2
    this.setParameter('edgeShift', 0); // Slider -10 to 10
    this.setParameter('featherAmount', 1); // Slider 0-10
    this.setParameter('defringe', true); // Checkbox
    this.setParameter('defringeAmount', 0.5); // Slider 0-2
    
    // === FOREGROUND PROCESSING ===
    this.setParameter('preserveDetails', true); // Checkbox
    this.setParameter('hairDetail', 1.0); // Slider 0-2
    this.setParameter('transparencyHandling', 'blend'); // blend, preserve, ignore
    
    // === BACKGROUND HANDLING ===
    this.setParameter('backgroundMode', 'transparent'); // transparent, color, blur, replace
    this.setParameter('backgroundColor', '#00FF00'); // Color picker
    this.setParameter('blurAmount', 20); // Slider 0-50
    this.setParameter('keepBackground', false); // Checkbox - output original bg separately
    
    // === VIDEO SETTINGS ===
    this.setParameter('temporalStability', true); // Checkbox
    this.setParameter('flickerReduction', 0.5); // Slider 0-1
    this.setParameter('motionAwareness', true); // Checkbox
    
    // === TRIMAP SETTINGS ===
    this.setParameter('generateTrimap', true); // Checkbox
    this.setParameter('trimapExpansion', 5); // Slider 1-20
    this.setParameter('unknownRegionBlur', 3); // Slider 0-10
    
    // === PERFORMANCE ===
    this.setParameter('processScale', 1.0); // Slider 0.25-2
    this.setParameter('batchProcessing', false); // Checkbox
    this.setParameter('cacheResults', true); // Checkbox
    
    // === DEBUG ===
    this.setParameter('debugMode', false); // Checkbox
    this.setParameter('showTrimap', false); // Checkbox
    this.setParameter('showEdges', false); // Checkbox
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image');
    if (!imageInput?.value) return;
    
    // Load model if needed
    if (!this.modelLoaded) {
      await this.loadModel();
    }
    
    const image = imageInput.value as ImageData;
    
    // Get optional inputs
    const maskHint = this.inputs.get('mask')?.value;
    const trimapHint = this.inputs.get('trimap')?.value;
    const replacementBg = this.inputs.get('background')?.value;
    
    // Step 1: Generate initial segmentation
    let alphaMatte = await this.generateMatte(image, maskHint, trimapHint);
    
    // Step 2: Refine edges
    if (this.getParameter('edgeRefinement')) {
      alphaMatte = this.refineEdges(image, alphaMatte);
    }
    
    // Step 3: Apply defringing
    if (this.getParameter('defringe')) {
      alphaMatte = this.applyDefringe(image, alphaMatte);
    }
    
    // Step 4: Generate outputs
    const foreground = this.extractForeground(image, alphaMatte);
    const background = this.extractBackground(image, alphaMatte);
    const composite = this.createComposite(foreground, alphaMatte, replacementBg);
    
    // Generate trimap if requested
    const trimap = this.getParameter('generateTrimap') 
      ? this.generateTrimap(alphaMatte)
      : null;
    
    // Generate confidence map
    const confidence = this.generateConfidenceMap(alphaMatte);
    
    // Set outputs
    this.setOutputValue('foreground', foreground);
    this.setOutputValue('background', background);
    this.setOutputValue('alphaMatte', alphaMatte);
    this.setOutputValue('composite', composite);
    if (trimap) this.setOutputValue('trimap', trimap);
    this.setOutputValue('confidence', confidence);
  }

  private async loadModel(): Promise<void> {
    const modelName = this.getParameter('model');
    const variant = this.getParameter('modelVariant');
    
    // Simulated model loading
    this.modelLoaded = true;
  }

  private async generateMatte(image: ImageData, maskHint: unknown, trimapHint: unknown): Promise<Uint8Array> {
    const width = image.width;
    const height = image.height;
    const matte = new Uint8Array(width * height);
    
    const threshold = this.getParameter('confidenceThreshold');
    const subjectType = this.getParameter('subjectType');
    
    // Simulated AI-based matte generation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pixelIdx = idx * 4;
        
        // Simple heuristic for simulation - real implementation uses neural network
        const r = image.data[pixelIdx];
        const g = image.data[pixelIdx + 1];
        const b = image.data[pixelIdx + 2];
        
        // Simulate foreground detection (center-weighted)
        const cx = width / 2;
        const cy = height / 2;
        const dx = (x - cx) / cx;
        const dy = (y - cy) / cy;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Combine with color analysis
        const luminance = (r + g + b) / 765;
        const isLikelyForeground = distFromCenter < 0.7 && luminance > 0.2 && luminance < 0.9;
        
        if (maskHint) {
          // Use mask hint if provided
          const hintValue = (maskHint as Uint8Array)[idx] || 0;
          matte[idx] = hintValue;
        } else {
          matte[idx] = isLikelyForeground ? 255 : 0;
        }
      }
    }
    
    return matte;
  }

  private refineEdges(image: ImageData, matte: Uint8Array): Uint8Array {
    const width = image.width;
    const height = image.height;
    const refined = new Uint8Array(matte.length);
    
    const radius = this.getParameter('edgeRadius');
    const smooth = this.getParameter('edgeSmooth');
    const shift = this.getParameter('edgeShift');
    const feather = this.getParameter('featherAmount');
    
    // Apply Gaussian blur for edge smoothing
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        let sum = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              const weight = Math.exp(-(dx * dx + dy * dy) / (2 * smooth * smooth));
              sum += matte[nIdx] * weight;
              count += weight;
            }
          }
        }
        
        refined[idx] = Math.min(255, Math.max(0, Math.round(sum / count) + shift));
      }
    }
    
    return refined;
  }

  private applyDefringe(image: ImageData, matte: Uint8Array): Uint8Array {
    const amount = this.getParameter('defringeAmount');
    const width = image.width;
    const height = image.height;
    
    // Simulated defringing - removes color contamination at edges
    const result = new Uint8Array(matte);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const alpha = matte[idx];
        
        // Check if this is an edge pixel
        if (alpha > 0 && alpha < 255) {
          // Apply edge correction
          const neighbors = [
            matte[(y - 1) * width + x],
            matte[(y + 1) * width + x],
            matte[y * width + x - 1],
            matte[y * width + x + 1]
          ];
          
          const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / 4;
          result[idx] = Math.round(alpha * (1 - amount) + avgNeighbor * amount);
        }
      }
    }
    
    return result;
  }

  private extractForeground(image: ImageData, matte: Uint8Array): ImageData {
    const width = image.width;
    const height = image.height;
    const foreground = new ImageData(width, height);
    
    const premultiply = this.getParameter('premultiply');
    const alphaCutoff = this.getParameter('alphaCutoff');
    const alphaGamma = this.getParameter('alphaGamma');
    
    for (let i = 0; i < matte.length; i++) {
      const srcIdx = i * 4;
      let alpha = matte[i] / 255;
      
      // Apply gamma
      alpha = Math.pow(alpha, alphaGamma);
      
      // Apply cutoff
      if (alpha < alphaCutoff) alpha = 0;
      
      if (premultiply) {
        foreground.data[srcIdx] = Math.round(image.data[srcIdx] * alpha);
        foreground.data[srcIdx + 1] = Math.round(image.data[srcIdx + 1] * alpha);
        foreground.data[srcIdx + 2] = Math.round(image.data[srcIdx + 2] * alpha);
      } else {
        foreground.data[srcIdx] = image.data[srcIdx];
        foreground.data[srcIdx + 1] = image.data[srcIdx + 1];
        foreground.data[srcIdx + 2] = image.data[srcIdx + 2];
      }
      foreground.data[srcIdx + 3] = Math.round(alpha * 255);
    }
    
    return foreground;
  }

  private extractBackground(image: ImageData, matte: Uint8Array): ImageData {
    const width = image.width;
    const height = image.height;
    const background = new ImageData(width, height);
    
    for (let i = 0; i < matte.length; i++) {
      const srcIdx = i * 4;
      const alpha = matte[i] / 255;
      const bgAlpha = 1 - alpha;
      
      background.data[srcIdx] = image.data[srcIdx];
      background.data[srcIdx + 1] = image.data[srcIdx + 1];
      background.data[srcIdx + 2] = image.data[srcIdx + 2];
      background.data[srcIdx + 3] = Math.round(bgAlpha * 255);
    }
    
    return background;
  }

  private createComposite(foreground: ImageData, matte: Uint8Array, replacementBg: unknown): ImageData {
    const width = foreground.width;
    const height = foreground.height;
    const composite = new ImageData(width, height);
    
    const bgMode = this.getParameter('backgroundMode');
    const bgColor = this.getParameter('backgroundColor');
    
    // Parse background color
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    
    for (let i = 0; i < matte.length; i++) {
      const srcIdx = i * 4;
      const alpha = matte[i] / 255;
      
      let bgR = r, bgG = g, bgB = b, bgA = 255;
      
      if (bgMode === 'transparent') {
        bgA = 0;
      } else if (bgMode === 'replace' && replacementBg) {
        const repBg = replacementBg as ImageData;
        const x = i % width;
        const y = Math.floor(i / width);
        const repIdx = (y % repBg.height) * repBg.width + (x % repBg.width);
        const repSrcIdx = repIdx * 4;
        bgR = repBg.data[repSrcIdx];
        bgG = repBg.data[repSrcIdx + 1];
        bgB = repBg.data[repSrcIdx + 2];
        bgA = 255;
      }
      
      // Alpha blend
      composite.data[srcIdx] = Math.round(foreground.data[srcIdx] * alpha + bgR * (1 - alpha));
      composite.data[srcIdx + 1] = Math.round(foreground.data[srcIdx + 1] * alpha + bgG * (1 - alpha));
      composite.data[srcIdx + 2] = Math.round(foreground.data[srcIdx + 2] * alpha + bgB * (1 - alpha));
      composite.data[srcIdx + 3] = Math.max(Math.round(alpha * 255), bgA * (1 - alpha));
    }
    
    return composite;
  }

  private generateTrimap(matte: Uint8Array): Uint8Array {
    const expansion = this.getParameter('trimapExpansion');
    const trimap = new Uint8Array(matte.length);
    
    // 0 = definite background, 128 = unknown, 255 = definite foreground
    for (let i = 0; i < matte.length; i++) {
      if (matte[i] < 10) {
        trimap[i] = 0;
      } else if (matte[i] > 245) {
        trimap[i] = 255;
      } else {
        trimap[i] = 128;
      }
    }
    
    return trimap;
  }

  private generateConfidenceMap(matte: Uint8Array): Uint8Array {
    const confidence = new Uint8Array(matte.length);
    
    // Confidence is higher for definite foreground/background, lower at edges
    for (let i = 0; i < matte.length; i++) {
      const alpha = matte[i];
      confidence[i] = Math.abs(alpha - 128) * 2;
    }
    
    return confidence;
  }

  private setOutputValue(name: string, value: unknown): void {
    const output = this.outputs.get(name);
    if (output) {
      output.value = value;
    }
  }

  dispose(): void {
    this.modelLoaded = false;
    super.dispose();
  }
}
