/**
 * LightMixerNode - V-Ray Style Interactive Light Mixing
 * 
 * Post-render light adjustment without re-rendering, allowing
 * interactive modification of light intensities, colors, and contributions.
 */

import { Node, DataType } from '../core/Node';

interface LightLayer {
  id: string;
  name: string;
  type: 'light' | 'environment' | 'emission' | 'caustics' | 'gi';
  color: [number, number, number];
  intensity: number;
  enabled: boolean;
  solo: boolean;
  contribution: 'all' | 'diffuse' | 'specular' | 'both';
  shadowIntensity: number;
  data: Float32Array | null;
}

interface LightGroup {
  id: string;
  name: string;
  layers: string[];
  masterIntensity: number;
  masterColor: [number, number, number];
  enabled: boolean;
}

export class LightMixerNode extends Node {
  private lightLayers: Map<string, LightLayer> = new Map();
  private lightGroups: Map<string, LightGroup> = new Map();
  private beautyBuffer: Float32Array | null = null;
  private outputBuffer: Float32Array | null = null;
  private width: number = 0;
  private height: number = 0;
  private presets: Map<string, Map<string, { intensity: number; color: [number, number, number] }>> = new Map();

  constructor(id: string) {
    super(id, 'LightMixer', 'Light Mixer');
    this.metadata.category = 'Render';
    this.metadata.description = 'V-Ray style interactive light mixing for post-render adjustment';
    this.metadata.version = '3.0.0';

    // Input AOVs (Arbitrary Output Variables)
    this.addInput('diffuse', 'Diffuse', DataType.IMAGE);
    this.addInput('specular', 'Specular', DataType.IMAGE);
    this.addInput('environment', 'Environment', DataType.IMAGE);
    this.addInput('emission', 'Emission', DataType.IMAGE);
    this.addInput('gi', 'Global Illumination', DataType.IMAGE);
    this.addInput('caustics', 'Caustics', DataType.IMAGE);
    
    // Light AOVs (up to 16 individual lights)
    for (let i = 1; i <= 16; i++) {
      this.addInput(`light${i}`, `Light ${i}`, DataType.IMAGE);
    }

    // Shadow AOV
    this.addInput('shadows', 'Shadows', DataType.IMAGE);

    // Outputs
    this.addOutput('beauty', 'Beauty (Mixed)', DataType.IMAGE);
    this.addOutput('diffuseOut', 'Diffuse Out', DataType.IMAGE);
    this.addOutput('specularOut', 'Specular Out', DataType.IMAGE);
    this.addOutput('lightContribution', 'Light Contribution', DataType.IMAGE);

    // Global parameters
    this.setParameter('masterIntensity', 1.0);
    this.setParameter('masterColor', [1, 1, 1]);
    this.setParameter('exposure', 0);
    this.setParameter('gamma', 1.0);
    this.setParameter('colorSpace', 'linear'); // 'linear', 'srgb', 'aces'

    // Environment parameters
    this.setParameter('envIntensity', 1.0);
    this.setParameter('envColor', [1, 1, 1]);
    this.setParameter('envRotation', 0);

    // Global illumination parameters
    this.setParameter('giIntensity', 1.0);
    this.setParameter('giSaturation', 1.0);

    // Shadow parameters
    this.setParameter('shadowIntensity', 1.0);
    this.setParameter('shadowColor', [0, 0, 0]);

    // Caustics parameters
    this.setParameter('causticsIntensity', 1.0);

    // Emission parameters
    this.setParameter('emissionIntensity', 1.0);

    // Display parameters
    this.setParameter('displayMode', 'beauty'); // 'beauty', 'diffuse', 'specular', 'individual'
    this.setParameter('selectedLight', '');

    // Initialize default layers
    this.initializeDefaultLayers();
  }

