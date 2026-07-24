import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useAuth } from '../contexts/AuthContext';
export default function AdminEditBar({ pageName, isEditMode, onToggleEdit, onSave }) {
    const { isAdmin } = useAuth();
    if (!isAdmin)
        return null;
    return (_jsxs("div", { className: "sticky top-0 z-50 bg-amber-500 text-white px-6 py-3 shadow-lg flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-2 font-bold text-sm md:text-base", children: [_jsx("span", { children: "\u2699\uFE0F \u0E42\u0E2B\u0E21\u0E14\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A (Admin View)" }), _jsxs("span", { className: "bg-amber-600 text-xs px-2 py-0.5 rounded-full font-normal", children: ["\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E39\u0E2B\u0E19\u0E49\u0E32: ", pageName] })] }), _jsx("div", { className: "flex gap-2", children: _jsx("button", { onClick: onToggleEdit, className: `px-4 py-1.5 rounded-xl font-bold text-sm transition-all shadow-sm ${isEditMode
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-white text-amber-900 hover:bg-amber-100'}`, children: isEditMode ? '💾 บันทึกการแก้ไข' : '✏️ เปิดโหมดแก้ไขหน้างาน' }) })] }));
}
