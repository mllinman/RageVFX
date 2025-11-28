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

  // Selection and manipulation
  private selectedObject: THREE.Object3D | null = null;
  private transformMode: 'translate' | 'rotate' | 'scale' = 'translate';
  private wasdState: { w: boolean; a: boolean; s: boolean; d: boolean; q: boolean; e: boolean } = 
    { w: false, a: false, s: false, d: false, q: false, e: false };
  private shiftHeld: boolean = false;
  private altHeld: boolean = false;
  private lastFrameTime: number = 0;
  private moveSpeed: number = 5.0;
  private rotateSpeed: number = 90; // degrees per second
  private scaleSpeed: number = 1.0;

  // View through camera feature
  private viewThroughCamera: THREE.PerspectiveCamera | null = null;
  private isViewingThroughCamera: boolean = false;

  // Selection helper
  private selectionHelper: THREE.BoxHelper | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

  // Callbacks
  private onObjectSelect: ((object: THREE.Object3D | null) => void) | null = null;
  private onKeyframe: ((objectId: string, transform: { position: number[]; rotation: number[]; scale: number[] }) => void) | null = null;

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
    this.setupKeyboardControls();
    this.startRenderLoop();
  }

  /**
   * Get the currently active camera (either main or view-through camera)
   */
  private getActiveCamera(): THREE.PerspectiveCamera {
    return this.isViewingThroughCamera && this.viewThroughCamera 
      ? this.viewThroughCamera 
      : this.camera;
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
    
    // Click handler for selection
    this.container.addEventListener('click', (e) => this.onContainerClick(e));
  }

  private setupKeyboardControls(): void {
    // Keyboard event handlers for WASD and other controls
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Check if viewport has focus
    if (!this.container.contains(document.activeElement) && document.activeElement !== document.body) {
      return;
    }

    // Track modifier keys
    this.shiftHeld = e.shiftKey;
    this.altHeld = e.altKey;

    // WASD controls
    switch (e.key.toLowerCase()) {
      case 'w':
        this.wasdState.w = true;
        break;
      case 'a':
        this.wasdState.a = true;
        break;
      case 's':
        this.wasdState.s = true;
        break;
      case 'd':
        this.wasdState.d = true;
        break;
      case 'q':
        this.wasdState.q = true;
        break;
      case 'e':
        this.wasdState.e = true;
        break;
      case 'g':
        // G for translate (grab) mode
        this.setTransformMode('translate');
        break;
      case 'r':
        // R for rotate mode
        this.setTransformMode('rotate');
        break;
      case 't':
        // T for scale mode (like Blender)
        this.setTransformMode('scale');
        break;
      case 'f':
        // F to set keyframe on timeline
        e.preventDefault();
        this.setKeyframe();
        break;
      case 'escape':
        // Escape to deselect
        this.selectObject(null);
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.shiftHeld = e.shiftKey;
    this.altHeld = e.altKey;

    switch (e.key.toLowerCase()) {
      case 'w':
        this.wasdState.w = false;
        break;
      case 'a':
        this.wasdState.a = false;
        break;
      case 's':
        this.wasdState.s = false;
        break;
      case 'd':
        this.wasdState.d = false;
        break;
      case 'q':
        this.wasdState.q = false;
        break;
      case 'e':
        this.wasdState.e = false;
        break;
    }
  }

  private onContainerClick(e: MouseEvent): void {
    // Calculate normalized device coordinates
    const rect = this.container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find clicked object
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.getActiveCamera());
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Filter out helpers (grid, axes, selection box)
    const selectableIntersects = intersects.filter(i => {
      const obj = i.object;
      return !(obj instanceof THREE.GridHelper || 
               obj instanceof THREE.AxesHelper ||
               obj instanceof THREE.BoxHelper ||
               obj instanceof THREE.Line);
    });

    if (selectableIntersects.length > 0) {
      this.selectObject(selectableIntersects[0].object);
    } else if (!e.shiftKey) {
      this.selectObject(null);
    }
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
    cube.name = 'SampleCube';
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
    ground.name = 'Ground';
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
    
    if (this.viewThroughCamera) {
      this.viewThroughCamera.aspect = this.width / this.height;
      this.viewThroughCamera.updateProjectionMatrix();
    }
  }

  private startRenderLoop(): void {
    this.lastFrameTime = performance.now();
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Calculate delta time
      const now = performance.now();
      const deltaTime = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      
      // Update WASD movement for selected object
      this.updateObjectMovement(deltaTime);
      
      // Update selection helper
      if (this.selectionHelper && this.selectedObject) {
        this.selectionHelper.update();
      }
      
      this.controls.update();
      
      if (this.renderer) {
        this.renderer.render(this.scene, this.getActiveCamera());
      }
    };
    animate();
  }

  private updateObjectMovement(deltaTime: number): void {
    if (!this.selectedObject) return;

    // Calculate speed modifiers
    let speedMod = 1.0;
    if (this.shiftHeld) speedMod *= 3.0;
    if (this.altHeld) speedMod *= 0.1;

    const hasInput = this.wasdState.w || this.wasdState.a || this.wasdState.s || 
                     this.wasdState.d || this.wasdState.q || this.wasdState.e;
    
    if (!hasInput) return;

    switch (this.transformMode) {
      case 'translate': {
        const moveAmount = this.moveSpeed * speedMod * deltaTime;
        if (this.wasdState.w) this.selectedObject.position.z -= moveAmount;
        if (this.wasdState.s) this.selectedObject.position.z += moveAmount;
        if (this.wasdState.a) this.selectedObject.position.x -= moveAmount;
        if (this.wasdState.d) this.selectedObject.position.x += moveAmount;
        if (this.wasdState.q) this.selectedObject.position.y -= moveAmount;
        if (this.wasdState.e) this.selectedObject.position.y += moveAmount;
        break;
      }
      case 'rotate': {
        const rotateAmount = (this.rotateSpeed * speedMod * deltaTime) * Math.PI / 180;
        if (this.wasdState.w) this.selectedObject.rotation.x += rotateAmount;
        if (this.wasdState.s) this.selectedObject.rotation.x -= rotateAmount;
        if (this.wasdState.a) this.selectedObject.rotation.y += rotateAmount;
        if (this.wasdState.d) this.selectedObject.rotation.y -= rotateAmount;
        if (this.wasdState.q) this.selectedObject.rotation.z += rotateAmount;
        if (this.wasdState.e) this.selectedObject.rotation.z -= rotateAmount;
        break;
      }
      case 'scale': {
        const scaleAmount = this.scaleSpeed * speedMod * deltaTime;
        if (this.wasdState.w || this.wasdState.d) {
          this.selectedObject.scale.x += scaleAmount;
          this.selectedObject.scale.y += scaleAmount;
          this.selectedObject.scale.z += scaleAmount;
        }
        if (this.wasdState.s || this.wasdState.a) {
          this.selectedObject.scale.x = Math.max(0.01, this.selectedObject.scale.x - scaleAmount);
          this.selectedObject.scale.y = Math.max(0.01, this.selectedObject.scale.y - scaleAmount);
          this.selectedObject.scale.z = Math.max(0.01, this.selectedObject.scale.z - scaleAmount);
        }
        break;
      }
    }
  }

  // Selection methods
  selectObject(object: THREE.Object3D | null): void {
    // Remove existing selection helper
    if (this.selectionHelper) {
      this.scene.remove(this.selectionHelper);
      this.selectionHelper = null;
    }

    this.selectedObject = object;

    // Create selection helper for new selection
    if (object) {
      this.selectionHelper = new THREE.BoxHelper(object, 0xffff00);
      this.scene.add(this.selectionHelper);
    }

    // Notify callback
    if (this.onObjectSelect) {
      this.onObjectSelect(object);
    }
  }

  getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }

  setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.transformMode = mode;
  }

  getTransformMode(): 'translate' | 'rotate' | 'scale' {
    return this.transformMode;
  }

  // Keyframe methods
  setKeyframe(): void {
    if (!this.selectedObject || !this.onKeyframe) return;

    const transform = {
      position: [
        this.selectedObject.position.x,
        this.selectedObject.position.y,
        this.selectedObject.position.z
      ],
      rotation: [
        this.selectedObject.rotation.x * 180 / Math.PI,
        this.selectedObject.rotation.y * 180 / Math.PI,
        this.selectedObject.rotation.z * 180 / Math.PI
      ],
      scale: [
        this.selectedObject.scale.x,
        this.selectedObject.scale.y,
        this.selectedObject.scale.z
      ]
    };

    this.onKeyframe(this.selectedObject.name || this.selectedObject.uuid, transform);
  }

  setOnKeyframeCallback(callback: (objectId: string, transform: { position: number[]; rotation: number[]; scale: number[] }) => void): void {
    this.onKeyframe = callback;
  }

  setOnObjectSelectCallback(callback: (object: THREE.Object3D | null) => void): void {
    this.onObjectSelect = callback;
  }

  // View through camera methods
  setViewThroughCamera(camera: THREE.PerspectiveCamera | null): void {
    this.viewThroughCamera = camera;
    if (camera) {
      camera.aspect = this.width / this.height;
      camera.updateProjectionMatrix();
    }
  }

  enableViewThroughCamera(enabled: boolean): void {
    this.isViewingThroughCamera = enabled;
  }

  isViewingThrough(): boolean {
    return this.isViewingThroughCamera;
  }

  // Movement speed setters
  setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  setRotateSpeed(speed: number): void {
    this.rotateSpeed = speed;
  }

  setScaleSpeed(speed: number): void {
    this.scaleSpeed = speed;
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

  /**
   * Set shading mode for all meshes in the scene
   */
  setShadingMode(mode: 'solid' | 'wireframe' | 'material' | 'rendered'): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const material = object.material as THREE.MeshStandardMaterial;
        switch (mode) {
          case 'wireframe':
            material.wireframe = true;
            break;
          case 'solid':
            material.wireframe = false;
            material.flatShading = true;
            material.needsUpdate = true;
            break;
          case 'material':
          case 'rendered':
            material.wireframe = false;
            material.flatShading = false;
            material.needsUpdate = true;
            break;
        }
      }
    });
  }

  /**
   * Set viewport background
   */
  setBackground(type: 'gradient' | 'solid' | 'hdri' | 'transparent', color?: string): void {
    if (type === 'transparent') {
      this.scene.background = null;
      if (this.renderer) {
        this.renderer.setClearColor(0x000000, 0);
      }
    } else if (type === 'solid' && color) {
      this.scene.background = new THREE.Color(color);
    } else if (type === 'gradient') {
      // Create gradient background using a custom shader or default dark
      this.scene.background = new THREE.Color(0x1a1a1a);
    }
  }

  /**
   * Frame selected object (focus camera on it)
   */
  frameSelected(): void {
    if (!this.selectedObject) return;

    const box = new THREE.Box3().setFromObject(this.selectedObject);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, center)
      .normalize();
    
    this.camera.position.copy(center).add(direction.multiplyScalar(distance));
    this.controls.setTarget(center);
  }

  /**
   * Focus on all objects in scene
   */
  frameAll(): void {
    const box = new THREE.Box3();
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && 
          !(object instanceof THREE.GridHelper) &&
          !(object.parent instanceof THREE.AxesHelper)) {
        box.expandByObject(object);
      }
    });

    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;

    const direction = new THREE.Vector3(1, 0.7, 1).normalize();
    this.camera.position.copy(center).add(direction.multiplyScalar(distance));
    this.controls.setTarget(center);
  }

  /**
   * Set ambient light intensity
   */
  setAmbientIntensity(intensity: number): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.AmbientLight) {
        object.intensity = intensity;
      }
    });
  }

  /**
   * Toggle shadow visibility
   */
  setShadowsEnabled(enabled: boolean): void {
    if (this.renderer) {
      this.renderer.shadowMap.enabled = enabled;
    }
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        object.castShadow = enabled;
      }
      if (object instanceof THREE.Mesh) {
        object.castShadow = enabled;
        object.receiveShadow = enabled;
      }
    });
  }

  /**
   * Set shadow quality
   */
  setShadowQuality(quality: 'off' | 'low' | 'medium' | 'high'): void {
    if (!this.renderer) return;

    if (quality === 'off') {
      this.renderer.shadowMap.enabled = false;
      return;
    }

    this.renderer.shadowMap.enabled = true;
    
    const sizes: Record<string, number> = {
      'low': 512,
      'medium': 1024,
      'high': 2048
    };

    const size = sizes[quality] || 1024;

    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight && object.shadow) {
        object.shadow.mapSize.width = size;
        object.shadow.mapSize.height = size;
      }
    });
  }

  /**
   * Add a helper for visualizing bounding boxes
   */
  showBoundingBoxes(visible: boolean): void {
    // Remove existing helpers
    const helpersToRemove: THREE.BoxHelper[] = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.BoxHelper && object.name === 'boundingBoxHelper') {
        helpersToRemove.push(object);
      }
    });
    helpersToRemove.forEach(h => this.scene.remove(h));

    if (!visible) return;

    // Add new helpers
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && 
          !(object instanceof THREE.GridHelper)) {
        const helper = new THREE.BoxHelper(object, 0x888888);
        helper.name = 'boundingBoxHelper';
        this.scene.add(helper);
      }
    });
  }

  /**
   * Get statistics about the scene
   */
  getSceneStats(): { objects: number; vertices: number; triangles: number } {
    let objects = 0;
    let vertices = 0;
    let triangles = 0;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        objects++;
        const geometry = object.geometry;
        if (geometry) {
          if (geometry.index) {
            triangles += geometry.index.count / 3;
          } else if (geometry.attributes.position) {
            triangles += geometry.attributes.position.count / 3;
          }
          if (geometry.attributes.position) {
            vertices += geometry.attributes.position.count;
          }
        }
      }
    });

    return { objects, vertices, triangles };
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
