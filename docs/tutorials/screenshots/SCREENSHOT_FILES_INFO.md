# Screenshot Files Information

## About Screenshot Files

Tutorial screenshots are visual reference images showing RageVFX's interface, features, and workflows. Like video files, actual screenshot images (.png/.jpg) are not yet in the repository because:

1. They need to be captured from a running RageVFX instance
2. They require consistent setup and styling
3. They need proper editing and annotation
4. High-quality screenshots can be 1-5 MB each

## Screenshot Requirements Documented

While actual screenshot files are pending creation, we have documented exactly what screenshots are needed for each episode:

- **Episode 1:** 8+ screenshots (documented in `01-episode/SCREENSHOTS_NEEDED.md`)
- **Episode 2:** 13+ screenshots (documented in `02-episode/SCREENSHOTS_NEEDED.md`)
- **Episode 3:** 12+ screenshots (documented in `03-episode/SCREENSHOTS_NEEDED.md`)
- **Episode 21:** 9+ screenshots (documented in `21-episode/SCREENSHOTS_NEEDED.md`)
- **Episodes 4-20:** Requirements to be documented

**Total Estimated:** 150-200 screenshots across all tutorials

## Screenshot Categories

### 1. Interface Screenshots
Full or partial views of the RageVFX interface:
- Complete UI showing all panels
- Individual panel close-ups
- Menu systems
- Toolbar and controls

**Example filenames:**
```
01-episode/interface-overview-full-ui.png
02-episode/menu-bar-file-menu.png
02-episode/properties-panel-controls.png
```

### 2. Node Graph Screenshots
Visual representations of node-based workflows:
- Simple workflows (3-5 nodes)
- Complex workflows (10+ nodes)
- Common patterns
- Annotated with backdrop labels

**Example filenames:**
```
01-episode/first-graph-simple.png
03-episode/enhancement-chain-pattern.png
06-episode/compositing-workflow-complete.png
```

### 3. Result Screenshots
Before/after comparisons and final outputs:
- Viewport previews
- Rendered results
- Effect demonstrations
- Comparison sliders

**Example filenames:**
```
04-episode/fire-effect-result.png
07-episode/color-grading-before-after.png
10-episode/procedural-terrain-render.png
```

### 4. Parameter Screenshots
Properties panels showing specific settings:
- Node parameters
- Slider values
- Dropdown options
- Detailed configurations

**Example filenames:**
```
01-episode/properties-panel-color-correct.png
15-episode/motion-graphics-array-settings.png
21-episode/stereo-generator-parameters.png
```

### 5. Annotated Screenshots
Educational images with visual annotations:
- Arrows pointing to features
- Text labels explaining elements
- Callout boxes with notes
- Step-by-step sequences

**Example filenames:**
```
02-episode/keyboard-shortcuts-reference-card.png
03-episode/data-types-color-coding-annotated.png
21-episode/stereoscopic-principles-diagram.png
```

## Screenshot Specifications

All screenshots must meet these standards:

```
Format:         PNG (for UI) or JPEG (for photos/renders)
Resolution:     Native display resolution
                Minimum 1920x1080 (1080p)
                Recommended 2560x1440 (1440p) or higher
DPI:            144+ (Retina/HiDPI)
Color Space:    sRGB
Bit Depth:      24-bit (PNG) or 8-bit per channel
Compression:    Optimized PNG/JPEG
File Size:      Target 100-500 KB after optimization
                (Raw screenshots may be 1-5 MB)
```

## Screenshot Workflow

### 1. Capture
Using native OS tools or screen capture software:

**macOS:**
```bash
Cmd + Shift + 3  # Full screen
Cmd + Shift + 4  # Selection
Cmd + Shift + 5  # Advanced options
```

**Windows:**
```bash
Win + Shift + S  # Snipping tool
PrtScn           # Full screen
Alt + PrtScn     # Active window
```

**Linux:**
```bash
PrtScn           # Full screen
Shift + PrtScn   # Selection
```

### 2. Edit
Add annotations if needed:
- Arrows and highlights
- Text labels
- Callout boxes
- Step numbers

**Tools:**
- macOS: Preview, Pixelmator, Sketch
- Windows: Paint 3D, Snagit, Photoshop
- Linux: GIMP, Krita, Inkscape

### 3. Optimize
Reduce file size while maintaining quality:

