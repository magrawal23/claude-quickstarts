// Simple script to create placeholder icons for PWA
const fs = require('fs');
const path = require('path');

// Create SVG icons that can serve as temporary placeholders
const createSvgIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#CC785C"/>
  <text x="50%" y="50%" font-size="${size * 0.4}" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold">C</text>
</svg>`;
};

const publicDir = path.join(__dirname, 'public');

// Create 192x192 icon
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), createSvgIcon(192));
console.log('Created icon-192.svg');

// Create 512x512 icon
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), createSvgIcon(512));
console.log('Created icon-512.svg');

console.log('Icon generation complete. Note: For production, convert SVG to PNG.');
