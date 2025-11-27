/**
 * ReviewToolNode - Built-in review and annotation system
 * Version 3.1 - Pipeline & Collaboration
 * 
 * Features:
 * - Frame-accurate annotation
 * - Drawing tools (brush, line, shape, text)
 * - Version comparison (A/B, wipe, split)
 * - Review status management
 * - Comment threading
 * - Approval workflow
 * - Export annotations
 */

import { Node, DataType } from '../core/Node';

// Annotation interface
export interface ReviewAnnotation {
  id: string;
  frame: number;
  frameEnd?: number; // For range annotations
  type: 'brush' | 'line' | 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'marker';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  opacity: number;
  author: string;
  createdAt: string;
  layer: number;
}

// Comment interface
export interface ReviewComment {
  id: string;
  annotationId?: string;
  frame?: number;
  frameRange?: { start: number; end: number };
  content: string;
  author: string;
  createdAt: string;
  replies: ReviewComment[];
  resolved: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  tags: string[];
}

// Review session interface
export interface ReviewSession {
  id: string;
  name: string;
  version: string;
  status: 'in_progress' | 'pending' | 'approved' | 'needs_revision' | 'rejected';
  participants: ReviewParticipant[];
  annotations: ReviewAnnotation[];
  comments: ReviewComment[];
  comparisons: ReviewComparison[];
  createdAt: string;
  updatedAt: string;
  deadline?: string;
}

// Participant interface
export interface ReviewParticipant {
  id: string;
  name: string;
  role: 'reviewer' | 'artist' | 'supervisor' | 'client';
  hasApproved: boolean;
  lastActivity: string;
}

// Comparison interface
export interface ReviewComparison {
  id: string;
  sourceVersion: string;
  targetVersion: string;
  mode: 'side_by_side' | 'wipe' | 'onion_skin' | 'difference' | 'ab_toggle';
  wipePosition?: number;
  onionOpacity?: number;
}

// Drawing state interface
export interface DrawingState {
  isDrawing: boolean;
  currentTool: 'brush' | 'line' | 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'marker' | 'eraser' | 'select';
  currentColor: string;
  strokeWidth: number;
  fontSize: number;
  opacity: number;
  points: { x: number; y: number }[];
}

export class ReviewToolNode extends Node {
  private session: ReviewSession | null = null;
  private drawingState: DrawingState;
  private undoStack: ReviewAnnotation[][] = [];
  private redoStack: ReviewAnnotation[][] = [];
  private currentFrame: number = 1;

