-- Add item_hash column for duplicate detection
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS item_hash TEXT;

-- Create index on item_hash for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_items_hash ON public.items(item_hash);

-- Add unique constraint per user to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_user_hash ON public.items(user_id, item_hash) WHERE item_hash IS NOT NULL;
