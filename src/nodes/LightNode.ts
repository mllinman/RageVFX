/**
 * LightNode - 3D scene lighting
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export class LightNode extends Node {
  private light: THREE.Light | null = null;

  constructor(id: string) {
    super(id, 'Light', 'Light 3D');
    this.metadata.category = '3D';
    this.metadata.description = '3D scene lighting';
    this.metadata.version = '1.1.0';
    
    this.addOutput('light', 'Light', DataType.GEOMETRY_3D);
    
    this.setParameter('type', 'point'); // point, directional, spot, ambient
    this.setParameter('color', { r: 255, g: 255, b: 255 });
    this.setParameter('intensity', 1.0);
    this.setParameter('position', { x: 5, y: 5, z: 5 });
    this.setParameter('castShadow', true);
  }

  async process(): Promise<void> {
    const type = this.getParameter('type');
    const color = this.getParameter('color');
    const intensity = this.getParameter('intensity');
    const position = this.getParameter('position');
    const castShadow = this.getParameter('castShadow');

    const threeColor = new THREE.Color(color.r / 255, color.g / 255, color.b / 255);

    switch (type) {
      case 'point':
        this.light = new THREE.PointLight(threeColor, intensity);
        break;
      case 'directional':
        this.light = new THREE.DirectionalLight(threeColor, intensity);
        break;
      case 'spot':
        this.light = new THREE.SpotLight(threeColor, intensity);
        break;
      case 'ambient':
        this.light = new THREE.AmbientLight(threeColor, intensity);
        break;
      default:
        this.light = new THREE.PointLight(threeColor, intensity);
    }

    if (type !== 'ambient') {
      this.light.position.set(position.x, position.y, position.z);
      this.light.castShadow = castShadow;
    }

    const output = this.outputs.get('light');
    if (output) {
      output.value = this.light;
    }
  }

  dispose(): void {
    if (this.light) {
      this.light.dispose();
      this.light = null;
    }
  }
}
