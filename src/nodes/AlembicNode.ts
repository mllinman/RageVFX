/**
 * AlembicNode - Alembic geometry caching
 * Version 3.1 - Pipeline & Collaboration
 * 
 * Features:
 * - Alembic file import/export
 * - Geometry caching
 * - Animation baking
 * - Camera and transform export
 * - Point cloud and curve support
 * - Archive compression
 * - Metadata handling
 */

import { Node, DataType } from '../core/Node';

// Alembic Schema types
export type AlembicSchemaType = 
  | 'PolyMesh' 
  | 'SubD' 
  | 'Points' 
  | 'Curves' 
  | 'NuPatch' 
  | 'Xform' 
  | 'Camera' 
  | 'Light'
  | 'FaceSet'
  | 'Material';

// Alembic Object interface
export interface AlembicObject {
  name: string;
  path: string;
  schemaType: AlembicSchemaType;
  parent: string | null;
  children: string[];
  properties: AlembicProperty[];
  sampleTimes: number[];
  isConstant: boolean;
  metadata: Record<string, string>;
}

// Alembic Property interface
export interface AlembicProperty {
  name: string;
  type: string;
  scope: 'constant' | 'uniform' | 'varying' | 'vertex' | 'facevarying';
  extent: number;
  isScalar: boolean;
  isArray: boolean;
  numSamples: number;
  timeSampling: number;
}

// Alembic Geometry interface
export interface AlembicGeometry {
  positions: Float32Array;
  normals: Float32Array | null;
  uvs: Float32Array | null;
  indices: Uint32Array | null;
  velocities: Float32Array | null;
  faceSetNames: string[];
  faceCounts: number[] | null;
}

// Alembic Archive interface
export interface AlembicArchive {
  fileName: string;
  archiveType: 'Ogawa' | 'HDF5';
  applicationInfo: string;
  dateWritten: string;
  rootObjects: AlembicObject[];
  timeSamplings: AlembicTimeSampling[];
  frameRange: { start: number; end: number };
}

// Time Sampling interface
export interface AlembicTimeSampling {
  index: number;
  type: 'uniform' | 'cyclic' | 'acyclic';
  startTime: number;
  timePerCycle: number;
  numSamplesPerCycle: number;
  sampleTimes: number[];
}

export class AlembicNode extends Node {
  private archive: AlembicArchive | null = null;
  private objectCache: Map<string, AlembicObject> = new Map();
  private geometryCache: Map<string, AlembicGeometry> = new Map();
  private currentFrame: number = 1;

