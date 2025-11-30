# Episode 19: Pipeline & Collaboration

**Duration**: 32 minutes  
**Level**: Advanced  
**Prerequisites**: Episodes 1-18

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 2:00)

> Professional VFX production is a collaborative effort involving many artists and tools. RageVFX includes comprehensive pipeline integration with USD, Alembic, version control, and review tools.
>
> In this tutorial, we'll learn how to integrate RageVFX into a professional production pipeline.

**Key Learning Objectives:**
- Work with USD (Universal Scene Description)
- Use Alembic for geometry caching
- Implement version control
- Conduct collaborative reviews
- Manage shots and assets

---

### Part 1: USD Workflow (2:00 - 10:00)

#### What is USD?

Universal Scene Description:
- Industry-standard scene format
- Pixar-developed, open source
- Supports composition and layering
- Used in major studios

#### USDNode

Import and export USD files.

```
[Scene] → [USD: export] → File
[USD: import] → [Scene]
```

#### USD Formats

| Format | Extension | Use |
|--------|-----------|-----|
| usda | .usda | ASCII, readable |
| usdc | .usdc | Binary, compact |
| usdz | .usdz | Package with assets |

#### Import Parameters

```
filepath: /path/to/scene.usd
operation: import
importGeometry: true
importMaterials: true
importLights: true
importCameras: true
timeCode: current
```

#### Export Parameters

```
filepath: /path/to/output.usd
format: usdc
exportMaterials: true
embedTextures: false
defaultPrim: World
```

#### USD Composition

Layer multiple USD files:

```
[Base Layer] ← assembly.usd
[Animation Layer] ← anim_v003.usd
[Lighting Layer] ← lighting_v002.usd
[Render Settings] ← render.usd
```

#### Variant Sets

Switch between variations:

```
variantSets:
  - model: [lowRes, midRes, highRes]
  - material: [preview, final]
  
activeVariant:
  model: highRes
  material: final
```

---

### Part 2: Alembic Caching (10:00 - 16:00)

#### What is Alembic?

Geometry interchange format:
- Baked animation data
- Efficient streaming
- Industry standard
- LFS-friendly

#### AlembicNode

```
[Animated Scene] → [Alembic: export] → .abc file
[Alembic: import] → [Cached Scene]
```

#### Alembic Formats

| Format | Description |
|--------|-------------|
| Ogawa | Modern, faster |
| HDF5 | Legacy, compatible |

#### Export Parameters

```
filepath: /cache/shot_010.abc
format: Ogawa
frameRange: [1, 100]
subframes: 1
exportMesh: true
exportCurves: true
exportPoints: true
exportCamera: true
worldSpace: true
```

#### Streaming Mode

For large caches:

```
streaming: true
cacheSize: 100  # Frames in memory
preload: 10     # Frames ahead
```

#### Use Cases

| Use | Benefit |
|-----|---------|
| Simulation cache | Consistent playback |
| Animation export | Share with other departments |
| Reference assets | Lightweight scene reference |
| Archive | Final delivery |

---

### Part 3: Version Control (16:00 - 22:00)

#### VersionControlNode

Git-based project versioning.

```
[Project] → [VersionControl] → Repository
```

#### Basic Operations

| Operation | Purpose |
|-----------|---------|
| init | Create repository |
| commit | Save changes |
| push | Upload to remote |
| pull | Download updates |
| branch | Create branch |
| merge | Combine branches |

#### Commit Workflow

```
1. Make changes to project
2. Stage files for commit
3. Write descriptive message
4. Commit changes
5. Push to remote
```

#### Branch Strategy

