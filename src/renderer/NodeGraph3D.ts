/**
 * NodeGraph3D handles the 3D visualization of the node network
 * Uses Three.js to render nodes as 3D objects and connections as splines
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class NodeGraph3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private nodes: Map<string, THREE.Group> = new Map();
  private connections: THREE.Group = new THREE.Group();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d0d);

    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.z = 500;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.scene.add(this.connections);

    this.addLights();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
  }

  private addLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Sync the 3D view with the 2D node graph data
   */
  sync(nodes: any[], connections: any[]): void {
    // 1. Clear existing nodes that are no longer present
    const nodeIds = new Set(nodes.map(n => n.id));
    this.nodes.forEach((group, id) => {
      if (!nodeIds.has(id)) {
        this.scene.remove(group);
        this.nodes.delete(id);
      }
    });

    // 2. Add or update nodes
    nodes.forEach(nodeData => {
      let group = this.nodes.get(nodeData.id);
      if (!group) {
        group = this.createNodeObject(nodeData);
        this.nodes.set(nodeData.id, group);
        this.scene.add(group);
      }

      // Map 2D coords to 3D (Z = 0 for now)
      group.position.set(nodeData.x, -nodeData.y, 0);
    });

    // 3. Update connections
    this.updateConnections(connections);
  }

  private createNodeObject(nodeData: any): THREE.Group {
    const group = new THREE.Group();

    // Node body
    const geometry = new THREE.BoxGeometry(nodeData.width, nodeData.height, 20);
    const material = new THREE.MeshStandardMaterial({
      color: nodeData.color?.primary || 0xff6b35,
      metalness: 0.2,
      roughness: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(nodeData.width / 2, -nodeData.height / 2, 0);
    group.add(mesh);

    // Header strip
    const headerGeo = new THREE.BoxGeometry(nodeData.width, 30, 5);
    const headerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
    const headerMesh = new THREE.Mesh(headerGeo, headerMat);
    headerMesh.position.set(nodeData.width / 2, -15, 12);
    group.add(headerMesh);

    return group;
  }

  private updateConnections(connections: any[]): void {
    // Clear old connections
    while (this.connections.children.length > 0) {
      this.connections.remove(this.connections.children[0]);
    }

    const material = new THREE.LineBasicMaterial({ color: 0x4a9eff, linewidth: 2 });

    connections.forEach(conn => {
      const points = [];
      points.push(new THREE.Vector3(conn.fromX, -conn.fromY, 15));
      points.push(new THREE.Vector3(conn.toX, -conn.toY, 15));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.connections.add(line);
    });
  }

  setVisible(visible: boolean): void {
    this.renderer.domElement.style.display = visible ? 'block' : 'none';
  }
}
