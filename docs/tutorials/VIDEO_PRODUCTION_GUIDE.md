# RageVFX Video Tutorial Production Guide

This guide provides instructions for creating professional video tutorials for RageVFX.

## 📹 Video Specifications

### Technical Requirements
- **Format**: QuickTime Movie (.mov)
- **Resolution**: 1920x1080 (1080p) minimum, 2560x1440 (1440p) recommended
- **Frame Rate**: 30fps or 60fps
- **Codec**: H.264 or ProRes 422
- **Audio**: AAC 48kHz, stereo, 192kbps minimum
- **Bitrate**: 8-10 Mbps for 1080p, 12-15 Mbps for 1440p

### File Naming Convention
```
[episode-number]-[tutorial-slug].mov

Examples:
- 01-getting-started.mov
- 02-interface-deep-dive.mov
- 15-motion-graphics.mov
```

### Video Structure
Each video should follow this structure:

1. **Introduction (5-10% of duration)**
   - Title card with episode number and name
   - Brief overview of what will be covered
   - Prerequisites reminder

2. **Concept Explanation (15-20%)**
   - Theory and background
   - Why these techniques are important
   - Real-world applications

3. **Step-by-Step Demonstration (50-60%)**
   - Clear, methodical walkthrough
   - Pause at key moments
   - Highlight important UI elements
   - Show keyboard shortcuts used

4. **Practice Exercise (10-15%)**
   - Guided hands-on activity
   - Variations to try
   - Common mistakes to avoid

5. **Summary & Next Steps (5-10%)**
   - Recap key learnings
   - Preview next tutorial
   - Additional resources

## 🎬 Recording Setup

### Screen Recording Software
Recommended tools:
- **macOS**: QuickTime Player (built-in), ScreenFlow, Final Cut Pro
- **Windows**: OBS Studio, Camtasia, Adobe Premiere Pro
- **Linux**: OBS Studio, SimpleScreenRecorder, Kdenlive

### Recording Settings
1. **Screen Resolution**: Set display to 1920x1080 or 2560x1440
2. **Frame Rate**: 30fps (smoother), 60fps (professional)
3. **Audio Input**: Use quality microphone, eliminate background noise
4. **Cursor Highlighting**: Enable cursor ring/highlight for visibility

### Screen Layout for Recording
```
┌─────────────────────────────────────────────────────────────┐
│  Top: 50px padding for title overlay                        │
├──────────────┬────────────────────────────┬─────────────────┤
│              │                            │                  │
│  Node        │  Node Graph Editor         │  Properties     │
│  Library     │  (Main focus area)         │  Panel          │
│              │                            │                  │
│              │                            ├─────────────────┤
│              │                            │  Viewport       │
│              │                            │  (Result)       │
├──────────────┴────────────────────────────┴─────────────────┤
│  Timeline (if needed for tutorial)                          │
└─────────────────────────────────────────────────────────────┘
Bottom: 50px padding for notes/shortcuts
```

## 🎙️ Audio Guidelines

### Narration Style
- **Pace**: Moderate, clear, professional
- **Tone**: Friendly but authoritative
- **Volume**: Consistent, normalized to -3dB
- **Language**: Clear technical explanations, avoid jargon when possible
- **Pauses**: Give viewers time to follow along

### Audio Recording Tips
1. Record in quiet environment
2. Use pop filter for microphone
3. Record room tone for noise reduction
4. Maintain consistent distance from mic
5. Edit out long pauses and filler words ("um", "uh")

### Background Music
- Optional subtle background music at -30dB
- Royalty-free or licensed music only
- No music during key explanations
- Fade in/out smoothly

## 🎨 Visual Elements

### Title Cards
Create title cards for:
- Opening: Episode number, title, duration
- Section transitions
- Key concepts/definitions
- Closing: Summary, next episode

### On-Screen Graphics
- **Arrows/Highlights**: Point to specific UI elements
- **Text Annotations**: Keyboard shortcuts, parameter values
- **Callout Boxes**: Important tips, warnings, notes
- **Progress Indicators**: Show current step (e.g., "Step 3 of 7")

