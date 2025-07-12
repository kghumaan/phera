# Browser Dev-Tools MCP Integration Setup

## What is Browser Dev-Tools MCP?

The Browser Dev-Tools MCP (Model Context Protocol) integration allows your AI assistant in Cursor to interact directly with your browser's developer tools. This enables:

- 🔍 **Element Selection & Inspection**: Select HTML elements in dev tools and get detailed context
- 📊 **Console Log Access**: Real-time browser console logs and error monitoring
- 🌐 **Network Request Analysis**: Monitor and analyze network requests
- 📸 **Screenshot Capture**: Take screenshots of the current browser state
- 🏃 **Performance Audits**: Run accessibility, performance, SEO, and best practices audits
- 🔄 **Real-time Browser State**: Monitor browser state changes in real-time

## Benefits for the Phera Wedding Platform

With Browser Dev-Tools MCP integration, you can ask your AI assistant to:
- "What's wrong with this form validation that's not working?"
- "Analyze the network requests when the RSVP form is submitted"
- "Check the accessibility of the travel page carousel"
- "Debug why the background images aren't loading properly"
- "Inspect the selected element and suggest improvements"
- "Take a screenshot of the current page state"
- "Run a performance audit on the mobile experience"

## Setup Instructions

### Step 1: Install the Chrome Extension

