# Episode 17: Camera Tracking & Integration

**Duration**: 36 minutes  
**Level**: Advanced  
**Prerequisites**: Episodes 1-16

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 2:00)

> Camera tracking is the bridge between live-action footage and CG elements. By extracting the camera's movement from footage, we can seamlessly integrate 3D objects that move perfectly with the real world.
>
> In this tutorial, we'll learn professional camera tracking and use real-world camera specifications for accurate results.

**Key Learning Objectives:**
- Understand 3D camera tracking concepts
- Use Camera3DTrackingNode effectively
- Work with real-world camera specifications
- Integrate CG elements with tracked footage
- Export camera data to other applications

---

### Part 1: Camera Tracking Fundamentals (2:00 - 8:00)

#### What is 3D Camera Tracking?

Analyzing footage to extract:
- Camera position over time
- Camera rotation over time
- Lens properties
- 3D point cloud of scene

#### The Tracking Process

1. **Feature Detection** - Find trackable points
2. **Feature Tracking** - Follow points through frames
3. **Camera Solve** - Calculate 3D camera path
4. **Point Cloud** - Generate 3D scene structure
5. **Scene Setup** - Orient and scale

#### Good Tracking Footage

| Good | Bad |
|------|-----|
| Texture-rich surfaces | Blank walls |
| Sharp focus | Motion blur |
| Stable exposure | Flickering |
| Parallax movement | Pure rotation |
| Varied depth | Flat scene |

---

### Part 2: Camera3DTrackingNode (8:00 - 18:00)

#### Setting Up Tracking

```
[Source Footage] → [Camera3DTracking] → [Camera Data]
                                      → [Point Cloud]
```

#### Feature Detection

| Detector | Speed | Quality | Best For |
|----------|-------|---------|----------|
| SIFT | Slow | Best | Final solve |
| ORB | Fast | Good | Preview |
| AKAZE | Medium | Great | General use |
| Harris | Fast | Basic | Dense features |
| Shi-Tomasi | Fast | Good | Corners |

```
detector: AKAZE
maxFeatures: 2000
minDistance: 15
```

#### Tracking Parameters

```
trackBidirectional: true    # Forward/backward check
minTrackLength: 10          # Minimum frames tracked
maxTrackError: 1.5          # Max pixel error
```

#### Camera Model

| Model | Use |
|-------|-----|
| perspective | Standard lenses |
| fisheye | GoPro, wide angle |
| spherical | 360° cameras |

#### Lens Distortion

| Model | Description |
|-------|-------------|
| Brown-Conrady | Standard lens model |
| Fisheye | Extreme wide angle |
| None | Pre-undistorted footage |

```
distortionModel: Brown-Conrady
k1: -0.2    # Radial distortion
k2: 0.05
p1: 0       # Tangential
p2: 0
```

#### Running the Solve

1. **Detect features** - Run detection
2. **Track features** - Follow through sequence
3. **Solve camera** - Calculate path
4. **Refine** - Bundle adjustment
5. **Evaluate** - Check error metrics

#### Error Metrics

| Metric | Good | Acceptable | Bad |
|--------|------|------------|-----|
| Reprojection | <0.3px | <1px | >2px |
| Focal length variance | <2% | <5% | >10% |
| Principal point | <10px | <50px | >100px |

---

### Part 3: Real-World Camera System (18:00 - 26:00)

#### RealWorldCameraNode

Create cameras based on actual equipment.

```
[RealWorldCamera] → [Scene]
```

#### Supported Camera Bodies

**ARRI:**
- ALEXA 35 (4.6K, 17+ stops)
- ALEXA LF (4.5K, large format)

**RED:**
- V-RAPTOR XL 8K (8192×4320)
- KOMODO 6K (6144×3240)

**Sony:**
- VENICE 2 8K (8.6K)
- FX6 (4K)

**Blackmagic:**
- URSA Mini Pro 12K

**Canon:**
- EOS C70
- EOS C500 Mark II

**Generic:**
- Full Frame 35mm
- Super 35mm
- APS-C
- Micro Four Thirds

#### Lens Presets

| Lens | Type | Characteristics |
|------|------|-----------------|
| ARRI Signature Prime | Spherical | Clean, minimal distortion |
| Zeiss Master Prime | Spherical | Clinical sharpness |
| Cooke Anamorphic | Anamorphic 2x | Classic flares |
| Panavision Primo | Spherical | Smooth falloff |
| Atlas Orion | Anamorphic 1.33x | Modern anamorphic |

