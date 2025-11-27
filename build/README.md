# Build Resources Directory

This directory contains build resources for the RageVFX application.

## Required Files for Distribution

### Windows
- `icon.ico` - Windows application icon (256x256)

### macOS
- `icon.icns` - macOS application icon

### Linux
- `icons/` - Directory containing PNG icons at various sizes (16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512)

## Generating Icons

To generate icons from the SVG source:

1. Install ImageMagick or a similar tool
2. Use the provided `icon.svg` as the source
3. Generate platform-specific icons:

```bash
# For PNG (multiple sizes)
for size in 16 32 48 64 128 256 512; do
  convert icon.svg -resize ${size}x${size} icons/${size}x${size}.png
done

# For Windows ICO
convert icon.svg -define icon:auto-resize="256,128,64,48,32,16" icon.ico

# For macOS ICNS
iconutil -c icns icons.iconset
```

## Temporary: Using PNG as fallback

If you don't have proper icons, electron-builder will use the SVG or generate icons automatically on some platforms.
