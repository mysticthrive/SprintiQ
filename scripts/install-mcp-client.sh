#!/bin/bash

# SprintiQ MCP Client Installation Script
# This script helps international users set up the MCP client for their AI tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLIENT_VERSION="1.0.0"
SPRINTIQ_URL="https://app.sprintiq.ai"
GITHUB_REPO="https://github.com/your-org/sprint-iq"
CLIENT_SCRIPT_URL="$GITHUB_REPO/raw/main/scripts/sprintiq-mcp-client.js"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}    SprintiQ MCP Client Installation       ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js from https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed${NC}"
    echo -e "${YELLOW}Please install curl first${NC}"
    exit 1
fi

# Create installation directory
INSTALL_DIR="$HOME/.sprintiq-mcp"
mkdir -p "$INSTALL_DIR"

echo -e "${BLUE}Installing SprintiQ MCP Client...${NC}"

# Download the client script
echo -e "${YELLOW}Downloading MCP client script...${NC}"
curl -L -o "$INSTALL_DIR/sprintiq-mcp-client.js" "$CLIENT_SCRIPT_URL"

# Make it executable
chmod +x "$INSTALL_DIR/sprintiq-mcp-client.js"

# Create a wrapper script
cat > "$INSTALL_DIR/run-client.sh" << 'EOF'
#!/bin/bash
export SPRINTIQ_MCP_URL="${SPRINTIQ_MCP_URL:-https://app.sprintiq.ai/api/mcp/server}"
export LOG_LEVEL="${LOG_LEVEL:-info}"
export LOG_FILE="${LOG_FILE:-$HOME/.sprintiq-mcp/client.log}"

exec node "$HOME/.sprintiq-mcp/sprintiq-mcp-client.js" "$@"
EOF

chmod +x "$INSTALL_DIR/run-client.sh"

# Create Claude Desktop configuration
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/.config/claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
else
    CLAUDE_CONFIG_DIR="$APPDATA/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
fi

echo -e "${BLUE}Setting up Claude Desktop configuration...${NC}"

# Create config directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR"

# Create or update Claude config
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo -e "${YELLOW}Found existing Claude config, creating backup...${NC}"
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create Claude configuration
cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "sprintiq": {
      "command": "bash",
      "args": ["$INSTALL_DIR/run-client.sh"],
      "env": {
        "SPRINTIQ_MCP_URL": "$SPRINTIQ_URL/api/mcp/server",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
EOF

# Create Cursor configuration
CURSOR_CONFIG_FILE="$HOME/.cursor/cursor_settings.json"
if [ -d "$HOME/.cursor" ]; then
    echo -e "${BLUE}Setting up Cursor configuration...${NC}"
    
    # Create cursor config directory if it doesn't exist
    mkdir -p "$HOME/.cursor"
    
    # Create or update Cursor config
    if [ -f "$CURSOR_CONFIG_FILE" ]; then
        echo -e "${YELLOW}Found existing Cursor config, creating backup...${NC}"
        cp "$CURSOR_CONFIG_FILE" "$CURSOR_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    cat > "$CURSOR_CONFIG_FILE" << EOF
{
  "mcp": {
    "enabled": true,
    "servers": {
      "sprintiq": {
        "command": "bash",
        "args": ["$INSTALL_DIR/run-client.sh"],
        "env": {
          "SPRINTIQ_MCP_URL": "$SPRINTIQ_URL/api/mcp/server",
          "NODE_ENV": "production",
          "LOG_LEVEL": "info"
        },
        "description": "SprintiQ MCP Server - Task management and AI features"
      }
    }
  }
}
EOF
fi

# Create a test script
cat > "$INSTALL_DIR/test-connection.js" << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Testing SprintiQ MCP connection...');

try {
  const result = execSync('curl -s -X GET "' + (process.env.SPRINTIQ_MCP_URL || 'https://app.sprintiq.ai/api/mcp/server') + '"', { encoding: 'utf8' });
  const data = JSON.parse(result);
  
  if (data.server && data.server.name === 'SprintiQ MCP Server') {
    console.log('✓ Connection successful!');
    console.log('✓ Server:', data.server.name, 'v' + data.server.version);
    console.log('✓ Status:', data.status);
    console.log('✓ Available endpoints:', Object.keys(data.endpoints).join(', '));
  } else {
    console.log('✗ Unexpected response from server');
    console.log('Response:', result);
  }
} catch (error) {
  console.log('✗ Connection failed:', error.message);
  console.log('Please check:');
  console.log('  1. Your internet connection');
  console.log('  2. The server URL:', process.env.SPRINTIQ_MCP_URL || 'https://app.sprintiq.ai/api/mcp/server');
  console.log('  3. Your firewall settings');
}
EOF

chmod +x "$INSTALL_DIR/test-connection.js"

# Create documentation
cat > "$INSTALL_DIR/README.md" << 'EOF'
# SprintiQ MCP Client

## Installation Complete!

Your SprintiQ MCP client has been installed successfully.

### Files installed:
- `sprintiq-mcp-client.js` - Main client script
- `run-client.sh` - Wrapper script with environment setup
- `test-connection.js` - Connection test utility
- `README.md` - This documentation

### Configuration:
- Claude Desktop: Configuration updated automatically
- Cursor IDE: Configuration updated automatically (if Cursor is installed)

### Usage:

1. **Register on SprintiQ**: Visit https://app.sprintiq.ai/signup
2. **Wait for approval**: Admin approval required for MCP access
3. **Test connection**: Run `node test-connection.js`
4. **Start using**: Your AI tools should now have access to SprintiQ

### Environment Variables:
- `SPRINTIQ_MCP_URL`: Server URL (default: https://app.sprintiq.ai/api/mcp/server)
- `LOG_LEVEL`: Logging level (error, warn, info, debug)
- `LOG_FILE`: Log file location

### Available Tools:
- `generateUserStories` - Generate user stories with AI
- `createTask` - Create new tasks
- `updateTask` - Update existing tasks
- `listTasks` - List and filter tasks
- `findSimilarTasks` - Find similar tasks
- `assignTask` - Assign tasks to team members
- `generateSprintGoal` - Generate sprint goals

### Support:
- Documentation: https://app.sprintiq.ai/docs/mcp
- Issues: https://github.com/your-org/sprint-iq/issues
- Email: support@sprintiq.ai

### Troubleshooting:
- Check logs: `tail -f ~/.sprintiq-mcp/client.log`
- Test connection: `node ~/.sprintiq-mcp/test-connection.js`
- Restart AI tool after configuration changes
EOF

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}         Installation Complete!             ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1.${NC} Register at: $SPRINTIQ_URL/signup"
echo -e "${BLUE}2.${NC} Wait for admin approval"
echo -e "${BLUE}3.${NC} Test connection: node $INSTALL_DIR/test-connection.js"
echo -e "${BLUE}4.${NC} Restart Claude Desktop or Cursor"
echo -e "${BLUE}5.${NC} Start using SprintiQ MCP tools!"
echo ""
echo -e "${YELLOW}Installation directory:${NC} $INSTALL_DIR"
echo -e "${YELLOW}Log file:${NC} $INSTALL_DIR/client.log"
echo -e "${YELLOW}Documentation:${NC} $INSTALL_DIR/README.md"
echo ""
echo -e "${GREEN}Happy coding with SprintiQ! 🚀${NC}" 