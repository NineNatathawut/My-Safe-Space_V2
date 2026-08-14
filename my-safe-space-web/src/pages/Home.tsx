import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import ImageSlider from '../components/ImageSlider';
import MoodCheckInCard from '../components/MoodCheckInCard';
import ArticleEditModal from '../components/ArticleEditModal';
import { Icon } from '../components/Icon';
import { checkSensitiveKeywords } from '../utils/sensitiveContent';
import { loadHomeArticles, saveHomeArticles, deleteHomeArticle } from '../services/homeService';
import cartoon1 from '../assets/cartoons/cartoon-1.png';
import cartoon3 from '../assets/cartoons/cartoon-3.png';
import cartoon7 from '../assets/cartoons/cartoon-7.png';
import { MentalHealthKnowledge } from './MentalHealthKnowledge';
import { type Article, INITIAL_ARTICLES, BADGE_COLORS } from '../data/homeArticles';
import { normalizeCategory } from '../data/resourceCategories';

interface CommunityPost {
  id: string;
  _id?: string;
  content: string;
  emotion: string;
  alias_name?: string;
  created_at: string;
  hug_count?: number;
  comment_count?: number;
}

interface FeelingTag {
  label: string;
  reply: string;
}

const FEELING_TAGS: FeelingTag[] = [
  {
    label: 'ความคาดหวังจากครอบครัว',
    reply: 'การแบกรับความคาดหวังของคนที่เรารักไม่ใช่เรื่องง่ายเลย เราอยากให้คุณรู้ว่าอยู่ตรงนี้เพื่อฟังเสมอ',
  },
  {
    label: 'เรื่องเรียน & อนาคต',
    reply: 'ไม่รู้จะไปทางไหนก็ไม่เป็นไร ก้าวทีละก้าวก็พอแล้วนะ ใจของคุณสำคัญที่สุด',
  },
  {
    label: 'การเปรียบเทียบในโซเชียล',
    reply: 'ชีวิตคนอื่นบนฟีดไม่ได้เพอร์เฟกต์ทุกนาที ตัวคุณเองในแบบที่เป็นก็เพียงพอแล้ว',
  },
  {
    label: 'ความสัมพันธ์กับเพื่อน',
    reply: 'ความสัมพันธ์มีทั้งขึ้นและลง เราพร้อมรับฟังเรื่องราวของคุณเสมอ',
  },
  {
    label: 'FOMO กลัวตกเทรนด์',
    reply: 'ไม่ต้องไปให้ทันทุกอย่างเสมอไป ทุกคนเดินตามจังหวะของตัวเอง',
  },
  {
    label: 'Cyberbullying',
    reply: 'สิ่งที่เกิดขึ้นไม่ใช่ความผิดของคุณ เราอยู่ตรงนี้พร้อมเป็นพื้นที่ปลอดภัยให้คุณได้เสมอ',
  },
];

