import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFullAssessment } from '../services/assessmentService';
import { Icon } from '../components/Icon';

interface StepDef {
  display: number;
  step: number;
  label: string;
}

const INTERNAL_STEPS: StepDef[] = [
  { display: 1, step: 1, label: 'Information' },
  { display: 2, step: 2, label: 'Type' },
  { display: 3, step: 3, label: 'Questions' },
  { display: 4, step: 4, label: 'Rules' },
  { display: 5, step: 5, label: 'Review' },
];

const EXTERNAL_STEPS: StepDef[] = [
  { display: 1, step: 1, label: 'Information' },
  { display: 2, step: 2, label: 'Type & Link' },
  { display: 3, step: 5, label: 'Review' },
];

const COLOR_CODES = [
  { value: 'green', label: 'Green' },
  { value: 'teal', label: 'Teal' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'amber', label: 'Amber' },
];

interface ChoiceForm {
  choice_text: string;
  score: number;
}

interface QuestionForm {
  question_text: string;
  type: 'RADIO' | 'TEXT';
  is_required: boolean;
  help_text: string;
  placeholder: string;
  choices: ChoiceForm[];
}

interface RuleForm {
  min_score: number;
  max_score: number;
  title: string;
  description: string;
  recommendation: string;
  color_code: string;
  severity: string;
}

