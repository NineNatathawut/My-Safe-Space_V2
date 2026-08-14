-- =============================================
-- Migration 011: ปักหมุดการ์ดโชว์หน้าแรก (สูงสุด 3)
-- ให้ admin เลือกเองว่าการ์ดไหนโชว์บนหน้า Home
-- การ์ดที่ไม่ได้ปักหมุดยังคงอยู่ที่หน้า /resources
-- =============================================

ALTER TABLE home_articles ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
