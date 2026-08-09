-- =============================================
-- Migration 006: Allow public read on interpretation_rules
--
-- ปัญหา: หลัง migration 004 ตาราง interpretation_rules ถูกเปิด RLS
-- โดยไม่มี policy ให้เลือกอ่านได้ → Anonymous client (anon key) ที่ใช้ใน
-- GET /api/assessments/active อ่านไม่เห็น rules (คืน [] เสมอ)
--
-- ผลกระทบ: หน้าแสดงผลลัพธ์ของแบบประเมิน (เช่น ST-5) จะแสดงข้อความ
-- fallback ทั่วไปแทนการแปลผลจริง (ระดับสี/คำแนะนำตามคะแนน)
--
-- วิธีแก้: เปิดอ่าน public แก่ anon + authenticated (เป็นข้อมูลสาธารณะ
-- ที่ควรแสดงผลให้ทุกคนที่ทำแบบประเมิน)
-- =============================================

ALTER TABLE interpretation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read interpretation_rules"
  ON interpretation_rules FOR SELECT
  TO anon, authenticated
  USING (true);