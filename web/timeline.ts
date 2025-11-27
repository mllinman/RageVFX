/**
 * RageVFX Timeline System
 * Professional timeline editor with comprehensive features
 */

/**
 * Keyframe easing types
 */
export enum EasingType {
  LINEAR = 'linear',
  EASE_IN = 'easeIn',
  EASE_OUT = 'easeOut',
  EASE_IN_OUT = 'easeInOut',
  BEZIER = 'bezier',
  HOLD = 'hold',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic'
}

/**
 * Playback state
 */
export enum PlaybackState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused',
  SCRUBBING = 'scrubbing'
}

/**
 * Keyframe interface
 */
export interface Keyframe {
  id: string;
  frame: number;
  value: number | number[] | Record<string, number>;
  easing: EasingType;
  bezierHandles?: {
    in: { x: number; y: number };
    out: { x: number; y: number };
  };
  selected: boolean;
}

/**
 * Track interface for property animation
 */
export interface Track {
  id: string;
  name: string;
  propertyPath: string;
  nodeId: string;
  keyframes: Keyframe[];
  color: string;
  muted: boolean;
  locked: boolean;
  expanded: boolean;
  visible: boolean;
}

/**
 * Layer group for organizing tracks
 */
export interface LayerGroup {
  id: string;
  name: string;
  tracks: Track[];
  collapsed: boolean;
  color: string;
}

/**
 * Marker for timeline annotations
 */
export interface TimelineMarker {
  id: string;
  frame: number;
  name: string;
  color: string;
  type: 'marker' | 'inPoint' | 'outPoint' | 'chapter';
}

/**
 * Timeline state
 */
export interface TimelineState {
  currentFrame: number;
  startFrame: number;
  endFrame: number;
  inPoint: number;
  outPoint: number;
  fps: number;
  playbackState: PlaybackState;
  zoom: number;
  scrollOffset: number;
  selectedTracks: Set<string>;
  selectedKeyframes: Set<string>;
}

/**
 * Timeline Editor class
 */
export class Timeline {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement;
  
  // Timeline state
  private state: TimelineState = {
    currentFrame: 0,
    startFrame: 0,
    endFrame: 300,
    inPoint: 0,
    outPoint: 300,
    fps: 24,
    playbackState: PlaybackState.STOPPED,
    zoom: 1.0,
    scrollOffset: 0,
    selectedTracks: new Set(),
    selectedKeyframes: new Set()
  };
  
  // Data
  private tracks: Track[] = [];
  private layerGroups: LayerGroup[] = [];
  private markers: TimelineMarker[] = [];
  
  // Dimensions
  private width: number = 0;
  private height: number = 0;
  private trackHeight: number = 28;
  private rulerHeight: number = 32;
  private trackListWidth: number = 200;
  private keyframeSize: number = 8;
  
  // Interaction state
  private isDragging: boolean = false;
  private isDraggingPlayhead: boolean = false;
  private isDraggingKeyframe: boolean = false;
  private isSelecting: boolean = false;
  private selectionRect: { x: number; y: number; w: number; h: number } | null = null;
  private dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private hoveredKeyframe: Keyframe | null = null;
  private hoveredTrack: Track | null = null;
  
  // Animation
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  
  // Callbacks
  private onFrameChange: ((frame: number) => void) | null = null;
  private onKeyframeChange: ((keyframe: Keyframe) => void) | null = null;
  private onPlaybackStateChange: ((state: PlaybackState) => void) | null = null;

  // Visual settings
  private colors = {
    background: '#1a1a1a',
    rulerBg: '#252525',
    rulerText: '#888888',
    rulerLine: '#444444',
    playhead: '#ff6b35',
    playheadLine: 'rgba(255, 107, 53, 0.5)',
    trackBg: '#1e1e1e',
    trackAltBg: '#222222',
    trackHover: '#2a2a2a',
    trackSelected: '#333333',
    keyframe: '#4a9eff',
    keyframeSelected: '#ffcc00',
    keyframeHover: '#66bbff',
    selection: 'rgba(74, 158, 255, 0.2)',
    selectionBorder: 'rgba(74, 158, 255, 0.5)',
    inOutRegion: 'rgba(255, 107, 53, 0.1)',
    marker: '#ff6b35',
    grid: '#2a2a2a',
    waveform: '#4a9eff'
  };

