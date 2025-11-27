/**
 * CrowdSimNode - Houdini-Style Crowd Simulation
 * 
 * Large-scale crowd simulation with agent-based behavior,
 * state machines, and terrain adaptation like Houdini Crowds.
 */

import { Node, DataType } from '../core/Node';

// Agent state definition
interface AgentState {
  name: string;
  animation: string;
  speed: number;
  turnRate: number;
  conditions: StateCondition[];
  transitions: StateTransition[];
}

interface StateCondition {
  type: 'time' | 'distance' | 'random' | 'custom';
  value: number;
  comparison: 'gt' | 'lt' | 'eq';
}

interface StateTransition {
  toState: string;
  probability: number;
  blendTime: number;
}

// Individual agent instance
interface Agent {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  heading: number; // Radians
  state: string;
  stateTime: number;
  targetPosition: [number, number, number] | null;
  groupId: number;
  scale: number;
  variant: number;
  animationOffset: number;
  avoidanceForce: [number, number, number];
  isActive: boolean;
}

// Agent type/class definition
interface AgentType {
  name: string;
  states: Map<string, AgentState>;
  defaultState: string;
  radius: number;
  mass: number;
  maxSpeed: number;
  maxForce: number;
  sightRadius: number;
  separationWeight: number;
  cohesionWeight: number;
  alignmentWeight: number;
}

// Terrain data for navigation
interface TerrainData {
  heightmap: Float32Array | null;
  width: number;
  height: number;
  worldSize: number;
  obstacles: { x: number; z: number; radius: number }[];
}

// Flow field for directing crowds
interface FlowField {
  data: Float32Array; // dx, dz per cell
  width: number;
  height: number;
  cellSize: number;
  origin: [number, number];
}

export class CrowdSimNode extends Node {
  private agents: Agent[] = [];
  private agentTypes: Map<string, AgentType> = new Map();
  private terrain: TerrainData;
  private flowField: FlowField | null = null;
  private time: number = 0;
  private frameCount: number = 0;

  constructor(id: string) {
    super(id, 'CrowdSim', 'Crowd Simulation');
    this.metadata.category = 'Physics';
    this.metadata.description = 'Houdini-style large-scale crowd simulation with agent behaviors';
    this.metadata.version = '3.0.0';

    // Inputs
    this.addInput('terrain', 'Terrain Data', DataType.ANY);
    this.addInput('flowField', 'Flow Field', DataType.ANY);
    this.addInput('spawnPoints', 'Spawn Points', DataType.ANY);
    this.addInput('goals', 'Goal Positions', DataType.ANY);
    this.addInput('obstacles', 'Obstacles', DataType.ANY);

    // Outputs
    this.addOutput('agentData', 'Agent Data', DataType.ANY);
    this.addOutput('visualization', 'Visualization', DataType.IMAGE);
    this.addOutput('instanceData', 'Instance Matrices', DataType.ANY);
    this.addOutput('statistics', 'Simulation Stats', DataType.ANY);

    // Simulation parameters
    this.setParameter('agentCount', 1000);
    this.setParameter('simulationSpeed', 1.0);
    this.setParameter('timeStep', 0.016); // ~60fps
    this.setParameter('substeps', 2);

    // Agent parameters
    this.setParameter('defaultAgentType', 'pedestrian');
    this.setParameter('agentRadius', 0.5);
    this.setParameter('maxSpeed', 1.5);
    this.setParameter('maxForce', 3.0);
    this.setParameter('sightRadius', 10);

    // Steering behaviors
    this.setParameter('enableSeparation', true);
    this.setParameter('separationWeight', 1.5);
    this.setParameter('separationRadius', 2);

    this.setParameter('enableCohesion', false);
    this.setParameter('cohesionWeight', 1.0);

    this.setParameter('enableAlignment', true);
    this.setParameter('alignmentWeight', 0.5);

    this.setParameter('enableGoalSeeking', true);
    this.setParameter('goalSeekingWeight', 1.0);

    this.setParameter('enableObstacleAvoidance', true);
    this.setParameter('obstacleAvoidanceWeight', 2.0);
    this.setParameter('obstacleAvoidanceRadius', 3);

    // Terrain adaptation
    this.setParameter('enableTerrainFollow', true);
    this.setParameter('slopeLimit', 0.7); // Max slope agents can climb
    this.setParameter('orientToTerrain', true);

    // Variation
    this.setParameter('speedVariation', 0.2);
    this.setParameter('scaleVariation', 0.2);
    this.setParameter('variantCount', 4);

    // LOD settings
    this.setParameter('enableLOD', true);
    this.setParameter('lodDistance1', 50);  // Full detail
    this.setParameter('lodDistance2', 100); // Reduced update rate
    this.setParameter('lodDistance3', 200); // Minimal updates

    // Ragdoll/death handling
    this.setParameter('enableRagdoll', false);
    this.setParameter('ragdollTrigger', 'none'); // 'none', 'death', 'collision'

    // Debug visualization
    this.setParameter('showAgents', true);
    this.setParameter('showVelocity', false);
    this.setParameter('showForces', false);
    this.setParameter('showFlowField', false);
    this.setParameter('visualizationSize', 512);

    // Initialize terrain
    this.terrain = {
      heightmap: null,
      width: 256,
      height: 256,
      worldSize: 100,
      obstacles: []
    };

    // Initialize default agent types
    this.initializeDefaultAgentTypes();
  }

