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
    ipcRenderer.invoke('group-nodes', nodeIds, groupName),

  // Preset operations
  applyPreset: (nodeId: string, presetParams: any) =>
    ipcRenderer.invoke('apply-preset', nodeId, presetParams),

  // View operations
  clearRenderView: () =>
    ipcRenderer.invoke('clear-render-view'),

  // Timeline operations
  setTimeline: (start: number, end: number, fps: number) =>
    ipcRenderer.invoke('set-timeline', start, end, fps),

  // Camera operations
  createCamera: (cameraId: string) =>
    ipcRenderer.invoke('create-camera', cameraId),

  setActiveCamera: (cameraId: string) =>
    ipcRenderer.invoke('set-active-camera', cameraId),

  // Keyframe operations
  addKeyframe: (nodeId: string, parameterKey: string, frame: number, value: any, interpolation: string) =>
    ipcRenderer.invoke('add-keyframe', nodeId, parameterKey, frame, value, interpolation),

  removeKeyframe: (nodeId: string, parameterKey: string, frame: number) =>
    ipcRenderer.invoke('remove-keyframe', nodeId, parameterKey, frame),

  setCurrentFrame: (frame: number) =>
    ipcRenderer.invoke('set-current-frame', frame),

  getKeyframes: () =>
    ipcRenderer.invoke('get-keyframes'),

  setTimelineRange: (start: number, end: number, fps: number) =>
    ipcRenderer.invoke('set-timeline-range', start, end, fps)
});
