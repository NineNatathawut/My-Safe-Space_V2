import api from '../api/axios';
import type {
  Assessment,
  AssessmentQuestion,
  InterpretationRule,
  ImportedAssessmentPayload,
} from '../types/assessment';

// 1. สร้างแบบประเมินแบบเต็ม (transaction safety)
export const createFullAssessment = async (data: {
  title: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  estimated_time_mins?: number;
  version?: number;
  type: 'INTERNAL' | 'EXTERNAL' | 'API';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  scoring_method?: 'TOTAL_SCORE' | 'AVERAGE_SCORE' | 'WEIGHTED_SCORE';
  external_url?: string;
  open_in_new_tab?: boolean;
  questions?: Omit<AssessmentQuestion, 'assessment_id'>[];
  interpretation_rules?: Omit<InterpretationRule, 'assessment_id'>[];
}): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const res = await api.post('/api/assessments', data);
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'ไม่สามารถสร้างแบบประเมินได้',
    };
  }
};

// 2. ดึงแบบประเมินที่ PUBLISHED ทั้งหมด (สำหรับหน้าทำแบบประเมิน)
export const getActiveAssessments = async (): Promise<Assessment[]> => {
  try {
    const res = await api.get('/api/assessments/active');
    if (res.data.success) return res.data.assessments || [];
    return [];
  } catch {
    return [];
  }
};

// 2.1 ดึงแบบประเมินที่ PUBLISHED ล่าสุดเพียง 1 ตัว (สำหรับ widget หน้าโปรไฟล์)
export const getActiveAssessment = async (): Promise<Assessment | null> => {
  const list = await getActiveAssessments();
  return list[0] || null;
};

// 3. ดึงแบบประเมินตาม ID (พร้อม questions + choices + rules)
export const getAssessmentById = async (id: string): Promise<Assessment | null> => {
  try {
    const res = await api.get(`/api/assessments/${id}`);
    if (res.data.success) return res.data.assessment;
    return null;
  } catch {
    return null;
  }
};

// 4. ดึงแบบประเมินทั้งหมด (Admin Dashboard)
export const fetchAllAssessments = async (): Promise<Assessment[]> => {
  try {
    const res = await api.get('/api/assessments');
    if (res.data.success) return res.data.assessments;
    return [];
  } catch {
    return [];
  }
};

// 5. อัปเดตสถานะ (DRAFT / PUBLISHED / ARCHIVED)
export const updateAssessmentStatus = async (
  id: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
): Promise<boolean> => {
  try {
    const res = await api.patch(`/api/assessments/${id}/status`, { status });
    return res.data.success;
  } catch {
    return false;
  }
};

// 6. ลบแบบประเมิน (CASCADE ใน DB จัดการ questions, choices, rules)
export const deleteAssessment = async (id: string): Promise<boolean> => {
  try {
    const res = await api.delete(`/api/assessments/${id}`);
    return res.data.success;
  } catch {
    return false;
  }
};

// 7. อัปเดตข้อมูลทั่วไปของแบบประเมิน
export const updateAssessment = async (
  id: string,
  data: Partial<Assessment>
): Promise<boolean> => {
  try {
    const res = await api.put(`/api/assessments/${id}`, data);
    return res.data.success;
  } catch {
    return false;
  }
};

// 8. อัปเดต Toggle is_active_pre / is_active_post
export const updateAssessmentToggles = async (
  id: string,
  toggles: { is_active_pre?: boolean; is_active_post?: boolean }
): Promise<boolean> => {
  try {
    const res = await api.patch(`/api/assessments/${id}/toggles`, toggles);
    return res.data.success;
  } catch {
    return false;
  }
};

// 9. แปลงไฟล์ import (JSON) เป็น payload
export const parseImportFile = async (file: File): Promise<{ payload: ImportedAssessmentPayload | null; error?: string }> => {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed.title || !parsed.questions || !Array.isArray(parsed.questions)) {
      return { payload: null, error: 'รูปแบบไฟล์ไม่ถูกต้อง — ต้องมี title และ questions' };
    }

    const payload: ImportedAssessmentPayload = {
      title: parsed.title,
      description: parsed.description,
      category: parsed.category || 'General Mental Health',
      type: parsed.type || 'INTERNAL',
      status: parsed.status || 'DRAFT',
      scoring_method: parsed.scoring_method || 'TOTAL_SCORE',
      questions: parsed.questions,
      interpretation_rules: parsed.interpretation_rules,
    };

    return { payload };
  } catch (err: any) {
    return { payload: null, error: err.message || 'ไม่สามารถอ่านไฟล์ได้' };
  }
};

// 10. นำเข้าข้อมูล assessment จาก payload เข้าสู่ฐานข้อมูล
export const importAssessmentToDatabase = async (
  payload: ImportedAssessmentPayload
): Promise<{ success: boolean; id?: string; error?: string }> => {
  const result = await createFullAssessment(payload);
  return result;
};
