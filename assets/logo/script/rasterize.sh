#!/usr/bin/env bash
# Rasterise the generated app SVGs into the PNGs app.json points at.
#
#     assets/logo/script/rasterize.sh
#
# Run generate.py first; this reads assets/logo/output and writes assets/images
# and assets/icons/previews. Expo downscales each master itself, so every square
# asset is emitted once at 1024x1024 and no per-density variants are produced
# here.
set -euo pipefail

logo=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
app="$logo/output/app"
stones="$logo/output/stones"
images="$(dirname "$logo")/images"
previews="$(dirname "$logo")/icons/previews"

# ImageMagick rasterises at this DPI before resampling down, which supersamples
# the chamfer and the traced inscription instead of aliasing them.
DENSITY=384
SQUARE=1024

# The app icon picker draws each stone at a third of the screen width, so this
# covers it at 3x.
PREVIEW=192

# The iOS splash renders on the source artboard rather than a square, so it
# keeps that aspect. Its width sets the stele's dp width via app.json's
# imageWidth.
SPLASH_WIDTH=1044

# Android 12+ clips the splash icon to a circle, and only the inner 192dp of the
# 288dp drawable survives the mask. The stele is scaled until its diagonal spans
# that inner circle, then centred on a square drawable of SQUARE pixels.
SPLASH_SAFE_DIAMETER=$((SQUARE * 192 / 288))

render() {
  local source="$app/$1.svg" name="$2" target="$images/$2.png"
  shift 2
  magick -background none -density "$DENSITY" "$source" "$@" -strip "$target"
  printf '%-28s %s\n' "$name.png" "$(magick "$target" -format '%wx%h' info:)"
}

# The height whose diagonal, at the artboard's aspect, equals the safe circle.
splash_safe_height() {
  magick "$app/splash-icon.svg" -format '%w %h' info: |
    awk -v d="$SPLASH_SAFE_DIAMETER" '{ print int(d * $2 / sqrt($1 * $1 + $2 * $2)) }'
}

[ -d "$app" ] || { echo "missing $app - run generate.py first" >&2; exit 1; }
[ -d "$stones" ] || { echo "missing $stones - run generate.py first" >&2; exit 1; }

mkdir -p "$images"

# The universal icon must be fully opaque: the App Store rejects an alpha
# channel, so it is flattened onto its own tile colour.
render icon icon -resize "${SQUARE}x${SQUARE}" -alpha remove -alpha off

render android-icon-background android-icon-background -resize "${SQUARE}x${SQUARE}" -alpha remove -alpha off
render android-icon-foreground android-icon-foreground -resize "${SQUARE}x${SQUARE}"
render android-icon-monochrome android-icon-monochrome -resize "${SQUARE}x${SQUARE}"
render splash-icon splash-icon -resize "${SPLASH_WIDTH}x"
render splash-icon splash-icon-android -resize "x$(splash_safe_height)" \
  -gravity center -extent "${SQUARE}x${SQUARE}"
render favicon favicon -resize 196x196

# One preview per stone for the app icon picker, opaque like the icons they
# stand for.
mkdir -p "$previews"
for source in "$stones"/icon-*.svg; do
  name=$(basename "$source" .svg)
  target="$previews/$name.png"
  magick -background none -density "$DENSITY" "$source" \
    -resize "${PREVIEW}x${PREVIEW}" -alpha remove -alpha off -strip "$target"
  printf '%-28s %s\n' "$name.png" "$(magick "$target" -format '%wx%h' info:)"
done
