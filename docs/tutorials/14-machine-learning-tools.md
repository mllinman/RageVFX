# Episode 14: Machine Learning Tools

**Duration**: 35 minutes  
**Level**: Advanced  
**Prerequisites**: Episodes 1-13

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 2:00)

> Machine learning has revolutionized visual effects, enabling capabilities that were impossible just a few years ago. RageVFX integrates powerful ML tools for style transfer, upscaling, object detection, and more.
>
> In this tutorial, we'll explore each ML-powered tool and learn how to integrate AI into your VFX workflow.

**Key Learning Objectives:**
- Understand ML in VFX context
- Use style transfer creatively
- Upscale footage with AI
- Segment and detect objects
- Train custom models

---

### Part 1: ML in VFX (2:00 - 6:00)

#### What ML Can Do

| Task | Traditional VFX | ML Approach |
|------|-----------------|-------------|
| Rotoscoping | Manual frame-by-frame | Auto-segmentation |
| Upscaling | Bicubic interpolation | Neural upscaling |
| Denoising | Basic filters | AI noise removal |
| Style | Manual painting | Style transfer |
| Keying | Per-shot tuning | One-click removal |

#### RageVFX ML Nodes

1. **Style Transfer** - Apply artistic styles
2. **Upscale** - Increase resolution
3. **Denoise** - Remove noise
4. **Object Detection** - Find objects
5. **Inpaint** - Fill holes
6. **Depth Estimation** - Create depth maps
7. **Segment Anything** - Instant masks
8. **Background Removal** - One-click key
9. **Face Enhancement** - Restore faces
10. **Motion Prediction** - Frame interpolation
11. **Neural Net Trainer** - Train custom models

---

### Part 2: Style Transfer (6:00 - 12:00)

#### StyleTransferNode

Apply artistic styles from reference images.

```
[Content Image] → [StyleTransfer] → [Stylized Output]
[Style Image] ────┘
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| styleStrength | How much style (0-1) |
| preserveColor | Keep original colors |
| mode | histogram/luminance |
| detailLevel | Edge preservation |

#### Style Transfer Modes

| Mode | Effect |
|------|--------|
| **histogram** | Transfer color distribution |
| **luminance** | Transfer brightness patterns |
| **neural** | Full neural style (future) |

#### Creative Applications

1. **Film looks**: Apply cinematic styles
2. **Period pieces**: Match historical art
3. **Animation**: Apply painting styles
4. **Transitions**: Morph between styles

#### Best Practices

- Use high-quality style references
- Adjust styleStrength for subtlety
- Enable preserveColor for realistic looks
- Stack multiple passes for complexity

---

### Part 3: AI Upscaling (12:00 - 17:00)

#### UpscaleNode

Intelligent resolution increase.

```
[Low-Res Image] → [Upscale] → [High-Res Output]
```

#### Parameters

| Parameter | Options | Purpose |
|-----------|---------|---------|
| scale | 2x, 4x, 8x | Magnification |
| model | fast, quality | Speed vs quality |
| denoise | 0-1 | Noise reduction |
| sharpen | 0-1 | Detail enhancement |

#### When to Use

| Source | Scale | Notes |
|--------|-------|-------|
| SD footage | 4x | To HD/4K |
| HD footage | 2x | To 4K |
| Old archives | 4-8x | Restoration |
| Game capture | 2-4x | Enhancement |

#### Quality Tips

1. **Clean input** - Denoise before upscaling
2. **Right scale** - Don't over-upscale
3. **Sharpen after** - Add detail post-upscale
4. **Test first** - Check small area

---

### Part 4: Object Detection & Segmentation (17:00 - 23:00)

#### ObjectDetectionNode

Find and segment objects in images.

```
[Source] → [ObjectDetection] → [Detected Objects]
                             → [Masks Output]
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| confidence | Detection threshold (0-1) |
| classes | Object types to find |
| nmsThreshold | Overlap handling |
| outputType | boxes/masks/both |

#### SegmentAnythingNode

Interactive instance segmentation.

```
[Source] → [SegmentAnything] → [Selected Mask]
[Points/Box Input] ─────────┘
```

#### Prompting Methods

| Method | Description |
|--------|-------------|
| **Point** | Click on object to select |
| **Box** | Draw box around object |
| **Auto** | Segment everything |

#### Use Cases

