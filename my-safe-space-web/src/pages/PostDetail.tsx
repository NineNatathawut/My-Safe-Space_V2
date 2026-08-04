import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  _id?: string;
  content: string;
  alias_name: string;
  created_at: string;
  user_id?: string;
  role?: string;
}

interface Post {
  id: string;
  _id?: string;
  content: string;
  emotion: string;
  alias_name: string;
  poster_role?: string;
  user_id: string;
  created_at: string;
  hug_count: number;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasHugged, setHasHugged] = useState(() => {
    if (!id) return false;
    try {
      const hugged = JSON.parse(localStorage.getItem('huggedPosts') || '[]');
      return hugged.includes(id);
    } catch {
      return false;
    }
  });
  const { isAuthenticated, user } = useAuth();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // 📬 State สำหรับส่งการ์ด
  const [cardModal, setCardModal] = useState(false);
  const [presetCards, setPresetCards] = useState<any[]>([]);
  const [sendingCard, setSendingCard] = useState(false);

  // 🔄 ดึงรายละเอียดโพสต์และรายการคอมเมนต์
  useEffect(() => {
    if (id) {
      fetchPostAndComments();
      fetchPresetCards();
    }
  }, [id]);

  const fetchPresetCards = async () => {
    try {
      const res = await api.get('/api/preset-cards');
      if (res.data.success) {
        setPresetCards(res.data.cards);
      }
    } catch {
      // ignore
    }
  };

  const handleSendCard = async (cardId: string) => {
    if (!post || !user) return;
    setSendingCard(true);
    try {
      await api.post('/api/inbox', {
        to_user_id: post.user_id,
        card_id: cardId,
      });
      setCardModal(false);
      alert('ส่งการ์ดฮีลใจสำเร็จ 💌');
    } catch (err: any) {
      alert(err.response?.data?.error || 'ไม่สามารถส่งการ์ดได้');
    } finally {
      setSendingCard(false);
    }
  };

  const fetchPostAndComments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/posts/${id}`);
      console.log("Post response:", response.data);
      
      if (response.data.success) {
        setPost(response.data.post);
        // ดึงคอมเมนต์ (รองรับทั้งแบบแยก array หรือฝังมาใน post)
        setComments(response.data.comments || response.data.post.comments || []);
      }
    } catch (err) {
      console.error("Error fetching post detail:", err);
      setError('ไม่สามารถโหลดข้อความนี้ได้ โพสต์อาจถูกลบไปแล้ว');
    } finally {
      setIsLoading(false);
    }
  };

  // 💬 ฟังก์ชันส่งคอมเมนต์
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const aliasName = localStorage.getItem('alias_name') || 'ผู้พิทักษ์ใจฟู';
      const response = await api.post(`/api/posts/${id}/comments`, {
        content: newComment,
        alias_name: aliasName
      }, config);

      if (response.data.success) {
        // เพิ่มคอมเมนต์ใหม่เข้าไปใน State ทันที
        const addedComment = response.data.comment || {
          id: Date.now().toString(),
          content: newComment,
          alias_name: aliasName,
          created_at: new Date().toISOString(),
          user_id: undefined
        };
        
        setComments(prev => [...prev, addedComment]);
        setNewComment(''); // ล้างช่องพิมพ์

        // Auto-scroll ไปที่คอมเมนต์ใหม่แบบนุ่มนวล
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      alert('ไม่สามารถส่งข้อความส่งกำลังใจได้ในขณะนี้');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🫂 ฟังก์ชันกดกอดในหน้ารายละเอียด
  const handleHug = async () => {
    if (!post) return;
    const isAlreadyHugged = hasHugged;
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await api.post(`/api/posts/${id}/hug`, {
        action: isAlreadyHugged ? 'unhug' : 'hug'
      }, config);

      if (response.data.success) {
        setPost(prev => prev ? {
          ...prev,
          hug_count: typeof response.data.hug_count === 'number' 
            ? response.data.hug_count 
            : (isAlreadyHugged ? Math.max(0, prev.hug_count - 1) : prev.hug_count + 1)
        } : null);

        setHasHugged(!isAlreadyHugged);
        if (id) setHuggedPosts(id, isAlreadyHugged);
      }
    } catch (err) {
      console.error("Error hugging:", err);
    }
  };

  const setHuggedPosts = (postId: string, remove: boolean) => {
    try {
      const hugged = JSON.parse(localStorage.getItem('huggedPosts') || '[]');
      const updated = remove
        ? hugged.filter((h: string) => h !== postId)
        : [...new Set([...hugged, postId])];
      localStorage.setItem('huggedPosts', JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-20 bg-slate-100 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="text-4xl mb-4">🍃</div>
        <p className="text-slate-600 mb-6">{error || 'ไม่พบโพสต์ที่คุณต้องการ'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      
      {/* ⬅️ ปุ่มย้อนกลับ */}
      <div className="mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-slate-200 rounded-full text-sm text-slate-600 shadow-sm hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all"
        >
          <span>←</span> ย้อนกลับ
        </button>
      </div>

      {/* 📌 โพสต์หลัก */}
      <article className="bg-white p-8 rounded-3xl shadow-sm border border-purple-50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-3xl border border-purple-100 shadow-sm">
            {post.emotion}
          </div>
          <div>
            <Link to={`/user/${post.user_id}`} className="font-semibold text-slate-900 text-lg hover:text-purple-600 transition-colors">{post.alias_name}</Link>
            {post.poster_role === 'expert' && <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">🩺 ผู้เชี่ยวชาญ</span>}
            <p className="text-xs text-slate-400">{formatDate(post.created_at)}</p>
          </div>
        </div>

        <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap mb-8">
          {post.content}
        </p>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-6">
          <button 
            onClick={handleHug}
            className={`flex items-center gap-1.5 transition-colors active:scale-95 transform ${
              hasHugged 
                ? 'text-fuchsia-500 hover:text-fuchsia-600'
                : 'text-slate-500 hover:text-fuchsia-500'
            }`}
          >
            <span className={`${hasHugged ? 'scale-110 transition-transform' : ''}`}>
              {hasHugged ? '💖' : '🫂'}
            </span>
            กอด {post.hug_count > 0 && <span className={`font-medium ${hasHugged ? 'text-fuchsia-600' : 'text-fuchsia-500'}`}>({post.hug_count})</span>}
          </button>
          {isAuthenticated && post.user_id !== user?.id && (
            <button
              onClick={() => setCardModal(true)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-purple-600 transition-colors"
            >
              <span>💌</span> ส่งกำลังใจ
            </button>
          )}
          <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
            <span>💬</span> {comments.length} ความคิดเห็น
          </div>
        </div>
      </article>

      {/* 💬 ข้อความกำลังใจ + ช่องพิมพ์ (รวมใน Card เดียว) */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <span>💬</span> ข้อความกำลังใจ ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-6 bg-purple-50/50 rounded-2xl border border-dashed border-purple-100">
            <p className="text-slate-500 text-sm">ยังไม่มีใครส่งกำลังใจ เป็นคนแรกที่มอบความอบอุ่นให้เพื่อนสิ 🤍</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const commentId = comment.id || comment._id || Math.random().toString();
              const isOwner = post && comment.user_id === post.user_id;
              return (
                <div key={commentId} className={`p-4 rounded-2xl rounded-tl-sm border ${isOwner ? 'bg-amber-50/70 border-amber-200' : 'bg-purple-50/70 border-purple-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      
                        {isOwner ? (
                          <Link to={`/user/${post.user_id}`} className="font-medium text-sm text-amber-800 hover:text-purple-600 transition-colors">{post.alias_name}</Link>
                        ) : comment.user_id ? (
                          <Link to={`/user/${comment.user_id}`} className="font-medium text-sm text-purple-700 hover:text-purple-600 transition-colors">{comment.alias_name || 'เพื่อนร่วมทาง'}</Link>
                        ) : (
                          <span className="font-medium text-sm text-purple-700">{comment.alias_name || 'เพื่อนร่วมทาง'}</span>
                        )}
                      {isOwner && <span className="text-[10px] px-2 py-0.5 bg-amber-200/60 text-amber-800 rounded-full font-medium">🏠 เจ้าของเรื่อง</span>}
                      {comment.role === 'expert' && <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">🩺 ผู้เชี่ยวชาญ</span>}
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ✍️ ช่องพิมพ์ส่งกำลังใจ (อยู่ด้านล่างสุด) */}
        <div ref={commentsEndRef} />
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="pt-4 border-t border-slate-100">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="พิมพ์คำปลอบโยน หรือข้อความให้กำลังใจที่นี่... (ไม่ต้องระบุตัวตน)"
              className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none text-slate-700"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-slate-400">{newComment.length}/500</span>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งกำลังใจ 🤍'}
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-4 border-t border-slate-100 text-center py-4">
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors text-sm font-medium">
              🔒 เข้าสู่ระบบเพื่อส่งกำลังใจ
            </Link>
          </div>
        )}
      </section>

      {/* 📬 Modal ส่งการ์ดฮีลใจ */}
      {cardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">💌 ส่งการ์ดฮีลใจ</h3>
            <p className="text-sm text-slate-500">เลือกการ์ดเพื่อส่งกำลังใจให้เจ้าของโพสต์</p>

            {presetCards.length === 0 ? (
              <p className="text-center text-slate-400 py-4">ไม่พบการ์ด</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {presetCards.map((card) => (
                  <button
                    key={card.id}
                    disabled={sendingCard}
                    onClick={() => handleSendCard(card.id)}
                    className="w-full text-left p-4 bg-slate-50 hover:bg-purple-50 rounded-xl transition-colors border border-slate-100 hover:border-purple-200 disabled:opacity-50"
                  >
                    <span className="text-xl mr-2">{card.icon}</span>
                    <span className="text-sm text-slate-700">{card.thai_text}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setCardModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}