-- =============================================
-- Migration: Friend Profile + Expert Profile
-- =============================================

-- 1. เพิ่ม column ให้ expert_verifications
ALTER TABLE expert_verifications
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS affiliation TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT '';

-- 2. ตารางสำหรับ Avatar system
CREATE TABLE IF NOT EXISTS user_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_type TEXT NOT NULL DEFAULT 'emoji' CHECK (avatar_type IN ('emoji', 'preset', 'expert_upload')),
  avatar_value TEXT NOT NULL DEFAULT '🐱',
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Enable Row Level Security
ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

-- 4. Policies: user สามารถอ่าน/แก้ไขของตัวเองได้, admin อ่านทั้งหมดได้
CREATE POLICY "Users can read own avatar"
  ON user_avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own avatar"
  ON user_avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar"
  ON user_avatars FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Public read: ใครก็อ่าน avatar ของคนอื่นได้ (สำหรับหน้า user profile)
CREATE POLICY "Anyone can read avatars"
  ON user_avatars FOR SELECT
  USING (true);

-- 6. Expert upload policy (เฉพาะ expert)
CREATE POLICY "Experts can upload avatar"
  ON user_avatars FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'expert'
    )
  );

-- 7. Create storage bucket for expert avatars (ต้องรันผ่าน Supabase Dashboard ด้วย)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('expert-avatars', 'expert-avatars', true)
-- ON CONFLICT (id) DO NOTHING;