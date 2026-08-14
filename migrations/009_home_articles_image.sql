-- =============================================
-- Migration 009: เพิ่มคอลัมน์รูปภาพปกสำหรับการ์ด "บทความและเทคนิค" (home_articles)
--
-- NOTE: รันผ่าน SQL Editor ของ Supabase เท่านั้น (repo ไม่มี auto-migrate)
-- =============================================

ALTER TABLE home_articles
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';