  constructor(id: string) {
    super(id, 'ReviewTool', 'Review Tool');
    this.metadata.category = 'Pipeline';
    this.metadata.description = 'Built-in review and annotation system for collaborative feedback';
    this.metadata.version = '3.1.0';
    
    // Initialize drawing state
    this.drawingState = {
      isDrawing: false,
      currentTool: 'brush',
      currentColor: '#FF0000',
      strokeWidth: 3,
      fontSize: 16,
      opacity: 1,
      points: []
    };
    
    // Inputs
    this.addInput('image', 'Input Image', DataType.IMAGE);
    this.addInput('imageB', 'Compare Image', DataType.IMAGE);
    this.addInput('sessionData', 'Session Data', DataType.ANY);
    this.addInput('importAnnotations', 'Import Annotations', DataType.ANY);
    
    // Outputs
    this.addOutput('annotatedImage', 'Annotated Image', DataType.IMAGE);
    this.addOutput('session', 'Session Data', DataType.ANY);
    this.addOutput('annotations', 'Annotations', DataType.ANY);
    this.addOutput('comments', 'Comments', DataType.ANY);
    this.addOutput('exportData', 'Export Data', DataType.ANY);
    
    // === SESSION SETTINGS ===
    this.setParameter('sessionName', 'Review Session');
    this.setParameter('versionId', '');
    this.setParameter('username', 'User');
    this.setParameter('userRole', 'reviewer'); // reviewer, artist, supervisor, client
    
    // === PLAYBACK SETTINGS ===
    this.setParameter('currentFrame', 1); // Slider
    this.setParameter('startFrame', 1); // Slider
    this.setParameter('endFrame', 100); // Slider
    this.setParameter('fps', 24); // Slider 1-120
    this.setParameter('playbackSpeed', 1.0); // Slider 0.1-4.0
    this.setParameter('loopPlayback', true); // Checkbox
    
    // === DRAWING TOOL SETTINGS ===
    this.setParameter('currentTool', 'brush'); // brush, line, arrow, rectangle, ellipse, text, marker, eraser, select
    this.setParameter('brushColor', '#FF0000'); // Color picker
    this.setParameter('strokeWidth', 3); // Slider 1-20
    this.setParameter('fontSize', 16); // Slider 8-72
    this.setParameter('opacity', 1.0); // Slider 0-1
    this.setParameter('fillEnabled', false); // Checkbox
    this.setParameter('fillColor', '#FF0000');
    this.setParameter('fillOpacity', 0.3); // Slider 0-1
    
    // === ANNOTATION SETTINGS ===
    this.setParameter('showAnnotations', true); // Checkbox
    this.setParameter('annotationLayer', 0); // Slider 0-9
    this.setParameter('showAllLayers', true); // Checkbox
    this.setParameter('persistAcrossFrames', false); // Checkbox
    this.setParameter('rangeAnnotation', false); // Checkbox - annotation applies to frame range
    this.setParameter('rangeStart', 1); // Slider
    this.setParameter('rangeEnd', 10); // Slider
    
    // === COMPARISON SETTINGS ===
    this.setParameter('comparisonEnabled', false); // Checkbox
    this.setParameter('comparisonMode', 'side_by_side'); // side_by_side, wipe, onion_skin, difference, ab_toggle
    this.setParameter('wipePosition', 0.5); // Slider 0-1
    this.setParameter('onionOpacity', 0.5); // Slider 0-1
    this.setParameter('abToggleKey', 'Tab'); // Key binding
    
    // === COMMENT SETTINGS ===
    this.setParameter('showComments', true); // Checkbox
    this.setParameter('showResolved', false); // Checkbox
    this.setParameter('filterByPriority', 'all'); // all, critical, high, normal, low
    this.setParameter('sortBy', 'frame'); // frame, priority, date
    
    // === APPROVAL SETTINGS ===
    this.setParameter('approvalRequired', true); // Checkbox
    this.setParameter('minApprovers', 1); // Slider 1-10
    this.setParameter('requireSupervisor', true); // Checkbox
    this.setParameter('autoAdvanceOnApproval', false); // Checkbox
    
    // === EXPORT SETTINGS ===
    this.setParameter('exportFormat', 'json'); // json, pdf, html, video
    this.setParameter('exportAnnotationsOnVideo', true); // Checkbox
    this.setParameter('exportCommentsAsPdf', false); // Checkbox
    this.setParameter('includeFrameGrabs', true); // Checkbox
    
    // === DISPLAY SETTINGS ===
    this.setParameter('showFrameNumbers', true); // Checkbox
    this.setParameter('showTimecode', true); // Checkbox
    this.setParameter('showGrid', false); // Checkbox
    this.setParameter('gridSize', 50); // Slider 10-200
    this.setParameter('showSafeArea', false); // Checkbox
    this.setParameter('safeAreaType', 'action'); // action, title
    
    // === KEYBOARD SHORTCUTS ===
    this.setParameter('enableShortcuts', true); // Checkbox
    this.setParameter('playPauseKey', 'Space');
    this.setParameter('nextFrameKey', 'Right');
    this.setParameter('prevFrameKey', 'Left');
    this.setParameter('approveKey', 'A');
    this.setParameter('rejectKey', 'R');
  }

