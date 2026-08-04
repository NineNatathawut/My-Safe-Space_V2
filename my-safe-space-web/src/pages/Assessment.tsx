import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getActiveAssessments } from '../services/assessmentService';
import type { Assessment as AssessmentType, InterpretationRule } from '../types/assessment';

export default function Assessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [assessments, setAssessments] = useState<AssessmentType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<InterpretationRule | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const loadAssessment = async () => {
      const list = await getActiveAssessments();
      setAssessments(list);
      const urlId = searchParams.get('id');
      if (urlId && list.some((a) => a.id === urlId)) {
        setSelectedId(urlId);
      } else if (list.length === 1) {
        setSelectedId(list[0].id);
      }
      setLoading(false);
    };
    loadAssessment();
  }, [searchParams]);

  const assessment = assessments.find((a) => a.id === selectedId) || null;

  const resetQuiz = () => {
    setAnswers({});
    setIsSubmitted(false);
    setResult(null);
    setTotalScore(0);
  };

  const handleSelect = (id: string) => {
    resetQuiz();
    setSelectedId(id);
  };

  const handleBackToList = () => {
    resetQuiz();
    setSelectedId(null);
  };

  const handleSelectOption = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
  };

  const handleTextChange = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const calculateResult = () => {
    if (!assessment || !assessment.questions) return;

    const scoreSum = Object.values(answers).reduce<number>((sum, value) => {
      if (typeof value === 'number') return sum + value;
      return sum;
    }, 0);
    setTotalScore(scoreSum);

    const rules = assessment.interpretation_rules || [];
    const matched = rules.find((r) => scoreSum >= r.min_score && scoreSum <= r.max_score);

    setResult(
      matched || {
        min_score: scoreSum,
        max_score: scoreSum,
        title: 'ผลประเมิน',
        description: 'ขอบคุณที่ร่วมทำแบบประเมินครับ',
      }
    );

    setIsSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl text-slate-500 animate-pulse">กำลังเตรียมแบบประเมิน...</div>
      </div>
    );
  }

  // ── ยังไม่ได้เลือก และไม่มีแบบประเมิน ──
  if (!assessment && assessments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl text-slate-500">ขณะนี้ยังไม่มีแบบประเมินที่เปิดใช้งานครับ 🙇‍♂️</div>
      </div>
    );
  }

  // ── ยังไม่ได้เลือก และมีหลายแบบประเมิน → หน้าเลือก (catalog) ──
  if (!assessment) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-slate-800">แบบประเมินสุขภาพใจ 📋</h1>
            <p className="text-slate-500">เลือกแบบประเมินที่ต้องการทำ</p>
          </div>

          <div className="space-y-4">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="text-3xl shrink-0">
                  {a.type === 'EXTERNAL' ? '🔗' : '📝'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-slate-800">{a.title}</h2>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        a.type === 'EXTERNAL'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {a.type === 'EXTERNAL' ? '🔗 External' : '📝 Internal'}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-sm text-slate-500 mt-1 truncate">{a.description}</p>
                  )}
                  {a.estimated_time_mins && (
                    <p className="text-xs text-slate-400 mt-1">~{a.estimated_time_mins} นาที</p>
                  )}
                </div>

                {a.type === 'EXTERNAL' ? (
                  <a
                    href={a.external_url}
                    target={a.open_in_new_tab !== false ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    เริ่มทำแบบประเมิน
                  </a>
                ) : (
                  <button
                    onClick={() => handleSelect(a.id)}
                    className="shrink-0 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl transition-colors"
                  >
                    เริ่มทำแบบประเมิน
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── เลือกแล้ว: EXTERNAL → redirect ──
  if (assessment.type === 'EXTERNAL' && assessment.external_url) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          {assessments.length > 1 && (
            <button
              onClick={handleBackToList}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← กลับไปเลือกแบบประเมิน
            </button>
          )}
          <div className="text-6xl">🔗</div>
          <h1 className="text-2xl font-bold text-slate-800">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-slate-500">{assessment.description}</p>
          )}
          <a
            href={assessment.external_url}
            target={assessment.open_in_new_tab !== false ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="inline-block w-full px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-bold text-lg rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            ไปทำแบบประเมิน
          </a>
        </div>
      </div>
    );
  }

  // ── เลือกแล้ว: INTERNAL ไม่มีข้อคำถาม → fallback ──
  if (!assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="text-center space-y-4 px-4">
          {assessments.length > 1 && (
            <button
              onClick={handleBackToList}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← กลับไปเลือกแบบประเมิน
            </button>
          )}
          <div className="text-5xl">📝</div>
          <h2 className="text-xl font-bold text-slate-700">แบบประเมินนี้ยังไม่มีข้อคำถาม</h2>
          <p className="text-slate-500">กรุณารอการอัปเดตจากผู้ดูแลระบบ</p>
        </div>
      </div>
    );
  }

  const isAllAnswered = assessment.questions.every((q, i) => {
    if (!q.is_required) return true;
    const answer = answers[i];
    if (q.type === 'TEXT') return typeof answer === 'string' && answer.trim().length > 0;
    return answer !== undefined && answer !== null;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {assessments.length > 1 && (
          <button
            onClick={handleBackToList}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← กลับไปเลือกแบบประเมิน
          </button>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-slate-500">{assessment.description}</p>
          )}
          {assessment.estimated_time_mins && (
            <p className="text-xs text-slate-400">~{assessment.estimated_time_mins} นาที</p>
          )}
        </div>

        {!isSubmitted ? (
          <div className="space-y-6">
            {assessment.questions.map((q, index) => (
              <div
                key={q.id || index}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
              >
                <h3 className="text-lg font-medium text-slate-800 mb-1">
                  {index + 1}. {q.question_text}
                  {q.is_required !== false && <span className="text-red-400 ml-1">*</span>}
                </h3>
                {q.help_text && (
                  <p className="text-sm text-slate-400 mb-3">{q.help_text}</p>
                )}

                {q.type === 'RADIO' && q.choices && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.choices.map((opt, optIdx) => {
                      const isSelected = answers[index] === opt.score;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(index, opt.score)}
                          className={`py-3 px-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-fuchsia-50 border-fuchsia-400 text-fuchsia-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-fuchsia-300 hover:bg-fuchsia-50/50'
                          }`}
                        >
                          {opt.choice_text}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'TEXT' && (
                  <textarea
                    value={(answers[index] as string) || ''}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    placeholder={q.placeholder || 'พิมพ์คำตอบของคุณ...'}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-400 transition-colors resize-none"
                  />
                )}
              </div>
            ))}

            <div className="pt-4 pb-10">
              <button
                onClick={calculateResult}
                disabled={!isAllAnswered}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-sm ${
                  isAllAnswered
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:shadow-md transform hover:-translate-y-0.5'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isAllAnswered ? '✨ ดูผลประเมิน' : 'กรุณาตอบคำถามให้ครบทุกข้อ'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6 animate-fadeIn">
            {result && (
              <>
                <div
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl"
                  style={{ backgroundColor: `${result.color_code || 'indigo'}15` }}
                >
                  🫂
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {result.title || 'ทำแบบประเมินเสร็จสิ้น'}
                  </h2>
                  <p className="text-slate-500">
                    คะแนนของคุณคือ:{' '}
                    <span className="text-xl font-bold text-fuchsia-600">{totalScore}</span> คะแนน
                  </p>
                </div>

                {result.description && (
                  <div
                    className="p-4 rounded-xl text-left"
                    style={{
                      backgroundColor: `${result.color_code || 'blue'}10`,
                      color: `${result.color_code || 'blue'}800`,
                    }}
                  >
                    <p className="leading-relaxed">{result.description}</p>
                  </div>
                )}

                {result.recommendation && (
                  <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-left">
                    <p className="font-medium text-sm mb-1">คำแนะนำ:</p>
                    <p className="leading-relaxed">{result.recommendation}</p>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-3">
              {assessments.length > 1 && (
                <button
                  onClick={handleBackToList}
                  className="w-full py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl transition-colors shadow-sm"
                >
                  ← ทำแบบประเมินอื่น
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="mt-6 inline-block w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                เข้าสู่พื้นที่ปลอดภัย (หน้าหลัก)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
