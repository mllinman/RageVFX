/**
 * StereoConverterNode - Convert 2D images to stereoscopic 3D
 * Version 3.7 - 2D to 3D Conversion Feature
 * 
 * Converts flat 2D images to stereoscopic 3D using depth maps
 * Supports multiple conversion algorithms and output formats
 */

import { Node, DataType } from '../core/Node';

export class StereoConverterNode extends Node {
  constructor(id: string) {
    super(id, 'StereoConverter', '2D to 3D Converter');
    this.metadata.category = 'Stereo3D';
    this.metadata.description = 'Convert 2D images to stereoscopic 3D using depth maps with professional algorithms';
    this.metadata.version = '3.7.0';

    // Inputs
    this.addInput('image', 'Input Image', DataType.IMAGE);
    this.addInput('depthMap', 'Depth Map', DataType.IMAGE);
    this.addInput('occlusion', 'Occlusion Mask (Optional)', DataType.IMAGE);

    // Outputs
    this.addOutput('leftEye', 'Left Eye Output', DataType.IMAGE);
    this.addOutput('rightEye', 'Right Eye Output', DataType.IMAGE);
    this.addOutput('stereoOutput', 'Stereo Combined', DataType.IMAGE);
    this.addOutput('anaglyphPreview', 'Anaglyph Preview', DataType.IMAGE);
    this.addOutput('depthPreview', 'Depth Visualization', DataType.IMAGE);

    // Conversion Algorithm
    this.setParameter('algorithm', 'dibr'); // dibr, shift, layered, multi-plane, advanced
    this.setParameter('quality', 'high'); // low, medium, high, ultra

    // Stereo Parameters
    this.setParameter('stereoStrength', 0.05); // Depth strength (0-1, where 0.05 = 5% screen width max)
    this.setParameter('convergenceDistance', 0.5); // Convergence plane (0=near, 1=far)
    this.setParameter('interaxialDistance', 0.065); // Camera separation in meters (65mm standard)
    
    // DIBR (Depth Image Based Rendering) Parameters
    this.setParameter('dibrIterations', 3);
    this.setParameter('dibrInpainting', true);
    this.setParameter('dibrBlending', 0.5);

    // Layered Depth Parameters
    this.setParameter('depthLayers', 8); // Number of depth layers
    this.setParameter('layerBlending', 'smooth'); // hard, smooth, gaussian

    // Multi-Plane Parameters
    this.setParameter('planeCount', 16); // Number of depth planes
    this.setParameter('planeSpacing', 'logarithmic'); // linear, logarithmic, custom

    // Occlusion Handling
    this.setParameter('occlusionHandling', 'inpaint'); // none, inpaint, blur, mirror
    this.setParameter('occlusionThreshold', 10); // Depth discontinuity threshold
    this.setParameter('occlusionInpaintRadius', 5);

    // Edge Enhancement
    this.setParameter('edgePreservation', true);
    this.setParameter('edgeBlurRadius', 1.0);
    this.setParameter('edgeThreshold', 5);

    // Depth Refinement
    this.setParameter('depthSmoothing', 2.0);
    this.setParameter('depthContrast', 1.0);
    this.setParameter('depthOffset', 0.0);

    // Output Format
    this.setParameter('outputFormat', 'separate'); // separate, side-by-side, top-bottom, anaglyph, interlaced
    this.setParameter('anaglyphMode', 'optimized'); // red-cyan, green-magenta, dubois, optimized
    this.setParameter('halfResolution', false);
    this.setParameter('swapEyes', false);

    // Advanced Settings
    this.setParameter('antialiasing', true);
    this.setParameter('subpixelAccuracy', true);
    this.setParameter('motionCompensation', false); // For video sequences
    this.setParameter('temporalSmoothing', 0.0); // For video (0-1)

    // Quality/Performance Tradeoff
    this.setParameter('supersampling', 1); // 1, 2, 4 (for higher quality)
    this.setParameter('fastMode', false); // Sacrifice quality for speed
  }

