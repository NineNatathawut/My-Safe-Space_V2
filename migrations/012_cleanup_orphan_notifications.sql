-- =============================================
-- Migration: Cleanup orphan notifications
-- ลบ notification ที่ชี้ไปยังโพสต์ที่ถูกลบไปแล้ว
-- (เคยเกิดเมื่อ DELETE /api/posts/:id ยังไม่ลบ notifications ตาม)
-- =============================================

-- ลบ notification ประเภท post ที่ reference_id ไม่อยู่ในตาราง posts แล้ว
DELETE FROM notifications
WHERE reference_type = 'post'
  AND reference_id NOT IN (SELECT id FROM posts);
