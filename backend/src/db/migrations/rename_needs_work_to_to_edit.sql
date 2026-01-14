-- Rename needs_work column to to_edit for clarity
ALTER TABLE snippets RENAME COLUMN needs_work TO to_edit;
