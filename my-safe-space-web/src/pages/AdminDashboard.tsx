import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminAssessmentManager } from '../components/AdminAssessmentManager';
import api from '../api/axios';

interface Verification {
  id: string;
  user_id: string;
  profession_type: string;
  license_number: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  signed_document_url: string | null;
  specialties?: string[];
  affiliation?: string;
  availability?: string;
}

interface PendingAvatar {
  id: string;
  user_id: string;
  avatar_type: string;
  avatar_value: string;
  is_approved: boolean;
  created_at: string;
  avatar_url: string | null;
}

const PROFESSION_LABELS: Record<string, string> = {
  psychiatrist: 'จิตแพทย์',
  clinical_psychologist: 'นักจิตวิทยาคลินิก',
  counseling_psychologist: 'นักจิตวิทยาการปรึกษา',
  social_worker: 'นักสังคมสงเคราะห์จิตเวช',
};

const SPECIALTY_LABELS: Record<string, string> = {
  stress: '🧠 จัดการความเครียด / ภาวะซึมเศร้า',
  relationship: '💔 เยียวยาความสัมพันธ์',
  burnout: '🔥 ภาวะหมดไฟในการทำงาน',
  family: '🏠 ปัญหาครอบครัวและคนใกล้ชิด',
  self_esteem: '✨ การเห็นคุณค่าในตัวเอง (Self-Esteem)',
  anxiety: '🌀 ความวิตกกังวล / อาการแพนิค',
  grief: '🕊️ การสูญเสียและความเศร้าโศก',
  lgbtq: '🌈 ความหลากหลายทางเพศ (LGBTQ+)',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'assessment' | 'verification' | 'avatars'>('verification');

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [rejectReason, setRejectReason] = useState('');
  const [revokeModal, setRevokeModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });

  const [pendingAvatars, setPendingAvatars] = useState<PendingAvatar[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  useEffect(() => {
    if (activeTab === 'verification') {
      fetchVerifications();
    } else if (activeTab === 'avatars') {
      fetchPendingAvatars();
    }
  }, [activeTab]);

  const fetchVerifications = async () => {
    setLoadingVerifications(true);
    try {
      const res = await api.get('/api/admin/verifications');
      if (res.data.success) {
        setVerifications(res.data.verifications);
      }
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const fetchPendingAvatars = async () => {
    setLoadingAvatars(true);
    try {
      const res = await api.get('/api/admin/avatars/pending');
      if (res.data.success) {
        setPendingAvatars(res.data.avatars);
      }
    } catch (err) {
      console.error('Failed to fetch pending avatars:', err);
    } finally {
      setLoadingAvatars(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await api.patch(`/api/admin/verifications/${id}`, { status: 'approved' });
      if (res.data.success) {
        setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' } : v));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }
    try {
      const res = await api.patch(`/api/admin/verifications/${rejectModal.id}`, {
        status: 'rejected',
        rejection_reason: rejectReason,
      });
      if (res.data.success) {
        setVerifications(prev => prev.map(v => v.id === rejectModal.id ? { ...v, status: 'rejected', rejection_reason: rejectReason } : v));
        setRejectModal({ id: '', open: false });
        setRejectReason('');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleRevoke = async () => {
    try {
      const res = await api.patch(`/api/admin/verifications/${revokeModal.id}`, { status: 'revoked' });
      if (res.data.success) {
        setVerifications(prev => prev.map(v => v.id === revokeModal.id ? { ...v, status: 'revoked' } : v));
        setRevokeModal({ id: '', open: false });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleApproveAvatar = async (userId: string) => {
    try {
      await api.patch(`/api/admin/avatars/${userId}/approve`, { approved: true });
      setPendingAvatars(prev => prev.filter(a => a.user_id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleRejectAvatar = async (userId: string) => {
    try {
      await api.patch(`/api/admin/avatars/${userId}/approve`, { approved: false });
      setPendingAvatars(prev => prev.filter(a => a.user_id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-5xl mx-auto px-4 space-y-8">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span>⚙️</span> ศูนย์ควบคุมแอดมิน (Admin Portal)
              </h1>
              <Link to="/" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors whitespace-nowrap">
                ← กลับหน้าหลัก
              </Link>
            </div>
            <p className="text-slate-500 text-sm mt-1">จัดการแบบประเมิน, คำขอยืนยันตัวตน และรูปโปรไฟล์ผู้เชี่ยวชาญ</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'verification' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🩺 ยืนยันตัวตน
            </button>
            <button
              onClick={() => setActiveTab('avatars')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'avatars' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🖼️ รูปโปรไฟล์
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'assessment' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📊 จัดการแบบประเมิน
            </button>
          </div>
        </section>

        {/* Verification tab */}
        {activeTab === 'verification' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">🩺 จัดการคำขอยืนยันตัวตน</h2>
                  <p className="text-sm text-slate-500 mt-1">ตรวจสอบเอกสารใบประกอบวิชาชีพของผู้เชี่ยวชาญ</p>
                </div>
                <button onClick={fetchVerifications} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors">
                  🔄 รีเฟรช
                </button>
              </div>

              {loadingVerifications ? (
                <div className="text-center py-12 text-slate-400 animate-pulse">กำลังโหลด...</div>
              ) : verifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-slate-500">ยังไม่มีคำขอยืนยันตัวตน</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map((v) => (
                    <div key={v.id} className={`border rounded-2xl p-5 transition-colors ${
                      v.status === 'pending' ? 'border-yellow-200 bg-yellow-50/30' :
                      v.status === 'approved' ? 'border-green-200 bg-green-50/30' :
                      v.status === 'revoked' ? 'border-orange-200 bg-orange-50/30' :
                      'border-red-200 bg-red-50/30'
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800">{PROFESSION_LABELS[v.profession_type] || v.profession_type}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              v.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              v.status === 'approved' ? 'bg-green-100 text-green-700' :
                              v.status === 'revoked' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {v.status === 'pending' ? 'รอตรวจสอบ' :
                               v.status === 'approved' ? 'อนุมัติแล้ว' :
                               v.status === 'revoked' ? 'เพิกถอนแล้ว' : 'ปฏิเสธ'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">เลขใบอนุญาต:</span> {v.license_number}
                          </p>
                          {v.affiliation && (
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">🏛️ สังกัด:</span> {v.affiliation}
                            </p>
                          )}
                          {v.availability && (
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">🕐 ช่วงเวลา:</span> {v.availability}
                            </p>
                          )}
                          {v.specialties && v.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {v.specialties.map((s, i) => (
                                <span key={i} className="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-100">
                                  {SPECIALTY_LABELS[s] || s}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-400">
                            ส่งเมื่อ {new Date(v.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {v.rejection_reason && (
                            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                              ❌ เหตุผล: {v.rejection_reason}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {v.signed_document_url && (
                            <a
                              href={v.signed_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-xl text-sm font-bold transition-colors text-center"
                            >
                              📄 ดูเอกสาร
                            </a>
                          )}

                          {v.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(v.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors"
                              >
                                ✅ อนุมัติ
                              </button>
                              <button
                                onClick={() => setRejectModal({ id: v.id, open: true })}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
                              >
                                ❌ ปฏิเสธ
                              </button>
                            </div>
                          )}

                          {v.status === 'approved' && (
                            <button
                              onClick={() => setRevokeModal({ id: v.id, open: true })}
                              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
                            >
                              🚫 ถอนยศ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reject modal */}
            {rejectModal.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">❌ ปฏิเสธคำขอ</h3>
                  <p className="text-sm text-slate-500">กรุณาระบุเหตุผลที่ปฏิเสธคำขอยืนยันตัวตนนี้</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="ระบุเหตุผล..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => { setRejectModal({ id: '', open: false }); setRejectReason(''); }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      ยืนยันการปฏิเสธ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Revoke modal */}
            {revokeModal.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">🚫 ถอนยศผู้เชี่ยวชาญ</h3>
                  <p className="text-sm text-slate-500">
                    คุณแน่ใจหรือไม่ที่จะถอนยศผู้เชี่ยวชาญของท่านนี้?<br />
                    ผู้ใช้จะกลับสู่สถานะผู้ใช้ทั่วไป และตรา 🩺 จะหายไปจากโพสต์และคอมเมนต์ที่สร้างใหม่
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setRevokeModal({ id: '', open: false })}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleRevoke}
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      ยืนยัน ถอนยศ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Avatar approval tab */}
        {activeTab === 'avatars' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">🖼️ ตรวจสอบรูปโปรไฟล์ผู้เชี่ยวชาญ</h2>
                  <p className="text-sm text-slate-500 mt-1">อนุมัติหรือปฏิเสธรูปโปรไฟล์ที่ผู้เชี่ยวชาญอัปโหลด</p>
                </div>
                <button onClick={fetchPendingAvatars} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors">
                  🔄 รีเฟรช
                </button>
              </div>

              {loadingAvatars ? (
                <div className="text-center py-12 text-slate-400 animate-pulse">กำลังโหลด...</div>
              ) : pendingAvatars.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-slate-500">ไม่มีรูปโปรไฟล์ที่รอตรวจสอบ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingAvatars.map((a) => (
                    <div key={a.id} className="border border-yellow-200 bg-yellow-50/30 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-tr from-fuchsia-200 to-purple-200 rounded-full flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span>?</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">User ID: {a.user_id.substring(0, 8)}...</p>
                          <p className="text-xs text-slate-400">
                            {new Date(a.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {a.avatar_url && (
                        <a
                          href={a.avatar_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full aspect-video bg-slate-100 rounded-xl overflow-hidden"
                        >
                          <img src={a.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                        </a>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveAvatar(a.user_id)}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors"
                        >
                          ✅ อนุมัติ
                        </button>
                        <button
                          onClick={() => handleRejectAvatar(a.user_id)}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
                        >
                          ❌ ปฏิเสธ
                        </button>
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
          <div className="animate-fadeIn">
            <AdminAssessmentManager />
          </div>
        )}

      </div>
    </div>
  );
}
