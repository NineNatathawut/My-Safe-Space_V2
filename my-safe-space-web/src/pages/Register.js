import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // ปรับ URL '/auth/register' ให้ตรงกับ Endpoint ฝั่ง Backend
            await api.post('/api/auth/register', {
                username,
                email,
                password,
            });
            alert('สมัครสมาชิกสำเร็จ! กรุณาล็อกอินเข้าสู่ระบบ');
            navigate('/login'); // สมัครเสร็จแล้วพาไปหน้าล็อกอิน
        }
        catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "flex flex-col items-center justify-center h-full p-4", children: _jsxs("div", { className: "w-full max-w-sm bg-white rounded-xl shadow-sm border p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-center text-indigo-600 mb-6", children: "\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01" }), error && (_jsx("div", { className: "bg-red-50 text-red-500 text-sm p-3 rounded-md mb-4 text-center", children: error })), _jsxs("form", { onSubmit: handleRegister, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 (Username)" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "SafeSpaceUser" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0E2D\u0E35\u0E40\u0E21\u0E25" }), _jsx("input", { type: "email", required: true, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19" }), _jsx("input", { type: "password", required: true, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300", children: isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก' })] }), _jsxs("p", { className: "mt-4 text-center text-sm text-gray-600", children: ["\u0E21\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27?", ' ', _jsx(Link, { to: "/login", className: "text-indigo-600 hover:underline", children: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A" })] })] }) }));
}
