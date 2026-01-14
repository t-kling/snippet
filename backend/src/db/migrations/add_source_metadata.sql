-- Add source metadata fields to snippets table
ALTER TABLE snippets ADD COLUMN title VARCHAR(500);
ALTER TABLE snippets ADD COLUMN author VARCHAR(255);
ALTER TABLE snippets ADD COLUMN url TEXT;
ALTER TABLE snippets ADD COLUMN page VARCHAR(50);
ALTER TABLE snippets ADD COLUMN timestamp VARCHAR(50);
ALTER TABLE snippets ADD COLUMN why_made_this TEXT;

-- Add created_at if it doesn't exist (it should already exist)
-- ALTER TABLE snippets ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN snippets.title IS 'Source title (mandatory for new workflow)';
COMMENT ON COLUMN snippets.author IS 'Source author (optional)';
COMMENT ON COLUMN snippets.url IS 'Source URL (optional)';
COMMENT ON COLUMN snippets.page IS 'Page number or location (optional)';
COMMENT ON COLUMN snippets.timestamp IS 'Timestamp for audio/video sources (optional)';
COMMENT ON COLUMN snippets.why_made_this IS 'Personal note about why this card was created (optional)';
