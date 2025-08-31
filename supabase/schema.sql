-- Contractor Platform Database Schema
-- Based on the architecture documentation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create custom types
CREATE TYPE user_role AS ENUM ('contractor', 'staff', 'sub', 'homeowner', 'admin');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE meeting_type AS ENUM ('consultation', 'progress_review', 'change_order', 'walkthrough', 'inspection');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE document_type AS ENUM ('plan', 'permit', 'contract', 'invoice', 'photo', 'other');
CREATE TYPE change_order_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'implemented');
CREATE TYPE notification_type AS ENUM ('meeting_reminder', 'task_due', 'message_received', 'document_uploaded', 'weather_alert', 'change_order_approval');

-- Tenants table (Multi-tenant support)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    profile JSONB NOT NULL DEFAULT '{}',
    auth_id UUID UNIQUE, -- Links to Supabase Auth or Ory Kratos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    status project_status DEFAULT 'planning',
    client_user_id UUID NOT NULL REFERENCES users(id),
    budget DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    type meeting_type NOT NULL,
    participants UUID[] DEFAULT '{}', -- Array of user IDs
    external_provider VARCHAR(20) CHECK (external_provider IN ('zoom', 'meet', 'jitsi')),
    recording_url TEXT,
    consent_given BOOLEAN DEFAULT false,
    status meeting_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    provider VARCHAR(50) DEFAULT 'assemblyai',
    language VARCHAR(10) DEFAULT 'en',
    text TEXT,
    segments JSONB DEFAULT '[]', -- Array of transcript segments with timestamps
    summary TEXT,
    action_items TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    assignees UUID[] DEFAULT '{}', -- Array of user IDs
    source_meeting_id UUID REFERENCES meetings(id),
    ack_contractor BOOLEAN DEFAULT false,
    ack_client BOOLEAN DEFAULT false,
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily logs table
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    notes TEXT,
    media JSONB DEFAULT '[]', -- Array of media files
    weather_data JSONB,
    location JSONB, -- GPS coordinates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type document_type NOT NULL,
    version INTEGER DEFAULT 1,
    storage_key TEXT NOT NULL, -- Key in Supabase Storage
    file_size BIGINT,
    mime_type VARCHAR(100),
    annotations JSONB DEFAULT '[]',
    linked_to JSONB, -- {meeting_id, task_id, change_order_id}
    expiration_date DATE, -- For permits
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change orders table
CREATE TABLE change_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status change_order_status DEFAULT 'draft',
    pdf_key TEXT, -- Storage key for generated PDF
    linked_meeting_id UUID REFERENCES meetings(id),
    approved_by_client UUID REFERENCES users(id),
    approved_by_contractor UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat channels table
CREATE TABLE chat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'project' CHECK (type IN ('project', 'team', 'client')),
    participants UUID[] DEFAULT '{}', -- Array of user IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
    attachments JSONB DEFAULT '[]',
    reply_to UUID REFERENCES chat_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_projects_client_user_id ON projects(client_user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_meetings_project_id ON meetings(project_id);
CREATE INDEX idx_meetings_starts_at ON meetings(starts_at);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_daily_logs_project_id ON daily_logs(project_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(date);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX idx_change_orders_status ON change_orders(status);
CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_change_orders_updated_at BEFORE UPDATE ON change_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_channels_updated_at BEFORE UPDATE ON chat_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (will need to be expanded based on specific requirements)
CREATE POLICY "Users can view their own tenant" ON tenants FOR SELECT USING (
    id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
);

CREATE POLICY "Users can view users in their tenant" ON users FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
);

CREATE POLICY "Users can view projects in their tenant" ON projects FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
);

-- Add more RLS policies as needed for each table...