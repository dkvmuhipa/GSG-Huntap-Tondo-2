import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Base SVG for standard icon (512x512)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#1e3a8a"/>
  <g transform="translate(256, 256) scale(0.85) translate(-256, -256)">
    <path d="M96 416V144C96 130.745 106.745 120 120 120H280C293.255 120 304 130.745 304 144V416" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M304 200H392C405.255 200 416 210.745 416 224V416" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M48 416H464" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 200H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 280H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 360H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

// Maskable SVG with solid full-bleed background and 70% safe zone scaling
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#1e3a8a"/>
  <g transform="translate(256, 256) scale(0.68) translate(-256, -256)">
    <path d="M96 416V144C96 130.745 106.745 120 120 120H280C293.255 120 304 130.745 304 144V416" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M304 200H392C405.255 200 416 210.745 416 224V416" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M48 416H464" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 200H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 280H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 360H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

// Apple Touch Icon (180x180 with solid full-bleed background)
const appleTouchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="180" height="180">
  <rect width="512" height="512" fill="#1e3a8a"/>
  <g transform="translate(256, 256) scale(0.75) translate(-256, -256)">
    <path d="M96 416V144C96 130.745 106.745 120 120 120H280C293.255 120 304 130.745 304 144V416" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M304 200H392C405.255 200 416 210.745 416 224V416" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M48 416H464" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 200H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 280H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 360H240" stroke="white" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

async function run() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Generate pwa-512x512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 2. Generate pwa-192x192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 3. Generate pwa-maskable-512x512.png (with 20% safe zone padding)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 4. Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(appleTouchSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Also update logo.svg with the well-proportioned icon
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), standardSvg);
  console.log('Updated logo.svg');
}

run().catch(console.error);
