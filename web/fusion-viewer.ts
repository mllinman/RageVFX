/**
 * Fusion-style Dual Viewer System
 * Version 3.6 - Fusion Tools
 * 
 * Provides Blackmagic Fusion-style dual viewer layout with A/B comparison
 */

export enum ViewerMode {
  SINGLE = 'single',
  DUAL = 'dual',
  QUAD = 'quad',
  COMPARE_AB = 'compare_ab',
  WIPE = 'wipe',
  DIFFERENCE = 'difference',
  ONION_SKIN = 'onion_skin'
}

export enum ViewerChannel {
  RGB = 'rgb',
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  ALPHA = 'alpha',
  LUMINANCE = 'luminance'
}

interface ViewerSettings {
  mode: ViewerMode;
  channel: ViewerChannel;
  zoom: number;
  pan: { x: number; y: number };
  exposure: number;
  gamma: number;
  showGrid: boolean;
  showGuides: boolean;
  showSafeArea: boolean;
  backgroundColor: string;
  pixelAspectRatio: number;
}

export class FusionViewer {
  private container: HTMLElement;
  private leftCanvas: HTMLCanvasElement;
  private rightCanvas: HTMLCanvasElement;
  private leftCtx: CanvasRenderingContext2D | null;
  private rightCtx: CanvasRenderingContext2D | null;
  private wipeSlider: HTMLDivElement | null = null;
  
  private settings: ViewerSettings = {
    mode: ViewerMode.DUAL,
    channel: ViewerChannel.RGB,
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    exposure: 1.0,
    gamma: 1.0,
    showGrid: false,
    showGuides: false,
    showSafeArea: false,
    backgroundColor: '#1a1a1a',
    pixelAspectRatio: 1.0
  };
  
  private leftImage: ImageData | null = null;
  private rightImage: ImageData | null = null;
  private wipePosition: number = 0.5;
  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = element;
    
    // Create viewer structure
    this.createViewerUI();
    
