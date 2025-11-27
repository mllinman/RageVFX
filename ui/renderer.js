/**
 * Renderer process for RageVFX UI (Electron version)
 * Enhanced with VFX glow effects, professional styling, and advanced features
 */

// VFX Node types that should have glow effects
const VFX_NODE_TYPES = new Set([
  'Fire', 'Water', 'Rain', 'Snow', 'Smoke', 'Clouds', 'Explosion', 'Tornado',
  'Fog', 'Lightning', 'Spark', 'Dissolve', 'LensFlare', 'Glow', 'VolumetricFog',
  'VolumetricLight', 'VolumeRender', 'CloudVolume', 'ParticleSystem', 'ParticleEmitter'
]);

// Category colors for visual distinction
const CATEGORY_COLORS = {
  'VFX': { primary: '#ff4444', secondary: '#ff8866', glow: 'rgba(255, 68, 68, 0.6)' },
  'Filter': { primary: '#4488ff', secondary: '#66aaff', glow: 'rgba(68, 136, 255, 0.4)' },
  'Color': { primary: '#44cc88', secondary: '#66ddaa', glow: 'rgba(68, 204, 136, 0.4)' },
  'Composite': { primary: '#aa44ff', secondary: '#cc66ff', glow: 'rgba(170, 68, 255, 0.4)' },
  '3D': { primary: '#ff8844', secondary: '#ffaa66', glow: 'rgba(255, 136, 68, 0.4)' },
  'ML': { primary: '#44dddd', secondary: '#66ffff', glow: 'rgba(68, 221, 221, 0.4)' },
  'Physics': { primary: '#dd4488', secondary: '#ff66aa', glow: 'rgba(221, 68, 136, 0.4)' },
  'Default': { primary: '#ff6b35', secondary: '#f7931e', glow: 'rgba(255, 107, 53, 0.3)' }
};

