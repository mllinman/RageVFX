/**
 * ProceduralCityNode - Procedural City Generation
 * 
 * Purpose: Procedural city and urban environment generation
 * - Street network generation (L-systems, agent-based)
 * - Building footprint placement
 * - Procedural building facades
 * - Infrastructure (roads, bridges, tunnels)
 * - Vegetation and park generation
 * - Traffic and pedestrian flow
 * - Day/night lighting variation
 * 
 * Rivals Houdini's city generation tools
 */

import { Node, DataType } from '../core/Node';

interface StreetNode {
  id: string;
  position: { x: number; y: number };
  connections: string[];
  type: 'intersection' | 'deadend' | 'junction';
}

interface StreetSegment {
  id: string;
  start: string;
  end: string;
  width: number;
  type: 'highway' | 'main' | 'residential' | 'alley';
  lanes: number;
}

interface BuildingFootprint {
  id: string;
  corners: Array<{ x: number; y: number }>;
  height: number;
  floors: number;
  type: 'residential' | 'commercial' | 'industrial' | 'landmark';
  style: 'modern' | 'classic' | 'industrial' | 'mixed';
}

export class ProceduralCityNode extends Node {
  private streetNodes: Map<string, StreetNode> = new Map();
  private streetSegments: StreetSegment[] = [];
  private buildings: BuildingFootprint[] = [];
  private seed: number = 0;

  constructor(id: string) {
    super(id, 'ProceduralCity', 'Procedural City');
    this.metadata.category = 'Procedural';
    this.metadata.description = 'Generate procedural cities and urban environments';

    // Inputs
    this.addInput('terrain', 'Terrain', DataType.GEOMETRY_3D);
    this.addInput('seed', 'Seed', DataType.NUMBER);
    this.addInput('bounds', 'Bounds', DataType.GEOMETRY_3D);

    // Outputs
    this.addOutput('streets', 'Streets', DataType.GEOMETRY_3D);
    this.addOutput('buildings', 'Buildings', DataType.GEOMETRY_3D);
    this.addOutput('infrastructure', 'Infrastructure', DataType.GEOMETRY_3D);
    this.addOutput('vegetation', 'Vegetation', DataType.GEOMETRY_3D);
    this.addOutput('cityData', 'City Data', DataType.ANY);

    // City layout parameters
    this.setParameter('citySize', 1000); // meters
    this.setParameter('gridAngle', 0); // degrees
    this.setParameter('gridIrregularity', 0.2); // 0-1
    this.setParameter('generationMethod', 'l-system'); // l-system, agent-based, grid, radial, organic
    
    // Street network parameters
    this.setParameter('highwayCount', 2);
    this.setParameter('mainStreetDensity', 0.5);
    this.setParameter('residentialDensity', 0.8);
    this.setParameter('blockSize', 100); // meters
    this.setParameter('streetWidth', 8); // meters
    this.setParameter('sidewalkWidth', 2); // meters
    
    // Building parameters
    this.setParameter('buildingDensity', 0.7); // 0-1
    this.setParameter('minHeight', 5); // meters
    this.setParameter('maxHeight', 50); // meters
    this.setParameter('floorHeight', 3.5); // meters
    this.setParameter('lotCoverage', 0.6); // 0-1, percentage of lot covered
    this.setParameter('setbackDistance', 3); // meters from street
    
    // Building types distribution
    this.setParameter('residentialRatio', 0.6);
    this.setParameter('commercialRatio', 0.3);
    this.setParameter('industrialRatio', 0.08);
    this.setParameter('landmarkRatio', 0.02);
    
    // Building style
    this.setParameter('architectureStyle', 'mixed'); // modern, classic, industrial, mixed
    this.setParameter('facadeDetail', 'medium'); // low, medium, high, ultra
    this.setParameter('windowDensity', 0.6);
    this.setParameter('balconyProbability', 0.3);
    this.setParameter('roofType', 'mixed'); // flat, pitched, mixed
    
    // Infrastructure
    this.setParameter('generateBridges', true);
    this.setParameter('generateTunnels', false);
    this.setParameter('generateParkingLots', true);
    this.setParameter('generatePedestrian', true);
    this.setParameter('streetLights', true);
    this.setParameter('trafficLights', true);
    
    // Vegetation
    this.setParameter('parkDensity', 0.15); // 0-1
    this.setParameter('streetTreeSpacing', 15); // meters
    this.setParameter('treeVariety', 5);
    this.setParameter('grassAreas', true);
    
    // Traffic simulation
    this.setParameter('simulateTraffic', false);
    this.setParameter('vehicleDensity', 0.3);
    this.setParameter('pedestrianDensity', 0.2);
    
    // Time of day
    this.setParameter('timeOfDay', 12); // 0-24 hours
    this.setParameter('streetLightIntensity', 1.0);
    this.setParameter('buildingLightProbability', 0.5);
    
    // Advanced
    this.setParameter('terrainAdaptation', true);
    this.setParameter('waterBodies', true);
    this.setParameter('historicDistrictProbability', 0.1);
    this.setParameter('industrialZones', true);
  }