```bash
# PNG optimization
optipng -o7 screenshot.png
pngcrush -reduce screenshot.png screenshot-optimized.png

# JPEG optimization (85% quality)
convert input.jpg -quality 85 output.jpg
jpegoptim --max=85 screenshot.jpg
```

### 4. Name
Follow naming convention:
```
[episode]-[section]-[description]-[number].png

Examples:
01-interface-overview-full-ui.png
15-motion-graphics-array-modifier-result.png
21-stereoscopic-depth-map-grayscale.png
```

### 5. Place
Organize in episode directories:
```
screenshots/
├── 01-episode/
│   ├── interface-overview-full-ui.png
│   ├── node-library-categories.png
│   └── first-graph-simple.png
├── 02-episode/
│   ├── menu-bar-file-menu.png
│   └── ...
```

## Screenshot Status by Episode

| Episode | Required | Documented | Captured | Status |
|---------|----------|------------|----------|--------|
| 1 | 8+ | ✅ Yes | ❌ No | 📋 Ready to capture |
| 2 | 13+ | ✅ Yes | ❌ No | 📋 Ready to capture |
| 3 | 12+ | ✅ Yes | ❌ No | 📋 Ready to capture |
| 4-20 | TBD | ⚠️ Pending | ❌ No | 📝 Needs documentation |
| 21 | 9+ | ✅ Yes | ❌ No | 📋 Ready to capture |

## Common Screenshots Library

Some screenshots are reusable across multiple tutorials:

### Interface Elements
- `common/interface-elements/menu-bar-full.png`
- `common/interface-elements/toolbar-full.png`
- `common/interface-elements/node-library-overview.png`

### Node Categories
- `common/node-library/category-input-output.png`
- `common/node-library/category-vfx.png`
- `common/node-library/category-3d.png`

### UI Controls
- `common/ui-controls/slider-control.png`
- `common/ui-controls/color-picker.png`
- `common/ui-controls/dropdown-menu.png`

### Keyboard Shortcuts
- `common/keyboard-shortcuts/shortcuts-general.png`
- `common/keyboard-shortcuts/shortcuts-node-graph.png`
- `common/keyboard-shortcuts/shortcuts-viewport.png`

## For Contributors

### Creating Screenshots

1. **Setup RageVFX:**
   - Use default layout
   - Clear workspace
   - Load example project if needed

2. **Configure Display:**
   - Set to 1920x1080 or higher
   - Enable HiDPI if available
   - Close unnecessary applications

3. **Capture:**
   - Follow capture guidelines
   - Take multiple shots for best result
   - Verify clarity and readability

4. **Edit & Annotate:**
   - Add helpful annotations
   - Follow annotation guidelines
   - Maintain consistent style

5. **Optimize:**
   - Reduce file size
   - Maintain quality
   - Target 100-500 KB

6. **Submit:**
   - Place in correct directory
   - Follow naming convention
   - Update documentation
   - Create pull request

### Quality Checklist

Before submitting screenshots:
- [ ] Correct resolution (1080p+)
- [ ] Clear and readable text
- [ ] Proper naming convention
- [ ] Appropriate annotations
- [ ] File size optimized
- [ ] Correct directory placement
- [ ] No sensitive information visible
- [ ] Consistent styling

## Download Instructions (Future)

Once screenshots are created, they will be:

1. **In Repository** - Optimized screenshots committed to Git
2. **In Releases** - High-resolution versions in release assets
3. **On Website** - Available at ragevfx.com/tutorials/screenshots/

## Tools and Resources

### Screen Capture
- **Snagit** (Windows/Mac) - Commercial, feature-rich
- **Monosnap** (Windows/Mac) - Free, good annotations
- **ShareX** (Windows) - Free, open source
- **Flameshot** (Linux) - Free, good annotations

### Image Editing
- **GIMP** - Free, cross-platform
- **Photoshop** - Commercial, professional
- **Pixelmator Pro** (Mac) - Commercial, Mac-optimized
- **Paint.NET** (Windows) - Free

### Optimization
- **ImageOptim** (Mac) - Free
- **FileOptimizer** (Windows) - Free
- **OptiPNG** - Command-line, all platforms
- **JPEGoptim** - Command-line, all platforms

---

**Status:** Screenshot requirements documented, capture pending  
**Expected Completion:** Aligned with video production timeline  
**Current Phase:** Pre-production complete, ready to capture

*For contributing screenshots or reporting issues, see [CONTRIBUTING.md](../../../CONTRIBUTING.md)*
