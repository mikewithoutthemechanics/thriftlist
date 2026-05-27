-- Create scheduled_postings table
CREATE TABLE IF NOT EXISTS public.scheduled_postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_postings_user_id ON public.scheduled_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_postings_status ON public.scheduled_postings(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_postings_scheduled_at ON public.scheduled_postings(scheduled_at);

-- Enable RLS
ALTER TABLE public.scheduled_postings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scheduled postings"
  ON public.scheduled_postings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled postings"
  ON public.scheduled_postings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled postings"
  ON public.scheduled_postings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled postings"
  ON public.scheduled_postings FOR DELETE
  USING (auth.uid() = user_id);