| Branch | Use |
|--------|-----|
| main | Approved work |
| develop | Work in progress |
| feature/* | New features |
| shot/* | Per-shot work |
| artist/* | Per-artist work |

#### LFS (Large File Storage)

For large VFX files:

```
lfsEnabled: true
lfsPatterns:
  - "*.exr"
  - "*.abc"
  - "*.usd"
  - "*.mov"
```

---

### Part 4: Pipeline Manager (22:00 - 26:00)

#### PipelineManagerNode

Shot and asset management.

#### Shot Management

```
shots:
  - shot: SH010
    status: in_progress
    artist: john
    version: 3
    notes: "Final comp pending approval"
    
  - shot: SH020
    status: approved
    artist: jane
    version: 5
```

#### Asset Tracking

```
assets:
  - name: hero_car
    type: model
    version: 12
    status: published
    path: /assets/vehicles/hero_car_v012.usd
```

#### Path Templates

Define file paths programmatically:

```
templates:
  work: "{project}/work/{department}/{shot}/{task}/{shot}_{task}_v{version}.{ext}"
  publish: "{project}/publish/{department}/{shot}/{shot}_{task}_v{version}.{ext}"
  cache: "{project}/cache/{shot}/{shot}_{cache}_v{version}.{ext}"
```

#### Integration Ready

| Platform | Status |
|----------|--------|
| ShotGrid | Ready |
| ftrack | Ready |
| Kitsu | Ready |
| Custom | API available |

---

### Part 5: Review Tools (26:00 - 30:00)

#### ReviewToolNode

Collaborative review and annotation.

```
[Render] → [ReviewTool] → [Feedback]
```

#### Annotation Tools

| Tool | Use |
|------|-----|
| Brush | Freehand notes |
| Line | Straight lines |
| Arrow | Point to issues |
| Rectangle | Highlight area |
| Text | Written notes |
| Timestamp | Frame reference |

#### Version Comparison

| Mode | Description |
|------|-------------|
| A/B | Side by side |
| Wipe | Sliding divider |
| Onion skin | Transparent overlay |
| Difference | Pixel difference |

#### Review Workflow

1. **Submit** - Artist submits version
2. **Review** - Supervisor reviews
3. **Annotate** - Add notes and marks
4. **Comment** - Written feedback
5. **Status** - Approve/Request Changes
6. **Notify** - Artist notified

#### Approval Workflow

```
approvalRequired: true
approvers:
  - supervisor
  - director
  
status: [pending, approved, changes_requested]
```

#### Export Annotations

| Format | Use |
|--------|-----|
| JSON | Machine readable |
| PDF | Print/share |
| HTML | Web viewing |
| Video | Burn-in overlay |

---

### Part 6: Best Practices (30:00 - 32:00)

#### File Organization

```
/project
  /assets
    /characters
    /environments
    /props
  /shots
    /SEQ01
      /SH010
      /SH020
  /cache
  /publish
  /review
```

#### Naming Conventions

```
{project}_{sequence}_{shot}_{task}_v{version}.{ext}

Example: HERO_SEQ01_SH010_comp_v003.exr
```

#### Communication

1. **Clear notes** on every version
2. **Reference frames** in comments
3. **Tag relevant people**
4. **Use consistent terminology**

---

### Summary

**What You Learned:**
- ✅ USD import/export and composition
- ✅ Alembic caching workflows
- ✅ Version control with Git/LFS
- ✅ Pipeline management
- ✅ Review and annotation tools
- ✅ Best practices

**Practice Project:**
Set up a mini-pipeline:
1. Create shot folder structure
2. Export scene as USD
3. Cache animation as Alembic
4. Set up version control
5. Submit for review
6. Process feedback

**Next Tutorial:**
[Episode 20: Professional Workflows](20-professional-workflows.md)

---

## 📊 Pipeline Quick Reference

### File Formats

| Format | Use |
|--------|-----|
| .json | Project files |
| .usd | Scene interchange |
| .abc | Animation cache |
| .exr | HDR images |
| .mov | Video review |

### Shot Status

| Status | Meaning |
|--------|---------|
| not_started | Awaiting work |
| in_progress | Being worked on |
| pending_review | Submitted |
| changes_requested | Needs revision |
| approved | Complete |

---

*Continue to [Episode 20: Professional Workflows](20-professional-workflows.md)!*
