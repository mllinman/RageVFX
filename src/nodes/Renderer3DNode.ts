/**
 * Renderer3DNode - Full 3D scene rendering with advanced options
 * Version 2.0 - Full 3D rendering pipeline
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export class Renderer3DNode extends Node {
  private renderer: THREE.WebGLRenderer | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(id: string) {
    super(id, 'Renderer3D', 'Renderer 3D');
    this.metadata.category = '3D Pipeline';
    this.metadata.description = 'Full 3D scene rendering with advanced options';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('scene', 'Scene', DataType.ANY);
    this.addInput('camera', 'Camera', DataType.ANY);
    
    // Outputs
    this.addOutput('image', 'Image', DataType.IMAGE);
    this.addOutput('depth', 'Depth', DataType.IMAGE);
    this.addOutput('normal', 'Normal', DataType.IMAGE);
    
    // Parameters
    this.setParameter('width', 1920);
    this.setParameter('height', 1080);
    this.setParameter('antialias', true);
    this.setParameter('samples', 4);
    this.setParameter('toneMapping', 'aces');
    this.setParameter('toneMappingExposure', 1.0);
    this.setParameter('shadowMapEnabled', true);
    this.setParameter('shadowMapType', 'pcfsoft');
    this.setParameter('outputEncoding', 'sRGB');
    this.setParameter('physicallyCorrectLights', true);
    this.setParameter('alpha', false);
  }

  private initRenderer(): void {
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const antialias = this.getParameter('antialias');
    const alpha = this.getParameter('alpha');

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias,
      alpha,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(1);

    // Configure shadow mapping
    this.renderer.shadowMap.enabled = this.getParameter('shadowMapEnabled');
    const shadowType = this.getParameter('shadowMapType');
    switch (shadowType) {
      case 'basic':
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;
      case 'pcf':
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        break;
      case 'pcfsoft':
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
      case 'vsm':
        this.renderer.shadowMap.type = THREE.VSMShadowMap;
        break;
    }

    // Configure tone mapping
    const toneMapping = this.getParameter('toneMapping');
    switch (toneMapping) {
      case 'none':
        this.renderer.toneMapping = THREE.NoToneMapping;
        break;
      case 'linear':
        this.renderer.toneMapping = THREE.LinearToneMapping;
        break;
      case 'reinhard':
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        break;
      case 'cineon':
        this.renderer.toneMapping = THREE.CineonToneMapping;
        break;
      case 'aces':
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        break;
    }
    this.renderer.toneMappingExposure = this.getParameter('toneMappingExposure');

    // Configure output encoding
    const encoding = this.getParameter('outputEncoding');
    if (encoding === 'sRGB') {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
      this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    }

    // Create render target for multi-pass rendering
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      samples: this.getParameter('samples')
    });
  }

  async process(): Promise<void> {
    const width = this.getParameter('width');
    const height = this.getParameter('height');

    // Initialize or recreate renderer if needed
    if (!this.renderer || 
        this.renderer.domElement.width !== width || 
        this.renderer.domElement.height !== height) {
      this.disposeRenderer();
      this.initRenderer();
    }

    const sceneInput = this.inputs.get('scene');
    const cameraInput = this.inputs.get('camera');

    if (!this.renderer) return;

    // Get scene - handle both SceneData and raw Scene
    let scene: THREE.Scene | null = null;
    if (sceneInput?.value) {
      if (sceneInput.value instanceof THREE.Scene) {
        scene = sceneInput.value;
      } else if (sceneInput.value.scene instanceof THREE.Scene) {
        scene = sceneInput.value.scene;
      }
    }

    // Get camera - handle both from scene data and direct input
    let camera: THREE.Camera | null = null;
    if (cameraInput?.value) {
      if (cameraInput.value instanceof THREE.Camera) {
        camera = cameraInput.value;
      }
    } else if (sceneInput?.value?.camera) {
      camera = sceneInput.value.camera;
    }

    // Create default camera if none provided
    if (!camera) {
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 5);
    }

    // Create default scene if none provided
    if (!scene) {
      scene = new THREE.Scene();
    }

    // Render the scene
    this.renderer.setRenderTarget(null);
    this.renderer.render(scene, camera);
    
    const imageOutput = this.outputs.get('image');
    if (imageOutput) {
      imageOutput.value = {
        width,
        height,
        channels: 4,
        data: new Uint8Array(width * height * 4),
        format: 'rgba'
      };
      
      // In a real implementation, would read from WebGL context
      const gl = this.renderer.getContext();
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, imageOutput.value.data);
    }

    // Placeholder for depth and normal outputs
    const depthOutput = this.outputs.get('depth');
    if (depthOutput) {
      depthOutput.value = {
        width,
        height,
        channels: 1,
        data: new Float32Array(width * height),
        format: 'float'
      };
    }

    const normalOutput = this.outputs.get('normal');
    if (normalOutput) {
      normalOutput.value = {
        width,
        height,
        channels: 4,
        data: new Uint8Array(width * height * 4),
        format: 'rgba'
      };
    }
  }

  private disposeRenderer(): void {
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }

  dispose(): void {
    this.disposeRenderer();
    super.dispose();
  }
}