  constructor(container: HTMLElement) {
    this.container = container;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'timeline-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    this.resize();
    this.setupEventListeners();
    this.render();
  }

  private resize(): void {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.render();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseLeave());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on ruler (playhead scrub)
    if (y < this.rulerHeight) {
      this.isDraggingPlayhead = true;
      this.scrubToPosition(x);
      return;
    }
    
    // Check if clicking on keyframe
    const keyframe = this.getKeyframeAtPosition(x, y);
    if (keyframe) {
      if (!e.shiftKey && !this.state.selectedKeyframes.has(keyframe.id)) {
        this.state.selectedKeyframes.clear();
      }
      
      if (e.shiftKey && this.state.selectedKeyframes.has(keyframe.id)) {
        this.state.selectedKeyframes.delete(keyframe.id);
      } else {
        this.state.selectedKeyframes.add(keyframe.id);
        keyframe.selected = true;
      }
      
      this.isDraggingKeyframe = true;
      this.dragStartPos = { x, y };
      this.render();
      return;
    }
    
    // Check if clicking on track
    const track = this.getTrackAtPosition(y);
    if (track && x < this.trackListWidth) {
      if (!e.shiftKey) {
        this.state.selectedTracks.clear();
      }
      this.state.selectedTracks.add(track.id);
      this.render();
      return;
    }
    
    // Start selection rectangle
    if (x > this.trackListWidth) {
      this.isSelecting = true;
      this.dragStartPos = { x, y };
      this.selectionRect = { x, y, w: 0, h: 0 };
      
      if (!e.shiftKey) {
        this.state.selectedKeyframes.clear();
        this.updateKeyframeSelection();
      }
    }
    
    this.isDragging = true;
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update hover states
    this.hoveredKeyframe = this.getKeyframeAtPosition(x, y);
    this.hoveredTrack = this.getTrackAtPosition(y);
    
    // Update cursor
    if (y < this.rulerHeight) {
      this.canvas.style.cursor = 'ew-resize';
    } else if (this.hoveredKeyframe) {
      this.canvas.style.cursor = 'pointer';
    } else if (x < this.trackListWidth) {
      this.canvas.style.cursor = 'default';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
    
    // Handle playhead scrubbing
    if (this.isDraggingPlayhead) {
      this.scrubToPosition(x);
      return;
    }
    
    // Handle keyframe dragging
    if (this.isDraggingKeyframe) {
      const dx = x - this.dragStartPos.x;
      const frameOffset = Math.round(dx / this.getPixelsPerFrame());
      
      if (frameOffset !== 0) {
        this.moveSelectedKeyframes(frameOffset);
        this.dragStartPos = { x, y };
      }
      return;
    }
    
    // Handle selection rectangle
    if (this.isSelecting && this.selectionRect) {
      this.selectionRect.w = x - this.selectionRect.x;
      this.selectionRect.h = y - this.selectionRect.y;
      this.updateSelectionFromRect();
      this.render();
      return;
    }
    
    // Handle horizontal scrolling with middle mouse or shift+drag
    if (this.isDragging && e.shiftKey) {
      const dx = x - this.dragStartPos.x;
      this.state.scrollOffset = Math.max(0, this.state.scrollOffset - dx);
      this.dragStartPos = { x, y };
      this.render();
      return;
    }
    
    this.render();
  }

  private onMouseUp(e: MouseEvent): void {
    this.isDragging = false;
    this.isDraggingPlayhead = false;
    this.isDraggingKeyframe = false;
    this.isSelecting = false;
    this.selectionRect = null;
    this.render();
  }

  private onMouseLeave(): void {
    this.hoveredKeyframe = null;
    this.hoveredTrack = null;
    this.render();
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.state.zoom = Math.max(0.1, Math.min(10, this.state.zoom * zoomFactor));
    } else {
      // Scroll
      this.state.scrollOffset = Math.max(0, this.state.scrollOffset + e.deltaX + e.deltaY);
    }
    
