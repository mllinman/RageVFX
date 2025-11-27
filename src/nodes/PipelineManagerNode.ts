/**
 * PipelineManagerNode - Shot/asset management integration
 * Version 3.1 - Pipeline & Collaboration
 * 
 * Features:
 * - Shot management with versioning
 * - Asset tracking and linking
 * - Task management and status
 * - Publish/subscribe workflow
 * - Dependency tracking
 * - Review submission
 * - Notes and feedback integration
 */

import { Node, DataType } from '../core/Node';

// Shot interface
export interface PipelineShot {
  id: string;
  name: string;
  sequence: string;
  project: string;
  status: 'waiting' | 'in_progress' | 'pending_review' | 'approved' | 'on_hold';
  frameRange: { start: number; end: number };
  handleFrames: { head: number; tail: number };
  fps: number;
  resolution: { width: number; height: number };
  assignees: string[];
  tasks: PipelineTask[];
  versions: PipelineVersion[];
  dependencies: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Asset interface
export interface PipelineAsset {
  id: string;
  name: string;
  type: 'model' | 'rig' | 'texture' | 'material' | 'animation' | 'effect' | 'cache' | 'plate';
  category: string;
  project: string;
  status: 'wip' | 'pending_review' | 'approved' | 'deprecated';
  versions: PipelineVersion[];
  dependencies: string[];
  usedBy: string[];
  tags: string[];
  thumbnail: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Version interface
export interface PipelineVersion {
  id: string;
  number: number;
  status: 'wip' | 'pending_review' | 'approved' | 'rejected' | 'deprecated';
  files: PipelineFile[];
  comment: string;
  author: string;
  reviewers: string[];
  notes: PipelineNote[];
  createdAt: string;
}

// File interface
export interface PipelineFile {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  checksum: string;
  metadata: Record<string, unknown>;
}

// Task interface
export interface PipelineTask {
  id: string;
  name: string;
  type: string;
  status: 'not_started' | 'in_progress' | 'pending_review' | 'approved' | 'on_hold';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignee: string;
  dueDate: string;
  startDate: string;
  endDate: string;
  estimatedHours: number;
  actualHours: number;
  dependencies: string[];
  versions: PipelineVersion[];
  notes: PipelineNote[];
}

// Note interface
export interface PipelineNote {
  id: string;
  author: string;
  content: string;
  frame?: number;
  attachments: string[];
  createdAt: string;
  type: 'note' | 'feedback' | 'approval' | 'rejection';
}

// Project interface
export interface PipelineProject {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  fps: number;
  resolution: { width: number; height: number };
  colorSpace: string;
  startDate: string;
  endDate: string;
  sequences: PipelineSequence[];
  settings: Record<string, unknown>;
}

// Sequence interface
export interface PipelineSequence {
  id: string;
  name: string;
  code: string;
  shots: string[];
  status: 'active' | 'on_hold' | 'completed';
}

export class PipelineManagerNode extends Node {
  private currentProject: PipelineProject | null = null;
  private shots: Map<string, PipelineShot> = new Map();
  private assets: Map<string, PipelineAsset> = new Map();
  private tasks: Map<string, PipelineTask> = new Map();
  private localChanges: Map<string, unknown> = new Map();

