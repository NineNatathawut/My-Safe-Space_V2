import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllAssessments,
  updateAssessmentToggles,
  updateAssessmentStatus,
  deleteAssessment,
  parseImportFile,
  importAssessmentToDatabase,
} from '../services/assessmentService';
import type { Assessment, ImportedAssessmentPayload } from '../types/assessment';
import { Icon } from './Icon';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-bee/15 text-fox',
  PUBLISHED: 'bg-macaw/10 text-macaw',
  ARCHIVED: 'bg-hairline text-body-muted',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'ร่าง',
  PUBLISHED: 'เผยแพร่',
  ARCHIVED: 'เก็บถาวร',
};

export const AdminAssessmentManager: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับ Toggle
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [savingToggle, setSavingToggle] = useState(false);

  // State สำหรับ Import
  const [importedData, setImportedData] = useState<ImportedAssessmentPayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savingImport, setSavingImport] = useState(false);

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllAssessments();
      setAssessments(data);
      setActiveAssessment(data.find((a) => a.status === 'PUBLISHED') || data[0] || null);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลแบบประเมินได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  // ── Toggle Pre / Post ──
  const handleToggle = async (field: 'pre' | 'post', currentValue?: boolean) => {
    if (!activeAssessment) return;
    setSavingToggle(true);

    const nextPre = field === 'pre' ? !currentValue : activeAssessment.is_active_pre;
    const nextPost = field === 'post' ? !currentValue : activeAssessment.is_active_post;

    const prev = activeAssessment;
    setActiveAssessment({ ...activeAssessment, is_active_pre: nextPre, is_active_post: nextPost });

    const success = await updateAssessmentToggles(activeAssessment.id, {
      is_active_pre: nextPre,
      is_active_post: nextPost,
    });

    if (!success) {
      setActiveAssessment(prev);
      alert('ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง');
    }
    setSavingToggle(false);
  };

  // ── เปลี่ยนสถานะ ──
  const handleStatusChange = async (assessment: Assessment) => {
    const nextStatus: Record<string, 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'> = {
      DRAFT: 'PUBLISHED',
      PUBLISHED: 'ARCHIVED',
      ARCHIVED: 'DRAFT',
    };
    const newStatus = nextStatus[assessment.status];
    const success = await updateAssessmentStatus(assessment.id, newStatus);
    if (success) {
      setAssessments((prev) =>
        prev.map((a) => (a.id === assessment.id ? { ...a, status: newStatus } : a))
      );
    } else {
      alert('ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // ── ลบ ──
const handleDelete = async (assessment: Assessment) => {
    if (!confirm(`คุณต้องการลบแบบประเมิน "${assessment.title}" ใช่หรือไม่?`)) {
      return;
    }

    const success = await deleteAssessment(assessment.id);
    if (success) {
      setAssessments((prev) => prev.filter((a) => a.id !== assessment.id));
      if (activeAssessment?.id === assessment.id) {
        setActiveAssessment(null);
      }
    } else {
      alert('ไม่สามารถลบแบบประเมินได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // ── Import ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setStatusMessage(null);
    try {
      const result = await parseImportFile(file);
      if (result.error) {
        setImportError(result.error);
        setImportedData(null);
        return;
      }
      setImportedData(result.payload);
    } catch (err: any) {
      setImportError(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
      setImportedData(null);
    }
  };

  const handleSaveImport = async () => {
    if (!importedData) return;
    setSavingImport(true);
    setStatusMessage(null);
    const result = await importAssessmentToDatabase(importedData);
    setSavingImport(false);
    if (result.success) {
      setStatusMessage('🎉 นำเข้าชุดแบบประเมินใหม่เรียบร้อยแล้ว!');
      setImportedData(null);
      loadAssessments();
    } else {
      setImportError(result.error || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-body-soft">
        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-ink">
            <Icon name="chart" size={20} className="text-owl" />
            จัดการแบบประเมิน
          </h2>
          <p className="text-sm text-body-muted mt-0.5">รายการแบบประเมินทั้งหมดในระบบ</p>
        </div>
        <button
          onClick={() => navigate('/admin/assessments/create')}
          className="btn-primary text-sm"
        >
          สร้างแบบประเมินใหม่
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-cardinal/10 text-cardinal text-sm rounded-xl border border-cardinal/30">
          <Icon name="alert" size={18} className="inline mr-1" />
          {error}
          <button onClick={loadAssessments} className="ml-3 underline font-medium">ลองอีกครั้ง</button>
        </div>
      )}

      {/* ── Assessments Table ── */}
      {assessments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="flex justify-center mb-4">
            <Icon name="book" size={36} className="text-body-soft" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">ยังไม่มีแบบประเมิน</h3>
          <p className="text-sm text-body-soft mb-6">กดปุ่ม "สร้างแบบประเมินใหม่" เพื่อเริ่มต้น</p>
          <button
            onClick={() => navigate('/admin/assessments/create')}
            className="btn-primary text-sm"
          >
            สร้างแบบประเมินใหม่
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-owl-soft/80">
                  <th className="text-left py-3.5 px-4 text-body-muted font-semibold">ชื่อแบบประเมิน</th>
                  <th className="text-left py-3.5 px-4 text-body-muted font-semibold">Code</th>
                  <th className="text-left py-3.5 px-4 text-body-muted font-semibold">ประเภท</th>
                  <th className="text-left py-3.5 px-4 text-body-muted font-semibold">สถานะ</th>
                  <th className="text-center py-3.5 px-4 text-body-muted font-semibold">ข้อสอบ</th>
                  <th className="text-right py-3.5 px-4 text-body-muted font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="border-b border-hairline hover:bg-owl-soft/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-ink">{a.title}</div>
                      {a.description && (
                        <div className="text-xs text-body-soft truncate max-w-[200px]">{a.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {a.code ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-owl-soft text-owl-pressed">
                          <Icon name="sparkles" size={12} /> {a.code}
                        </span>
                      ) : (
                        <span className="text-xs text-body-soft">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
                        a.type === 'INTERNAL' ? 'bg-macaw/10 text-macaw' : 'bg-bee/10 text-fox'
                      }`}>
                        {a.type === 'INTERNAL' ? 'Internal' : 'External'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${STATUS_COLORS[a.status] || ''}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-body-muted">
                      {a.type === 'EXTERNAL' ? (
                        <span className="text-xs text-body-soft">N/A</span>
                      ) : (
                        <span>{a.questions?.length ?? '-'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => alert('ระบบแก้ไขแบบประเมินกำลังจะมาเร็ว ๆ นี้')}
                          className="p-1.5 text-body-soft hover:text-macaw hover:bg-macaw/10 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleStatusChange(a)}
                          className="p-1.5 text-body-soft hover:text-macaw hover:bg-macaw/10 rounded-lg transition-colors"
                          title="เปลี่ยนสถานะ"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="p-1.5 text-body-soft hover:text-cardinal hover:bg-cardinal/10 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Collapsible: Toggle + Import ── */}
      <details className="card group">
        <summary className="flex items-center justify-between p-5 cursor-pointer select-none list-none">
          <div className="flex items-center gap-2">
            <Icon name="settings" size={20} className="text-owl" />
            <span className="font-bold text-ink">ตั้งค่าเพิ่มเติม</span>
            <span className="text-xs text-body-soft">(Pre/Post Toggle & นำเข้าไฟล์)</span>
          </div>
          <svg className="w-5 h-5 text-body-soft transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>

        <div className="px-5 pb-5 space-y-6 border-t border-hairline pt-5">
          {/* Toggle Section */}
          {activeAssessment ? (
            <div className="bg-owl-soft rounded-xl p-5 border border-owl-mint">
              <h3 className="font-bold text-ink mb-1">
                ชุดแบบประเมินปัจจุบัน: <span className="text-macaw">{activeAssessment.title}</span>
              </h3>
              <p className="text-sm text-body-muted mb-4">เปิด/ปิด การแสดงแบบประเมินก่อนและหลังใช้งาน</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-card border border-hairline">
                  <div>
                    <span className="font-bold text-ink block">Pre-Assessment</span>
                    <span className="text-sm text-body-muted">แบบประเมินก่อนเริ่มใช้งาน</span>
                  </div>
                  <button
                    onClick={() => handleToggle('pre', activeAssessment.is_active_pre)}
                    disabled={savingToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      activeAssessment.is_active_pre ? 'bg-macaw' : 'bg-hairline'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        activeAssessment.is_active_pre ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-card border border-hairline">
                  <div>
                    <span className="font-bold text-ink block">Post-Assessment</span>
                    <span className="text-sm text-body-muted">แบบประเมินหลังใช้งาน</span>
                  </div>
                  <button
                    onClick={() => handleToggle('post', activeAssessment.is_active_post)}
                    disabled={savingToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      activeAssessment.is_active_post ? 'bg-macaw' : 'bg-hairline'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        activeAssessment.is_active_post ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-body-soft text-sm bg-owl-soft rounded-xl border border-owl-mint">
              ไม่มีแบบประเมินที่เผยแพร่แล้วสำหรับตั้งค่า Pre/Post Toggle
            </div>
          )}

          {/* Import Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <Icon name="paperclip" size={18} className="text-owl" />
              นำเข้าชุดแบบประเมินใหม่ (JSON / Excel)
            </h3>
            <div className="border-2 border-dashed border-hairline rounded-xl p-6 text-center hover:border-owl-mint transition-colors bg-owl-soft/40">
              <input
                type="file"
                accept=".json, .xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <span className="flex justify-center mb-2">
                  <Icon name="paperclip" size={28} className="text-owl" />
                </span>
                <span className="text-sm font-bold text-macaw">คลิกเพื่อเลือกไฟล์ .json หรือ .xlsx</span>
                <span className="text-xs text-body-soft mt-1">รองรับโครงสร้างแบบประเมินมาตรฐาน</span>
              </label>
            </div>

            {importError && (
              <div className="p-3 flex items-center gap-2 bg-cardinal/10 text-cardinal text-sm rounded-lg border border-cardinal/30">
                <Icon name="alert" size={18} />
                {importError}
              </div>
            )}
            {statusMessage && (
              <div className="p-3 flex items-center gap-2 bg-macaw/10 text-macaw text-sm rounded-lg border border-macaw/30">{statusMessage}</div>
            )}

            {importedData && (
              <div className="bg-beetle/10 p-4 rounded-xl border border-beetle/20 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="flex items-center gap-1.5 font-bold text-ink-deep">
                    <Icon name="search" size={16} />
                    ตัวอย่างข้อมูลที่อ่านได้:
                  </h4>
                  <span className="text-xs font-bold bg-beetle/10 text-beetle px-2 py-1 rounded">
                    {importedData.questions.length} ข้อคำถาม
                  </span>
                </div>
                <p className="text-sm text-body-strong"><strong>ชื่อ:</strong> {importedData.title}</p>
                <p className="text-sm text-body-muted"><strong>คำอธิบาย:</strong> {importedData.description || '-'}</p>
                <div className="pt-2 space-y-1">
                  <label className="block text-xs font-bold text-ink">แนบลิงก์เพิ่มเติม (ถ้ามี):</label>
                  <input
                    type="url"
                    placeholder="https://example.com/more-info"
                    value={(importedData as any).link_url || ''}
                    onChange={(e) => setImportedData({ ...importedData, link_url: e.target.value } as any)}
                    className="input text-sm"
                  />
                </div>
                <button
                  onClick={handleSaveImport}
                  disabled={savingImport}
                  className="btn-primary w-full mt-2"
                >
                  {savingImport ? 'กำลังนำเข้าข้อมูล...' : 'ยืนยันการบันทึกชุดแบบประเมินนี้'}
                </button>
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
};