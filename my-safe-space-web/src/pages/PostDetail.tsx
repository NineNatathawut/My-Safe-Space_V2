import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';

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
      alert('ส่งการ์ดฮีลใจสำเร็จ');
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
          <div className="w-12 h-12 bg-owl-soft rounded-full"></div>
          <div className="h-4 bg-owl-soft rounded w-1/2"></div>
          <div className="h-20 bg-owl-soft/40 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-4">
          <Icon name="sparkles" size={26} />
        </div>
        <p className="text-body-muted font-medium mb-6">{error || 'ไม่พบโพสต์ที่คุณต้องการ'}</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-hairline rounded-full text-sm text-body-strong font-bold hover:bg-owl-soft hover:border-owl-mint transition-all"
        >
          <Icon name="chevron-left" size={16} /> ย้อนกลับ
        </button>
      </div>

      {/* 📌 โพสต์หลัก */}
      <article className="card p-8 rounded-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-owl-soft rounded-full flex items-center justify-center text-3xl border border-owl-mint shadow-sm">
            {post.emotion}
          </div>
          <div>
            <Link to={`/user/${post.user_id}`} className="font-bold text-ink text-lg hover:text-owl transition-colors">{post.alias_name}</Link>
            {post.poster_role === 'expert' && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-macaw/10 text-ink rounded-full font-bold"><Icon name="stethoscope" size={12} className="text-macaw" /> ผู้เชี่ยวชาญ</span>}
            <p className="text-xs text-body-soft font-medium">{formatDate(post.created_at)}</p>
          </div>
        </div>

        <p className="text-body-strong text-lg leading-relaxed whitespace-pre-wrap mb-8">
          {post.content}
        </p>

        <div className="pt-4 border-t border-hairline flex items-center gap-6">
          <button 
            onClick={handleHug}
            className={`flex items-center gap-1.5 transition-colors active:scale-95 transform font-medium ${
              hasHugged 
                ? 'text-cardinal'
                : 'text-body-muted hover:text-cardinal'
            }`}
          >
            <Icon name="heart" size={18} className={hasHugged ? 'fill-cardinal text-cardinal' : ''} />
            กอด {post.hug_count > 0 && <span className={`font-bold ${hasHugged ? 'text-cardinal' : 'text-ink'}`}>({post.hug_count})</span>}
          </button>
          {isAuthenticated && post.user_id !== user?.id && (
            <button
              onClick={() => setCardModal(true)}
              className="flex items-center gap-1.5 text-body-muted hover:text-owl transition-colors font-medium"
            >
              <Icon name="heart" size={16} /> ส่งกำลังใจ
            </button>
          )}
          <div className="flex items-center gap-2 text-body-muted font-medium text-sm">
            <Icon name="message" size={16} /> {comments.length} ความคิดเห็น
          </div>
        </div>
      </article>

      {/* 💬 ข้อความกำลังใจ + ช่องพิมพ์ (รวมใน Card เดียว) */}
      <section className="card p-6 space-y-5">
        <h3 className="font-bold text-ink text-lg flex items-center gap-2">
          <Icon name="message" size={18} className="text-owl" /> ข้อความกำลังใจ ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-6 bg-owl-soft/40 rounded-2xl border border-dashed border-owl-mint">
            <p className="text-body-muted text-sm font-medium">ยังไม่มีใครส่งกำลังใจ เป็นคนแรกที่มอบความอบอุ่นให้เพื่อนสิ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const commentId = comment.id || comment._id || Math.random().toString();
              const isOwner = post && comment.user_id === post.user_id;
              return (
                <div key={commentId} className={`p-4 rounded-2xl rounded-tl-sm border ${isOwner ? 'bg-bee/10 border-bee/40' : 'bg-owl-soft/40 border-owl-mint'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <Link to={`/user/${post.user_id}`} className="font-bold text-sm text-ink hover:text-owl transition-colors">{post.alias_name}</Link>
                      ) : comment.user_id ? (
                        <Link to={`/user/${comment.user_id}`} className="font-bold text-sm text-body-strong hover:text-owl transition-colors">{comment.alias_name || 'เพื่อนร่วมทาง'}</Link>
                      ) : (
                        <span className="font-bold text-sm text-body-strong">{comment.alias_name || 'เพื่อนร่วมทาง'}</span>
                      )}
                      {isOwner && <span className="text-[10px] px-2 py-0.5 bg-bee/30 text-ink rounded-full font-bold">เจ้าของเรื่อง</span>}
                      {comment.role === 'expert' && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-macaw/10 text-ink rounded-full font-bold"><Icon name="stethoscope" size={11} className="text-macaw" /> ผู้เชี่ยวชาญ</span>}
                    </div>
                    <span className="text-xs text-body-soft font-medium">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-body-strong text-sm whitespace-pre-wrap font-medium">{comment.content}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ช่องพิมพ์ส่งกำลังใจ */}
        <div ref={commentsEndRef} />
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="pt-4 border-t border-hairline">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="พิมพ์คำปลอบโยน หรือข้อความให้กำลังใจที่นี่... (ไม่ต้องระบุตัวตน)"
              className="input resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-body-soft">{newComment.length}/500</span>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="btn-primary"
              >
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งกำลังใจ'}
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-4 border-t border-hairline text-center py-4">
            <Link to="/login" className="btn-primary text-sm min-h-[46px] px-6 inline-flex items-center gap-2">
              <Icon name="lock" size={15} /> เข้าสู่ระบบเพื่อส่งกำลังใจ
            </Link>
          </div>
        )}
      </section>

      {/* 📬 Modal ส่งการ์ดฮีลใจ */}
      {cardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="card p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-ink">ส่งการ์ดฮีลใจ</h3>
            <p className="text-sm text-body-muted font-medium">เลือกการ์ดเพื่อส่งกำลังใจให้เจ้าของโพสต์</p>

            {presetCards.length === 0 ? (
              <p className="text-center text-body-soft py-4">ไม่พบการ์ด</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {presetCards.map((card) => (
                  <button
                    key={card.id}
                    disabled={sendingCard}
                    onClick={() => handleSendCard(card.id)}
                    className="w-full text-left p-4 bg-owl-soft/40 hover:bg-owl-soft rounded-xl transition-colors border border-hairline hover:border-owl-mint disabled:opacity-50 flex items-center gap-3"
                  >
                    <span className="text-xl">{card.icon}</span>
                    <span className="text-sm font-medium text-body-strong">{card.thai_text}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setCardModal(false)}
                className="px-5 py-2.5 bg-owl-soft hover:bg-owl-mint rounded-xl text-sm font-bold text-owl-pressed transition-colors"
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