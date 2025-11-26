/**
 * RenderEngine - GPU-accelerated rendering system for RageVFX
 * Supports WebGL and WebGPU for high-performance image processing and 3D rendering
 */

export interface ImageData {
  width: number;
  height: number;
  channels: number;
  data: Float32Array | Uint8Array;
  format: 'rgba' | 'rgb' | 'float';
}

export interface RenderSettings {
  width: number;
  height: number;
  quality: 'draft' | 'preview' | 'production';
  samples: number;
  useGPU: boolean;
}

export class RenderEngine {
  private canvas: HTMLCanvasElement | OffscreenCanvas;
  private gl: WebGL2RenderingContext | null;
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private shaders: Map<string, WebGLProgram> = new Map();

  constructor(width: number = 1920, height: number = 1080) {
    // Create canvas for rendering
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(width, height);
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
    }

    // Initialize WebGL2 context
    this.gl = this.canvas.getContext('webgl2') as WebGL2RenderingContext;
    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }

    this.initializeRenderContext();
  }

  /**
   * Initialize the rendering context with default settings
   */
  private initializeRenderContext(): void {
    if (!this.gl) return;

    // Set up viewport
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    // Enable alpha blending
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // Set clear color
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  /**
   * Create a texture from image data
   */
  createTexture(id: string, imageData: ImageData): boolean {
    if (!this.gl) return false;

    const texture = this.gl.createTexture();
    if (!texture) return false;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    
    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Upload texture data
    const format = imageData.channels === 4 ? this.gl.RGBA : this.gl.RGB;
    const type = imageData.format === 'float' ? this.gl.FLOAT : this.gl.UNSIGNED_BYTE;

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      format,
      imageData.width,
      imageData.height,
      0,
      format,
      type,
      imageData.data
    );

    this.textures.set(id, texture);
    return true;
  }

  /**
   * Compile a shader program
   */
  compileShader(id: string, vertexSource: string, fragmentSource: string): boolean {
    if (!this.gl) return false;

    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return false;

    // Compile vertex shader
    this.gl.shaderSource(vertexShader, vertexSource);
    this.gl.compileShader(vertexShader);

    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation failed:', this.gl.getShaderInfoLog(vertexShader));
      return false;
    }

    // Compile fragment shader
    this.gl.shaderSource(fragmentShader, fragmentSource);
    this.gl.compileShader(fragmentShader);

    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation failed:', this.gl.getShaderInfoLog(fragmentShader));
      return false;
    }

    // Link program
    const program = this.gl.createProgram();
    if (!program) return false;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Shader program linking failed:', this.gl.getProgramInfoLog(program));
      return false;
    }

    this.shaders.set(id, program);
    return true;
  }

  /**
   * Render with a specific shader
   */
  render(shaderId: string, inputTextures: Map<string, string>, outputId: string): boolean {
    if (!this.gl) return false;

    const program = this.shaders.get(shaderId);
    if (!program) return false;

    this.gl.useProgram(program);

    // Bind input textures
    let textureUnit = 0;
    inputTextures.forEach((textureId, uniformName) => {
      const texture = this.textures.get(textureId);
      if (texture) {
        this.gl!.activeTexture(this.gl!.TEXTURE0 + textureUnit);
        this.gl!.bindTexture(this.gl!.TEXTURE_2D, texture);
        const location = this.gl!.getUniformLocation(program, uniformName);
        this.gl!.uniform1i(location, textureUnit);
        textureUnit++;
      }
    });

    // Draw quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return true;
  }

  /**
   * Read pixels from the current framebuffer
   */
  readPixels(width: number, height: number): ImageData {
    if (!this.gl) {
      throw new Error('WebGL context not available');
    }

    const data = new Uint8Array(width * height * 4);
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);

    return {
      width,
      height,
      channels: 4,
      data,
      format: 'rgba'
    };
  }

  /**
   * Resize the render context
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvas;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (!this.gl) return;

    // Delete all textures
    this.textures.forEach(texture => this.gl!.deleteTexture(texture));
    this.textures.clear();

    // Delete all shaders
    this.shaders.forEach(program => this.gl!.deleteProgram(program));
    this.shaders.clear();

    // Delete all framebuffers
    this.framebuffers.forEach(fb => this.gl!.deleteFramebuffer(fb));
    this.framebuffers.clear();
  }
}
