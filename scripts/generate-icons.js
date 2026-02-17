/**
 * Script to generate PNG icons from SVG for PWA
 * Requires: sharp (npm install sharp)
 * 
 * Usage: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'icon.svg');

async function generateIcons() {
  try {
    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.error('❌ icon.svg not found in public directory');
      process.exit(1);
    }

    console.log('🔄 Generating icons from SVG...');

    // Generate 192x192 icon with brand blue background (#2979FF)
    await sharp(svgPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 41, g: 121, b: 255, alpha: 1 } // #2979FF
      })
      .png({ 
        compressionLevel: 9,
        adaptiveFiltering: true,
        force: true
      })
      .toFile(path.join(publicDir, 'icon-192x192.png'));
    console.log('✅ Created icon-192x192.png');

    // Generate 512x512 icon with brand blue background (#2979FF)
    await sharp(svgPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 41, g: 121, b: 255, alpha: 1 } // #2979FF
      })
      .png({ 
        compressionLevel: 9,
        adaptiveFiltering: true,
        force: true
      })
      .toFile(path.join(publicDir, 'icon-512x512.png'));
    console.log('✅ Created icon-512x512.png');

    console.log('🎉 All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\n💡 Alternative: Use an online converter or ImageMagick:');
    console.log('   - Online: https://convertio.co/svg-png/');
    console.log('   - ImageMagick: magick icon.svg -resize 192x192 icon-192x192.png');
    process.exit(1);
  }
}

generateIcons();

