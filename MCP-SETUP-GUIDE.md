# MCP Server Setup Guide for SmartWidget

## Quick Start

1. Copy the `.mcp.json` file to your project root
2. Set up environment variables
3. Start Claude Code in your project directory

---

## Files Included

### `smartwidget-mcp.json` (Recommended - Start Here)
Basic configuration with essential servers:
- **supabase** - Read-only database access (safe for development)
- **stripe** - Payment/subscription management via OAuth
- **cloudflare-workers** - Worker deployment management
- **cloudflare-docs** - Cloudflare documentation search

### `smartwidget-mcp-extended.json` (Full Setup)
Everything above plus:
- **supabase-dev** - Full read/write database access (use carefully!)
- **cloudflare-pages** - Pages deployment management
- **cloudflare-observability** - Debugging and performance analysis
- **github** - Repository and PR management

---

## Step 1: Environment Variables

Create a `.env` file in your project root (add to .gitignore!):

```bash
# Supabase Personal Access Token
# Get from: https://supabase.com/dashboard/account/tokens
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub Personal Access Token (optional)
# Get from: https://github.com/settings/tokens
# Required scopes: repo, read:org
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# MCP Server Environment Variables
export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Then reload your shell:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

---

## Step 2: Install the Configuration

### Option A: Project-Scoped (Recommended)
Copy the config to your project root:

```bash
# Navigate to your SmartWidget project
cd /path/to/smartwidget

# Copy the basic config
cp /path/to/smartwidget-mcp.json .mcp.json

# Or for full setup
cp /path/to/smartwidget-mcp-extended.json .mcp.json
```

### Option B: User-Scoped (Available in all projects)
```bash
# Create or edit ~/.claude.json
# Copy the mcpServers section from smartwidget-mcp.json
```

---

## Step 3: Verify Setup

```bash
# Start Claude Code
claude

# Inside Claude Code, check MCP status
/mcp
```

You should see all configured servers listed with their connection status.

---

## Usage Examples

Once set up, you can use natural language commands:

### Supabase
```
@supabase list all tables in my database
@supabase show me the schema for the users table
@supabase generate TypeScript types for my database
@supabase help me write a migration to add a bookings table
```

### Stripe
```
@stripe create a product called "Basic Plan" priced at $29/month
@stripe create a product called "Pro Plan with AI" priced at $49/month
@stripe list all my products and prices
@stripe show me recent payments
```

### Cloudflare
```
@cloudflare-workers list my deployed workers
@cloudflare-docs how do I set up custom domains for Pages?
@cloudflare-observability show me error logs from the last hour
```

### GitHub
```
@github list open issues in this repository
@github create a PR for the current branch
@github show me recent commits
```

---

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use read-only mode** for Supabase in production environments
3. **Scope tokens appropriately** - Use minimal required permissions
4. **Use project-scoped configs** for team projects (they can be committed)
5. **Review tool calls** - Claude will ask for confirmation before executing

---

## Troubleshooting

### "Connection closed" or server not connecting
```bash
# Check if npx is working
npx --version

# For Windows users, use cmd wrapper:
# Change "command": "npx" to "command": "cmd"
# Add "/c", "npx" to the beginning of args
```

### Environment variables not loading
```bash
# Verify they're set
echo $SUPABASE_ACCESS_TOKEN

# If empty, source your profile again
source ~/.zshrc
```

### OAuth prompts not appearing
- Ensure you have a default browser set
- Try running `claude` from a fresh terminal session

### Server shows as "disabled"
- Use `/mcp` command and toggle the server on
- Or @mention the server to enable it: `@supabase hello`

---

## Recommended Development Workflow

1. **Start with read-only Supabase** - Design your schema safely
2. **Switch to supabase-dev** when ready to apply migrations
3. **Set up Stripe products** early to test pricing flow
4. **Add Cloudflare** when ready to deploy

---

## Getting API Keys/Tokens

### Supabase Personal Access Token
1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Name it "Claude Code MCP"
4. Copy the token (starts with `sbp_`)

### Stripe (OAuth - no manual token needed)
- Stripe MCP uses OAuth authentication
- You'll be prompted to authorize when first connecting
- Manage sessions at: https://dashboard.stripe.com/settings/apps

### Cloudflare (OAuth - no manual token needed)
- Cloudflare MCP servers use OAuth
- You'll be prompted to authorize when first connecting

### GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:org`
4. Copy the token (starts with `ghp_`)

---

## Project-Specific Configuration

To scope Supabase to a specific project (recommended):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=your-project-ref-here"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

Find your project ref in your Supabase dashboard URL:
`https://supabase.com/dashboard/project/[PROJECT_REF]`
