/**
 * FluidCacheNode - File caching for fluid simulations
 * Version 3.2 - Fluid Physics System
 */

import { Node, DataType } from '../core/Node';

interface CacheFrame {
  frame: number;
  timestamp: number;
  path: string;
  size: number;
  compressed: boolean;
  valid: boolean;
}

interface CacheStatistics {
  totalFrames: number;
  cachedFrames: number;
  totalSize: number;
  averageFrameSize: number;
  compressionRatio: number;
  cacheHitRate: number;
}

export class FluidCacheNode extends Node {
  private cacheFrames: Map<number, CacheFrame> = new Map();
  private statistics: CacheStatistics = {
    totalFrames: 0,
    cachedFrames: 0,
    totalSize: 0,
    averageFrameSize: 0,
    compressionRatio: 1.0,
    cacheHitRate: 0
  };
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(id: string) {
    super(id, 'FluidCache', 'Fluid Cache');
    this.metadata.category = 'Physics';
    this.metadata.description = 'File caching system for fluid simulations with directory management';
    this.metadata.version = '3.2.0';
    
    // Inputs
    this.addInput('densityVolume', 'Density Volume', DataType.ANY);
    this.addInput('velocityVolume', 'Velocity Volume', DataType.ANY);
    this.addInput('temperatureVolume', 'Temperature Volume', DataType.ANY);
    this.addInput('smokeVolume', 'Smoke Volume', DataType.ANY);
    this.addInput('fuelVolume', 'Fuel Volume', DataType.ANY);
    this.addInput('frame', 'Frame Number', DataType.NUMBER);
    
    // Outputs
    this.addOutput('cachedDensity', 'Cached Density', DataType.ANY);
    this.addOutput('cachedVelocity', 'Cached Velocity', DataType.ANY);
    this.addOutput('cachedTemperature', 'Cached Temperature', DataType.ANY);
    this.addOutput('cachedSmoke', 'Cached Smoke', DataType.ANY);
    this.addOutput('cachedFuel', 'Cached Fuel', DataType.ANY);
    this.addOutput('cacheStatus', 'Cache Status', DataType.ANY);
    this.addOutput('statistics', 'Statistics', DataType.ANY);
    
    // Cache Directory Settings
    this.setParameter('cacheDirectory', './cache/fluid');
    this.setParameter('projectName', 'fluid_sim');
    this.setParameter('createSubfolders', true);
    this.setParameter('subfolderPattern', '{project}/{type}');
    
    // Frame Range
    this.setParameter('startFrame', 1);
    this.setParameter('endFrame', 250);
    this.setParameter('frameStep', 1);
    
    // Cache Format
    this.setParameter('cacheFormat', 'vdb');  // vdb, field3d, raw, npz, exr
    this.setParameter('halfPrecision', false);
    this.setParameter('compression', 'blosc');  // none, zip, blosc, lz4
    this.setParameter('compressionLevel', 5);  // 1-9
    
    // Cache Channels
    this.setParameter('cacheDensity', true);
    this.setParameter('cacheVelocity', true);
    this.setParameter('cacheTemperature', true);
    this.setParameter('cacheSmoke', true);
    this.setParameter('cacheFuel', true);
    this.setParameter('cachePressure', false);
    this.setParameter('cacheVorticity', false);
    
    // Cache Mode
    this.setParameter('cacheMode', 'readWrite');  // read, write, readWrite
    this.setParameter('overwriteExisting', false);
    this.setParameter('validateOnRead', true);
    this.setParameter('autoCleanup', false);
    this.setParameter('maxCacheSize', 50);  // GB
    
    // Memory Settings
    this.setParameter('memoryCache', true);
    this.setParameter('memoryCacheFrames', 10);  // Number of frames to keep in memory
    this.setParameter('preloadFrames', 5);
    this.setParameter('unloadUnusedFrames', true);
    
    // File Naming
    this.setParameter('filenamePattern', '{project}_{type}.{frame:04d}.{ext}');
    this.setParameter('frameOffset', 0);
    
    // Version Control
    this.setParameter('versioning', false);
    this.setParameter('maxVersions', 5);
    this.setParameter('versionPattern', 'v{version:03d}');
    
    // Background Processing
    this.setParameter('asyncWrite', true);
    this.setParameter('asyncRead', true);
    this.setParameter('threadCount', 4);
  }

