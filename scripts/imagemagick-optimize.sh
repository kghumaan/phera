#!/bin/bash

# ImageMagick Optimization Script for Phera Wedding Platform
# This script optimizes images using ImageMagick for better web performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 Phera ImageMagick Optimization Script${NC}"
echo "============================================="

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo -e "${RED}❌ ImageMagick is not installed. Please install it first:${NC}"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Create backup directory
BACKUP_DIR="image_backups_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${YELLOW}📁 Created backup directory: $BACKUP_DIR${NC}"

# Function to optimize PNG files
optimize_png() {
    local input_file="$1"
    local output_file="$2"
    local max_width="${3:-1200}"
    local max_height="${4:-900}"
    
    echo -e "${BLUE}🔧 Optimizing PNG: $(basename "$input_file")${NC}"
    
    # Backup original
    cp "$input_file" "$BACKUP_DIR/"
    
    # Get original size
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
    
    # Optimize PNG with maximum compression
    magick "$input_file" \
        -strip \
        -define png:compression-level=9 \
        -define png:compression-strategy=1 \
        -resize "${max_width}x${max_height}>" \
        "$output_file"
    
    # Get new size
    local new_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
    local reduction=$(( (original_size - new_size) * 100 / original_size ))
    
    echo -e "${GREEN}  ✅ Reduced by ${reduction}% ($(numfmt --to=iec $original_size) → $(numfmt --to=iec $new_size))${NC}"
}

# Function to optimize JPEG files
optimize_jpeg() {
    local input_file="$1"
    local output_file="$2"
    local quality="${3:-85}"
    local max_width="${4:-1920}"
    local max_height="${5:-1080}"
    
    echo -e "${BLUE}🔧 Optimizing JPEG: $(basename "$input_file")${NC}"
    
    # Backup original
    cp "$input_file" "$BACKUP_DIR/"
    
    # Get original size
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
    
    # Optimize JPEG
    magick "$input_file" \
        -strip \
        -quality "$quality" \
        -interlace Plane \
        -resize "${max_width}x${max_height}>" \
        "$output_file"
    
    # Get new size
    local new_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
    
    if [ "$new_size" -lt "$original_size" ]; then
        local reduction=$(( (original_size - new_size) * 100 / original_size ))
        echo -e "${GREEN}  ✅ Reduced by ${reduction}% ($(numfmt --to=iec $original_size) → $(numfmt --to=iec $new_size))${NC}"
    else
        echo -e "${YELLOW}  ⚠️  No size reduction achieved - keeping original${NC}"
        cp "$BACKUP_DIR/$(basename "$input_file")" "$output_file"
    fi
}

# Function to optimize WebP conversion
convert_to_webp() {
    local input_file="$1"
    local output_file="$2"
    local quality="${3:-85}"
    
    echo -e "${BLUE}🔧 Converting to WebP: $(basename "$input_file")${NC}"
    
    magick "$input_file" \
        -strip \
        -define webp:lossless=false \
        -quality "$quality" \
        "$output_file"
    
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
    local new_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
    local reduction=$(( (original_size - new_size) * 100 / original_size ))
    
    echo -e "${GREEN}  ✅ WebP conversion: ${reduction}% smaller ($(numfmt --to=iec $original_size) → $(numfmt --to=iec $new_size))${NC}"
}

echo -e "\n${YELLOW}🎨 Optimizing Overlay PNGs...${NC}"
# Optimize overlay PNGs (these are usually the largest)
for file in public/images/overlays/*.png; do
    if [ -f "$file" ]; then
        optimize_png "$file" "$file" 1200 900
    fi
done

echo -e "\n${YELLOW}🖼️  Optimizing Frame PNGs...${NC}"
# Optimize frame PNGs
for file in public/images/frames/*.png; do
    if [ -f "$file" ]; then
        optimize_png "$file" "$file" 1200 1200
    fi
done

echo -e "\n${YELLOW}🌅 Optimizing Background JPEGs...${NC}"
# Optimize background JPEGs
for file in public/images/backgrounds/*.jpg; do
    if [ -f "$file" ]; then
        optimize_jpeg "$file" "$file" 85 1920 1080
    fi
done

echo -e "\n${YELLOW}👥 Optimizing Couple Photos...${NC}"
# Optimize couple photos
for file in public/images/couple/*.jpg; do
    if [ -f "$file" ]; then
        optimize_jpeg "$file" "$file" 88 800 600
    fi
done

echo -e "\n${YELLOW}🚀 Creating WebP versions for modern browsers...${NC}"
# Create WebP versions for better performance
for file in public/images/backgrounds/*.jpg; do
    if [ -f "$file" ]; then
        webp_file="${file%.jpg}.webp"
        convert_to_webp "$file" "$webp_file" 85
    fi
done

for file in public/images/couple/*.jpg; do
    if [ -f "$file" ]; then
        webp_file="${file%.jpg}.webp"
        convert_to_webp "$file" "$webp_file" 88
    fi
done

echo -e "\n${GREEN}✨ Optimization Complete!${NC}"
echo -e "${BLUE}📁 Original files backed up to: $BACKUP_DIR${NC}"
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Test your website to ensure images load correctly"
echo "   2. Consider implementing Next.js Image component for automatic optimization"
echo "   3. Add WebP support with fallbacks in your components"
echo "   4. Delete backup directory if everything looks good"

echo -e "\n${BLUE}📊 Total space saved:${NC}"
# Calculate total space saved
ORIGINAL_SIZE=$(du -sb "$BACKUP_DIR" | cut -f1)
CURRENT_SIZE=$(du -sb public/images | cut -f1)
SPACE_SAVED=$((ORIGINAL_SIZE - CURRENT_SIZE))

if [ $SPACE_SAVED -gt 0 ]; then
    echo -e "${GREEN}   🎉 $(numfmt --to=iec $SPACE_SAVED) saved!${NC}"
else
    echo -e "${YELLOW}   Images were already well optimized${NC}"
fi 