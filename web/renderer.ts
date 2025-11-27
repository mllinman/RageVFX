/**
 * Web Renderer for RageVFX
 * Modern browser-based node graph visualization and interaction
 */

import { initializeApp, getApp, RageVFXApp } from './app';

interface UINode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: { name: string; x: number; y: number; connected: boolean }[];
  outputs: { name: string; x: number; y: number; connected: boolean }[];
  selected: boolean;
  disabled: boolean;
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
}

class NodeGraphUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: UINode[] = [];
  private connections: UIConnection[] = [];
  private selectedNodes: Set<string> = new Set();
  private offset = { x: 0, y: 0 };
  private scale = 1.0;
  private isDragging = false;
  private isPanning = false;
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
    
    const node: UINode = {
      id: nodeId,
      type,
      x,
      y,
      width: 180,
      height: 120,
      inputs: [{ name: 'Input', x: 0, y: 50, connected: false }],
      outputs: [{ name: 'Output', x: 180, y: 50, connected: false }],
      selected: false,
      disabled: false
    };
    
    this.nodes.push(node);
    this.app.createNode(type, nodeId);
    this.updateStatusCounts();
    this.showToast(`Created ${type} node`, 'success');
    this.render();
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
    }
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
    
    const conn: UIConnection = {
      id: `conn_${this.connectionIdCounter++}`,
      fromNodeId,
      fromOutputIndex: fromOutput,
      toNodeId,
      toInputIndex: toInput,
      fromX: fromNode.x + fromNode.outputs[fromOutput].x,
      fromY: fromNode.y + fromNode.outputs[fromOutput].y,
      toX: toNode.x + toNode.inputs[toInput].x,
      toY: toNode.y + toNode.inputs[toInput].y
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
    this.connections.forEach(conn => {
      this.drawConnectionLine(conn.fromX, conn.fromY, conn.toX, conn.toY);
    });
  }

  private drawConnectionLine(x1: number, y1: number, x2: number, y2: number, isTemp = false): void {
    const ctx = this.ctx;
    
    ctx.strokeStyle = isTemp ? 'rgba(74, 158, 255, 0.5)' : '#4a9eff';
    ctx.lineWidth = 2 / this.scale;
    
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
    const { x, y, width, height, type, selected, disabled } = node;
    
    // Node shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, width, height, 8);
    ctx.fill();
    
    // Node background
    ctx.fillStyle = disabled ? '#1a1a1a' : '#2c2c2c';
    ctx.strokeStyle = selected ? '#ff6b35' : '#555555';
    ctx.lineWidth = selected ? 3 / this.scale : 2 / this.scale;
    
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    
    // Node header
    const headerGradient = ctx.createLinearGradient(x, y, x + width, y);
    headerGradient.addColorStop(0, '#ff6b35');
    headerGradient.addColorStop(1, '#f7931e');
    ctx.fillStyle = disabled ? '#444444' : headerGradient;
    
    ctx.beginPath();
    ctx.roundRect(x, y, width, 32, [8, 8, 0, 0]);
    ctx.fill();
    
    // Node title
    ctx.fillStyle = disabled ? '#888888' : '#ffffff';
    ctx.font = `bold ${14 / this.scale > 10 ? 14 : 10}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, x + width / 2, y + 16);
    
    // Node ID (smaller)
    ctx.fillStyle = '#888888';
    ctx.font = `${10 / this.scale > 8 ? 10 : 8}px sans-serif`;
    ctx.fillText(node.id.split('_').pop() || '', x + width / 2, y + height - 10);
    
    // Draw sockets
    this.drawSockets(node);
    
    // Disabled overlay
    if (disabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 8);
      ctx.fill();
    }
  }

  private drawSockets(node: UINode): void {
    const ctx = this.ctx;
    
    // Input sockets
    node.inputs.forEach((input, i) => {
      const socketX = node.x + input.x;
      const socketY = node.y + input.y;
      
      // Socket background
      ctx.fillStyle = input.connected ? '#4a9eff' : '#666666';
      ctx.beginPath();
      ctx.arc(socketX, socketY, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1 / this.scale;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#aaaaaa';
      ctx.font = `${10}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(input.name, socketX + 10, socketY);
    });
    
    // Output sockets
    node.outputs.forEach((output, i) => {
      const socketX = node.x + output.x;
      const socketY = node.y + output.y;
      
      // Socket background
      ctx.fillStyle = output.connected ? '#4a9eff' : '#666666';
      ctx.beginPath();
      ctx.arc(socketX, socketY, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1 / this.scale;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#aaaaaa';
      ctx.font = `${10}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(output.name, socketX - 10, socketY);
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
    
    panel.innerHTML = `
      <div class="property-group">
        <h4>${node.type}</h4>
        <div class="property-row">
          <label>ID:</label>
          <span class="property-value">${node.id}</span>
        </div>
        <div class="property-row">
          <label>Position:</label>
          <span class="property-value">X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}</span>
        </div>
        <div class="property-row">
          <label>Disabled:</label>
          <input type="checkbox" id="node-disabled" ${node.disabled ? 'checked' : ''}>
        </div>
      </div>
      <div class="property-group">
        <h4>Parameters</h4>
        <p class="empty-message">Parameters will appear here based on node type</p>
      </div>
    `;
    
    document.getElementById('node-disabled')?.addEventListener('change', (e) => {
      node.disabled = (e.target as HTMLInputElement).checked;
      this.render();
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
