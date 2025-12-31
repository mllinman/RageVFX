# RageVFX Subscription Tiers & Feature Gating

## Overview

RageVFX uses a tiered subscription model to monetize features while providing a free tier for evaluation and basic use.

## Subscription Tiers

### Free Tier
- **Price**: $0/month (forever)
- **Access**: Web app only
- **Features**: See feature matrix below

### Pro Tier
- **Price**: $29.95/month or $299/year (save $60)
- **Access**: Web app + Desktop apps (Windows/macOS/Linux)
- **Features**: See feature matrix below

### Enterprise Tier
- **Price**: Custom (starting at $99/user/month)
- **Access**: Everything in Pro + Enterprise features
- **Features**: See feature matrix below

## Feature Matrix

| Feature Category | Free | Pro | Enterprise |
|-----------------|------|-----|------------|
| **Platform Access** |
| Web Application | ✅ | ✅ | ✅ |
| Desktop App (Windows) | ❌ | ✅ | ✅ |
| Desktop App (macOS) | ❌ | ✅ | ✅ |
| Desktop App (Linux) | ❌ | ✅ | ✅ |
| Offline Mode | ❌ | ✅ | ✅ |
| **Node Access** |
| Basic Nodes (75) | ✅ | ✅ | ✅ |
| Standard Nodes (50) | ⚠️ Limited | ✅ | ✅ |
| Advanced Nodes (51+) | ❌ | ✅ | ✅ |
| Total Nodes | 75 | 176+ | 176+ |
| **Export Quality** |
| Max Resolution | 1080p | 8K+ (16K) | 8K+ (16K) |
| Format Support | PNG, JPEG | All formats | All formats |
| Bit Depth | 8-bit | 8/16/32-bit | 8/16/32-bit |
| Image Sequences | ❌ | ✅ | ✅ |
| Video Export | ❌ | ✅ | ✅ |
| **VFX Effects** |
| Basic Effects | ✅ | ✅ | ✅ |
| Advanced Effects | ❌ | ✅ | ✅ |
| Blood Splatter | ❌ | ✅ | ✅ |
| Muzzle Flash | ❌ | ✅ | ✅ |
| Explosions | ⚠️ Basic | ✅ Advanced | ✅ Advanced |
| Fluid Simulation | ❌ | ✅ | ✅ |
| **3D & Rendering** |
| Basic 3D | ✅ | ✅ | ✅ |
| Path Tracing | ❌ | ✅ | ✅ |
| Volumetric Effects | ❌ | ✅ | ✅ |
| GPU Acceleration | ⚠️ Limited | ✅ Full | ✅ Full |
| **Tools** |
| MoGraph Tools | ❌ | ✅ | ✅ |
| Physics Engine | ⚠️ Basic | ✅ Full | ✅ Full |
| OpenVDB Support | ❌ | ✅ | ✅ |
| Blender Integration | ❌ | ✅ | ✅ |
| Camera Tracking | ❌ | ✅ | ✅ |
| **Storage** |
| Cloud Storage | 5GB | Unlimited | Unlimited |
| Cloud Projects | 3 | Unlimited | Unlimited |
| Project Sharing | ❌ | ✅ | ✅ |
| **Support** |
| Community Support | ✅ | ✅ | ✅ |
| Email Support | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |
| **Licensing** |
| Personal Use | ✅ | ✅ | ✅ |
| Commercial Use | ❌ | ✅ | ✅ |
| Team Collaboration | ❌ | ❌ | ✅ |
| SSO Integration | ❌ | ❌ | ✅ |
| Centralized License | ❌ | ❌ | ✅ |

## Node Categories & Access

### Free Tier Nodes (75 nodes)

**Input/Output (6)**:
- ImageInputNode
- OutputNode
- CameraPresetNode
- ImageSequenceOutputNode
- VideoSequenceOutputNode
- CameraFormatOutputNode

