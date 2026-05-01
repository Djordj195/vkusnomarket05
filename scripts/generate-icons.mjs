// Скрипт генерирует PNG-иконки приложения из встроенного SVG-логотипа.
// Запуск: node scripts/generate-icons.mjs
//
// Создаёт:
// - public/icon-192.png
// - public/icon-512.png
// - public/icon-maskable.png (с safe-area для адаптивных иконок Android)
// - public/apple-touch-icon.png
// - public/favicon.ico
// - public/og-image.png (для соц. сетей)
//
// В базе — зелёный круглый фон с белой сумкой и оранжевой каплей.

import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = (name) => resolve(__dirname, "..", "public", name);

const baseLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g1)"/>
  <path d="M18 26 h 28 l -2 22 a 4 4 0 0 1 -4 4 H 24 a 4 4 0 0 1 -4 -4 z" fill="#ffffff"/>
  <path d="M24 26 v -4 a 8 8 0 0 1 16 0 v 4" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
  <circle cx="32" cy="40" r="6" fill="url(#g2)"/>
  <path d="M32 32 c 2 -3 5 -2 5 -2 c 0 3 -2 4 -5 4 z" fill="#15803d"/>
</svg>
`;

// Maskable: фон должен покрывать всё, контент — в safe-area (центр 80%).
// Делаем сплошной зелёный фон + лого по центру меньшего размера.
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#g1)"/>
  <g transform="translate(20 20) scale(0.9375)">
    <path d="M18 26 h 28 l -2 22 a 4 4 0 0 1 -4 4 H 24 a 4 4 0 0 1 -4 -4 z" fill="#ffffff"/>
    <path d="M24 26 v -4 a 8 8 0 0 1 16 0 v 4" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="32" cy="40" r="6" fill="url(#g2)"/>
    <path d="M32 32 c 2 -3 5 -2 5 -2 c 0 3 -2 4 -5 4 z" fill="#15803d"/>
  </g>
</svg>
`;

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(900 200) scale(4.5)">
    <rect width="64" height="64" rx="14" fill="#ffffff"/>
    <path d="M18 26 h 28 l -2 22 a 4 4 0 0 1 -4 4 H 24 a 4 4 0 0 1 -4 -4 z" fill="url(#g1)"/>
    <path d="M24 26 v -4 a 8 8 0 0 1 16 0 v 4" fill="none" stroke="url(#g1)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="32" cy="40" r="6" fill="url(#g2)"/>
  </g>
  <text x="80" y="240" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-3">ВКУСНОМАРКЕТ</text>
  <text x="80" y="320" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="34" font-weight="600" fill="#dcfce7">Доставка свежих продуктов</text>
  <text x="80" y="368" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="34" font-weight="600" fill="#dcfce7">и готовой еды по г. Кизляр</text>
  <rect x="80" y="440" width="320" height="84" rx="42" fill="#fb923c"/>
  <text x="240" y="494" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff">Открыть каталог</text>
</svg>
`;

async function svgToPng(svg, outPath, size) {
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain" })
    .png()
    .toBuffer();
  await writeFile(outPath, buf);
  console.log("Wrote", outPath);
}

async function svgToPngWH(svg, outPath, w, h) {
  const buf = await sharp(Buffer.from(svg))
    .resize(w, h, { fit: "contain" })
    .png()
    .toBuffer();
  await writeFile(outPath, buf);
  console.log("Wrote", outPath);
}

async function svgToIco(svg, outPath, size) {
  // Простой ICO - используем PNG с расширением .ico (большинство браузеров принимают)
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain" })
    .png()
    .toBuffer();
  await writeFile(outPath, buf);
  console.log("Wrote", outPath);
}

await svgToPng(baseLogoSvg, out("icon-192.png"), 192);
await svgToPng(baseLogoSvg, out("icon-512.png"), 512);
await svgToPng(maskableSvg, out("icon-maskable.png"), 512);
await svgToPng(baseLogoSvg, out("apple-touch-icon.png"), 180);
await svgToIco(baseLogoSvg, out("favicon.ico"), 64);
await svgToPngWH(ogSvg, out("og-image.png"), 1200, 630);

console.log("Done.");
