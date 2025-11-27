/**
 * ProjectionPaintNode - Projection mapping and painting system for 3D surfaces (Mari-like)
 * Version 3.2 - Projection Mapping System
 */

import { Node, DataType } from '../core/Node';

interface BrushStroke {
  id: string;
  points: { x: number; y: number; pressure: number }[];
  brushType: string;
  color: { r: number; g: number; b: number; a: number };
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
  timestamp: number;
}

interface ProjectionLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  data: Float32Array | null;
  mask: Float32Array | null;
  strokes: BrushStroke[];
}

interface UVCoord {
  u: number;
  v: number;
}

export class ProjectionPaintNode extends Node {
  private layers: ProjectionLayer[] = [];
  private activeLayerId: string = '';
  private brushStrokes: BrushStroke[] = [];
  private undoStack: any[] = [];
  private redoStack: any[] = [];
  private resolution: { width: number; height: number } = { width: 4096, height: 4096 };

  constructor(id: string) {
    super(id, 'ProjectionPaint', 'Projection Paint');
    this.metadata.category = 'Projection';
    this.metadata.description = 'Mari-like projection painting system for 3D texturing';
    this.metadata.version = '3.2.0';
    
    // Inputs
    this.addInput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addInput('projectionImage', 'Projection Image', DataType.IMAGE);
    this.addInput('projectionVideo', 'Projection Video', DataType.IMAGE);
    this.addInput('camera', 'Camera', DataType.GEOMETRY_3D);
    this.addInput('uvMap', 'UV Map', DataType.IMAGE);
    this.addInput('mask', 'Mask', DataType.MASK);
    
    // Outputs
    this.addOutput('textureOutput', 'Texture Output', DataType.IMAGE);
    this.addOutput('normalMap', 'Normal Map', DataType.IMAGE);
    this.addOutput('displacementMap', 'Displacement Map', DataType.IMAGE);
    this.addOutput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addOutput('layers', 'Layers Data', DataType.ANY);
    
    // Texture Settings
    this.setParameter('resolution', { width: 4096, height: 4096 });
    this.setParameter('bitDepth', 16); // 8, 16, 32
    this.setParameter('colorSpace', 'sRGB'); // sRGB, Linear, ACEScg
    this.setParameter('tileSize', 1024);
    this.setParameter('mipmapLevels', 10);
    
    // Projection Settings
    this.setParameter('projectionMode', 'perspective'); // perspective, orthographic, cylindrical, spherical, planar, triplanar
    this.setParameter('projectionBlend', 0.5);
    this.setParameter('falloffAngle', 45);
    this.setParameter('falloffFeather', 10);
    this.setParameter('depthBlend', true);
    this.setParameter('depthTolerance', 0.01);
    
    // Brush Settings
    this.setParameter('brushType', 'round'); // round, square, custom, clone, smear, blur, sharpen, dodge, burn
    this.setParameter('brushSize', 100);
    this.setParameter('brushHardness', 0.75);
    this.setParameter('brushOpacity', 1.0);
    this.setParameter('brushFlow', 1.0);
    this.setParameter('brushSpacing', 0.1);
    this.setParameter('brushRotation', 0);
    this.setParameter('brushScatter', 0);
    this.setParameter('brushJitter', 0);
    this.setParameter('brushDynamics', {
      sizeByPressure: true,
      opacityByPressure: false,
      flowByPressure: false,
      rotationByStroke: false
    });
    
    // Color Settings
    this.setParameter('foregroundColor', { r: 1.0, g: 1.0, b: 1.0, a: 1.0 });
    this.setParameter('backgroundColor', { r: 0.0, g: 0.0, b: 0.0, a: 1.0 });
    
    // Layer Settings
    this.setParameter('activeLayer', 0);
    this.setParameter('layerBlendModes', [
      'normal', 'multiply', 'screen', 'overlay', 'softLight', 'hardLight',
      'colorDodge', 'colorBurn', 'darken', 'lighten', 'difference',
      'exclusion', 'hue', 'saturation', 'color', 'luminosity'
    ]);
    
    // Paint Modes
    this.setParameter('paintMode', 'paint'); // paint, project, clone, fill, erase
    this.setParameter('symmetryMode', 'none'); // none, x, y, z, radial
    this.setParameter('symmetryCount', 4);
    
    // UV Settings
    this.setParameter('uvChannel', 0);
    this.setParameter('udimSupport', true);
    this.setParameter('udimRange', { start: 1001, end: 1100 });
    
    // Performance
    this.setParameter('streamingEnabled', true);
    this.setParameter('gpuAcceleration', true);
    this.setParameter('undoLevels', 50);
    
    // Initialize default layer
    this.createDefaultLayer();
  }

