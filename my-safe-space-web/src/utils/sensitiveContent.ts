// ============================================================
// ⚠️ คำอธิบายเจตนาของไฟล์นี้ (อ่านก่อนแก้)
// ------------------------------------------------------------
// sensitiveContent.ts คือ **Safety Filter สำหรับการแสดงตัวอย่าง
// (Preview) บนหน้า Home เท่านั้น** — ไม่ใช่ระบบ Moderation
// อย่างเป็นทางการ
//
// • หน้าที่: กันเนื้อหาที่มีวลีบ่งชี้การคิดสั้น/ทำร้ายตัวเอง
//   ไม่ให้เด้งขึ้นหน้าแรกแบบอัตโนมัติ
// • ไม่ใช่: ระบบตัดสินใจว่าควรลบ/ระงับโพสต์ โพสต์ต้นฉบับ
//   ยังอยู่ในหน้า Feed (ลานสายลม) ตามปกติ
// • False positive: การ match เป็น substring (หลังตัดช่องว่าง
//   และตัวพิมพ์เล็ก) ดังนั้น list นี้จะคัดเฉพาะวลีที่ชัดเจนมาก
//   เท่านั้น และทิศทางของ false positive คือ "ซ่อนจาก Preview
//   มากไป" (ปลอดภัยกว่า) ไม่ใช่การตัดสินใจเนื้อหาเชิงลบ
// ============================================================

export const SENSITIVE_KEYWORDS = [
  'คิดสั้น', 'คิดส้น',
  'อยากตาย', 'ไม่อยากอยู่', 'อยากฆ่า',
  'ฆ่าตัว', 'จบชีวิต', 'ลาโลก',
  'ฆ่า ตต', 'ฆ่าตต', 'ตัดช่องน้อย',
  'ไม่อยากตื่น', 'ตายดีกว่า', 'ไม่อยากมีชีวิต',
];

export const checkSensitiveKeywords = (text: string): boolean => {
  if (!text) return false;
  const normalizedText = text.replace(/\s+/g, '').toLowerCase();
  return SENSITIVE_KEYWORDS.some((keyword) => {
    const normalizedKeyword = keyword.replace(/\s+/g, '').toLowerCase();
    return normalizedText.includes(normalizedKeyword);
  });
};