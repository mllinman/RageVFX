/**
 * Main entry point for RageVFX application
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { RageVFXApp } from './core/RageVFXApp';

let mainWindow: BrowserWindow | null = null;
let vfxApp: RageVFXApp | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: 'RageVFX - Professional Visual Effects Software',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webgl: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1a1a1a',
    show: false
  });

  // Load the UI
  mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize VFX application
  vfxApp = new RageVFXApp();
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for communication with renderer
ipcMain.handle('create-node', async (event, nodeType: string, nodeId: string) => {
  return vfxApp?.createNode(nodeType, nodeId);
});

ipcMain.handle('connect-nodes', async (event, sourceId: string, sourceOutput: string, targetId: string, targetInput: string) => {
  return vfxApp?.connectNodes(sourceId, sourceOutput, targetId, targetInput);
});

ipcMain.handle('execute-graph', async () => {
  return vfxApp?.executeGraph();
});

ipcMain.handle('get-output', async () => {
  return vfxApp?.getFinalOutput();
});

ipcMain.handle('save-project', async (event, filepath: string) => {
  return vfxApp?.saveProject(filepath);
});

ipcMain.handle('load-project', async (event, filepath: string) => {
  return vfxApp?.loadProject(filepath);
});

ipcMain.handle('get-node-properties', async (event, nodeId: string) => {
  return vfxApp?.getNodeProperties(nodeId);
});

ipcMain.handle('update-node-parameter', async (event, nodeId: string, key: string, value: any) => {
  return vfxApp?.updateNodeParameter(nodeId, key, value);
});

ipcMain.handle('group-nodes', async (event, nodeIds: string[], groupName: string) => {
  return vfxApp?.groupNodes(nodeIds, groupName);
});
