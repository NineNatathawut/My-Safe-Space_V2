-- =============================================
-- Migration 008: Home page articles ("บทความและเทคนิคสำหรับคุณ")
-- ให้ admin เพิ่ม/แก้/ลบ การ์ดบทความบนหน้าหลักได้ และบันทึกลง DB
--
-- NOTE: ไม่มี data seeds — frontend ใช้ INITIAL_ARTICLES เป็น fallback
-- จนกว่า admin จะกดบันทึกครั้งแรก (กำหนด flag home_articles_initialized)
-- =============================================

CREATE TABLE IF NOT EXISTS home_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  badge_color TEXT DEFAULT 'bg-owl-soft text-owl-pressed',
  action_text TEXT DEFAULT 'อ่านต่อ',
  link TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE home_articles ENABLE ROW LEVEL SECURITY;

-- อ่านได้ทุกคน (public) — หน้า Home โหลดการ์ด
CREATE POLICY "Anyone can read home_articles" ON home_articles FOR SELECT USING (true);

-- เขียน/แก้/ลบได้เฉพาะ authenticated จาก backend API
CREATE POLICY "Auth can write home_articles" ON home_articles FOR ALL TO authenticated USING (true) WITH CHECK (true);