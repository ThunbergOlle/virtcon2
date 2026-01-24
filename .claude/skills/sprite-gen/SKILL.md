---
name: sprite-gen
description: Generate PNG pixel art sprites from YAML definitions. Use when the user wants to create, preview, or regenerate sprite images from YAML files.
argument-hint: <command> [options]
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Sprite Generator Skill

Generate PNG pixel art images from YAML sprite definitions using the `sprite-gen` CLI tool.

## Commands

### generate (default)
Generate PNG from YAML sprite definition.

```bash
npm run sprite-gen -- [generate] <input.yaml> -o <output.png>
```

### extract
Extract YAML sprite definition from an existing PNG image. This converts existing sprites to editable YAML format.

```bash
npm run sprite-gen -- extract <input.png> -o <output.yaml>
npm run sprite-gen -- extract <input.png> --stdout  # Print YAML to console
```

### compare
Compare two PNG images pixel by pixel to verify they match.

```bash
npm run sprite-gen -- compare <image1.png> <image2.png>
npm run sprite-gen -- compare <image1.png> <image2.png> --json  # Output as JSON
```

### roundtrip
Full pipeline: extract YAML from PNG, regenerate PNG, and verify the images match. Useful for validating the extraction process.

```bash
npm run sprite-gen -- roundtrip <input.png> -o <output-dir> --keep
```

Options:
- `-o, --output-dir <dir>` - Directory for generated files (defaults to input directory)
- `--keep` - Keep intermediate files even on success

### pixels
Dump raw pixel data from a PNG for debugging.

```bash
npm run sprite-gen -- pixels <input.png>
npm run sprite-gen -- pixels <input.png> --json
```

## Scaling for Preview

The generated sprites are small pixel art. To create a scaled-up version for easier viewing, use ffmpeg with nearest-neighbor scaling (no anti-aliasing):

```bash
# Scale 8x for preview
ffmpeg -y -i output.png -vf "scale=iw*8:ih*8:flags=neighbor" output_preview.png
```

Always generate a scaled preview when displaying sprites to the user so they can see the details clearly.

## YAML Schema

Sprite definitions use this structure:

```yaml
meta:
  name: sprite_name
  canvas: [width, height]  # Canvas size in pixels

palette:
  "1": "#hex_color"  # Color definitions (keys are single characters)
  "2": "#another_color"

components:
  component_name:
    at: [x, y]           # Position
    pattern: |           # ASCII art pattern using palette keys
      ..1111..
      .111111.
```

## Instructions

When the user invokes this skill:

1. **Converting existing sprites to YAML**: Use the `extract` command to convert PNG files to YAML:
   ```bash
   npm run sprite-gen -- extract path/to/sprite.png -o output.yaml
   ```

2. **Batch conversion**: To convert multiple sprites, use a loop or process them one by one with the `roundtrip` command to verify each conversion works correctly.

3. **Understanding existing sprites**: If the user wants to modify or recreate a sprite, first use `extract` to get the YAML, or use the Read tool to view the PNG directly.

4. **Generating sprites**: If they provide a YAML file path, run the sprite-gen command to generate the PNG.

5. **Creating new sprites**: If they want to create a new sprite, help them write the YAML definition first, then generate it.

6. **Preview with scaling**: After generating, create a scaled-up preview using ffmpeg:
   ```bash
   ffmpeg -y -i output.png -vf "scale=iw*8:ih*8:flags=neighbor" output_preview.png
   ```
   Then use the Read tool to display the scaled preview image to the user.

7. **Verifying conversions**: Use `compare` to verify two images match pixel-by-pixel, or use `roundtrip` to test the full extract-regenerate pipeline.

If the user provides arguments like `/sprite-gen extract sprite.png`, parse them and run the appropriate command.
