import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyAssessmentHistory } from '../services/assessmentService';
import type { AssessmentSubmission, DimensionResult, OnboardingInfo } from '../types/assessment';
import { Icon } from './Icon';

const SEVERITY_STYLES: Record<string, { chip: string; dot: string; label: string }> = {
  normal: { chip: 'bg-macaw/10 text-macaw', dot: 'bg-macaw', label: 'ปกติ' },
  mild: { chip: 'bg-sky-100 text-sky-600', dot: 'bg-sky-400', label: 'เล็กน้อย' },
  moderate: { chip: 'bg-bee/15 text-ink', dot: 'bg-bee', label: 'ปานกลาง' },
  severe: { chip: 'bg-fox/10 text-fox', dot: 'bg-fox', label: 'ค่อนข้างมาก' },
  critical: { chip: 'bg-cardinal/10 text-cardinal', dot: 'bg-cardinal', label: 'วิกฤต' },
  extremely_severe: { chip: 'bg-cardinal/10 text-cardinal', dot: 'bg-cardinal', label: 'รุนแรงมาก' },
};

const DIMENSION_LABELS: Record<string, string> = {
  depression: 'ซึมเศร้า',
  anxiety: 'วิตกกังวล',
  stress: 'เครียด',
};

function dimensionLabel(dim: string): string {
  return DIMENSION_LABELS[dim] || dim;
}

function severityStyle(severity?: string) {
  return SEVERITY_STYLES[severity || ''] || SEVERITY_STYLES.normal;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TrendChart({ submissions, baseline }: { submissions: AssessmentSubmission[]; baseline: number | null }) {
  const sorted = [...submissions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  if (sorted.length === 0) return null;

  const W = 280;
  const H = 120;
  const padX = 16;
  const padTop = 14;
  const padBottom = 18;

  const maxScore = Math.max(
    5,
    ...sorted.map((s) => Math.max(s.max_score || 0, s.total_score))
  );
  const max = Math.max(maxScore, baseline || 0);

  const xFor = (i: number) =>
    sorted.length === 1
      ? W / 2
      : padX + (i * (W - padX * 2)) / (sorted.length - 1);
  const yFor = (score: number) =>
    H - padBottom - (score / max) * (H - padTop - padBottom);

  const points = sorted.map((s, i) => `${xFor(i)},${yFor(s.total_score)}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[280px] h-auto"
        role="img"
        aria-label="กราฟแนวโน้มคะแนนประเมิน"
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={W - padX}
            y1={H - padBottom - f * (H - padTop - padBottom)}
            y2={H - padBottom - f * (H - padTop - padBottom)}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {baseline != null && (
          <line
            x1={padX}
            x2={W - padX}
            y1={yFor(baseline)}
            y2={yFor(baseline)}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
        )}

        {sorted.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#1CB0F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        <polygon
          points={`${padX},${H - padBottom} ${points} ${xFor(sorted.length - 1)},${H - padBottom}`}
          fill="rgba(28,176,246,0.08)"
        />

        {sorted.map((s, i) => (
          <circle
            key={s.id}
            cx={xFor(i)}
            cy={yFor(s.total_score)}
            r="4"
            fill="white"
            stroke={severityStyle(s.severity).dot}
            strokeWidth="2.5"
          />
        ))}

        {sorted.map((s, i) => (
          <text
            key={`label-${s.id}`}
            x={xFor(i)}
            y={H - 4}
            textAnchor="middle"
            fontSize="9"
            fill="#94A3B8"
          >
            {formatDate(s.created_at)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function AssessmentHistory() {
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [status, setStatus] = useState<OnboardingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchMyAssessmentHistory().then((res) => {
      if (!mounted) return;
      setSubmissions(res.submissions);
      setStatus(res.status);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-body-soft animate-pulse">
        กำลังโหลดประวัติผลประเมิน...
      </div>
    );
  }

  const hasData = submissions.length > 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-black text-ink">ประวัติผลการประเมินของฉัน</h2>
        <p className="text-sm text-body-muted mt-1 font-medium">
          ติดตามพัฒนาการสุขภาพใจของคุณย้อนหลังได้ที่นี่
        </p>
      </div>

      {/* ── สรุปสถานะ ── */}
      {hasData && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <div className="text-xs text-body-muted font-medium">ผลครั้งแรก (Baseline)</div>
            <div className="text-2xl font-black text-ink mt-1">
              {status?.baseline_score ?? submissions[submissions.length - 1]?.total_score ?? '-'}
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xs text-body-muted font-medium">ล่าสุด</div>
            <div className="text-2xl font-black text-ink mt-1">
              {submissions[0]?.total_score ?? '-'}
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xs text-body-muted font-medium">ผลล่าสุด</div>
            <div className="mt-1 flex justify-center">
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${severityStyle(submissions[0]?.severity).chip}`}>
                {severityStyle(submissions[0]?.severity).label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── กราฟแนวโน้ม ── */}
      {hasData && (
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-bold text-ink mb-4">
            <Icon name="chart" size={18} className="text-owl" />
            แนวโน้มคะแนน
            {status?.baseline_score != null && (
              <span className="text-xs text-body-soft font-medium">(เส้นประ = คะแนนครั้งแรก)</span>
            )}
          </h3>
          <TrendChart submissions={submissions} baseline={status?.baseline_score ?? null} />
        </div>
      )}

      {/* ── รายการประวัติ ── */}
      {!hasData ? (
        <div className="text-center py-10 bg-owl-soft/30 rounded-2xl border border-dashed border-owl-mint">
          <div className="w-14 h-14 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-3">
            <Icon name="chart" size={26} />
          </div>
          <h3 className="text-lg font-bold text-ink">ยังไม่มีประวัติการประเมิน</h3>
          <p className="text-body-muted text-sm mt-1 font-medium">
            เริ่มทำแบบประเมินมาตรฐาน (เช่น ST-5) แล้วระบบจะเก็บประวัติและสร้างกราฟให้คุณ
          </p>
          <Link to="/assessment" className="btn-primary text-sm mt-5 inline-flex">
            ไปทำแบบประเมินครั้งแรก
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => {
            const style = severityStyle(s.severity);
            const dims: DimensionResult[] = s.dimensions || [];
            return (
              <div
                key={s.id}
                className="bg-white p-5 rounded-2xl border border-hairline flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-ink">{s.assessment_title || 'แบบประเมิน'}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.chip}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-body-soft mt-1.5">{formatFullDate(s.created_at)}</p>
                  {s.rule_title && (
                    <p className="text-sm text-body-muted mt-1.5 font-medium">"{s.rule_title}"</p>
                  )}

                  {dims.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dims.map((d) => {
                        const st = severityStyle(d.severity);
                        return (
                          <span
                            key={d.dimension}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.chip}`}
                          >
                            {dimensionLabel(d.dimension)}: {d.score}/{d.max_score}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-black text-ink">{s.total_score}</div>
                  <div className="text-[10px] text-body-soft font-medium">คะแนน</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasData && (
        <p className="text-center text-xs text-body-soft font-medium">
          💡 ข้อมูลนี้เป็นส่วนตัวของคุณเท่านั้น เราจะนำไปใช้ติดตามสุขภาพใจและให้คำแนะนำที่เหมาะกับคุณ
        </p>
      )}
    </div>
  );
}