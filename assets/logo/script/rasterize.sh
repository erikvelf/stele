#!/usr/bin/env bash
# Rasterise the generated app SVGs into the PNGs app.json points at.
#
#     assets/logo/script/rasterize.sh
#
# Run generate.py first; this reads assets/logo/output/app and writes
# assets/images. Expo downscales each master itself, so every square asset is
# emitted once at 1024x1024 and no per-density variants are produced here.
set -euo pipefail

logo=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
app="$logo/output/app"
images="$(dirname "$logo")/images"

# ImageMagick rasterises at this DPI before resampling down, which supersamples
# the chamfer and the traced inscription instead of aliasing them.
DENSITY=384
SQUARE=1024

# The splash renders on the source artboard rather than a square, so it keeps
# that aspect. Its width sets the stele's dp width via app.json's imageWidth.
SPLASH_WIDTH=1044

render() {
  local source="$app/$1.svg" name="$2" target="$images/$2.png"
  shift 2
  magick -background none -density "$DENSITY" "$source" "$@" -strip "$target"
  printf '%-28s %s\n' "$name.png" "$(magick "$target" -format '%wx%h' info:)"
}

[ -d "$app" ] || { echo "missing $app - run generate.py first" >&2; exit 1; }

# The universal icon must be fully opaque: the App Store rejects an alpha
# channel, so it is flattened onto its own tile colour.
render icon icon -resize "${SQUARE}x${SQUARE}" -alpha remove -alpha off

render android-icon-background android-icon-background -resize "${SQUARE}x${SQUARE}" -alpha remove -alpha off
render android-icon-foreground android-icon-foreground -resize "${SQUARE}x${SQUARE}"
render android-icon-monochrome android-icon-monochrome -resize "${SQUARE}x${SQUARE}"
render splash-icon splash-icon -resize "${SPLASH_WIDTH}x"
render favicon favicon -resize 196x196
