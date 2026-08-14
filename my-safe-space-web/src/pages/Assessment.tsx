import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getActiveAssessments, submitAssessmentResult } from '../services/assessmentService';
import type {
  Assessment as AssessmentType,
  AssessmentQuestion,
  InterpretationRule,
  DimensionResult,
} from '../types/assessment';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';

const SEVERITY_ORDER = ['normal', 'mild', 'moderate', 'severe', 'extremely_severe'];

const DIMENSION_LABELS: Record<string, string> = {
  depression: 'ภาวะซึมเศร้า',
  anxiety: 'ความวิตกกังวล',
  stress: 'ความเครียด',
};

function dimensionLabel(dim: string): string {
  return DIMENSION_LABELS[dim] || dim || 'โดยรวม';
}

function isHighRisk(severity?: string): boolean {
  return severity === 'severe' || severity === 'extremely_severe';
}

// คำนวณผลแต่ละมิติ (ปฏิบัติกับ assessment ที่มี dimension กำกับคำถาม เช่น DASS-21)
function computeDimensionResults(
  questionsData: NonNullable<AssessmentType['questions']>,
  rulesData: InterpretationRule[],
  answers: Record<number, number | string>,
  multiplier: number
): DimensionResult[] {
  const dims: string[] = [];
  for (const q of questionsData) {
    if (q.dimension && !dims.includes(q.dimension)) dims.push(q.dimension);
  }
  if (dims.length === 0) return [];

  return dims.map((dim) => {
    const entries = questionsData
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.dimension === dim && q.type === 'RADIO');

    let raw = 0;
    let maxRaw = 0;
    for (const { q, i } of entries) {
      const value = answers[i];
      if (typeof value === 'number') raw += value;
      const top = Math.max(0, ...(q.choices?.map((ch) => ch.score) ?? [0]));
      maxRaw += top;
    }

    const score = Math.round(raw * multiplier);
    const maxScore = Math.round(maxRaw * multiplier);

    const rule = rulesData.find(
      (r) =>
        (!r.dimension || r.dimension === dim) &&
        score >= r.min_score &&
        score <= r.max_score
    );

    return {
      dimension: dim,
      score,
      max_score: maxScore,
      severity: rule?.severity || 'normal',
      title: rule?.title || 'ผลประเมิน',
      description: rule?.description,
      recommendation: rule?.recommendation,
      color_code: rule?.color_code || '#1cb0f6',
    };
  });
}

function pickWorst(results: DimensionResult[]): DimensionResult {
  return results.reduce((worst, cur) => {
    const wi = SEVERITY_ORDER.indexOf(worst.severity);
    const ci = SEVERITY_ORDER.indexOf(cur.severity);
    if (ci > wi || (ci === wi && cur.score > worst.score)) return cur;
    return worst;
  });
}