  private initializeDefaultAgentTypes(): void {
    // Pedestrian type
    const pedestrian: AgentType = {
      name: 'pedestrian',
      states: new Map(),
      defaultState: 'walking',
      radius: 0.5,
      mass: 70,
      maxSpeed: 1.5,
      maxForce: 3.0,
      sightRadius: 10,
      separationWeight: 1.5,
      cohesionWeight: 0.5,
      alignmentWeight: 0.5
    };

    // Walking state
    pedestrian.states.set('walking', {
      name: 'walking',
      animation: 'walk_cycle',
      speed: 1.5,
      turnRate: 3.0,
      conditions: [],
      transitions: [
        { toState: 'running', probability: 0.05, blendTime: 0.3 },
        { toState: 'idle', probability: 0.02, blendTime: 0.5 }
      ]
    });

    // Running state
    pedestrian.states.set('running', {
      name: 'running',
      animation: 'run_cycle',
      speed: 4.0,
      turnRate: 2.0,
      conditions: [],
      transitions: [
        { toState: 'walking', probability: 0.1, blendTime: 0.3 }
      ]
    });

    // Idle state
    pedestrian.states.set('idle', {
      name: 'idle',
      animation: 'idle',
      speed: 0,
      turnRate: 5.0,
      conditions: [],
      transitions: [
        { toState: 'walking', probability: 0.2, blendTime: 0.5 }
      ]
    });

    this.agentTypes.set('pedestrian', pedestrian);

    // Runner type (faster moving agents)
    const runner: AgentType = {
      name: 'runner',
      states: new Map(),
      defaultState: 'running',
      radius: 0.4,
      mass: 65,
      maxSpeed: 5.0,
      maxForce: 5.0,
      sightRadius: 15,
      separationWeight: 2.0,
      cohesionWeight: 0.3,
      alignmentWeight: 0.3
    };

    runner.states.set('running', {
      name: 'running',
      animation: 'run_fast',
      speed: 5.0,
      turnRate: 2.5,
      conditions: [],
      transitions: []
    });

    this.agentTypes.set('runner', runner);

    // Slow walker type
    const slowWalker: AgentType = {
      name: 'slowWalker',
      states: new Map(),
      defaultState: 'walking',
      radius: 0.6,
      mass: 80,
      maxSpeed: 0.8,
      maxForce: 1.5,
      sightRadius: 8,
      separationWeight: 1.0,
      cohesionWeight: 1.0,
      alignmentWeight: 0.8
    };

    slowWalker.states.set('walking', {
      name: 'walking',
      animation: 'walk_slow',
      speed: 0.8,
      turnRate: 2.0,
      conditions: [],
      transitions: []
    });

    this.agentTypes.set('slowWalker', slowWalker);
  }

