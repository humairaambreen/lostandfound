#!/usr/bin/env node

// Simple icon generator for PWA
// This creates basic colored square icons with the app initial "L&F"

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Create SVG template
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#A4C3A2" rx="20"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">L&F</text>
</svg>
`;

// For now, just create placeholder files that can be replaced with actual icons
sizes.forEach(size => {
  const svgContent = createSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconDir, filename);
  
  // Create a placeholder file with instructions
  const instructions = `# Placeholder for ${filename}
# 
# This is a placeholder file for the ${size}x${size} PWA icon.
# Replace this file with an actual PNG icon of size ${size}x${size} pixels.
# 
# The icon should represent the Lost and Found app and be saved as:
# ${filename}
# 
# SVG template for reference:
${svgContent}
`;
  
  fs.writeFileSync(filepath.replace('.png', '.placeholder'), instructions);
});

console.log('Icon placeholders created. Replace with actual PNG icons.');
console.log('Icon sizes needed:', sizes.map(s => `${s}x${s}`).join(', '));
