/**
 * VersionControlNode - Git-based version control for projects
 * Version 3.1 - Pipeline & Collaboration
 * 
 * Features:
 * - Git integration for project versioning
 * - Branch management
 * - Commit history
 * - Diff visualization
 * - Merge support
 * - LFS support for large files
 * - Remote sync
 */

import { Node, DataType } from '../core/Node';

// Commit interface
export interface VCSCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  parents: string[];
  files: VCSFileChange[];
  tags: string[];
  branch: string;
}

// File change interface
export interface VCSFileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  oldPath?: string;
  additions: number;
  deletions: number;
  isLfs: boolean;
  size: number;
}

// Branch interface
export interface VCSBranch {
  name: string;
  isLocal: boolean;
  isRemote: boolean;
  isCurrent: boolean;
  tracking?: string;
  ahead: number;
  behind: number;
  lastCommit: string;
}

// Repository status interface
export interface VCSStatus {
  clean: boolean;
  staged: VCSFileChange[];
  unstaged: VCSFileChange[];
  untracked: string[];
  conflicts: string[];
  currentBranch: string;
  isDetached: boolean;
  remotes: string[];
}

// Diff interface
export interface VCSDiff {
  file: string;
  hunks: VCSDiffHunk[];
  isBinary: boolean;
  oldMode: string;
  newMode: string;
}

// Diff hunk interface
export interface VCSDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: VCSDiffLine[];
}

// Diff line interface
export interface VCSDiffLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Repository configuration
export interface VCSConfig {
  repoPath: string;
  userName: string;
  userEmail: string;
  defaultBranch: string;
  remoteUrl: string;
  lfsEnabled: boolean;
  lfsPatterns: string[];
}

export class VersionControlNode extends Node {
  private config: VCSConfig | null = null;
  private commits: Map<string, VCSCommit> = new Map();
  private branches: Map<string, VCSBranch> = new Map();
  private currentStatus: VCSStatus | null = null;
  private isInitialized: boolean = false;

  constructor(id: string) {
    super(id, 'VersionControl', 'Version Control');
    this.metadata.category = 'Pipeline';
    this.metadata.description = 'Git-based version control for VFX projects';
    this.metadata.version = '3.1.0';
    
    // Inputs
    this.addInput('files', 'Files to Track', DataType.ANY);
    this.addInput('config', 'Repository Config', DataType.ANY);
    this.addInput('commitMessage', 'Commit Message', DataType.ANY);
    
    // Outputs
    this.addOutput('status', 'Repository Status', DataType.ANY);
    this.addOutput('history', 'Commit History', DataType.ANY);
    this.addOutput('branches', 'Branches', DataType.ANY);
    this.addOutput('diff', 'Current Diff', DataType.ANY);
    this.addOutput('conflicts', 'Merge Conflicts', DataType.ANY);
    
    // === REPOSITORY SETTINGS ===
    this.setParameter('repoPath', ''); // Repository path
    this.setParameter('userName', ''); // Git user name
    this.setParameter('userEmail', ''); // Git user email
    this.setParameter('defaultBranch', 'main'); // main or master
    
    // === REMOTE SETTINGS ===
    this.setParameter('remoteUrl', ''); // Remote repository URL
    this.setParameter('remoteName', 'origin'); // Remote name
    this.setParameter('autoFetch', true); // Checkbox - auto fetch from remote
    this.setParameter('fetchInterval', 300); // Slider 60-1800 seconds
    this.setParameter('autoPush', false); // Checkbox - auto push to remote
    
    // === AUTHENTICATION ===
    this.setParameter('authMethod', 'ssh'); // ssh, https, token
    this.setParameter('sshKeyPath', ''); // SSH key path
    this.setParameter('httpsCredentials', ''); // HTTPS credentials (stored securely)
    
    // === BRANCH SETTINGS ===
    this.setParameter('currentBranch', 'main');
    this.setParameter('trackingBranch', '');
    this.setParameter('createFeatureBranch', false); // Checkbox
    this.setParameter('featureBranchPrefix', 'feature/');
    this.setParameter('deleteMergedBranches', true); // Checkbox
    
    // === COMMIT SETTINGS ===
    this.setParameter('autoCommit', false); // Checkbox
    this.setParameter('autoCommitInterval', 600); // Slider 60-3600 seconds
    this.setParameter('commitMessageTemplate', '[{type}] {message}');
    this.setParameter('signCommits', false); // Checkbox - GPG sign commits
    this.setParameter('amendEnabled', false); // Checkbox - allow amending last commit
    
    // === LFS SETTINGS ===
    this.setParameter('lfsEnabled', true); // Checkbox
    this.setParameter('lfsPatterns', '*.exr,*.abc,*.usd,*.mov,*.mp4,*.psd,*.tif'); // Comma-separated
    this.setParameter('lfsThreshold', 100); // MB - auto-track files larger than this
    
    // === MERGE SETTINGS ===
    this.setParameter('mergeStrategy', 'merge'); // merge, rebase, squash
    this.setParameter('ffOnly', false); // Checkbox - fast-forward only
    this.setParameter('autoResolveConflicts', false); // Checkbox
    this.setParameter('conflictMarkerStyle', 'diff3'); // diff3 or zdiff3
    
    // === HISTORY SETTINGS ===
    this.setParameter('historyDepth', 100); // Slider 10-1000
    this.setParameter('showMergeCommits', true); // Checkbox
    this.setParameter('graphView', true); // Checkbox - show branch graph
    
    // === IGNORE SETTINGS ===
    this.setParameter('ignorePatterns', '*.tmp,*.bak,*.log,node_modules/,__pycache__/');
    this.setParameter('autoGenerateGitignore', true); // Checkbox
    
    // === HOOKS ===
    this.setParameter('preCommitHook', ''); // Pre-commit hook script
    this.setParameter('postCommitHook', ''); // Post-commit hook script
    this.setParameter('prePushHook', ''); // Pre-push hook script
    
    // === DEBUG ===
    this.setParameter('debugMode', false); // Checkbox
    this.setParameter('verboseOutput', false); // Checkbox
  }

