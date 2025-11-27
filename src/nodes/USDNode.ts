/**
 * USDNode - Universal Scene Description import/export
 * Version 3.1 - Pipeline & Collaboration
 * 
 * Features:
 * - USD file import/export
 * - Stage management
 * - Layer composition
 * - Variant sets
 * - References and payloads
 * - Asset resolution
 * - Time sampling for animation
 */

import { Node, DataType } from '../core/Node';

// USD Prim interface
export interface USDPrim {
  path: string;
  type: string;
  name: string;
  properties: Map<string, USDProperty>;
  children: USDPrim[];
  variants: Map<string, string[]>;
  activeVariant: Map<string, string>;
  references: string[];
  payloads: string[];
  isActive: boolean;
  isLoaded: boolean;
  metadata: Record<string, unknown>;
}

// USD Property interface
export interface USDProperty {
  name: string;
  type: 'attribute' | 'relationship';
  valueType: string;
  value: unknown;
  timeSamples: Map<number, unknown>;
  isAnimated: boolean;
  interpolation: 'linear' | 'held' | 'none';
}

// USD Layer interface
export interface USDLayer {
  identifier: string;
  rootPrims: USDPrim[];
  sublayers: string[];
  defaultPrim: string;
  timeCodesPerSecond: number;
  startTimeCode: number;
  endTimeCode: number;
  metersPerUnit: number;
  upAxis: 'Y' | 'Z';
  documentation: string;
}

// USD Stage interface
export interface USDStage {
  rootLayer: USDLayer;
  sessionLayer: USDLayer | null;
  editTarget: string;
  interpolationType: 'linear' | 'held';
  timeCodesPerSecond: number;
  framesPerSecond: number;
  startTimeCode: number;
  endTimeCode: number;
}

export class USDNode extends Node {
  private stage: USDStage | null = null;
  private primCache: Map<string, USDPrim> = new Map();
  private currentTime: number = 0;

  constructor(id: string) {
    super(id, 'USD', 'USD Scene');
    this.metadata.category = 'Pipeline';
    this.metadata.description = 'Universal Scene Description import/export for VFX pipeline integration';
    this.metadata.version = '3.1.0';
    
    // Inputs
    this.addInput('usdFile', 'USD File Path', DataType.ANY);
    this.addInput('geometry', 'Geometry Input', DataType.GEOMETRY_3D);
    this.addInput('materials', 'Materials', DataType.ANY);
    this.addInput('lights', 'Lights', DataType.ANY);
    this.addInput('cameras', 'Cameras', DataType.ANY);
    this.addInput('animations', 'Animations', DataType.ANY);
    
    // Outputs
    this.addOutput('stage', 'USD Stage', DataType.ANY);
    this.addOutput('geometry', 'Geometry Output', DataType.GEOMETRY_3D);
    this.addOutput('materials', 'Materials', DataType.ANY);
    this.addOutput('lights', 'Lights', DataType.ANY);
    this.addOutput('cameras', 'Cameras', DataType.ANY);
    this.addOutput('animations', 'Animations', DataType.ANY);
    this.addOutput('hierarchy', 'Scene Hierarchy', DataType.ANY);
    
    // === FILE SETTINGS ===
    this.setParameter('mode', 'import'); // import, export, compose
    this.setParameter('filePath', ''); // USD file path
    this.setParameter('exportFormat', 'usda'); // usda, usdc, usdz
    this.setParameter('defaultPrim', ''); // Default prim name
    
    // === LAYER SETTINGS ===
    this.setParameter('layerCompositionEnabled', true); // Checkbox
    this.setParameter('sublayersEnabled', true); // Checkbox
    this.setParameter('referencesEnabled', true); // Checkbox
    this.setParameter('payloadsEnabled', true); // Checkbox
    this.setParameter('payloadPolicy', 'load_all'); // load_all, load_none, selective
    
    // === TIME SETTINGS ===
    this.setParameter('timeCodesPerSecond', 24); // Slider 1-120
    this.setParameter('framesPerSecond', 24); // Slider 1-120
    this.setParameter('startTimeCode', 1); // Slider
    this.setParameter('endTimeCode', 100); // Slider
    this.setParameter('currentTime', 1); // Slider
    
    // === SCENE SETTINGS ===
    this.setParameter('upAxis', 'Y'); // Y or Z
    this.setParameter('metersPerUnit', 0.01); // Slider 0.001-100
    this.setParameter('interpolation', 'linear'); // linear, held
    
    // === VARIANT SETTINGS ===
    this.setParameter('variantSetsEnabled', true); // Checkbox
    this.setParameter('activeVariants', '{}'); // JSON object of variant selections
    
    // === IMPORT SETTINGS ===
    this.setParameter('importGeometry', true); // Checkbox
    this.setParameter('importMaterials', true); // Checkbox
    this.setParameter('importLights', true); // Checkbox
    this.setParameter('importCameras', true); // Checkbox
    this.setParameter('importAnimations', true); // Checkbox
    this.setParameter('importPointInstancer', true); // Checkbox
    this.setParameter('importSkeleton', true); // Checkbox
    
    // === EXPORT SETTINGS ===
    this.setParameter('exportGeometry', true); // Checkbox
    this.setParameter('exportMaterials', true); // Checkbox
    this.setParameter('exportLights', true); // Checkbox
    this.setParameter('exportCameras', true); // Checkbox
    this.setParameter('exportAnimations', true); // Checkbox
    this.setParameter('exportInvisible', false); // Checkbox
    this.setParameter('mergeMeshes', false); // Checkbox
    
    // === OPTIMIZATION ===
    this.setParameter('instanceOptimization', true); // Checkbox
    this.setParameter('deduplication', true); // Checkbox
    this.setParameter('compressionEnabled', true); // Checkbox for usdc
    
    // === DEBUG ===
    this.setParameter('debugMode', false); // Checkbox
    this.setParameter('validateOnLoad', true); // Checkbox
  }

