# RageVFX Tutorial Screenshots

This directory contains screenshot assets for all RageVFX video tutorials and documentation.

## Directory Structure

```
screenshots/
├── README.md                          # This file
├── screenshot-guidelines.md           # Capture and editing guidelines
├── 01-episode/                        # Episode 1 screenshots
├── 02-episode/                        # Episode 2 screenshots
├── ...
├── 20-episode/                        # Episode 20 screenshots
└── common/                            # Reusable screenshots
    ├── interface-elements/
    ├── node-library/
    ├── keyboard-shortcuts/
    └── ui-controls/
```

## Screenshot Categories

### Per-Episode Screenshots
Each episode directory contains:
- **Interface overviews**: Full UI captures showing layout
- **Node graphs**: Specific workflow demonstrations
- **Parameter settings**: Important configuration screens
- **Results**: Before/after comparisons
- **Step-by-step**: Sequential captures for tutorials

### Common Screenshots
Reusable across multiple tutorials:
- **Interface elements**: Menu bars, panels, toolbars
- **Node library**: Category views and node types
- **Keyboard shortcuts**: Visual reference cards
- **UI controls**: Sliders, buttons, dialogs

## Screenshot Specifications

### Technical Requirements
- **Format**: PNG (for UI with transparency), JPEG (for results/photos)
- **Resolution**: Native screen resolution (1920x1080 or higher)
- **DPI**: 144+ (retina/high-DPI)
- **Color Space**: sRGB
- **Compression**: Optimized but maintain clarity

### Naming Convention

```
[episode]-[section]-[description]-[number].png

Examples:
- 01-interface-overview-full-ui.png
- 03-node-graph-data-flow-example.png
- 07-color-grading-lut-settings.png
- 15-motion-graphics-array-modifier-result.png
```

### Best Practices

1. **Clean Desktop**: Remove clutter, close unnecessary windows
2. **Consistent Layout**: Use default RageVFX layout unless demonstrating customization
3. **High Contrast**: Ensure text and UI elements are clearly visible
4. **Annotations**: Add arrows, circles, or labels when needed
5. **Before/After**: Show comparisons side-by-side when relevant
6. **Cursor**: Hide cursor unless showing specific interaction
7. **Watermark**: Optional RageVFX logo in corner

## Screenshot Types

### 1. Full Interface
Complete application window showing all panels.

**When to use:**
- Introduction to interface
- Layout demonstrations
- Multi-panel workflows

**Dimensions:** Full screen (1920x1080+ recommended)

### 2. Panel Focus
Single panel or UI section isolated.

**When to use:**
- Explaining specific panel functionality
- Showing detailed parameters
- Highlighting individual controls

**Dimensions:** Cropped to relevant area

### 3. Node Graph
Node graph canvas with specific workflow.

**When to use:**
- Demonstrating node connections
- Showing data flow
- Illustrating patterns

**Include:** Relevant nodes, connections, backdrop labels

### 4. Parameters
Properties panel with specific settings.

**When to use:**
- Showing parameter values
- Demonstrating adjustments
- Reference configurations

**Include:** Node type, all visible parameters

### 5. Viewport Results
Output preview showing effect results.

**When to use:**
- Before/after comparisons
- Showing final output
- Demonstrating visual changes

**Include:** Viewport panel, potentially with stats overlay

### 6. Keyboard Shortcuts
Visual reference cards showing shortcuts.

**When to use:**
- Quick reference materials
- Tutorial overlays
- Shortcut guides

**Format:** Graphic design with keys and descriptions

### 7. Step-by-Step Sequences
Numbered series showing progression.

**When to use:**
- Tutorial walkthroughs
- Complex operations
- Multi-step processes

**Include:** Step numbers, annotations

## Annotation Guidelines

### Tools
- **macOS**: Preview, Pixelmator, Sketch
- **Windows**: Paint 3D, Snagit, Photoshop
- **Linux**: GIMP, Krita, Inkscape

### Annotation Elements

**Arrows:**
- Color: Bright blue (#0088FF) or yellow (#FFD700)
- Width: 3-5 pixels
- Style: Solid with arrowhead
- Use: Point to specific UI elements

**Circles/Highlights:**
- Color: Semi-transparent red (#FF000080)
- Width: 3 pixels
- Use: Highlight clickable areas

**Text Labels:**
- Font: Arial or Helvetica, bold
- Size: 14-18pt
- Color: White text with dark outline or shadow
- Use: Explain elements or steps

**Callout Boxes:**
- Background: Semi-transparent black (#00000080)
- Border: 2px white
- Text: White, 12-14pt
- Use: Extended explanations

**Step Numbers:**
- Style: White number in colored circle
- Size: 24-32pt
- Colors: Blue, green, orange (sequential)
- Use: Sequential instructions

### Annotation Best Practices
- Keep annotations minimal and clear
- Use consistent colors and styles
- Don't obscure important UI elements
- Place labels outside main content when possible
- Use contrast to ensure readability

## Screenshot Capture Methods

### macOS
```bash
# Full screen
Cmd + Shift + 3

# Selection
Cmd + Shift + 4

# Window
Cmd + Shift + 4, then Space, then click window

# Timed capture (for UI states)
Cmd + Shift + 5 → Options → Timer
```

### Windows
```
# Full screen
PrtScn

# Active window
Alt + PrtScn

# Selection (Windows 10+)
Win + Shift + S

# Snipping Tool / Snip & Sketch
Win + Shift + S
```

### Linux
```bash
# GNOME
PrtScn - Full screen
Shift + PrtScn - Selection
Alt + PrtScn - Window

# Command line
import screenshot.png  # ImageMagick
scrot screenshot.png
```

## Editing Screenshots

### Basic Editing Steps

1. **Capture**: Take screenshot at native resolution
2. **Crop**: Remove unnecessary borders and space
3. **Annotate**: Add arrows, highlights, labels if needed
4. **Optimize**: Compress while maintaining quality
5. **Save**: Use appropriate format (PNG/JPEG)

### Optimization

**PNG (for UI):**
```bash
# Using ImageMagick
convert input.png -colors 256 output.png

# Using pngcrush
pngcrush -reduce input.png output.png

# Using OptiPNG
optipng -o7 input.png
```

**JPEG (for results):**
```bash
# Using ImageMagick
convert input.jpg -quality 85 output.jpg

# Using jpegoptim
jpegoptim --max=85 input.jpg
```

## Screenshot Checklist

Before adding screenshots to repository:

- [ ] Correct naming convention used
- [ ] Proper directory location
- [ ] Native resolution or higher
- [ ] Clear and readable text/UI elements
- [ ] Annotations if needed are clear
- [ ] File optimized for size
- [ ] No sensitive/personal information visible
- [ ] Consistent with other screenshots
- [ ] Referenced in tutorial documentation

## Screenshot Inventory

### Episode 1: Getting Started
- [ ] interface-overview-full-ui.png
- [ ] node-library-categories.png
- [ ] first-graph-simple.png
- [ ] properties-panel-color-correct.png
- [ ] viewport-result-preview.png
- [ ] save-dialog.png

### Episode 2: Interface Deep Dive
- [ ] menu-bar-file-menu.png
- [ ] menu-bar-edit-menu.png
- [ ] toolbar-buttons.png
- [ ] node-library-search.png
- [ ] node-graph-navigation.png
- [ ] backdrop-creation.png
- [ ] backdrop-organized.png
- [ ] properties-various-controls.png
- [ ] viewport-2d-controls.png
- [ ] viewport-3d-wasd.png
- [ ] timeline-controls.png
- [ ] keyboard-shortcuts-reference.png

### Episode 3: Node Basics
- [ ] node-anatomy-diagram.png
- [ ] data-types-color-coding.png
- [ ] category-overview-all.png
- [ ] data-flow-simple.png
- [ ] data-flow-branching.png
- [ ] parameter-controls-various.png
- [ ] enhancement-chain-pattern.png
- [ ] key-comp-pattern.png
- [ ] generate-combine-pattern.png
- [ ] multi-level-adjustment-pattern.png

### Episodes 4-20
*To be documented as videos are produced*

## Common Screenshots Library

### Interface Elements
- [ ] menu-bar-full.png
- [ ] toolbar-full.png
- [ ] node-library-full.png
- [ ] node-graph-empty.png
- [ ] properties-panel-empty.png
- [ ] viewport-empty.png
- [ ] timeline-empty.png

### Node Library Categories
- [ ] category-input-output.png
- [ ] category-generator.png
- [ ] category-filter.png
- [ ] category-color.png
- [ ] category-composite.png
- [ ] category-vfx.png
- [ ] category-3d.png
- [ ] category-physics.png
- [ ] category-ml.png

### UI Controls
- [ ] slider-control.png
- [ ] number-field.png
- [ ] color-picker.png
- [ ] dropdown-menu.png
- [ ] checkbox.png
- [ ] button-types.png

### Keyboard Shortcuts
- [ ] shortcuts-general.png
- [ ] shortcuts-node-graph.png
- [ ] shortcuts-timeline.png
- [ ] shortcuts-viewport-2d.png
- [ ] shortcuts-viewport-3d.png

## Contributing Screenshots

If you'd like to contribute screenshots:

1. Follow the naming convention
2. Ensure high quality and clarity
3. Place in appropriate episode directory
4. Update this README inventory
5. Submit via pull request

## Screenshot License

All screenshots are licensed under Creative Commons BY-NC-SA 4.0.
- **Attribution Required**: Credit RageVFX
- **Non-Commercial**: Free for non-commercial use
- **Share Alike**: Derivatives must use same license

---

*For questions about screenshots, contact tutorials@ragevfx.com*
