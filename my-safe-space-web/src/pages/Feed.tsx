import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { InlinePostBox } from '../components/InlinePostBox';

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
        alert('ลบโพสต์เรียบร้อยแล้ว 🗑️');
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
      if (err?.response?.status === 401) alert('กรุณาเข้าสู่ระบบหรือตั้งนามแฝงก่อนส่งกอดนะครับ 🤍');
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
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">🍃 ลานสายลม</h1>
        <p className="text-slate-500 text-sm mt-1">บอกเล่าความรู้สึกของคุณให้โลกได้รับรู้</p>
      </div>

      <InlinePostBox onPost={fetchPosts} />

      {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 text-center">{error}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 && !error ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="text-4xl mb-3">🍃</div>
          <h3 className="text-lg font-medium text-slate-800 mb-1">ลานสายลมยังคงเงียบสงบ</h3>
          <p className="text-slate-500">เป็นคนแรกที่บอกเล่าความรู้สึกในวันนี้สิ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => {
            const activeId = post.id || post._id || '';
            const isHugging = huggingIds.has(activeId);
            const hasHugged = huggedPosts.has(activeId);

            return (
              <div key={activeId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-2xl border border-slate-100 shadow-sm">{post.emotion}</div>
                      <div>
                        <Link to={`/user/${post.user_id}`} className="font-medium text-slate-800 hover:text-purple-600 transition-colors">{post.alias_name}</Link>
                        {post.poster_role === 'expert' && <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">🩺 ผู้เชี่ยวชาญ</span>}
                        <div className="text-xs text-slate-400">{formatDate(post.created_at)}</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeletePost(activeId)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="ลบโพสต์">🗑️</button>
                    )}
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap mb-4">{post.content}</p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-sm mt-auto">
                  <button
                    onClick={() => handleHug(activeId)}
                    disabled={isHugging}
                    className={`flex items-center gap-1.5 transition-colors active:scale-95 transform ${
                      hasHugged ? 'text-fuchsia-500 hover:text-fuchsia-600' : 'text-slate-500 hover:text-fuchsia-500'
                    }`}
                  >
                    <span className={`${isHugging ? 'animate-pulse' : ''} ${hasHugged ? 'scale-110 transition-transform' : ''}`}>
                      {hasHugged ? '💖' : '🫂'}
                    </span>
                    กอด {post.hug_count > 0 && <span className={`font-medium ${hasHugged ? 'text-fuchsia-600' : 'text-fuchsia-500'}`}>({post.hug_count})</span>}
                  </button>
                  <Link to={`/post/${activeId}`} className="flex items-center gap-1.5 text-slate-500 hover:text-purple-600 transition-colors">
                    <span>💬</span> คอมเมนต์ {post.comment_count > 0 && <span className="font-medium text-purple-600">({post.comment_count})</span>}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}