// Node graph visualization with VFX glow effects
class NodeGraphUI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.nodeIdCounter = 1;
    this.connectionIdCounter = 1;
    this.glowAnimation = 0;
    this.gridSnap = true;
    this.gridSize = 20;
    this.connectionStyle = 'bezier';
    this.showConnectionFlow = true;
    this.connecting = false;
    this.connectingFrom = null;
    this.mousePos = { x: 0, y: 0 };
    
    this.resize();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  startAnimationLoop() {
    const animate = () => {
      this.glowAnimation = (this.glowAnimation + 0.02) % (Math.PI * 2);
      this.render();
      requestAnimationFrame(animate);
    };
    animate();
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.render();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    
    // Drag and drop for node creation
    document.querySelectorAll('.node-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('nodeType', e.target.dataset.nodeType);
      });
    });
    
    this.canvas.addEventListener('dragover', (e) => e.preventDefault());
    this.canvas.addEventListener('drop', (e) => this.onDrop(e));
  }

  onDrop(e) {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    if (nodeType) {
      const rect = this.canvas.getBoundingClientRect();
      let x = (e.clientX - rect.left - this.offset.x) / this.scale;
      let y = (e.clientY - rect.top - this.offset.y) / this.scale;
      
      if (this.gridSnap) {
        x = Math.round(x / this.gridSize) * this.gridSize;
        y = Math.round(y / this.gridSize) * this.gridSize;
      }
      
      this.createNode(nodeType, x, y);
    }
  }

  getNodeCategory(type) {
    if (VFX_NODE_TYPES.has(type)) return 'VFX';
    if (['Blur', 'Sharpen', 'EdgeDetect', 'MotionBlur', 'DepthOfField', 'ChromaticAberration', 'Vignette', 'FilmGrain', 'Glow'].includes(type)) return 'Filter';
    if (['ColorCorrect', 'Grade', 'Curves', 'Levels', 'HSL', 'OCIOColorSpace', 'OCIOLook'].includes(type)) return 'Color';
    if (['Merge', 'Screen', 'Overlay', 'ChromaKey', 'LuminanceKey', 'Difference', 'Rotoscope', 'SpillSuppression', 'EdgeMatte'].includes(type)) return 'Composite';
    if (['Scene', 'Renderer3D', 'Geometry3D', 'Mesh', 'Material', 'Camera', 'Light', 'EnvironmentMap', 'ShadowMap'].includes(type)) return '3D';
    if (['StyleTransfer', 'Upscale', 'Denoise', 'ObjectDetection', 'Inpaint', 'DepthEstimation'].includes(type)) return 'ML';
    if (['RigidBody', 'SoftBody', 'FluidSim', 'ClothSim', 'Collision'].includes(type)) return 'Physics';
    return 'Default';
  }

  createNode(type, x, y) {
    const category = this.getNodeCategory(type);
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Default'];
    
    const node = {
      id: `node_${type}_${this.nodeIdCounter++}`,
      type,
      category,
      x,
      y,
      width: 200,
      height: 120,
      inputs: [{ id: 'input_0', name: 'Input', x: 0, y: 50, connected: false, dataType: 'image' }],
      outputs: [{ id: 'output_0', name: 'Output', x: 200, y: 50, connected: false, dataType: 'image' }],
      selected: false,
      disabled: false,
      color: colors
    };
    
    this.nodes.push(node);
    this.updateNodeCount();
    this.render();
  }

  onMouseDown(e) {
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
          this.connectingFrom = { nodeId: node.id, outputIndex: j, x: socketX, y: socketY };
          return;
        }
      }
    }
    
    // Check if clicking on a node
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        this.nodes.forEach(n => n.selected = false);
        node.selected = true;
        this.selectedNode = node;
        this.dragOffset = { x: x - node.x, y: y - node.y };
        
        // Move to front
        this.nodes.splice(i, 1);
        this.nodes.push(node);
        break;
      }
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = {
      x: (e.clientX - rect.left - this.offset.x) / this.scale,
      y: (e.clientY - rect.top - this.offset.y) / this.scale
    };
    
    if (this.connecting) {
      this.render();
      return;
    }
    
    if (this.selectedNode && this.dragOffset) {
      let newX = this.mousePos.x - this.dragOffset.x;
      let newY = this.mousePos.y - this.dragOffset.y;
      
      if (this.gridSnap) {
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
      }
      
      this.selectedNode.x = newX;
      this.selectedNode.y = newY;
      this.updateConnectionPositions();
      this.render();
    }
    
    // Update hover state
    this.hoveredNode = null;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (this.mousePos.x >= node.x && this.mousePos.x <= node.x + node.width &&
          this.mousePos.y >= node.y && this.mousePos.y <= node.y + node.height) {
        this.hoveredNode = node;
        break;
      }
    }
  }

  onMouseUp(e) {
    if (this.connecting && this.connectingFrom) {
      const x = this.mousePos.x;
      const y = this.mousePos.y;
      
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
    
    this.selectedNode = null;
    this.dragOffset = null;
    this.connecting = false;
    this.connectingFrom = null;
  }

  onWheel(e) {
    e.preventDefault();
    const zoom = e.deltaY > 0 ? 0.9 : 1.1;
    this.scale = Math.max(0.1, Math.min(5, this.scale * zoom));
    this.render();
  }

  createConnection(fromNodeId, fromOutput, toNodeId, toInput) {
    const fromNode = this.nodes.find(n => n.id === fromNodeId);
    const toNode = this.nodes.find(n => n.id === toNodeId);
    
    if (!fromNode || !toNode) return;
    
    const conn = {
      id: `conn_${this.connectionIdCounter++}`,
      fromNodeId,
      fromOutputIndex: fromOutput,
      toNodeId,
      toInputIndex: toInput,
      fromX: fromNode.x + fromNode.outputs[fromOutput].x,
      fromY: fromNode.y + fromNode.outputs[fromOutput].y,
      toX: toNode.x + toNode.inputs[toInput].x,
      toY: toNode.y + toNode.inputs[toInput].y,
      color: '#4a9eff'
    };
    
    this.connections.push(conn);
    fromNode.outputs[fromOutput].connected = true;
    toNode.inputs[toInput].connected = true;
  }

  updateConnectionPositions() {
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

  render() {
    const ctx = this.ctx;
    ctx.save();
    
    // Clear canvas with dark background
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply transform
    ctx.translate(this.offset.x, this.offset.y);
    ctx.scale(this.scale, this.scale);
    
    // Draw grid
    this.drawGrid();
    
    // Draw connections
    this.drawConnections();
    
    // Draw nodes
    this.nodes.forEach(node => {
      this.drawNode(node);
    });
    
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
  }

  drawGrid() {
    const ctx = this.ctx;
    const gridSize = this.gridSize;
    
    ctx.strokeStyle = '#1a1a1a';
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
  }

  drawConnections() {
    this.connections.forEach(conn => {
      this.drawConnectionLine(conn.fromX, conn.fromY, conn.toX, conn.toY, false, conn.color);
    });
  }

  drawConnectionLine(x1, y1, x2, y2, isTemp = false, color = '#4a9eff') {
    const ctx = this.ctx;
    
    ctx.strokeStyle = isTemp ? 'rgba(74, 158, 255, 0.5)' : color;
    ctx.lineWidth = 2 / this.scale;
    
    if (isTemp) {
      ctx.setLineDash([5, 5]);
    }
    
    // Draw bezier curve
    const controlDist = Math.min(100, Math.abs(x2 - x1) * 0.5);
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + controlDist, y1, x2 - controlDist, y2, x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw flow animation
    if (!isTemp && this.showConnectionFlow) {
      this.drawConnectionFlow(x1, y1, x2, y2, color);
    }
  }

  drawConnectionFlow(fromX, fromY, toX, toY, color) {
    const ctx = this.ctx;
    const animPhase = (performance.now() / 1000) % 1;
    const controlDist = Math.min(100, Math.abs(toX - fromX) * 0.5);
    
    ctx.fillStyle = color;
    
    for (let i = 0; i < 3; i++) {
      const t = ((animPhase + i / 3) % 1);
      const oneMinusT = 1 - t;
      
      const p0 = { x: fromX, y: fromY };
      const p1 = { x: fromX + controlDist, y: fromY };
      const p2 = { x: toX - controlDist, y: toY };
      const p3 = { x: toX, y: toY };
      
      const dotX = Math.pow(oneMinusT, 3) * p0.x + 3 * Math.pow(oneMinusT, 2) * t * p1.x + 3 * oneMinusT * t * t * p2.x + Math.pow(t, 3) * p3.x;
      const dotY = Math.pow(oneMinusT, 3) * p0.y + 3 * Math.pow(oneMinusT, 2) * t * p1.y + 3 * oneMinusT * t * t * p2.y + Math.pow(t, 3) * p3.y;
      
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3 / this.scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawNode(node) {
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
    }
    
    // Node shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, width, height, 10);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Node background with gradient
    const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
    bgGradient.addColorStop(0, disabled ? '#1a1a1a' : '#2e2e2e');
    bgGradient.addColorStop(1, disabled ? '#151515' : '#252525');
    ctx.fillStyle = bgGradient;
    
    // Border
    ctx.strokeStyle = selected ? '#ffffff' : (isHovered ? nodeColor.primary : '#444444');
    ctx.lineWidth = selected ? 3 / this.scale : 1.5 / this.scale;
    
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
    
    // VFX badge for FX nodes
    if (isVFX && !disabled) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x + width - 20, y + 18, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', x + width - 20, y + 18);
    }
    
    // Category indicator line
    ctx.fillStyle = nodeColor.primary;
    ctx.fillRect(x, y + 36, width, 2);
    
    // Node title
    ctx.fillStyle = disabled ? '#666666' : '#ffffff';
    ctx.font = "bold 14px 'Segoe UI', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, x + width / 2, y + 18);
    
    // Category label
    ctx.fillStyle = '#888888';
    ctx.font = "10px 'Segoe UI', sans-serif";
    ctx.fillText(category, x + width / 2, y + height - 12);
    
    // Draw sockets
    this.drawSockets(node);
  }

  drawSockets(node) {
    const ctx = this.ctx;
    
    // Input sockets
    node.inputs?.forEach((input, i) => {
      const socketX = node.x + input.x;
      const socketY = node.y + input.y;
      
      // Socket outer ring
      ctx.fillStyle = input.connected ? '#4a9eff' : '#333333';
      ctx.beginPath();
      ctx.arc(socketX, socketY, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket inner
      ctx.fillStyle = input.connected ? '#ffffff' : '#555555';
      ctx.beginPath();
      ctx.arc(socketX, socketY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket border
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 1.5 / this.scale;
      ctx.beginPath();
      ctx.arc(socketX, socketY, 7, 0, Math.PI * 2);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = input.connected ? '#ffffff' : '#aaaaaa';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(input.name, socketX + 12, socketY);
    });
    
    // Output sockets
    node.outputs?.forEach((output, i) => {
      const socketX = node.x + output.x;
      const socketY = node.y + output.y;
      
      // Socket outer ring
      ctx.fillStyle = output.connected ? '#4a9eff' : '#333333';
      ctx.beginPath();
      ctx.arc(socketX, socketY, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket inner
      ctx.fillStyle = output.connected ? '#ffffff' : '#555555';
      ctx.beginPath();
      ctx.arc(socketX, socketY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Socket border
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 1.5 / this.scale;
      ctx.beginPath();
      ctx.arc(socketX, socketY, 7, 0, Math.PI * 2);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = output.connected ? '#ffffff' : '#aaaaaa';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(output.name, socketX - 12, socketY);
    });
  }

  clear() {
    this.nodes = [];
    this.connections = [];
    this.nodeIdCounter = 1;
    this.connectionIdCounter = 1;
    this.updateNodeCount();
    this.render();
  }

  updateNodeCount() {
    const nodeCount = document.getElementById('node-count');
    if (nodeCount) {
      nodeCount.textContent = `Nodes: ${this.nodes.length}`;
    }
  }
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
  const nodeCanvas = document.getElementById('node-canvas');
  const graphUI = new NodeGraphUI(nodeCanvas);
  
  // Toolbar buttons
  document.getElementById('execute-btn').addEventListener('click', () => {
    document.getElementById('status-text').textContent = 'Executing...';
    setTimeout(() => {
      document.getElementById('status-text').textContent = 'Execution complete';
    }, 1000);
  });
  
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Clear all nodes?')) {
      graphUI.clear();
      document.getElementById('status-text').textContent = 'Graph cleared';
    }
  });
  
  document.getElementById('zoom-in-btn').addEventListener('click', () => {
    graphUI.scale *= 1.2;
    graphUI.render();
  });
  
  document.getElementById('zoom-out-btn').addEventListener('click', () => {
    graphUI.scale /= 1.2;
    graphUI.render();
  });
  
  document.getElementById('fit-btn').addEventListener('click', () => {
    graphUI.scale = 1.0;
    graphUI.offset = { x: 0, y: 0 };
    graphUI.render();
  });
  
  // Expose for debugging
  window.graphUI = graphUI;
});
