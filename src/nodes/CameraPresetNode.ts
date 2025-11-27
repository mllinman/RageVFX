/**
 * CameraPresetNode - Popular camera presets for VFX matching
 * Supports RED, ARRI, Blackmagic, Sony, Canon, and other popular cinema cameras
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export interface CameraPreset {
  name: string;
  manufacturer: string;
  sensorWidth: number;
  sensorHeight: number;
  sensorDiagonal: number;
  aspectRatio: number;
  resolutions: Array<{ name: string; width: number; height: number }>;
  colorScience: string;
  defaultGamma: string;
  nativeISO: number;
  dynamicRange: number; // stops
  cropFactor: number;
}

// Camera preset database
export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  // RED Cameras
  'red-v-raptor-xl-8k': {
    name: 'RED V-RAPTOR XL 8K VV',
    manufacturer: 'RED',
    sensorWidth: 40.96,
    sensorHeight: 21.60,
    sensorDiagonal: 46.31,
    aspectRatio: 1.896,
    resolutions: [
      { name: '8K FF', width: 8192, height: 4320 },
      { name: '6K FF', width: 6144, height: 3240 },
      { name: '4K FF', width: 4096, height: 2160 }
    ],
    colorScience: 'red-wide-gamut-rgb',
    defaultGamma: 'log3g10',
    nativeISO: 800,
    dynamicRange: 17,
    cropFactor: 0.85
  },
  'red-komodo-6k': {
    name: 'RED KOMODO 6K',
    manufacturer: 'RED',
    sensorWidth: 27.03,
    sensorHeight: 14.26,
    sensorDiagonal: 30.56,
    aspectRatio: 1.896,
    resolutions: [
      { name: '6K', width: 6144, height: 3240 },
      { name: '4K', width: 4096, height: 2160 },
      { name: '2K', width: 2048, height: 1080 }
    ],
    colorScience: 'red-wide-gamut-rgb',
    defaultGamma: 'log3g10',
    nativeISO: 800,
    dynamicRange: 16,
    cropFactor: 1.29
  },
  
  // ARRI Cameras
  'arri-alexa-35': {
    name: 'ARRI ALEXA 35',
    manufacturer: 'ARRI',
    sensorWidth: 27.99,
    sensorHeight: 19.22,
    sensorDiagonal: 33.96,
    aspectRatio: 1.456,
    resolutions: [
      { name: '4.6K', width: 4608, height: 3164 },
      { name: '4K 16:9', width: 4096, height: 2304 },
      { name: '3.2K', width: 3200, height: 2700 }
    ],
    colorScience: 'arri-wide-gamut-4',
    defaultGamma: 'log-c4',
    nativeISO: 800,
    dynamicRange: 17.5,
    cropFactor: 1.25
  },
  'arri-alexa-lf': {
    name: 'ARRI ALEXA LF',
    manufacturer: 'ARRI',
    sensorWidth: 36.70,
    sensorHeight: 25.54,
    sensorDiagonal: 44.71,
    aspectRatio: 1.437,
    resolutions: [
      { name: '4.5K LF OG', width: 4448, height: 3096 },
      { name: '4.5K LF 16:9', width: 4448, height: 2502 },
      { name: 'UHD', width: 3840, height: 2160 }
    ],
    colorScience: 'arri-wide-gamut-3',
    defaultGamma: 'log-c3',
    nativeISO: 800,
    dynamicRange: 14.5,
    cropFactor: 0.95
  },
  'arri-alexa-mini-lf': {
    name: 'ARRI ALEXA Mini LF',
    manufacturer: 'ARRI',
    sensorWidth: 36.70,
    sensorHeight: 25.54,
    sensorDiagonal: 44.71,
    aspectRatio: 1.437,
    resolutions: [
      { name: '4.5K LF OG', width: 4448, height: 3096 },
      { name: '4K 2:1', width: 4096, height: 2048 },
      { name: 'UHD', width: 3840, height: 2160 }
    ],
    colorScience: 'arri-wide-gamut-3',
    defaultGamma: 'log-c3',
    nativeISO: 800,
    dynamicRange: 14.5,
    cropFactor: 0.95
  },
  
  // Blackmagic Cameras
  'bmd-ursa-mini-pro-12k': {
    name: 'Blackmagic URSA Mini Pro 12K',
    manufacturer: 'Blackmagic',
    sensorWidth: 27.03,
    sensorHeight: 14.25,
    sensorDiagonal: 30.56,
    aspectRatio: 1.896,
    resolutions: [
      { name: '12K', width: 12288, height: 6480 },
      { name: '8K', width: 8192, height: 4320 },
      { name: '4K DCI', width: 4096, height: 2160 }
    ],
    colorScience: 'bmd-wide-gamut-gen5',
    defaultGamma: 'bmd-film-gen5',
    nativeISO: 800,
    dynamicRange: 14,
    cropFactor: 1.29
  },
  'bmd-pocket-6k-g2': {
    name: 'Blackmagic Pocket Cinema Camera 6K G2',
    manufacturer: 'Blackmagic',
    sensorWidth: 23.10,
    sensorHeight: 12.99,
    sensorDiagonal: 26.51,
    aspectRatio: 1.778,
    resolutions: [
      { name: '6K', width: 6144, height: 3456 },
      { name: '4K DCI', width: 4096, height: 2160 },
      { name: 'UHD', width: 3840, height: 2160 }
    ],
    colorScience: 'bmd-wide-gamut-gen5',
    defaultGamma: 'bmd-film-gen5',
    nativeISO: 400,
    dynamicRange: 13,
    cropFactor: 1.51
  },
  
  // Sony Cameras
  'sony-venice-2-8k': {
    name: 'Sony VENICE 2 8K',
    manufacturer: 'Sony',
    sensorWidth: 36.00,
    sensorHeight: 24.00,
    sensorDiagonal: 43.27,
    aspectRatio: 1.5,
    resolutions: [
      { name: '8.6K FF', width: 8640, height: 5760 },
      { name: '5.7K 6:5', width: 5674, height: 4730 },
      { name: '4K 2.39:1', width: 4096, height: 1716 }
    ],
    colorScience: 's-gamut3.cine',
    defaultGamma: 's-log3',
    nativeISO: 800,
    dynamicRange: 16,
    cropFactor: 0.97
  },
  'sony-fx6': {
    name: 'Sony FX6',
    manufacturer: 'Sony',
    sensorWidth: 35.70,
    sensorHeight: 18.80,
    sensorDiagonal: 40.35,
    aspectRatio: 1.899,
    resolutions: [
      { name: '4K DCI', width: 4096, height: 2160 },
      { name: 'UHD', width: 3840, height: 2160 },
      { name: 'HD', width: 1920, height: 1080 }
    ],
    colorScience: 's-gamut3.cine',
    defaultGamma: 's-log3',
    nativeISO: 800,
    dynamicRange: 15,
    cropFactor: 0.98
  },
  
  // Canon Cameras
  'canon-c70': {
    name: 'Canon EOS C70',
    manufacturer: 'Canon',
    sensorWidth: 26.20,
    sensorHeight: 13.80,
    sensorDiagonal: 29.62,
    aspectRatio: 1.899,
    resolutions: [
      { name: '4K DCI', width: 4096, height: 2160 },
      { name: 'UHD', width: 3840, height: 2160 },
      { name: 'HD', width: 1920, height: 1080 }
    ],
    colorScience: 'cinema-gamut',
    defaultGamma: 'canon-log3',
    nativeISO: 800,
    dynamicRange: 16,
    cropFactor: 1.33
  },
  'canon-c500-ii': {
    name: 'Canon EOS C500 Mark II',
    manufacturer: 'Canon',
    sensorWidth: 38.10,
    sensorHeight: 20.10,
    sensorDiagonal: 43.08,
    aspectRatio: 1.896,
    resolutions: [
      { name: '5.9K FF', width: 5952, height: 3140 },
      { name: '4K DCI', width: 4096, height: 2160 },
      { name: 'UHD', width: 3840, height: 2160 }
    ],
    colorScience: 'cinema-gamut',
    defaultGamma: 'canon-log3',
    nativeISO: 800,
    dynamicRange: 15,
    cropFactor: 0.92
  }
};

export class CameraPresetNode extends Node {
  private camera: THREE.PerspectiveCamera | null = null;

  constructor(id: string) {
    super(id, 'CameraPreset', 'Camera Preset');
    this.metadata.category = 'Camera';
    this.metadata.description = 'Professional cinema camera presets with accurate sensor specifications';
    this.metadata.version = '2.1.0';
    
    this.addInput('focalLength', 'Focal Length (mm)', DataType.NUMBER);
    this.addOutput('camera', 'Camera', DataType.GEOMETRY_3D);
    this.addOutput('sensorData', 'Sensor Data', DataType.ANY);
    
    // Camera preset selection
    this.setParameter('preset', 'arri-alexa-35');
    this.setParameter('resolution', '4K DCI');
    
    // Lens settings
    this.setParameter('focalLength', 35); // mm
    this.setParameter('aperture', 2.8); // f-stop
    this.setParameter('focusDistance', 3.0); // meters
    
    // Camera position
    this.setParameter('position', { x: 0, y: 1.6, z: 5 });
    this.setParameter('rotation', { x: 0, y: 0, z: 0 });
    this.setParameter('lookAt', { x: 0, y: 1.0, z: 0 });
    
    // Additional settings
    this.setParameter('near', 0.1);
    this.setParameter('far', 1000);
    this.setParameter('overscan', 0); // percentage
  }

  async process(): Promise<void> {
    const preset = CAMERA_PRESETS[this.getParameter('preset')];
    if (!preset) {
      return;
    }
    
    const focalLengthInput = this.inputs.get('focalLength');
    const focalLength = focalLengthInput?.value ?? this.getParameter('focalLength');
    
    const position = this.getParameter('position');
    const rotation = this.getParameter('rotation');
    const lookAt = this.getParameter('lookAt');
    const near = this.getParameter('near');
    const far = this.getParameter('far');
    const resolutionName = this.getParameter('resolution');
    
    // Find resolution
    const resolution = preset.resolutions.find(r => r.name === resolutionName) || preset.resolutions[0];
    
    // Calculate FOV from focal length and sensor size
    const sensorDiagonal = Math.sqrt(preset.sensorWidth * preset.sensorWidth + preset.sensorHeight * preset.sensorHeight);
    const fov = 2 * Math.atan(sensorDiagonal / (2 * focalLength)) * (180 / Math.PI);
    const aspectRatio = resolution.width / resolution.height;
    
    // Create or update camera
    this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.rotation.set(rotation.x * Math.PI / 180, rotation.y * Math.PI / 180, rotation.z * Math.PI / 180);
    
    if (lookAt) {
      this.camera.lookAt(new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z));
    }
    
    // Set camera output
    const cameraOutput = this.outputs.get('camera');
    if (cameraOutput) {
      cameraOutput.value = this.camera;
    }
    
    // Set sensor data output
    const sensorDataOutput = this.outputs.get('sensorData');
    if (sensorDataOutput) {
      sensorDataOutput.value = {
        preset: preset.name,
        manufacturer: preset.manufacturer,
        sensorWidth: preset.sensorWidth,
        sensorHeight: preset.sensorHeight,
        cropFactor: preset.cropFactor,
        resolution,
        fov,
        focalLength,
        aperture: this.getParameter('aperture'),
        colorScience: preset.colorScience,
        gamma: preset.defaultGamma,
        nativeISO: preset.nativeISO,
        dynamicRange: preset.dynamicRange
      };
    }
  }

  /**
   * Get available presets
   */
  static getAvailablePresets(): string[] {
    return Object.keys(CAMERA_PRESETS);
  }

  /**
   * Get preset details
   */
  static getPresetDetails(presetId: string): CameraPreset | undefined {
    return CAMERA_PRESETS[presetId];
  }

  /**
   * Get available resolutions for current preset
   */
  getAvailableResolutions(): Array<{ name: string; width: number; height: number }> {
    const preset = CAMERA_PRESETS[this.getParameter('preset')];
    return preset ? preset.resolutions : [];
  }

  /**
   * Calculate depth of field
   */
  calculateDepthOfField(): { nearFocus: number; farFocus: number; totalDOF: number } {
    const preset = CAMERA_PRESETS[this.getParameter('preset')];
    if (!preset) {
      return { nearFocus: 0, farFocus: Infinity, totalDOF: Infinity };
    }
    
    const focalLength = this.getParameter('focalLength');
    const aperture = this.getParameter('aperture');
    const focusDistance = this.getParameter('focusDistance');
    
    // Circle of confusion (in mm)
    const coc = preset.sensorDiagonal / 1500;
    
    // Hyperfocal distance
    const hyperfocal = (focalLength * focalLength) / (aperture * coc) + focalLength;
    
    // Near and far focus limits
    const nearFocus = (focusDistance * 1000 * (hyperfocal - focalLength)) / 
                      (hyperfocal + focusDistance * 1000 - 2 * focalLength);
    const farFocus = (focusDistance * 1000 * (hyperfocal - focalLength)) / 
                     (hyperfocal - focusDistance * 1000);
    
    return {
      nearFocus: nearFocus / 1000, // Convert back to meters
      farFocus: farFocus > 0 ? farFocus / 1000 : Infinity,
      totalDOF: (farFocus > 0 ? farFocus : Infinity) - nearFocus
    };
  }

  /**
   * Get 35mm equivalent focal length
   */
  get35mmEquivalent(): number {
    const preset = CAMERA_PRESETS[this.getParameter('preset')];
    if (!preset) return 0;
    
    const focalLength = this.getParameter('focalLength');
    // 35mm full frame diagonal is ~43.27mm
    return focalLength * (43.27 / preset.sensorDiagonal);
  }
}