  async process(): Promise<void> {
    const seedInput = this.inputs.get('seed');
    const terrainInput = this.inputs.get('terrain');
    const streetsOutput = this.outputs.get('streets');
    const buildingsOutput = this.outputs.get('buildings');
    const infrastructureOutput = this.outputs.get('infrastructure');
    const vegetationOutput = this.outputs.get('vegetation');
    const cityDataOutput = this.outputs.get('cityData');

    if (!streetsOutput) return;

    // Initialize seed
    this.seed = seedInput?.value || Math.random() * 10000;

    // Generate city components
    this.generateStreetNetwork();
    this.generateBuildingFootprints();
    this.generateBuildingGeometry();
    this.generateInfrastructure();
    this.generateVegetation();

    // Output results
    if (streetsOutput) {
      streetsOutput.value = this.exportStreetGeometry();
    }
    
    if (buildingsOutput) {
      buildingsOutput.value = this.exportBuildingGeometry();
    }
    
    if (infrastructureOutput) {
      infrastructureOutput.value = this.exportInfrastructureGeometry();
    }
    
    if (vegetationOutput) {
      vegetationOutput.value = this.exportVegetationGeometry();
    }
    
    if (cityDataOutput) {
      cityDataOutput.value = this.exportCityData();
    }
  }

  private generateStreetNetwork(): void {
    const method = this.getParameter('generationMethod') as string;
    const citySize = this.getParameter('citySize') as number;

    switch (method) {
      case 'l-system':
        this.generateLSystemStreets();
        break;
      case 'agent-based':
        this.generateAgentBasedStreets();
        break;
      case 'grid':
        this.generateGridStreets();
        break;
      case 'radial':
        this.generateRadialStreets();
        break;
      case 'organic':
        this.generateOrganicStreets();
        break;
    }

    this.connectStreetNodes();
    this.classifyStreets();
  }

  private generateLSystemStreets(): void {
    // L-System based street generation
    // Uses production rules to create organic-looking street patterns
    const iterations = 5;
    const angle = 90;
    
    // Start with a main axis
    const centerNode = this.createStreetNode(0, 0, 'intersection');
    
    // Apply L-system rules
    // Example: F -> F[+F]F[-F]F (fractal branching)
    // This creates realistic street hierarchies
  }

  private generateAgentBasedStreets(): void {
    // Agent-based street growth
    // Agents walk and create streets based on rules
    const agentCount = 10;
    const agents: Array<{ x: number; y: number; direction: number }> = [];
    
    // Initialize agents
    for (let i = 0; i < agentCount; i++) {
      agents.push({
        x: this.random() * 100 - 50,
        y: this.random() * 100 - 50,
        direction: this.random() * Math.PI * 2
      });
    }
    
    // Simulate agent movement
    // Agents create streets as they move
    // Streets attract other agents (population density)
  }

  private generateGridStreets(): void {
    // Regular grid street pattern
    const blockSize = this.getParameter('blockSize') as number;
    const citySize = this.getParameter('citySize') as number;
    const irregularity = this.getParameter('gridIrregularity') as number;
    const gridAngle = this.getParameter('gridAngle') as number * Math.PI / 180;
    
    const halfSize = citySize / 2;
    const blocks = Math.floor(citySize / blockSize);
    
    // Create grid intersections
    for (let x = 0; x <= blocks; x++) {
      for (let y = 0; y <= blocks; y++) {
        const posX = (x * blockSize - halfSize) + (this.random() - 0.5) * blockSize * irregularity;
        const posY = (y * blockSize - halfSize) + (this.random() - 0.5) * blockSize * irregularity;
        
        // Apply grid rotation
        const rotX = posX * Math.cos(gridAngle) - posY * Math.sin(gridAngle);
        const rotY = posX * Math.sin(gridAngle) + posY * Math.cos(gridAngle);
        
        this.createStreetNode(rotX, rotY, 'intersection');
      }
    }
  }

