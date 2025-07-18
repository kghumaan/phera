const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeForWhatsApp() {
  const inputPath = path.join(__dirname, '../public/images/couple/imessage.png');
  const outputPathOptimized = path.join(__dirname, '../public/images/couple/imessage-optimized.jpg');
  const outputPathSquare = path.join(__dirname, '../public/images/couple/whatsapp-square.jpg');

  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error('Input file not found:', inputPath);
      return;
    }

    console.log('Starting image optimization for WhatsApp...');
    
    // Create optimized rectangular version (1200x630, under 300KB) - using JPEG for better compression
    console.log('Creating optimized rectangular version...');
    await sharp(inputPath)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true,
        optimizeScans: true
      })
      .toFile(outputPathOptimized);

    // Check file size and reduce quality if needed
    let stats = fs.statSync(outputPathOptimized);
    let quality = 85;
    
    while (stats.size > 300 * 1024 && quality > 30) { // 300KB limit
      quality -= 10;
      console.log(`File too large (${Math.round(stats.size / 1024)}KB), reducing quality to ${quality}%...`);
      
      await sharp(inputPath)
        .resize(1200, 630, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: quality,
          progressive: true,
          optimizeScans: true
        })
        .toFile(outputPathOptimized);
      
      stats = fs.statSync(outputPathOptimized);
    }

    console.log(`Rectangular version created: ${Math.round(stats.size / 1024)}KB (JPEG format)`);

    // Create square version (1200x1200, under 300KB) - using JPEG for better compression
    console.log('Creating square version for WhatsApp...');
    
    await sharp(inputPath)
      .resize(1200, 1200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true,
        optimizeScans: true
      })
      .toFile(outputPathSquare);

    // Check file size and reduce quality if needed
    stats = fs.statSync(outputPathSquare);
    quality = 85;
    
    while (stats.size > 300 * 1024 && quality > 30) { // 300KB limit
      quality -= 10;
      console.log(`Square file too large (${Math.round(stats.size / 1024)}KB), reducing quality to ${quality}%...`);
      
      await sharp(inputPath)
        .resize(1200, 1200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: quality,
          progressive: true,
          optimizeScans: true
        })
        .toFile(outputPathSquare);
      
      stats = fs.statSync(outputPathSquare);
    }

    // If still too large, try smaller dimensions
    if (stats.size > 300 * 1024) {
      console.log('Still too large, trying smaller dimensions (800x800)...');
      await sharp(inputPath)
        .resize(800, 800, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 85,
          progressive: true,
          optimizeScans: true
        })
        .toFile(outputPathSquare);
      
      stats = fs.statSync(outputPathSquare);
    }

    console.log(`Square version created: ${Math.round(stats.size / 1024)}KB (JPEG format)`);
    
    console.log('✅ WhatsApp optimization complete!');
    console.log('\nFiles created:');
    console.log(`- ${outputPathOptimized}`);
    console.log(`- ${outputPathSquare}`);
    console.log('\nBoth files are optimized for WhatsApp link previews (under 300KB each).');
    
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

// Run the optimization
optimizeForWhatsApp(); 