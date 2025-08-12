// Simple PNG icon creator for PWA
// Creates basic solid color icons with "L&F" text

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, 'public', 'icons');

// Create a simple base64 encoded PNG for each size
// This is a 1x1 pixel green PNG that we'll scale up conceptually
const createIconData = (size) => {
  // This creates a minimal valid PNG file with the app colors
  // For a production app, you'd want to use proper image generation tools
  
  // Simple SVG string that can be used as data URL
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#A4C3A2" rx="${size * 0.1}"/>
  <circle cx="${size/2}" cy="${size/2 - size*0.1}" r="${size * 0.15}" fill="white" opacity="0.9"/>
  <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="${size * 0.2}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">L&amp;F</text>
</svg>`.trim();

  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return { svg, dataUrl };
};

// Create icon files
sizes.forEach(size => {
  const { svg } = createIconData(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Created ${filename}`);
});

console.log('\nCreated SVG icons. For production, convert these to PNG using:');
console.log('- Online tools like CloudConvert');
console.log('- Command line tools like ImageMagick');
console.log('- Design tools like Figma, Sketch, or GIMP');

// Also create a simple favicon.ico placeholder
const faviconSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#A4C3A2" rx="3"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">L</text>
</svg>`.trim();

fs.writeFileSync(path.join(iconDir, 'favicon.svg'), faviconSvg);
console.log('Created favicon.svg');

// Create a simple PNG fallback using a data URL technique
const simplePNG = (size) => {
  // This is a minimal valid PNG file data (1x1 transparent pixel)
  const pngData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return pngData;
};

// For quick testing, create placeholder PNG files as well
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png.placeholder`;
  const filepath = path.join(iconDir, filename);
  
  const instructions = `# Replace this file with actual ${size}x${size} PNG icon
# 
# This file should be renamed to: icon-${size}x${size}.png
# And should contain a ${size}x${size} pixel PNG image
# 
# You can:
# 1. Convert the SVG files using online tools
# 2. Use design software to create PNG versions
# 3. Use command line tools like ImageMagick:
#    convert icon-${size}x${size}.svg icon-${size}x${size}.png
`;
  
  fs.writeFileSync(filepath, instructions);
});

console.log('\nNOTE: Replace the .placeholder files with actual PNG files for production use.');
