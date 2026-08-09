import api from '../api/axios';
import type { PodcastEpisode } from '../types/podcast';

export interface ResourceArticle {
  id: string | number;
  category: string;
  title: string;
  description: string;
  readTime: string;
  url: string;
  imageUrl: string;
  color: string;
}

export interface ResourceVideo {
  id: string | number;
  title: string;
  embedId: string;
}

export interface ResourceTip {
  id: string | number;
  icon: string;
  title: string;
  desc: string;
}

export interface ResourceBreathing {
  title?: string;
  desc?: string;
  totalRounds?: number;
  inhaleSec?: number;
  holdSec?: number;
  exhaleSec?: number;
  step1Text?: string;
  step2Text?: string;
  step3Text?: string;
}

export interface ResourcesContent {
  articles: ResourceArticle[];
  videos: ResourceVideo[];
  tips: ResourceTip[];
  breathing: ResourceBreathing | null;
  podcasts: PodcastEpisode[];
  initialized: boolean;
}

export interface ResourcesSavePayload {
  articles: ResourceArticle[];
  videos: ResourceVideo[];
  tips: ResourceTip[];
  breathing: ResourceBreathing | null;
  podcasts: PodcastEpisode[];
}

// อ่านข้อมูล Resources ทั้งหมดจาก DB (public)
export async function loadResourcesContent(): Promise<ResourcesContent | null> {
  try {
    const res = await api.get('/api/resources/content');
    if (res.data?.success) {
      return {
        articles: res.data.articles || [],
        videos: res.data.videos || [],
        tips: res.data.tips || [],
        breathing: res.data.breathing || null,
        podcasts: res.data.podcasts || [],
        initialized: res.data.initialized === true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// บันทึกข้อมูล Resources เข้า DB (เฉพาะแอดมิน)
export async function saveResourcesContent(
  payload: ResourcesSavePayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await api.put('/api/resources', payload);
    if (res.data?.success) return { ok: true };
    return { ok: false, error: res.data?.error || 'ไม่สามารถบันทึกข้อมูลได้' };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: string } } };
    return { ok: false, error: axiosErr.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้' };
  }
}

// ลบข้อมูลทีละรายการเข้า DB ทันที (เฉพาะแอดมิน) — type: 'articles' | 'videos' | 'tips' | 'podcasts'
export async function deleteResourceItem(
  type: 'articles' | 'videos' | 'tips' | 'podcasts',
  id: string | number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await api.delete(`/api/resources/${type}/${id}`);
    if (res.data?.success) return { ok: true };
    return { ok: false, error: res.data?.error || 'ไม่สามารถลบข้อมูลได้' };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
    if (axiosErr.response?.status === 403) {
      return { ok: false, error: 'คุณไม่มีสิทธิ์ดำเนินการนี้' };
    }
    return { ok: false, error: axiosErr.response?.data?.error || 'ไม่สามารถลบข้อมูลได้' };
  }
}