  async process(): Promise<void> {
    // Get current frame
    this.currentFrame = this.getParameter('currentFrame');
    
    // Load session data if provided
    const sessionInput = this.inputs.get('sessionData');
    if (sessionInput?.value) {
      this.loadSession(sessionInput.value);
    }
    
    // Initialize session if needed
    if (!this.session) {
      this.initializeSession();
    }
    
    // Import annotations if provided
    const importInput = this.inputs.get('importAnnotations');
    if (importInput?.value) {
      this.importAnnotations(importInput.value);
    }
    
    // Update drawing state from parameters
    this.updateDrawingState();
    
    // Process image with annotations
    const imageInput = this.inputs.get('image');
    const imageBInput = this.inputs.get('imageB');
    
    if (imageInput?.value) {
      // Handle comparison if enabled
      if (this.getParameter('comparisonEnabled') && imageBInput?.value) {
        await this.processComparison(imageInput.value, imageBInput.value);
      } else {
        await this.processAnnotations(imageInput.value);
      }
    }
    
    // Generate outputs
    this.generateOutputs();
  }

  private initializeSession(): void {
    this.session = {
      id: `session_${Date.now()}`,
      name: this.getParameter('sessionName'),
      version: this.getParameter('versionId') || 'v001',
      status: 'in_progress',
      participants: [{
        id: 'user_001',
        name: this.getParameter('username'),
        role: this.getParameter('userRole'),
        hasApproved: false,
        lastActivity: new Date().toISOString()
      }],
      annotations: [],
      comments: [],
      comparisons: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private loadSession(data: unknown): void {
    const sessionData = data as Partial<ReviewSession>;
    
    if (this.session) {
      // Merge with existing session
      if (sessionData.annotations) {
        this.session.annotations = [...this.session.annotations, ...sessionData.annotations];
      }
      if (sessionData.comments) {
        this.session.comments = [...this.session.comments, ...sessionData.comments];
      }
      if (sessionData.participants) {
        for (const participant of sessionData.participants) {
          const existing = this.session.participants.find(p => p.id === participant.id);
          if (!existing) {
            this.session.participants.push(participant);
          }
        }
      }
    } else {
      this.session = sessionData as ReviewSession;
    }
  }

  private importAnnotations(data: unknown): void {
    if (!this.session) return;
    
    const annotations = Array.isArray(data) ? data : [data];
    
    for (const annData of annotations) {
      const ann = annData as Partial<ReviewAnnotation>;
      const annotation: ReviewAnnotation = {
        id: ann.id || `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        frame: ann.frame || this.currentFrame,
        frameEnd: ann.frameEnd,
        type: ann.type || 'marker',
        points: ann.points || [],
        color: ann.color || this.getParameter('brushColor'),
        strokeWidth: ann.strokeWidth || this.getParameter('strokeWidth'),
        text: ann.text,
        fontSize: ann.fontSize,
        opacity: ann.opacity || 1,
        author: ann.author || this.getParameter('username'),
        createdAt: ann.createdAt || new Date().toISOString(),
        layer: ann.layer || this.getParameter('annotationLayer')
      };
      
      this.session.annotations.push(annotation);
    }
  }

  private updateDrawingState(): void {
    this.drawingState.currentTool = this.getParameter('currentTool');
    this.drawingState.currentColor = this.getParameter('brushColor');
    this.drawingState.strokeWidth = this.getParameter('strokeWidth');
    this.drawingState.fontSize = this.getParameter('fontSize');
    this.drawingState.opacity = this.getParameter('opacity');
  }

  private async processAnnotations(image: unknown): Promise<void> {
    if (!this.session || !this.getParameter('showAnnotations')) {
      const output = this.outputs.get('annotatedImage');
      if (output) output.value = image;
      return;
    }
    
    // Get annotations for current frame
    const frameAnnotations = this.getFrameAnnotations(this.currentFrame);
    
    // In production, would render annotations onto image
    // For now, output image with annotation metadata
    const annotatedOutput = {
      image,
      frame: this.currentFrame,
      annotations: frameAnnotations,
      renderOverlay: true
    };
    
    const output = this.outputs.get('annotatedImage');
    if (output) output.value = annotatedOutput;
  }

  private async processComparison(imageA: unknown, imageB: unknown): Promise<void> {
    const mode = this.getParameter('comparisonMode');
    
    let comparisonResult: unknown;
    
    switch (mode) {
      case 'side_by_side':
        comparisonResult = {
          mode: 'side_by_side',
          left: imageA,
          right: imageB
        };
        break;
      case 'wipe':
        comparisonResult = {
          mode: 'wipe',
          imageA,
          imageB,
          wipePosition: this.getParameter('wipePosition')
        };
        break;
      case 'onion_skin':
        comparisonResult = {
          mode: 'onion_skin',
          base: imageA,
          overlay: imageB,
          opacity: this.getParameter('onionOpacity')
        };
        break;
      case 'difference':
        comparisonResult = {
          mode: 'difference',
          imageA,
          imageB
        };
        break;
      case 'ab_toggle':
        comparisonResult = {
          mode: 'ab_toggle',
          imageA,
          imageB,
          toggleKey: this.getParameter('abToggleKey')
        };
        break;
    }
    
    const output = this.outputs.get('annotatedImage');
    if (output) output.value = comparisonResult;
  }

  private getFrameAnnotations(frame: number): ReviewAnnotation[] {
    if (!this.session) return [];
    
    const showAllLayers = this.getParameter('showAllLayers');
    const currentLayer = this.getParameter('annotationLayer');
    
    return this.session.annotations.filter(ann => {
      // Check frame
      const inFrame = ann.frame === frame || 
                      (ann.frameEnd && frame >= ann.frame && frame <= ann.frameEnd);
      if (!inFrame) return false;
      
      // Check layer
      if (!showAllLayers && ann.layer !== currentLayer) return false;
      
      return true;
    });
  }

  private generateOutputs(): void {
    // Output session
    const sessionOutput = this.outputs.get('session');
    if (sessionOutput) {
      sessionOutput.value = this.session;
    }
    
    // Output annotations
    const annotationsOutput = this.outputs.get('annotations');
    if (annotationsOutput && this.session) {
      annotationsOutput.value = this.session.annotations;
    }
    
    // Output comments
    const commentsOutput = this.outputs.get('comments');
    if (commentsOutput && this.session) {
      let comments = [...this.session.comments];
      
      // Filter by resolved status
      if (!this.getParameter('showResolved')) {
        comments = comments.filter(c => !c.resolved);
      }
      
      // Filter by priority
      const priorityFilter = this.getParameter('filterByPriority');
      if (priorityFilter !== 'all') {
        comments = comments.filter(c => c.priority === priorityFilter);
      }
      
      // Sort
      const sortBy = this.getParameter('sortBy');
      comments.sort((a, b) => {
        switch (sortBy) {
          case 'frame':
            return (a.frame || 0) - (b.frame || 0);
          case 'priority':
            const priorities = { critical: 0, high: 1, normal: 2, low: 3 };
            return priorities[a.priority] - priorities[b.priority];
          case 'date':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
      
      commentsOutput.value = comments;
    }
    
    // Output export data
    const exportOutput = this.outputs.get('exportData');
    if (exportOutput && this.session) {
      const format = this.getParameter('exportFormat');
      exportOutput.value = this.generateExportData(format);
    }
  }

  private generateExportData(format: string): unknown {
    if (!this.session) return null;
    
    switch (format) {
      case 'json':
        return JSON.stringify(this.session, null, 2);
      case 'pdf':
        return this.generatePdfData();
      case 'html':
        return this.generateHtmlData();
      case 'video':
        return this.generateVideoData();
      default:
        return this.session;
    }
  }

  private generatePdfData(): unknown {
    // Generate PDF-ready data structure
    return {
      type: 'pdf',
      title: this.session?.name,
      version: this.session?.version,
      date: new Date().toISOString(),
      pages: this.session?.comments.map(c => ({
        frame: c.frame,
        comment: c.content,
        author: c.author,
        priority: c.priority
      })),
      summary: {
        totalComments: this.session?.comments.length,
        unresolvedComments: this.session?.comments.filter(c => !c.resolved).length,
        status: this.session?.status
      }
    };
  }

  private generateHtmlData(): string {
    const session = this.session;
    if (!session) return '';
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>${session.name} - Review Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
    .comment { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .comment.critical { border-left: 4px solid #ff0000; }
    .comment.high { border-left: 4px solid #ff9900; }
    .frame { color: #666; font-size: 12px; }
    .author { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${session.name}</h1>
    <p>Version: ${session.version} | Status: ${session.status}</p>
    <p>Created: ${session.createdAt}</p>
  </div>
  
  <h2>Comments (${session.comments.length})</h2>
  ${session.comments.map(c => `
    <div class="comment ${c.priority}">
      <div class="frame">Frame ${c.frame || 'N/A'}</div>
      <div class="author">${c.author}</div>
      <div class="content">${c.content}</div>
      <div class="meta">Priority: ${c.priority} | ${c.resolved ? 'Resolved' : 'Open'}</div>
    </div>
  `).join('')}
  
  <h2>Annotations Summary</h2>
  <p>Total annotations: ${session.annotations.length}</p>
</body>
</html>`;
  }

  private generateVideoData(): unknown {
    // Generate video export settings
    return {
      type: 'video',
      session: this.session?.id,
      burnInAnnotations: this.getParameter('exportAnnotationsOnVideo'),
      includeComments: true,
      frameRange: {
        start: this.getParameter('startFrame'),
        end: this.getParameter('endFrame')
      },
      fps: this.getParameter('fps'),
      format: 'mp4'
    };
  }

  // === PUBLIC API ===

  /**
   * Start drawing annotation
   */
  startDrawing(x: number, y: number): void {
    this.drawingState.isDrawing = true;
    this.drawingState.points = [{ x, y }];
    
    // Save state for undo
    if (this.session) {
      this.undoStack.push([...this.session.annotations]);
      this.redoStack = [];
    }
  }

  /**
   * Continue drawing
   */
  continueDrawing(x: number, y: number): void {
    if (!this.drawingState.isDrawing) return;
    this.drawingState.points.push({ x, y });
  }

  /**
   * End drawing and create annotation
   */
  endDrawing(): ReviewAnnotation | null {
    if (!this.drawingState.isDrawing || !this.session) return null;
    
    this.drawingState.isDrawing = false;
    
    const annotation: ReviewAnnotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      frame: this.currentFrame,
      frameEnd: this.getParameter('rangeAnnotation') ? this.getParameter('rangeEnd') : undefined,
      type: this.drawingState.currentTool as ReviewAnnotation['type'],
      points: [...this.drawingState.points],
      color: this.drawingState.currentColor,
      strokeWidth: this.drawingState.strokeWidth,
      opacity: this.drawingState.opacity,
      author: this.getParameter('username'),
      createdAt: new Date().toISOString(),
      layer: this.getParameter('annotationLayer')
    };
    
    this.session.annotations.push(annotation);
    this.session.updatedAt = new Date().toISOString();
    
    this.drawingState.points = [];
    
    return annotation;
  }

  /**
   * Add text annotation
   */
  addTextAnnotation(x: number, y: number, text: string): ReviewAnnotation | null {
    if (!this.session) return null;
    
    const annotation: ReviewAnnotation = {
      id: `ann_${Date.now()}`,
      frame: this.currentFrame,
      type: 'text',
      points: [{ x, y }],
      color: this.drawingState.currentColor,
      strokeWidth: this.drawingState.strokeWidth,
      text,
      fontSize: this.drawingState.fontSize,
      opacity: this.drawingState.opacity,
      author: this.getParameter('username'),
      createdAt: new Date().toISOString(),
      layer: this.getParameter('annotationLayer')
    };
    
    this.session.annotations.push(annotation);
    this.session.updatedAt = new Date().toISOString();
    
    return annotation;
  }

  /**
   * Add comment
   */
  addComment(content: string, frame?: number, annotationId?: string): ReviewComment | null {
    if (!this.session) return null;
    
    const comment: ReviewComment = {
      id: `comment_${Date.now()}`,
      annotationId,
      frame: frame || this.currentFrame,
      content,
      author: this.getParameter('username'),
      createdAt: new Date().toISOString(),
      replies: [],
      resolved: false,
      priority: 'normal',
      tags: []
    };
    
    this.session.comments.push(comment);
    this.session.updatedAt = new Date().toISOString();
    
    return comment;
  }

  /**
   * Reply to comment
   */
  replyToComment(commentId: string, content: string): ReviewComment | null {
    if (!this.session) return null;
    
    const parentComment = this.session.comments.find(c => c.id === commentId);
    if (!parentComment) return null;
    
    const reply: ReviewComment = {
      id: `comment_${Date.now()}`,
      content,
      author: this.getParameter('username'),
      createdAt: new Date().toISOString(),
      replies: [],
      resolved: false,
      priority: 'normal',
      tags: []
    };
    
    parentComment.replies.push(reply);
    this.session.updatedAt = new Date().toISOString();
    
    return reply;
  }

  /**
   * Resolve comment
   */
  resolveComment(commentId: string): void {
    if (!this.session) return;
    
    const comment = this.session.comments.find(c => c.id === commentId);
    if (comment) {
      comment.resolved = true;
      this.session.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Set comment priority
   */
  setCommentPriority(commentId: string, priority: ReviewComment['priority']): void {
    if (!this.session) return;
    
    const comment = this.session.comments.find(c => c.id === commentId);
    if (comment) {
      comment.priority = priority;
      this.session.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Delete annotation
   */
  deleteAnnotation(annotationId: string): void {
    if (!this.session) return;
    
    // Save state for undo
    this.undoStack.push([...this.session.annotations]);
    this.redoStack = [];
    
    this.session.annotations = this.session.annotations.filter(a => a.id !== annotationId);
    this.session.updatedAt = new Date().toISOString();
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (!this.session || this.undoStack.length === 0) return;
    
    this.redoStack.push([...this.session.annotations]);
    this.session.annotations = this.undoStack.pop()!;
    this.session.updatedAt = new Date().toISOString();
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    if (!this.session || this.redoStack.length === 0) return;
    
    this.undoStack.push([...this.session.annotations]);
    this.session.annotations = this.redoStack.pop()!;
    this.session.updatedAt = new Date().toISOString();
  }

  /**
   * Approve current version
   */
  approve(comment?: string): void {
    if (!this.session) return;
    
    const userId = 'user_001'; // Would be actual user ID
    const participant = this.session.participants.find(p => p.id === userId);
    if (participant) {
      participant.hasApproved = true;
      participant.lastActivity = new Date().toISOString();
    }
    
    if (comment) {
      this.addComment(comment);
    }
    
    // Check if approval criteria met
    const minApprovers = this.getParameter('minApprovers');
    const approvedCount = this.session.participants.filter(p => p.hasApproved).length;
    
    if (approvedCount >= minApprovers) {
      if (this.getParameter('requireSupervisor')) {
        const supervisorApproved = this.session.participants.some(
          p => p.role === 'supervisor' && p.hasApproved
        );
        if (supervisorApproved) {
          this.session.status = 'approved';
        }
      } else {
        this.session.status = 'approved';
      }
    }
    
    this.session.updatedAt = new Date().toISOString();
  }

  /**
   * Request revision
   */
  requestRevision(comment: string): void {
    if (!this.session) return;
    
    this.session.status = 'needs_revision';
    this.addComment(comment);
    
    // Add as high priority
    const lastComment = this.session.comments[this.session.comments.length - 1];
    if (lastComment) {
      lastComment.priority = 'high';
    }
    
    this.session.updatedAt = new Date().toISOString();
  }

  /**
   * Clear all annotations
   */
  clearAnnotations(): void {
    if (!this.session) return;
    
    this.undoStack.push([...this.session.annotations]);
    this.redoStack = [];
    
    this.session.annotations = [];
    this.session.updatedAt = new Date().toISOString();
  }

  /**
   * Go to frame
   */
  goToFrame(frame: number): void {
    this.currentFrame = frame;
    this.setParameter('currentFrame', frame);
  }

  /**
   * Get session
   */
  getSession(): ReviewSession | null {
    return this.session;
  }

  dispose(): void {
    this.session = null;
    this.undoStack = [];
    this.redoStack = [];
    super.dispose();
  }
}
