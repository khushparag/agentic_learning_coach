# Postgres Data Model & Migrations

## Database Design Principles

### MUST Use Postgres as System of Record
**NEVER** store transactional data in vector databases or caches:
- User profiles and authentication
- Learning plans and curriculum state
- Exercise submissions and evaluations
- Progress tracking and analytics
- Agent conversation history

### Schema Design Rules
```sql
-- ✅ Good: Normalized, typed, constrained
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_level skill_level_enum NOT NULL,
  goals JSONB NOT NULL DEFAULT '[]',
  time_constraints JSONB NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ Bad: Denormalized, untyped
CREATE TABLE user_data (
  id SERIAL,
  stuff TEXT
);
```

## Core Data Models

### User Management
```sql
CREATE TYPE skill_level_enum AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE learning_style_enum AS ENUM ('visual', 'auditory', 'kinesthetic', 'reading');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_level skill_level_enum NOT NULL,
  learning_style learning_style_enum,
  goals JSONB NOT NULL DEFAULT '[]', -- Array of learning objectives
  time_constraints JSONB NOT NULL, -- {hoursPerWeek: 5, preferredTimes: [...]}
  preferences JSONB NOT NULL DEFAULT '{}', -- UI preferences, notification settings
  assessment_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Curriculum & Learning Paths
```sql
CREATE TYPE curriculum_status_enum AS ENUM ('draft', 'active', 'completed', 'paused');

CREATE TABLE curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status curriculum_status_enum DEFAULT 'draft',
  total_topics INTEGER NOT NULL DEFAULT 0,
  completed_topics INTEGER NOT NULL DEFAULT 0,
  estimated_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 10),
  prerequisites JSONB DEFAULT '[]', -- Array of topic IDs
  learning_objectives JSONB NOT NULL, -- Array of specific objectives
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Exercises & Submissions
```sql
CREATE TYPE exercise_type_enum AS ENUM ('coding', 'quiz', 'project', 'review');
CREATE TYPE submission_status_enum AS ENUM ('pending', 'passed', 'failed', 'needs_review');

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type exercise_type_enum NOT NULL,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 10),
  instructions JSONB NOT NULL, -- Structured exercise data
  test_cases JSONB, -- For coding exercises
  solution_template TEXT,
  hints JSONB DEFAULT '[]',
  time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  code TEXT, -- For coding exercises
  answers JSONB, -- For quiz exercises
  status submission_status_enum DEFAULT 'pending',
  score DECIMAL(5,2), -- 0.00 to 100.00
  execution_time_ms INTEGER,
  memory_used_mb INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ
);
```

### Feedback & Progress Tracking
```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL, -- Which agent provided evaluation
  passed BOOLEAN NOT NULL,
  test_results JSONB, -- Detailed test execution results
  feedback JSONB NOT NULL, -- Structured feedback with issues and suggestions
  suggestions JSONB DEFAULT '[]', -- Next steps and improvements
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  best_score DECIMAL(5,2),
  time_spent_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);
```

## Migration Strategy

### MUST Use Versioned Migrations
```typescript
// migrations/001_initial_schema.ts
export async function up(db: Database): Promise<void> {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TYPE skill_level_enum AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
    -- ... rest of schema
  `);
}

export async function down(db: Database): Promise<void> {
  await db.query(`
    DROP TABLE IF EXISTS progress_tracking CASCADE;
    DROP TABLE IF EXISTS evaluations CASCADE;
    -- ... reverse order
  `);
}
```

### Migration Rules
```typescript
// ✅ Good: Safe migration
export async function up(db: Database): Promise<void> {
  // Add column with default
  await db.query(`
    ALTER TABLE learning_profiles 
    ADD COLUMN learning_style learning_style_enum DEFAULT 'visual'
  `);
  
  // Backfill data
  await db.query(`
    UPDATE learning_profiles 
    SET learning_style = 'kinesthetic' 
    WHERE preferences->>'preferredStyle' = 'hands-on'
  `);
}

// ❌ Bad: Breaking migration
export async function up(db: Database): Promise<void> {
  // This breaks existing data
  await db.query(`
    ALTER TABLE users DROP COLUMN email
  `);
}
```

## Query Patterns

### MUST Use Prepared Statements
```typescript
// ✅ Good: Parameterized query
const getUserProgress = async (userId: string, topicId: string) => {
  const result = await db.query(`
    SELECT pt.*, lt.title, lt.difficulty_level
    FROM progress_tracking pt
    JOIN learning_topics lt ON pt.topic_id = lt.id
    WHERE pt.user_id = $1 AND pt.topic_id = $2
  `, [userId, topicId]);
  
  return result.rows[0];
};

// ❌ Bad: SQL injection risk
const getUserProgress = async (userId: string) => {
  const result = await db.query(`
    SELECT * FROM progress_tracking WHERE user_id = '${userId}'
  `);
};
```

### Efficient Queries for Agent Operations
```typescript
// Get learner context efficiently
const getLearnerContext = async (userId: string) => {
  return await db.query(`
    SELECT 
      u.id, u.email,
      lp.skill_level, lp.goals, lp.preferences,
      c.id as curriculum_id, c.title as curriculum_title,
      lt.id as current_topic_id, lt.title as current_topic
    FROM users u
    JOIN learning_profiles lp ON u.id = lp.user_id
    LEFT JOIN curricula c ON u.id = c.user_id AND c.status = 'active'
    LEFT JOIN learning_topics lt ON c.id = lt.curriculum_id 
      AND NOT EXISTS (
        SELECT 1 FROM progress_tracking pt 
        WHERE pt.user_id = u.id AND pt.topic_id = lt.id AND pt.completed = true
      )
    WHERE u.id = $1
    ORDER BY lt.order_index
    LIMIT 1
  `, [userId]);
};
```