  async process(): Promise<void> {
    const mode = this.getParameter('mode');
    this.currentTime = this.getParameter('currentTime');
    
    switch (mode) {
      case 'import':
        await this.importUSD();
        break;
      case 'export':
        await this.exportUSD();
        break;
      case 'compose':
        await this.composeUSD();
        break;
    }
    
    // Output the stage
    const stageOutput = this.outputs.get('stage');
    if (stageOutput) {
      stageOutput.value = this.stage;
    }
  }

  private async importUSD(): Promise<void> {
    const filePath = this.getParameter('filePath');
    if (!filePath) {
      // Create empty stage
      this.stage = this.createEmptyStage();
      return;
    }
    
    // Simulate USD file parsing (in production, would use USD SDK bindings)
    this.stage = await this.parseUSDFile(filePath);
    
    // Process imported data
    if (this.stage) {
      // Extract geometry
      if (this.getParameter('importGeometry')) {
        const geometry = this.extractGeometry(this.stage);
        const geoOutput = this.outputs.get('geometry');
        if (geoOutput) geoOutput.value = geometry;
      }
      
      // Extract materials
      if (this.getParameter('importMaterials')) {
        const materials = this.extractMaterials(this.stage);
        const matOutput = this.outputs.get('materials');
        if (matOutput) matOutput.value = materials;
      }
      
      // Extract lights
      if (this.getParameter('importLights')) {
        const lights = this.extractLights(this.stage);
        const lightOutput = this.outputs.get('lights');
        if (lightOutput) lightOutput.value = lights;
      }
      
      // Extract cameras
      if (this.getParameter('importCameras')) {
        const cameras = this.extractCameras(this.stage);
        const camOutput = this.outputs.get('cameras');
        if (camOutput) camOutput.value = cameras;
      }
      
      // Extract animations
      if (this.getParameter('importAnimations')) {
        const animations = this.extractAnimations(this.stage);
        const animOutput = this.outputs.get('animations');
        if (animOutput) animOutput.value = animations;
      }
      
      // Build hierarchy
      const hierarchy = this.buildHierarchy(this.stage);
      const hierOutput = this.outputs.get('hierarchy');
      if (hierOutput) hierOutput.value = hierarchy;
    }
  }

