#!/bin/bash
# Generate PWA icons for each app role
# Uses the existing icon-512.png as base and adds a colored badge overlay

cd "$(dirname "$0")/.."

# Vendor icon - green badge with store icon
cat > /tmp/badge-vendor.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#6f46ff"/>
  <text x="256" y="220" text-anchor="middle" font-size="180" font-weight="900" font-family="Arial,sans-serif" fill="white">В</text>
  <text x="256" y="340" text-anchor="middle" font-size="60" font-weight="700" font-family="Arial,sans-serif" fill="rgba(255,255,255,0.9)">МАРКЕТ</text>
  <!-- Green badge -->
  <circle cx="410" cy="410" r="100" fill="#16a34a" stroke="white" stroke-width="12"/>
  <path d="M370 410 L390 390 L390 430 L430 430 L430 390 L450 410 L410 370 Z" fill="white" transform="rotate(180,410,410)"/>
  <rect x="385" y="405" width="50" height="30" rx="4" fill="white"/>
</svg>
SVG

# Courier icon - orange badge with delivery icon
cat > /tmp/badge-courier.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#6f46ff"/>
  <text x="256" y="220" text-anchor="middle" font-size="180" font-weight="900" font-family="Arial,sans-serif" fill="white">В</text>
  <text x="256" y="340" text-anchor="middle" font-size="60" font-weight="700" font-family="Arial,sans-serif" fill="rgba(255,255,255,0.9)">МАРКЕТ</text>
  <!-- Orange badge -->
  <circle cx="410" cy="410" r="100" fill="#ea580c" stroke="white" stroke-width="12"/>
  <path d="M360 420 h60 l20-20 h20 v40 h-100 z M400 440 a15 15 0 1 0 0 1 M440 440 a15 15 0 1 0 0 1" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
SVG

# Admin icon - red badge with shield icon
cat > /tmp/badge-admin.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#6f46ff"/>
  <text x="256" y="220" text-anchor="middle" font-size="180" font-weight="900" font-family="Arial,sans-serif" fill="white">В</text>
  <text x="256" y="340" text-anchor="middle" font-size="60" font-weight="700" font-family="Arial,sans-serif" fill="rgba(255,255,255,0.9)">МАРКЕТ</text>
  <!-- Red/crimson badge -->
  <circle cx="410" cy="410" r="100" fill="#dc2626" stroke="white" stroke-width="12"/>
  <path d="M410 355 l45 20 v35 c0 30-20 50-45 60 c-25-10-45-30-45-60 v-35 z" fill="none" stroke="white" stroke-width="8" stroke-linejoin="round"/>
  <path d="M395 410 l10 10 l20-20" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
SVG

echo "Converting vendor icon..."
rsvg-convert -w 512 -h 512 /tmp/badge-vendor.svg -o public/icon-vendor-512.png
convert public/icon-vendor-512.png -resize 192x192 public/icon-vendor-192.png
convert public/icon-vendor-512.png -resize 180x180 public/icon-vendor-apple.png

echo "Converting courier icon..."
rsvg-convert -w 512 -h 512 /tmp/badge-courier.svg -o public/icon-courier-512.png
convert public/icon-courier-512.png -resize 192x192 public/icon-courier-192.png
convert public/icon-courier-512.png -resize 180x180 public/icon-courier-apple.png

echo "Converting admin icon..."
rsvg-convert -w 512 -h 512 /tmp/badge-admin.svg -o public/icon-admin-512.png
convert public/icon-admin-512.png -resize 192x192 public/icon-admin-192.png
convert public/icon-admin-512.png -resize 180x180 public/icon-admin-apple.png

# Also create maskable versions (with padding)
for role in vendor courier admin; do
  convert "public/icon-${role}-512.png" -gravity center -background none -extent 640x640 -resize 512x512 "public/icon-${role}-maskable.png"
done

echo "Done! Generated icons for vendor, courier, and admin."
ls -la public/icon-vendor-*.png public/icon-courier-*.png public/icon-admin-*.png
