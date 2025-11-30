# Episode 5: Saving & Exporting

**Duration**: 12 minutes  
**Level**: Beginner  
**Prerequisites**: Episodes 1-4

---

## 🎬 Video Script & Tutorial Guide

### Introduction (0:00 - 0:45)

> You've created amazing VFX—now it's time to share them with the world! In this tutorial, we'll cover everything about saving your projects and exporting your final renders in various formats.
>
> Whether you need image sequences for film, video files for web, or camera-native formats for professional workflows, RageVFX has you covered.

**Key Learning Objectives:**
- Save and organize projects
- Export single images
- Render image sequences
- Create video outputs
- Understand format options

---

### Part 1: Saving Projects (0:45 - 3:00)

#### Project File Format

RageVFX saves projects as JSON files (`.json`), which contain:
- All nodes and their positions
- Every parameter setting
- All connections
- Layout information (backdrops, etc.)

**Benefits of JSON format:**
- Human-readable (can open in text editor)
- Version control friendly (Git)
- Small file size
- Cross-platform compatible

#### Save Commands

| Action | Shortcut | Menu |
|--------|----------|------|
| Save | Ctrl/Cmd+S | File → Save |
| Save As | Ctrl/Cmd+Shift+S | File → Save As |

#### Best Practices for Saving

1. **Save Early, Save Often**
   - Save immediately after creating a new project
   - Save after major changes
   - Consider auto-save (Settings → General)

2. **Project Naming Convention**
   ```
   ProjectName_v001.json
   ProjectName_v002.json
   ```

3. **Folder Organization**
   ```
   /Projects
     /MyProject
       /source          ← Input images/video
       /renders         ← Output renders
       /project_files   ← RageVFX projects
   ```

---

### Part 2: Basic Image Export (3:00 - 5:30)

#### Using the Output Node

The **Output** node handles basic image export.

1. Add **Output** node (if not already present)
2. Connect your final result to Output
3. Execute the graph

#### Output Node Parameters

| Parameter | Options | Purpose |
|-----------|---------|---------|
| format | png, jpeg, exr, tiff | File format |
| quality | 0-100 | Compression level |
| bitDepth | 8, 16, 32 | Bits per channel |

#### Format Recommendations

| Use Case | Format | Bit Depth | Quality |
|----------|--------|-----------|---------|
| Web/social | JPEG | 8 | 85-95 |
| Transparency | PNG | 8/16 | 100 |
| Film/VFX | EXR | 16/32 | - |
| Print | TIFF | 16 | 100 |

#### Setting Export Location

1. Select Output node
2. Set filepath parameter
3. Execute to render

---

### Part 3: Image Sequence Export (5:30 - 8:00)

For animation and video work, you'll export frame sequences.

#### Using ImageSequenceOutputNode

1. Add **Image Sequence Output** from Input/Output category
2. Connect your animated result
3. Configure parameters

#### Parameters

| Parameter | Example | Purpose |
|-----------|---------|---------|
| basePath | /renders/shot_001 | Output folder |
| baseName | frame | Filename prefix |
| startFrame | 1 | First frame number |
| endFrame | 100 | Last frame number |
| padding | 4 | Digit padding (0001) |
| format | png | File format |
| bitDepth | 16 | Bits per channel |

#### Output Filename Pattern

With settings above, files will be named:
```
/renders/shot_001/frame.0001.png
/renders/shot_001/frame.0002.png
/renders/shot_001/frame.0003.png
...
```

#### Format Options for Sequences

| Format | Extension | Best For |
|--------|-----------|----------|
| PNG | .png | General use, alpha |
| TIFF | .tif | Print, archival |
| EXR | .exr | VFX, HDR, compositing |
| DPX | .dpx | Film scanning/output |
| JPEG | .jpg | Preview only |

---

### Part 4: Video Export (8:00 - 10:30)

#### Using VideoSequenceOutputNode

1. Add **Video Sequence Output** from Input/Output
2. Connect animated output
3. Configure video settings

#### Video Parameters