  /**
   * Add a custom agent type
   */
  addAgentType(type: AgentType): void {
    this.agentTypes.set(type.name, type);
    this.markDirty();
  }

  /**
   * Spawn agents at specified positions
   */
  spawnAgents(positions: [number, number, number][], typeName: string = 'pedestrian'): void {
    const type = this.agentTypes.get(typeName) || this.agentTypes.get('pedestrian')!;
    const speedVar = this.getParameter('speedVariation') as number;
    const scaleVar = this.getParameter('scaleVariation') as number;
    const variantCount = this.getParameter('variantCount') as number;

    for (const pos of positions) {
      const agent: Agent = {
        id: this.agents.length,
        position: [...pos] as [number, number, number],
        velocity: [0, 0, 0],
        heading: Math.random() * Math.PI * 2,
        state: type.defaultState,
        stateTime: 0,
        targetPosition: null,
        groupId: Math.floor(Math.random() * 10),
        scale: 1 + (Math.random() - 0.5) * scaleVar * 2,
        variant: Math.floor(Math.random() * variantCount),
        animationOffset: Math.random(),
        avoidanceForce: [0, 0, 0],
        isActive: true
      };

      // Apply speed variation
      const state = type.states.get(agent.state);
      if (state) {
        const speedMod = 1 + (Math.random() - 0.5) * speedVar * 2;
        agent.velocity = [
          Math.cos(agent.heading) * state.speed * speedMod * 0.1,
          0,
          Math.sin(agent.heading) * state.speed * speedMod * 0.1
        ];
      }

      this.agents.push(agent);
    }

    this.markDirty();
  }

  /**
   * Spawn agents in a region
   */
  spawnAgentsInRegion(
    center: [number, number, number], 
    size: [number, number], 
    count: number, 
    typeName: string = 'pedestrian'
  ): void {
    const positions: [number, number, number][] = [];

    for (let i = 0; i < count; i++) {
      const x = center[0] + (Math.random() - 0.5) * size[0];
      const z = center[2] + (Math.random() - 0.5) * size[1];
      const y = this.getTerrainHeight(x, z);
      positions.push([x, y, z]);
    }

    this.spawnAgents(positions, typeName);
  }

  /**
   * Set goal position for all agents
   */
  setGlobalGoal(position: [number, number, number]): void {
    for (const agent of this.agents) {
      agent.targetPosition = [...position] as [number, number, number];
    }
    this.markDirty();
  }

  /**
   * Clear all agents
   */
  clearAgents(): void {
    this.agents = [];
    this.frameCount = 0;
    this.time = 0;
    this.markDirty();
  }

  async process(): Promise<void> {
    const dt = this.getParameter('timeStep') as number;
    const simSpeed = this.getParameter('simulationSpeed') as number;
    const substeps = this.getParameter('substeps') as number;

    // Get inputs
    const terrainInput = this.inputs.get('terrain');
    if (terrainInput?.value) {
      this.parseTerrainData(terrainInput.value);
    }

    const flowInput = this.inputs.get('flowField');
    if (flowInput?.value) {
      this.flowField = flowInput.value as FlowField;
    }

    const spawnInput = this.inputs.get('spawnPoints');
    if (spawnInput?.value && this.agents.length === 0) {
      const spawnPoints = spawnInput.value as [number, number, number][];
      const agentCount = this.getParameter('agentCount') as number;
      
      // Distribute agents across spawn points
      const pointsPerSpawn = Math.ceil(agentCount / spawnPoints.length);
      for (const point of spawnPoints) {
        this.spawnAgentsInRegion(point, [10, 10], pointsPerSpawn);
      }
    }

    const goalsInput = this.inputs.get('goals');
    if (goalsInput?.value) {
      const goals = goalsInput.value as [number, number, number][];
      this.assignGoalsToAgents(goals);
    }

    const obstaclesInput = this.inputs.get('obstacles');
    if (obstaclesInput?.value) {
      this.terrain.obstacles = obstaclesInput.value as { x: number; z: number; radius: number }[];
    }

    // Run simulation substeps
    const stepDt = (dt * simSpeed) / substeps;
    for (let step = 0; step < substeps; step++) {
      this.simulateStep(stepDt);
    }

    this.time += dt * simSpeed;
    this.frameCount++;

    // Create outputs
    this.createOutputs();

    this.dirty = false;
  }

