# GIPHY API Setup for GIF Picker

The RSVP form now includes a GIF picker functionality that allows users to search and select GIFs to include with their messages. To use this feature, you need to set up a GIPHY API key.

## Steps to Set Up GIPHY API Key

1. **Get a GIPHY API Key**
   - Go to [GIPHY Developers](https://developers.giphy.com/)
   - Sign up for a free account or log in
   - Create a new app to get your API key
   - Copy the API key

2. **Add the API Key to Your Environment**
   - Create a `.env.local` file in the project root (if it doesn't exist)
   - Add the following line to `.env.local`:
     ```
     NEXT_PUBLIC_GIPHY_API_KEY=your-actual-api-key-here
     ```
   - Replace `your-actual-api-key-here` with your actual GIPHY API key

3. **Restart Your Development Server**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again
   - The GIF picker should now work properly

## Testing the GIF Picker

1. Navigate to the RSVP form
2. Go to the "Fun & Messages" section (step 6)
3. In the "Share your excitement" text area, you'll see a "GIF" button in the bottom right
4. Click the "GIF" button to open the GIF picker
5. Search for GIFs or browse trending ones
6. Click on a GIF to select it
7. The selected GIF will be displayed below the text area

## Features

- **Search**: Search for specific GIFs using keywords
- **Trending**: Browse trending GIFs
- **Quick Tags**: Click on preset tags like "excited", "celebration", "love", etc.
- **Preview**: See a preview of the selected GIF in the form
- **Remove**: Remove the selected GIF if you want to choose a different one

## Fallback

If the GIPHY API key is not configured, the GIF picker will still open but may not load GIFs properly. Make sure to set up the API key for full functionality.

The API key is free for development and moderate usage. Check GIPHY's terms of service for production usage limits. 