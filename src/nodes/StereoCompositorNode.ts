/**
 * StereoCompositorNode - Stereoscopic 3D compositing and output
 * Version 3.3 - 8K+ & Stereoscopic 3D Support
 */

import { Node, DataType } from '../core/Node';

export interface StereoFrame {
  left: ImageData;
  right: ImageData;
  width: number;
  height: number;
}

// Dubois optimized matrices for better color reproduction in anaglyph 3D
// These matrices minimize ghosting and color distortion
const DUBOIS_RED_CYAN = {
  leftR: [0.4561, 0.500484, 0.176381],
  leftG: [-0.0400822, -0.0378246, -0.0157589],
  leftB: [-0.0152161, -0.0205971, -0.00546856],
  rightR: [-0.0434706, -0.0879388, -0.00155529],
  rightG: [0.378476, 0.73364, -0.0184503],
  rightB: [-0.0721527, -0.112961, 1.2264]
};

export class StereoCompositorNode extends Node {
  constructor(id: string) {
    super(id, 'StereoCompositor', 'Stereo Compositor');
    this.metadata.category = 'Composite';
    this.metadata.description = 'Composite stereoscopic 3D images with multiple output formats for VR, 3D displays, and cinema';
    this.metadata.version = '3.3.0';

    // Inputs
    this.addInput('leftImage', 'Left Eye Image', DataType.IMAGE);
    this.addInput('rightImage', 'Right Eye Image', DataType.IMAGE);
    this.addInput('depthMap', 'Depth Map (Optional)', DataType.IMAGE);

    // Outputs
    this.addOutput('output', 'Composite Output', DataType.IMAGE);
    this.addOutput('leftOutput', 'Left Eye Output', DataType.IMAGE);
    this.addOutput('rightOutput', 'Right Eye Output', DataType.IMAGE);
    this.addOutput('anaglyphPreview', 'Anaglyph Preview', DataType.IMAGE);

    // Output Format
    this.setParameter('outputFormat', 'side-by-side'); // separate, side-by-side, top-bottom, anaglyph, interlaced, checkerboard
    this.setParameter('halfSize', false); // half-width/height for 3D TVs
    this.setParameter('flipLeftRight', false);
    this.setParameter('flipVertical', false);

    // Anaglyph Settings
    this.setParameter('anaglyphMode', 'optimized'); // red-cyan, green-magenta, amber-blue, true-anaglyph, gray-anaglyph, optimized, dubois
    this.setParameter('anaglyphSaturation', 1.0);
    this.setParameter('colorCorrection', true);

    // Stereo Adjustment
    this.setParameter('horizontalOffset', 0); // pixel offset between eyes
    this.setParameter('verticalOffset', 0);
    this.setParameter('convergenceAdjust', 0); // shift convergence plane
    this.setParameter('depthStrength', 1.0); // scale stereo depth

    // Floating Window (stereo masking)
    this.setParameter('floatingWindow', false);
    this.setParameter('leftWindowAdjust', 0);
    this.setParameter('rightWindowAdjust', 0);
    this.setParameter('topWindowAdjust', 0);
    this.setParameter('bottomWindowAdjust', 0);

    // Quality Settings
    this.setParameter('antialiasing', true);
    this.setParameter('interpolation', 'bilinear'); // nearest, bilinear, bicubic, lanczos
    this.setParameter('bitDepth', 16); // 8, 16, 32

    // Depth-Based Effects
    this.setParameter('depthGrading', false);
    this.setParameter('depthFalloffStart', 0.2);
    this.setParameter('depthFalloffEnd', 0.8);
    this.setParameter('nearColorShift', { r: 1, g: 1, b: 1 });
    this.setParameter('farColorShift', { r: 0.9, g: 0.95, b: 1 });

    // Resolution (8K+ support)
    this.setParameter('outputResolution', 'source'); // source, HD, 2K, UHD, 4K, 6K, 8K, custom
    this.setParameter('customWidth', 3840);
    this.setParameter('customHeight', 2160);
  }

