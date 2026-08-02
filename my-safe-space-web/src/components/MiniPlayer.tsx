import { usePodcastPlayer } from '../contexts/PodcastPlayerContext';

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MiniPlayer() {
  const { current, isPlaying, currentTime, duration, toggle, seek, close } = usePodcastPlayer();

  if (!current) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(Math.max(0, Math.min(1, ratio)) * (duration || 0));
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-purple-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? 'หยุดเล่น' : 'เล่น'}
          className="w-10 h-10 shrink-0 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {isPlaying ? (
              <path d="M8 5h3v14H8V5zm5 0h3v14h-3V5z" />
            ) : (
              <path d="M8 5v14l11-7L8 5z" />
            )}
          </svg>
        </button>

        <div className="w-10 h-10 shrink-0 rounded-lg bg-purple-100 flex items-center justify-center text-lg overflow-hidden">
          {current.coverImage ? (
            <img src={current.coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>🎧</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-800 text-sm truncate">{current.title}</p>
            <p className="text-[11px] text-gray-400 shrink-0 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>

          <div
            role="slider"
            aria-label="ความคืบหน้าของเสียง"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            onClick={handleSeekClick}
            className="h-1.5 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
          >
            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${progress}%` }} />
          </div>

          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{current.speaker}</p>
        </div>

        {current.externalUrl && (
          <a
            href={current.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold text-gray-500 hover:text-purple-600 transition-colors"
            title={current.externalLabel || 'ฟังต่อ'}
          >
            {current.externalLabel || 'ฟังต่อ'} ↗
          </a>
        )}

        <button
          type="button"
          onClick={close}
          aria-label="ปิดเครื่องเล่น"
          className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-1"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
