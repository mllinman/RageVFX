/**
 * BackgroundCardNode - Create background card/plane with image or video for VFX placement
 * Version 3.11 - Background Card System
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

interface BackgroundCard {
  mesh: THREE.Mesh;
  geometry: THREE.PlaneGeometry;
  material: THREE.MeshBasicMaterial;
  texture: THREE.Texture | null;
  bounds: THREE.Box3;
}

export class BackgroundCardNode extends Node {
  private card: BackgroundCard | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private videoTexture: THREE.VideoTexture | null = null;

  constructor(id: string) {
    super(id, 'BackgroundCard', 'Background Card');
    this.metadata.category = 'Geometry';
    this.metadata.description = 'Create a background card/plane with image or video for VFX placement in 2D and 3D workflows';
    this.metadata.version = '3.11.0';
    
    // Inputs
    this.addInput('image', 'Image/Video', DataType.IMAGE);
    this.addInput('camera', 'Camera (for 2D mode)', DataType.GEOMETRY_3D);
    this.addInput('transform', 'Transform', DataType.MATRIX);
    
    // Outputs
    this.addOutput('geometry', 'Card Geometry', DataType.GEOMETRY_3D);
    this.addOutput('mesh', 'Card Mesh', DataType.ANY);
    this.addOutput('texture', 'Texture', DataType.IMAGE);
    this.addOutput('bounds', 'Bounding Box', DataType.ANY);
    
    // Card Mode
    this.setParameter('mode', '3d');  // 3d, 2d, camera-facing, screen-space
    this.setParameter('filepath', '');  // Path to image or video file
    this.setParameter('mediaType', 'auto');  // auto, image, video, sequence
    
    // Card Size and Position (3D mode)
    this.setParameter('width', 10.0);  // World units
    this.setParameter('height', 5.625);  // 16:9 aspect ratio default
    this.setParameter('autoAspect', true);  // Automatically maintain aspect ratio
    this.setParameter('pixelsPerUnit', 100);  // For pixel-perfect scaling
    
    // Position
    this.setParameter('positionX', 0.0);
    this.setParameter('positionY', 0.0);
    this.setParameter('positionZ', -10.0);
    
    // Rotation
    this.setParameter('rotationX', 0.0);  // Degrees
    this.setParameter('rotationY', 0.0);
    this.setParameter('rotationZ', 0.0);
    
    // Scale
    this.setParameter('scaleX', 1.0);
    this.setParameter('scaleY', 1.0);
    this.setParameter('scaleUniform', true);
    
    // 2D/Screen Space Settings
    this.setParameter('screenPosition', 'fill');  // fill, fit, stretch, custom
    this.setParameter('alignmentX', 'center');  // left, center, right
    this.setParameter('alignmentY', 'center');  // top, center, bottom
    this.setParameter('offsetX', 0.0);  // Screen space offset (-1 to 1)
    this.setParameter('offsetY', 0.0);
    
    // Camera-Facing Settings
    this.setParameter('billboardMode', 'spherical');  // spherical, cylindrical, none
    this.setParameter('lockYAxis', false);  // Keep card upright
    this.setParameter('distance', 10.0);  // Distance from camera
    
    // Material Settings
    this.setParameter('opacity', 1.0);
    this.setParameter('transparent', false);
    this.setParameter('blendMode', 'normal');  // normal, additive, multiply, screen
    this.setParameter('doubleSided', false);
    this.setParameter('depthTest', true);
    this.setParameter('depthWrite', true);
    
    // Texture Settings
    this.setParameter('textureFiltering', 'linear');  // linear, nearest, mipmap
    this.setParameter('textureWrapS', 'clamp');  // clamp, repeat, mirror
    this.setParameter('textureWrapT', 'clamp');
    this.setParameter('flipY', true);
    this.setParameter('premultiplyAlpha', false);
    
    // Video Settings
    this.setParameter('videoLoop', true);
    this.setParameter('videoAutoplay', true);
    this.setParameter('videoMuted', true);
    this.setParameter('videoPlaybackRate', 1.0);
    this.setParameter('videoStartTime', 0.0);
    
    // Image Sequence Settings
    this.setParameter('sequencePattern', 'frame_####.png');  // Filename pattern
    this.setParameter('sequenceStart', 1);
    this.setParameter('sequenceEnd', 100);
    this.setParameter('sequenceFPS', 24);
    
    // UV Mapping
    this.setParameter('uvMode', 'default');  // default, custom
    this.setParameter('uvOffsetX', 0.0);
    this.setParameter('uvOffsetY', 0.0);
    this.setParameter('uvScaleX', 1.0);
    this.setParameter('uvScaleY', 1.0);
    this.setParameter('uvRotation', 0.0);  // Degrees
    
    // Subdivisions (for deformation)
    this.setParameter('subdivisionsX', 1);
    this.setParameter('subdivisionsY', 1);
    this.setParameter('enableDeformation', false);
    
    // Advanced Options
    this.setParameter('castShadow', false);
    this.setParameter('receiveShadow', false);
    this.setParameter('renderOrder', 0);
    this.setParameter('frustumCulled', true);
    this.setParameter('visible', true);
    
    // Color Correction
    this.setParameter('colorMultiply', { r: 255, g: 255, b: 255 });
    this.setParameter('brightness', 1.0);
    this.setParameter('contrast', 1.0);
    this.setParameter('saturation', 1.0);
    this.setParameter('hue', 0.0);
    
    // Guides and Helpers
    this.setParameter('showBounds', false);
    this.setParameter('showGrid', false);
    this.setParameter('showNormals', false);
  }

  async process(): Promise<void> {
    const imageInput = this.inputs.get('image')?.value;
    const camera = this.inputs.get('camera')?.value;
    const transform = this.inputs.get('transform')?.value;
    
    // Create or update the background card
    await this.createCard(imageInput, camera);
    
    // Apply transform if provided
    if (transform) {
      this.applyTransform(transform);
    }
    
    // Set outputs
    const geometryOutput = this.outputs.get('geometry');
    if (geometryOutput && this.card) {
      geometryOutput.value = this.card.geometry;
    }
    
    const meshOutput = this.outputs.get('mesh');
    if (meshOutput && this.card) {
      meshOutput.value = this.card.mesh;
    }
    
    const textureOutput = this.outputs.get('texture');
    if (textureOutput && this.card?.texture) {
      textureOutput.value = this.card.texture;
    }
    
    const boundsOutput = this.outputs.get('bounds');
    if (boundsOutput && this.card) {
      boundsOutput.value = this.card.bounds;
    }
  }

  private async createCard(imageData?: any, camera?: THREE.Camera): Promise<void> {
    const mode = this.getParameter('mode');
    const filepath = this.getParameter('filepath');
    const mediaType = this.detectMediaType(filepath);
    
    // Get dimensions
    const width = this.getParameter('width');
    let height = this.getParameter('height');
    
    // Auto aspect ratio from image if available
    if (this.getParameter('autoAspect') && imageData) {
      const aspect = imageData.width / imageData.height;
      height = width / aspect;
    }
    
    // Create geometry with optional subdivisions
    const subdivisionsX = this.getParameter('subdivisionsX');
    const subdivisionsY = this.getParameter('subdivisionsY');
    const geometry = new THREE.PlaneGeometry(width, height, subdivisionsX, subdivisionsY);
    
    // Apply UV transformations
    this.applyUVTransform(geometry);
    
    // Create or load texture
    let texture: THREE.Texture | null = null;
    
    if (imageData) {
      texture = this.createTextureFromImageData(imageData);
    } else if (filepath) {
      if (mediaType === 'video') {
        texture = await this.createVideoTexture(filepath);
      } else if (mediaType === 'sequence') {
        texture = await this.createSequenceTexture(filepath);
      } else {
        texture = await this.createImageTexture(filepath);
      }
    } else {
      // Create a placeholder texture
      texture = this.createPlaceholderTexture();
    }
    
    // Configure texture
    if (texture) {
      this.configureTexture(texture);
    }
    
    // Create material
    const material = this.createMaterial(texture);
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Apply position, rotation, scale
    this.applyTransformParameters(mesh);
    
    // Handle different modes
    this.applyMode(mesh, mode, camera);
    
    // Calculate bounds
    const bounds = new THREE.Box3().setFromObject(mesh);
    
    this.card = {
      mesh,
      geometry,
      material,
      texture,
      bounds
    };
  }

  private detectMediaType(filepath: string): string {
    const mediaType = this.getParameter('mediaType');
    if (mediaType !== 'auto') return mediaType;
    
    const ext = filepath.split('.').pop()?.toLowerCase() || '';
    
    // Video formats
    const videoFormats = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'm4v'];
    if (videoFormats.includes(ext)) return 'video';
    
    // Image sequence pattern detection
    if (filepath.includes('#') || filepath.includes('%')) return 'sequence';
    
    // Image formats
    const imageFormats = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff', 'tga', 'exr', 'hdr'];
    if (imageFormats.includes(ext)) return 'image';
    
    return 'image';
  }

  private createTextureFromImageData(imageData: any): THREE.Texture {
    // Create texture from image data buffer
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imgData = ctx.createImageData(imageData.width, imageData.height);
      imgData.data.set(imageData.data);
      ctx.putImageData(imgData, 0, 0);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private async createVideoTexture(filepath: string): Promise<THREE.VideoTexture> {
    // Validate filepath before use
    if (!filepath || typeof filepath !== 'string') {
      console.warn('BackgroundCardNode: Invalid video filepath');
      return this.createPlaceholderTexture() as any;
    }
    
    // Create video element
    this.videoElement = document.createElement('video');
    // Sanitize filepath: only allow safe protocols
    const sanitizedPath = this.sanitizeFilePath(filepath);
    this.videoElement.src = sanitizedPath;
    this.videoElement.loop = this.getParameter('videoLoop');
    this.videoElement.muted = this.getParameter('videoMuted');
    this.videoElement.playbackRate = this.getParameter('videoPlaybackRate');
    this.videoElement.currentTime = this.getParameter('videoStartTime');
    
    if (this.getParameter('videoAutoplay')) {
      this.videoElement.play().catch(err => {
        console.warn('Video autoplay failed:', err);
      });
    }
    
    // Create video texture
    this.videoTexture = new THREE.VideoTexture(this.videoElement);
    return this.videoTexture;
  }

  private async createSequenceTexture(filepath: string): Promise<THREE.Texture> {
    // For image sequences, load the first frame as placeholder
    // In real implementation would handle frame playback
    const pattern = this.getParameter('sequencePattern');
    const start = this.getParameter('sequenceStart');
    
    // Replace #### with frame number
    const firstFramePath = pattern.replace(/#+/, String(start).padStart(4, '0'));
    
    return this.createImageTexture(firstFramePath);
  }

  private async createImageTexture(filepath: string): Promise<THREE.Texture> {
    // Simulate image loading
    // In real implementation would use TextureLoader
    const loader = new THREE.TextureLoader();
    
    return new Promise((resolve, reject) => {
      loader.load(
        filepath,
        (texture) => resolve(texture),
        undefined,
        (err) => {
          console.warn('Failed to load texture:', err);
          resolve(this.createPlaceholderTexture());
        }
      );
    });
  }

  private createPlaceholderTexture(): THREE.Texture {
    // Create a simple gradient placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, '#4a5568');
      gradient.addColorStop(1, '#2d3748');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      // Add text
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Background Card', 256, 256);
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  private configureTexture(texture: THREE.Texture): void {
    const filtering = this.getParameter('textureFiltering');
    const wrapS = this.getParameter('textureWrapS');
    const wrapT = this.getParameter('textureWrapT');
    
    // Set filtering
    if (filtering === 'nearest') {
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
    } else if (filtering === 'mipmap') {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
    } else {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
    
    // Set wrapping
    const wrapMap: Record<string, THREE.Wrapping> = {
      'clamp': THREE.ClampToEdgeWrapping,
      'repeat': THREE.RepeatWrapping,
      'mirror': THREE.MirroredRepeatWrapping
    };
    
    texture.wrapS = wrapMap[wrapS] || THREE.ClampToEdgeWrapping;
    texture.wrapT = wrapMap[wrapT] || THREE.ClampToEdgeWrapping;
    
    texture.flipY = this.getParameter('flipY');
    texture.premultiplyAlpha = this.getParameter('premultiplyAlpha');
    texture.needsUpdate = true;
  }

  private createMaterial(texture: THREE.Texture | null): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: this.getParameter('transparent'),
      opacity: this.getParameter('opacity'),
      side: this.getParameter('doubleSided') ? THREE.DoubleSide : THREE.FrontSide,
      depthTest: this.getParameter('depthTest'),
      depthWrite: this.getParameter('depthWrite')
    });
    
    // Apply blend mode
    const blendMode = this.getParameter('blendMode');
    switch (blendMode) {
      case 'additive':
        material.blending = THREE.AdditiveBlending;
        break;
      case 'multiply':
        material.blending = THREE.MultiplyBlending;
        break;
      case 'screen':
        material.blending = THREE.CustomBlending;
        material.blendEquation = THREE.AddEquation;
        material.blendSrc = THREE.OneMinusDstColorFactor;
        material.blendDst = THREE.OneFactor;
        break;
      default:
        material.blending = THREE.NormalBlending;
    }
    
    // Apply color adjustments
    const colorMultiply = this.getParameter('colorMultiply');
    material.color = new THREE.Color(
      colorMultiply.r / 255,
      colorMultiply.g / 255,
      colorMultiply.b / 255
    );
    
    return material;
  }

  private applyUVTransform(geometry: THREE.PlaneGeometry): void {
    if (this.getParameter('uvMode') !== 'custom') return;
    
    const uvAttribute = geometry.attributes.uv;
    const offsetX = this.getParameter('uvOffsetX');
    const offsetY = this.getParameter('uvOffsetY');
    const scaleX = this.getParameter('uvScaleX');
    const scaleY = this.getParameter('uvScaleY');
    const rotation = this.getParameter('uvRotation') * Math.PI / 180;
    
    for (let i = 0; i < uvAttribute.count; i++) {
      let u = uvAttribute.getX(i);
      let v = uvAttribute.getY(i);
      
      // Center around origin
      u -= 0.5;
      v -= 0.5;
      
      // Apply rotation
      if (rotation !== 0) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const newU = u * cos - v * sin;
        const newV = u * sin + v * cos;
        u = newU;
        v = newV;
      }
      
      // Apply scale
      u *= scaleX;
      v *= scaleY;
      
      // Move back and apply offset
      u += 0.5 + offsetX;
      v += 0.5 + offsetY;
      
      uvAttribute.setXY(i, u, v);
    }
    
    uvAttribute.needsUpdate = true;
  }

  private applyTransformParameters(mesh: THREE.Mesh): void {
    // Position
    mesh.position.set(
      this.getParameter('positionX'),
      this.getParameter('positionY'),
      this.getParameter('positionZ')
    );
    
    // Rotation (convert degrees to radians)
    mesh.rotation.set(
      this.getParameter('rotationX') * Math.PI / 180,
      this.getParameter('rotationY') * Math.PI / 180,
      this.getParameter('rotationZ') * Math.PI / 180
    );
    
    // Scale
    const scaleX = this.getParameter('scaleX');
    const scaleY = this.getParameter('scaleUniform') ? scaleX : this.getParameter('scaleY');
    mesh.scale.set(scaleX, scaleY, 1.0);
    
    // Advanced properties
    mesh.castShadow = this.getParameter('castShadow');
    mesh.receiveShadow = this.getParameter('receiveShadow');
    mesh.renderOrder = this.getParameter('renderOrder');
    mesh.frustumCulled = this.getParameter('frustumCulled');
    mesh.visible = this.getParameter('visible');
  }

  private applyMode(mesh: THREE.Mesh, mode: string, camera?: THREE.Camera): void {
    switch (mode) {
      case '2d':
      case 'screen-space':
        this.applyScreenSpaceMode(mesh, camera);
        break;
      case 'camera-facing':
        this.applyCameraFacingMode(mesh, camera);
        break;
      case '3d':
      default:
        // 3D mode - use transforms as-is
        break;
    }
  }

  private applyScreenSpaceMode(mesh: THREE.Mesh, camera?: THREE.Camera): void {
    // Position card in screen space relative to camera
    if (!camera) return;
    
    const screenPosition = this.getParameter('screenPosition');
    const alignmentX = this.getParameter('alignmentX');
    const alignmentY = this.getParameter('alignmentY');
    const offsetX = this.getParameter('offsetX');
    const offsetY = this.getParameter('offsetY');
    const distance = this.getParameter('distance');
    
    // Position card in front of camera at specified distance
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    mesh.position.copy(camera.position).add(direction.multiplyScalar(distance));
    mesh.quaternion.copy(camera.quaternion);
    
    // Apply screen-space alignment offsets
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    
    mesh.position.add(right.multiplyScalar(offsetX * 10));
    mesh.position.add(up.multiplyScalar(offsetY * 10));
  }

  private applyCameraFacingMode(mesh: THREE.Mesh, camera?: THREE.Camera): void {
    // Make card always face the camera (billboard)
    if (!camera) return;
    
    const billboardMode = this.getParameter('billboardMode');
    const lockYAxis = this.getParameter('lockYAxis');
    
    if (billboardMode === 'spherical') {
      // Full spherical billboard - face camera completely
      mesh.lookAt(camera.position);
    } else if (billboardMode === 'cylindrical' || lockYAxis) {
      // Cylindrical billboard - only rotate around Y axis
      const direction = new THREE.Vector3();
      direction.subVectors(camera.position, mesh.position);
      direction.y = 0;
      direction.normalize();
      
      const angle = Math.atan2(direction.x, direction.z);
      mesh.rotation.y = angle;
    }
  }

  private applyTransform(transform: number[]): void {
    if (!this.card || transform.length !== 16) return;
    
    const matrix = new THREE.Matrix4();
    matrix.fromArray(transform);
    
    this.card.mesh.applyMatrix4(matrix);
  }

  /**
   * Sanitize file path to prevent security issues
   * @param filepath - Raw filepath from user input
   * @returns Sanitized filepath safe for use
   */
  private sanitizeFilePath(filepath: string): string {
    // Remove any potentially dangerous protocols
    const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lower = filepath.toLowerCase();
    
    for (const protocol of dangerous) {
      if (lower.includes(protocol)) {
        console.warn(`BackgroundCardNode: Blocked dangerous protocol in filepath: ${protocol}`);
        return '';
      }
    }
    
    // Only allow http, https, blob, and relative paths
    if (filepath.match(/^(https?:|blob:)/i) || !filepath.includes(':')) {
      return filepath;
    }
    
    console.warn('BackgroundCardNode: Filepath protocol not allowed');
    return '';
  }

  // Cleanup method
  dispose(): void {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement = null;
    }
    
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }
    
    if (this.card) {
      this.card.geometry.dispose();
      this.card.material.dispose();
      if (this.card.texture) {
        this.card.texture.dispose();
      }
      this.card = null;
    }
  }
}
