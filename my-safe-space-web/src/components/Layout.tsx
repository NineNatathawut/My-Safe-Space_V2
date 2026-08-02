import type { ReactNode } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePodcastPlayer } from '../contexts/PodcastPlayerContext';
import NotificationBell from './NotificationBell';
import UserDropdown from './UserDropdown';

export default function Layout({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const { current } = usePodcastPlayer();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition">
            บ้านพักใจ
          </Link>
          
          <nav className="flex items-center gap-4 text-sm md:text-base">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 transition">หน้าหลัก</Link>
            <Link to="/resources" className="text-gray-600 hover:text-purple-600 transition">ทรัพยากรเยียวยาใจ</Link>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin-dashboard" className="text-gray-600 hover:text-indigo-600 transition">🔧 แอดมิน</Link>
                )}
                <NotificationBell />
                <UserDropdown />
              </>
            ) : (
              <Link to="/login" className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition ml-2">
                เข้าสู่ระบบ
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* 🟢 พื้นที่เนื้อหาหลัก (ขยายตามจอ แต่ไม่เกิน 5xl) */}
      <main className={`flex-1 container mx-auto max-w-5xl p-4 mt-4 ${current ? 'pb-24' : ''}`}>
        {children || <Outlet />}
      </main>
    </div>
  );
}