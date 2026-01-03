/**
 * Memory Manager for RageVFX
 * Implements smart caching, tile-based rendering, and memory optimization
 * for handling 8K+ resolutions efficiently
 */

export interface MemoryConfig {
  maxCacheSize: number; // Maximum cache size in bytes
  tileSize: number; // Tile size for tile-based rendering
  enableCompression: boolean; // Enable texture compression
  gcThreshold: number; // Garbage collection threshold (0-1)
}

export interface CacheEntry {
  id: string;
  data: any;
  size: number;
  lastAccessed: number;
  accessCount: number;
  priority: number;
}

export class MemoryManager {
  private config: MemoryConfig;
  private cacheEntries: Map<string, CacheEntry> = new Map();
  private currentCacheSize: number = 0;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAllocated: 0,
    peakUsage: 0
  };

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxCacheSize: config.maxCacheSize || 2 * 1024 * 1024 * 1024, // 2GB default
      tileSize: config.tileSize || 512,
      enableCompression: config.enableCompression !== false,
      gcThreshold: config.gcThreshold || 0.8
    };
  }

  /**
   * Store data in cache with automatic eviction
   */
  addToCache(id: string, data: any, priority: number = 1): boolean {
    const size = this.estimateSize(data);

    // Check if we need to evict
    if (this.currentCacheSize + size > this.config.maxCacheSize) {
      this.evictLRU(size);
    }

    // If still not enough space, reject
    if (this.currentCacheSize + size > this.config.maxCacheSize) {
      console.warn(`Cannot cache ${id}: insufficient memory`);
      return false;
    }

    // Remove existing entry if present
    if (this.cacheEntries.has(id)) {
      this.uncache(id);
    }

    // Add new entry
    const entry: CacheEntry = {
      id: id,
      data: data,
      size: size,
      lastAccessed: Date.now(),
      accessCount: 0,
      priority: priority
    };

    this.cacheEntries.set(id, entry);
    this.currentCacheSize += size;
    this.stats.totalAllocated += size;

    if (this.currentCacheSize > this.stats.peakUsage) {
      this.stats.peakUsage = this.currentCacheSize;
    }

    return true;
  }

  /**
   * Retrieve data from cache
   */
  getCached(id: string): any | null {
    const entry = this.cacheEntries.get(id);

    if (entry) {
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      this.stats.hits++;
      return entry.data;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Remove data from cache
   */
  uncache(id: string): boolean {
    const entry = this.cacheEntries.get(id);

    if (entry) {
      this.currentCacheSize -= entry.size;
      this.cacheEntries.delete(id);
      return true;
    }

    return false;
  }

  /**
   * Evict least recently used entries to free up space
   */
  private evictLRU(requiredSpace: number): void {
    const entries = Array.from(this.cacheEntries.values());

    // Sort by priority (ascending) and last accessed (ascending)
    entries.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority first
      }
      return a.lastAccessed - b.lastAccessed; // Older first
    });

    let freedSpace = 0;

    for (const entry of entries) {
      if (freedSpace >= requiredSpace) {
        break;
      }

      this.uncache(entry.id);
      freedSpace += entry.size;
      this.stats.evictions++;
    }
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }

    if (ArrayBuffer.isView(data)) {
      return data.byteLength;
    }

    if (data instanceof ImageData) {
      return data.width * data.height * 4; // RGBA
    }

    if (typeof data === 'object' && data !== null) {
      // Rough estimate for objects
      return JSON.stringify(data).length * 2; // UTF-16
    }

    if (typeof data === 'string') {
      return data.length * 2; // UTF-16
    }

    return 64; // Default estimate for primitives
  }

  /**
   * Create tiles for large images
   */
  createTiles(
    width: number,
    height: number,
    tileSize?: number
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const size = tileSize || this.config.tileSize;
    const tiles: Array<{ x: number; y: number; width: number; height: number }> = [];

    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        tiles.push({
          x: x,
          y: y,
          width: Math.min(size, width - x),
          height: Math.min(size, height - y)
        });
      }
    }

    return tiles;
  }

  /**
   * Process image in tiles to reduce memory usage
   */
  async processTiled(
    width: number,
    height: number,
    processor: (tile: { x: number; y: number; width: number; height: number }) => Promise<void>
  ): Promise<void> {
    const tiles = this.createTiles(width, height);

    for (const tile of tiles) {
      await processor(tile);

      // Trigger GC if needed
      if (this.shouldGarbageCollect()) {
        this.garbageCollect();
      }
    }
  }

  /**
   * Check if garbage collection should be triggered
   */
  private shouldGarbageCollect(): boolean {
    return this.currentCacheSize > this.config.maxCacheSize * this.config.gcThreshold;
  }

  /**
   * Perform garbage collection
   */
  garbageCollect(): void {
    const targetSize = this.config.maxCacheSize * 0.6; // Target 60% usage
    const toFree = this.currentCacheSize - targetSize;

    if (toFree > 0) {
      this.evictLRU(toFree);
      console.log(`GC: Freed ${(toFree / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cacheEntries.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    cacheSize: number;
    maxCacheSize: number;
    cacheUsagePercent: number;
    entryCount: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
    totalAllocated: number;
    peakUsage: number;
  } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      cacheSize: this.currentCacheSize,
      maxCacheSize: this.config.maxCacheSize,
      cacheUsagePercent: (this.currentCacheSize / this.config.maxCacheSize) * 100,
      entryCount: this.cacheEntries.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: hitRate,
      evictions: this.stats.evictions,
      totalAllocated: this.stats.totalAllocated,
      peakUsage: this.stats.peakUsage
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalAllocated: 0,
      peakUsage: this.currentCacheSize
    };
  }

  /**
   * Dispose and clean up
   */
  dispose(): void {
    this.clearCache();
    this.resetStats();
    console.log('Memory manager disposed');
  }
}

/**
 * Texture compression utilities
 */
export class TextureCompression {
  /**
   * Compress texture data using BC7 (if supported)
   */
  static async compressBC7(
    data: Uint8Array,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    // BC7 compression implementation would go here
    // For now, return original data
    console.warn('BC7 compression not yet implemented');
    return data;
  }

  /**
   * Compress texture data using ASTC (if supported)
   */
  static async compressASTC(
    data: Uint8Array,
    width: number,
    height: number,
    blockSize: [number, number] = [4, 4]
  ): Promise<Uint8Array> {
    // ASTC compression implementation would go here
    // For now, return original data
    console.warn('ASTC compression not yet implemented');
    return data;
  }

  /**
   * Check if BC7 compression is supported
   */
  static supportsBC7(device: any): boolean {
    return device.features.has('texture-compression-bc');
  }

  /**
   * Check if ASTC compression is supported
   */
  static supportsASTC(device: any): boolean {
    return device.features.has('texture-compression-astc');
  }
}
