# Video Files Information

## About .mov Video Files

The actual tutorial video files (.mov format) are large binary files (100-300MB each) and are **not stored in the Git repository** for the following reasons:

1. **File Size** - Git is optimized for text files, not large binary files
2. **Version Control** - Video files don't benefit from line-by-line diff tracking
3. **Repository Size** - 20 videos would add 2-6 GB to the repository
4. **Bandwidth** - Would slow down cloning and pulling for all users

## Where to Get Video Files

Once produced, video files will be available through:

### Option 1: GitHub Releases
Download complete video packs from the [Releases page](https://github.com/mllinman/RageVFX/releases):
- `ragevfx-tutorials-beginner.zip` (Episodes 1-5)
- `ragevfx-tutorials-intermediate.zip` (Episodes 6-12)
- `ragevfx-tutorials-advanced.zip` (Episodes 13-20)
- `ragevfx-tutorials-complete.zip` (All episodes)

### Option 2: Direct Download
Individual video files available at:
```
[URLs will be provided when videos are published]
Example: https://downloads.ragevfx.com/tutorials/videos/01-getting-started.mov
```

### Option 3: Streaming
Watch online without downloading:
- **YouTube**: [RageVFX Channel - URL TBD]
- **Vimeo**: [RageVFX Tutorials - URL TBD]

### Option 4: Torrent
For the complete series (fastest for large downloads):
```
[Magnet link will be provided when videos are published]
```

## Video File Naming

When you download video files, place them in this directory with these exact names:

```
videos/
├── 01-getting-started.mov
├── 02-interface-deep-dive.mov
├── 03-node-basics.mov
├── 04-first-vfx-effect.mov
├── 05-saving-and-exporting.mov
├── 06-compositing-essentials.mov
├── 07-color-grading-masterclass.mov
├── 08-green-screen-keying.mov
├── 09-tracking-and-stabilization.mov
├── 10-procedural-effects.mov
├── 11-3d-pipeline-basics.mov
├── 12-animation-timeline.mov
├── 13-physics-simulation.mov
├── 14-machine-learning-tools.mov
├── 15-motion-graphics.mov
├── 16-advanced-3d-rendering.mov
├── 17-camera-tracking-integration.mov
├── 18-fluid-dynamics.mov
├── 19-pipeline-collaboration.mov
├── 20-professional-workflows.mov
└── 21-stereoscopic-conversion.mov
```

## Video Specifications

All video files adhere to these specifications:

```
Format:        QuickTime Movie (.mov)
Codec:         H.264 (High Profile)
Resolution:    1920x1080 (1080p) or 2560x1440 (1440p)
Aspect Ratio:  16:9
Frame Rate:    30 fps or 60 fps
Bitrate:       8-15 Mbps (variable)
Audio Codec:   AAC
Audio Rate:    48 kHz
Audio Bitrate: 192 kbps
Channels:      Stereo (2 channels)
Duration:      12-45 minutes per episode
File Size:     100-360 MB per episode
```

## Verification

To verify downloaded videos, check the provided checksums:

### SHA256 Checksums (Example)
```
# Will be provided when videos are published
01-getting-started.mov: sha256sum...
02-interface-deep-dive.mov: sha256sum...
...
```

Verify with:
```bash
# macOS/Linux
shasum -a 256 01-getting-started.mov

# Windows PowerShell
Get-FileHash 01-getting-started.mov -Algorithm SHA256
```

## Playing Video Files

### Recommended Players

**macOS:**
- QuickTime Player (built-in)
- VLC Media Player
- IINA

**Windows:**
- VLC Media Player
- Windows Media Player (with codecs)
- PotPlayer

**Linux:**
- VLC Media Player
- mpv
- Totem

### VLC Media Player (All Platforms)
Download from: https://www.videolan.org/

Supports all .mov files and provides excellent playback controls.

## For Contributors

If you're creating video content:

1. Follow the [Video Production Guide](../VIDEO_PRODUCTION_GUIDE.md)
2. Use the specifications listed above
3. Generate checksums for your videos
4. Upload to the designated hosting platform
5. Update this document with download links
6. Submit a pull request with updated documentation (NOT the video files)

## Local Development

If you have video files locally for testing:

1. Place them in this `videos/` directory
2. Add `*.mov` to `.gitignore` (already done)
3. Reference them in your local documentation
4. **Never** commit .mov files to Git

## Future Plans

- [ ] Publish videos to YouTube/Vimeo
- [ ] Create GitHub Releases with video packs
- [ ] Set up CDN for direct downloads
- [ ] Create BitTorrent seed for complete series
- [ ] Add subtitle files (.srt) for each video
- [ ] Create thumbnail images for each episode
- [ ] Generate video previews/trailers

---

**Status:** Videos are in production  
**Expected Release:** Q1-Q2 2026  
**Current Phase:** Pre-production complete, recording begins soon

*For updates on video availability, watch the GitHub repository or check ragevfx.com/tutorials*