### Color Coding
Use consistent colors for annotations:
- **Blue**: Information, general highlights
- **Green**: Success, correct actions
- **Yellow**: Tips, alternative methods
- **Red**: Warnings, common mistakes
- **Purple**: Advanced techniques

## 📋 Pre-Production Checklist

Before recording each tutorial:

- [ ] Review written tutorial guide
- [ ] Test all steps in RageVFX
- [ ] Prepare example assets/files
- [ ] Write detailed script
- [ ] Set up recording environment
- [ ] Test audio levels
- [ ] Clear desktop/notifications
- [ ] Close unnecessary applications
- [ ] Reset RageVFX to default layout

## 🎞️ Recording Process

### Recommended Workflow

1. **Record Screen + Audio Simultaneously**
   - Do complete take without stopping
   - If mistake occurs, pause, say "take 2", continue
   - Record entire tutorial in one session for consistency

2. **Record Multiple Takes if Needed**
   - Do 2-3 full run-throughs
   - Choose best segments from each

3. **Capture B-Roll**
   - Close-ups of specific features
   - Alternative angles/workflows
   - Result showcases

### During Recording
- **Speak clearly** - Enunciate technical terms
- **Show shortcuts** - Mention keyboard shortcuts verbally
- **Explain actions** - Don't just do, explain why
- **Pace yourself** - Give viewers time to follow
- **Check recording** - Verify audio/video is capturing

## ✂️ Post-Production

### Editing Steps

1. **Import and Organize**
   - Import all footage
   - Label takes
   - Note timestamps of good segments

2. **Rough Cut**
   - Remove mistakes/dead air
   - Arrange best takes
   - Check pacing and flow

3. **Fine Cut**
   - Add title cards
   - Insert annotations/highlights
   - Add transitions
   - Color correct if needed

4. **Audio Post**
   - Remove background noise
   - Normalize levels to -3dB
   - Add subtle background music
   - Fix any audio issues

5. **Graphics and Effects**
   - Zoom in on important UI elements
   - Add arrows/highlights
   - Insert text annotations
   - Add progress indicators

6. **Final Review**
   - Watch entire video
   - Check audio sync
   - Verify all graphics are readable
   - Test on different screens/devices

### Rendering Settings
```
Format: QuickTime Movie (.mov)
Codec: H.264 or ProRes 422
Resolution: 1920x1080 or 2560x1440
Frame Rate: Match source (30 or 60fps)
Quality: High (8-10 Mbps for 1080p)
Audio: AAC 48kHz Stereo 192kbps
```

## 📤 Export and Delivery

### Quality Control Checklist
- [ ] Video plays smoothly without stuttering
- [ ] Audio is clear and properly synced
- [ ] All text/graphics are readable
- [ ] Color/brightness is consistent
- [ ] File size is reasonable (100-300MB per 15-20 min)
- [ ] Metadata is correct (title, duration, description)

### File Organization
Place completed videos in:
```
docs/tutorials/videos/
├── 01-getting-started.mov
├── 02-interface-deep-dive.mov
├── 03-node-basics.mov
└── ...
```

### Backup Strategy
- Keep project files (editable)
- Keep raw footage (at least until final approval)
- Store high-quality masters
- Create web-optimized versions if needed

## 🖼️ Screenshot Guidelines

### When to Capture Screenshots

Create screenshots for:
1. **Key UI Elements**: Panels, menus, toolbars
2. **Node Graphs**: Example workflows and connections
3. **Parameter Settings**: Important configuration screens
4. **Results**: Before/after comparisons
5. **Tips & Tricks**: Visual keyboard shortcut references

### Screenshot Specifications
- **Format**: PNG (for UI), JPEG (for results)
- **Resolution**: Native resolution (1920x1080+ recommended)
- **Naming**: Descriptive names with episode number
  - `01-getting-started-interface-overview.png`
  - `15-motion-graphics-array-modifier-settings.png`

