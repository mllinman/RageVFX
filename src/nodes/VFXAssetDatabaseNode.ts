/**
 * VFXAssetDatabaseNode - Asset management and library system
 * Version 3.6 - Asset Database
 * 
 * Manages VFX assets including textures, models, presets, and materials
 */

import { Node, DataType } from '../core/Node';

interface AssetMetadata {
  id: string;
  name: string;
  type: 'texture' | 'model' | 'material' | 'preset' | 'hdri' | 'lut' | 'node_graph';
  category: string;
  tags: string[];
  thumbnail: string;
  filePath: string;
  fileSize: number;
  dateAdded: Date;
  dateModified: Date;
  author: string;
  description: string;
  rating: number;
  usageCount: number;
  resolution?: { width: number; height: number };
  format?: string;
  colorSpace?: string;
  customProperties: Map<string, any>;
}

interface AssetCollection {
  id: string;
  name: string;
  description: string;
  assets: string[]; // Asset IDs
  thumbnail: string;
}

export class VFXAssetDatabaseNode extends Node {
  private assets: Map<string, AssetMetadata> = new Map();
  private collections: Map<string, AssetCollection> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map(); // tag -> asset IDs

  constructor(id: string) {
    super(id, 'VFXAssetDatabase', 'VFX Asset Database');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Manage and browse VFX assets including textures, models, and presets';
    this.metadata.version = '3.6.0';
    
    // Inputs
    this.addInput('assetPath', 'Asset Path', DataType.ANY);
    this.addInput('searchQuery', 'Search Query', DataType.ANY);
    
    // Outputs
    this.addOutput('asset', 'Selected Asset', DataType.ANY);
    this.addOutput('assetList', 'Asset List', DataType.ANY);
    this.addOutput('metadata', 'Asset Metadata', DataType.ANY);
    this.addOutput('thumbnail', 'Thumbnail', DataType.IMAGE);
    
    // Database Settings
    this.setParameter('databasePath', './assets/database');
    this.setParameter('autoScan', true);
    this.setParameter('scanRecursive', true);
    
    // Asset Selection
    this.setParameter('selectedAsset', '');
    this.setParameter('assetType', 'all'); // all, texture, model, material, preset, hdri, lut
    this.setParameter('category', 'all');
    
    // Search & Filter
    this.setParameter('searchQuery', '');
    this.setParameter('searchTags', []);
    this.setParameter('filterByRating', 0); // Minimum rating (0-5)
    this.setParameter('filterByDate', null); // Date range
    this.setParameter('sortBy', 'name'); // name, date, rating, usage, size
    this.setParameter('sortOrder', 'asc'); // asc, desc
    
    // Browser Settings
    this.setParameter('thumbnailSize', 'medium'); // small, medium, large
    this.setParameter('viewMode', 'grid'); // grid, list, detail
    this.setParameter('itemsPerPage', 20);
    this.setParameter('currentPage', 1);
    
    // Asset Management
    this.setParameter('autoGenerateThumbnails', true);
    this.setParameter('thumbnailResolution', 256);
    this.setParameter('cacheEnabled', true);
    this.setParameter('maxCacheSize', 1024); // MB
    
    // Collections
    this.setParameter('currentCollection', null);
    this.setParameter('showFavorites', false);
    this.setParameter('showRecent', false);
    
    // Import/Export
    this.setParameter('importFormats', ['png', 'jpg', 'exr', 'hdr', 'obj', 'fbx', 'gltf', 'usd']);
    this.setParameter('autoTagging', true);
    this.setParameter('metadataExtraction', true);
    
    // Initialize default categories
    this.initializeDefaultCategories();
  }

  async process(): Promise<void> {
    const assetPathInput = this.inputs.get('assetPath');
    const searchQueryInput = this.inputs.get('searchQuery');
    
    const assetOutput = this.outputs.get('asset');
    const assetListOutput = this.outputs.get('assetList');
    const metadataOutput = this.outputs.get('metadata');
    const thumbnailOutput = this.outputs.get('thumbnail');
    
    if (!assetOutput) return;
    
    // Handle asset import
    if (assetPathInput?.value) {
      await this.importAsset(assetPathInput.value);
    }
    
    // Handle search
    let filteredAssets = Array.from(this.assets.values());
    
    const searchQuery = (searchQueryInput?.value || this.getParameter('searchQuery')) as string;
    if (searchQuery) {
      filteredAssets = this.searchAssets(searchQuery);
    }
    
    // Apply filters
    filteredAssets = this.applyFilters(filteredAssets);
    
    // Sort
    filteredAssets = this.sortAssets(filteredAssets);
    
    // Pagination
    const itemsPerPage = this.getParameter('itemsPerPage') as number;
    const currentPage = this.getParameter('currentPage') as number;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);
    
    // Get selected asset
    const selectedAssetId = this.getParameter('selectedAsset') as string;
    const selectedAsset = selectedAssetId ? this.assets.get(selectedAssetId) : null;
    
