-- Create automation_jobs table for job tracking
CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_automation_jobs_user_id ON public.automation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON public.automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_item_id ON public.automation_jobs(item_id);

-- Enable RLS
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own automation jobs"
  ON public.automation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation jobs"
  ON public.automation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation jobs"
  ON public.automation_jobs FOR UPDATE
  USING (auth.uid() = user_id);