  constructor(id: string) {
    super(id, 'PipelineManager', 'Pipeline Manager');
    this.metadata.category = 'Pipeline';
    this.metadata.description = 'Shot/asset management integration for VFX production pipeline';
    this.metadata.version = '3.1.0';
    
    // Inputs
    this.addInput('projectConfig', 'Project Config', DataType.ANY);
    this.addInput('shotData', 'Shot Data', DataType.ANY);
    this.addInput('assetData', 'Asset Data', DataType.ANY);
    this.addInput('publishData', 'Publish Data', DataType.ANY);
    
    // Outputs
    this.addOutput('project', 'Current Project', DataType.ANY);
    this.addOutput('currentShot', 'Current Shot', DataType.ANY);
    this.addOutput('currentAsset', 'Current Asset', DataType.ANY);
    this.addOutput('tasks', 'Assigned Tasks', DataType.ANY);
    this.addOutput('dependencies', 'Dependencies', DataType.ANY);
    this.addOutput('versions', 'Version History', DataType.ANY);
    this.addOutput('status', 'Pipeline Status', DataType.ANY);
    
    // === CONNECTION SETTINGS ===
    this.setParameter('pipelineType', 'custom'); // shotgrid, ftrack, kitsu, custom
    this.setParameter('serverUrl', ''); // Pipeline server URL
    this.setParameter('apiKey', ''); // API key for authentication
    this.setParameter('username', ''); // Username
    this.setParameter('autoSync', true); // Checkbox - auto-sync with server
    this.setParameter('syncInterval', 60); // Slider 10-300 seconds
    
    // === PROJECT SETTINGS ===
    this.setParameter('projectId', ''); // Current project ID
    this.setParameter('projectCode', ''); // Project code
    
    // === SHOT SETTINGS ===
    this.setParameter('currentShotId', ''); // Current shot ID
    this.setParameter('currentSequence', ''); // Current sequence
    this.setParameter('autoDetectShot', true); // Checkbox - detect from filename
    
    // === ASSET SETTINGS ===
    this.setParameter('currentAssetId', ''); // Current asset ID
    this.setParameter('assetType', 'all'); // Filter by type
    
    // === TASK SETTINGS ===
    this.setParameter('showOnlyAssigned', true); // Checkbox
    this.setParameter('taskFilter', 'all'); // all, pending, in_progress, approved
    this.setParameter('showSubtasks', true); // Checkbox
    
    // === VERSION SETTINGS ===
    this.setParameter('autoVersionUp', true); // Checkbox
    this.setParameter('versionPadding', 3); // Slider 1-5
    this.setParameter('latestVersionOnly', false); // Checkbox
    
    // === PUBLISH SETTINGS ===
    this.setParameter('publishMode', 'manual'); // manual, auto
    this.setParameter('createThumbnail', true); // Checkbox
    this.setParameter('thumbnailFrame', 'middle'); // first, middle, last, custom
    this.setParameter('createMov', true); // Checkbox - create review MOV
    this.setParameter('submitForReview', true); // Checkbox
    this.setParameter('notifyReviewers', true); // Checkbox
    
    // === PATH TEMPLATES ===
    this.setParameter('workTemplate', '{project}/shots/{sequence}/{shot}/work/{task}/v{version}/{shot}_{task}_v{version}.{ext}');
    this.setParameter('publishTemplate', '{project}/shots/{sequence}/{shot}/publish/{task}/v{version}/{shot}_{task}_v{version}.{ext}');
    this.setParameter('assetTemplate', '{project}/assets/{type}/{asset}/v{version}/{asset}_v{version}.{ext}');
    
    // === NOTIFICATIONS ===
    this.setParameter('notificationsEnabled', true); // Checkbox
    this.setParameter('notifyOnStatusChange', true); // Checkbox
    this.setParameter('notifyOnNewVersion', true); // Checkbox
    this.setParameter('notifyOnNote', true); // Checkbox
    
    // === DEBUG ===
    this.setParameter('debugMode', false); // Checkbox
    this.setParameter('offlineMode', false); // Checkbox
  }

  async process(): Promise<void> {
    // Load project configuration
    const projectConfig = this.inputs.get('projectConfig');
    if (projectConfig?.value) {
      await this.loadProjectConfig(projectConfig.value);
    }
    
    // Load shot data
    const shotData = this.inputs.get('shotData');
    if (shotData?.value) {
      await this.loadShotData(shotData.value);
    }
    
    // Load asset data
    const assetData = this.inputs.get('assetData');
    if (assetData?.value) {
      await this.loadAssetData(assetData.value);
    }
    
    // Handle publish data
    const publishData = this.inputs.get('publishData');
    if (publishData?.value) {
      await this.handlePublish(publishData.value);
    }
    
    // Generate outputs
    this.generateOutputs();
  }

