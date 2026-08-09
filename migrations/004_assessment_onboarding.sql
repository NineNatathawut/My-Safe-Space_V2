-- =============================================
-- Migration 004: Assessment History + Onboarding
--
-- 1) assessments.code      → ระบุว่าเป็น "Standard Assessment" (เช่น 'st5')
--                            ถ้า code เป็น NULL/CUML ค่า จะถือเป็น "แบบสอบถามทั่วไป"
--                            ที่ทำเสร็จแล้วไม่บันทึกผล (Self-Discovery)
-- 2) interpretation_rules.severity → ระดับผล (normal/moderate/severe/critical)
-- 3) assessment_submissions        → ประวัติคะแนนของแต่ละคน (เฉพาะ Standard)
-- 4) user_assessment_status        → สถานะ onboarding + baseline + last check-in
-- =============================================

-- 1. เพิ่มช่อง code สำหรับระบุแบบประเมินมาตรฐาน (เช่น 'st5')
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS code TEXT;

-- 2. เพิ่มช่อง severity ให้เกณฑ์การแปลผล
ALTER TABLE interpretation_rules
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'normal';

-- 3. เก็บประวัติการทำแบบประเมิน (เฉพาะ Standard: มี code เสมอ)
CREATE TABLE IF NOT EXISTS assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  assessment_code TEXT,
  assessment_title TEXT DEFAULT '',
  total_score INT DEFAULT 0,
  max_score INT DEFAULT 0,
  severity TEXT DEFAULT 'normal',
  rule_title TEXT DEFAULT '',
  rule_color TEXT DEFAULT 'indigo',
  answers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_submissions_user_created_idx
  ON assessment_submissions (user_id, created_at DESC);

-- 3. สถานะเกี่ยวกับสุขภาพใจของแต่ละ user (onboarding / baseline / ล่าสุด)
CREATE TABLE IF NOT EXISTS user_assessment_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  baseline_score INT,
  baseline_at TIMESTAMPTZ,
  last_assessed_at TIMESTAMPTZ,
  last_score INT,
  last_severity TEXT DEFAULT 'normal',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_status ENABLE ROW LEVEL SECURITY;

-- ผู้ใช้สามารถอ่าน/สร้าง/ลบผลประเมินของตัวเอง
CREATE POLICY "Users can read own submissions"
  ON assessment_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON assessment_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
  ON assessment_submissions FOR DELETE
  USING (auth.uid() = user_id);

-- ผู้ใช้สามารถอ่าน/อัปเดตสถานะของตัวเอง
CREATE POLICY "Users can read own status"
  ON user_assessment_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own status"
  ON user_assessment_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status"
  ON user_assessment_status FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin อ่านได้ทั้งหมด
CREATE POLICY "Admin can read all submissions"
  ON assessment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin can read all status"
  ON user_assessment_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );