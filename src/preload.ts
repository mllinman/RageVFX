/**
 * Preload script for secure IPC communication
 * Exposes only necessary APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ragevfxAPI', {
  // Node operations
  createNode: (nodeType: string, nodeId: string) =>
    ipcRenderer.invoke('create-node', nodeType, nodeId),

  connectNodes: (sourceId: string, sourceOutput: string, targetId: string, targetInput: string) =>
    ipcRenderer.invoke('connect-nodes', sourceId, sourceOutput, targetId, targetInput),

  // Graph operations
  executeGraph: () =>
    ipcRenderer.invoke('execute-graph'),

  getOutput: () =>
    ipcRenderer.invoke('get-output'),

  // Project operations
  saveProject: (filepath: string) =>
    ipcRenderer.invoke('save-project', filepath),

  loadProject: (filepath: string) =>
    ipcRenderer.invoke('load-project', filepath),

  // Property & Grouping operations
  getNodeProperties: (nodeId: string) =>
    ipcRenderer.invoke('get-node-properties', nodeId),

  updateNodeParameter: (nodeId: string, key: string, value: any) =>
    ipcRenderer.invoke('update-node-parameter', nodeId, key, value),

  groupNodes: (nodeIds: string[], groupName: string) =>
    ipcRenderer.invoke('group-nodes', nodeIds, groupName)
});