  private async loadProjectConfig(config: unknown): Promise<void> {
    const cfg = config as Record<string, unknown>;
    
    this.currentProject = {
      id: cfg.id as string || 'project_001',
      name: cfg.name as string || 'Project',
      code: cfg.code as string || 'PRJ',
      status: 'active',
      fps: cfg.fps as number || 24,
      resolution: cfg.resolution as { width: number; height: number } || { width: 1920, height: 1080 },
      colorSpace: cfg.colorSpace as string || 'ACEScg',
      startDate: cfg.startDate as string || new Date().toISOString(),
      endDate: cfg.endDate as string || '',
      sequences: [],
      settings: cfg.settings as Record<string, unknown> || {}
    };
  }

  private async loadShotData(data: unknown): Promise<void> {
    const shotsArray = Array.isArray(data) ? data : [data];
    
    for (const shotData of shotsArray) {
      const sd = shotData as Record<string, unknown>;
      const shot: PipelineShot = {
        id: sd.id as string || `shot_${this.shots.size + 1}`,
        name: sd.name as string || 'shot_010',
        sequence: sd.sequence as string || 'SEQ001',
        project: this.currentProject?.id || '',
        status: sd.status as PipelineShot['status'] || 'waiting',
        frameRange: sd.frameRange as { start: number; end: number } || { start: 1001, end: 1100 },
        handleFrames: sd.handleFrames as { head: number; tail: number } || { head: 8, tail: 8 },
        fps: sd.fps as number || this.currentProject?.fps || 24,
        resolution: sd.resolution as { width: number; height: number } || this.currentProject?.resolution || { width: 1920, height: 1080 },
        assignees: sd.assignees as string[] || [],
        tasks: sd.tasks as PipelineTask[] || [],
        versions: sd.versions as PipelineVersion[] || [],
        dependencies: sd.dependencies as string[] || [],
        metadata: sd.metadata as Record<string, unknown> || {},
        createdAt: sd.createdAt as string || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.shots.set(shot.id, shot);
    }
  }

  private async loadAssetData(data: unknown): Promise<void> {
    const assetsArray = Array.isArray(data) ? data : [data];
    
    for (const assetData of assetsArray) {
      const ad = assetData as Record<string, unknown>;
      const asset: PipelineAsset = {
        id: ad.id as string || `asset_${this.assets.size + 1}`,
        name: ad.name as string || 'Asset',
        type: ad.type as PipelineAsset['type'] || 'model',
        category: ad.category as string || 'character',
        project: this.currentProject?.id || '',
        status: ad.status as PipelineAsset['status'] || 'wip',
        versions: ad.versions as PipelineVersion[] || [],
        dependencies: ad.dependencies as string[] || [],
        usedBy: ad.usedBy as string[] || [],
        tags: ad.tags as string[] || [],
        thumbnail: ad.thumbnail as string || '',
        metadata: ad.metadata as Record<string, unknown> || {},
        createdAt: ad.createdAt as string || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.assets.set(asset.id, asset);
    }
  }

  private async handlePublish(data: unknown): Promise<void> {
    const pd = data as Record<string, unknown>;
    
    const publishType = pd.type as string || 'shot';
    const entityId = pd.entityId as string;
    const files = pd.files as PipelineFile[] || [];
    const comment = pd.comment as string || '';
    
    // Create new version
    const version: PipelineVersion = {
      id: `v_${Date.now()}`,
      number: this.getNextVersionNumber(entityId, publishType),
      status: this.getParameter('submitForReview') ? 'pending_review' : 'wip',
      files,
      comment,
      author: this.getParameter('username') || 'user',
      reviewers: [],
      notes: [],
      createdAt: new Date().toISOString()
    };
    
    // Add version to appropriate entity
    if (publishType === 'shot') {
      const shot = this.shots.get(entityId);
      if (shot) {
        shot.versions.push(version);
        shot.updatedAt = new Date().toISOString();
        this.localChanges.set(`shot_${entityId}`, { type: 'version_added', version });
      }
    } else if (publishType === 'asset') {
      const asset = this.assets.get(entityId);
      if (asset) {
        asset.versions.push(version);
        asset.updatedAt = new Date().toISOString();
        this.localChanges.set(`asset_${entityId}`, { type: 'version_added', version });
      }
    }
  }

  private getNextVersionNumber(entityId: string, type: string): number {
    let versions: PipelineVersion[] = [];
    
    if (type === 'shot') {
      const shot = this.shots.get(entityId);
      if (shot) versions = shot.versions;
    } else if (type === 'asset') {
      const asset = this.assets.get(entityId);
      if (asset) versions = asset.versions;
    }
    
    if (versions.length === 0) return 1;
    return Math.max(...versions.map(v => v.number)) + 1;
  }

  private generateOutputs(): void {
    // Output project
    const projectOutput = this.outputs.get('project');
    if (projectOutput) {
      projectOutput.value = this.currentProject;
    }
    
    // Output current shot
    const currentShotId = this.getParameter('currentShotId');
    const shotOutput = this.outputs.get('currentShot');
    if (shotOutput) {
      shotOutput.value = currentShotId ? this.shots.get(currentShotId) : null;
    }
    
    // Output current asset
    const currentAssetId = this.getParameter('currentAssetId');
    const assetOutput = this.outputs.get('currentAsset');
    if (assetOutput) {
      assetOutput.value = currentAssetId ? this.assets.get(currentAssetId) : null;
    }
    
    // Output tasks
    const tasksOutput = this.outputs.get('tasks');
    if (tasksOutput) {
      const username = this.getParameter('username');
      const showOnlyAssigned = this.getParameter('showOnlyAssigned');
      const taskFilter = this.getParameter('taskFilter');
      
      let filteredTasks = Array.from(this.tasks.values());
      
      if (showOnlyAssigned && username) {
        filteredTasks = filteredTasks.filter(t => t.assignee === username);
      }
      
      if (taskFilter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.status === taskFilter);
      }
      
      tasksOutput.value = filteredTasks;
    }
    
    // Output dependencies
    const depsOutput = this.outputs.get('dependencies');
    if (depsOutput) {
      const deps: unknown[] = [];
      
      if (currentShotId) {
        const shot = this.shots.get(currentShotId);
        if (shot) {
          for (const depId of shot.dependencies) {
            const depShot = this.shots.get(depId);
            if (depShot) deps.push({ type: 'shot', entity: depShot });
            
            const depAsset = this.assets.get(depId);
            if (depAsset) deps.push({ type: 'asset', entity: depAsset });
          }
        }
      }
      
      depsOutput.value = deps;
    }
    
    // Output versions
    const versionsOutput = this.outputs.get('versions');
    if (versionsOutput) {
      let versions: PipelineVersion[] = [];
      
      if (currentShotId) {
        const shot = this.shots.get(currentShotId);
        if (shot) versions = [...shot.versions];
      } else if (currentAssetId) {
        const asset = this.assets.get(currentAssetId);
        if (asset) versions = [...asset.versions];
      }
      
      // Sort by version number descending
      versions.sort((a, b) => b.number - a.number);
      
      if (this.getParameter('latestVersionOnly') && versions.length > 0) {
        versions = [versions[0]];
      }
      
      versionsOutput.value = versions;
    }
    
    // Output status
    const statusOutput = this.outputs.get('status');
    if (statusOutput) {
      statusOutput.value = {
        connected: !this.getParameter('offlineMode'),
        project: this.currentProject?.name,
        shotsLoaded: this.shots.size,
        assetsLoaded: this.assets.size,
        tasksLoaded: this.tasks.size,
        pendingChanges: this.localChanges.size,
        lastSync: new Date().toISOString()
      };
    }
  }

  // === PUBLIC API ===

  /**
   * Get all shots in current project
   */
  getAllShots(): PipelineShot[] {
    return Array.from(this.shots.values());
  }

  /**
   * Get all assets in current project
   */
  getAllAssets(): PipelineAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get shot by ID
   */
  getShot(id: string): PipelineShot | null {
    return this.shots.get(id) || null;
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): PipelineAsset | null {
    return this.assets.get(id) || null;
  }

  /**
   * Set current shot
   */
  setCurrentShot(shotId: string): void {
    this.setParameter('currentShotId', shotId);
  }

  /**
   * Set current asset
   */
  setCurrentAsset(assetId: string): void {
    this.setParameter('currentAssetId', assetId);
  }

  /**
   * Add a note to a version
   */
  addNote(entityId: string, versionId: string, note: string, frame?: number): void {
    const newNote: PipelineNote = {
      id: `note_${Date.now()}`,
      author: this.getParameter('username') || 'user',
      content: note,
      frame,
      attachments: [],
      createdAt: new Date().toISOString(),
      type: 'note'
    };
    
    // Find version in shots
    for (const shot of this.shots.values()) {
      const version = shot.versions.find(v => v.id === versionId);
      if (version) {
        version.notes.push(newNote);
        this.localChanges.set(`note_${newNote.id}`, { type: 'note_added', note: newNote });
        return;
      }
    }
    
    // Find version in assets
    for (const asset of this.assets.values()) {
      const version = asset.versions.find(v => v.id === versionId);
      if (version) {
        version.notes.push(newNote);
        this.localChanges.set(`note_${newNote.id}`, { type: 'note_added', note: newNote });
        return;
      }
    }
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: PipelineTask['status']): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      this.localChanges.set(`task_${taskId}`, { type: 'status_update', status });
    }
  }

