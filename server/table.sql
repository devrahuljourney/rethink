-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Daily Usage Summaries
CREATE TABLE daily_usage_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_usage_ms BIGINT NOT NULL,
    category_summaries JSONB,
    insight_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- App Usage Details
CREATE TABLE app_usage_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id UUID REFERENCES daily_usage_summaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    app_name TEXT,
    package_name TEXT NOT NULL,
    usage_ms BIGINT NOT NULL,
    launches INTEGER DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_usage_summaries_user_date ON daily_usage_summaries(user_id, date);
CREATE INDEX idx_app_usage_summary_id ON app_usage_details(summary_id);
CREATE INDEX idx_app_usage_user_date ON app_usage_details(user_id, date);
