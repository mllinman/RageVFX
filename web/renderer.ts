/**
 * Web Renderer for RageVFX
 * Modern browser-based node graph visualization and interaction
 */

import { initializeApp, RageVFXApp } from './app';

// Polyfill for roundRect if not available
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radii?: number | number[]
  ): CanvasRenderingContext2D {
    let r: number[];
    if (typeof radii === 'undefined') {
      r = [0, 0, 0, 0];
    } else if (typeof radii === 'number') {
      r = [radii, radii, radii, radii];
    } else if (Array.isArray(radii)) {
      if (radii.length === 1) {
        r = [radii[0], radii[0], radii[0], radii[0]];
      } else if (radii.length === 2) {
        r = [radii[0], radii[1], radii[0], radii[1]];
      } else if (radii.length === 3) {
        r = [radii[0], radii[1], radii[2], radii[1]];
      } else {
        r = [radii[0], radii[1], radii[2], radii[3]];
      }
    } else {
      r = [0, 0, 0, 0];
    }
    
    // Clamp radii to half of the smallest dimension
    const maxRadius = Math.min(width / 2, height / 2);
    r = r.map(radius => Math.min(radius, maxRadius));
    
    this.moveTo(x + r[0], y);
    this.lineTo(x + width - r[1], y);
    this.arcTo(x + width, y, x + width, y + r[1], r[1]);
    this.lineTo(x + width, y + height - r[2]);
    this.arcTo(x + width, y + height, x + width - r[2], y + height, r[2]);
    this.lineTo(x + r[3], y + height);
    this.arcTo(x, y + height, x, y + height - r[3], r[3]);
    this.lineTo(x, y + r[0]);
    this.arcTo(x, y, x + r[0], y, r[0]);
    this.closePath();
    
    return this;
  };
}

// Define node categories that should have glow effects
const VFX_NODE_TYPES = new Set([
  'Fire', 'Water', 'Rain', 'Snow', 'Smoke', 'Clouds', 'Explosion', 'Tornado',
  'Fog', 'Lightning', 'Spark', 'Dissolve', 'LensFlare', 'Glow', 'VolumetricFog',
  'VolumetricLight', 'VolumeRender', 'CloudVolume', 'ParticleSystem', 'ParticleEmitter'
]);

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  'VFX': { primary: '#ff4444', secondary: '#ff8866', glow: 'rgba(255, 68, 68, 0.6)' },
  'Filter': { primary: '#4488ff', secondary: '#66aaff', glow: 'rgba(68, 136, 255, 0.4)' },
  'Color': { primary: '#44cc88', secondary: '#66ddaa', glow: 'rgba(68, 204, 136, 0.4)' },
  'Composite': { primary: '#aa44ff', secondary: '#cc66ff', glow: 'rgba(170, 68, 255, 0.4)' },
  '3D': { primary: '#ff8844', secondary: '#ffaa66', glow: 'rgba(255, 136, 68, 0.4)' },
  'ML': { primary: '#44dddd', secondary: '#66ffff', glow: 'rgba(68, 221, 221, 0.4)' },
  'Physics': { primary: '#dd4488', secondary: '#ff66aa', glow: 'rgba(221, 68, 136, 0.4)' },
  'Default': { primary: '#ff6b35', secondary: '#f7931e', glow: 'rgba(255, 107, 53, 0.3)' }
};

interface NodeSocket {
  id: string;
  name: string;
  x: number;
  y: number;
  connected: boolean;
  dataType: string;
  customPosition?: boolean;
}

interface UINode {
  id: string;
  type: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: NodeSocket[];
  outputs: NodeSocket[];
  selected: boolean;
  disabled: boolean;
  collapsed: boolean;
  color?: { primary: string; secondary: string; glow: string };
}

interface UIConnection {
  id: string;
  fromNodeId: string;
  fromOutputIndex: number;
  toNodeId: string;
  toInputIndex: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  style: 'bezier' | 'linear' | 'step';
  animated: boolean;
  selected: boolean;
  controlPoints?: { x: number; y: number }[];
}

class NodeGraphUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: UINode[] = [];
  private connections: UIConnection[] = [];
  private selectedNodes: Set<string> = new Set();
  private selectedConnections: Set<string> = new Set();
  private offset = { x: 0, y: 0 };
  private scale = 1.0;
  private isDragging = false;
  private isPanning = false;
  private isResizingNode = false;
  private isDraggingSocket = false;
  private isDraggingConnection = false;
  private dragOffset = { x: 0, y: 0 };
  private panStart = { x: 0, y: 0 };
  private nodeIdCounter = 1;
  private connectionIdCounter = 1;
  private gridSnap = true;
  private gridSize = 20;
  private showMinimap = false;
  private connecting = false;
  private connectingFrom: { nodeId: string; outputIndex: number; x: number; y: number } | null = null;
  private mousePos = { x: 0, y: 0 };
  private lastFrameTime = performance.now();
  private fps = 0;
  private animationId: number | null = null;
  private app: RageVFXApp;
  private glowAnimation = 0;
  private hoveredNode: UINode | null = null;
  private hoveredSocket: { node: UINode; type: 'input' | 'output'; index: number } | null = null;
  private hoveredConnection: UIConnection | null = null;
  private draggedSocket: { node: UINode; type: 'input' | 'output'; index: number } | null = null;
  private connectionStyle: 'bezier' | 'linear' | 'step' = 'bezier';
  private showNodeShadows = true;
  private showConnectionFlow = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    this.app = initializeApp();
    this.resize();
    this.setupEventListeners();
    this.startRenderLoop();
  }

  private startRenderLoop(): void {
    const animate = () => {
      const now = performance.now();
      this.fps = Math.round(1000 / (now - this.lastFrameTime));
      this.lastFrameTime = now;
      
      // Animate glow effect
      this.glowAnimation = (this.glowAnimation + 0.02) % (Math.PI * 2);
      
      this.render();
      this.updatePerformanceIndicator();
      
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  private updatePerformanceIndicator(): void {
    const indicator = document.getElementById('performance-indicator');
    if (indicator) {
      indicator.textContent = `FPS: ${this.fps}`;
    }
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.offsetWidth;
      this.canvas.height = container.offsetHeight;
    }
    this.render();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    
    // Keyboard events
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    
    // Drag and drop for node creation
    document.querySelectorAll('.node-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        const target = e.target as HTMLElement;
        (e as DragEvent).dataTransfer?.setData('nodeType', target.dataset.nodeType || '');
      });
    });
    
    this.canvas.addEventListener('dragover', (e) => e.preventDefault());
    this.canvas.addEventListener('drop', (e) => this.onDrop(e));
    
    // Node search
    const searchBox = document.getElementById('node-search') as HTMLInputElement;
    if (searchBox) {
      searchBox.addEventListener('input', () => this.filterNodes(searchBox.value));
    }
    
    // Category collapse
    document.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', () => this.toggleCategory(header as HTMLElement));
    });
    
    // Toolbar buttons
    this.setupToolbarButtons();
    
    // Menu dropdowns
    this.setupMenuDropdowns();
  }

  private setupToolbarButtons(): void {
    document.getElementById('execute-btn')?.addEventListener('click', () => this.executeGraph());
    document.getElementById('clear-btn')?.addEventListener('click', () => this.clearGraph());
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.zoomIn());
    document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.zoomOut());
    document.getElementById('fit-btn')?.addEventListener('click', () => this.fitToWindow());
    document.getElementById('snap-btn')?.addEventListener('click', () => this.toggleSnap());
    document.getElementById('minimap-btn')?.addEventListener('click', () => this.toggleMinimap());
  }

  private setupMenuDropdowns(): void {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      const btn = dropdown.querySelector('.menu-btn');
      const content = dropdown.querySelector('.dropdown-content');
      
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown-content').forEach(d => {
          if (d !== content) d.classList.remove('show');
        });
        content?.classList.toggle('show');
      });
    });
    
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
    });
    
    // Menu actions
    document.getElementById('new-project')?.addEventListener('click', () => this.newProject());
    document.getElementById('save-project')?.addEventListener('click', () => this.saveProject());
    document.getElementById('open-project')?.addEventListener('click', () => this.openProject());
    document.getElementById('about')?.addEventListener('click', () => this.showAbout());
    document.getElementById('keyboard-shortcuts')?.addEventListener('click', () => this.showShortcuts());
  }

  private filterNodes(search: string): void {
    const query = search.toLowerCase();
    document.querySelectorAll('.node-item').forEach(item => {
      const text = item.textContent?.toLowerCase() || '';
      const nodeItem = item as HTMLElement;
      if (text.includes(query) || query === '') {
        nodeItem.style.display = 'block';
      } else {
        nodeItem.style.display = 'none';
      }
    });
  }

  private toggleCategory(header: HTMLElement): void {
    const content = header.nextElementSibling as HTMLElement;
    const icon = header.querySelector('.collapse-icon');
    const collapsed = header.dataset.collapsed === 'true';
    
    if (collapsed) {
      content.style.display = 'block';
      header.dataset.collapsed = 'false';
      if (icon) icon.textContent = '▼';
    } else {
      content.style.display = 'none';
      header.dataset.collapsed = 'true';
      if (icon) icon.textContent = '▶';
    }
  }

  private onDrop(e: DragEvent): void {
    e.preventDefault();
    const nodeType = e.dataTransfer?.getData('nodeType');
    if (nodeType) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.offset.x) / this.scale;
      const y = (e.clientY - rect.top - this.offset.y) / this.scale;
      this.createNode(nodeType, x, y);
    }
  }

  createNode(type: string, x: number, y: number): void {
    const nodeId = `node_${type}_${this.nodeIdCounter++}`;
    
    // Snap to grid
    if (this.gridSnap) {
      x = Math.round(x / this.gridSize) * this.gridSize;
      y = Math.round(y / this.gridSize) * this.gridSize;
    }
    
    // Determine category and colors
    const category = this.getNodeCategory(type);
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Default'];
    
    // Create dynamic sockets based on node type
    const sockets = this.getNodeSockets(type);
    
    const node: UINode = {
      id: nodeId,
      type,
      category,
      x,
      y,
      width: 200,
      height: Math.max(120, 50 + Math.max(sockets.inputs.length, sockets.outputs.length) * 25),
      inputs: sockets.inputs,
      outputs: sockets.outputs,
      selected: false,
      disabled: false,
      collapsed: false,
      color: colors
    };
    
    this.nodes.push(node);
    this.app.createNode(type, nodeId);
    this.updateStatusCounts();
    this.showToast(`Created ${type} node`, 'success');
    this.render();
  }

  private getNodeCategory(type: string): string {
    if (VFX_NODE_TYPES.has(type)) return 'VFX';
    if (['Blur', 'Sharpen', 'EdgeDetect', 'MotionBlur', 'DepthOfField', 'ChromaticAberration', 'Vignette', 'FilmGrain', 'Glow'].includes(type)) return 'Filter';
    if (['ColorCorrect', 'Grade', 'Curves', 'Levels', 'HSL', 'OCIOColorSpace', 'OCIOLook'].includes(type)) return 'Color';
    if (['Merge', 'Screen', 'Overlay', 'ChromaKey', 'LuminanceKey', 'Difference', 'Rotoscope', 'SpillSuppression', 'EdgeMatte'].includes(type)) return 'Composite';
    if (['Scene', 'Renderer3D', 'Geometry3D', 'Mesh', 'Material', 'Camera', 'Light', 'EnvironmentMap', 'ShadowMap'].includes(type)) return '3D';
    if (['StyleTransfer', 'Upscale', 'Denoise', 'ObjectDetection', 'Inpaint', 'DepthEstimation'].includes(type)) return 'ML';
    if (['RigidBody', 'SoftBody', 'FluidSim', 'ClothSim', 'Collision'].includes(type)) return 'Physics';
    return 'Default';
  }

  private getNodeSockets(type: string): { inputs: NodeSocket[]; outputs: NodeSocket[] } {
    // Define sockets based on node type - these can be dynamically modified
    const defaultInputs: NodeSocket[] = [{ id: 'input_0', name: 'Input', x: 0, y: 50, connected: false, dataType: 'image' }];
    const defaultOutputs: NodeSocket[] = [{ id: 'output_0', name: 'Output', x: 200, y: 50, connected: false, dataType: 'image' }];
    
    // Special socket configurations for different node types
    const socketConfigs: Record<string, { inputs: NodeSocket[]; outputs: NodeSocket[] }> = {
      'Merge': {
        inputs: [
          { id: 'input_0', name: 'A', x: 0, y: 50, connected: false, dataType: 'image' },
          { id: 'input_1', name: 'B', x: 0, y: 75, connected: false, dataType: 'image' },
          { id: 'input_2', name: 'Mask', x: 0, y: 100, connected: false, dataType: 'image' }
        ],
        outputs: defaultOutputs
      },
      'ColorCorrect': {
        inputs: [
          { id: 'input_0', name: 'Image', x: 0, y: 50, connected: false, dataType: 'image' },
          { id: 'input_1', name: 'Mask', x: 0, y: 75, connected: false, dataType: 'image' }
        ],
        outputs: defaultOutputs
      },
      'Scene': {
        inputs: [
          { id: 'input_0', name: 'Objects', x: 0, y: 50, connected: false, dataType: 'geometry' },
          { id: 'input_1', name: 'Camera', x: 0, y: 75, connected: false, dataType: 'camera' },
          { id: 'input_2', name: 'Lights', x: 0, y: 100, connected: false, dataType: 'light' }
        ],
        outputs: [{ id: 'output_0', name: 'Scene', x: 200, y: 50, connected: false, dataType: 'scene' }]
      },
      'Math': {
        inputs: [
          { id: 'input_0', name: 'A', x: 0, y: 50, connected: false, dataType: 'number' },
          { id: 'input_1', name: 'B', x: 0, y: 75, connected: false, dataType: 'number' }
        ],
        outputs: [{ id: 'output_0', name: 'Result', x: 200, y: 50, connected: false, dataType: 'number' }]
      },
      'Switch': {
        inputs: [
          { id: 'input_0', name: 'A', x: 0, y: 50, connected: false, dataType: 'any' },
          { id: 'input_1', name: 'B', x: 0, y: 75, connected: false, dataType: 'any' },
          { id: 'input_2', name: 'Switch', x: 0, y: 100, connected: false, dataType: 'number' }
        ],
        outputs: defaultOutputs
      },
      'ParticleSystem': {
        inputs: [
          { id: 'input_0', name: 'Emitter', x: 0, y: 50, connected: false, dataType: 'emitter' },
          { id: 'input_1', name: 'Forces', x: 0, y: 75, connected: false, dataType: 'force' }
        ],
        outputs: [
          { id: 'output_0', name: 'Particles', x: 200, y: 50, connected: false, dataType: 'particles' },
          { id: 'output_1', name: 'Image', x: 200, y: 75, connected: false, dataType: 'image' }
        ]
      }
    };
    
    return socketConfigs[type] || { inputs: defaultInputs, outputs: defaultOutputs };
  }

  addSocketToNode(nodeId: string, type: 'input' | 'output', name: string, dataType: string): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const sockets = type === 'input' ? node.inputs : node.outputs;
    const newSocket: NodeSocket = {
      id: `${type}_${sockets.length}`,
      name,
      x: type === 'input' ? 0 : node.width,
      y: 50 + sockets.length * 25,
      connected: false,
      dataType
    };
    
    sockets.push(newSocket);
    node.height = Math.max(120, 50 + Math.max(node.inputs.length, node.outputs.length) * 25);
    this.render();
    this.showToast(`Added ${type} socket: ${name}`, 'info');
  }

  removeSocketFromNode(nodeId: string, type: 'input' | 'output', index: number): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const sockets = type === 'input' ? node.inputs : node.outputs;
    if (index >= 0 && index < sockets.length) {
      // Remove any connections to this socket
      this.connections = this.connections.filter(conn => {
        if (type === 'input' && conn.toNodeId === nodeId && conn.toInputIndex === index) return false;
        if (type === 'output' && conn.fromNodeId === nodeId && conn.fromOutputIndex === index) return false;
        return true;
      });
      
      sockets.splice(index, 1);
      
      // Recalculate positions
      sockets.forEach((s, i) => {
        s.y = 50 + i * 25;
      });
      
      node.height = Math.max(120, 50 + Math.max(node.inputs.length, node.outputs.length) * 25);
      this.updateConnectionPositions();
      this.render();
      this.showToast(`Removed ${type} socket`, 'info');
    }
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offset.x) / this.scale;
    const y = (e.clientY - rect.top - this.offset.y) / this.scale;
    
    // Check for socket click (start connection)
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      
      // Check output sockets
      for (let j = 0; j < node.outputs.length; j++) {
        const output = node.outputs[j];
        const socketX = node.x + output.x;
        const socketY = node.y + output.y;
        
        if (Math.hypot(x - socketX, y - socketY) < 10) {
          this.connecting = true;
          this.connectingFrom = {
            nodeId: node.id,
            outputIndex: j,
            x: socketX,
            y: socketY
          };
          return;
        }
      }
    }
    
    // Check for node click
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        
        if (!e.shiftKey) {
          this.nodes.forEach(n => n.selected = false);
          this.selectedNodes.clear();
        }
        
        node.selected = true;
        this.selectedNodes.add(node.id);
        this.isDragging = true;
        this.dragOffset = { x: x - node.x, y: y - node.y };
        
        // Move to front
        this.nodes.splice(i, 1);
        this.nodes.push(node);
        
        this.updatePropertiesPanel(node);
        this.render();
        return;
      }
    }
    
    // Pan canvas
    if (e.button === 0 || e.button === 1) {
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.offset.x, y: e.clientY - this.offset.y };
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = {
      x: (e.clientX - rect.left - this.offset.x) / this.scale,
      y: (e.clientY - rect.top - this.offset.y) / this.scale
    };
    
    if (this.connecting) {
      this.render();
      return;
    }
    
    if (this.isDragging && this.selectedNodes.size > 0) {
      let newX = this.mousePos.x - this.dragOffset.x;
      let newY = this.mousePos.y - this.dragOffset.y;
      
      if (this.gridSnap) {
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
      }
      
      const primaryNode = this.nodes.find(n => n.selected);
      if (primaryNode) {
        const dx = newX - primaryNode.x;
        const dy = newY - primaryNode.y;
        
        this.nodes.filter(n => n.selected).forEach(n => {
          n.x += dx;
          n.y += dy;
        });
        
        this.updateConnectionPositions();
      }
      
      this.render();
      return;
    }
    
    if (this.isPanning) {
      this.offset.x = e.clientX - this.panStart.x;
      this.offset.y = e.clientY - this.panStart.y;
      this.render();
      return;
    }
    
    // Update hover states
    this.updateHoverStates(this.mousePos.x, this.mousePos.y);
  }

  private updateHoverStates(x: number, y: number): void {
    // Check for hovered node
    this.hoveredNode = null;
    this.hoveredSocket = null;
    this.hoveredConnection = null;
    
    // Check sockets first (higher priority)
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      
      // Check output sockets
      for (let j = 0; j < node.outputs.length; j++) {
        const output = node.outputs[j];
        const socketX = node.x + output.x;
        const socketY = node.y + output.y;
        
        if (Math.hypot(x - socketX, y - socketY) < 12) {
          this.hoveredSocket = { node, type: 'output', index: j };
          this.canvas.style.cursor = 'crosshair';
          return;
        }
      }
      
      // Check input sockets
      for (let j = 0; j < node.inputs.length; j++) {
        const input = node.inputs[j];
        const socketX = node.x + input.x;
        const socketY = node.y + input.y;
        
        if (Math.hypot(x - socketX, y - socketY) < 12) {
          this.hoveredSocket = { node, type: 'input', index: j };
          this.canvas.style.cursor = 'crosshair';
          return;
        }
      }
    }
    
    // Check for hovered nodes
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        this.hoveredNode = node;
        
        // Check if hovering over resize handle
        const handleSize = 10;
        if (x >= node.x + node.width - handleSize && 
            y >= node.y + node.height - handleSize &&
            node.selected) {
          this.canvas.style.cursor = 'nwse-resize';
        } else {
          this.canvas.style.cursor = 'move';
        }
        return;
      }
    }
    
    // Check for hovered connections
    for (const conn of this.connections) {
      if (this.isPointNearConnection(x, y, conn)) {
        this.hoveredConnection = conn;
        this.canvas.style.cursor = 'pointer';
        return;
      }
    }
    
    this.canvas.style.cursor = 'grab';
  }

  private isPointNearConnection(x: number, y: number, conn: UIConnection): boolean {
    // Simple distance check to bezier curve
    const { fromX, fromY, toX, toY } = conn;
    const controlDist = Math.min(150, Math.abs(toX - fromX) * 0.5);
    
    // Sample points along the bezier curve
    for (let t = 0; t <= 1; t += 0.05) {
      const oneMinusT = 1 - t;
      const p0 = { x: fromX, y: fromY };
      const p1 = { x: fromX + controlDist, y: fromY };
      const p2 = { x: toX - controlDist, y: toY };
      const p3 = { x: toX, y: toY };
      
      const bx = Math.pow(oneMinusT, 3) * p0.x + 3 * Math.pow(oneMinusT, 2) * t * p1.x + 
                 3 * oneMinusT * t * t * p2.x + Math.pow(t, 3) * p3.x;
      const by = Math.pow(oneMinusT, 3) * p0.y + 3 * Math.pow(oneMinusT, 2) * t * p1.y + 
                 3 * oneMinusT * t * t * p2.y + Math.pow(t, 3) * p3.y;
      
      if (Math.hypot(x - bx, y - by) < 8) {
        return true;
      }
    }
    return false;
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.connecting && this.connectingFrom) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.offset.x) / this.scale;
      const y = (e.clientY - rect.top - this.offset.y) / this.scale;
      
      // Check for input socket
      for (const node of this.nodes) {
        if (node.id === this.connectingFrom.nodeId) continue;
        
        for (let j = 0; j < node.inputs.length; j++) {
          const input = node.inputs[j];
          const socketX = node.x + input.x;
          const socketY = node.y + input.y;
          
          if (Math.hypot(x - socketX, y - socketY) < 15) {
            this.createConnection(
              this.connectingFrom.nodeId,
              this.connectingFrom.outputIndex,
              node.id,
              j
            );
            break;
          }
        }
      }
    }
    
    this.isDragging = false;
    this.isPanning = false;
    this.connecting = false;
    this.connectingFrom = null;
  }

  private createConnection(fromNodeId: string, fromOutput: number, toNodeId: string, toInput: number): void {
    const fromNode = this.nodes.find(n => n.id === fromNodeId);
    const toNode = this.nodes.find(n => n.id === toNodeId);
    
    if (!fromNode || !toNode) return;
    
    // Determine connection color based on data type
    const dataType = fromNode.outputs[fromOutput]?.dataType || 'image';
    const connectionColors: Record<string, string> = {
      'image': '#4a9eff',
      'number': '#ffcc00',
      'geometry': '#ff8844',
      'particles': '#ff44aa',
      'scene': '#44ff88',
      'camera': '#aa88ff',
      'light': '#ffff44',
      'any': '#888888'
    };
    
    const conn: UIConnection = {
      id: `conn_${this.connectionIdCounter++}`,
      fromNodeId,
      fromOutputIndex: fromOutput,
      toNodeId,
      toInputIndex: toInput,
      fromX: fromNode.x + fromNode.outputs[fromOutput].x,
      fromY: fromNode.y + fromNode.outputs[fromOutput].y,
      toX: toNode.x + toNode.inputs[toInput].x,
      toY: toNode.y + toNode.inputs[toInput].y,
      color: connectionColors[dataType] || '#4a9eff',
      style: this.connectionStyle,
      animated: true,
      selected: false
    };
    
    this.connections.push(conn);
    fromNode.outputs[fromOutput].connected = true;
    toNode.inputs[toInput].connected = true;
    
    // Connect in the app
    this.app.connectNodes(fromNodeId, 'image', toNodeId, 'image');
    
    this.updateStatusCounts();
    this.showToast('Connection created', 'success');
  }

  private updateConnectionPositions(): void {
    this.connections.forEach(conn => {
      const fromNode = this.nodes.find(n => n.id === conn.fromNodeId);
      const toNode = this.nodes.find(n => n.id === conn.toNodeId);
      
      if (fromNode && toNode) {
        conn.fromX = fromNode.x + fromNode.outputs[conn.fromOutputIndex].x;
        conn.fromY = fromNode.y + fromNode.outputs[conn.fromOutputIndex].y;
        conn.toX = toNode.x + toNode.inputs[conn.toInputIndex].x;
        conn.toY = toNode.y + toNode.inputs[conn.toInputIndex].y;
      }
    });
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoom = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, this.scale * zoom));
    
    // Zoom toward mouse position
    const scaleChange = newScale / this.scale;
    this.offset.x = mouseX - (mouseX - this.offset.x) * scaleChange;
    this.offset.y = mouseY - (mouseY - this.offset.y) * scaleChange;
    this.scale = newScale;
    
    this.updateZoomIndicator();
    this.render();
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offset.x) / this.scale;
    const y = (e.clientY - rect.top - this.offset.y) / this.scale;
    
    // Check if clicking on a node
    const clickedNode = this.nodes.find(node => 
      x >= node.x && x <= node.x + node.width &&
      y >= node.y && y <= node.y + node.height
    );
    
    if (clickedNode) {
      if (!clickedNode.selected) {
        this.nodes.forEach(n => n.selected = false);
        this.selectedNodes.clear();
        clickedNode.selected = true;
        this.selectedNodes.add(clickedNode.id);
      }
      
      this.showContextMenu(e.clientX, e.clientY);
    }
  }

  private showContextMenu(x: number, y: number): void {
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      menu.classList.remove('hidden');
      
      // Setup menu actions
      menu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const action = (e.target as HTMLElement).dataset.action;
          this.handleContextAction(action || '');
          menu.classList.add('hidden');
        });
      });
      
      // Hide on click outside
      setTimeout(() => {
        document.addEventListener('click', () => menu.classList.add('hidden'), { once: true });
      }, 0);
    }
  }

  private handleContextAction(action: string): void {
    switch (action) {
      case 'duplicate':
        this.duplicateSelected();
        break;
      case 'delete':
        this.deleteSelected();
        break;
      case 'disconnect':
        this.disconnectSelected();
        break;
      case 'disable':
        this.toggleDisableSelected();
        break;
    }
  }

  private onDoubleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offset.x) / this.scale;
    const y = (e.clientY - rect.top - this.offset.y) / this.scale;
    
    // Check if double-clicking on a node
    const clickedNode = this.nodes.find(node => 
      x >= node.x && x <= node.x + node.width &&
      y >= node.y && y <= node.y + node.height
    );
    
    if (clickedNode) {
      this.showNodeEditor(clickedNode);
    }
  }

  private showNodeEditor(node: UINode): void {
    this.showToast(`Double-clicked ${node.type} node`, 'info');
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement) return;
    
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        this.deleteSelected();
        break;
      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.duplicateSelected();
        }
        break;
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.selectAll();
        }
        break;
      case 'f':
        if (!e.ctrlKey && !e.metaKey) {
          this.fitToWindow();
        }
        break;
      case 'Enter':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.executeGraph();
        }
        break;
      case 'Escape':
        this.deselectAll();
        break;
      case '+':
      case '=':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.zoomIn();
        }
        break;
      case '-':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.zoomOut();
        }
        break;
      case '0':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.resetZoom();
        }
        break;
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.save();
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply transform
    ctx.translate(this.offset.x, this.offset.y);
    ctx.scale(this.scale, this.scale);
    
    // Draw grid
    this.drawGrid();
    
    // Draw connections
    this.drawConnections();
    
    // Draw nodes
    this.nodes.forEach(node => this.drawNode(node));
    
    // Draw connecting line
    if (this.connecting && this.connectingFrom) {
      this.drawConnectionLine(
        this.connectingFrom.x,
        this.connectingFrom.y,
        this.mousePos.x,
        this.mousePos.y,
        true
      );
    }
    
    ctx.restore();
    
    // Update minimap if visible
    if (this.showMinimap) {
      this.renderMinimap();
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const gridSize = this.gridSize;
    
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1 / this.scale;
    
    const startX = Math.floor(-this.offset.x / this.scale / gridSize) * gridSize;
    const startY = Math.floor(-this.offset.y / this.scale / gridSize) * gridSize;
    const endX = startX + this.canvas.width / this.scale + gridSize;
    const endY = startY + this.canvas.height / this.scale + gridSize;
    
    ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
    
    // Major grid lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5 / this.scale;
    ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize * 5) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += gridSize * 5) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  private drawConnections(): void {
    // Draw connections with their individual colors and styles
    this.connections.forEach(conn => {
      const isSelected = this.selectedConnections.has(conn.id);
      const isHovered = this.hoveredConnection?.id === conn.id;
      this.drawConnectionCurve(conn, isSelected, isHovered);
    });
  }

  private drawConnectionCurve(conn: UIConnection, isSelected: boolean, isHovered: boolean): void {
    const ctx = this.ctx;
    const { fromX, fromY, toX, toY, color, style, animated } = conn;
    
    // Draw glow for selected/hovered connections
    if (isSelected || isHovered) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
    }
    
    ctx.strokeStyle = isHovered ? '#ffffff' : (isSelected ? '#ffcc00' : color);
    ctx.lineWidth = (isSelected ? 3 : 2) / this.scale;
    
    ctx.beginPath();
    
    if (style === 'bezier') {
      const controlDist = Math.min(150, Math.abs(toX - fromX) * 0.5);
      ctx.moveTo(fromX, fromY);
      ctx.bezierCurveTo(
        fromX + controlDist, fromY,
        toX - controlDist, toY,
        toX, toY
      );
    } else if (style === 'step') {
      const midX = (fromX + toX) / 2;
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(midX, fromY);
      ctx.lineTo(midX, toY);
      ctx.lineTo(toX, toY);
    } else {
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw animated flow dots for active connections
    if (animated && this.showConnectionFlow) {
      this.drawConnectionFlow(fromX, fromY, toX, toY, color, style);
    }
    
    // Draw arrow at end
    const angle = Math.atan2(toY - (fromY + (toY - fromY) * 0.9), toX - (fromX + (toX - fromX) * 0.9));
    const arrowSize = 8 / this.scale;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - arrowSize * Math.cos(angle - 0.4), toY - arrowSize * Math.sin(angle - 0.4));
    ctx.lineTo(toX - arrowSize * Math.cos(angle + 0.4), toY - arrowSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  private drawConnectionFlow(fromX: number, fromY: number, toX: number, toY: number, color: string, style: string): void {
    const ctx = this.ctx;
    const numDots = 3;
    const animPhase = (performance.now() / 1000) % 1;
    
    ctx.fillStyle = color;
    
    for (let i = 0; i < numDots; i++) {
      const t = ((animPhase + i / numDots) % 1);
      let dotX: number, dotY: number;
      
      if (style === 'bezier') {
        const controlDist = Math.min(150, Math.abs(toX - fromX) * 0.5);
        // Bezier curve interpolation
        const p0 = { x: fromX, y: fromY };
        const p1 = { x: fromX + controlDist, y: fromY };
        const p2 = { x: toX - controlDist, y: toY };
        const p3 = { x: toX, y: toY };
        
        const oneMinusT = 1 - t;
        dotX = Math.pow(oneMinusT, 3) * p0.x + 3 * Math.pow(oneMinusT, 2) * t * p1.x + 3 * oneMinusT * t * t * p2.x + Math.pow(t, 3) * p3.x;
        dotY = Math.pow(oneMinusT, 3) * p0.y + 3 * Math.pow(oneMinusT, 2) * t * p1.y + 3 * oneMinusT * t * t * p2.y + Math.pow(t, 3) * p3.y;
      } else {
        dotX = fromX + (toX - fromX) * t;
        dotY = fromY + (toY - fromY) * t;
      }
      
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3 / this.scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawConnectionLine(x1: number, y1: number, x2: number, y2: number, isTemp = false): void {
    const ctx = this.ctx;
    
    ctx.strokeStyle = isTemp ? 'rgba(74, 158, 255, 0.5)' : '#4a9eff';
    ctx.lineWidth = 2 / this.scale;
    
    if (isTemp) {
      ctx.setLineDash([5, 5]);
    }
    
    // Draw bezier curve
    const controlDist = Math.min(100, Math.abs(x2 - x1) * 0.5);
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(
      x1 + controlDist, y1,
      x2 - controlDist, y2,
      x2, y2
    );
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw arrow at end
    if (!isTemp) {
      const angle = Math.atan2(y2 - (y1 + (y2 - y1) * 0.9), x2 - (x1 + (x2 - x1) * 0.9));
      const arrowSize = 8 / this.scale;
      
      ctx.fillStyle = '#4a9eff';
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - arrowSize * Math.cos(angle - 0.4), y2 - arrowSize * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - arrowSize * Math.cos(angle + 0.4), y2 - arrowSize * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawNode(node: UINode): void {
    const ctx = this.ctx;
    const { x, y, width, height, type, selected, disabled, category, color } = node;
    const isVFX = VFX_NODE_TYPES.has(type);
    const isHovered = this.hoveredNode?.id === node.id;
    const nodeColor = color || CATEGORY_COLORS[category] || CATEGORY_COLORS['Default'];
    
    // Glow effect for VFX nodes (animated)
    if (isVFX && !disabled) {
      const glowIntensity = 0.5 + 0.3 * Math.sin(this.glowAnimation + node.id.length * 0.5);
      ctx.shadowColor = nodeColor.glow;
      ctx.shadowBlur = 20 + 10 * glowIntensity;
      
      // Draw outer glow
      ctx.fillStyle = 'transparent';
      ctx.beginPath();
      ctx.roundRect(x - 2, y - 2, width + 4, height + 4, 10);
      ctx.fill();
    }
    
    // Node shadow (professional depth effect)
    if (this.showNodeShadows) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, width, height, 10);
    ctx.fill();
    
    // Reset shadow for main node
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Node background with gradient
    const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
    if (disabled) {
      bgGradient.addColorStop(0, '#1a1a1a');
      bgGradient.addColorStop(1, '#151515');
    } else {
      bgGradient.addColorStop(0, '#2e2e2e');
      bgGradient.addColorStop(1, '#252525');
    }
    ctx.fillStyle = bgGradient;
    
    // Border with category color
    if (selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 / this.scale;
    } else if (isHovered) {
      ctx.strokeStyle = nodeColor.primary;
      ctx.lineWidth = 2.5 / this.scale;
    } else {
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1.5 / this.scale;
    }
    
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    
    // Node header with category-specific gradient
    const headerGradient = ctx.createLinearGradient(x, y, x + width, y + 36);
    headerGradient.addColorStop(0, disabled ? '#333333' : nodeColor.primary);
    headerGradient.addColorStop(1, disabled ? '#2a2a2a' : nodeColor.secondary);
    ctx.fillStyle = headerGradient;
    
    ctx.beginPath();
    ctx.roundRect(x, y, width, 36, [10, 10, 0, 0]);
    ctx.fill();
    
    // Add subtle highlight at top of header
    if (!disabled) {
      const highlightGradient = ctx.createLinearGradient(x, y, x, y + 12);
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.roundRect(x, y, width, 12, [10, 10, 0, 0]);
      ctx.fill();
    }
    
    // VFX badge/icon for FX nodes
    if (isVFX && !disabled) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x + width - 20, y + 18, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Sparkle icon
      ctx.fillStyle = '#ffffff';
      ctx.font = `10px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', x + width - 20, y + 18);
    }
    
    // Category indicator line
    ctx.fillStyle = nodeColor.primary;
    ctx.fillRect(x, y + 36, width, 2);
    
    // Node title with shadow for readability
    ctx.fillStyle = disabled ? '#666666' : '#ffffff';
    ctx.font = `bold ${14}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for better readability
    if (!disabled) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }
    ctx.fillText(type, x + width / 2, y + 18);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Category label
    ctx.fillStyle = '#888888';
    ctx.font = `10px 'Segoe UI', sans-serif`;
    ctx.fillText(category, x + width / 2, y + height - 12);
    
    // Draw sockets
    this.drawSockets(node);
    
    // Disabled overlay with diagonal stripes
    if (disabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 10);
      ctx.fill();
      
      // Diagonal stripes pattern
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      for (let i = -height; i < width + height; i += 10) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + height, y + height);
        ctx.stroke();
      }
      ctx.restore();
    }
    
    // Selection handles for resizing
    if (selected) {
      this.drawResizeHandles(node);
    }
  }

  private drawResizeHandles(node: UINode): void {
    const ctx = this.ctx;
    const handleSize = 6 / this.scale;
    const { x, y, width, height } = node;
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1 / this.scale;
    
    // Bottom-right resize handle
    ctx.beginPath();
    ctx.rect(x + width - handleSize, y + height - handleSize, handleSize, handleSize);
    ctx.fill();
    ctx.stroke();
  }

  private drawSockets(node: UINode): void {
    const ctx = this.ctx;
    
    // Data type colors for sockets
    const socketColors: Record<string, string> = {
      'image': '#4a9eff',
      'number': '#ffcc00',
      'geometry': '#ff8844',
      'particles': '#ff44aa',
      'scene': '#44ff88',
      'camera': '#aa88ff',
      'light': '#ffff44',
      'emitter': '#ff6688',
      'force': '#88ff66',
      'any': '#888888'
    };
    
    // Input sockets
    node.inputs.forEach((input, i) => {
      const socketX = node.x + input.x;
      const socketY = node.y + input.y;
      const isHovered = this.hoveredSocket?.node.id === node.id && 
                        this.hoveredSocket?.type === 'input' && 
                        this.hoveredSocket?.index === i;
      
      const baseColor = socketColors[input.dataType] || '#666666';
      
      // Socket glow on hover
      if (isHovered) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
      }
      
      // Socket outer ring
      ctx.fillStyle = input.connected ? baseColor : '#333333';
      ctx.beginPath();
      ctx.arc(socketX, socketY, isHovered ? 9 : 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket inner
      ctx.fillStyle = input.connected ? '#ffffff' : (isHovered ? baseColor : '#555555');
      ctx.beginPath();
      ctx.arc(socketX, socketY, isHovered ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket border
      ctx.strokeStyle = isHovered ? '#ffffff' : '#888888';
      ctx.lineWidth = 1.5 / this.scale;
      ctx.beginPath();
      ctx.arc(socketX, socketY, isHovered ? 9 : 7, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Label with background for readability
      ctx.font = `11px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const labelX = socketX + 12;
      const textWidth = ctx.measureText(input.name).width;
      
      // Label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(labelX - 2, socketY - 7, textWidth + 4, 14);
      
      // Label text
      ctx.fillStyle = input.connected ? '#ffffff' : '#aaaaaa';
      ctx.fillText(input.name, labelX, socketY);
      
      // Data type indicator (small dot)
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(labelX + textWidth + 6, socketY, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Output sockets
    node.outputs.forEach((output, i) => {
      const socketX = node.x + output.x;
      const socketY = node.y + output.y;
      const isHovered = this.hoveredSocket?.node.id === node.id && 
                        this.hoveredSocket?.type === 'output' && 
                        this.hoveredSocket?.index === i;
      
      const baseColor = socketColors[output.dataType] || '#666666';
      
      // Socket glow on hover
      if (isHovered) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
      }
      
      // Socket outer ring
      ctx.fillStyle = output.connected ? baseColor : '#333333';
      ctx.beginPath();
      ctx.arc(socketX, socketY, isHovered ? 9 : 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket inner
      ctx.fillStyle = output.connected ? '#ffffff' : (isHovered ? baseColor : '#555555');
      ctx.beginPath();
      ctx.arc(socketX, socketY, isHovered ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket border
      ctx.strokeStyle = isHovered ? '#ffffff' : '#888888';
      ctx.lineWidth = 1.5 / this.scale;
      ctx.beginPath();
      ctx.arc(socketX, socketY, isHovered ? 9 : 7, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Label with background for readability
      ctx.font = `11px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const textWidth = ctx.measureText(output.name).width;
      const labelX = socketX - 12;
      
      // Label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(labelX - textWidth - 2, socketY - 7, textWidth + 4, 14);
      
      // Label text
      ctx.fillStyle = output.connected ? '#ffffff' : '#aaaaaa';
      ctx.fillText(output.name, labelX, socketY);
      
      // Data type indicator (small dot)
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(labelX - textWidth - 6, socketY, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderMinimap(): void {
    const minimap = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    if (!minimap) return;
    
    const ctx = minimap.getContext('2d');
    if (!ctx) return;
    
    minimap.width = 200;
    minimap.height = 150;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, minimap.width, minimap.height);
    
    if (this.nodes.length === 0) return;
    
    // Calculate bounds
    const bounds = this.getNodeBounds();
    const padding = 20;
    const scale = Math.min(
      (minimap.width - padding * 2) / bounds.width,
      (minimap.height - padding * 2) / bounds.height
    );
    
    // Draw nodes
    ctx.fillStyle = '#ff6b35';
    this.nodes.forEach(node => {
      const x = padding + (node.x - bounds.minX) * scale;
      const y = padding + (node.y - bounds.minY) * scale;
      const w = node.width * scale;
      const h = node.height * scale;
      ctx.fillRect(x, y, w, h);
    });
    
    // Draw viewport
    const viewX = padding + (-this.offset.x / this.scale - bounds.minX) * scale;
    const viewY = padding + (-this.offset.y / this.scale - bounds.minY) * scale;
    const viewW = (this.canvas.width / this.scale) * scale;
    const viewH = (this.canvas.height / this.scale) * scale;
    
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
  }

  private getNodeBounds(): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
    if (this.nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });
    
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  private updatePropertiesPanel(node: UINode): void {
    const panel = document.getElementById('properties-panel');
    if (!panel) return;
    
    const isVFX = VFX_NODE_TYPES.has(node.type);
    const nodeColor = node.color || CATEGORY_COLORS[node.category] || CATEGORY_COLORS['Default'];
    
    panel.innerHTML = `
      <div class="property-group">
        <h4 style="color: ${nodeColor.primary}">${node.type} ${isVFX ? '✦' : ''}</h4>
        <div class="property-row">
          <label>ID:</label>
          <span class="property-value">${node.id}</span>
        </div>
        <div class="property-row">
          <label>Category:</label>
          <span class="property-value" style="color: ${nodeColor.primary}">${node.category}</span>
        </div>
        <div class="property-row">
          <label>Position:</label>
          <span class="property-value">X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}</span>
        </div>
        <div class="property-row">
          <label>Size:</label>
          <span class="property-value">${node.width} × ${node.height}</span>
        </div>
        <div class="property-row">
          <label>Disabled:</label>
          <input type="checkbox" id="node-disabled" ${node.disabled ? 'checked' : ''}>
        </div>
      </div>
      <div class="property-group">
        <h4>🔌 Sockets</h4>
        <div class="socket-list">
          <strong>Inputs (${node.inputs.length}):</strong>
          ${node.inputs.map((inp, i) => `
            <div class="property-row socket-row">
              <span>• ${inp.name} <span class="socket-type">(${inp.dataType})</span></span>
              <button class="remove-socket-btn" data-type="input" data-index="${i}">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="socket-list">
          <strong>Outputs (${node.outputs.length}):</strong>
          ${node.outputs.map((out, i) => `
            <div class="property-row socket-row">
              <span>• ${out.name} <span class="socket-type">(${out.dataType})</span></span>
              <button class="remove-socket-btn" data-type="output" data-index="${i}">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="socket-actions">
          <button id="add-input-btn" class="tool-btn">+ Input</button>
          <button id="add-output-btn" class="tool-btn">+ Output</button>
        </div>
      </div>
      <div class="property-group">
        <h4>🎨 Appearance</h4>
        <div class="property-row">
          <label>Connection Style:</label>
          <select id="connection-style" class="property-select">
            <option value="bezier" ${this.connectionStyle === 'bezier' ? 'selected' : ''}>Bezier</option>
            <option value="linear" ${this.connectionStyle === 'linear' ? 'selected' : ''}>Linear</option>
            <option value="step" ${this.connectionStyle === 'step' ? 'selected' : ''}>Step</option>
          </select>
        </div>
        <div class="property-row">
          <label>Show Flow Animation:</label>
          <input type="checkbox" id="show-flow" ${this.showConnectionFlow ? 'checked' : ''}>
        </div>
        <div class="property-row">
          <label>Node Shadows:</label>
          <input type="checkbox" id="show-shadows" ${this.showNodeShadows ? 'checked' : ''}>
        </div>
      </div>
      <div class="property-group">
        <h4>⚙️ Parameters</h4>
        <p class="empty-message">Node parameters will appear here</p>
      </div>
    `;
    
    // Event listeners
    document.getElementById('node-disabled')?.addEventListener('change', (e) => {
      node.disabled = (e.target as HTMLInputElement).checked;
      this.render();
    });
    
    document.getElementById('connection-style')?.addEventListener('change', (e) => {
      this.connectionStyle = (e.target as HTMLSelectElement).value as 'bezier' | 'linear' | 'step';
      // Update all connections
      this.connections.forEach(conn => conn.style = this.connectionStyle);
      this.render();
    });
    
    document.getElementById('show-flow')?.addEventListener('change', (e) => {
      this.showConnectionFlow = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('show-shadows')?.addEventListener('change', (e) => {
      this.showNodeShadows = (e.target as HTMLInputElement).checked;
      this.render();
    });
    
    document.getElementById('add-input-btn')?.addEventListener('click', () => {
      const name = prompt('Enter input socket name:', 'New Input');
      if (name) {
        this.addSocketToNode(node.id, 'input', name, 'any');
      }
    });
    
    document.getElementById('add-output-btn')?.addEventListener('click', () => {
      const name = prompt('Enter output socket name:', 'New Output');
      if (name) {
        this.addSocketToNode(node.id, 'output', name, 'any');
      }
    });
    
    document.querySelectorAll('.remove-socket-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const type = target.dataset.type as 'input' | 'output';
        const index = parseInt(target.dataset.index || '0');
        if (confirm(`Remove this ${type} socket?`)) {
          this.removeSocketFromNode(node.id, type, index);
          this.updatePropertiesPanel(node);
        }
      });
    });
  }

  private updateStatusCounts(): void {
    const nodeCount = document.getElementById('node-count');
    const connCount = document.getElementById('connection-count');
    
    if (nodeCount) nodeCount.textContent = `Nodes: ${this.nodes.length}`;
    if (connCount) connCount.textContent = `Connections: ${this.connections.length}`;
  }

  private updateZoomIndicator(): void {
    const indicator = document.getElementById('zoom-indicator');
    if (indicator) {
      indicator.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  // Actions
  async executeGraph(): Promise<void> {
    const statusText = document.getElementById('status-text');
    if (statusText) statusText.textContent = 'Executing graph...';
    
    try {
      await this.app.executeGraph();
      this.showToast('Graph executed successfully!', 'success');
      if (statusText) statusText.textContent = 'Execution complete';
    } catch (error) {
      this.showToast(`Execution failed: ${error}`, 'error');
      if (statusText) statusText.textContent = 'Execution failed';
    }
  }

  clearGraph(): void {
    if (confirm('Clear all nodes and connections?')) {
      this.nodes = [];
      this.connections = [];
      this.selectedNodes.clear();
      this.updateStatusCounts();
      this.showToast('Graph cleared', 'info');
      this.render();
    }
  }

  deleteSelected(): void {
    const toDelete = this.nodes.filter(n => n.selected);
    if (toDelete.length === 0) return;
    
    toDelete.forEach(node => {
      // Remove connections
      this.connections = this.connections.filter(conn => 
        conn.fromNodeId !== node.id && conn.toNodeId !== node.id
      );
    });
    
    this.nodes = this.nodes.filter(n => !n.selected);
    this.selectedNodes.clear();
    this.updateStatusCounts();
    this.showToast(`Deleted ${toDelete.length} node(s)`, 'info');
    this.render();
  }

  duplicateSelected(): void {
    const toDuplicate = this.nodes.filter(n => n.selected);
    if (toDuplicate.length === 0) return;
    
    this.nodes.forEach(n => n.selected = false);
    this.selectedNodes.clear();
    
    toDuplicate.forEach(node => {
      const newNode: UINode = {
        ...node,
        id: `node_${node.type}_${this.nodeIdCounter++}`,
        x: node.x + 40,
        y: node.y + 40,
        selected: true,
        inputs: node.inputs.map(i => ({ ...i, connected: false })),
        outputs: node.outputs.map(o => ({ ...o, connected: false }))
      };
      this.nodes.push(newNode);
      this.selectedNodes.add(newNode.id);
      this.app.createNode(node.type, newNode.id);
    });
    
    this.updateStatusCounts();
    this.showToast(`Duplicated ${toDuplicate.length} node(s)`, 'success');
    this.render();
  }

  selectAll(): void {
    this.nodes.forEach(n => {
      n.selected = true;
      this.selectedNodes.add(n.id);
    });
    this.render();
  }

  deselectAll(): void {
    this.nodes.forEach(n => n.selected = false);
    this.selectedNodes.clear();
    this.render();
  }

  disconnectSelected(): void {
    const selected = this.nodes.filter(n => n.selected);
    let count = 0;
    
    selected.forEach(node => {
      const toRemove = this.connections.filter(conn => 
        conn.fromNodeId === node.id || conn.toNodeId === node.id
      );
      count += toRemove.length;
      this.connections = this.connections.filter(conn => 
        conn.fromNodeId !== node.id && conn.toNodeId !== node.id
      );
      
      node.inputs.forEach(i => i.connected = false);
      node.outputs.forEach(o => o.connected = false);
    });
    
    this.updateStatusCounts();
    this.showToast(`Disconnected ${count} connection(s)`, 'info');
    this.render();
  }

  toggleDisableSelected(): void {
    this.nodes.filter(n => n.selected).forEach(n => n.disabled = !n.disabled);
    this.render();
  }

  zoomIn(): void {
    this.scale = Math.min(5, this.scale * 1.2);
    this.updateZoomIndicator();
    this.render();
  }

  zoomOut(): void {
    this.scale = Math.max(0.1, this.scale / 1.2);
    this.updateZoomIndicator();
    this.render();
  }

  resetZoom(): void {
    this.scale = 1.0;
    this.offset = { x: 0, y: 0 };
    this.updateZoomIndicator();
    this.render();
  }

  fitToWindow(): void {
    if (this.nodes.length === 0) {
      this.resetZoom();
      return;
    }
    
    const bounds = this.getNodeBounds();
    const padding = 50;
    
    const scaleX = (this.canvas.width - padding * 2) / bounds.width;
    const scaleY = (this.canvas.height - padding * 2) / bounds.height;
    this.scale = Math.min(scaleX, scaleY, 2);
    
    this.offset.x = padding - bounds.minX * this.scale + (this.canvas.width - padding * 2 - bounds.width * this.scale) / 2;
    this.offset.y = padding - bounds.minY * this.scale + (this.canvas.height - padding * 2 - bounds.height * this.scale) / 2;
    
    this.updateZoomIndicator();
    this.render();
  }

  toggleSnap(): void {
    this.gridSnap = !this.gridSnap;
    const btn = document.getElementById('snap-btn');
    if (btn) btn.classList.toggle('active', this.gridSnap);
    this.showToast(`Grid snap ${this.gridSnap ? 'enabled' : 'disabled'}`, 'info');
  }

  toggleMinimap(): void {
    this.showMinimap = !this.showMinimap;
    const minimap = document.getElementById('minimap');
    if (minimap) minimap.classList.toggle('hidden', !this.showMinimap);
    const btn = document.getElementById('minimap-btn');
    if (btn) btn.classList.toggle('active', this.showMinimap);
  }

  // Project management
  newProject(): void {
    if (this.nodes.length > 0 && !confirm('Create new project? Unsaved changes will be lost.')) {
      return;
    }
    this.nodes = [];
    this.connections = [];
    this.selectedNodes.clear();
    this.nodeIdCounter = 1;
    this.connectionIdCounter = 1;
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.updateStatusCounts();
    this.updateZoomIndicator();
    this.showToast('New project created', 'success');
    this.render();
  }

  saveProject(): void {
    const projectData = {
      version: '2.0.0',
      nodes: this.nodes,
      connections: this.connections,
      viewport: { offset: this.offset, scale: this.scale }
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ragevfx-project.json';
    a.click();
    URL.revokeObjectURL(url);
    
    this.showToast('Project saved', 'success');
  }

  openProject(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            this.nodes = data.nodes || [];
            this.connections = data.connections || [];
            this.offset = data.viewport?.offset || { x: 0, y: 0 };
            this.scale = data.viewport?.scale || 1.0;
            this.updateStatusCounts();
            this.updateZoomIndicator();
            this.showToast('Project loaded', 'success');
            this.render();
          } catch (error) {
            this.showToast('Failed to load project', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  showAbout(): void {
    this.showModal('About RageVFX', `
      <div class="about-content">
        <h2>🎬 RageVFX Web</h2>
        <p class="version">Version 2.0.0</p>
        <p>Professional Node-Based Visual Effects Software</p>
        <p>Create stunning visual effects directly in your browser with our powerful node-based compositing system.</p>
        <h4>Features:</h4>
        <ul>
          <li>70+ VFX nodes</li>
          <li>Real-time preview</li>
          <li>GPU-accelerated rendering</li>
          <li>3D rendering pipeline</li>
          <li>Physics simulation</li>
          <li>ML-powered tools</li>
        </ul>
        <p class="copyright">© 2024 RageVFX Team. MIT License.</p>
      </div>
    `);
  }

  showShortcuts(): void {
    this.showModal('Keyboard Shortcuts', `
      <div class="shortcuts-content">
        <div class="shortcut-group">
          <h4>General</h4>
          <div class="shortcut-row"><span>Ctrl+Enter</span><span>Execute Graph</span></div>
          <div class="shortcut-row"><span>Ctrl+S</span><span>Save Project</span></div>
          <div class="shortcut-row"><span>Ctrl+O</span><span>Open Project</span></div>
        </div>
        <div class="shortcut-group">
          <h4>Selection</h4>
          <div class="shortcut-row"><span>Ctrl+A</span><span>Select All</span></div>
          <div class="shortcut-row"><span>Delete</span><span>Delete Selected</span></div>
          <div class="shortcut-row"><span>Ctrl+D</span><span>Duplicate</span></div>
          <div class="shortcut-row"><span>Escape</span><span>Deselect All</span></div>
        </div>
        <div class="shortcut-group">
          <h4>Navigation</h4>
          <div class="shortcut-row"><span>Ctrl++</span><span>Zoom In</span></div>
          <div class="shortcut-row"><span>Ctrl+-</span><span>Zoom Out</span></div>
          <div class="shortcut-row"><span>Ctrl+0</span><span>Reset Zoom</span></div>
          <div class="shortcut-row"><span>F</span><span>Fit to Window</span></div>
          <div class="shortcut-row"><span>Mouse Wheel</span><span>Zoom</span></div>
          <div class="shortcut-row"><span>Click + Drag</span><span>Pan Canvas</span></div>
        </div>
      </div>
    `);
  }

  showModal(title: string, content: string): void {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    
    if (overlay && container) {
      container.innerHTML = `
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      `;
      
      overlay.classList.remove('hidden');
      
      const closeModal = () => overlay.classList.add('hidden');
      container.querySelector('.modal-close')?.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const nodeCanvas = document.getElementById('node-canvas') as HTMLCanvasElement;
  if (nodeCanvas) {
    const graphUI = new NodeGraphUI(nodeCanvas);
    
    // Expose for debugging
    (window as any).graphUI = graphUI;
    
    console.log('RageVFX Web initialized successfully!');
  }
});
