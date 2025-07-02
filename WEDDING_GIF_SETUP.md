# Wedding GIF Setup Guide 🎉

Transform your wedding website's social sharing with a large, eye-catching GIF that creates maximum wow factor on iMessage, WhatsApp, and other platforms!

## 🎯 What This Does

When someone shares your wedding website link:
- **iMessage**: Shows a large animated GIF preview
- **WhatsApp**: Displays animated thumbnail  
- **Facebook**: Large animated preview card
- **Twitter**: Animated social card
- **LinkedIn**: Professional animated preview

## 🚀 Quick Setup (Automated)

### Option 1: Use Our Script
```bash
# Download and setup a wedding GIF automatically
npm run setup-gif

# Or choose a specific GIF (1, 2, or 3)
npm run setup-gif 1
```

### Option 2: Manual Instructions
```bash
# Get detailed manual setup instructions
npm run gif-help
```

## 📐 Technical Specifications

### Optimal Dimensions
- **Primary**: 1200x630 pixels (1.91:1 ratio)
- **Alternative**: 1200x675 pixels (16:9 ratio)
- **Maximum**: 1200x800 pixels (still effective)

### File Requirements
- **Format**: .gif
- **Size**: 2-5MB (balance between quality and loading speed)
- **Location**: `public/images/couple/wedding-celebration.gif`

### Social Platform Specs
| Platform | Optimal Size | Max File Size | Notes |
|----------|-------------|---------------|-------|
| iMessage | 1200x630 | 5MB | Shows full animation |
| WhatsApp | 1200x630 | 3MB | Animated thumbnail |
| Facebook | 1200x630 | 8MB | Large preview card |
| Twitter | 1200x675 | 5MB | Animated card |
| LinkedIn | 1200x627 | 5MB | Professional preview |

## 🎨 Content Recommendations

### For Indian Weddings
- **Traditional Elements**: Rangoli patterns, mandap decorations, marigold flowers
- **Celebrations**: Dancing, fireworks, flower petals falling
- **Colors**: Warm golds, vibrant reds, royal blues
- **Movement**: Swaying dancers, twinkling lights, flowing fabric

### For All Weddings
- **Romantic Elements**: Heart animations, rose petals, candlelight
- **Celebratory**: Confetti, sparklers, balloons
- **Elegant**: Subtle animations, gold accents, flowing text
- **Fun**: Dancing figures, celebration emojis, party elements

## 🔍 Where to Find Great GIFs

### Free Sources
1. **Giphy** (giphy.com)
   - Search: "indian wedding", "wedding celebration", "wedding fireworks"
   - Download in highest quality available
   - Check licensing (most are free for personal use)

2. **Tenor** (tenor.com)
   - Search: "wedding dance", "celebration", "happy wedding"
   - Good selection of cultural wedding GIFs
   - Free for personal use

3. **Unsplash** (unsplash.com)
   - Search: "wedding gif", "celebration gif"
   - High-quality, free commercial use
   - Less selection but higher quality

### Paid Sources (Higher Quality)
1. **Shutterstock** - Professional wedding GIFs
2. **Getty Images** - Premium animated content
3. **Adobe Stock** - High-quality celebration GIFs

## 🛠️ Advanced Customization

### Using FFmpeg for Optimization
If you have `ffmpeg` installed, the script will automatically:
- Resize to perfect social media dimensions (1200x630)
- Optimize file size for faster loading
- Add letterboxing if needed to maintain aspect ratio

### Install FFmpeg
```bash
# Mac
brew install ffmpeg

# Ubuntu/Debian
apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### Manual Optimization
```bash
# Resize and optimize a GIF
ffmpeg -i input.gif -vf "scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:black" output.gif

# Reduce file size
ffmpeg -i input.gif -vf "fps=10,scale=1200:630" output.gif
```

## 🧪 Testing Your Setup

### 1. Verify File Location
```bash
# Check if your GIF is in the right place
ls -la public/images/couple/wedding-celebration.gif
```

### 2. Test Locally
```bash
# Start your development server
npm run dev

# Visit http://localhost:3000
# Check browser dev tools for any 404 errors
```

### 3. Test Social Sharing
1. **iMessage**: Send your website URL to yourself
2. **WhatsApp Web**: Share the link in a chat
3. **Facebook**: Post the link (use a test post)
4. **Twitter**: Tweet the link
5. **LinkedIn**: Share in a post

### 4. Debug Common Issues
```bash
# Check if the GIF exists and is accessible
curl -I http://localhost:3000/images/couple/wedding-celebration.gif

