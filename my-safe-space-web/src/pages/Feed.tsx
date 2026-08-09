import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { PostComposer } from '../components/PostComposer';
import { Icon } from '../components/Icon';

interface Post {
  id: string;
  _id?: string;
  content: string;
  emotion: string;
  user_id?: string;
  alias_name: string;
  poster_role?: string;
  created_at: string;
  hug_count: number;
  comment_count: number;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();
  const [huggingIds, setHuggingIds] = useState<Set<string>>(new Set());
  const [huggedPosts, setHuggedPosts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('huggedPosts');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const location = useLocation();
  const [showComposer, setShowComposer] = useState(() => Boolean((location.state as { openComposer?: boolean } | null)?.openComposer));

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

  useEffect(() => { fetchPosts(); }, []);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) return;
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await api.delete(`/api/posts/${postId}`, config);
      if (response.status === 200 || response.data?.success) {
        setPosts(prev => prev.filter(post => (post.id || post._id) !== postId));
        alert('ลบโพสต์เรียบร้อยแล้ว');
      } else {
        alert('ไม่สามารถลบโพสต์ได้ ลองใหม่อีกครั้งครับ');
      }
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        alert('คุณไม่มีสิทธิ์ลบโพสต์นี้');
      } else if (err?.response?.status === 404) {
        alert('ไม่พบโพสต์นี้ในระบบ');
      } else {
        alert('ไม่สามารถลบโพสต์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  const handleHug = async (postId: string) => {
    if (huggingIds.has(postId)) return;
    const isAlreadyHugged = huggedPosts.has(postId);
    try {
      setHuggingIds(prev => new Set(prev).add(postId));
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const payload = { action: isAlreadyHugged ? 'unhug' : 'hug' };
      const response = await api.post(`/api/posts/${postId}/hug`, payload, config);
      if (response.data.success) {
        setHuggedPosts(prev => {
          const newSet = new Set(prev);
          if (isAlreadyHugged) newSet.delete(postId);
          else newSet.add(postId);
          localStorage.setItem('huggedPosts', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setPosts(prev => prev.map(post => {
          const currentId = post.id || post._id;
          if (currentId === postId) {
            if (typeof response.data.hug_count === 'number') return { ...post, hug_count: response.data.hug_count };
            return { ...post, hug_count: isAlreadyHugged ? Math.max(0, post.hug_count - 1) : post.hug_count + 1 };
          }
          return post;
        }));
      }
    } catch (err: any) {
      if (err?.response?.status === 401) alert('กรุณาเข้าสู่ระบบหรือตั้งนามแฝงก่อนส่งกอดนะครับ');
      else alert('ไม่สามารถส่งกอดได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setHuggingIds(prev => { const s = new Set(prev); s.delete(postId); return s; });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 py-8 max-w-6xl mx-auto px-4">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-ink flex items-center gap-2">
          <Icon name="sparkles" size={22} className="text-owl" /> ลานสายลม
        </h1>
        <p className="text-body-muted text-sm mt-1 font-medium">บอกเล่าความรู้สึกของคุณให้โลกได้รับรู้</p>
      </div>

      {error && <div className="p-4 mb-6 bg-cardinal/10 text-cardinal rounded-xl border border-cardinal/30 text-center font-medium">{error}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border-hairline border animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-owl-soft rounded-full"></div>
                <div className="h-4 bg-owl-soft rounded w-1/3"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-owl-soft rounded w-full"></div>
                <div className="h-4 bg-owl-soft rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 && !error ? (
        <div className="text-center py-12 bg-white rounded-2xl border-hairline border">
          <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-4">
            <Icon name="sparkles" size={26} />
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">ลานสายลมยังคงเงียบสงบ</h3>
          <p className="text-body-muted font-medium">เป็นคนแรกที่บอกเล่าความรู้สึกในวันนี้สิ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => {
            const activeId = post.id || post._id || '';
            const isHugging = huggingIds.has(activeId);
            const hasHugged = huggedPosts.has(activeId);

            return (
              <div key={activeId} className="bg-white p-6 rounded-2xl border-hairline border hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-owl-soft rounded-full flex items-center justify-center text-2xl border border-owl-mint shadow-sm">{post.emotion}</div>
                      <div>
                        <Link to={`/user/${post.user_id}`} className="font-bold text-body-strong hover:text-owl transition-colors">{post.alias_name}</Link>
                        {post.poster_role === 'expert' && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-macaw/10 text-ink rounded-full font-bold"><Icon name="stethoscope" size={12} className="text-macaw" /> ผู้เชี่ยวชาญ</span>}
                        <div className="text-xs text-body-soft font-medium">{formatDate(post.created_at)}</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeletePost(activeId)} className="text-body-soft hover:text-cardinal transition-colors p-1" title="ลบโพสต์"><Icon name="trash" size={16} /></button>
                    )}
                  </div>
                  <p className="text-body-strong whitespace-pre-wrap mb-4 font-medium">{post.content}</p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-hairline text-sm mt-auto">
                  <button
                    onClick={() => handleHug(activeId)}
                    disabled={isHugging}
                    className={`flex items-center gap-1.5 transition-colors active:scale-95 transform font-medium ${
                      hasHugged ? 'text-cardinal hover:text-cardinal' : 'text-body-muted hover:text-cardinal'
                    }`}
                  >
                    <Icon name="heart" size={17} className={hasHugged ? 'fill-cardinal text-cardinal' : ''} />
                    กอด {post.hug_count > 0 && <span className={`font-bold ${hasHugged ? 'text-cardinal' : 'text-ink'}`}>({post.hug_count})</span>}
                  </button>
                  <Link to={`/post/${activeId}`} className="flex items-center gap-1.5 text-body-muted hover:text-owl transition-colors font-medium">
                    <Icon name="message" size={16} /> คอมเมนต์ {post.comment_count > 0 && <span className="font-bold text-owl">({post.comment_count})</span>}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB ปุ่มสร้างโพสต์ */}
      {!showComposer && (
        <button
          onClick={() => setShowComposer(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-owl hover:bg-owl-pressed text-white rounded-full shadow-lip flex items-center justify-center text-2xl transition-all active:scale-90"
        >
          <Icon name="pencil" size={22} />
        </button>
      )}

      {/* PostComposer Adaptive Overlay */}
      <PostComposer isOpen={showComposer} onClose={() => setShowComposer(false)} />
    </div>
  );
}