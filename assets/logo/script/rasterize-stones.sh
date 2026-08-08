#!/usr/bin/env bash
# Rasterise the generated stone icons into PNGs.
#
#     assets/logo/script/rasterize-stones.sh [size]
#
# Run generate.py first; this reads assets/logo/output/stones and writes
# assets/icons. Every stone in that directory is rendered, so a new entry in
# STONE_SEEDS needs no change here. The optional argument sets the square edge
# in pixels and defaults to the 1024 master size.
set -euo pipefail

logo=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
stones="$logo/output/stones"
icons="$(dirname "$logo")/icons"

# ImageMagick rasterises at this DPI before resampling down, which supersamples
# the chamfer and the traced inscription instead of aliasing them.
DENSITY=384
SQUARE=${1:-1024}

[ -d "$stones" ] || { echo "missing $stones - run generate.py first" >&2; exit 1; }

mkdir -p "$icons"

count=0
for source in "$stones"/*.svg; do
  name=$(basename "$source" .svg)
  target="$icons/$name.png"
  # The tile covers the whole artboard, so the alpha channel carries nothing
  # and is dropped to keep these usable as store icon masters.
  magick -background none -density "$DENSITY" "$source" \
    -resize "${SQUARE}x${SQUARE}" -alpha remove -alpha off -strip "$target"
  printf '%-28s %s\n' "$name.png" "$(magick "$target" -format '%wx%h' info:)"
  count=$((count + 1))
done

echo "wrote $count stone icons to $icons"
