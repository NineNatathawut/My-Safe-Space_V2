import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success && result.user) {
      if (result.user.role === 'admin') {
        navigate('/profile');
      } else {
        setError('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบจัดการหลังบ้าน');
      }
    } else {
      setError(result.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink-deep flex items-center justify-center p-4 font-sans">
      <div className="card p-8 w-full max-w-md rounded-3xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-owl-soft mx-auto rounded-full flex items-center justify-center text-owl-pressed mb-4">
            <Icon name="shield" size={28} />
          </div>
          <h1 className="text-2xl font-black text-ink">ระบบจัดการหลังบ้าน</h1>
          <p className="text-body-muted mt-1 font-medium">บ้านพักใจ (Admin Portal)</p>
        </div>

        {error && (
          <div className="bg-cardinal/10 text-cardinal p-3 rounded-xl text-sm text-center mb-6 border border-cardinal/30 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">อีเมลแอดมิน</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="admin@banpakjai.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-body-strong mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary mt-4"
          >
            {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