    // Output
    if (assetOutput) {
      assetOutput.value = selectedAsset ? await this.loadAsset(selectedAsset) : null;
    }
    
    if (assetListOutput) {
      assetListOutput.value = paginatedAssets;
    }
    
    if (metadataOutput && selectedAsset) {
      metadataOutput.value = selectedAsset;
    }
    
    if (thumbnailOutput && selectedAsset) {
      thumbnailOutput.value = await this.loadThumbnail(selectedAsset);
    }
  }
  
  private initializeDefaultCategories(): void {
    // Initialize with some default asset collections
    this.collections.set('textures', {
      id: 'textures',
      name: 'Textures',
      description: 'Texture maps and materials',
      assets: [],
      thumbnail: ''
    });
    
    this.collections.set('hdri', {
      id: 'hdri',
      name: 'HDRI Environments',
      description: 'High dynamic range environment maps',
      assets: [],
      thumbnail: ''
    });
    
    this.collections.set('models', {
      id: 'models',
      name: '3D Models',
      description: '3D geometry and objects',
      assets: [],
      thumbnail: ''
    });
    
    this.collections.set('presets', {
      id: 'presets',
      name: 'Node Presets',
      description: 'Pre-configured node setups',
      assets: [],
      thumbnail: ''
    });
    
    this.collections.set('luts', {
      id: 'luts',
      name: 'LUTs',
      description: 'Color grading lookup tables',
      assets: [],
      thumbnail: ''
    });
  }
  
  public async importAsset(assetPath: string): Promise<string | null> {
    try {
      // Extract metadata from file
      const metadata = await this.extractMetadata(assetPath);
      
      // Generate unique ID
      const assetId = this.generateAssetId(assetPath);
      
      // Create asset metadata
      const asset: AssetMetadata = {
        id: assetId,
        name: this.extractFileName(assetPath),
        type: this.detectAssetType(assetPath),
        category: 'imported',
        tags: this.autoGenerateTags(assetPath),
        thumbnail: '',
        filePath: assetPath,
        fileSize: 0,
        dateAdded: new Date(),
        dateModified: new Date(),
        author: 'Unknown',
        description: '',
        rating: 0,
        usageCount: 0,
        format: this.extractFileExtension(assetPath),
        customProperties: new Map()
      };
      
      // Generate thumbnail if enabled
      if (this.getParameter('autoGenerateThumbnails')) {
        asset.thumbnail = await this.generateThumbnail(assetPath);
      }
      
      // Store asset
      this.assets.set(assetId, asset);
      
      // Update search index
      this.updateSearchIndex(asset);
      
      // Add to appropriate collection
      this.addToCollection(asset);
      
      return assetId;
    } catch (error) {
      console.error('Failed to import asset:', error);
      return null;
    }
  }
  
  public searchAssets(query: string): AssetMetadata[] {
    const queryLower = query.toLowerCase();
    const results: AssetMetadata[] = [];
    
    for (const asset of this.assets.values()) {
      // Search in name
      if (asset.name.toLowerCase().includes(queryLower)) {
        results.push(asset);
        continue;
      }
      
      // Search in tags
      if (asset.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        results.push(asset);
        continue;
      }
      
      // Search in description
      if (asset.description.toLowerCase().includes(queryLower)) {
        results.push(asset);
        continue;
      }
    }
    
    return results;
  }
  
  private applyFilters(assets: AssetMetadata[]): AssetMetadata[] {
    let filtered = [...assets];
    
    // Filter by type
    const assetType = this.getParameter('assetType') as string;
    if (assetType !== 'all') {
      filtered = filtered.filter(a => a.type === assetType);
    }
    
    // Filter by category
    const category = this.getParameter('category') as string;
    if (category !== 'all') {
      filtered = filtered.filter(a => a.category === category);
    }
    
    // Filter by rating
    const minRating = this.getParameter('filterByRating') as number;
    if (minRating > 0) {
      filtered = filtered.filter(a => a.rating >= minRating);
    }
    
    // Filter by tags
    const searchTags = this.getParameter('searchTags') as string[];
    if (searchTags && searchTags.length > 0) {
      filtered = filtered.filter(a => 
        searchTags.every(tag => a.tags.includes(tag))
      );
    }
    
    return filtered;
  }
  
  private sortAssets(assets: AssetMetadata[]): AssetMetadata[] {
    const sortBy = this.getParameter('sortBy') as string;
    const sortOrder = this.getParameter('sortOrder') as string;
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    return assets.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.dateAdded.getTime() - b.dateAdded.getTime();
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'usage':
          comparison = a.usageCount - b.usageCount;
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        default:
          comparison = 0;
      }
      
      return comparison * multiplier;
    });
  }
  
  private async loadAsset(asset: AssetMetadata): Promise<any> {
    // Increment usage count
    asset.usageCount++;
    
    // Load asset based on type
    switch (asset.type) {
      case 'texture':
        return await this.loadTexture(asset.filePath);
      case 'model':
        return await this.load3DModel(asset.filePath);
      case 'hdri':
        return await this.loadHDRI(asset.filePath);
      case 'lut':
        return await this.loadLUT(asset.filePath);
      case 'preset':
        return await this.loadPreset(asset.filePath);
      default:
        return null;
    }
  }
  
  private async loadThumbnail(asset: AssetMetadata): Promise<any> {
    if (asset.thumbnail) {
      // Load thumbnail from cache or file
      return asset.thumbnail;
    }
    return null;
  }
  
  private async loadTexture(path: string): Promise<any> {
    // Simplified texture loading
    return { type: 'texture', path: path };
  }
  
  private async load3DModel(path: string): Promise<any> {
    return { type: 'model', path: path };
  }
  
  private async loadHDRI(path: string): Promise<any> {
    return { type: 'hdri', path: path };
  }
  
  private async loadLUT(path: string): Promise<any> {
    return { type: 'lut', path: path };
  }
  
  private async loadPreset(path: string): Promise<any> {
    return { type: 'preset', path: path };
  }
  
  private async extractMetadata(path: string): Promise<any> {
    // Extract metadata from file (simplified)
    return {};
  }
  
  private async generateThumbnail(path: string): Promise<string> {
    // Generate thumbnail (simplified)
    return '';
  }
  
  private generateAssetId(path: string): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private extractFileName(path: string): string {
    return path.split('/').pop() || path.split('\\').pop() || path;
  }
  
  private extractFileExtension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
  
  private detectAssetType(path: string): AssetMetadata['type'] {
    const ext = this.extractFileExtension(path);
    
    const textureExts = ['png', 'jpg', 'jpeg', 'tga', 'bmp', 'tiff'];
    const modelExts = ['obj', 'fbx', 'gltf', 'glb', 'usd', 'usda', 'usdc', 'abc'];
    const hdriExts = ['hdr', 'exr'];
    const lutExts = ['cube', '3dl'];
    
    if (textureExts.includes(ext)) return 'texture';
    if (modelExts.includes(ext)) return 'model';
    if (hdriExts.includes(ext)) return 'hdri';
    if (lutExts.includes(ext)) return 'lut';
    
    return 'preset';
  }
  
  private autoGenerateTags(path: string): string[] {
    const tags: string[] = [];
    const filename = this.extractFileName(path).toLowerCase();
    
    // Common material keywords
    const materialKeywords = ['diffuse', 'normal', 'roughness', 'metallic', 'ao', 'height', 'displacement'];
    materialKeywords.forEach(keyword => {
      if (filename.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    // Extract numbers (often resolution indicators)
    const numbers = filename.match(/\d{3,4}/g);
    if (numbers) {
      numbers.forEach(num => tags.push(`${num}px`));
    }
    
    return tags;
  }
  
  private updateSearchIndex(asset: AssetMetadata): void {
    // Update search index with asset tags
    asset.tags.forEach(tag => {
      if (!this.searchIndex.has(tag)) {
        this.searchIndex.set(tag, new Set());
      }
      this.searchIndex.get(tag)!.add(asset.id);
    });
  }
  
  private addToCollection(asset: AssetMetadata): void {
    // Add asset to appropriate collection based on type
    const collectionId = asset.type === 'texture' ? 'textures' :
                         asset.type === 'model' ? 'models' :
                         asset.type === 'hdri' ? 'hdri' :
                         asset.type === 'lut' ? 'luts' : 'presets';
    
    const collection = this.collections.get(collectionId);
    if (collection && !collection.assets.includes(asset.id)) {
      collection.assets.push(asset.id);
    }
  }
  
  public createCollection(name: string, description: string): string {
    const collectionId = `collection_${Date.now()}`;
    this.collections.set(collectionId, {
      id: collectionId,
      name: name,
      description: description,
      assets: [],
      thumbnail: ''
    });
    return collectionId;
  }
  
  public addToCustomCollection(collectionId: string, assetId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (collection && !collection.assets.includes(assetId)) {
      collection.assets.push(assetId);
      return true;
    }
    return false;
  }
  
  public getCollectionAssets(collectionId: string): AssetMetadata[] {
    const collection = this.collections.get(collectionId);
    if (!collection) return [];
    
    return collection.assets
      .map(id => this.assets.get(id))
      .filter(asset => asset !== undefined) as AssetMetadata[];
  }
  
  public exportDatabase(): string {
    // Export database to JSON
    return JSON.stringify({
      assets: Array.from(this.assets.entries()),
      collections: Array.from(this.collections.entries()),
      version: '1.0'
    });
  }
  
  public importDatabase(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.assets = new Map(data.assets);
      this.collections = new Map(data.collections);
      
      // Rebuild search index
      this.searchIndex.clear();
      for (const asset of this.assets.values()) {
        this.updateSearchIndex(asset);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import database:', error);
      return false;
    }
  }
  
  dispose(): void {
    this.assets.clear();
    this.collections.clear();
    this.searchIndex.clear();
    super.dispose();
  }
}
