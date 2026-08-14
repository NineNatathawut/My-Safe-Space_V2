import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyAssessmentHistory } from '../services/assessmentService';
import type { AssessmentSubmission } from '../types/assessment';
import { Icon } from './Icon';

const SEVERITY_STYLES: Record<string, { chip: string; label: string; hex: string }> = {
  normal: { chip: 'bg-macaw/10 text-macaw', label: 'ปกติ', hex: '#1CB0F6' },
  mild: { chip: 'bg-sky-100 text-sky-600', label: 'เล็กน้อย', hex: '#38BDF8' },
  moderate: { chip: 'bg-bee/15 text-ink', label: 'ปานกลาง', hex: '#FFC800' },
  severe: { chip: 'bg-fox/10 text-fox', label: 'ค่อนข้างมาก', hex: '#FF9600' },
  critical: { chip: 'bg-cardinal/10 text-cardinal', label: 'วิกฤต', hex: '#FF4B4B' },
  extremely_severe: { chip: 'bg-cardinal/10 text-cardinal', label: 'รุนแรงมาก', hex: '#FF4B4B' },
};

const DIMENSION_LABELS: Record<string, string> = {
  depression: 'ซึมเศร้า',
  anxiety: 'วิตกกังวล',
  stress: 'เครียด',
};

type MetricKey = 'overall' | 'st5' | 'depression' | 'anxiety' | 'stress';

const METRIC_ORDER: MetricKey[] = ['overall', 'st5', 'depression', 'anxiety', 'stress'];

const METRIC_LABELS: Record<MetricKey, string> = {
  overall: 'ภาพรวม',
  st5: 'ST-5',
  depression: 'ซึมเศร้า',
  anxiety: 'วิตกกังวล',
  stress: 'เครียด',
};

const METRIC_COLORS: Record<MetricKey, string> = {
  overall: '#1CB0F6',
  st5: '#58CC02',
  depression: '#CE82FF',
  anxiety: '#FF9600',
  stress: '#FF4B4B',
};

const DASS_DIMENSIONS = ['depression', 'anxiety', 'stress'] as const;

const DASS_LABELS: Record<string, string> = {
  depression: 'ภาวะซึมเศร้า',
  anxiety: 'ความวิตกกังวล',
  stress: 'ความเครียด',
};

const DASS_SEVERITY_LABELS: Record<string, string> = {
  normal: 'ปกติ',
  mild: 'เล็กน้อย',
  moderate: 'ปานกลาง',
  severe: 'รุนแรง',
  extremely_severe: 'รุนแรงมาก',
};

const DASS_EMOJI: Record<string, Record<string, string>> = {
  depression: { normal: '😊', mild: '🙂', moderate: '😔', severe: '😢', extremely_severe: '😭' },
  anxiety: { normal: '😌', mild: '🙂', moderate: '😟', severe: '😨', extremely_severe: '😱' },
  stress: { normal: '😎', mild: '😅', moderate: '😣', severe: '😫', extremely_severe: '🤯' },
};

const DASS_PASTEL: Record<string, string> = {
  depression: '#EEF2FF',
  anxiety: '#E0F2FE',
  stress: '#FFF4E6',
};

interface TrendPoint {
  id: string;
  date: string;
  level: number;
  scoreRaw: number;
  maxScore: number;
  label: string;
  severity: string;
}

function dimensionLabel(dim: string): string {
  return DIMENSION_LABELS[dim] || dim;
}

function severityStyle(severity?: string) {
  return SEVERITY_STYLES[severity || ''] || SEVERITY_STYLES.normal;
}

function severityToLevel(sev?: string): number {
  switch (sev) {
    case 'critical':
    case 'extremely_severe':
      return 4;
    case 'severe':
      return 3;
    case 'moderate':
      return 2;
    case 'mild':
      return 1;
    case 'normal':
    default:
      return 0;
  }
}

