/**
 * RageVFX Viewport System
 * Comprehensive 2D/3D viewport with professional camera controls
 */

import * as THREE from 'three';

/**
 * Camera control modes
 */
export enum CameraMode {
  PAN = 'pan',
  DOLLY = 'dolly',
  TILT = 'tilt',
  ROTATE = 'rotate',
  ZOOM = 'zoom',
  CRANE = 'crane',
  AIM = 'aim'
}

/**
 * Viewport display modes
 */
export enum ViewportMode {
  MODE_2D = '2d',
  MODE_3D = '3d',
  RENDER = 'render'
}

/**
 * Camera preset positions
 */
export interface CameraPreset {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

/**
 * Viewport state interface
 */
interface ViewportState {
  mode: ViewportMode;
  cameraMode: CameraMode;
  zoom: number;
  pan: { x: number; y: number };
  rotation: { x: number; y: number; z: number };
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
}

/**
 * Base Viewport class
 */
export class Viewport {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D | null = null;
  protected mode: ViewportMode = ViewportMode.MODE_2D;
  protected width: number = 0;
  protected height: number = 0;
  protected zoom: number = 1.0;
  protected pan: { x: number; y: number } = { x: 0, y: 0 };
  protected isDragging: boolean = false;
  protected lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  protected animationId: number | null = null;
  protected imageData: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      console.warn('Failed to create 2D context for viewport canvas');
    }
    this.resize();
    this.setupEventListeners();
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (container) {
      this.width = container.offsetWidth;
      this.height = container.offsetHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
    this.render();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
  }

