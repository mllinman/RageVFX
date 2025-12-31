/**
 * Subscription Management for RageVFX Web App
 * Handles tier-based feature gating and user authentication
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trial' | 'none';
  periodEnd?: string;
  cancelAtPeriodEnd: boolean;
  email?: string;
}

export interface NodeAccess {
  id: string;
  name: string;
  category: string;
  minTier: SubscriptionTier;
  description: string;
}

/**
 * Subscription Manager
 */
export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private currentTier: SubscriptionTier = 'free';
  private subscriptionStatus: SubscriptionStatus | null = null;
  private apiUrl: string;

  private constructor() {
    // Use environment-based API URL
    this.apiUrl = this.getApiUrl();
  }

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  private getApiUrl(): string {
    // Detect environment and return appropriate API URL
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    } else {
      // Production API URL
      return 'https://api.ragevfx.com/api';
    }
  }

  /**
   * Initialize subscription on app launch
   */
  public async initialize(): Promise<SubscriptionTier> {
    // Check for auth token in URL params (from marketing site)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token') || params.get('auth');
    
    if (urlToken) {
      localStorage.setItem('ragevfx_auth_token', urlToken);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for stored token
    const token = localStorage.getItem('ragevfx_auth_token');
    
    if (token) {
      try {
        await this.validateToken(token);
      } catch (error) {
        console.warn('Token validation failed:', error);
        this.currentTier = 'free';
      }
    } else {
      this.currentTier = 'free';
    }

    this.updateUI();
    return this.currentTier;
  }

  /**
   * Validate authentication token and get subscription status
   */
  private async validateToken(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/subscription-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      this.subscriptionStatus = await response.json();
      this.currentTier = this.subscriptionStatus.tier;
    } catch (error) {
      // If API is not available, fall back to free tier
      console.warn('Subscription API unavailable, using free tier:', error);
      this.currentTier = 'free';
      localStorage.removeItem('ragevfx_auth_token');
      throw error;
    }
  }

  /**
   * Get current subscription tier
   */
  public getTier(): SubscriptionTier {
    return this.currentTier;
  }

  /**
   * Get full subscription status
   */
  public getStatus(): SubscriptionStatus | null {
    return this.subscriptionStatus;
  }

  /**
   * Check if user can access a specific node
   */
  public canUseNode(nodeType: string): boolean {
    const nodeAccess = this.getNodeAccess(nodeType);
    if (!nodeAccess) return true; // Unknown nodes are accessible by default
    
    return this.compareTiers(this.currentTier, nodeAccess.minTier) >= 0;
  }

  /**
   * Check if user can export at given resolution
   */
  public canExportResolution(width: number, height: number): boolean {
    const maxRes = this.getMaxResolution();
    return width <= maxRes && height <= maxRes;
  }

  /**
   * Get maximum export resolution for current tier
   */
  public getMaxResolution(): number {
    switch (this.currentTier) {
      case 'free':
        return 1920; // 1080p max width
      case 'pro':
      case 'enterprise':
        return 16384; // 16K max width
      default:
        return 1920;
    }
  }

  /**
   * Get node access information
   */
  private getNodeAccess(nodeType: string): NodeAccess | null {
    // Map of nodes to their required tiers
    const nodeAccessMap: Record<string, NodeAccess> = {
      // Pro-only nodes
      'BloodSplatterNode': {
        id: 'blood-splatter',
        name: 'Blood Splatter',
        category: 'VFX',
        minTier: 'pro',
        description: 'Realistic blood splatter effects with 150+ parameters'
      },
      'MuzzleFlashNode': {
        id: 'muzzle-flash',
        name: 'Muzzle Flash',
        category: 'VFX',
        minTier: 'pro',
        description: 'Professional gun muzzle flash simulation'
      },
      'DustNode': {
        id: 'dust',
        name: 'Dust',
        category: 'VFX',
        minTier: 'pro',
        description: 'Realistic dust and particle simulation'
      },
      'FluidPhysicsNode': {
        id: 'fluid-physics',
        name: 'Fluid Physics',
        category: 'Physics',
        minTier: 'pro',
        description: 'Complete Eulerian fluid dynamics simulation'
      },
      'PhysicsEngineNode': {
        id: 'physics-engine',
        name: 'Physics Engine',
        category: 'Physics',
        minTier: 'pro',
        description: 'Unified physics simulation engine with 70+ controls'
      },
      'PhysicsWorldNode': {
        id: 'physics-world',
        name: 'Physics World',
        category: 'Physics',
        minTier: 'pro',
        description: 'Global physics world management'
      },
      'MoGraphClonerNode': {
        id: 'mograph-cloner',
        name: 'MoGraph Cloner',
        category: 'MoGraph',
        minTier: 'pro',
        description: 'Cinema 4D-style procedural duplication system'
      },
      'MoGraphEffectorNode': {
        id: 'mograph-effector',
        name: 'MoGraph Effector',
        category: 'MoGraph',
        minTier: 'pro',
        description: 'Modify clones with various effector types'
      },
      'GeometryNodesNode': {
        id: 'geometry-nodes',
        name: 'Geometry Nodes',
        category: 'Procedural',
        minTier: 'pro',
        description: 'Blender-style procedural geometry manipulation'
      },
      'VDBNode': {
        id: 'vdb',
        name: 'VDB',
        category: 'VDB',
        minTier: 'pro',
        description: 'OpenVDB sparse volume support'
      },
      'VDBImportNode': {
        id: 'vdb-import',
        name: 'VDB Import',
        category: 'VDB',
        minTier: 'pro',
        description: 'Import OpenVDB files with multi-grid support'
      },
      'VDBExportNode': {
        id: 'vdb-export',
        name: 'VDB Export',
        category: 'VDB',
        minTier: 'pro',
        description: 'Export volumes to OpenVDB format'
      },
      'VDBCloudNode': {
        id: 'vdb-cloud',
        name: 'VDB Cloud',
        category: 'VDB',
        minTier: 'pro',
        description: 'Procedural cloud generation'
      },
      'VDBSmokeNode': {
        id: 'vdb-smoke',
        name: 'VDB Smoke',
        category: 'VDB',
        minTier: 'pro',
        description: 'Rising smoke with turbulence'
      },
      'VDBFireNode': {
        id: 'vdb-fire',
        name: 'VDB Fire',
        category: 'VDB',
        minTier: 'pro',
        description: 'Fire with fuel and temperature fields'
      },
      'VDBWaterNode': {
        id: 'vdb-water',
        name: 'VDB Water',
        category: 'VDB',
        minTier: 'pro',
        description: 'Level set liquid simulation'
      },
      'VDBSnowNode': {
        id: 'vdb-snow',
        name: 'VDB Snow',
        category: 'VDB',
        minTier: 'pro',
        description: 'Falling snow particles'
      },
      'PathTracerNode': {
        id: 'path-tracer',
        name: 'Path Tracer',
        category: '3D Rendering',
        minTier: 'pro',
        description: 'Production-quality path tracing'
      },
      'LightMixerNode': {
        id: 'light-mixer',
        name: 'Light Mixer',
        category: '3D Rendering',
        minTier: 'pro',
        description: 'Interactive post-render light control'
      },
      'ProceduralTerrainNode': {
        id: 'procedural-terrain',
        name: 'Procedural Terrain',
        category: 'Procedural',
        minTier: 'pro',
        description: 'Full terrain generation pipeline'
      },
      'CrowdSimNode': {
        id: 'crowd-sim',
        name: 'Crowd Simulation',
        category: 'Simulation',
        minTier: 'pro',
        description: 'Agent-based crowd simulation'
      },
      'ProceduralCityNode': {
        id: 'procedural-city',
        name: 'Procedural City',
        category: 'Procedural',
        minTier: 'pro',
        description: 'Urban environment generation'
      },
      'WrangleNode': {
        id: 'wrangle',
        name: 'Wrangle',
        category: 'Procedural',
        minTier: 'pro',
        description: 'Houdini-style VEX procedural expressions'
      },
      'SmartVectorNode': {
        id: 'smart-vector',
        name: 'Smart Vector',
        category: 'Compositing',
        minTier: 'pro',
        description: 'Motion-aware painting with motion vector tracking'
      },
      'ProjectionPaintNode': {
        id: 'projection-paint',
        name: 'Projection Paint',
        category: '3D',
        minTier: 'pro',
        description: 'Mari-like projection paint with multi-layer system'
      },
      'CameraImportNode': {
        id: 'camera-import',
        name: 'Camera Import',
        category: 'Camera',
        minTier: 'pro',
        description: 'Import cameras from Nuke/Maya/Blender'
      },
      'CameraFromVideoNode': {
        id: 'camera-from-video',
        name: 'Camera from Video',
        category: 'Camera',
        minTier: 'pro',
        description: 'Analyze video and generate matching 3D camera'
      }
    };

    return nodeAccessMap[nodeType] || null;
  }

  /**
   * Compare two tiers (returns negative if tier1 < tier2, 0 if equal, positive if tier1 > tier2)
   */
  private compareTiers(tier1: SubscriptionTier, tier2: SubscriptionTier): number {
    const tierOrder: Record<SubscriptionTier, number> = {
      free: 0,
      pro: 1,
      enterprise: 2
    };
    return tierOrder[tier1] - tierOrder[tier2];
  }

  /**
   * Show upgrade dialog for locked features
   */
  public showUpgradeDialog(featureName?: string): void {
    const message = featureName 
      ? `${featureName} requires Pro tier`
      : 'This feature requires Pro tier';

    const dialog = document.createElement('div');
    dialog.className = 'upgrade-dialog-overlay';
    dialog.innerHTML = `
      <div class="upgrade-dialog">
        <div class="upgrade-header">
          <h2>🚀 Upgrade to RageVFX Pro</h2>
          <button class="close-btn" onclick="this.closest('.upgrade-dialog-overlay').remove()">&times;</button>
        </div>
        <div class="upgrade-content">
          <p class="upgrade-message">${message}</p>
          <div class="upgrade-features">
            <h3>Pro Features Include:</h3>
            <ul>
              <li>✅ 176+ professional nodes</li>
              <li>✅ Desktop apps (Windows/macOS/Linux)</li>
              <li>✅ 8K+ export resolution (up to 16K)</li>
              <li>✅ Advanced VFX effects (Blood, Muzzle Flash, Dust)</li>
              <li>✅ OpenVDB import/export tools</li>
              <li>✅ Blender integration addon</li>
              <li>✅ Physics engine with 70+ controls</li>
              <li>✅ MoGraph tools (Cinema 4D-style)</li>
              <li>✅ Path tracing renderer</li>
              <li>✅ Commercial license</li>
              <li>✅ Unlimited cloud storage</li>
              <li>✅ Priority email support</li>
            </ul>
          </div>
          <div class="upgrade-pricing">
            <div class="price">
              <span class="price-amount">$29.95</span>
              <span class="price-period">/month</span>
            </div>
            <div class="price-annual">
              or $299/year <span class="badge">Save $60</span>
            </div>
          </div>
          <div class="upgrade-actions">
            <a href="https://ragevfx.com/#pricing" class="btn-upgrade-primary" target="_blank">
              Upgrade Now →
            </a>
            <button class="btn-upgrade-secondary" onclick="this.closest('.upgrade-dialog-overlay').remove()">
              Maybe Later
            </button>
          </div>
          <p class="upgrade-note">7-day free trial • Cancel anytime</p>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Close on overlay click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });

    // Close on Escape key
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dialog.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  /**
   * Update UI to show current tier
   */
  private updateUI(): void {
    // Add tier badge to header
    const header = document.querySelector('.menu-bar');
    if (header) {
      let tierBadge = document.getElementById('tier-badge');
      
      if (!tierBadge) {
        tierBadge = document.createElement('div');
        tierBadge.id = 'tier-badge';
        tierBadge.className = 'tier-badge';
        header.appendChild(tierBadge);
      }

      const tierInfo = this.getTierInfo();
      tierBadge.className = `tier-badge tier-${this.currentTier}`;
      tierBadge.textContent = tierInfo.label;
      tierBadge.title = tierInfo.description;

      // Add click handler for upgrade
      if (this.currentTier === 'free') {
        tierBadge.style.cursor = 'pointer';
        tierBadge.addEventListener('click', () => {
          this.showUpgradeDialog();
        });
      }
    }
  }

  /**
   * Get tier display information
   */
  private getTierInfo(): { label: string; description: string } {
    switch (this.currentTier) {
      case 'free':
        return {
          label: 'Free Tier',
          description: 'Upgrade to Pro for advanced features'
        };
      case 'pro':
        return {
          label: 'Pro',
          description: 'Professional tier with all features'
        };
      case 'enterprise':
        return {
          label: 'Enterprise',
          description: 'Enterprise tier with team features'
        };
      default:
        return { label: 'Free', description: '' };
    }
  }

  /**
   * Sign out and clear authentication
   */
  public signOut(): void {
    localStorage.removeItem('ragevfx_auth_token');
    this.currentTier = 'free';
    this.subscriptionStatus = null;
    this.updateUI();
    
    // Reload to reset app state
    window.location.reload();
  }

  /**
   * Check if downloads are available (Pro/Enterprise only)
   */
  public canDownloadDesktopApp(): boolean {
    return this.currentTier === 'pro' || this.currentTier === 'enterprise';
  }
}

// Export singleton instance
export const subscriptionManager = SubscriptionManager.getInstance();
