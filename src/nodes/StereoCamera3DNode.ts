/**
 * StereoCamera3DNode - Stereoscopic 3D camera for VR/3D workflow
 * Version 3.3 - 8K+ & Stereoscopic 3D Support
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export interface StereoEyeData {
  camera: THREE.PerspectiveCamera;
  projectionMatrix: number[];
  viewMatrix: number[];
}

export interface StereoCameraOutput {
  leftEye: StereoEyeData;
  rightEye: StereoEyeData;
  convergencePoint: THREE.Vector3;
  interaxialDistance: number;
  stereoMode: string;
}

export class StereoCamera3DNode extends Node {
  private leftCamera: THREE.PerspectiveCamera | null = null;
  private rightCamera: THREE.PerspectiveCamera | null = null;
  private centerCamera: THREE.PerspectiveCamera | null = null;

  // Industry-standard stereo rig presets
  private readonly stereoPresets: Record<string, { interaxial: number; convergence: number; description: string }> = {
    'Human Vision': { interaxial: 0.065, convergence: 5.0, description: 'Average human interpupillary distance (65mm)' },
    'Cinema Standard': { interaxial: 0.0635, convergence: 10.0, description: 'Standard cinema stereo (63.5mm)' },
    'IMAX 3D': { interaxial: 0.075, convergence: 15.0, description: 'IMAX 3D format (75mm)' },
    'VR Headset': { interaxial: 0.064, convergence: 2.0, description: 'VR HMD standard (64mm)' },
    'Macro Stereo': { interaxial: 0.020, convergence: 0.3, description: 'Close-up macro stereo (20mm)' },
    'Architectural': { interaxial: 0.10, convergence: 20.0, description: 'Wide architectural stereo (100mm)' },
    'Aerial/Landscape': { interaxial: 0.30, convergence: 100.0, description: 'Hyperstereo for landscapes (300mm)' },
    'Miniature': { interaxial: 0.010, convergence: 0.5, description: 'Miniature/model stereo (10mm)' }
  };

  constructor(id: string) {
    super(id, 'StereoCamera3D', 'Stereo Camera 3D');
    this.metadata.category = 'Camera';
    this.metadata.description = 'Stereoscopic 3D camera rig for VR/3D film production with industry-standard presets';
    this.metadata.version = '3.3.0';

    // Inputs
    this.addInput('centerCamera', 'Center Camera', DataType.GEOMETRY_3D);
    this.addInput('convergenceTarget', 'Convergence Target', DataType.VECTOR);

    // Outputs
    this.addOutput('leftCamera', 'Left Eye Camera', DataType.GEOMETRY_3D);
    this.addOutput('rightCamera', 'Right Eye Camera', DataType.GEOMETRY_3D);
    this.addOutput('stereoRig', 'Stereo Rig', DataType.GEOMETRY_3D);
    this.addOutput('stereoData', 'Stereo Data', DataType.ANY);
    this.addOutput('leftProjection', 'Left Projection Matrix', DataType.MATRIX);
    this.addOutput('rightProjection', 'Right Projection Matrix', DataType.MATRIX);

    // Stereo Rig Settings
    this.setParameter('preset', 'Cinema Standard');
    this.setParameter('interaxialDistance', 0.0635); // meters (63.5mm)
    this.setParameter('convergenceDistance', 10.0); // meters
    this.setParameter('usePreset', true);

    // Stereo Mode
    this.setParameter('stereoMode', 'toe-in'); // toe-in, parallel, off-axis
    this.setParameter('eyeSwap', false); // swap left/right for cross-eye viewing

    // Camera Settings (inherits from center or custom)
    this.setParameter('fov', 60);
    this.setParameter('aspectRatio', 16 / 9);
    this.setParameter('nearClip', 0.1);
    this.setParameter('farClip', 10000);
    this.setParameter('useInputCamera', true);

    // Position & Orientation (when not using input camera)
    this.setParameter('position', { x: 0, y: 1.6, z: 5 });
    this.setParameter('rotation', { x: 0, y: 0, z: 0 });
    this.setParameter('lookAt', { x: 0, y: 1, z: 0 });
    this.setParameter('useLookAt', false);

    // Advanced Stereo Controls
    this.setParameter('toeInAngle', 'auto'); // auto calculates from convergence
    this.setParameter('horizontalImageTranslation', 0); // HIT for off-axis
    this.setParameter('verticalImageTranslation', 0);
    this.setParameter('zeroParallaxPlane', 'convergence'); // convergence, screen, custom

    // Output Format
    this.setParameter('outputFormat', 'separate'); // separate, side-by-side, top-bottom, anaglyph
    this.setParameter('anaglyphMode', 'red-cyan'); // red-cyan, green-magenta, amber-blue, dubois
    this.setParameter('halfWidth', false); // half-width side-by-side for 3D TVs

    // Depth Budget (stereo comfort)
    this.setParameter('maxPositiveParallax', 0.03); // 3% screen width max behind screen
    this.setParameter('maxNegativeParallax', -0.02); // 2% screen width max in front
    this.setParameter('comfortZoneWarning', true);

    // Resolution Presets (8K+ support)
    this.setParameter('resolution', 'UHD'); // HD, 2K, UHD, 4K, 6K, 8K, 12K, 16K
    this.setParameter('customResolution', { width: 3840, height: 2160 });
  }

  async process(): Promise<void> {
    // Get stereo parameters
    const usePreset = this.getParameter('usePreset');
    let interaxial = this.getParameter('interaxialDistance');
    let convergence = this.getParameter('convergenceDistance');

    if (usePreset) {
      const preset = this.stereoPresets[this.getParameter('preset')];
      if (preset) {
        interaxial = preset.interaxial;
        convergence = preset.convergence;
      }
    }

    const stereoMode = this.getParameter('stereoMode');
    const eyeSwap = this.getParameter('eyeSwap');

    // Get base camera settings
    const inputCamera = this.inputs.get('centerCamera')?.value as THREE.PerspectiveCamera | undefined;
    const useInputCamera = this.getParameter('useInputCamera') && inputCamera;

    let fov = this.getParameter('fov');
    let aspectRatio = this.getParameter('aspectRatio');
    const nearClip = this.getParameter('nearClip');
    const farClip = this.getParameter('farClip');
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();

    if (useInputCamera && inputCamera) {
      fov = inputCamera.fov;
      aspectRatio = inputCamera.aspect;
      position.copy(inputCamera.position);
      quaternion.setFromRotationMatrix(inputCamera.matrixWorld);
      rotation.setFromQuaternion(quaternion);
    } else {
      const pos = this.getParameter('position');
      position.set(pos.x, pos.y, pos.z);
      const rot = this.getParameter('rotation');
      rotation.set(
        rot.x * Math.PI / 180,
        rot.y * Math.PI / 180,
        rot.z * Math.PI / 180
      );
      quaternion.setFromEuler(rotation);
    }

    // Create center reference camera
    this.centerCamera = new THREE.PerspectiveCamera(fov, aspectRatio, nearClip, farClip);
    this.centerCamera.position.copy(position);
    this.centerCamera.quaternion.copy(quaternion);
    this.centerCamera.updateMatrixWorld();

    // Calculate camera directions
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

    // Calculate eye positions
    const halfInteraxial = interaxial / 2;
    const leftEyeOffset = eyeSwap ? halfInteraxial : -halfInteraxial;
    const rightEyeOffset = eyeSwap ? -halfInteraxial : halfInteraxial;

    const leftPosition = position.clone().add(right.clone().multiplyScalar(leftEyeOffset));
    const rightPosition = position.clone().add(right.clone().multiplyScalar(rightEyeOffset));

    // Create eye cameras
    this.leftCamera = new THREE.PerspectiveCamera(fov, aspectRatio, nearClip, farClip);
    this.rightCamera = new THREE.PerspectiveCamera(fov, aspectRatio, nearClip, farClip);

    this.leftCamera.position.copy(leftPosition);
    this.rightCamera.position.copy(rightPosition);

    // Apply stereo mode
    switch (stereoMode) {
      case 'toe-in': {
        // Both cameras converge on the convergence point
        const convergencePoint = position.clone().add(forward.clone().multiplyScalar(convergence));
        this.leftCamera.lookAt(convergencePoint);
        this.rightCamera.lookAt(convergencePoint);
        break;
      }
      case 'parallel': {
        // Cameras remain parallel (no toe-in)
        this.leftCamera.quaternion.copy(quaternion);
        this.rightCamera.quaternion.copy(quaternion);
        break;
      }
      case 'off-axis': {
        // Off-axis projection for proper stereo without keystoning
        this.leftCamera.quaternion.copy(quaternion);
        this.rightCamera.quaternion.copy(quaternion);

        // Calculate frustum shift for off-axis projection
        const horizontalShift = this.calculateOffAxisShift(halfInteraxial, convergence, fov, aspectRatio);
        const hit = this.getParameter('horizontalImageTranslation');

        // Get resolution from preset for proper 8K+ support
        const resolution = this.getResolutionFromPreset(this.getParameter('resolution'));
        const resWidth = resolution.width;
        const resHeight = resolution.height;

        // Apply frustum shift via film offset
        this.leftCamera.setViewOffset(
          resWidth, resHeight,
          (horizontalShift + hit) * resWidth, 0,
          resWidth, resHeight
        );
        this.rightCamera.setViewOffset(
          resWidth, resHeight,
          (-horizontalShift + hit) * resWidth, 0,
          resWidth, resHeight
        );
        break;
      }
    }

    // Update matrices
    this.leftCamera.updateMatrixWorld();
    this.rightCamera.updateMatrixWorld();
    this.leftCamera.updateProjectionMatrix();
    this.rightCamera.updateProjectionMatrix();

    // Calculate convergence point
    const convergencePoint = position.clone().add(forward.clone().multiplyScalar(convergence));

    // Prepare stereo data output
    const stereoData: StereoCameraOutput = {
      leftEye: {
        camera: this.leftCamera,
        projectionMatrix: this.leftCamera.projectionMatrix.toArray(),
        viewMatrix: this.leftCamera.matrixWorldInverse.toArray()
      },
      rightEye: {
        camera: this.rightCamera,
        projectionMatrix: this.rightCamera.projectionMatrix.toArray(),
        viewMatrix: this.rightCamera.matrixWorldInverse.toArray()
      },
      convergencePoint,
      interaxialDistance: interaxial,
      stereoMode
    };

    // Set outputs
    const leftOutput = this.outputs.get('leftCamera');
    if (leftOutput) leftOutput.value = this.leftCamera;

    const rightOutput = this.outputs.get('rightCamera');
    if (rightOutput) rightOutput.value = this.rightCamera;

    const rigOutput = this.outputs.get('stereoRig');
    if (rigOutput) {
      // Create a group containing both cameras for visualization
      const rigGroup = new THREE.Group();
      rigGroup.add(this.leftCamera.clone());
      rigGroup.add(this.rightCamera.clone());
      rigGroup.position.copy(position);
      rigOutput.value = rigGroup;
    }

    const dataOutput = this.outputs.get('stereoData');
    if (dataOutput) dataOutput.value = stereoData;

    const leftProjOutput = this.outputs.get('leftProjection');
    if (leftProjOutput) leftProjOutput.value = stereoData.leftEye.projectionMatrix;

    const rightProjOutput = this.outputs.get('rightProjection');
    if (rightProjOutput) rightProjOutput.value = stereoData.rightEye.projectionMatrix;

    this.dirty = false;
  }

  private calculateOffAxisShift(eyeOffset: number, convergenceDistance: number, fov: number, aspectRatio: number): number {
    // Calculate the horizontal frustum shift needed for off-axis stereo
    const halfFovTan = Math.tan((fov * Math.PI / 180) / 2);
    const halfWidth = halfFovTan * convergenceDistance * aspectRatio;
    return eyeOffset / (2 * halfWidth);
  }

  // Get available presets
  getStereoPresets(): string[] {
    return Object.keys(this.stereoPresets);
  }

  getPresetInfo(presetName: string): { interaxial: number; convergence: number; description: string } | undefined {
    return this.stereoPresets[presetName];
  }

  // Resolution helper
  getResolutionFromPreset(preset: string): { width: number; height: number } {
    const resolutions: Record<string, { width: number; height: number }> = {
      'HD': { width: 1920, height: 1080 },
      '2K': { width: 2048, height: 1080 },
      'UHD': { width: 3840, height: 2160 },
      '4K': { width: 4096, height: 2160 },
      '6K': { width: 6144, height: 3240 },
      '8K': { width: 7680, height: 4320 },
      '8K DCI': { width: 8192, height: 4320 },
      '12K': { width: 12288, height: 6480 },
      '16K': { width: 15360, height: 8640 }
    };
    return resolutions[preset] || resolutions['UHD'];
  }

  dispose(): void {
    this.leftCamera = null;
    this.rightCamera = null;
    this.centerCamera = null;
    super.dispose();
  }
}