  private parseTerrainData(data: unknown): void {
    // Parse terrain data format
    const terrainData = data as TerrainData;
    if (terrainData.heightmap) {
      this.terrain = terrainData;
    }
  }

  private assignGoalsToAgents(goals: [number, number, number][]): void {
    if (goals.length === 0) return;

    for (const agent of this.agents) {
      // Assign nearest goal or random goal
      const goalIdx = agent.id % goals.length;
      agent.targetPosition = [...goals[goalIdx]] as [number, number, number];
    }
  }

  private simulateStep(dt: number): void {
    const enableSeparation = this.getParameter('enableSeparation') as boolean;
    const enableCohesion = this.getParameter('enableCohesion') as boolean;
    const enableAlignment = this.getParameter('enableAlignment') as boolean;
    const enableGoalSeeking = this.getParameter('enableGoalSeeking') as boolean;
    const enableObstacleAvoidance = this.getParameter('enableObstacleAvoidance') as boolean;
    const enableLOD = this.getParameter('enableLOD') as boolean;

    const separationWeight = this.getParameter('separationWeight') as number;
    const cohesionWeight = this.getParameter('cohesionWeight') as number;
    const alignmentWeight = this.getParameter('alignmentWeight') as number;
    const goalWeight = this.getParameter('goalSeekingWeight') as number;
    const obstacleWeight = this.getParameter('obstacleAvoidanceWeight') as number;

    // Build spatial hash for neighbor queries
    const spatialHash = this.buildSpatialHash();

    // Update each agent
    for (const agent of this.agents) {
      if (!agent.isActive) continue;

      const type = this.agentTypes.get('pedestrian')!;
      const state = type.states.get(agent.state);
      if (!state) continue;

      // LOD check
      let updateFrequency = 1;
      if (enableLOD) {
        const camDist = this.getDistanceFromCamera(agent.position);
        const lod1 = this.getParameter('lodDistance1') as number;
        const lod2 = this.getParameter('lodDistance2') as number;
        const lod3 = this.getParameter('lodDistance3') as number;

        if (camDist > lod3) {
          updateFrequency = 8;
        } else if (camDist > lod2) {
          updateFrequency = 4;
        } else if (camDist > lod1) {
          updateFrequency = 2;
        }
      }

      if (this.frameCount % updateFrequency !== 0) continue;

      // Calculate steering forces
      const force: [number, number, number] = [0, 0, 0];

      // Get neighbors
      const neighbors = this.getNeighbors(agent, spatialHash, type.sightRadius);

      // Separation
      if (enableSeparation) {
        const sep = this.calculateSeparation(agent, neighbors, type.radius * 2);
        force[0] += sep[0] * separationWeight;
        force[2] += sep[2] * separationWeight;
      }

      // Cohesion
      if (enableCohesion && neighbors.length > 0) {
        const coh = this.calculateCohesion(agent, neighbors);
        force[0] += coh[0] * cohesionWeight;
        force[2] += coh[2] * cohesionWeight;
      }

      // Alignment
      if (enableAlignment && neighbors.length > 0) {
        const ali = this.calculateAlignment(agent, neighbors);
        force[0] += ali[0] * alignmentWeight;
        force[2] += ali[2] * alignmentWeight;
      }

      // Goal seeking
      if (enableGoalSeeking && agent.targetPosition) {
        const goal = this.calculateGoalSeeking(agent, type.maxSpeed);
        force[0] += goal[0] * goalWeight;
        force[2] += goal[2] * goalWeight;
      }

      // Flow field
      if (this.flowField) {
        const flow = this.sampleFlowField(agent.position);
        force[0] += flow[0] * goalWeight;
        force[2] += flow[1] * goalWeight;
      }

      // Obstacle avoidance
      if (enableObstacleAvoidance) {
        const obs = this.calculateObstacleAvoidance(agent, type.sightRadius);
        force[0] += obs[0] * obstacleWeight;
        force[2] += obs[2] * obstacleWeight;
      }

      // Limit force
      const forceMag = Math.sqrt(force[0] * force[0] + force[2] * force[2]);
      if (forceMag > type.maxForce) {
        force[0] = (force[0] / forceMag) * type.maxForce;
        force[2] = (force[2] / forceMag) * type.maxForce;
      }

      // Apply force to velocity
      agent.velocity[0] += force[0] * dt;
      agent.velocity[2] += force[2] * dt;

      // Limit speed
      const speed = Math.sqrt(agent.velocity[0] ** 2 + agent.velocity[2] ** 2);
      const maxSpeed = state.speed;
      if (speed > maxSpeed) {
        agent.velocity[0] = (agent.velocity[0] / speed) * maxSpeed;
        agent.velocity[2] = (agent.velocity[2] / speed) * maxSpeed;
      }

      // Update position
      agent.position[0] += agent.velocity[0] * dt;
      agent.position[2] += agent.velocity[2] * dt;

      // Update terrain height
      if (this.getParameter('enableTerrainFollow')) {
        agent.position[1] = this.getTerrainHeight(agent.position[0], agent.position[2]);
      }

      // Update heading
      if (speed > 0.1) {
        const targetHeading = Math.atan2(agent.velocity[2], agent.velocity[0]);
        const headingDiff = this.wrapAngle(targetHeading - agent.heading);
        const turnAmount = Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), state.turnRate * dt);
        agent.heading = this.wrapAngle(agent.heading + turnAmount);
      }

