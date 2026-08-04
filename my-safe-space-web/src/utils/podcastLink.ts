export type PodcastLinkKind = 'audio' | 'spotify' | 'external';

export interface ParsedPodcastLink {
  kind: PodcastLinkKind;
  embedUrl?: string;
}

const SPOTIFY_RE = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|playlist|album|episode|show)\/([a-zA-Z0-9]+)/i;
const AUDIO_RE = /\.(mp3|m4a|mp4a|ogg|oga|wav|flac|aac|opus|webm)(\?.*)?$/i;

export function parsePodcastLink(url: string): ParsedPodcastLink {
  const trimmed = url.trim();
  if (!trimmed) return { kind: 'external' };

  const spotifyMatch = trimmed.match(SPOTIFY_RE);
  if (spotifyMatch) {
    return {
      kind: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1].toLowerCase()}/${spotifyMatch[2]}`,
    };
  }

  if (AUDIO_RE.test(trimmed)) {
    return { kind: 'audio' };
  }

  return { kind: 'external' };
}

export function isSpotifyEmbedUrl(url?: string): boolean {
  return !!url && url.startsWith('https://open.spotify.com/embed/');
}

export function describeLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  switch (parsePodcastLink(trimmed).kind) {
    case 'spotify':
      return '✅ ตรวจพบลิงก์ Spotify — จะเล่นในหน้าแบบฝัง';
    case 'audio':
      return '✅ ตรวจพบไฟล์เสียงตรง — จะเล่นในเครื่องเล่น';
    default:
      return '⚠️ เป็นลิงก์ทั่วไป — กดฟังจะเปิดแท็บใหม่';
  }
}