  private initializeDefaultLayers(): void {
    // Environment layer
    this.lightLayers.set('environment', {
      id: 'environment',
      name: 'Environment',
      type: 'environment',
      color: [1, 1, 1],
      intensity: 1.0,
      enabled: true,
      solo: false,
      contribution: 'all',
      shadowIntensity: 1.0,
      data: null
    });

    // GI layer
    this.lightLayers.set('gi', {
      id: 'gi',
      name: 'Global Illumination',
      type: 'gi',
      color: [1, 1, 1],
      intensity: 1.0,
      enabled: true,
      solo: false,
      contribution: 'diffuse',
      shadowIntensity: 0,
      data: null
    });

    // Emission layer
    this.lightLayers.set('emission', {
      id: 'emission',
      name: 'Emission',
      type: 'emission',
      color: [1, 1, 1],
      intensity: 1.0,
      enabled: true,
      solo: false,
      contribution: 'all',
      shadowIntensity: 0,
      data: null
    });

    // Caustics layer
    this.lightLayers.set('caustics', {
      id: 'caustics',
      name: 'Caustics',
      type: 'caustics',
      color: [1, 1, 1],
      intensity: 1.0,
      enabled: true,
      solo: false,
      contribution: 'specular',
      shadowIntensity: 0,
      data: null
    });

    // Default light group
    this.lightGroups.set('all', {
      id: 'all',
      name: 'All Lights',
      layers: [],
      masterIntensity: 1.0,
      masterColor: [1, 1, 1],
      enabled: true
    });
  }

  /**
   * Add a light layer
   */
  addLightLayer(id: string, name: string, type: 'light' | 'environment' | 'emission' | 'caustics' | 'gi' = 'light'): void {
    this.lightLayers.set(id, {
      id,
      name,
      type,
      color: [1, 1, 1],
      intensity: 1.0,
      enabled: true,
      solo: false,
      contribution: 'all',
      shadowIntensity: 1.0,
      data: null
    });

    // Add to default group
    const allGroup = this.lightGroups.get('all');
    if (allGroup) {
      allGroup.layers.push(id);
    }

    this.markDirty();
  }

  /**
   * Set light layer properties
   */
  setLightProperties(layerId: string, properties: Partial<LightLayer>): void {
    const layer = this.lightLayers.get(layerId);
    if (layer) {
      Object.assign(layer, properties);
      this.markDirty();
    }
  }

  /**
   * Create a light group
   */
  createLightGroup(id: string, name: string, layerIds: string[]): void {
    this.lightGroups.set(id, {
      id,
      name,
      layers: layerIds,
      masterIntensity: 1.0,
      masterColor: [1, 1, 1],
      enabled: true
    });
    this.markDirty();
  }

  /**
   * Set group properties
   */
  setGroupProperties(groupId: string, properties: Partial<LightGroup>): void {
    const group = this.lightGroups.get(groupId);
    if (group) {
      Object.assign(group, properties);
      this.markDirty();
    }
  }

  /**
   * Solo a light layer
   */
  soloLight(layerId: string, solo: boolean): void {
    // Clear all solo states
    this.lightLayers.forEach(layer => {
      layer.solo = false;
    });

    // Set solo on target layer
    const layer = this.lightLayers.get(layerId);
    if (layer) {
      layer.solo = solo;
    }

    this.markDirty();
  }

  /**
   * Save current mix as a preset
   */
  savePreset(name: string): void {
    const preset = new Map<string, { intensity: number; color: [number, number, number] }>();
    
    this.lightLayers.forEach((layer, id) => {
      preset.set(id, {
        intensity: layer.intensity,
        color: [...layer.color] as [number, number, number]
      });
    });

    this.presets.set(name, preset);
  }

  /**
   * Load a preset
   */
  loadPreset(name: string): boolean {
    const preset = this.presets.get(name);
    if (!preset) return false;

    preset.forEach((settings, id) => {
      const layer = this.lightLayers.get(id);
      if (layer) {
        layer.intensity = settings.intensity;
        layer.color = [...settings.color] as [number, number, number];
      }
    });

    this.markDirty();
    return true;
  }