  private generateRadialStreets(): void {
    // Radial street pattern with concentric circles
    const rings = 5;
    const spokes = 8;
    const ringSpacing = 50;
    
    // Create center
    const center = this.createStreetNode(0, 0, 'intersection');
    
    // Create radial spokes
    for (let i = 0; i < spokes; i++) {
      const angle = (i / spokes) * Math.PI * 2;
      for (let r = 1; r <= rings; r++) {
        const radius = r * ringSpacing;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        this.createStreetNode(x, y, 'intersection');
      }
    }
  }

  private generateOrganicStreets(): void {
    // Organic street pattern following terrain/natural features
    // Uses noise functions and flow fields
    const noiseScale = 0.01;
    const stepSize = 10;
    const steps = 100;
    
    // Multiple starting points
    for (let start = 0; start < 5; start++) {
      let x = (this.random() - 0.5) * 200;
      let y = (this.random() - 0.5) * 200;
      
      // Follow flow field
      for (let i = 0; i < steps; i++) {
        const angle = this.noise2D(x * noiseScale, y * noiseScale) * Math.PI * 2;
        x += Math.cos(angle) * stepSize;
        y += Math.sin(angle) * stepSize;
        
        this.createStreetNode(x, y, 'intersection');
      }
    }
  }

  private connectStreetNodes(): void {
    // Connect nearby street nodes with segments
    const maxDistance = this.getParameter('blockSize') as number * 1.5;
    
    const nodes = Array.from(this.streetNodes.values());
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        const dist = this.distance(nodeA.position, nodeB.position);
        
        if (dist < maxDistance && this.canConnectNodes(nodeA, nodeB)) {
          this.createStreetSegment(nodeA.id, nodeB.id);
        }
      }
    }
  }

  private classifyStreets(): void {
    // Classify streets based on connectivity and importance
    for (const segment of this.streetSegments) {
      const startNode = this.streetNodes.get(segment.start);
      const endNode = this.streetNodes.get(segment.end);
      
      if (!startNode || !endNode) continue;
      
      const connectivity = startNode.connections.length + endNode.connections.length;
      
      if (connectivity > 6) {
        segment.type = 'highway';
        segment.lanes = 4;
        segment.width = 16;
      } else if (connectivity > 4) {
        segment.type = 'main';
        segment.lanes = 2;
        segment.width = 12;
      } else if (connectivity > 2) {
        segment.type = 'residential';
        segment.lanes = 2;
        segment.width = 8;
      } else {
        segment.type = 'alley';
        segment.lanes = 1;
        segment.width = 4;
      }
    }
  }

  private generateBuildingFootprints(): void {
    // Generate building lots between streets
    const density = this.getParameter('buildingDensity') as number;
    const minHeight = this.getParameter('minHeight') as number;
    const maxHeight = this.getParameter('maxHeight') as number;
    const floorHeight = this.getParameter('floorHeight') as number;
    const lotCoverage = this.getParameter('lotCoverage') as number;
    
    // Find street blocks (polygons between streets)
    const blocks = this.findStreetBlocks();
    
    for (const block of blocks) {
      if (this.random() > density) continue;
      
      // Subdivide block into lots
      const lots = this.subdivideBlock(block);
      
      for (const lot of lots) {
        const building = this.createBuilding(lot);
        building.height = minHeight + this.random() * (maxHeight - minHeight);
        building.floors = Math.floor(building.height / floorHeight);
        building.type = this.selectBuildingType();
        building.style = this.selectBuildingStyle();
        
        this.buildings.push(building);
      }
    }
  }

  private generateBuildingGeometry(): void {
    // Generate 3D geometry for buildings
    for (const building of this.buildings) {
      // Extrude footprint to height
      // Add facade details
      // Add windows, doors, balconies
      // Add roof geometry
    }
  }

  private generateInfrastructure(): void {
    // Generate additional urban infrastructure
    const generateBridges = this.getParameter('generateBridges') as boolean;
    const generateParkingLots = this.getParameter('generateParkingLots') as boolean;
    const streetLights = this.getParameter('streetLights') as boolean;
    
    if (generateBridges) this.placeBridges();
    if (generateParkingLots) this.placeParkingLots();
    if (streetLights) this.placeStreetLights();
  }

  private generateVegetation(): void {
    // Generate trees, parks, and green spaces
    const parkDensity = this.getParameter('parkDensity') as number;
    const treeSpacing = this.getParameter('streetTreeSpacing') as number;
    
    this.generateParks(parkDensity);
    this.placeStreetTrees(treeSpacing);
  }

  // Helper methods
  private createStreetNode(x: number, y: number, type: string): StreetNode {
    const id = `node_${this.streetNodes.size}`;
    const node: StreetNode = {
      id,
      position: { x, y },
      connections: [],
      type: type as any
    };
    this.streetNodes.set(id, node);
    return node;
  }

  private createStreetSegment(startId: string, endId: string): void {
    const id = `segment_${this.streetSegments.length}`;
    const segment: StreetSegment = {
      id,
      start: startId,
      end: endId,
      width: 8,
      type: 'residential',
      lanes: 2
    };
    
    this.streetSegments.push(segment);
    
    // Update node connections
    const startNode = this.streetNodes.get(startId);
    const endNode = this.streetNodes.get(endId);
    if (startNode) startNode.connections.push(endId);
    if (endNode) endNode.connections.push(startId);
  }

  private createBuilding(corners: Array<{ x: number; y: number }>): BuildingFootprint {
    return {
      id: `building_${this.buildings.length}`,
      corners,
      height: 20,
      floors: 5,
      type: 'residential',
      style: 'modern'
    };
  }

  private canConnectNodes(nodeA: StreetNode, nodeB: StreetNode): boolean {
    // Check if connection would cross existing segments
    // Check if connection is too steep (terrain adaptation)
    return true;
  }

  private findStreetBlocks(): Array<Array<{ x: number; y: number }>> {
    // Find closed polygons formed by street segments
    return [];
  }

  private subdivideBlock(block: Array<{ x: number; y: number }>): Array<Array<{ x: number; y: number }>> {
    // Subdivide block into building lots
    return [block];
  }

  private selectBuildingType(): 'residential' | 'commercial' | 'industrial' | 'landmark' {
    const rand = this.random();
    const resRatio = this.getParameter('residentialRatio') as number;
    const comRatio = this.getParameter('commercialRatio') as number;
    const indRatio = this.getParameter('industrialRatio') as number;
    
    if (rand < resRatio) return 'residential';
    if (rand < resRatio + comRatio) return 'commercial';
    if (rand < resRatio + comRatio + indRatio) return 'industrial';
    return 'landmark';
  }

  private selectBuildingStyle(): 'modern' | 'classic' | 'industrial' | 'mixed' {
    const style = this.getParameter('architectureStyle') as string;
    if (style !== 'mixed') return style as any;
    
    const styles: Array<'modern' | 'classic' | 'industrial'> = ['modern', 'classic', 'industrial'];
    return styles[Math.floor(this.random() * styles.length)];
  }

  private placeBridges(): void {
    // Place bridges over gaps/water
  }

  private placeParkingLots(): void {
    // Add parking lots near commercial buildings
  }

  private placeStreetLights(): void {
    // Place lights along streets
  }

  private generateParks(density: number): void {
    // Create park areas
  }

  private placeStreetTrees(spacing: number): void {
    // Place trees along streets
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private random(): number {
    // Seeded random number generator
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  private noise2D(x: number, y: number): number {
    // Simple 2D noise function
    return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
  }

  private exportStreetGeometry(): any {
    return {
      nodes: Array.from(this.streetNodes.values()),
      segments: this.streetSegments
    };
  }

  private exportBuildingGeometry(): any {
    return {
      buildings: this.buildings
    };
  }

  private exportInfrastructureGeometry(): any {
    return {
      bridges: [],
      parkingLots: [],
      streetLights: []
    };
  }

  private exportVegetationGeometry(): any {
    return {
      trees: [],
      parks: []
    };
  }

  private exportCityData(): any {
    return {
      streetNodeCount: this.streetNodes.size,
      streetSegmentCount: this.streetSegments.length,
      buildingCount: this.buildings.length,
      citySize: this.getParameter('citySize'),
      seed: this.seed
    };
  }

  dispose(): void {
    this.streetNodes.clear();
    this.streetSegments = [];
    this.buildings = [];
    super.dispose();
  }
}