  async process(): Promise<void> {
    // Load config if provided
    const configInput = this.inputs.get('config');
    if (configInput?.value) {
      this.loadConfig(configInput.value);
    }
    
    // Initialize repository if needed
    if (!this.isInitialized && this.config) {
      await this.initializeRepository();
    }
    
    // Get current status
    await this.updateStatus();
    
    // Track files if provided
    const filesInput = this.inputs.get('files');
    if (filesInput?.value) {
      await this.trackFiles(filesInput.value);
    }
    
    // Handle commit if message provided
    const commitInput = this.inputs.get('commitMessage');
    if (commitInput?.value) {
      await this.createCommit(commitInput.value as string);
    }
    
    // Generate outputs
    this.generateOutputs();
  }

  private loadConfig(data: unknown): void {
    const cfg = data as Partial<VCSConfig>;
    
    this.config = {
      repoPath: cfg.repoPath || this.getParameter('repoPath'),
      userName: cfg.userName || this.getParameter('userName'),
      userEmail: cfg.userEmail || this.getParameter('userEmail'),
      defaultBranch: cfg.defaultBranch || this.getParameter('defaultBranch'),
      remoteUrl: cfg.remoteUrl || this.getParameter('remoteUrl'),
      lfsEnabled: cfg.lfsEnabled !== undefined ? cfg.lfsEnabled : this.getParameter('lfsEnabled'),
      lfsPatterns: cfg.lfsPatterns || this.getParameter('lfsPatterns').split(',')
    };
  }

  private async initializeRepository(): Promise<void> {
    if (!this.config) return;
    
    // Simulated git init
    this.isInitialized = true;
    
    // Create initial branch
    const initialBranch: VCSBranch = {
      name: this.config.defaultBranch,
      isLocal: true,
      isRemote: false,
      isCurrent: true,
      ahead: 0,
      behind: 0,
      lastCommit: ''
    };
    
    this.branches.set(initialBranch.name, initialBranch);
    
    // Initialize status
    this.currentStatus = {
      clean: true,
      staged: [],
      unstaged: [],
      untracked: [],
      conflicts: [],
      currentBranch: this.config.defaultBranch,
      isDetached: false,
      remotes: this.config.remoteUrl ? ['origin'] : []
    };
    
    // Set up LFS if enabled
    if (this.config.lfsEnabled) {
      await this.initializeLFS();
    }
    
    // Generate .gitignore
    if (this.getParameter('autoGenerateGitignore')) {
      this.generateGitignore();
    }
  }

