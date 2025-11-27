/**
 * MaterialNode - Advanced PBR material system
 * Version 2.0 - Full 3D rendering pipeline
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export class MaterialNode extends Node {
  private material: THREE.Material | null = null;

  constructor(id: string) {
    super(id, 'Material', 'Material');
    this.metadata.category = '3D Pipeline';
    this.metadata.description = 'Advanced PBR material system';
    this.metadata.version = '2.0.0';
    
    // Texture inputs
    this.addInput('albedoMap', 'Albedo Map', DataType.IMAGE);
    this.addInput('normalMap', 'Normal Map', DataType.IMAGE);
    this.addInput('roughnessMap', 'Roughness Map', DataType.IMAGE);
    this.addInput('metalnessMap', 'Metalness Map', DataType.IMAGE);
    this.addInput('aoMap', 'AO Map', DataType.IMAGE);
    this.addInput('emissiveMap', 'Emissive Map', DataType.IMAGE);
    this.addInput('displacementMap', 'Displacement Map', DataType.IMAGE);
    this.addInput('alphaMap', 'Alpha Map', DataType.IMAGE);
    
    // Outputs
    this.addOutput('material', 'Material', DataType.ANY);
    
    // Material type
    this.setParameter('type', 'standard'); // standard, physical, basic, lambert, phong, toon
    
    // Base properties
    this.setParameter('color', { r: 255, g: 255, b: 255 });
    this.setParameter('opacity', 1.0);
    this.setParameter('transparent', false);
    
    // PBR properties
    this.setParameter('metalness', 0.0);
    this.setParameter('roughness', 0.5);
    this.setParameter('reflectivity', 0.5);
    this.setParameter('clearcoat', 0.0);
    this.setParameter('clearcoatRoughness', 0.0);
    this.setParameter('sheen', 0.0);
    this.setParameter('sheenRoughness', 1.0);
    this.setParameter('sheenColor', { r: 255, g: 255, b: 255 });
    
    // Emissive
    this.setParameter('emissive', { r: 0, g: 0, b: 0 });
    this.setParameter('emissiveIntensity', 1.0);
    
    // Additional
    this.setParameter('normalScale', 1.0);
    this.setParameter('displacementScale', 1.0);
    this.setParameter('displacementBias', 0.0);
    this.setParameter('aoMapIntensity', 1.0);
    
    // Advanced
    this.setParameter('side', 'front'); // front, back, double
    this.setParameter('flatShading', false);
    this.setParameter('wireframe', false);
    this.setParameter('fog', true);
  }

  async process(): Promise<void> {
    const type = this.getParameter('type');
    const color = this.getParameter('color');
    const opacity = this.getParameter('opacity');
    const transparent = this.getParameter('transparent');
    
    const baseColor = new THREE.Color(color.r / 255, color.g / 255, color.b / 255);
    
    // Determine side rendering
    let side: THREE.Side = THREE.FrontSide;
    switch (this.getParameter('side')) {
      case 'back': side = THREE.BackSide; break;
      case 'double': side = THREE.DoubleSide; break;
    }

    // Create material based on type
    switch (type) {
      case 'physical': {
        const mat = new THREE.MeshPhysicalMaterial({
          color: baseColor,
          opacity,
          transparent,
          metalness: this.getParameter('metalness'),
          roughness: this.getParameter('roughness'),
          reflectivity: this.getParameter('reflectivity'),
          clearcoat: this.getParameter('clearcoat'),
          clearcoatRoughness: this.getParameter('clearcoatRoughness'),
          sheen: this.getParameter('sheen'),
          sheenRoughness: this.getParameter('sheenRoughness'),
          sheenColor: new THREE.Color(
            this.getParameter('sheenColor').r / 255,
            this.getParameter('sheenColor').g / 255,
            this.getParameter('sheenColor').b / 255
          ),
          side,
          flatShading: this.getParameter('flatShading'),
          wireframe: this.getParameter('wireframe'),
          fog: this.getParameter('fog')
        });
        this.material = mat;
        break;
      }
      case 'basic': {
        const mat = new THREE.MeshBasicMaterial({
          color: baseColor,
          opacity,
          transparent,
          side,
          wireframe: this.getParameter('wireframe'),
          fog: this.getParameter('fog')
        });
        this.material = mat;
        break;
      }
      case 'lambert': {
        const mat = new THREE.MeshLambertMaterial({
          color: baseColor,
          opacity,
          transparent,
          side,
          wireframe: this.getParameter('wireframe'),
          fog: this.getParameter('fog')
        });
        this.material = mat;
        break;
      }
      case 'phong': {
        const mat = new THREE.MeshPhongMaterial({
          color: baseColor,
          opacity,
          transparent,
          shininess: (1 - this.getParameter('roughness')) * 100,
          side,
          flatShading: this.getParameter('flatShading'),
          wireframe: this.getParameter('wireframe'),
          fog: this.getParameter('fog')
        });
        this.material = mat;
        break;
      }
      case 'toon': {
        const mat = new THREE.MeshToonMaterial({
          color: baseColor,
          opacity,
          transparent,
          side,
          wireframe: this.getParameter('wireframe'),
          fog: this.getParameter('fog')
        });
        this.material = mat;
        break;
      }
      default: { // standard
        const emissiveColor = this.getParameter('emissive');
        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          opacity,
          transparent,
          metalness: this.getParameter('metalness'),
          roughness: this.getParameter('roughness'),
          emissive: new THREE.Color(emissiveColor.r / 255, emissiveColor.g / 255, emissiveColor.b / 255),
          emissiveIntensity: this.getParameter('emissiveIntensity'),
          aoMapIntensity: this.getParameter('aoMapIntensity'),
          side,
          flatShading: this.getParameter('flatShading'),
          wireframe: this.getParameter('wireframe'),
          fog: this.getParameter('fog')
        });
        this.material = mat;
        break;
      }
    }

    // Apply displacement settings to supported materials
    if (this.material && 'displacementScale' in this.material) {
      (this.material as THREE.MeshStandardMaterial).displacementScale = this.getParameter('displacementScale');
      (this.material as THREE.MeshStandardMaterial).displacementBias = this.getParameter('displacementBias');
    }

    // Apply normal scale to supported materials
    if (this.material && 'normalScale' in this.material) {
      const scale = this.getParameter('normalScale');
      (this.material as THREE.MeshStandardMaterial).normalScale = new THREE.Vector2(scale, scale);
    }

    // Texture loading would happen here with actual texture inputs
    // This is a placeholder for the texture pipeline

    const output = this.outputs.get('material');
    if (output) {
      output.value = this.material;
    }
  }

  getMaterial(): THREE.Material | null {
    return this.material;
  }

  dispose(): void {
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    super.dispose();
  }
}