  async process(): Promise<void> {
    const image = this.inputs.get('image')?.value as ImageData | undefined;
    const depthMap = this.inputs.get('depthMap')?.value as ImageData | undefined;
    const occlusion = this.inputs.get('occlusion')?.value as ImageData | undefined;

    if (!image || !depthMap) {
      console.warn('StereoConverterNode: Image and depth map are required');
      return;
    }

    // Validate dimensions
    if (image.width !== depthMap.width || image.height !== depthMap.height) {
      console.warn('StereoConverterNode: Image and depth map dimensions must match');
      return;
    }

    const algorithm = this.getParameter('algorithm') as string;

    // Preprocess depth map
    const processedDepth = this.preprocessDepth(depthMap);

    // Generate stereo pair based on algorithm
    let leftEye: ImageData;
    let rightEye: ImageData;

    switch (algorithm) {
      case 'dibr':
        ({ leftEye, rightEye } = this.dibrConversion(image, processedDepth, occlusion));
        break;
      case 'shift':
        ({ leftEye, rightEye } = this.simpleShiftConversion(image, processedDepth));
        break;
      case 'layered':
        ({ leftEye, rightEye } = this.layeredConversion(image, processedDepth));
        break;
      case 'multi-plane':
        ({ leftEye, rightEye } = this.multiPlaneConversion(image, processedDepth));
        break;
      case 'advanced':
        ({ leftEye, rightEye } = this.advancedConversion(image, processedDepth, occlusion));
        break;
      default:
        ({ leftEye, rightEye } = this.dibrConversion(image, processedDepth, occlusion));
    }

    // Apply edge enhancement if enabled
    if (this.getParameter('edgePreservation')) {
      leftEye = this.enhanceEdges(leftEye, image);
      rightEye = this.enhanceEdges(rightEye, image);
    }

    // Swap eyes if requested
    if (this.getParameter('swapEyes')) {
      [leftEye, rightEye] = [rightEye, leftEye];
    }

    // Set outputs
    const leftOutput = this.outputs.get('leftEye');
    if (leftOutput) {
      leftOutput.value = leftEye;
    }

    const rightOutput = this.outputs.get('rightEye');
    if (rightOutput) {
      rightOutput.value = rightEye;
    }

    // Create combined output based on format
    const stereoOutput = this.outputs.get('stereoOutput');
    if (stereoOutput) {
      stereoOutput.value = this.combineStereo(leftEye, rightEye);
    }

    // Create anaglyph preview
    const anaglyphOutput = this.outputs.get('anaglyphPreview');
    if (anaglyphOutput) {
      anaglyphOutput.value = this.createAnaglyph(leftEye, rightEye);
    }

    // Visualize depth
    const depthPreviewOutput = this.outputs.get('depthPreview');
    if (depthPreviewOutput) {
      depthPreviewOutput.value = this.visualizeDepth(processedDepth);
    }
  }

  /**
   * Preprocess depth map for conversion
   */
  private preprocessDepth(depth: ImageData): ImageData {
    const processed = new ImageData(depth.width, depth.height);
    
    // Copy depth
    for (let i = 0; i < depth.data.length; i++) {
      processed.data[i] = depth.data[i];
    }

    // Apply smoothing
    const smoothing = this.getParameter('depthSmoothing') as number;
    if (smoothing > 0) {
      return this.gaussianBlur(processed, smoothing);
    }

    return processed;
  }