  private createDefaultLayer(): void {
    const layer: ProjectionLayer = {
      id: `layer_${Date.now()}`,
      name: 'Base Layer',
      visible: true,
      locked: false,
      opacity: 1.0,
      blendMode: 'normal',
      data: null,
      mask: null,
      strokes: []
    };
    this.layers.push(layer);
    this.activeLayerId = layer.id;
  }

  async process(): Promise<void> {
    const geometry = this.inputs.get('geometry')?.value;
    const projectionImage = this.inputs.get('projectionImage')?.value;
    const projectionVideo = this.inputs.get('projectionVideo')?.value;
    const camera = this.inputs.get('camera')?.value;
    const uvMap = this.inputs.get('uvMap')?.value;
    const mask = this.inputs.get('mask')?.value;
    
    const resolution = this.getParameter('resolution');
    this.resolution = resolution;
    
    // Initialize layer data if needed
    this.initializeLayerData();
    
    // Process projection if image/video is provided
    if (projectionImage || projectionVideo) {
      const projectionSource = projectionImage || projectionVideo;
      await this.projectOntoSurface(projectionSource, geometry, camera, uvMap, mask);
    }
    
    // Composite all layers
    const compositedTexture = this.compositeLayers();
    
    // Generate output maps
    const textureOutput = this.outputs.get('textureOutput');
    if (textureOutput) {
      textureOutput.value = compositedTexture;
    }
    
    const normalMapOutput = this.outputs.get('normalMap');
    if (normalMapOutput) {
      normalMapOutput.value = this.generateNormalMap(compositedTexture);
    }
    
    const displacementOutput = this.outputs.get('displacementMap');
    if (displacementOutput) {
      displacementOutput.value = this.generateDisplacementMap();
    }
    
    const geometryOutput = this.outputs.get('geometry');
    if (geometryOutput && geometry) {
      geometryOutput.value = this.applyTextureToGeometry(geometry, compositedTexture);
    }
    
    const layersOutput = this.outputs.get('layers');
    if (layersOutput) {
      layersOutput.value = this.serializeLayers();
    }
  }

  private initializeLayerData(): void {
    const { width, height } = this.resolution;
    const pixelCount = width * height * 4;
    
    for (const layer of this.layers) {
      if (!layer.data) {
        layer.data = new Float32Array(pixelCount);
        // Initialize with transparent black
        for (let i = 0; i < pixelCount; i += 4) {
          layer.data[i] = 0;     // R
          layer.data[i + 1] = 0; // G
          layer.data[i + 2] = 0; // B
          layer.data[i + 3] = 0; // A
        }
      }
    }
  }