**Basic Compositing (12)**:
- MergeNode (basic blend modes)
- ColorCorrectNode
- ColorGradeNode
- BlurNode
- SharpenNode
- EdgeDetectNode
- AlphaOperationsNode
- TransformNode
- LensDistortionNode
- PerspectiveTransformNode
- DeepCompositeNode (basic)
- CryptomatteNode

**Basic 3D (8)**:
- Geometry3DNode (basic primitives)
- MeshNode
- CameraNode
- LightNode (basic)
- MaterialNode (basic)
- EnvironmentMapNode (basic)
- ShadowMapNode (basic)
- SceneNode

**Basic VFX (10)**:
- ParticleSystemNode (basic)
- ParticleEmitterNode (basic)
- ParticleForceNode (basic)
- AnamorphicFlareNode
- NebulaNode
- ShockwaveNode (basic)
- PlasmaNode
- DebrisNode (basic)
- SparkNode (basic)
- ExplosionNode (basic)

**Color & Filters (8)**:
- LUTLoaderNode
- CDLNode
- OCIOColorSpaceNode
- OCIOLookNode
- GlitchNode (basic)
- TextOverlayNode
- ColorMatchNode
- HeatDistortionNode

**Basic Tracking (3)**:
- MotionVectorsNode
- TrackingDataNode
- Camera3DTrackingNode (basic)

**Basic Animation (4)**:
- AnimationTimelineNode
- CurveEditorNode (basic)
- TransitionNode
- ArrayModifierNode (basic)

**Utilities (24)**:
- Resolution8KNode (up to 1080p)
- StereoCamera3DNode (basic)
- StereoCompositorNode
- Transform3DNode
- ModelImportNode
- ModelExportNode
- CameraLensNode (basic)
- LensDistortionCorrectionNode
- BackdropNode
- ViewportSettingsNode
- SettingsNode
- AOVManagerNode
- MultiShotNode (basic)
- GlitchNode
- EnergyFieldNode (basic)
- MagicParticlesNode (basic)
- TimeWarpNode (basic)
- PortalNode (basic)
- HologramNode (basic)
- CausticsNode (basic)
- AuroraNode
- DepthMapGeneratorNode (basic)
- StereoConverterNode (basic)
- IBKKeyerNode (basic)

### Pro Tier Additional Nodes (101 nodes)

All Free tier nodes plus:

**Advanced Compositing (8)**:
- MergeNode (all blend modes)
- DeepCompositeNode (full)
- CryptomatteNode (advanced)
- AOVManagerNode (advanced)
- MultiShotNode (full)
- IBKKeyerNode (full)
- SmartVectorNode
- ProjectionPaintNode

**Advanced 3D (12)**:
- Renderer3DNode
- MaterialNode (PBR full)
- EnvironmentMapNode (HDRI full)
- ShadowMapNode (PCF soft shadows)
- VolumetricFogNode
- VolumetricLightNode
- VolumeRenderNode
- CloudVolumeNode
- PathTracerNode
- LightMixerNode
- RealWorldCameraNode
- CameraImportNode

**Advanced VFX (25)**:
- BloodSplatterNode ⭐
- MuzzleFlashNode ⭐
- DustNode ⭐
- ExplosionNode (full) ⭐
- SparkNode (full) ⭐
- ShockwaveNode (full)
- PortalNode (full)
- HologramNode (full)
- CausticsNode (full)
- DebrisNode (full)
- EnergyFieldNode (full)
- MagicParticlesNode (full)
- TimeWarpNode (full)
- ParticleSystemNode (advanced)
- ParticleEmitterNode (advanced)
- ParticleForceNode (advanced)
- LightNode (advanced)
- StyleTransferNode
- UpscaleNode
- DenoiseNode
- ObjectDetectionNode
- InpaintNode
- DepthEstimationNode
- SegmentAnythingNode
- BackgroundRemovalNode

