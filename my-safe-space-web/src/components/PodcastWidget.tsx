import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEED_PODCASTS } from '../data/podcasts';
import { loadResourcesContent } from '../services/resourcesService';
import type { PodcastEpisode } from '../types/podcast';
import PodcastVoiceCard from './PodcastVoiceCard';
import { Icon } from './Icon';

export default function PodcastWidget() {
  const [podcasts, setPodcasts] = useState<PodcastEpisode[]>(SEED_PODCASTS);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    loadResourcesContent().then((data) => {
      if (active && data && data.podcasts.length > 0) {
        setPodcasts(data.podcasts);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const episodes = podcasts.slice(0, 6);

  const scrollByCard = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 306, behavior: 'smooth' });
  };

  return (
    <section className="px-4 space-y-10">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-feather text-2xl font-black text-ink flex items-center gap-2">พอดแคสต์ฮีลใจ</h2>
          <p className="text-sm text-body-muted mt-1 font-medium">เสียงอบอุ่นสั้นๆ เล่นทิ้งไว้ได้ ฟังไปพร้อมทำอย่างอื่น</p>
        </div>
        <Link
          to="/resources?tab=podcast"
          className="text-owl text-sm hover:text-owl-pressed font-bold flex items-center gap-1 whitespace-nowrap transition-colors"
        >
          ดูทั้งหมด <span>→</span>
        </Link>
      </div>

      {episodes.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-hairline">
          <p className="text-body-soft font-medium">ยังไม่มีพอดแคสต์ให้ฟังในตอนนี้</p>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto pb-4 pr-6 snap-x snap-proximity [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-owl-mint [&::-webkit-scrollbar-track]:bg-hairline/40 [scrollbar-width:thin] [scrollbar-color:#a5ed6e #e5e5e5]"
          >
            {episodes.map((episode) => (
              <PodcastVoiceCard key={episode.id} episode={episode} />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-white to-transparent" />

          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="เลื่อนถอยหลัง"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-hairline items-center justify-center text-owl hover:bg-owl-soft hover:scale-105 active:scale-95 transition-all"
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="เลื่อนไปข้างหน้า"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-hairline items-center justify-center text-owl hover:bg-owl-soft hover:scale-105 active:scale-95 transition-all"
          >
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
      )}
    </section>
  );
}