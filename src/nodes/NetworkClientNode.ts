/**
 * NetworkClientNode - Render client for distributed rendering
 */

import { Node, DataType } from '../core/Node';

export class NetworkClientNode extends Node {
  private connected: boolean = false;
  private workerStatus: string = 'idle';

  constructor(id: string) {
    super(id, 'NetworkClient', 'Network Client');
    this.metadata.category = 'Network';
    this.metadata.description = 'Render client for distributed rendering';
    this.metadata.version = '1.2.0';
    
    this.addInput('serverUrl', 'Server URL', DataType.ANY);
    this.addOutput('status', 'Status', DataType.ANY);
    
    this.setParameter('serverUrl', 'localhost:8080');
    this.setParameter('workerName', 'Worker-1');
    this.setParameter('cpuThreads', 4);
    this.setParameter('gpuEnabled', true);
    this.setParameter('maxMemory', 8192); // MB
    this.setParameter('autoConnect', false);
  }

  async process(): Promise<void> {
    const serverUrl = this.getParameter('serverUrl');
    const workerName = this.getParameter('workerName');
    const cpuThreads = this.getParameter('cpuThreads');
    const gpuEnabled = this.getParameter('gpuEnabled');
    const maxMemory = this.getParameter('maxMemory');
    const autoConnect = this.getParameter('autoConnect');

    if (autoConnect && !this.connected) {
      await this.connect(serverUrl);
    }

    const statusOutput = this.outputs.get('status');
    if (statusOutput) {
      statusOutput.value = {
        connected: this.connected,
        serverUrl,
        workerName,
        workerStatus: this.workerStatus,
        cpuThreads,
        gpuEnabled,
        maxMemory,
        capabilities: this.getCapabilities()
      };
    }
  }

  private async connect(serverUrl: string): Promise<void> {
    // In a real implementation, this would establish WebSocket connection
    console.log(`Connecting to render farm server: ${serverUrl}`);
    
    // Placeholder for connection logic
    this.connected = true;
    this.workerStatus = 'connected';
  }

  disconnect(): void {
    this.connected = false;
    this.workerStatus = 'disconnected';
  }

  private getCapabilities(): any {
    return {
      cpu: {
        cores: this.getParameter('cpuThreads'),
        architecture: 'x64'
      },
      gpu: {
        enabled: this.getParameter('gpuEnabled'),
        type: 'WebGL2'
      },
      memory: {
        max: this.getParameter('maxMemory'),
        available: this.getParameter('maxMemory') * 0.8
      }
    };
  }

  setWorkerStatus(status: string): void {
    this.workerStatus = status;
    this.markDirty();
  }
}
