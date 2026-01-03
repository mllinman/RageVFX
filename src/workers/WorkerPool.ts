/**
 * Worker Pool Manager for RageVFX
 * Manages a pool of Web Workers for parallel node execution
 */

import { WorkerMessage, WorkerMessageType, NodeExecutionTask, NodeExecutionResult } from './NodeWorker';

export interface WorkerPoolConfig {
  maxWorkers: number;
  workerScript: string;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{
    task: NodeExecutionTask | NodeExecutionTask[];
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private pendingTasks: Map<string, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private config: WorkerPoolConfig;
  private nextTaskId: number = 0;

  constructor(config: WorkerPoolConfig) {
    this.config = config;
  }

  /**
   * Initialize the worker pool
   */
  async initialize(): Promise<void> {
    const workerCount = Math.min(
      this.config.maxWorkers,
      navigator.hardwareConcurrency || 4
    );

    console.log(`Initializing worker pool with ${workerCount} workers`);

    const initPromises: Promise<void>[] = [];

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(this.config.workerScript, {
        type: 'module'
      });

      const initPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Worker ${i} initialization timeout`));
        }, 5000);

        worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
          if (event.data.type === WorkerMessageType.READY) {
            clearTimeout(timeout);
            resolve();
          }
        }, { once: true });

        worker.addEventListener('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        }, { once: true });
      });

      worker.addEventListener('message', (event) => this.handleWorkerMessage(worker, event));
      worker.addEventListener('error', (error) => this.handleWorkerError(worker, error));

      this.workers.push(worker);
      initPromises.push(initPromise);
    }

    await Promise.all(initPromises);
    this.availableWorkers = [...this.workers];

    console.log(`Worker pool initialized with ${this.workers.length} workers`);
  }

  /**
   * Execute a single node in a worker
   */
  executeNode(task: NodeExecutionTask): Promise<NodeExecutionResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        task: task,
        resolve: resolve,
        reject: reject
      });
      this.processQueue();
    });
  }

  /**
   * Execute a batch of nodes in parallel across workers
   */
  executeBatch(tasks: NodeExecutionTask[]): Promise<NodeExecutionResult[]> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        task: tasks,
        resolve: resolve,
        reject: reject
      });
      this.processQueue();
    });
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const queueItem = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;

      const taskId = `task-${this.nextTaskId++}`;
      this.pendingTasks.set(taskId, {
        resolve: queueItem.resolve,
        reject: queueItem.reject
      });

      const isBatch = Array.isArray(queueItem.task);
      const message: WorkerMessage = {
        type: isBatch ? WorkerMessageType.EXECUTE_BATCH : WorkerMessageType.EXECUTE_NODE,
        id: taskId,
        data: queueItem.task
      };

      worker.postMessage(message);
    }
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(worker: Worker, event: MessageEvent<WorkerMessage>): void {
    const message = event.data;

    if (message.type === WorkerMessageType.READY) {
      return; // Already handled during initialization
    }

    const pending = this.pendingTasks.get(message.id);
    if (!pending) {
      console.warn('Received message for unknown task:', message.id);
      return;
    }

    this.pendingTasks.delete(message.id);

    if (message.type === WorkerMessageType.RESULT) {
      pending.resolve(message.data);
    } else if (message.type === WorkerMessageType.ERROR) {
      pending.reject(new Error(message.error || 'Unknown worker error'));
    }

    // Return worker to available pool
    this.availableWorkers.push(worker);
    this.processQueue();
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    console.error('Worker error:', error);

    // Find and reject all pending tasks for this worker
    this.pendingTasks.forEach((pending, taskId) => {
      pending.reject(new Error(`Worker error: ${error.message}`));
      this.pendingTasks.delete(taskId);
    });

    // Return worker to available pool (it may still be usable)
    if (!this.availableWorkers.includes(worker)) {
      this.availableWorkers.push(worker);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number;
    availableWorkers: number;
    queuedTasks: number;
    pendingTasks: number;
  } {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
      pendingTasks: this.pendingTasks.size
    };
  }

  /**
   * Terminate all workers and clean up
   */
  dispose(): void {
    // Reject all pending tasks
    this.pendingTasks.forEach((pending) => {
      pending.reject(new Error('Worker pool disposed'));
    });
    this.pendingTasks.clear();

    // Clear task queue
    this.taskQueue.forEach((item) => {
      item.reject(new Error('Worker pool disposed'));
    });
    this.taskQueue = [];

    // Terminate all workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];

    console.log('Worker pool disposed');
  }
}
