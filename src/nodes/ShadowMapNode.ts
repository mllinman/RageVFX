/**
 * ShadowMapNode - Dynamic shadow mapping for 3D scenes
 * Version 2.0 - Full 3D rendering pipeline
 */

import { Node, DataType } from '../core/Node';
import * as THREE from 'three';

export interface ShadowConfig {
  enabled: boolean;
  mapSize: number;
  bias: number;
  normalBias: number;
  radius: number;
  blurSamples: number;
  camera: {
    near: number;
    far: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    fov?: number;
  };
}

export class ShadowMapNode extends Node {
  private shadowConfigs: Map<string, ShadowConfig> = new Map();

  constructor(id: string) {
    super(id, 'ShadowMap', 'Shadow Map');
    this.metadata.category = '3D Pipeline';
    this.metadata.description = 'Dynamic shadow mapping configuration';
    this.metadata.version = '2.0.0';
    
    // Inputs
    this.addInput('lights', 'Lights', DataType.ANY);
    this.addInput('scene', 'Scene', DataType.ANY);
    
    // Outputs
    this.addOutput('shadowConfig', 'Shadow Config', DataType.ANY);
    this.addOutput('shadowMaps', 'Shadow Maps', DataType.ANY);
    
    // Global shadow parameters
    this.setParameter('enabled', true);
    this.setParameter('type', 'pcfsoft'); // basic, pcf, pcfsoft, vsm
    this.setParameter('autoUpdate', true);
    this.setParameter('needsUpdate', false);
    
    // Shadow map settings
    this.setParameter('mapSize', 2048);
    this.setParameter('bias', -0.0001);
    this.setParameter('normalBias', 0.02);
    this.setParameter('radius', 1);
    this.setParameter('blurSamples', 8);
    
    // Directional light shadow camera
    this.setParameter('directionalNear', 0.5);
    this.setParameter('directionalFar', 500);
    this.setParameter('directionalSize', 50);
    
    // Spot light shadow camera
    this.setParameter('spotNear', 0.5);
    this.setParameter('spotFar', 500);
    this.setParameter('spotFov', 50);
    
    // Point light shadow camera
    this.setParameter('pointNear', 0.5);
    this.setParameter('pointFar', 500);
    
    // Cascaded shadow maps for directional lights
    this.setParameter('cascades', 1); // 1-4 cascades
    this.setParameter('cascadeDistribution', 0.5); // 0-1, distribution of cascades
  }

  async process(): Promise<void> {
    const enabled = this.getParameter('enabled');
    const mapSize = this.getParameter('mapSize');
    const bias = this.getParameter('bias');
    const normalBias = this.getParameter('normalBias');
    const radius = this.getParameter('radius');
    const blurSamples = this.getParameter('blurSamples');

    this.shadowConfigs.clear();

    const lightsInput = this.inputs.get('lights');
    if (lightsInput?.value && enabled) {
      const lights = Array.isArray(lightsInput.value) ? lightsInput.value : [lightsInput.value];
      
      lights.forEach((light: THREE.Light, index: number) => {
        if (light instanceof THREE.DirectionalLight) {
          this.configureDirectionalLight(light, index, mapSize, bias, normalBias, radius, blurSamples);
        } else if (light instanceof THREE.SpotLight) {
          this.configureSpotLight(light, index, mapSize, bias, normalBias, radius, blurSamples);
        } else if (light instanceof THREE.PointLight) {
          this.configurePointLight(light, index, mapSize, bias, normalBias);
        }
      });
    }

    const shadowConfigOutput = this.outputs.get('shadowConfig');
    if (shadowConfigOutput) {
      shadowConfigOutput.value = {
        enabled,
        type: this.getParameter('type'),
        autoUpdate: this.getParameter('autoUpdate'),
        configs: Object.fromEntries(this.shadowConfigs)
      };
    }

    const shadowMapsOutput = this.outputs.get('shadowMaps');
    if (shadowMapsOutput) {
      // Return configured lights with shadow settings
      shadowMapsOutput.value = lightsInput?.value;
    }
  }

  private configureDirectionalLight(
    light: THREE.DirectionalLight,
    index: number,
    mapSize: number,
    bias: number,
    normalBias: number,
    radius: number,
    blurSamples: number
  ): void {
    light.castShadow = true;
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;
    light.shadow.bias = bias;
    light.shadow.normalBias = normalBias;
    light.shadow.radius = radius;
    light.shadow.blurSamples = blurSamples;

    const size = this.getParameter('directionalSize');
    light.shadow.camera.near = this.getParameter('directionalNear');
    light.shadow.camera.far = this.getParameter('directionalFar');
    light.shadow.camera.left = -size;
    light.shadow.camera.right = size;
    light.shadow.camera.top = size;
    light.shadow.camera.bottom = -size;

    this.shadowConfigs.set(`directional_${index}`, {
      enabled: true,
      mapSize,
      bias,
      normalBias,
      radius,
      blurSamples,
      camera: {
        near: light.shadow.camera.near,
        far: light.shadow.camera.far,
        left: -size,
        right: size,
        top: size,
        bottom: -size
      }
    });
  }

  private configureSpotLight(
    light: THREE.SpotLight,
    index: number,
    mapSize: number,
    bias: number,
    normalBias: number,
    radius: number,
    blurSamples: number
  ): void {
    light.castShadow = true;
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;
    light.shadow.bias = bias;
    light.shadow.normalBias = normalBias;
    light.shadow.radius = radius;
    light.shadow.blurSamples = blurSamples;

    light.shadow.camera.near = this.getParameter('spotNear');
    light.shadow.camera.far = this.getParameter('spotFar');
    light.shadow.camera.fov = this.getParameter('spotFov');

    this.shadowConfigs.set(`spot_${index}`, {
      enabled: true,
      mapSize,
      bias,
      normalBias,
      radius,
      blurSamples,
      camera: {
        near: light.shadow.camera.near,
        far: light.shadow.camera.far,
        fov: light.shadow.camera.fov
      }
    });
  }

  private configurePointLight(
    light: THREE.PointLight,
    index: number,
    mapSize: number,
    bias: number,
    normalBias: number
  ): void {
    light.castShadow = true;
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;
    light.shadow.bias = bias;
    light.shadow.normalBias = normalBias;

    light.shadow.camera.near = this.getParameter('pointNear');
    light.shadow.camera.far = this.getParameter('pointFar');

    this.shadowConfigs.set(`point_${index}`, {
      enabled: true,
      mapSize,
      bias,
      normalBias,
      radius: 0,
      blurSamples: 0,
      camera: {
        near: light.shadow.camera.near,
        far: light.shadow.camera.far
      }
    });
  }

  dispose(): void {
    this.shadowConfigs.clear();
    super.dispose();
  }
}
