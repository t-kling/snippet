-- Add priority field to snippets table
ALTER TABLE snippets ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
