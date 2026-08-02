import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { getDeterministicAvatar } from '../utils/getDeterministicAvatar';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  content: string;
  emotion: string;
  alias_name: string;
  poster_role?: string;
  created_at: string;
  hug_count: number;
  comment_count: number;
}

interface ExpertInfo {
  profession_type: string;
  profession_label: string;
  affiliation: string | null;
  specialties: string[];
  specialty_labels: string[];
  availability: string | null;
  is_verified: boolean;
}

interface ProfileData {
  id: string;
  nickname: string;
  role: 'user' | 'expert';
  avatar: string | null;
  created_at: string;
  last_post: { content: string; emotion: string; created_at: string } | null;
  expert_info?: ExpertInfo;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function AvatarDisplay({ avatar, nickname, size = 'default' }: { avatar: string | null; nickname: string; size?: 'default' | 'large' }) {
  const displayAvatar = avatar || getDeterministicAvatar(nickname);
  const sizeClass = size === 'large' ? 'w-20 h-20 text-4xl' : 'w-14 h-14 text-2xl';
  return (
    <div className={`${sizeClass} bg-gradient-to-tr from-pink-200 to-purple-200 rounded-full flex items-center justify-center shadow-inner shrink-0`}>
      {displayAvatar}
    </div>
  );
}

function ExpertProfileCard({ expert }: { expert: ExpertInfo }) {
  return (
    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-100 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🩺</span>
        <span className="font-bold text-teal-800">{expert.profession_label}</span>
        <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 bg-teal-200 text-teal-800 rounded-full font-medium">✨ ผู้เชี่ยวชาญรับรอง</span>
      </div>

      {expert.affiliation && (
        <p className="text-sm text-gray-600 flex items-center gap-1.5">
          <span>🏛️</span> สังกัด: {expert.affiliation}
        </p>
      )}

      {expert.availability && (
        <p className="text-sm text-green-700 flex items-center gap-1.5">
          <span>🟢</span> พร้อมรับฟัง ({expert.availability} น.)
        </p>
      )}

      {expert.specialty_labels.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1.5">🏷️ สาขาที่เชี่ยวชาญ:</p>
          <div className="flex flex-wrap gap-1.5">
            {expert.specialty_labels.map((label, i) => (
              <span key={i} className="inline-block px-2.5 py-1 bg-white/70 text-gray-700 text-xs rounded-full border border-teal-200/50 shadow-sm">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecialtyTags({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label, i) => (
        <span key={i} className="inline-block px-2.5 py-1 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-100">
          {label}
        </span>
      ))}
    </div>
  );
}

function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📝</div>
        <p className="text-gray-500">ยังไม่มีเรื่องราวที่แบ่งปัน</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{post.emotion}</span>
              <span className="font-medium text-gray-800">{post.alias_name}</span>
            </div>
            <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap mb-3">{post.content}</p>
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200 text-sm">
            <span className="text-pink-500">🫂 กอด ({post.hug_count})</span>
            <Link to={`/post/${post.id}`} className="text-purple-600 hover:text-purple-700 transition-colors">
              💬 คอมเมนต์ ({post.comment_count})
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardModal, setCardModal] = useState(false);
  const [presetCards, setPresetCards] = useState<any[]>([]);
  const [sendingCard, setSendingCard] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    api.get(`/api/user/${id}`)
      .then(res => {
        if (res.data.success) {
          setProfile(res.data.profile);
        } else {
          setError(res.data.error || 'ไม่พบผู้ใช้');
        }
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setError('ไม่พบผู้ใช้');
        } else {
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
      })
      .finally(() => setLoading(false));

    setLoadingPosts(true);
    api.get(`/api/user/${id}/posts`)
      .then(res => {
        if (res.data.success) {
          setPosts(res.data.posts);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [id]);

  const openCardModal = async () => {
    try {
      const res = await api.get('/api/preset-cards');
      if (res.data.success) {
        setPresetCards(res.data.cards);
      }
    } catch {
      setPresetCards([]);
    }
    setCardModal(true);
  };

  const sendCard = async (cardId: string) => {
    if (!profile) return;
    setSendingCard(true);
    try {
      await api.post('/api/inbox', {
        to_user_id: profile.id,
        card_id: cardId,
      });
      alert('💌 ส่งกำลังใจให้เรียบร้อยแล้ว!');
      setCardModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'ไม่สามารถส่งกำลังใจได้');
    } finally {
      setSendingCard(false);
    }
  };

  const memberSince = profile?.created_at
    ? `สมาชิกตั้งแต่ ${formatDate(profile.created_at)}`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg text-gray-400 animate-pulse">กำลังโหลดโปรไฟล์...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-700">ไม่พบผู้ใช้</h2>
          <p className="text-gray-500">ผู้ใช้นี้ไม่มีอยู่ในระบบ หรือลิงก์ไม่ถูกต้อง</p>
          <button onClick={() => navigate(-1)} className="inline-block px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors">
            ← กลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {/* ปุ่มกลับ */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium">
          <span>⬅️</span> กลับ
        </button>

        {/* ส่วนหัวโปรไฟล์ */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -z-10"></div>

          <div className="flex items-start gap-5">
            <AvatarDisplay avatar={profile.avatar} nickname={profile.nickname} size="large" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{profile.nickname}</h1>
                {profile.role === 'expert' && (
                  <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">🩺 ผู้เชี่ยวชาญ</span>
                )}
              </div>

              <p className="text-sm text-gray-400 mt-1">{memberSince}</p>

              {profile.last_post && (
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                  <span>💬</span> ล่าสุด: {profile.last_post.emotion} "{profile.last_post.content}"
                </p>
              )}

              <div className="flex items-center gap-2 mt-4">
                {isOwnProfile ? (
                  <Link to="/profile" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                    ✏️ แก้ไขโปรไฟล์
                  </Link>
                ) : (
                  <button
                    onClick={openCardModal}
                    disabled={!isAuthenticated}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    🫂 ส่งกำลังใจ
                  </button>
                )}
                {profile.role === 'expert' && !isOwnProfile && (
                  <Link
                    to={`/post/${profile.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    💬 พูดคุยกับผู้เชี่ยวชาญ
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Expert Profile Card */}
        {profile.role === 'expert' && profile.expert_info && (
          <ExpertProfileCard expert={profile.expert_info} />
        )}

        {/* โพสต์ทั้งหมด */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>📖</span> เรื่องราวทั้งหมด
          </h2>

          {loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400 animate-pulse">กำลังโหลด...</div>
            </div>
          ) : (
            <PostList posts={posts} />
          )}
        </section>
      </div>

      {/* Modal ส่งการ์ดกำลังใจ */}
      {cardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCardModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">💌 ส่งกำลังใจถึง {profile?.nickname}</h3>
              <button onClick={() => setCardModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {presetCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ไม่พบการ์ดฮีลใจ</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {presetCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => sendCard(card.id)}
                    disabled={sendingCard}
                    className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100 hover:shadow-md hover:border-pink-200 transition-all text-center disabled:opacity-50"
                  >
                    <div className="text-3xl mb-2">{card.icon}</div>
                    <p className="text-sm text-gray-700 font-medium">{card.thai_text}</p>
                  </button>
                ))}
              </div>
            )}

            {sendingCard && (
              <div className="text-center py-4 text-purple-600 animate-pulse">กำลังส่งกำลังใจ...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
