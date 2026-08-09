import React from 'react';
import {
  Brain,
  CloudRain,
  ShieldAlert,
  Flame,
  BatteryCharging,
  HeartHandshake,
  Smile,
  ExternalLink,
} from 'lucide-react';
import cartoon5 from '../assets/cartoons/cartoon-5.png';
import cartoon6 from '../assets/cartoons/cartoon-6.png';

interface KnowledgeItem {
  id: number;
  title: string;
  url: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
}

const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 1,
    title: 'Stress (เครียด)',
    url: 'https://dmhpd.dmh.go.th/%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%94/',
    icon: Brain,
    bgColor: 'bg-amber-50 group-hover:bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    id: 2,
    title: 'Depression (ซึมเศร้า)',
    url: 'https://dmhpd.dmh.go.th/depression/',
    icon: CloudRain,
    bgColor: 'bg-sky-50 group-hover:bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 3,
    title: 'Suicide (เสี่ยงฆ่าตัวตาย)',
    url: 'https://dmhpd.dmh.go.th/suicide/',
    icon: ShieldAlert,
    bgColor: 'bg-rose-50 group-hover:bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    id: 4,
    title: 'Burnout (ภาวะหมดไฟ)',
    url: 'https://dmhpd.dmh.go.th/burnout/',
    icon: Flame,
    bgColor: 'bg-orange-50 group-hover:bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: 5,
    title: 'Resilience Quotient (เติมพลังใจ)',
    url: 'https://dmhpd.dmh.go.th/resilience-quotient/',
    icon: BatteryCharging,
    bgColor: 'bg-emerald-50 group-hover:bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 6,
    title: 'Grief วิธีดูแลใจเมื่อสูญเสียคนรัก',
    url: 'https://dmhpd.dmh.go.th/grief/',
    icon: HeartHandshake,
    bgColor: 'bg-purple-50 group-hover:bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 7,
    title: 'Happiness (ความสุข)',
    url: 'https://dmhpd.dmh.go.th/happiness',
    icon: Smile,
    bgColor: 'bg-teal-50 group-hover:bg-teal-100',
    iconColor: 'text-teal-600',
  },
];

export const MentalHealthKnowledge: React.FC = () => {
  return (
    <section className="w-screen ml-[calc(50%_-_50vw)] bg-sky-100/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
      {/* มาสคอตซ้าย — ลอยขอบ ระดับสูง */}
      <div className="hidden lg:block absolute -left-14 xl:-left-20 top-16 xl:top-24 -translate-y-1/2 pointer-events-none z-10">
        <div className="animate-float-side">
          <img src={cartoon5} alt="" aria-hidden="true" className="w-24 xl:w-28 -rotate-12 drop-shadow-lg" />
        </div>
      </div>

      {/* มาสคอตขวา — ลอยขอบ ระดับล่าง */}
      <div className="hidden lg:block absolute -right-14 xl:-right-20 bottom-16 xl:bottom-24 pointer-events-none z-10">
        <div className="animate-float-side" style={{ animationDelay: '-2s' }}>
          <img src={cartoon6} alt="" aria-hidden="true" className="w-24 xl:w-28 rotate-12 drop-shadow-lg" />
        </div>
      </div>

      <div className="space-y-4 w-full">
      {/* หัวข้อส่วนความรู้สุขภาพจิต */}
      <div className="text-center space-y-1">
        <h2 className="font-feather text-2xl sm:text-3xl text-owl">
          ความรู้สุขภาพจิต
        </h2>
        <p className="font-din text-xs sm:text-sm text-slate-500">
          คลังความรู้และวิธีรับมือปัญหาทางอารมณ์จากกรมสุขภาพจิต
        </p>
      </div>

      {/* กริดการ์ด 7 หัวข้อ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
        {KNOWLEDGE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group card hairline p-4 rounded-3xl bg-white hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col items-center text-center justify-between space-y-3 relative overflow-hidden"
            >
              {/* ไอคอนแสดงความรู้ */}
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${item.bgColor} ${item.iconColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0`}
              >
                <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              {/* ข้อความชื่อหัวข้อ */}
              <div className="flex-1 flex items-center justify-center w-full">
                <span className="font-din font-bold text-xs sm:text-sm text-slate-700 group-hover:text-owl transition-colors line-clamp-2">
                  {item.title}
                </span>
              </div>

              {/* ไอคอนลิงก์ออกภายนอก */}
              <div className="flex items-center gap-1 text-[10px] font-din text-slate-400 group-hover:text-owl transition-colors">
                <span>อ่านต่อ</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          );
        })}
      </div>
      </div>
      </div>
    </section>
  );
};