const TAG_STYLES = [
  'md:-translate-y-0.5 md:-rotate-2',
  'md:translate-y-2 md:rotate-1',
  'md:translate-y-1 md:rotate-2',
  'md:-translate-y-0.5 md:-rotate-1',
  'md:translate-y-2 md:rotate-3',
  'md:translate-y-0 md:rotate-2',
];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// หน้าแรกโชว์แค่การ์ดล่าสุดเท่านี้ (การ์ดที่เกินไปอยู่ที่หน้า /resources)
const HOME_ARTICLE_LIMIT = 3;

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  if (diff < MINUTE_MS) return 'เมื่อสักครู่';
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)} นาทีที่แล้ว`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} ชั่วโมงที่แล้ว`;
  if (diff < 2 * DAY_MS) return 'เมื่อวาน';
  if (diff < 7 * DAY_MS) return `${Math.floor(diff / DAY_MS)} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Home() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  // หน้าแรก: ถ้ามีการ์ดปักหมุดให้โชว์การ์ดที่ปัก (สูงสุด 3) — ยังไม่ปักเลยให้โชว์ 3 ล่าสุด
  const pinnedArticles = articles.filter((a) => a.isPinned);
  const homeArticles = pinnedArticles.length > 0
    ? pinnedArticles.slice(0, 3)
    : [...articles].slice(-HOME_ARTICLE_LIMIT).reverse();

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);

  // โหลดการ์ดจริงจาก DB (ถ้า DB ถูก initial แล้วให้ใช้ข้อมูลจาก DB เสมอแม้หมวดจะว่าง)
  useEffect(() => {
    let active = true;
    loadHomeArticles().then((data) => {
      if (!active || !data) return;
      if (data.initialized) {
        setArticles((data.articles as Article[]).map((a) => ({ ...a, category: normalizeCategory(a.category) })));
      } else if (data.articles.length > 0) {
        setArticles((data.articles as Article[]).map((a) => ({ ...a, category: normalizeCategory(a.category) })));
      }
    });
    return () => { active = false; };
  }, []);

  // 💬 ตัวอย่างเรื่องราวจาก Community (Home Preview เท่านั้น — กรองเนื้อหาไวออก ไม่โชว์บนหน้าแรก)
  useEffect(() => {
    let active = true;
    api.get('/api/posts')
      .then((response) => {
        if (!active || !response.data.success) return;
        const all = (response.data.posts as CommunityPost[]) || [];
        const safe = all.filter((p) => !checkSensitiveKeywords(p.content));
        setCommunityPosts(safe.slice(0, 3));
      })
      .catch(() => { /* เงียบ ๆ — ถ้าโหลดไม่ได้ Home จะแสดง empty state แทน */ })
      .finally(() => { if (active) setCommunityLoading(false); });
    return () => { active = false; };
  }, []);

  const openEditModal = (article: Article) => {
    setEditingArticle({ ...article });
  };

  const openCreateModal = () => {
    setEditingArticle({
      id: 0,
      category: 'บทความสุขภาพจิต',
      title: '',
      description: '',
      badgeColor: BADGE_COLORS[0].class,
      actionText: 'อ่านต่อ',
      link: '',
      imageUrl: '',
      isPinned: false,
    });
  };

  const persistArticles = async (next: Article[]) => {
    const result = await saveHomeArticles(next);
    if (result.ok) {
      setArticles(next);
      setEditingArticle(null);
      return true;
    }
    alert(`❌ ${result.error || 'ไม่สามารถบันทึกข้อมูลได้'}`);
    return false;
  };

  const handleArticleChange = (field: string, value: string) => {
    if (!editingArticle) return;
    if (field === 'isPinned') {
      setEditingArticle({ ...editingArticle, isPinned: value === 'true' });
      return;
    }
    setEditingArticle({ ...editingArticle, [field]: value });
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;
    if (!editingArticle.title.trim()) {
      alert('กรุณากรอกหัวข้อบทความ');
      return;
    }

    const isNew = editingArticle.id === 0;
    // กันปักหมุดเกิน 3 การ์ด (นับเฉพาะการ์ดที่ถูกปักอยู่แล้ว ไม่รวมการ์ดนี้ที่กำลังแก้ไข)
    if (editingArticle.isPinned) {
      const pinnedCount = articles.filter((a) => a.isPinned && (isNew || a.id !== editingArticle.id)).length;
      if (pinnedCount >= 3) {
        alert('ปักหมุดได้สูงสุด 3 การ์ดสำหรับหน้าแรก');
        return;
      }
    }

    const savedArticle = { ...editingArticle, category: normalizeCategory(editingArticle.category) };

    let next: Article[];
    if (isNew) {
      next = [...articles, { ...savedArticle, id: Date.now() }];
    } else {
      next = articles.map((a) =>
        a.id === editingArticle.id ? savedArticle : a
      );
    }

    const saved = await persistArticles(next);
    if (saved) {
      alert(isNew ? 'เพิ่มบทความเรียบร้อยแล้ว!' : 'บันทึกการแก้ไขบทความสำเร็จ!');
    }
  };

  const handleDeleteArticle = async (article: Article) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${article.title}"?`)) return;
    const result = await deleteHomeArticle(article.id);
    if (result.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      alert('ลบบทความเรียบร้อยแล้ว');
    } else {
      alert(`❌ ${result.error || 'ไม่สามารถลบบทความได้'}`);
    }
  };

  return (
    <div className="space-y-16 py-8 max-w-6xl mx-auto relative font-din">

{/* 🌼 1. Hero Section — แนะนำเว็บ + slider */}
      <section className="relative grid md:grid-cols-2 gap-8 md:gap-10 items-center px-2 md:px-0">
        {/* Pastel Blobs เฉพาะส่วนบน */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#FFE7D2] to-[#FFD9E8]/30 blur-3xl opacity-80 md:[animation:float-side_4s_ease-in-out_infinite]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-16 w-96 h-96 rounded-full bg-gradient-to-br from-owl-mint/50 to-macaw/15 blur-3xl opacity-70 md:[animation:float-side_4s_ease-in-out_infinite]"
          style={{ animationDelay: '-2s' }}
        />

        <div className="relative z-10">
          <h1
            className="font-feather text-4xl md:text-5xl font-black text-ink leading-[1.15]"
            style={{ letterSpacing: '-0.5px' }}
          >
            ที่นี่คือพื้นที่
            <br />
            <span className="relative inline-block whitespace-nowrap mx-1">
              <span aria-hidden className="absolute inset-x-[-5px] bottom-[3px] h-[0.38em] bg-owl-mint/70 -rotate-1 rounded-[5px]" />
              <span className="relative">ปลอดภัย</span>
            </span>
            สำหรับ
            <span className="relative inline-block whitespace-nowrap mx-1">
              <span aria-hidden className="absolute inset-x-[-5px] bottom-[3px] h-[0.38em] bg-[#FFE7D2] rotate-1 rounded-[5px]" />
              <span className="relative">ทุกความรู้สึก</span>
            </span>
          </h1>
          <p className="text-body-muted font-medium text-sm md:text-lg mt-4 max-w-md leading-relaxed">
            ..
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/feed" state={{ openComposer: true }} className="btn-primary px-6 py-3 inline-flex">
              เริ่มแชร์เรื่องราว
            </Link>
            <Link to="/assessment" className="btn-secondary px-6 py-3 inline-flex">
              ทำแบบประเมิน
            </Link>
          </div>
        </div>

        <div className="relative z-10">
          <div className="md:scale-[1.15] md:origin-right">
            <ImageSlider />
          </div>
          <img
            src={cartoon1}
            alt="มาสคอตการ์ตูน"
            className="absolute -top-6 -right-3 w-20 md:w-28 rotate-6 drop-shadow-lg z-10 pointer-events-none"
          />
        </div>
      </section>



      

{/* 🏡 1. About / Introduction — Interactive Tag-Cloud */}
      <section className="w-screen ml-[calc(50%_-_50vw)] bg-orange-100/50 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 relative">
          {/* มาสคอตซ้าย — ลอยขอบ ระดับสูง */}
          <div className="hidden lg:block absolute -left-14 xl:-left-20 top-16 xl:top-24 -translate-y-1/2 pointer-events-none z-10">
            <div className="animate-float-side">
              <img src={cartoon3} alt="" aria-hidden="true" className="w-24 xl:w-28 -rotate-12 drop-shadow-lg" />
            </div>
          </div>

          {/* มาสคอตขวา — ลอยขอบ ระดับล่าง */}
          <div className="hidden lg:block absolute -right-14 xl:-right-20 bottom-16 xl:bottom-24 pointer-events-none z-10">
            <div className="animate-float-side" style={{ animationDelay: '-2s' }}>
              <img src={cartoon7} alt="" aria-hidden="true" className="w-24 xl:w-28 rotate-12 drop-shadow-lg" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="font-feather text-3xl font-black text-owl mb-2" style={{ letterSpacing: '-0.5px' }}>บ้านพักใจคืออะไร</h2>
            <p className="text-body-muted text-sm md:text-base max-w-2xl mx-auto font-medium">
              พื้นที่เล็ก ๆ ที่อบอุ่น และให้ความรู้สึกของคุณปลอดภัยได้ทุกแบบ
            </p>
          </div>

        <div className="card p-6 md:p-10 rounded-3xl">
          {/* หัวข้อชวนมีส่วนร่วม */}
          <div className="flex items-center justify-center gap-2.5 mb-7">
            <span className="w-10 h-10 shrink-0 bg-owl-soft text-owl-pressed rounded-full flex items-center justify-center">
              <Icon name="info" size={18} />
            </span>
            <h3 className="font-feather text-xl md:text-2xl font-black text-ink">
              คุณกำลังเจอความรู้สึกเหล่านี้อยู่หรือเปล่า?
            </h3>
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {FEELING_TAGS.map((tag, idx) => {
const isActive = activeTag === tag.label;
  return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => setActiveTag(isActive ? null : tag.label)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-bold text-sm transition-all duration-200 active:scale-95 min-h-[44px] ${TAG_STYLES[idx % TAG_STYLES.length]} ${
                    isActive
                      ? 'border-owl bg-owl-mint/60 text-owl-pressed shadow-sm scale-105'
                      : 'border-hairline bg-white text-body-strong hover:border-owl hover:bg-owl-soft/40 hover:-translate-y-0.5'
                  }`}
                >
                  {isActive && <Icon name="check" size={14} />}
                  {tag.label}
                </button>
              );
            })}
          </div>

          {/* ข้อความให้กำลังใจตอบสนองแท็กที่เลือก */}
          {activeTag && (
            <div className="mt-7 max-w-xl mx-auto p-4 rounded-2xl bg-owl-soft/40 border border-owl-mint flex items-start gap-3 animate-fadeIn">
              <Icon name="heart" size={20} className="text-owl-pressed shrink-0 mt-0.5" />
              <p className="text-sm text-body-strong font-medium leading-relaxed">
                {FEELING_TAGS.find((t) => t.label === activeTag)?.reply}
              </p>
            </div>
          )}

          {/* ข้อความหลักปิดท้ายการ์ด */}
          <div className="mt-8 border-t-2 border-dashed border-owl-soft pt-6">
            <p className="text-center text-body-strong font-feather font-extrabold text-base md:text-lg leading-relaxed">
              ✨ ไม่ว่าคุณกำลังเจออะไร... "บ้านพักใจ" พร้อมเป็นพื้นที่ปลอดภัยให้คุณเสมอ
            </p>
            <p className="text-center text-body-muted text-sm mt-2 font-medium">
              เปิดใจแชร์ความรู้สึก แลกเปลี่ยนประสบการณ์ และส่งมอบกำลังใจให้แก่กัน
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* 🍃 2. ตอนนี้ฉันรู้สึกอย่างไร? */}
      <section className="px-4">
        {!isAdmin && isAuthenticated && <MoodCheckInCard />}
      </section>

      {/* 📖 3. บทความและเทคนิค */}
      <section className="px-4">
        <div className="text-center mb-10">
          <h2 className="font-feather text-3xl font-black text-owl mb-2" style={{ letterSpacing: '-0.5px' }}>บทความและเทคนิค</h2>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-full bg-owl text-white text-sm font-bold hover:bg-owl-pressed transition-colors inline-flex items-center gap-1.5"
            >
              เจ้าใหม่ <span aria-hidden="true">+</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {homeArticles.map((article) => (
            <div
              key={article.id}
              className="card overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col relative group/card"
            >
              {isAdmin && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    onClick={() => openEditModal(article)}
                    className="bg-owl-soft text-owl-pressed p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-owl-mint shadow-sm"
                    title="แก้ไขบทความ"
                  >
                    <Icon name="pencil" size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(article)}
                    className="bg-cardinal/10 text-cardinal p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-cardinal/20 shadow-sm"
                    title="ลบบทความ"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              )}

              {article.imageUrl && !brokenImages.has(article.id) ? (
                <div className="h-44 bg-owl-soft/40 overflow-hidden relative">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    loading="lazy"
                    onError={() => setBrokenImages(prev => new Set(prev).add(article.id))}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-owl-soft to-owl-mint/60 p-6 flex items-start relative overflow-hidden">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-white/70 backdrop-blur-md rounded-full w-fit text-owl-pressed border border-owl-mint inline-flex items-center gap-1">
                    <Icon name="book" size={12} /> บทความ
                  </span>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${article.badgeColor}`}>
                      {article.category}
                    </span>
                  </div>
                  <h3 className="font-feather font-extrabold text-lg text-ink mb-2 hover:text-owl transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-body-muted line-clamp-3 leading-relaxed">
                    {article.description}
                  </p>
                </div>

                {article.link.startsWith('http') ? (
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-owl hover:text-owl-pressed font-bold text-sm transition-colors group min-h-[44px] py-2 -my-2">
                    <span>{article.actionText}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                ) : (
                  <Link to={article.link} className="inline-flex items-center gap-1 text-owl hover:text-owl-pressed font-bold text-sm transition-colors group min-h-[44px] py-2 -my-2">
                    <span>{article.actionText}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-2">
          <Link to="/resources" className="btn-secondary text-sm inline-flex">
            ดูบทความทั้งหมด →
          </Link>
        </div>
      </section>

      {/* 🧠 ความรู้สุขภาพจิต (การ์ดความรู้จากกรมสุขภาพจิต) */}
      <MentalHealthKnowledge />

      {/* 💬 5. เรื่องราวจากบ้านพักใจ (ตัวอย่างจาก Community) */}
      <section className="px-4">
        <div className="text-center mb-10">
          <h2 className="font-feather text-3xl font-black text-owl mb-2" style={{ letterSpacing: '-0.5px' }}>เรื่องราวจากบ้านพักใจ</h2>
          <p className="text-body-muted text-sm md:text-base max-w-2xl mx-auto font-medium">
            บางเรื่องราวอาจทำให้เรารู้ว่า เราไม่ได้รู้สึกแบบนี้อยู่คนเดียว
          </p>
        </div>

        {communityLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 w-16 bg-owl-soft rounded-full mb-3" />
                <div className="h-4 bg-owl-soft rounded mb-2" />
                <div className="h-4 bg-owl-soft rounded mb-2" />
                <div className="h-4 w-3/4 bg-owl-soft rounded" />
              </div>
            ))}
          </div>
        ) : communityPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
            {communityPosts.map((post) => (
              <Link
                key={post.id || post._id}
                to={`/post/${post.id || post._id}`}
                className="card p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between group/card"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{post.emotion}</span>
                    <span className="text-xs text-body-soft font-medium truncate">{post.alias_name}</span>
                  </div>
                  <p className="text-sm text-body-strong line-clamp-2 leading-relaxed font-medium">{post.content}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-hairline mt-4 text-xs text-body-muted">
                  <div className="flex items-center gap-3 font-medium">
                    <span className="flex items-center gap-1">
                      <Icon name="heart" size={14} className="text-cardinal" />
                      {typeof post.hug_count === 'number' ? post.hug_count : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="message" size={14} />
                      {typeof post.comment_count === 'number' ? post.comment_count : ''}
                    </span>
                  </div>
                  <span className="font-medium">{formatRelativeTime(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="max-w-xl mx-auto card p-8 rounded-3xl text-center mb-8">
            <div className="text-3xl mb-3">🤍</div>
            <h3 className="font-feather text-lg font-black text-ink mb-1">พื้นที่เล็ก ๆ สำหรับเรื่องราวของคุณ</h3>
            <p className="text-body-muted text-sm font-medium mb-6">อยากแบ่งปันอะไรกับบ้านพักใจไหม?</p>
            <Link to="/feed" state={{ openComposer: true }} className="btn-primary px-6 py-3 inline-flex">
              ไปที่ลานสายลม
            </Link>
          </div>
        )}

        {!communityLoading && communityPosts.length > 0 && (
          <div className="text-center">
            <Link to="/feed" className="btn-secondary text-sm inline-flex">
              ไปที่ลานสายลม →
            </Link>
          </div>
        )}
      </section>

      {/* Modal แก้ไขบทความ */}
      {editingArticle && (
        <ArticleEditModal
          article={editingArticle}
          isNew={editingArticle.id === 0}
          onChange={handleArticleChange}
          onSubmit={handleSaveArticle}
          onClose={() => setEditingArticle(null)}
        />
      )}

      </div>
  );
}