    // Create canvases
    this.leftCanvas = document.createElement('canvas');
    this.rightCanvas = document.createElement('canvas');
    this.leftCtx = this.leftCanvas.getContext('2d');
    this.rightCtx = this.rightCanvas.getContext('2d');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial render
    this.updateLayout();
  }
  
  private createViewerUI(): void {
    this.container.innerHTML = `
      <div class="fusion-viewer-container" style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: ${this.settings.backgroundColor};
        position: relative;
      ">
        <!-- Toolbar -->
        <div class="fusion-viewer-toolbar" style="
          height: 40px;
          background: #2a2a2a;
          display: flex;
          align-items: center;
          padding: 0 10px;
          gap: 10px;
          border-bottom: 1px solid #404040;
        ">
          <button id="viewer-mode-single" class="viewer-btn" title="Single Viewer">1</button>
          <button id="viewer-mode-dual" class="viewer-btn active" title="Dual Viewer">2</button>
          <button id="viewer-mode-quad" class="viewer-btn" title="Quad Viewer">4</button>
          <div class="separator"></div>
          <button id="viewer-mode-compare" class="viewer-btn" title="A/B Compare">A/B</button>
          <button id="viewer-mode-wipe" class="viewer-btn" title="Wipe">⟷</button>
          <button id="viewer-mode-difference" class="viewer-btn" title="Difference">Δ</button>
          <div class="separator"></div>
          <button id="viewer-channel-rgb" class="viewer-btn active" title="RGB">RGB</button>
          <button id="viewer-channel-red" class="viewer-btn" title="Red Channel">R</button>
          <button id="viewer-channel-green" class="viewer-btn" title="Green Channel">G</button>
          <button id="viewer-channel-blue" class="viewer-btn" title="Blue Channel">B</button>
          <button id="viewer-channel-alpha" class="viewer-btn" title="Alpha Channel">A</button>
          <div class="separator"></div>
          <button id="viewer-grid" class="viewer-btn" title="Show Grid">⊞</button>
          <button id="viewer-guides" class="viewer-btn" title="Show Guides">╬</button>
          <button id="viewer-safe-area" class="viewer-btn" title="Show Safe Area">▭</button>
          <div class="separator"></div>
          <label style="color: #aaa; font-size: 12px;">Zoom:</label>
          <select id="viewer-zoom" style="background: #3a3a3a; color: #fff; border: 1px solid #555; padding: 2px;">
            <option value="0.25">25%</option>
            <option value="0.5">50%</option>
            <option value="1" selected>100%</option>
            <option value="2">200%</option>
            <option value="4">400%</option>
            <option value="fit">Fit</option>
          </select>
        </div>
        
        <!-- Viewer Area -->
        <div class="fusion-viewer-area" style="
          flex: 1;
          display: flex;
          position: relative;
          overflow: hidden;
        ">
          <div id="left-viewer" class="viewer-panel" style="
            flex: 1;
            position: relative;
            border-right: 1px solid #404040;
          ">
            <div class="viewer-label" style="
              position: absolute;
              top: 5px;
              left: 5px;
              color: #fff;
              font-size: 12px;
              background: rgba(0,0,0,0.5);
              padding: 2px 6px;
              border-radius: 3px;
              z-index: 10;
            ">Left View</div>
          </div>
          <div id="right-viewer" class="viewer-panel" style="
            flex: 1;
            position: relative;
          ">
            <div class="viewer-label" style="
              position: absolute;
              top: 5px;
              left: 5px;
              color: #fff;
              font-size: 12px;
              background: rgba(0,0,0,0.5);
              padding: 2px 6px;
              border-radius: 3px;
              z-index: 10;
            ">Right View</div>
          </div>
        </div>
        
        <!-- Status Bar -->
        <div class="fusion-viewer-status" style="
          height: 25px;
          background: #2a2a2a;
          display: flex;
          align-items: center;
          padding: 0 10px;
          gap: 15px;
          border-top: 1px solid #404040;
          font-size: 11px;
          color: #aaa;
        ">
          <span id="status-resolution">Resolution: --</span>
          <span id="status-pixel">Pixel: --</span>
          <span id="status-color">RGBA: --</span>
          <span id="status-zoom">Zoom: 100%</span>
        </div>
      </div>
      
      <style>
        .viewer-btn {
          background: #3a3a3a;
          color: #aaa;
          border: 1px solid #555;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 11px;
          border-radius: 3px;
        }
        .viewer-btn:hover {
          background: #4a4a4a;
          color: #fff;
        }
        .viewer-btn.active {
          background: #0078d7;
          color: #fff;
          border-color: #0078d7;
        }
        .separator {
          width: 1px;
          height: 20px;
          background: #555;
        }
        .viewer-panel {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    `;
  }
  
  private setupEventListeners(): void {
    // Mode buttons
    const btnSingle = document.getElementById('viewer-mode-single');
    const btnDual = document.getElementById('viewer-mode-dual');
    const btnQuad = document.getElementById('viewer-mode-quad');
    const btnCompare = document.getElementById('viewer-mode-compare');
    const btnWipe = document.getElementById('viewer-mode-wipe');
    const btnDifference = document.getElementById('viewer-mode-difference');
    
    btnSingle?.addEventListener('click', () => this.setMode(ViewerMode.SINGLE));
    btnDual?.addEventListener('click', () => this.setMode(ViewerMode.DUAL));
    btnQuad?.addEventListener('click', () => this.setMode(ViewerMode.QUAD));
    btnCompare?.addEventListener('click', () => this.setMode(ViewerMode.COMPARE_AB));
    btnWipe?.addEventListener('click', () => this.setMode(ViewerMode.WIPE));
    btnDifference?.addEventListener('click', () => this.setMode(ViewerMode.DIFFERENCE));
    
    // Channel buttons
    document.getElementById('viewer-channel-rgb')?.addEventListener('click', () => this.setChannel(ViewerChannel.RGB));
    document.getElementById('viewer-channel-red')?.addEventListener('click', () => this.setChannel(ViewerChannel.RED));
    document.getElementById('viewer-channel-green')?.addEventListener('click', () => this.setChannel(ViewerChannel.GREEN));
    document.getElementById('viewer-channel-blue')?.addEventListener('click', () => this.setChannel(ViewerChannel.BLUE));
    document.getElementById('viewer-channel-alpha')?.addEventListener('click', () => this.setChannel(ViewerChannel.ALPHA));
    
    // Overlay buttons
    document.getElementById('viewer-grid')?.addEventListener('click', () => this.toggleGrid());
    document.getElementById('viewer-guides')?.addEventListener('click', () => this.toggleGuides());
    document.getElementById('viewer-safe-area')?.addEventListener('click', () => this.toggleSafeArea());
    
    // Zoom control
    const zoomSelect = document.getElementById('viewer-zoom') as HTMLSelectElement;
    zoomSelect?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      if (value === 'fit') {
        this.fitToView();
      } else {
        this.setZoom(parseFloat(value));
      }
    });
    
    // Canvas mouse events for panning
    const leftViewer = document.getElementById('left-viewer');
    const rightViewer = document.getElementById('right-viewer');
    
    [leftViewer, rightViewer].forEach(viewer => {
      viewer?.addEventListener('mousedown', this.handleMouseDown.bind(this));
      viewer?.addEventListener('mousemove', this.handleMouseMove.bind(this));
      viewer?.addEventListener('mouseup', this.handleMouseUp.bind(this));
      viewer?.addEventListener('wheel', this.handleWheel.bind(this));
    });
  }
  
  public setMode(mode: ViewerMode): void {
    this.settings.mode = mode;
    this.updateLayout();
    this.render();
    
    // Update button states
    document.querySelectorAll('[id^="viewer-mode-"]').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`viewer-mode-${mode}`)?.classList.add('active');
  }
  
  public setChannel(channel: ViewerChannel): void {
    this.settings.channel = channel;
    this.render();
    
    // Update button states
    document.querySelectorAll('[id^="viewer-channel-"]').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`viewer-channel-${channel}`)?.classList.add('active');
  }
  
  public setZoom(zoom: number): void {
    this.settings.zoom = zoom;
    this.render();
    
    const statusZoom = document.getElementById('status-zoom');
    if (statusZoom) {
      statusZoom.textContent = `Zoom: ${(zoom * 100).toFixed(0)}%`;
    }
  }
  
  public fitToView(): void {
    if (!this.leftImage) return;
    
    const leftViewer = document.getElementById('left-viewer');
    if (!leftViewer) return;
    
    const viewerWidth = leftViewer.clientWidth;
    const viewerHeight = leftViewer.clientHeight;
    const imageWidth = this.leftImage.width;
    const imageHeight = this.leftImage.height;
    
    const zoomX = viewerWidth / imageWidth;
    const zoomY = viewerHeight / imageHeight;
    this.setZoom(Math.min(zoomX, zoomY));
  }
  
  private toggleGrid(): void {
    this.settings.showGrid = !this.settings.showGrid;
    this.render();
    document.getElementById('viewer-grid')?.classList.toggle('active', this.settings.showGrid);
  }
  
  private toggleGuides(): void {
    this.settings.showGuides = !this.settings.showGuides;
    this.render();
    document.getElementById('viewer-guides')?.classList.toggle('active', this.settings.showGuides);
  }
  
  private toggleSafeArea(): void {
    this.settings.showSafeArea = !this.settings.showSafeArea;
    this.render();
    document.getElementById('viewer-safe-area')?.classList.toggle('active', this.settings.showSafeArea);
  }
  
  private updateLayout(): void {
    const leftViewer = document.getElementById('left-viewer');
    const rightViewer = document.getElementById('right-viewer');
    
    if (!leftViewer || !rightViewer) return;
    
    switch (this.settings.mode) {
      case ViewerMode.SINGLE:
        leftViewer.style.flex = '1';
        rightViewer.style.display = 'none';
        break;
      case ViewerMode.DUAL:
      case ViewerMode.COMPARE_AB:
      case ViewerMode.WIPE:
      case ViewerMode.DIFFERENCE:
        leftViewer.style.flex = '1';
        leftViewer.style.display = 'block';
        rightViewer.style.flex = '1';
        rightViewer.style.display = 'block';
        break;
      case ViewerMode.QUAD:
        // Quad view not yet implemented - use dual view for now
        leftViewer.style.flex = '1';
        leftViewer.style.display = 'block';
        rightViewer.style.flex = '1';
        rightViewer.style.display = 'block';
        break;
    }
    
    // Setup wipe slider for wipe mode
    if (this.settings.mode === ViewerMode.WIPE) {
      this.createWipeSlider();
    } else {
      this.removeWipeSlider();
    }
  }
  
  private createWipeSlider(): void {
    if (this.wipeSlider) return;
    
    const viewerArea = this.container.querySelector('.fusion-viewer-area');
    if (!viewerArea) return;
    
    this.wipeSlider = document.createElement('div');
    this.wipeSlider.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 3px;
      background: #0078d7;
      cursor: ew-resize;
      z-index: 100;
    `;
    
    viewerArea.appendChild(this.wipeSlider);
    
    // Add drag functionality
    let dragging = false;
    this.wipeSlider.addEventListener('mousedown', () => dragging = true);
    document.addEventListener('mousemove', (e) => {
      if (dragging && viewerArea) {
        const rect = viewerArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        this.wipePosition = x / rect.width;
        this.wipePosition = Math.max(0, Math.min(1, this.wipePosition));
        if (this.wipeSlider) {
          this.wipeSlider.style.left = `${this.wipePosition * 100}%`;
        }
        this.render();
      }
    });
    document.addEventListener('mouseup', () => dragging = false);
  }
  
  private removeWipeSlider(): void {
    if (this.wipeSlider) {
      this.wipeSlider.remove();
      this.wipeSlider = null;
    }
  }
  
  public setLeftImage(imageData: ImageData): void {
    this.leftImage = imageData;
    this.render();
    this.updateStatus();
  }
  
  public setRightImage(imageData: ImageData): void {
    this.rightImage = imageData;
    this.render();
  }
  
  private render(): void {
    this.renderLeftViewer();
    this.renderRightViewer();
  }
  
  private renderLeftViewer(): void {
    const leftViewer = document.getElementById('left-viewer');
    if (!leftViewer || !this.leftImage) return;
    
    // Clear and setup canvas
    this.leftCanvas.width = leftViewer.clientWidth;
    this.leftCanvas.height = leftViewer.clientHeight;
    
    // Append canvas if not already in DOM
    if (!leftViewer.contains(this.leftCanvas)) {
      leftViewer.appendChild(this.leftCanvas);
    }
    
    if (!this.leftCtx) return;
    
    // Apply channel filter
    const filteredImage = this.applyChannelFilter(this.leftImage);
    
    // Draw image with zoom and pan
    const scaledWidth = filteredImage.width * this.settings.zoom;
    const scaledHeight = filteredImage.height * this.settings.zoom;
    const x = (this.leftCanvas.width - scaledWidth) / 2 + this.settings.pan.x;
    const y = (this.leftCanvas.height - scaledHeight) / 2 + this.settings.pan.y;
    
    this.leftCtx.clearRect(0, 0, this.leftCanvas.width, this.leftCanvas.height);
    
    // Create temporary canvas for filtered image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = filteredImage.width;
    tempCanvas.height = filteredImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(filteredImage, 0, 0);
      this.leftCtx.drawImage(tempCanvas, x, y, scaledWidth, scaledHeight);
    }
    
    // Draw overlays
    this.drawOverlays(this.leftCtx, this.leftCanvas);
  }
  
  private renderRightViewer(): void {
    const rightViewer = document.getElementById('right-viewer');
    if (!rightViewer || !this.rightImage) return;
    
    this.rightCanvas.width = rightViewer.clientWidth;
    this.rightCanvas.height = rightViewer.clientHeight;
    
    if (!rightViewer.contains(this.rightCanvas)) {
      rightViewer.appendChild(this.rightCanvas);
    }
    
    if (!this.rightCtx) return;
    
    const filteredImage = this.applyChannelFilter(this.rightImage);
    
    const scaledWidth = filteredImage.width * this.settings.zoom;
    const scaledHeight = filteredImage.height * this.settings.zoom;
    const x = (this.rightCanvas.width - scaledWidth) / 2 + this.settings.pan.x;
    const y = (this.rightCanvas.height - scaledHeight) / 2 + this.settings.pan.y;
    
    this.rightCtx.clearRect(0, 0, this.rightCanvas.width, this.rightCanvas.height);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = filteredImage.width;
    tempCanvas.height = filteredImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(filteredImage, 0, 0);
      this.rightCtx.drawImage(tempCanvas, x, y, scaledWidth, scaledHeight);
    }
    
    this.drawOverlays(this.rightCtx, this.rightCanvas);
  }
  
  private applyChannelFilter(imageData: ImageData): ImageData {
    const filtered = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const filteredData = filtered.data;
    
    for (let i = 0; i < data.length; i += 4) {
      switch (this.settings.channel) {
        case ViewerChannel.RGB:
          filteredData[i] = data[i];
          filteredData[i + 1] = data[i + 1];
          filteredData[i + 2] = data[i + 2];
          filteredData[i + 3] = data[i + 3];
          break;
        case ViewerChannel.RED:
          filteredData[i] = data[i];
          filteredData[i + 1] = data[i];
          filteredData[i + 2] = data[i];
          filteredData[i + 3] = 255;
          break;
        case ViewerChannel.GREEN:
          filteredData[i] = data[i + 1];
          filteredData[i + 1] = data[i + 1];
          filteredData[i + 2] = data[i + 1];
          filteredData[i + 3] = 255;
          break;
        case ViewerChannel.BLUE:
          filteredData[i] = data[i + 2];
          filteredData[i + 1] = data[i + 2];
          filteredData[i + 2] = data[i + 2];
          filteredData[i + 3] = 255;
          break;
        case ViewerChannel.ALPHA:
          filteredData[i] = data[i + 3];
          filteredData[i + 1] = data[i + 3];
          filteredData[i + 2] = data[i + 3];
          filteredData[i + 3] = 255;
          break;
        case ViewerChannel.LUMINANCE:
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          filteredData[i] = lum;
          filteredData[i + 1] = lum;
          filteredData[i + 2] = lum;
          filteredData[i + 3] = 255;
          break;
      }
    }
    
    return filtered;
  }
  
  private drawOverlays(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (this.settings.showGrid) {
      this.drawGrid(ctx, canvas);
    }
    
    if (this.settings.showGuides) {
      this.drawGuides(ctx, canvas);
    }
    
    if (this.settings.showSafeArea) {
      this.drawSafeArea(ctx, canvas);
    }
  }
  
  private drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    const gridSize = 50 * this.settings.zoom;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
  
  private drawGuides(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 1;
    
    // Center crosshair
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, canvas.height);
    ctx.moveTo(0, cy);
    ctx.lineTo(canvas.width, cy);
    ctx.stroke();
    
    // Rule of thirds
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 3, 0);
    ctx.lineTo(canvas.width / 3, canvas.height);
    ctx.moveTo(canvas.width * 2 / 3, 0);
    ctx.lineTo(canvas.width * 2 / 3, canvas.height);
    ctx.moveTo(0, canvas.height / 3);
    ctx.lineTo(canvas.width, canvas.height / 3);
    ctx.moveTo(0, canvas.height * 2 / 3);
    ctx.lineTo(canvas.width, canvas.height * 2 / 3);
    ctx.stroke();
  }
  
  private drawSafeArea(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    
    const marginX = canvas.width * 0.05;
    const marginY = canvas.height * 0.05;
    
    ctx.strokeRect(marginX, marginY, canvas.width - marginX * 2, canvas.height - marginY * 2);
  }
  
  private updateStatus(): void {
    if (!this.leftImage) return;
    
    const statusResolution = document.getElementById('status-resolution');
    if (statusResolution) {
      statusResolution.textContent = `Resolution: ${this.leftImage.width}x${this.leftImage.height}`;
    }
  }
  
  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }
  
  private handleMouseMove(e: MouseEvent): void {
    if (this.isDragging) {
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      
      this.settings.pan.x += dx;
      this.settings.pan.y += dy;
      
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.render();
    }
    
    // Update pixel info
    this.updatePixelInfo(e);
  }
  
  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 1 || e.button === 0) {
      this.isDragging = false;
    }
  }
  
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.setZoom(this.settings.zoom * delta);
  }
  
  private updatePixelInfo(e: MouseEvent): void {
    // Pixel color readout at mouse position
    if (!this.leftImage) return;
    
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.settings.zoom);
    const y = Math.floor((e.clientY - rect.top) / this.settings.zoom);
    
    // Check if coordinates are within image bounds
    if (x >= 0 && x < this.leftImage.width && y >= 0 && y < this.leftImage.height) {
      const index = (y * this.leftImage.width + x) * 4;
      const r = this.leftImage.data[index];
      const g = this.leftImage.data[index + 1];
      const b = this.leftImage.data[index + 2];
      const a = this.leftImage.data[index + 3];
      
      const statusPixel = document.getElementById('status-pixel');
      const statusColor = document.getElementById('status-color');
      
      if (statusPixel) {
        statusPixel.textContent = `Pixel: ${x}, ${y}`;
      }
      
      if (statusColor) {
        statusColor.textContent = `RGBA: ${r}, ${g}, ${b}, ${a}`;
      }
    }
  }
  
  public dispose(): void {
    this.leftImage = null;
    this.rightImage = null;
    this.leftCtx = null;
    this.rightCtx = null;
  }
}