export default function Assessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, refreshUser } = useAuth();

  const [assessments, setAssessments] = useState<AssessmentType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<InterpretationRule | null>(null);
  const [dimensionResults, setDimensionResults] = useState<DimensionResult[] | null>(null);
  const [hasDimensions, setHasDimensions] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  // refs ของการ์ดคำถามแต่ละข้อ ใช้เลื่อนไปข้อถัดไป/ก่อนหน้า (ช่วยใช้งานด้วยนิ้วบนมือถือ)
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const isQAnswered = (q: AssessmentQuestion, index: number): boolean => {
    const answer = answers[index];
    if (q.type === 'TEXT') return typeof answer === 'string' && answer.trim().length > 0;
    return answer !== undefined && answer !== null;
  };

  const scrollToQuestion = (index: number) => {
    const el = questionRefs.current[index];
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

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
    setDimensionResults(null);
    setHasDimensions(false);
    setTotalScore(0);
    setSavedNote(null);
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
    if (answers[questionIndex] === score) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));

    // เลื่อนไปข้อถัดไปที่ยังไม่ตอบอัตโนมัติ — ถนัดมือบนมือถือ
    const qs = assessment?.questions || [];
    const next = qs.findIndex((q, i) => i > questionIndex && !isQAnswered(q, i));
    if (next !== -1) {
      window.setTimeout(() => scrollToQuestion(next), 400);
    }
  };

  const handleTextChange = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const calculateResult = async () => {
    if (!assessment || !assessment.questions) return;

    const multiplier = assessment.score_multiplier && assessment.score_multiplier > 0 ? assessment.score_multiplier : 1;
    const questions = assessment.questions;
    const rules = assessment.interpretation_rules || [];
    const isMulti = questions.some((q) => q && q.dimension);

    let overall: InterpretationRule | null;
    let dims: DimensionResult[] | null = null;
    let scoreSum = 0;

    if (isMulti) {
      dims = computeDimensionResults(questions, rules, answers, multiplier);
      const worst = pickWorst(dims);
      overall = {
        title: worst.title,
        description: worst.description,
        recommendation: worst.recommendation,
        color_code: worst.color_code,
        severity: worst.severity,
        min_score: worst.score,
        max_score: worst.max_score,
      };
      scoreSum = worst.score;
      setDimensionResults(dims);
    } else {
      const scoreSumRaw = Object.values(answers).reduce<number>((sum, value) => {
        if (typeof value === 'number') return sum + value;
        return sum;
      }, 0);
      scoreSum = Math.round(scoreSumRaw * multiplier);
      setDimensionResults(null);
      overall =
        rules.find((r) => scoreSum >= r.min_score && scoreSum <= r.max_score) ||
        ({
          min_score: scoreSum,
          max_score: scoreSum,
          title: 'ผลประเมิน',
          description: 'ขอบคุณที่ร่วมทำแบบประเมินครับ',
        } as InterpretationRule);
    }

    setHasDimensions(isMulti);
    setTotalScore(scoreSum);
    setResult(overall);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'auto' });

    // ── แบบประเมินมาตรฐาน (มี code) → บันทึกผลลงประวัติสุขภาพใจ ──
    if (assessment.code && isAuthenticated) {
      setSavedNote('กำลังบันทึกผลลงประวัติสุขภาพใจ...');
      const res = await submitAssessmentResult({
        assessment_id: assessment.id,
        total_score: scoreSum,
        max_score: (isMulti ? (dims && pickWorst(dims).max_score) : overall?.max_score) || 0,
        severity: overall?.severity || 'normal',
        rule_title: overall?.title || '',
        rule_color: overall?.color_code || 'indigo',
        answers: answers as unknown as Record<string, unknown>,
        dimensions: dims || [],
      });

      if (res.success && res.recorded) {
        setSavedNote(res.completion ? '✅ ครั้งแรกของคุณเสร็จเรียบร้อย ตั้ง Baseline แล้ว!' : '✅ บันทึกผลลงประวัติสุขภาพใจแล้ว');
        if (searchParams.get('onboarding') === '1') {
          await refreshUser();
        }
      } else {
        setSavedNote(null);
      }
    } else {
      setSavedNote(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-body-muted font-medium animate-pulse">กำลังเตรียมแบบประเมิน...</div>
      </div>
    );
  }

  // ── ยังไม่ได้เลือก และไม่มีแบบประเมิน ──
  if (!assessment && assessments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-body-muted font-medium">ขณะนี้ยังไม่มีแบบประเมินที่เปิดใช้งานครับ</div>
      </div>
    );
  }

  // ── ยังไม่ได้เลือก และมีหลายแบบประเมิน → หน้าเลือก (catalog) ──
  if (!assessment) {
    return (
      <div className="min-h-screen py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-black text-ink">แบบประเมินสุขภาพใจ</h1>
            <p className="text-body-muted font-medium">เลือกแบบประเมินที่ต้องการทำ</p>
          </div>

          <div className="space-y-4">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="text-3xl shrink-0">
                  <Icon name={a.type === 'EXTERNAL' ? 'external' : 'pencil'} size={28} className="text-macaw" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-ink">{a.title}</h2>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        a.type === 'EXTERNAL'
                          ? 'bg-bee/20 text-ink'
                          : 'bg-owl-soft text-owl-pressed'
                      }`}
                    >
                      {a.type === 'EXTERNAL' ? 'External' : 'Internal'}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-sm text-body-muted font-medium mt-1 truncate">{a.description}</p>
                  )}
                  {a.estimated_time_mins && (
                    <p className="text-xs text-body-soft mt-1">~{a.estimated_time_mins} นาที</p>
                  )}
                </div>

                {a.type === 'EXTERNAL' ? (
                  <a
                    href={a.external_url}
                    target={a.open_in_new_tab !== false ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="shrink-0 btn-primary text-sm"
                  >
                    เริ่มทำแบบประเมิน
                  </a>
                ) : (
                  <button
                    onClick={() => handleSelect(a.id)}
                    className="shrink-0 btn-primary text-sm"
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
      <div className="min-h-screen py-10 px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          {assessments.length > 1 && (
            <button
              onClick={handleBackToList}
              className="text-sm text-body-muted hover:text-ink font-medium transition-colors inline-flex items-center gap-1"
            >
              <Icon name="chevron-left" size={16} /> กลับไปเลือกแบบประเมิน
            </button>
          )}
          <div className="text-6xl">
            <Icon name="external" size={56} className="text-macaw" />
          </div>
          <h1 className="text-2xl font-black text-ink">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-body-muted font-medium">{assessment.description}</p>
          )}
          <a
            href={assessment.external_url}
            target={assessment.open_in_new_tab !== false ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="w-full btn-primary"
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
      <div className="min-h-screen py-10 px-4">
        <div className="text-center space-y-4 px-4">
          {assessments.length > 1 && (
            <button
              onClick={handleBackToList}
              className="text-sm text-body-muted hover:text-ink font-medium transition-colors inline-flex items-center gap-1"
            >
              <Icon name="chevron-left" size={16} /> กลับไปเลือกแบบประเมิน
            </button>
          )}
          <div className="text-5xl">
            <Icon name="pencil" size={48} className="text-macaw" />
          </div>
          <h2 className="text-xl font-bold text-ink">แบบประเมินนี้ยังไม่มีข้อคำถาม</h2>
          <p className="text-body-muted font-medium">กรุณารอการอัปเดตจากผู้ดูแลระบบ</p>
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

  const questions = assessment.questions;

  let answeredCount = 0;
  let requiredTotal = 0;
  questions.forEach((q, i) => {
    if (q.is_required === false) return;
    requiredTotal += 1;
    if (isQAnswered(q, i)) answeredCount += 1;
  });
  const progressPct = requiredTotal > 0 ? Math.round((answeredCount / requiredTotal) * 100) : 0;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {assessments.length > 1 && (
          <button
            onClick={handleBackToList}
            className="text-sm text-body-muted hover:text-ink font-medium transition-colors inline-flex items-center gap-1"
          >
            <Icon name="chevron-left" size={16} /> กลับไปเลือกแบบประเมิน
          </button>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-ink">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-body-muted font-medium">{assessment.description}</p>
          )}
          {assessment.estimated_time_mins && (
            <p className="text-xs text-body-soft">~{assessment.estimated_time_mins} นาที</p>
          )}
        </div>

        {!isSubmitted ? (
          <div className="space-y-6">
            {assessment.questions.map((q, index) => {
              const prevDim = index > 0 ? questions[index - 1].dimension : undefined;
              const showSectionHeader = !!q.dimension && q.dimension !== prevDim;
              return (
              <div
                key={q.id || index}
                ref={(el) => { questionRefs.current[index] = el; }}
                className="scroll-mt-28"
              >
                {showSectionHeader && (
                  <div className="mb-3 text-sm font-bold text-owl-pressed inline-flex items-center gap-2 bg-owl-soft px-3 py-1.5 rounded-full">
                    <Icon name="chart" size={14} /> {dimensionLabel(q.dimension!)}
                  </div>
                )}
                <div className="card p-6">
                <h3 className="text-lg font-bold text-ink mb-1">
                  {index + 1}. {q.question_text}
                  {q.is_required !== false && <span className="text-cardinal ml-1">*</span>}
                </h3>
                {q.help_text && (
                  <p className="text-sm text-body-soft mb-3">{q.help_text}</p>
                )}

                {q.type === 'RADIO' && q.choices && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.choices.map((opt, optIdx) => {
                      const isSelected = answers[index] === opt.score;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(index, opt.score)}
                          className={`min-h-[48px] py-3.5 px-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                            isSelected
                              ? 'bg-owl-soft border-owl-mint text-ink font-bold shadow-lip-sm'
                              : 'bg-white border-hairline text-body-strong hover:border-macaw hover:bg-owl-soft/40'
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
                    className="input resize-none rounded-xl"
                  />
                )}
              </div>
              </div>
              );
            })}

            <div className="pt-4 pb-28" aria-hidden="true" />
          </div>
        ) : (
          <div className="card p-8 rounded-3xl text-center space-y-6 animate-fadeIn">
            {hasDimensions && dimensionResults ? (
              <>
                <div>
                  <h2 className="text-2xl font-black text-ink mb-2">
                    ผลการประเมินของคุณ
                  </h2>
                  <p className="text-body-muted font-medium">
                    ทีละด้าน คะแนนรวมของแต่ละด้านถูกคำนวณตามเกณฑ์
                  </p>
                </div>

                {/* ⚠️ แถบแดง: มีด้านใดด้านหนึ่งระดับสูง */}
                {dimensionResults.some((d) => isHighRisk(d.severity)) && (
                  <div className="rounded-2xl bg-cardinal/5 border-2 border-cardinal/40 p-5 text-left">
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 shrink-0 bg-cardinal text-white rounded-xl flex items-center justify-center">
                        <Icon name="alert" size={22} />
                      </span>
                      <div>
                        <h3 className="font-extrabold text-cardinal">
                          มีความเสี่ยงภาวะอารมณ์ระดับสูง
                        </h3>
                        <p className="text-sm text-body-muted font-medium">
                          ไม่ต้องเจอกับลำพัง — มีคนพร้อมรับฟัง 24 ชั่วโมง
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <a href="tel:1323" className="flex-1 flex items-center justify-center gap-2 bg-white border border-hairline hover:border-owl-mint rounded-xl py-3 px-4 font-bold text-sm text-ink transition-colors">
                        <Icon name="phone" size={16} className="text-cardinal" /> 1323 สายด่วนสุขภาพจิต
                      </a>
                      <a href="tel:1669" className="flex-1 flex items-center justify-center gap-2 bg-white border border-hairline hover:border-owl-mint rounded-xl py-3 px-4 font-bold text-sm text-ink transition-colors">
                        <Icon name="phone" size={16} className="text-cardinal" /> 1669 กรณีฉุกเฉิน
                      </a>
                    </div>
                  </div>
                )}

                <div className="space-y-4 text-left">
                  {dimensionResults.map((dim) => {
                    const color = dim.color_code || '#1cb0f6';
                    return (
                      <div
                        key={dim.dimension}
                        className="rounded-2xl border p-5"
                        style={{ borderColor: `${color}55` }}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h3 className="font-extrabold text-ink">{dimensionLabel(dim.dimension)}</h3>
                          <span
                            className="text-xs font-bold px-3 py-1 rounded-full"
                            style={{ backgroundColor: `${color}15`, color }}
                          >
                            {dim.title}
                          </span>
                        </div>
                        <p className="text-body-muted font-medium mt-1">
                          คะแนน:{' '}
                          <span className="text-lg font-black" style={{ color }}>
                            {dim.score}
                          </span>
                          <span className="text-body-soft text-sm">/{dim.max_score}</span>
                        </p>
                        {dim.description && (
                          <p className="text-sm text-body-muted leading-relaxed mt-2">{dim.description}</p>
                        )}
                        {dim.recommendation && (
                          <div className="mt-3 p-3 rounded-xl bg-bee/20 text-ink text-sm">
                            <p className="font-medium mb-1">คำแนะนำ:</p>
                            <p className="leading-relaxed">{dim.recommendation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {savedNote && (
                  <div className="p-3 rounded-xl bg-macaw/10 text-macaw text-sm text-left font-medium border border-macaw/30">
                    {savedNote}
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${result?.color_code || '#1cb0f6'}15` }}
                >
                  <Icon name="hands" size={40} className="text-ink" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-ink mb-2">
                    {result?.title || 'ทำแบบประเมินเสร็จสิ้น'}
                  </h2>
                  <p className="text-body-muted font-medium">
                    คะแนนของคุณคือ:{' '}
                    <span className="text-xl font-bold text-macaw">{totalScore}</span> คะแนน
                  </p>
                </div>

                {result?.description && (
                  <div
                    className="p-4 rounded-xl text-left"
                    style={{
                      backgroundColor: `${result.color_code || '#1cb0f6'}10`,
                      color: `${result.color_code || '#1cb0f6'}800`,
                    }}
                  >
                    <p className="leading-relaxed">{result.description}</p>
                  </div>
                )}

                {result?.recommendation && (
                  <div className="p-4 rounded-xl bg-bee/20 text-ink text-left">
                    <p className="font-medium text-sm mb-1">คำแนะนำ:</p>
                    <p className="leading-relaxed">{result.recommendation}</p>
                  </div>
                )}

                {savedNote && (
                  <div className="p-3 rounded-xl bg-macaw/10 text-macaw text-sm text-left font-medium border border-macaw/30">
                    {savedNote}
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-3">
              {assessments.length > 1 && (
                <button
                  onClick={handleBackToList}
                  className="w-full py-3.5 bg-owl-soft hover:bg-owl-mint text-owl-pressed font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1"
                >
                  <Icon name="chevron-left" size={16} /> ทำแบบประเมินอื่น
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="mt-6 w-full btn-primary"
              >
                เข้าสู่พื้นที่ปลอดภัย (หน้าหลัก)
              </button>
            </div>
          </div>
        )}

        {/* แถบนำทางล่างแบบลอย (Sticky) — ใช้สะดวกด้วยนิ้วบนมือถือ */}
        {!isSubmitted && (
          <div
            className="sticky bottom-0 z-30 -mx-4 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-canvas via-canvas/95 to-transparent"
          >
            <div className="bg-white rounded-2xl border border-hairline shadow-[0_-4px_16px_rgba(0,0,0,0.06)] p-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  let target = 0;
                  for (let i = questions.length - 1; i >= 0; i--) {
                    if (isQAnswered(questions[i], i)) { target = i; break; }
                  }
                  scrollToQuestion(target);
                }}
                className="tap-target w-11 h-11 shrink-0 rounded-xl bg-owl-soft text-owl-pressed hover:bg-owl-mint transition-colors"
                aria-label="ย้อนกลับข้อก่อนหน้า"
              >
                <Icon name="chevron-left" size={20} />
              </button>

              <div className="flex-1 min-w-0" aria-live="polite">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5 gap-2">
                  <span className="text-body-muted">ตอบแล้ว {answeredCount}/{requiredTotal}</span>
                  <span className="text-owl-pressed">{progressPct}%</span>
                </div>
                <div className="h-2 bg-hairline rounded-full overflow-hidden">
                  <div
                    className="h-full bg-owl rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={calculateResult}
                disabled={!isAllAnswered}
                className="shrink-0 min-h-[46px] px-5 rounded-xl font-bold text-sm transition-all active:scale-95 bg-owl text-white shadow-lip-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ดูผลประเมิน
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}