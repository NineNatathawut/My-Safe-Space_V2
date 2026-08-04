import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { PodcastEpisode } from '../types/podcast';

interface PodcastPlayerContextType {
  current: PodcastEpisode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (episode: PodcastEpisode) => void;
  toggle: () => void;
  seek: (time: number) => void;
  close: () => void;
}

const PodcastPlayerContext = createContext<PodcastPlayerContextType | null>(null);

export function PodcastPlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const play = (episode: PodcastEpisode) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!episode.audioUrl && !episode.embedUrl) return;

    if (current?.id === episode.id) {
      if (episode.audioUrl) {
        if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      }
      return;
    }

    setCurrent(episode);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    if (episode.audioUrl) {
      audio.src = episode.audioUrl;
      audio.load();
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const close = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setCurrent(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <PodcastPlayerContext.Provider
      value={{ current, isPlaying, currentTime, duration, play, toggle, seek, close }}
    >
      {children}
    </PodcastPlayerContext.Provider>
  );
}

export function usePodcastPlayer() {
  const ctx = useContext(PodcastPlayerContext);
  if (!ctx) throw new Error('usePodcastPlayer ต้องใช้ภายใน PodcastPlayerProvider');
  return ctx;
}
