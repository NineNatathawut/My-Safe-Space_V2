import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchOnboardingAssessment } from '../services/assessmentService';
import { OwlLogo, Icon } from './Icon';

const HIDE_KEY = 'onboarding_welcome_hidden';

export default function OnboardingWelcomeModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [planning, setPlanning] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(HIDE_KEY) === '1');

  const canShow =
    isAuthenticated &&
    !!user &&
    !user.onboarding?.has_completed_onboarding &&
    !dismissed &&
    location.pathname !== '/assessment';

  if (!canShow) return null;

  const handleClose = () => {
    sessionStorage.setItem(HIDE_KEY, '1');
    setDismissed(true);
  };

  const handleStart = async () => {
    setPlanning(true);
    const recommended = await fetchOnboardingAssessment();
    setPlanning(false);
    if (recommended?.id) {
      navigate(`/assessment?id=${recommended.id}&onboarding=1`);
    } else {
      navigate('/assessment');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-7 md:p-9 text-center shadow-2xl relative border-t-4 border-owl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="ปิด"
          className="absolute top-3 right-3 w-9 h-9 bg-owl-soft hover:bg-owl-mint rounded-full flex items-center justify-center text-body-soft hover:text-ink transition-colors"
        >
          <Icon name="x" size={16} />
        </button>

        <div className="flex justify-center mb-4">
          <OwlLogo className="w-20 h-20" />
        </div>

        <h2 className="font-feather text-2xl md:text-3xl font-black text-ink leading-tight">
          ยินดีต้อนรับสู่บ้านพักใจ
        </h2>
        <p className="text-body-muted font-medium text-sm md:text-base mt-3 leading-relaxed">
          ก่อนเริ่มใช้งาน ลองทำ <span className="text-owl-pressed font-bold">เช็คอินสุขภาพใจครั้งแรก</span> สั้น ๆ
          ใช้เวลาไม่กี่นาที — ระบบจะเก็บผลไว้วัดความเครียดของคุณย้อนหลังในหน้าโปรไฟล์
        </p>

        <div className="text-left bg-owl-soft/40 rounded-2xl p-4 mt-5 border border-owl-mint space-y-2">
          <p className="flex items-start gap-2.5 text-sm text-body-strong font-medium">
            <Icon name="chart" size={18} className="text-owl shrink-0 mt-0.5" />
            เห็นกราฟพัฒนาการสุขภาพใจและคะแนนย้อนหลัง
          </p>
          <p className="flex items-start gap-2.5 text-sm text-body-strong font-medium">
            <Icon name="sparkles" size={18} className="text-owl shrink-0 mt-0.5" />
            แบบประเมินทั่วไปอื่น ๆ จะไม่ถูกบันทึก ผลแสดงจบที่หน้า
          </p>
          <p className="flex items-start gap-2.5 text-sm text-body-strong font-medium">
            <Icon name="shield" size={18} className="text-owl shrink-0 mt-0.5" />
            ข้อมูลเป็นความลับ เพ้นของคุณคนเดียว
          </p>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={planning}
          className="btn-primary w-full py-3.5 mt-6 text-base justify-center disabled:opacity-50"
        >
          {planning ? 'กำลังเตรียมแบบประเมิน...' : 'เริ่มเช็คอินครั้งแรก'}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="mt-3 text-sm text-body-muted hover:text-ink font-medium transition-colors"
        >
          ข้ามก่อน (ทำภายหลังได้)
        </button>
      </div>
    </div>
  );
}