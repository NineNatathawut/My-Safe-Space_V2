import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
// ข้อมูลบทความไฮไลต์เริ่มต้น
const INITIAL_ARTICLES = [
    {
        id: 1,
        category: 'การหายใจ',
        title: 'เทคนิคหายใจ 4-7-8 ลดเครียดใน 5 นาที',
        description: 'วิธีการหายใจที่ช่วยให้ระบบประสาทสงบลง ลดความวิตกกังวลได้ทันที ทำได้ทุกที่',
        badgeColor: 'bg-purple-100 text-purple-700',
        actionText: 'อ่านเพิ่มเติม',
        link: 'https://www.youtube.com/watch?v=gz4G31LGyaw'
    },
    {
        id: 2,
        category: 'Mindfulness',
        title: 'ฝึก Mindfulness เบื้องต้น สำหรับผู้เริ่มต้น',
        description: 'การอยู่กับปัจจุบัน ไม่ตัดสินความรู้สึก — เริ่มต้นได้ง่าย ๆ เพียง 5-10 นาทีต่อวัน',
        badgeColor: 'bg-indigo-100 text-indigo-700',
        actionText: 'อ่านเพิ่มเติม',
        link: '/resources'
    },
    {
        id: 3,
        category: 'จัดการความเครียด',
        title: '5 วิธีรับมือความเครียดที่ได้ผลจริง',
        description: 'จากงานวิจัย — วิธีง่าย ๆ ที่ช่วยให้สมองได้พักและจิตใจฟื้นคืนได้เร็วขึ้น',
        badgeColor: 'bg-teal-100 text-teal-700',
        actionText: 'ประเมินความเครียด',
        link: 'https://dmh.go.th/test/stress/'
    }
];
export default function Home() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAdmin } = useAuth();
    const [articles, setArticles] = useState(INITIAL_ARTICLES);
    // สถานะกำลังโหลดระหว่างเรียก API (เพื่อไม่ให้กดปุ่มรัวๆ)
    const [huggingIds, setHuggingIds] = useState(new Set());
    // 💖 State สำหรับจำว่าโพสต์ไหนที่เรากดกอดไปแล้วบ้าง (ดึงจาก localStorage ก่อน)
    const [huggedPosts, setHuggedPosts] = useState(() => {
        const saved = localStorage.getItem('huggedPosts');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [editingArticle, setEditingArticle] = useState(null);
    useEffect(() => {
        fetchPosts();
    }, []);
    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/posts');
            if (response.data.success) {
                setPosts(response.data.posts);
            }
        }
        catch (err) {
            console.error("Error fetching posts:", err);
            setError('ไม่สามารถโหลดข้อความจากลานสายลมได้ในขณะนี้');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDeletePost = async (postId) => {
        // 1. ถามยืนยันก่อนลบ
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?'))
            return;
        try {
            // 2. ดึง Token เพื่อยืนยันสิทธิ์ Admin
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            // 3. เรียก API ลบโพสต์
            const response = await api.delete(`/api/posts/${postId}`, config);
            // 4. เช็คว่าสำเร็จหรือไม่ (บาง API ส่ง response.status = 200, บางอันส่ง data.success = true)
            if (response.status === 200 || response.data?.success) {
                // ลบข้อมูลออกจาก State หน้าจอจะได้หายไปทันทีโดยไม่ต้องรีเฟรช
                setPosts(prevPosts => prevPosts.filter(post => (post.id || post._id) !== postId));
                alert('ลบโพสต์เรียบร้อยแล้ว 🗑️');
            }
            else {
                alert('ไม่สามารถลบโพสต์ได้ ลองใหม่อีกครั้งครับ');
            }
        }
        catch (err) {
            console.error("Error deleting post:", err);
            // เช็คว่า Error เกิดจากอะไร
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                alert('คุณไม่มีสิทธิ์ลบโพสต์นี้ (เซสชันอาจจะหมดอายุ กรุณาล็อกอินใหม่)');
            }
            else if (err?.response?.status === 404) {
                alert('ไม่พบโพสต์นี้ในระบบ (อาจจะถูกลบไปแล้ว)');
            }
            else {
                alert('ไม่สามารถลบโพสต์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
            }
        }
    };
    // 💖 ฟังก์ชันจัดการการกดกอดแบบ Toggle (กดเพิ่ม / กดยกเลิก)
    const handleHug = async (postId) => {
        if (huggingIds.has(postId))
            return; // ป้องกันการกดรัวๆ
        // เช็คว่าโพสต์นี้เคยถูกกดกอดไปแล้วหรือยัง?
        const isAlreadyHugged = huggedPosts.has(postId);
        try {
            setHuggingIds(prev => new Set(prev).add(postId));
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            // ส่ง payload ไปบอก Backend ว่าจะ 'hug' หรือ 'unhug' 
            // (ถ้า API คุณรับแค่วิธีปกติ อาจจะลองปรับแก้ฝั่ง backend ให้เช็ค action นี้นะครับ)
            const payload = { action: isAlreadyHugged ? 'unhug' : 'hug' };
            const response = await api.post(`/api/posts/${postId}/hug`, payload, config);
            if (response.data.success) {
                // 1. อัปเดตสถานะว่าเรากดหรือยกเลิกกอด แล้วบันทึกลง LocalStorage
                setHuggedPosts(prev => {
                    const newSet = new Set(prev);
                    if (isAlreadyHugged) {
                        newSet.delete(postId); // เอาออก (ยกเลิกกอด)
                    }
                    else {
                        newSet.add(postId); // เพิ่มเข้าไป (กดกอด)
                    }
                    localStorage.setItem('huggedPosts', JSON.stringify(Array.from(newSet)));
                    return newSet;
                });
                // 2. อัปเดตตัวเลขแสดงผลบนหน้าจอ
                setPosts(prevPosts => prevPosts.map(post => {
                    const currentId = post.id || post._id;
                    if (currentId === postId) {
                        // ถ้า Backend ส่งค่ายอดกอดมาให้ ใช้อันนั้น
                        if (typeof response.data.hug_count === 'number') {
                            return { ...post, hug_count: response.data.hug_count };
                        }
                        // ถ้าไม่ส่ง ให้คำนวณเองเลย (+1 หรือ -1)
                        return {
                            ...post,
                            hug_count: isAlreadyHugged ? Math.max(0, post.hug_count - 1) : post.hug_count + 1
                        };
                    }
                    return post;
                }));
            }
        }
        catch (err) {
            if (err?.response?.status === 401) {
                alert('กรุณาเข้าสู่ระบบหรือตั้งนามแฝงก่อนส่งกอดนะครับ 🤍');
            }
            else {
                alert('ไม่สามารถส่งกอดได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
            }
        }
        finally {
            setHuggingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };
    const openEditModal = (article) => {
        setEditingArticle({ ...article });
    };
    const handleModalChange = (e) => {
        const { name, value } = e.target;
        if (editingArticle) {
            setEditingArticle({ ...editingArticle, [name]: value });
        }
    };
    const handleSaveArticle = (e) => {
        e.preventDefault();
        if (!editingArticle)
            return;
        setArticles(prev => prev.map(a => a.id === editingArticle.id ? editingArticle : a));
        setEditingArticle(null);
        alert('บันทึกการแก้ไขบทความสำเร็จ!');
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    return (_jsxs("div", { className: "space-y-16 py-8 max-w-6xl mx-auto relative", children: [_jsxs("section", { className: "text-center px-4", children: [_jsx("div", { className: "inline-block bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6", children: "\uD83D\uDD12 \u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E15\u0E31\u0E27\u0E15\u0E19" }), _jsxs("h1", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-6", children: ["\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D ", _jsx("span", { className: "text-purple-600", children: "\u0E1A\u0E49\u0E32\u0E19\u0E1E\u0E31\u0E01\u0E43\u0E08" }), " \u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13"] }), _jsx("p", { className: "text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-10", children: "\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01 \u0E41\u0E1A\u0E48\u0E07\u0E1B\u0E31\u0E19\u0E04\u0E27\u0E32\u0E21\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E27\u0E14 \u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E04\u0E48\u0E2D\u0E22\u0E32\u0E01\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1A\u0E2D\u0E01\u0E43\u0E04\u0E23\u0E2A\u0E31\u0E01\u0E04\u0E19 - \u0E40\u0E23\u0E32\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E1F\u0E31\u0E07\u0E17\u0E38\u0E01\u0E04\u0E33 \u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E23\u0E30\u0E1A\u0E38\u0E15\u0E31\u0E27\u0E15\u0E19" }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-center gap-4", children: [_jsx(Link, { to: "/venting", className: "px-8 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors shadow-sm", children: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E40\u0E25\u0E22" }), _jsx(Link, { to: "/resources", className: "px-8 py-3 bg-white text-purple-600 font-medium rounded-full border border-purple-200 hover:bg-purple-50 transition-colors shadow-sm", children: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E17\u0E23\u0E31\u0E1E\u0E22\u0E32\u0E01\u0E23" })] })] }), _jsxs("section", { className: "bg-red-50 py-6 px-4 rounded-2xl mx-4 lg:mx-0 border border-red-100", children: [_jsx("p", { className: "text-center text-red-600 font-medium mb-4", children: "\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E48\u0E27\u0E22\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E40\u0E23\u0E48\u0E07\u0E14\u0E48\u0E27\u0E19? \u0E42\u0E17\u0E23\u0E2B\u0E32\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 - \u0E1F\u0E23\u0E35 \u0E15\u0E25\u0E2D\u0E14 24 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07" }), _jsxs("div", { className: "flex flex-wrap justify-center gap-4", children: [_jsx("a", { href: "tel:1323", className: "bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow", children: "1323 \u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E08\u0E34\u0E15" }), _jsx("a", { href: "tel:1669", className: "bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow", children: "1669 \u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19" }), _jsx("a", { href: "tel:1385", className: "bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow", children: "1385 \u0E1B\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E19\u0E01\u0E32\u0E23\u0E06\u0E48\u0E32\u0E15\u0E31\u0E27\u0E15\u0E32\u0E22" })] })] }), _jsxs("section", { className: "px-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 flex items-center gap-2", children: "\u0E25\u0E32\u0E19\u0E2A\u0E32\u0E22\u0E25\u0E21 \uD83C\uDF43" }), _jsx("button", { onClick: fetchPosts, disabled: isLoading, className: "text-purple-600 text-sm hover:text-purple-800 flex items-center gap-1 disabled:opacity-50 transition-colors", children: isLoading ? 'กำลังโหลด...' : '🔄 รีเฟรช' })] }), error && _jsx("div", { className: "p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 text-center", children: error }), isLoading ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [1, 2, 3, 4].map((n) => (_jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 bg-gray-200 rounded-full" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-1/3" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-full" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-5/6" })] })] }, n))) })) : posts.length === 0 && !error ? (_jsxs("div", { className: "text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83C\uDF43" }), _jsx("h3", { className: "text-lg font-medium text-gray-800 mb-1", children: "\u0E25\u0E32\u0E19\u0E2A\u0E32\u0E22\u0E25\u0E21\u0E22\u0E31\u0E07\u0E04\u0E07\u0E40\u0E07\u0E35\u0E22\u0E1A\u0E2A\u0E07\u0E1A" }), _jsx("p", { className: "text-gray-500", children: "\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E19\u0E41\u0E23\u0E01\u0E17\u0E35\u0E48\u0E1A\u0E2D\u0E01\u0E40\u0E25\u0E48\u0E32\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E2A\u0E34" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: posts.map((post) => {
                            const activeId = post.id || post._id || '';
                            const isHugging = huggingIds.has(activeId); // สถานะรอ API
                            const hasHugged = huggedPosts.has(activeId); // สถานะว่าเราเคยกอดโพสต์นี้ไปแล้ว
                            return (_jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-2xl border border-gray-100 shadow-sm", children: post.emotion }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-800", children: post.alias_name }), _jsx("div", { className: "text-xs text-gray-400", children: formatDate(post.created_at) })] })] }), isAdmin && (_jsx("button", { onClick: () => handleDeletePost(activeId), className: "text-gray-400 hover:text-red-500 transition-colors p-1", title: "\u0E25\u0E1A\u0E42\u0E1E\u0E2A\u0E15\u0E4C", children: "\uD83D\uDDD1\uFE0F" }))] }), _jsx("p", { className: "text-gray-700 whitespace-pre-wrap mb-4", children: post.content })] }), _jsxs("div", { className: "flex items-center gap-4 pt-4 border-t border-gray-50 text-sm mt-auto", children: [_jsxs("button", { onClick: () => handleHug(activeId), disabled: isHugging, className: `flex items-center gap-1.5 transition-colors active:scale-95 transform ${hasHugged
                                                    ? 'text-pink-500 hover:text-pink-600' // สีชมพูเข้มเมื่อกดแล้ว
                                                    : 'text-gray-500 hover:text-pink-500' // สีเทาเมื่อยังไม่ได้กด
                                                }`, children: [_jsx("span", { className: `${isHugging ? 'animate-pulse' : ''} ${hasHugged ? 'scale-110 transition-transform' : ''}`, children: hasHugged ? '💖' : '🫂' }), "\u0E01\u0E2D\u0E14 ", post.hug_count > 0 && _jsxs("span", { className: `font-medium ${hasHugged ? 'text-pink-600' : 'text-pink-500'}`, children: ["(", post.hug_count, ")"] })] }), _jsxs(Link, { to: `/post/${activeId}`, className: "flex items-center gap-1.5 text-gray-500 hover:text-purple-600 transition-colors", children: [_jsx("span", { children: "\uD83D\uDCAC" }), " \u0E04\u0E2D\u0E21\u0E40\u0E21\u0E19\u0E15\u0E4C ", post.comment_count > 0 && _jsxs("span", { className: "font-medium text-purple-600", children: ["(", post.comment_count, ")"] })] })] })] }, activeId));
                        }) }))] }), _jsxs("section", { className: "px-4", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "\u0E1A\u0E17\u0E04\u0E27\u0E32\u0E21\u0E41\u0E25\u0E30\u0E17\u0E23\u0E31\u0E1E\u0E22\u0E32\u0E01\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E04\u0E38\u0E13 \uD83D\uDCD6" }), _jsx("p", { className: "text-gray-600 text-sm md:text-base max-w-2xl mx-auto", children: "\u0E40\u0E17\u0E04\u0E19\u0E34\u0E04 \u0E27\u0E34\u0E18\u0E35\u0E01\u0E32\u0E23 \u0E41\u0E25\u0E30\u0E1A\u0E17\u0E04\u0E27\u0E32\u0E21\u0E17\u0E35\u0E48\u0E04\u0E31\u0E14\u0E2A\u0E23\u0E23\u0E21\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E0A\u0E48\u0E27\u0E22\u0E43\u0E2B\u0E49\u0E04\u0E38\u0E13\u0E23\u0E31\u0E1A\u0E21\u0E37\u0E2D\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E40\u0E04\u0E23\u0E35\u0E22\u0E14\u0E44\u0E14\u0E49\u0E14\u0E35\u0E22\u0E34\u0E48\u0E07\u0E02\u0E36\u0E49\u0E19" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: articles.map((article) => (_jsxs("div", { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group/card", children: [isAdmin && (_jsx("button", { onClick: () => openEditModal(article), className: "absolute top-4 right-4 bg-yellow-100 text-yellow-700 p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-yellow-200 shadow-sm", title: "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E1A\u0E17\u0E04\u0E27\u0E32\u0E21", children: "\u270F\uFE0F" })), _jsxs("div", { children: [_jsx("div", { className: "mb-3", children: _jsx("span", { className: `text-xs px-3 py-1 rounded-full font-medium ${article.badgeColor}`, children: article.category }) }), _jsx("h3", { className: "font-bold text-lg text-gray-800 mb-2 hover:text-purple-600 transition-colors pr-8", children: article.title }), _jsx("p", { className: "text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed", children: article.description })] }), article.link.startsWith('http') ? (_jsxs("a", { href: article.link, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors group", children: [_jsx("span", { children: article.actionText }), _jsx("span", { className: "group-hover:translate-x-1 transition-transform", children: "\u2192" })] })) : (_jsxs(Link, { to: article.link, className: "inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors group", children: [_jsx("span", { children: article.actionText }), _jsx("span", { className: "group-hover:translate-x-1 transition-transform", children: "\u2192" })] }))] }, article.id))) }), _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/resources", className: "inline-block px-6 py-2.5 bg-white border border-purple-200 text-purple-700 font-medium rounded-full hover:bg-purple-50 transition-colors text-sm shadow-sm", children: "\u0E14\u0E39\u0E1A\u0E17\u0E04\u0E27\u0E32\u0E21\u0E41\u0E25\u0E30\u0E17\u0E23\u0E31\u0E1E\u0E22\u0E32\u0E01\u0E23\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u2192" }) })] }), _jsxs("section", { className: "text-center px-4 bg-purple-50 py-12 rounded-2xl mx-4 lg:mx-0 border border-purple-100", children: [_jsx("h2", { className: "text-2xl font-bold mb-4 text-purple-900", children: "\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27\u0E2B\u0E23\u0E37\u0E2D\u0E22\u0E31\u0E07?" }), _jsx("p", { className: "text-purple-700 mb-8 max-w-lg mx-auto", children: "\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E07\u0E27\u0E25 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E04\u0E23\u0E23\u0E39\u0E49\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E04\u0E23 - \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22\u0E17\u0E31\u0E19\u0E17\u0E35" }), _jsx(Link, { to: "/venting", className: "px-8 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg inline-block", children: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E2B\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E32\u0E22" })] }), editingArticle && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-2xl p-6 w-full max-w-md shadow-xl", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-gray-800", children: "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E1A\u0E17\u0E04\u0E27\u0E32\u0E21" }), _jsxs("form", { onSubmit: handleSaveArticle, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48" }), _jsx("input", { type: "text", name: "category", value: editingArticle.category, onChange: handleModalChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E1A\u0E17\u0E04\u0E27\u0E32\u0E21" }), _jsx("input", { type: "text", name: "title", value: editingArticle.title, onChange: handleModalChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E2A\u0E31\u0E49\u0E19\u0E46" }), _jsx("textarea", { name: "description", value: editingArticle.description, onChange: handleModalChange, rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E38\u0E48\u0E21\u0E01\u0E14" }), _jsx("input", { type: "text", name: "actionText", value: editingArticle.actionText, onChange: handleModalChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0E25\u0E34\u0E07\u0E01\u0E4C (URL \u0E2B\u0E23\u0E37\u0E2D Path)" }), _jsx("input", { type: "text", name: "link", value: editingArticle.link, onChange: handleModalChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm", required: true })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-gray-100", children: [_jsx("button", { type: "button", onClick: () => setEditingArticle(null), className: "px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors", children: "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01" }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm", children: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02" })] })] })] }) }))] }));
}
