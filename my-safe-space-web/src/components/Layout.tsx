import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center">
      {/* Container หลักขนาดเท่าจอมือถือ */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col border-x border-gray-200">
        
        {/* Header สั้นๆ */}
        <header className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h1 className="font-bold text-lg text-indigo-600">🏠 บ้านพักใจ</h1>
          {token && (
            <button 
              onClick={handleLogout}
              className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded"
            >
              ออกจากระบบ
            </button>
          )}
        </header>

        {/* เนื้อหาแต่ละหน้าจะเปลี่ยนตรงนี้ */}
        <main className="flex-1 p-4">
          <Outlet />
        </main>

        {/* เมนูด้านล่าง (Nav Bar) */}
        {token && (
          <nav className="p-3 border-t bg-white flex justify-around text-sm sticky bottom-0">
            <Link to="/" className="font-medium text-gray-700">หน้าฟีด</Link>
            <Link to="/profile" className="font-medium text-gray-700">โปรไฟล์</Link>
          </nav>
        )}
      </div>
    </div>
  );
}