import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { getDeterministicAvatar } from '../utils/getDeterministicAvatar';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';

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
    <div className={`${sizeClass} bg-owl-soft rounded-full flex items-center justify-center border border-owl-mint shrink-0`}>
      {displayAvatar}
    </div>
  );
}

function ExpertProfileCard({ expert }: { expert: ExpertInfo }) {
  return (
    <div className="bg-owl-soft/30 rounded-2xl p-5 border border-owl-mint space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="stethoscope" size={18} className="text-owl-pressed" />
        <span className="font-bold text-ink">{expert.profession_label}</span>
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-owl text-white rounded-full font-bold">ผู้เชี่ยวชาญรับรอง</span>
      </div>

      {expert.affiliation && (
        <p className="text-sm text-body-muted flex items-center gap-1.5 font-medium">
          <Icon name="home" size={14} className="text-owl" /> สังกัด: {expert.affiliation}
        </p>
      )}

      {expert.availability && (
        <p className="text-sm text-macaw flex items-center gap-1.5 font-medium">
          <Icon name="clock" size={14} /> พร้อมรับฟัง ({expert.availability} น.)
        </p>
      )}

      {expert.specialty_labels.length > 0 && (
        <div>
          <p className="text-sm font-bold text-body-strong mb-1.5"><Icon name="sparkles" size={13} className="inline text-owl mr-1" /> สาขาที่เชี่ยวชาญ:</p>
          <div className="flex flex-wrap gap-1.5">
            {expert.specialty_labels.map((label, i) => (
              <span key={i} className="inline-block px-2.5 py-1 bg-white text-body-strong text-xs rounded-full border border-hairline">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-3"><Icon name="sparkles" size={24} /></div>
        <p className="text-body-muted font-medium">ยังไม่มีเรื่องราวที่แบ่งปัน</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-owl-soft/25 p-5 rounded-2xl border border-hairline hover:shadow-card transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{post.emotion}</span>
              <span className="font-bold text-body-strong">{post.alias_name}</span>
            </div>
            <span className="text-xs text-body-soft font-medium">{formatDate(post.created_at)}</span>
          </div>
          <p className="text-body-strong whitespace-pre-wrap mb-3 font-medium">{post.content}</p>
          <div className="flex items-center gap-4 pt-3 border-t border-hairline text-sm">
            <span className="text-cardinal font-medium"><Icon name="heart" size={15} className="inline mr-1" /> กอด ({post.hug_count})</span>
            <Link to={`/post/${post.id}`} className="text-owl-pressed hover:text-owl transition-colors font-medium">
              <Icon name="message" size={15} className="inline mr-1" /> คอมเมนต์ ({post.comment_count})
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
      alert('ส่งกำลังใจให้เรียบร้อยแล้ว!');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-body-soft animate-pulse font-medium">กำลังโหลดโปรไฟล์...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-4">
            <Icon name="search" size={26} />
          </div>
          <h2 className="text-xl font-bold text-ink">ไม่พบผู้ใช้</h2>
          <p className="text-body-muted font-medium">ผู้ใช้นี้ไม่มีอยู่ในระบบ หรือลิงก์ไม่ถูกต้อง</p>
          <button onClick={() => navigate(-1)} className="inline-block px-6 py-3 btn-primary">กลับ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {/* ปุ่มกลับ */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-body-muted hover:text-body-strong transition-colors text-sm font-bold">
          <Icon name="chevron-left" size={16} /> กลับ
        </button>

        {/* ส่วนหัวโปรไฟล์ */}
        <section className="card rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-owl-soft/60 rounded-bl-full -z-10"></div>

          <div className="flex items-start gap-5">
            <AvatarDisplay avatar={profile.avatar} nickname={profile.nickname} size="large" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-ink">{profile.nickname}</h1>
                {profile.role === 'expert' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-macaw/10 text-ink rounded-full font-bold"><Icon name="stethoscope" size={12} className="text-macaw" /> ผู้เชี่ยวชาญ</span>
                )}
              </div>

              <p className="text-sm text-body-soft mt-1 font-medium">{memberSince}</p>

              {profile.last_post && (
                <p className="text-sm text-body-muted mt-2 flex items-center gap-1.5 font-medium">
                  <Icon name="message" size={14} className="text-owl" /> ล่าสุด: {profile.last_post.emotion} "{profile.last_post.content}"
                </p>
              )}

              <div className="flex items-center gap-2 mt-4">
                {isOwnProfile ? (
                  <Link to="/profile" className="inline-flex items-center gap-1.5 px-4 py-2 btn-secondary text-sm">
                    <Icon name="pencil" size={14} /> แก้ไขโปรไฟล์
                  </Link>
                ) : (
                  <button
                    onClick={openCardModal}
                    disabled={!isAuthenticated}
                    className="inline-flex items-center gap-1.5 px-4 py-2 btn-primary text-sm"
                  >
                    ส่งกำลังใจ
                  </button>
                )}
                {profile.role === 'expert' && !isOwnProfile && (
                  <Link
                    to={`/post/${profile.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 btn-secondary text-sm"
                  >
                    <Icon name="message" size={14} /> พูดคุยกับผู้เชี่ยวชาญ
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
        <section className="card rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-black text-ink mb-6 flex items-center gap-2">
            <Icon name="home" size={18} className="text-owl" /> เรื่องราวทั้งหมด
          </h2>

          {loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-body-soft animate-pulse">กำลังโหลด...</div>
            </div>
          ) : (
            <PostList posts={posts} />
          )}
        </section>
      </div>

      {/* Modal ส่งการ์ดกำลังใจ */}
      {cardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onClick={() => setCardModal(false)}>
          <div className="card rounded-3xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink"><Icon name="heart" size={17} className="inline text-cardinal mr-1" /> ส่งกำลังใจถึง {profile?.nickname}</h3>
              <button onClick={() => setCardModal(false)} className="text-body-soft hover:text-body-strong text-xl">✕</button>
            </div>

            {presetCards.length === 0 ? (
              <div className="text-center py-8 text-body-muted font-medium">ไม่พบการ์ดฮีลใจ</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {presetCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => sendCard(card.id)}
                    disabled={sendingCard}
                    className="p-4 bg-owl-soft/40 rounded-2xl border border-owl-mint hover:shadow-card hover:border-owl transition-all text-center disabled:opacity-50"
                  >
                    <div className="text-3xl mb-2">{card.icon}</div>
                    <p className="text-sm text-body-strong font-bold">{card.thai_text}</p>
                  </button>
                ))}
              </div>
            )}

            {sendingCard && (
              <div className="text-center py-4 text-owl-pressed animate-pulse font-medium">กำลังส่งกำลังใจ...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