      // Update state
      agent.stateTime += dt;
      this.updateAgentState(agent, type);
    }
  }

  private buildSpatialHash(): Map<string, Agent[]> {
    const hash = new Map<string, Agent[]>();
    const cellSize = 5;

    for (const agent of this.agents) {
      if (!agent.isActive) continue;
      
      const cellX = Math.floor(agent.position[0] / cellSize);
      const cellZ = Math.floor(agent.position[2] / cellSize);
      const key = `${cellX},${cellZ}`;

      if (!hash.has(key)) {
        hash.set(key, []);
      }
      hash.get(key)!.push(agent);
    }

    return hash;
  }

  private getNeighbors(agent: Agent, hash: Map<string, Agent[]>, radius: number): Agent[] {
    const neighbors: Agent[] = [];
    const cellSize = 5;
    const cellRadius = Math.ceil(radius / cellSize);

    const centerX = Math.floor(agent.position[0] / cellSize);
    const centerZ = Math.floor(agent.position[2] / cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${centerX + dx},${centerZ + dz}`;
        const cell = hash.get(key);
        
        if (cell) {
          for (const other of cell) {
            if (other.id === agent.id) continue;
            
            const dist = this.distance(agent.position, other.position);
            if (dist < radius) {
              neighbors.push(other);
            }
          }
        }
      }
    }

    return neighbors;
  }

  private calculateSeparation(agent: Agent, neighbors: Agent[], desiredSeparation: number): [number, number, number] {
    const steer: [number, number, number] = [0, 0, 0];
    let count = 0;

    for (const other of neighbors) {
      const dist = this.distance(agent.position, other.position);
      
      if (dist > 0 && dist < desiredSeparation) {
        const diff: [number, number, number] = [
          agent.position[0] - other.position[0],
          0,
          agent.position[2] - other.position[2]
        ];
        
        // Weight by distance (closer = stronger)
        const weight = 1 / dist;
        steer[0] += diff[0] * weight;
        steer[2] += diff[2] * weight;
        count++;
      }
    }

    if (count > 0) {
      steer[0] /= count;
      steer[2] /= count;
      
      // Normalize
      const len = Math.sqrt(steer[0] ** 2 + steer[2] ** 2);
      if (len > 0) {
        steer[0] /= len;
        steer[2] /= len;
      }
    }

    return steer;
  }

  private calculateCohesion(agent: Agent, neighbors: Agent[]): [number, number, number] {
    const center: [number, number, number] = [0, 0, 0];

    for (const other of neighbors) {
      center[0] += other.position[0];
      center[2] += other.position[2];
    }

    center[0] /= neighbors.length;
    center[2] /= neighbors.length;

    // Steer towards center
    const steer: [number, number, number] = [
      center[0] - agent.position[0],
      0,
      center[2] - agent.position[2]
    ];

    const len = Math.sqrt(steer[0] ** 2 + steer[2] ** 2);
    if (len > 0) {
      steer[0] /= len;
      steer[2] /= len;
    }

    return steer;
  }

  private calculateAlignment(agent: Agent, neighbors: Agent[]): [number, number, number] {
    const avgVelocity: [number, number, number] = [0, 0, 0];

    for (const other of neighbors) {
      avgVelocity[0] += other.velocity[0];
      avgVelocity[2] += other.velocity[2];
    }

    avgVelocity[0] /= neighbors.length;
    avgVelocity[2] /= neighbors.length;

    // Steer towards average velocity
    const steer: [number, number, number] = [
      avgVelocity[0] - agent.velocity[0],
      0,
      avgVelocity[2] - agent.velocity[2]
    ];

    const len = Math.sqrt(steer[0] ** 2 + steer[2] ** 2);
    if (len > 0) {
      steer[0] /= len;
      steer[2] /= len;
    }

    return steer;
  }

  private calculateGoalSeeking(agent: Agent, maxSpeed: number): [number, number, number] {
    if (!agent.targetPosition) return [0, 0, 0];

    const desired: [number, number, number] = [
      agent.targetPosition[0] - agent.position[0],
      0,
      agent.targetPosition[2] - agent.position[2]
    ];

    const dist = Math.sqrt(desired[0] ** 2 + desired[2] ** 2);
    
    if (dist < 1) {
      // Arrived - clear goal or set new one
      return [0, 0, 0];
    }

    // Normalize and scale to max speed
    desired[0] = (desired[0] / dist) * maxSpeed;
    desired[2] = (desired[2] / dist) * maxSpeed;

    // Steering = desired - current
    return [
      desired[0] - agent.velocity[0],
      0,
      desired[2] - agent.velocity[2]
    ];
  }

  private calculateObstacleAvoidance(agent: Agent, lookAhead: number): [number, number, number] {
    const steer: [number, number, number] = [0, 0, 0];
    const avoidRadius = this.getParameter('obstacleAvoidanceRadius') as number;

    // Check ray ahead
    const speed = Math.sqrt(agent.velocity[0] ** 2 + agent.velocity[2] ** 2);
    if (speed < 0.1) return steer;

    const ahead: [number, number] = [
      agent.position[0] + (agent.velocity[0] / speed) * lookAhead,
      agent.position[2] + (agent.velocity[2] / speed) * lookAhead
    ];

    // Check against obstacles
    for (const obstacle of this.terrain.obstacles) {
      const dist = Math.sqrt((ahead[0] - obstacle.x) ** 2 + (ahead[1] - obstacle.z) ** 2);
      
      if (dist < obstacle.radius + avoidRadius) {
        // Steer away from obstacle
        const away: [number, number, number] = [
          agent.position[0] - obstacle.x,
          0,
          agent.position[2] - obstacle.z
        ];
        
        const len = Math.sqrt(away[0] ** 2 + away[2] ** 2);
        if (len > 0) {
          steer[0] += away[0] / len;
          steer[2] += away[2] / len;
        }
      }
    }

    // Check terrain slope
    if (this.terrain.heightmap) {
      const slopeLimit = this.getParameter('slopeLimit') as number;
      const slope = this.getTerrainSlope(ahead[0], ahead[1]);
      
      if (slope > slopeLimit) {
        // Turn away from steep slope
        const normal = this.getTerrainNormal(ahead[0], ahead[1]);
        steer[0] += normal[0];
        steer[2] += normal[2];
      }
    }

    return steer;
  }

  private sampleFlowField(position: [number, number, number]): [number, number] {
    if (!this.flowField) return [0, 0];

    const localX = (position[0] - this.flowField.origin[0]) / this.flowField.cellSize;
    const localZ = (position[2] - this.flowField.origin[1]) / this.flowField.cellSize;

    const cellX = Math.floor(localX);
    const cellZ = Math.floor(localZ);

    if (cellX < 0 || cellX >= this.flowField.width - 1 ||
        cellZ < 0 || cellZ >= this.flowField.height - 1) {
      return [0, 0];
    }

    // Bilinear interpolation
    const fx = localX - cellX;
    const fz = localZ - cellZ;

    const idx00 = (cellZ * this.flowField.width + cellX) * 2;
    const idx10 = (cellZ * this.flowField.width + cellX + 1) * 2;
    const idx01 = ((cellZ + 1) * this.flowField.width + cellX) * 2;
    const idx11 = ((cellZ + 1) * this.flowField.width + cellX + 1) * 2;

    const dx = this.flowField.data[idx00] * (1 - fx) * (1 - fz) +
               this.flowField.data[idx10] * fx * (1 - fz) +
               this.flowField.data[idx01] * (1 - fx) * fz +
               this.flowField.data[idx11] * fx * fz;

    const dz = this.flowField.data[idx00 + 1] * (1 - fx) * (1 - fz) +
               this.flowField.data[idx10 + 1] * fx * (1 - fz) +
               this.flowField.data[idx01 + 1] * (1 - fx) * fz +
               this.flowField.data[idx11 + 1] * fx * fz;

    return [dx, dz];
  }

  private getTerrainHeight(x: number, z: number): number {
    if (!this.terrain.heightmap) return 0;

    const nx = (x / this.terrain.worldSize + 0.5) * this.terrain.width;
    const nz = (z / this.terrain.worldSize + 0.5) * this.terrain.height;

    const ix = Math.floor(nx);
    const iz = Math.floor(nz);

    if (ix < 0 || ix >= this.terrain.width - 1 ||
        iz < 0 || iz >= this.terrain.height - 1) {
      return 0;
    }

    const fx = nx - ix;
    const fz = nz - iz;

    const h00 = this.terrain.heightmap[iz * this.terrain.width + ix];
    const h10 = this.terrain.heightmap[iz * this.terrain.width + ix + 1];
    const h01 = this.terrain.heightmap[(iz + 1) * this.terrain.width + ix];
    const h11 = this.terrain.heightmap[(iz + 1) * this.terrain.width + ix + 1];

    return (h00 * (1 - fx) + h10 * fx) * (1 - fz) + (h01 * (1 - fx) + h11 * fx) * fz;
  }

  private getTerrainSlope(_x: number, _z: number): number {
    // Simplified slope calculation
    return 0;
  }

  private getTerrainNormal(_x: number, _z: number): [number, number, number] {
    // Simplified normal calculation
    return [0, 1, 0];
  }

  private updateAgentState(agent: Agent, type: AgentType): void {
    const currentState = type.states.get(agent.state);
    if (!currentState) return;

    // Check transitions
    for (const transition of currentState.transitions) {
      if (Math.random() < transition.probability * 0.016) { // Per-frame probability
        agent.state = transition.toState;
        agent.stateTime = 0;
        break;
      }
    }
  }

  private getDistanceFromCamera(_position: [number, number, number]): number {
    // Simplified - would use actual camera position
    return 50;
  }

  private distance(a: [number, number, number], b: [number, number, number]): number {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  }

  private wrapAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  private createOutputs(): void {
    // Agent data output
    const agentDataOut = this.outputs.get('agentData');
    if (agentDataOut) {
      agentDataOut.value = this.agents.filter(a => a.isActive).map(a => ({
        id: a.id,
        position: a.position,
        heading: a.heading,
        state: a.state,
        scale: a.scale,
        variant: a.variant
      }));
    }

    // Instance matrices for rendering
    const instanceOut = this.outputs.get('instanceData');
    if (instanceOut) {
      instanceOut.value = this.agents.filter(a => a.isActive).map(a => ({
        position: a.position,
        rotation: [0, a.heading, 0],
        scale: [a.scale, a.scale, a.scale]
      }));
    }

    // Statistics
    const statsOut = this.outputs.get('statistics');
    if (statsOut) {
      const activeAgents = this.agents.filter(a => a.isActive);
      let avgSpeed = 0;
      for (const a of activeAgents) {
        avgSpeed += Math.sqrt(a.velocity[0] ** 2 + a.velocity[2] ** 2);
      }
      avgSpeed /= activeAgents.length || 1;

      statsOut.value = {
        totalAgents: this.agents.length,
        activeAgents: activeAgents.length,
        simulationTime: this.time,
        frameCount: this.frameCount,
        averageSpeed: avgSpeed
      };
    }

    // Visualization
    if (this.getParameter('showAgents')) {
      this.createVisualization();
    }
  }

  private createVisualization(): void {
    const size = this.getParameter('visualizationSize') as number;
    const image = new ImageData(size, size);
    const worldSize = this.terrain.worldSize;

    // Clear to dark gray
    for (let i = 0; i < size * size * 4; i += 4) {
      image.data[i] = 40;
      image.data[i + 1] = 40;
      image.data[i + 2] = 40;
      image.data[i + 3] = 255;
    }

    // Draw agents
    for (const agent of this.agents) {
      if (!agent.isActive) continue;

      const x = Math.floor((agent.position[0] / worldSize + 0.5) * size);
      const y = Math.floor((agent.position[2] / worldSize + 0.5) * size);

      if (x >= 0 && x < size && y >= 0 && y < size) {
        const idx = (y * size + x) * 4;
        
        // Color by group
        const hue = (agent.groupId * 36) % 360;
        const rgb = this.hslToRgb(hue / 360, 0.8, 0.6);
        
        image.data[idx] = rgb[0];
        image.data[idx + 1] = rgb[1];
        image.data[idx + 2] = rgb[2];
      }
    }

    // Draw obstacles
    for (const obstacle of this.terrain.obstacles) {
      const cx = Math.floor((obstacle.x / worldSize + 0.5) * size);
      const cy = Math.floor((obstacle.z / worldSize + 0.5) * size);
      const r = Math.floor((obstacle.radius / worldSize) * size);

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx;
            const py = cy + dy;
            if (px >= 0 && px < size && py >= 0 && py < size) {
              const idx = (py * size + px) * 4;
              image.data[idx] = 100;
              image.data[idx + 1] = 100;
              image.data[idx + 2] = 100;
            }
          }
        }
      }
    }

    const visOut = this.outputs.get('visualization');
    if (visOut) visOut.value = image;
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  dispose(): void {
    this.agents = [];
    this.agentTypes.clear();
    this.flowField = null;
    super.dispose();
  }
}
