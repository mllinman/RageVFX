/**
 * GroupNode encapsulates a subgraph of nodes as a single node
 * Allows for organization, macros, and reusable custom node sets
 */

import { Node, DataType, NodeMetadata } from './Node';
import { NodeGraph } from './NodeGraph';

export class GroupNode extends Node {
  private innerGraph: NodeGraph;
  private inputMap: Map<string, { nodeId: string; inputId: string }> = new Map();
  private outputMap: Map<string, { nodeId: string; outputId: string }> = new Map();

  constructor(id: string, name: string = 'Group') {
    super(id, 'Group', name);
    this.metadata.category = 'Utility';
    this.metadata.description = 'A container for a subgraph of nodes';
    this.innerGraph = new NodeGraph();
  }

  /**
   * Add a node to the inner graph
   */
  addNode(node: Node): void {
    this.innerGraph.addNode(node);
  }

  /**
   * Define an external input that maps to an internal node input
   */
  exposeInput(externalId: string, internalNodeId: string, internalInputId: string, name?: string, type?: DataType): void {
    const internalNode = this.innerGraph.getNode(internalNodeId);
    if (!internalNode) return;

    const inputConfig = internalNode.getInputs().find(i => i.id === internalInputId);
    if (!inputConfig) return;

    this.addInput(externalId, name || inputConfig.name, type || inputConfig.type);
    this.inputMap.set(externalId, { nodeId: internalNodeId, inputId: internalInputId });
  }

  /**
   * Define an external output that maps to an internal node output
   */
  exposeOutput(externalId: string, internalNodeId: string, internalOutputId: string, name?: string, type?: DataType): void {
    const internalNode = this.innerGraph.getNode(internalNodeId);
    if (!internalNode) return;

    const outputConfig = internalNode.getOutputs().find(o => o.id === internalOutputId);
    if (!outputConfig) return;

    this.addOutput(externalId, name || outputConfig.name, type || outputConfig.type);
    this.outputMap.set(externalId, { nodeId: internalNodeId, outputId: internalOutputId });
  }

  /**
   * Process the group by executing the inner graph
   */
  async process(): Promise<void> {
    // 1. Transfer external input values to internal nodes
    this.inputMap.forEach((internal, externalId) => {
      const value = this.getParameter(externalId) || this.inputs.get(externalId)?.value;
      const internalNode = this.innerGraph.getNode(internal.nodeId);
      if (internalNode) {
        internalNode.setInput(internal.inputId, value);
      }
    });

    // 2. Execute the inner graph
    await this.innerGraph.execute();

    // 3. Transfer internal outputs to external output sockets
    this.outputMap.forEach((internal, externalId) => {
      const internalNode = this.innerGraph.getNode(internal.nodeId);
      if (internalNode) {
        const value = internalNode.getOutput(internal.outputId);
        this.setOutput(externalId, value);
      }
    });
  }

  /**
   * Set a name for the group (useful for custom nodes)
   */
  setName(name: string): void {
    this.metadata.name = name;
  }

  /**
   * Get the internal graph for editing
   */
  getGraph(): NodeGraph {
    return this.innerGraph;
  }

  /**
   * Serialize including the inner graph
   */
  serialize(): any {
    const base = super.serialize();
    return {
      ...base,
      innerGraph: this.innerGraph.serialize(),
      inputMap: Array.from(this.inputMap.entries()),
      outputMap: Array.from(this.outputMap.entries())
    };
  }
}