export default function AdminCreateAssessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General Mental Health');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [estimatedTimeMins, setEstimatedTimeMins] = useState(5);
  const [version, setVersion] = useState(1);
  const [code, setCode] = useState('');

  // Step 2
  const [assessmentType, setAssessmentType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [externalUrl, setExternalUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  // Step 3
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  // Step 4
  const [rules, setRules] = useState<RuleForm[]>([]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        type: 'RADIO',
        is_required: true,
        help_text: '',
        placeholder: '',
        choices: [
          { choice_text: '', score: 0 },
          { choice_text: '', score: 1 },
        ],
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const addChoice = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, choices: [...q.choices, { choice_text: '', score: 0 }] }
          : q
      )
    );
  };

  const updateChoice = (qIndex: number, cIndex: number, field: keyof ChoiceForm, value: any) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              choices: q.choices.map((c, j) =>
                j === cIndex ? { ...c, [field]: value } : c
              ),
            }
          : q
      )
    );
  };

  const removeChoice = (qIndex: number, cIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, choices: q.choices.filter((_, j) => j !== cIndex) }
          : q
      )
    );
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const arr = [...prev];
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { min_score: 0, max_score: 0, title: '', description: '', recommendation: '', color_code: 'indigo', severity: 'normal' },
    ]);
  };

  const updateRule = (index: number, field: keyof RuleForm, value: any) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!title.trim()) errors.push('กรุณากรอกชื่อแบบประเมิน');
    if (assessmentType === 'EXTERNAL' && !externalUrl.trim()) {
      errors.push('กรุณากรอก External URL');
    }
    if (assessmentType === 'INTERNAL') {
      if (questions.length === 0) errors.push('ต้องมีอย่างน้อย 1 ข้อคำถาม');
      questions.forEach((q, i) => {
        if (!q.question_text.trim()) errors.push(`คำถามข้อที่ ${i + 1}: กรุณากรอกข้อความ`);
        if (q.type === 'RADIO' && q.choices.filter((c) => c.choice_text.trim()).length < 2) {
          errors.push(`คำถามข้อที่ ${i + 1}: ต้องมีอย่างน้อย 2 ตัวเลือก`);
        }
      });
      if (rules.length === 0) errors.push('ต้องมีอย่างน้อย 1 เกณฑ์การแปลผล');
    }
    return errors;
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setSaving(true);
    const result = await createFullAssessment({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      cover_image_url: coverImageUrl.trim() || undefined,
      estimated_time_mins: estimatedTimeMins,
      version,
      type: assessmentType,
      status,
      code: code.trim() || undefined,
      external_url: externalUrl.trim() || undefined,
      open_in_new_tab: openInNewTab,
      questions:
        assessmentType === 'INTERNAL'
          ? questions.map((q, i) => ({
              question_text: q.question_text,
              type: q.type,
              order_index: i + 1,
              is_required: q.is_required,
              help_text: q.help_text || undefined,
              placeholder: q.placeholder || undefined,
              choices:
                q.type === 'RADIO'
                  ? q.choices
                      .filter((c) => c.choice_text.trim())
                      .map((c, ci) => ({
                        choice_text: c.choice_text,
                        score: c.score,
                        order_index: ci + 1,
                      }))
                  : undefined,
            }))
          : undefined,
      interpretation_rules:
        assessmentType === 'INTERNAL'
          ? rules.map((r) => ({
              min_score: r.min_score,
              max_score: r.max_score,
              title: r.title,
              description: r.description || undefined,
              recommendation: r.recommendation || undefined,
              color_code: r.color_code,
              severity: r.severity || 'normal',
            }))
          : undefined,
    });

    setSaving(false);

    if (result.success) {
      alert(status === 'PUBLISHED' ? 'เผยแพร่แบบประเมินสำเร็จ!' : 'บันทึกแบบประเมินสำเร็จ');
      navigate('/profile');
    } else {
      alert(`เกิดข้อผิดพลาด: ${result.error || 'ไม่สามารถบันทึกได้'}`);
    }
  };

  const canGoNext = (): boolean => {
    if (step === 1) return title.trim().length > 0;
    if (step === 2 && assessmentType === 'EXTERNAL') return externalUrl.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (assessmentType === 'EXTERNAL') {
      if (step === 1) setStep(2);
      else if (step === 2) setStep(5);
      else setStep((s) => Math.min(s + 1, 5));
      return;
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const goBack = () => {
    if (assessmentType === 'EXTERNAL') {
      if (step === 2) setStep(1);
      else if (step === 5) setStep(2);
      else setStep((s) => Math.max(s - 1, 1));
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  const visibleSteps = assessmentType === 'EXTERNAL' ? EXTERNAL_STEPS : INTERNAL_STEPS;

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {visibleSteps.map((s, i) => (
            <div key={s.step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step === s.step
                      ? 'bg-owl text-white shadow-lip-sm'
                      : step > s.step
                        ? 'bg-macaw text-white'
                        : 'bg-hairline text-body-soft'
                  }`}
                >
                  {step > s.step ? '✓' : s.display}
                </div>
                <span
                  className={`text-xs mt-1.5 ${
                    step === s.step ? 'text-owl-pressed font-bold' : 'text-body-soft'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div
                  className={`w-12 md:w-20 h-0.5 mx-2 ${
                    step > s.step ? 'bg-macaw' : 'bg-hairline'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-6 md:p-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-ink">ข้อมูลทั่วไป</h2>

              <div>
                <label className="block text-sm font-medium text-body-strong mb-1">ชื่อแบบประเมิน *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น แบบประเมินความเครียด ST-5"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-body-strong mb-1">คำอธิบาย</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="คำอธิบายสั้น ๆ เกี่ยวกับแบบประเมินนี้"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-body-strong mb-1">
                  Code (Standard Assessment)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น st5 (เว้นว่าง = แบบสอบถามทั่วไป ไม่บันทึกผล)"
                  className="input"
                />
                <p className="text-xs text-body-soft mt-1.5">
                  ใส่ code เพื่อบอกว่าแบบประเมินนี้เป็น <span className="font-bold text-owl-pressed">Standard</span>{' '}
                  ผลจะถูกบันทึกเป็นประวัติสุขภาพใจในโปรไฟล์ / ใส่ช่องว่างสำหรับแบบสอบถามสำรวจตัวเอง (Self-Discovery) ที่ไม่บันทึกผล
                </p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-body-strong mb-1">หมวดหมู่</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Mental Health"
                    className="input"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-body-strong mb-1">เวอร์ชัน</label>
                  <input
                    type="number"
                    min={1}
                    value={version}
                    onChange={(e) => setVersion(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-body-strong mb-1">รูปภาพปก (URL)</label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="input"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-body-strong mb-1">เวลา (นาที)</label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedTimeMins}
                    onChange={(e) => setEstimatedTimeMins(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Assessment Type */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-ink">เลือกรูปแบบแบบประเมิน</h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAssessmentType('INTERNAL')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    assessmentType === 'INTERNAL'
                      ? 'border-owl bg-owl-soft shadow-lip-sm'
                      : 'border-hairline hover:border-owl-mint'
                  }`}
                >
                  <div className="mb-2">
                    <Icon name="book" size={28} className="text-owl" />
                  </div>
                  <h3 className="font-black text-ink mb-1">Internal Assessment</h3>
                  <p className="text-sm text-body-muted">สร้างคำถามในระบบเอง</p>
                </button>

                <button
                  onClick={() => setAssessmentType('EXTERNAL')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    assessmentType === 'EXTERNAL'
                      ? 'border-owl bg-owl-soft shadow-lip-sm'
                      : 'border-hairline hover:border-owl-mint'
                  }`}
                >
                  <div className="mb-2">
                    <Icon name="external" size={28} className="text-owl" />
                  </div>
                  <h3 className="font-black text-ink mb-1">External Assessment</h3>
                  <p className="text-sm text-body-muted">Redirect ไป Google Form หรือเว็บอื่น</p>
                </button>
              </div>

              {assessmentType === 'EXTERNAL' && (
                <div className="bg-owl-soft rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-body-strong mb-1">External URL *</label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://forms.google.com/..."
                      className="input"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openInNewTab}
                      onChange={(e) => setOpenInNewTab(e.target.checked)}
                      className="w-4 h-4 text-macaw border-hairline rounded focus:ring-macaw"
                    />
                    <span className="text-sm text-body-strong">Open in New Tab</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Questions */}
          {assessmentType === 'INTERNAL' && step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-ink">ข้อคำถาม</h2>
                <button
                  onClick={addQuestion}
                  className="px-4 py-2 bg-owl-soft hover:bg-owl-mint text-owl-pressed font-medium text-sm rounded-xl transition-colors"
                >
                  + เพิ่มคำถาม
                </button>
              </div>

              {questions.length === 0 && (
                <div className="text-center py-12 text-body-soft">
                  <div className="flex justify-center mb-2">
                    <Icon name="book" size={32} className="text-body-soft" />
                  </div>
                  <p>ยังไม่มีข้อคำถาม กด "+ เพิ่มคำถาม" เพื่อเริ่ม</p>
                </div>
              )}

              {questions.map((q, qi) => (
                <div
                  key={qi}
                  className="border border-hairline rounded-2xl p-5 space-y-4 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-body-soft bg-owl-soft px-2 py-1 rounded">
                        Q{qi + 1}
                      </span>
                      <button
                        onClick={() => moveQuestion(qi, -1)}
                        disabled={qi === 0}
                        className="text-body-soft hover:text-body-strong disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveQuestion(qi, 1)}
                        disabled={qi === questions.length - 1}
                        className="text-body-soft hover:text-body-strong disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      onClick={() => removeQuestion(qi)}
                      className="text-body-soft hover:text-cardinal transition-colors text-sm"
                    >
                      ลบ
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={q.question_text}
                      onChange={(e) => updateQuestion(qi, 'question_text', e.target.value)}
                      placeholder="ข้อความคำถาม"
                      className="input"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-body-muted mb-1">ประเภท</label>
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(qi, 'type', e.target.value)}
                        className="input"
                      >
                        <option value="RADIO">Radio (เลือกเดียว)</option>
                        <option value="TEXT">Text (ข้อความ)</option>
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-medium text-body-muted mb-1">Required</label>
                      <select
                        value={q.is_required ? 'yes' : 'no'}
                        onChange={(e) => updateQuestion(qi, 'is_required', e.target.value === 'yes')}
                        className="input"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-body-muted mb-1">Help Text</label>
                      <input
                        type="text"
                        value={q.help_text}
                        onChange={(e) => updateQuestion(qi, 'help_text', e.target.value)}
                        placeholder="ข้อความช่วยเหลือ"
                        className="input"
                      />
                    </div>
                    {q.type === 'TEXT' && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-body-muted mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={q.placeholder}
                          onChange={(e) => updateQuestion(qi, 'placeholder', e.target.value)}
                          placeholder="เช่น พิมพ์คำตอบของคุณ..."
                          className="input"
                        />
                      </div>
                    )}
                  </div>

                  {q.type === 'RADIO' && (
                    <div className="space-y-2 pl-4 border-l-2 border-owl-mint">
                      <label className="block text-xs font-medium text-body-muted">ตัวเลือก</label>
                      {q.choices.map((c, ci) => (
                        <div key={ci} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={c.choice_text}
                            onChange={(e) => updateChoice(qi, ci, 'choice_text', e.target.value)}
                            placeholder={`ตัวเลือก ${ci + 1}`}
                            className="input flex-1"
                          />
                          <input
                            type="number"
                            value={c.score}
                            onChange={(e) => updateChoice(qi, ci, 'score', Number(e.target.value))}
                            placeholder="คะแนน"
                            className="input w-20 text-center"
                          />
                          {q.choices.length > 2 && (
                            <button
                              onClick={() => removeChoice(qi, ci)}
                              className="text-body-soft hover:text-cardinal text-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addChoice(qi)}
                        className="text-sm text-macaw hover:text-macaw font-medium"
                      >
                        + Add Choice
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Interpretation Rules */}
          {assessmentType === 'INTERNAL' && step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-ink">เกณฑ์การแปลผล</h2>
                <button
                  onClick={addRule}
                  className="px-4 py-2 bg-owl-soft hover:bg-owl-mint text-owl-pressed font-medium text-sm rounded-xl transition-colors"
                >
                  + Add Rule
                </button>
              </div>

              {rules.length === 0 && (
                <div className="text-center py-12 text-body-soft">
                  <div className="flex justify-center mb-2">
                    <Icon name="chart" size={32} className="text-body-soft" />
                  </div>
                  <p>ยังไม่มีเกณฑ์การแปลผล กด "+ Add Rule" เพื่อเริ่ม</p>
                </div>
              )}

              {rules.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-hairline">
                        <th className="text-left py-2 px-2 text-body-soft font-medium">Min</th>
                        <th className="text-left py-2 px-2 text-body-soft font-medium">Max</th>
                        <th className="text-left py-2 px-2 text-body-soft font-medium">Title</th>
                        <th className="text-left py-2 px-2 text-body-soft font-medium">Color</th>
                        <th className="text-left py-2 px-2 text-body-soft font-medium">Severity</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((r, ri) => (
                        <tr key={ri} className="border-b border-hairline">
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={r.min_score}
                              onChange={(e) => updateRule(ri, 'min_score', Number(e.target.value))}
                              className="input w-16 text-center"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={r.max_score}
                              onChange={(e) => updateRule(ri, 'max_score', Number(e.target.value))}
                              className="input w-16 text-center"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={r.title}
                              onChange={(e) => updateRule(ri, 'title', e.target.value)}
                              placeholder="ปกติ"
                              className="input"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={r.color_code}
                              onChange={(e) => updateRule(ri, 'color_code', e.target.value)}
                              className="input"
                            >
                              {COLOR_CODES.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={r.severity}
                              onChange={(e) => updateRule(ri, 'severity', e.target.value)}
                              className="input"
                            >
                              <option value="normal">normal</option>
                              <option value="moderate">moderate</option>
                              <option value="severe">severe</option>
                              <option value="critical">critical</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => removeRule(ri)}
                              className="text-body-soft hover:text-cardinal text-sm"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rules.length > 0 && (
                <div className="space-y-3 pt-2">
                  {rules.map((r, ri) => (
                    <div key={ri} className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-body-muted mb-1">Description</label>
                        <input
                          type="text"
                          value={r.description}
                          onChange={(e) => updateRule(ri, 'description', e.target.value)}
                          placeholder="คำอธิบายผลการประเมิน"
                          className="input"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-body-muted mb-1">Recommendation</label>
                        <input
                          type="text"
                          value={r.recommendation}
                          onChange={(e) => updateRule(ri, 'recommendation', e.target.value)}
                          placeholder="คำแนะนำ"
                          className="input"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-ink">Review & Publish</h2>

              <div className="bg-owl-soft rounded-2xl p-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-black text-ink text-lg">{title || '(ไม่มีชื่อ)'}</h3>
                  {description && <p className="text-sm text-body-muted">{description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-hairline">
                    <div className="text-xs text-body-soft">ประเภท</div>
                    <div className="font-bold text-ink">
                      {assessmentType === 'INTERNAL' ? 'Internal' : 'External'}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-hairline">
                    <div className="text-xs text-body-soft">หมวดหมู่</div>
                    <div className="font-bold text-ink">{category}</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-hairline">
                    <div className="text-xs text-body-soft">เวอร์ชัน</div>
                    <div className="font-bold text-ink">v{version}</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-hairline">
                    <div className="text-xs text-body-soft">เวลา</div>
                    <div className="font-bold text-ink">~{estimatedTimeMins} นาที</div>
                  </div>
                </div>

                {assessmentType === 'INTERNAL' && (
                  <>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Icon name="check" size={16} className="text-macaw" />
                        <span className="text-body-strong">{questions.length} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-macaw">✓</span>
                        <span className="text-body-strong">
                          {questions.filter((q) => q.type === 'RADIO').length > 0
                            ? 'มี Choices'
                            : '0 Choices'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-macaw">✓</span>
                        <span className="text-body-strong">{rules.length} Rules</span>
                      </div>
                    </div>

                    <div className="text-sm text-body-muted">
                      สถานะ: <span className="font-medium text-fox">Draft</span>
                    </div>
                  </>
                )}

                {assessmentType === 'EXTERNAL' && externalUrl && (
                  <div className="bg-white rounded-xl p-3 border border-hairline">
                    <div className="text-xs text-body-soft">External URL</div>
                    <div className="font-bold text-macaw text-sm truncate">{externalUrl}</div>
                  </div>
                )}
              </div>

              {getValidationErrors().length > 0 && (
                <div className="bg-cardinal/10 border border-cardinal/30 rounded-2xl p-4">
                  <p className="text-sm font-bold text-cardinal mb-2">
                    <Icon name="alert" size={16} className="inline mr-1" />
                    กรุณาแก้ไขก่อนเผยแพร่:
                  </p>
                  <ul className="text-sm text-cardinal space-y-1">
                    {getValidationErrors().map((err, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 1 && (
              <button
                onClick={goBack}
                className="px-6 py-2.5 text-body-muted hover:text-body-strong font-medium transition-colors"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <button
                onClick={goNext}
                disabled={!canGoNext()}
                className="btn-primary disabled:opacity-50"
              >
                Next →
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave('DRAFT')}
                  disabled={saving}
                  className="btn-secondary disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave('PUBLISHED')}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : 'Publish'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}