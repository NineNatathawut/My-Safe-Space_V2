import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImageSlider from '../components/ImageSlider';
import MoodCheckInCard from '../components/MoodCheckInCard';
import { Icon } from '../components/Icon';
import { loadHomeArticles, saveHomeArticles, deleteHomeArticle } from '../services/homeService';
import cartoon1 from '../assets/cartoons/cartoon-1.png';
import cartoon3 from '../assets/cartoons/cartoon-3.png';
import cartoon7 from '../assets/cartoons/cartoon-7.png';
import { MentalHealthKnowledge } from './MentalHealthKnowledge';

interface Article {
  id: number;
  category: string;
  title: string;
  description: string;
  badgeColor: string;
  actionText: string;
  link: string;
}

const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    category: 'การหายใจ',
    title: 'เทคนิคหายใจ 4-7-8 ลดเครียดใน 5 นาที',
    description: 'วิธีการหายใจที่ช่วยให้ระบบประสาทสงบลง ลดความวิตกกังวลได้ทันที ทำได้ทุกที่',
    badgeColor: 'bg-owl-soft text-owl-pressed',
    actionText: 'ไปฝึกหายใจ',
    link: '/resources?tab=breathing'
  },
  {
    id: 2,
    category: 'บทความสุขภาพจิต',
    title: 'รวมบทความสุขภาพจิตจากกรมสุขภาพจิต',
    description: 'บทความด้านสุขภาพจิตและจิตเวชจากกรมสุขภาพจิต ครบทุกเรื่อง ช่วยให้เข้าใจและดูแลใจตัวเองง่ายขึ้น',
    badgeColor: 'bg-fox/10 text-fox',
    actionText: 'ดูบทความต่อ',
    link: 'https://dmh.go.th/YamDMH/WebDMH/ViewTable.aspx?indotype=6'
  }
];

// ชุดสีป้ายหมวดหมู่ (class เต็มเพื่อให้ Tailwind สร้างสีได้ถูกต้อง)
const BADGE_COLORS: { label: string; class: string }[] = [
  { label: 'เขียว (ค้างคาว/นกฮูก)', class: 'bg-owl-soft text-owl-pressed' },
  { label: 'ส้ม (จิ้งจอก)', class: 'bg-fox/10 text-fox' },
  { label: 'เขียว (มาคอว์)', class: 'bg-macaw/10 text-macaw' },
  { label: 'เหลือง (ผึ้ง)', class: 'bg-bee/20 text-ink' },
  { label: 'แดง (นกคาร์ดินัล)', class: 'bg-cardinal/10 text-cardinal' },
];

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

