/**
 * RealWorldCameraNode - Real-world camera creation with lens and sensor settings (3DSMax/Maya-like)
 * Version 3.2 - Camera System
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

interface CameraBody {
  name: string;
  manufacturer: string;
  sensorWidth: number;  // mm
  sensorHeight: number; // mm
  megapixels: number;
  resolutionWidth: number;
  resolutionHeight: number;
  nativeISO: number;
  maxISO: number;
  dynamicRange: number; // stops
  colorScience: string;
}

interface LensProfile {
  name: string;
  manufacturer: string;
  focalLength: number;       // mm
  maxAperture: number;       // f-stop
  minAperture: number;       // f-stop
  imageCircle: number;       // mm
  anamorphicSqueeze: number; // 1.0 for spherical, 2.0 for 2x anamorphic
  distortionK1: number;      // radial distortion coefficient
  distortionK2: number;
  distortionK3: number;
  chromaK1: number;          // chromatic aberration
  chromaK2: number;
  vignetteStrength: number;
  minFocusDistance: number;  // meters
  bladeCount: number;
  bladeCurvature: number;
}

export class RealWorldCameraNode extends Node {
  private camera: THREE.PerspectiveCamera | null = null;
  
  // Built-in camera body presets
  private readonly cameraPresets: Record<string, CameraBody> = {
    'ARRI ALEXA 35': {
      name: 'ARRI ALEXA 35',
      manufacturer: 'ARRI',
      sensorWidth: 28.25,
      sensorHeight: 18.17,
      megapixels: 4.6,
      resolutionWidth: 4608,
      resolutionHeight: 3164,
      nativeISO: 800,
      maxISO: 6400,
      dynamicRange: 17,
      colorScience: 'ARRI Wide Gamut 4'
    },
    'ARRI ALEXA LF': {
      name: 'ARRI ALEXA LF',
      manufacturer: 'ARRI',
      sensorWidth: 36.70,
      sensorHeight: 25.54,
      megapixels: 12.5,
      resolutionWidth: 4448,
      resolutionHeight: 3096,
      nativeISO: 800,
      maxISO: 25600,
      dynamicRange: 14.5,
      colorScience: 'ARRI Wide Gamut 3'
    },
    'ARRI ALEXA Mini LF': {
      name: 'ARRI ALEXA Mini LF',
      manufacturer: 'ARRI',
      sensorWidth: 36.70,
      sensorHeight: 25.54,
      megapixels: 12.5,
      resolutionWidth: 4448,
      resolutionHeight: 3096,
      nativeISO: 800,
      maxISO: 25600,
      dynamicRange: 14.5,
      colorScience: 'ARRI Wide Gamut 3'
    },
    'RED V-RAPTOR XL 8K': {
      name: 'RED V-RAPTOR XL 8K',
      manufacturer: 'RED',
      sensorWidth: 40.96,
      sensorHeight: 21.60,
      megapixels: 35.4,
      resolutionWidth: 8192,
      resolutionHeight: 4320,
      nativeISO: 800,
      maxISO: 25600,
      dynamicRange: 17,
      colorScience: 'IPP2'
    },
    'RED KOMODO 6K': {
      name: 'RED KOMODO 6K',
      manufacturer: 'RED',
      sensorWidth: 27.03,
      sensorHeight: 14.26,
      megapixels: 19.9,
      resolutionWidth: 6144,
      resolutionHeight: 3240,
      nativeISO: 800,
      maxISO: 25600,
      dynamicRange: 16,
      colorScience: 'IPP2'
    },
    'Sony VENICE 2 8K': {
      name: 'Sony VENICE 2 8K',
      manufacturer: 'Sony',
      sensorWidth: 36.20,
      sensorHeight: 24.10,
      megapixels: 8.6,
      resolutionWidth: 8640,
      resolutionHeight: 5760,
      nativeISO: 800,
      maxISO: 12800,
      dynamicRange: 16,
      colorScience: 'S-Gamut3'
    },
    'Sony FX6': {
      name: 'Sony FX6',
      manufacturer: 'Sony',
      sensorWidth: 35.70,
      sensorHeight: 18.80,
      megapixels: 10.2,
      resolutionWidth: 4264,
      resolutionHeight: 2408,
      nativeISO: 800,
      maxISO: 409600,
      dynamicRange: 15,
      colorScience: 'S-Gamut3'
    },
    'Blackmagic URSA Mini Pro 12K': {
      name: 'Blackmagic URSA Mini Pro 12K',
      manufacturer: 'Blackmagic Design',
      sensorWidth: 26.85,
      sensorHeight: 14.17,
      megapixels: 80.0,
      resolutionWidth: 12288,
      resolutionHeight: 6480,
      nativeISO: 800,
      maxISO: 25600,
      dynamicRange: 14,
      colorScience: 'Blackmagic Gen 5'
    },
    'Canon EOS C70': {
      name: 'Canon EOS C70',
      manufacturer: 'Canon',
      sensorWidth: 26.20,
      sensorHeight: 13.80,
      megapixels: 8.85,
      resolutionWidth: 4096,
      resolutionHeight: 2160,
      nativeISO: 800,
      maxISO: 102400,
      dynamicRange: 16.5,
      colorScience: 'Cinema Gamut'
    },
    'Canon EOS C500 Mark II': {
      name: 'Canon EOS C500 Mark II',
      manufacturer: 'Canon',
      sensorWidth: 38.10,
      sensorHeight: 20.10,
      megapixels: 18.69,
      resolutionWidth: 5952,
      resolutionHeight: 3140,
      nativeISO: 800,
      maxISO: 102400,
      dynamicRange: 15,
      colorScience: 'Cinema Gamut'
    },
    'Full Frame 35mm': {
      name: 'Full Frame 35mm',
      manufacturer: 'Generic',
      sensorWidth: 36.00,
      sensorHeight: 24.00,
      megapixels: 24.0,
      resolutionWidth: 6000,
      resolutionHeight: 4000,
      nativeISO: 100,
      maxISO: 51200,
      dynamicRange: 14,
      colorScience: 'sRGB'
    },
    'Super 35mm': {
      name: 'Super 35mm',
      manufacturer: 'Generic',
      sensorWidth: 24.89,
      sensorHeight: 18.66,
      megapixels: 12.0,
      resolutionWidth: 4096,
      resolutionHeight: 3072,
      nativeISO: 800,
      maxISO: 12800,
      dynamicRange: 13,
      colorScience: 'sRGB'
    },
    'APS-C': {
      name: 'APS-C',
      manufacturer: 'Generic',
      sensorWidth: 23.60,
      sensorHeight: 15.60,
      megapixels: 24.0,
      resolutionWidth: 6000,
      resolutionHeight: 4000,
      nativeISO: 100,
      maxISO: 25600,
      dynamicRange: 13,
      colorScience: 'sRGB'
    },
    'Micro Four Thirds': {
      name: 'Micro Four Thirds',
      manufacturer: 'Generic',
      sensorWidth: 17.30,
      sensorHeight: 13.00,
      megapixels: 20.0,
      resolutionWidth: 5184,
      resolutionHeight: 3888,
      nativeISO: 200,
      maxISO: 25600,
      dynamicRange: 12,
      colorScience: 'sRGB'
    }
  };
  
  // Built-in lens presets
  private readonly lensPresets: Record<string, LensProfile> = {
    'ARRI Signature Prime 35mm': {
      name: 'ARRI Signature Prime 35mm',
      manufacturer: 'ARRI',
      focalLength: 35,
      maxAperture: 1.8,
      minAperture: 22,
      imageCircle: 46,
      anamorphicSqueeze: 1.0,
      distortionK1: -0.005,
      distortionK2: 0.001,
      distortionK3: 0,
      chromaK1: 0.0002,
      chromaK2: 0.0001,
      vignetteStrength: 0.1,
      minFocusDistance: 0.35,
      bladeCount: 11,
      bladeCurvature: 0.8
    },
    'ARRI Signature Prime 50mm': {
      name: 'ARRI Signature Prime 50mm',
      manufacturer: 'ARRI',
      focalLength: 50,
      maxAperture: 1.8,
      minAperture: 22,
      imageCircle: 46,
      anamorphicSqueeze: 1.0,
      distortionK1: -0.002,
      distortionK2: 0.0005,
      distortionK3: 0,
      chromaK1: 0.00015,
      chromaK2: 0.00008,
      vignetteStrength: 0.08,
      minFocusDistance: 0.45,
      bladeCount: 11,
      bladeCurvature: 0.8
    },
    'Zeiss Master Prime 25mm': {
      name: 'Zeiss Master Prime 25mm',
      manufacturer: 'Zeiss',
      focalLength: 25,
      maxAperture: 1.3,
      minAperture: 16,
      imageCircle: 43.3,
      anamorphicSqueeze: 1.0,
      distortionK1: -0.008,
      distortionK2: 0.002,
      distortionK3: 0,
      chromaK1: 0.0001,
      chromaK2: 0.00005,
      vignetteStrength: 0.12,
      minFocusDistance: 0.26,
      bladeCount: 9,
      bladeCurvature: 0.9
    },
    'Zeiss Master Prime 75mm': {
      name: 'Zeiss Master Prime 75mm',
      manufacturer: 'Zeiss',
      focalLength: 75,
      maxAperture: 1.3,
      minAperture: 16,
      imageCircle: 43.3,
      anamorphicSqueeze: 1.0,
      distortionK1: -0.001,
      distortionK2: 0.0002,
      distortionK3: 0,
      chromaK1: 0.0001,
      chromaK2: 0.00005,
      vignetteStrength: 0.06,
      minFocusDistance: 0.60,
      bladeCount: 9,
      bladeCurvature: 0.9
    },
    'Cooke Anamorphic 40mm': {
      name: 'Cooke Anamorphic 40mm',
      manufacturer: 'Cooke',
      focalLength: 40,
      maxAperture: 2.3,
      minAperture: 22,
      imageCircle: 31.1,
      anamorphicSqueeze: 2.0,
      distortionK1: -0.015,
      distortionK2: 0.005,
      distortionK3: 0.001,
      chromaK1: 0.0003,
      chromaK2: 0.0002,
      vignetteStrength: 0.2,
      minFocusDistance: 0.75,
      bladeCount: 8,
      bladeCurvature: 0.5
    },
    'Panavision Primo 70mm': {
      name: 'Panavision Primo 70mm',
      manufacturer: 'Panavision',
      focalLength: 70,
      maxAperture: 2.0,
      minAperture: 22,
      imageCircle: 46.3,
      anamorphicSqueeze: 1.0,
      distortionK1: -0.001,
      distortionK2: 0.0003,
      distortionK3: 0,
      chromaK1: 0.00008,
      chromaK2: 0.00004,
      vignetteStrength: 0.05,
      minFocusDistance: 0.75,
      bladeCount: 9,
      bladeCurvature: 0.85
    },
    'Atlas Orion 1.33x 40mm': {
      name: 'Atlas Orion 1.33x 40mm',
      manufacturer: 'Atlas',
      focalLength: 40,
      maxAperture: 2.0,
      minAperture: 22,
      imageCircle: 46.5,
      anamorphicSqueeze: 1.33,
      distortionK1: -0.008,
      distortionK2: 0.003,
      distortionK3: 0.0005,
      chromaK1: 0.00025,
      chromaK2: 0.00015,
      vignetteStrength: 0.15,
      minFocusDistance: 0.6,
      bladeCount: 10,
      bladeCurvature: 0.7
    },
    'Generic Prime 24mm': {
      name: 'Generic Prime 24mm',
      manufacturer: 'Generic',
      focalLength: 24,
      maxAperture: 1.4,
      minAperture: 22,
      imageCircle: 43.3,
      anamorphicSqueeze: 1.0,
      distortionK1: -0.01,
      distortionK2: 0.003,
      distortionK3: 0,
      chromaK1: 0.0003,
      chromaK2: 0.0002,
      vignetteStrength: 0.15,
      minFocusDistance: 0.25,
      bladeCount: 9,
      bladeCurvature: 0.7
    },
    'Generic Prime 85mm': {
      name: 'Generic Prime 85mm',
      manufacturer: 'Generic',
      focalLength: 85,
      maxAperture: 1.4,
      minAperture: 22,
      imageCircle: 43.3,
      anamorphicSqueeze: 1.0,
      distortionK1: -0.0005,
      distortionK2: 0.0001,
      distortionK3: 0,
      chromaK1: 0.0001,
      chromaK2: 0.00005,
      vignetteStrength: 0.08,
      minFocusDistance: 0.85,
      bladeCount: 9,
      bladeCurvature: 0.7
    },
    'Generic Zoom 24-70mm': {
      name: 'Generic Zoom 24-70mm',
      manufacturer: 'Generic',
      focalLength: 50,
      maxAperture: 2.8,
      minAperture: 22,
      imageCircle: 43.3,
      anamorphicSqueeze: 1.0,
      distortionK1: -0.006,
      distortionK2: 0.002,
      distortionK3: 0.0005,
      chromaK1: 0.0002,
      chromaK2: 0.0001,
      vignetteStrength: 0.12,
      minFocusDistance: 0.38,
      bladeCount: 7,
      bladeCurvature: 0.6
    }
  };

  constructor(id: string) {
    super(id, 'RealWorldCamera', 'Real World Camera');
    this.metadata.category = 'Camera';
    this.metadata.description = 'Create camera based on real-world camera bodies, lenses, and settings (3DSMax/Maya-like)';
    this.metadata.version = '3.2.0';
    
    // Outputs
    this.addOutput('camera', 'Camera', DataType.GEOMETRY_3D);
    this.addOutput('cameraData', 'Camera Data', DataType.ANY);
    this.addOutput('projectionMatrix', 'Projection Matrix', DataType.MATRIX);
    this.addOutput('viewMatrix', 'View Matrix', DataType.MATRIX);
    this.addOutput('frustum', 'Frustum Planes', DataType.ANY);
    
    // Camera Body Settings
    this.setParameter('cameraPreset', 'ARRI ALEXA 35');
    this.setParameter('customSensorWidth', 36.0);
    this.setParameter('customSensorHeight', 24.0);
    this.setParameter('useCustomSensor', false);
    
    // Lens Settings
    this.setParameter('lensPreset', 'ARRI Signature Prime 35mm');
    this.setParameter('customFocalLength', 50);
    this.setParameter('customAperture', 2.8);
    this.setParameter('useCustomLens', false);
    
    // Aperture & Exposure
    this.setParameter('aperture', 2.8);
    this.setParameter('shutterAngle', 180); // degrees
    this.setParameter('shutterSpeed', 1/48); // seconds
    this.setParameter('iso', 800);
    this.setParameter('exposureCompensation', 0); // stops
    
    // Focus Settings
    this.setParameter('focusDistance', 3.0); // meters
    this.setParameter('autofocus', false);
    this.setParameter('focusTracking', false);
    this.setParameter('focusPeaking', false);
    this.setParameter('hyperfocalDistance', 'auto'); // auto or custom value
    
    // Depth of Field
    this.setParameter('enableDOF', true);
    this.setParameter('dofQuality', 'high'); // low, medium, high, ultra
    this.setParameter('bokehShape', 'circular'); // circular, polygonal, anamorphic
    this.setParameter('bokehRotation', 0);
    this.setParameter('cateyeAmount', 0);
    this.setParameter('sphericalAberration', 0);
    
    // Position & Orientation
    this.setParameter('position', { x: 0, y: 1.6, z: 5 }); // eye level
    this.setParameter('rotation', { x: 0, y: 0, z: 0 }); // Euler angles in degrees
    this.setParameter('lookAt', { x: 0, y: 1, z: 0 });
    this.setParameter('useLookAt', false);
    this.setParameter('up', { x: 0, y: 1, z: 0 });
    
    // Physical Camera Motion
    this.setParameter('handHeldStrength', 0);
    this.setParameter('breathingAmount', 0);
    this.setParameter('stabilization', 'none'); // none, 2-axis, 3-axis, 5-axis
    
    // Clipping Planes
    this.setParameter('nearClip', 0.1);
    this.setParameter('farClip', 10000);
    
    // Lens Effects
    this.setParameter('enableDistortion', true);
    this.setParameter('distortionAmount', 1.0);
    this.setParameter('enableVignette', true);
    this.setParameter('vignetteAmount', 1.0);
    this.setParameter('enableChromaticAberration', true);
    this.setParameter('chromaticAberrationAmount', 1.0);
    this.setParameter('enableLensFlare', false);
    this.setParameter('enableBreathing', false);
    this.setParameter('breathingStrength', 0.5);
    
    // Film Back Settings
    this.setParameter('filmGate', 'auto'); // auto, 16:9, 2.39:1, 1.85:1, 4:3, 1:1
    this.setParameter('filmOffset', { x: 0, y: 0 }); // mm
    this.setParameter('filmRoll', 0); // degrees
    
    // Output Settings
    this.setParameter('outputResolution', 'native'); // native, 4K, 2K, HD, custom
    this.setParameter('customResolution', { width: 1920, height: 1080 });
    this.setParameter('pixelAspectRatio', 1.0);
  }

  async process(): Promise<void> {
    // Get camera body settings
    const cameraBody = this.getCameraBody();
    
    // Get lens settings
    const lens = this.getLensProfile();
    
    // Calculate effective focal length with crop factor
    const cropFactor = 36 / cameraBody.sensorWidth;
    const effectiveFocalLength = lens.focalLength;
    
    // Calculate field of view
    const fov = this.calculateFOV(cameraBody, lens);
    
    // Calculate aspect ratio
    const aspectRatio = this.calculateAspectRatio(cameraBody);
    
    // Get position and orientation
    const position = this.getParameter('position');
    const rotation = this.getParameter('rotation');
    const lookAt = this.getParameter('lookAt');
    const useLookAt = this.getParameter('useLookAt');
    const nearClip = this.getParameter('nearClip');
    const farClip = this.getParameter('farClip');
    
    // Create Three.js camera
    this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, nearClip, farClip);
    
    // Set position
    this.camera.position.set(position.x, position.y, position.z);
    
    // Set rotation or look-at
    if (useLookAt) {
      this.camera.lookAt(new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z));
    } else {
      this.camera.rotation.set(
        rotation.x * Math.PI / 180,
        rotation.y * Math.PI / 180,
        rotation.z * Math.PI / 180
      );
    }
    
    // Apply film offset
    const filmOffset = this.getParameter('filmOffset');
    if (filmOffset.x !== 0 || filmOffset.y !== 0) {
      this.camera.setViewOffset(
        cameraBody.resolutionWidth,
        cameraBody.resolutionHeight,
        filmOffset.x * cameraBody.resolutionWidth / cameraBody.sensorWidth,
        filmOffset.y * cameraBody.resolutionHeight / cameraBody.sensorHeight,
        cameraBody.resolutionWidth,
        cameraBody.resolutionHeight
      );
    }
    
    // Calculate depth of field parameters
    const dofParams = this.calculateDOF(cameraBody, lens);
    
    // Calculate exposure value
    const exposureValue = this.calculateExposure();
    
    // Build camera data output
    const cameraData = {
      // Physical camera properties
      body: cameraBody,
      lens: lens,
      
      // Computed values
      fov,
      aspectRatio,
      cropFactor,
      effectiveFocalLength,
      
      // Exposure
      aperture: this.getParameter('aperture'),
      shutterAngle: this.getParameter('shutterAngle'),
      shutterSpeed: this.getParameter('shutterSpeed'),
      iso: this.getParameter('iso'),
      exposureValue,
      
      // Depth of field
      focusDistance: this.getParameter('focusDistance'),
      nearFocus: dofParams.nearFocus,
      farFocus: dofParams.farFocus,
      hyperfocalDistance: dofParams.hyperfocalDistance,
      circleOfConfusion: dofParams.circleOfConfusion,
      
      // Position
      position,
      rotation,
      lookAt,
      
      // Matrices (as arrays for output)
      projectionMatrix: this.camera.projectionMatrix.toArray(),
      viewMatrix: this.camera.matrixWorldInverse.toArray(),
      
      // Frustum corners
      frustum: this.calculateFrustumCorners()
    };
    
    // Set outputs
    const cameraOutput = this.outputs.get('camera');
    if (cameraOutput) {
      cameraOutput.value = this.camera;
    }
    
    const dataOutput = this.outputs.get('cameraData');
    if (dataOutput) {
      dataOutput.value = cameraData;
    }
    
    const projOutput = this.outputs.get('projectionMatrix');
    if (projOutput) {
      projOutput.value = cameraData.projectionMatrix;
    }
    
    const viewOutput = this.outputs.get('viewMatrix');
    if (viewOutput) {
      viewOutput.value = cameraData.viewMatrix;
    }
    
    const frustumOutput = this.outputs.get('frustum');
    if (frustumOutput) {
      frustumOutput.value = cameraData.frustum;
    }
  }

  private getCameraBody(): CameraBody {
    if (this.getParameter('useCustomSensor')) {
      return {
        name: 'Custom',
        manufacturer: 'Custom',
        sensorWidth: this.getParameter('customSensorWidth'),
        sensorHeight: this.getParameter('customSensorHeight'),
        megapixels: 0,
        resolutionWidth: 4096,
        resolutionHeight: 2160,
        nativeISO: 800,
        maxISO: 12800,
        dynamicRange: 14,
        colorScience: 'sRGB'
      };
    }
    
    const preset = this.getParameter('cameraPreset');
    return this.cameraPresets[preset] || this.cameraPresets['Full Frame 35mm'];
  }

  private getLensProfile(): LensProfile {
    if (this.getParameter('useCustomLens')) {
      return {
        name: 'Custom',
        manufacturer: 'Custom',
        focalLength: this.getParameter('customFocalLength'),
        maxAperture: this.getParameter('customAperture'),
        minAperture: 22,
        imageCircle: 43.3,
        anamorphicSqueeze: 1.0,
        distortionK1: 0,
        distortionK2: 0,
        distortionK3: 0,
        chromaK1: 0,
        chromaK2: 0,
        vignetteStrength: 0,
        minFocusDistance: 0.3,
        bladeCount: 9,
        bladeCurvature: 0.7
      };
    }
    
    const preset = this.getParameter('lensPreset');
    return this.lensPresets[preset] || this.lensPresets['Generic Prime 24mm'];
  }

  private calculateFOV(body: CameraBody, lens: LensProfile): number {
    // Calculate vertical FOV based on sensor height and focal length
    const fov = 2 * Math.atan(body.sensorHeight / (2 * lens.focalLength)) * 180 / Math.PI;
    return fov;
  }

  private calculateAspectRatio(body: CameraBody): number {
    const filmGate = this.getParameter('filmGate');
    
    if (filmGate === 'auto') {
      return body.sensorWidth / body.sensorHeight;
    }
    
    const aspectRatios: Record<string, number> = {
      '16:9': 16 / 9,
      '2.39:1': 2.39,
      '1.85:1': 1.85,
      '4:3': 4 / 3,
      '1:1': 1
    };
    
    return aspectRatios[filmGate] || (body.sensorWidth / body.sensorHeight);
  }

  private calculateDOF(body: CameraBody, lens: LensProfile): {
    nearFocus: number;
    farFocus: number;
    hyperfocalDistance: number;
    circleOfConfusion: number;
  } {
    const focusDistance = this.getParameter('focusDistance');
    const aperture = this.getParameter('aperture');
    const focalLength = lens.focalLength / 1000; // Convert to meters
    
    // Circle of confusion based on sensor size (roughly 1/1500 of diagonal)
    const diagonal = Math.sqrt(body.sensorWidth * body.sensorWidth + body.sensorHeight * body.sensorHeight);
    const circleOfConfusion = diagonal / 1500 / 1000; // Convert to meters
    
    // Hyperfocal distance
    const hyperfocalDistance = (focalLength * focalLength) / (aperture * circleOfConfusion) + focalLength;
    
    // Near focus distance
    const nearFocus = (focusDistance * (hyperfocalDistance - focalLength)) / 
                      (hyperfocalDistance + focusDistance - 2 * focalLength);
    
    // Far focus distance
    let farFocus: number;
    if (focusDistance >= hyperfocalDistance) {
      farFocus = Infinity;
    } else {
      farFocus = (focusDistance * (hyperfocalDistance - focalLength)) / 
                 (hyperfocalDistance - focusDistance);
    }
    
    return {
      nearFocus: Math.max(0.01, nearFocus),
      farFocus,
      hyperfocalDistance,
      circleOfConfusion
    };
  }

  private calculateExposure(): number {
    const aperture = this.getParameter('aperture');
    const shutterSpeed = this.getParameter('shutterSpeed');
    const iso = this.getParameter('iso');
    const compensation = this.getParameter('exposureCompensation');
    
    // EV = log2(N² / t) - log2(ISO / 100)
    const ev = Math.log2((aperture * aperture) / shutterSpeed) - Math.log2(iso / 100);
    
    return ev + compensation;
  }

  private calculateFrustumCorners(): { near: number[][]; far: number[][] } {
    if (!this.camera) {
      return { near: [], far: [] };
    }
    
    const nearClip = this.getParameter('nearClip');
    const farClip = this.getParameter('farClip');
    
    // Calculate frustum corners
    const fov = this.camera.fov * Math.PI / 180;
    const aspect = this.camera.aspect;
    
    const nearHeight = 2 * Math.tan(fov / 2) * nearClip;
    const nearWidth = nearHeight * aspect;
    const farHeight = 2 * Math.tan(fov / 2) * farClip;
    const farWidth = farHeight * aspect;
    
    return {
      near: [
        [-nearWidth / 2, -nearHeight / 2, -nearClip],
        [nearWidth / 2, -nearHeight / 2, -nearClip],
        [nearWidth / 2, nearHeight / 2, -nearClip],
        [-nearWidth / 2, nearHeight / 2, -nearClip]
      ],
      far: [
        [-farWidth / 2, -farHeight / 2, -farClip],
        [farWidth / 2, -farHeight / 2, -farClip],
        [farWidth / 2, farHeight / 2, -farClip],
        [-farWidth / 2, farHeight / 2, -farClip]
      ]
    };
  }

  // Utility methods for external use
  getCameraPresets(): string[] {
    return Object.keys(this.cameraPresets);
  }

  getLensPresets(): string[] {
    return Object.keys(this.lensPresets);
  }

  dispose(): void {
    this.camera = null;
    super.dispose();
  }
}
