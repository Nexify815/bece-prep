const sharp = require("sharp");
const path = require("path");

const outDir = path.join(__dirname, "..", "public", "icons");

// Brand colors
const green = "#58CC02";
const greenDark = "#3F9600";
const white = "#FFFFFF";

// Simple mascot: a smiling rounded-square tile with a white graduation cap + open book
// We compose a full-bleed icon (maskable) and a normal icon.

function svgIcon(maskable) {
  // maskable: content scaled to ~66% center safe zone inside full-bleed color
  const pad = maskable ? 18 : 4; // percent padding for safe zone
  const cx = 50;
  const cy = 50;
  const size = maskable ? 66 : 92; // content box percentage

  const x = cx - size / 2;
  const y = cy - size / 2 - 4; // nudge up slightly

  // Graduation cap (mortarboard)
  const capTopW = size * 0.62;
  const capH = size * 0.14;
  const capX = cx - capTopW / 2;
  const capY = y + size * 0.18;
  const capBotW = size * 0.26;
  const capBotX = cx - capBotW / 2;
  const capBotY = capY + capH - 1;
  const tasselX = capX + capTopW + size * 0.04;
  const tasselY = capY + capH / 2;

  // Book (open)
  const bookW = size * 0.86;
  const bookH = size * 0.34;
  const bookX = cx - bookW / 2;
  const bookY = cy + size * 0.08;

  return `
<svg width="1024" height="1024" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${green}"/>
      <stop offset="1" stop-color="${greenDark}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="100" height="100" fill="url(#bg)"/>
  <!-- graduation cap -->
  <polygon points="${capX},${capY} ${capX + capTopW},${capY} ${cx},${capY + capH + size*0.10}"
      fill="${white}" opacity="0.96"/>
  <rect x="${capX + capTopW * 0.28}" y="${capY + capH + size*0.02}"
      width="${capTopW * 0.44}" height="${size*0.10}" fill="${white}" opacity="0.96"/>
  <!-- tassel -->
  <line x1="${tasselX}" y1="${tasselY}" x2="${tasselX + size*0.10}" y2="${tasselY + size*0.16}"
      stroke="${white}" stroke-width="${size*0.035}" stroke-linecap="round"/>
  <circle cx="${tasselX + size*0.10}" cy="${tasselY + size*0.20}" r="${size*0.028}" fill="${white}"/>
  <!-- open book -->
  <g fill="${white}" opacity="0.97">
    <path d="M ${bookX} ${bookY} L ${cx} ${bookY - size*0.06} L ${bookX + bookW} ${bookY}
             L ${bookX + bookW} ${bookY + bookH} L ${cx} ${bookY + bookH + size*0.06}
             L ${bookX} ${bookY + bookH} Z"/>
    <path d="M ${cx} ${bookY - size*0.06} L ${cx} ${bookY + bookH + size*0.06}"
        stroke="${greenDark}" stroke-width="${size*0.02}" fill="none"/>
  </g>
  <!-- three content lines on the book (readable text) -->
  <g fill="${greenDark}" opacity="0.85">
    <rect x="${bookX + size*0.09}" y="${bookY + size*0.10}" width="${cx - bookX - size*0.16}" height="${size*0.022}" rx="${size*0.011}"/>
    <rect x="${bookX + size*0.09}" y="${bookY + size*0.17}" width="${cx - bookX - size*0.16}" height="${size*0.022}" rx="${size*0.011}"/>
    <rect x="${cx + size*0.06}" y="${bookY + size*0.10}" width="${bookX + bookW - cx - size*0.15}" height="${size*0.022}" rx="${size*0.011}"/>
    <rect x="${cx + size*0.06}" y="${bookY + size*0.17}" width="${bookX + bookW - cx - size*0.15}" height="${size*0.022}" rx="${size*0.011}"/>
  </g>
</svg>`;
}

async function build() {
  await sharp(Buffer.from(svgIcon(true)))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(outDir, "icon-1024.png"));
  await sharp(Buffer.from(svgIcon(true)))
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, "icon-512.png"));
  await sharp(Buffer.from(svgIcon(false)))
    .resize(192, 192)
    .png()
    .toFile(path.join(outDir, "icon-192.png"));

  // Config: apple touch icon (180)
  await sharp(Buffer.from(svgIcon(false)))
    .resize(180, 180)
    .png()
    .toFile(path.join(outDir, "apple-touch-icon.png"));

  console.log("Icons generated:", outDir);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