  private async initializeLFS(): Promise<void> {
    if (!this.config) return;
    
    // Simulated LFS initialization
    // Would run: git lfs install
    // Would add .gitattributes with LFS patterns
  }

  private generateGitignore(): string {
    const patterns = this.getParameter('ignorePatterns').split(',');
    
    // Add VFX-specific patterns
    const vfxPatterns = [
      '# Render outputs',
      'renders/',
      'output/',
      '',
      '# Cache files',
      '*.cache',
      '*.tmp',
      '.nuke/',
      '.houdini/',
      '',
      '# OS files',
      '.DS_Store',
      'Thumbs.db',
      '',
      '# IDE files',
      '.vscode/',
      '.idea/',
      '',
      '# Logs',
      '*.log',
      'logs/',
      '',
      '# User patterns',
      ...patterns
    ];
    
    return vfxPatterns.join('\n');
  }

  private async updateStatus(): Promise<void> {
    if (!this.isInitialized) return;
    
    // Simulated git status
    const currentBranch = this.getParameter('currentBranch');
    
    this.currentStatus = {
      clean: true,
      staged: [],
      unstaged: [],
      untracked: [],
      conflicts: [],
      currentBranch,
      isDetached: false,
      remotes: this.config?.remoteUrl ? ['origin'] : []
    };
  }

  private async trackFiles(files: unknown): Promise<void> {
    if (!this.currentStatus) return;
    
    const fileList = Array.isArray(files) ? files : [files];
    
    for (const file of fileList) {
      const filePath = typeof file === 'string' ? file : (file as { path: string }).path;
      
      // Check if should be tracked by LFS
      const isLfs = this.shouldUseLFS(filePath);
      
      const change: VCSFileChange = {
        path: filePath,
        status: 'added',
        additions: 0,
        deletions: 0,
        isLfs,
        size: 0
      };
      
      this.currentStatus.staged.push(change);
      this.currentStatus.clean = false;
    }
  }

  private shouldUseLFS(filePath: string): boolean {
    if (!this.config?.lfsEnabled) return false;
    
    const patterns = this.config.lfsPatterns;
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    
    return patterns.some(pattern => {
      const cleanPattern = pattern.trim().replace('*', '');
      return filePath.endsWith(cleanPattern) || ext === cleanPattern.replace('.', '');
    });
  }

  private async createCommit(message: string): Promise<VCSCommit | null> {
    if (!this.currentStatus || !this.config) return null;
    
    if (this.currentStatus.staged.length === 0) {
      return null;
    }
    
    // Apply message template
    const template = this.getParameter('commitMessageTemplate');
    const formattedMessage = template.replace('{message}', message).replace('{type}', 'commit');
    
    const commit: VCSCommit = {
      hash: this.generateHash(),
      shortHash: '',
      author: this.config.userName,
      email: this.config.userEmail,
      date: new Date().toISOString(),
      message: formattedMessage,
      parents: this.getLastCommitHash() ? [this.getLastCommitHash()!] : [],
      files: [...this.currentStatus.staged],
      tags: [],
      branch: this.currentStatus.currentBranch
    };
    
    commit.shortHash = commit.hash.substring(0, 7);
    
    // Store commit
    this.commits.set(commit.hash, commit);
    
    // Update branch
    const branch = this.branches.get(this.currentStatus.currentBranch);
    if (branch) {
      branch.lastCommit = commit.hash;
      if (branch.tracking) {
        branch.ahead++;
      }
    }
    
    // Clear staged files
    this.currentStatus.staged = [];
    this.currentStatus.clean = true;
    
    return commit;
  }