  /**
   * Resolve path template
   */
  resolvePath(template: string, context: Record<string, string>): string {
    let path = template;
    for (const [key, value] of Object.entries(context)) {
      const paddedValue = key === 'version' 
        ? value.padStart(this.getParameter('versionPadding'), '0')
        : value;
      path = path.replace(new RegExp(`\\{${key}\\}`, 'g'), paddedValue);
    }
    return path;
  }

  /**
   * Get work file path
   */
  getWorkPath(shot: PipelineShot, task: string, version: number, ext: string): string {
    const template = this.getParameter('workTemplate');
    return this.resolvePath(template, {
      project: this.currentProject?.code || '',
      sequence: shot.sequence,
      shot: shot.name,
      task,
      version: version.toString(),
      ext
    });
  }

  /**
   * Get publish file path
   */
  getPublishPath(shot: PipelineShot, task: string, version: number, ext: string): string {
    const template = this.getParameter('publishTemplate');
    return this.resolvePath(template, {
      project: this.currentProject?.code || '',
      sequence: shot.sequence,
      shot: shot.name,
      task,
      version: version.toString(),
      ext
    });
  }

  /**
   * Sync with server
   */
  async sync(): Promise<boolean> {
    if (this.getParameter('offlineMode')) {
      return false;
    }
    
    // Would sync with pipeline server in production
    this.localChanges.clear();
    return true;
  }