  async process(): Promise<void> {
    const leftInput = this.inputs.get('leftImage')?.value as ImageData | undefined;
    const rightInput = this.inputs.get('rightImage')?.value as ImageData | undefined;
    const depthMap = this.inputs.get('depthMap')?.value as ImageData | undefined;

    if (!leftInput || !rightInput) {
      console.warn('StereoCompositorNode: Both left and right images required');
      return;
    }

    // Validate dimensions match
    if (leftInput.width !== rightInput.width || leftInput.height !== rightInput.height) {
      console.warn('StereoCompositorNode: Left and right image dimensions must match');
      return;
    }

    const width = leftInput.width;
    const height = leftInput.height;
    const outputFormat = this.getParameter('outputFormat');
    const halfSize = this.getParameter('halfSize');
    const flipLeftRight = this.getParameter('flipLeftRight');

    // Apply stereo adjustments
    let left = this.applyAdjustments(leftInput, 'left');
    let right = this.applyAdjustments(rightInput, 'right');

    // Swap if requested
    if (flipLeftRight) {
      [left, right] = [right, left];
    }

    // Apply floating window if enabled
    if (this.getParameter('floatingWindow')) {
      left = this.applyFloatingWindow(left, 'left');
      right = this.applyFloatingWindow(right, 'right');
    }

    // Apply depth-based effects if enabled
    if (this.getParameter('depthGrading') && depthMap) {
      left = this.applyDepthGrading(left, depthMap);
      right = this.applyDepthGrading(right, depthMap);
    }

    // Generate output based on format
    let output: ImageData;

    switch (outputFormat) {
      case 'side-by-side':
        output = this.createSideBySide(left, right, halfSize);
        break;
      case 'top-bottom':
        output = this.createTopBottom(left, right, halfSize);
        break;
      case 'anaglyph':
        output = this.createAnaglyph(left, right);
        break;
      case 'interlaced':
        output = this.createInterlaced(left, right);
        break;
      case 'checkerboard':
        output = this.createCheckerboard(left, right);
        break;
      case 'separate':
      default:
        output = left; // Main output is left eye for separate mode
        break;
    }

    // Set outputs
    const outputSocket = this.outputs.get('output');
    if (outputSocket) outputSocket.value = output;

    const leftOutput = this.outputs.get('leftOutput');
    if (leftOutput) leftOutput.value = left;

    const rightOutput = this.outputs.get('rightOutput');
    if (rightOutput) rightOutput.value = right;

    // Always generate anaglyph preview
    const anaglyphPreview = this.outputs.get('anaglyphPreview');
    if (anaglyphPreview) {
      anaglyphPreview.value = this.createAnaglyph(left, right);
    }

    this.dirty = false;
  }

