import type { PodcastEpisode } from '../types/podcast';
import { usePodcastPlayer } from '../contexts/PodcastPlayerContext';

const CATEGORY_STYLE: Record<string, { emoji: string; gradient: string }> = {
  'การหายใจ': { emoji: '🫁', gradient: 'from-sky-100 via-blue-50 to-indigo-100' },
  'Mindfulness': { emoji: '🧘', gradient: 'from-teal-100 via-emerald-50 to-sky-100' },
  'การนอนหลับ': { emoji: '🌙', gradient: 'from-purple-100 via-purple-50 to-fuchsia-100' },
  'จัดการความเครียด': { emoji: '🍃', gradient: 'from-emerald-100 via-green-50 to-teal-100' },
  'กำลังใจ': { emoji: '💌', gradient: 'from-fuchsia-100 via-pink-50 to-purple-100' },
};

function styleForCategory(category: string) {
  return CATEGORY_STYLE[category] || { emoji: '🎧', gradient: 'from-purple-100 via-fuchsia-50 to-purple-200' };
}

function formatDuration(durationSec?: number): string {
  if (!durationSec || durationSec <= 0) return '';
  const minutes = Math.max(1, Math.round(durationSec / 60));
  return `${minutes} นาที`;
}

export default function PodcastCard({
  episode,
  showCategory = true,
}: {
  episode: PodcastEpisode;
  showCategory?: boolean;
}) {
  const { current, isPlaying, play } = usePodcastPlayer();
  const isCurrent = current?.id === episode.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const isSpotifyEmbed = !!episode.embedUrl && !episode.audioUrl;
  const style = styleForCategory(episode.category);

  const handlePlayClick = () => {
    if (episode.audioUrl || episode.embedUrl) {
      play(episode);
    } else if (episode.externalUrl) {
      window.open(episode.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group">
      <div className={`relative h-36 bg-gradient-to-br ${style.gradient} flex items-center justify-center overflow-hidden`}>
        {episode.coverImage ? (
          <img src={episode.coverImage} alt={episode.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-3xl shadow-inner">
            {style.emoji}
          </div>
        )}

        {isSpotifyEmbed ? (
          <span className="absolute bottom-2 left-2 text-[11px] font-bold bg-[#1DB954] text-white px-2.5 py-1 rounded-full backdrop-blur">
            Spotify
          </span>
        ) : episode.durationSec ? (
          <span className="absolute bottom-2 left-2 text-[11px] font-bold bg-black/40 text-white px-2.5 py-1 rounded-full backdrop-blur">
            ⏱️ {formatDuration(episode.durationSec)}
          </span>
        ) : null}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {showCategory && (
          <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700 w-fit mb-2">
            {episode.category}
          </span>
        )}

        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1">
          {episode.title}
        </h3>
        <p className="text-xs text-slate-500 mb-3">{episode.speaker}</p>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={isCurrentPlaying ? 'หยุดเล่น' : isSpotifyEmbed ? 'เปิดตัวเล่น Spotify' : 'เล่น'}
            title={isSpotifyEmbed ? 'เปิดตัวเล่น Spotify' : undefined}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isCurrentPlaying
                ? 'bg-purple-700 text-white hover:bg-purple-800'
                : isSpotifyEmbed
                ? 'bg-[#1DB954] text-white hover:bg-[#1aa34a]'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } shadow-sm`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {isCurrentPlaying ? (
                <path d="M8 5h3v14H8V5zm5 0h3v14h-3V5z" />
              ) : isSpotifyEmbed ? (
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              ) : (
                <path d="M8 5v14l11-7L8 5z" />
              )}
            </svg>
          </button>

          {episode.externalUrl && (
            <a
              href={episode.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
            >
              <span>{episode.externalLabel || 'ฟังต่อ'}</span>
              <span>↗</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