export default function Home() {
  const { isAdmin } = useAuth();
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // โหลดการ์ดจริงจาก DB (ถ้า DB ถูก initial แล้วให้ใช้ข้อมูลจาก DB เสมอแม้หมวดจะว่าง)
  useEffect(() => {
    let active = true;
    loadHomeArticles().then((data) => {
      if (!active || !data) return;
      if (data.initialized) {
        setArticles(data.articles as Article[]);
      } else if (data.articles.length > 0) {
        setArticles(data.articles as Article[]);
      }
    });
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
    });
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingArticle) {
      setEditingArticle({ ...editingArticle, [name]: value });
    }
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

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    if (!editingArticle.title.trim()) {
      alert('กรุณากรอกหัวข้อบทความ');
      return;
    }

    const isNew = editingArticle.id === 0;
    let next: Article[];
    if (isNew) {
      next = [...articles, { ...editingArticle, id: Date.now() }];
    } else {
      next = articles.map((a) =>
        a.id === editingArticle.id ? editingArticle : a
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
          className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#FFE7D2] to-[#FFD9E8]/30 blur-3xl opacity-80 animate-float-side"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-16 w-96 h-96 rounded-full bg-gradient-to-br from-owl-mint/50 to-macaw/15 blur-3xl opacity-70 animate-float-side"
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



      

      {/* 🌿 เช็คอินสุขภาพใจ (Moood widget) */}
      <MoodCheckInCard />

 

      {/* 🏡 4. About / Introduction — Interactive Tag-Cloud */}
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
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-bold text-sm transition-all duration-200 active:scale-95 ${TAG_STYLES[idx % TAG_STYLES.length]} ${
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

      {/* 📖 4. บทความและคลังความรู้สำหรับคุณ */}
      <section className="px-4">
        <div className="text-center mb-10">
          <h2 className="font-feather text-3xl font-black text-owl mb-2" style={{ letterSpacing: '-0.5px' }}>บทความและเทคนิคสำหรับคุณ</h2>
          <p className="text-body-muted text-sm md:text-base max-w-2xl mx-auto font-medium">ลองดูเลย</p>
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
          {articles.map((article) => (
            <div 
              key={article.id}
              className="card p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group/card"
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

              <div>
                <div className="mb-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${article.badgeColor}`}>
                    {article.category}
                  </span>
                </div>
                <h3 className="font-feather font-extrabold text-lg text-ink mb-2 hover:text-owl transition-colors pr-8">
                  {article.title}
                </h3>
                <p className="text-sm text-body-muted mb-4 line-clamp-3 leading-relaxed">
                  {article.description}
                </p>
              </div>

              {article.link.startsWith('http') ? (
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-owl hover:text-owl-pressed font-bold text-sm transition-colors group">
                  <span>{article.actionText}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </a>
              ) : (
                <Link to={article.link} className="inline-flex items-center gap-1 text-owl hover:text-owl-pressed font-bold text-sm transition-colors group">
                  <span>{article.actionText}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/resources" className="btn-secondary text-sm inline-flex">
            ดูบทความและคลังความรู้ทั้งหมด →
          </Link>
        </div>
      </section>

      {/* 🧠 ความรู้สุขภาพจิต (การ์ดความรู้จากกรมสุขภาพจิต) */}
      <MentalHealthKnowledge />

      {/* 💚 5. Call to Action ก่อนจบหน้า */}
      <section className="text-center px-4 bg-owl-soft/50 py-12 rounded-2xl border-2 border-owl-soft">
        <h2 className="font-feather text-3xl font-black mb-4 text-ink" style={{ letterSpacing: '-0.5px' }}>อยากแชร์เรื่องราว ประสบการณ์ หรืออยากระบายอะไรไหม?</h2>
        <p className="text-body-muted font-semibold mb-8 max-w-lg mx-auto">
          ไม่ต้องกังวล ไม่มีใครรู้ว่าคุณเป็นใคร - พิมพ์ได้เลยทันที
        </p>
<Link 
          to="/feed"
          state={{ openComposer: true }}
          className="btn-primary px-8 py-3 inline-block text-lg"
        >
          แชร์เรื่องราวของคุณ
        </Link>
      </section>

      {/* Modal แก้ไขบทความ */}
      {editingArticle && (
        <div className="fixed inset-0 bg-ink-deep/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-feather text-xl font-black mb-4 text-ink">
              {editingArticle.id === 0 ? 'เพิ่มบทความใหม่' : 'แก้ไขบทความ'}
            </h3>
            
            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-body-strong mb-1">หมวดหมู่</label>
                <input 
                  type="text" 
                  name="category"
                  value={editingArticle.category} 
                  onChange={handleModalChange}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-body-strong mb-1">สีป้ายหมวดหมู่</label>
                <select
                  name="badgeColor"
                  value={editingArticle.badgeColor}
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
                  value={editingArticle.title} 
                  onChange={handleModalChange}
                  className="input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-body-strong mb-1">คำอธิบายสั้นๆ</label>
                <textarea 
                  name="description"
                  value={editingArticle.description} 
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
                  value={editingArticle.actionText} 
                  onChange={handleModalChange}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-body-strong mb-1">ลิงก์ (URL หรือ Path)</label>
                <input 
                  type="text" 
                  name="link"
                  value={editingArticle.link} 
                  onChange={handleModalChange}
                  className="input text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                <button 
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="btn-secondary text-sm min-h-[40px] py-2"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="btn-primary text-sm min-h-[40px] py-2"
                >
                  {editingArticle.id === 0 ? 'เพิ่มบทความ' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}