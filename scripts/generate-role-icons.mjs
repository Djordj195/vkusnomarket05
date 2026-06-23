// Генерирует иконки PWA для ролей (продавец / курьер / админ) на основе
// АКТУАЛЬНОГО логотипа ВкусМаркет (public/icon-512.png — буква «В» с листьями).
// К базовому логотипу добавляется цветной бейдж роли с буквой, чтобы каждое
// приложение легко различалось на рабочем столе.
//
// Запуск: node scripts/generate-role-icons.mjs
//
// Для каждой роли создаёт:
// - public/icon-<role>-192.png
// - public/icon-<role>-512.png
// - public/icon-<role>-apple.png      (180x180, без прозрачности — для iOS)
// - public/icon-<role>-maskable.png   (512x512, фон во весь кадр для Android)

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = (name) => resolve(__dirname, "..", "public", name);

const BASE = pub("icon-512.png");

// Цвет роли = цвет темы соответствующего манифеста (см. src/lib/manifests.ts).
const ROLES = [
  { id: "vendor", color: "#16a34a", letter: "П" }, // Продавец — зелёный
  { id: "courier", color: "#ea580c", letter: "К" }, // Курьер — оранжевый
  { id: "admin", color: "#dc2626", letter: "А" }, // Админ — красный
];

// Бейдж в правом нижнем углу: цветной круг + белая буква.
function badgeSvg(color, letter) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <circle cx="388" cy="388" r="108" fill="${color}" stroke="#ffffff" stroke-width="16"/>
  <text x="388" y="388" text-anchor="middle" dominant-baseline="central"
        font-family="DejaVu Sans, Arial, sans-serif" font-size="128" font-weight="700"
        fill="#ffffff">${letter}</text>
</svg>`);
}

async function build() {
  for (const { id, color, letter } of ROLES) {
    // 512: логотип + бейдж
    const main512 = await sharp(BASE)
      .resize(512, 512, { fit: "cover" })
      .composite([{ input: badgeSvg(color, letter), top: 0, left: 0 }])
      .png()
      .toBuffer();
    await sharp(main512).toFile(pub(`icon-${id}-512.png`));
    await sharp(main512).resize(192, 192).toFile(pub(`icon-${id}-192.png`));

    // apple: без прозрачности, белый фон
    await sharp(main512)
      .resize(180, 180)
      .flatten({ background: "#ffffff" })
      .png()
      .toFile(pub(`icon-${id}-apple.png`));

    // maskable: цветной фон во весь кадр + логотип по центру (safe-area)
    const bg = {
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: color,
      },
    };
    const logoCentered = await sharp(BASE)
      .resize(320, 320, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await sharp(bg)
      .composite([{ input: logoCentered, gravity: "center" }])
      .png()
      .toFile(pub(`icon-${id}-maskable.png`));

    console.log(`Готово: icon-${id}-{192,512,apple,maskable}.png`);
  }
}

build().then(() => console.log("Все иконки ролей сгенерированы."));