1. **Download the Browser Tools Extension**:
   - Go to [AgentDesk Browser Tools Extension](https://chrome.google.com/webstore/detail/browser-tools/...)
   - Or download from [GitHub releases](https://github.com/agentdeskai/browser-tools-server/releases)

2. **Install the Extension**:
   - Open Chrome → Extensions → "Manage Extensions"
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the downloaded extension folder
   - Or install directly from Chrome Web Store if available

3. **Verify Installation**:
   - Look for the Browser Tools icon in your Chrome toolbar
   - Click it to ensure it's active and connected

### Step 2: Start the Browser Tools Server

The server acts as a bridge between the Chrome extension and the MCP client.

1. **Start the Server**:
   ```bash
   npx @agentdeskai/browser-tools-server@latest
   ```

2. **Keep it Running**:
   - The server needs to run continuously while you're using the dev tools integration
   - You'll see output indicating the server is running and connected to the Chrome extension

### Step 3: Configure MCP in Cursor

1. **Open Cursor Settings**:
   - Go to Cursor → Settings → Tools & Integrations
   - Click "New MCP Server"

2. **Add the Configuration**:
   This will open your `~/.cursor/mcp.json` file. Add the browser-tools configuration:

   ```json
   {
     "mcpServers": {
       "browser-tools": {
         "command": "npx",
         "args": ["-y", "@agentdeskai/browser-tools-mcp@1.2.0"],
         "disabled": false,
         "alwaysAllow": []
       }
     }
   }
   ```

3. **Save and Restart**:
   - Save the file
   - Restart Cursor completely
   - The MCP server should now be available

### Step 4: Verify the Setup

1. **Check MCP Status**:
   - In Cursor, go to Settings → Tools & Integrations
   - Look for "browser-tools" in the MCP servers list
   - It should show as "Connected" or "Active"

2. **Test Browser Connection**:
   - Open your Phera project in the browser (`npm run dev`)
   - Open Chrome DevTools (F12)
   - In Cursor's AI chat, ask: "Can you see the browser console logs?"
   - The AI should be able to access and display console information

## Available MCP Tools

The Browser Dev-Tools MCP provides these tools:

### Console & Error Monitoring
- `mcp_getConsoleLogs` - Retrieve all browser console logs
- `mcp_getConsoleErrors` - Get only console errors
- `mcp_getNetworkErrors` - Get network error logs
- `mcp_getNetworkSuccess` - Get successful network requests
- `mcp_getNetworkLogs` - Get all network activity

### Element Inspection
- `mcp_getSelectedElement` - Get the currently selected DOM element in dev tools
- `mcp_inspectElement` - Inspect a specific element by selector
- `mcp_getElementProperties` - Get computed styles and properties

### Browser State & Audits
- `mcp_runAccessibilityAudit` - Run WCAG-compliant accessibility audit
- `mcp_runPerformanceAudit` - Run performance analysis
- `mcp_runSEOAudit` - Run SEO audit
- `mcp_runBestPracticesAudit` - Run best practices audit
- `mcp_takeScreenshot` - Capture current browser state

## How to Use Element Selection

This is the key feature you were looking for:

1. **Select an Element in Dev Tools**:
   - Open Chrome DevTools (F12)
   - Go to the Elements tab
   - Click on any HTML element to select it

2. **Get Context in Cursor**:
   - In Cursor's AI chat, ask: "What element is currently selected in the dev tools?"
   - Or: "Analyze the selected element and suggest improvements"
   - Or: "What's wrong with the styling of the selected element?"

3. **The AI will receive**:
   - Complete HTML structure of the selected element
   - Computed CSS styles
   - Element properties and attributes
   - Parent/child relationships
   - Accessibility information

## Example Usage Scenarios

### Debugging Form Issues
```
> I'm having trouble with the RSVP form validation. Let me select the form element in dev tools.

[Select the form element in Chrome DevTools]

> What's wrong with the currently selected form element?
```

### Analyzing Performance
```
> Run a performance audit on the travel page and tell me what needs improvement.

[AI runs performance audit via MCP]

> The main issues are: large images not optimized, unused CSS, and render-blocking resources...
```

### Inspecting Styling Issues
```
> The carousel diamonds aren't showing up correctly on mobile. Let me select one in dev tools.

[Select diamond element in DevTools]

> Analyze the selected element's styling and suggest fixes for mobile display.
```

## Troubleshooting

### Common Issues

1. **MCP Server Not Connecting**:
   ```bash
   # Check if the server is running
   npx @agentdeskai/browser-tools-server@latest
   
   # Verify the MCP client can connect
   npx @agentdeskai/browser-tools-mcp@1.2.0 --test
   ```

2. **Chrome Extension Not Working**:
   - Ensure the extension is enabled in Chrome
   - Check if the extension icon is visible in the toolbar
   - Try refreshing the browser tab

3. **Element Selection Not Working**:
   - Make sure you're selecting elements in the DevTools Elements tab
   - Verify the Chrome extension is active
   - Check browser console for extension errors

4. **Cursor Not Recognizing Tools**:
   - Restart Cursor completely
   - Check Settings → Tools & Integrations for MCP status
   - Verify the JSON configuration is correct

### Debug Commands

```bash
# Test the MCP connection
npx @agentdeskai/browser-tools-mcp@1.2.0 --version

# Check server status
curl http://localhost:8080/status

# View MCP logs
tail -f ~/.cursor/mcp.log
```

## Advanced Configuration

### Custom Port Configuration
If you need to run the server on a different port:

```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "npx",
      "args": ["-y", "@agentdeskai/browser-tools-mcp@1.2.0"],
      "env": {
        "BROWSER_TOOLS_PORT": "8081"
      }
    }
  }
}
```

### Multiple Browser Support
To support multiple browsers, you can run multiple instances:

```json
{
  "mcpServers": {
    "browser-tools-chrome": {
      "command": "npx",
      "args": ["-y", "@agentdeskai/browser-tools-mcp@1.2.0"],
      "env": {
        "BROWSER_TYPE": "chrome"
      }
    },
    "browser-tools-firefox": {
      "command": "npx",
      "args": ["-y", "@agentdeskai/browser-tools-mcp@1.2.0"],
      "env": {
        "BROWSER_TYPE": "firefox"
      }
    }
  }
}
```

## Security Considerations

1. **Local Development Only**: This setup is intended for local development
2. **Extension Permissions**: The Chrome extension has access to page content
3. **Network Access**: The MCP server communicates with the browser extension
4. **Sensitive Data**: Be cautious when sharing console logs that might contain sensitive information

## Getting Help

- [AgentDesk Browser Tools Documentation](https://github.com/agentdeskai/browser-tools-server)
- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [Cursor MCP Support](https://cursor.com/docs/mcp)

## Example Workflow

Once set up, a typical workflow looks like this:

1. **Open your Phera project** in the browser
2. **Navigate to the page** you want to debug (e.g., travel page)
3. **Open DevTools** (F12) and select an element
4. **In Cursor**, ask: "What's the issue with the selected element?"
5. **The AI analyzes** the element and provides specific suggestions
6. **Implement the fix** and repeat as needed

This creates a seamless debugging experience where you can visually select elements in the browser and get immediate AI-powered analysis and suggestions. 