  /**
   * Interpolate between two presets
   */
  blendPresets(presetA: string, presetB: string, blend: number): void {
    const a = this.presets.get(presetA);
    const b = this.presets.get(presetB);
    
    if (!a || !b) return;

    a.forEach((settingsA, id) => {
      const settingsB = b.get(id);
      if (settingsB) {
        const layer = this.lightLayers.get(id);
        if (layer) {
          layer.intensity = settingsA.intensity * (1 - blend) + settingsB.intensity * blend;
          layer.color = [
            settingsA.color[0] * (1 - blend) + settingsB.color[0] * blend,
            settingsA.color[1] * (1 - blend) + settingsB.color[1] * blend,
            settingsA.color[2] * (1 - blend) + settingsB.color[2] * blend
          ];
        }
      }
    });

    this.markDirty();
  }

  async process(): Promise<void> {
    // Get diffuse and specular base passes
    const diffuseInput = this.inputs.get('diffuse');
    const _specularInput = this.inputs.get('specular');

    if (!diffuseInput?.value) return;

    const diffuseData = diffuseInput.value as ImageData;
    this.width = diffuseData.width;
    this.height = diffuseData.height;
    const pixels = this.width * this.height;

    // Initialize output buffer
    this.outputBuffer = new Float32Array(pixels * 4);
    const diffuseOut = new Float32Array(pixels * 4);
    const specularOut = new Float32Array(pixels * 4);
    const lightContrib = new Float32Array(pixels * 4);

    // Parse input AOVs into light layers
    this.parseInputAOVs();

    // Check for solo mode
    let soloActive = false;
    this.lightLayers.forEach((layer, _id) => {
      if (layer.solo) {
        soloActive = true;
      }
    });

    // Get global parameters
    const masterIntensity = this.getParameter('masterIntensity') as number;
    const masterColor = this.getParameter('masterColor') as number[];
    const exposure = this.getParameter('exposure') as number;
    const exposureMultiplier = Math.pow(2, exposure);

    // Get shadow data
    const shadowsInput = this.inputs.get('shadows');
    const shadowData = shadowsInput?.value as ImageData | null;
    const shadowIntensity = this.getParameter('shadowIntensity') as number;
    const shadowColor = this.getParameter('shadowColor') as number[];

    // Mix lights
    for (let i = 0; i < pixels; i++) {
      const totalDiffuse: [number, number, number] = [0, 0, 0];
      const totalSpecular: [number, number, number] = [0, 0, 0];
      const totalContrib: [number, number, number] = [0, 0, 0];

      this.lightLayers.forEach((layer, _id) => {
        if (!layer.enabled) return;
        if (soloActive && !layer.solo) return;

        const intensity = this.getEffectiveIntensity(layer);
        const color = this.getEffectiveColor(layer);

        if (layer.data) {
          const r = layer.data[i * 4] * intensity * color[0];
          const g = layer.data[i * 4 + 1] * intensity * color[1];
          const b = layer.data[i * 4 + 2] * intensity * color[2];

          if (layer.contribution === 'all' || layer.contribution === 'diffuse' || layer.contribution === 'both') {
            totalDiffuse[0] += r;
            totalDiffuse[1] += g;
            totalDiffuse[2] += b;
          }

          if (layer.contribution === 'all' || layer.contribution === 'specular' || layer.contribution === 'both') {
            totalSpecular[0] += r;
            totalSpecular[1] += g;
            totalSpecular[2] += b;
          }

          totalContrib[0] += r;
          totalContrib[1] += g;
          totalContrib[2] += b;
        }
      });

      // Apply shadows
      let shadowMult = 1.0;
      if (shadowData && shadowIntensity > 0) {
        const idx = i * 4;
        const shadowValue = shadowData.data[idx] / 255;
        shadowMult = 1.0 - (1.0 - shadowValue) * shadowIntensity;
        
        // Apply shadow color
        totalDiffuse[0] = totalDiffuse[0] * shadowMult + shadowColor[0] * (1 - shadowMult);
        totalDiffuse[1] = totalDiffuse[1] * shadowMult + shadowColor[1] * (1 - shadowMult);
        totalDiffuse[2] = totalDiffuse[2] * shadowMult + shadowColor[2] * (1 - shadowMult);
      }

      // Apply master controls
      const finalR = (totalDiffuse[0] + totalSpecular[0]) * masterIntensity * masterColor[0] * exposureMultiplier;
      const finalG = (totalDiffuse[1] + totalSpecular[1]) * masterIntensity * masterColor[1] * exposureMultiplier;
      const finalB = (totalDiffuse[2] + totalSpecular[2]) * masterIntensity * masterColor[2] * exposureMultiplier;

      this.outputBuffer[i * 4] = finalR;
      this.outputBuffer[i * 4 + 1] = finalG;
      this.outputBuffer[i * 4 + 2] = finalB;
      this.outputBuffer[i * 4 + 3] = 1.0;

      diffuseOut[i * 4] = totalDiffuse[0];
      diffuseOut[i * 4 + 1] = totalDiffuse[1];
      diffuseOut[i * 4 + 2] = totalDiffuse[2];
      diffuseOut[i * 4 + 3] = 1.0;

      specularOut[i * 4] = totalSpecular[0];
      specularOut[i * 4 + 1] = totalSpecular[1];
      specularOut[i * 4 + 2] = totalSpecular[2];
      specularOut[i * 4 + 3] = 1.0;

      lightContrib[i * 4] = totalContrib[0];
      lightContrib[i * 4 + 1] = totalContrib[1];
      lightContrib[i * 4 + 2] = totalContrib[2];
      lightContrib[i * 4 + 3] = 1.0;
    }

    // Create output images
    this.createOutputImages(diffuseOut, specularOut, lightContrib);

    this.dirty = false;
  }