  constructor(id: string) {
    super(id, 'Alembic', 'Alembic Cache');
    this.metadata.category = 'Pipeline';
    this.metadata.description = 'Alembic geometry caching for animation and simulation data exchange';
    this.metadata.version = '3.1.0';
    
    // Inputs
    this.addInput('alembicFile', 'Alembic File Path', DataType.ANY);
    this.addInput('geometry', 'Geometry Input', DataType.GEOMETRY_3D);
    this.addInput('transforms', 'Transforms', DataType.ANY);
    this.addInput('cameras', 'Cameras', DataType.ANY);
    this.addInput('particles', 'Particles', DataType.PARTICLES);
    this.addInput('curves', 'Curves', DataType.ANY);
    
    // Outputs
    this.addOutput('archive', 'Alembic Archive', DataType.ANY);
    this.addOutput('geometry', 'Geometry Output', DataType.GEOMETRY_3D);
    this.addOutput('transforms', 'Transforms', DataType.ANY);
    this.addOutput('cameras', 'Cameras', DataType.ANY);
    this.addOutput('particles', 'Particles', DataType.PARTICLES);
    this.addOutput('curves', 'Curves', DataType.ANY);
    this.addOutput('hierarchy', 'Hierarchy', DataType.ANY);
    this.addOutput('frameRange', 'Frame Range', DataType.ANY);
    
    // === FILE SETTINGS ===
    this.setParameter('mode', 'import'); // import, export, stream
    this.setParameter('filePath', ''); // Alembic file path
    this.setParameter('archiveType', 'Ogawa'); // Ogawa (faster) or HDF5
    
    // === TIME SETTINGS ===
    this.setParameter('fps', 24); // Slider 1-120
    this.setParameter('startFrame', 1); // Slider
    this.setParameter('endFrame', 100); // Slider
    this.setParameter('currentFrame', 1); // Slider
    this.setParameter('timeOffset', 0); // Slider -1000 to 1000
    this.setParameter('timeScale', 1.0); // Slider 0.1 to 10
    this.setParameter('subframeSampling', 1); // Slider 1-8 subframes
    
    // === IMPORT SETTINGS ===
    this.setParameter('importMeshes', true); // Checkbox
    this.setParameter('importSubDs', true); // Checkbox
    this.setParameter('importCurves', true); // Checkbox
    this.setParameter('importPoints', true); // Checkbox
    this.setParameter('importCameras', true); // Checkbox
    this.setParameter('importXforms', true); // Checkbox
    this.setParameter('importNormals', true); // Checkbox
    this.setParameter('importUVs', true); // Checkbox
    this.setParameter('importVelocities', true); // Checkbox
    this.setParameter('importFaceSets', true); // Checkbox
    this.setParameter('importMaterials', true); // Checkbox
    this.setParameter('importArbitraryGeomParams', true); // Checkbox
    
    // === EXPORT SETTINGS ===
    this.setParameter('exportMeshes', true); // Checkbox
    this.setParameter('exportCurves', true); // Checkbox
    this.setParameter('exportPoints', true); // Checkbox
    this.setParameter('exportCameras', true); // Checkbox
    this.setParameter('exportXforms', true); // Checkbox
    this.setParameter('exportNormals', true); // Checkbox
    this.setParameter('exportUVs', true); // Checkbox
    this.setParameter('exportVelocities', true); // Checkbox
    this.setParameter('exportFaceSets', true); // Checkbox
    this.setParameter('exportCreases', false); // Checkbox (for SubDs)
    
    // === COMPRESSION SETTINGS ===
    this.setParameter('compressionEnabled', true); // Checkbox
    this.setParameter('compressionLevel', 5); // Slider 1-9
    
    // === GEOMETRY SETTINGS ===
    this.setParameter('triangulate', false); // Checkbox
    this.setParameter('worldSpace', true); // Checkbox
    this.setParameter('flattenHierarchy', false); // Checkbox
    this.setParameter('mergeByMaterial', false); // Checkbox
    
    // === SAMPLING SETTINGS ===
    this.setParameter('samplingType', 'uniform'); // uniform, adaptive, manual
    this.setParameter('uniformSamplingRate', 1); // Every N frames
    this.setParameter('adaptiveThreshold', 0.01); // Motion threshold
    this.setParameter('constantDetection', true); // Checkbox - detect static objects
    
    // === STREAMING SETTINGS ===
    this.setParameter('streamingEnabled', false); // Checkbox
    this.setParameter('preloadFrames', 5); // Slider 1-30
    this.setParameter('cacheMemoryLimit', 1024); // MB, Slider 256-8192
    
    // === FILTERING ===
    this.setParameter('objectFilter', '*'); // Glob pattern
    this.setParameter('excludePattern', ''); // Exclude objects matching pattern
    this.setParameter('selectedObjectsOnly', false); // Checkbox
    
    // === DEBUG ===
    this.setParameter('debugMode', false); // Checkbox
    this.setParameter('validateArchive', true); // Checkbox
  }

  async process(): Promise<void> {
    const mode = this.getParameter('mode');
    this.currentFrame = this.getParameter('currentFrame');
    
    switch (mode) {
      case 'import':
        await this.importAlembic();
        break;
      case 'export':
        await this.exportAlembic();
        break;
      case 'stream':
        await this.streamAlembic();
        break;
    }
    
    // Output the archive
    const archiveOutput = this.outputs.get('archive');
    if (archiveOutput) {
      archiveOutput.value = this.archive;
    }
  }

