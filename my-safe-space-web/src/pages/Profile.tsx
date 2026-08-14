import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';
import AssessmentHistory from '../components/AssessmentHistory';
import api from '../api/axios';
import { getDeterministicAvatar } from '../utils/getDeterministicAvatar';
import { getActiveAssessments } from '../services/assessmentService';
import type { Assessment as AssessmentType } from '../types/assessment';
import { Icon } from '../components/Icon';

interface Post {
  id: string;
  content: string;
  emotion: string;
  alias_name: string;
  created_at: string;
  hug_count: number;
  comment_count: number;
}

const AVATAR_EMOJIS = [
  '🌸', '🌻', '🌺', '🐱', '🐰', '🦊', '🐼', '🌙', '⭐', '🍀',
  '🌈', '🦋', '🌷', '🌹', '🐶', '🐨', '🦁', '🐯', '🐸', '🐵',
  '🍄', '🌿', '🌊', '☀️', '🍓', '🍑', '🌼', '🐝', '🦄', '🐧',
]

const SPECIALTY_OPTIONS = [
  { key: 'stress', label: '🧠 จัดการความเครียด / ภาวะซึมเศร้า' },
  { key: 'relationship', label: '💔 เยียวยาความสัมพันธ์' },
  { key: 'burnout', label: '🔥 ภาวะหมดไฟในการทำงาน' },
  { key: 'family', label: '🏠 ปัญหาครอบครัวและคนใกล้ชิด' },
  { key: 'self_esteem', label: '✨ การเห็นคุณค่าในตัวเอง (Self-Esteem)' },
  { key: 'anxiety', label: '🌀 ความวิตกกังวล / อาการแพนิค' },
  { key: 'grief', label: '🕊️ การสูญเสียและความเศร้าโศก' },
  { key: 'lgbtq', label: '🌈 ความหลากหลายทางเพศ (LGBTQ+)' },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}, ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function Profile() {
  const { user, isAdmin, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'history' | 'assessment' | 'avatar' | 'expert'>(
    (['history', 'assessment', 'avatar', 'expert'].includes(tabParam || '') ? tabParam : 'history') as 'history' | 'assessment' | 'avatar' | 'expert'
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Quick Action Widget state
  const [activeAssessments, setActiveAssessments] = useState<AssessmentType[]>([]);
  const featuredAssessment = activeAssessments[0] || null;

  // Avatar tab state
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Expert upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  // Verify form state
  const [profession, setProfession] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [affiliation, setAffiliation] = useState('');
  const [availability, setAvailability] = useState('');
  const [consent, setConsent] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nickname = user?.nickname || localStorage.getItem('alias_name') || 'ผู้ใช้งาน';
  const displayAvatar = selectedAvatar || currentAvatar || getDeterministicAvatar(nickname);

  const fetchMyPosts = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get('/api/posts/me');
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (err: any) {
      setFetchError(err.response?.data?.error || 'ไม่สามารถโหลดประวัติได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchInbox = async () => {
    setLoadingInbox(true);
    try {
      const res = await api.get('/api/inbox');
      if (res.data.success) {
        setInboxMessages(res.data.messages);
      }
    } catch {
    } finally {
      setLoadingInbox(false);
    }
  };

  const fetchAvatar = async () => {
    if (!user) return;
    try {
      setAvatarLoading(true);
      const res = await api.get(`/api/user/${user.id}`);
      if (res.data.success && res.data.profile.avatar) {
        setCurrentAvatar(res.data.profile.avatar);
      }
    } catch {
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleInboxRead = async (id: string) => {
    try {
      await api.patch(`/api/inbox/${id}/read`);
      setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch {
    }
  };

  const handleTabChange = (tab: 'history' | 'assessment' | 'avatar' | 'expert') => {
    setActiveTab(tab);
    if (tab === 'history') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMyPosts();
      fetchInbox();
    } else if (activeTab === 'avatar') {
      fetchAvatar();
    }
  }, [activeTab]);

  useEffect(() => {
    getActiveAssessments().then(setActiveAssessments).catch(() => setActiveAssessments([]));
  }, []);

  const handleSelectAvatar = (emoji: string) => {
    setSelectedAvatar(emoji);
    setAvatarSuccess(null);
  };

  const handleConfirmAvatar = async () => {
    if (!selectedAvatar) return;
    setSavingAvatar(true);
    setAvatarSuccess(null);
    try {
      await api.put('/api/user/avatar', { avatar_value: selectedAvatar });
      setCurrentAvatar(selectedAvatar);
      setSelectedAvatar(null);
      setAvatarSuccess('✅ เปลี่ยน Avatar เรียบร้อย!');
      setTimeout(() => setAvatarSuccess(null), 2000);
    } catch (err: any) {
      setAvatarSuccess('❌ ' + (err.response?.data?.error || 'เกิดข้อผิดพลาด'));
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    setSelectedAvatar(null);
    setAvatarSuccess(null);
  };

  const handleUploadAvatar = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await api.post('/api/user/avatar/upload', formData);
      if (res.data.success) {
        setUploadMessage('✅ ส่งรูปให้แอดมินตรวจสอบแล้ว');
        setUploadFile(null);
      }
    } catch (err: any) {
      setUploadMessage('❌ ' + (err.response?.data?.error || 'อัปโหลดไม่สำเร็จ'));
    } finally {
      setUploading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!licenseFile) {
      setSubmitError('กรุณาเลือกรูปถ่ายใบประกอบวิชาชีพ');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('profession', profession);
      formData.append('licenseNumber', licenseNumber);
      formData.append('licenseFile', licenseFile);
      formData.append('specialties', JSON.stringify(selectedSpecialties));
      formData.append('affiliation', affiliation);
      formData.append('availability', availability);

      const response = await api.post('/api/verify', formData);

      if (response.data.success) {
        setSubmitSuccess(response.data.message || 'ส่งคำขอยืนยันตัวตนเรียบร้อยแล้ว');
        setProfession('');
        setLicenseNumber('');
        setSelectedSpecialties([]);
        setAffiliation('');
        setAvailability('');
        setLicenseFile(null);
        setConsent(false);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSpecialty = (key: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-body-muted animate-pulse font-medium">กำลังโหลดโปรไฟล์...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed">
            <Icon name="lock" size={28} />
          </div>
          <h2 className="text-xl font-bold text-ink">กรุณาเข้าสู่ระบบก่อน</h2>
          <Link to="/login" className="inline-block px-6 py-3 btn-primary">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">

        {/* ปุ่มกลับ */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-body-muted hover:text-body-strong transition-colors text-sm font-bold">
          <Icon name="chevron-left" size={16} /> กลับ
        </button>

        {/* ส่วนหัวโปรไฟล์ */}
        <section className="card rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-owl-soft/60 rounded-bl-full -z-10"></div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div
                onClick={() => handleTabChange('avatar')}
                className="w-20 h-20 bg-owl-soft rounded-full flex items-center justify-center text-4xl border border-owl-mint cursor-pointer hover:ring-2 hover:ring-owl transition-all"
              >
                {displayAvatar}
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black text-ink flex items-center gap-2">
                  {nickname}
                </h1>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <div className="inline-block px-3 py-1 bg-owl-soft text-owl-pressed font-bold text-sm rounded-full">
                    {isAdmin ? 'ผู้ดูแลระบบ' : user?.role === 'expert' ? 'ผู้เชี่ยวชาญ' : 'ผู้รับฟัง'}
                  </div>

                </div>
              </div>
            </div>

            <NotificationBell />
          </div>
        </section>

        {/* Quick Action Widget */}
        {featuredAssessment && activeTab !== 'assessment' && (
          <div className="bg-owl-soft/40 rounded-2xl p-5 border border-owl-mint">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <span className="w-12 h-12 bg-owl text-white rounded-full flex items-center justify-center shrink-0 shadow-lip-sm">
                <Icon name="chart" size={22} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">เช็กอินสุขภาพใจประจำสัปดาห์</p>
                <p className="text-sm text-body-muted font-medium">คุณยังไม่ได้ทำแบบประเมินสัปดาห์นี้ มาเช็กสภาพใจกันหน่อยไหม?</p>
              </div>
              <Link
                to="/assessment"
                className="px-5 py-2.5 btn-primary text-sm shrink-0 w-full md:w-auto"
              >
                เริ่มทำแบบประเมิน
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-owl-soft rounded-2xl">
          <button
            onClick={() => handleTabChange('history')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-ink shadow-lip-sm' : 'text-body-muted hover:text-body-strong'}`}
          >
            เรื่องราวของฉัน
          </button>

          <button
            onClick={() => handleTabChange('assessment')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'assessment' ? 'bg-white text-ink shadow-lip-sm' : 'text-body-muted hover:text-body-strong'}`}
          >
            แบบประเมิน & สุขภาพใจ
          </button>



          <button
            onClick={() => handleTabChange('expert')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'expert' ? 'bg-white text-ink shadow-lip-sm' : 'text-body-muted hover:text-body-strong'}`}
          >
            สถานะผู้เชี่ยวชาญ
          </button>
        </div>

        {/* Content area */}
        <section className="card rounded-3xl p-6 md:p-8 min-h-[400px]">

          {/* History tab — combines posts + inbox */}
          {activeTab === 'history' && (
            <div className="space-y-8">
              {/* My posts */}
              <div>
                <h2 className="text-xl font-black text-ink mb-4 flex items-center gap-2">
                  <Icon name="home" size={18} className="text-owl" /> เรื่องราวที่ฉันเคยระบาย
                </h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-lg text-body-soft animate-pulse">กำลังโหลดประวัติ...</div>
                  </div>
                ) : fetchError ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-cardinal/10 mx-auto rounded-full flex items-center justify-center text-cardinal mb-3"><Icon name="alert" size={24} /></div>
                    <p className="text-body-muted">{fetchError}</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 bg-owl-soft/30 rounded-2xl border border-dashed border-owl-mint">
                    <div className="w-12 h-12 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-3"><Icon name="home" size={22} /></div>
                    <h3 className="text-lg font-bold text-ink">ตู้เซฟของคุณยังว่างเปล่า</h3>
                    <p className="text-body-muted text-sm mt-1 font-medium">พื้นที่นี้จัดเก็บเฉพาะโพสต์ที่คุณเคยระบายไว้ สบายใจได้ ไม่มีใครเห็นแน่นอน</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                )}
              </div>

              {/* Inbox messages */}
              <div>
                <h2 className="text-xl font-black text-ink mb-4 flex items-center gap-2">
                  <Icon name="mail" size={18} className="text-owl" /> กำลังใจที่ได้รับ
                </h2>
                {loadingInbox ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-body-soft animate-pulse">กำลังโหลด...</div>
                  </div>
                ) : inboxMessages.length === 0 ? (
                  <div className="text-center py-8 bg-owl-soft/30 rounded-2xl border border-dashed border-owl-mint">
                    <div className="w-12 h-12 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-3"><Icon name="mail" size={22} /></div>
                    <h3 className="text-lg font-bold text-ink">กล่องจดหมายยังว่างเปล่า</h3>
                    <p className="text-body-muted text-sm mt-1 font-medium">ข้อความอบอุ่นจะถูกส่งมาเก็บไว้ที่นี่</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inboxMessages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => !msg.is_read && handleInboxRead(msg.id)}
                        className={`p-5 rounded-2xl border transition-colors cursor-pointer ${
                          msg.is_read
                            ? 'bg-white border-hairline'
                            : 'bg-owl-soft/50 border-owl-mint'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-body-strong whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</p>
                            <p className="text-xs text-body-soft mt-2">
                              {new Date(msg.created_at).toLocaleDateString('th-TH', {
                                year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {!msg.is_read && (
                            <span className="w-2.5 h-2.5 bg-owl rounded-full mt-2 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessment tab — ประวัติผลการประเมินของฉัน */}
          {activeTab === 'assessment' && (
            <AssessmentHistory />
          )}

          {/* Avatar tab */}
          {activeTab === 'avatar' && (
            <div className="space-y-6 animate-fadeIn">
              {/* ปุ่มออกจากส่วนแต่งตัว Avatar */}
              <button
                onClick={() => handleTabChange('history')}
                className="inline-flex items-center gap-2 text-body-muted hover:text-body-strong transition-colors text-sm font-bold"
              >
                <Icon name="chevron-left" size={16} /> กลับ
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-black text-ink">แต่งตัว Avatar</h2>
                <p className="text-sm text-body-muted mt-1 font-medium">เลือกอิโมจิที่ใช่สำหรับโปรไฟล์ของคุณ</p>
              </div>

              <div className="flex justify-center relative">
                <div className="w-24 h-24 bg-owl-soft rounded-full flex items-center justify-center text-5xl border border-owl-mint">
                  {displayAvatar}
                </div>
                {avatarLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-9 h-9 border-4 border-owl border-t-transparent rounded-full animate-spin" />
                  </span>
                )}
                {selectedAvatar && selectedAvatar !== currentAvatar && (
                  <button
                    onClick={() => handleTabChange('history')}
                    className="absolute -top-1 -right-1 w-7 h-7 bg-owl-pressed hover:bg-owl text-white rounded-full flex items-center justify-center text-sm transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {avatarSuccess && (
                <div className={`relative text-center text-sm font-medium p-3 rounded-xl border ${
                  avatarSuccess.startsWith('✅')
                    ? 'bg-macaw/10 text-macaw border-macaw/40'
                    : 'bg-cardinal/10 text-cardinal border-cardinal/30'
                }`}>
                  {avatarSuccess}
                  <button
                    onClick={() => setAvatarSuccess(null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base opacity-60 hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-w-md mx-auto">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectAvatar(emoji)}
                    disabled={savingAvatar}
                    className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all ${
                      (selectedAvatar ?? currentAvatar) === emoji
                        ? 'bg-owl-soft ring-2 ring-owl scale-110'
                        : 'bg-white hover:bg-owl-soft/50 border border-hairline'
                    } disabled:opacity-50`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Confirm / Cancel buttons */}
              {selectedAvatar && selectedAvatar !== currentAvatar && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleCancelAvatar}
                    disabled={savingAvatar}
                    className="px-6 py-2.5 btn-secondary text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleConfirmAvatar}
                    disabled={savingAvatar}
                    className="px-6 py-2.5 btn-primary text-sm"
                  >
                    {savingAvatar ? 'กำลังบันทึก...' : 'ยืนยัน'}
                  </button>
                </div>
              )}

              {/* Expert upload section */}
              {user?.role === 'expert' && (
                <div className="border-t border-hairline pt-6 mt-6">
                  <h3 className="text-lg font-bold text-ink text-center mb-4">หรืออัปโหลดรูปโปรไฟล์</h3>
                  <p className="text-xs text-body-muted text-center mb-4 font-medium">อัปโหลดรูปภาพขนาดไม่เกิน 5MB (JPG, PNG, WebP) รอแอดมินตรวจสอบ</p>

                  <div className="max-w-sm mx-auto space-y-3">
                    <div
                      onClick={() => uploadFileRef.current?.click()}
                      className="border-2 border-dashed border-hairline rounded-xl p-4 text-center hover:bg-owl-soft/30 transition-colors cursor-pointer"
                    >
                      {uploadFile ? (
                        <>
                          <div className="w-10 h-10 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-1"><Icon name="check" size={18} /></div>
                          <p className="text-sm text-body-strong font-bold">{uploadFile.name}</p>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-1"><Icon name="image" size={18} /></div>
                          <p className="text-sm text-body-muted font-medium">คลิกเลือกไฟล์รูปภาพ</p>
                        </>
                      )}
                      <input
                        ref={uploadFileRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    {uploadFile && (
                      <button
                        onClick={handleUploadAvatar}
                        disabled={uploading}
                        className="w-full py-2.5 btn-primary text-sm"
                      >
                        {uploading ? 'กำลังอัปโหลด...' : 'ส่งให้แอดมินตรวจสอบ'}
                      </button>
                    )}

                    {uploadMessage && (
                      <div className={`text-center text-sm font-medium ${uploadMessage.startsWith('✅') ? 'text-macaw' : 'text-cardinal'}`}>
                        {uploadMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expert tab — apply form for non-experts, info for experts */}
          {activeTab === 'expert' && (
            <div className="space-y-6 animate-fadeIn">
              {user?.role === 'expert' ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-4">
                    <Icon name="stethoscope" size={28} />
                  </div>
                  <h2 className="text-2xl font-black text-ink">สถานะผู้เชี่ยวชาญ</h2>
                  <p className="text-body-muted mt-2 font-medium">คุณเป็นผู้เชี่ยวชาญที่ได้รับการรับรองแล้ว</p>
                  <div className="inline-block px-4 py-2 bg-owl-soft text-owl-pressed rounded-full font-bold mt-4">
                    ผู้เชี่ยวชาญรับรอง
                  </div>
                  <p className="text-sm text-body-soft mt-6">
                    ฟีเจอร์แก้ไขข้อมูลผู้เชี่ยวชาญจะมาเร็วๆ นี้
                  </p>
                </div>
              ) : isAdmin ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-4">
                    <Icon name="shield" size={28} />
                  </div>
                  <h2 className="text-2xl font-black text-ink">คุณคือผู้ดูแลระบบ</h2>
                  <p className="text-body-muted mt-2 font-medium">บัญชีผู้ดูแลระบบไม่จำเป็นต้องสมัครเป็นผู้เชี่ยวชาญ</p>
                  <Link
                    to="/admin-dashboard"
                    className="inline-block mt-4 px-6 py-3 btn-primary"
                  >
                    ไปที่หน้าแอดมิน
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-ink">ยกระดับบัญชีเป็น "ผู้เชี่ยวชาญ"</h2>
                    <p className="text-sm text-body-muted mt-2 font-medium">
                      กรุณากรอกข้อมูลและแนบเอกสารเพื่อรับตราสัญลักษณ์ <span className="font-bold text-ink">ผู้เชี่ยวชาญ</span><br />
                      (ข้อมูลทั้งหมดจะถูกเก็บเป็นความลับและประมวลผลโดยแอดมินเท่านั้น)
                    </p>
                  </div>

                  <form onSubmit={handleVerifySubmit} className="max-w-xl mx-auto space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-body-strong">ประเภทวิชาชีพ <span className="text-cardinal">*</span></label>
                      <select
                        required
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="input"
                      >
                        <option value="" disabled>เลือกประเภทวิชาชีพของคุณ</option>
                        <option value="psychiatrist">จิตแพทย์</option>
                        <option value="clinical_psychologist">นักจิตวิทยาคลินิก</option>
                        <option value="counseling_psychologist">นักจิตวิทยาการปรึกษา</option>
                        <option value="social_worker">นักสังคมสงเคราะห์จิตเวช</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-body-strong">เลขที่ใบประกอบวิชาชีพ / ใบอนุญาต <span className="text-cardinal">*</span></label>
                      <input
                        type="text"
                        required
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="เช่น ว.12345 หรือ ศส.9876"
                        className="input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-body-strong"><Icon name="sparkles" size={13} className="inline text-owl mr-1" /> สาขาที่เชี่ยวชาญ (เลือกได้หลายข้อ)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SPECIALTY_OPTIONS.map((opt) => (
                          <label
                            key={opt.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                              selectedSpecialties.includes(opt.key)
                                ? 'bg-owl-soft border-owl-mint text-owl-pressed'
                                : 'bg-white border-hairline text-body-strong hover:bg-owl-soft/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSpecialties.includes(opt.key)}
                              onChange={() => toggleSpecialty(opt.key)}
                              className="w-4 h-4 text-owl accent-owl rounded focus:ring-owl"
                            />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-body-strong">สังกัด (ถ้ามี)</label>
                      <input
                        type="text"
                        value={affiliation}
                        onChange={(e) => setAffiliation(e.target.value)}
                        placeholder="เช่น สมาคมจิตวิทยาแห่งประเทศไทย"
                        className="input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-body-strong">ช่วงเวลาที่พร้อมรับฟัง (ถ้ามี)</label>
                      <input
                        type="text"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder="เช่น 10:00-18:00 น."
                        className="input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-body-strong">รูปถ่ายใบประกอบวิชาชีพ <span className="text-cardinal">*</span></label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-hairline rounded-xl p-6 text-center hover:bg-owl-soft/30 transition-colors cursor-pointer"
                      >
                        {licenseFile ? (
                          <>
                            <div className="w-12 h-12 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-2"><Icon name="check" size={20} /></div>
                            <p className="text-sm text-body-strong font-bold">{licenseFile.name}</p>
                            <p className="text-xs text-body-soft mt-1">{(licenseFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-2"><Icon name="paperclip" size={20} /></div>
                            <p className="text-sm text-body-muted font-bold">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
                            <p className="text-xs text-body-soft mt-1">รองรับ JPG, PNG, PDF ขนาดไม่เกิน 5MB</p>
                          </>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-3 mt-6 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 w-4 h-4 text-owl border-hairline rounded focus:ring-owl"
                      />
                      <span className="text-xs text-body-muted leading-relaxed font-medium">
                        ข้าพเจ้ายินยอมให้เว็บไซต์บ้านพักใจเก็บรวบรวมและประมวลผลข้อมูลส่วนบุคคลและเอกสารที่แนบมานี้ เพื่อวัตถุประสงค์ในการตรวจสอบและยืนยันตัวตนเท่านั้น (ข้อมูลไฟล์จะถูกลบออกจากระบบหลังการอนุมัติเสร็จสิ้น)
                      </span>
                    </label>

                    {submitError && (
                      <div className="bg-cardinal/10 border border-cardinal/30 text-cardinal px-4 py-3 rounded-xl text-sm font-medium">
                        {submitError}
                      </div>
                    )}
                    {submitSuccess && (
                      <div className="bg-macaw/10 border border-macaw/40 text-macaw px-4 py-3 rounded-xl text-sm font-medium">
                        {submitSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!consent || isSubmitting}
                      className="w-full btn-primary mt-4 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          กำลังส่งคำขอ...
                        </>
                      ) : (
                        'ส่งคำขอยืนยันตัวตน'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
