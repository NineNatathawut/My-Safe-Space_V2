import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveAssessment } from '../services/assessmentService';
import type { Assessment as AssessmentType, InterpretationRule } from '../types/assessment';

export default function Assessment() {
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<AssessmentType | null>(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<InterpretationRule | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const loadAssessment = async () => {
      const data = await getActiveAssessment();
      setAssessment(data);
      setLoading(false);
    };
    loadAssessment();
  }, []);

  const handleSelectOption = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
  };

  const handleTextChange = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const calculateResult = () => {
    if (!assessment || !assessment.questions) return;

    const scoreSum = Object.entries(answers).reduce((sum, [key, value]) => {
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
        <div className="text-xl text-gray-500 animate-pulse">กำลังเตรียมแบบประเมิน...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl text-gray-500">ขณะนี้ยังไม่มีแบบประเมินที่เปิดใช้งานครับ 🙇‍♂️</div>
      </div>
    );
  }

  // EXTERNAL assessment → show redirect button
  if (assessment.type === 'EXTERNAL' && assessment.external_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md mx-auto text-center space-y-6 px-4">
          <div className="text-6xl">🔗</div>
          <h1 className="text-2xl font-bold text-gray-800">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-gray-500">{assessment.description}</p>
          )}
          <a
            href={assessment.external_url}
            target={assessment.open_in_new_tab !== false ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="inline-block w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-lg rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            ไปทำแบบประเมิน
          </a>
        </div>
      </div>
    );
  }

  // INTERNAL without questions → show fallback
  if (!assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 px-4">
          <div className="text-5xl">📝</div>
          <h2 className="text-xl font-bold text-gray-700">แบบประเมินนี้ยังไม่มีข้อคำถาม</h2>
          <p className="text-gray-500">กรุณารอการอัปเดตจากผู้ดูแลระบบ</p>
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
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-gray-500">{assessment.description}</p>
          )}
          {assessment.estimated_time_mins && (
            <p className="text-xs text-gray-400">~{assessment.estimated_time_mins} นาที</p>
          )}
        </div>

        {!isSubmitted ? (
          <div className="space-y-6">
            {assessment.questions.map((q, index) => (
              <div
                key={q.id || index}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  {index + 1}. {q.question_text}
                  {q.is_required !== false && <span className="text-red-400 ml-1">*</span>}
                </h3>
                {q.help_text && (
                  <p className="text-sm text-gray-400 mb-3">{q.help_text}</p>
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
                              ? 'bg-pink-50 border-pink-400 text-pink-700 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-pink-300 hover:bg-pink-50/50'
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors resize-none"
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
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-md transform hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isAllAnswered ? '✨ ดูผลประเมิน' : 'กรุณาตอบคำถามให้ครบทุกข้อ'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6 animate-fadeIn">
            {result && (
              <>
                <div
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl"
                  style={{ backgroundColor: `${result.color_code || 'indigo'}15` }}
                >
                  🫂
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {result.title || 'ทำแบบประเมินเสร็จสิ้น'}
                  </h2>
                  <p className="text-gray-500">
                    คะแนนของคุณคือ:{' '}
                    <span className="text-xl font-bold text-pink-600">{totalScore}</span> คะแนน
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

            <button
              onClick={() => navigate('/')}
              className="mt-6 inline-block w-full py-3.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              เข้าสู่พื้นที่ปลอดภัย (หน้าหลัก)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