**Physics & Simulation (18)**:
- PhysicsEngineNode ⭐
- PhysicsWorldNode ⭐
- RigidBodyNode
- SoftBodyNode
- FluidSimNode
- ClothSimNode
- CollisionNode
- FluidPhysicsNode ⭐
- FluidCacheNode
- Camera3DTrackingNode (full)
- ProceduralTerrainNode ⭐
- CrowdSimNode ⭐
- AdaptiveSamplerNode
- PhysicsParticlesNode
- OceanModifierNode
- CameraFromVideoNode ⭐
- BackgroundCardNode
- WrangleNode ⭐

**MoGraph & Procedural (8)**:
- MoGraphClonerNode ⭐
- MoGraphEffectorNode ⭐
- GeometryNodesNode ⭐
- MotionGraphicsNode
- ProceduralCityNode ⭐
- ArrayModifierNode (full)
- CurveEditorNode (full)
- TransitionNode (full)

**OpenVDB (7)**:
- VDBNode ⭐
- VDBImportNode ⭐
- VDBExportNode ⭐
- VDBCloudNode ⭐
- VDBSmokeNode ⭐
- VDBFireNode ⭐
- VDBWaterNode ⭐
- VDBSnowNode ⭐

**Machine Learning (8)**:
- NeuralNetTrainerNode
- FaceEnhancementNode
- MotionPredictionNode
- StyleTransferNode (advanced)
- UpscaleNode (advanced)
- DenoiseNode (advanced)
- SegmentAnythingNode (advanced)
- BackgroundRemovalNode (advanced)

**Pipeline & Collaboration (5)**:
- USDNode
- AlembicNode
- PipelineManagerNode
- ReviewToolNode
- VersionControlNode

**Advanced Tools (10)**:
- Resolution8KNode (full 8K-16K)
- DepthMapGeneratorNode (full)
- StereoConverterNode (full)
- AssetBrowserNode
- DualViewerNode
- Camera3DTrackingNode (advanced)
- RealWorldCameraNode (advanced)
- CameraLensNode (advanced)
- LensDistortionCorrectionNode (advanced)
- CameraImportNode (advanced)

⭐ = Flagship Pro features

### Enterprise Tier Additional Features

All Pro tier features plus:

**Collaboration**:
- Real-time multi-user editing
- Team project management
- Centralized asset library
- Version control integration

**Security**:
- SSO integration (SAML, OAuth)
- Role-based access control
- Audit logging
- IP restrictions

**Administration**:
- Centralized license management
- Usage analytics dashboard
- Custom branding
- API access

**Support**:
- Priority support (24/7)
- Dedicated account manager
- Custom training
- Pipeline consulting

## Implementation

### Subscription Verification

**Web App Flow**:
```typescript
// Check subscription status
async function getSubscriptionTier(): Promise<Tier> {
  const token = localStorage.getItem('authToken');
  if (!token) return 'free';
  
  try {
    const response = await fetch('https://api.ragevfx.com/subscription-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.tier; // 'free' | 'pro' | 'enterprise'
  } catch {
    return 'free';
  }
}
```

### Feature Gating

**Node Registration**:
```typescript
interface NodeDefinition {
  id: string;
  name: string;
  category: string;
  minTier: 'free' | 'pro' | 'enterprise';
  description: string;
}

// Example: Blood Splatter Node (Pro only)
const bloodSplatterNode: NodeDefinition = {
  id: 'blood-splatter',
  name: 'Blood Splatter',
  category: 'VFX',
  minTier: 'pro',
  description: 'Realistic blood splatter effects (Pro tier required)'
};

// Check access
function canUseNode(nodeId: string, userTier: Tier): boolean {
  const node = getNodeDefinition(nodeId);
  return compareTiers(userTier, node.minTier) >= 0;
}

function compareTiers(userTier: Tier, requiredTier: Tier): number {
  const tierOrder = { free: 0, pro: 1, enterprise: 2 };
  return tierOrder[userTier] - tierOrder[requiredTier];
}
```

