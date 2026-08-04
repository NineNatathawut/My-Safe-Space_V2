import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';

const SLIDES = [
  {
    id: 1,
    image: heroImage,
    alt: 'บ้านพักใจ',
    overlay: 'from-purple-900/90 via-purple-700/75 to-fuchsia-700/60',
    glow: 'bg-fuchsia-400/20',
    badge: '🔒 พื้นที่ปลอดภัย ไม่ระบุตัวตน',
    title: 'ที่นี่คือ บ้านพักใจ ของคุณ',
    subtitle: 'ระบายความรู้สึก แบ่งปันความเจ็บปวด หรือแค่อยากพิมพ์บอกใครสักคน - เราพร้อมรับฟังทุกคำ โดยไม่ตัดสิน ไม่มีการระบุตัวตน',
    cta1: { label: 'เริ่มระบายเลย', to: '/venting', variant: 'white' },
    cta2: { label: 'ค้นหาทรัพยากร', to: '/resources', variant: 'glass' },
  },
  {
    id: 2,
    image: '',
    alt: 'พื้นที่ปลอดภัย',
    overlay: 'from-purple-800/90 via-fuchsia-700/75 to-purple-800/60',
    glow: 'bg-purple-400/20',
    badge: '🛡️ ความเป็นส่วนตัว',
    title: 'ทุกความรู้สึกได้รับการยอมรับ',
    subtitle: 'ไม่มีการตัดสิน ไม่มีการระบุตัวตน พื้นที่นี้เป็นของคุณโดยเฉพาะ',
    cta1: { label: 'เริ่มระบายเลย', to: '/venting', variant: 'white' },
    cta2: { label: 'เรียนรู้เพิ่มเติม', to: '/resources', variant: 'glass' },
  },
  {
    id: 3,
    image: '',
    alt: 'การดูแลสุขภาพจิต',
    overlay: 'from-fuchsia-800/90 via-purple-700/75 to-fuchsia-800/60',
    glow: 'bg-fuchsia-400/20',
    badge: '💜 ดูแลสุขภาพจิต',
    title: 'ก้าวแรกสู่การฟื้นฟู',
    subtitle: 'เล็กๆ ที่ทำทุกวัน ทำให้ใจแข็งแรงขึ้น เริ่มต้นได้ไม่ยาก',
    cta1: { label: 'เริ่มระบายเลย', to: '/venting', variant: 'white' },
    cta2: { label: 'ดูบทความ', to: '/resources', variant: 'glass' },
  },
];

export default function ImageSlider() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (index === current || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTransitioning(false);
    }, 300);
  }, [current, transitioning]);

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <section className="relative overflow-hidden rounded-3xl shadow-xl shadow-purple-500/10">
      <div className="relative h-[300px] md:h-[450px] lg:h-[500px]">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            {s.image ? (
              <img src={s.image} alt={s.alt} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${s.overlay}`} />
            )}
            <div className={`absolute inset-0 bg-gradient-to-t ${s.overlay}`} />
            <div className={`absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl`} />
            <div className={`absolute -bottom-16 -right-10 w-52 h-52 ${s.glow} rounded-full blur-2xl`} />
          </div>
        ))}

        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            {slide.badge}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-md">
            {slide.title}
          </h1>
          <p className="text-purple-100 text-sm md:text-lg max-w-2xl mx-auto mb-8 drop-shadow">
            {slide.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to={slide.cta1.to} className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-full hover:bg-purple-50 transition-colors shadow-lg shadow-purple-900/20 text-sm">
              {slide.cta1.label}
            </Link>
            <Link to={slide.cta2.to} className="px-6 py-3 bg-white/15 text-white font-medium rounded-full border border-white/40 hover:bg-white/25 transition-colors backdrop-blur text-sm">
              {slide.cta2.label}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors" aria-label="Previous slide">
        ←
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors" aria-label="Next slide">
        →
      </button>
    </section>
  );
}