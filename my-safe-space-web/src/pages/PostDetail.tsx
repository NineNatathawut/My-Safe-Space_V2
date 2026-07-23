import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Comment {
  id: string;
  _id?: string;
  content: string;
  alias_name: string;
  created_at: string;
}

interface Post {
  id: string;
  _id?: string;
  content: string;
  emotion: string;
  alias_name: string;
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

  // 🔄 ดึงรายละเอียดโพสต์และรายการคอมเมนต์
  useEffect(() => {
    if (id) {
      fetchPostAndComments();
    }
  }, [id]);

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

      const response = await api.post(`/api/posts/${id}/comments`, {
        content: newComment
      }, config);

      if (response.data.success) {
        // เพิ่มคอมเมนต์ใหม่เข้าไปใน State ทันที
        const addedComment = response.data.comment || {
          id: Date.now().toString(),
          content: newComment,
          alias_name: response.data.alias_name || 'ผู้ห่วงใยไร้นาม',
          created_at: new Date().toISOString()
        };
        
        setComments(prev => [...prev, addedComment]);
        setNewComment(''); // ล้างช่องพิมพ์
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
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await api.post(`/api/posts/${id}/hug`, {}, config);

      if (response.data.success) {
        setPost(prev => prev ? {
          ...prev,
          hug_count: typeof response.data.hug_count === 'number' 
            ? response.data.hug_count 
            : (response.data.hugged ? prev.hug_count + 1 : Math.max(0, prev.hug_count - 1))
        } : null);
      }
    } catch (err) {
      console.error("Error hugging:", err);
    }
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
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-100 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="text-4xl mb-4">🍃</div>
        <p className="text-gray-600 mb-6">{error || 'ไม่พบโพสต์ที่คุณต้องการ'}</p>
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
      <button 
        onClick={() => navigate(-1)}
        className="text-gray-500 hover:text-purple-600 flex items-center gap-2 text-sm font-medium transition-colors"
      >
        ← ย้อนกลับ
      </button>

      {/* 📌 โพสต์หลัก */}
      <article className="bg-white p-8 rounded-3xl shadow-sm border border-purple-50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-3xl border border-purple-100 shadow-sm">
            {post.emotion}
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-lg">{post.alias_name}</h1>
            <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
          </div>
        </div>

        <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap mb-8">
          {post.content}
        </p>

        <div className="pt-4 border-t border-gray-100 flex items-center gap-6">
          <button 
            onClick={handleHug}
            className="flex items-center gap-2 text-gray-600 hover:text-pink-500 font-medium transition-colors active:scale-95 transform"
          >
            <span className="text-xl">🫂</span> ส่งกอด {post.hug_count > 0 && <span className="text-pink-500">({post.hug_count})</span>}
          </button>
          <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
            <span>💬</span> {comments.length} ความคิดเห็น
          </div>
        </div>
      </article>

      {/* ✍️ ช่องพิมพ์ส่งกำลังใจ (คอมเมนต์) */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💌</span> ส่งกำลังใจให้เพื่อน
        </h3>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="พิมพ์คำปลอบโยน หรือข้อความให้กำลังใจที่นี่... (ไม่ต้องระบุตัวตน)"
            className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none text-gray-700"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{newComment.length}/500</span>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังส่ง...' : 'ส่งกำลังใจ 🤍'}
            </button>
          </div>
        </form>
      </section>

      {/* 💬 รายการคอมเมนต์ทั้งหมด */}
      <section className="space-y-4">
        <h3 className="font-bold text-gray-800 text-lg px-2">
          ข้อความกำลังใจ ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-8 bg-purple-50/50 rounded-2xl border border-dashed border-purple-100">
            <p className="text-gray-500 text-sm">ยังไม่มีใครส่งกำลังใจ เป็นคนแรกที่มอบความ 따뜻 ให้เพื่อนสิ 🤍</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const commentId = comment.id || comment._id || Math.random().toString();
              return (
                <div key={commentId} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm text-purple-900">{comment.alias_name}</span>
                    <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}