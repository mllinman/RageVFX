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
    this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
  }

  onDoubleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offset.x) / this.scale;
    const y = (e.clientY - rect.top - this.offset.y) / this.scale;

    for (const node of this.nodes) {
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        node.collapsed = !node.collapsed;
        this.render();
        break;
      }
    }
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
    let clickedNode = null;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        clickedNode = node;

        if (!e.shiftKey) {
          this.nodes.forEach(n => n.selected = false);
        }

        node.selected = true;
        this.selectedNode = node; // Primary selection
        this.dragOffset = { x: x - node.x, y: y - node.y };

        // Move to front
        this.nodes.splice(i, 1);
        this.nodes.push(node);

        this.updatePropertiesPanel(node);
        break;
      }
    }

    if (!clickedNode && !e.shiftKey) {
      this.nodes.forEach(n => n.selected = false);
      this.selectedNode = null;
      this.updatePropertiesPanel(null);
    }
  }

  async updatePropertiesPanel(node) {
    const container = document.getElementById('properties-panel');
    if (!container) return;

    if (!node) {
      container.innerHTML = '<p class="empty-message">Select a node to view properties</p>';
      return;
    }

    container.innerHTML = `<div class="node-props-header">
      <h4>${node.type}</h4>
      <span class="node-id">${node.id}</span>
    </div>`;

    try {
      // Add preset selector if presets are available for this node type
      const presets = this.getPresetsForNode(node.type);
      if (presets && presets.length > 0) {
        const presetSection = document.createElement('div');
        presetSection.className = 'preset-section';
        
        const presetLabel = document.createElement('label');
        presetLabel.textContent = '🎨 Presets';
        presetLabel.className = 'preset-label';
        
        const presetSelect = document.createElement('select');
        presetSelect.className = 'preset-select';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select Preset --';
        presetSelect.appendChild(defaultOption);
        
        presets.forEach((preset, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `${preset.name} - ${preset.description}`;
          presetSelect.appendChild(option);
        });
        
        presetSelect.addEventListener('change', async (e) => {
          if (e.target.value !== '') {
            const preset = presets[parseInt(e.target.value)];
            await this.applyPresetToNode(node, preset);
            // Refresh the properties panel to show updated values
            this.updatePropertiesPanel(node);
          }
        });
        
        presetSection.appendChild(presetLabel);
        presetSection.appendChild(presetSelect);
        container.appendChild(presetSection);
      }

      // Fetch full properties from core via IPC
      const props = await window.ragevfxAPI.getNodeProperties(node.id);
      if (!props) return;

      const paramsList = document.createElement('div');
      paramsList.className = 'params-list';

      for (const [key, value] of props.parameters) {
        const row = document.createElement('div');
        row.className = 'param-row';

        const label = document.createElement('label');
        label.textContent = key;

        let input;
        if (typeof value === 'number') {
          input = document.createElement('input');
          input.type = 'range';
          input.min = 0;
          input.max = value > 100 ? value * 2 : 100;
          input.step = 0.01;
          input.value = value;

          const valueDisplay = document.createElement('span');
          valueDisplay.className = 'param-value';
          valueDisplay.textContent = value.toFixed(2);

          input.addEventListener('input', (e) => {
            const newVal = parseFloat(e.target.value);
            valueDisplay.textContent = newVal.toFixed(2);
            window.ragevfxAPI.updateNodeParameter(node.id, key, newVal);
          });

          // Add keyframe button for numeric parameters
          const keyframeBtn = document.createElement('button');
          keyframeBtn.className = 'keyframe-btn';
          keyframeBtn.textContent = '◆';
          keyframeBtn.title = 'Add Keyframe';
          keyframeBtn.addEventListener('click', async () => {
            const currentFrame = parseInt(document.getElementById('timeline-start').value) || 1;
            await window.ragevfxAPI.addKeyframe(node.id, key, currentFrame, parseFloat(input.value), 'smooth');
            keyframeBtn.classList.add('has-keyframe');
            document.getElementById('status-text').textContent = `Keyframe added for ${key} at frame ${currentFrame}`;
          });

          row.appendChild(label);
          row.appendChild(input);
          row.appendChild(valueDisplay);
          row.appendChild(keyframeBtn);
        } else if (typeof value === 'object' && value !== null) {
          // Handle color objects
          const valueStr = JSON.stringify(value);
          input = document.createElement('input');
          input.type = 'text';
          input.value = valueStr;
          input.addEventListener('change', (e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              window.ragevfxAPI.updateNodeParameter(node.id, key, parsed);
            } catch (err) {
              console.error('Invalid JSON:', err);
            }
          });
          row.appendChild(label);
          row.appendChild(input);
        } else {
          input = document.createElement('input');
          input.type = 'text';
          input.value = value;
          input.addEventListener('change', (e) => {
            window.ragevfxAPI.updateNodeParameter(node.id, key, e.target.value);
          });
          row.appendChild(label);
          row.appendChild(input);
        }

        paramsList.appendChild(row);
      }

      container.appendChild(paramsList);

      // Add Group button if multiple nodes selected
      const selectedNodes = this.nodes.filter(n => n.selected);
      if (selectedNodes.length > 1) {
        const groupBtn = document.createElement('button');
        groupBtn.className = 'tool-btn primary group-btn';
        groupBtn.textContent = '📦 Group Selected';
        groupBtn.addEventListener('click', () => this.groupSelectedNodes());
        container.appendChild(groupBtn);
      }

    } catch (err) {
      console.error('Failed to load node properties:', err);
    }
  }

  // Get presets for a specific node type
  getPresetsForNode(nodeType) {
    // Preset definitions for various node types
    const presets = {
      Fire: [
        {
          name: 'Campfire',
          description: 'Small, warm campfire',
          parameters: { intensity: 0.8, speed: 0.6, turbulence: 1.5, scale: 0.008, height_falloff: 0.8 }
        },
        {
          name: 'Explosion',
          description: 'Intense explosion fire',
          parameters: { intensity: 1.5, speed: 3.0, turbulence: 4.0, scale: 0.003, height_falloff: 0.4 }
        },
        {
          name: 'Dragon Fire',
          description: 'Magical blue-tinted fire',
          parameters: { intensity: 1.2, speed: 1.5, turbulence: 3.0, scale: 0.004, height_falloff: 0.6 }
        },
        {
          name: 'Torch',
          description: 'Medieval torch flame',
          parameters: { intensity: 0.9, speed: 0.8, turbulence: 2.0, scale: 0.007, height_falloff: 0.75 }
        }
      ],
      Clouds: [
        {
          name: 'Cumulus',
          description: 'Puffy white clouds',
          parameters: { coverage: 0.5, scale: 0.003, speed: 0.2, layers: 3, fluffiness: 0.6, type: 'cumulus' }
        },
        {
          name: 'Storm Clouds',
          description: 'Dark storm clouds',
          parameters: { coverage: 0.8, scale: 0.002, speed: 1.5, layers: 4, fluffiness: 0.8, type: 'cumulus' }
        },
        {
          name: 'Wispy Cirrus',
          description: 'High-altitude thin clouds',
          parameters: { coverage: 0.3, scale: 0.001, speed: 2.0, layers: 2, fluffiness: 0.3, type: 'cirrus' }
        }
      ],
      Water: [
        {
          name: 'Ocean Surface',
          description: 'Calm ocean waves',
          parameters: { waveHeight: 0.5, waveSpeed: 0.8, waveFrequency: 2.0, turbulence: 1.0 }
        },
        {
          name: 'Storm Waves',
          description: 'Rough ocean during storm',
          parameters: { waveHeight: 2.5, waveSpeed: 2.0, waveFrequency: 4.0, turbulence: 3.5 }
        }
      ],
      Smoke: [
        {
          name: 'Cigarette Smoke',
          description: 'Thin wispy smoke',
          parameters: { density: 0.3, rise_speed: 0.5, turbulence: 1.5, dissipation: 0.8 }
        },
        {
          name: 'Industrial Smoke',
          description: 'Heavy black emissions',
          parameters: { density: 1.2, rise_speed: 0.8, turbulence: 2.5, dissipation: 0.3 }
        }
      ],
      Explosion: [
        {
          name: 'Small Blast',
          description: 'Grenade explosion',
          parameters: { size: 1.0, speed: 1.5, shockwave: 0.8, fire_intensity: 1.0 }
        },
        {
          name: 'Car Explosion',
          description: 'Vehicle explosion',
          parameters: { size: 3.0, speed: 1.2, shockwave: 1.5, fire_intensity: 1.5 }
        }
      ]
    };
    
    return presets[nodeType] || [];
  }

  // Apply preset to node
  async applyPresetToNode(node, preset) {
    if (!preset || !preset.parameters) return;
    
    for (const [key, value] of Object.entries(preset.parameters)) {
      await window.ragevfxAPI.updateNodeParameter(node.id, key, value);
    }
    
    document.getElementById('status-text').textContent = `Applied preset: ${preset.name}`;
  }

  async groupSelectedNodes() {
    const selectedIds = this.nodes.filter(n => n.selected).map(n => n.id);
    if (selectedIds.length < 2) return;

    const groupName = prompt('Enter Group Name:', 'Macro Group');
    if (!groupName) return;

    try {
      const groupId = await window.ragevfxAPI.groupNodes(selectedIds, groupName);
      if (groupId) {
        // Refresh graph from core (simplified reload for now)
        this.clear();
        // In a real app we'd fetch the whole graph state here
        alert('Nodes grouped successfully. (Graph refresh pending full implementation)');
      }
    } catch (err) {
      alert('Grouping failed: ' + err.message);
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
    
    // Handle backdrop rendering differently
    if (node.isBackdrop) {
      const { x, y, width, height, color, name } = node;
      
      // Draw backdrop background
      ctx.fillStyle = color || '#2a2a3e';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1.0;
      
      // Draw backdrop border
      ctx.strokeStyle = color || '#2a2a3e';
      ctx.lineWidth = 2 / this.scale;
      ctx.strokeRect(x, y, width, height);
      
      // Draw backdrop name
      ctx.fillStyle = '#ffffff';
      ctx.font = `${16 / this.scale}px Arial`;
      ctx.fillText(name || 'Backdrop', x + 10, y + 20);
      
      return;
    }
    
    // Normal node rendering
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

    // Draw node background
    const nodeHeight = node.collapsed ? 36 : height;

    // Node shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, width, nodeHeight, 10);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Node background with gradient
    const bgGradient = ctx.createLinearGradient(x, y, x, y + nodeHeight);
    bgGradient.addColorStop(0, disabled ? '#1a1a1a' : '#2e2e2e');
    bgGradient.addColorStop(1, disabled ? '#151515' : '#252525');
    ctx.fillStyle = bgGradient;

    // Border
    ctx.strokeStyle = selected ? '#ffffff' : (isHovered ? nodeColor.primary : '#444444');
    ctx.lineWidth = selected ? 3 / this.scale : 1.5 / this.scale;

    ctx.beginPath();
    ctx.roundRect(x, y, width, nodeHeight, 10);
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

    // Draw sockets (skip if collapsed)
    if (!node.collapsed) {
      this.drawSockets(node);
    } else {
      ctx.fillStyle = '#888888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Collapsed (Double Click to Expand)', x + width / 2, y + 50);
    }
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

  const canvas2d = document.getElementById('node-canvas');
  const container3d = document.getElementById('node-canvas-3d');

  document.getElementById('view-2d-btn').addEventListener('click', () => {
    canvas2d.style.display = 'block';
    container3d.style.display = 'none';
    document.getElementById('view-2d-btn').classList.add('active');
    document.getElementById('view-3d-btn').classList.remove('active');
  });

  document.getElementById('view-3d-btn').addEventListener('click', () => {
    canvas2d.style.display = 'none';
    container3d.style.display = 'block';
    document.getElementById('view-3d-btn').classList.add('active');
    document.getElementById('view-2d-btn').classList.remove('active');

    // Initialize or refresh 3D view
    if (!window.nodeGraph3D) {
      // Assuming NodeGraph3D is available via global or handled by bundler
      // For this demo, we'll just show a status update
      document.getElementById('status-text').textContent = '3D View initialized';
    }
  });

  // Camera controls
  document.getElementById('create-camera-btn').addEventListener('click', () => {
    const x = 100;
    const y = 100;
    graphUI.createNode('Camera', x, y);
    document.getElementById('status-text').textContent = 'Camera node created';
  });

  document.getElementById('look-through-camera-btn').addEventListener('click', () => {
    const cameraNodes = graphUI.nodes.filter(n => n.type === 'Camera');
    if (cameraNodes.length === 0) {
      document.getElementById('status-text').textContent = 'No camera nodes found. Create a camera first.';
      return;
    }
    
    if (cameraNodes.length === 1) {
      document.getElementById('status-text').textContent = `Looking through ${cameraNodes[0].id}`;
    } else {
      // If multiple cameras, use selected one or show message
      const selectedCamera = cameraNodes.find(n => n.selected);
      if (selectedCamera) {
        document.getElementById('status-text').textContent = `Looking through ${selectedCamera.id}`;
      } else {
        document.getElementById('status-text').textContent = `Multiple cameras found (${cameraNodes.length}). Select one and try again.`;
      }
    }
  });

  // Backdrop creation
  document.getElementById('create-backdrop-btn').addEventListener('click', () => {
    const selectedNodes = graphUI.nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      alert('Select nodes first to create a backdrop around them.');
      return;
    }
    
    const backdropName = prompt('Enter backdrop name:', 'Backdrop');
    if (!backdropName) return;
    
    const backdropColor = prompt('Enter backdrop color (hex):', '#2a2a3e');
    
    // Calculate bounding box of selected nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedNodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });
    
    // Add padding
    const padding = 40;
    const backdrop = {
      id: `backdrop_${Date.now()}`,
      name: backdropName,
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
      color: backdropColor,
      isBackdrop: true
    };
    
    // Add to beginning of nodes array so it renders behind
    graphUI.nodes.unshift(backdrop);
    graphUI.render();
    document.getElementById('status-text').textContent = `Backdrop "${backdropName}" created`;
  });

  // Viewport controls
  document.getElementById('refresh-viewport-btn').addEventListener('click', () => {
    document.getElementById('status-text').textContent = 'Viewport refreshed';
  });

  document.getElementById('clear-viewport-btn').addEventListener('click', () => {
    const previewCanvas = document.getElementById('preview-canvas');
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    document.getElementById('status-text').textContent = 'Viewport cleared';
  });

  document.getElementById('fullscreen-viewport-btn').addEventListener('click', () => {
    const viewport = document.querySelector('.viewport');
    if (viewport.requestFullscreen) {
      viewport.requestFullscreen();
    }
  });

  // Timeline controls
  let isPlaying = false;
  let playbackInterval = null;

  document.getElementById('timeline-apply-btn').addEventListener('click', async () => {
    const start = parseInt(document.getElementById('timeline-start').value);
    const end = parseInt(document.getElementById('timeline-end').value);
    const fps = parseInt(document.getElementById('timeline-fps').value);
    
    await window.ragevfxAPI.setTimelineRange(start, end, fps);
    document.getElementById('status-text').textContent = `Timeline: ${start}-${end} @ ${fps}fps`;
  });

  // Add playback controls to timeline
  const timelineControls = document.querySelector('.timeline-controls');
  
  const playBtn = document.createElement('button');
  playBtn.className = 'icon-btn';
  playBtn.id = 'timeline-play-btn';
  playBtn.textContent = '▶️';
  playBtn.title = 'Play/Pause';
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
    
    if (isPlaying) {
      const fps = parseInt(document.getElementById('timeline-fps').value) || 24;
      const frameTime = 1000 / fps;
      const start = parseInt(document.getElementById('timeline-start').value);
      const end = parseInt(document.getElementById('timeline-end').value);
      let currentFrame = start;
      
      playbackInterval = setInterval(async () => {
        currentFrame++;
        if (currentFrame > end) {
          currentFrame = start;
        }
        
        document.getElementById('timeline-start').value = currentFrame;
        await window.ragevfxAPI.setCurrentFrame(currentFrame);
        document.getElementById('status-text').textContent = `Playing... Frame: ${currentFrame}`;
      }, frameTime);
    } else {
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
      document.getElementById('status-text').textContent = 'Playback paused';
    }
  });
  
  const stopBtn = document.createElement('button');
  stopBtn.className = 'icon-btn';
  stopBtn.id = 'timeline-stop-btn';
  stopBtn.textContent = '⏹️';
  stopBtn.title = 'Stop';
  stopBtn.addEventListener('click', () => {
    isPlaying = false;
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    playBtn.textContent = '▶️';
    const start = parseInt(document.getElementById('timeline-start').value);
    document.getElementById('timeline-start').value = start;
    document.getElementById('status-text').textContent = 'Playback stopped';
  });
  
  timelineControls.appendChild(playBtn);
  timelineControls.appendChild(stopBtn);

  // Lighting and grid toggles
  document.getElementById('show-lighting-toggle').addEventListener('change', (e) => {
    document.getElementById('status-text').textContent = `Lighting ${e.target.checked ? 'enabled' : 'disabled'}`;
  });

  document.getElementById('show-grid-toggle').addEventListener('change', (e) => {
    document.getElementById('status-text').textContent = `Grid ${e.target.checked ? 'enabled' : 'disabled'}`;
  });

  // Track management
  async function updateTracksPanel() {
    const tracksPanel = document.getElementById('tracks-panel');
    if (!tracksPanel) return;

    const keyframesData = await window.ragevfxAPI.getKeyframes();
    if (!keyframesData || !keyframesData.tracks || keyframesData.tracks.length === 0) {
      tracksPanel.innerHTML = '<p class="empty-message">No animation tracks. Add keyframes to create tracks.</p>';
      return;
    }

    tracksPanel.innerHTML = '';
    
    keyframesData.tracks.forEach(track => {
      const trackItem = document.createElement('div');
      trackItem.className = 'track-item';
      
      const trackHeader = document.createElement('div');
      trackHeader.className = 'track-header';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = track.enabled !== false;
      checkbox.addEventListener('change', (e) => {
        // Toggle track enabled state
        document.getElementById('status-text').textContent = `Track ${track.nodeId}.${track.parameterKey} ${e.target.checked ? 'enabled' : 'disabled'}`;
      });
      
      const trackLabel = document.createElement('span');
      trackLabel.className = 'track-label';
      trackLabel.textContent = `${track.nodeId.substring(0, 15)}... | ${track.parameterKey}`;
      trackLabel.title = `${track.nodeId} - ${track.parameterKey}`;
      
      const keyframeCount = document.createElement('span');
      keyframeCount.className = 'keyframe-count';
      keyframeCount.textContent = `${track.keyframes.length} keys`;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'icon-btn small';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove Track';
      removeBtn.addEventListener('click', async () => {
        // Remove all keyframes for this track
        for (const kf of track.keyframes) {
          await window.ragevfxAPI.removeKeyframe(track.nodeId, track.parameterKey, kf.frame);
        }
        updateTracksPanel();
        document.getElementById('status-text').textContent = `Track removed: ${track.parameterKey}`;
      });
      
      trackHeader.appendChild(checkbox);
      trackHeader.appendChild(trackLabel);
      trackHeader.appendChild(keyframeCount);
      trackHeader.appendChild(removeBtn);
      
      // Show keyframes list
      const keyframesList = document.createElement('div');
      keyframesList.className = 'keyframes-list';
      track.keyframes.forEach(kf => {
        const kfItem = document.createElement('div');
        kfItem.className = 'keyframe-item';
        kfItem.textContent = `Frame ${kf.frame}: ${typeof kf.value === 'number' ? kf.value.toFixed(2) : JSON.stringify(kf.value)}`;
        kfItem.title = `Interpolation: ${kf.interpolation}`;
        keyframesList.appendChild(kfItem);
      });
      
      trackItem.appendChild(trackHeader);
      trackItem.appendChild(keyframesList);
      tracksPanel.appendChild(trackItem);
    });
  }

  document.getElementById('add-track-btn').addEventListener('click', () => {
    document.getElementById('status-text').textContent = 'To add a track, select a node and click the keyframe button (◆) next to a parameter.';
  });

  document.getElementById('clear-tracks-btn').addEventListener('click', async () => {
    if (confirm('Clear all animation tracks and keyframes?')) {
      const keyframesData = await window.ragevfxAPI.getKeyframes();
      if (keyframesData && keyframesData.tracks) {
        for (const track of keyframesData.tracks) {
          for (const kf of track.keyframes) {
            await window.ragevfxAPI.removeKeyframe(track.nodeId, track.parameterKey, kf.frame);
          }
        }
      }
      updateTracksPanel();
      document.getElementById('status-text').textContent = 'All tracks cleared';
    }
  });

  // Update tracks panel periodically
  setInterval(updateTracksPanel, 2000);

  // Expose for debugging
  window.graphUI = graphUI;
});
