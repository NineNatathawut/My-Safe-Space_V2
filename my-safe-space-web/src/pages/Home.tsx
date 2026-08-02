import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import PodcastWidget from '../components/PodcastWidget';

// 📝 Interface สำหรับโครงสร้างข้อมูลโพสต์
interface Post {
  id: string;
  _id?: string;
  content: string;
  emotion: string;
  alias_name: string;
  poster_role?: string;
  created_at: string;
  hug_count: number;
  comment_count: number;
}

// 📚 Interface สำหรับบทความ
interface Article {
  id: number;
  category: string;
  title: string;
  description: string;
  badgeColor: string;
  actionText: string;
  link: string;
}

// ข้อมูลบทความไฮไลต์เริ่มต้น
const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    category: 'การหายใจ',
    title: 'เทคนิคหายใจ 4-7-8 ลดเครียดใน 5 นาที',
    description: 'วิธีการหายใจที่ช่วยให้ระบบประสาทสงบลง ลดความวิตกกังวลได้ทันที ทำได้ทุกที่',
    badgeColor: 'bg-purple-100 text-purple-700',
    actionText: 'อ่านเพิ่มเติม',
    link: 'https://www.youtube.com/watch?v=gz4G31LGyaw'
  },
  {
    id: 2,
    category: 'Mindfulness',
    title: 'ฝึก Mindfulness เบื้องต้น สำหรับผู้เริ่มต้น',
    description: 'การอยู่กับปัจจุบัน ไม่ตัดสินความรู้สึก — เริ่มต้นได้ง่าย ๆ เพียง 5-10 นาทีต่อวัน',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    actionText: 'อ่านเพิ่มเติม',
    link: '/resources'
  },
  {
    id: 3,
    category: 'จัดการความเครียด',
    title: '5 วิธีรับมือความเครียดที่ได้ผลจริง',
    description: 'จากงานวิจัย — วิธีง่าย ๆ ที่ช่วยให้สมองได้พักและจิตใจฟื้นคืนได้เร็วขึ้น',
    badgeColor: 'bg-teal-100 text-teal-700',
    actionText: 'ประเมินความเครียด',
    link: 'https://dmh.go.th/test/stress/'
  }
];

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { isAdmin } = useAuth();
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  
  // สถานะกำลังโหลดระหว่างเรียก API (เพื่อไม่ให้กดปุ่มรัวๆ)
  const [huggingIds, setHuggingIds] = useState<Set<string>>(new Set());
  
  // 💖 State สำหรับจำว่าโพสต์ไหนที่เรากดกอดไปแล้วบ้าง (ดึงจาก localStorage ก่อน)
  const [huggedPosts, setHuggedPosts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('huggedPosts');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/posts');
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError('ไม่สามารถโหลดข้อความจากลานสายลมได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

const handleDeletePost = async (postId: string) => {
    // 1. ถามยืนยันก่อนลบ
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) return;
    
    try {
      // 2. ดึง Token เพื่อยืนยันสิทธิ์ Admin
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // 3. เรียก API ลบโพสต์
      const response = await api.delete(`/api/posts/${postId}`, config);
      
      // 4. เช็คว่าสำเร็จหรือไม่ (บาง API ส่ง response.status = 200, บางอันส่ง data.success = true)
      if (response.status === 200 || response.data?.success) {
        // ลบข้อมูลออกจาก State หน้าจอจะได้หายไปทันทีโดยไม่ต้องรีเฟรช
        setPosts(prevPosts => prevPosts.filter(post => (post.id || post._id) !== postId));
        alert('ลบโพสต์เรียบร้อยแล้ว 🗑️');
      } else {
        alert('ไม่สามารถลบโพสต์ได้ ลองใหม่อีกครั้งครับ');
      }
    } catch (err: any) {
      console.error("Error deleting post:", err);
      // เช็คว่า Error เกิดจากอะไร
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        alert('คุณไม่มีสิทธิ์ลบโพสต์นี้ (เซสชันอาจจะหมดอายุ กรุณาล็อกอินใหม่)');
      } else if (err?.response?.status === 404) {
        alert('ไม่พบโพสต์นี้ในระบบ (อาจจะถูกลบไปแล้ว)');
      } else {
        alert('ไม่สามารถลบโพสต์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // 💖 ฟังก์ชันจัดการการกดกอดแบบ Toggle (กดเพิ่ม / กดยกเลิก)
  const handleHug = async (postId: string) => {
    if (huggingIds.has(postId)) return; // ป้องกันการกดรัวๆ
    
    // เช็คว่าโพสต์นี้เคยถูกกดกอดไปแล้วหรือยัง?
    const isAlreadyHugged = huggedPosts.has(postId);
    
    try {
      setHuggingIds(prev => new Set(prev).add(postId));
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // ส่ง payload ไปบอก Backend ว่าจะ 'hug' หรือ 'unhug' 
      // (ถ้า API คุณรับแค่วิธีปกติ อาจจะลองปรับแก้ฝั่ง backend ให้เช็ค action นี้นะครับ)
      const payload = { action: isAlreadyHugged ? 'unhug' : 'hug' };
      const response = await api.post(`/api/posts/${postId}/hug`, payload, config);

      if (response.data.success) {
        // 1. อัปเดตสถานะว่าเรากดหรือยกเลิกกอด แล้วบันทึกลง LocalStorage
        setHuggedPosts(prev => {
          const newSet = new Set(prev);
          if (isAlreadyHugged) {
            newSet.delete(postId); // เอาออก (ยกเลิกกอด)
          } else {
            newSet.add(postId); // เพิ่มเข้าไป (กดกอด)
          }
          localStorage.setItem('huggedPosts', JSON.stringify(Array.from(newSet)));
          return newSet;
        });

        // 2. อัปเดตตัวเลขแสดงผลบนหน้าจอ
        setPosts(prevPosts => prevPosts.map(post => {
          const currentId = post.id || post._id;
          if (currentId === postId) {
            // ถ้า Backend ส่งค่ายอดกอดมาให้ ใช้อันนั้น
            if (typeof response.data.hug_count === 'number') {
              return { ...post, hug_count: response.data.hug_count };
            }
            // ถ้าไม่ส่ง ให้คำนวณเองเลย (+1 หรือ -1)
            return { 
              ...post, 
              hug_count: isAlreadyHugged ? Math.max(0, post.hug_count - 1) : post.hug_count + 1 
            };
          }
          return post;
        }));
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        alert('กรุณาเข้าสู่ระบบหรือตั้งนามแฝงก่อนส่งกอดนะครับ 🤍');
      } else {
        alert('ไม่สามารถส่งกอดได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setHuggingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const openEditModal = (article: Article) => {
    setEditingArticle({ ...article });
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingArticle) {
      setEditingArticle({ ...editingArticle, [name]: value });
    }
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    setArticles(prev => prev.map(a => 
      a.id === editingArticle.id ? editingArticle : a
    ));
    
    setEditingArticle(null);
    alert('บันทึกการแก้ไขบทความสำเร็จ!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-16 py-8 max-w-6xl mx-auto relative">
      
      {/* 🌟 1. ส่วนต้อนรับ (Hero Section) */}
      <section className="text-center px-4">
        <div className="inline-block bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          🔒 พื้นที่ปลอดภัย ไม่ระบุตัวตน
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          ที่นี่คือ <span className="text-purple-600">บ้านพักใจ</span> ของคุณ
        </h1>
        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          ระบายความรู้สึก แบ่งปันความเจ็บปวด หรือแค่อยากพิมพ์บอกใครสักคน - เราพร้อมรับฟังทุกคำ โดยไม่ตัดสิน ไม่มีการระบุตัวตน
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/venting" className="px-8 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors shadow-sm">
            เริ่มระบายเลย
          </Link>
          <Link to="/resources" className="px-8 py-3 bg-white text-purple-600 font-medium rounded-full border border-purple-200 hover:bg-purple-50 transition-colors shadow-sm">
            ค้นหาทรัพยากร
          </Link>
        </div>
      </section>

      {/* 🚨 2. แถบเบอร์ฉุกเฉินด่วน */}
      <section className="bg-red-50 py-6 px-4 rounded-2xl mx-4 lg:mx-0 border border-red-100">
         <p className="text-center text-red-600 font-medium mb-4">
          ต้องการความช่วยเหลือเร่งด่วน? โทรหาผู้เชี่ยวชาญได้เลย - ฟรี ตลอด 24 ชั่วโมง
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:1323" className="bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow">1323 สุขภาพจิต</a>
          <a href="tel:1669" className="bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow">1669 ฉุกเฉิน</a>
          <a href="tel:1385" className="bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow">1385 ป้องกันการฆ่าตัวตาย</a>
        </div>
      </section>

      {/* 🎧 พอดแคสต์ฮีลใจ */}
      <PodcastWidget />

      {/* 🍃 3. ลานสายลม */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">ลานสายลม 🍃</h2>
          <button onClick={fetchPosts} disabled={isLoading} className="text-purple-600 text-sm hover:text-purple-800 flex items-center gap-1 disabled:opacity-50 transition-colors">
            {isLoading ? 'กำลังโหลด...' : '🔄 รีเฟรช'}
          </button>
        </div>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 text-center">{error}</div>}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 && !error ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">🍃</div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">ลานสายลมยังคงเงียบสงบ</h3>
            <p className="text-gray-500">เป็นคนแรกที่บอกเล่าความรู้สึกในวันนี้สิ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => {
              const activeId = post.id || post._id || '';
              const isHugging = huggingIds.has(activeId); // สถานะรอ API
              const hasHugged = huggedPosts.has(activeId); // สถานะว่าเราเคยกอดโพสต์นี้ไปแล้ว

              return (
                <div key={activeId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-2xl border border-gray-100 shadow-sm">{post.emotion}</div>
                        <div>
                          <Link to={`/user/${post.user_id}`} className="font-medium text-gray-800 hover:text-indigo-600 transition-colors">{post.alias_name}</Link>
                          {post.poster_role === 'expert' && <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">🩺 ผู้เชี่ยวชาญ</span>}
                          <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDeletePost(activeId)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="ลบโพสต์">🗑️</button>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-sm mt-auto">
                    
                    {/* 💖 ปุ่มกอดที่ปรับดีไซน์เมื่อกดไปแล้ว */}
                    <button
                      onClick={() => handleHug(activeId)}
                      disabled={isHugging}
                      className={`flex items-center gap-1.5 transition-colors active:scale-95 transform ${
                        hasHugged 
                          ? 'text-pink-500 hover:text-pink-600' // สีชมพูเข้มเมื่อกดแล้ว
                          : 'text-gray-500 hover:text-pink-500' // สีเทาเมื่อยังไม่ได้กด
                      }`}
                    >
                      <span className={`${isHugging ? 'animate-pulse' : ''} ${hasHugged ? 'scale-110 transition-transform' : ''}`}>
                        {hasHugged ? '💖' : '🫂'}
                      </span> 
                      กอด {post.hug_count > 0 && <span className={`font-medium ${hasHugged ? 'text-pink-600' : 'text-pink-500'}`}>({post.hug_count})</span>}
                    </button>

                    <Link to={`/post/${activeId}`} className="flex items-center gap-1.5 text-gray-500 hover:text-purple-600 transition-colors">
                      <span>💬</span> คอมเมนต์ {post.comment_count > 0 && <span className="font-medium text-purple-600">({post.comment_count})</span>}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 📖 5. บทความและทรัพยากรสำหรับคุณ */}
      <section className="px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">บทความและทรัพยากรสำหรับคุณ 📖</h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">เทคนิค วิธีการ และบทความที่คัดสรรมาเพื่อช่วยให้คุณรับมือกับความเครียดได้ดียิ่งขึ้น</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {articles.map((article) => (
            <div 
              key={article.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group/card"
            >
              {isAdmin && (
                <button
                  onClick={() => openEditModal(article)}
                  className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-yellow-200 shadow-sm"
                  title="แก้ไขบทความ"
                >
                  ✏️
                </button>
              )}

              <div>
                <div className="mb-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${article.badgeColor}`}>
                    {article.category}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2 hover:text-purple-600 transition-colors pr-8">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {article.description}
                </p>
              </div>

              {article.link.startsWith('http') ? (
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors group">
                  <span>{article.actionText}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </a>
              ) : (
                <Link to={article.link} className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors group">
                  <span>{article.actionText}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/resources" className="inline-block px-6 py-2.5 bg-white border border-purple-200 text-purple-700 font-medium rounded-full hover:bg-purple-50 transition-colors text-sm shadow-sm">
            ดูบทความและทรัพยากรทั้งหมด →
          </Link>
        </div>
      </section>

      {/* 💜 6. Call to Action ก่อนจบหน้า */}
      <section className="text-center px-4 bg-purple-50 py-12 rounded-2xl mx-4 lg:mx-0 border border-purple-100">
        <h2 className="text-2xl font-bold mb-4 text-purple-900">พร้อมระบายแล้วหรือยัง?</h2>
        <p className="text-purple-700 mb-8 max-w-lg mx-auto">
          ไม่ต้องกังวล ไม่มีใครรู้ว่าคุณเป็นใคร - พิมพ์ได้เลยทันที
        </p>
        <Link 
          to="/venting" 
          className="px-8 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg inline-block"
        >
          เข้าสู่ห้องระบาย
        </Link>
      </section>

      {/* 🛠️ Modal แก้ไขบทความ */}
      {editingArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">แก้ไขบทความ</h3>
            
            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <input 
                  type="text" 
                  name="category"
                  value={editingArticle.category} 
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อบทความ</label>
                <input 
                  type="text" 
                  name="title"
                  value={editingArticle.title} 
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบายสั้นๆ</label>
                <textarea 
                  name="description"
                  value={editingArticle.description} 
                  onChange={handleModalChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความปุ่มกด</label>
                <input 
                  type="text" 
                  name="actionText"
                  value={editingArticle.actionText} 
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์ (URL หรือ Path)</label>
                <input 
                  type="text" 
                  name="link"
                  value={editingArticle.link} 
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}