  private async exportUSD(): Promise<void> {
    // Collect inputs
    const geometryInput = this.inputs.get('geometry');
    const materialsInput = this.inputs.get('materials');
    const lightsInput = this.inputs.get('lights');
    const camerasInput = this.inputs.get('cameras');
    const animationsInput = this.inputs.get('animations');
    
    // Create new stage for export
    this.stage = this.createEmptyStage();
    
    // Add geometry
    if (this.getParameter('exportGeometry') && geometryInput?.value) {
      this.addGeometryToPrim(this.stage.rootLayer.rootPrims, geometryInput.value);
    }
    
    // Add materials
    if (this.getParameter('exportMaterials') && materialsInput?.value) {
      this.addMaterialsToPrim(this.stage.rootLayer.rootPrims, materialsInput.value);
    }
    
    // Add lights
    if (this.getParameter('exportLights') && lightsInput?.value) {
      this.addLightsToPrim(this.stage.rootLayer.rootPrims, lightsInput.value);
    }
    
    // Add cameras
    if (this.getParameter('exportCameras') && camerasInput?.value) {
      this.addCamerasToPrim(this.stage.rootLayer.rootPrims, camerasInput.value);
    }
    
    // Add animations
    if (this.getParameter('exportAnimations') && animationsInput?.value) {
      this.addAnimationsToPrim(this.stage.rootLayer.rootPrims, animationsInput.value);
    }
    
    // Generate USD file data
    const usdData = this.generateUSDOutput();
    
    // Output the generated data
    const hierOutput = this.outputs.get('hierarchy');
    if (hierOutput) hierOutput.value = usdData;
  }

  private async composeUSD(): Promise<void> {
    // Layer composition - merge multiple USD layers
    const usdFileInput = this.inputs.get('usdFile');
    const sublayers: string[] = [];
    
    if (usdFileInput?.value) {
      if (Array.isArray(usdFileInput.value)) {
        sublayers.push(...usdFileInput.value);
      } else {
        sublayers.push(usdFileInput.value);
      }
    }
    
    // Create composed stage
    this.stage = this.createEmptyStage();
    this.stage.rootLayer.sublayers = sublayers;
    
    // Process layer composition
    for (const sublayerPath of sublayers) {
      const sublayer = await this.parseUSDFile(sublayerPath);
      if (sublayer) {
        this.composeLayers(this.stage.rootLayer, sublayer.rootLayer);
      }
    }
  }

  private createEmptyStage(): USDStage {
    const upAxis = this.getParameter('upAxis') as 'Y' | 'Z';
    
    return {
      rootLayer: {
        identifier: 'root.usda',
        rootPrims: [],
        sublayers: [],
        defaultPrim: this.getParameter('defaultPrim') || 'World',
        timeCodesPerSecond: this.getParameter('timeCodesPerSecond'),
        startTimeCode: this.getParameter('startTimeCode'),
        endTimeCode: this.getParameter('endTimeCode'),
        metersPerUnit: this.getParameter('metersPerUnit'),
        upAxis: upAxis,
        documentation: 'Generated by RageVFX 3.1'
      },
      sessionLayer: null,
      editTarget: 'root.usda',
      interpolationType: this.getParameter('interpolation') as 'linear' | 'held',
      timeCodesPerSecond: this.getParameter('timeCodesPerSecond'),
      framesPerSecond: this.getParameter('framesPerSecond'),
      startTimeCode: this.getParameter('startTimeCode'),
      endTimeCode: this.getParameter('endTimeCode')
    };
  }

  private async parseUSDFile(filePath: string): Promise<USDStage | null> {
    // Simulated USD parsing - in production would use USD SDK
    const stage = this.createEmptyStage();
    stage.rootLayer.identifier = filePath;
    
    // Create sample hierarchy for demonstration
    const worldPrim: USDPrim = this.createPrim('/World', 'Xform', 'World');
    
    // Add sample geometry prim
    const geoPrim = this.createPrim('/World/Geometry', 'Scope', 'Geometry');
    worldPrim.children.push(geoPrim);
    
    // Add sample materials prim
    const matPrim = this.createPrim('/World/Materials', 'Scope', 'Materials');
    worldPrim.children.push(matPrim);
    
    // Add sample lights prim
    const lightsPrim = this.createPrim('/World/Lights', 'Scope', 'Lights');
    worldPrim.children.push(lightsPrim);
    
    // Add sample cameras prim
    const camsPrim = this.createPrim('/World/Cameras', 'Scope', 'Cameras');
    worldPrim.children.push(camsPrim);
    
    stage.rootLayer.rootPrims.push(worldPrim);
    stage.rootLayer.defaultPrim = 'World';
    
    return stage;
  }

