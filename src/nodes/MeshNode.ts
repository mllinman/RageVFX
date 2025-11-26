/**
 * MeshNode - Create 3D mesh from geometry and material
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export class MeshNode extends Node {
  private mesh: THREE.Mesh | null = null;

  constructor(id: string) {
    super(id, 'Mesh', 'Mesh 3D');
    this.metadata.category = '3D';
    this.metadata.description = 'Create 3D mesh from geometry';
    this.metadata.version = '1.1.0';
    
    this.addInput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addInput('texture', 'Texture', DataType.IMAGE);
    this.addOutput('mesh', 'Mesh', DataType.GEOMETRY_3D);
    
    this.setParameter('color', { r: 255, g: 255, b: 255 });
    this.setParameter('metalness', 0.5);
    this.setParameter('roughness', 0.5);
    this.setParameter('emissive', { r: 0, g: 0, b: 0 });
    this.setParameter('opacity', 1.0);
    this.setParameter('wireframe', false);
  }

  async process(): Promise<void> {
    const geometryInput = this.inputs.get('geometry');
    const textureInput = this.inputs.get('texture');
    
    if (!geometryInput?.value) {
      return;
    }

    const geometry = geometryInput.value as THREE.BufferGeometry;
    const color = this.getParameter('color');
    const metalness = this.getParameter('metalness');
    const roughness = this.getParameter('roughness');
    const emissive = this.getParameter('emissive');
    const opacity = this.getParameter('opacity');
    const wireframe = this.getParameter('wireframe');

    const materialParams: THREE.MeshStandardMaterialParameters = {
      color: new THREE.Color(color.r / 255, color.g / 255, color.b / 255),
      metalness,
      roughness,
      emissive: new THREE.Color(emissive.r / 255, emissive.g / 255, emissive.b / 255),
      transparent: opacity < 1.0,
      opacity,
      wireframe
    };

    if (textureInput?.value) {
      // Create texture from image data
      const canvas = textureInput.value as HTMLCanvasElement;
      const texture = new THREE.CanvasTexture(canvas);
      materialParams.map = texture;
    }

    const material = new THREE.MeshStandardMaterial(materialParams);
    this.mesh = new THREE.Mesh(geometry, material);

    const output = this.outputs.get('mesh');
    if (output) {
      output.value = this.mesh;
    }
  }

  dispose(): void {
    if (this.mesh) {
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }
}