**Export Resolution Gating**:
```typescript
function getMaxResolution(tier: Tier): number {
  switch (tier) {
    case 'free': return 1920; // 1080p max width
    case 'pro': return 16384; // 16K max width
    case 'enterprise': return 16384; // 16K max width
    default: return 1920;
  }
}

function validateExportResolution(width: number, height: number, tier: Tier): boolean {
  const maxRes = getMaxResolution(tier);
  if (width > maxRes || height > maxRes) {
    showUpgradeDialog(`Export resolution limited to ${maxRes}px in ${tier} tier`);
    return false;
  }
  return true;
}
```

**UI Indicators**:
```typescript
// Show lock icon on Pro/Enterprise nodes for Free users
function renderNodePalette(tier: Tier) {
  allNodes.forEach(node => {
    const canUse = canUseNode(node.id, tier);
    const element = createNodeElement(node);
    
    if (!canUse) {
      element.classList.add('locked');
      element.appendChild(createLockIcon(node.minTier));
      element.addEventListener('click', () => {
        showUpgradeDialog(`${node.name} requires ${node.minTier} tier`);
      });
    }
  });
}
```

### Launch from Website

**Marketing Site Integration** (`marketing/index.html`):
```html
<!-- Free tier: Launch web app -->
<a href="/web/" class="btn-launch-web">
  Try Web App (Free)
</a>

<!-- Pro tier: Launch with auth -->
<a href="/web/?auth=true" class="btn-launch-pro" id="launchProApp">
  Launch Pro App
</a>

<!-- Desktop downloads (Pro only) -->
<div id="downloadSection" class="downloads" style="display: none;">
  <a href="https://github.com/mllinman/RageVFX/releases/latest/download/RageVFX-Setup-3.11.0.exe">
    Download for Windows
  </a>
  <a href="https://github.com/mllinman/RageVFX/releases/latest/download/RageVFX-3.11.0.dmg">
    Download for macOS
  </a>
  <a href="https://github.com/mllinman/RageVFX/releases/latest/download/RageVFX-3.11.0.AppImage">
    Download for Linux
  </a>
</div>

<script>
// Check subscription and show appropriate options
async function checkSubscription() {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  
  try {
    const response = await fetch('https://api.ragevfx.com/subscription-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.tier === 'pro' || data.tier === 'enterprise') {
      document.getElementById('downloadSection').style.display = 'block';
      document.getElementById('launchProApp').href = `/web/?token=${token}`;
    }
  } catch (error) {
    console.error('Failed to check subscription:', error);
  }
}

checkSubscription();
</script>
```

**Web App Launch** (`web/app.ts`):
```typescript
// Check for auth token on launch
async function initializeApp() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || localStorage.getItem('authToken');
  
  if (token) {
    localStorage.setItem('authToken', token);
    const tier = await getSubscriptionTier();
    initializeWithTier(tier);
  } else {
    initializeWithTier('free');
  }
}

function initializeWithTier(tier: Tier) {
  console.log(`Initializing RageVFX in ${tier} tier mode`);
  
  // Load appropriate node library
  loadNodes(tier);
  
  // Set export limits
  setExportLimits(tier);
  
  // Configure UI
  configureUI(tier);
  
  // Show tier indicator
  showTierBadge(tier);
}
```

### Upgrade Prompts

**In-App Upgrade Dialog**:
```typescript
function showUpgradeDialog(featureName: string) {
  const dialog = createDialog({
    title: 'Upgrade to Pro',
    message: `${featureName} is available in Pro tier`,
    features: [
      '176+ professional nodes',
      'Desktop apps (Windows/macOS/Linux)',
      '8K+ export resolution',
      'Advanced VFX effects',
      'OpenVDB tools',
      'Commercial license',
      'Unlimited cloud storage'
    ],
    pricing: '$29.95/month or $299/year (save $60)',
    ctaText: 'Upgrade Now',
    ctaLink: 'https://ragevfx.com/#pricing'
  });
  
  dialog.show();
}
```

