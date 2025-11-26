/**
 * Renderer process for RageVFX UI
 */

// Simple node graph visualization
class NodeGraphUI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    this.resize();
    this.setupEventListeners();
    this.render();
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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.createNode(nodeType, x, y);
    }
  }

  createNode(type, x, y) {
    // Generate unique ID using counter to avoid collisions
    if (!this.nodeIdCounter) {
      this.nodeIdCounter = 1;
    }
    
    const node = {
      id: `node_${type}_${this.nodeIdCounter++}`,
      type,
      x,
      y,
      width: 180,
      height: 120,
      inputs: [{ name: 'Input', x: 0, y: 40 }],
      outputs: [{ name: 'Output', x: 180, y: 40 }]
    };
    
    this.nodes.push(node);
    this.updateNodeCount();
    this.render();
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on a node
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        this.selectedNode = node;
        this.dragOffset = { x: x - node.x, y: y - node.y };
        break;
      }
    }
  }

  onMouseMove(e) {
    if (this.selectedNode && this.dragOffset) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.selectedNode.x = x - this.dragOffset.x;
      this.selectedNode.y = y - this.dragOffset.y;
      this.render();
    }
  }

  onMouseUp(e) {
    this.selectedNode = null;
    this.dragOffset = null;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    this.connections.forEach(conn => {
      ctx.beginPath();
      ctx.moveTo(conn.fromX, conn.fromY);
      ctx.lineTo(conn.toX, conn.toY);
      ctx.stroke();
    });
    
    // Draw nodes
    this.nodes.forEach(node => {
      this.drawNode(node);
    });
  }

  drawNode(node) {
    const ctx = this.ctx;
    
    // Node background
    ctx.fillStyle = '#2c2c2c';
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, 8);
    ctx.fill();
    ctx.stroke();
    
    // Node header
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, 30, [8, 8, 0, 0]);
    ctx.fill();
    
    // Node title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.type, node.x + node.width / 2, node.y + 20);
    
    // Input/output sockets
    ctx.fillStyle = '#4a9eff';
    node.inputs?.forEach(input => {
      ctx.beginPath();
      ctx.arc(node.x + input.x, node.y + input.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    
    node.outputs?.forEach(output => {
      ctx.beginPath();
      ctx.arc(node.x + output.x, node.y + output.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  clear() {
    this.nodes = [];
    this.connections = [];
    this.updateNodeCount();
    this.render();
  }

  updateNodeCount() {
    document.getElementById('node-count').textContent = `Nodes: ${this.nodes.length}`;
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
});
