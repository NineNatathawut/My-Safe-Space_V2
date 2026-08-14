import { useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import { Icon } from './Icon';
import PodcastVoiceCard from './PodcastVoiceCard';
import { parsePodcastLink, describeLink } from '../utils/podcastLink';
import type { PodcastEpisode } from '../types/podcast';

export interface PodcastDraft {
  title: string;
  speaker: string;
  coverImage: string;
  link: string;
}

interface PodcastEditModalProps {
  episode: PodcastEpisode;
  onSave: (draft: PodcastDraft) => Promise<void>;
  onClose: () => void;
}

// ดึงลิงก์ดั้งเดิมกลับมาจาก episode (Spotify เก็บที่ externalUrl, ไฟล์เสียงที่ audioUrl)
function linkFromEpisode(episode: PodcastEpisode): string {
  return episode.externalUrl || episode.audioUrl || '';
}

export default function PodcastEditModal({ episode, onSave, onClose }: PodcastEditModalProps) {
  const [draft, setDraft] = useState<PodcastDraft>({
    title: episode.title,
    speaker: episode.speaker,
    coverImage: episode.coverImage || '',
    link: linkFromEpisode(episode),
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/resources/podcasts/upload', formData);
      if (res.data?.url) {
        setDraft((prev) => ({ ...prev, coverImage: res.data.url }));
      } else {
        setUploadError(res.data?.error || 'อัปโหลดไม่สำเร็จ');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setUploadError(axiosErr.response?.data?.error || 'อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const parsed = useMemo(() => {
    const link = draft.link.trim();
    return link ? parsePodcastLink(link) : null;
  }, [draft.link]);

  const previewEpisode = useMemo<PodcastEpisode>(() => {
    const link = draft.link.trim();
    const ep: PodcastEpisode = {
      id: episode.id,
      title: draft.title.trim() || 'ชื่อตอนพอดแคสต์',
      speaker: draft.speaker.trim() || 'ผู้พูดไร้นาม',
      category: episode.category,
      coverImage: draft.coverImage.trim() || undefined,
    };
    if (parsed?.kind === 'spotify') {
      ep.embedUrl = parsed.embedUrl;
      ep.externalUrl = link;
      ep.externalLabel = 'Spotify';
    } else if (parsed?.kind === 'audio') {
      ep.audioUrl = link;
    } else if (parsed) {
      ep.externalUrl = link;
    }
    return ep;
  }, [draft.title, draft.speaker, draft.coverImage, draft.link, parsed, episode.id, episode.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return alert('กรุณากรอกชื่อตอนพอดแคสต์');
    if (!draft.link.trim()) return alert('กรุณากรอกลิงก์ Spotify หรือไฟล์เสียง mp3');
    setSaving(true);
    await onSave({ ...draft, title: draft.title.trim(), speaker: draft.speaker.trim() || 'ผู้พูดไร้นาม' });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-ink-deep/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
        <h3 className="font-feather text-xl font-black mb-4 text-ink">แก้ไขตอนพอดแคสต์</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">ชื่อตอน</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              className="input text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">ผู้พูด</label>
            <input
              type="text"
              value={draft.speaker}
              onChange={(e) => setDraft((prev) => ({ ...prev, speaker: e.target.value }))}
              className="input text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">รูปปกพอดแคสต์</label>

            {draft.coverImage && (
              <div className="mb-3 flex items-center gap-3">
                <img src={draft.coverImage} alt="ตัวอย่างปก" className="w-16 h-16 rounded-xl object-cover border border-hairline" />
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, coverImage: '' }))}
                  className="text-xs font-bold text-cardinal hover:underline"
                >
                  ลบรูปภาพนี้
                </button>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              className="hidden"
              id="podcast-edit-cover-upload"
              ref={coverInputRef}
            />
            <label
              htmlFor="podcast-edit-cover-upload"
              className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-hairline rounded-xl p-4 text-center hover:border-owl-mint transition-colors bg-owl-soft/40"
            >
              {uploading ? (
                <span className="text-sm font-bold text-body-muted flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-owl border-t-transparent rounded-full animate-spin" />
                  กำลังอัปโหลด...
                </span>
              ) : (
                <span className="text-sm font-bold text-macaw flex items-center gap-2">
                  <Icon name="image" size={18} /> อัปโหลดรูปภาพ (JPG/PNG/WebP ≤ 5MB)
                </span>
              )}
            </label>

            {uploadError && (
              <p className="mt-2 text-xs font-bold text-cardinal flex items-center gap-1">
                <Icon name="alert" size={14} /> {uploadError}
              </p>
            )}

            <div className="mt-3">
              <label className="block text-xs font-bold text-body-soft mb-1">หรือวาง URL รูปภาพ</label>
              <input
                type="url"
                value={draft.coverImage}
                onChange={(e) => setDraft((prev) => ({ ...prev, coverImage: e.target.value }))}
                className="input text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">ลิงก์ (Spotify หรือไฟล์เสียง mp3)</label>
            <input
              type="url"
              value={draft.link}
              onChange={(e) => setDraft((prev) => ({ ...prev, link: e.target.value }))}
              className="input text-sm"
              placeholder="https://open.spotify.com/... หรือ https://example.com/audio.mp3"
            />
            {draft.link.trim() && (
              <p className={`text-[11px] mt-1 font-medium ${parsed && parsed.kind !== 'external' ? 'text-macaw' : 'text-amber-700'}`}>
                {describeLink(draft.link)}
              </p>
            )}
          </div>

          <div>
            <span className="block text-xs font-bold text-body-soft mb-2">พรีวิวการ์ด</span>
            <div className="max-w-md">
              <PodcastVoiceCard episode={previewEpisode} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm min-h-[40px] py-2"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm min-h-[40px] py-2 disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