#### Complete Camera Parameters

```
cameraBody: ARRI ALEXA 35
lens: ARRI Signature Prime 50mm
aperture: 2.8
focalLength: 50
focusDistance: 2.5
shutterAngle: 180
iso: 800
exposureCompensation: 0
```

#### Depth of Field Calculation

```
dofEnabled: true
circleOfConfusion: 0.03   # Based on sensor
hyperfocalDistance: auto  # Calculated
nearFocus: calculated
farFocus: calculated
```

---

### Part 4: Integration Workflow (26:00 - 32:00)

#### Complete Integration Pipeline

```
[Footage] → [Camera3DTracking] → [TrackedCamera] ─────────────────────┐
                              → [PointCloud] → [GroundPlane Detection] │
                                                                       ↓
[CG Objects] → [Scene] ←──────────────────────────────────────────[Camera]
                  ↓
          [Renderer3D]
                  ↓
          [Merge: over]  ←── [Footage]
                  ↓
          [ColorMatch]
                  ↓
          [Output]
```

#### Scene Setup Steps

**Step 1: Ground Plane**
```
[PointCloud] → [GroundPlaneDetection]
  autoDetect: true
  planeDistance: 0.1
```

**Step 2: Scale and Orient**
```
sceneScale: real-world measurement
upAxis: Y
originPoint: measured point
```

**Step 3: Shadow Catcher**
```
[Plane] → [Material: shadowCatcher]
  receiveShadows: true
  visible: false
```

#### Color Matching CG to Plate

```
[CG Render] → [ColorMatch] → [Matched CG]
[Footage Sample] ────┘

[Matched CG] → [Merge] → [Final]
[Footage] ───────┘
```

---

### Part 5: Export Options (32:00 - 35:00)

#### Export Formats

| Format | Use |
|--------|-----|
| FBX | Maya, 3ds Max, Cinema 4D |
| Alembic | Universal, animation |
| Maya | .ma scene file |
| Nuke | .nk camera node |

#### Export Parameters

```
exportFormat: FBX
includeCamera: true
includePointCloud: true
includeGroundPlane: true
frameRange: all
scale: 1.0
upAxis: Y
```

#### Import in Other Software

**Maya:**
1. File → Import
2. Select FBX file
3. Camera and locators imported

**Nuke:**
1. Camera node
2. Read .nk file
3. Linked to footage

---

### Part 6: Troubleshooting (35:00 - 36:00)

#### Common Issues

**Problem: Solve won't converge**
- Add more features
- Check for motion blur frames
- Ensure enough parallax
- Try different detector

**Problem: Scale is wrong**
- Measure known object
- Adjust scene scale
- Use reference markers

**Problem: CG doesn't match plate**
- Check lens distortion
- Verify focal length
- Match motion blur
- Check ground plane

**Problem: Tracking drift**
- Add more features in problem area
- Manually refine tracks
- Try bidirectional tracking

---

### Summary

**What You Learned:**
- ✅ 3D camera tracking concepts
- ✅ Camera3DTrackingNode workflow
- ✅ Real-world camera specifications
- ✅ Complete integration pipeline
- ✅ Export to other applications
- ✅ Troubleshooting techniques

**Practice Project:**
1. Shoot footage with parallax
2. Track the camera
3. Place CG object on ground
4. Match lighting and color
5. Final composite

**Next Tutorial:**
[Episode 18: Fluid Dynamics](18-fluid-dynamics.md)

---

## 📊 Feature Detector Comparison

| Detector | Speed | Accuracy | Features |
|----------|-------|----------|----------|
| SIFT | 1x | ★★★★★ | 500-2000 |
| ORB | 5x | ★★★☆☆ | 1000-5000 |
| AKAZE | 2x | ★★★★☆ | 500-3000 |
| Harris | 4x | ★★★☆☆ | 2000-10000 |

---

## 📷 Camera Quick Reference

### Cinema Sensors

| Camera | Sensor Size | Resolution |
|--------|-------------|------------|
| ARRI ALEXA 35 | 27.99×19.22mm | 4608×3164 |
| RED V-RAPTOR | 40.96×21.6mm | 8192×4320 |
| Sony VENICE 2 | 36×24mm | 8640×5760 |

---

*Continue to [Episode 18: Fluid Dynamics](18-fluid-dynamics.md)!*
