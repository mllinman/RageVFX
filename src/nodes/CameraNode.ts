/**
 * CameraNode - 3D camera control
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export class CameraNode extends Node {
  private camera: THREE.PerspectiveCamera | null = null;

  constructor(id: string) {
    super(id, 'Camera', 'Camera 3D');
    this.metadata.category = '3D';
    this.metadata.description = '3D perspective camera';
    this.metadata.version = '1.1.0';
    
    this.addOutput('camera', 'Camera', DataType.GEOMETRY_3D);
    
    this.setParameter('fov', 50);
    this.setParameter('aspect', 16 / 9);
    this.setParameter('near', 0.1);
    this.setParameter('far', 1000);
    this.setParameter('position', { x: 0, y: 0, z: 5 });
    this.setParameter('lookAt', { x: 0, y: 0, z: 0 });
  }

  async process(): Promise<void> {
    const fov = this.getParameter('fov');
    const aspect = this.getParameter('aspect');
    const near = this.getParameter('near');
    const far = this.getParameter('far');
    const position = this.getParameter('position');
    const lookAt = this.getParameter('lookAt');

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z));

    const output = this.outputs.get('camera');
    if (output) {
      output.value = this.camera;
    }
  }
}