  private async projectOntoSurface(
    source: any,
    geometry: any,
    camera: any,
    uvMap: any,
    mask: any
  ): Promise<void> {
    if (!geometry || !source) return;
    
    const projectionMode = this.getParameter('projectionMode');
    const falloffAngle = this.getParameter('falloffAngle');
    const falloffFeather = this.getParameter('falloffFeather');
    const projectionBlend = this.getParameter('projectionBlend');
    const depthBlend = this.getParameter('depthBlend');
    
    const activeLayer = this.layers.find(l => l.id === this.activeLayerId);
    if (!activeLayer || !activeLayer.data) return;
    
    const { width, height } = this.resolution;
    
    // Get source image dimensions and data
    const sourceWidth = source.width || 1920;
    const sourceHeight = source.height || 1080;
    const sourceData = source.data || new Float32Array(sourceWidth * sourceHeight * 4);
    
    // For each texel in the texture
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        
        // Get 3D position from UV (simplified - in real implementation would use geometry)
        const worldPos = this.uvTo3D(u, v, geometry, uvMap);
        if (!worldPos) continue;
        
        // Calculate projection coordinates based on mode
        let projCoord: UVCoord | null = null;
        let projectionWeight = 1.0;
        
        switch (projectionMode) {
          case 'perspective':
            if (camera) {
              projCoord = this.perspectiveProject(worldPos, camera);
              projectionWeight = this.calculateAngleFalloff(worldPos, camera, falloffAngle, falloffFeather);
            }
            break;
          case 'orthographic':
            projCoord = this.orthographicProject(worldPos, camera);
            break;
          case 'cylindrical':
            projCoord = this.cylindricalProject(worldPos);
            break;
          case 'spherical':
            projCoord = this.sphericalProject(worldPos);
            break;
          case 'planar':
            projCoord = this.planarProject(worldPos);
            break;
          case 'triplanar':
            projCoord = this.triplanarProject(worldPos);
            break;
        }
        
        if (!projCoord) continue;
        if (projCoord.u < 0 || projCoord.u > 1 || projCoord.v < 0 || projCoord.v > 1) continue;
        
        // Apply mask if provided
        if (mask) {
          const maskIdx = (Math.floor(v * mask.height) * mask.width + Math.floor(u * mask.width)) * 4;
          projectionWeight *= (mask.data?.[maskIdx + 3] ?? 255) / 255;
        }
        
        // Sample source image
        const srcX = Math.floor(projCoord.u * sourceWidth);
        const srcY = Math.floor(projCoord.v * sourceHeight);
        const srcIdx = (srcY * sourceWidth + srcX) * 4;
        
        const srcR = sourceData[srcIdx] || 0;
        const srcG = sourceData[srcIdx + 1] || 0;
        const srcB = sourceData[srcIdx + 2] || 0;
        const srcA = (sourceData[srcIdx + 3] || 0) * projectionWeight * projectionBlend;
        
        // Blend into layer
        const dstIdx = (y * width + x) * 4;
        const dstR = activeLayer.data[dstIdx];
        const dstG = activeLayer.data[dstIdx + 1];
        const dstB = activeLayer.data[dstIdx + 2];
        const dstA = activeLayer.data[dstIdx + 3];
        
        // Alpha blending
        const outA = srcA + dstA * (1 - srcA);
        if (outA > 0) {
          activeLayer.data[dstIdx] = (srcR * srcA + dstR * dstA * (1 - srcA)) / outA;
          activeLayer.data[dstIdx + 1] = (srcG * srcA + dstG * dstA * (1 - srcA)) / outA;
          activeLayer.data[dstIdx + 2] = (srcB * srcA + dstB * dstA * (1 - srcA)) / outA;
          activeLayer.data[dstIdx + 3] = outA;
        }
      }
    }
  }

  private uvTo3D(u: number, v: number, geometry: any, uvMap: any): { x: number; y: number; z: number } | null {
    // Simplified UV to 3D mapping - in real implementation would use geometry mesh data
    if (!geometry) {
      return { x: u * 2 - 1, y: 0, z: v * 2 - 1 };
    }
    
    // Use geometry vertices and UV coordinates to find 3D position
    return { x: u * 2 - 1, y: Math.sin(u * Math.PI) * 0.5, z: v * 2 - 1 };
  }

  private perspectiveProject(worldPos: { x: number; y: number; z: number }, camera: any): UVCoord | null {
    if (!camera) return null;
    
    // Get camera properties
    const camPos = camera.position || { x: 0, y: 0, z: 5 };
    const fov = camera.fov || 50;
    const aspect = camera.aspect || 16 / 9;
    
    // Transform to camera space
    const dx = worldPos.x - camPos.x;
    const dy = worldPos.y - camPos.y;
    const dz = worldPos.z - camPos.z;
    
    if (dz <= 0) return null; // Behind camera
    
    // Perspective projection
    const tanHalfFov = Math.tan((fov * Math.PI / 180) / 2);
    const u = (dx / (dz * tanHalfFov * aspect) + 1) / 2;
    const v = 1 - (dy / (dz * tanHalfFov) + 1) / 2;
    
    return { u, v };
  }

  private orthographicProject(worldPos: { x: number; y: number; z: number }, camera: any): UVCoord {
    const size = camera?.orthoSize || 5;
    return {
      u: (worldPos.x / size + 1) / 2,
      v: (worldPos.y / size + 1) / 2
    };
  }

  private cylindricalProject(worldPos: { x: number; y: number; z: number }): UVCoord {
    const angle = Math.atan2(worldPos.x, worldPos.z);
    return {
      u: (angle / Math.PI + 1) / 2,
      v: (worldPos.y + 1) / 2
    };
  }

  private sphericalProject(worldPos: { x: number; y: number; z: number }): UVCoord {
    const r = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y + worldPos.z * worldPos.z);
    const theta = Math.atan2(worldPos.x, worldPos.z);
    const phi = Math.asin(worldPos.y / r);
    
    return {
      u: (theta / Math.PI + 1) / 2,
      v: (phi / (Math.PI / 2) + 1) / 2
    };
  }

  private planarProject(worldPos: { x: number; y: number; z: number }): UVCoord {
    return {
      u: (worldPos.x + 1) / 2,
      v: (worldPos.z + 1) / 2
    };
  }

  private triplanarProject(worldPos: { x: number; y: number; z: number }): UVCoord {
    // Return planar projection for now - would blend all three axes in real implementation
    const absX = Math.abs(worldPos.x);
    const absY = Math.abs(worldPos.y);
    const absZ = Math.abs(worldPos.z);
    
    if (absY > absX && absY > absZ) {
      return { u: (worldPos.x + 1) / 2, v: (worldPos.z + 1) / 2 };
    } else if (absX > absZ) {
      return { u: (worldPos.z + 1) / 2, v: (worldPos.y + 1) / 2 };
    } else {
      return { u: (worldPos.x + 1) / 2, v: (worldPos.y + 1) / 2 };
    }
  }

  private calculateAngleFalloff(worldPos: any, camera: any, falloffAngle: number, feather: number): number {
    // Calculate angle between surface normal and camera direction
    // Returns 1.0 for head-on, 0.0 for perpendicular
    const camPos = camera?.position || { x: 0, y: 0, z: 5 };
    
    // Simplified normal (would use actual geometry normals)
    const normal = { x: 0, y: 1, z: 0 };
    
    // View direction
    const dx = camPos.x - worldPos.x;
    const dy = camPos.y - worldPos.y;
    const dz = camPos.z - worldPos.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const viewDir = { x: dx / len, y: dy / len, z: dz / len };
    
    // Dot product
    const dot = normal.x * viewDir.x + normal.y * viewDir.y + normal.z * viewDir.z;
    const angle = Math.acos(Math.abs(dot)) * 180 / Math.PI;
    
    if (angle > falloffAngle + feather) return 0;
    if (angle < falloffAngle) return 1;
    
    return 1 - (angle - falloffAngle) / feather;
  }

  private compositeLayers(): any {
    const { width, height } = this.resolution;
    const result = new Float32Array(width * height * 4);
    
    // Start with background color
    const bgColor = this.getParameter('backgroundColor');
    for (let i = 0; i < result.length; i += 4) {
      result[i] = bgColor.r;
      result[i + 1] = bgColor.g;
      result[i + 2] = bgColor.b;
      result[i + 3] = bgColor.a;
    }
    
    // Composite each visible layer
    for (const layer of this.layers) {
      if (!layer.visible || !layer.data) continue;
      
      for (let i = 0; i < result.length; i += 4) {
        const srcR = layer.data[i];
        const srcG = layer.data[i + 1];
        const srcB = layer.data[i + 2];
        const srcA = layer.data[i + 3] * layer.opacity;
        
        const dstR = result[i];
        const dstG = result[i + 1];
        const dstB = result[i + 2];
        const dstA = result[i + 3];
        
        // Apply blend mode
        const blended = this.blendColors(
          { r: srcR, g: srcG, b: srcB, a: srcA },
          { r: dstR, g: dstG, b: dstB, a: dstA },
          layer.blendMode
        );
        
        result[i] = blended.r;
        result[i + 1] = blended.g;
        result[i + 2] = blended.b;
        result[i + 3] = blended.a;
      }
    }
    
    return {
      width,
      height,
      data: result,
      format: 'rgba32f'
    };
  }

  private blendColors(src: any, dst: any, mode: string): any {
    const alpha = src.a;
    let r = src.r, g = src.g, b = src.b;
    
    switch (mode) {
      case 'multiply':
        r = src.r * dst.r;
        g = src.g * dst.g;
        b = src.b * dst.b;
        break;
      case 'screen':
        r = 1 - (1 - src.r) * (1 - dst.r);
        g = 1 - (1 - src.g) * (1 - dst.g);
        b = 1 - (1 - src.b) * (1 - dst.b);
        break;
      case 'overlay':
        r = dst.r < 0.5 ? 2 * src.r * dst.r : 1 - 2 * (1 - src.r) * (1 - dst.r);
        g = dst.g < 0.5 ? 2 * src.g * dst.g : 1 - 2 * (1 - src.g) * (1 - dst.g);
        b = dst.b < 0.5 ? 2 * src.b * dst.b : 1 - 2 * (1 - src.b) * (1 - dst.b);
        break;
      case 'softLight':
        r = (1 - 2 * src.r) * dst.r * dst.r + 2 * src.r * dst.r;
        g = (1 - 2 * src.g) * dst.g * dst.g + 2 * src.g * dst.g;
        b = (1 - 2 * src.b) * dst.b * dst.b + 2 * src.b * dst.b;
        break;
      case 'hardLight':
        r = src.r < 0.5 ? 2 * src.r * dst.r : 1 - 2 * (1 - src.r) * (1 - dst.r);
        g = src.g < 0.5 ? 2 * src.g * dst.g : 1 - 2 * (1 - src.g) * (1 - dst.g);
        b = src.b < 0.5 ? 2 * src.b * dst.b : 1 - 2 * (1 - src.b) * (1 - dst.b);
        break;
      case 'colorDodge':
        r = dst.r === 0 ? 0 : Math.min(1, dst.r / (1 - src.r + 0.001));
        g = dst.g === 0 ? 0 : Math.min(1, dst.g / (1 - src.g + 0.001));
        b = dst.b === 0 ? 0 : Math.min(1, dst.b / (1 - src.b + 0.001));
        break;
      case 'colorBurn':
        r = dst.r === 1 ? 1 : Math.max(0, 1 - (1 - dst.r) / (src.r + 0.001));
        g = dst.g === 1 ? 1 : Math.max(0, 1 - (1 - dst.g) / (src.g + 0.001));
        b = dst.b === 1 ? 1 : Math.max(0, 1 - (1 - dst.b) / (src.b + 0.001));
        break;
      case 'darken':
        r = Math.min(src.r, dst.r);
        g = Math.min(src.g, dst.g);
        b = Math.min(src.b, dst.b);
        break;
      case 'lighten':
        r = Math.max(src.r, dst.r);
        g = Math.max(src.g, dst.g);
        b = Math.max(src.b, dst.b);
        break;
      case 'difference':
        r = Math.abs(src.r - dst.r);
        g = Math.abs(src.g - dst.g);
        b = Math.abs(src.b - dst.b);
        break;
      case 'exclusion':
        r = src.r + dst.r - 2 * src.r * dst.r;
        g = src.g + dst.g - 2 * src.g * dst.g;
        b = src.b + dst.b - 2 * src.b * dst.b;
        break;
      default: // normal
        break;
    }
    
    // Alpha blend final result
    const outA = alpha + dst.a * (1 - alpha);
    if (outA > 0) {
      return {
        r: (r * alpha + dst.r * dst.a * (1 - alpha)) / outA,
        g: (g * alpha + dst.g * dst.a * (1 - alpha)) / outA,
        b: (b * alpha + dst.b * dst.a * (1 - alpha)) / outA,
        a: outA
      };
    }
    
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  private generateNormalMap(texture: any): any {
    const { width, height } = this.resolution;
    const normalData = new Float32Array(width * height * 4);
    
    // Generate normals from height information
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const idxL = (y * width + x - 1) * 4;
        const idxR = (y * width + x + 1) * 4;
        const idxT = ((y - 1) * width + x) * 4;
        const idxB = ((y + 1) * width + x) * 4;
        
        // Use luminance as height
        const heightL = (texture.data[idxL] * 0.299 + texture.data[idxL + 1] * 0.587 + texture.data[idxL + 2] * 0.114);
        const heightR = (texture.data[idxR] * 0.299 + texture.data[idxR + 1] * 0.587 + texture.data[idxR + 2] * 0.114);
        const heightT = (texture.data[idxT] * 0.299 + texture.data[idxT + 1] * 0.587 + texture.data[idxT + 2] * 0.114);
        const heightB = (texture.data[idxB] * 0.299 + texture.data[idxB + 1] * 0.587 + texture.data[idxB + 2] * 0.114);
        
        // Calculate normal
        let nx = (heightL - heightR) * 2;
        let nz = (heightT - heightB) * 2;
        let ny = 1.0;
        
        // Normalize
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len;
        ny /= len;
        nz /= len;
        
        // Store as 0-1 range
        normalData[idx] = (nx + 1) / 2;
        normalData[idx + 1] = (ny + 1) / 2;
        normalData[idx + 2] = (nz + 1) / 2;
        normalData[idx + 3] = 1.0;
      }
    }
    
    return {
      width,
      height,
      data: normalData,
      format: 'rgba32f'
    };
  }

  private generateDisplacementMap(): any {
    const { width, height } = this.resolution;
    const dispData = new Float32Array(width * height * 4);
    
    // Generate displacement from layer data
    for (const layer of this.layers) {
      if (!layer.visible || !layer.data) continue;
      
      for (let i = 0; i < dispData.length; i += 4) {
        const lum = layer.data[i] * 0.299 + layer.data[i + 1] * 0.587 + layer.data[i + 2] * 0.114;
        dispData[i] = lum * layer.opacity;
        dispData[i + 1] = lum * layer.opacity;
        dispData[i + 2] = lum * layer.opacity;
        dispData[i + 3] = 1.0;
      }
    }
    
    return {
      width,
      height,
      data: dispData,
      format: 'rgba32f'
    };
  }

  private applyTextureToGeometry(geometry: any, texture: any): any {
    // Apply the composited texture to the geometry
    return {
      ...geometry,
      material: {
        ...geometry.material,
        map: texture,
        normalMap: this.generateNormalMap(texture)
      }
    };
  }

  private serializeLayers(): any {
    return this.layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      strokeCount: layer.strokes.length
    }));
  }

  // Public layer management methods
  addLayer(name: string): string {
    const layer: ProjectionLayer = {
      id: `layer_${Date.now()}`,
      name,
      visible: true,
      locked: false,
      opacity: 1.0,
      blendMode: 'normal',
      data: null,
      mask: null,
      strokes: []
    };
    
    this.layers.push(layer);
    this.initializeLayerData();
    return layer.id;
  }

  removeLayer(layerId: string): boolean {
    if (this.layers.length <= 1) return false;
    
    const index = this.layers.findIndex(l => l.id === layerId);
    if (index === -1) return false;
    
    this.layers.splice(index, 1);
    if (this.activeLayerId === layerId) {
      this.activeLayerId = this.layers[0].id;
    }
    
    return true;
  }

  setActiveLayer(layerId: string): void {
    if (this.layers.find(l => l.id === layerId)) {
      this.activeLayerId = layerId;
    }
  }

  duplicateLayer(layerId: string): string | null {
    const source = this.layers.find(l => l.id === layerId);
    if (!source) return null;
    
    const newLayer: ProjectionLayer = {
      id: `layer_${Date.now()}`,
      name: `${source.name} Copy`,
      visible: source.visible,
      locked: false,
      opacity: source.opacity,
      blendMode: source.blendMode,
      data: source.data ? new Float32Array(source.data) : null,
      mask: source.mask ? new Float32Array(source.mask) : null,
      strokes: [...source.strokes]
    };
    
    const index = this.layers.findIndex(l => l.id === layerId);
    this.layers.splice(index + 1, 0, newLayer);
    
    return newLayer.id;
  }

  mergeLayerDown(layerId: string): boolean {
    const index = this.layers.findIndex(l => l.id === layerId);
    if (index <= 0) return false;
    
    // Merge with layer below
    const upperLayer = this.layers[index];
    const lowerLayer = this.layers[index - 1];
    
    if (!upperLayer.data || !lowerLayer.data) return false;
    
    // Composite upper into lower
    for (let i = 0; i < lowerLayer.data.length; i += 4) {
      const blended = this.blendColors(
        { r: upperLayer.data[i], g: upperLayer.data[i + 1], b: upperLayer.data[i + 2], a: upperLayer.data[i + 3] * upperLayer.opacity },
        { r: lowerLayer.data[i], g: lowerLayer.data[i + 1], b: lowerLayer.data[i + 2], a: lowerLayer.data[i + 3] },
        upperLayer.blendMode
      );
      
      lowerLayer.data[i] = blended.r;
      lowerLayer.data[i + 1] = blended.g;
      lowerLayer.data[i + 2] = blended.b;
      lowerLayer.data[i + 3] = blended.a;
    }
    
    // Remove upper layer
    this.layers.splice(index, 1);
    this.activeLayerId = lowerLayer.id;
    
    return true;
  }

  // Undo/Redo support
  undo(): void {
    if (this.undoStack.length === 0) return;
    
    const state = this.undoStack.pop();
    this.redoStack.push(this.captureState());
    this.restoreState(state);
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    
    const state = this.redoStack.pop();
    this.undoStack.push(this.captureState());
    this.restoreState(state);
  }

  private captureState(): any {
    return {
      layers: this.layers.map(l => ({
        ...l,
        data: l.data ? new Float32Array(l.data) : null,
        mask: l.mask ? new Float32Array(l.mask) : null
      })),
      activeLayerId: this.activeLayerId
    };
  }

  private restoreState(state: any): void {
    this.layers = state.layers;
    this.activeLayerId = state.activeLayerId;
  }

  dispose(): void {
    this.layers = [];
    this.undoStack = [];
    this.redoStack = [];
    super.dispose();
  }
}
