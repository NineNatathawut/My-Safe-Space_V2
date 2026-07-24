import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom'; // 🟢 1. นำเข้า Link สำหรับทำปุ่มไปหน้า Login/Register
import api from '../api/axios';
import { SafetyModal } from '../components/SafetyModal';
// 📋 รายการคำเสี่ยงตั้งต้น
const SENSITIVE_KEYWORDS = [
    'คิดสั้น', 'คิดส้น',
    'อยากตาย', 'ไม่อยากอยู่', 'อยากฆ่า',
    'ฆ่าตัว', 'จบชีวิต', 'ลาโลก',
    'ฆ่า ตต', 'ฆ่าตต', 'ตัดช่องน้อย',
    'ไม่อยากตื่น', 'ตายดีกว่า', 'ไม่อยากมีชีวิต'
];
// 🔍 ฟังก์ชันตรวจจับคำเสี่ยง
const checkSensitiveKeywords = (text) => {
    if (!text)
        return false;
    const normalizedText = text.replace(/\s+/g, '').toLowerCase();
    return SENSITIVE_KEYWORDS.some(keyword => {
        const normalizedKeyword = keyword.replace(/\s+/g, '').toLowerCase();
        return normalizedText.includes(normalizedKeyword);
    });
};
const EMOTIONS = [
    { label: 'เศร้า', icon: '😭' },
    { label: 'กังวล', icon: '😰' },
    { label: 'โกรธ', icon: '😡' },
    { label: 'เหงา', icon: '🥺' },
    { label: 'เหนื่อย', icon: '😫' },
    { label: 'สับสน', icon: '😵‍💫' },
    { label: 'มีความหวัง', icon: '✨' },
    { label: 'โอเค', icon: '🙂' },
];
export default function Venting() {
    const [content, setContent] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState('🙂');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    // 🚨 State สำหรับควบคุมการเปิด/ปิด Safety Modal
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    // 🌟 2. เช็คว่าผู้ใช้ล็อกอินหรือยัง
    const token = localStorage.getItem('token');
    const isGuest = !token;
    const handleClear = () => {
        setContent('');
        setError('');
        setSuccessMsg('');
    };
    // 🟢 ฟังก์ชันส่งข้อมูลจริงไปยัง Backend
    const submitPostToBackend = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const aliasName = localStorage.getItem('alias_name') || 'ผู้ใช้ไร้นาม';
            if (!token) {
                setError('กรุณาเข้าสู่ระบบก่อนส่งความในใจครับ');
                setIsLoading(false);
                return;
            }
            const response = await api.post('/api/posts', {
                content: content,
                emotion: selectedEmotion,
                alias_name: aliasName
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setSuccessMsg(response.data.message || 'ส่งความในใจเข้าสู่พื้นที่ปลอดภัยเรียบร้อยแล้ว 🤍');
                setContent('');
                setTimeout(() => setSuccessMsg(''), 4000);
            }
        }
        catch (err) {
            setError(err.response?.data?.error || 'ไม่สามารถส่งความรู้สึกได้ในขณะนี้ กรุณาลองใหม่ครับ');
        }
        finally {
            setIsLoading(false);
        }
    };
    // 🛡️ ด่านตรวจก่อนยิง API
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim() || isLoading)
            return;
        const isSensitive = checkSensitiveKeywords(content);
        if (isSensitive) {
            setShowSafetyModal(true);
        }
        else {
            submitPostToBackend();
        }
    };
    // 🟢 ฟังก์ชันเมื่อผู้ใช้กด "โพสต์ต่อ" จาก Pop-up
    const handleProceedPost = () => {
        setShowSafetyModal(false);
        submitPostToBackend();
    };
    return (_jsxs("div", { className: "flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto py-8 px-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-purple-700 flex items-center gap-2", children: "\u0E2B\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E32\u0E22 \uD83D\uDC9C" }), _jsx("p", { className: "text-gray-600 mt-1", children: "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E04\u0E38\u0E13 \u2014 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E43\u0E08 \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E25\u0E31\u0E27\u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E04\u0E23\u0E23\u0E39\u0E49\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E04\u0E23" }), _jsx("div", { className: "inline-block bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full mt-2", children: "\uD83D\uDD12 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E23\u0E30\u0E1A\u0E38\u0E15\u0E31\u0E27\u0E15\u0E19 \u2014 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E27\u0E32\u0E21\u0E25\u0E31\u0E1A" })] }), successMsg && (_jsx("div", { className: "mb-4 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 animate-pulse", children: successMsg })), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200", children: error })), isGuest ? (_jsxs("div", { className: "bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm mt-4", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83E\uDDF8" }), _jsx("h3", { className: "text-xl font-bold text-gray-800 mb-2", children: "\u0E41\u0E27\u0E30\u0E21\u0E32\u0E1E\u0E31\u0E01\u0E43\u0E08\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E22\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E44\u0E2B\u0E21\u0E04\u0E30?" }), _jsx("p", { className: "text-gray-600 mb-8 max-w-md mx-auto", children: "\u0E2B\u0E32\u0E01\u0E21\u0E35\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E19\u0E31\u0E01\u0E43\u0E08\u0E2D\u0E22\u0E32\u0E01\u0E17\u0E34\u0E49\u0E07\u0E44\u0E27\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48 \u0E21\u0E32\u0E23\u0E31\u0E1A\u0E19\u0E32\u0E21\u0E41\u0E1D\u0E07\u0E19\u0E48\u0E32\u0E23\u0E31\u0E01\u0E46 \u0E41\u0E25\u0E49\u0E27\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E02\u0E35\u0E22\u0E19\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22\u0E19\u0E30 \u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E19\u0E35\u0E49\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E04\u0E38\u0E13\u0E40\u0E2A\u0E21\u0E2D\u0E04\u0E48\u0E30 \u2601\uFE0F\u2728" }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-center gap-4", children: [_jsx(Link, { to: "/login", className: "bg-purple-600 text-white px-8 py-3 rounded-full font-medium hover:bg-purple-700 transition shadow-sm", children: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A" }), _jsx(Link, { to: "/register", className: "bg-white text-purple-600 border-2 border-purple-100 px-8 py-3 rounded-full font-medium hover:bg-purple-50 transition", children: "\u0E23\u0E31\u0E1A\u0E19\u0E32\u0E21\u0E41\u0E1D\u0E07\u0E43\u0E2B\u0E21\u0E48 (\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01)" })] })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "font-medium mb-3", children: "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E04\u0E38\u0E13\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E44\u0E23?" }), _jsx("div", { className: "flex flex-wrap gap-3", children: EMOTIONS.map((emo) => (_jsxs("button", { type: "button", disabled: isLoading, onClick: () => setSelectedEmotion(emo.icon), className: `flex flex-col items-center p-3 rounded-xl border transition-all ${selectedEmotion === emo.icon
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-100 hover:bg-gray-50'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`, children: [_jsx("span", { className: "text-2xl", children: emo.icon }), _jsx("span", { className: "text-xs mt-1 text-gray-600", children: emo.label })] }, emo.label))) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "font-medium mb-3", children: "\u0E1A\u0E2D\u0E01\u0E40\u0E25\u0E48\u0E32\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E43\u0E08..." }), _jsx("textarea", { className: "w-full border border-gray-200 rounded-xl p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none bg-gray-50 disabled:opacity-50 disabled:bg-gray-100", placeholder: "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E40\u0E01\u0E34\u0E14\u0E2D\u0E30\u0E44\u0E23\u0E02\u0E36\u0E49\u0E19? \u0E04\u0E38\u0E13\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E44\u0E23? \u0E23\u0E30\u0E1A\u0E32\u0E22\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \u0E1A\u0E49\u0E32\u0E19\u0E1E\u0E31\u0E01\u0E43\u0E08\u0E23\u0E31\u0E1A\u0E1F\u0E31\u0E07\u0E04\u0E38\u0E13\u0E40\u0E2A\u0E21\u0E2D...", value: content, onChange: (e) => setContent(e.target.value), maxLength: 1000, disabled: isLoading }), _jsxs("div", { className: "text-right text-sm text-gray-400 mt-1", children: [content.length, "/1000 \u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23"] })] }), _jsxs("div", { className: "flex justify-end gap-3 mb-4", children: [_jsx("button", { type: "button", onClick: handleClear, disabled: isLoading, className: "px-6 py-2 border border-gray-300 text-gray-600 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed", children: "\u0E25\u0E49\u0E32\u0E07" }), _jsx("button", { type: "submit", disabled: !content.trim() || isLoading, className: "px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors", children: isLoading ? 'กำลังส่งความในใจ...' : 'ส่งความในใจ' })] }), _jsxs("p", { className: "text-xs text-gray-400 flex gap-1 items-start", children: [_jsx("span", { children: "\uD83D\uDD12" }), " \u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E21\u0E32\u0E01 \u2014 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E0A\u0E37\u0E48\u0E2D \u0E2D\u0E35\u0E40\u0E21\u0E25 \u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E43\u0E14\u0E46 \u0E17\u0E31\u0E49\u0E07\u0E2A\u0E34\u0E49\u0E19 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23\u0E41\u0E1E\u0E17\u0E22\u0E4C"] })] }))] }), _jsxs("div", { className: "lg:w-80 space-y-6", children: [_jsxs("div", { className: "bg-white p-5 rounded-2xl shadow-sm border border-gray-100", children: [_jsx("h3", { className: "font-medium mb-4 flex items-center gap-2", children: "\uD83D\uDCDE \u0E2A\u0E32\u0E22\u0E14\u0E48\u0E27\u0E19 \u2014 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E0A\u0E48\u0E27\u0E22\u0E40\u0E2A\u0E21\u0E2D" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("a", { href: "tel:1323", className: "w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center transition-colors", children: [_jsx("span", { children: "1323 \u0E2A\u0E32\u0E22\u0E14\u0E48\u0E27\u0E19\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E08\u0E34\u0E15" }), " ", _jsx("span", { children: "\u2192" })] }), _jsxs("a", { href: "tel:021136789", className: "w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center transition-colors", children: [_jsx("span", { children: "02-113-6789 \u0E2A\u0E30\u0E21\u0E32\u0E23\u0E34\u0E15\u0E31\u0E19\u0E2A\u0E4C" }), " ", _jsx("span", { children: "\u2192" })] }), _jsxs("a", { href: "tel:1669", className: "w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center transition-colors", children: [_jsx("span", { children: "1669 \u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19\u0E1F\u0E23\u0E35" }), " ", _jsx("span", { children: "\u2192" })] }), _jsxs("a", { href: "tel:1300", className: "w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center transition-colors", children: [_jsx("span", { children: "1300 \u0E0A\u0E48\u0E27\u0E22\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E2A\u0E31\u0E07\u0E04\u0E21" }), " ", _jsx("span", { children: "\u2192" })] })] })] }), _jsxs("div", { className: "bg-white p-5 rounded-2xl shadow-sm border border-gray-100", children: [_jsx("h3", { className: "font-medium mb-2 flex items-center gap-2", children: "\uD83E\uDD0D \u0E2B\u0E32\u0E22\u0E43\u0E08 4-4-4" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "\u0E25\u0E2D\u0E07\u0E2B\u0E32\u0E22\u0E43\u0E08\u0E25\u0E36\u0E01\u0E46 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E14\u0E04\u0E27\u0E32\u0E21\u0E40\u0E04\u0E23\u0E35\u0E22\u0E14\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35" }), _jsxs("ul", { className: "text-sm text-gray-600 space-y-2", children: [_jsx("li", { children: "1. \u0E2B\u0E32\u0E22\u0E43\u0E08\u0E40\u0E02\u0E49\u0E32 \u0E19\u0E31\u0E1A 1-2-3-4" }), _jsx("li", { children: "2. \u0E01\u0E25\u0E31\u0E49\u0E19\u0E2B\u0E32\u0E22\u0E43\u0E08 \u0E19\u0E31\u0E1A 1-2-3-4" }), _jsx("li", { children: "3. \u0E2B\u0E32\u0E22\u0E43\u0E08\u0E2D\u0E2D\u0E01 \u0E19\u0E31\u0E1A 1-2-3-4" }), _jsx("li", { children: "4. \u0E17\u0E33\u0E0B\u0E49\u0E33 4 \u0E23\u0E2D\u0E1A" })] })] })] }), _jsx(SafetyModal, { isOpen: showSafetyModal, onClose: () => setShowSafetyModal(false), onProceed: handleProceedPost })] }));
}
