-- =============================================
-- Migration 003: Centralize Resources content in DB
-- (articles / videos / tips / breathing / podcasts)
--
-- NOTE: ไม่มี data seeds ในไฟล์นี้ เพราะเราปล่อยให้ frontend ใช้
-- ข้อมูลเริ่มต้น (INITIAL_* / SEED_PODCASTS) เป็น fallback อยู่ก่อน
-- หลัง admin กดบันทึกครั้งแรก ข้อมูลจริงจะถูกเก็บที่ DB นี้
-- ทำให้ทุก user เห็นชุดข้อมูลเดียวกันทุกเบราว์เซอร์
-- =============================================

-- 1. บทความ (Resources articles)
CREATE TABLE IF NOT EXISTS resource_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  read_time_min INT DEFAULT 3,
  url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  color TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. วิดีโอ (YouTube embed)
CREATE TABLE IF NOT EXISTS resource_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  embed_id TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. เคล็ดลับ
CREATE TABLE IF NOT EXISTS resource_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT DEFAULT '🌸',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ตั้งค่าแบบ key/value (ใช้กับ breathingConfig และรายการอื่น ๆ ได้)
CREATE TABLE IF NOT EXISTS resource_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. พอดแคสต์ตอน
CREATE TABLE IF NOT EXISTS resource_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_key TEXT UNIQUE,
  title TEXT NOT NULL,
  speaker TEXT DEFAULT 'ผู้พูดไร้นาม',
  category TEXT DEFAULT 'การหายใจ',
  duration_sec INT DEFAULT 0,
  cover_image TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  embed_url TEXT DEFAULT '',
  external_url TEXT DEFAULT '',
  external_label TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE resource_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_podcasts ENABLE ROW LEVEL SECURITY;

-- อ่านได้ทุกคน (public) — หน้า Resources โป่งอ่านรายงานเอง
CREATE POLICY "Anyone can read articles" ON resource_articles FOR SELECT USING (true);
CREATE POLICY "Anyone can read videos"   ON resource_videos   FOR SELECT USING (true);
CREATE POLICY "Anyone can read tips"     ON resource_tips     FOR SELECT USING (true);
CREATE POLICY "Anyone can read settings" ON resource_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can read podcasts" ON resource_podcasts FOR SELECT USING (true);

-- เขียน/แก้/ลบได้เฉพาะ authenticated จาก backend API
CREATE POLICY "Auth can write articles" ON resource_articles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can write videos"   ON resource_videos   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can write tips"     ON resource_tips     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can write settings" ON resource_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can write podcasts" ON resource_podcasts FOR ALL TO authenticated USING (true) WITH CHECK (true);