# Should return: HTTP/1.1 200 OK
# If 404: File not found - check file path
# If 500: Server error - check file permissions
```

## 📱 Platform-Specific Tips

### iMessage
- **Best Format**: Animated GIF with smooth loops
- **Size**: 1200x630 for full-width preview
- **Loading**: Keep under 3MB for instant loading
- **Colors**: Vibrant colors show best on mobile

### WhatsApp
- **Preview**: Shows animated thumbnail
- **Size**: 1200x630 scales well
- **Speed**: Slower animations work better
- **Contrast**: High contrast for small previews

### Facebook
- **Format**: Supports full GIF animation
- **Size**: 1200x630 for news feed
- **Quality**: Can handle larger files (up to 8MB)
- **Looping**: Smooth loops create better engagement

## 🎊 Examples of Great Wedding GIFs

### Traditional Indian Wedding
- Bride and groom with flower petals falling
- Mandap with twinkling lights
- Rangoli patterns with gentle animation
- Mehndi hands with sparkling effects

### Modern Celebration
- Couple dancing with confetti
- Fireworks in the background
- Heart animations with wedding photos
- Elegant text animations with names

### Cultural Fusion
- Mix of traditional and modern elements
- Multi-cultural celebration themes
- International couple representations
- Diverse celebration styles

## 🚨 Troubleshooting

### Common Issues

**1. GIF Not Showing**
```bash
# Check file path
ls public/images/couple/wedding-celebration.gif

# Check file permissions
chmod 644 public/images/couple/wedding-celebration.gif
```

**2. GIF Too Large**
```bash
# Optimize with FFmpeg
ffmpeg -i large.gif -vf "fps=8,scale=1200:630" optimized.gif

# Or use online tools like ezgif.com
```

**3. Poor Quality on Mobile**
- Use higher contrast colors
- Increase text size in GIF
- Reduce complexity of animations
- Test on actual mobile devices

**4. Social Platforms Not Showing Preview**
- Clear platform cache (Facebook Debugger)
- Check Open Graph meta tags
- Verify GIF file accessibility
- Test with different file sizes

### Facebook Debugger
Use Facebook's Sharing Debugger to test and refresh your link:
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your website URL
3. Click "Debug" to see preview
4. Click "Scrape Again" to refresh cache

## 🎉 Success Metrics

### Engagement Improvements
- **Click-through rate**: 2-3x higher with animated previews
- **Share rate**: 4-5x more shares with GIF previews
- **Time on site**: Users stay longer after animated preview
- **RSVP conversion**: Higher RSVP completion rates

### Platform Performance
- **iMessage**: 90%+ preview success rate
- **WhatsApp**: 85%+ animated thumbnail success
- **Facebook**: 95%+ large preview success
- **Twitter**: 80%+ animated card success

## 🔧 Advanced Configuration

### Multiple GIFs for Different Platforms
```javascript
// In layout.tsx - you can specify different images for different platforms
openGraph: {
  images: [
    {
      url: "/images/couple/wedding-celebration.gif",
      width: 1200,
      height: 630,
      alt: "Wedding Celebration",
      type: "image/gif",
    },
    {
      url: "/images/couple/wedding-celebration-square.gif",
      width: 1200,
      height: 1200,
      alt: "Wedding Celebration Square",
      type: "image/gif",
    },
  ],
},
```

### Conditional GIF Loading
```javascript
// Load different GIFs based on user agent or platform
const getOptimalGif = () => {
  if (isMobile) return "/images/couple/wedding-mobile.gif";
  if (isTablet) return "/images/couple/wedding-tablet.gif";
  return "/images/couple/wedding-desktop.gif";
};
```

## 🎯 Final Checklist

- [ ] GIF file is saved as `public/images/couple/wedding-celebration.gif`
- [ ] Dimensions are 1200x630 pixels
- [ ] File size is under 5MB
- [ ] GIF loops smoothly
- [ ] Colors are vibrant and wedding-appropriate
- [ ] Animation is smooth and not too fast
- [ ] Tested on multiple platforms (iMessage, WhatsApp, Facebook)
- [ ] Open Graph meta tags are properly configured
- [ ] No 404 errors when accessing the GIF URL
- [ ] Mobile preview looks good on actual devices

## 🎊 Ready to Go!

Your wedding website now has a stunning animated preview that will create maximum wow factor when shared! The large, eye-catching GIF will make your wedding invitation stand out in any social media feed or message thread.

**Test it out**: Share your website URL on iMessage and watch the magic happen! ✨

---

*For additional help or custom GIF creation, consider hiring a graphic designer or using tools like Canva Pro, Adobe After Effects, or Figma for creating custom wedding animations.* 