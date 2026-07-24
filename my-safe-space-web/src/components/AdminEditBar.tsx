import { useAuth } from '../contexts/AuthContext';

interface AdminEditBarProps {
  pageName: string;
  isEditMode: boolean;
  onToggleEdit: () => void;
  onSave?: () => void;
}

export default function AdminEditBar({ pageName, isEditMode, onToggleEdit, onSave }: AdminEditBarProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-white px-6 py-3 shadow-lg flex justify-between items-center">
      <div className="flex items-center gap-2 font-bold text-sm md:text-base">
        <span>⚙️ โหมดผู้ดูแลระบบ (Admin View)</span>
        <span className="bg-amber-600 text-xs px-2 py-0.5 rounded-full font-normal">
          กำลังดูหน้า: {pageName}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onToggleEdit}
          className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            isEditMode 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-white text-amber-900 hover:bg-amber-100'
          }`}
        >
          {isEditMode ? '💾 บันทึกการแก้ไข' : '✏️ เปิดโหมดแก้ไขหน้างาน'}
        </button>
      </div>
    </div>
  );
}