  async process(): Promise<void> {
    const frame = this.inputs.get('frame')?.value ?? 0;
    const cacheMode = this.getParameter('cacheMode');
    
    // Check if we should read from cache
    if (cacheMode === 'read' || cacheMode === 'readWrite') {
      const cachedData = await this.readFromCache(frame);
      
      if (cachedData) {
        this.cacheHits++;
        this.setCachedOutputs(cachedData);
      } else {
        this.cacheMisses++;
        
        // If readWrite mode, write input to cache
        if (cacheMode === 'readWrite') {
          await this.writeToCache(frame);
        }
        
        // Pass through inputs
        this.passThroughInputs();
      }
    } else if (cacheMode === 'write') {
      await this.writeToCache(frame);
      this.passThroughInputs();
    }
    
    // Update statistics
    this.updateStatistics();
    
    // Set status output
    const statusOutput = this.outputs.get('cacheStatus');
    if (statusOutput) {
      statusOutput.value = {
        mode: cacheMode,
        currentFrame: frame,
        isCached: this.cacheFrames.has(frame),
        cacheDirectory: this.getCachePath(),
        lastOperation: new Date().toISOString()
      };
    }
    
    const statsOutput = this.outputs.get('statistics');
    if (statsOutput) {
      statsOutput.value = this.statistics;
    }
  }

  private getCachePath(): string {
    const cacheDir = this.getParameter('cacheDirectory');
    const projectName = this.getParameter('projectName');
    const createSubfolders = this.getParameter('createSubfolders');
    const pattern = this.getParameter('subfolderPattern');
    
    if (createSubfolders) {
      return pattern
        .replace('{project}', projectName)
        .replace('{type}', 'volumes');
    }
    
    return `${cacheDir}/${projectName}`;
  }

  private getFilePath(frame: number, type: string): string {
    const pattern = this.getParameter('filenamePattern');
    const projectName = this.getParameter('projectName');
    const format = this.getParameter('cacheFormat');
    const frameOffset = this.getParameter('frameOffset');
    
    const adjustedFrame = frame + frameOffset;
    const paddedFrame = adjustedFrame.toString().padStart(4, '0');
    
    return `${this.getCachePath()}/${pattern
      .replace('{project}', projectName)
      .replace('{type}', type)
      .replace(/\{frame:?(\d+)?\}/g, (_match: string, padding: string | undefined) => {
        if (padding) {
          return adjustedFrame.toString().padStart(parseInt(padding), '0');
        }
        return paddedFrame;
      })
      .replace('{ext}', format)}`;
  }

  private async readFromCache(frame: number): Promise<any | null> {
    const cacheEntry = this.cacheFrames.get(frame);
    
    if (!cacheEntry || !cacheEntry.valid) {
      return null;
    }
    
    const validate = this.getParameter('validateOnRead');
    
    // Simulate reading from cache
    const cachedData: any = {};
    
    if (this.getParameter('cacheDensity')) {
      cachedData.density = await this.readCacheFile(this.getFilePath(frame, 'density'));
    }
    if (this.getParameter('cacheVelocity')) {
      cachedData.velocity = await this.readCacheFile(this.getFilePath(frame, 'velocity'));
    }
    if (this.getParameter('cacheTemperature')) {
      cachedData.temperature = await this.readCacheFile(this.getFilePath(frame, 'temperature'));
    }
    if (this.getParameter('cacheSmoke')) {
      cachedData.smoke = await this.readCacheFile(this.getFilePath(frame, 'smoke'));
    }
    if (this.getParameter('cacheFuel')) {
      cachedData.fuel = await this.readCacheFile(this.getFilePath(frame, 'fuel'));
    }
    
    return cachedData;
  }

  private async readCacheFile(path: string): Promise<any> {
    // Simulate file read - in real implementation would read actual file
    const format = this.getParameter('cacheFormat');
    
    return {
      type: 'cached_volume',
      path,
      format,
      loaded: true,
      timestamp: Date.now()
    };
  }

  private async writeToCache(frame: number): Promise<void> {
    const overwrite = this.getParameter('overwriteExisting');
    const existingEntry = this.cacheFrames.get(frame);
    
    if (existingEntry && existingEntry.valid && !overwrite) {
      return;
    }
    
    const format = this.getParameter('cacheFormat');
    const compression = this.getParameter('compression');
    
    let totalSize = 0;
    
    // Write each channel
    if (this.getParameter('cacheDensity')) {
      const density = this.inputs.get('densityVolume')?.value;
      if (density) {
        const size = await this.writeCacheFile(this.getFilePath(frame, 'density'), density);
        totalSize += size;
      }
    }
    
    if (this.getParameter('cacheVelocity')) {
      const velocity = this.inputs.get('velocityVolume')?.value;
      if (velocity) {
        const size = await this.writeCacheFile(this.getFilePath(frame, 'velocity'), velocity);
        totalSize += size;
      }
    }
    
    if (this.getParameter('cacheTemperature')) {
      const temperature = this.inputs.get('temperatureVolume')?.value;
      if (temperature) {
        const size = await this.writeCacheFile(this.getFilePath(frame, 'temperature'), temperature);
        totalSize += size;
      }
    }
    
    if (this.getParameter('cacheSmoke')) {
      const smoke = this.inputs.get('smokeVolume')?.value;
      if (smoke) {
        const size = await this.writeCacheFile(this.getFilePath(frame, 'smoke'), smoke);
        totalSize += size;
      }
    }
    
    if (this.getParameter('cacheFuel')) {
      const fuel = this.inputs.get('fuelVolume')?.value;
      if (fuel) {
        const size = await this.writeCacheFile(this.getFilePath(frame, 'fuel'), fuel);
        totalSize += size;
      }
    }
    
    // Record cache entry
    this.cacheFrames.set(frame, {
      frame,
      timestamp: Date.now(),
      path: this.getCachePath(),
      size: totalSize,
      compressed: compression !== 'none',
      valid: true
    });
  }

