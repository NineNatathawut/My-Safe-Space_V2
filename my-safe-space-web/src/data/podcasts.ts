import type { PodcastEpisode } from '../types/podcast';

export const PODCAST_STORAGE_KEY = 'resources_podcasts';

export const SEED_PODCASTS: PodcastEpisode[] = [
  {
    id: 'podcast-1',
    title: 'หายใจ 4-7-8 สงบใจใน 5 นาที',
    speaker: 'คุณหมอแมวน้อย',
    category: 'การหายใจ',
    durationSec: 300,
    coverImage: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    externalLabel: 'YouTube',
    externalUrl: 'https://www.youtube.com/watch?v=gz4G31LGyaw',
  },
  {
    id: 'podcast-2',
    title: 'Mindfulness ฉบับมือใหม่ หยุดคิดฟุ้งซ่าน',
    speaker: 'พี่กระต่ายใจฟู',
    category: 'Mindfulness',
    durationSec: 240,
    coverImage: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'podcast-3',
    title: 'ลาก่อนความเครียด บอกลาวันที่เหนื่อยล้า',
    speaker: 'น้องเพนกวินขี้อ้อน',
    category: 'จัดการความเครียด',
    durationSec: 360,
    coverImage: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'podcast-4',
    title: 'เรื่องเล่าก่อนนอน เสียงนุ่มให้หลับฝันดี',
    speaker: 'คุณหมีตัวใหญ่',
    category: 'การนอนหลับ',
    durationSec: 420,
    coverImage: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'podcast-5',
    title: 'ส่งกำลังใจให้ตัวเองในวันที่ใจล้า',
    speaker: 'คุณดาวตกน้อย',
    category: 'กำลังใจ',
    durationSec: 300,
    coverImage: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 'podcast-6',
    title: 'สัมผัสสายลม ปล่อยวางความวิตกกังวล',
    speaker: 'พี่ก้อนเมฆ',
    category: 'Mindfulness',
    durationSec: 360,
    coverImage: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    externalLabel: 'Spotify',
    externalUrl: 'https://open.spotify.com/',
  },
];

export function loadPodcasts(): PodcastEpisode[] {
  try {
    const saved = localStorage.getItem(PODCAST_STORAGE_KEY);
    if (!saved) return SEED_PODCASTS;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : SEED_PODCASTS;
  } catch {
    return SEED_PODCASTS;
  }
}

export function savePodcasts(episodes: PodcastEpisode[]): void {
  localStorage.setItem(PODCAST_STORAGE_KEY, JSON.stringify(episodes));
}