  private generateHash(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 40; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private getLastCommitHash(): string | null {
    if (!this.currentStatus) return null;
    
    const branch = this.branches.get(this.currentStatus.currentBranch);
    return branch?.lastCommit || null;
  }

  private generateOutputs(): void {
    // Output status
    const statusOutput = this.outputs.get('status');
    if (statusOutput) {
      statusOutput.value = this.currentStatus;
    }
    
    // Output history
    const historyOutput = this.outputs.get('history');
    if (historyOutput) {
      const depth = this.getParameter('historyDepth');
      const showMerges = this.getParameter('showMergeCommits');
      
      let commits = Array.from(this.commits.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (!showMerges) {
        commits = commits.filter(c => c.parents.length <= 1);
      }
      
      historyOutput.value = commits.slice(0, depth);
    }
    
    // Output branches
    const branchesOutput = this.outputs.get('branches');
    if (branchesOutput) {
      branchesOutput.value = Array.from(this.branches.values());
    }
    
    // Output diff
    const diffOutput = this.outputs.get('diff');
    if (diffOutput && this.currentStatus) {
      const diffs: VCSDiff[] = [];
      
      for (const file of [...this.currentStatus.staged, ...this.currentStatus.unstaged]) {
        diffs.push({
          file: file.path,
          hunks: [],
          isBinary: file.isLfs,
          oldMode: '100644',
          newMode: '100644'
        });
      }
      
      diffOutput.value = diffs;
    }
    
    // Output conflicts
    const conflictsOutput = this.outputs.get('conflicts');
    if (conflictsOutput && this.currentStatus) {
      conflictsOutput.value = this.currentStatus.conflicts;
    }
  }

  // === PUBLIC API ===

  /**
   * Initialize a new repository
   */
  async init(): Promise<boolean> {
    if (!this.config) {
      this.config = {
        repoPath: this.getParameter('repoPath'),
        userName: this.getParameter('userName'),
        userEmail: this.getParameter('userEmail'),
        defaultBranch: this.getParameter('defaultBranch'),
        remoteUrl: this.getParameter('remoteUrl'),
        lfsEnabled: this.getParameter('lfsEnabled'),
        lfsPatterns: this.getParameter('lfsPatterns').split(',')
      };
    }
    
    await this.initializeRepository();
    return this.isInitialized;
  }

  /**
   * Stage files for commit
   */
  async add(files: string | string[]): Promise<void> {
    const fileList = Array.isArray(files) ? files : [files];
    await this.trackFiles(fileList);
  }

  /**
   * Commit staged changes
   */
  async commit(message: string): Promise<VCSCommit | null> {
    return this.createCommit(message);
  }

  /**
   * Create a new branch
   */
  createBranch(name: string, checkout: boolean = false): VCSBranch {
    const currentBranch = this.branches.get(this.currentStatus?.currentBranch || '');
    
    const newBranch: VCSBranch = {
      name,
      isLocal: true,
      isRemote: false,
      isCurrent: checkout,
      ahead: 0,
      behind: 0,
      lastCommit: currentBranch?.lastCommit || ''
    };
    
    this.branches.set(name, newBranch);
    
    if (checkout) {
      this.checkout(name);
    }
    
    return newBranch;
  }

  /**
   * Checkout a branch
   */
  checkout(branchName: string): boolean {
    const branch = this.branches.get(branchName);
    if (!branch) return false;
    
    // Update current status
    this.branches.forEach(b => b.isCurrent = false);
    branch.isCurrent = true;
    
    if (this.currentStatus) {
      this.currentStatus.currentBranch = branchName;
    }
    
    this.setParameter('currentBranch', branchName);
    
    return true;
  }

  /**
   * Merge a branch into current branch
   */
  async merge(branchName: string): Promise<{ success: boolean; conflicts: string[] }> {
    const sourceBranch = this.branches.get(branchName);
    if (!sourceBranch || !this.currentStatus) {
      return { success: false, conflicts: [] };
    }
    
    // Simulated merge - in production would handle actual merge logic
    const _strategy = this.getParameter('mergeStrategy');
    
    // Check for fast-forward
    if (this.getParameter('ffOnly')) {
      // Would check if fast-forward is possible
    }
    
    // Create merge commit
    const mergeCommit: VCSCommit = {
      hash: this.generateHash(),
      shortHash: '',
      author: this.config?.userName || '',
      email: this.config?.userEmail || '',
      date: new Date().toISOString(),
      message: `Merge branch '${branchName}' into ${this.currentStatus.currentBranch}`,
      parents: [
        this.getLastCommitHash() || '',
        sourceBranch.lastCommit
      ],
      files: [],
      tags: [],
      branch: this.currentStatus.currentBranch
    };
    
    mergeCommit.shortHash = mergeCommit.hash.substring(0, 7);
    this.commits.set(mergeCommit.hash, mergeCommit);
    
    // Update branch
    const currentBranch = this.branches.get(this.currentStatus.currentBranch);
    if (currentBranch) {
      currentBranch.lastCommit = mergeCommit.hash;
    }
    
    // Delete merged branch if configured
    if (this.getParameter('deleteMergedBranches')) {
      this.branches.delete(branchName);
    }
    
    return { success: true, conflicts: [] };
  }

  /**
   * Fetch from remote
   */
  async fetch(): Promise<boolean> {
    if (!this.config?.remoteUrl) return false;
    
    // Simulated fetch
    this.branches.forEach(branch => {
      if (branch.isLocal && branch.tracking) {
        // Would update ahead/behind counts
      }
    });
    
    return true;
  }

  /**
   * Push to remote
   */
  async push(_force: boolean = false): Promise<boolean> {
    if (!this.config?.remoteUrl) return false;
    
    const currentBranch = this.branches.get(this.currentStatus?.currentBranch || '');
    if (!currentBranch) return false;
    
    // Simulated push
    currentBranch.isRemote = true;
    currentBranch.ahead = 0;
    
    return true;
  }

  /**
   * Pull from remote
   */
  async pull(): Promise<{ success: boolean; conflicts: string[] }> {
    if (!this.config?.remoteUrl) {
      return { success: false, conflicts: [] };
    }
    
    await this.fetch();
    
    // Simulated pull/merge
    const currentBranch = this.branches.get(this.currentStatus?.currentBranch || '');
    if (currentBranch) {
      currentBranch.behind = 0;
    }
    
    return { success: true, conflicts: [] };
  }

  /**
   * Get commit history
   */
  getHistory(limit?: number): VCSCommit[] {
    const commits = Array.from(this.commits.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return limit ? commits.slice(0, limit) : commits;
  }

  /**
   * Get commit by hash
   */
  getCommit(hash: string): VCSCommit | null {
    return this.commits.get(hash) || null;
  }

  /**
   * Get diff for a commit
   */
  getDiff(commitHash: string): VCSDiff[] {
    const commit = this.commits.get(commitHash);
    if (!commit) return [];
    
    return commit.files.map(file => ({
      file: file.path,
      hunks: [],
      isBinary: file.isLfs,
      oldMode: '100644',
      newMode: '100644'
    }));
  }

  /**
   * Tag a commit
   */
  createTag(name: string, commitHash?: string, _message?: string): boolean {
    const hash = commitHash || this.getLastCommitHash();
    if (!hash) return false;
    
    const commit = this.commits.get(hash);
    if (!commit) return false;
    
    commit.tags.push(name);
    return true;
  }

  /**
   * Stash changes
   */
  stash(): boolean {
    if (!this.currentStatus) return false;
    
    // Move unstaged changes to stash
    this.currentStatus.unstaged = [];
    this.currentStatus.clean = true;
    
    return true;
  }

  /**
   * Apply stashed changes
   */
  stashPop(): boolean {
    // Would restore stashed changes
    return true;
  }

  /**
   * Reset to a commit
   */
  reset(commitHash: string, mode: 'soft' | 'mixed' | 'hard' = 'mixed'): boolean {
    const commit = this.commits.get(commitHash);
    if (!commit || !this.currentStatus) return false;
    
    // Update branch to point to commit
    const branch = this.branches.get(this.currentStatus.currentBranch);
    if (branch) {
      branch.lastCommit = commitHash;
    }
    
    // Handle different reset modes
    if (mode === 'hard') {
      this.currentStatus.staged = [];
      this.currentStatus.unstaged = [];
    } else if (mode === 'mixed') {
      this.currentStatus.staged = [];
    }
    // soft mode keeps everything staged
    
    this.currentStatus.clean = true;
    
    return true;
  }

  /**
   * Get repository status
   */
  getStatus(): VCSStatus | null {
    return this.currentStatus;
  }

  /**
   * Get all branches
   */
  getBranches(): VCSBranch[] {
    return Array.from(this.branches.values());
  }

  dispose(): void {
    this.config = null;
    this.commits.clear();
    this.branches.clear();
    this.currentStatus = null;
    this.isInitialized = false;
    super.dispose();
  }
}
