import type { PodcastEpisode } from '../types/podcast';
import { usePodcastPlayer } from '../contexts/PodcastPlayerContext';
import { Icon } from './Icon';

const CATEGORY_CHIP: Record<string, string> = {
  'การหายใจ': 'bg-macaw/10 text-macaw',
  Mindfulness: 'bg-owl-soft text-owl-pressed',
  'การนอนหลับ': 'bg-beetle/10 text-beetle',
  'จัดการความเครียด': 'bg-fox/10 text-fox',
  'กำลังใจ': 'bg-bee/20 text-ink',
};

const WAVE_BARS = [4, 16, 9, 22, 13, 28, 10, 24, 6, 18, 12, 26, 8, 20];

function chipFor(category: string): string {
  return CATEGORY_CHIP[category] || 'bg-owl-soft text-owl-pressed';
}

export default function PodcastVoiceCard({
  episode,
  fill = false,
}: {
  episode: PodcastEpisode;
  fill?: boolean;
}) {
  const { current, isPlaying, play } = usePodcastPlayer();
  const isCurrent = current?.id === episode.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const isSpotifyEmbed = !!episode.embedUrl && !episode.audioUrl;

  const handlePlayClick = () => {
    if (episode.audioUrl || episode.embedUrl) {
      play(episode);
    } else if (episode.externalUrl) {
      window.open(episode.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`${fill ? 'w-full min-w-0' : 'w-[290px] min-w-[290px] snap-start'} bg-white rounded-3xl border border-hairline shadow-card p-4 flex flex-col gap-3 hover:border-owl/50 hover:shadow-md transition-all`}>
      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold w-fit ${chipFor(episode.category)}`}>
        {episode.category}
      </span>

      <div className="flex items-center gap-2 bg-owl-soft/70 rounded-2xl rounded-tl-md px-3 py-2.5">
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label={isCurrentPlaying ? 'หยุดเล่น' : 'เล่น'}
          className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white transition-all active:scale-95 ${
            isCurrentPlaying ? 'bg-owl-pressed' : isSpotifyEmbed ? 'bg-macaw' : 'bg-owl'
          }`}
        >
          {isCurrentPlaying ? <Icon name="pause" size={16} /> : isSpotifyEmbed ? <Icon name="volume" size={16} /> : <Icon name="play" size={16} />}
        </button>

        <div className="flex items-end gap-[3px] h-9 flex-1">
          {WAVE_BARS.map((height, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full ${isCurrentPlaying ? 'bg-owl-pressed' : 'bg-owl-pressed/50'}`}
              style={{ height }}
            />
          ))}
        </div>

        {/* ลบตัวเลขเวลาแสดงความยาว (เช่น 05:00) ออกจากการ์ดพอดแคสต์ */}
      </div>

      <p className="text-xs text-body-muted font-medium flex items-center gap-1.5 line-clamp-1">
        <Icon name="message-heart" size={13} className="text-owl shrink-0" />
        <span className="truncate">{episode.title}</span>
      </p>
    </div>
  );
}