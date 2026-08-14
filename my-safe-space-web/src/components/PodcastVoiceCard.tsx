import type { PodcastEpisode } from '../types/podcast';
import { usePodcastPlayer } from '../contexts/PodcastPlayerContext';
import { platformFor } from '../utils/podcastLink';
import { Icon } from './Icon';
import PlatformBadge from './PlatformBadge';

export default function PodcastVoiceCard({ episode }: { episode: PodcastEpisode }) {
  const { current, isPlaying, play } = usePodcastPlayer();
  const isCurrent = current?.id === episode.id;
  const isCurrentPlaying = isCurrent && isPlaying;

  const platform = platformFor(episode);
  const showPlatformBadge = platform !== 'generic';

  const handlePlayClick = () => {
    if (episode.audioUrl || episode.embedUrl) {
      play(episode);
    } else if (episode.externalUrl) {
      window.open(episode.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-hairline shadow-card hover:border-owl/50 hover:shadow-md transition-all group/card">
      {/* ภาพปกพอดแคสต์ */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-macaw/80 via-owl to-beetle/80">
        {episode.coverImage ? (
          <img
            src={episode.coverImage}
            alt={episode.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/90">
            <Icon name="headphones" size={22} />
          </div>
        )}

        {/* ปุ่ม Play ลอยบนมุมขวาล่างของรูปปก */}
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label={isCurrentPlaying ? 'หยุดเล่น' : 'เล่น'}
          className={`absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md transition-all active:scale-90 ${
            isCurrentPlaying ? 'bg-owl-pressed' : 'bg-[#1DB954] hover:bg-[#17a44b]'
          }`}
        >
          <Icon name={isCurrentPlaying ? 'pause' : 'play'} size={13} />
        </button>
      </div>

      {/* เนื้อหา */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-sm font-bold text-ink truncate leading-snug">{episode.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap min-h-[18px]">
          {showPlatformBadge && <PlatformBadge platform={platform} />}
        </div>
        <p className="text-xs text-body-muted font-medium flex items-center gap-1.5 truncate">
          <Icon name="user-round" size={12} className="text-owl shrink-0" />
          <span className="truncate">{episode.speaker}</span>
        </p>
      </div>
    </div>
  );
}
