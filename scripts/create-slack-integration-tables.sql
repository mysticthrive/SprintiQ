-- Create Slack integration tables
-- This script adds tables for storing Slack workspace connections and channel mappings

-- Slack integrations table
CREATE TABLE IF NOT EXISTS slack_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    slack_workspace_id VARCHAR(255) NOT NULL,
    slack_workspace_name VARCHAR(255) NOT NULL,
    slack_workspace_domain VARCHAR(255),
    access_token TEXT NOT NULL,
    bot_user_id VARCHAR(255),
    bot_username VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, slack_workspace_id)
);

-- Slack channel mappings table
CREATE TABLE IF NOT EXISTS slack_channel_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slack_integration_id UUID NOT NULL REFERENCES slack_integrations(id) ON DELETE CASCADE,
    channel_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    channel_type VARCHAR(50) NOT NULL, -- 'public', 'private', 'dm', 'mpim'
    entity_type VARCHAR(50) NOT NULL, -- 'space', 'project', 'sprint', 'workspace'
    entity_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slack_integration_id, channel_id, entity_type, entity_id)
);

-- Slack notification settings table
CREATE TABLE IF NOT EXISTS slack_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slack_integration_id UUID NOT NULL REFERENCES slack_integrations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'task_created', 'task_updated', 'task_completed', etc.
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slack_integration_id, event_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slack_integrations_workspace_id ON slack_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_integrations_slack_workspace_id ON slack_integrations(slack_workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_channel_mappings_integration_id ON slack_channel_mappings(slack_integration_id);
CREATE INDEX IF NOT EXISTS idx_slack_channel_mappings_entity ON slack_channel_mappings(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_slack_notification_settings_integration_id ON slack_notification_settings(slack_integration_id);

-- Add RLS policies
ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_channel_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for slack_integrations
CREATE POLICY "Users can view slack integrations for their workspaces" ON slack_integrations
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Workspace owners can manage slack integrations" ON slack_integrations
    FOR ALL USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN workspace_members wm ON w.id = wm.workspace_id
            WHERE wm.user_id = auth.uid() 
            AND wm.status = 'active' 
            AND (wm.role = 'owner' OR wm.role = 'admin')
        )
    );

-- RLS policies for slack_channel_mappings
CREATE POLICY "Users can view channel mappings for their workspaces" ON slack_channel_mappings
    FOR SELECT USING (
        slack_integration_id IN (
            SELECT si.id FROM slack_integrations si
            JOIN workspace_members wm ON si.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.status = 'active'
        )
    );

CREATE POLICY "Workspace owners can manage channel mappings" ON slack_channel_mappings
    FOR ALL USING (
        slack_integration_id IN (
            SELECT si.id FROM slack_integrations si
            JOIN workspaces w ON si.workspace_id = w.id
            JOIN workspace_members wm ON w.id = wm.workspace_id
            WHERE wm.user_id = auth.uid() 
            AND wm.status = 'active' 
            AND (wm.role = 'owner' OR wm.role = 'admin')
        )
    );

-- RLS policies for slack_notification_settings
CREATE POLICY "Users can view notification settings for their workspaces" ON slack_notification_settings
    FOR SELECT USING (
        slack_integration_id IN (
            SELECT si.id FROM slack_integrations si
            JOIN workspace_members wm ON si.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.status = 'active'
        )
    );

CREATE POLICY "Workspace owners can manage notification settings" ON slack_notification_settings
    FOR ALL USING (
        slack_integration_id IN (
            SELECT si.id FROM slack_integrations si
            JOIN workspaces w ON si.workspace_id = w.id
            JOIN workspace_members wm ON w.id = wm.workspace_id
            WHERE wm.user_id = auth.uid() 
            AND wm.status = 'active' 
            AND (wm.role = 'owner' OR wm.role = 'admin')
        )
    );

-- Note: Default notification settings will be created when a Slack integration is first created
-- This ensures each integration has its own notification preferences 