import { useState } from 'react';
import api from '../api/axios';
import { Icon } from './Icon';
import { BADGE_COLORS, type Article } from '../data/homeArticles';
import { RESOURCE_CATEGORIES } from '../data/resourceCategories';

interface ArticleEditModalProps {
  article: Article;
  isNew: boolean;
  showCategory?: boolean;
  categories?: string[];
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function ArticleEditModal({
  article,
  isNew,
  showCategory = true,
  categories = RESOURCE_CATEGORIES,
  onChange,
  onSubmit,
  onClose,
}: ArticleEditModalProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadImageError, setUploadImageError] = useState('');

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.name, e.target.value);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadImageError('รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadImageError('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setUploadingImage(true);
    setUploadImageError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/home/articles/upload', formData);
      if (res.data?.success && res.data.url) {
        onChange('imageUrl', res.data.url);
      } else {
        setUploadImageError(res.data?.error || 'อัปโหลดไม่สำเร็จ');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setUploadImageError(axiosErr?.response?.data?.error || 'อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-deep/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">
        <h3 className="font-feather text-xl font-black mb-4 text-ink">
          {isNew ? 'เพิ่มบทความใหม่' : 'แก้ไขบทความ'}
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {showCategory && (
            <div>
              <label className="block text-sm font-bold text-body-strong mb-1">หมวดหมู่</label>
              <input
                type="text"
                name="category"
                list="article-edit-modal-categories"
                value={article.category}
                onChange={handleModalChange}
                className="input text-sm"
              />
              <datalist id="article-edit-modal-categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">รูปภาพปก</label>

            {article.imageUrl ? (
              <div className="mb-3">
                <div className="relative h-32 rounded-xl overflow-hidden border border-hairline">
                  <img
                    src={article.imageUrl}
                    alt="ตัวอย่างภาพปก"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange('imageUrl', '')}
                  className="mt-2 text-xs font-bold text-cardinal hover:underline"
                >
                  ลบรูปภาพนี้
                </button>
              </div>
            ) : null}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              id="article-edit-modal-cover-upload"
            />
            <label
              htmlFor="article-edit-modal-cover-upload"
              className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-hairline rounded-xl p-4 text-center hover:border-owl-mint transition-colors bg-owl-soft/40"
            >
              {uploadingImage ? (
                <span className="text-sm font-bold text-body-muted flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-owl border-t-transparent rounded-full animate-spin" />
                  กำลังอัปโหลด...
                </span>
              ) : (
                <span className="text-sm font-bold text-macaw flex items-center gap-2">
                  <Icon name="image" size={18} /> คลิกเพื่ออัปโหลดรูปภาพ (JPG/PNG/WebP ≤ 5MB)
                </span>
              )}
            </label>

            {uploadImageError && (
              <p className="mt-2 text-xs font-bold text-cardinal flex items-center gap-1">
                <Icon name="alert" size={14} /> {uploadImageError}
              </p>
            )}

            <div className="mt-3">
              <label className="block text-xs font-bold text-body-soft mb-1">หรือวาง URL รูปภาพ (เว้นว่างเพื่อแสดงพื้นหลัง)</label>
              <input
                type="text"
                name="imageUrl"
                value={article.imageUrl || ''}
                onChange={handleModalChange}
                className="input text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">สีป้ายหมวดหมู่</label>
            <select
              name="badgeColor"
              value={article.badgeColor}
              onChange={handleModalChange}
              className="input text-sm"
            >
              {BADGE_COLORS.map((c) => (
                <option key={c.class} value={c.class}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">หัวข้อบทความ</label>
            <input
              type="text"
              name="title"
              value={article.title}
              onChange={handleModalChange}
              className="input text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">คำอธิบายสั้นๆ</label>
            <textarea
              name="description"
              value={article.description}
              onChange={handleModalChange}
              rows={3}
              className="input text-sm resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">ข้อความปุ่มกด</label>
            <input
              type="text"
              name="actionText"
              value={article.actionText}
              onChange={handleModalChange}
              className="input text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">ลิงก์ (URL หรือ Path)</label>
            <input
              type="text"
              name="link"
              value={article.link}
              onChange={handleModalChange}
              className="input text-sm"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!article.isPinned}
                onChange={(e) => onChange('isPinned', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 accent-owl"
              />
              <span className="text-sm font-bold text-body-strong">ปักหมุดโชว์หน้าแรก (สูงสุด 3)</span>
            </label>
            <p className="mt-1 text-xs text-body-soft">
              การ์ดที่ปักหมุดจะแสดงบนหน้าแรก การ์ดอื่นอยู่ที่หน้าคลังความรู้
            </p>
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
              className="btn-primary text-sm min-h-[40px] py-2"
            >
              {isNew ? 'เพิ่มบทความ' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
