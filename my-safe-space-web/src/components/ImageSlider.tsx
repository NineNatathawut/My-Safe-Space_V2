import { useState, useEffect, useCallback } from 'react';
import poster1 from '../assets/poster-slide-1.png';
import poster2 from '../assets/poster-slide-2.png';
import poster3 from '../assets/poster-slide-3.png';
import poster4 from '../assets/poster-slide-4.png';

interface Slide {
  id: number;
  image: string;
  alt: string;
  aspect?: string;
}

const SLIDES: Slide[] = [
  { id: 0, image: poster1, alt: 'โปสเตอร์ 1', aspect: '951/382' },
  { id: 1, image: poster2, alt: 'โปสเตอร์ 2', aspect: '1942/809' },
  { id: 2, image: poster3, alt: 'โปสเตอร์ 3', aspect: '948/383' },
  { id: 3, image: poster4, alt: 'โปสเตอร์ 4', aspect: '953/387' },
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
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative overflow-hidden rounded-3xl" style={{ boxShadow: '0 6px 18px -6px rgba(16,15,62,0.4)' }}>
      <div className="relative w-full" style={{ aspectRatio: SLIDES[current].aspect || '951/382' }}>
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={s.image} alt={s.alt} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ))}
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