  private async writeCacheFile(path: string, data: any): Promise<number> {
    // Simulate file write - in real implementation would write actual file
    const compression = this.getParameter('compression');
    const compressionLevel = this.getParameter('compressionLevel');
    const halfPrecision = this.getParameter('halfPrecision');
    
    // Estimate file size based on data
    let size = 0;
    if (data && data.data) {
      size = data.data.length * (halfPrecision ? 2 : 4);
      
      // Apply compression ratio estimate
      const compressionRatios: Record<string, number> = {
        'none': 1.0,
        'zip': 0.6,
        'blosc': 0.4,
        'lz4': 0.5
      };
      size *= compressionRatios[compression] || 1.0;
    }
    
    return size;
  }

  private setCachedOutputs(cachedData: any): void {
    if (cachedData.density) {
      const output = this.outputs.get('cachedDensity');
      if (output) output.value = cachedData.density;
    }
    if (cachedData.velocity) {
      const output = this.outputs.get('cachedVelocity');
      if (output) output.value = cachedData.velocity;
    }
    if (cachedData.temperature) {
      const output = this.outputs.get('cachedTemperature');
      if (output) output.value = cachedData.temperature;
    }
    if (cachedData.smoke) {
      const output = this.outputs.get('cachedSmoke');
      if (output) output.value = cachedData.smoke;
    }
    if (cachedData.fuel) {
      const output = this.outputs.get('cachedFuel');
      if (output) output.value = cachedData.fuel;
    }
  }

  private passThroughInputs(): void {
    const densityInput = this.inputs.get('densityVolume')?.value;
    const velocityInput = this.inputs.get('velocityVolume')?.value;
    const temperatureInput = this.inputs.get('temperatureVolume')?.value;
    const smokeInput = this.inputs.get('smokeVolume')?.value;
    const fuelInput = this.inputs.get('fuelVolume')?.value;
    
    const densityOutput = this.outputs.get('cachedDensity');
    if (densityOutput) densityOutput.value = densityInput;
    
    const velocityOutput = this.outputs.get('cachedVelocity');
    if (velocityOutput) velocityOutput.value = velocityInput;
    
    const temperatureOutput = this.outputs.get('cachedTemperature');
    if (temperatureOutput) temperatureOutput.value = temperatureInput;
    
    const smokeOutput = this.outputs.get('cachedSmoke');
    if (smokeOutput) smokeOutput.value = smokeInput;
    
    const fuelOutput = this.outputs.get('cachedFuel');
    if (fuelOutput) fuelOutput.value = fuelInput;
  }

  private updateStatistics(): void {
    let totalSize = 0;
    let validFrames = 0;
    
    for (const entry of this.cacheFrames.values()) {
      if (entry.valid) {
        totalSize += entry.size;
        validFrames++;
      }
    }
    
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    const totalFrames = endFrame - startFrame + 1;
    
    this.statistics = {
      totalFrames,
      cachedFrames: validFrames,
      totalSize,
      averageFrameSize: validFrames > 0 ? totalSize / validFrames : 0,
      compressionRatio: this.getParameter('compression') !== 'none' ? 0.5 : 1.0,
      cacheHitRate: this.cacheHits + this.cacheMisses > 0 
        ? this.cacheHits / (this.cacheHits + this.cacheMisses) 
        : 0
    };
  }

  // Public methods for cache management
  clearCache(): void {
    this.cacheFrames.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.updateStatistics();
  }

  invalidateFrame(frame: number): void {
    const entry = this.cacheFrames.get(frame);
    if (entry) {
      entry.valid = false;
    }
  }

  invalidateRange(startFrame: number, endFrame: number): void {
    for (let frame = startFrame; frame <= endFrame; frame++) {
      this.invalidateFrame(frame);
    }
  }

  getFrameStatus(frame: number): 'cached' | 'invalid' | 'missing' {
    const entry = this.cacheFrames.get(frame);
    if (!entry) return 'missing';
    return entry.valid ? 'cached' : 'invalid';
  }

  getCachedFrameList(): number[] {
    const frames: number[] = [];
    for (const [frame, entry] of this.cacheFrames) {
      if (entry.valid) {
        frames.push(frame);
      }
    }
    return frames.sort((a, b) => a - b);
  }

  estimateCacheSize(): number {
    const startFrame = this.getParameter('startFrame');
    const endFrame = this.getParameter('endFrame');
    const frameCount = endFrame - startFrame + 1;
    
    // Estimate based on current average
    return this.statistics.averageFrameSize * frameCount;
  }

  dispose(): void {
    this.cacheFrames.clear();
    super.dispose();
  }
}
