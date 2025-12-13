// Script to generate iOS icons and splash screens
// Run: node scripts/generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG icon content matching the orb design (with background for iOS)
const createIconSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" fill="#1a1a2e"/>
  <defs>
    <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:rgb(200,255,255);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(0,100,255);stop-opacity:1" />
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <circle cx="256" cy="256" r="140" fill="url(#grad1)" filter="url(#glow)" />
  <circle cx="256" cy="256" r="170" fill="none" stroke="#00ffff" stroke-width="12" filter="url(#glow)" opacity="0.8" />
</svg>`;

// Create splash screen SVG
const createSplashSVG = (width, height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1a1a2e"/>
  <defs>
    <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:rgb(200,255,255);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(0,100,255);stop-opacity:1" />
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <circle cx="${width / 2}" cy="${height / 2 - 50}" r="${Math.min(width, height) * 0.15}" fill="url(#grad1)" filter="url(#glow)" />
  <circle cx="${width / 2}" cy="${height / 2 - 50}" r="${Math.min(width, height) * 0.18}" fill="none" stroke="#00ffff" stroke-width="8" filter="url(#glow)" opacity="0.8" />
  <text x="${width / 2}" y="${height / 2 + Math.min(width, height) * 0.2}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.min(width, height) * 0.06}" fill="#fff" text-anchor="middle" font-weight="300">Orb</text>
</svg>`;

// Icon sizes for iOS
const iconSizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Splash screen sizes
const splashSizes = [
    { width: 750, height: 1334 },
    { width: 1242, height: 2208 },
    { width: 1125, height: 2436 },
    { width: 828, height: 1792 },
    { width: 1242, height: 2688 },
    { width: 1080, height: 2340 },
    { width: 1170, height: 2532 },
    { width: 1284, height: 2778 },
    { width: 1179, height: 2556 },
    { width: 1290, height: 2796 },
    { width: 1536, height: 2048 },
    { width: 1668, height: 2388 },
    { width: 2048, height: 2732 },
];

// Create directories
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const splashDir = path.join(__dirname, '..', 'public', 'splash');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

// Generate icon SVGs
console.log('Generating icon SVGs...');
iconSizes.forEach(size => {
    const svg = createIconSVG(size);
    const filename = path.join(iconsDir, `icon-${size}.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`  Created: icon-${size}.svg`);
});

// Generate splash screen SVGs
console.log('\nGenerating splash screen SVGs...');
splashSizes.forEach(({ width, height }) => {
    const svg = createSplashSVG(width, height);
    const filename = path.join(splashDir, `splash-${width}x${height}.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`  Created: splash-${width}x${height}.svg`);
});

console.log('\n✅ SVG icons and splash screens generated!');
console.log('\nThe app is now ready for iPhone installation!');
console.log('To install on iPhone:');
console.log('  1. Deploy to HTTPS (required for PWA)');
console.log('  2. Open in Safari on iPhone');
console.log('  3. Tap Share button → "Add to Home Screen"');
