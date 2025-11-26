/**
 * NodeGraph manages the node network and execution flow
 * Handles connections, execution order, and data flow between nodes
 */

import { Node, DataType } from './Node';

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
}

export class NodeGraph {
  private nodes: Map<string, Node> = new Map();
  private connections: Map<string, Connection> = new Map();
  private executionOrder: string[] = [];
  private dirty: boolean = true;

  /**
   * Add a node to the graph
   */
  addNode(node: Node): void {
    const metadata = node.getMetadata();
    this.nodes.set(metadata.id, node);
    this.dirty = true;
  }

  /**
   * Remove a node from the graph
   */
  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      // Remove all connections involving this node
      const connectionsToRemove: string[] = [];
      this.connections.forEach((conn, id) => {
        if (conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId) {
          connectionsToRemove.push(id);
        }
      });
      connectionsToRemove.forEach(id => this.connections.delete(id));

      // Dispose and remove the node
      node.dispose();
      this.nodes.delete(nodeId);
      this.dirty = true;
    }
  }

  /**
   * Create a connection between two nodes
   */
  connect(sourceNodeId: string, sourceOutputId: string, targetNodeId: string, targetInputId: string): boolean {
    const sourceNode = this.nodes.get(sourceNodeId);
    const targetNode = this.nodes.get(targetNodeId);

    if (!sourceNode || !targetNode) {
      return false;
    }

    // Check for type compatibility
    const sourceOutputs = sourceNode.getOutputs();
    const targetInputs = targetNode.getInputs();
    
    const sourceOutput = sourceOutputs.find(o => o.id === sourceOutputId);
    const targetInput = targetInputs.find(i => i.id === targetInputId);

    if (!sourceOutput || !targetInput) {
      return false;
    }

    // Allow connection if types match or one is ANY
    if (sourceOutput.type !== targetInput.type && 
        sourceOutput.type !== DataType.ANY && 
        targetInput.type !== DataType.ANY) {
      return false;
    }

    const connectionId = `${sourceNodeId}.${sourceOutputId}->${targetNodeId}.${targetInputId}`;
    this.connections.set(connectionId, {
      id: connectionId,
      sourceNodeId,
      sourceOutputId,
      targetNodeId,
      targetInputId
    });

    this.dirty = true;
    targetNode.markDirty();
    return true;
  }

  /**
   * Remove a connection
   */
  disconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      const targetNode = this.nodes.get(connection.targetNodeId);
      if (targetNode) {
        targetNode.markDirty();
      }
      this.connections.delete(connectionId);
      this.dirty = true;
    }
  }

  /**
   * Get a node by ID
   */
  getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all connections
   */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Calculate execution order using topological sort
   */
  private calculateExecutionOrder(): void {
    const visited = new Set<string>();
    const tempMarked = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string): void => {
      if (tempMarked.has(nodeId)) {
        throw new Error('Circular dependency detected in node graph');
      }
      if (visited.has(nodeId)) {
        return;
      }

      tempMarked.add(nodeId);

      // Visit all nodes that this node depends on
      this.connections.forEach(conn => {
        if (conn.targetNodeId === nodeId) {
          visit(conn.sourceNodeId);
        }
      });

      tempMarked.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // Visit all nodes
    this.nodes.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    });

    this.executionOrder = order;
    this.dirty = false;
  }

  /**
   * Execute the node graph
   */
  async execute(): Promise<void> {
    if (this.dirty) {
      this.calculateExecutionOrder();
    }

    // Transfer data between connected nodes
    this.connections.forEach(conn => {
      const sourceNode = this.nodes.get(conn.sourceNodeId);
      const targetNode = this.nodes.get(conn.targetNodeId);
      
      if (sourceNode && targetNode) {
        const outputValue = sourceNode.getOutput(conn.sourceOutputId);
        targetNode.setInput(conn.targetInputId, outputValue);
      }
    });

    // Execute nodes in order
    for (const nodeId of this.executionOrder) {
      const node = this.nodes.get(nodeId);
      if (node && node.isDirty()) {
        await node.process();
      }
    }
  }

  /**
   * Serialize the graph to JSON
   */
  serialize(): any {
    return {
      nodes: Array.from(this.nodes.values()).map(node => node.serialize()),
      connections: Array.from(this.connections.values())
    };
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    this.nodes.forEach(node => node.dispose());
    this.nodes.clear();
    this.connections.clear();
    this.executionOrder = [];
    this.dirty = true;
  }
}
