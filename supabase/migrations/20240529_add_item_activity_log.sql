-- Item activity log for tracking edits
CREATE TABLE IF NOT EXISTS item_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'posted', 'sold', 'price_changed', 'deleted'
  field TEXT, -- e.g. 'title', 'price', 'description' for update actions
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_item_activity_log_item_id ON item_activity_log(item_id);
CREATE INDEX idx_item_activity_log_user_id ON item_activity_log(user_id);
CREATE INDEX idx_item_activity_log_created_at ON item_activity_log(created_at DESC);
