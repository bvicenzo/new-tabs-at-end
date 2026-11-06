#!/bin/sh
# Renders the brand's SVG sources into the PNGs the extension, the store listing and the site use.
# Needs rsvg-convert (librsvg) and ImageMagick 7. The PNGs are committed, so `npm run build` does not need either.
set -eu
cd "$(dirname "$0")"

# Toolbar sizes come from the pixel-aligned small icon; the larger ones from the full icon.
rsvg-convert -w 16 icon-small.svg -o ../static/icons/icon-16.png
rsvg-convert -w 32 icon.svg -o ../static/icons/icon-32.png
rsvg-convert -w 48 icon.svg -o ../static/icons/icon-48.png
# The Web Store asks for 96x96 of artwork centred in a 128x128 canvas.
rsvg-convert -w 96 icon.svg | magick - -background none -gravity center -extent 128x128 PNG32:../static/icons/icon-128.png

for image in promo-small marquee screenshot-1; do
  rsvg-convert "store/$image.svg" | magick - -background '#0F172A' -flatten -alpha off "store/$image.png"
done

cp icon.svg ../site/assets/icon.svg
rsvg-convert -w 180 icon.svg -o ../site/assets/apple-touch-icon.png
rsvg-convert og-image.svg | magick - -alpha off ../site/assets/og-image.png