    this.render();
  }

  private onDoubleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Double-click on track area creates a keyframe
    if (x > this.trackListWidth && y > this.rulerHeight) {
      const track = this.getTrackAtPosition(y);
      if (track && !track.locked) {
        const frame = this.positionToFrame(x);
        this.addKeyframe(track.id, frame, 0);
      }
    }
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    // Context menu would be shown here
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Check if timeline has focus or we're targeting the canvas
    if (document.activeElement !== this.canvas && 
        !this.container.contains(document.activeElement)) {
      return;
    }
    
    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlayback();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (e.shiftKey) {
          this.jumpToKeyframe('prev');
        } else {
          this.setCurrentFrame(this.state.currentFrame - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (e.shiftKey) {
          this.jumpToKeyframe('next');
        } else {
          this.setCurrentFrame(this.state.currentFrame + 1);
        }
        break;
      case 'Home':
        e.preventDefault();
        this.setCurrentFrame(this.state.inPoint);
        break;
      case 'End':
        e.preventDefault();
        this.setCurrentFrame(this.state.outPoint);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        this.deleteSelectedKeyframes();
        break;
      case 'i':
        e.preventDefault();
        this.setInPoint(this.state.currentFrame);
        break;
      case 'o':
        e.preventDefault();
        this.setOutPoint(this.state.currentFrame);
        break;
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.selectAllKeyframes();
        }
        break;
    }
  }

  // Helper methods
  private getPixelsPerFrame(): number {
    return 10 * this.state.zoom;
  }

  private frameToPosition(frame: number): number {
    return this.trackListWidth + (frame - this.state.startFrame) * this.getPixelsPerFrame() - this.state.scrollOffset;
  }

  private positionToFrame(x: number): number {
    return Math.round((x - this.trackListWidth + this.state.scrollOffset) / this.getPixelsPerFrame() + this.state.startFrame);
  }

  private scrubToPosition(x: number): void {
    const frame = this.positionToFrame(x);
    this.setCurrentFrame(Math.max(this.state.startFrame, Math.min(this.state.endFrame, frame)));
  }

  private getKeyframeAtPosition(x: number, y: number): Keyframe | null {
    if (x < this.trackListWidth || y < this.rulerHeight) return null;
    
    const trackIndex = Math.floor((y - this.rulerHeight) / this.trackHeight);
    if (trackIndex < 0 || trackIndex >= this.tracks.length) return null;
    
    const track = this.tracks[trackIndex];
    const tolerance = this.keyframeSize;
    
    for (const keyframe of track.keyframes) {
      const kfX = this.frameToPosition(keyframe.frame);
      const kfY = this.rulerHeight + trackIndex * this.trackHeight + this.trackHeight / 2;
      
      if (Math.abs(x - kfX) <= tolerance && Math.abs(y - kfY) <= tolerance) {
        return keyframe;
      }
    }
    
    return null;
  }

  private getTrackAtPosition(y: number): Track | null {
    if (y < this.rulerHeight) return null;
    
    const trackIndex = Math.floor((y - this.rulerHeight) / this.trackHeight);
    if (trackIndex < 0 || trackIndex >= this.tracks.length) return null;
    
    return this.tracks[trackIndex];
  }

  private updateKeyframeSelection(): void {
    for (const track of this.tracks) {
      for (const keyframe of track.keyframes) {
        keyframe.selected = this.state.selectedKeyframes.has(keyframe.id);
      }
    }
  }

  private updateSelectionFromRect(): void {
    if (!this.selectionRect) return;
    
    const rect = {
      x: Math.min(this.selectionRect.x, this.selectionRect.x + this.selectionRect.w),
      y: Math.min(this.selectionRect.y, this.selectionRect.y + this.selectionRect.h),
      w: Math.abs(this.selectionRect.w),
      h: Math.abs(this.selectionRect.h)
    };
    
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      
      for (const keyframe of track.keyframes) {
        const kfX = this.frameToPosition(keyframe.frame);
        const kfY = this.rulerHeight + i * this.trackHeight + this.trackHeight / 2;
        
        if (kfX >= rect.x && kfX <= rect.x + rect.w &&
            kfY >= rect.y && kfY <= rect.y + rect.h) {
          this.state.selectedKeyframes.add(keyframe.id);
          keyframe.selected = true;
        }
      }
    }
  }

  private moveSelectedKeyframes(frameOffset: number): void {
    for (const track of this.tracks) {
      if (track.locked) continue;
      
      for (const keyframe of track.keyframes) {
        if (keyframe.selected) {
          keyframe.frame = Math.max(this.state.startFrame, 
            Math.min(this.state.endFrame, keyframe.frame + frameOffset));
          
          if (this.onKeyframeChange) {
            this.onKeyframeChange(keyframe);
          }
        }
      }
    }
    
    this.render();
  }

  // Public API
  play(): void {
    if (this.state.playbackState === PlaybackState.PLAYING) return;
    
    this.state.playbackState = PlaybackState.PLAYING;
    this.lastFrameTime = performance.now();
    
    if (this.onPlaybackStateChange) {
      this.onPlaybackStateChange(this.state.playbackState);
    }
    
    this.animate();
  }

  pause(): void {
    this.state.playbackState = PlaybackState.PAUSED;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.onPlaybackStateChange) {
      this.onPlaybackStateChange(this.state.playbackState);
    }
  }

  stop(): void {
    this.pause();
    this.state.playbackState = PlaybackState.STOPPED;
    this.setCurrentFrame(this.state.inPoint);
    
    if (this.onPlaybackStateChange) {
      this.onPlaybackStateChange(this.state.playbackState);
    }
  }

  togglePlayback(): void {
    if (this.state.playbackState === PlaybackState.PLAYING) {
      this.pause();
    } else {
      this.play();
    }
  }

  private animate(): void {
    if (this.state.playbackState !== PlaybackState.PLAYING) return;
    
    const now = performance.now();
    const frameDuration = 1000 / this.state.fps;
    
    if (now - this.lastFrameTime >= frameDuration) {
      let nextFrame = this.state.currentFrame + 1;
      
      if (nextFrame > this.state.outPoint) {
        nextFrame = this.state.inPoint;
      }
      
      this.setCurrentFrame(nextFrame);
      this.lastFrameTime = now;
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  setCurrentFrame(frame: number): void {
    this.state.currentFrame = Math.max(this.state.startFrame, 
      Math.min(this.state.endFrame, Math.round(frame)));
    
    if (this.onFrameChange) {
      this.onFrameChange(this.state.currentFrame);
    }
    
    this.render();
  }

  getCurrentFrame(): number {
    return this.state.currentFrame;
  }

  setInPoint(frame: number): void {
    this.state.inPoint = Math.max(this.state.startFrame, 
      Math.min(this.state.outPoint - 1, frame));
    this.render();
  }

  setOutPoint(frame: number): void {
    this.state.outPoint = Math.max(this.state.inPoint + 1, 
      Math.min(this.state.endFrame, frame));
    this.render();
  }

  setFPS(fps: number): void {
    this.state.fps = Math.max(1, Math.min(120, fps));
  }

  getFPS(): number {
    return this.state.fps;
  }

  setDuration(startFrame: number, endFrame: number): void {
    this.state.startFrame = startFrame;
    this.state.endFrame = endFrame;
    this.state.inPoint = Math.max(startFrame, this.state.inPoint);
    this.state.outPoint = Math.min(endFrame, this.state.outPoint);
    this.state.currentFrame = Math.max(startFrame, Math.min(endFrame, this.state.currentFrame));
    this.render();
  }

  // Track management
  addTrack(nodeId: string, propertyPath: string, name: string): Track {
    const track: Track = {
      id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      propertyPath,
      nodeId,
      keyframes: [],
      color: this.getRandomColor(),
      muted: false,
      locked: false,
      expanded: true,
      visible: true
    };
    
    this.tracks.push(track);
    this.render();
    return track;
  }

  removeTrack(trackId: string): void {
    this.tracks = this.tracks.filter(t => t.id !== trackId);
    this.state.selectedTracks.delete(trackId);
    this.render();
  }

  getTrack(trackId: string): Track | undefined {
    return this.tracks.find(t => t.id === trackId);
  }

  // Keyframe management
  addKeyframe(trackId: string, frame: number, value: number | number[] | Record<string, number>): Keyframe | null {
    const track = this.getTrack(trackId);
    if (!track || track.locked) return null;
    
    // Check if keyframe already exists at this frame
    const existingIndex = track.keyframes.findIndex(k => k.frame === frame);
    if (existingIndex !== -1) {
      track.keyframes[existingIndex].value = value;
      this.render();
      return track.keyframes[existingIndex];
    }
    
    const keyframe: Keyframe = {
      id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      frame,
      value,
      easing: EasingType.EASE_IN_OUT,
      selected: false
    };
    
    track.keyframes.push(keyframe);
    track.keyframes.sort((a, b) => a.frame - b.frame);
    
    if (this.onKeyframeChange) {
      this.onKeyframeChange(keyframe);
    }
    
    this.render();
    return keyframe;
  }

  deleteSelectedKeyframes(): void {
    for (const track of this.tracks) {
      if (track.locked) continue;
      track.keyframes = track.keyframes.filter(k => !k.selected);
    }
    
    this.state.selectedKeyframes.clear();
    this.render();
  }

  selectAllKeyframes(): void {
    for (const track of this.tracks) {
      for (const keyframe of track.keyframes) {
        this.state.selectedKeyframes.add(keyframe.id);
        keyframe.selected = true;
      }
    }
    this.render();
  }

  jumpToKeyframe(direction: 'prev' | 'next'): void {
    const keyframes: number[] = [];
    
    for (const track of this.tracks) {
      for (const keyframe of track.keyframes) {
        if (!keyframes.includes(keyframe.frame)) {
          keyframes.push(keyframe.frame);
        }
      }
    }
    
    keyframes.sort((a, b) => a - b);
    
    if (direction === 'next') {
      const next = keyframes.find(f => f > this.state.currentFrame);
      if (next !== undefined) {
        this.setCurrentFrame(next);
      }
    } else {
      const prev = [...keyframes].reverse().find(f => f < this.state.currentFrame);
      if (prev !== undefined) {
        this.setCurrentFrame(prev);
      }
    }
  }

  // Markers
  addMarker(frame: number, name: string, type: TimelineMarker['type'] = 'marker'): TimelineMarker {
    const marker: TimelineMarker = {
      id: `marker_${Date.now()}`,
      frame,
      name,
      color: this.colors.marker,
      type
    };
    
    this.markers.push(marker);
    this.markers.sort((a, b) => a.frame - b.frame);
    this.render();
    return marker;
  }

  removeMarker(markerId: string): void {
    this.markers = this.markers.filter(m => m.id !== markerId);
    this.render();
  }

  // Rendering
  render(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw components
    this.drawInOutRegion();
    this.drawTracks();
    this.drawRuler();
    this.drawKeyframes();
    this.drawMarkers();
    this.drawSelectionRect();
    this.drawPlayhead();
    this.drawTrackList();
  }

  private drawRuler(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Ruler background
    ctx.fillStyle = this.colors.rulerBg;
    ctx.fillRect(this.trackListWidth, 0, this.width - this.trackListWidth, this.rulerHeight);
    
    // Draw frame numbers and ticks
    const pixelsPerFrame = this.getPixelsPerFrame();
    const majorInterval = this.calculateMajorInterval();
    const minorInterval = majorInterval / 5;
    
    ctx.strokeStyle = this.colors.rulerLine;
    ctx.fillStyle = this.colors.rulerText;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    for (let frame = this.state.startFrame; frame <= this.state.endFrame; frame++) {
      const x = this.frameToPosition(frame);
      
      if (x < this.trackListWidth || x > this.width) continue;
      
      const isMajor = frame % majorInterval === 0;
      const isMinor = frame % minorInterval === 0;
      
      if (isMajor) {
        ctx.beginPath();
        ctx.moveTo(x, this.rulerHeight - 12);
        ctx.lineTo(x, this.rulerHeight);
        ctx.stroke();
        
        ctx.fillText(this.formatTimecode(frame), x, this.rulerHeight - 16);
      } else if (isMinor) {
        ctx.beginPath();
        ctx.moveTo(x, this.rulerHeight - 6);
        ctx.lineTo(x, this.rulerHeight);
        ctx.stroke();
      }
    }
    
    // Track list header
    ctx.fillStyle = this.colors.rulerBg;
    ctx.fillRect(0, 0, this.trackListWidth, this.rulerHeight);
    
    ctx.fillStyle = this.colors.rulerText;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Tracks', 10, this.rulerHeight / 2 + 4);
    
    // Time/frame info
    ctx.textAlign = 'right';
    ctx.fillText(`${this.state.fps} fps`, this.trackListWidth - 10, this.rulerHeight / 2 + 4);
  }

  private calculateMajorInterval(): number {
    const pixelsPerFrame = this.getPixelsPerFrame();
    
    if (pixelsPerFrame >= 20) return 1;
    if (pixelsPerFrame >= 10) return 5;
    if (pixelsPerFrame >= 5) return 10;
    if (pixelsPerFrame >= 2) return 25;
    if (pixelsPerFrame >= 1) return 50;
    return 100;
  }

  private formatTimecode(frame: number): string {
    const fps = this.state.fps;
    const totalSeconds = frame / fps;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const frames = frame % fps;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }
    return `${seconds}:${frames.toString().padStart(2, '0')}`;
  }

  private drawTracks(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const y = this.rulerHeight + i * this.trackHeight;
      
      // Track background
      let bgColor = i % 2 === 0 ? this.colors.trackBg : this.colors.trackAltBg;
      
      if (this.state.selectedTracks.has(track.id)) {
        bgColor = this.colors.trackSelected;
      } else if (this.hoveredTrack?.id === track.id) {
        bgColor = this.colors.trackHover;
      }
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(this.trackListWidth, y, this.width - this.trackListWidth, this.trackHeight);
      
      // Track border
      ctx.strokeStyle = this.colors.grid;
      ctx.beginPath();
      ctx.moveTo(this.trackListWidth, y + this.trackHeight);
      ctx.lineTo(this.width, y + this.trackHeight);
      ctx.stroke();
    }
  }

  private drawTrackList(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Track list background
    ctx.fillStyle = this.colors.rulerBg;
    ctx.fillRect(0, this.rulerHeight, this.trackListWidth, this.height - this.rulerHeight);
    
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const y = this.rulerHeight + i * this.trackHeight;
      
      // Track row background
      let bgColor = i % 2 === 0 ? this.colors.trackBg : this.colors.trackAltBg;
      if (this.state.selectedTracks.has(track.id)) {
        bgColor = this.colors.trackSelected;
      }
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, y, this.trackListWidth, this.trackHeight);
      
      // Track color indicator
      ctx.fillStyle = track.color;
      ctx.fillRect(0, y, 4, this.trackHeight);
      
      // Track name
      ctx.fillStyle = track.muted ? '#666' : '#ddd';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(track.name, 12, y + this.trackHeight / 2);
      
      // Lock/mute icons
      if (track.locked) {
        ctx.fillStyle = '#888';
        ctx.fillText('🔒', this.trackListWidth - 35, y + this.trackHeight / 2);
      }
      if (track.muted) {
        ctx.fillStyle = '#888';
        ctx.fillText('🔇', this.trackListWidth - 18, y + this.trackHeight / 2);
      }
      
      // Border
      ctx.strokeStyle = this.colors.grid;
      ctx.beginPath();
      ctx.moveTo(0, y + this.trackHeight);
      ctx.lineTo(this.trackListWidth, y + this.trackHeight);
      ctx.stroke();
    }
    
    // Separator line
    ctx.strokeStyle = this.colors.rulerLine;
    ctx.beginPath();
    ctx.moveTo(this.trackListWidth, this.rulerHeight);
    ctx.lineTo(this.trackListWidth, this.height);
    ctx.stroke();
  }

  private drawKeyframes(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      if (track.muted) continue;
      
      const y = this.rulerHeight + i * this.trackHeight + this.trackHeight / 2;
      
      // Draw keyframe connections
      ctx.strokeStyle = track.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      let prevX: number | null = null;
      for (const keyframe of track.keyframes) {
        const x = this.frameToPosition(keyframe.frame);
        
        if (x < this.trackListWidth || x > this.width) {
          prevX = x;
          continue;
        }
        
        if (prevX !== null) {
          ctx.moveTo(prevX, y);
          ctx.lineTo(x, y);
        }
        prevX = x;
      }
      ctx.stroke();
      
      // Draw keyframes
      for (const keyframe of track.keyframes) {
        const x = this.frameToPosition(keyframe.frame);
        
        if (x < this.trackListWidth || x > this.width) continue;
        
        // Keyframe diamond shape
        ctx.beginPath();
        ctx.moveTo(x, y - this.keyframeSize);
        ctx.lineTo(x + this.keyframeSize, y);
        ctx.lineTo(x, y + this.keyframeSize);
        ctx.lineTo(x - this.keyframeSize, y);
        ctx.closePath();
        
        // Fill color based on state
        if (keyframe.selected) {
          ctx.fillStyle = this.colors.keyframeSelected;
        } else if (this.hoveredKeyframe?.id === keyframe.id) {
          ctx.fillStyle = this.colors.keyframeHover;
        } else {
          ctx.fillStyle = track.color;
        }
        ctx.fill();
        
        // Border
        ctx.strokeStyle = keyframe.selected ? '#fff' : '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  private drawPlayhead(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const x = this.frameToPosition(this.state.currentFrame);
    
    if (x < this.trackListWidth || x > this.width) return;
    
    // Playhead line
    ctx.strokeStyle = this.colors.playheadLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, this.rulerHeight);
    ctx.lineTo(x, this.height);
    ctx.stroke();
    
    // Playhead handle
    ctx.fillStyle = this.colors.playhead;
    ctx.beginPath();
    ctx.moveTo(x - 8, 0);
    ctx.lineTo(x + 8, 0);
    ctx.lineTo(x + 8, this.rulerHeight - 8);
    ctx.lineTo(x, this.rulerHeight);
    ctx.lineTo(x - 8, this.rulerHeight - 8);
    ctx.closePath();
    ctx.fill();
    
    // Current frame text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.state.currentFrame.toString(), x, (this.rulerHeight - 8) / 2);
  }

  private drawInOutRegion(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    const inX = this.frameToPosition(this.state.inPoint);
    const outX = this.frameToPosition(this.state.outPoint);
    
    // Shade outside work area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    
    if (inX > this.trackListWidth) {
      ctx.fillRect(this.trackListWidth, this.rulerHeight, 
        inX - this.trackListWidth, this.height - this.rulerHeight);
    }
    
    if (outX < this.width) {
      ctx.fillRect(outX, this.rulerHeight, 
        this.width - outX, this.height - this.rulerHeight);
    }
    
    // In/Out point markers
    ctx.fillStyle = this.colors.marker;
    
    if (inX >= this.trackListWidth && inX <= this.width) {
      ctx.fillRect(inX - 2, this.rulerHeight, 4, 10);
    }
    
    if (outX >= this.trackListWidth && outX <= this.width) {
      ctx.fillRect(outX - 2, this.rulerHeight, 4, 10);
    }
  }

  private drawMarkers(): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    for (const marker of this.markers) {
      const x = this.frameToPosition(marker.frame);
      
      if (x < this.trackListWidth || x > this.width) continue;
      
      // Marker triangle
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.moveTo(x, this.rulerHeight - 5);
      ctx.lineTo(x - 5, this.rulerHeight - 12);
      ctx.lineTo(x + 5, this.rulerHeight - 12);
      ctx.closePath();
      ctx.fill();
      
      // Marker line
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, this.rulerHeight);
      ctx.lineTo(x, this.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private drawSelectionRect(): void {
    if (!this.ctx || !this.selectionRect) return;
    
    const ctx = this.ctx;
    const rect = this.selectionRect;
    
    ctx.fillStyle = this.colors.selection;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    
    ctx.strokeStyle = this.colors.selectionBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  private getRandomColor(): string {
    const colors = [
      '#4a9eff', '#ff6b35', '#4caf50', '#ff9800', 
      '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Callbacks
  setOnFrameChange(callback: (frame: number) => void): void {
    this.onFrameChange = callback;
  }

  setOnKeyframeChange(callback: (keyframe: Keyframe) => void): void {
    this.onKeyframeChange = callback;
  }

  setOnPlaybackStateChange(callback: (state: PlaybackState) => void): void {
    this.onPlaybackStateChange = callback;
  }

  // State getters
  getState(): TimelineState {
    return { ...this.state };
  }

  getTracks(): Track[] {
    return [...this.tracks];
  }

  getMarkers(): TimelineMarker[] {
    return [...this.markers];
  }

  dispose(): void {
    this.stop();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Export types
export type { Track, Keyframe, LayerGroup, TimelineMarker, TimelineState };
