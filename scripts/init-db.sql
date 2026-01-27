-- =============================================================================
-- Database Initialization Script
-- =============================================================================
-- This script is run when the PostgreSQL container starts for the first time.
-- It sets up extensions and initial configuration.
--
-- Note: Tables are created via Alembic migrations, not this script.
-- =============================================================================

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set timezone to UTC
SET timezone = 'UTC';

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE skill_level_enum AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE learning_style_enum AS ENUM ('visual', 'auditory', 'kinesthetic', 'reading', 'hands_on');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_type_enum AS ENUM ('coding', 'quiz', 'project', 'review', 'reading');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status_enum AS ENUM ('pending', 'passed', 'failed', 'needs_review', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_status_enum AS ENUM ('draft', 'active', 'completed', 'paused', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions (for development)
-- In production, use more restrictive permissions
GRANT ALL PRIVILEGES ON DATABASE learning_coach TO postgres;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed at %', NOW();
END $$;