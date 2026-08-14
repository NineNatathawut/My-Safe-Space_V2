// การ์ดบทความและเทคนิค — ใช้ร่วมกันระหว่างหน้า Home และหน้า Resources (ตาราง home_articles)
export interface Article {
  id: number;
  category: string;
  title: string;
  description: string;
  badgeColor: string;
  actionText: string;
  link: string;
  imageUrl?: string;
  isPinned?: boolean;
}

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    category: 'การหายใจ',
    title: 'เทคนิคหายใจ 4-7-8 ลดเครียดใน 5 นาที',
    description: 'วิธีการหายใจที่ช่วยให้ระบบประสาทสงบลง ลดความวิตกกังวลได้ทันที ทำได้ทุกที่',
    badgeColor: 'bg-owl-soft text-owl-pressed',
    actionText: 'ไปฝึกหายใจ',
    link: '/resources?tab=breathing'
  },
  {
    id: 2,
    category: 'ความรู้สุขภาพจิตทั่วไป',
    title: 'รวมบทความสุขภาพจิตจากกรมสุขภาพจิต',
    description: 'บทความด้านสุขภาพจิตและจิตเวชจากกรมสุขภาพจิต ครบทุกเรื่อง ช่วยให้เข้าใจและดูแลใจตัวเองง่ายขึ้น',
    badgeColor: 'bg-fox/10 text-fox',
    actionText: 'ดูบทความต่อ',
    link: 'https://dmh.go.th/YamDMH/WebDMH/ViewTable.aspx?indotype=6'
  }
];

// ชุดสีป้ายหมวดหมู่ (class เต็มเพื่อให้ Tailwind สร้างสีได้ถูกต้อง)
export const BADGE_COLORS: { label: string; class: string }[] = [
  { label: 'เขียว (ค้างคาว/นกฮูก)', class: 'bg-owl-soft text-owl-pressed' },
  { label: 'ส้ม (จิ้งจอก)', class: 'bg-fox/10 text-fox' },
  { label: 'เขียว (มาคอว์)', class: 'bg-macaw/10 text-macaw' },
  { label: 'เหลือง (ผึ้ง)', class: 'bg-bee/20 text-ink' },
  { label: 'แดง (นกคาร์ดินัล)', class: 'bg-cardinal/10 text-cardinal' },
];