  private applyAdjustments(image: ImageData, eye: 'left' | 'right'): ImageData {
    const hOffset = this.getParameter('horizontalOffset');
    const vOffset = this.getParameter('verticalOffset');
    const convergenceAdjust = this.getParameter('convergenceAdjust');
    const depthStrength = this.getParameter('depthStrength');

    // Calculate total horizontal offset
    let totalHOffset = hOffset;
    if (eye === 'left') {
      totalHOffset += convergenceAdjust;
    } else {
      totalHOffset -= convergenceAdjust;
    }

    // Apply depth strength scaling
    totalHOffset *= depthStrength;

    if (totalHOffset === 0 && vOffset === 0) {
      return image;
    }

    // Create shifted image
    const result = new ImageData(image.width, image.height);
    const src = image.data;
    const dst = result.data;

    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const srcX = Math.round(x - totalHOffset);
        const srcY = Math.round(y - vOffset);

        if (srcX >= 0 && srcX < image.width && srcY >= 0 && srcY < image.height) {
          const srcIdx = (srcY * image.width + srcX) * 4;
          const dstIdx = (y * image.width + x) * 4;

          dst[dstIdx] = src[srcIdx];
          dst[dstIdx + 1] = src[srcIdx + 1];
          dst[dstIdx + 2] = src[srcIdx + 2];
          dst[dstIdx + 3] = src[srcIdx + 3];
        }
      }
    }

    return result;
  }

  private applyFloatingWindow(image: ImageData, eye: 'left' | 'right'): ImageData {
    const leftAdj = this.getParameter('leftWindowAdjust');
    const rightAdj = this.getParameter('rightWindowAdjust');
    const topAdj = this.getParameter('topWindowAdjust');
    const bottomAdj = this.getParameter('bottomWindowAdjust');

    const result = new ImageData(
      new Uint8ClampedArray(image.data),
      image.width,
      image.height
    );

    // Apply window masking based on eye
    const windowLeft = eye === 'left' ? leftAdj : rightAdj;
    const windowRight = eye === 'left' ? rightAdj : leftAdj;

    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        // Check if pixel is in the floating window region
        const inLeftWindow = x < windowLeft;
        const inRightWindow = x > image.width - windowRight;
        const inTopWindow = y < topAdj;
        const inBottomWindow = y > image.height - bottomAdj;

        if (inLeftWindow || inRightWindow || inTopWindow || inBottomWindow) {
          const idx = (y * image.width + x) * 4;
          result.data[idx + 3] = 0; // Make transparent
        }
      }
    }

    return result;
  }

  private applyDepthGrading(image: ImageData, depthMap: ImageData): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(image.data),
      image.width,
      image.height
    );

    const falloffStart = this.getParameter('depthFalloffStart');
    const falloffEnd = this.getParameter('depthFalloffEnd');
    const nearColor = this.getParameter('nearColorShift');
    const farColor = this.getParameter('farColorShift');

    for (let i = 0; i < image.width * image.height; i++) {
      const idx = i * 4;
      
      // Get depth value (assuming grayscale depth map)
      const depth = depthMap.data[idx] / 255;
      
      // Calculate interpolation factor
      let t = (depth - falloffStart) / (falloffEnd - falloffStart);
      t = Math.max(0, Math.min(1, t));

      // Interpolate color shift
      const colorShift = {
        r: nearColor.r + (farColor.r - nearColor.r) * t,
        g: nearColor.g + (farColor.g - nearColor.g) * t,
        b: nearColor.b + (farColor.b - nearColor.b) * t
      };

      // Apply color shift
      result.data[idx] = Math.min(255, result.data[idx] * colorShift.r);
      result.data[idx + 1] = Math.min(255, result.data[idx + 1] * colorShift.g);
      result.data[idx + 2] = Math.min(255, result.data[idx + 2] * colorShift.b);
    }

    return result;
  }

  private createSideBySide(left: ImageData, right: ImageData, halfSize: boolean): ImageData {
    const srcWidth = left.width;
    const srcHeight = left.height;
    
    let outWidth: number, outHeight: number;
    let eyeWidth: number;

    if (halfSize) {
      // Half-width side-by-side (e.g., 3840x1080 for HD 3D TV)
      outWidth = srcWidth;
      outHeight = srcHeight;
      eyeWidth = srcWidth / 2;
    } else {
      // Full side-by-side (e.g., 3840x1080)
      outWidth = srcWidth * 2;
      outHeight = srcHeight;
      eyeWidth = srcWidth;
    }

    const result = new ImageData(outWidth, outHeight);

    // Draw left eye
    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const srcIdx = (y * srcWidth + x) * 4;
        const dstX = halfSize ? Math.floor(x / 2) : x;
        const dstIdx = (y * outWidth + dstX) * 4;

        result.data[dstIdx] = left.data[srcIdx];
        result.data[dstIdx + 1] = left.data[srcIdx + 1];
        result.data[dstIdx + 2] = left.data[srcIdx + 2];
        result.data[dstIdx + 3] = left.data[srcIdx + 3];
      }
    }

    // Draw right eye
    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const srcIdx = (y * srcWidth + x) * 4;
        const dstX = halfSize ? Math.floor(x / 2) + eyeWidth : x + eyeWidth;
        const dstIdx = (y * outWidth + dstX) * 4;

        result.data[dstIdx] = right.data[srcIdx];
        result.data[dstIdx + 1] = right.data[srcIdx + 1];
        result.data[dstIdx + 2] = right.data[srcIdx + 2];
        result.data[dstIdx + 3] = right.data[srcIdx + 3];
      }
    }

    return result;
  }

  private createTopBottom(left: ImageData, right: ImageData, halfSize: boolean): ImageData {
    const srcWidth = left.width;
    const srcHeight = left.height;

    let outWidth: number, outHeight: number;
    let eyeHeight: number;

    if (halfSize) {
      outWidth = srcWidth;
      outHeight = srcHeight;
      eyeHeight = srcHeight / 2;
    } else {
      outWidth = srcWidth;
      outHeight = srcHeight * 2;
      eyeHeight = srcHeight;
    }

    const result = new ImageData(outWidth, outHeight);

    // Draw top (left eye)
    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const srcIdx = (y * srcWidth + x) * 4;
        const dstY = halfSize ? Math.floor(y / 2) : y;
        const dstIdx = (dstY * outWidth + x) * 4;

        result.data[dstIdx] = left.data[srcIdx];
        result.data[dstIdx + 1] = left.data[srcIdx + 1];
        result.data[dstIdx + 2] = left.data[srcIdx + 2];
        result.data[dstIdx + 3] = left.data[srcIdx + 3];
      }
    }

    // Draw bottom (right eye)
    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const srcIdx = (y * srcWidth + x) * 4;
        const dstY = halfSize ? Math.floor(y / 2) + eyeHeight : y + eyeHeight;
        const dstIdx = (dstY * outWidth + x) * 4;

        result.data[dstIdx] = right.data[srcIdx];
        result.data[dstIdx + 1] = right.data[srcIdx + 1];
        result.data[dstIdx + 2] = right.data[srcIdx + 2];
        result.data[dstIdx + 3] = right.data[srcIdx + 3];
      }
    }

    return result;
  }

  private createAnaglyph(left: ImageData, right: ImageData): ImageData {
    const mode = this.getParameter('anaglyphMode');
    const saturation = this.getParameter('anaglyphSaturation');
    const result = new ImageData(left.width, left.height);

    for (let i = 0; i < left.width * left.height; i++) {
      const idx = i * 4;
      
      const lR = left.data[idx];
      const lG = left.data[idx + 1];
      const lB = left.data[idx + 2];
      const rR = right.data[idx];
      const rG = right.data[idx + 1];
      const rB = right.data[idx + 2];

      let outR: number, outG: number, outB: number;

      switch (mode) {
        case 'red-cyan':
          outR = lR;
          outG = rG;
          outB = rB;
          break;
        case 'green-magenta':
          outR = rR;
          outG = lG;
          outB = rB;
          break;
        case 'amber-blue':
          outR = lR;
          outG = lG;
          outB = rB;
          break;
        case 'true-anaglyph': {
          // True anaglyph uses gray left image
          const grayL = 0.299 * lR + 0.587 * lG + 0.114 * lB;
          outR = grayL;
          outG = rG;
          outB = rB;
          break;
        }
        case 'gray-anaglyph': {
          // Both eyes converted to gray
          const grayLeft = 0.299 * lR + 0.587 * lG + 0.114 * lB;
          const grayRight = 0.299 * rR + 0.587 * rG + 0.114 * rB;
          outR = grayLeft;
          outG = grayRight;
          outB = grayRight;
          break;
        }
        case 'dubois':
        case 'optimized':
          // Dubois optimized anaglyph using pre-defined coefficients
          outR = Math.max(0, Math.min(255,
            DUBOIS_RED_CYAN.leftR[0] * lR + DUBOIS_RED_CYAN.leftR[1] * lG + DUBOIS_RED_CYAN.leftR[2] * lB +
            DUBOIS_RED_CYAN.rightR[0] * rR + DUBOIS_RED_CYAN.rightR[1] * rG + DUBOIS_RED_CYAN.rightR[2] * rB
          ));
          outG = Math.max(0, Math.min(255,
            DUBOIS_RED_CYAN.leftG[0] * lR + DUBOIS_RED_CYAN.leftG[1] * lG + DUBOIS_RED_CYAN.leftG[2] * lB +
            DUBOIS_RED_CYAN.rightG[0] * rR + DUBOIS_RED_CYAN.rightG[1] * rG + DUBOIS_RED_CYAN.rightG[2] * rB
          ));
          outB = Math.max(0, Math.min(255,
            DUBOIS_RED_CYAN.leftB[0] * lR + DUBOIS_RED_CYAN.leftB[1] * lG + DUBOIS_RED_CYAN.leftB[2] * lB +
            DUBOIS_RED_CYAN.rightB[0] * rR + DUBOIS_RED_CYAN.rightB[1] * rG + DUBOIS_RED_CYAN.rightB[2] * rB
          ));
          break;
        default:
          outR = lR;
          outG = rG;
          outB = rB;
      }

      // Apply saturation adjustment
      if (saturation !== 1.0) {
        const gray = 0.299 * outR + 0.587 * outG + 0.114 * outB;
        outR = gray + saturation * (outR - gray);
        outG = gray + saturation * (outG - gray);
        outB = gray + saturation * (outB - gray);
      }

      result.data[idx] = Math.max(0, Math.min(255, outR));
      result.data[idx + 1] = Math.max(0, Math.min(255, outG));
      result.data[idx + 2] = Math.max(0, Math.min(255, outB));
      result.data[idx + 3] = 255;
    }

    return result;
  }

  private createInterlaced(left: ImageData, right: ImageData): ImageData {
    const result = new ImageData(left.width, left.height);

    for (let y = 0; y < left.height; y++) {
      const source = y % 2 === 0 ? left : right;
      
      for (let x = 0; x < left.width; x++) {
        const idx = (y * left.width + x) * 4;
        result.data[idx] = source.data[idx];
        result.data[idx + 1] = source.data[idx + 1];
        result.data[idx + 2] = source.data[idx + 2];
        result.data[idx + 3] = source.data[idx + 3];
      }
    }

    return result;
  }

  private createCheckerboard(left: ImageData, right: ImageData): ImageData {
    const result = new ImageData(left.width, left.height);

    for (let y = 0; y < left.height; y++) {
      for (let x = 0; x < left.width; x++) {
        const source = (x + y) % 2 === 0 ? left : right;
        const idx = (y * left.width + x) * 4;
        
        result.data[idx] = source.data[idx];
        result.data[idx + 1] = source.data[idx + 1];
        result.data[idx + 2] = source.data[idx + 2];
        result.data[idx + 3] = source.data[idx + 3];
      }
    }

    return result;
  }

  dispose(): void {
    super.dispose();
  }
}
