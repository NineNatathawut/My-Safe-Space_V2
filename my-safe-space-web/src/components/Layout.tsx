import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePodcastPlayer } from '../contexts/PodcastPlayerContext';
import NotificationBell from './NotificationBell';
import UserDropdown from './UserDropdown';
import OnboardingWelcomeModal from './OnboardingWelcomeModal';
import { OwlLogo, HomeLogo, Icon } from './Icon';
import mascot from '../assets/cartoons/cartoon-4.png';

const NAV_ITEMS = [
  { to: '/', label: 'หน้าหลัก' },
  { to: '/feed', label: 'ลานสายลม' },
  { to: '/resources', label: 'คลังความรู้' },
  { to: '/assessment', label: 'แบบประเมิน' },
];

export default function Layout({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const { current } = usePodcastPlayer();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-din">
      {/* ① แถบสายด่วน (คงสีแดงเน้นฉุกเฉิน) */}
      <div className="bg-cardinal text-white text-xs md:text-sm py-1.5">
        <div className="container mx-auto max-w-6xl flex flex-wrap items-center justify-center md:justify-between gap-x-4 gap-y-1 px-4">
          <span className="hidden md:flex items-center gap-1.5">
            <HomeLogo className="w-4 h-4" />
            บ้านพักใจ - พื้นที่ปลอดภัยสำหรับทุกความรู้สึก
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <a href="tel:1323" className="bg-white text-cardinal font-bold px-3 py-0.5 rounded-full shadow-sm hover:bg-red-50 transition-colors">
              <span className="inline-flex items-center gap-1"><Icon name="phone" size={12} /> 1323 สุขภาพจิต</span>
            </a>
            <a href="tel:1669" className="bg-white text-cardinal font-bold px-3 py-0.5 rounded-full shadow-sm hover:bg-red-50 transition-colors">
              <span className="inline-flex items-center gap-1"><Icon name="phone" size={12} /> 1669 ฉุกเฉิน</span>
            </a>
            <a href="tel:1385" className="bg-white text-cardinal font-bold px-3 py-0.5 rounded-full shadow-sm hover:bg-red-50 transition-colors">
              <span className="inline-flex items-center gap-1"><Icon name="phone" size={12} /> 1385 ป้องกันฆ่าตัวตาย</span>
            </a>
            <span className="hidden lg:inline opacity-90">ให้บริการฟรี 24 ชม.</span>
          </div>
        </div>
      </div>

      {/* ② Header + Nav สไตล์ Duolingo */}
      <header ref={menuRef} className="bg-white sticky top-0 z-40" style={{ boxShadow: '0 2px 3px 0 rgba(0,0,0,0.06)' }}>
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex justify-between items-center h-[70px] gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <OwlLogo className="w-9 h-9 transition-transform group-hover:scale-105" />
              <span className="flex flex-col leading-tight">
                <span className="font-feather text-xl font-black text-ink group-hover:text-ink-deep transition-colors leading-none">
                  บ้านพักใจ
                </span>
                <span className="text-[11px] tracking-btn text-owl uppercase font-bold">
                  My Safe Space
                </span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-owl bg-owl-soft'
                        : 'text-body-strong hover:text-owl hover:bg-owl-soft'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <img
                          src={mascot}
                          alt=""
                          aria-hidden="true"
                          className="absolute left-1/2 -top-[18px] w-9 h-9 object-contain drop-shadow-md animate-mascot-bob pointer-events-none"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin-dashboard"
                  className={({ isActive }) =>
                    `relative px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-owl bg-owl-soft'
                        : 'text-body-strong hover:text-owl hover:bg-owl-soft'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="settings" size={15} /> แอดมิน
                      </span>
                      {isActive && (
                        <img
                          src={mascot}
                          alt=""
                          aria-hidden="true"
                          className="absolute left-1/2 -top-[18px] w-9 h-9 object-contain drop-shadow-md animate-mascot-bob pointer-events-none"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label="เปิดเมนู"
                aria-expanded={menuOpen}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-body-strong hover:bg-owl-soft hover:text-owl transition"
              >
                <Icon name={menuOpen ? 'x' : 'menu'} size={22} />
              </button>
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <UserDropdown />
                </>
              ) : (
                <Link to="/login" className="btn-primary text-sm min-h-[44px] py-2.5 px-5">
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white border-t border-hairline shadow-lg z-[100] animate-fadeIn">
            <nav className="container mx-auto max-w-6xl px-4 py-2 flex flex-col text-sm font-semibold">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'text-owl bg-owl-soft'
                        : 'text-body-strong hover:text-owl hover:bg-owl-soft'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin-dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'text-owl bg-owl-soft'
                        : 'text-body-strong hover:text-owl hover:bg-owl-soft'
                    }`
                  }
                >
                  <Icon name="settings" size={15} /> แอดมิน
                </NavLink>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ③ พื้นที่เนื้อหาหลัก */}
      <main className={`flex-1 container mx-auto max-w-6xl p-4 mt-4 ${current ? 'pb-24' : ''}`}>
        {children || <Outlet />}
      </main>

 
      <OnboardingWelcomeModal />
    </div>
  );
}