  private async importAlembic(): Promise<void> {
    const filePath = this.getParameter('filePath');
    if (!filePath) {
      this.archive = this.createEmptyArchive();
      return;
    }
    
    // Parse Alembic file (simulated - would use Alembic SDK in production)
    this.archive = await this.parseAlembicFile(filePath);
    
    if (!this.archive) return;
    
    const timeOffset = this.getParameter('timeOffset');
    const timeScale = this.getParameter('timeScale');
    const currentTime = (this.currentFrame + timeOffset) * timeScale;
    
    // Extract and output data
    await this.extractData(currentTime);
    
    // Output frame range
    const frameRangeOutput = this.outputs.get('frameRange');
    if (frameRangeOutput && this.archive) {
      frameRangeOutput.value = {
        start: this.archive.frameRange.start,
        end: this.archive.frameRange.end,
        fps: this.getParameter('fps')
      };
    }
  }

  private async exportAlembic(): Promise<void> {
    this.archive = this.createEmptyArchive();
    
    // Collect input data
    const geometryInput = this.inputs.get('geometry');
    const transformsInput = this.inputs.get('transforms');
    const camerasInput = this.inputs.get('cameras');
    const particlesInput = this.inputs.get('particles');
    const curvesInput = this.inputs.get('curves');
    
    // Create root transform
    const rootXform = this.createAlembicObject('/Root', 'Xform');
    this.archive.rootObjects.push(rootXform);
    
    // Add geometry
    if (this.getParameter('exportMeshes') && geometryInput?.value) {
      this.addGeometryToArchive(geometryInput.value);
    }
    
    // Add transforms
    if (this.getParameter('exportXforms') && transformsInput?.value) {
      this.addTransformsToArchive(transformsInput.value);
    }
    
    // Add cameras
    if (this.getParameter('exportCameras') && camerasInput?.value) {
      this.addCamerasToArchive(camerasInput.value);
    }
    
    // Add particles/points
    if (this.getParameter('exportPoints') && particlesInput?.value) {
      this.addParticlesToArchive(particlesInput.value);
    }
    
    // Add curves
    if (this.getParameter('exportCurves') && curvesInput?.value) {
      this.addCurvesToArchive(curvesInput.value);
    }
    
    // Build hierarchy output
    this.buildHierarchyOutput();
  }

  private async streamAlembic(): Promise<void> {
    // Streaming mode - load only required frames
    if (!this.archive) {
      const filePath = this.getParameter('filePath');
      if (filePath) {
        this.archive = await this.parseAlembicFile(filePath);
      }
    }
    
    if (!this.archive) return;
    
    const preloadFrames = this.getParameter('preloadFrames');
    const startPreload = Math.max(1, this.currentFrame - Math.floor(preloadFrames / 2));
    const endPreload = this.currentFrame + Math.ceil(preloadFrames / 2);
    
    // Preload surrounding frames
    for (let frame = startPreload; frame <= endPreload; frame++) {
      await this.preloadFrame(frame);
    }
    
    // Extract data for current frame
    await this.extractData(this.currentFrame);
  }

  private createEmptyArchive(): AlembicArchive {
    return {
      fileName: this.getParameter('filePath') || 'export.abc',
      archiveType: this.getParameter('archiveType') as 'Ogawa' | 'HDF5',
      applicationInfo: 'RageVFX 3.1.0',
      dateWritten: new Date().toISOString(),
      rootObjects: [],
      timeSamplings: [{
        index: 0,
        type: 'uniform',
        startTime: 0,
        timePerCycle: 1 / this.getParameter('fps'),
        numSamplesPerCycle: 1,
        sampleTimes: []
      }],
      frameRange: {
        start: this.getParameter('startFrame'),
        end: this.getParameter('endFrame')
      }
    };
  }

