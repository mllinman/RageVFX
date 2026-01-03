/**
 * Web Worker for parallel node execution
 * Enables multi-threaded processing for improved performance
 */

import { Node } from '../core/Node';

// Message types for worker communication
export enum WorkerMessageType {
  EXECUTE_NODE = 'execute_node',
  EXECUTE_BATCH = 'execute_batch',
  RESULT = 'result',
  ERROR = 'error',
  READY = 'ready'
}

export interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  data?: any;
  error?: string;
}

export interface NodeExecutionTask {
  nodeId: string;
  nodeType: string;
  inputs: Record<string, any>;
  parameters: Record<string, any>;
}

export interface NodeExecutionResult {
  nodeId: string;
  outputs: Record<string, any>;
  executionTime: number;
}

/**
 * Worker context - runs in Web Worker thread
 */
class NodeWorkerContext {
  private nodeRegistry: Map<string, any> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Register available node types
    // This will be populated dynamically based on loaded modules

    // Send ready message to main thread
    self.postMessage({
      type: WorkerMessageType.READY,
      id: 'worker-init'
    } as WorkerMessage);
  }

  /**
   * Execute a single node
   */
  async executeNode(task: NodeExecutionTask): Promise<NodeExecutionResult> {
    const startTime = performance.now();

    try {
      // Create node instance
      const NodeClass = this.nodeRegistry.get(task.nodeType);
      if (!NodeClass) {
        throw new Error(`Unknown node type: ${task.nodeType}`);
      }

      const node = new NodeClass(task.nodeId);

      // Set inputs
      Object.entries(task.inputs).forEach(([key, value]) => {
        node.setInput(key, value);
      });

      // Set parameters
      Object.entries(task.parameters).forEach(([key, value]) => {
        node.setParameter(key, value);
      });

      // Execute node
      await node.process();

      // Collect outputs
      const outputs: Record<string, any> = {};
      node.getOutputs().forEach((output: any) => {
        outputs[output.id] = node.getOutput(output.id);
      });

      const executionTime = performance.now() - startTime;

      // Clean up
      node.dispose();

      return {
        nodeId: task.nodeId,
        outputs: outputs,
        executionTime: executionTime
      };

    } catch (error) {
      throw new Error(`Node execution failed: ${error}`);
    }
  }

  /**
   * Execute a batch of nodes
   */
  async executeBatch(tasks: NodeExecutionTask[]): Promise<NodeExecutionResult[]> {
    const results: NodeExecutionResult[] = [];

    for (const task of tasks) {
      try {
        const result = await this.executeNode(task);
        results.push(result);
      } catch (error) {
        console.error(`Failed to execute node ${task.nodeId}:`, error);
        // Continue with other tasks
      }
    }

    return results;
  }

  /**
   * Handle incoming messages from main thread
   */
  handleMessage(event: MessageEvent<WorkerMessage>): void {
    const message = event.data;

    switch (message.type) {
      case WorkerMessageType.EXECUTE_NODE:
        this.executeNode(message.data as NodeExecutionTask)
          .then(result => {
            self.postMessage({
              type: WorkerMessageType.RESULT,
              id: message.id,
              data: result
            } as WorkerMessage);
          })
          .catch(error => {
            self.postMessage({
              type: WorkerMessageType.ERROR,
              id: message.id,
              error: error.message
            } as WorkerMessage);
          });
        break;

      case WorkerMessageType.EXECUTE_BATCH:
        this.executeBatch(message.data as NodeExecutionTask[])
          .then(results => {
            self.postMessage({
              type: WorkerMessageType.RESULT,
              id: message.id,
              data: results
            } as WorkerMessage);
          })
          .catch(error => {
            self.postMessage({
              type: WorkerMessageType.ERROR,
              id: message.id,
              error: error.message
            } as WorkerMessage);
          });
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }
}

// Initialize worker context
const workerContext = new NodeWorkerContext();

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  workerContext.handleMessage(event);
});
