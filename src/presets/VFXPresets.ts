/**
 * VFX Node Presets - Built-in preset configurations for photo-realistic effects
 * These presets provide professional starting points for various VFX scenarios
 */

export interface NodePreset {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, any>;
}

export const VFX_PRESETS: Record<string, NodePreset[]> = {
  Fire: [
    {
      name: 'Campfire',
      description: 'Small, warm campfire with gentle flickering',
      category: 'Natural',
      parameters: {
        intensity: 0.8,
        speed: 0.6,
        turbulence: 1.5,
        scale: 0.008,
        colorBase: { r: 255, g: 120, b: 20 },
        colorTip: { r: 255, g: 200, b: 80 },
        height_falloff: 0.8
      }
    },
    {
      name: 'Explosion',
      description: 'Intense, fast-moving explosion fire',
      category: 'Action',
      parameters: {
        intensity: 1.5,
        speed: 3.0,
        turbulence: 4.0,
        scale: 0.003,
        colorBase: { r: 255, g: 80, b: 0 },
        colorTip: { r: 255, g: 255, b: 200 },
        height_falloff: 0.4
      }
    },
    {
      name: 'Dragon Fire',
      description: 'Magical blue-tinted dragon fire',
      category: 'Fantasy',
      parameters: {
        intensity: 1.2,
        speed: 1.5,
        turbulence: 3.0,
        scale: 0.004,
        colorBase: { r: 100, g: 150, b: 255 },
        colorTip: { r: 200, g: 230, b: 255 },
        height_falloff: 0.6
      }
    },
    {
      name: 'Torch',
      description: 'Medieval torch with steady flame',
      category: 'Historical',
      parameters: {
        intensity: 0.9,
        speed: 0.8,
        turbulence: 2.0,
        scale: 0.007,
        colorBase: { r: 255, g: 100, b: 10 },
        colorTip: { r: 255, g: 220, b: 100 },
        height_falloff: 0.75
      }
    },
    {
      name: 'Inferno',
      description: 'Large-scale raging inferno',
      category: 'Disaster',
      parameters: {
        intensity: 2.0,
        speed: 2.5,
        turbulence: 5.0,
        scale: 0.002,
        colorBase: { r: 255, g: 60, b: 0 },
        colorTip: { r: 255, g: 180, b: 60 },
        height_falloff: 0.3
      }
    }
  ],
  
  Water: [
    {
      name: 'Ocean Surface',
      description: 'Calm ocean with gentle waves',
      category: 'Natural',
      parameters: {
        waveHeight: 0.5,
        waveSpeed: 0.8,
        waveFrequency: 2.0,
        turbulence: 1.0,
        colorDeep: { r: 0, g: 50, b: 100 },
        colorShallow: { r: 50, g: 150, b: 200 },
        transparency: 0.7
      }
    },
    {
      name: 'Storm Waves',
      description: 'Rough ocean during storm',
      category: 'Weather',
      parameters: {
        waveHeight: 2.5,
        waveSpeed: 2.0,
        waveFrequency: 4.0,
        turbulence: 3.5,
        colorDeep: { r: 10, g: 30, b: 60 },
        colorShallow: { r: 80, g: 120, b: 150 },
        transparency: 0.5
      }
    },
    {
      name: 'Tropical Lagoon',
      description: 'Crystal clear tropical water',
      category: 'Natural',
      parameters: {
        waveHeight: 0.3,
        waveSpeed: 0.5,
        waveFrequency: 1.5,
        turbulence: 0.8,
        colorDeep: { r: 0, g: 100, b: 150 },
        colorShallow: { r: 100, g: 200, b: 230 },
        transparency: 0.9
      }
    },
    {
      name: 'River Rapids',
      description: 'Fast-flowing white water',
      category: 'Natural',
      parameters: {
        waveHeight: 1.5,
        waveSpeed: 3.0,
        waveFrequency: 6.0,
        turbulence: 4.0,
        colorDeep: { r: 40, g: 80, b: 100 },
        colorShallow: { r: 200, g: 220, b: 240 },
        transparency: 0.6
      }
    }
  ],
  
  Smoke: [
    {
      name: 'Cigarette Smoke',
      description: 'Thin wispy cigarette smoke',
      category: 'Atmospheric',
      parameters: {
        density: 0.3,
        rise_speed: 0.5,
        turbulence: 1.5,
        dissipation: 0.8,
        color: { r: 200, g: 200, b: 220 },
        scale: 0.01
      }
    },
    {
      name: 'Industrial Smoke',
      description: 'Heavy black industrial emissions',
      category: 'Urban',
      parameters: {
        density: 1.2,
        rise_speed: 0.8,
        turbulence: 2.5,
        dissipation: 0.3,
        color: { r: 40, g: 40, b: 45 },
        scale: 0.004
      }
    },
    {
      name: 'Mystical Fog',
      description: 'Magical glowing fog',
      category: 'Fantasy',
      parameters: {
        density: 0.7,
        rise_speed: 0.3,
        turbulence: 1.0,
        dissipation: 0.2,
        color: { r: 150, g: 180, b: 255 },
        scale: 0.006
      }
    },
    {
      name: 'Campfire Smoke',
      description: 'Wood smoke from campfire',
      category: 'Natural',
      parameters: {
        density: 0.6,
        rise_speed: 0.7,
        turbulence: 2.0,
        dissipation: 0.5,
        color: { r: 180, g: 180, b: 190 },
        scale: 0.008
      }
    }
  ],
  
  Clouds: [
    {
      name: 'Cumulus',
      description: 'Puffy white cumulus clouds',
      category: 'Weather',
      parameters: {
        coverage: 0.5,
        density: 0.8,
        scale: 0.003,
        detail: 3.0,
        wind_speed: 0.2,
        height_variation: 0.6
      }
    },
    {
      name: 'Storm Clouds',
      description: 'Dark threatening storm clouds',
      category: 'Weather',
      parameters: {
        coverage: 0.8,
        density: 1.2,
        scale: 0.002,
        detail: 4.0,
        wind_speed: 1.5,
        height_variation: 1.0,
        color: { r: 60, g: 60, b: 70 }
      }
    },
    {
      name: 'Wispy Cirrus',
      description: 'High-altitude thin cirrus clouds',
      category: 'Weather',
      parameters: {
        coverage: 0.3,
        density: 0.3,
        scale: 0.001,
        detail: 2.0,
        wind_speed: 2.0,
        height_variation: 0.3
      }
    },
    {
      name: 'Overcast',
      description: 'Complete cloud coverage',
      category: 'Weather',
      parameters: {
        coverage: 1.0,
        density: 0.9,
        scale: 0.004,
        detail: 2.5,
        wind_speed: 0.5,
        height_variation: 0.4
      }
    }
  ],
  
  Explosion: [
    {
      name: 'Small Blast',
      description: 'Grenade or small explosive',
      category: 'Action',
      parameters: {
        size: 1.0,
        speed: 1.5,
        shockwave: 0.8,
        debris_count: 50,
        fire_intensity: 1.0,
        smoke_amount: 0.7
      }
    },
    {
      name: 'Car Explosion',
      description: 'Vehicle explosion with fireball',
      category: 'Action',
      parameters: {
        size: 3.0,
        speed: 1.2,
        shockwave: 1.5,
        debris_count: 200,
        fire_intensity: 1.5,
        smoke_amount: 1.2
      }
    },
    {
      name: 'Nuclear Detonation',
      description: 'Massive nuclear explosion',
      category: 'Disaster',
      parameters: {
        size: 10.0,
        speed: 0.8,
        shockwave: 3.0,
        debris_count: 500,
        fire_intensity: 2.0,
        smoke_amount: 2.0,
        mushroom_cloud: true
      }
    },
    {
      name: 'Fireworks',
      description: 'Colorful firework burst',
      category: 'Celebration',
      parameters: {
        size: 2.0,
        speed: 2.0,
        shockwave: 0.3,
        debris_count: 100,
        fire_intensity: 0.5,
        smoke_amount: 0.2,
        colors: 'rainbow'
      }
    }
  ]
};

/**
 * Get presets for a specific node type
 */
export function getPresetsForNode(nodeType: string): NodePreset[] {
  return VFX_PRESETS[nodeType] || [];
}

/**
 * Apply a preset to a node
 */
export function applyPreset(node: any, preset: NodePreset): void {
  for (const [key, value] of Object.entries(preset.parameters)) {
    if (node.setParameter) {
      node.setParameter(key, value);
    }
  }
}

/**
 * Get all preset categories
 */
export function getPresetCategories(nodeType: string): string[] {
  const presets = getPresetsForNode(nodeType);
  const categories = new Set(presets.map(p => p.category));
  return Array.from(categories);
}
