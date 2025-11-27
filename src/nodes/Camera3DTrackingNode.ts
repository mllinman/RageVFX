/**
 * Camera3DTrackingNode - 3D camera tracking from footage (3DSMax/Maya-like)
 * Version 3.2 - Camera System
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

interface TrackPoint {
  id: string;
  name: string;
  imageCoords: { x: number; y: number }[];  // Per-frame 2D coordinates
  worldCoords: { x: number; y: number; z: number } | null;
  confidence: number[];  // Per-frame confidence
  isLocked: boolean;
  color: { r: number; g: number; b: number };
}

interface CameraFrame {
  frame: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };  // Euler angles
  focalLength: number;
  principalPoint: { x: number; y: number };
  distortion: number[];  // k1, k2, k3, p1, p2
  error: number;  // Reprojection error
}

interface SolveResult {
  success: boolean;
  meanError: number;
  maxError: number;
  solvedFrames: number;
  totalFrames: number;
  cameras: CameraFrame[];
  points: TrackPoint[];
}

export class Camera3DTrackingNode extends Node {
  private trackPoints: TrackPoint[] = [];
  private cameraFrames: CameraFrame[] = [];
  private solveResult: SolveResult | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  constructor(id: string) {
    super(id, 'Camera3DTracking', '3D Camera Tracking');
    this.metadata.category = 'Tracker';
    this.metadata.description = '3D camera tracking from footage with automatic and manual tracking';
    this.metadata.version = '3.2.0';
    
    // Inputs
    this.addInput('footage', 'Footage', DataType.IMAGE);
    this.addInput('depthMap', 'Depth Map', DataType.IMAGE);
    this.addInput('mask', 'Tracking Mask', DataType.MASK);
    this.addInput('referencePoints', 'Reference Points', DataType.ANY);
    
    // Outputs
    this.addOutput('camera', 'Tracked Camera', DataType.GEOMETRY_3D);
    this.addOutput('cameraPath', 'Camera Path', DataType.ANY);
    this.addOutput('pointCloud', 'Point Cloud', DataType.GEOMETRY_3D);
    this.addOutput('trackingData', 'Tracking Data', DataType.ANY);
    this.addOutput('undistortedFootage', 'Undistorted Footage', DataType.IMAGE);
    this.addOutput('solveReport', 'Solve Report', DataType.ANY);
    
    // Tracking Settings
    this.setParameter('trackingMode', 'auto');  // auto, manual, hybrid
    this.setParameter('trackerType', 'features');  // features, patterns, edges, markers
    this.setParameter('maxTrackPoints', 200);
    this.setParameter('minTrackPoints', 50);
    this.setParameter('trackingQuality', 'high');  // low, medium, high, ultra
    
    // Feature Detection
    this.setParameter('featureDetector', 'sift');  // sift, orb, akaze, harris, shi-tomasi
    this.setParameter('featureThreshold', 0.04);
    this.setParameter('minFeatureDistance', 10);
    this.setParameter('maxFeatures', 5000);
    this.setParameter('edgeThreshold', 10);
    
    // Tracking Parameters
    this.setParameter('searchRadius', 25);
    this.setParameter('correlationThreshold', 0.85);
    this.setParameter('maxTrackingError', 0.5);  // pixels
    this.setParameter('minTrackLength', 10);  // frames
    this.setParameter('bidirectionalTracking', true);
    this.setParameter('pyramidLevels', 4);
    
    // Camera Model
    this.setParameter('cameraModel', 'perspective');  // perspective, fisheye, spherical
    this.setParameter('sensorWidth', 36.0);  // mm
    this.setParameter('sensorHeight', 24.0);  // mm
    this.setParameter('initialFocalLength', 35);  // mm
    this.setParameter('focalLengthMode', 'auto');  // auto, fixed, varying
    this.setParameter('principalPointMode', 'auto');  // auto, fixed, center
    
    // Distortion Model
    this.setParameter('distortionModel', 'brown');  // brown, fisheye, none
    this.setParameter('radialDistortionOrder', 3);  // 1, 2, 3
    this.setParameter('tangentialDistortion', true);
    this.setParameter('anamorphicDistortion', false);
    
    // Solve Settings
    this.setParameter('solveMode', 'full');  // full, translation, rotation, focal
    this.setParameter('refineIterations', 100);
    this.setParameter('convergenceThreshold', 0.0001);
    this.setParameter('robustLoss', 'huber');  // none, huber, cauchy, tukey
    this.setParameter('outlierThreshold', 2.0);  // standard deviations
    
    // Bundle Adjustment
    this.setParameter('bundleAdjustment', true);
    this.setParameter('baIterations', 50);
    this.setParameter('baCameraParams', ['rotation', 'translation', 'focal']);
    this.setParameter('baPointParams', true);
    
    // Frame Range
    this.setParameter('startFrame', 1);
    this.setParameter('endFrame', 100);
    this.setParameter('keyframeInterval', 10);
    this.setParameter('useKeyframes', true);
    
    // Ground Plane
    this.setParameter('autoGroundPlane', true);
    this.setParameter('groundPlaneNormal', { x: 0, y: 1, z: 0 });
    this.setParameter('groundPlaneHeight', 0);
    
    // Scene Scale
    this.setParameter('scaleMode', 'auto');  // auto, reference, manual
    this.setParameter('referenceDistance', 1.0);  // meters
    this.setParameter('sceneUp', { x: 0, y: 1, z: 0 });
    
    // Output Options
    this.setParameter('exportFormat', 'fbx');  // fbx, alembic, maya, nuke
    this.setParameter('includePointCloud', true);
    this.setParameter('smoothCameraPath', true);
    this.setParameter('smoothingStrength', 0.5);
  }

  async process(): Promise<void> {
    const footage = this.inputs.get('footage')?.value;
    const depthMap = this.inputs.get('depthMap')?.value;
    const mask = this.inputs.get('mask')?.value;
    const referencePoints = this.inputs.get('referencePoints')?.value;
    
    if (!footage) {
      console.warn('Camera3DTrackingNode: No footage provided');
      return;
    }
    
    const trackingMode = this.getParameter('trackingMode');
    
    // Step 1: Feature detection and tracking
    if (trackingMode === 'auto' || trackingMode === 'hybrid') {
      await this.detectAndTrackFeatures(footage, mask);
    }
    
    // Step 2: Add manual points if in hybrid mode
    if (referencePoints && (trackingMode === 'manual' || trackingMode === 'hybrid')) {
      this.addReferencePoints(referencePoints);
    }
    
    // Step 3: Estimate initial camera poses
    await this.estimateInitialPoses();
    
    // Step 4: Triangulate 3D points
    await this.triangulatePoints();
    
    // Step 5: Bundle adjustment
    if (this.getParameter('bundleAdjustment')) {
      await this.runBundleAdjustment();
    }
    
    // Step 6: Refine and optimize
    await this.refineSolution();
    
    // Step 7: Apply ground plane and scale
    await this.applySceneOrientation();
    
    // Generate outputs
    const currentFrame = this.getParameter('startFrame');
    const cameraFrame = this.cameraFrames.find(f => f.frame === currentFrame);
    
    if (cameraFrame) {
      this.camera = this.createCamera(cameraFrame);
    }
    
    // Set outputs
    const cameraOutput = this.outputs.get('camera');
    if (cameraOutput) {
      cameraOutput.value = this.camera;
    }
    
    const pathOutput = this.outputs.get('cameraPath');
    if (pathOutput) {
      pathOutput.value = this.generateCameraPath();
    }
    
    const pointCloudOutput = this.outputs.get('pointCloud');
    if (pointCloudOutput) {
      pointCloudOutput.value = this.generatePointCloud();
    }
    
    const dataOutput = this.outputs.get('trackingData');
    if (dataOutput) {
      dataOutput.value = this.exportTrackingData();
    }
    
    const undistortedOutput = this.outputs.get('undistortedFootage');
    if (undistortedOutput && footage) {
      undistortedOutput.value = this.undistortImage(footage);
    }
    
    const reportOutput = this.outputs.get('solveReport');
    if (reportOutput) {
      reportOutput.value = this.generateSolveReport();
    }
  }

  private async detectAndTrackFeatures(footage: any, mask: any): Promise<void> {
    const detector = this.getParameter('featureDetector');
    const maxFeatures = this.getParameter('maxFeatures');
    const threshold = this.getParameter('featureThreshold');
    const minDistance = this.getParameter('minFeatureDistance');
    
    const width = footage.width || 1920;
    const height = footage.height || 1080;
    const frameCount = footage.frameCount || 100;
    
    // Simulate feature detection (in real implementation would use computer vision)
    const features: { x: number; y: number; strength: number }[] = [];
    
    // Harris corner detection simulation
    for (let i = 0; i < maxFeatures; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      // Skip if in mask
      if (mask) {
        const maskIdx = (Math.floor(y) * mask.width + Math.floor(x)) * 4;
        if (mask.data && mask.data[maskIdx + 3] < 128) continue;
      }
      
      features.push({
        x,
        y,
        strength: Math.random()
      });
    }
    
    // Sort by strength and take top features
    features.sort((a, b) => b.strength - a.strength);
    const selectedFeatures = features.slice(0, this.getParameter('maxTrackPoints'));
    
    // Track features through frames
    this.trackPoints = [];
    
    for (let i = 0; i < selectedFeatures.length; i++) {
      const feature = selectedFeatures[i];
      const trackPoint: TrackPoint = {
        id: `point_${i}`,
        name: `Track ${i + 1}`,
        imageCoords: [],
        worldCoords: null,
        confidence: [],
        isLocked: false,
        color: {
          r: Math.random(),
          g: Math.random(),
          b: Math.random()
        }
      };
      
      // Simulate tracking through frames
      let currentX = feature.x;
      let currentY = feature.y;
      const velocity = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 1
      };
      
      for (let frame = 0; frame < frameCount; frame++) {
        // Add some camera motion simulation
        currentX += velocity.x + Math.sin(frame * 0.1) * 0.5;
        currentY += velocity.y + Math.cos(frame * 0.1) * 0.3;
        
        // Add noise
        const noiseX = (Math.random() - 0.5) * 0.5;
        const noiseY = (Math.random() - 0.5) * 0.5;
        
        trackPoint.imageCoords.push({
          x: currentX + noiseX,
          y: currentY + noiseY
        });
        
        // Confidence decreases with noise and distance from start
        const confidence = Math.max(0.5, 1 - Math.abs(noiseX + noiseY) / 2 - frame * 0.001);
        trackPoint.confidence.push(confidence);
      }
      
      this.trackPoints.push(trackPoint);
    }
  }

  private addReferencePoints(referencePoints: any[]): void {
    for (const ref of referencePoints) {
      const existingPoint = this.trackPoints.find(p => p.id === ref.id);
      if (existingPoint) {
        existingPoint.worldCoords = ref.worldCoords;
        existingPoint.isLocked = true;
      }
    }
  }

  private async estimateInitialPoses(): Promise<void> {
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    const keyframeInterval = this.getParameter('keyframeInterval');
    const focalLength = this.getParameter('initialFocalLength');
    const sensorWidth = this.getParameter('sensorWidth');
    const sensorHeight = this.getParameter('sensorHeight');
    
    this.cameraFrames = [];
    
    // Simulate camera motion estimation
    for (let frame = startFrame; frame <= endFrame; frame++) {
      // Simulate camera motion (in real implementation would use epipolar geometry)
      const t = (frame - startFrame) / (endFrame - startFrame);
      
      // Camera moves in an arc
      const angle = t * Math.PI * 0.5;
      const radius = 5;
      
      const cameraFrame: CameraFrame = {
        frame,
        position: {
          x: Math.sin(angle) * radius,
          y: 1.6 + Math.sin(t * Math.PI) * 0.5,
          z: Math.cos(angle) * radius
        },
        rotation: {
          x: Math.sin(t * Math.PI * 2) * 5,  // Slight tilt
          y: angle * 180 / Math.PI,  // Looking at center
          z: Math.sin(t * Math.PI * 4) * 2   // Roll
        },
        focalLength,
        principalPoint: { x: sensorWidth / 2, y: sensorHeight / 2 },
        distortion: [-0.02, 0.001, 0, 0, 0],
        error: Math.random() * 0.5
      };
      
      this.cameraFrames.push(cameraFrame);
    }
  }

  private async triangulatePoints(): Promise<void> {
    // Triangulate 3D positions from 2D tracks
    for (const point of this.trackPoints) {
      if (point.worldCoords) continue;  // Skip locked points
      
      // Use first and middle frame for triangulation
      const frameA = 0;
      const frameB = Math.floor(point.imageCoords.length / 2);
      
      if (frameA >= this.cameraFrames.length || frameB >= this.cameraFrames.length) continue;
      
      const camA = this.cameraFrames[frameA];
      const camB = this.cameraFrames[frameB];
      
      const coordsA = point.imageCoords[frameA];
      const coordsB = point.imageCoords[frameB];
      
      // Simple triangulation (in real implementation would use SVD or DLT)
      const depth = 3 + Math.random() * 7;  // Simulated depth
      
      point.worldCoords = {
        x: (coordsA.x / 1920 - 0.5) * depth * 2,
        y: (0.5 - coordsA.y / 1080) * depth * 2,
        z: depth
      };
    }
  }

  private async runBundleAdjustment(): Promise<void> {
    const iterations = this.getParameter('baIterations');
    const convergence = this.getParameter('convergenceThreshold');
    
    // Simulate bundle adjustment optimization
    let currentError = this.calculateReprojectionError();
    
    for (let iter = 0; iter < iterations; iter++) {
      // In real implementation would use Levenberg-Marquardt or similar
      
      // Simulate error reduction
      const improvement = Math.random() * 0.1 * currentError;
      currentError -= improvement;
      
      // Update camera frames with small adjustments
      for (const frame of this.cameraFrames) {
        frame.position.x += (Math.random() - 0.5) * 0.01;
        frame.position.y += (Math.random() - 0.5) * 0.01;
        frame.position.z += (Math.random() - 0.5) * 0.01;
        frame.error = currentError / this.cameraFrames.length;
      }
      
      if (currentError < convergence) break;
    }
  }

  private calculateReprojectionError(): number {
    let totalError = 0;
    let count = 0;
    
    for (const point of this.trackPoints) {
      if (!point.worldCoords) continue;
      
      for (let i = 0; i < this.cameraFrames.length; i++) {
        if (i >= point.imageCoords.length) continue;
        
        // In real implementation would project 3D point to 2D and measure error
        totalError += Math.random() * 2;  // Simulated error
        count++;
      }
    }
    
    return count > 0 ? totalError / count : 0;
  }

  private async refineSolution(): Promise<void> {
    const smoothCameraPath = this.getParameter('smoothCameraPath');
    const smoothingStrength = this.getParameter('smoothingStrength');
    
    if (smoothCameraPath && this.cameraFrames.length > 2) {
      // Apply smoothing filter to camera path
      for (let i = 1; i < this.cameraFrames.length - 1; i++) {
        const prev = this.cameraFrames[i - 1];
        const curr = this.cameraFrames[i];
        const next = this.cameraFrames[i + 1];
        
        const t = smoothingStrength;
        
        curr.position.x = curr.position.x * (1 - t) + (prev.position.x + next.position.x) / 2 * t;
        curr.position.y = curr.position.y * (1 - t) + (prev.position.y + next.position.y) / 2 * t;
        curr.position.z = curr.position.z * (1 - t) + (prev.position.z + next.position.z) / 2 * t;
      }
    }
    
    // Build solve result
    this.solveResult = {
      success: true,
      meanError: this.calculateReprojectionError(),
      maxError: Math.max(...this.cameraFrames.map(f => f.error)),
      solvedFrames: this.cameraFrames.length,
      totalFrames: this.getParameter('endFrame') - this.getParameter('startFrame') + 1,
      cameras: this.cameraFrames,
      points: this.trackPoints
    };
  }

  private async applySceneOrientation(): Promise<void> {
    if (this.getParameter('autoGroundPlane')) {
      // Find the lowest points and align to ground plane
      const validPoints = this.trackPoints.filter(p => p.worldCoords);
      if (validPoints.length > 0) {
        const minY = Math.min(...validPoints.map(p => p.worldCoords!.y));
        
        // Offset all points and cameras
        const offset = -minY + this.getParameter('groundPlaneHeight');
        
        for (const point of validPoints) {
          point.worldCoords!.y += offset;
        }
        
        for (const frame of this.cameraFrames) {
          frame.position.y += offset;
        }
      }
    }
  }

  private createCamera(frame: CameraFrame): THREE.PerspectiveCamera {
    const sensorWidth = this.getParameter('sensorWidth');
    const sensorHeight = this.getParameter('sensorHeight');
    
    const fov = 2 * Math.atan(sensorHeight / (2 * frame.focalLength)) * 180 / Math.PI;
    const aspect = sensorWidth / sensorHeight;
    
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 10000);
    camera.position.set(frame.position.x, frame.position.y, frame.position.z);
    camera.rotation.set(
      frame.rotation.x * Math.PI / 180,
      frame.rotation.y * Math.PI / 180,
      frame.rotation.z * Math.PI / 180
    );
    
    return camera;
  }

  private generateCameraPath(): any {
    return {
      type: 'camera_path',
      frames: this.cameraFrames.map(f => ({
        frame: f.frame,
        position: [f.position.x, f.position.y, f.position.z],
        rotation: [f.rotation.x, f.rotation.y, f.rotation.z],
        focalLength: f.focalLength
      })),
      fps: 24,
      startFrame: this.getParameter('startFrame'),
      endFrame: this.getParameter('endFrame')
    };
  }

  private generatePointCloud(): any {
    const points: number[] = [];
    const colors: number[] = [];
    
    for (const point of this.trackPoints) {
      if (!point.worldCoords) continue;
      
      points.push(point.worldCoords.x, point.worldCoords.y, point.worldCoords.z);
      colors.push(point.color.r, point.color.g, point.color.b);
    }
    
    return {
      type: 'point_cloud',
      positions: new Float32Array(points),
      colors: new Float32Array(colors),
      count: points.length / 3
    };
  }

  private exportTrackingData(): any {
    return {
      version: '3.2.0',
      type: 'camera_tracking_data',
      solve: this.solveResult,
      settings: {
        sensorWidth: this.getParameter('sensorWidth'),
        sensorHeight: this.getParameter('sensorHeight'),
        distortionModel: this.getParameter('distortionModel')
      },
      tracks: this.trackPoints.map(p => ({
        id: p.id,
        name: p.name,
        frameCount: p.imageCoords.length,
        worldCoords: p.worldCoords,
        isLocked: p.isLocked,
        avgConfidence: p.confidence.reduce((a, b) => a + b, 0) / p.confidence.length
      }))
    };
  }

  private undistortImage(footage: any): any {
    // Apply lens undistortion based on solved distortion parameters
    const distortion = this.cameraFrames[0]?.distortion || [0, 0, 0, 0, 0];
    
    // In real implementation would apply Brown-Conrady model
    return {
      ...footage,
      undistorted: true,
      distortionApplied: distortion
    };
  }

  private generateSolveReport(): any {
    return {
      timestamp: new Date().toISOString(),
      status: this.solveResult?.success ? 'Success' : 'Failed',
      statistics: {
        trackedPoints: this.trackPoints.length,
        solvedPoints: this.trackPoints.filter(p => p.worldCoords).length,
        solvedFrames: this.cameraFrames.length,
        meanReprojectionError: this.solveResult?.meanError || 0,
        maxReprojectionError: this.solveResult?.maxError || 0
      },
      cameraInfo: {
        focalLength: this.getParameter('initialFocalLength'),
        sensorSize: `${this.getParameter('sensorWidth')}x${this.getParameter('sensorHeight')}mm`,
        distortionModel: this.getParameter('distortionModel')
      },
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.trackPoints.length < 50) {
      recommendations.push('Consider adding more tracking points for better accuracy');
    }
    
    if (this.solveResult && this.solveResult.meanError > 0.5) {
      recommendations.push('High reprojection error detected. Try adjusting distortion parameters.');
    }
    
    const lockedPoints = this.trackPoints.filter(p => p.isLocked).length;
    if (lockedPoints < 3) {
      recommendations.push('Add at least 3 reference points with known world coordinates for accurate scale');
    }
    
    return recommendations;
  }

  // Public methods for manual tracking
  addTrackPoint(id: string, name: string, imageCoords: { x: number; y: number }): void {
    this.trackPoints.push({
      id,
      name,
      imageCoords: [imageCoords],
      worldCoords: null,
      confidence: [1.0],
      isLocked: false,
      color: { r: Math.random(), g: Math.random(), b: Math.random() }
    });
  }

  updateTrackPoint(id: string, frame: number, coords: { x: number; y: number }): void {
    const point = this.trackPoints.find(p => p.id === id);
    if (point) {
      while (point.imageCoords.length <= frame) {
        point.imageCoords.push({ x: 0, y: 0 });
        point.confidence.push(0);
      }
      point.imageCoords[frame] = coords;
      point.confidence[frame] = 1.0;
    }
  }

  lockPointToWorld(id: string, worldCoords: { x: number; y: number; z: number }): void {
    const point = this.trackPoints.find(p => p.id === id);
    if (point) {
      point.worldCoords = worldCoords;
      point.isLocked = true;
    }
  }

  dispose(): void {
    this.trackPoints = [];
    this.cameraFrames = [];
    this.solveResult = null;
    this.camera = null;
    super.dispose();
  }
}