function buildPoints(submissions: AssessmentSubmission[], key: MetricKey): TrendPoint[] {
  if (key === 'overall') {
    return submissions.map((s) => ({
      id: `${s.id}:overall`,
      date: s.created_at,
      level: severityToLevel(s.severity),
      scoreRaw: s.total_score,
      maxScore: s.max_score || 0,
      label: s.assessment_title || (s.assessment_code || '').toUpperCase(),
      severity: s.severity || 'normal',
    }));
  }

  if (key === 'st5') {
    return submissions
      .filter((s) => s.assessment_code === 'st5')
      .map((s) => ({
        id: `${s.id}:st5`,
        date: s.created_at,
        level: severityToLevel(s.severity),
        scoreRaw: s.total_score,
        maxScore: s.max_score || 0,
        label: s.assessment_title || 'ST-5',
        severity: s.severity || 'normal',
      }));
  }

  return submissions
    .filter((s) => (s.dimensions || []).some((d) => d.dimension === key))
    .map((s) => {
      const d = (s.dimensions || []).find((dd) => dd.dimension === key)!;
      return {
        id: `${s.id}:${key}`,
        date: s.created_at,
        level: severityToLevel(d.severity),
        scoreRaw: d.score,
        maxScore: d.max_score || 0,
        label: `${s.assessment_title || 'DASS-21'} · ${dimensionLabel(key)}`,
        severity: d.severity || 'normal',
      };
    });
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

function formatPopoverDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function smoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)] as [number, number];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)] as [number, number];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function TrendChart({
  points,
  metric,
  color,
}: {
  points: TrendPoint[];
  metric: MetricKey;
  color: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (sorted.length === 0) return null;

  const W = 320;
  const H = 170;
  const plotLeft = 30;
  const plotRight = W - 10;
  const plotTop = 8;
  const plotBottom = H - 22;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;
  const LEVEL_MAX = 4;

  const yFor = (level: number) => plotTop + (1 - level / LEVEL_MAX) * plotH;
  const xFor = (i: number) =>
    sorted.length === 1
      ? (plotLeft + plotRight) / 2
      : plotLeft + (i * plotW) / (sorted.length - 1);

  const coords = sorted.map((p, i) => [xFor(i), yFor(p.level)] as [number, number]);
  const n = sorted.length;
  const first = sorted[0];
  const baselineLevel = first.level;

  const linePath = smoothPath(coords);
  const areaPath =
    n > 1 ? `${linePath} L ${coords[n - 1][0]},${plotBottom} L ${coords[0][0]},${plotBottom} Z` : '';

  const yGrid1 = yFor(1);
  const yGrid2 = yFor(2);
  const b1 = yFor(1) - yFor(0);
  const b2 = yFor(2) - yFor(1);

  const labelIdx = new Set<number>();
  if (n <= 4) {
    for (let i = 0; i < n; i++) labelIdx.add(i);
  } else {
    labelIdx.add(0);
    labelIdx.add(Math.floor((n - 1) / 2));
    labelIdx.add(n - 1);
  }

  const selected = sorted.find((p) => p.id === selectedId);
  const selIdx = selected ? sorted.findIndex((p) => p.id === selectedId) : -1;

  const popW = 178;
  const popH = 78;
  let popX = 0;
  let popY = 0;
  if (selIdx >= 0) {
    const selX = coords[selIdx][0];
    const selY = coords[selIdx][1];
    popX = Math.max(plotLeft - 4, Math.min(W - popW - 6, selX - popW / 2));
    popY = selY - popH - 8;
    if (popY < plotTop) popY = Math.min(selY + 14, H - popH - 4);
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[320px] h-auto"
        role="img"
        aria-label={`กราฟแนวโน้มระดับผล${METRIC_LABELS[metric]}`}
      >
        <defs>
          <linearGradient id={`area-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
          <filter id="popdrop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#042c60" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* ── โซนระดับความเสี่ยง ── */}
        <rect x={plotLeft} y={yGrid1} width={plotW} height={b1} fill="rgba(88,204,2,0.07)" />
        <rect x={plotLeft} y={yGrid2} width={plotW} height={b2} fill="rgba(255,200,0,0.09)" />
        <rect x={plotLeft} y={plotTop} width={plotW} height={yGrid2 - plotTop} fill="rgba(255,75,75,0.09)" />

        <text x={plotLeft + 6} y={(plotBottom + yGrid1) / 2 + 3} fontSize="8" fill="#9AA7B8">
          ปกติ
        </text>
        <text x={plotLeft + 6} y={(yGrid1 + yGrid2) / 2 + 3} fontSize="8" fill="#9AA7B8">
          ปานกลาง
        </text>
        <text x={plotLeft + 6} y={(plotTop + yGrid2) / 2 + 3} fontSize="8" fill="#9AA7B8">
          รุนแรง
        </text>

        {/* ── เส้นกริดระดับ 0–4 + ตัวเลขแกน Y ── */}
        {[0, 1, 2, 3, 4].map((lv) => {
          const y = yFor(lv);
          return (
            <g key={lv}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={y}
                y2={y}
                stroke="#EEF1F5"
                strokeWidth="1"
              />
              <text
                x={plotLeft - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="8"
                fill="#AEB8C6"
              >
                {lv}
              </text>
            </g>
          );
        })}

        {/* ── เส้นประ baseline = ระดับครั้งแรก ── */}
        <line
          x1={plotLeft}
          x2={plotRight}
          y1={yFor(baselineLevel)}
          y2={yFor(baselineLevel)}
          stroke="#94A3B8"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <text
          x={plotRight}
          y={yFor(baselineLevel) - 4}
          textAnchor="end"
          fontSize="8"
          fill="#94A3B8"
        >
          ครั้งแรก
        </text>

        {n > 1 && <path d={areaPath} fill={`url(#area-${metric})`} />}

        {n > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* ── จุดข้อมูล + พื้นที่แตะ ── */}
        {sorted.map((p, i) => (
          <g
            key={p.id}
            className="cursor-pointer"
            onClick={() =>
              setSelectedId((cur) => (cur === p.id ? null : p.id))
            }
          >
            <circle cx={coords[i][0]} cy={coords[i][1]} r="11" fill="transparent" />
            {selectedId === p.id && (
              <circle
                cx={coords[i][0]}
                cy={coords[i][1]}
                r="9"
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
            )}
            <circle
              cx={coords[i][0]}
              cy={coords[i][1]}
              r={selectedId === p.id ? 5 : 4}
              fill="white"
              stroke={severityStyle(p.severity).hex}
              strokeWidth={selectedId === p.id ? 3 : 2.5}
            />
          </g>
        ))}

        {/* ── ป๊อปอัปแตะจุด ── */}
        {selected && selIdx >= 0 && (
          <g transform={`translate(${popX}, ${popY})`}>
            <rect
              width={popW}
              height={popH}
              rx="10"
              fill="white"
              stroke="#E5E5E5"
              filter="url(#popdrop)"
            />
            <g
              className="cursor-pointer"
              pointerEvents="all"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(null);
              }}
            >
              <circle cx={popW - 13} cy={13} r="8" fill="#F1F5F9" />
              <text
                x={popW - 13}
                y={16}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#94A3B8"
              >
                ✕
              </text>
            </g>
            <text x={12} y={16} fontSize="10" fontWeight="800" fill="#042C60">
              {formatPopoverDate(selected.date)}
            </text>
            <text x={12} y={33} fontSize="9" fill="#777777">
              {selected.label}
            </text>
            <text
              x={12}
              y={51}
              fontSize="10"
              fontWeight="800"
              fill={severityStyle(selected.severity).hex}
            >
              {selected.maxScore > 0
                ? `${selected.scoreRaw}/${selected.maxScore}`
                : `${selected.scoreRaw} คะแนน`}{' '}
              · {severityStyle(selected.severity).label}
            </text>
          </g>
        )}

        {/* ── วันที่บนแกน X (แสดงเฉพาะจุดสำคัญ) ── */}
        {sorted.map((p, i) =>
          labelIdx.has(i) ? (
            <text
              key={`label-${p.id}`}
              x={coords[i][0]}
              y={H - 4}
              textAnchor="middle"
              fontSize="9"
              fill="#AEB8C6"
            >
              {formatDate(p.date)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

export default function AssessmentHistory() {
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('overall');
  const [dassOpen, setDassOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    fetchMyAssessmentHistory().then((res) => {
      if (!mounted) return;
      setSubmissions(res.submissions);
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

  const visibleMetrics = hasData
    ? METRIC_ORDER.filter((k) => buildPoints(submissions, k).length > 0)
    : [];

  const chartPoints = buildPoints(submissions, activeMetric).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints[chartPoints.length - 1];
  const chartColor = METRIC_COLORS[activeMetric];

  const latestDass = submissions.find(
    (s) =>
      s.assessment_code === 'dass21' ||
      (s.dimensions || []).some((d) => (DASS_DIMENSIONS as readonly string[]).includes(d.dimension))
  ) || null;
  const dassDims = (latestDass?.dimensions || [])
    .filter((d) => (DASS_DIMENSIONS as readonly string[]).includes(d.dimension))
    .sort(
      (a, b) =>
        DASS_DIMENSIONS.indexOf(a.dimension as (typeof DASS_DIMENSIONS)[number]) -
        DASS_DIMENSIONS.indexOf(b.dimension as (typeof DASS_DIMENSIONS)[number])
    );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-black text-ink">ประวัติผลการประเมินของฉัน</h2>
        <p className="text-sm text-body-muted mt-1 font-medium">
          ติดตามพัฒนาการสุขภาพใจของคุณย้อนหลังได้ที่นี่
        </p>
      </div>

      {/* ── สรุปสถานะ (ตามแท็บที่เลือก) ── */}
      {hasData && chartPoints.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <div className="text-xs text-body-muted font-medium">ผลครั้งแรก (Baseline)</div>
            <div className="text-2xl font-black text-ink mt-1">{firstPoint?.scoreRaw ?? '-'}</div>
            <div className="text-xs text-body-soft font-medium">
              {METRIC_LABELS[activeMetric]}
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xs text-body-muted font-medium">ล่าสุด</div>
            <div className="text-2xl font-black text-ink mt-1">{lastPoint?.scoreRaw ?? '-'}</div>
            <div className="text-xs text-body-soft font-medium">
              {METRIC_LABELS[activeMetric]}
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xs text-body-muted font-medium">ผลล่าสุด</div>
            <div className="mt-1 flex justify-center">
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${severityStyle(lastPoint?.severity).chip}`}
              >
                {severityStyle(lastPoint?.severity).label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── กราฟแนวโน้ม ── */}
      {hasData && chartPoints.length > 0 && (
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-bold text-ink mb-3">
            <Icon name="chart" size={18} className="text-owl" />
            แนวโน้ม{METRIC_LABELS[activeMetric]}
            <span className="text-xs text-body-soft font-medium">(เส้นประ = ระดับครั้งแรก)</span>
          </h3>

          {/* แท็บกรองเมตริก */}
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            style={{ scrollbarWidth: 'none' }}
          >
            {visibleMetrics.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setActiveMetric(k)}
                className={`shrink-0 text-sm font-bold px-3.5 py-1.5 rounded-full border transition-colors ${
                  activeMetric === k
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-body-muted border-hairline hover:border-body-soft'
                }`}
              >
                {METRIC_LABELS[k]}
              </button>
            ))}
          </div>

          {/* คำอธิบายโซนสี */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-[11px] font-semibold text-body-muted">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded"
                style={{ backgroundColor: 'rgba(88,204,2,0.55)' }}
              />
              ปกติ
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded"
                style={{ backgroundColor: 'rgba(255,200,0,0.6)' }}
              />
              ปานกลาง
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded"
                style={{ backgroundColor: 'rgba(255,75,75,0.6)' }}
              />
              รุนแรง
            </span>
          </div>

          <TrendChart points={chartPoints} metric={activeMetric} color={chartColor} />
        </div>
      )}

      {/* ── แสดงข้อความเมื่อยังไม่มีผลประเมิน ── */}
      {!hasData && (
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
      )}

      {/* ── การ์ด DASS-21 ล่าสุด ── */}
      {latestDass && dassDims.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <span className="text-xl">🧠</span> ผล DASS-21 ล่าสุด
            </h3>
            <span className="text-xs text-body-soft font-medium">
              {latestDass.created_at ? formatFullDate(latestDass.created_at) : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dassDims.map((dim) => {
              const hex = dim.color_code || '#1cb0f6';
              const label = DASS_LABELS[dim.dimension] || dimensionLabel(dim.dimension);
              const sevLabel =
                DASS_SEVERITY_LABELS[dim.severity || 'normal'] ||
                severityStyle(dim.severity).label;
              const emoji =
                DASS_EMOJI[dim.dimension]?.[dim.severity || 'normal'] ||
                DASS_EMOJI[dim.dimension]?.normal ||
                '🧩';
              const pastel = DASS_PASTEL[dim.dimension] || '#F5F5F5';
              const open = !!dassOpen[dim.dimension];

              return (
                <div
                  key={dim.dimension}
                  className="card p-5 flex flex-col text-center rounded-2xl"
                >
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-4xl"
                    style={{ backgroundColor: pastel }}
                  >
                    {emoji}
                  </div>

                  <div className="mt-3 text-sm font-bold text-body-strong">{label}</div>

                  <div className="mt-1.5">
                    <span className="text-4xl font-black leading-none" style={{ color: hex }}>
                      {dim.score}
                    </span>
                    {dim.max_score > 0 && (
                      <span className="text-sm text-body-soft font-bold">/{dim.max_score}</span>
                    )}
                  </div>

                  <div className="mt-2.5 flex justify-center">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${hex}1A`, color: hex }}
                    >
                      {emoji} {sevLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDassOpen((prev) => ({ ...prev, [dim.dimension]: !prev[dim.dimension] }))
                    }
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-macaw text-macaw font-bold text-sm transition-colors hover:bg-macaw/10 active:bg-macaw/20"
                  >
                    📖 คำแนะนำ {open ? '∧' : '∨'}
                  </button>

                  {open && (
                    <div className="mt-2.5 p-3 rounded-xl bg-macaw/5 border border-macaw/30 text-sm text-body-strong leading-relaxed text-left animate-fadeIn">
                      {dim.recommendation || dim.description || 'ดูแลตัวเองต่อเนื่องและพักผ่อนให้เพียงพอ'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasData && (
        <p className="text-center text-xs text-body-soft font-medium">
          💡 ข้อมูลนี้เป็นส่วนตัวของคุณเท่านั้น เราจะนำไปใช้ติดตามสุขภาพใจและให้คำแนะนำที่เหมาะกับคุณ
        </p>
      )}
    </div>
  );
}