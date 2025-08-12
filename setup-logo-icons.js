#!/usr/bin/env node

/**
 * Convert the logo.jpeg to various PWA icon sizes
 * This script creates references to your logo and generates appropriate sizes
 */

const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, 'public', 'icons');
const logoPath = path.join(__dirname, 'public', 'logo.jpeg');

// Ensure icons directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Copy the original logo as the main icon
if (fs.existsSync(logoPath)) {
  // Copy original logo as 512x512 (assuming it's high res)
  fs.copyFileSync(logoPath, path.join(iconDir, 'icon-512x512.jpeg'));
  
  // Also copy as main logo reference
  fs.copyFileSync(logoPath, path.join(iconDir, 'logo.jpeg'));
  
  console.log('✅ Copied logo.jpeg to icons directory');
  
  // Create a simple HTML file to help with manual resizing
  const resizeInstructions = `
<!DOCTYPE html>
<html>
<head>
    <title>Logo Resizer Helper</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .icon-preview { margin: 10px; padding: 10px; border: 1px solid #ccc; display: inline-block; }
        img { border: 1px solid #eee; }
    </style>
</head>
<body>
    <h2>PWA Icon Sizes Needed</h2>
    <p>Here are the icon sizes needed for your PWA. You can use online tools or image editors to resize your logo:</p>
    
    <div class="icon-preview">
        <h4>72x72 (Small)</h4>
        <canvas width="72" height="72" style="background: url('logo.jpeg'); background-size: cover;"></canvas>
        <p>File: icon-72x72.jpeg</p>
    </div>
    
    <div class="icon-preview">
        <h4>96x96</h4>
        <canvas width="96" height="96" style="background: url('logo.jpeg'); background-size: cover;"></canvas>
        <p>File: icon-96x96.jpeg</p>
    </div>
    
    <div class="icon-preview">
        <h4>128x128</h4>
        <canvas width="128" height="128" style="background: url('logo.jpeg'); background-size: cover;"></canvas>
        <p>File: icon-128x128.jpeg</p>
    </div>
    
    <div class="icon-preview">
        <h4>144x144</h4>
        <canvas width="144" height="144" style="background: url('logo.jpeg'); background-size: cover;"></canvas>
        <p>File: icon-144x144.jpeg</p>
    </div>
    
    <div class="icon-preview">
        <h4>152x152</h4>
        <canvas width="152" height="152" style="background: url('logo.jpeg'); background-size: cover;"></canvas>
        <p>File: icon-152x152.jpeg</p>
    </div>
    
    <div class="icon-preview">
        <h4>192x192 (Android)</h4>
        <canvas width="192" height="192" style="background: url('logo.jpeg'); background-size: cover;"></canvas>
        <p>File: icon-192x192.jpeg</p>
    </div>
    
    <div class="icon-preview">
        <h4>384x384</h4>
        <canvas width="384" height="384" style="background: url('logo.jpeg'); background-size: cover;"></canvas>
        <p>File: icon-384x384.jpeg</p>
    </div>
    
    <div class="icon-preview">
        <h4>512x512 (Large)</h4>
        <canvas width="512" height="512" style="background: url('logo.jpeg'); background-size: cover;"></canvas>
        <p>File: icon-512x512.jpeg</p>
    </div>
    
    <h3>Quick Resize Options:</h3>
    <ul>
        <li><strong>Online:</strong> <a href="https://www.iloveimg.com/resize-image" target="_blank">iloveimg.com/resize-image</a></li>
        <li><strong>Online:</strong> <a href="https://imageresizer.com/" target="_blank">imageresizer.com</a></li>
        <li><strong>Online:</strong> <a href="https://www.photopea.com/" target="_blank">photopea.com</a> (Photoshop alternative)</li>
        <li><strong>macOS:</strong> Preview app (Tools → Adjust Size)</li>
        <li><strong>Command line:</strong> <code>sips -Z [size] logo.jpeg --out icon-[size]x[size].jpeg</code></li>
    </ul>
    
    <h3>Automation with sips (macOS):</h3>
    <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
# Run these commands in Terminal:
cd /Users/aryans.rao/projects/lostandfound/public/icons/

sips -Z 72 logo.jpeg --out icon-72x72.jpeg
sips -Z 96 logo.jpeg --out icon-96x96.jpeg  
sips -Z 128 logo.jpeg --out icon-128x128.jpeg
sips -Z 144 logo.jpeg --out icon-144x144.jpeg
sips -Z 152 logo.jpeg --out icon-152x152.jpeg
sips -Z 192 logo.jpeg --out icon-192x192.jpeg
sips -Z 384 logo.jpeg --out icon-384x384.jpeg
sips -Z 512 logo.jpeg --out icon-512x512.jpeg
    </pre>
</body>
</html>`;

  fs.writeFileSync(path.join(iconDir, 'resize-helper.html'), resizeInstructions);
  console.log('✅ Created resize helper at public/icons/resize-helper.html');
  
} else {
  console.log('❌ Logo file not found at:', logoPath);
  process.exit(1);
}

// For immediate use, let's create symbolic links or copies for all sizes using the original logo
// This way the PWA will work immediately, even if not perfectly sized
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const targetFile = path.join(iconDir, `icon-${size}x${size}.jpeg`);
  if (!fs.existsSync(targetFile)) {
    // Copy the original logo for each size (they'll all be the same until manually resized)
    fs.copyFileSync(logoPath, targetFile);
    console.log(`📋 Created temporary icon-${size}x${size}.jpeg (same as original)`);
  }
});

// Create favicon
fs.copyFileSync(logoPath, path.join(iconDir, 'favicon.jpeg'));
console.log('✅ Created favicon.jpeg');

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Open public/icons/resize-helper.html in your browser');
console.log('2. Use the sips commands (macOS) or online tools to create properly sized icons');
console.log('3. Replace the temporary icons with properly sized versions');
console.log('\nFor now, your PWA will use your logo (may not be perfectly sized) for all icon sizes.');