### Desktop App License Validation

**Electron Main Process** (`src/main.ts`):
```typescript
import { app, BrowserWindow, ipcMain } from 'electron';

// Check license on startup
app.on('ready', async () => {
  const licenseKey = getStoredLicenseKey();
  
  if (!licenseKey) {
    // Show license activation dialog
    showLicenseActivation();
  } else {
    // Validate license with server
    const valid = await validateLicense(licenseKey);
    
    if (valid) {
      createMainWindow('pro');
    } else {
      showLicenseActivation();
    }
  }
});

async function validateLicense(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.ragevfx.com/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key })
    });
    const data = await response.json();
    return data.valid && data.tier === 'pro';
  } catch {
    // Offline grace period: allow 7 days without validation
    const lastValidation = getLastValidationTime();
    return (Date.now() - lastValidation) < 7 * 24 * 60 * 60 * 1000;
  }
}

function showLicenseActivation() {
  const window = new BrowserWindow({
    width: 500,
    height: 400,
    title: 'Activate RageVFX Pro'
  });
  
  window.loadFile('ui/activate.html');
}
```

## Subscription Management API

### Backend Endpoints

**GET /api/subscription-status**:
```typescript
// Returns user's current subscription tier
{
  tier: 'free' | 'pro' | 'enterprise',
  status: 'active' | 'canceled' | 'past_due',
  periodEnd: '2025-01-31T00:00:00Z',
  cancelAtPeriodEnd: false
}
```

**POST /api/validate-license**:
```typescript
// Validates desktop app license key
{
  licenseKey: 'RAGEVFX-PRO-XXXX-XXXX-XXXX-XXXX'
}

// Response:
{
  valid: true,
  tier: 'pro',
  email: 'user@example.com',
  expiresAt: '2025-12-31T00:00:00Z'
}
```

**POST /api/generate-download-token**:
```typescript
// Generates temporary token for desktop app downloads
{
  platform: 'windows' | 'macos' | 'linux'
}

// Response:
{
  token: 'temporary_jwt_token',
  downloadUrl: 'https://releases.ragevfx.com/...',
  expiresAt: '2025-01-01T01:00:00Z'
}
```

## Testing

### Test Scenarios

1. **Free User Launch**:
   - Visit web app without auth
   - Verify only free tier nodes visible
   - Attempt to use Pro node → see upgrade dialog
   - Attempt 4K export → see resolution limit

2. **Pro User Launch from Website**:
   - Log in on marketing site
   - Click "Launch App"
   - Verify redirected with auth token
   - Verify Pro tier features accessible

3. **Pro User Desktop App**:
   - Download desktop app
   - Enter license key
   - Verify online validation
   - Disconnect internet
   - Verify offline grace period (7 days)

4. **Subscription Cancellation**:
   - Cancel subscription
   - Verify access until period end
   - After period end, downgrade to Free

5. **Upgrade Flow**:
   - Start as Free user
   - Click upgrade on locked feature
   - Complete payment
   - Verify immediate Pro access

### Test Users (Development)

```typescript
// Create test users for each tier
const testUsers = {
  free: {
    email: 'free@test.com',
    token: 'test_token_free'
  },
  pro: {
    email: 'pro@test.com',
    token: 'test_token_pro',
    licenseKey: 'RAGEVFX-PRO-TEST-TEST-TEST-TEST'
  },
  enterprise: {
    email: 'enterprise@test.com',
    token: 'test_token_enterprise'
  }
};
```

## Pricing Page Integration

Update marketing site pricing section to highlight tier benefits and provide clear CTAs.

**Recommendations**:
- Show feature comparison table
- Highlight Pro tier (most popular)
- Annual discount badge
- 7-day free trial for Pro
- Money-back guarantee
- Clear upgrade path

---

**Document Version**: 1.0  
**Last Updated**: December 31, 2024  
**Next Review**: Q1 2025
