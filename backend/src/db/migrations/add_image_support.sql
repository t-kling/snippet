-- Add image support to snippets table
ALTER TABLE snippets ADD COLUMN image_data TEXT;

-- Add comment
COMMENT ON COLUMN snippets.image_data IS 'Base64 encoded WebP image data (max 300KB compressed)';
