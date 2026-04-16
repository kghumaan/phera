#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Sample wedding celebration GIFs for testing
const sampleGifs = [
  {
    name: 'wedding-celebration.gif',
    description: 'Beautiful Indian wedding celebration with fireworks and dancing',
    // This is a sample URL - you'll need to replace with actual GIF URLs
    url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
    size: '1200x630'
  },
  {
    name: 'wedding-celebration-2.gif', 
    description: 'Romantic wedding couple with flower petals',
    url: 'https://media.giphy.com/media/3o6Zt9PivJAtA1xXyg/giphy.gif',
    size: '1200x630'
  },
  {
    name: 'wedding-celebration-3.gif',
    description: 'Traditional Indian wedding with colors and celebration',
    url: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    size: '1200x630'
  }
];

async function downloadGif(gif) {
  const outputDir = path.join(__dirname, '..', 'public', 'images', 'couple');
  const outputPath = path.join(outputDir, gif.name);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`📥 Downloading ${gif.description}...`);
  console.log(`🎯 URL: ${gif.url}`);
  console.log(`📁 Saving to: ${outputPath}`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(gif.url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${gif.name}`);
        
        // Try to get file size
        try {
          const stats = fs.statSync(outputPath);
          const fileSizeInBytes = stats.size;
          const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
          console.log(`📊 File size: ${fileSizeInMB} MB`);
        } catch (err) {
          console.log('📊 Could not determine file size');
        }
        
        resolve(outputPath);
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function optimizeGif(inputPath, outputPath) {
  console.log(`🎨 Optimizing GIF for social sharing...`);
  
  try {
    // Try to use ffmpeg to optimize and resize the GIF
    const command = `ffmpeg -i "${inputPath}" -vf "scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:black" -y "${outputPath}"`;
    
    execSync(command, { stdio: 'inherit' });
    console.log(`✨ Optimized GIF saved to: ${outputPath}`);
    
    // Get optimized file size
    const stats = fs.statSync(outputPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Optimized size: ${fileSizeInMB} MB`);
    
  } catch (error) {
    console.log(`⚠️  Could not optimize GIF (ffmpeg not available). Using original.`);
    console.log(`💡 Install ffmpeg for GIF optimization: brew install ffmpeg (Mac) or apt install ffmpeg (Ubuntu)`);
    
    // Copy original file if optimization fails
    fs.copyFileSync(inputPath, outputPath);
  }
}

async function main() {
  console.log('🎉 Wedding GIF Setup Script');
  console.log('============================');
  console.log('');
  
  // Let user choose which GIF to download
  const gifIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : 0;
  
  if (gifIndex < 0 || gifIndex >= sampleGifs.length) {
    console.log('Available GIFs:');
    sampleGifs.forEach((gif, index) => {
      console.log(`${index + 1}. ${gif.description}`);
    });
    console.log('');
    console.log('Usage: node scripts/download-wedding-gif.js [gif-number]');
    console.log('Example: node scripts/download-wedding-gif.js 1');
    return;
  }
  
  const selectedGif = sampleGifs[gifIndex];
  
  try {
    // Download the GIF
    const downloadedPath = await downloadGif(selectedGif);
    
    // Optimize for social sharing (1200x630 for maximum impact)
    const optimizedPath = path.join(
      path.dirname(downloadedPath), 
      'wedding-celebration.gif'
    );
    
    await optimizeGif(downloadedPath, optimizedPath);
    
    // Clean up original if different
    if (downloadedPath !== optimizedPath) {
      fs.unlinkSync(downloadedPath);
    }
    
    console.log('');
    console.log('🎊 SUCCESS! Your wedding GIF is ready!');
    console.log('');
    console.log('📱 Social Media Impact:');
    console.log('   • iMessage: Large animated preview');
    console.log('   • WhatsApp: Animated thumbnail');
    console.log('   • Facebook: Large GIF preview');
    console.log('   • Twitter: Animated card');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Test sharing your website URL');
    console.log('   3. Enjoy the wow factor! ✨');
    
  } catch (error) {
    console.error('❌ Error downloading GIF:', error.message);
    console.log('');
    console.log('💡 Alternative Options:');
    console.log('   1. Download a wedding GIF manually from:');
    console.log('      • Giphy.com');
    console.log('      • Tenor.com');
    console.log('      • Unsplash.com');
    console.log('   2. Save it as: public/images/couple/wedding-celebration.gif');
    console.log('   3. Ensure dimensions are 1200x630 for best results');
  }
}

// Manual setup instructions
function showManualInstructions() {
  console.log('🎯 MANUAL SETUP INSTRUCTIONS');
  console.log('=============================');
  console.log('');
  console.log('1. Find a beautiful wedding celebration GIF:');
  console.log('   • Visit giphy.com and search "indian wedding celebration"');
  console.log('   • Visit tenor.com and search "wedding fireworks"');
  console.log('   • Look for colorful, celebratory animations');
  console.log('');
  console.log('2. Download requirements:');
  console.log('   • Minimum size: 1200x630 pixels');
  console.log('   • Maximum file size: 5MB (for fast loading)');
  console.log('   • Format: .gif');
  console.log('');
  console.log('3. Save the file as:');
  console.log('   public/images/couple/wedding-celebration.gif');
  console.log('');
  console.log('4. Test your setup:');
  console.log('   • Run: npm run dev');
  console.log('   • Share your website URL on iMessage');
  console.log('   • Watch the magic happen! ✨');
  console.log('');
  console.log('🎨 Pro Tips:');
  console.log('   • Choose GIFs with warm, celebratory colors');
  console.log('   • Look for movement like dancing, fireworks, or confetti');
  console.log('   • Test on multiple platforms (iMessage, WhatsApp, Facebook)');
  console.log('   • Consider cultural elements (rangoli, mandap, etc.)');
}

if (require.main === module) {
  if (process.argv.includes('--manual')) {
    showManualInstructions();
  } else {
    main().catch(console.error);
  }
}

module.exports = { downloadGif, optimizeGif, sampleGifs }; 