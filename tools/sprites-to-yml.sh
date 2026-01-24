  # Base paths
  SRC_BASE="apps/game/public/assets/sprites"
  DEST_BASE="sprites/yaml"

  # Find all PNG files recursively and process each
  find "$SRC_BASE" -name "*.png" | while read -r f; do
    # Get the relative path from the source base (e.g., "items/stick.png")
    rel_path="${f#$SRC_BASE/}"

    # Get the directory part (e.g., "items")
    rel_dir="$(dirname "$rel_path")"

    # Create the output directory if it doesn't exist
    mkdir -p "$DEST_BASE/$rel_dir"

    # Run roundtrip with the correct output directory
    npm run sprite-gen -- roundtrip "$f" -o "$DEST_BASE/$rel_dir"
  done
