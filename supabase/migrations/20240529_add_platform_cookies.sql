-- Platform cookie persistence for automated posting
CREATE TABLE IF NOT EXISTS platform_cookies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  cookies jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- Enable RLS
ALTER TABLE platform_cookies ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own cookies
CREATE POLICY "Users can manage their own platform cookies"
  ON platform_cookies
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_cookies_user_platform
  ON platform_cookies (user_id, platform);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_cookies_updated_at
  BEFORE UPDATE ON platform_cookies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