  private createPrim(path: string, type: string, name: string): USDPrim {
    return {
      path,
      type,
      name,
      properties: new Map(),
      children: [],
      variants: new Map(),
      activeVariant: new Map(),
      references: [],
      payloads: [],
      isActive: true,
      isLoaded: true,
      metadata: {}
    };
  }

  private extractGeometry(stage: USDStage): unknown[] {
    const geometry: unknown[] = [];
    
    const traversePrim = (prim: USDPrim) => {
      if (prim.type === 'Mesh' || prim.type === 'BasisCurves' || prim.type === 'Points' || 
          prim.type === 'NurbsCurves' || prim.type === 'NurbsPatch' || prim.type === 'Capsule' ||
          prim.type === 'Cone' || prim.type === 'Cube' || prim.type === 'Cylinder' || prim.type === 'Sphere') {
        geometry.push({
          path: prim.path,
          type: prim.type,
          name: prim.name,
          properties: Object.fromEntries(prim.properties)
        });
      }
      
      for (const child of prim.children) {
        traversePrim(child);
      }
    };
    
    for (const rootPrim of stage.rootLayer.rootPrims) {
      traversePrim(rootPrim);
    }
    
    return geometry;
  }

  private extractMaterials(stage: USDStage): unknown[] {
    const materials: unknown[] = [];
    
    const traversePrim = (prim: USDPrim) => {
      if (prim.type === 'Material' || prim.type === 'Shader') {
        materials.push({
          path: prim.path,
          type: prim.type,
          name: prim.name,
          properties: Object.fromEntries(prim.properties)
        });
      }
      
      for (const child of prim.children) {
        traversePrim(child);
      }
    };
    
    for (const rootPrim of stage.rootLayer.rootPrims) {
      traversePrim(rootPrim);
    }
    
    return materials;
  }

  private extractLights(stage: USDStage): unknown[] {
    const lights: unknown[] = [];
    
    const traversePrim = (prim: USDPrim) => {
      if (prim.type === 'DistantLight' || prim.type === 'DomeLight' || 
          prim.type === 'RectLight' || prim.type === 'SphereLight' ||
          prim.type === 'CylinderLight' || prim.type === 'DiskLight') {
        lights.push({
          path: prim.path,
          type: prim.type,
          name: prim.name,
          properties: Object.fromEntries(prim.properties)
        });
      }
      
      for (const child of prim.children) {
        traversePrim(child);
      }
    };
    
    for (const rootPrim of stage.rootLayer.rootPrims) {
      traversePrim(rootPrim);
    }
    
    return lights;
  }

  private extractCameras(stage: USDStage): unknown[] {
    const cameras: unknown[] = [];
    
    const traversePrim = (prim: USDPrim) => {
      if (prim.type === 'Camera') {
        cameras.push({
          path: prim.path,
          type: prim.type,
          name: prim.name,
          properties: Object.fromEntries(prim.properties)
        });
      }
      
      for (const child of prim.children) {
        traversePrim(child);
      }
    };
    
    for (const rootPrim of stage.rootLayer.rootPrims) {
      traversePrim(rootPrim);
    }
    
    return cameras;
  }

  private extractAnimations(stage: USDStage): unknown[] {
    const animations: unknown[] = [];
    
    const traversePrim = (prim: USDPrim) => {
      // Check for animated properties
      const animatedProps: Record<string, unknown> = {};
      prim.properties.forEach((prop, name) => {
        if (prop.isAnimated && prop.timeSamples.size > 0) {
          animatedProps[name] = {
            valueType: prop.valueType,
            timeSamples: Object.fromEntries(prop.timeSamples),
            interpolation: prop.interpolation
          };
        }
      });
      
      if (Object.keys(animatedProps).length > 0) {
        animations.push({
          path: prim.path,
          name: prim.name,
          animatedProperties: animatedProps
        });
      }
      
      for (const child of prim.children) {
        traversePrim(child);
      }
    };
    
    for (const rootPrim of stage.rootLayer.rootPrims) {
      traversePrim(rootPrim);
    }
    
    return animations;
  }

