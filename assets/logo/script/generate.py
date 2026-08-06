"""Build the Stele app icon from the hand-drawn source outline.

The source `stele-writing.svg` is a two-path trace: an even-odd outline whose
three holes are the stele's front face, side plane and bottom chamfer, plus a
second path holding the inscription. This script fills those holes with flat
facet tones and lays the result on an InfoSwatch-style tile.

    python3 assets/logo/script/generate.py
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from svg_path import bbox, subpaths

LOGO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(LOGO, 'source', 'stele-writing.svg')
OUTPUT = os.path.join(LOGO, 'output')

# The traced artwork's own coordinate space, and the square the icon renders
# into. Every offset below is expressed against CANVAS.
STELE_WIDTH, STELE_HEIGHT, CANVAS = 1044.0, 1912.0, 1024.0

# InfoSwatch draws a darker circle centred on the tile's bottom-right corner.
# The ratio is the circle's radius as a multiple of the tile side.
BLOB_RADIUS_RATIO = 1.0
BLOB_OPACITY = 0.35

# The stele keeps one material across every accent so the mark stays a single
# recognisable object; the tile colour is what changes per stone.
GRANODIORITE = {
    'front': '#8C8D88',
    'facet': '#7B7C77',
    'side': '#63645F',
    'ink': '#262723',
}

# Share of the canvas width the stele spans, and its y offset. A wider stele
# means a larger scale, so less of it fits above the bottom edge.
CROP = {'width_ratio': 0.82, 'top': 72}

# Mirrors STONE_DETAILS in src/modules/palette/constants.ts.
STONE_SEEDS = {
    'basalt': '#3B3C36',
    'slate': '#576675',
    'travertine': '#BFA06A',
    'turquoise': '#3AA8B8',
    'lapis-lazuli': '#26619C',
    'sodalite': '#3B3F94',
    'amethyst': '#9966CC',
    'porphyry': '#7C3245',
    'rhodochrosite': '#C7466B',
    'garnet': '#A02B3A',
    'cinnabar': '#E34234',
    'carnelian': '#C1440E',
    'amber': '#E0A020',
    'ochre': '#CC7722',
    'sulfur': '#D9C400',
    'serpentine': '#6B8E23',
    'malachite': '#10A36A',
    'verdigris': '#43B3AE',
}

# How far the blob's colour is pulled towards black from the tile colour.
BLOB_DARKEN = 0.45

# The stone whose seed colours the shipped app icon.
ICON_STONE = 'serpentine'

# Android hands the launcher a foreground layer and only guarantees the middle
# 72dp of 108dp survives its mask, so contained art sits inside that fraction.
SAFE_ZONE_RATIO = 72 / 108

# A contained stele leaves this much of the canvas as margin around it.
MARK_HEIGHT_RATIO = 0.86

SVG_OPEN = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas} {canvas}" \
preserveAspectRatio="xMidYMid meet" width="100%" height="100%" role="img" aria-label="Stele">'''

TEMPLATE = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas} {canvas}" \
preserveAspectRatio="xMidYMid meet" width="100%" height="100%" role="img" aria-label="Stele">
  <defs>
    <clipPath id="square"><rect width="{canvas}" height="{canvas}"/></clipPath>
  </defs>
  <g clip-path="url(#square)">
    <rect width="{canvas}" height="{canvas}" fill="{tile}"/>
    <circle cx="{canvas}" cy="{canvas}" r="{blob_radius}" fill="{blob}" opacity="{blob_opacity}"/>
    <g transform="translate({x} {y}) scale({scale})">
      <path fill="{front}" d="{d_front}"/>
      <path fill="{facet}" d="{d_facet}"/>
      <path fill="{side}" d="{d_side}"/>
      <path fill="{ink}" fill-rule="evenodd" d="{d_outline}"/>
      <path fill="{ink}" d="{d_inscription}"/>
    </g>
  </g>
</svg>
'''


def darken(hex_color, amount):
    """Pull a hex colour towards black by `amount` (0 keeps it, 1 is black)."""
    channels = (hex_color[1:3], hex_color[3:5], hex_color[5:7])
    scaled = (round(int(c, 16) * (1 - amount)) for c in channels)
    return '#%02X%02X%02X' % tuple(scaled)


def read_source():
    """Return (outline, front, side, facet, inscription) path data."""
    outline, inscription = re.findall(
        r'<path[^>]*\bd="([^"]*)"', open(SOURCE).read())
    holes = sorted(
        subpaths(outline),
        key=lambda s: (lambda b: (b[2] - b[0]) * (b[3] - b[1]))(bbox(s)),
        reverse=True)
    _outer, front, side, facet = holes
    return outline, front, side, facet, inscription


def render(parts, tile, blob_radius_ratio=BLOB_RADIUS_RATIO):
    outline, front, side, facet, inscription = parts
    scale = CANVAS * CROP['width_ratio'] / STELE_WIDTH
    return TEMPLATE.format(
        canvas=int(CANVAS),
        tile=tile,
        blob=darken(tile, BLOB_DARKEN),
        blob_radius=round(CANVAS * blob_radius_ratio, 1),
        blob_opacity=BLOB_OPACITY,
        x=round((CANVAS - STELE_WIDTH * scale) / 2, 2),
        y=CROP['top'],
        scale=round(scale, 5),
        d_outline=outline,
        d_front=front,
        d_side=side,
        d_facet=facet,
        d_inscription=inscription,
        **GRANODIORITE)


def contained(parts, tones, height_ratio, silhouette_only=False):
    """The stele alone on transparency, scaled to fit `height_ratio` of the
    canvas. Used for the Android foreground, the monochrome layer and the
    splash mark, none of which may bleed off the square."""
    outline, front, side, facet, inscription = parts
    scale = CANVAS * height_ratio / STELE_HEIGHT
    x = round((CANVAS - STELE_WIDTH * scale) / 2, 2)
    y = round((CANVAS - STELE_HEIGHT * scale) / 2, 2)
    if silhouette_only:
        body = f'<path fill="{tones["ink"]}" d="{subpaths(outline)[0]}"/>'
    else:
        body = (f'<path fill="{tones["front"]}" d="{front}"/>'
                f'<path fill="{tones["facet"]}" d="{facet}"/>'
                f'<path fill="{tones["side"]}" d="{side}"/>'
                f'<path fill="{tones["ink"]}" fill-rule="evenodd" d="{outline}"/>'
                f'<path fill="{tones["ink"]}" d="{inscription}"/>')
    return (f'{SVG_OPEN.format(canvas=int(CANVAS))}'
            f'<g transform="translate({x} {y}) scale({round(scale, 5)})">{body}</g></svg>\n')


# Four inscription bars in the source artwork's coordinate space, ragged at
# the right edge, sized to survive where the traced glyphs turn to grey.
# Each entry is (x, y, width); every bar shares REDUCED_BAR_HEIGHT.
REDUCED_BARS = ((112, 300, 470), (112, 430, 545), (112, 560, 405), (112, 690, 500))
REDUCED_BAR_HEIGHT = 62
REDUCED_BAR_RADIUS = 18


def reduced(parts, tile):
    """The launcher-size icon: same silhouette and facets, but the traced
    inscription swapped for a handful of bars thick enough to read small."""
    outline, front, side, facet, _inscription = parts
    scale = CANVAS * CROP['width_ratio'] / STELE_WIDTH
    bars = ''.join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{REDUCED_BAR_HEIGHT}" '
        f'rx="{REDUCED_BAR_RADIUS}"/>'
        for x, y, w in REDUCED_BARS)
    return f'''{SVG_OPEN.format(canvas=int(CANVAS))}
  <defs>
    <clipPath id="square"><rect width="{int(CANVAS)}" height="{int(CANVAS)}"/></clipPath>
    <clipPath id="face" clipPathUnits="userSpaceOnUse"><path d="{front}"/></clipPath>
  </defs>
  <g clip-path="url(#square)">
    <rect width="{int(CANVAS)}" height="{int(CANVAS)}" fill="{tile}"/>
    <circle cx="{int(CANVAS)}" cy="{int(CANVAS)}" r="{round(CANVAS * BLOB_RADIUS_RATIO, 1)}" \
fill="{darken(tile, BLOB_DARKEN)}" opacity="{BLOB_OPACITY}"/>
    <g transform="translate({round((CANVAS - STELE_WIDTH * scale) / 2, 2)} {CROP['top']}) \
scale({round(scale, 5)})">
      <path fill="{GRANODIORITE['front']}" d="{front}"/>
      <path fill="{GRANODIORITE['facet']}" d="{facet}"/>
      <path fill="{GRANODIORITE['side']}" d="{side}"/>
      <g clip-path="url(#face)" fill="{GRANODIORITE['ink']}">{bars}</g>
      <path fill="{GRANODIORITE['ink']}" fill-rule="evenodd" d="{outline}"/>
    </g>
  </g>
</svg>
'''


def ground(tile):
    """The tile colour and its blob, with no stele. The Android background."""
    return (f'{SVG_OPEN.format(canvas=int(CANVAS))}'
            f'<rect width="{int(CANVAS)}" height="{int(CANVAS)}" fill="{tile}"/>'
            f'<circle cx="{int(CANVAS)}" cy="{int(CANVAS)}" '
            f'r="{round(CANVAS * BLOB_RADIUS_RATIO, 1)}" '
            f'fill="{darken(tile, BLOB_DARKEN)}" opacity="{BLOB_OPACITY}"/></svg>\n')


def write(directory, name, markup):
    os.makedirs(directory, exist_ok=True)
    with open(os.path.join(directory, name), 'w') as handle:
        handle.write(markup)


def main():
    parts = read_source()

    stones = os.path.join(OUTPUT, 'stones')
    for stone, seed in STONE_SEEDS.items():
        write(stones, f'icon-{stone}.svg', render(parts, seed))

    seed = STONE_SEEDS[ICON_STONE]
    monochrome = dict(GRANODIORITE, ink='#FFFFFF')
    app = os.path.join(OUTPUT, 'app')
    write(app, 'icon.svg', render(parts, seed))
    write(app, 'android-icon-background.svg', ground(seed))
    write(app, 'android-icon-foreground.svg',
          contained(parts, GRANODIORITE, SAFE_ZONE_RATIO))
    write(app, 'android-icon-monochrome.svg',
          contained(parts, monochrome, SAFE_ZONE_RATIO, silhouette_only=True))
    write(app, 'splash-icon.svg', contained(parts, GRANODIORITE, MARK_HEIGHT_RATIO))
    write(app, 'icon-small.svg', reduced(parts, seed))
    write(app, 'favicon.svg', reduced(parts, seed))

    print(f'wrote {len(STONE_SEEDS)} stone icons to {stones}\n'
          f'wrote {len(os.listdir(app))} app assets to {app}')


if __name__ == '__main__':
    main()
