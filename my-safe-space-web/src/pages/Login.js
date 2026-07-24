import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
const ADJECTIVES = ['ใจฟู', 'สีพาสเทล', 'ใจเย็น', 'หวานน้อย', 'ยิ้มแฉ่ง', 'กอดอุ่น', 'แสนดี', 'ละมุน'];
const NOUNS = ['แมวน้อย', 'ก้อนเมฆ', 'คาปิบาร่า', 'ชานม', 'ทานตะวัน', 'ใบไม้', 'ดวงดาว', 'กระต่าย'];
export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [nickname, setNickname] = useState('');
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const result = await login(email, password);
        if (result.success && result.user) {
            if (result.user.role === 'admin') {
                setIsLoading(false);
                navigate('/resources');
                return;
            }
            const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
            const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
            const generatedName = `${randomNoun}${randomAdj}`;
            setNickname(generatedName);
            localStorage.setItem('alias_name', generatedName);
            setShowPopup(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
        }
        else {
            setError(result.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
        if (!showPopup) {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-[80vh] flex items-center justify-center relative", children: [_jsxs("div", { className: `w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-100 transition-opacity duration-300 ${showPopup ? 'opacity-20 pointer-events-none' : 'opacity-100'}`, children: [_jsx("h2", { className: "text-2xl font-bold text-center mb-6", children: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A" }), error && (_jsx("div", { className: "bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4", children: error })), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "\u0E2D\u0E35\u0E40\u0E21\u0E25" }), _jsx("input", { type: "email", className: "w-full border rounded-xl p-3 focus:ring-2 focus:ring-purple-300 outline-none", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19" }), _jsx("input", { type: "password", className: "w-full border rounded-xl p-3 focus:ring-2 focus:ring-purple-300 outline-none", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full bg-purple-600 text-white font-medium py-3 rounded-xl hover:bg-purple-700 disabled:bg-purple-300 transition-colors", children: isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' })] }), _jsxs("p", { className: "text-center text-sm text-gray-500 mt-6", children: ["\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35?", ' ', _jsx(Link, { to: "/register", className: "text-purple-600 hover:underline font-medium", children: "\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01" })] })] }), showPopup && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white p-8 rounded-3xl shadow-xl border border-purple-100 text-center animate-bounce-in max-w-sm w-full mx-4", children: [_jsx("div", { className: "text-5xl mb-4", children: "\u2728" }), _jsx("h3", { className: "text-xl font-bold text-gray-800 mb-2", children: "\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32!" }), _jsx("p", { className: "text-gray-500 text-sm mb-6", children: "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E1A\u0E49\u0E32\u0E19\u0E1E\u0E31\u0E01\u0E43\u0E08\u0E02\u0E2D\u0E40\u0E23\u0E35\u0E22\u0E01\u0E04\u0E38\u0E13\u0E27\u0E48\u0E32..." }), _jsx("div", { className: "bg-purple-50 rounded-2xl p-4 mb-6 border border-purple-100", children: _jsx("span", { className: "text-2xl font-bold text-purple-600", children: nickname }) }), _jsx("p", { className: "text-xs text-purple-400 animate-pulse", children: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1E\u0E32\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01.. \uD83D\uDE80" })] }) })), _jsx("style", { children: `
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      ` })] }));
}