  private parseInputAOVs(): void {
    // Parse environment
    const envInput = this.inputs.get('environment');
    if (envInput?.value) {
      const layer = this.lightLayers.get('environment');
      if (layer) {
        layer.data = this.imageToFloat32(envInput.value as ImageData);
      }
    }

    // Parse GI
    const giInput = this.inputs.get('gi');
    if (giInput?.value) {
      const layer = this.lightLayers.get('gi');
      if (layer) {
        layer.data = this.imageToFloat32(giInput.value as ImageData);
      }
    }

    // Parse emission
    const emissionInput = this.inputs.get('emission');
    if (emissionInput?.value) {
      const layer = this.lightLayers.get('emission');
      if (layer) {
        layer.data = this.imageToFloat32(emissionInput.value as ImageData);
      }
    }

    // Parse caustics
    const causticsInput = this.inputs.get('caustics');
    if (causticsInput?.value) {
      const layer = this.lightLayers.get('caustics');
      if (layer) {
        layer.data = this.imageToFloat32(causticsInput.value as ImageData);
      }
    }

    // Parse individual lights
    for (let i = 1; i <= 16; i++) {
      const lightInput = this.inputs.get(`light${i}`);
      if (lightInput?.value) {
        const layerId = `light${i}`;
        if (!this.lightLayers.has(layerId)) {
          this.addLightLayer(layerId, `Light ${i}`, 'light');
        }
        const layer = this.lightLayers.get(layerId);
        if (layer) {
          layer.data = this.imageToFloat32(lightInput.value as ImageData);
        }
      }
    }

    // Also add diffuse/specular as base contribution if no specific lights
    const diffuseInput = this.inputs.get('diffuse');
    const specularInput = this.inputs.get('specular');

    // Count active light layers
    let hasLights = false;
    this.lightLayers.forEach(layer => {
      if (layer.type === 'light' && layer.data) hasLights = true;
    });

    if (!hasLights && diffuseInput?.value) {
      // Use diffuse as base lighting
      if (!this.lightLayers.has('baseDiffuse')) {
        this.addLightLayer('baseDiffuse', 'Base Diffuse', 'light');
      }
      const layer = this.lightLayers.get('baseDiffuse');
      if (layer) {
        layer.data = this.imageToFloat32(diffuseInput.value as ImageData);
        layer.contribution = 'diffuse';
      }
    }

    if (!hasLights && specularInput?.value) {
      if (!this.lightLayers.has('baseSpecular')) {
        this.addLightLayer('baseSpecular', 'Base Specular', 'light');
      }
      const layer = this.lightLayers.get('baseSpecular');
      if (layer) {
        layer.data = this.imageToFloat32(specularInput.value as ImageData);
        layer.contribution = 'specular';
      }
    }
  }

