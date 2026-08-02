#!/bin/bash

echo "Frame,PadLeft,PadTop,PadRight,PadBottom,InnerWidth,InnerHeight"
for i in {1..12}; do
    FILE="public/images/frames/frame-$i.png"
    if [ -f "$FILE" ]; then
        # Get dimensions
        DIM=$(identify -format "%w %h" "$FILE")
        W=$(echo $DIM | cut -d' ' -f1)
        H=$(echo $DIM | cut -d' ' -f2)
        
        # Get bounding box of transparent center
        # We use threshold to ignore slightly non-transparent pixels if any
        BBOX=$(magick "$FILE" -alpha extract -negate -threshold 50% -format "%@" info:)
        
        # BBOX format: WxH+X+Y
        BW=$(echo $BBOX | cut -d'x' -f1)
        BHY=$(echo $BBOX | cut -d'x' -f2)
        BH=$(echo $BHY | cut -d'+' -f1)
        BX=$(echo $BHY | cut -d'+' -f2)
        BY=$(echo $BHY | cut -d'+' -f3)
        
        # Calculate padding in pixels - using BX and BY directly
        PL=$BX
        PT=$BY
        PR=$((W - BW - BX))
        PB=$((H - BH - BY))
        
        # Convert to percentage
        PERC_L=$(echo "scale=2; $PL * 100 / $W" | bc)
        PERC_T=$(echo "scale=2; $PT * 100 / $H" | bc)
        PERC_R=$(echo "scale=2; $PR * 100 / $W" | bc)
        PERC_B=$(echo "scale=2; $PB * 100 / $H" | bc)
        
        echo "frame-$i,$PERC_L,$PERC_T,$PERC_R,$PERC_B,$BW,$BH"
    fi
done
