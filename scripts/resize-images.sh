#!/bin/bash

# Phera Image Optimization Script
# This script automatically resizes and compresses all images for optimal web performance

set -e  # Exit on any error

echo "🎨 Starting Phera Image Optimization"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show file size
show_size() {
    if [[ -f "$1" ]]; then
        size=$(du -h "$1" | cut -f1)
        echo "$size"
    else
        echo "N/A"
    fi
}

# Function to optimize background images (PNG -> JPG, resize, compress)
optimize_background() {
    local input="$1"
    local output="$2"
    local name="$3"
    
    if [[ -f "$input" ]]; then
        echo -e "${BLUE}Processing background: $name${NC}"
        echo "  📁 Input:  $input ($(show_size "$input"))"
        
        # Resize to 1920x1080 and convert to JPG with 80% quality
        magick "$input" \
            -resize 1920x1080^ \
            -gravity center \
            -extent 1920x1080 \
            -quality 80 \
            -format jpg \
            "$output"
        
        echo "  💾 Output: $output ($(show_size "$output"))"
        echo -e "${GREEN}  ✅ Done!${NC}"
        echo ""
    else
        echo -e "${RED}  ❌ File not found: $input${NC}"
    fi
}

# Function to optimize couple photos (PNG -> JPG, resize, compress)
optimize_couple_photo() {
    local input="$1"
    local output="$2"
    local name="$3"
    
    if [[ -f "$input" ]]; then
        echo -e "${BLUE}Processing couple photo: $name${NC}"
        echo "  📁 Input:  $input ($(show_size "$input"))"
        
        # Resize to max 800x600 while maintaining aspect ratio, convert to JPG with 85% quality
        magick "$input" \
            -resize 800x600\> \
            -quality 85 \
            -format jpg \
            "$output"
        
        echo "  💾 Output: $output ($(show_size "$output"))"
        echo -e "${GREEN}  ✅ Done!${NC}"
        echo ""
    else
        echo -e "${RED}  ❌ File not found: $input${NC}"
    fi
}

# Function to optimize overlay images (PNG -> PNG, compress)
optimize_overlay() {
    local input="$1"
    local output="$2"
    local name="$3"
    
    if [[ -f "$input" ]]; then
        echo -e "${BLUE}Processing overlay: $name${NC}"
        echo "  📁 Input:  $input ($(show_size "$input"))"
        
        # Compress PNG while maintaining transparency
        magick "$input" \
            -quality 85 \
            -define png:compression-filter=5 \
            -define png:compression-level=9 \
            -define png:compression-strategy=1 \
            "$output"
        
        echo "  💾 Output: $output ($(show_size "$output"))"
        echo -e "${GREEN}  ✅ Done!${NC}"
        echo ""
    else
        echo -e "${RED}  ❌ File not found: $input${NC}"
    fi
}

# Function to optimize frame images (PNG -> PNG, compress)
optimize_frame() {
    local input="$1"
    local output="$2"
    local name="$3"
    
    if [[ -f "$input" ]]; then
        echo -e "${BLUE}Processing frame: $name${NC}"
        echo "  📁 Input:  $input ($(show_size "$input"))"
        
        # Compress PNG while maintaining transparency
        magick "$input" \
            -quality 90 \
            -define png:compression-filter=5 \
            -define png:compression-level=9 \
            "$output"
        
        echo "  💾 Output: $output ($(show_size "$output"))"
        echo -e "${GREEN}  ✅ Done!${NC}"
        echo ""
    else
        echo -e "${RED}  ❌ File not found: $input${NC}"
    fi
}

echo -e "${YELLOW}📸 Optimizing Background Images${NC}"
echo "Converting PNG to JPG and resizing to 1920x1080..."
echo ""

# Background Images (6-7MB -> ~300-500KB JPG)
optimize_background \
    "design-reference/backgrounds/BlueClouds.png" \
    "public/images/backgrounds/blue-clouds.jpg" \
    "Blue Clouds"

optimize_background \
    "design-reference/backgrounds/Green.png" \
    "public/images/backgrounds/green.jpg" \
    "Green"

echo -e "${YELLOW}👫 Optimizing Couple Photos${NC}"
echo "Converting PNG to JPG and resizing for web..."
echo ""

# Couple Photos (1.1-1.3MB -> ~100-200KB JPG)
optimize_couple_photo \
    "design-reference/couple-images/1.png" \
    "public/images/couple/couple-1.jpg" \
    "Couple Photo 1"

optimize_couple_photo \
    "design-reference/couple-images/2.png" \
    "public/images/couple/couple-2.jpg" \
    "Couple Photo 2"

# Also optimize the ones in public/couple-images if they exist
optimize_couple_photo \
    "public/couple-images/1.png" \
    "public/images/couple/couple-1-alt.jpg" \
    "Couple Photo 1 (Public)"

optimize_couple_photo \
    "public/couple-images/2.png" \
    "public/images/couple/couple-2-alt.jpg" \
    "Couple Photo 2 (Public)"

echo -e "${YELLOW}🌸 Optimizing Overlay Images${NC}"
echo "Compressing PNG while maintaining transparency..."
echo ""

# Overlay Images (730KB -> ~200-400KB PNG)
optimize_overlay \
    "design-reference/background-overlays/PedalsAndGreenPlantAndBirds.png" \
    "public/images/overlays/petals-birds.png" \
    "Petals and Birds"

echo -e "${YELLOW}🖼️  Optimizing Frame Images${NC}"
echo "Compressing PNG frames..."
echo ""

# Frame Images (167-753KB -> ~100-200KB PNG)
optimize_frame \
    "design-reference/image-frames/Frame 27.png" \
    "public/images/frames/frame-27.png" \
    "Frame 27"

optimize_frame \
    "design-reference/image-frames/Frame 4.png" \
    "public/images/frames/frame-4.png" \
    "Frame 4"

echo -e "${GREEN}🎉 Image Optimization Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "  • Background images: Resized to 1920x1080 and converted to JPG"
echo "  • Couple photos: Resized to max 800x600 and converted to JPG"
echo "  • Overlays: Compressed PNG while maintaining transparency"
echo "  • Frames: Compressed PNG"
echo ""
echo "📁 All optimized images are now in:"
echo "  • public/images/backgrounds/"
echo "  • public/images/couple/"
echo "  • public/images/overlays/"
echo "  • public/images/frames/"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your code to use the new optimized image paths"
echo "2. Test the loading performance"
echo "3. Remove the old unoptimized images"
echo ""
echo -e "${GREEN}Expected result: 90%+ reduction in image file sizes! 🚀${NC}" 