  private buildHierarchy(stage: USDStage): unknown {
    const buildPrimHierarchy = (prim: USDPrim): unknown => {
      return {
        path: prim.path,
        name: prim.name,
        type: prim.type,
        isActive: prim.isActive,
        isLoaded: prim.isLoaded,
        hasVariants: prim.variants.size > 0,
        hasReferences: prim.references.length > 0,
        hasPayloads: prim.payloads.length > 0,
        children: prim.children.map(child => buildPrimHierarchy(child))
      };
    };
    
    return {
      identifier: stage.rootLayer.identifier,
      defaultPrim: stage.rootLayer.defaultPrim,
      upAxis: stage.rootLayer.upAxis,
      metersPerUnit: stage.rootLayer.metersPerUnit,
      timeRange: {
        start: stage.startTimeCode,
        end: stage.endTimeCode,
        fps: stage.framesPerSecond
      },
      prims: stage.rootLayer.rootPrims.map(prim => buildPrimHierarchy(prim))
    };
  }

  private addGeometryToPrim(prims: USDPrim[], geometry: unknown): void {
    const geoPrim = this.createPrim('/World/Geometry', 'Scope', 'Geometry');
    
    if (Array.isArray(geometry)) {
      geometry.forEach((geo, index) => {
        const meshPrim = this.createPrim(`/World/Geometry/Mesh_${index}`, 'Mesh', `Mesh_${index}`);
        meshPrim.metadata = { sourceGeometry: geo };
        geoPrim.children.push(meshPrim);
      });
    }
    
    // Find or create World prim
    let worldPrim = prims.find(p => p.name === 'World');
    if (!worldPrim) {
      worldPrim = this.createPrim('/World', 'Xform', 'World');
      prims.push(worldPrim);
    }
    worldPrim.children.push(geoPrim);
  }

  private addMaterialsToPrim(prims: USDPrim[], materials: unknown): void {
    const matPrim = this.createPrim('/World/Materials', 'Scope', 'Materials');
    
    if (Array.isArray(materials)) {
      materials.forEach((mat, index) => {
        const materialPrim = this.createPrim(`/World/Materials/Material_${index}`, 'Material', `Material_${index}`);
        materialPrim.metadata = { sourceMaterial: mat };
        matPrim.children.push(materialPrim);
      });
    }
    
    let worldPrim = prims.find(p => p.name === 'World');
    if (!worldPrim) {
      worldPrim = this.createPrim('/World', 'Xform', 'World');
      prims.push(worldPrim);
    }
    worldPrim.children.push(matPrim);
  }

  private addLightsToPrim(prims: USDPrim[], lights: unknown): void {
    const lightsPrim = this.createPrim('/World/Lights', 'Scope', 'Lights');
    
    if (Array.isArray(lights)) {
      lights.forEach((light, index) => {
        const lightType = (light as { type?: string })?.type || 'SphereLight';
        const lightPrim = this.createPrim(`/World/Lights/Light_${index}`, lightType, `Light_${index}`);
        lightPrim.metadata = { sourceLight: light };
        lightsPrim.children.push(lightPrim);
      });
    }
    
    let worldPrim = prims.find(p => p.name === 'World');
    if (!worldPrim) {
      worldPrim = this.createPrim('/World', 'Xform', 'World');
      prims.push(worldPrim);
    }
    worldPrim.children.push(lightsPrim);
  }

  private addCamerasToPrim(prims: USDPrim[], cameras: unknown): void {
    const camsPrim = this.createPrim('/World/Cameras', 'Scope', 'Cameras');
    
    if (Array.isArray(cameras)) {
      cameras.forEach((cam, index) => {
        const camPrim = this.createPrim(`/World/Cameras/Camera_${index}`, 'Camera', `Camera_${index}`);
        camPrim.metadata = { sourceCamera: cam };
        camsPrim.children.push(camPrim);
      });
    }
    
    let worldPrim = prims.find(p => p.name === 'World');
    if (!worldPrim) {
      worldPrim = this.createPrim('/World', 'Xform', 'World');
      prims.push(worldPrim);
    }
    worldPrim.children.push(camsPrim);
  }

