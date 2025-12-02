# RageVFX Video Tutorials

This directory contains video tutorial files (.mov format) for RageVFX.

## Directory Structure

```
videos/
├── README.md                          # This file
├── video-scripts.md                   # Detailed recording scripts
├── metadata/                          # Video metadata JSON files
│   ├── 01-getting-started.json
│   ├── 02-interface-deep-dive.json
│   └── ...
└── [Video files to be added here]
    ├── 01-getting-started.mov
    ├── 02-interface-deep-dive.mov
    └── ...
```

## Video Specifications

- **Format**: QuickTime Movie (.mov)
- **Resolution**: 1920x1080 (1080p) or 2560x1440 (1440p)
- **Frame Rate**: 30fps or 60fps
- **Codec**: H.264 or ProRes 422
- **Audio**: AAC 48kHz Stereo 192kbps

## Available Videos

### Beginner Series (Episodes 1-5)

| Episode | Title | Duration | File | Status |
|---------|-------|----------|------|--------|
| 1 | Getting Started with RageVFX | 15 min | `01-getting-started.mov` | 📋 Planned |
| 2 | Interface Deep Dive | 20 min | `02-interface-deep-dive.mov` | 📋 Planned |
| 3 | Understanding Nodes | 18 min | `03-node-basics.mov` | 📋 Planned |
| 4 | Your First VFX Effect | 25 min | `04-first-vfx-effect.mov` | 📋 Planned |
| 5 | Saving & Exporting | 12 min | `05-saving-and-exporting.mov` | 📋 Planned |

### Intermediate Series (Episodes 6-12)

| Episode | Title | Duration | File | Status |
|---------|-------|----------|------|--------|
| 6 | Compositing Essentials | 30 min | `06-compositing-essentials.mov` | 📋 Planned |
| 7 | Color Grading Masterclass | 35 min | `07-color-grading-masterclass.mov` | 📋 Planned |
| 8 | Green Screen Keying | 28 min | `08-green-screen-keying.mov` | 📋 Planned |
| 9 | Tracking & Stabilization | 25 min | `09-tracking-and-stabilization.mov` | 📋 Planned |
| 10 | Procedural VFX Effects | 32 min | `10-procedural-effects.mov` | 📋 Planned |
| 11 | 3D Pipeline Basics | 35 min | `11-3d-pipeline-basics.mov` | 📋 Planned |
| 12 | Animation & Timeline | 28 min | `12-animation-timeline.mov` | 📋 Planned |

### Advanced Series (Episodes 13-20)

| Episode | Title | Duration | File | Status |
|---------|-------|----------|------|--------|
| 13 | Physics Simulation | 40 min | `13-physics-simulation.mov` | 📋 Planned |
| 14 | Machine Learning Tools | 35 min | `14-machine-learning-tools.mov` | 📋 Planned |
| 15 | Motion Graphics | 38 min | `15-motion-graphics.mov` | 📋 Planned |
| 16 | Advanced 3D Rendering | 42 min | `16-advanced-3d-rendering.mov` | 📋 Planned |
| 17 | Camera Tracking & Integration | 36 min | `17-camera-tracking-integration.mov` | 📋 Planned |
| 18 | Fluid Dynamics | 40 min | `18-fluid-dynamics.mov` | 📋 Planned |
| 19 | Pipeline & Collaboration | 32 min | `19-pipeline-collaboration.mov` | 📋 Planned |
| 20 | Professional Workflows | 45 min | `20-professional-workflows.mov` | 📋 Planned |

**Status Legend:**
- 📋 Planned - Script ready, awaiting recording
- 🎬 Recording - Currently being recorded
- ✂️ Editing - In post-production
- ✅ Complete - Finished and ready
- 🔄 Revision - Needs updates

## Viewing Videos

### Online Viewing
Once published, videos will be available on:
- YouTube: [RageVFX Channel](https://youtube.com/@ragevfx)
- Vimeo: [RageVFX](https://vimeo.com/ragevfx)

### Local Viewing
If you have the video files locally:
1. Download the `.mov` file
2. Open with QuickTime Player (macOS) or VLC Media Player (all platforms)
3. Follow along with the corresponding written tutorial

## Video Metadata

Each video has an associated metadata file in `metadata/` containing:
- Episode number and title
- Duration and file size
- Topics covered
- Nodes demonstrated
- Keyboard shortcuts used
- Prerequisites
- Related tutorials
- Timestamps for major sections

## Contributing Videos

If you'd like to contribute video content:

1. Read the [Video Production Guide](../VIDEO_PRODUCTION_GUIDE.md)
2. Follow the technical specifications
3. Use the scripts in `video-scripts.md` as a guide
4. Submit via pull request with:
   - Video file (.mov)
   - Metadata JSON file
   - Any supporting assets

## Download Links

**Note:** Video files are large (100-300MB each) and are not stored in the git repository.

**Download Options:**
1. **GitHub Releases**: Check the [Releases page](https://github.com/mllinman/RageVFX/releases) for bundled video packs
2. **Direct Download**: Individual videos available at [ragevfx.com/tutorials](https://ragevfx.com/tutorials)
3. **Torrent**: Complete tutorial series available via BitTorrent (magnet link TBD)

## File Sizes (Approximate)

| Duration | 1080p Size | 1440p Size |
|----------|------------|------------|
| 15 min | 120 MB | 180 MB |
| 20 min | 160 MB | 240 MB |
| 25 min | 200 MB | 300 MB |
| 30 min | 240 MB | 360 MB |
| 35 min | 280 MB | 420 MB |
| 40 min | 320 MB | 480 MB |
| 45 min | 360 MB | 540 MB |

**Total series size**: ~5.5 GB (1080p) / ~8.2 GB (1440p)

## Subtitles & Captions

Subtitles will be provided in:
- English (default)
- Spanish
- French
- German
- Japanese
- Chinese (Simplified)

Subtitle files (.srt) will be available in the `subtitles/` subdirectory.

## Keyboard Shortcut Reference

A comprehensive keyboard shortcut overlay is available as:
- `keyboard-shortcuts-overlay.png` - Static reference image
- `keyboard-shortcuts-interactive.html` - Interactive web reference

## FAQ

**Q: Why aren't the video files in the repository?**
A: Video files are large binary files that don't work well with git version control. They're distributed via releases and direct download.

**Q: Can I download just one video?**
A: Yes, individual videos can be downloaded from the releases page or direct download links.

**Q: What if I find an error in a video?**
A: Please open an issue on GitHub with the episode number and timestamp. We'll create an errata document and update the video in the next revision.

**Q: Can I use these videos in my own training?**
A: Videos are licensed under Creative Commons BY-NC-SA. You can use them for non-commercial purposes with attribution.

**Q: Will there be more videos in the future?**
A: Yes! We plan to add advanced topic videos, mini-tutorials, and project breakdowns. Subscribe to the YouTube channel for updates.

---

*For questions about videos, contact tutorials@ragevfx.com*
