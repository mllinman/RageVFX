/**
 * CameraImportNode - Import camera data from Nuke, Maya, Blender, and commercial cameras
 * Version 3.11 - Camera Import System
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

interface CameraData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  focalLength: number;
  sensorWidth: number;
  sensorHeight: number;
  aperture: number;
  focusDistance: number;
  nearClip: number;
  farClip: number;
  keyframes?: CameraKeyframe[];
  metadata: {
    format: string;
    cameraName: string;
    importSource: string;
    framerate?: number;
    originalUnit?: string;
  };
}

interface CameraKeyframe {
  frame: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  focalLength?: number;
  aperture?: number;
  focusDistance?: number;
}

export class CameraImportNode extends Node {
  private camera: THREE.PerspectiveCamera | null = null;
  private cameraData: CameraData | null = null;

  constructor(id: string) {
    super(id, 'CameraImport', 'Camera Import');
    this.metadata.category = 'Camera';
    this.metadata.description = 'Import camera data from Nuke, NukeX, Maya, Blender, and commercial camera formats';
    this.metadata.version = '3.11.0';
    
    // Inputs
    this.addInput('filepath', 'File Path', DataType.ANY);
    
    // Outputs
    this.addOutput('camera', 'Camera', DataType.GEOMETRY_3D);
    this.addOutput('cameraPath', 'Camera Path', DataType.ANY);
    this.addOutput('metadata', 'Metadata', DataType.ANY);
    this.addOutput('keyframes', 'Keyframes', DataType.ANIMATION);
    
    // Format Settings
    this.setParameter('format', 'auto');  // auto, nuke, maya, blender, fbx, usd, alembic, arri, red, sony, canon
    this.setParameter('filepath', '');
    
    // Import Options
    this.setParameter('importAnimation', true);
    this.setParameter('importLensData', true);
    this.setParameter('importMetadata', true);
    this.setParameter('applyDistortion', false);
    
    // Unit Conversion
    this.setParameter('sourceUnit', 'auto');  // auto, mm, cm, m, inch, feet
    this.setParameter('targetUnit', 'mm');  // mm, cm, m
    this.setParameter('sceneScale', 1.0);
    
    // Coordinate System
    this.setParameter('sourceUpAxis', 'auto');  // auto, Y, Z
    this.setParameter('sourceForwardAxis', 'auto');  // auto, -Z, Z, X, -X
    this.setParameter('targetUpAxis', 'Y');  // Y, Z
    this.setParameter('targetForwardAxis', '-Z');  // -Z, Z, X, -X
    
    // Nuke-specific options
    this.setParameter('nukeNodeName', 'Camera1');  // Camera node name to import from .nk file
    this.setParameter('nukeFrameRange', 'full');  // full, work, custom
    this.setParameter('nukeStartFrame', 1001);
    this.setParameter('nukeEndFrame', 1100);
    
    // Maya-specific options
    this.setParameter('mayaCameraShape', 'auto');  // auto, or specific camera shape name
    this.setParameter('mayaFilmGate', 'auto');  // auto, 35mm, VistaVision, etc.
    
    // Blender-specific options
    this.setParameter('blenderCameraName', 'Camera');
    this.setParameter('blenderUnit', 'metric');  // metric, imperial
    
    // Commercial camera metadata
    this.setParameter('readEXIF', true);
    this.setParameter('readXMP', true);
    this.setParameter('extractLensProfile', true);
    this.setParameter('cameraBodyPreset', 'none');  // none, or preset name
    this.setParameter('lensPreset', 'none');  // none, or preset name
    
    // Animation Settings
    this.setParameter('frameRate', 24);
    this.setParameter('timeOffset', 0);
    this.setParameter('animationScale', 1.0);
    this.setParameter('smoothKeyframes', false);
    this.setParameter('smoothingWindow', 5);
    
    // Lens Distortion (from camera metadata)
    this.setParameter('distortionK1', 0.0);
    this.setParameter('distortionK2', 0.0);
    this.setParameter('distortionK3', 0.0);
    this.setParameter('distortionP1', 0.0);
    this.setParameter('distortionP2', 0.0);
  }

  async process(): Promise<void> {
    const filepath = this.inputs.get('filepath')?.value || this.getParameter('filepath');
    
    if (!filepath) {
      console.warn('CameraImportNode: No file path provided');
      return;
    }
    
    const format = this.detectFormat(filepath);
    
    // Load camera data based on format
    this.cameraData = await this.loadCameraData(filepath, format);
    
    if (!this.cameraData) {
      console.warn('CameraImportNode: Failed to load camera data');
      return;
    }
    
    // Apply coordinate system conversion
    this.applyCoordinateSystemConversion();
    
    // Apply unit conversion
    this.applyUnitConversion();
    
    // Create THREE.js camera
    this.camera = this.createThreeCamera();
    
    // Set outputs
    const cameraOutput = this.outputs.get('camera');
    if (cameraOutput) {
      cameraOutput.value = this.camera;
    }
    
    const pathOutput = this.outputs.get('cameraPath');
    if (pathOutput && this.cameraData.keyframes) {
      pathOutput.value = this.generateCameraPath();
    }
    
    const metadataOutput = this.outputs.get('metadata');
    if (metadataOutput) {
      metadataOutput.value = this.cameraData.metadata;
    }
    
    const keyframesOutput = this.outputs.get('keyframes');
    if (keyframesOutput && this.cameraData.keyframes) {
      keyframesOutput.value = this.cameraData.keyframes;
    }
  }

  private detectFormat(filepath: string): string {
    const format = this.getParameter('format');
    if (format !== 'auto') return format;
    
    const ext = filepath.split('.').pop()?.toLowerCase() || '';
    const formatMap: Record<string, string> = {
      'nk': 'nuke',
      'nknc': 'nuke',
      'ma': 'maya',
      'mb': 'maya',
      'blend': 'blender',
      'fbx': 'fbx',
      'usd': 'usd',
      'usda': 'usd',
      'usdc': 'usd',
      'abc': 'alembic',
      'xml': 'arri',  // ARRI camera metadata
      'r3d': 'red',   // RED camera metadata
      'mxf': 'sony',  // Sony camera metadata
      'exr': 'exif',  // May contain camera metadata
      'json': 'json'  // Generic JSON camera data
    };
    
    return formatMap[ext] || 'unknown';
  }

  /**
   * Load camera data from file based on detected format
   * @param filepath - Path to the camera file
   * @param format - Detected camera format (nuke, maya, blender, etc.)
   * @returns Promise resolving to CameraData or null if loading fails
   * @note Current implementation provides simulated data as placeholder.
   *       TODO: Implement actual file parsing for each format using appropriate libraries
   */
  private async loadCameraData(filepath: string, format: string): Promise<CameraData | null> {
    // TODO: Replace simulated data with actual file parsing
    // Will require format-specific parsers for each supported format
    
    switch (format) {
      case 'nuke':
        return this.loadNukeCamera(filepath);
      case 'maya':
        return this.loadMayaCamera(filepath);
      case 'blender':
        return this.loadBlenderCamera(filepath);
      case 'fbx':
        return this.loadFBXCamera(filepath);
      case 'usd':
        return this.loadUSDCamera(filepath);
      case 'alembic':
        return this.loadAlembicCamera(filepath);
      case 'arri':
        return this.loadARRIMetadata(filepath);
      case 'red':
        return this.loadREDMetadata(filepath);
      case 'sony':
        return this.loadSonyMetadata(filepath);
      default:
        return this.loadGenericCamera(filepath);
    }
  }

  /**
   * Load camera from Nuke/NukeX .nk script file
   * @param filepath - Path to .nk file
   * @returns CameraData extracted from Nuke Camera node
   * @note Nuke .nk files are Tcl-based scripts. Parser would need to:
   *       - Parse Tcl script to find Camera nodes
   *       - Extract translate, rotate, focal, haperture, vaperture parameters
   *       - Handle animated curves (keyframes)
   *       - Support projection_mode and film_back settings
   * @todo Implement actual Nuke script parser
   */
  private loadNukeCamera(filepath: string): CameraData {
    // TODO: Parse Nuke .nk Tcl script format
    // Reference: Nuke Python API documentation for Camera node parameters
    
    const cameraName = this.getParameter('nukeNodeName');
    const importAnimation = this.getParameter('importAnimation');
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 1.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      focalLength: 35,
      sensorWidth: 36.0,
      sensorHeight: 24.0,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 1000,
      metadata: {
        format: 'nuke',
        cameraName: cameraName,
        importSource: filepath,
        framerate: 24,
        originalUnit: 'mm'
      }
    };
    
    // Generate sample keyframes for animation
    if (importAnimation) {
      data.keyframes = this.generateSampleKeyframes('nuke');
    }
    
    return data;
  }

  /**
   * Load camera from Maya .ma (ASCII) or .mb (binary) file
   * @param filepath - Path to Maya scene file
   * @returns CameraData extracted from Maya camera shape
   * @note Maya files store cameras as shape nodes with transform hierarchy:
   *       - Camera shape contains lens properties (focal length, film gate)
   *       - Transform node contains position/rotation with animation curves
   *       - .ma files are text-based MEL format
   *       - .mb files are binary format requiring special parser
   * @todo Implement Maya file parser (consider using maya-py or similar)
   */
  private loadMayaCamera(filepath: string): CameraData {
    // TODO: Parse Maya ASCII (.ma) or binary (.mb) format
    // Reference: Maya camera node documentation and MEL syntax
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 15, 50),  // Maya uses cm by default
      rotation: new THREE.Euler(-0.2, 0, 0),
      focalLength: 35,
      sensorWidth: 36.0,
      sensorHeight: 24.0,
      aperture: 5.6,
      focusDistance: 50.0,
      nearClip: 0.1,
      farClip: 10000,
      metadata: {
        format: 'maya',
        cameraName: this.getParameter('mayaCameraShape') || 'perspShape',
        importSource: filepath,
        framerate: 24,
        originalUnit: 'cm'  // Maya default
      }
    };
    
    if (this.getParameter('importAnimation')) {
      data.keyframes = this.generateSampleKeyframes('maya');
    }
    
    return data;
  }

  /**
   * Load camera from Blender .blend file or FBX export
   * @param filepath - Path to Blender file
   * @returns CameraData extracted from Blender camera object
   * @note Blender specifics:
   *       - Uses Z-up coordinate system (requires conversion)
   *       - Cameras stored in .blend binary format (GZIP compressed)
   *       - FBX export is easier to parse but may lose some data
   *       - Sensor size, focal length, and DOF settings stored in camera data
   * @todo Implement .blend file parser or FBX camera extraction
   */
  private loadBlenderCamera(filepath: string): CameraData {
    // TODO: Parse Blender .blend format or extract from FBX
    // Consider using blender-file-reader library or FBX SDK
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 1.5, 5),  // Blender uses meters
      rotation: new THREE.Euler(Math.PI / 2, 0, Math.PI),  // Blender Z-up conversion
      focalLength: 50,
      sensorWidth: 36.0,
      sensorHeight: 24.0,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 100,
      metadata: {
        format: 'blender',
        cameraName: this.getParameter('blenderCameraName'),
        importSource: filepath,
        framerate: 24,
        originalUnit: 'm'  // Blender default
      }
    };
    
    if (this.getParameter('importAnimation')) {
      data.keyframes = this.generateSampleKeyframes('blender');
    }
    
    return data;
  }

  private loadFBXCamera(filepath: string): CameraData {
    // FBX is a common interchange format used by Maya, Blender, etc.
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 1.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      focalLength: 35,
      sensorWidth: 36.0,
      sensorHeight: 24.0,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 1000,
      metadata: {
        format: 'fbx',
        cameraName: 'Camera',
        importSource: filepath,
        framerate: 30
      }
    };
    
    if (this.getParameter('importAnimation')) {
      data.keyframes = this.generateSampleKeyframes('fbx');
    }
    
    return data;
  }

  private loadUSDCamera(filepath: string): CameraData {
    // USD (Universal Scene Description) format from Pixar
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 1.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      focalLength: 50,
      sensorWidth: 36.0,
      sensorHeight: 24.0,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 1000,
      metadata: {
        format: 'usd',
        cameraName: 'Camera',
        importSource: filepath,
        framerate: 24
      }
    };
    
    if (this.getParameter('importAnimation')) {
      data.keyframes = this.generateSampleKeyframes('usd');
    }
    
    return data;
  }

  private loadAlembicCamera(filepath: string): CameraData {
    // Alembic is a common VFX interchange format
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 1.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      focalLength: 35,
      sensorWidth: 36.0,
      sensorHeight: 24.0,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 1000,
      metadata: {
        format: 'alembic',
        cameraName: 'Camera',
        importSource: filepath,
        framerate: 24
      }
    };
    
    if (this.getParameter('importAnimation')) {
      data.keyframes = this.generateSampleKeyframes('alembic');
    }
    
    return data;
  }

  private loadARRIMetadata(filepath: string): CameraData {
    // Load camera data from ARRI camera metadata files
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 1.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      focalLength: 40,
      sensorWidth: 28.25,  // ARRI ALEXA 35
      sensorHeight: 18.17,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 1000,
      metadata: {
        format: 'arri',
        cameraName: 'ARRI ALEXA 35',
        importSource: filepath,
        framerate: 24,
        originalUnit: 'mm'
      }
    };
    
    return data;
  }

  private loadREDMetadata(filepath: string): CameraData {
    // Load camera data from RED camera metadata
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 1.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      focalLength: 35,
      sensorWidth: 40.96,  // RED V-RAPTOR 8K
      sensorHeight: 21.60,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 1000,
      metadata: {
        format: 'red',
        cameraName: 'RED V-RAPTOR',
        importSource: filepath,
        framerate: 24,
        originalUnit: 'mm'
      }
    };
    
    return data;
  }

  private loadSonyMetadata(filepath: string): CameraData {
    // Load camera data from Sony camera metadata
    
    const data: CameraData = {
      position: new THREE.Vector3(0, 1.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      focalLength: 35,
      sensorWidth: 35.9,  // Sony VENICE
      sensorHeight: 23.9,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 1000,
      metadata: {
        format: 'sony',
        cameraName: 'Sony VENICE',
        importSource: filepath,
        framerate: 24,
        originalUnit: 'mm'
      }
    };
    
    return data;
  }

  private loadGenericCamera(filepath: string): CameraData {
    // Generic camera with default values
    
    return {
      position: new THREE.Vector3(0, 1.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      focalLength: 35,
      sensorWidth: 36.0,
      sensorHeight: 24.0,
      aperture: 2.8,
      focusDistance: 5.0,
      nearClip: 0.1,
      farClip: 1000,
      metadata: {
        format: 'generic',
        cameraName: 'ImportedCamera',
        importSource: filepath
      }
    };
  }

  private generateSampleKeyframes(format: string): CameraKeyframe[] {
    // Generate sample animated camera path
    const keyframes: CameraKeyframe[] = [];
    const frameCount = 100;
    
    for (let i = 0; i < frameCount; i += 10) {
      const t = i / frameCount;
      const angle = t * Math.PI * 2;
      
      keyframes.push({
        frame: i,
        position: new THREE.Vector3(
          Math.cos(angle) * 5,
          1.5 + Math.sin(t * Math.PI) * 2,
          Math.sin(angle) * 5
        ),
        rotation: new THREE.Euler(
          -Math.sin(t * Math.PI) * 0.3,
          angle,
          0
        ),
        focalLength: 35 + Math.sin(t * Math.PI * 2) * 15,
        aperture: 2.8 + Math.sin(t * Math.PI) * 2.8,
        focusDistance: 5.0 + Math.sin(t * Math.PI * 4) * 3
      });
    }
    
    return keyframes;
  }

  private applyCoordinateSystemConversion(): void {
    if (!this.cameraData) return;
    
    const sourceUp = this.getParameter('sourceUpAxis');
    const targetUp = this.getParameter('targetUpAxis');
    
    // Convert coordinate systems (e.g., Blender Z-up to Y-up)
    if ((sourceUp === 'Z' || this.cameraData.metadata.format === 'blender') && targetUp === 'Y') {
      // Rotate from Z-up to Y-up
      const pos = this.cameraData.position;
      this.cameraData.position = new THREE.Vector3(pos.x, pos.z, -pos.y);
      
      // Adjust rotation for coordinate system
      const rot = this.cameraData.rotation;
      this.cameraData.rotation = new THREE.Euler(rot.x - Math.PI / 2, rot.y, rot.z);
      
      // Apply to keyframes if present
      if (this.cameraData.keyframes) {
        for (const kf of this.cameraData.keyframes) {
          const kfPos = kf.position;
          kf.position = new THREE.Vector3(kfPos.x, kfPos.z, -kfPos.y);
          const kfRot = kf.rotation;
          kf.rotation = new THREE.Euler(kfRot.x - Math.PI / 2, kfRot.y, kfRot.z);
        }
      }
    }
  }

  private applyUnitConversion(): void {
    if (!this.cameraData) return;
    
    const sourceUnit = this.getParameter('sourceUnit') === 'auto' 
      ? this.cameraData.metadata.originalUnit || 'mm'
      : this.getParameter('sourceUnit');
    const targetUnit = this.getParameter('targetUnit');
    const sceneScale = this.getParameter('sceneScale');
    
    // Unit conversion factors to meters
    const toMeters: Record<string, number> = {
      'mm': 0.001,
      'cm': 0.01,
      'm': 1.0,
      'inch': 0.0254,
      'feet': 0.3048
    };
    
    const fromMeters: Record<string, number> = {
      'mm': 1000,
      'cm': 100,
      'm': 1.0
    };
    
    // Calculate conversion factor
    const factor = (toMeters[sourceUnit] || 1.0) * (fromMeters[targetUnit] || 1.0) * sceneScale;
    
    // Apply to position
    this.cameraData.position.multiplyScalar(factor);
    
    // Apply to keyframes
    if (this.cameraData.keyframes) {
      for (const kf of this.cameraData.keyframes) {
        kf.position.multiplyScalar(factor);
        if (kf.focusDistance !== undefined) {
          kf.focusDistance *= factor;
        }
      }
    }
    
    // Focus distance also needs conversion
    this.cameraData.focusDistance *= factor;
  }

  private createThreeCamera(): THREE.PerspectiveCamera {
    if (!this.cameraData) {
      return new THREE.PerspectiveCamera(50, 16/9, 0.1, 1000);
    }
    
    // Calculate field of view from focal length and sensor size
    const fov = 2 * Math.atan(this.cameraData.sensorHeight / (2 * this.cameraData.focalLength)) * (180 / Math.PI);
    const aspect = this.cameraData.sensorWidth / this.cameraData.sensorHeight;
    
    const camera = new THREE.PerspectiveCamera(
      fov,
      aspect,
      this.cameraData.nearClip,
      this.cameraData.farClip
    );
    
    camera.position.copy(this.cameraData.position);
    camera.rotation.copy(this.cameraData.rotation);
    
    return camera;
  }

  private generateCameraPath(): THREE.CatmullRomCurve3 {
    if (!this.cameraData?.keyframes) {
      return new THREE.CatmullRomCurve3([]);
    }
    
    const points = this.cameraData.keyframes.map(kf => kf.position);
    return new THREE.CatmullRomCurve3(points);
  }
}
