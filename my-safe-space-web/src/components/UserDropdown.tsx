import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDeterministicAvatar } from '../utils/getDeterministicAvatar';
import { Icon } from './Icon';

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
        className="flex items-center gap-2 text-body-strong hover:text-owl transition px-2 py-1 rounded-lg hover:bg-owl-soft"
      >
        <span className="w-7 h-7 bg-owl-soft rounded-full flex items-center justify-center text-xs shadow-sm ring-2 ring-owl-soft">
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
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-hairline py-2 z-[100] animate-fadeIn">
          <div className="px-4 py-3 border-b border-hairline">
            <p className="text-sm font-bold text-body-strong truncate">{nickname}</p>
            <p className="text-xs text-body-soft truncate">{user?.email}</p>
          </div>

          <Link
            to="/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-body-strong hover:bg-owl-soft/40 transition"
          >
            <Icon name="user" size={17} className="text-body-soft" />
            โปรไฟล์ของฉัน
          </Link>

          <div className="border-t border-hairline mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-cardinal hover:bg-cardinal/10 transition"
            >
              <Icon name="logout" size={17} />
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
