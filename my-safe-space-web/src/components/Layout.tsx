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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 🔝 Utility bar (สไตล์ UP - แถบบางด้านบน) */}
      <div className="bg-purple-800 text-white text-xs md:text-sm py-1.5">
        <div className="container mx-auto max-w-6xl flex justify-between items-center px-4">
          <span className="flex items-center gap-1.5">🕊️ บ้านพักใจ - พื้นที่ปลอดภัยสำหรับทุกความรู้สึก</span>
          <div className="flex items-center gap-4">
            <a href="tel:1323" className="hover:text-purple-200 transition-colors">☎️ สายด่วน 1323</a>
            <span className="hidden md:inline opacity-60">ให้บริการฟรี 24 ชม.</span>
          </div>
        </div>
      </div>

      {/* 🏛️ Header + Nav แนว megamenu สไตล์ UP (แบบผ่อนลง) */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex justify-between items-center h-16 gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-fuchsia-600 flex items-center justify-center text-white text-lg shadow-md shadow-purple-500/30">
                🏠
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-purple-700 group-hover:text-purple-800 transition-colors">บ้านพักใจ</span>
                <span className="text-[10px] tracking-widest text-slate-500 uppercase">My Safe Space</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link to="/" className="px-3 py-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium">หน้าหลัก</Link>
              <Link to="/feed" className="px-3 py-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium">ลานสายลม</Link>
              <Link to="/venting" className="px-3 py-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium">ระบายใจ</Link>
              <Link to="/assessment" className="px-3 py-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium">แบบประเมิน</Link>
              <Link to="/resources" className="px-3 py-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium">ทรัพยากร</Link>
              {isAdmin && (
                <Link to="/admin-dashboard" className="px-3 py-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium">🔧 แอดมิน</Link>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <UserDropdown />
                </>
              ) : (
                <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white rounded-xl font-medium text-sm shadow-md shadow-purple-500/20 transition-all active:scale-[0.98]">
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🟢 พื้นที่เนื้อหาหลัก (ขยายตามจอ แต่ไม่เกิน 6xl) */}
      <main className={`flex-1 container mx-auto max-w-6xl p-4 mt-4 ${current ? 'pb-24' : ''}`}>
        {children || <Outlet />}
      </main>

      {/* 🦶 Footer สไตล์ UP - sitemap หลายคอลัมน์ */}
      <footer className="mt-12 bg-white border-t border-slate-200">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-fuchsia-600 flex items-center justify-center text-white text-lg">🏠</span>
                <span className="text-lg font-bold text-purple-700">บ้านพักใจ</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                พื้นที่ปลอดภัยสำหรับทุกคน ที่ทุกความรู้สึกได้ถูกยอมรับ โดยไม่ตัดสิน ไม่ระบุตัวตน
              </p>
              <div className="flex gap-2 mt-4">
                <a href="#" className="w-9 h-9 bg-slate-100 hover:bg-purple-100 rounded-lg flex items-center justify-center text-slate-600 hover:text-purple-700 transition-colors">📘</a>
                <a href="#" className="w-9 h-9 bg-slate-100 hover:bg-purple-100 rounded-lg flex items-center justify-center text-slate-600 hover:text-purple-700 transition-colors">▶️</a>
                <a href="https://www.up.ac.th" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-100 hover:bg-purple-100 rounded-lg flex items-center justify-center text-slate-600 hover:text-purple-700 transition-colors">🏛️</a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-sm">เมนูหลัก</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/" className="hover:text-purple-600 transition-colors">หน้าหลัก</Link></li>
                <li><Link to="/venting" className="hover:text-purple-600 transition-colors">ระบายใจ</Link></li>
                <li><Link to="/assessment" className="hover:text-purple-600 transition-colors">แบบประเมิน</Link></li>
                <li><Link to="/resources" className="hover:text-purple-600 transition-colors">ทรัพยากร</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-sm">ช่วยเหลือด่วน</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="tel:1323" className="hover:text-purple-600 transition-colors">1323 สุขภาพจิต</a></li>
                <li><a href="tel:1669" className="hover:text-purple-600 transition-colors">1669 ฉุกเฉิน</a></li>
                <li><a href="tel:1385" className="hover:text-purple-600 transition-colors">1385 ป้องกันฆ่าตัวตาย</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-sm">ติดต่อ</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>🏠 บ้านพักใจ, มหาวิทยาลัยพะเยา</li>
                <li>📧 safespace@up.ac.th</li>
                <li><a href="/login" className="hover:text-purple-600 transition-colors">เข้าสู่ระบบ</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} บ้านพักใจ (My Safe Space). สงวนลิขสิทธิ์. สร้างแรงบันดาลใจจากสไตล์ ม.พะเยา
          </div>
        </div>
        {/* 🛡️ แถบ PDPA/Cookie สไตล์ UP */}
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="container mx-auto max-w-6xl px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>
              เว็บไซต์นี้ให้ความสำคัญต่อข้อมูลส่วนบุคคล เพื่อประสบการณ์ที่ดี หากใช้บริการต่อถือว่ายอมรับ{" "}
              <button type="button" className="text-purple-600 hover:text-purple-700 underline underline-offset-2">นโยบายความเป็นส่วนตัว</button>
            </p>
            <button type="button" className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-full transition-colors">
              ยอมรับ
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}