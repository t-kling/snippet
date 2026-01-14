-- Complete production schema with all migrations applied

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Snippets table (with all migrations applied)
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('excerpt', 'revised', 'original')),
  source TEXT,
  content TEXT,
  cloze_data JSONB DEFAULT '[]'::jsonb,
  in_queue BOOLEAN DEFAULT true,
  to_edit BOOLEAN DEFAULT false,
  image_data TEXT,
  image_clozes JSONB DEFAULT '[]'::jsonb,
  author TEXT,
  url TEXT,
  page TEXT,
  timestamp TEXT,
  why_made_this TEXT,
  parent_snippet TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Snippet topics junction table
CREATE TABLE snippet_topics (
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (snippet_id, topic_id)
);

-- Reviews table for spaced repetition
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ease_factor FLOAT DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reviewed_at TIMESTAMP,
  UNIQUE(snippet_id)
);

-- Indexes for performance
CREATE INDEX idx_snippets_user_id ON snippets(user_id);
CREATE INDEX idx_snippets_in_queue ON snippets(in_queue);
CREATE INDEX idx_snippets_to_edit ON snippets(to_edit);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_next_review_date ON reviews(next_review_date);
CREATE INDEX idx_snippet_topics_snippet_id ON snippet_topics(snippet_id);
CREATE INDEX idx_snippet_topics_topic_id ON snippet_topics(topic_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snippets_updated_at BEFORE UPDATE ON snippets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
