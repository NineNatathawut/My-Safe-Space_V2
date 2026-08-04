import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminAssessmentManager } from '../components/AdminAssessmentManager';
import NotificationBell from '../components/NotificationBell';
import api from '../api/axios';
import { getDeterministicAvatar } from '../utils/getDeterministicAvatar';
import { getActiveAssessments } from '../services/assessmentService';
import type { Assessment as AssessmentType } from '../types/assessment';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl text-gray-500 animate-pulse">กำลังโหลดโปรไฟล์...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-gray-700">กรุณาเข้าสู่ระบบก่อน</h2>
          <Link to="/login" className="inline-block px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">

        {/* ส่วนหัวโปรไฟล์ */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -z-10"></div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div
                onClick={() => handleTabChange('avatar')}
                className="w-20 h-20 bg-gradient-to-tr from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-4xl shadow-inner cursor-pointer hover:ring-2 hover:ring-pink-400 transition-all"
              >
                {displayAvatar}
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                  {nickname}
                </h1>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <div className="inline-block px-3 py-1 bg-pink-100 text-pink-700 font-medium text-sm rounded-full">
                    {isAdmin ? 'ผู้ดูแลระบบ 🛡️' : user?.role === 'expert' ? 'ผู้เชี่ยวชาญ 🩺' : 'ผู้รับฟัง ❤️'}
                  </div>
                  
                </div>
              </div>
            </div>

            <NotificationBell />
          </div>
        </section>

        {/* Quick Action Widget */}
        {featuredAssessment && activeTab !== 'assessment' && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-5 border border-pink-100 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-3xl shrink-0">💡</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">เช็กอินสุขภาพใจประจำสัปดาห์</p>
                <p className="text-sm text-gray-500">คุณยังไม่ได้ทำแบบประเมินสัปดาห์นี้ มาเช็กสภาพใจกันหน่อยไหม?</p>
              </div>
              <Link
                to="/assessment"
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all shrink-0"
              >
                📊 เริ่มทำแบบประเมิน
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-gray-200/50 rounded-2xl">
          <button
            onClick={() => handleTabChange('history')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📖 เรื่องราวของฉัน
          </button>

          <button
            onClick={() => handleTabChange('assessment')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'assessment' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📊 แบบประเมิน & สุขภาพใจ
          </button>



          <button
            onClick={() => handleTabChange('expert')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'expert' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🩺 สถานะผู้เชี่ยวชาญ
          </button>
        </div>

        {/* Content area */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 min-h-[400px]">

          {/* History tab — combines posts + inbox */}
          {activeTab === 'history' && (
            <div className="space-y-8">
              {/* My posts */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📝 เรื่องราวที่ฉันเคยระบาย
                </h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-lg text-gray-400 animate-pulse">กำลังโหลดประวัติ...</div>
                  </div>
                ) : fetchError ? (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="text-gray-500">{fetchError}</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="text-4xl mb-3">📝</div>
                    <h3 className="text-lg font-bold text-gray-700">ตู้เซฟของคุณยังว่างเปล่า</h3>
                    <p className="text-gray-500 text-sm mt-1">พื้นที่นี้จัดเก็บเฉพาะโพสต์ที่คุณเคยระบายไว้ สบายใจได้ ไม่มีใครเห็นแน่นอน</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                )}
              </div>

              {/* Inbox messages */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  💌 กำลังใจที่ได้รับ
                </h2>
                {loadingInbox ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-400 animate-pulse">กำลังโหลด...</div>
                  </div>
                ) : inboxMessages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="text-4xl mb-3">💌</div>
                    <h3 className="text-lg font-bold text-gray-700">กล่องจดหมายยังว่างเปล่า</h3>
                    <p className="text-gray-500 text-sm mt-1">ข้อความอบอุ่นจะถูกส่งมาเก็บไว้ที่นี่</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inboxMessages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => !msg.is_read && handleInboxRead(msg.id)}
                        className={`p-5 rounded-2xl border transition-colors cursor-pointer ${
                          msg.is_read
                            ? 'bg-white border-gray-100'
                            : 'bg-indigo-50/50 border-indigo-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(msg.created_at).toLocaleDateString('th-TH', {
                                year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {!msg.is_read && (
                            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessment tab */}
          {activeTab === 'assessment' && (
            <div className="space-y-6 animate-fadeIn">
              {isAdmin ? (
                <AdminAssessmentManager />
              ) : (
                <>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">📊 แบบประเมิน & สุขภาพใจ</h2>
                    <p className="text-sm text-gray-500 mt-1">ติดตามสุขภาพใจของคุณด้วยแบบประเมินต่างๆ</p>
                  </div>

                  {activeAssessments.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <div className="text-4xl mb-3">📋</div>
                      <h3 className="text-lg font-bold text-gray-700">ยังไม่มีแบบประเมินที่เปิดใช้งาน</h3>
                      <p className="text-gray-500 text-sm mt-1">รอแอดมินเพิ่มแบบประเมิน แล้วกลับมาตรวจสอบอีกครั้งนะ</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeAssessments.map((a) => (
                        <div
                          key={a.id}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col"
                        >
                          <div className="text-4xl mb-3">
                            {a.type === 'EXTERNAL' ? '🔗' : '📝'}
                          </div>
                          <h3 className="font-bold text-gray-800">{a.title}</h3>
                          {a.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                a.type === 'EXTERNAL'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {a.type === 'EXTERNAL' ? '🔗 External' : '📝 Internal'}
                            </span>
                            {a.estimated_time_mins && (
                              <span className="text-xs text-gray-400">~{a.estimated_time_mins} นาที</span>
                            )}
                          </div>
                          {a.type === 'EXTERNAL' ? (
                            <a
                              href={a.external_url}
                              target={a.open_in_new_tab !== false ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                            >
                              ไปทำแบบประเมิน
                            </a>
                          ) : (
                            <Link
                              to={`/assessment?id=${a.id}`}
                              className="mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                            >
                              เริ่มทำแบบประเมิน
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Avatar tab */}
          {activeTab === 'avatar' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">🎨 แต่งตัว Avatar</h2>
                <p className="text-sm text-gray-500 mt-1">เลือกอิโมจิที่ใช่สำหรับโปรไฟล์ของคุณ</p>
              </div>

              <div className="flex justify-center relative">
                <div className="w-24 h-24 bg-gradient-to-tr from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-5xl shadow-inner">
                  {displayAvatar}
                </div>
                {selectedAvatar && selectedAvatar !== currentAvatar && (
                  <button
                    onClick={() => handleTabChange('history')}
                    className="absolute -top-1 -right-1 w-7 h-7 bg-gray-800/70 hover:bg-gray-800 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {avatarSuccess && (
                <div className={`relative text-center text-sm font-medium p-3 rounded-xl border ${
                  avatarSuccess.startsWith('✅')
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
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
                        ? 'bg-pink-100 ring-2 ring-pink-400 scale-110'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
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
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleConfirmAvatar}
                    disabled={savingAvatar}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:brightness-110 text-white font-bold rounded-xl transition-all text-sm shadow-sm disabled:opacity-50"
                  >
                    {savingAvatar ? 'กำลังบันทึก...' : '✅ ยืนยัน'}
                  </button>
                </div>
              )}

              {/* Expert upload section */}
              {user?.role === 'expert' && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-gray-700 text-center mb-4">📸 หรืออัปโหลดรูปโปรไฟล์</h3>
                  <p className="text-xs text-gray-500 text-center mb-4">อัปโหลดรูปภาพขนาดไม่เกิน 5MB (JPG, PNG, WebP) รอแอดมินตรวจสอบ</p>

                  <div className="max-w-sm mx-auto space-y-3">
                    <div
                      onClick={() => uploadFileRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {uploadFile ? (
                        <>
                          <div className="text-2xl mb-1">✅</div>
                          <p className="text-sm text-gray-700 font-medium">{uploadFile.name}</p>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl mb-1">📎</div>
                          <p className="text-sm text-gray-600">คลิกเลือกไฟล์รูปภาพ</p>
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
                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors text-sm"
                      >
                        {uploading ? 'กำลังอัปโหลด...' : 'ส่งให้แอดมินตรวจสอบ'}
                      </button>
                    )}

                    {uploadMessage && (
                      <div className={`text-center text-sm font-medium ${uploadMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
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
                  <div className="text-5xl mb-4">🩺</div>
                  <h2 className="text-2xl font-bold text-gray-800">สถานะผู้เชี่ยวชาญ</h2>
                  <p className="text-gray-500 mt-2">คุณเป็นผู้เชี่ยวชาญที่ได้รับการรับรองแล้ว</p>
                  <div className="inline-block px-4 py-2 bg-teal-100 text-teal-800 rounded-full font-medium mt-4">
                    ✅ ผู้เชี่ยวชาญรับรอง
                  </div>
                  <p className="text-sm text-gray-400 mt-6">
                    ฟีเจอร์แก้ไขข้อมูลผู้เชี่ยวชาญจะมาเร็วๆ นี้
                  </p>
                </div>
              ) : isAdmin ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">🛡️</div>
                  <h2 className="text-2xl font-bold text-gray-800">คุณคือผู้ดูแลระบบ</h2>
                  <p className="text-gray-500 mt-2">บัญชีผู้ดูแลระบบไม่จำเป็นต้องสมัครเป็นผู้เชี่ยวชาญ</p>
                  <Link
                    to="/admin-dashboard"
                    className="inline-block mt-4 px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition-colors"
                  >
                    🔧 ไปที่หน้าแอดมิน
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">ยกระดับบัญชีเป็น "ผู้เชี่ยวชาญ"</h2>
                    <p className="text-sm text-gray-500 mt-2">
                      กรุณากรอกข้อมูลและแนบเอกสารเพื่อรับตราสัญลักษณ์ <span className="font-bold text-gray-700">ผู้เชี่ยวชาญ 🩺</span><br />
                      (ข้อมูลทั้งหมดจะถูกเก็บเป็นความลับและประมวลผลโดยแอดมินเท่านั้น)
                    </p>
                  </div>

                  <form onSubmit={handleVerifySubmit} className="max-w-xl mx-auto space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">ประเภทวิชาชีพ <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:bg-white transition-colors"
                      >
                        <option value="" disabled>เลือกประเภทวิชาชีพของคุณ</option>
                        <option value="psychiatrist">จิตแพทย์</option>
                        <option value="clinical_psychologist">นักจิตวิทยาคลินิก</option>
                        <option value="counseling_psychologist">นักจิตวิทยาการปรึกษา</option>
                        <option value="social_worker">นักสังคมสงเคราะห์จิตเวช</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">เลขที่ใบประกอบวิชาชีพ / ใบอนุญาต <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="เช่น ว.12345 หรือ ศส.9876"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">🏷️ สาขาที่เชี่ยวชาญ (เลือกได้หลายข้อ)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SPECIALTY_OPTIONS.map((opt) => (
                          <label
                            key={opt.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                              selectedSpecialties.includes(opt.key)
                                ? 'bg-teal-50 border-teal-300 text-teal-800'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSpecialties.includes(opt.key)}
                              onChange={() => toggleSpecialty(opt.key)}
                              className="w-4 h-4 text-teal-500 rounded focus:ring-teal-400"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">🏛️ สังกัด (ถ้ามี)</label>
                      <input
                        type="text"
                        value={affiliation}
                        onChange={(e) => setAffiliation(e.target.value)}
                        placeholder="เช่น สมาคมจิตวิทยาแห่งประเทศไทย"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">🕐 ช่วงเวลาที่พร้อมรับฟัง (ถ้ามี)</label>
                      <input
                        type="text"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder="เช่น 10:00-18:00 น."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">รูปถ่ายใบประกอบวิชาชีพ <span className="text-red-500">*</span></label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {licenseFile ? (
                          <>
                            <div className="text-3xl mb-2">✅</div>
                            <p className="text-sm text-gray-700 font-medium">{licenseFile.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{(licenseFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <div className="text-3xl mb-2">📎</div>
                            <p className="text-sm text-gray-600 font-medium">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
                            <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG, PDF ขนาดไม่เกิน 5MB</p>
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
                        className="mt-1 w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-xs text-gray-500 leading-relaxed">
                        ข้าพเจ้ายินยอมให้เว็บไซต์บ้านพักใจเก็บรวบรวมและประมวลผลข้อมูลส่วนบุคคลและเอกสารที่แนบมานี้ เพื่อวัตถุประสงค์ในการตรวจสอบและยืนยันตัวตนเท่านั้น (ข้อมูลไฟล์จะถูกลบออกจากระบบหลังการอนุมัติเสร็จสิ้น)
                      </span>
                    </label>

                    {submitError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        ❌ {submitError}
                      </div>
                    )}
                    {submitSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                        ✅ {submitSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!consent || isSubmitting}
                      className="w-full py-3.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors shadow-sm mt-4 flex items-center justify-center gap-2"
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