### Screenshot Editing
- Crop to relevant area
- Add annotations if needed
- Ensure high DPI/retina clarity
- Optimize file size

### Organization
```
docs/tutorials/screenshots/
├── 01-getting-started/
│   ├── interface-overview.png
│   ├── node-library.png
│   └── first-graph.png
├── 02-interface-deep-dive/
│   ├── menu-bar.png
│   └── ...
└── ...
```

## 🔄 Tutorial Video Status Tracking

Track progress in the table below:

| Episode | Tutorial | Duration | Status | Video File | Screenshots |
|---------|----------|----------|--------|------------|-------------|
| 1 | Getting Started | 15 min | 📋 Planned | - | - |
| 2 | Interface Deep Dive | 20 min | 📋 Planned | - | - |
| 3 | Node Basics | 18 min | 📋 Planned | - | - |
| 4 | First VFX Effect | 25 min | 📋 Planned | - | - |
| 5 | Saving & Exporting | 12 min | 📋 Planned | - | - |
| 6 | Compositing Essentials | 30 min | 📋 Planned | - | - |
| 7 | Color Grading Masterclass | 35 min | 📋 Planned | - | - |
| 8 | Green Screen Keying | 28 min | 📋 Planned | - | - |
| 9 | Tracking & Stabilization | 25 min | 📋 Planned | - | - |
| 10 | Procedural Effects | 32 min | 📋 Planned | - | - |
| 11 | 3D Pipeline Basics | 35 min | 📋 Planned | - | - |
| 12 | Animation Timeline | 28 min | 📋 Planned | - | - |
| 13 | Physics Simulation | 40 min | 📋 Planned | - | - |
| 14 | Machine Learning Tools | 35 min | 📋 Planned | - | - |
| 15 | Motion Graphics | 38 min | 📋 Planned | - | - |
| 16 | Advanced 3D Rendering | 42 min | 📋 Planned | - | - |
| 17 | Camera Tracking | 36 min | 📋 Planned | - | - |
| 18 | Fluid Dynamics | 40 min | 📋 Planned | - | - |
| 19 | Pipeline Collaboration | 32 min | 📋 Planned | - | - |
| 20 | Professional Workflows | 45 min | 📋 Planned | - | - |

**Status Legend:**
- 📋 Planned - Script ready, not recorded
- 🎬 Recording - Currently being recorded
- ✂️ Editing - Recorded, in post-production
- ✅ Complete - Finished and delivered
- 🔄 Revision - Needs updates

## 📚 Additional Resources

### Video Editing Templates
Create templates for:
- Opening title cards
- Section dividers
- Keyboard shortcut overlays
- End cards with next episode preview

### Asset Library
Maintain a library of:
- RageVFX logo animations
- Background graphics
- Sound effects (UI clicks, whooshes)
- Background music tracks

### Style Guide
Document visual style choices:
- Font family and sizes
- Color palette for annotations
- Transition types and durations
- Audio mixing levels

## 🎯 Quality Standards

Every video should meet these standards:

### Technical Quality
- ✅ No dropped frames or stuttering
- ✅ Clear, noise-free audio
- ✅ Proper audio/video sync
- ✅ All UI elements clearly visible
- ✅ Text is readable at 1080p

### Content Quality
- ✅ Follows written tutorial guide
- ✅ Clear explanations of concepts
- ✅ Demonstrates all key features
- ✅ Includes practice exercises
- ✅ Professional narration

### Production Quality
- ✅ Consistent branding
- ✅ Smooth transitions
- ✅ Helpful annotations
- ✅ Proper pacing
- ✅ Engaging presentation

## 🚀 Publishing Workflow

Once videos are complete:

1. **Upload to Platform**
   - YouTube (primary)
   - Vimeo (backup)
   - Direct download (GitHub releases)

2. **Update Documentation**
   - Add video links to VIDEO_TUTORIALS.md
   - Update tutorial markdown files
   - Create video index

3. **Announce Release**
   - GitHub release notes
   - Social media
   - Community channels

---

*For questions or suggestions about video production, contact the RageVFX team.*
