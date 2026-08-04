import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDeterministicAvatar } from '../utils/getDeterministicAvatar';

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nickname = user?.nickname || localStorage.getItem('alias_name') || 'ผู้ใช้';
  const avatarEmoji = getDeterministicAvatar(nickname);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition px-2 py-1 rounded-lg hover:bg-gray-100"
      >
        <span className="w-7 h-7 bg-gradient-to-tr from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-xs shadow-sm">
          {avatarEmoji}
        </span>
        <span className="hidden sm:inline truncate max-w-[120px]">
          {nickname}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-[100] animate-fadeIn">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800 truncate">{nickname}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>

          <Link
            to="/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <span className="text-lg">👤</span>
            โปรไฟล์ของฉัน
          </Link>

          <Link
            to="/assessment"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <span className="text-lg">📊</span>
            ทำแบบประเมินสุขภาพใจ
          </Link>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <span className="text-lg">🚪</span>
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
