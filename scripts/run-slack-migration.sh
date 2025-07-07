#!/bin/bash

# Run Slack integration migration script
# This script creates the necessary tables for Slack integration

echo "Running Slack integration migration..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql is not installed or not in PATH"
    exit 1
fi

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to your Supabase database URL"
    exit 1
fi

# Run the migration
echo "Creating Slack integration tables..."
psql "$DATABASE_URL" -f scripts/create-slack-integration-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Slack integration migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Create a Slack app at https://api.slack.com/apps"
    echo "2. Add the following OAuth scopes:"
    echo "   - chat:write"
    echo "   - channels:read"
    echo "   - groups:read"
    echo "   - im:read"
    echo "   - mpim:read"
    echo "   - users:read"
    echo "3. Set the redirect URL to: https://your-domain.com/api/slack/oauth/callback"
    echo "4. Add SLACK_CLIENT_ID and SLACK_CLIENT_SECRET to your environment variables"
else
    echo "❌ Slack integration migration failed!"
    exit 1
fi 