  private getEffectiveIntensity(layer: LightLayer): number {
    let intensity = layer.intensity;

    // Apply group multipliers
    this.lightGroups.forEach(group => {
      if (group.enabled && group.layers.includes(layer.id)) {
        intensity *= group.masterIntensity;
      }
    });

    // Apply type-specific multipliers
    switch (layer.type) {
      case 'environment':
        intensity *= this.getParameter('envIntensity') as number;
        break;
      case 'gi':
        intensity *= this.getParameter('giIntensity') as number;
        break;
      case 'emission':
        intensity *= this.getParameter('emissionIntensity') as number;
        break;
      case 'caustics':
        intensity *= this.getParameter('causticsIntensity') as number;
        break;
    }

    return intensity;
  }

  private getEffectiveColor(layer: LightLayer): [number, number, number] {
    let color: [number, number, number] = [...layer.color] as [number, number, number];

    // Apply group color
    this.lightGroups.forEach(group => {
      if (group.enabled && group.layers.includes(layer.id)) {
        color = [
          color[0] * group.masterColor[0],
          color[1] * group.masterColor[1],
          color[2] * group.masterColor[2]
        ];
      }
    });

    // Apply type-specific colors
    if (layer.type === 'environment') {
      const envColor = this.getParameter('envColor') as number[];
      color = [
        color[0] * envColor[0],
        color[1] * envColor[1],
        color[2] * envColor[2]
      ];
    }

    return color;
  }

  private imageToFloat32(image: ImageData): Float32Array {
    const pixels = image.width * image.height;
    const result = new Float32Array(pixels * 4);

    for (let i = 0; i < pixels; i++) {
      result[i * 4] = image.data[i * 4] / 255;
      result[i * 4 + 1] = image.data[i * 4 + 1] / 255;
      result[i * 4 + 2] = image.data[i * 4 + 2] / 255;
      result[i * 4 + 3] = image.data[i * 4 + 3] / 255;
    }

    return result;
  }

