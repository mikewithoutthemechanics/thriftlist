-- Create price history table
CREATE TABLE IF NOT EXISTS public.price_history (
  id BIGSERIAL PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_price_history_item_id ON public.price_history(item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_user_id ON public.price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON public.price_history(changed_at DESC);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own price history" ON public.price_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price history" ON public.price_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically track price changes
CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.price_history (item_id, user_id, old_price, new_price)
    VALUES (NEW.id, NEW.user_id, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_price_change
  AFTER UPDATE ON public.items
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION track_price_change();
