export interface PodcastEpisode {
  id: string;
  title: string;
  speaker: string;
  category: string;
  durationSec?: number;
  coverImage?: string;
  audioUrl?: string;
  embedUrl?: string;
  externalUrl?: string;
  externalLabel?: string;
}
