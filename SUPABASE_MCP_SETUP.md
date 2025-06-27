# Supabase MCP Integration Setup

## What is Supabase MCP?

Model Context Protocol (MCP) is a standardized protocol from Anthropic that enables Large Language Models (LLMs) to interact with external services like Supabase. The Supabase MCP server allows your AI assistant in Cursor to:

- 🗄️ **Database Operations**: Query, create, update, and delete data
- 🏗️ **Schema Management**: Design tables and manage migrations
- 📊 **Project Management**: Create, configure, and manage Supabase projects
- 🔍 **Data Analysis**: Generate reports and insights from your database
- 📝 **TypeScript Generation**: Generate types based on your database schema
- 🌿 **Database Branching**: Create development branches for testing
- 📋 **Configuration Access**: Retrieve project settings and API keys

## Benefits for the Phera Wedding Platform

With MCP integration, you can ask your AI assistant to:
- "Create a new table for wedding vendors"
- "Show me all RSVPs for the reception event"
- "Generate TypeScript types for the comments table"
- "Create a migration to add a new field to guests"
- "Export all guest data to CSV format"
- "Check the database connection status"
- "Create a backup branch before making schema changes"

## Setup Instructions

### Step 1: Get Your Supabase Credentials

1. **Personal Access Token**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Click your profile icon → "Access Tokens"
   - Click "Generate new token"
   - Name it "Cursor MCP" and copy the token

2. **Project Reference**:
   - In your Supabase project dashboard
   - Go to Settings → General
   - Copy the "Reference ID" (found in Project Settings)

### Step 2: Configure MCP

The MCP configuration has been added to both:
- **Global**: `~/.cursor/mcp.json` (works across all projects)
- **Project-specific**: `.cursor/mcp.json` (only for this project)

Replace the placeholders in your chosen configuration file:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_PROJECT_REF_HERE"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

**Replace**:
- `YOUR_PROJECT_REF_HERE` with your actual project reference ID
- `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your personal access token

### Step 3: Configuration Options

#### Read-Only Mode (Recommended for Safety)
The current configuration uses `--read-only` flag, which:
- ✅ Allows querying and reading data
- ✅ Allows project management operations
- ❌ Prevents accidental data modifications
- ❌ Prevents table/schema changes

#### Full Access Mode (Use with Caution)
Remove the `--read-only` flag to enable write operations:
```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--project-ref=YOUR_PROJECT_REF_HERE"
]
```

### Step 4: Restart Cursor

1. Completely close Cursor
2. Reopen Cursor
3. Open this project
4. The Supabase MCP server should now be available

### Step 5: Verify Connection

1. Open Cursor's chat/AI assistant
2. Ask: "Can you show me the tables in my Supabase database?"
3. The AI should be able to connect and list your tables

## Available MCP Tools

The Supabase MCP server provides 20+ tools including:

### Database Operations
- `list_tables` - List all tables in your database
- `execute_sql` - Run SQL queries (read-only in safe mode)
- `generate_types` - Generate TypeScript types from schema

### Project Management  
- `list_projects` - List all your Supabase projects
- `get_project_config` - Get project configuration and API keys
- `create_project` - Create new Supabase projects
- `pause_project` / `restore_project` - Manage project state

### Development
- `create_branch` - Create database branches for development
- `list_branches` - List all database branches
- `apply_migration` - Apply database migrations

### Monitoring
- `get_logs` - Retrieve project logs for debugging
- `get_project_stats` - Get usage statistics

## Security Considerations

1. **Token Security**: Your personal access token has full access to your Supabase account
2. **Read-Only First**: Start with read-only mode to prevent accidental changes
3. **Project Scoping**: The configuration is scoped to a specific project
4. **Regular Rotation**: Periodically rotate your access tokens

## Troubleshooting

### Common Issues

1. **"Cannot find module" error**:
   ```bash
   # Install globally if needed
   npm install -g @supabase/mcp-server-supabase
   ```

2. **Authentication failed**:
   - Verify your personal access token is correct
   - Check that the token hasn't expired
   - Ensure the project reference ID is accurate

3. **Server not connecting**:
   - Restart Cursor completely
   - Check the MCP configuration JSON syntax
   - Look at Cursor's developer console for errors

### Getting Help

- Check [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- Review [Supabase MCP GitHub Repository](https://github.com/supabase/mcp-server-supabase)
- Visit the [MCP Documentation](https://modelcontextprotocol.io/docs)

## Example Usage

Once configured, you can interact with your Supabase database naturally:

**Query Data**:
> "Show me all guests who RSVP'd yes to the reception"

**Schema Information**:
> "What's the structure of the comments table?"

**Data Analysis**:
> "How many people are attending each wedding event?"

**Development**:
> "Create a TypeScript interface for the RSVP responses"

**Project Management**:
> "What's my current database usage?"

The AI assistant will use the MCP tools to interact with your Supabase database and provide comprehensive answers. 