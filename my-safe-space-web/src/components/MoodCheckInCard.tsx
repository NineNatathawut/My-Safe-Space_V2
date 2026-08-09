import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from './Icon';

const DAYS_MS = 1000 * 60 * 60 * 24;
const DAYS_UNTIL_REMINDER = 14;

function daysSince(dateStr?: string | null): number {
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - then) / DAYS_MS));
}

export default function MoodCheckInCard() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || isAdmin) return null;

  const onboarding = user?.onboarding;
  const hasCompleted = !!onboarding?.has_completed_onboarding;
  const severity = onboarding?.last_severity || 'normal';

  // ① ยังไม่เคยทำครั้งแรก → ชวนทำ baseline
  if (!hasCompleted) {
    return (
      <section className="card p-5 md:p-6 flex items-center gap-4 border-l-4 border-l-owl">
        <span className="w-12 h-12 bg-owl-soft text-owl-pressed rounded-2xl flex items-center justify-center shrink-0">
          <Icon name="chart" size={26} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-feather font-extrabold text-ink">เช็คอินสุขภาพใจครั้งแรก</h3>
          <p className="text-sm text-body-muted font-medium mt-0.5">
            ทำแบบประเมินสั้น ๆ ตั้ง Baseline แล้วดูพัฒนาการความเครียดของคุณย้อนหลังในโปรไฟล์
          </p>
        </div>
        <Link to="/assessment" className="btn-primary text-sm shrink-0">
          เริ่มเช็คอิน
        </Link>
      </section>
    );
  }

  // ระดับวิกฤต / ค่อนข้างมาก → การ์ดทางด่วน (สำคัญที่สุด แสดงเสมอ)
  if (severity === 'severe' || severity === 'critical' || severity === 'extremely_severe') {
    return (
      <section className="p-5 md:p-6 rounded-2xl bg-cardinal/5 border-2 border-cardinal/40">
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
          <span className="w-12 h-12 bg-cardinal text-white rounded-2xl flex items-center justify-center shrink-0">
            <Icon name="alert" size={26} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-feather font-extrabold text-ink text-base">
              {severity === 'critical' || severity === 'extremely_severe' ? 'ผลล่าสุดอยู่ในระดับวิกฤต' : 'ผลล่าสุดค่อนข้างมาก'}
            </h3>
            <p className="text-sm text-body-muted font-medium mt-0.5">
              ไม่ต้องเจอกับลำพังเลย — พูดคุยกับคนที่พร้อมฟังได้เลยตอนนี้
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <a href="tel:1323" className="flex items-center justify-center gap-2 bg-white border border-hairline hover:border-owl-mint rounded-xl py-3 px-4 font-bold text-sm text-ink transition-colors">
            <Icon name="phone" size={16} className="text-cardinal" /> 1323 สุขภาพจิต
          </a>
          <a href="tel:1669" className="flex items-center justify-center gap-2 bg-white border border-hairline hover:border-owl-mint rounded-xl py-3 px-4 font-bold text-sm text-ink transition-colors">
            <Icon name="phone" size={16} className="text-cardinal" /> 1669 ฉุกเฉิน
          </a>
          <Link to="/resources" className="flex items-center justify-center gap-2 bg-white border border-hairline hover:border-owl-mint rounded-xl py-3 px-4 font-bold text-sm text-ink transition-colors">
            <Icon name="headphones" size={16} className="text-owl-pressed" /> ฟังพอดแคสต์พักใจ
          </Link>
        </div>
      </section>
    );
  }

  // ผ่านไป 2 สัปดาห์แล้ว → สะกิดอ่อนโยน
  const elapsed = daysSince(onboarding?.last_assessed_at);
  if (elapsed < DAYS_UNTIL_REMINDER) return null;

  return (
    <section className="p-5 md:p-6 rounded-2xl bg-owl-soft/40 border border-owl-mint flex items-center gap-4">
      <span className="w-12 h-12 bg-owl text-white rounded-2xl flex items-center justify-center shrink-0">
        <Icon name="heart" size={26} />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="font-feather font-extrabold text-ink">หายไป {elapsed} วัน ใจวันนี้เป็นยังไงบ้าง?</h3>
        <p className="text-sm text-body-muted font-medium mt-0.5">
          ทำเช็คอินสั้น ๆ ครั้งต่อไป แล้วดูพัฒนาการความเครียดของคุณได้ในโปรไฟล์
        </p>
      </div>
      <Link to="/assessment" className="btn-primary text-sm shrink-0">
        ลองเช็คอิน
      </Link>
    </section>
  );
}