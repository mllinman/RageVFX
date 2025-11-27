/**
 * SceneNode - Scene graph management for 3D rendering
 * Version 2.0 - Full 3D rendering pipeline
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export interface SceneData {
  scene: THREE.Scene;
  objects: Map<string, THREE.Object3D>;
  lights: THREE.Light[];
  camera: THREE.Camera | null;
}

export class SceneNode extends Node {
  private sceneData: SceneData;

  constructor(id: string) {
    super(id, 'Scene', 'Scene');
    this.metadata.category = '3D Pipeline';
    this.metadata.description = 'Scene graph management for 3D rendering';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    this.addInput('mesh', 'Mesh', DataType.GEOMETRY_3D);
    this.addInput('lights', 'Lights', DataType.ANY);
    this.addInput('camera', 'Camera', DataType.ANY);
    this.addInput('environment', 'Environment', DataType.IMAGE);
    
    // Outputs
    this.addOutput('scene', 'Scene', DataType.ANY);
    
    // Parameters
    this.setParameter('backgroundColor', { r: 0, g: 0, b: 0 });
    this.setParameter('backgroundAlpha', 1.0);
    this.setParameter('fog', false);
    this.setParameter('fogColor', { r: 255, g: 255, b: 255 });
    this.setParameter('fogNear', 1);
    this.setParameter('fogFar', 1000);
    this.setParameter('ambientLight', true);
    this.setParameter('ambientColor', { r: 64, g: 64, b: 64 });
    this.setParameter('ambientIntensity', 0.5);
    
    // Initialize scene data
    this.sceneData = {
      scene: new THREE.Scene(),
      objects: new Map(),
      lights: [],
      camera: null
    };
  }

  async process(): Promise<void> {
    // Clear previous scene content
    while (this.sceneData.scene.children.length > 0) {
      this.sceneData.scene.remove(this.sceneData.scene.children[0]);
    }
    this.sceneData.objects.clear();
    this.sceneData.lights = [];

    // Set background color
    const bgColor = this.getParameter('backgroundColor');
    this.sceneData.scene.background = new THREE.Color(
      bgColor.r / 255,
      bgColor.g / 255,
      bgColor.b / 255
    );

    // Add fog if enabled
    if (this.getParameter('fog')) {
      const fogColor = this.getParameter('fogColor');
      this.sceneData.scene.fog = new THREE.Fog(
        new THREE.Color(fogColor.r / 255, fogColor.g / 255, fogColor.b / 255),
        this.getParameter('fogNear'),
        this.getParameter('fogFar')
      );
    } else {
      this.sceneData.scene.fog = null;
    }

    // Add ambient light if enabled
    if (this.getParameter('ambientLight')) {
      const ambientColor = this.getParameter('ambientColor');
      const ambient = new THREE.AmbientLight(
        new THREE.Color(ambientColor.r / 255, ambientColor.g / 255, ambientColor.b / 255),
        this.getParameter('ambientIntensity')
      );
      this.sceneData.scene.add(ambient);
      this.sceneData.lights.push(ambient);
    }

    // Add geometry input
    const geometryInput = this.inputs.get('geometry');
    if (geometryInput?.value) {
      if (geometryInput.value instanceof THREE.BufferGeometry) {
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometryInput.value, material);
        this.sceneData.scene.add(mesh);
        this.sceneData.objects.set('geometry', mesh);
      }
    }

    // Add mesh input
    const meshInput = this.inputs.get('mesh');
    if (meshInput?.value) {
      if (meshInput.value instanceof THREE.Mesh) {
        this.sceneData.scene.add(meshInput.value);
        this.sceneData.objects.set('mesh', meshInput.value);
      }
    }

    // Add lights input
    const lightsInput = this.inputs.get('lights');
    if (lightsInput?.value) {
      const lights = Array.isArray(lightsInput.value) ? lightsInput.value : [lightsInput.value];
      lights.forEach((light: THREE.Light, index: number) => {
        if (light instanceof THREE.Light) {
          this.sceneData.scene.add(light);
          this.sceneData.lights.push(light);
          this.sceneData.objects.set(`light_${index}`, light);
        }
      });
    }

    // Set camera
    const cameraInput = this.inputs.get('camera');
    if (cameraInput?.value && cameraInput.value instanceof THREE.Camera) {
      this.sceneData.camera = cameraInput.value;
    }

    // Handle environment map
    const envInput = this.inputs.get('environment');
    if (envInput?.value) {
      // Environment map would be applied here
      // Placeholder for HDR environment loading
    }

    const output = this.outputs.get('scene');
    if (output) {
      output.value = this.sceneData;
    }
  }

  getScene(): THREE.Scene {
    return this.sceneData.scene;
  }

  dispose(): void {
    this.sceneData.objects.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
    this.sceneData.objects.clear();
    this.sceneData.lights = [];
    super.dispose();
  }
}
