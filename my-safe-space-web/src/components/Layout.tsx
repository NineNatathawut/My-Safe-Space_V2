import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 🟢 Navbar ด้านบน (Responsive) */}
      <header className="bg-white border-b p-4">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">บ้านพักใจ</h1>
          
          <nav className="flex gap-4">
            {token ? (
              <>
                <Link to="/" className="hover:underline">หน้าหลัก</Link>
                <Link to="/profile" className="hover:underline">โปรไฟล์</Link>
                <button onClick={handleLogout} className="text-red-500 hover:underline">
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">เข้าสู่ระบบ</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* 🟢 พื้นที่เนื้อหาหลัก (ขยายตามจอ แต่ไม่เกิน 5xl) */}
      <main className="flex-1 container mx-auto max-w-5xl p-4 mt-4">
        <Outlet />
      </main>
    </div>
  );
}