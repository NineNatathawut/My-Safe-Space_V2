import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const result = await login(email, password);
        if (result.success && result.user) {
            if (result.user.role === 'admin') {
                navigate('/admin/dashboard');
            }
            else {
                setError('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบจัดการหลังบ้าน');
            }
        }
        else {
            setError(result.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
        setIsLoading(false);
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans", children: _jsxs("div", { className: "bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "text-5xl mb-4", children: "\uD83D\uDEE1\uFE0F" }), _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E49\u0E32\u0E19" }), _jsx("p", { className: "text-gray-500 mt-1", children: "\u0E1A\u0E49\u0E32\u0E19\u0E1E\u0E31\u0E01\u0E43\u0E08 (Admin Portal)" })] }), error && (_jsx("div", { className: "bg-red-50 text-red-500 p-3 rounded-xl text-sm text-center mb-6 border border-red-100", children: error })), _jsxs("form", { onSubmit: handleLogin, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-bold text-gray-700 mb-1", children: "\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all", placeholder: "admin@banpakjai.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-bold text-gray-700 mb-1", children: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md mt-4 disabled:bg-indigo-400", children: isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ' })] })] }) }));
}
