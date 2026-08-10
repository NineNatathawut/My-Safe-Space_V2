import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OwlLogo } from '../components/Icon';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isWelcomeVisible = !!user && !authLoading && user.role !== 'admin';
  const alias = localStorage.getItem('alias_name') || 'ผู้ใช้ไร้นาม';

  useEffect(() => {
    if (!user || authLoading) return;

    if (user.role === 'admin') {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);

    if (!(result.success && result.user)) {
      setError(result.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex relative">
      
      {/* 🔴 ฟอร์มเข้าสู่ระบบปกติ */}
      <div className={`m-auto w-full max-w-md p-8 card transition-opacity duration-300 ${isWelcomeVisible ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <h2 className="text-2xl font-black text-center mb-6 text-ink">เข้าสู่ระบบ</h2>
        
        {error && (
          <div className="bg-cardinal/10 text-cardinal p-3 rounded-lg text-sm mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">อีเมล</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">รหัสผ่าน</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-hairline" />
          <span className="text-sm text-body-soft">หรือ</span>
          <div className="flex-1 h-px bg-hairline" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 btn-secondary disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>

        <p className="text-center text-sm text-body-muted mt-6 font-medium">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-owl-pressed hover:underline font-bold">
            สมัครสมาชิก
          </Link>
        </p>
      </div>

      {/* Pop-up สุ่มนามแฝง */}
      {isWelcomeVisible && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="card p-8 rounded-3xl text-center animate-bounce-in max-w-sm w-full mx-4">
            <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-4">
              <OwlLogo className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-ink mb-2">ยินดีต้อนรับกลับมา!</h3>
            <p className="text-body-muted text-sm mb-6 font-medium">วันนี้บ้านพักใจขอเรียกคุณว่า...</p>
            
            <div className="bg-owl-soft rounded-2xl p-4 mb-6 border border-owl-mint">
              <span className="text-2xl font-black text-owl-pressed">
                {alias}
              </span>
            </div>
            
            <p className="text-xs text-body-soft animate-pulse">
              กำลังพาไปหน้าหลัก..
            </p>
          </div>
        </div>
      )}

      {/* 🎨 CSS Animation สำหรับ Pop-up */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
      
    </div>
  );
}