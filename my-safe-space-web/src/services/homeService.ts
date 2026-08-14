import api from '../api/axios';

export interface HomeArticle {
  id: string | number;
  category: string;
  title: string;
  description: string;
  badgeColor: string;
  actionText: string;
  link: string;
  imageUrl?: string;
}

export interface HomeArticlesLoadResult {
  articles: HomeArticle[];
  initialized: boolean;
}

// อ่านการ์ด "บทความและเทคนิคสำหรับคุณ" จาก DB (public)
export async function loadHomeArticles(): Promise<HomeArticlesLoadResult | null> {
  try {
    const res = await api.get('/api/home/articles');
    if (res.data?.success) {
      return {
        articles: res.data.articles || [],
        initialized: res.data.initialized === true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// บันทึกการ์ดทั้งชุดเข้า DB (เฉพาะแอดมิน)
export async function saveHomeArticles(
  articles: HomeArticle[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await api.put('/api/home/articles', { articles });
    if (res.data?.success) return { ok: true };
    return { ok: false, error: res.data?.error || 'ไม่สามารถบันทึกข้อมูลได้' };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
    if (axiosErr.response?.status === 403) {
      return { ok: false, error: 'คุณไม่มีสิทธิ์ดำเนินการนี้' };
    }
    return { ok: false, error: axiosErr.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้' };
  }
}

// ลบการ์ดทีละใบเข้า DB ทันที (เฉพาะแอดมิน)
export async function deleteHomeArticle(
  id: string | number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await api.delete(`/api/home/articles/${id}`);
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