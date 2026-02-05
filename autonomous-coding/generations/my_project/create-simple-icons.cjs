// Create simple valid PNG files for PWA icons
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// This is a minimal valid 1x1 transparent PNG in base64
// For PWA purposes, browsers will accept this and scale it
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Write minimal PNG files - these are valid and will work for PWA installation
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), minimalPng);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), minimalPng);

console.log('Created minimal valid PNG icons for PWA');
console.log('These are placeholder 1x1 PNGs that browsers will accept for PWA installation');
console.log('For production, replace with proper 192x192 and 512x512 PNG icons');
