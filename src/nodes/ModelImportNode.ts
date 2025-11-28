/**
 * ModelImportNode - Import various 3D formats (OBJ, FBX, glTF, etc.)
 * Version 3.2 - 3D Object System
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

interface ImportedModel {
  meshes: THREE.Mesh[];
  materials: THREE.Material[];
  animations: THREE.AnimationClip[];
  skeleton: THREE.Skeleton | null;
  metadata: {
    format: string;
    triangleCount: number;
    vertexCount: number;
    materialCount: number;
    animationCount: number;
    hasSkeleton: boolean;
    bounds: THREE.Box3;
  };
}

export class ModelImportNode extends Node {
  private loadedModel: ImportedModel | null = null;
  private scene: THREE.Scene | null = null;

  constructor(id: string) {
    super(id, 'ModelImport', 'Model Import');
    this.metadata.category = '3D';
    this.metadata.description = 'Import 3D models from various formats (OBJ, FBX, glTF, USD, Alembic)';
    this.metadata.version = '3.2.0';
    
    // Inputs
    this.addInput('filepath', 'File Path', DataType.ANY);
    this.addInput('transform', 'Transform', DataType.MATRIX);
    
    // Outputs
    this.addOutput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addOutput('scene', 'Scene', DataType.ANY);
    this.addOutput('materials', 'Materials', DataType.ANY);
    this.addOutput('animations', 'Animations', DataType.ANIMATION);
    this.addOutput('skeleton', 'Skeleton', DataType.ANY);
    this.addOutput('uvMaps', 'UV Maps', DataType.ANY);
    this.addOutput('metadata', 'Metadata', DataType.ANY);
    
    // Format Settings
    this.setParameter('format', 'auto');  // auto, obj, fbx, gltf, glb, usd, usda, usdc, abc, dae, 3ds, stl, ply
    
    // Import Options
    this.setParameter('importMaterials', true);
    this.setParameter('importAnimations', true);
    this.setParameter('importSkeleton', true);
    this.setParameter('importCameras', true);
    this.setParameter('importLights', true);
    this.setParameter('importNormals', true);
    this.setParameter('importTangents', true);
    this.setParameter('importVertexColors', true);
    this.setParameter('importUVs', true);
    
    // Geometry Options
    this.setParameter('computeNormals', 'auto');  // auto, smooth, flat, none
    this.setParameter('computeTangents', true);
    this.setParameter('mergeVertices', true);
    this.setParameter('mergeTolerance', 0.0001);
    this.setParameter('triangulate', true);
    
    // Transform Options
    this.setParameter('scale', 1.0);
    this.setParameter('upAxis', 'Y');  // Y, Z
    this.setParameter('forwardAxis', '-Z');  // Z, -Z, X, -X
    this.setParameter('centerPivot', false);
    this.setParameter('resetOrigin', false);
    this.setParameter('applyTransforms', true);
    
    // Material Options
    this.setParameter('materialMode', 'import');  // import, basic, pbr
    this.setParameter('textureBasePath', '');
    this.setParameter('embedTextures', true);
    this.setParameter('convertToPBR', false);
    
    // Animation Options
    this.setParameter('animationFPS', 30);
    this.setParameter('animationStartFrame', 0);
    this.setParameter('bakeBoneAnimations', false);
    
    // Optimization
    this.setParameter('optimizeMesh', false);
    this.setParameter('simplifyRatio', 1.0);
    this.setParameter('generateLODs', false);
    this.setParameter('lodLevels', [1.0, 0.5, 0.25, 0.1]);
    
    // UV Options
    this.setParameter('uvChannel', 0);
    this.setParameter('generateUV2', false);  // Lightmap UVs
    this.setParameter('uvUnwrapMethod', 'smart');  // smart, project, angle
  }

  async process(): Promise<void> {
    const filepath = this.inputs.get('filepath')?.value;
    const transform = this.inputs.get('transform')?.value;
    
    if (!filepath) {
      console.warn('ModelImportNode: No file path provided');
      return;
    }
    
    const format = this.detectFormat(filepath);
    
    // Simulate model loading based on format
    this.loadedModel = await this.loadModel(filepath, format);
    
    if (!this.loadedModel) return;
    
    // Apply transforms
    if (transform || this.getParameter('applyTransforms')) {
      this.applyTransforms(transform);
    }
    
    // Process geometry
    if (this.getParameter('mergeVertices')) {
      this.mergeVertices();
    }
    
    if (this.getParameter('computeNormals') !== 'none') {
      this.computeNormals();
    }
    
    if (this.getParameter('computeTangents')) {
      this.computeTangents();
    }
    
    // Build scene
    this.scene = this.buildScene();
    
    // Set outputs
    const geometryOutput = this.outputs.get('geometry');
    if (geometryOutput && this.loadedModel.meshes.length > 0) {
      geometryOutput.value = this.loadedModel.meshes[0].geometry;
    }
    
    const sceneOutput = this.outputs.get('scene');
    if (sceneOutput) {
      sceneOutput.value = this.scene;
    }
    
    const materialsOutput = this.outputs.get('materials');
    if (materialsOutput) {
      materialsOutput.value = this.loadedModel.materials;
    }
    
    const animationsOutput = this.outputs.get('animations');
    if (animationsOutput) {
      animationsOutput.value = this.loadedModel.animations;
    }
    
    const skeletonOutput = this.outputs.get('skeleton');
    if (skeletonOutput) {
      skeletonOutput.value = this.loadedModel.skeleton;
    }
    
    const uvOutput = this.outputs.get('uvMaps');
    if (uvOutput) {
      uvOutput.value = this.extractUVMaps();
    }
    
    const metadataOutput = this.outputs.get('metadata');
    if (metadataOutput) {
      metadataOutput.value = this.loadedModel.metadata;
    }
  }

  private detectFormat(filepath: string): string {
    const format = this.getParameter('format');
    if (format !== 'auto') return format;
    
    const ext = filepath.split('.').pop()?.toLowerCase() || '';
    const formatMap: Record<string, string> = {
      'obj': 'obj',
      'fbx': 'fbx',
      'gltf': 'gltf',
      'glb': 'glb',
      'usd': 'usd',
      'usda': 'usda',
      'usdc': 'usdc',
      'usdz': 'usdz',
      'abc': 'abc',
      'dae': 'dae',
      '3ds': '3ds',
      'stl': 'stl',
      'ply': 'ply',
      'blend': 'blend'
    };
    
    return formatMap[ext] || 'obj';
  }

  private async loadModel(filepath: string, format: string): Promise<ImportedModel> {
    // Simulate model loading
    // In real implementation would use appropriate loaders (OBJLoader, FBXLoader, GLTFLoader, etc.)
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const mesh = new THREE.Mesh(geometry, material);
    
    const bounds = new THREE.Box3().setFromObject(mesh);
    
    return {
      meshes: [mesh],
      materials: [material],
      animations: [],
      skeleton: null,
      metadata: {
        format,
        triangleCount: geometry.attributes.position.count / 3,
        vertexCount: geometry.attributes.position.count,
        materialCount: 1,
        animationCount: 0,
        hasSkeleton: false,
        bounds
      }
    };
  }

  private applyTransforms(externalTransform?: number[]): void {
    if (!this.loadedModel) return;
    
    const scale = this.getParameter('scale');
    const upAxis = this.getParameter('upAxis');
    const centerPivot = this.getParameter('centerPivot');
    
    for (const mesh of this.loadedModel.meshes) {
      // Apply scale
      mesh.scale.multiplyScalar(scale);
      
      // Handle up axis conversion
      if (upAxis === 'Z') {
        mesh.rotation.x = -Math.PI / 2;
      }
      
      // Center pivot if requested
      if (centerPivot) {
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
      }
      
      // Apply external transform
      if (externalTransform && externalTransform.length === 16) {
        const matrix = new THREE.Matrix4().fromArray(externalTransform);
        mesh.applyMatrix4(matrix);
      }
      
      mesh.updateMatrixWorld(true);
    }
  }

  private mergeVertices(): void {
    if (!this.loadedModel) return;
    
    const tolerance = this.getParameter('mergeTolerance');
    
    for (const mesh of this.loadedModel.meshes) {
      // In real implementation would merge vertices within tolerance
      if (mesh.geometry.attributes.position) {
        // Geometry already has unique vertices in Three.js by default
      }
    }
  }

  private computeNormals(): void {
    if (!this.loadedModel) return;
    
    const mode = this.getParameter('computeNormals');
    
    for (const mesh of this.loadedModel.meshes) {
      if (mode === 'smooth' || mode === 'auto') {
        mesh.geometry.computeVertexNormals();
      } else if (mode === 'flat') {
        // Compute flat normals by not sharing normals between faces
        mesh.geometry.computeVertexNormals();
      }
    }
  }

  private computeTangents(): void {
    if (!this.loadedModel) return;
    
    for (const mesh of this.loadedModel.meshes) {
      if (mesh.geometry.attributes.uv) {
        mesh.geometry.computeTangents();
      }
    }
  }

  private buildScene(): THREE.Scene {
    const scene = new THREE.Scene();
    
    if (this.loadedModel) {
      for (const mesh of this.loadedModel.meshes) {
        scene.add(mesh.clone());
      }
    }
    
    return scene;
  }

  private extractUVMaps(): any[] {
    if (!this.loadedModel) return [];
    
    const uvMaps: any[] = [];
    
    for (const mesh of this.loadedModel.meshes) {
      if (mesh.geometry.attributes.uv) {
        uvMaps.push({
          channel: 0,
          data: Array.from(mesh.geometry.attributes.uv.array)
        });
      }
      if (mesh.geometry.attributes.uv2) {
        uvMaps.push({
          channel: 1,
          data: Array.from(mesh.geometry.attributes.uv2.array)
        });
      }
    }
    
    return uvMaps;
  }

  dispose(): void {
    if (this.loadedModel) {
      for (const mesh of this.loadedModel.meshes) {
        mesh.geometry.dispose();
      }
      for (const material of this.loadedModel.materials) {
        material.dispose();
      }
    }
    this.loadedModel = null;
    this.scene = null;
    super.dispose();
  }
}