  /**
   * Create a new shot
   */
  createShot(name: string, sequence: string, frameRange: { start: number; end: number }): PipelineShot {
    const shot: PipelineShot = {
      id: `shot_${Date.now()}`,
      name,
      sequence,
      project: this.currentProject?.id || '',
      status: 'waiting',
      frameRange,
      handleFrames: { head: 8, tail: 8 },
      fps: this.currentProject?.fps || 24,
      resolution: this.currentProject?.resolution || { width: 1920, height: 1080 },
      assignees: [],
      tasks: [],
      versions: [],
      dependencies: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.shots.set(shot.id, shot);
    this.localChanges.set(`shot_${shot.id}`, { type: 'created', shot });
    
    return shot;
  }

  /**
   * Create a new asset
   */
  createAsset(name: string, type: PipelineAsset['type'], category: string): PipelineAsset {
    const asset: PipelineAsset = {
      id: `asset_${Date.now()}`,
      name,
      type,
      category,
      project: this.currentProject?.id || '',
      status: 'wip',
      versions: [],
      dependencies: [],
      usedBy: [],
      tags: [],
      thumbnail: '',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.assets.set(asset.id, asset);
    this.localChanges.set(`asset_${asset.id}`, { type: 'created', asset });
    
    return asset;
  }

  dispose(): void {
    this.currentProject = null;
    this.shots.clear();
    this.assets.clear();
    this.tasks.clear();
    this.localChanges.clear();
    super.dispose();
  }
}
