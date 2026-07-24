import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
export default function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    // 🔄 ดึงรายละเอียดโพสต์และรายการคอมเมนต์
    useEffect(() => {
        if (id) {
            fetchPostAndComments();
        }
    }, [id]);
    const fetchPostAndComments = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/posts/${id}`);
            console.log("Post response:", response.data);
            if (response.data.success) {
                setPost(response.data.post);
                // ดึงคอมเมนต์ (รองรับทั้งแบบแยก array หรือฝังมาใน post)
                setComments(response.data.comments || response.data.post.comments || []);
            }
        }
        catch (err) {
            console.error("Error fetching post detail:", err);
            setError('ไม่สามารถโหลดข้อความนี้ได้ โพสต์อาจถูกลบไปแล้ว');
        }
        finally {
            setIsLoading(false);
        }
    };
    // 💬 ฟังก์ชันส่งคอมเมนต์
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim())
            return;
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const response = await api.post(`/api/posts/${id}/comments`, {
                content: newComment
            }, config);
            if (response.data.success) {
                // เพิ่มคอมเมนต์ใหม่เข้าไปใน State ทันที
                const addedComment = response.data.comment || {
                    id: Date.now().toString(),
                    content: newComment,
                    alias_name: response.data.alias_name || 'ผู้ห่วงใยไร้นาม',
                    created_at: new Date().toISOString()
                };
                setComments(prev => [...prev, addedComment]);
                setNewComment(''); // ล้างช่องพิมพ์
            }
        }
        catch (err) {
            console.error("Error posting comment:", err);
            alert('ไม่สามารถส่งข้อความส่งกำลังใจได้ในขณะนี้');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    // 🫂 ฟังก์ชันกดกอดในหน้ารายละเอียด
    const handleHug = async () => {
        if (!post)
            return;
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const response = await api.post(`/api/posts/${id}/hug`, {}, config);
            if (response.data.success) {
                setPost(prev => prev ? {
                    ...prev,
                    hug_count: typeof response.data.hug_count === 'number'
                        ? response.data.hug_count
                        : (response.data.hugged ? prev.hug_count + 1 : Math.max(0, prev.hug_count - 1))
                } : null);
            }
        }
        catch (err) {
            console.error("Error hugging:", err);
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };
    if (isLoading) {
        return (_jsx("div", { className: "max-w-3xl mx-auto py-12 px-4 text-center", children: _jsxs("div", { className: "animate-pulse flex flex-col items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 bg-purple-100 rounded-full" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-1/2" }), _jsx("div", { className: "h-20 bg-gray-100 rounded w-full" })] }) }));
    }
    if (error || !post) {
        return (_jsxs("div", { className: "max-w-2xl mx-auto py-16 px-4 text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83C\uDF43" }), _jsx("p", { className: "text-gray-600 mb-6", children: error || 'ไม่พบโพสต์ที่คุณต้องการ' }), _jsx("button", { onClick: () => navigate('/'), className: "px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors", children: "\u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01" })] }));
    }
    return (_jsxs("div", { className: "max-w-3xl mx-auto py-8 px-4 space-y-8", children: [_jsx("button", { onClick: () => navigate(-1), className: "text-gray-500 hover:text-purple-600 flex items-center gap-2 text-sm font-medium transition-colors", children: "\u2190 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A" }), _jsxs("article", { className: "bg-white p-8 rounded-3xl shadow-sm border border-purple-50", children: [_jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx("div", { className: "w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-3xl border border-purple-100 shadow-sm", children: post.emotion }), _jsxs("div", { children: [_jsx("h1", { className: "font-semibold text-gray-900 text-lg", children: post.alias_name }), _jsx("p", { className: "text-xs text-gray-400", children: formatDate(post.created_at) })] })] }), _jsx("p", { className: "text-gray-800 text-lg leading-relaxed whitespace-pre-wrap mb-8", children: post.content }), _jsxs("div", { className: "pt-4 border-t border-gray-100 flex items-center gap-6", children: [_jsxs("button", { onClick: handleHug, className: "flex items-center gap-2 text-gray-600 hover:text-pink-500 font-medium transition-colors active:scale-95 transform", children: [_jsx("span", { className: "text-xl", children: "\uD83E\uDEC2" }), " \u0E2A\u0E48\u0E07\u0E01\u0E2D\u0E14 ", post.hug_count > 0 && _jsxs("span", { className: "text-pink-500", children: ["(", post.hug_count, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-400 font-medium text-sm", children: [_jsx("span", { children: "\uD83D\uDCAC" }), " ", comments.length, " \u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19"] })] })] }), _jsxs("section", { className: "bg-white p-6 rounded-3xl shadow-sm border border-gray-100", children: [_jsxs("h3", { className: "font-bold text-gray-800 mb-4 flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDC8C" }), " \u0E2A\u0E48\u0E07\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E08\u0E43\u0E2B\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E19"] }), _jsxs("form", { onSubmit: handleSubmitComment, className: "space-y-4", children: [_jsx("textarea", { rows: 3, value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E1B\u0E25\u0E2D\u0E1A\u0E42\u0E22\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E2B\u0E49\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E08\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48... (\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E15\u0E31\u0E27\u0E15\u0E19)", className: "w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none text-gray-700", maxLength: 500 }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("span", { className: "text-xs text-gray-400", children: [newComment.length, "/500"] }), _jsx("button", { type: "submit", disabled: isSubmitting || !newComment.trim(), className: "px-6 py-2.5 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50", children: isSubmitting ? 'กำลังส่ง...' : 'ส่งกำลังใจ 🤍' })] })] })] }), _jsxs("section", { className: "space-y-4", children: [_jsxs("h3", { className: "font-bold text-gray-800 text-lg px-2", children: ["\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E08 (", comments.length, ")"] }), comments.length === 0 ? (_jsx("div", { className: "text-center py-8 bg-purple-50/50 rounded-2xl border border-dashed border-purple-100", children: _jsx("p", { className: "text-gray-500 text-sm", children: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E04\u0E23\u0E2A\u0E48\u0E07\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E08 \u0E40\u0E1B\u0E47\u0E19\u0E04\u0E19\u0E41\u0E23\u0E01\u0E17\u0E35\u0E48\u0E21\u0E2D\u0E1A\u0E04\u0E27\u0E32\u0E21 \uB530\uB73B \u0E43\u0E2B\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E19\u0E2A\u0E34 \uD83E\uDD0D" }) })) : (_jsx("div", { className: "space-y-3", children: comments.map((comment) => {
                            const commentId = comment.id || comment._id || Math.random().toString();
                            return (_jsxs("div", { className: "bg-white p-5 rounded-2xl shadow-sm border border-gray-100", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "font-medium text-sm text-purple-900", children: comment.alias_name }), _jsx("span", { className: "text-xs text-gray-400", children: formatDate(comment.created_at) })] }), _jsx("p", { className: "text-gray-700 text-sm whitespace-pre-wrap", children: comment.content })] }, commentId));
                        }) }))] })] }));
}
