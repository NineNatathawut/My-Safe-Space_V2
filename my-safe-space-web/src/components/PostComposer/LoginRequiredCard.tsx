import { Link } from 'react-router-dom';
import { Icon } from '../Icon';

export function LoginRequiredCard() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-5 animate-float-side">
        <Icon name="heart" size={26} />
      </div>
      <h3 className="font-feather text-xl md:text-2xl font-black text-ink mb-3 leading-snug">
        เข้าสู่ระบบเพื่อแบ่งปันเรื่องราวกับเพื่อน ๆ ในบ้านพักใจ
      </h3>
      <p className="text-body-muted text-sm font-medium mb-7 max-w-sm mx-auto leading-relaxed">
        เรื่องราวของคุณมีความหมาย และที่นี่พร้อมรับฟัง 🤍
      </p>
      <div className="flex flex-col items-center gap-4">
        <Link
          to="/login"
          state={{ from: '/feed', openComposer: true }}
          className="btn-primary px-8 py-3 inline-flex min-h-[48px] items-center"
        >
          เข้าสู่ระบบ
        </Link>
        <Link to="/register" className="text-owl-pressed hover:underline font-bold text-sm">
          ยังไม่มีบัญชี? สมัครสมาชิก
        </Link>
      </div>
    </div>
  );
}
