-- 1. AI Provider Telemetry SQL
CREATE TABLE IF NOT EXISTS public.ai_provider_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    task TEXT NOT NULL,
    latency FLOAT NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for analytics performance
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_task ON public.ai_provider_logs(task);
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_created_at ON public.ai_provider_logs(created_at DESC);

-- 2. Content Caching SQL
CREATE TABLE IF NOT EXISTS public.content_cache (
    cache_key TEXT PRIMARY KEY,
    task TEXT NOT NULL,
    output JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optional: Enable RLS or grant access (Adjust as per your Supabase config)
ALTER TABLE public.ai_provider_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write (standard for private DB access)
CREATE POLICY "Allow All for Authenticated" ON public.ai_provider_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow All for Authenticated" ON public.content_cache FOR ALL USING (auth.role() = 'authenticated');
