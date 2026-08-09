import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleGoogleRegister = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถสมัครสมาชิกด้วย Google ได้');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);

    try {
      // ปรับ URL '/auth/register' ให้ตรงกับ Endpoint ฝั่ง Backend
      await api.post('/api/auth/register', {
        email,
        password,
      });

      alert('สมัครสมาชิกสำเร็จ! กรุณาล็อกอินเข้าสู่ระบบ');
      navigate('/login'); // สมัครเสร็จแล้วพาไปหน้าล็อกอิน
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-sm card p-6">
        <h2 className="text-2xl font-black text-center text-ink mb-6">
          สมัครสมาชิก
        </h2>

        {error && (
          <div className="bg-cardinal/10 text-cardinal text-sm p-3 rounded-lg mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">
              อีเมล
            </label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              required
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-hairline" />
          <span className="text-sm text-body-soft">หรือ</span>
          <div className="flex-1 h-px bg-hairline" />
        </div>

        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 btn-secondary disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          สมัครสมาชิกด้วย Google
        </button>

        <p className="mt-4 text-center text-sm text-body-muted font-medium">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-owl-pressed hover:underline font-bold">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}