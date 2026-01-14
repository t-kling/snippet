-- Add image_clozes column to store rectangle positions for image occlusion
ALTER TABLE snippets ADD COLUMN image_clozes JSONB DEFAULT '[]';

COMMENT ON COLUMN snippets.image_clozes IS 'Array of rectangles for image occlusion: [{x, y, width, height, id}, ...]';