  private addAnimationsToPrim(prims: USDPrim[], animations: unknown): void {
    // Add time samples to existing prims based on animation data
    if (!Array.isArray(animations)) return;
    
    for (const anim of animations) {
      const animData = anim as { path?: string; keyframes?: unknown[] };
      if (animData.path) {
        const prim = this.findPrimByPath(prims, animData.path);
        if (prim && animData.keyframes) {
          // Add animation data as metadata
          prim.metadata.animation = animData.keyframes;
        }
      }
    }
  }

  private findPrimByPath(prims: USDPrim[], path: string): USDPrim | null {
    for (const prim of prims) {
      if (prim.path === path) return prim;
      const found = this.findPrimByPath(prim.children, path);
      if (found) return found;
    }
    return null;
  }

  private composeLayers(targetLayer: USDLayer, sourceLayer: USDLayer): void {
    // Merge prims from source into target
    for (const sourcePrim of sourceLayer.rootPrims) {
      const existingPrim = targetLayer.rootPrims.find(p => p.path === sourcePrim.path);
      if (existingPrim) {
        // Compose - stronger layer wins for non-composed attributes
        this.composePrims(existingPrim, sourcePrim);
      } else {
        // Add new prim
        targetLayer.rootPrims.push(sourcePrim);
      }
    }
  }

  private composePrims(target: USDPrim, source: USDPrim): void {
    // Merge properties
    source.properties.forEach((prop, name) => {
      if (!target.properties.has(name)) {
        target.properties.set(name, prop);
      }
    });
    
    // Compose children
    for (const sourceChild of source.children) {
      const existingChild = target.children.find(c => c.path === sourceChild.path);
      if (existingChild) {
        this.composePrims(existingChild, sourceChild);
      } else {
        target.children.push(sourceChild);
      }
    }
  }

  private generateUSDOutput(): string {
    if (!this.stage) return '';
    
    const _format = this.getParameter('exportFormat');
    
    // Generate USDA format output
    let output = '#usda 1.0\n';
    output += `(\n`;
    output += `    defaultPrim = "${this.stage.rootLayer.defaultPrim}"\n`;
    output += `    metersPerUnit = ${this.stage.rootLayer.metersPerUnit}\n`;
    output += `    upAxis = "${this.stage.rootLayer.upAxis}"\n`;
    output += `    doc = "${this.stage.rootLayer.documentation}"\n`;
    output += `    startTimeCode = ${this.stage.startTimeCode}\n`;
    output += `    endTimeCode = ${this.stage.endTimeCode}\n`;
    output += `    timeCodesPerSecond = ${this.stage.timeCodesPerSecond}\n`;
    output += `)\n\n`;
    
    for (const prim of this.stage.rootLayer.rootPrims) {
      output += this.generatePrimOutput(prim, 0);
    }
    
    return output;
  }

  private generatePrimOutput(prim: USDPrim, indent: number): string {
    const spaces = '    '.repeat(indent);
    let output = `${spaces}def ${prim.type} "${prim.name}"\n`;
    output += `${spaces}{\n`;
    
    prim.properties.forEach((prop, name) => {
      output += `${spaces}    ${prop.valueType} ${name} = ${JSON.stringify(prop.value)}\n`;
    });
    
    for (const child of prim.children) {
      output += '\n' + this.generatePrimOutput(child, indent + 1);
    }
    
    output += `${spaces}}\n`;
    return output;
  }

  // Public API
  
  getStage(): USDStage | null {
    return this.stage;
  }
  
  getPrimAtPath(path: string): USDPrim | null {
    if (!this.stage) return null;
    return this.findPrimByPath(this.stage.rootLayer.rootPrims, path);
  }
  
  setVariantSelection(primPath: string, variantSet: string, variant: string): void {
    const prim = this.getPrimAtPath(primPath);
    if (prim && prim.variants.has(variantSet)) {
      prim.activeVariant.set(variantSet, variant);
    }
  }
  
  setTime(time: number): void {
    this.currentTime = time;
    this.setParameter('currentTime', time);
  }

  dispose(): void {
    this.stage = null;
    this.primCache.clear();
    super.dispose();
  }
}
