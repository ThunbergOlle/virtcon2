#!/bin/bash

# Compile all YAML sprite definitions to PNG and copy to game assets
# Usage: npm run compile-sprites

set -e

SRC_BASE="sprites/yaml"
DEST_BASE="apps/game/public/assets/sprites"

# Build sprite-gen first
echo "Building sprite-gen..."
nx build sprite-gen

echo "Compiling sprites..."

# Find all YAML files recursively and process each
find "$SRC_BASE" -name "*.yaml" -o -name "*.yml" | while read -r yaml_file; do
  # Get the relative path from the source base (e.g., "items/stick.yaml")
  rel_path="${yaml_file#$SRC_BASE/}"

  # Get the directory part (e.g., "items")
  rel_dir="$(dirname "$rel_path")"

  # Get the filename without extension
  base_name="$(basename "$rel_path" .yaml)"
  base_name="${base_name%.yml}"

  # Create the output directory if it doesn't exist
  mkdir -p "$DEST_BASE/$rel_dir"

  # Output path
  output_path="$DEST_BASE/$rel_dir/$base_name.png"

  # Generate the PNG
  echo "  $yaml_file -> $output_path"
  node dist/packages/sprite-gen/cli.js generate "$yaml_file" -o "$output_path"
done

echo "Done! All sprites compiled."
