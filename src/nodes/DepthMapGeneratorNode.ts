/**
 * DepthMapGeneratorNode - AI/Algorithm-based depth map generation from 2D images
 * Version 3.7 - 2D to 3D Conversion Enhancement
 * 
 * Generates depth maps from 2D images using multiple algorithms:
 * - Edge-based depth estimation
 * - Luminance-based depth
 * - Contrast-based depth
 * - Multi-cue depth estimation (combines multiple methods)
 * - Defocus-based depth estimation
 * - Atmospheric perspective
 */

import { Node, DataType } from '../core/Node';

export class DepthMapGeneratorNode extends Node {
  constructor(id: string) {
    super(id, 'DepthMapGenerator', 'Depth Map Generator');
    this.metadata.category = 'Stereo3D';
    this.metadata.description = 'Generate depth maps from 2D images for stereoscopic 3D conversion using multiple algorithms';
    this.metadata.version = '3.7.0';

    // Inputs
    this.addInput('image', 'Input Image', DataType.IMAGE);
    this.addInput('userDepthHints', 'User Depth Hints (Optional)', DataType.IMAGE);

    // Outputs
    this.addOutput('depthMap', 'Depth Map', DataType.IMAGE);
    this.addOutput('normalizedDepth', 'Normalized Depth', DataType.IMAGE);
    this.addOutput('invertedDepth', 'Inverted Depth', DataType.IMAGE);
    this.addOutput('visualizedDepth', 'Visualized Depth (Color)', DataType.IMAGE);

    // Algorithm Selection
    this.setParameter('algorithm', 'multi-cue'); // edge, luminance, contrast, multi-cue, defocus, atmospheric, hybrid
    this.setParameter('quality', 'high'); // low, medium, high, ultra

    // Edge-Based Depth Parameters
    this.setParameter('edgeWeight', 0.5); // How much edges contribute to depth
    this.setParameter('edgeThreshold', 30);
    this.setParameter('edgeBlur', 2.0);

    // Luminance-Based Depth Parameters
    this.setParameter('luminanceWeight', 0.3);
    this.setParameter('luminanceInvert', false); // false = bright is near, true = bright is far
    this.setParameter('luminanceGamma', 1.0);

    // Contrast-Based Depth Parameters
    this.setParameter('contrastWeight', 0.4);
    this.setParameter('contrastWindowSize', 5);
    this.setParameter('contrastBias', 0.5);

    // Atmospheric Perspective Parameters
    this.setParameter('atmosphericWeight', 0.3);
    this.setParameter('fogDensity', 0.1);
    this.setParameter('fogColor', { r: 0.7, g: 0.7, b: 0.8 });

    // Defocus Parameters
    this.setParameter('defocusWeight', 0.2);
    this.setParameter('defocusKernelSize', 7);
    this.setParameter('defocusStrength', 1.0);

    // Depth Range Control
    this.setParameter('depthMin', 0.0); // Nearest point (0-1)
    this.setParameter('depthMax', 1.0); // Farthest point (0-1)
    this.setParameter('depthBias', 0.5); // Shift depth distribution
    this.setParameter('depthContrast', 1.0); // Adjust depth contrast

    // Smoothing and Refinement
    this.setParameter('smoothing', 3); // Gaussian smoothing radius
    this.setParameter('bilateralFilter', true); // Edge-preserving smoothing
    this.setParameter('bilateralSpatial', 5);
    this.setParameter('bilateralRange', 0.1);

    // User Guidance
    this.setParameter('useUserHints', false);
    this.setParameter('userHintStrength', 0.7);

    // Depth Inpainting (fill holes)
    this.setParameter('inpainting', true);
    this.setParameter('inpaintIterations', 10);

    // Visualization
    this.setParameter('visualizationMode', 'grayscale'); // grayscale, heatmap, rainbow, terrain
    this.setParameter('invertVisualization', false);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('image')?.value as ImageData | undefined;
    const userHints = this.inputs.get('userDepthHints')?.value as ImageData | undefined;

    if (!input) {
      console.warn('DepthMapGeneratorNode: No input image provided');
      return;
    }

    const algorithm = this.getParameter('algorithm') as string;
    const quality = this.getParameter('quality') as string;

    let depthMap: ImageData;

    // Generate depth map based on selected algorithm
    switch (algorithm) {
      case 'edge':
        depthMap = this.edgeBasedDepth(input);
        break;
      case 'luminance':
        depthMap = this.luminanceBasedDepth(input);
        break;
      case 'contrast':
        depthMap = this.contrastBasedDepth(input);
        break;
      case 'defocus':
        depthMap = this.defocusBasedDepth(input);
        break;
      case 'atmospheric':
        depthMap = this.atmosphericDepth(input);
        break;
      case 'multi-cue':
        depthMap = this.multiCueDepth(input);
        break;
      case 'hybrid':
        depthMap = this.hybridDepth(input);
        break;
      default:
        depthMap = this.multiCueDepth(input);
    }

    // Apply user hints if provided
    if (this.getParameter('useUserHints') && userHints) {
      depthMap = this.blendWithUserHints(depthMap, userHints);
    }

    // Apply smoothing
    if (this.getParameter('bilateralFilter')) {
      depthMap = this.bilateralSmooth(depthMap, input);
    } else {
      const smoothing = this.getParameter('smoothing') as number;
      if (smoothing > 0) {
        depthMap = this.gaussianSmooth(depthMap, smoothing);
      }
    }

    // Apply depth range normalization
    depthMap = this.normalizeDepthRange(depthMap);

    // Inpainting (fill holes)
    if (this.getParameter('inpainting')) {
      depthMap = this.inpaintDepth(depthMap);
    }

    // Set outputs
    const depthOutput = this.outputs.get('depthMap');
    if (depthOutput) {
      depthOutput.value = depthMap;
    }

    const normalizedOutput = this.outputs.get('normalizedDepth');
    if (normalizedOutput) {
      normalizedOutput.value = this.createNormalizedDepth(depthMap);
    }

    const invertedOutput = this.outputs.get('invertedDepth');
    if (invertedOutput) {
      invertedOutput.value = this.invertDepth(depthMap);
    }

    const visualizedOutput = this.outputs.get('visualizedDepth');
    if (visualizedOutput) {
      visualizedOutput.value = this.visualizeDepth(depthMap);
    }
  }

