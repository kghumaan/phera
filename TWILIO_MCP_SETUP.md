# Twilio MCP Integration Setup

## What is Twilio MCP?

The Twilio MCP (Model Context Protocol) server enables your AI assistant in Cursor to interact with Twilio's communication APIs. With this integration, you can:

- 📱 **SMS & Messaging**: Send texts, WhatsApp messages, and manage conversations
- ☎️ **Voice**: Make calls, manage phone numbers, and handle voice interactions  
- 📞 **Phone Numbers**: Purchase, configure, and manage phone numbers
- 🔍 **Lookup & Verify**: Validate phone numbers and user identity
- 📊 **Usage & Analytics**: Monitor communication usage and costs
- ⚙️ **Configuration**: Manage webhooks, TwiML apps, and service settings

## Benefits for the Phera Wedding Platform

With Twilio MCP integration, you can ask your AI assistant to:
- "Send SMS invitations to all guests who haven't RSVP'd"
- "Purchase a local phone number for the wedding hotline"  
- "Set up automated SMS reminders for the ceremony"
- "Create a WhatsApp group for the wedding party"
- "Send thank you messages to all attendees"
- "Check delivery status of invitation messages"
- "Set up a voice menu for wedding information"

## Setup Instructions

### Step 1: Get Your Twilio Credentials

1. **Sign up for Twilio** (if you don't have an account):
   - Go to [twilio.com](https://twilio.com)
   - Click "Try Twilio for Free"
   - Complete the registration process

2. **Get your Account SID**:
   - Go to [Twilio Console](https://console.twilio.com)
   - Your Account SID is displayed on the main dashboard
   - Copy this value (starts with "AC...")

3. **Create an API Key**:
   - Go to [API Keys page](https://console.twilio.com/project/api-keys)
   - Click "Create API key"
   - Give it a descriptive name like "Phera MCP Integration"
   - Choose "Standard" key type
   - Copy both the **API Key SID** (starts with "SK...") and **API Secret**
   - ⚠️ **Important**: You can only view the API Secret once, so save it immediately!

### Step 2: Update Your Credentials

The Twilio MCP configuration has been added to your `~/.cursor/mcp.json` file. You need to replace the placeholder with your actual credentials.

**Current placeholder**:
```
"YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET"
```

**Replace with your actual values**:
```
"ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:your_api_secret_here"
```

**Example format**:
```json
"AC1234567890abcdef1234567890abcdef/SK1234567890abcdef1234567890abcdef:abc123def456ghi789"
```

### Step 3: Open and Edit Your MCP Configuration

1. Open the file: `~/.cursor/mcp.json`
2. Find the Twilio section (at the bottom)
3. Replace `YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET` with your actual credentials
4. Save the file

### Step 4: Restart Cursor

1. Completely close Cursor
2. Reopen Cursor  
3. Open the Phera project
4. The Twilio MCP server should now be available

### Step 5: Verify Connection

1. Open Cursor's chat/AI assistant
2. Ask: "Can you list my Twilio phone numbers?"
3. The AI should connect to Twilio and show your numbers (or indicate you have none yet)

## Configuration Details

The current configuration includes:

```json
"twilio": {
  "command": "npx",
  "args": [
    "-y",
    "@twilio-alpha/mcp",
    "YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET",
    "--services",
    "twilio_api_v2010", 
    "--tags",
    "Api20100401IncomingPhoneNumber,Api20100401Message"
  ]
}
```

### What this configuration does:

- **Services**: `twilio_api_v2010` - The main Twilio REST API
- **Tags**: Filtered to phone numbers and messaging (most relevant for wedding platform)
- **Package**: Uses the official `@twilio-alpha/mcp` package

### Available API Endpoints

With current filtering, you get access to:
- **Phone Numbers**: Purchase, list, update, delete phone numbers
- **Messages**: Send SMS, MMS, WhatsApp messages and check delivery status
- **And more**: The v2010 API includes many other communication features

## Expanding Access (Optional)

If you want access to more Twilio services, you can modify the configuration:

### Remove filters for full access:
```json
"args": [
  "-y", 
  "@twilio-alpha/mcp",
  "YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET"
]
```

### Add specific services:
```json
"--services",
"twilio_api_v2010,studio_v2,verify_v2"
```

### Add more tags:
```json
"--tags", 
"Api20100401IncomingPhoneNumber,Api20100401Message,Api20100401Call,Api20100401Recording"
```

## Security Considerations

1. **API Key Security**: Your API key has access to your Twilio account - treat it like a password
2. **Scope Limitation**: The current config limits access to phone numbers and messaging
3. **Cost Awareness**: Some Twilio operations cost money (sending messages, purchasing numbers)
4. **Rate Limits**: Twilio has API rate limits - be mindful of bulk operations

## Troubleshooting

### Common Issues

1. **"Cannot find module" error**:
   ```bash
   # The package will be auto-installed, but you can install globally if needed
   npm install -g @twilio-alpha/mcp
   ```

2. **Authentication failed**:
   - Double-check your Account SID, API Key, and API Secret
   - Ensure there are no extra spaces or characters
   - Verify the format: `ACCOUNT_SID/API_KEY:API_SECRET`

3. **Server not connecting**:
   - Restart Cursor completely
   - Check the MCP configuration JSON syntax
   - Look at Cursor's developer console for errors

4. **Limited functionality**:
   - Check if you need to remove service/tag filters
   - Verify your Twilio account has the required permissions

### Getting Help

- [Twilio MCP Documentation](https://www.twilio.com/en-us/blog/introducing-twilio-alpha-mcp-server)
- [Twilio MCP GitHub Repository](https://github.com/twilio-labs/mcp)
- [General MCP Documentation](https://modelcontextprotocol.io/docs)

## Example Usage

Once configured, you can interact with Twilio naturally:

**Phone Number Management**:
> "Do I have any Twilio phone numbers? If not, help me purchase one in California."

**Messaging**:
> "Send an SMS to +1234567890 saying 'Your wedding invitation is ready!'"

**Bulk Operations**:
> "Send reminder texts to all guests who haven't RSVP'd yet"

**Configuration**:
> "Set up a webhook for incoming messages to handle RSVP responses"

**Analytics**:
> "Show me how many messages I've sent this month and the cost"

The AI assistant will use Twilio MCP tools to perform these operations and provide detailed responses.

## Wedding Platform Integration Ideas

With Twilio MCP, your Phera wedding platform could support:

1. **Guest Communication**:
   - Automated RSVP reminders
   - Event updates and changes
   - Thank you messages

2. **Wedding Day Coordination**:
   - Vendor check-ins via SMS
   - Real-time updates to wedding party
   - Emergency contact system

3. **Interactive Features**:
   - SMS-based RSVP system
   - Photo sharing via MMS
   - Voice recordings for well-wishes

4. **Multi-language Support**:
   - SMS in different languages for diverse guest lists
   - WhatsApp integration for international guests

The combination of your existing Supabase (for data) + Twilio (for communication) MCP servers creates a powerful foundation for wedding platform automation! 