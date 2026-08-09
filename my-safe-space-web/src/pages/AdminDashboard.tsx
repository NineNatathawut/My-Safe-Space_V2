import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminAssessmentManager } from '../components/AdminAssessmentManager';
import { Icon } from '../components/Icon';
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
    <div className="min-h-screen bg-white py-10 font-sans">
      <div className="max-w-5xl mx-auto px-4 space-y-8">

        {/* Header */}
        <section className="card p-6 md:flex-row md:items-center justify-between gap-4 flex flex-col">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-ink flex items-center gap-2">
                <Icon name="settings" size={24} className="text-owl" /> ศูนย์ควบคุมแอดมิน (Admin Portal)
              </h1>
              <Link to="/" className="px-3 py-1.5 bg-owl-soft hover:bg-owl-mint rounded-xl text-xs font-bold text-owl-pressed transition-colors whitespace-nowrap">
                ← กลับหน้าหลัก
              </Link>
            </div>
            <p className="text-body-muted text-sm mt-1">จัดการแบบประเมิน, คำขอยืนยันตัวตน และรูปโปรไฟล์ผู้เชี่ยวชาญ</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-owl-soft p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'verification' ? 'bg-white text-ink shadow-lip-sm' : 'text-body-muted hover:text-body-strong'}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="stethoscope" size={16} className={activeTab === 'verification' ? 'text-owl' : 'text-body-soft'} />
                ยืนยันตัวตน
              </span>
            </button>
            <button
              onClick={() => setActiveTab('avatars')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'avatars' ? 'bg-white text-ink shadow-lip-sm' : 'text-body-muted hover:text-body-strong'}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="image" size={16} className={activeTab === 'avatars' ? 'text-owl' : 'text-body-soft'} />
                รูปโปรไฟล์
              </span>
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'assessment' ? 'bg-white text-ink shadow-lip-sm' : 'text-body-muted hover:text-body-strong'}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="chart" size={16} className={activeTab === 'assessment' ? 'text-owl' : 'text-body-soft'} />
                จัดการแบบประเมิน
              </span>
            </button>
          </div>
        </section>

        {/* Verification tab */}
        {activeTab === 'verification' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-ink">
                    <Icon name="stethoscope" size={20} className="text-owl" />
                    จัดการคำขอยืนยันตัวตน
                  </h2>
                  <p className="text-sm text-body-muted mt-1">ตรวจสอบเอกสารใบประกอบวิชาชีพของผู้เชี่ยวชาญ</p>
                </div>
                <button onClick={fetchVerifications} className="px-4 py-2 bg-owl-soft hover:bg-owl-mint rounded-xl text-sm font-bold text-owl-pressed transition-colors">
                  🔄 รีเฟรช
                </button>
              </div>

              {loadingVerifications ? (
                <div className="text-center py-12 text-body-soft animate-pulse">กำลังโหลด...</div>
              ) : verifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <Icon name="mail" size={40} className="text-body-soft" />
                  </div>
                  <p className="text-body-muted">ยังไม่มีคำขอยืนยันตัวตน</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map((v) => (
                    <div key={v.id} className={`border rounded-2xl p-5 transition-colors ${
                      v.status === 'pending' ? 'border-bee/40 bg-bee/10' :
                      v.status === 'approved' ? 'border-macaw/40 bg-macaw/10' :
                      v.status === 'revoked' ? 'border-fox/40 bg-fox/10' :
                      'border-cardinal/30 bg-cardinal/10'
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-ink">{PROFESSION_LABELS[v.profession_type] || v.profession_type}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              v.status === 'pending' ? 'bg-bee/15 text-fox' :
                              v.status === 'approved' ? 'bg-macaw/10 text-macaw' :
                              v.status === 'revoked' ? 'bg-fox/10 text-fox' :
                              'bg-cardinal/10 text-cardinal'
                            }`}>
                              {v.status === 'pending' ? 'รอตรวจสอบ' :
                               v.status === 'approved' ? 'อนุมัติแล้ว' :
                               v.status === 'revoked' ? 'เพิกถอนแล้ว' : 'ปฏิเสธ'}
                            </span>
                          </div>
                          <p className="text-sm text-body-strong">
                            <span className="font-bold">เลขใบอนุญาต:</span> {v.license_number}
                          </p>
                          {v.affiliation && (
                            <p className="text-sm text-body-strong">
                              <span className="font-bold">🏛️ สังกัด:</span> {v.affiliation}
                            </p>
                          )}
                          {v.availability && (
                            <p className="text-sm text-body-strong">
                              <span className="font-bold">🕐 ช่วงเวลา:</span> {v.availability}
                            </p>
                          )}
                          {v.specialties && v.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {v.specialties.map((s, i) => (
                                <span key={i} className="inline-block px-2 py-0.5 bg-owl-soft text-body-strong text-xs rounded-full border border-owl-mint">
                                  {SPECIALTY_LABELS[s] || s}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-body-soft">
                            ส่งเมื่อ {new Date(v.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {v.rejection_reason && (
                            <p className="text-sm flex items-start gap-1.5 text-cardinal bg-cardinal/10 px-3 py-2 rounded-lg">
                              <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                              เหตุผล: {v.rejection_reason}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {v.signed_document_url && (
                            <a
                              href={v.signed_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 flex items-center gap-1.5 bg-macaw/10 text-macaw hover:bg-macaw/20 rounded-xl text-sm font-bold transition-colors text-center"
                            >
                              <Icon name="paperclip" size={16} />
                              ดูเอกสาร
                            </a>
                          )}

                          {v.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(v.id)}
                                className="px-4 py-2 flex items-center gap-1.5 bg-macaw hover:bg-macaw text-white rounded-xl text-sm font-bold transition-colors"
                              >
                                <Icon name="check" size={16} />
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => setRejectModal({ id: v.id, open: true })}
                                className="px-4 py-2 flex items-center gap-1.5 bg-cardinal text-white rounded-xl text-sm font-bold transition-colors"
                              >
                                <Icon name="x" size={16} />
                                ปฏิเสธ
                              </button>
                            </div>
                          )}

                          {v.status === 'approved' && (
                            <button
                              onClick={() => setRevokeModal({ id: v.id, open: true })}
                              className="px-4 py-2 flex items-center gap-1.5 bg-fox text-white rounded-xl text-sm font-bold transition-colors"
                            >
                              <Icon name="shield" size={16} />
                              ถอนยศ
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
                <div className="card p-6 max-w-md w-full mx-4 space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-black text-ink">
                    <Icon name="x" size={18} className="text-cardinal" />
                    ปฏิเสธคำขอ
                  </h3>
                  <p className="text-sm text-body-muted">กรุณาระบุเหตุผลที่ปฏิเสธคำขอยืนยันตัวตนนี้</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="ระบุเหตุผล..."
                    className="w-full px-4 py-3 border-2 border-hairline rounded-xl outline-none focus:border-cardinal resize-none"
                    rows={3}
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => { setRejectModal({ id: '', open: false }); setRejectReason(''); }}
                      className="px-5 py-2.5 bg-owl-soft hover:bg-owl-mint text-owl-pressed rounded-xl text-sm font-bold transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-5 py-2.5 bg-cardinal text-white rounded-xl text-sm font-bold transition-colors"
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
                <div className="card p-6 max-w-md w-full mx-4 space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-black text-ink">
                    <Icon name="shield" size={18} className="text-fox" />
                    ถอนยศผู้เชี่ยวชาญ
                  </h3>
                  <p className="text-sm text-body-muted">
                    คุณแน่ใจหรือไม่ที่จะถอนยศผู้เชี่ยวชาญของท่านนี้?<br />
                    ผู้ใช้จะกลับสู่สถานะผู้ใช้ทั่วไป และตรา 🩺 จะหายไปจากโพสต์และคอมเมนต์ที่สร้างใหม่
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setRevokeModal({ id: '', open: false })}
                      className="px-5 py-2.5 bg-owl-soft hover:bg-owl-mint text-owl-pressed rounded-xl text-sm font-bold transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleRevoke}
                      className="px-5 py-2.5 bg-fox text-white rounded-xl text-sm font-bold transition-colors"
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
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-ink">
                    <Icon name="image" size={20} className="text-owl" />
                    ตรวจสอบรูปโปรไฟล์ผู้เชี่ยวชาญ
                  </h2>
                  <p className="text-sm text-body-muted mt-1">อนุมัติหรือปฏิเสธรูปโปรไฟล์ที่ผู้เชี่ยวชาญอัปโหลด</p>
                </div>
                <button onClick={fetchPendingAvatars} className="px-4 py-2 bg-owl-soft hover:bg-owl-mint rounded-xl text-sm font-bold text-owl-pressed transition-colors">
                  🔄 รีเฟรช
                </button>
              </div>

              {loadingAvatars ? (
                <div className="text-center py-12 text-body-soft animate-pulse">กำลังโหลด...</div>
              ) : pendingAvatars.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <Icon name="check" size={40} className="text-macaw" />
                  </div>
                  <p className="text-body-muted">ไม่มีรูปโปรไฟล์ที่รอตรวจสอบ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingAvatars.map((a) => (
                    <div key={a.id} className="border border-bee/40 bg-bee/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-owl-soft border border-owl-mint rounded-full flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span>?</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">User ID: {a.user_id.substring(0, 8)}...</p>
                          <p className="text-xs text-body-soft">
                            {new Date(a.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {a.avatar_url && (
                        <a
                          href={a.avatar_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full aspect-video bg-owl-soft rounded-xl overflow-hidden"
                        >
                          <img src={a.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                        </a>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveAvatar(a.user_id)}
                          className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-macaw text-white rounded-xl text-sm font-bold transition-colors"
                        >
                          <Icon name="check" size={16} />
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleRejectAvatar(a.user_id)}
                          className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-cardinal text-white rounded-xl text-sm font-bold transition-colors"
                        >
                          <Icon name="x" size={16} />
                          ปฏิเสธ
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