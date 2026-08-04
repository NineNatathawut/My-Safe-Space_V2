import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFullAssessment } from '../services/assessmentService';

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
      { min_score: 0, max_score: 0, title: '', description: '', recommendation: '', color_code: 'indigo' },
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
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {visibleSteps.map((s, i) => (
            <div key={s.step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step === s.step
                      ? 'bg-pink-500 text-white shadow-md'
                      : step > s.step
                        ? 'bg-emerald-400 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.step ? '✓' : s.display}
                </div>
                <span
                  className={`text-xs mt-1.5 ${
                    step === s.step ? 'text-pink-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div
                  className={`w-12 md:w-20 h-0.5 mx-2 ${
                    step > s.step ? 'bg-emerald-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800">ข้อมูลทั่วไป</h2>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อแบบประเมิน *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น แบบประเมินความเครียด ST-5"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">คำอธิบาย</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="คำอธิบายสั้น ๆ เกี่ยวกับแบบประเมินนี้"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">หมวดหมู่</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Mental Health"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-600 mb-1">เวอร์ชัน</label>
                  <input
                    type="number"
                    min={1}
                    value={version}
                    onChange={(e) => setVersion(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">รูปภาพปก (URL)</label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-600 mb-1">เวลา (นาที)</label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedTimeMins}
                    onChange={(e) => setEstimatedTimeMins(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Assessment Type */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800">เลือกรูปแบบแบบประเมิน</h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAssessmentType('INTERNAL')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    assessmentType === 'INTERNAL'
                      ? 'border-pink-400 bg-pink-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">📝</div>
                  <h3 className="font-bold text-gray-800 mb-1">Internal Assessment</h3>
                  <p className="text-sm text-gray-500">สร้างคำถามในระบบเอง</p>
                </button>

                <button
                  onClick={() => setAssessmentType('EXTERNAL')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    assessmentType === 'EXTERNAL'
                      ? 'border-pink-400 bg-pink-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🔗</div>
                  <h3 className="font-bold text-gray-800 mb-1">External Assessment</h3>
                  <p className="text-sm text-gray-500">Redirect ไป Google Form หรือเว็บอื่น</p>
                </button>
              </div>

              {assessmentType === 'EXTERNAL' && (
                <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">External URL *</label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://forms.google.com/..."
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openInNewTab}
                      onChange={(e) => setOpenInNewTab(e.target.checked)}
                      className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-600">Open in New Tab</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Questions */}
          {assessmentType === 'INTERNAL' && step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">ข้อคำถาม</h2>
                <button
                  onClick={addQuestion}
                  className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-medium text-sm rounded-xl transition-colors"
                >
                  + เพิ่มคำถาม
                </button>
              </div>

              {questions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p>ยังไม่มีข้อคำถาม กด "+ เพิ่มคำถาม" เพื่อเริ่ม</p>
                </div>
              )}

              {questions.map((q, qi) => (
                <div
                  key={qi}
                  className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        Q{qi + 1}
                      </span>
                      <button
                        onClick={() => moveQuestion(qi, -1)}
                        disabled={qi === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveQuestion(qi, 1)}
                        disabled={qi === questions.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      onClick={() => removeQuestion(qi)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-sm"
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
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">ประเภท</label>
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(qi, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 transition-colors"
                      >
                        <option value="RADIO">Radio (เลือกเดียว)</option>
                        <option value="TEXT">Text (ข้อความ)</option>
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Required</label>
                      <select
                        value={q.is_required ? 'yes' : 'no'}
                        onChange={(e) => updateQuestion(qi, 'is_required', e.target.value === 'yes')}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 transition-colors"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Help Text</label>
                      <input
                        type="text"
                        value={q.help_text}
                        onChange={(e) => updateQuestion(qi, 'help_text', e.target.value)}
                        placeholder="ข้อความช่วยเหลือ"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 transition-colors"
                      />
                    </div>
                    {q.type === 'TEXT' && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={q.placeholder}
                          onChange={(e) => updateQuestion(qi, 'placeholder', e.target.value)}
                          placeholder="เช่น พิมพ์คำตอบของคุณ..."
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {q.type === 'RADIO' && (
                    <div className="space-y-2 pl-4 border-l-2 border-pink-100">
                      <label className="block text-xs font-medium text-gray-500">ตัวเลือก</label>
                      {q.choices.map((c, ci) => (
                        <div key={ci} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={c.choice_text}
                            onChange={(e) => updateChoice(qi, ci, 'choice_text', e.target.value)}
                            placeholder={`ตัวเลือก ${ci + 1}`}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 transition-colors"
                          />
                          <input
                            type="number"
                            value={c.score}
                            onChange={(e) => updateChoice(qi, ci, 'score', Number(e.target.value))}
                            placeholder="คะแนน"
                            className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 transition-colors text-center"
                          />
                          {q.choices.length > 2 && (
                            <button
                              onClick={() => removeChoice(qi, ci)}
                              className="text-gray-400 hover:text-red-500 text-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addChoice(qi)}
                        className="text-sm text-pink-500 hover:text-pink-700 font-medium"
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
                <h2 className="text-xl font-bold text-gray-800">เกณฑ์การแปลผล</h2>
                <button
                  onClick={addRule}
                  className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-medium text-sm rounded-xl transition-colors"
                >
                  + Add Rule
                </button>
              </div>

              {rules.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📊</div>
                  <p>ยังไม่มีเกณฑ์การแปลผล กด "+ Add Rule" เพื่อเริ่ม</p>
                </div>
              )}

              {rules.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">Min</th>
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">Max</th>
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">Title</th>
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">Color</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((r, ri) => (
                        <tr key={ri} className="border-b border-gray-50">
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={r.min_score}
                              onChange={(e) => updateRule(ri, 'min_score', Number(e.target.value))}
                              className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-pink-400 transition-colors"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={r.max_score}
                              onChange={(e) => updateRule(ri, 'max_score', Number(e.target.value))}
                              className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-pink-400 transition-colors"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={r.title}
                              onChange={(e) => updateRule(ri, 'title', e.target.value)}
                              placeholder="ปกติ"
                              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-400 transition-colors"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={r.color_code}
                              onChange={(e) => updateRule(ri, 'color_code', e.target.value)}
                              className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-400 transition-colors"
                            >
                              {COLOR_CODES.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => removeRule(ri)}
                              className="text-gray-400 hover:text-red-500 text-sm"
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
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                        <input
                          type="text"
                          value={r.description}
                          onChange={(e) => updateRule(ri, 'description', e.target.value)}
                          placeholder="คำอธิบายผลการประเมิน"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Recommendation</label>
                        <input
                          type="text"
                          value={r.recommendation}
                          onChange={(e) => updateRule(ri, 'recommendation', e.target.value)}
                          placeholder="คำแนะนำ"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 transition-colors"
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
              <h2 className="text-xl font-bold text-gray-800">Review & Publish</h2>

              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-700 text-lg">{title || '(ไม่มีชื่อ)'}</h3>
                  {description && <p className="text-sm text-gray-500">{description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="text-xs text-gray-400">ประเภท</div>
                    <div className="font-medium text-gray-700">
                      {assessmentType === 'INTERNAL' ? '📝 Internal' : '🔗 External'}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="text-xs text-gray-400">หมวดหมู่</div>
                    <div className="font-medium text-gray-700">{category}</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="text-xs text-gray-400">เวอร์ชัน</div>
                    <div className="font-medium text-gray-700">v{version}</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="text-xs text-gray-400">เวลา</div>
                    <div className="font-medium text-gray-700">~{estimatedTimeMins} นาที</div>
                  </div>
                </div>

                {assessmentType === 'INTERNAL' && (
                  <>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-gray-600">{questions.length} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-gray-600">
                          {questions.filter((q) => q.type === 'RADIO').length > 0
                            ? 'มี Choices'
                            : '0 Choices'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-gray-600">{rules.length} Rules</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      สถานะ: <span className="font-medium text-amber-600">Draft</span>
                    </div>
                  </>
                )}

                {assessmentType === 'EXTERNAL' && externalUrl && (
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="text-xs text-gray-400">External URL</div>
                    <div className="font-medium text-blue-600 text-sm truncate">{externalUrl}</div>
                  </div>
                )}
              </div>

              {getValidationErrors().length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm font-medium text-red-700 mb-2">⚠️ กรุณาแก้ไขก่อนเผยแพร่:</p>
                  <ul className="text-sm text-red-600 space-y-1">
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
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
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
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors"
              >
                Next →
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave('DRAFT')}
                  disabled={saving}
                  className="px-5 py-2.5 border border-gray-300 text-gray-600 hover:text-gray-800 font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave('PUBLISHED')}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
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
