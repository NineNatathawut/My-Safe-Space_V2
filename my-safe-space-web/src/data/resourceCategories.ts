// หมวดหมู่กลางที่ใช้ร่วมกันระหว่าง "บทความจัดการความเครียด" และ "พอดแคสต์ฮีลใจ"
// เพื่อให้ตัวกรอง/ป้ายหมวดทั้งสองส่วนตรงกันชุดเดียว
export const RESOURCE_CATEGORIES: string[] = [
  'การหายใจ',
  'สติ & Mindfulness',
  'จัดการความเครียด',
  'ความวิตกกังวล',
  'ภาวะซึมเศร้า',
  'การนอนหลับ',
  'กำลังใจ & การดูแลตัวเอง',
  'ความรู้สุขภาพจิตทั่วไป',
];

// แมปหมวดหมู่เก่าที่เคยมีในระบบ → หมวดหมู่ใหม่ชุดกลาง
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  Mindfulness: 'สติ & Mindfulness',
  'บทความสุขภาพจิต': 'ความรู้สุขภาพจิตทั่วไป',
  'จัดการความเครียด': 'จัดการความเครียด',
  'การนอนหลับ': 'การนอนหลับ',
  'กำลังใจ': 'กำลังใจ & การดูแลตัวเอง',
};

// หมวดที่ใช้อ้างอิงเมื่อเจอหมวดไม่รู้จัก (ข้อมูลเก่า/พิมพ์เองในอดีต)
const DEFAULT_CATEGORY = 'ความรู้สุขภาพจิตทั่วไป';

export function normalizeCategory(category?: string | null): string {
  const raw = (category || '').trim();
  if (!raw) return DEFAULT_CATEGORY;
  if (RESOURCE_CATEGORIES.includes(raw)) return raw;
  return LEGACY_CATEGORY_MAP[raw] || DEFAULT_CATEGORY;
}