| Parameter | Options | Purpose |
|-----------|---------|---------|
| container | mp4, mov, mxf, avi, webm | File container |
| codec | h264, h265, prores, dnxhd, vp9 | Video codec |
| width/height | 1920×1080, etc. | Resolution |
| frameRate | 24, 25, 30, 60 | FPS |
| quality | crf or bitrate | Compression |

#### Codec Recommendations

| Codec | Container | Use Case |
|-------|-----------|----------|
| **H.264** | MP4 | Web, streaming |
| **H.265** | MP4 | 4K, efficient |
| **ProRes 422** | MOV | Editing, broadcast |
| **ProRes 4444** | MOV | VFX, alpha |
| **DNxHD** | MXF | Broadcast |
| **VP9** | WebM | Web, high quality |

#### ProRes Variants

| Variant | Bitrate | Use |
|---------|---------|-----|
| ProRes 422 Proxy | Low | Offline editing |
| ProRes 422 LT | Medium | Editing |
| ProRes 422 | Standard | Broadcast |
| ProRes 422 HQ | High | Master |
| ProRes 4444 | Very High | VFX, alpha |
| ProRes 4444 XQ | Maximum | Archival |

---

### Part 5: Camera-Native Formats (10:30 - 11:30)

For high-end workflows, RageVFX supports camera-native export.

#### Using CameraFormatOutputNode

Exports in formats that match original camera footage:

| Format | Extension | Color Space |
|--------|-----------|-------------|
| ARRI RAW | .ari | LogC4, ARRI Wide Gamut |
| RED R3D | .r3d | Log3G10, REDWideGamutRGB |
| Blackmagic RAW | .braw | BMD Film Gen5 |
| Sony RAW | .raw | S-Log3, S-Gamut3 |

#### Metadata Options

- Reel name
- Clip name
- Take number
- Camera info
- Timecode

---

### Part 6: Export Workflow Tips (11:30 - 12:00)

#### Pre-Export Checklist

- [ ] All nodes connected
- [ ] Parameters finalized
- [ ] Frame range set correctly
- [ ] Output path exists
- [ ] Sufficient disk space
- [ ] Quality settings appropriate

#### Batch Export

Export multiple formats at once:
1. Create multiple Output/Sequence nodes
2. Connect each to same source
3. Configure different settings
4. Execute graph

#### Background Rendering

For long renders:
- Lower preview quality during work
- Set to production quality for final
- Consider render farm for very long jobs

---

### Summary

**What You Learned:**
- ✅ Save projects as JSON files
- ✅ Export single images (PNG, JPEG, EXR, TIFF)
- ✅ Render image sequences
- ✅ Create video files (H.264, ProRes, DNxHD)
- ✅ Use camera-native formats
- ✅ Best practices for organization

**Export Quick Reference:**

| Output Type | Node | Format |
|-------------|------|--------|
| Single image | Output | PNG/EXR |
| Image sequence | ImageSequenceOutput | EXR/PNG |
| Video file | VideoSequenceOutput | MP4/MOV |
| Camera native | CameraFormatOutput | RAW |

**Next Tutorial:**
In [Episode 6: Compositing Essentials](06-compositing-essentials.md), we dive into professional compositing techniques!

---

## 📁 Export Cheat Sheet

### Web Delivery
```
Format: MP4
Codec: H.264
Resolution: 1920×1080
Frame Rate: 30fps
Quality: CRF 18-23
```

### Broadcast Delivery
```
Format: MOV
Codec: ProRes 422 HQ
Resolution: 1920×1080
Frame Rate: 23.976/25fps
Color: Rec.709
```

### VFX Delivery
```
Format: EXR Sequence
Bit Depth: 16-bit half float
Color: ACEScg or Linear
Compression: ZIP or PIZ
```

### Social Media
```
Platform      Resolution    Format
YouTube       1920×1080     MP4 H.264
Instagram     1080×1080     MP4 H.264
TikTok        1080×1920     MP4 H.264
Twitter       1280×720      MP4 H.264
```

---

*Continue to [Episode 6: Compositing Essentials](06-compositing-essentials.md)!*