  private createOutputImages(diffuseOut: Float32Array, specularOut: Float32Array, lightContrib: Float32Array): void {
    if (!this.outputBuffer) return;

    const gamma = this.getParameter('gamma') as number;
    const colorSpace = this.getParameter('colorSpace') as string;

    // Beauty output
    const beautyImage = new ImageData(this.width, this.height);
    for (let i = 0; i < this.width * this.height; i++) {
      let r = this.outputBuffer[i * 4];
      let g = this.outputBuffer[i * 4 + 1];
      let b = this.outputBuffer[i * 4 + 2];

      // Apply color space conversion
      if (colorSpace === 'srgb') {
        r = this.linearToSRGB(r);
        g = this.linearToSRGB(g);
        b = this.linearToSRGB(b);
      } else if (colorSpace === 'linear') {
        r = Math.pow(r, 1 / gamma);
        g = Math.pow(g, 1 / gamma);
        b = Math.pow(b, 1 / gamma);
      }

      beautyImage.data[i * 4] = Math.round(Math.max(0, Math.min(1, r)) * 255);
      beautyImage.data[i * 4 + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
      beautyImage.data[i * 4 + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
      beautyImage.data[i * 4 + 3] = 255;
    }

    const beautyOut = this.outputs.get('beauty');
    if (beautyOut) beautyOut.value = beautyImage;

    // Diffuse output
    const diffuseImage = this.float32ToImage(diffuseOut, this.width, this.height, gamma, colorSpace);
    const diffuseOutput = this.outputs.get('diffuseOut');
    if (diffuseOutput) diffuseOutput.value = diffuseImage;

    // Specular output
    const specularImage = this.float32ToImage(specularOut, this.width, this.height, gamma, colorSpace);
    const specularOutput = this.outputs.get('specularOut');
    if (specularOutput) specularOutput.value = specularImage;

    // Light contribution output
    const contribImage = this.float32ToImage(lightContrib, this.width, this.height, gamma, colorSpace);
    const contribOut = this.outputs.get('lightContribution');
    if (contribOut) contribOut.value = contribImage;
  }

  private float32ToImage(data: Float32Array, width: number, height: number, gamma: number, colorSpace: string): ImageData {
    const image = new ImageData(width, height);
    
    for (let i = 0; i < width * height; i++) {
      let r = data[i * 4];
      let g = data[i * 4 + 1];
      let b = data[i * 4 + 2];

      if (colorSpace === 'srgb') {
        r = this.linearToSRGB(r);
        g = this.linearToSRGB(g);
        b = this.linearToSRGB(b);
      } else if (colorSpace === 'linear') {
        r = Math.pow(r, 1 / gamma);
        g = Math.pow(g, 1 / gamma);
        b = Math.pow(b, 1 / gamma);
      }

      image.data[i * 4] = Math.round(Math.max(0, Math.min(1, r)) * 255);
      image.data[i * 4 + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
      image.data[i * 4 + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
      image.data[i * 4 + 3] = 255;
    }

    return image;
  }

  private linearToSRGB(value: number): number {
    if (value <= 0.0031308) {
      return value * 12.92;
    }
    return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }

  /**
   * Export light mix settings to JSON
   */
  exportSettings(): string {
    const settings = {
      layers: Array.from(this.lightLayers.entries()).map(([id, layer]) => ({
        id,
        name: layer.name,
        intensity: layer.intensity,
        color: layer.color,
        enabled: layer.enabled,
        contribution: layer.contribution,
        shadowIntensity: layer.shadowIntensity
      })),
      groups: Array.from(this.lightGroups.entries()).map(([id, group]) => ({
        id,
        name: group.name,
        layers: group.layers,
        masterIntensity: group.masterIntensity,
        masterColor: group.masterColor,
        enabled: group.enabled
      })),
      globalSettings: {
        masterIntensity: this.getParameter('masterIntensity'),
        masterColor: this.getParameter('masterColor'),
        exposure: this.getParameter('exposure'),
        gamma: this.getParameter('gamma'),
        envIntensity: this.getParameter('envIntensity'),
        giIntensity: this.getParameter('giIntensity'),
        shadowIntensity: this.getParameter('shadowIntensity')
      }
    };

    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import light mix settings from JSON
   */
  importSettings(json: string): boolean {
    try {
      const settings = JSON.parse(json);

      // Restore layer settings
      for (const layerData of settings.layers) {
        const layer = this.lightLayers.get(layerData.id);
        if (layer) {
          layer.intensity = layerData.intensity;
          layer.color = layerData.color;
          layer.enabled = layerData.enabled;
          layer.contribution = layerData.contribution;
          layer.shadowIntensity = layerData.shadowIntensity;
        }
      }

      // Restore group settings
      for (const groupData of settings.groups) {
        const group = this.lightGroups.get(groupData.id);
        if (group) {
          group.masterIntensity = groupData.masterIntensity;
          group.masterColor = groupData.masterColor;
          group.enabled = groupData.enabled;
        }
      }

      // Restore global settings
      if (settings.globalSettings) {
        const g = settings.globalSettings;
        if (g.masterIntensity !== undefined) this.setParameter('masterIntensity', g.masterIntensity);
        if (g.masterColor !== undefined) this.setParameter('masterColor', g.masterColor);
        if (g.exposure !== undefined) this.setParameter('exposure', g.exposure);
        if (g.gamma !== undefined) this.setParameter('gamma', g.gamma);
        if (g.envIntensity !== undefined) this.setParameter('envIntensity', g.envIntensity);
        if (g.giIntensity !== undefined) this.setParameter('giIntensity', g.giIntensity);
        if (g.shadowIntensity !== undefined) this.setParameter('shadowIntensity', g.shadowIntensity);
      }

      this.markDirty();
      return true;
    } catch {
      console.error('Failed to import light mix settings');
      return false;
    }
  }

  dispose(): void {
    this.lightLayers.forEach(layer => {
      layer.data = null;
    });
    this.lightLayers.clear();
    this.lightGroups.clear();
    this.beautyBuffer = null;
    this.outputBuffer = null;
    this.presets.clear();
    super.dispose();
  }
}