  /**
   * Edge-based depth estimation
   * Strong edges = depth discontinuities = nearer objects
   */
  private edgeBasedDepth(input: ImageData): ImageData {
    const { width, height } = input;
    const depth = new ImageData(width, height);
    const edgeThreshold = this.getParameter('edgeThreshold') as number;
    const edgeWeight = this.getParameter('edgeWeight') as number;

    // Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Calculate gradients using Sobel operator
        const gx = this.getGradientX(input, x, y);
        const gy = this.getGradientY(input, x, y);
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        // Strong edges = nearer (higher depth value)
        let depthValue = Math.min(255, magnitude * edgeWeight);
        
        if (magnitude < edgeThreshold) {
          depthValue = depthValue * 0.5; // Weaker edges are farther
        }

        depth.data[idx] = depthValue;
        depth.data[idx + 1] = depthValue;
        depth.data[idx + 2] = depthValue;
        depth.data[idx + 3] = 255;
      }
    }

    return depth;
  }

  /**
   * Luminance-based depth estimation
   * Brighter areas can be closer (default) or farther based on scene
   */
  private luminanceBasedDepth(input: ImageData): ImageData {
    const { width, height } = input;
    const depth = new ImageData(width, height);
    const invert = this.getParameter('luminanceInvert') as boolean;
    const gamma = this.getParameter('luminanceGamma') as number;
    const weight = this.getParameter('luminanceWeight') as number;

    for (let i = 0; i < input.data.length; i += 4) {
      // Calculate luminance
      const r = input.data[i];
      const g = input.data[i + 1];
      const b = input.data[i + 2];
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply gamma
      lum = Math.pow(lum / 255, gamma) * 255;

      // Invert if needed
      let depthValue = invert ? (255 - lum) : lum;
      depthValue = depthValue * weight;

      depth.data[i] = depthValue;
      depth.data[i + 1] = depthValue;
      depth.data[i + 2] = depthValue;
      depth.data[i + 3] = 255;
    }

    return depth;
  }

  /**
   * Contrast-based depth estimation
   * High contrast areas = closer objects, low contrast = distant
   */
  private contrastBasedDepth(input: ImageData): ImageData {
    const { width, height } = input;
    const depth = new ImageData(width, height);
    const windowSize = this.getParameter('contrastWindowSize') as number;
    const weight = this.getParameter('contrastWeight') as number;
    const bias = this.getParameter('contrastBias') as number;

    const halfWindow = Math.floor(windowSize / 2);

    for (let y = halfWindow; y < height - halfWindow; y++) {
      for (let x = halfWindow; x < width - halfWindow; x++) {
        let minLum = 255;
        let maxLum = 0;

        // Calculate local contrast
        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const lum = 0.299 * input.data[idx] + 0.587 * input.data[idx + 1] + 0.114 * input.data[idx + 2];
            minLum = Math.min(minLum, lum);
            maxLum = Math.max(maxLum, lum);
          }
        }

        const contrast = maxLum - minLum;
        let depthValue = contrast * weight + bias * 255;
        depthValue = Math.max(0, Math.min(255, depthValue));

        const idx = (y * width + x) * 4;
        depth.data[idx] = depthValue;
        depth.data[idx + 1] = depthValue;
        depth.data[idx + 2] = depthValue;
        depth.data[idx + 3] = 255;
      }
    }

    return depth;
  }

  /**
   * Defocus-based depth estimation
   * Blurry areas = out of focus = farther from focal plane
   */
  private defocusBasedDepth(input: ImageData): ImageData {
    const { width, height } = input;
    const depth = new ImageData(width, height);
    const kernelSize = this.getParameter('defocusKernelSize') as number;
    const weight = this.getParameter('defocusWeight') as number;

    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        // Calculate local variance (blur metric)
        let sumLum = 0;
        let sumSqLum = 0;
        let count = 0;

        for (let dy = -halfKernel; dy <= halfKernel; dy++) {
          for (let dx = -halfKernel; dx <= halfKernel; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const lum = 0.299 * input.data[idx] + 0.587 * input.data[idx + 1] + 0.114 * input.data[idx + 2];
            sumLum += lum;
            sumSqLum += lum * lum;
            count++;
          }
        }

        const mean = sumLum / count;
        const variance = (sumSqLum / count) - (mean * mean);
        
        // Low variance = blurry = farther
        // High variance = sharp = closer
        let depthValue = Math.sqrt(variance) * weight;
        depthValue = Math.max(0, Math.min(255, depthValue));

        const idx = (y * width + x) * 4;
        depth.data[idx] = depthValue;
        depth.data[idx + 1] = depthValue;
        depth.data[idx + 2] = depthValue;
        depth.data[idx + 3] = 255;
      }
    }

    return depth;
  }

  /**
   * Atmospheric perspective depth estimation
   * Hazier/bluer areas = farther away
   */
  private atmosphericDepth(input: ImageData): ImageData {
    const { width, height } = input;
    const depth = new ImageData(width, height);
    const fogColor = this.getParameter('fogColor') as { r: number; g: number; b: number };
    const weight = this.getParameter('atmosphericWeight') as number;

    for (let i = 0; i < input.data.length; i += 4) {
      const r = input.data[i] / 255;
      const g = input.data[i + 1] / 255;
      const b = input.data[i + 2] / 255;

      // Calculate similarity to fog color (higher = farther)
      const dr = Math.abs(r - fogColor.r);
      const dg = Math.abs(g - fogColor.g);
      const db = Math.abs(b - fogColor.b);
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);

      // Inverse distance = depth (closer to fog color = farther)
      let depthValue = (1 - distance) * 255 * weight;
      depthValue = Math.max(0, Math.min(255, depthValue));

      depth.data[i] = depthValue;
      depth.data[i + 1] = depthValue;
      depth.data[i + 2] = depthValue;
      depth.data[i + 3] = 255;
    }

    return depth;
  }

  /**
   * Multi-cue depth estimation
   * Combines multiple depth cues for better results
   */
  private multiCueDepth(input: ImageData): ImageData {
    const edgeDepth = this.edgeBasedDepth(input);
    const lumDepth = this.luminanceBasedDepth(input);
    const contrastDepth = this.contrastBasedDepth(input);
    const atmoDepth = this.atmosphericDepth(input);

    const { width, height } = input;
    const combined = new ImageData(width, height);

    const edgeWeight = this.getParameter('edgeWeight') as number;
    const lumWeight = this.getParameter('luminanceWeight') as number;
    const contrastWeight = this.getParameter('contrastWeight') as number;
    const atmoWeight = this.getParameter('atmosphericWeight') as number;

    const totalWeight = edgeWeight + lumWeight + contrastWeight + atmoWeight;

    for (let i = 0; i < combined.data.length; i += 4) {
      const weighted = 
        (edgeDepth.data[i] * edgeWeight +
         lumDepth.data[i] * lumWeight +
         contrastDepth.data[i] * contrastWeight +
         atmoDepth.data[i] * atmoWeight) / totalWeight;

      combined.data[i] = weighted;
      combined.data[i + 1] = weighted;
      combined.data[i + 2] = weighted;
      combined.data[i + 3] = 255;
    }

    return combined;
  }

  /**
   * Hybrid depth estimation with all available methods
   */
  private hybridDepth(input: ImageData): ImageData {
    const multiCue = this.multiCueDepth(input);
    const defocus = this.defocusBasedDepth(input);

    const { width, height } = input;
    const hybrid = new ImageData(width, height);

    const defocusWeight = this.getParameter('defocusWeight') as number;

    for (let i = 0; i < hybrid.data.length; i += 4) {
      const combined = multiCue.data[i] * (1 - defocusWeight) + defocus.data[i] * defocusWeight;

      hybrid.data[i] = combined;
      hybrid.data[i + 1] = combined;
      hybrid.data[i + 2] = combined;
      hybrid.data[i + 3] = 255;
    }

    return hybrid;
  }

  /**
   * Blend generated depth with user-provided hints
   */
  private blendWithUserHints(depth: ImageData, hints: ImageData): ImageData {
    const blended = new ImageData(depth.width, depth.height);
    const strength = this.getParameter('userHintStrength') as number;

    for (let i = 0; i < depth.data.length; i += 4) {
      const depthVal = depth.data[i];
      const hintVal = hints.data[i];
      const blendedVal = depthVal * (1 - strength) + hintVal * strength;

      blended.data[i] = blendedVal;
      blended.data[i + 1] = blendedVal;
      blended.data[i + 2] = blendedVal;
      blended.data[i + 3] = 255;
    }

    return blended;
  }

  /**
   * Bilateral smoothing - edge-preserving blur
   */
  private bilateralSmooth(depth: ImageData, reference: ImageData): ImageData {
    const { width, height } = depth;
    const smoothed = new ImageData(width, height);
    const spatialSigma = this.getParameter('bilateralSpatial') as number;
    const rangeSigma = this.getParameter('bilateralRange') as number;

    const spatialRadius = Math.ceil(spatialSigma * 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumWeight = 0;
        let sumDepth = 0;

        const centerIdx = (y * width + x) * 4;
        const centerDepth = depth.data[centerIdx];
        const centerColor = reference.data[centerIdx];

        for (let dy = -spatialRadius; dy <= spatialRadius; dy++) {
          for (let dx = -spatialRadius; dx <= spatialRadius; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const idx = (ny * width + nx) * 4;

            // Spatial weight
            const spatialDist = dx * dx + dy * dy;
            const spatialWeight = Math.exp(-spatialDist / (2 * spatialSigma * spatialSigma));

            // Range weight (based on color similarity)
            const colorDist = Math.abs(reference.data[idx] - centerColor);
            const rangeWeight = Math.exp(-colorDist / (2 * rangeSigma * 255));

            const weight = spatialWeight * rangeWeight;
            sumWeight += weight;
            sumDepth += depth.data[idx] * weight;
          }
        }

        const finalDepth = sumDepth / sumWeight;
        smoothed.data[centerIdx] = finalDepth;
        smoothed.data[centerIdx + 1] = finalDepth;
        smoothed.data[centerIdx + 2] = finalDepth;
        smoothed.data[centerIdx + 3] = 255;
      }
    }

    return smoothed;
  }

  /**
   * Gaussian smoothing
   */
  private gaussianSmooth(depth: ImageData, radius: number): ImageData {
    const { width, height } = depth;
    const smoothed = new ImageData(width, height);
    const sigma = radius / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const idx = (ny * width + nx) * 4;

            const dist = dx * dx + dy * dy;
            const weight = Math.exp(-dist / (2 * sigma * sigma));
            
            sum += depth.data[idx] * weight;
            weightSum += weight;
          }
        }

        const finalDepth = sum / weightSum;
        const centerIdx = (y * width + x) * 4;
        smoothed.data[centerIdx] = finalDepth;
        smoothed.data[centerIdx + 1] = finalDepth;
        smoothed.data[centerIdx + 2] = finalDepth;
        smoothed.data[centerIdx + 3] = 255;
      }
    }

    return smoothed;
  }

  /**
   * Normalize depth range
   */
  private normalizeDepthRange(depth: ImageData): ImageData {
    const normalized = new ImageData(depth.width, depth.height);
    const depthMin = this.getParameter('depthMin') as number;
    const depthMax = this.getParameter('depthMax') as number;
    const bias = this.getParameter('depthBias') as number;
    const contrast = this.getParameter('depthContrast') as number;

    // Find min/max
    let min = 255;
    let max = 0;
    for (let i = 0; i < depth.data.length; i += 4) {
      min = Math.min(min, depth.data[i]);
      max = Math.max(max, depth.data[i]);
    }

    const range = max - min;
    if (range === 0) {
      return depth; // Avoid division by zero
    }

    for (let i = 0; i < depth.data.length; i += 4) {
      // Normalize to 0-1
      let value = (depth.data[i] - min) / range;
      
      // Apply contrast (before bias to maintain proper centering)
      value = (value - 0.5) * contrast + 0.5;
      
      // Apply bias
      value = value + (bias - 0.5);
      
      // Clamp to 0-1 range
      value = Math.max(0, Math.min(1, value));
      
      // Scale to target range
      value = depthMin + value * (depthMax - depthMin);
      
      const finalValue = value * 255;
      normalized.data[i] = finalValue;
      normalized.data[i + 1] = finalValue;
      normalized.data[i + 2] = finalValue;
      normalized.data[i + 3] = 255;
    }

    return normalized;
  }

  /**
   * Inpaint depth map to fill holes
   */
  private inpaintDepth(depth: ImageData): ImageData {
    const inpainted = new ImageData(depth.width, depth.height);
    const iterations = this.getParameter('inpaintIterations') as number;

    // Copy original
    for (let i = 0; i < depth.data.length; i++) {
      inpainted.data[i] = depth.data[i];
    }

    // Simple diffusion-based inpainting
    for (let iter = 0; iter < iterations; iter++) {
      const temp = new ImageData(depth.width, depth.height);
      for (let i = 0; i < inpainted.data.length; i++) {
        temp.data[i] = inpainted.data[i];
      }

      for (let y = 1; y < depth.height - 1; y++) {
        for (let x = 1; x < depth.width - 1; x++) {
          const idx = (y * depth.width + x) * 4;
          
          // Average with neighbors
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nidx = ((y + dy) * depth.width + (x + dx)) * 4;
              sum += temp.data[nidx];
              count++;
            }
          }

          const avg = sum / count;
          inpainted.data[idx] = avg;
          inpainted.data[idx + 1] = avg;
          inpainted.data[idx + 2] = avg;
        }
      }
    }

    return inpainted;
  }

  /**
   * Create normalized depth output
   */
  private createNormalizedDepth(depth: ImageData): ImageData {
    const normalized = new ImageData(depth.width, depth.height);

    let min = 255;
    let max = 0;
    for (let i = 0; i < depth.data.length; i += 4) {
      min = Math.min(min, depth.data[i]);
      max = Math.max(max, depth.data[i]);
    }

    const range = max - min || 1;

    for (let i = 0; i < depth.data.length; i += 4) {
      const value = ((depth.data[i] - min) / range) * 255;
      normalized.data[i] = value;
      normalized.data[i + 1] = value;
      normalized.data[i + 2] = value;
      normalized.data[i + 3] = 255;
    }

    return normalized;
  }

  /**
   * Invert depth map
   */
  private invertDepth(depth: ImageData): ImageData {
    const inverted = new ImageData(depth.width, depth.height);

    for (let i = 0; i < depth.data.length; i += 4) {
      const value = 255 - depth.data[i];
      inverted.data[i] = value;
      inverted.data[i + 1] = value;
      inverted.data[i + 2] = value;
      inverted.data[i + 3] = 255;
    }

    return inverted;
  }

  /**
   * Visualize depth with color coding
   */
  private visualizeDepth(depth: ImageData): ImageData {
    const visualized = new ImageData(depth.width, depth.height);
    const mode = this.getParameter('visualizationMode') as string;
    const invert = this.getParameter('invertVisualization') as boolean;

    for (let i = 0; i < depth.data.length; i += 4) {
      let value = depth.data[i] / 255;
      if (invert) value = 1 - value;

      let r = 0, g = 0, b = 0;

      switch (mode) {
        case 'grayscale':
          r = g = b = value * 255;
          break;
        case 'heatmap':
          // Blue -> Cyan -> Green -> Yellow -> Red
          if (value < 0.25) {
            r = 0;
            g = value * 4 * 255;
            b = 255;
          } else if (value < 0.5) {
            r = 0;
            g = 255;
            b = (1 - (value - 0.25) * 4) * 255;
          } else if (value < 0.75) {
            r = (value - 0.5) * 4 * 255;
            g = 255;
            b = 0;
          } else {
            r = 255;
            g = (1 - (value - 0.75) * 4) * 255;
            b = 0;
          }
          break;
        case 'rainbow': {
          // Full rainbow spectrum
          const hue = value * 360;
          const rgb = this.hslToRgb(hue / 360, 1, 0.5);
          r = rgb[0];
          g = rgb[1];
          b = rgb[2];
          break;
        }
        case 'terrain':
          // Blue (water) -> Green (land) -> Brown (mountain) -> White (snow)
          if (value < 0.3) {
            r = 0;
            g = value * 255;
            b = 255 - value * 200;
          } else if (value < 0.6) {
            r = (value - 0.3) * 400;
            g = 150;
            b = 0;
          } else {
            r = 120 + (value - 0.6) * 337;
            g = 150 + (value - 0.6) * 262;
            b = (value - 0.6) * 637;
          }
          break;
      }

      visualized.data[i] = r;
      visualized.data[i + 1] = g;
      visualized.data[i + 2] = b;
      visualized.data[i + 3] = 255;
    }

    return visualized;
  }

  /**
   * HSL to RGB conversion for rainbow visualization
   */
  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /**
   * Get gradient in X direction (Sobel)
   */
  private getGradientX(image: ImageData, x: number, y: number): number {
    const { width } = image;
    
    const idx1 = ((y - 1) * width + (x - 1)) * 4;
    const idx2 = ((y - 1) * width + (x + 1)) * 4;
    const idx3 = (y * width + (x - 1)) * 4;
    const idx4 = (y * width + (x + 1)) * 4;
    const idx5 = ((y + 1) * width + (x - 1)) * 4;
    const idx6 = ((y + 1) * width + (x + 1)) * 4;

    const lum1 = 0.299 * image.data[idx1] + 0.587 * image.data[idx1 + 1] + 0.114 * image.data[idx1 + 2];
    const lum2 = 0.299 * image.data[idx2] + 0.587 * image.data[idx2 + 1] + 0.114 * image.data[idx2 + 2];
    const lum3 = 0.299 * image.data[idx3] + 0.587 * image.data[idx3 + 1] + 0.114 * image.data[idx3 + 2];
    const lum4 = 0.299 * image.data[idx4] + 0.587 * image.data[idx4 + 1] + 0.114 * image.data[idx4 + 2];
    const lum5 = 0.299 * image.data[idx5] + 0.587 * image.data[idx5 + 1] + 0.114 * image.data[idx5 + 2];
    const lum6 = 0.299 * image.data[idx6] + 0.587 * image.data[idx6 + 1] + 0.114 * image.data[idx6 + 2];

    return (-lum1 + lum2 - 2 * lum3 + 2 * lum4 - lum5 + lum6) / 4;
  }

  /**
   * Get gradient in Y direction (Sobel)
   */
  private getGradientY(image: ImageData, x: number, y: number): number {
    const { width } = image;
    
    const idx1 = ((y - 1) * width + (x - 1)) * 4;
    const idx2 = ((y - 1) * width + x) * 4;
    const idx3 = ((y - 1) * width + (x + 1)) * 4;
    const idx4 = ((y + 1) * width + (x - 1)) * 4;
    const idx5 = ((y + 1) * width + x) * 4;
    const idx6 = ((y + 1) * width + (x + 1)) * 4;

    const lum1 = 0.299 * image.data[idx1] + 0.587 * image.data[idx1 + 1] + 0.114 * image.data[idx1 + 2];
    const lum2 = 0.299 * image.data[idx2] + 0.587 * image.data[idx2 + 1] + 0.114 * image.data[idx2 + 2];
    const lum3 = 0.299 * image.data[idx3] + 0.587 * image.data[idx3 + 1] + 0.114 * image.data[idx3 + 2];
    const lum4 = 0.299 * image.data[idx4] + 0.587 * image.data[idx4 + 1] + 0.114 * image.data[idx4 + 2];
    const lum5 = 0.299 * image.data[idx5] + 0.587 * image.data[idx5 + 1] + 0.114 * image.data[idx5 + 2];
    const lum6 = 0.299 * image.data[idx6] + 0.587 * image.data[idx6 + 1] + 0.114 * image.data[idx6 + 2];

    return (-lum1 - 2 * lum2 - lum3 + lum4 + 2 * lum5 + lum6) / 4;
  }

  dispose(): void {
    // Clean up resources
    super.dispose();
  }
}
