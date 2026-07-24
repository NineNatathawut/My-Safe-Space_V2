import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ADJECTIVES = ['ใจฟู', 'สีพาสเทล', 'ใจเย็น', 'หวานน้อย', 'ยิ้มแฉ่ง', 'กอดอุ่น', 'แสนดี', 'ละมุน'];
const NOUNS = ['แมวน้อย', 'ก้อนเมฆ', 'คาปิบาร่า', 'ชานม', 'ทานตะวัน', 'ใบไม้', 'ดวงดาว', 'กระต่าย'];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [nickname, setNickname] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success && result.user) {
      if (result.user.role === 'admin') {
        setIsLoading(false);
        navigate('/resources');
        return;
      }

      const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      const generatedName = `${randomNoun}${randomAdj}`;

      setNickname(generatedName);
      localStorage.setItem('alias_name', generatedName);

      setShowPopup(true);

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setError(result.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    if (!showPopup) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      
      {/* 🔴 ฟอร์มเข้าสู่ระบบปกติ */}
      <div className={`w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-100 transition-opacity duration-300 ${showPopup ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <h2 className="text-2xl font-bold text-center mb-6">เข้าสู่ระบบ</h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">อีเมล</label>
            <input
              type="email"
              className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-purple-300 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-purple-300 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 text-white font-medium py-3 rounded-xl hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-purple-600 hover:underline font-medium">
            สมัครสมาชิก
          </Link>
        </p>
      </div>

      {/* 🔴 Pop-up สุ่มนามแฝง (จะโชว์เฉพาะ User ทั่วไปเมื่อ showPopup เป็น true) */}
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-purple-100 text-center animate-bounce-in max-w-sm w-full mx-4">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">ยินดีต้อนรับกลับมา!</h3>
            <p className="text-gray-500 text-sm mb-6">วันนี้บ้านพักใจขอเรียกคุณว่า...</p>
            
            <div className="bg-purple-50 rounded-2xl p-4 mb-6 border border-purple-100">
              <span className="text-2xl font-bold text-purple-600">
                {nickname}
              </span>
            </div>
            
            <p className="text-xs text-purple-400 animate-pulse">
              กำลังพาไปหน้าหลัก.. 🚀
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