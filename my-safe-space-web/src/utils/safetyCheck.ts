// 📋 รายการคำเสี่ยงตั้งต้น (สามารถเพิ่มคำเพิ่มเติมได้ตามต้องการ)
export const SENSITIVE_KEYWORDS = [
  'คิดสั้น', 'คิดส้น', 
  'อยากตาย', 'ไม่อยากอยู่', 'อยากฆ่า',
  'ฆ่าตัว', 'จบชีวิต', 'ลาโลก',
  'ฆ่า ตต', 'ฆ่าตต', 'ตัดช่องน้อย',
  'ไม่อยากตื่น', 'ตายดีกว่า', 'ไม่อยากมีชีวิต'
];

/**
 * 🔍 ฟังก์ชันเช็กว่าข้อความมีคำเสี่ยงหรือไม่
 * (มีการตัดช่องว่างออกก่อนเช็ก เพื่อป้องกันกรณีพิมพ์แอบเว้นวรรค เช่น "คิ ด สั้ น")
 */
export const checkSensitiveKeywords = (text: string): boolean => {
  if (!text) return false;
  
  // ลบช่องว่าง และทำเป็นตัวพิมพ์เล็กทั้งหมด
  const normalizedText = text.replace(/\s+/g, '').toLowerCase();

  return SENSITIVE_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.replace(/\s+/g, '').toLowerCase();
    return normalizedText.includes(normalizedKeyword);
  });
};