/**
 * Geometry3DNode - Load and manage 3D geometry using Three.js
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export class Geometry3DNode extends Node {
  private geometry: THREE.BufferGeometry | null = null;

  constructor(id: string) {
    super(id, 'Geometry3D', 'Geometry 3D');
    this.metadata.category = '3D';
    this.metadata.description = 'Load and manage 3D geometry';
    this.metadata.version = '1.1.0';
    
    this.addOutput('geometry', 'Geometry', DataType.GEOMETRY_3D);
    
    this.setParameter('type', 'box'); // box, sphere, plane, cylinder, torus
    this.setParameter('width', 1);
    this.setParameter('height', 1);
    this.setParameter('depth', 1);
    this.setParameter('segments', 1);
  }

  async process(): Promise<void> {
    const type = this.getParameter('type');
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const depth = this.getParameter('depth');
    const segments = this.getParameter('segments');

    switch (type) {
      case 'box':
        this.geometry = new THREE.BoxGeometry(width, height, depth, segments, segments, segments);
        break;
      case 'sphere':
        this.geometry = new THREE.SphereGeometry(width / 2, segments * 8, segments * 6);
        break;
      case 'plane':
        this.geometry = new THREE.PlaneGeometry(width, height, segments, segments);
        break;
      case 'cylinder':
        this.geometry = new THREE.CylinderGeometry(width / 2, width / 2, height, segments * 8);
        break;
      case 'torus':
        this.geometry = new THREE.TorusGeometry(width / 2, depth / 4, segments * 8, segments * 12);
        break;
      default:
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const output = this.outputs.get('geometry');
    if (output) {
      output.value = this.geometry;
    }
  }

  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
  }
}
