-- ============================================================
-- Concept Mastery & Misconception Tracker Schema for SmartTutorAI
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Concept Mastery Table
CREATE TABLE IF NOT EXISTS public.concept_mastery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    learning_space_id UUID NOT NULL REFERENCES public.learning_space(id) ON DELETE CASCADE,
    concept_name TEXT NOT NULL,
    mastery_score FLOAT NOT NULL DEFAULT 0.5,   -- 0.0 to 1.0 (Bayesian / EWMA updated)
    attempts_count INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'developing',  -- 'struggling' | 'developing' | 'mastered'
    misconceptions JSONB NOT NULL DEFAULT '[]'::jsonb,  -- list of diagnosed misconceptions
    efactor FLOAT NOT NULL DEFAULT 2.5,         -- SM-2 easiness factor
    interval_days INT NOT NULL DEFAULT 1,       -- SM-2 interval
    repetition INT NOT NULL DEFAULT 0,          -- SM-2 consecutive repetitions
    last_reviewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    next_review_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, learning_space_id, concept_name)
);

-- Index for querying a student's concept mastery per space
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user_space 
    ON public.concept_mastery(user_id, learning_space_id);

CREATE INDEX IF NOT EXISTS idx_concept_mastery_next_review 
    ON public.concept_mastery(user_id, next_review_at);

-- 2. Misconception Diagnostic Logs Table
CREATE TABLE IF NOT EXISTS public.misconception_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    learning_space_id UUID NOT NULL REFERENCES public.learning_space(id) ON DELETE CASCADE,
    concept_name TEXT NOT NULL,
    question_text TEXT NOT NULL,
    chosen_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    diagnosed_misconception TEXT NOT NULL,
    remediation_advice TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_misconception_logs_user 
    ON public.misconception_logs(user_id, learning_space_id);
