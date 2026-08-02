import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loadPodcasts } from '../data/podcasts';
import PodcastCard from './PodcastCard';

export default function PodcastWidget() {
  const [podcasts] = useState(() => loadPodcasts());

  return (
    <section className="px-4">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🎧 พอดแคสต์ฮีลใจ</h2>
          <p className="text-sm text-gray-500 mt-1">เสียงอบอุ่นสั้นๆ เล่นทิ้งไว้ได้ ฟังไปพร้อมทำอย่างอื่น</p>
        </div>
        <Link
          to="/resources?tab=podcast"
          className="text-purple-600 text-sm hover:text-purple-800 font-medium flex items-center gap-1 whitespace-nowrap transition-colors"
        >
          ดูทั้งหมด <span>→</span>
        </Link>
      </div>

      {podcasts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400">ยังไม่มีพอดแคสต์ให้ฟังในตอนนี้</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {podcasts.slice(0, 6).map((episode) => (
            <div key={episode.id} className="min-w-[15rem] max-w-[15rem] snap-start">
              <PodcastCard episode={episode} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