  protected onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMousePos = { x: e.clientX, y: e.clientY };
  }

  protected onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;
    
    this.pan.x += dx / this.zoom;
    this.pan.y += dy / this.zoom;
    
    this.lastMousePos = { x: e.clientX, y: e.clientY };
    this.render();
  }

  protected onMouseUp(): void {
    this.isDragging = false;
  }

  protected onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));
    this.render();
  }

  setMode(mode: ViewportMode): void {
    this.mode = mode;
    this.render();
  }

  getMode(): ViewportMode {
    return this.mode;
  }

  setImageData(data: ImageData): void {
    this.imageData = data;
    this.render();
  }

  fitToWindow(): void {
    this.zoom = 1.0;
    this.pan = { x: 0, y: 0 };
    this.render();
  }

  resetView(): void {
    this.zoom = 1.0;
    this.pan = { x: 0, y: 0 };
    this.render();
  }

  render(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw checkerboard pattern for transparency
    this.drawCheckerboard();
    
    // Apply transforms
    ctx.save();
    ctx.translate(this.width / 2 + this.pan.x, this.height / 2 + this.pan.y);
    ctx.scale(this.zoom, this.zoom);
    
    // Draw image data if available
    if (this.imageData) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.imageData.width;
      tempCanvas.height = this.imageData.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(this.imageData, 0, 0);
        ctx.drawImage(tempCanvas, -this.imageData.width / 2, -this.imageData.height / 2);
      }
    } else {
      // Draw placeholder
      this.drawPlaceholder(ctx);
    }
    
    ctx.restore();
    
    // Draw viewport info
    this.drawViewportInfo();
  }

  protected drawCheckerboard(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const tileSize = 10;
    const colors = ['#1e1e1e', '#252525'];
    
    for (let x = 0; x < this.width; x += tileSize) {
      for (let y = 0; y < this.height; y += tileSize) {
        const colorIndex = ((x / tileSize) + (y / tileSize)) % 2;
        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  protected drawPlaceholder(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 107, 53, 0.1)';
    ctx.fillRect(-100, -75, 200, 150);
    
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-100, -75, 200, 150);
    
    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No output to display', 0, 0);
  }

  protected drawViewportInfo(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(5, 5, 100, 20);
    
    ctx.fillStyle = '#888';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.round(this.zoom * 100)}% | 2D`, 10, 8);
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

/**
 * 3D Viewport with full camera controls
 */
export class Viewport3D {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: CameraControls;
  private animationId: number | null = null;
  private width: number = 0;
  private height: number = 0;
  private grid: THREE.GridHelper | null = null;
  private axes: THREE.AxesHelper | null = null;

  // Camera presets
  private cameraPresets: CameraPreset[] = [
    { name: 'Front', position: new THREE.Vector3(0, 0, 10), target: new THREE.Vector3(0, 0, 0), fov: 50 },
    { name: 'Back', position: new THREE.Vector3(0, 0, -10), target: new THREE.Vector3(0, 0, 0), fov: 50 },
    { name: 'Left', position: new THREE.Vector3(-10, 0, 0), target: new THREE.Vector3(0, 0, 0), fov: 50 },
    { name: 'Right', position: new THREE.Vector3(10, 0, 0), target: new THREE.Vector3(0, 0, 0), fov: 50 },
    { name: 'Top', position: new THREE.Vector3(0, 10, 0), target: new THREE.Vector3(0, 0, 0), fov: 50 },
    { name: 'Bottom', position: new THREE.Vector3(0, -10, 0), target: new THREE.Vector3(0, 0, 0), fov: 50 },
    { name: 'Perspective', position: new THREE.Vector3(7, 5, 7), target: new THREE.Vector3(0, 0, 0), fov: 50 }
  ];

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(7, 5, 7);
    this.camera.lookAt(0, 0, 0);
    
    this.controls = new CameraControls(this.camera, container);
    
    this.initialize();
    this.startRenderLoop();
  }

  private initialize(): void {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Add grid
    this.grid = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
    this.scene.add(this.grid);
    
    // Add axes helper
    this.axes = new THREE.AxesHelper(5);
    this.scene.add(this.axes);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Add sample objects
    this.addSampleObjects();
    
    // Window resize handler
    window.addEventListener('resize', () => this.resize());
  }

  private addSampleObjects(): void {
    // Add a sample cube
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6b35,
      metalness: 0.3,
      roughness: 0.7
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.y = 1;
    cube.castShadow = true;
    cube.receiveShadow = true;
    this.scene.add(cube);
    
    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  resize(): void {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    
    if (this.renderer) {
      this.renderer.setSize(this.width, this.height);
    }
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      if (this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    animate();
  }

  // Camera control methods
  setCameraMode(mode: CameraMode): void {
    this.controls.setMode(mode);
  }

  applyCameraPreset(presetName: string): void {
    const preset = this.cameraPresets.find(p => p.name === presetName);
    if (preset) {
      this.camera.position.copy(preset.position);
      this.camera.fov = preset.fov;
      this.camera.updateProjectionMatrix();
      this.controls.setTarget(preset.target);
    }
  }

  resetCamera(): void {
    this.camera.position.set(7, 5, 7);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  }

  setFOV(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  toggleGrid(visible: boolean): void {
    if (this.grid) this.grid.visible = visible;
  }

  toggleAxes(visible: boolean): void {
    if (this.axes) this.axes.visible = visible;
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
    this.controls.dispose();
  }
}

/**
 * Camera Controls - Pan, Dolly, Tilt, Rotate, Zoom, Crane, Aim
 */
export class CameraControls {
  private camera: THREE.PerspectiveCamera;
  private element: HTMLElement;
  private mode: CameraMode = CameraMode.ROTATE;
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  
  // Control state
  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private spherical: THREE.Spherical = new THREE.Spherical();
  private savedMode: CameraMode | null = null; // For restoring mode after mouse button override
  
  // Control speeds
  private panSpeed: number = 0.01;
  private rotateSpeed: number = 0.005;
  private dollySpeed: number = 0.1;
  private zoomSpeed: number = 0.05;
  private craneSpeed: number = 0.02;
  private tiltSpeed: number = 0.005;
  
  // Limits
  private minDistance: number = 0.5;
  private maxDistance: number = 100;
  private minPolarAngle: number = 0.01;
  private maxPolarAngle: number = Math.PI - 0.01;

  constructor(camera: THREE.PerspectiveCamera, element: HTMLElement) {
    this.camera = camera;
    this.element = element;
    this.updateSpherical();
    this.setupEventListeners();
  }

  private updateSpherical(): void {
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
    this.spherical.setFromVector3(offset);
  }

  private setupEventListeners(): void {
    this.element.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.element.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.element.addEventListener('mouseup', () => this.onMouseUp());
    this.element.addEventListener('mouseleave', () => this.onMouseUp());
    this.element.addEventListener('wheel', (e) => this.onWheel(e));
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.isDragging = true;
    this.lastMousePos = { x: e.clientX, y: e.clientY };
    
    // Auto-detect mode based on mouse button, preserving original mode
    if (e.button === 0) {
      // Left click - use current mode (no change needed)
      this.savedMode = null;
    } else if (e.button === 1) {
      // Middle click - temporarily switch to pan
      this.savedMode = this.mode;
      this.mode = CameraMode.PAN;
    } else if (e.button === 2) {
      // Right click - temporarily switch to rotate
      this.savedMode = this.mode;
      this.mode = CameraMode.ROTATE;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;
    
    switch (this.mode) {
      case CameraMode.PAN:
        this.pan(dx, dy);
        break;
      case CameraMode.DOLLY:
        this.dolly(-dy);
        break;
      case CameraMode.TILT:
        this.tilt(dy);
        break;
      case CameraMode.ROTATE:
        this.rotate(dx, dy);
        break;
      case CameraMode.CRANE:
        this.crane(dy);
        break;
      case CameraMode.AIM:
        this.aim(dx, dy);
        break;
      case CameraMode.ZOOM:
        this.zoom(-dy);
        break;
    }
    
    this.lastMousePos = { x: e.clientX, y: e.clientY };
  }

  private onMouseUp(): void {
    this.isDragging = false;
    // Restore the original mode if it was temporarily changed
    if (this.savedMode !== null) {
      this.mode = this.savedMode;
      this.savedMode = null;
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.dolly(e.deltaY * 0.01);
  }

  // Camera movement methods
  private pan(dx: number, dy: number): void {
    const offset = new THREE.Vector3();
    const panLeft = new THREE.Vector3();
    const panUp = new THREE.Vector3();
    
    // Get camera's local axes
    this.camera.matrix.extractBasis(panLeft, panUp, offset);
    
    // Calculate pan amount based on distance
    const distance = this.camera.position.distanceTo(this.target);
    const panAmount = distance * this.panSpeed;
    
    // Apply pan
    const panOffset = panLeft.multiplyScalar(-dx * panAmount)
      .add(panUp.multiplyScalar(dy * panAmount));
    
    this.camera.position.add(panOffset);
    this.target.add(panOffset);
  }

  private dolly(delta: number): void {
    const distance = this.camera.position.distanceTo(this.target);
    const newDistance = Math.max(this.minDistance, Math.min(this.maxDistance, 
      distance * (1 + delta * this.dollySpeed)));
    
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.target)
      .normalize();
    
    this.camera.position.copy(this.target)
      .add(direction.multiplyScalar(newDistance));
    
    this.updateSpherical();
  }

  private tilt(delta: number): void {
    // Tilt rotates the camera around its local X axis
    const quaternion = new THREE.Quaternion();
    const axis = new THREE.Vector3(1, 0, 0);
    
    // Get camera's local X axis
    this.camera.getWorldDirection(axis);
    axis.cross(this.camera.up).normalize();
    
    quaternion.setFromAxisAngle(axis, delta * this.tiltSpeed);
    
    const direction = new THREE.Vector3()
      .subVectors(this.target, this.camera.position);
    direction.applyQuaternion(quaternion);
    
    this.target.copy(this.camera.position).add(direction);
    this.camera.lookAt(this.target);
    this.updateSpherical();
  }

  private rotate(dx: number, dy: number): void {
    // Orbit around target
    this.spherical.theta -= dx * this.rotateSpeed;
    this.spherical.phi += dy * this.rotateSpeed;
    
    // Clamp phi
    this.spherical.phi = Math.max(this.minPolarAngle, 
      Math.min(this.maxPolarAngle, this.spherical.phi));
    
    // Update camera position
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }

  private crane(delta: number): void {
    // Crane moves the camera up/down while maintaining horizontal orientation
    const craneOffset = new THREE.Vector3(0, -delta * this.craneSpeed, 0);
    this.camera.position.add(craneOffset);
    this.target.add(craneOffset);
    this.updateSpherical();
  }

  private aim(dx: number, dy: number): void {
    // Aim rotates the camera without moving it (adjusts lookAt target)
    const distance = this.camera.position.distanceTo(this.target);
    const spherical = new THREE.Spherical();
    
    const direction = new THREE.Vector3()
      .subVectors(this.target, this.camera.position);
    spherical.setFromVector3(direction);
    
    spherical.theta += dx * this.rotateSpeed;
    spherical.phi += dy * this.rotateSpeed;
    spherical.phi = Math.max(this.minPolarAngle, 
      Math.min(this.maxPolarAngle, spherical.phi));
    
    direction.setFromSpherical(spherical);
    this.target.copy(this.camera.position).add(direction.multiplyScalar(distance));
    this.camera.lookAt(this.target);
    this.updateSpherical();
  }

  private zoom(delta: number): void {
    // Zoom adjusts the field of view
    const newFov = Math.max(10, Math.min(120, 
      this.camera.fov + delta * this.zoomSpeed * 100));
    this.camera.fov = newFov;
    this.camera.updateProjectionMatrix();
  }

  // Public methods
  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  getMode(): CameraMode {
    return this.mode;
  }

  setTarget(target: THREE.Vector3): void {
    this.target.copy(target);
    this.camera.lookAt(this.target);
    this.updateSpherical();
  }

  getTarget(): THREE.Vector3 {
    return this.target.clone();
  }

  reset(): void {
    this.target.set(0, 0, 0);
    this.camera.position.set(7, 5, 7);
    this.camera.lookAt(this.target);
    this.updateSpherical();
  }

  update(): void {
    // Called each frame - can be used for smooth transitions
  }

  dispose(): void {
    // Remove event listeners
  }
}

/**
 * Render View for displaying rendered images and animations
 */
export class RenderView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;
  private currentFrame: ImageData | null = null;
  private frameBuffer: ImageData[] = [];
  private isPlaying: boolean = false;
  private playbackFrame: number = 0;
  private playbackSpeed: number = 24; // fps
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  
  // Display settings
  private zoom: number = 1.0;
  private pan: { x: number; y: number } = { x: 0, y: 0 };
  private showChannels: 'rgb' | 'r' | 'g' | 'b' | 'a' = 'rgb';
  private exposure: number = 0;
  private gamma: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));
      this.render();
    });
    
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };
    
    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      this.pan.x += e.clientX - lastPos.x;
      this.pan.y += e.clientY - lastPos.y;
      lastPos = { x: e.clientX, y: e.clientY };
      this.render();
    });
    
    this.canvas.addEventListener('mouseup', () => isDragging = false);
    this.canvas.addEventListener('mouseleave', () => isDragging = false);
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (container) {
      this.width = container.offsetWidth;
      this.height = container.offsetHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
    this.render();
  }

  setFrame(imageData: ImageData): void {
    this.currentFrame = imageData;
    this.render();
  }

  addToBuffer(frame: ImageData): void {
    this.frameBuffer.push(frame);
  }

  clearBuffer(): void {
    this.frameBuffer = [];
    this.playbackFrame = 0;
  }

  play(): void {
    if (this.frameBuffer.length === 0) return;
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  stop(): void {
    this.pause();
    this.playbackFrame = 0;
    if (this.frameBuffer.length > 0) {
      this.currentFrame = this.frameBuffer[0];
      this.render();
    }
  }

  setPlaybackSpeed(fps: number): void {
    this.playbackSpeed = fps;
  }

  goToFrame(frame: number): void {
    if (frame >= 0 && frame < this.frameBuffer.length) {
      this.playbackFrame = frame;
      this.currentFrame = this.frameBuffer[frame];
      this.render();
    }
  }

  private animate(): void {
    if (!this.isPlaying) return;
    
    const now = performance.now();
    const frameDuration = 1000 / this.playbackSpeed;
    
    if (now - this.lastFrameTime >= frameDuration) {
      this.playbackFrame = (this.playbackFrame + 1) % this.frameBuffer.length;
      this.currentFrame = this.frameBuffer[this.playbackFrame];
      this.lastFrameTime = now;
      this.render();
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  setChannelView(channel: 'rgb' | 'r' | 'g' | 'b' | 'a'): void {
    this.showChannels = channel;
    this.render();
  }

  setExposure(exposure: number): void {
    this.exposure = exposure;
    this.render();
  }

  setGamma(gamma: number): void {
    this.gamma = gamma;
    this.render();
  }

  fitToWindow(): void {
    this.zoom = 1.0;
    this.pan = { x: 0, y: 0 };
    this.render();
  }

  render(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw checkerboard background
    this.drawCheckerboard();
    
    if (this.currentFrame) {
      ctx.save();
      ctx.translate(this.width / 2 + this.pan.x, this.height / 2 + this.pan.y);
      ctx.scale(this.zoom, this.zoom);
      
      // Apply color corrections and render
      const processedFrame = this.processFrame(this.currentFrame);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = processedFrame.width;
      tempCanvas.height = processedFrame.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(processedFrame, 0, 0);
        ctx.drawImage(tempCanvas, -processedFrame.width / 2, -processedFrame.height / 2);
      }
      
      ctx.restore();
    } else {
      this.drawPlaceholder();
    }
    
    // Draw frame info
    this.drawFrameInfo();
  }

  private processFrame(frame: ImageData): ImageData {
    const processed = new ImageData(
      new Uint8ClampedArray(frame.data),
      frame.width,
      frame.height
    );
    
    const exposureMult = Math.pow(2, this.exposure);
    
    for (let i = 0; i < processed.data.length; i += 4) {
      let r = processed.data[i];
      let g = processed.data[i + 1];
      let b = processed.data[i + 2];
      const a = processed.data[i + 3];
      
      // Apply exposure
      r = Math.min(255, r * exposureMult);
      g = Math.min(255, g * exposureMult);
      b = Math.min(255, b * exposureMult);
      
      // Apply gamma
      r = 255 * Math.pow(r / 255, 1 / this.gamma);
      g = 255 * Math.pow(g / 255, 1 / this.gamma);
      b = 255 * Math.pow(b / 255, 1 / this.gamma);
      
      // Channel isolation
      switch (this.showChannels) {
        case 'r':
          processed.data[i] = r;
          processed.data[i + 1] = r;
          processed.data[i + 2] = r;
          break;
        case 'g':
          processed.data[i] = g;
          processed.data[i + 1] = g;
          processed.data[i + 2] = g;
          break;
        case 'b':
          processed.data[i] = b;
          processed.data[i + 1] = b;
          processed.data[i + 2] = b;
          break;
        case 'a':
          processed.data[i] = a;
          processed.data[i + 1] = a;
          processed.data[i + 2] = a;
          processed.data[i + 3] = 255;
          break;
        default:
          processed.data[i] = r;
          processed.data[i + 1] = g;
          processed.data[i + 2] = b;
      }
    }
    
    return processed;
  }

  private drawCheckerboard(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const tileSize = 10;
    const colors = ['#1e1e1e', '#252525'];
    
    for (let x = 0; x < this.width; x += tileSize) {
      for (let y = 0; y < this.height; y += tileSize) {
        const colorIndex = ((x / tileSize) + (y / tileSize)) % 2;
        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  private drawPlaceholder(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    ctx.fillStyle = '#444';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Render View - No output', this.width / 2, this.height / 2);
  }

  private drawFrameInfo(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, this.height - 30, 200, 25);
    
    // Frame info
    ctx.fillStyle = '#888';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    const frameInfo = this.frameBuffer.length > 0 
      ? `Frame: ${this.playbackFrame + 1}/${this.frameBuffer.length} | ${this.playbackSpeed}fps`
      : 'No sequence loaded';
    
    ctx.fillText(frameInfo, 10, this.height - 17);
  }

  dispose(): void {
    this.pause();
  }
}

// Export viewport types
export type { ViewportState, CameraPreset };