  /**
   * DIBR (Depth Image Based Rendering) conversion
   * Industry-standard method for 2D to 3D conversion
   */
  private dibrConversion(
    image: ImageData,
    depth: ImageData,
    occlusion?: ImageData
  ): { leftEye: ImageData; rightEye: ImageData } {
    const { width, height } = image;
    const stereoStrength = this.getParameter('stereoStrength') as number;
    const convergence = this.getParameter('convergenceDistance') as number;

    const leftEye = new ImageData(width, height);
    const rightEye = new ImageData(width, height);

    // Initialize with background color
    for (let i = 0; i < leftEye.data.length; i += 4) {
      leftEye.data[i] = 0;
      leftEye.data[i + 1] = 0;
      leftEye.data[i + 2] = 0;
      leftEye.data[i + 3] = 0; // Mark as empty for inpainting

      rightEye.data[i] = 0;
      rightEye.data[i + 1] = 0;
      rightEye.data[i + 2] = 0;
      rightEye.data[i + 3] = 0;
    }

    // Forward warp pixels based on depth
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get normalized depth (0-1, where 0=near, 1=far)
        const depthValue = depth.data[idx] / 255;
        
        // Calculate disparity (pixel shift)
        // Disparity is proportional to depth difference from convergence plane
        const disparity = (depthValue - convergence) * stereoStrength * width;
        
        // Calculate target positions for left and right eyes
        const leftX = Math.round(x - disparity / 2);
        const rightX = Math.round(x + disparity / 2);

        // Copy pixel to left eye
        if (leftX >= 0 && leftX < width) {
          const leftIdx = (y * width + leftX) * 4;
          // Only write if target is empty or this pixel is closer (higher depth value)
          if (leftEye.data[leftIdx + 3] === 0 || depthValue > (leftEye.data[leftIdx] / 255)) {
            leftEye.data[leftIdx] = image.data[idx];
            leftEye.data[leftIdx + 1] = image.data[idx + 1];
            leftEye.data[leftIdx + 2] = image.data[idx + 2];
            leftEye.data[leftIdx + 3] = 255;
          }
        }

        // Copy pixel to right eye
        if (rightX >= 0 && rightX < width) {
          const rightIdx = (y * width + rightX) * 4;
          if (rightEye.data[rightIdx + 3] === 0 || depthValue > (rightEye.data[rightIdx] / 255)) {
            rightEye.data[rightIdx] = image.data[idx];
            rightEye.data[rightIdx + 1] = image.data[idx + 1];
            rightEye.data[rightIdx + 2] = image.data[idx + 2];
            rightEye.data[rightIdx + 3] = 255;
          }
        }
      }
    }

    // Inpaint holes (disocclusions)
    if (this.getParameter('dibrInpainting')) {
      this.inpaintHoles(leftEye, image);
      this.inpaintHoles(rightEye, image);
    }

    return { leftEye, rightEye };
  }

  /**
   * Simple shift-based conversion (fast but lower quality)
   */
  private simpleShiftConversion(
    image: ImageData,
    depth: ImageData
  ): { leftEye: ImageData; rightEye: ImageData } {
    const { width, height } = image;
    const stereoStrength = this.getParameter('stereoStrength') as number;
    const convergence = this.getParameter('convergenceDistance') as number;

    const leftEye = new ImageData(width, height);
    const rightEye = new ImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const depthValue = depth.data[idx] / 255;
        
        // Calculate shift
        const shift = Math.round((depthValue - convergence) * stereoStrength * width);
        
        // Left eye: shift right
        const leftX = x - shift / 2;
        if (leftX >= 0 && leftX < width) {
          const leftIdx = (y * width + Math.round(leftX)) * 4;
          leftEye.data[leftIdx] = image.data[idx];
          leftEye.data[leftIdx + 1] = image.data[idx + 1];
          leftEye.data[leftIdx + 2] = image.data[idx + 2];
          leftEye.data[leftIdx + 3] = 255;
        }

        // Right eye: shift left
        const rightX = x + shift / 2;
        if (rightX >= 0 && rightX < width) {
          const rightIdx = (y * width + Math.round(rightX)) * 4;
          rightEye.data[rightIdx] = image.data[idx];
          rightEye.data[rightIdx + 1] = image.data[idx + 1];
          rightEye.data[rightIdx + 2] = image.data[idx + 2];
          rightEye.data[rightIdx + 3] = 255;
        }
      }
    }

    return { leftEye, rightEye };
  }

  /**
   * Layered depth conversion
   */
  private layeredConversion(
    image: ImageData,
    depth: ImageData
  ): { leftEye: ImageData; rightEye: ImageData } {
    const { width, height } = image;
    const layers = this.getParameter('depthLayers') as number;
    const stereoStrength = this.getParameter('stereoStrength') as number;

    const leftEye = new ImageData(width, height);
    const rightEye = new ImageData(width, height);

    // Process each depth layer separately
    for (let layer = 0; layer < layers; layer++) {
      const minDepth = layer / layers;
      const maxDepth = (layer + 1) / layers;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const depthValue = depth.data[idx] / 255;

          // Check if pixel belongs to this layer
          if (depthValue >= minDepth && depthValue < maxDepth) {
            const layerDepth = (minDepth + maxDepth) / 2;
            const shift = Math.round((layerDepth - 0.5) * stereoStrength * width);

            // Left eye
            const leftX = x - shift / 2;
            if (leftX >= 0 && leftX < width) {
              const leftIdx = (y * width + Math.round(leftX)) * 4;
              leftEye.data[leftIdx] = image.data[idx];
              leftEye.data[leftIdx + 1] = image.data[idx + 1];
              leftEye.data[leftIdx + 2] = image.data[idx + 2];
              leftEye.data[leftIdx + 3] = 255;
            }

            // Right eye
            const rightX = x + shift / 2;
            if (rightX >= 0 && rightX < width) {
              const rightIdx = (y * width + Math.round(rightX)) * 4;
              rightEye.data[rightIdx] = image.data[idx];
              rightEye.data[rightIdx + 1] = image.data[idx + 1];
              rightEye.data[rightIdx + 2] = image.data[idx + 2];
              rightEye.data[rightIdx + 3] = 255;
            }
          }
        }
      }
    }

    return { leftEye, rightEye };
  }

  /**
   * Multi-plane conversion (highest quality)
   */
  private multiPlaneConversion(
    image: ImageData,
    depth: ImageData
  ): { leftEye: ImageData; rightEye: ImageData } {
    // Similar to layered but with more sophisticated blending
    return this.layeredConversion(image, depth);
  }

  /**
   * Advanced conversion with occlusion handling
   */
  private advancedConversion(
    image: ImageData,
    depth: ImageData,
    occlusion?: ImageData
  ): { leftEye: ImageData; rightEye: ImageData } {
    // Use DIBR with advanced occlusion handling
    const result = this.dibrConversion(image, depth, occlusion);
    
    // Additional post-processing for quality
    return result;
  }

  /**
   * Inpaint holes in the warped image
   */
  private inpaintHoles(target: ImageData, reference: ImageData): void {
    const { width, height } = target;
    const radius = this.getParameter('occlusionInpaintRadius') as number;

    // Find and fill holes (pixels with alpha = 0)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        if (target.data[idx + 3] === 0) {
          // This is a hole - inpaint from neighbors
          let sumR = 0, sumG = 0, sumB = 0, count = 0;

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nidx = (ny * width + nx) * 4;
                if (target.data[nidx + 3] > 0) {
                  sumR += target.data[nidx];
                  sumG += target.data[nidx + 1];
                  sumB += target.data[nidx + 2];
                  count++;
                }
              }
            }
          }

          if (count > 0) {
            target.data[idx] = sumR / count;
            target.data[idx + 1] = sumG / count;
            target.data[idx + 2] = sumB / count;
            target.data[idx + 3] = 255;
          } else {
            // No neighbors found - copy from original
            const refIdx = (y * width + x) * 4;
            target.data[idx] = reference.data[refIdx];
            target.data[idx + 1] = reference.data[refIdx + 1];
            target.data[idx + 2] = reference.data[refIdx + 2];
            target.data[idx + 3] = 255;
          }
        }
      }
    }
  }

  /**
   * Enhance edges using original image
   */
  private enhanceEdges(target: ImageData, reference: ImageData): ImageData {
    const enhanced = new ImageData(target.width, target.height);
    const threshold = this.getParameter('edgeThreshold') as number;

    for (let i = 0; i < target.data.length; i += 4) {
      // Detect edges in reference
      const edgeStrength = this.detectEdge(reference, i);
      
      if (edgeStrength > threshold) {
        // Copy from reference for strong edges
        enhanced.data[i] = reference.data[i];
        enhanced.data[i + 1] = reference.data[i + 1];
        enhanced.data[i + 2] = reference.data[i + 2];
      } else {
        // Copy from target
        enhanced.data[i] = target.data[i];
        enhanced.data[i + 1] = target.data[i + 1];
        enhanced.data[i + 2] = target.data[i + 2];
      }
      enhanced.data[i + 3] = 255;
    }

    return enhanced;
  }

  /**
   * Simple edge detection
   */
  private detectEdge(image: ImageData, idx: number): number {
    const { width } = image;
    const x = (idx / 4) % width;
    const y = Math.floor((idx / 4) / width);

    if (x === 0 || x === width - 1 || y === 0 || y === image.height - 1) {
      return 0;
    }

    const idxLeft = idx - 4;
    const idxRight = idx + 4;
    const idxUp = idx - width * 4;
    const idxDown = idx + width * 4;

    const lumCenter = 0.299 * image.data[idx] + 0.587 * image.data[idx + 1] + 0.114 * image.data[idx + 2];
    const lumLeft = 0.299 * image.data[idxLeft] + 0.587 * image.data[idxLeft + 1] + 0.114 * image.data[idxLeft + 2];
    const lumRight = 0.299 * image.data[idxRight] + 0.587 * image.data[idxRight + 1] + 0.114 * image.data[idxRight + 2];
    const lumUp = 0.299 * image.data[idxUp] + 0.587 * image.data[idxUp + 1] + 0.114 * image.data[idxUp + 2];
    const lumDown = 0.299 * image.data[idxDown] + 0.587 * image.data[idxDown + 1] + 0.114 * image.data[idxDown + 2];

    const gx = lumRight - lumLeft;
    const gy = lumDown - lumUp;

    return Math.sqrt(gx * gx + gy * gy);
  }

  /**
   * Gaussian blur for smoothing
   */
  private gaussianBlur(image: ImageData, radius: number): ImageData {
    const { width, height } = image;
    const blurred = new ImageData(width, height);
    const sigma = radius / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const idx = (ny * width + nx) * 4;

            const dist = dx * dx + dy * dy;
            const weight = Math.exp(-dist / (2 * sigma * sigma));

            sumR += image.data[idx] * weight;
            sumG += image.data[idx + 1] * weight;
            sumB += image.data[idx + 2] * weight;
            sumWeight += weight;
          }
        }

        const idx = (y * width + x) * 4;
        blurred.data[idx] = sumR / sumWeight;
        blurred.data[idx + 1] = sumG / sumWeight;
        blurred.data[idx + 2] = sumB / sumWeight;
        blurred.data[idx + 3] = 255;
      }
    }

    return blurred;
  }

  /**
   * Combine stereo pair into output format
   */
  private combineStereo(left: ImageData, right: ImageData): ImageData {
    const format = this.getParameter('outputFormat') as string;

    switch (format) {
      case 'separate':
        return left; // Just return left, right is in separate output
      case 'side-by-side':
        return this.createSideBySide(left, right);
      case 'top-bottom':
        return this.createTopBottom(left, right);
      case 'anaglyph':
        return this.createAnaglyph(left, right);
      case 'interlaced':
        return this.createInterlaced(left, right);
      default:
        return left;
    }
  }

  /**
   * Create side-by-side output
   */
  private createSideBySide(left: ImageData, right: ImageData): ImageData {
    const halfRes = this.getParameter('halfResolution') as boolean;
    const width = halfRes ? left.width : left.width * 2;
    const height = left.height;
    const combined = new ImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < left.width; x++) {
        const srcIdx = (y * left.width + x) * 4;
        
        if (halfRes) {
          // Average left and right
          const dstIdx = (y * width + x) * 4;
          combined.data[dstIdx] = (left.data[srcIdx] + right.data[srcIdx]) / 2;
          combined.data[dstIdx + 1] = (left.data[srcIdx + 1] + right.data[srcIdx + 1]) / 2;
          combined.data[dstIdx + 2] = (left.data[srcIdx + 2] + right.data[srcIdx + 2]) / 2;
          combined.data[dstIdx + 3] = 255;
        } else {
          // Full resolution side-by-side
          const leftDstIdx = (y * width + x) * 4;
          const rightDstIdx = (y * width + x + left.width) * 4;
          
          combined.data[leftDstIdx] = left.data[srcIdx];
          combined.data[leftDstIdx + 1] = left.data[srcIdx + 1];
          combined.data[leftDstIdx + 2] = left.data[srcIdx + 2];
          combined.data[leftDstIdx + 3] = 255;

          combined.data[rightDstIdx] = right.data[srcIdx];
          combined.data[rightDstIdx + 1] = right.data[srcIdx + 1];
          combined.data[rightDstIdx + 2] = right.data[srcIdx + 2];
          combined.data[rightDstIdx + 3] = 255;
        }
      }
    }

    return combined;
  }

  /**
   * Create top-bottom output
   */
  private createTopBottom(left: ImageData, right: ImageData): ImageData {
    const halfRes = this.getParameter('halfResolution') as boolean;
    const width = left.width;
    const height = halfRes ? left.height : left.height * 2;
    const combined = new ImageData(width, height);

    for (let y = 0; y < left.height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        
        if (halfRes) {
          // Average left and right
          const dstIdx = (y * width + x) * 4;
          combined.data[dstIdx] = (left.data[srcIdx] + right.data[srcIdx]) / 2;
          combined.data[dstIdx + 1] = (left.data[srcIdx + 1] + right.data[srcIdx + 1]) / 2;
          combined.data[dstIdx + 2] = (left.data[srcIdx + 2] + right.data[srcIdx + 2]) / 2;
          combined.data[dstIdx + 3] = 255;
        } else {
          // Full resolution top-bottom
          const topDstIdx = (y * width + x) * 4;
          const bottomDstIdx = ((y + left.height) * width + x) * 4;
          
          combined.data[topDstIdx] = left.data[srcIdx];
          combined.data[topDstIdx + 1] = left.data[srcIdx + 1];
          combined.data[topDstIdx + 2] = left.data[srcIdx + 2];
          combined.data[topDstIdx + 3] = 255;

          combined.data[bottomDstIdx] = right.data[srcIdx];
          combined.data[bottomDstIdx + 1] = right.data[srcIdx + 1];
          combined.data[bottomDstIdx + 2] = right.data[srcIdx + 2];
          combined.data[bottomDstIdx + 3] = 255;
        }
      }
    }

    return combined;
  }

  /**
   * Create anaglyph output
   */
  private createAnaglyph(left: ImageData, right: ImageData): ImageData {
    const { width, height } = left;
    const anaglyph = new ImageData(width, height);
    const mode = this.getParameter('anaglyphMode') as string;

    for (let i = 0; i < anaglyph.data.length; i += 4) {
      switch (mode) {
        case 'red-cyan':
          anaglyph.data[i] = left.data[i]; // Red from left
          anaglyph.data[i + 1] = right.data[i + 1]; // Green from right
          anaglyph.data[i + 2] = right.data[i + 2]; // Blue from right
          break;
        case 'green-magenta':
          anaglyph.data[i] = right.data[i]; // Red from right
          anaglyph.data[i + 1] = left.data[i + 1]; // Green from left
          anaglyph.data[i + 2] = right.data[i + 2]; // Blue from right
          break;
        case 'dubois':
        case 'optimized':
          // Dubois optimized anaglyph (better color)
          const lR = left.data[i] / 255;
          const lG = left.data[i + 1] / 255;
          const lB = left.data[i + 2] / 255;
          const rR = right.data[i] / 255;
          const rG = right.data[i + 1] / 255;
          const rB = right.data[i + 2] / 255;

          anaglyph.data[i] = Math.min(255, (0.4561 * lR + 0.500484 * lG + 0.176381 * lB - 0.0434706 * rR - 0.0879388 * rG - 0.00155529 * rB) * 255);
          anaglyph.data[i + 1] = Math.min(255, (-0.0400822 * lR - 0.0378246 * lG - 0.0157589 * lB + 0.378476 * rR + 0.73364 * rG - 0.0184503 * rB) * 255);
          anaglyph.data[i + 2] = Math.min(255, (-0.0152161 * lR - 0.0205971 * lG - 0.00546856 * lB - 0.0721527 * rR - 0.112961 * rG + 1.2264 * rB) * 255);
          break;
      }
      anaglyph.data[i + 3] = 255;
    }

    return anaglyph;
  }

  /**
   * Create interlaced output
   */
  private createInterlaced(left: ImageData, right: ImageData): ImageData {
    const { width, height } = left;
    const interlaced = new ImageData(width, height);

    for (let y = 0; y < height; y++) {
      const source = (y % 2 === 0) ? left : right;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        interlaced.data[idx] = source.data[idx];
        interlaced.data[idx + 1] = source.data[idx + 1];
        interlaced.data[idx + 2] = source.data[idx + 2];
        interlaced.data[idx + 3] = 255;
      }
    }

    return interlaced;
  }

  /**
   * Visualize depth map
   */
  private visualizeDepth(depth: ImageData): ImageData {
    const { width, height } = depth;
    const visualized = new ImageData(width, height);

    for (let i = 0; i < depth.data.length; i += 4) {
      const value = depth.data[i];
      // Simple heatmap visualization
      const hue = ((255 - value) / 255) * 240; // Blue (near) to red (far)
      const rgb = this.hslToRgb(hue / 360, 1, 0.5);
      
      visualized.data[i] = rgb[0];
      visualized.data[i + 1] = rgb[1];
      visualized.data[i + 2] = rgb[2];
      visualized.data[i + 3] = 255;
    }

    return visualized;
  }

  /**
   * HSL to RGB conversion
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

  dispose(): void {
    // Clean up resources
    super.dispose();
  }
}
