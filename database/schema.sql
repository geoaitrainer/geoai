-- ============================================================
-- AI პირადი ტრენერი და კვების სპეციალისტი — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- =====================
-- PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  age             INT CHECK (age BETWEEN 10 AND 120),
  gender          TEXT CHECK (gender IN ('male', 'female')),
  height_cm       DECIMAL(5,1),
  weight_kg       DECIMAL(5,1),
  goal            TEXT CHECK (goal IN ('lose_weight', 'gain_muscle', 'maintain')),
  activity_level  TEXT CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  work_type       TEXT CHECK (work_type IN ('desk','standing','physical')),
  experience      TEXT CHECK (experience IN ('beginner','intermediate','advanced')),
  allergies       TEXT[] DEFAULT '{}',
  conditions      TEXT[] DEFAULT '{}',
  liked_foods     TEXT[] DEFAULT '{}',
  disliked_foods  TEXT[] DEFAULT '{}',
  daily_budget    DECIMAL(8,2) DEFAULT 50,
  -- Calculated fields (auto-updated via API)
  bmr             DECIMAL(8,2),
  tdee            DECIMAL(8,2),
  calorie_goal    DECIMAL(8,2),
  protein_g       DECIMAL(6,1),
  fat_g           DECIMAL(6,1),
  carbs_g         DECIMAL(6,1),
  -- Subscription
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','premium')),
  is_admin        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MEAL PLANS
-- =====================
CREATE TABLE IF NOT EXISTS meal_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('7day','30day')),
  content     JSONB NOT NULL,
  week_number INT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- FOOD DIARY
-- =====================
CREATE TABLE IF NOT EXISTS food_diary (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type     TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_name     TEXT NOT NULL,
  amount_g      DECIMAL(6,1),
  calories      DECIMAL(7,1) DEFAULT 0,
  protein_g     DECIMAL(6,1) DEFAULT 0,
  fat_g         DECIMAL(6,1) DEFAULT 0,
  carbs_g       DECIMAL(6,1) DEFAULT 0,
  photo_url     TEXT,
  ai_assessment TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- WORKOUT PROGRAMS
-- =====================
CREATE TABLE IF NOT EXISTS workout_programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('gym','home')),
  level       TEXT NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  content     JSONB NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id      UUID REFERENCES workout_programs(id) ON DELETE SET NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  day_name        TEXT,
  exercises_done  JSONB DEFAULT '[]',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PROGRESS TRACKING
-- =====================
CREATE TABLE IF NOT EXISTS progress_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   DECIMAL(5,1),
  waist_cm    DECIMAL(5,1),
  chest_cm    DECIMAL(5,1),
  biceps_cm   DECIMAL(5,1),
  photo_url   TEXT,
  ai_review   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- CHAT MESSAGES
-- =====================
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SUBSCRIPTIONS
-- =====================
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('free','pro','premium')),
  status          TEXT NOT NULL CHECK (status IN ('active','cancelled','expired')),
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  payment_method  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_diary        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_programs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;

-- Users see only their own data
CREATE POLICY "profiles_own"          ON profiles         FOR ALL USING ((SELECT auth.uid()) = id);
CREATE POLICY "meal_plans_own"        ON meal_plans       FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "food_diary_own"        ON food_diary       FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "workout_programs_own"  ON workout_programs FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "workout_logs_own"      ON workout_logs     FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "progress_own"          ON progress_entries FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "chat_own"              ON chat_messages    FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "subscriptions_own"     ON subscriptions    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Admin can read all profiles
CREATE POLICY "admin_read_profiles" ON profiles FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_food_diary_user_date    ON food_diary(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user_date      ON progress_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_chat_user_created       ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date  ON workout_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_active  ON meal_plans(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_workout_prog_user_active ON workout_programs(user_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STORAGE BUCKET for progress photos
-- Run in Supabase Dashboard > Storage:
-- Create bucket "progress-photos" (private)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);

-- Storage RLS policy (run after creating bucket):
-- CREATE POLICY "Users upload own photos" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "Users read own photos" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