1. **Automatic rotoscoping** - Select subjects
2. **Object isolation** - Extract specific items
3. **Matte generation** - Create alpha channels
4. **Crowd shots** - Individual agent masks

---

### Part 5: Background Removal (23:00 - 27:00)

#### BackgroundRemovalNode

One-click background removal.

```
[Source with BG] → [BackgroundRemoval] → [Subject Only]
```

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| model | rembg/u2net/modnet/isnet |
| edgeRefinement | Edge quality |
| defringe | Remove color fringing |
| outputAlpha | Include alpha channel |

#### Model Comparison

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| rembg | Fast | Good | General |
| u2net | Medium | Better | Portraits |
| modnet | Fast | Good | Video |
| isnet | Slow | Best | Complex edges |

#### Workflow Integration

```
[Source] → [BackgroundRemoval] → [EdgeMatte] → [Merge] → [Output]
                                                  ↑
[New Background] ─────────────────────────────────┘
```

---

### Part 6: Face Enhancement (27:00 - 31:00)

#### FaceEnhancementNode

AI-powered face restoration and enhancement.

```
[Face Footage] → [FaceEnhancement] → [Enhanced Faces]
```

#### Capabilities

| Feature | Description |
|---------|-------------|
| Super resolution | Increase face detail |
| Skin retouching | Smooth, remove blemishes |
| Eye enhancement | Brighten, sharpen |
| Teeth enhancement | Whiten, clean |
| Age modification | Younger/older |
| Expression transfer | Change expression |
| Makeup | Apply virtual makeup |

#### Parameters

| Parameter | Purpose |
|-----------|---------|
| faceDetection | Auto-find faces |
| superResolution | Increase detail |
| skinSmoothing | Smoothness level |
| eyeBrightening | Eye enhancement |
| ageOffset | Years younger/older |

---

### Part 7: Training Custom Models (31:00 - 35:00)

#### NeuralNetTrainerNode

Train your own neural networks (CopyCat-style).

```
[Training Data] → [NeuralNetTrainer] → [Trained Model]
```

#### Architectures

| Architecture | Use Case |
|--------------|----------|
| **UNet** | Image segmentation |
| **ResNet** | Classification, style |
| **Autoencoder** | Compression, generation |
| **GAN** | Generation, enhancement |

#### Training Parameters

| Parameter | Purpose |
|-----------|---------|
| epochs | Training iterations |
| batchSize | Samples per batch |
| learningRate | Training speed |
| augmentation | Data augmentation |
| validation | Validation split |

#### Training Workflow

1. **Prepare data** - Input/output pairs
2. **Configure architecture** - Choose network
3. **Set augmentation** - Flip, rotate, crop, color
4. **Train** - Monitor loss graphs
5. **Validate** - Check on test data
6. **Export** - ONNX, TensorFlow, PyTorch

#### Data Augmentation Options

| Augmentation | Effect |
|--------------|--------|
| flip | Mirror images |
| rotate | Random rotation |
| crop | Random cropping |
| colorJitter | Color variation |
| noise | Add noise |

---

### Summary

**What You Learned:**
- ✅ ML capabilities in VFX
- ✅ Style transfer techniques
- ✅ AI upscaling
- ✅ Object detection and segmentation
- ✅ Background removal
- ✅ Face enhancement
- ✅ Training custom models

**Practice Project:**
1. Style transfer a video clip
2. Upscale SD footage to HD
3. Auto-segment main subject
4. Remove background
5. Enhance faces
6. Composite result

**Next Tutorial:**
[Episode 15: Motion Graphics](15-motion-graphics.md)

---

## 🤖 ML Node Quick Reference

| Task | Node | Speed |
|------|------|-------|
| Artistic style | StyleTransfer | Medium |
| Resolution boost | Upscale | Fast |
| Noise removal | Denoise | Fast |
| Find objects | ObjectDetection | Fast |
| Fill holes | Inpaint | Medium |
| Depth map | DepthEstimation | Fast |
| Quick mask | SegmentAnything | Fast |
| Remove BG | BackgroundRemoval | Fast |
| Face fix | FaceEnhancement | Medium |
| Slow motion | MotionPrediction | Slow |
| Custom | NeuralNetTrainer | Hours |

---

*Continue to [Episode 15: Motion Graphics](15-motion-graphics.md)!*