  private async parseAlembicFile(filePath: string): Promise<AlembicArchive | null> {
    // Simulated Alembic parsing - would use Alembic SDK in production
    const archive = this.createEmptyArchive();
    archive.fileName = filePath;
    
    // Create sample hierarchy
    const rootXform = this.createAlembicObject('/Root', 'Xform');
    
    // Add sample mesh
    if (this.getParameter('importMeshes')) {
      const mesh = this.createAlembicObject('/Root/Mesh', 'PolyMesh');
      mesh.parent = '/Root';
      mesh.properties = [
        { name: 'P', type: 'Point3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 100, timeSampling: 0 },
        { name: 'N', type: 'N3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 100, timeSampling: 0 },
        { name: 'uv', type: 'V2fArraySample', scope: 'facevarying', extent: 2, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 }
      ];
      rootXform.children.push('/Root/Mesh');
      this.objectCache.set(mesh.path, mesh);
    }
    
    // Add sample camera
    if (this.getParameter('importCameras')) {
      const camera = this.createAlembicObject('/Root/Camera', 'Camera');
      camera.parent = '/Root';
      camera.properties = [
        { name: 'focalLength', type: 'float', scope: 'constant', extent: 1, isScalar: true, isArray: false, numSamples: 100, timeSampling: 0 },
        { name: 'horizontalAperture', type: 'float', scope: 'constant', extent: 1, isScalar: true, isArray: false, numSamples: 1, timeSampling: 0 },
        { name: 'verticalAperture', type: 'float', scope: 'constant', extent: 1, isScalar: true, isArray: false, numSamples: 1, timeSampling: 0 }
      ];
      rootXform.children.push('/Root/Camera');
      this.objectCache.set(camera.path, camera);
    }
    
    // Add sample points
    if (this.getParameter('importPoints')) {
      const points = this.createAlembicObject('/Root/Points', 'Points');
      points.parent = '/Root';
      points.properties = [
        { name: 'P', type: 'Point3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 100, timeSampling: 0 },
        { name: 'velocity', type: 'V3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 100, timeSampling: 0 },
        { name: 'width', type: 'FloatArraySample', scope: 'vertex', extent: 1, isScalar: false, isArray: true, numSamples: 100, timeSampling: 0 }
      ];
      rootXform.children.push('/Root/Points');
      this.objectCache.set(points.path, points);
    }
    
    archive.rootObjects.push(rootXform);
    this.objectCache.set(rootXform.path, rootXform);
    
    return archive;
  }

  private createAlembicObject(path: string, schemaType: AlembicSchemaType): AlembicObject {
    const name = path.split('/').pop() || 'Object';
    return {
      name,
      path,
      schemaType,
      parent: null,
      children: [],
      properties: [],
      sampleTimes: [],
      isConstant: false,
      metadata: {}
    };
  }

  private async extractData(time: number): Promise<void> {
    if (!this.archive) return;
    
    // Extract geometry
    if (this.getParameter('importMeshes')) {
      const geometry = await this.extractGeometry(time);
      const geoOutput = this.outputs.get('geometry');
      if (geoOutput) geoOutput.value = geometry;
    }
    
    // Extract transforms
    if (this.getParameter('importXforms')) {
      const transforms = await this.extractTransforms(time);
      const xformOutput = this.outputs.get('transforms');
      if (xformOutput) xformOutput.value = transforms;
    }
    
    // Extract cameras
    if (this.getParameter('importCameras')) {
      const cameras = await this.extractCameras(time);
      const camOutput = this.outputs.get('cameras');
      if (camOutput) camOutput.value = cameras;
    }
    
    // Extract particles
    if (this.getParameter('importPoints')) {
      const particles = await this.extractParticles(time);
      const partOutput = this.outputs.get('particles');
      if (partOutput) partOutput.value = particles;
    }
    
    // Extract curves
    if (this.getParameter('importCurves')) {
      const curves = await this.extractCurves(time);
      const curveOutput = this.outputs.get('curves');
      if (curveOutput) curveOutput.value = curves;
    }
    
    // Build hierarchy
    this.buildHierarchyOutput();
  }

  private async extractGeometry(time: number): Promise<unknown[]> {
    const geometries: unknown[] = [];
    
    this.objectCache.forEach((obj) => {
      if (obj.schemaType === 'PolyMesh' || obj.schemaType === 'SubD') {
        // Sample geometry at time
        const sampleIndex = this.findSampleIndex(obj, time);
        
        geometries.push({
          path: obj.path,
          name: obj.name,
          type: obj.schemaType,
          sampleIndex,
          isConstant: obj.isConstant,
          properties: obj.properties.map(p => p.name)
        });
      }
    });
    
    return geometries;
  }

  private async extractTransforms(time: number): Promise<unknown[]> {
    const transforms: unknown[] = [];
    
    this.objectCache.forEach((obj) => {
      if (obj.schemaType === 'Xform') {
        const sampleIndex = this.findSampleIndex(obj, time);
        
        transforms.push({
          path: obj.path,
          name: obj.name,
          sampleIndex,
          isConstant: obj.isConstant,
          // Simulated transform data
          matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
        });
      }
    });
    
    return transforms;
  }

  private async extractCameras(time: number): Promise<unknown[]> {
    const cameras: unknown[] = [];
    
    this.objectCache.forEach((obj) => {
      if (obj.schemaType === 'Camera') {
        const sampleIndex = this.findSampleIndex(obj, time);
        
        cameras.push({
          path: obj.path,
          name: obj.name,
          sampleIndex,
          focalLength: 35, // Simulated
          horizontalAperture: 36,
          verticalAperture: 24,
          nearClip: 0.1,
          farClip: 10000
        });
      }
    });
    
    return cameras;
  }

  private async extractParticles(time: number): Promise<unknown[]> {
    const particles: unknown[] = [];
    
    this.objectCache.forEach((obj) => {
      if (obj.schemaType === 'Points') {
        const sampleIndex = this.findSampleIndex(obj, time);
        
        particles.push({
          path: obj.path,
          name: obj.name,
          sampleIndex,
          count: 1000, // Simulated
          hasVelocity: this.getParameter('importVelocities')
        });
      }
    });
    
    return particles;
  }

  private async extractCurves(time: number): Promise<unknown[]> {
    const curves: unknown[] = [];
    
    this.objectCache.forEach((obj) => {
      if (obj.schemaType === 'Curves') {
        const sampleIndex = this.findSampleIndex(obj, time);
        
        curves.push({
          path: obj.path,
          name: obj.name,
          sampleIndex,
          numCurves: 10, // Simulated
          curveType: 'linear'
        });
      }
    });
    
    return curves;
  }

  private findSampleIndex(obj: AlembicObject, time: number): number {
    if (obj.isConstant || obj.sampleTimes.length === 0) {
      return 0;
    }
    
    // Find nearest sample
    let nearestIndex = 0;
    let minDiff = Infinity;
    
    for (let i = 0; i < obj.sampleTimes.length; i++) {
      const diff = Math.abs(obj.sampleTimes[i] - time);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = i;
      }
    }
    
    return nearestIndex;
  }

  private addGeometryToArchive(geometry: unknown): void {
    if (!this.archive) return;
    
    const geometries = Array.isArray(geometry) ? geometry : [geometry];
    
    geometries.forEach((geo, index) => {
      const mesh = this.createAlembicObject(`/Root/Mesh_${index}`, 'PolyMesh');
      mesh.parent = '/Root';
      mesh.metadata = { sourceGeometry: JSON.stringify(geo) };
      
      // Add standard mesh properties
      mesh.properties = [
        { name: 'P', type: 'Point3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 }
      ];
      
      if (this.getParameter('exportNormals')) {
        mesh.properties.push({ name: 'N', type: 'N3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 });
      }
      
      if (this.getParameter('exportUVs')) {
        mesh.properties.push({ name: 'uv', type: 'V2fArraySample', scope: 'facevarying', extent: 2, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 });
      }
      
      if (this.getParameter('exportVelocities')) {
        mesh.properties.push({ name: 'velocity', type: 'V3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 });
      }
      
      this.objectCache.set(mesh.path, mesh);
      
      const rootObj = this.archive!.rootObjects.find(o => o.path === '/Root');
      if (rootObj) {
        rootObj.children.push(mesh.path);
      }
    });
  }

  private addTransformsToArchive(transforms: unknown): void {
    if (!this.archive) return;
    
    const xforms = Array.isArray(transforms) ? transforms : [transforms];
    
    xforms.forEach((xform, index) => {
      const xformObj = this.createAlembicObject(`/Root/Xform_${index}`, 'Xform');
      xformObj.parent = '/Root';
      xformObj.metadata = { sourceTransform: JSON.stringify(xform) };
      
      this.objectCache.set(xformObj.path, xformObj);
      
      const rootObj = this.archive!.rootObjects.find(o => o.path === '/Root');
      if (rootObj) {
        rootObj.children.push(xformObj.path);
      }
    });
  }

  private addCamerasToArchive(cameras: unknown): void {
    if (!this.archive) return;
    
    const cams = Array.isArray(cameras) ? cameras : [cameras];
    
    cams.forEach((cam, index) => {
      const camObj = this.createAlembicObject(`/Root/Camera_${index}`, 'Camera');
      camObj.parent = '/Root';
      camObj.metadata = { sourceCamera: JSON.stringify(cam) };
      
      camObj.properties = [
        { name: 'focalLength', type: 'float', scope: 'constant', extent: 1, isScalar: true, isArray: false, numSamples: 1, timeSampling: 0 },
        { name: 'horizontalAperture', type: 'float', scope: 'constant', extent: 1, isScalar: true, isArray: false, numSamples: 1, timeSampling: 0 },
        { name: 'verticalAperture', type: 'float', scope: 'constant', extent: 1, isScalar: true, isArray: false, numSamples: 1, timeSampling: 0 }
      ];
      
      this.objectCache.set(camObj.path, camObj);
      
      const rootObj = this.archive!.rootObjects.find(o => o.path === '/Root');
      if (rootObj) {
        rootObj.children.push(camObj.path);
      }
    });
  }

  private addParticlesToArchive(particles: unknown): void {
    if (!this.archive) return;
    
    const particleData = Array.isArray(particles) ? particles : [particles];
    
    particleData.forEach((part, index) => {
      const pointsObj = this.createAlembicObject(`/Root/Points_${index}`, 'Points');
      pointsObj.parent = '/Root';
      pointsObj.metadata = { sourceParticles: JSON.stringify(part) };
      
      pointsObj.properties = [
        { name: 'P', type: 'Point3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 },
        { name: 'id', type: 'UInt64ArraySample', scope: 'vertex', extent: 1, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 }
      ];
      
      if (this.getParameter('exportVelocities')) {
        pointsObj.properties.push({ name: 'velocity', type: 'V3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 });
      }
      
      this.objectCache.set(pointsObj.path, pointsObj);
      
      const rootObj = this.archive!.rootObjects.find(o => o.path === '/Root');
      if (rootObj) {
        rootObj.children.push(pointsObj.path);
      }
    });
  }

  private addCurvesToArchive(curves: unknown): void {
    if (!this.archive) return;
    
    const curveData = Array.isArray(curves) ? curves : [curves];
    
    curveData.forEach((curve, index) => {
      const curvesObj = this.createAlembicObject(`/Root/Curves_${index}`, 'Curves');
      curvesObj.parent = '/Root';
      curvesObj.metadata = { sourceCurves: JSON.stringify(curve) };
      
      curvesObj.properties = [
        { name: 'P', type: 'Point3fArraySample', scope: 'vertex', extent: 3, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 },
        { name: 'nVertices', type: 'Int32ArraySample', scope: 'uniform', extent: 1, isScalar: false, isArray: true, numSamples: 1, timeSampling: 0 }
      ];
      
      this.objectCache.set(curvesObj.path, curvesObj);
      
      const rootObj = this.archive!.rootObjects.find(o => o.path === '/Root');
      if (rootObj) {
        rootObj.children.push(curvesObj.path);
      }
    });
  }

  private async preloadFrame(frame: number): Promise<void> {
    // Preload geometry cache for frame
    const cacheKey = `frame_${frame}`;
    if (this.geometryCache.has(cacheKey)) return;
    
    // Simulated preload - would load actual data in production
    const geometry: AlembicGeometry = {
      positions: new Float32Array(0),
      normals: null,
      uvs: null,
      indices: null,
      velocities: null,
      faceSetNames: [],
      faceCounts: null
    };
    
    this.geometryCache.set(cacheKey, geometry);
    
    // Manage cache memory
    this.manageCacheMemory();
  }

  private manageCacheMemory(): void {
    const memoryLimit = this.getParameter('cacheMemoryLimit') * 1024 * 1024; // Convert MB to bytes
    let currentMemory = 0;
    
    // Estimate current cache memory
    this.geometryCache.forEach((geo) => {
      currentMemory += geo.positions.byteLength;
      if (geo.normals) currentMemory += geo.normals.byteLength;
      if (geo.uvs) currentMemory += geo.uvs.byteLength;
      if (geo.indices) currentMemory += geo.indices.byteLength;
      if (geo.velocities) currentMemory += geo.velocities.byteLength;
    });
    
    // Evict oldest entries if over limit
    if (currentMemory > memoryLimit) {
      const keysToRemove: string[] = [];
      const keys = Array.from(this.geometryCache.keys());
      
      for (const key of keys) {
        if (currentMemory <= memoryLimit) break;
        
        const geo = this.geometryCache.get(key)!;
        let entrySize = geo.positions.byteLength;
        if (geo.normals) entrySize += geo.normals.byteLength;
        if (geo.uvs) entrySize += geo.uvs.byteLength;
        if (geo.indices) entrySize += geo.indices.byteLength;
        if (geo.velocities) entrySize += geo.velocities.byteLength;
        
        keysToRemove.push(key);
        currentMemory -= entrySize;
      }
      
      keysToRemove.forEach(key => this.geometryCache.delete(key));
    }
  }

  private buildHierarchyOutput(): void {
    const hierarchy: unknown[] = [];
    
    const buildObjectHierarchy = (obj: AlembicObject): unknown => {
      return {
        name: obj.name,
        path: obj.path,
        type: obj.schemaType,
        isConstant: obj.isConstant,
        numSamples: obj.sampleTimes.length,
        properties: obj.properties.map(p => ({
          name: p.name,
          type: p.type,
          scope: p.scope
        })),
        children: obj.children.map(childPath => {
          const child = this.objectCache.get(childPath);
          return child ? buildObjectHierarchy(child) : null;
        }).filter(c => c !== null)
      };
    };
    
    if (this.archive) {
      for (const rootObj of this.archive.rootObjects) {
        hierarchy.push(buildObjectHierarchy(rootObj));
      }
    }
    
    const hierOutput = this.outputs.get('hierarchy');
    if (hierOutput) {
      hierOutput.value = {
        archive: this.archive?.fileName,
        type: this.archive?.archiveType,
        frameRange: this.archive?.frameRange,
        objects: hierarchy
      };
    }
  }

  // Public API
  
  getArchive(): AlembicArchive | null {
    return this.archive;
  }
  
  getObjectAtPath(path: string): AlembicObject | null {
    return this.objectCache.get(path) || null;
  }
  
  getFrameRange(): { start: number; end: number } | null {
    return this.archive?.frameRange || null;
  }
  
  setFrame(frame: number): void {
    this.currentFrame = frame;
    this.setParameter('currentFrame', frame);
  }
  
  clearCache(): void {
    this.geometryCache.clear();
  }

  dispose(): void {
    this.archive = null;
    this.objectCache.clear();
    this.geometryCache.clear();
    super.dispose();
  }
}
