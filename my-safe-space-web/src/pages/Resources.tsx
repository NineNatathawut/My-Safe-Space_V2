import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HOSPITALS_DATABASE, type Hospital } from '../data/hospitals';

// 📚 ข้อมูลหมวดหมู่บทความทั้งหมด
const ARTICLE_CATEGORIES = [
    'ทั้งหมด',
    'ความเครียด',
    'ความวิตกกังวล',
    'การนอนหลับ',
    'สติ & Mindfulness',
    'ความสัมพันธ์',
];

// 📚 ข้อมูลเริ่มต้นบทความ (ไม่มีการบังคับใส่ภาพ Default ซ้ำกันแล้ว)
const INITIAL_ARTICLES = [
    {
        id: 1,
        category: 'สติ & Mindfulness',
        title: 'การฝึก Mindfulness เพื่อลดความเครียด',
        description: 'เรียนรู้วิธีอยู่อยู่กับปัจจุบัน ลดความคิดฟุ้งซ่าน และสร้างความสงบจากภายใน',
        readTime: '3 นาที',
        url: 'https://www.thaihealth.or.th',
        imageUrl: '', // ลบภาพเดิมออก เพื่อให้แสดงข้อความหัวข้อแทน
        color: 'bg-purple-100 text-purple-700',
    },
    {
        id: 2,
        category: 'ความเครียด',
        title: 'แบบทดสอบความเครียด — รู้ตัวเองก่อน',
        description: 'ประเมินระดับความเครียดของคุณในวันนี้ เพื่อรับมือได้ตรงจุด',
        readTime: '4 นาที',
        url: 'https://dmh.go.th',
        imageUrl: '',
        color: 'bg-indigo-100 text-indigo-700',
    },
    {
        id: 3,
        category: 'กาย & จิต',
        title: 'Body Scan — สแกนร่างกายเพื่อสงบจิต',
        description: 'สัมผัสความรู้สึกในร่างกายทีละส่วน ช่วยคลายการเกร็งตึง และหยุดคิดฟุ้งซ่าน',
        readTime: '5 นาที',
        url: 'https://www.rama.mahidol.ac.th',
        imageUrl: '',
        color: 'bg-teal-100 text-teal-700',
    },
];

// 📺 ข้อมูลเริ่มต้นวิดีโอ
const INITIAL_VIDEOS = [
    { id: 1, title: 'ดนตรีบำบัด คลื่นเสียงฮีลใจ ลดความเครียด', embedId: '1ZYbU87k9vM' },
    { id: 2, title: 'เทคนิค Mindfulness ฝึกสติใน 5 นาที', embedId: 'inpok4MKVLM' },
];

// 💡 ข้อมูลเริ่มต้นเคล็ดลับ
const INITIAL_TIPS = [
    { id: 1, icon: '📱', title: 'Digital Detox', desc: 'วางมือถือก่อนนอน 1 ชั่วโมง ช่วยลดความเครียดและหลับลึกขึ้น' },
    { id: 2, icon: '☀️', title: 'รับแสงแดดอ่อนๆ', desc: 'แสงแดดยามเช้าช่วยปรับสมดุลฮอร์โมนเซโรโทนิน ทำให้อารมณ์ดีขึ้น' },
    { id: 3, icon: '✍️', title: 'บันทึกสิ่งดีๆ', desc: 'เขียน 3 สิ่งที่คุณรู้สึกขอบคุณในแต่ละวัน ช่วยเปลี่ยนมุมมองให้เป็นบวก' },
];

// 🫁 ข้อมูลเริ่มต้นฝึกหายใจ
const INITIAL_BREATHING = {
    title: 'เทคนิคฝึกหายใจผ่อนคลาย 🫁',
    desc: 'วิธีลดความเครียดอย่างรวดเร็ว ช่วยให้ระบบประสาทสงบลง เหมาะสำหรับเวลาที่รู้สึกวิตกกังวลหรือนอนไม่หลับ',
    totalRounds: 3,
    inhaleSec: 4,
    holdSec: 7,
    exhaleSec: 8,
    step1Text: 'หายใจเข้าช้าๆ ทางจมูก',
    step2Text: 'กลั้นหายใจไว้เบาๆ',
    step3Text: 'ผ่อนลมหายใจออกยาวๆ ทางปาก',
};

export default function Resources() {
    const { isAdmin } = useAuth();
    const [isEditMode, setIsEditMode] = useState(false);

    // 🏷️ Category Filter State for Articles
    const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

    // 🏥 Hospital Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // 💾 อ่านข้อมูลจาก localStorage
    const [articles, setArticles] = useState(() => {
        const saved = localStorage.getItem('resources_articles');
        return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
    });

    const [videos, setVideos] = useState(() => {
        const saved = localStorage.getItem('resources_videos');
        return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
    });

    const [tips, setTips] = useState(() => {
        const saved = localStorage.getItem('resources_tips');
        return saved ? JSON.parse(saved) : INITIAL_TIPS;
    });

    const [breathingConfig, setBreathingConfig] = useState(() => {
        const saved = localStorage.getItem('resources_breathing');
        return saved ? JSON.parse(saved) : INITIAL_BREATHING;
    });

    // 🫁 Interactive Breathing States
    const [isBreathingActive, setIsBreathingActive] = useState(false);
    const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
    const [breathTimer, setBreathTimer] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);

    // 📝 Admin Form States
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newArticle, setNewArticle] = useState({
        category: 'ความเครียด',
        title: '',
        description: '',
        readTime: '3 นาที',
        url: '',
        imageUrl: '',
        color: 'bg-purple-100 text-purple-700',
    });
    const [newTip, setNewTip] = useState({ icon: '🌸', title: '', desc: '' });

    // 🫁 Logic นับรอบและจังหวะฝึกหายใจ
    useEffect(() => {
        let interval: any = null;

        if (isBreathingActive) {
            if (breathPhase === 'idle') {
                setBreathPhase('inhale');
                setBreathTimer(breathingConfig.inhaleSec || 4);
                setCurrentRound(1);
            } else if (breathTimer > 0) {
                interval = setInterval(() => {
                    setBreathTimer((prev) => prev - 1);
                }, 1000);
            } else {
                if (breathPhase === 'inhale') {
                    setBreathPhase('hold');
                    setBreathTimer(breathingConfig.holdSec || 7);
                } else if (breathPhase === 'hold') {
                    setBreathPhase('exhale');
                    setBreathTimer(breathingConfig.exhaleSec || 8);
                } else if (breathPhase === 'exhale') {
                    const maxRounds = breathingConfig.totalRounds || 3;
                    if (currentRound < maxRounds) {
                        setCurrentRound((prev) => prev + 1);
                        setBreathPhase('inhale');
                        setBreathTimer(breathingConfig.inhaleSec || 4);
                    } else {
                        setIsBreathingActive(false);
                        setBreathPhase('idle');
                        alert(`🎉 เก่งมากเลยครับ! คุณฝึกหายใจครบทั้ง ${maxRounds} รอบเรียบร้อยแล้ว ❤️`);
                    }
                }
            }
        } else {
            setBreathPhase('idle');
            setBreathTimer(0);
            setCurrentRound(1);
        }

        return () => clearInterval(interval);
    }, [isBreathingActive, breathPhase, breathTimer, currentRound, breathingConfig]);

    // 🔍 กรองบทความตามหมวดหมู่
    const filteredArticles = useMemo(() => {
        if (selectedCategory === 'ทั้งหมด') return articles;
        return articles.filter((a: any) => a.category === selectedCategory);
    }, [articles, selectedCategory]);

    // 💾 บันทึกข้อมูลลง localStorage
    const handleToggleEditMode = () => {
        if (isEditMode) {
            localStorage.setItem('resources_articles', JSON.stringify(articles));
            localStorage.setItem('resources_videos', JSON.stringify(videos));
            localStorage.setItem('resources_tips', JSON.stringify(tips));
            localStorage.setItem('resources_breathing', JSON.stringify(breathingConfig));
            alert('บันทึกการแก้ไขเรียบร้อยแล้ว!');
        }
        setIsEditMode(!isEditMode);
    };

    const handleAddVideo = () => {
        if (!newVideoUrl) return;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = newVideoUrl.match(regExp);
        const videoId = match && match[2].length === 11 ? match[2] : null;

        if (videoId) {
            setVideos([...videos, { id: Date.now(), title: 'คลิปใหม่ที่เพิ่มเข้ามา', embedId: videoId }]);
            setNewVideoUrl('');
        } else {
            alert('กรุณากรอก URL ของ YouTube ให้ถูกต้องครับ');
        }
    };

    const handleAddArticle = () => {
        if (!newArticle.title.trim()) return alert('กรุณากรอกหัวข้อบทความ');
        setArticles([...articles, { ...newArticle, id: Date.now() }]);
        setNewArticle({
            category: 'ความเครียด',
            title: '',
            description: '',
            readTime: '3 นาที',
            url: '',
            imageUrl: '',
            color: 'bg-purple-100 text-purple-700',
        });
    };

    const handleAddTip = () => {
        if (!newTip.title.trim() || !newTip.desc.trim()) return alert('กรุณากรอกข้อมูลเคล็ดลับให้ครบถ้วน');
        setTips([...tips, { ...newTip, id: Date.now() }]);
        setNewTip({ icon: '🌸', title: '', desc: '' });
    };

    // Hospital Autocomplete
    const provincesList = useMemo(() => {
        if (!HOSPITALS_DATABASE) return [];
        return Array.from(new Set(HOSPITALS_DATABASE.map((h) => h.province)));
    }, []);

    const suggestions = useMemo(() => {
        if (!searchTerm.trim()) return [];
        return provincesList.filter((province) => province.toLowerCase().includes(searchTerm.trim().toLowerCase()));
    }, [searchTerm, provincesList]);

    const filteredHospitals = useMemo(() => {
        if (!HOSPITALS_DATABASE || !searchTerm.trim()) return [];
        return HOSPITALS_DATABASE.filter(
            (hospital) =>
                hospital.province.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                hospital.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [searchTerm]);

    const handleSelectProvince = (provinceName: string) => {
        setSearchTerm(provinceName);
        setShowSuggestions(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* 🛡️ แถบเครื่องมือ Admin */}
            {isAdmin && (
                <div className="sticky top-0 z-50 bg-amber-500 text-white px-6 py-3 shadow-lg flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-sm md:text-base">
                        <span>⚙️ โหมดผู้ดูแลระบบ (Admin View)</span>
                        <span className="bg-amber-600 text-xs px-2 py-0.5 rounded-full font-normal">หน้าทรัพยากร</span>
                    </div>
                    <button
                        onClick={handleToggleEditMode}
                        className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all shadow-sm ${isEditMode
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-white text-amber-900 hover:bg-amber-100'
                            }`}
                    >
                        {isEditMode ? '💾 บันทึกการแก้ไข' : '✏️ เปิดโหมดแก้ไขหน้างาน'}
                    </button>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 pt-10 space-y-12">
                {/* Header */}
                <section className="text-center space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">แหล่งข้อมูลและทรัพยากรสุขภาพจิต 📚</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        รวบรวมเครื่องมือ บทความ และหน่วยงานที่พร้อมช่วยเหลือคุณในวันที่ใจเหนื่อยล้า คุณไม่ได้อยู่ตัวคนเดียวนะ
                    </p>
                </section>

                {/* Emergency Call */}
                <section className="bg-red-50 border border-red-100 rounded-3xl p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-red-700 mb-6 flex items-center gap-2">
                        <span>🚨</span> ต้องการความช่วยเหลือด่วนใช่ไหม?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a href="tel:1323" className="bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow border border-red-50">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-lg">1323</div>
                            <div>
                                <div className="font-bold text-gray-800">สายด่วนสุขภาพจิต</div>
                                <div className="text-sm text-gray-500">โทรฟรี 24 ชั่วโมง</div>
                            </div>
                        </a>
                        <a href="tel:021136789" className="bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow border border-red-50">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-2xl">📞</div>
                            <div>
                                <div className="font-bold text-gray-800">สมาคมสะมาริตันส์</div>
                                <div className="text-sm text-gray-500">บริการรับฟังด้วยใจ ไม่ตัดสิน (12:00-22:00)</div>
                            </div>
                        </a>
                    </div>
                </section>

                {/* 📖 บทความจัดการความเครียด */}
                <section className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📖</span>
                            <h2 className="text-2xl font-bold text-purple-950">บทความจัดการความเครียด</h2>
                        </div>

                        {/* Filter Categories */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {ARTICLE_CATEGORIES.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shadow-sm ${selectedCategory === category
                                        ? 'bg-purple-600 text-white shadow-purple-200'
                                        : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ฟอร์มสำหรับ Admin เพิ่มบทความใหม่ */}
                    {isEditMode && (
                        <div className="p-5 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl space-y-3">
                            <span className="font-bold text-sm text-amber-900 block">➕ เพิ่มบทความใหม่ (Admin)</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-amber-900">หมวดหมู่</label>
                                    <select
                                        value={newArticle.category}
                                        onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                    >
                                        {ARTICLE_CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-amber-900">หัวข้อบทความ</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น การฝึก Mindfulness เพื่อลดความเครียด"
                                        value={newArticle.title}
                                        onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-amber-900">คำอธิบายสั้นๆ</label>
                                <input
                                    type="text"
                                    placeholder="เช่น เรียนรู้วิธีอยู่กับปัจจุบัน..."
                                    value={newArticle.description}
                                    onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-amber-900">🔗 ลิงก์เว็บสำหรับอ่านต่อ (URL)</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/article"
                                        value={newArticle.url}
                                        onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-amber-900">🖼️ ลิงก์รูปภาพหน้าปก (ถ้าไม่ใส่จะโชร์หัวข้อแทน)</label>
                                    <input
                                        type="url"
                                        placeholder="เว้นว่างไว้หากต้องการให้แสดงหัวข้อแทนรูป"
                                        value={newArticle.imageUrl}
                                        onChange={(e) => setNewArticle({ ...newArticle, imageUrl: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddArticle}
                                className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors"
                            >
                                + เพิ่มบทความนี้ลงในการ์ด
                            </button>
                        </div>
                    )}

                    {/* 🎴 รายการบทความ (Cards Grid) */}
                    {filteredArticles.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400">ไม่พบบทความในหมวดหมู่ "{selectedCategory}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredArticles.map((article: any) => (
                                <div
                                    key={article.id}
                                    className="bg-white rounded-3xl border border-purple-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between relative group"
                                >
                                    {/* 🖼️ ส่วนแสดงผลรูปภาพ หรือ แสดงข้อความหัวข้อเมื่อไม่มีรูป */}
                                    {article.imageUrl ? (
                                        <div className="h-44 bg-purple-50 overflow-hidden relative">
                                            <img
                                                src={article.imageUrl}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-44 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-6 flex flex-col justify-between relative overflow-hidden group-hover:brightness-95 transition-all">
                                            <span className="text-xs font-semibold px-2.5 py-1 bg-white/60 backdrop-blur-md rounded-full w-fit text-sky-900 border border-sky-200">
                                                📖 บทความ
                                            </span>
                                            <h3 className="font-bold text-lg leading-snug line-clamp-3 text-sky-950">
                                                {article.title}
                                            </h3>
                                        </div>
                                    )}

                                    {/* เนื้อหาภายในการ์ด */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-700 inline-block">
                                                {article.category}
                                            </span>

                                            {/* ✏️ โหมดแก้ไขบทความ */}
                                            {isEditMode ? (
                                                <div className="space-y-2 pt-2 border-t border-amber-200 bg-amber-50/50 p-2 rounded-xl">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-amber-900 block">🖼️ เปลี่ยนรูปภาพ (เว้นว่างเพื่อโชว์ข้อความ):</label>
                                                        <input
                                                            type="text"
                                                            value={article.imageUrl || ''}
                                                            onChange={(e) => {
                                                                const updated = articles.map((a: any) =>
                                                                    a.id === article.id ? { ...a, imageUrl: e.target.value } : a
                                                                );
                                                                setArticles(updated);
                                                            }}
                                                            placeholder="ลบลิงก์ออกเพื่อแสดงข้อความแทนรูป..."
                                                            className="text-xs text-amber-900 w-full border border-amber-300 bg-white rounded p-1 outline-none mt-0.5"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-amber-900 block">📝 หัวข้อบทความ:</label>
                                                        <input
                                                            type="text"
                                                            value={article.title}
                                                            onChange={(e) => {
                                                                const updated = articles.map((a: any) =>
                                                                    a.id === article.id ? { ...a, title: e.target.value } : a
                                                                );
                                                                setArticles(updated);
                                                            }}
                                                            className="font-bold text-gray-800 w-full border border-amber-300 bg-white rounded text-sm outline-none p-1 mt-0.5"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-amber-900 block">💬 คำอธิบายสั้น:</label>
                                                        <textarea
                                                            value={article.description || ''}
                                                            onChange={(e) => {
                                                                const updated = articles.map((a: any) =>
                                                                    a.id === article.id ? { ...a, description: e.target.value } : a
                                                                );
                                                                setArticles(updated);
                                                            }}
                                                            placeholder="คำอธิบาย..."
                                                            className="text-xs text-gray-600 w-full border border-amber-300 bg-white rounded p-1 outline-none mt-0.5"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-amber-900 block">🔗 ลิงก์อ่านเพิ่มเติม (URL):</label>
                                                        <input
                                                            type="text"
                                                            value={article.url || ''}
                                                            onChange={(e) => {
                                                                const updated = articles.map((a: any) =>
                                                                    a.id === article.id ? { ...a, url: e.target.value } : a
                                                                );
                                                                setArticles(updated);
                                                            }}
                                                            placeholder="https://..."
                                                            className="text-xs text-blue-600 w-full border border-amber-300 bg-white rounded p-1 outline-none mt-0.5"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="font-bold text-gray-800 text-base leading-snug line-clamp-2">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                                                        {article.description || 'กดอ่านเพิ่มเติมเพื่อดูเนื้อหาบทความฉบับเต็ม'}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {/* ปุ่มลิงก์อ่านเพิ่มเติม */}
                                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">⏱️ อ่าน {article.readTime || '3 นาที'}</span>
                                            {article.url ? (
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 hover:underline group-hover:translate-x-0.5 transition-transform"
                                                >
                                                    <span>อ่านต่อ</span>
                                                    <span>→</span>
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-300">ไม่มีลิงก์</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* ปุ่มลบสำหรับการ์ด */}
                                    {isEditMode && (
                                        <button
                                            onClick={() => setArticles(articles.filter((a: any) => a.id !== article.id))}
                                            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 text-xs z-10"
                                            title="ลบบทความนี้"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 🫁 4. เทคนิคฝึกหายใจ */}
                <section className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-6 md:p-8 border border-teal-100 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-4 text-center md:text-left w-full">
                            {isEditMode ? (
                                <div className="space-y-3 bg-amber-50/90 p-4 rounded-2xl border border-amber-300">
                                    <label className="block text-xs font-bold text-amber-900">✏️ ตั้งค่าข้อความหัวข้อ & คำอธิบาย</label>
                                    <input
                                        type="text"
                                        value={breathingConfig.title}
                                        onChange={(e) => setBreathingConfig({ ...breathingConfig, title: e.target.value })}
                                        className="text-lg font-bold text-teal-900 bg-white border border-amber-300 rounded-xl px-3 py-1.5 w-full outline-none"
                                    />
                                    <textarea
                                        value={breathingConfig.desc}
                                        onChange={(e) => setBreathingConfig({ ...breathingConfig, desc: e.target.value })}
                                        className="text-teal-800 text-sm w-full bg-white border border-amber-300 rounded-xl p-2 outline-none"
                                    />

                                    <div className="pt-2 border-t border-amber-200">
                                        <label className="block text-xs font-bold text-amber-900 mb-1">🔄 จำนวนรอบที่แนะนำให้ฝึก</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={breathingConfig.totalRounds || 3}
                                                onChange={(e) => setBreathingConfig({ ...breathingConfig, totalRounds: Number(e.target.value) })}
                                                className="w-20 bg-white border border-amber-300 rounded-lg p-1.5 text-center font-bold text-teal-900 outline-none"
                                            />
                                            <span className="text-sm text-amber-900 font-medium">รอบ</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-amber-200 space-y-2">
                                        <label className="block text-xs font-bold text-amber-900">⏱️ ตั้งค่าข้อความและระยะเวลาแต่ละขั้นตอน</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={breathingConfig.step1Text}
                                                onChange={(e) => setBreathingConfig({ ...breathingConfig, step1Text: e.target.value })}
                                                className="flex-1 bg-white border border-amber-300 rounded-lg p-1.5 text-xs outline-none"
                                            />
                                            <input
                                                type="number"
                                                value={breathingConfig.inhaleSec}
                                                onChange={(e) => setBreathingConfig({ ...breathingConfig, inhaleSec: Number(e.target.value) })}
                                                className="w-16 bg-white border border-amber-300 rounded-lg p-1.5 text-center text-xs font-bold"
                                            />
                                            <span className="text-xs text-amber-900">วิ</span>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={breathingConfig.step2Text}
                                                onChange={(e) => setBreathingConfig({ ...breathingConfig, step2Text: e.target.value })}
                                                className="flex-1 bg-white border border-amber-300 rounded-lg p-1.5 text-xs outline-none"
                                            />
                                            <input
                                                type="number"
                                                value={breathingConfig.holdSec}
                                                onChange={(e) => setBreathingConfig({ ...breathingConfig, holdSec: Number(e.target.value) })}
                                                className="w-16 bg-white border border-amber-300 rounded-lg p-1.5 text-center text-xs font-bold"
                                            />
                                            <span className="text-xs text-amber-900">วิ</span>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={breathingConfig.step3Text}
                                                onChange={(e) => setBreathingConfig({ ...breathingConfig, step3Text: e.target.value })}
                                                className="flex-1 bg-white border border-amber-300 rounded-lg p-1.5 text-xs outline-none"
                                            />
                                            <input
                                                type="number"
                                                value={breathingConfig.exhaleSec}
                                                onChange={(e) => setBreathingConfig({ ...breathingConfig, exhaleSec: Number(e.target.value) })}
                                                className="w-16 bg-white border border-amber-300 rounded-lg p-1.5 text-center text-xs font-bold"
                                            />
                                            <span className="text-xs text-amber-900">วิ</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-teal-800">{breathingConfig.title}</h2>
                                        <span className="bg-teal-200/80 text-teal-800 font-bold text-xs px-3 py-1 rounded-full">
                                            เป้าหมาย: {breathingConfig.totalRounds || 3} รอบ
                                        </span>
                                    </div>
                                    <p className="text-teal-700 text-sm leading-relaxed">{breathingConfig.desc}</p>
                                </>
                            )}

                            {!isEditMode && (
                                <ul className="text-sm text-teal-800 space-y-2 inline-block text-left w-full pt-2">
                                    <li className={`transition-all flex items-center gap-2 ${breathPhase === 'inhale' ? 'font-bold text-teal-900 translate-x-1' : ''}`}>
                                        <span>1.</span>
                                        <span>{breathingConfig.step1Text}</span>
                                        <span className="text-xs bg-teal-200/60 text-teal-800 px-2.5 py-0.5 rounded-full font-medium">
                                            ({breathingConfig.inhaleSec} วิ)
                                        </span>
                                    </li>
                                    <li className={`transition-all flex items-center gap-2 ${breathPhase === 'hold' ? 'font-bold text-teal-900 translate-x-1' : ''}`}>
                                        <span>2.</span>
                                        <span>{breathingConfig.step2Text}</span>
                                        <span className="text-xs bg-emerald-200/60 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
                                            ({breathingConfig.holdSec} วิ)
                                        </span>
                                    </li>
                                    <li className={`transition-all flex items-center gap-2 ${breathPhase === 'exhale' ? 'font-bold text-teal-900 translate-x-1' : ''}`}>
                                        <span>3.</span>
                                        <span>{breathingConfig.step3Text}</span>
                                        <span className="text-xs bg-sky-200/60 text-sky-800 px-2.5 py-0.5 rounded-full font-medium">
                                            ({breathingConfig.exhaleSec} วิ)
                                        </span>
                                    </li>
                                </ul>
                            )}
                        </div>

                        <div className="flex flex-col items-center justify-center shrink-0 space-y-3">
                            <div
                                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-1000 border-4 ${breathPhase === 'inhale'
                                    ? 'scale-125 bg-teal-200 border-teal-400 shadow-teal-200/50'
                                    : breathPhase === 'hold'
                                        ? 'scale-125 bg-emerald-300 border-emerald-500 shadow-emerald-200/50 animate-pulse'
                                        : breathPhase === 'exhale'
                                            ? 'scale-90 bg-sky-200 border-sky-400 shadow-sky-200/50'
                                            : 'bg-white border-teal-100 hover:scale-105'
                                    }`}
                            >
                                {isBreathingActive ? (
                                    <>
                                        <span className="text-xs font-bold text-teal-800 mb-1">
                                            {breathPhase === 'inhale' && '🌬️ หายใจเข้า'}
                                            {breathPhase === 'hold' && '⏸️ กลั้นไว้'}
                                            {breathPhase === 'exhale' && '💨 หายใจออก'}
                                        </span>
                                        <span className="text-3xl font-extrabold text-teal-900">{breathTimer}</span>
                                        <span className="text-[10px] text-teal-700 font-bold mt-1 bg-white/60 px-2 py-0.5 rounded-full">
                                            รอบที่ {currentRound} / {breathingConfig.totalRounds || 3}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-teal-600 font-bold text-sm text-center px-2">🍃 กดเพื่อเริ่มฝึก</span>
                                )}
                            </div>

                            <button
                                onClick={() => setIsBreathingActive(!isBreathingActive)}
                                className={`px-5 py-2 rounded-full font-bold text-sm shadow-sm transition-all ${isBreathingActive ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-teal-600 text-white hover:bg-teal-700'
                                    }`}
                            >
                                {isBreathingActive ? '⏹️ หยุดการฝึก' : '▶️ เริ่มฝึกหายใจ'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* 📺 5. คลิปวิดีโอแนะนำ */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span>📺</span> คลิปวิดีโอแนะนําฮีลใจ
                        </h2>
                    </div>

                    {isEditMode && (
                        <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl flex flex-col md:flex-row gap-2">
                            <input
                                type="text"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="วางลิงก์ YouTube ที่นี่..."
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:border-amber-500 bg-white"
                            />
                            <button onClick={handleAddVideo} className="bg-amber-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-amber-700">
                                + เพิ่มวิดีโอ
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {videos.map((video: any) => (
                            <div key={video.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                <div className="aspect-video">
                                    <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${video.embedId}`} title={video.title} allowFullScreen />
                                </div>
                                <div className="p-4">
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            value={video.title}
                                            onChange={(e) => {
                                                const updated = videos.map((v: any) => (v.id === video.id ? { ...v, title: e.target.value } : v));
                                                setVideos(updated);
                                            }}
                                            className="w-full font-bold text-gray-800 border-b border-amber-400 outline-none bg-amber-50 px-1"
                                        />
                                    ) : (
                                        <h3 className="font-bold text-gray-800">{video.title}</h3>
                                    )}
                                </div>

                                {isEditMode && (
                                    <button
                                        onClick={() => setVideos(videos.filter((v: any) => v.id !== video.id))}
                                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-md hover:bg-red-700"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* 💡 6. เคล็ดลับดูแลสุขภาพจิตประจำวัน */}
                <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 text-center">💡 เคล็ดลับดูแลใจประจำวัน</h2>

                    {isEditMode && (
                        <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl space-y-3">
                            <span className="font-bold text-sm text-amber-900 block">➕ เพิ่มเคล็ดลับใหม่</span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    placeholder="ไอคอน อิโมจิ (เช่น ☕)"
                                    value={newTip.icon}
                                    onChange={(e) => setNewTip({ ...newTip, icon: e.target.value })}
                                    className="px-3 py-2 border rounded-xl text-sm bg-white outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="หัวข้อเคล็ดลับ"
                                    value={newTip.title}
                                    onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                                    className="px-3 py-2 border rounded-xl text-sm bg-white outline-none md:col-span-2"
                                />
                            </div>
                            <textarea
                                placeholder="รายละเอียดเคล็ดลับ..."
                                value={newTip.desc}
                                onChange={(e) => setNewTip({ ...newTip, desc: e.target.value })}
                                className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none"
                            />
                            <button onClick={handleAddTip} className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-700">
                                + บันทึกเคล็ดลับ
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tips.map((tip: any) => (
                            <div key={tip.id} className="text-center space-y-2 relative group p-2">
                                <div className="text-4xl mb-3">{tip.icon}</div>
                                {isEditMode ? (
                                    <>
                                        <input
                                            type="text"
                                            value={tip.title}
                                            onChange={(e) => {
                                                const updated = tips.map((t: any) => (t.id === tip.id ? { ...t, title: e.target.value } : t));
                                                setTips(updated);
                                            }}
                                            className="font-bold text-gray-800 text-center w-full border-b border-amber-400 bg-amber-50 outline-none"
                                        />
                                        <textarea
                                            value={tip.desc}
                                            onChange={(e) => {
                                                const updated = tips.map((t: any) => (t.id === tip.id ? { ...t, desc: e.target.value } : t));
                                                setTips(updated);
                                            }}
                                            className="text-sm text-gray-500 text-center w-full border border-amber-300 rounded p-1 bg-amber-50 outline-none"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-gray-800">{tip.title}</h3>
                                        <p className="text-sm text-gray-500">{tip.desc}</p>
                                    </>
                                )}

                                {isEditMode && (
                                    <button
                                        onClick={() => setTips(tips.filter((t: any) => t.id !== tip.id))}
                                        className="absolute top-0 right-0 text-red-500 hover:text-red-700 p-1 text-xs"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* 🏥 7. ค้นหาโรงพยาบาล */}
                <section className="space-y-6 pt-6 border-t border-gray-200">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-pink-400">โรงพยาบาลรัฐใกล้ตัวที่มีผู้เชี่ยวชาญด้านสุขภาพจิต</h2>
                    </div>

                    <div className="relative max-w-md mx-auto">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="ระบุจังหวัดที่คุณอยู่"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                className="w-full px-6 py-3.5 pr-12 border-2 border-pink-300 focus:border-pink-400 rounded-full outline-none text-gray-700 placeholder-gray-400 text-base shadow-sm transition-all bg-white"
                            />
                            <button type="button" className="absolute right-4 text-pink-400 hover:text-pink-500 transition-colors p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform rotate-45">
                                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.917H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.917a.75.75 0 0 0 .926.941a60.519 60.519 0 0 0 18.445-8.986a.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                </svg>
                            </button>
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-pink-100 rounded-2xl shadow-lg z-30 overflow-hidden">
                                {suggestions.map((province) => (
                                    <button
                                        key={province}
                                        type="button"
                                        onClick={() => handleSelectProvince(province)}
                                        className="w-full text-left px-6 py-3 hover:bg-pink-50 text-gray-700 font-medium transition-colors border-b border-gray-50 last:border-none flex items-center gap-2"
                                    >
                                        <span>📍</span>
                                        <span>{province}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {searchTerm.trim() !== '' && (
                        <div className="space-y-6 pt-4 animate-fadeIn">
                            <h3 className="text-xl font-bold text-gray-700 border-b border-gray-100 pb-2">{searchTerm}</h3>

                            {filteredHospitals.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-500">ไม่พบข้อมูลโรงพยาบาลใน "{searchTerm}"</p>
                                    <p className="text-xs text-gray-400 mt-1">ลองค้นหาด้วยชื่อจังหวัดใกล้เคียง หรือโทรสายด่วน 1323</p>
                                </div>
                            ) : (
                                filteredHospitals.map((hospital: Hospital) => (
                                    <div
                                        key={hospital.id}
                                        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 items-start"
                                    >
                                        <div className="w-16 h-16 shrink-0 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2 mx-auto sm:mx-0">
                                            <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
                                            </svg>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 w-full">
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-800">{hospital.name}</h4>
                                                <p className="text-xs text-gray-400">{hospital.type || 'โรงพยาบาลรัฐ'}</p>
                                            </div>

                                            {hospital.phone && (
                                                <div className="flex items-center gap-2 pt-1">
                                                    <span className="text-red-400">📞</span>
                                                    <a href={`tel:${hospital.phone.replace(/-/g, '')}`} className="font-bold text-gray-800 hover:underline">
                                                        {hospital.phone}
                                                    </a>
                                                </div>
                                            )}

                                            {hospital.address && (
                                                <div className="flex items-start gap-2">
                                                    <span className="text-red-400 shrink-0 mt-0.5">🏥</span>
                                                    <div className="leading-relaxed">
                                                        <span>{hospital.address}</span>
                                                        {hospital.mapUrl && (
                                                            <a
                                                                href={hospital.mapUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-2 font-bold text-gray-700 hover:text-purple-600 border-b border-gray-400 hover:border-purple-600 transition-colors"
                                                            >
                                                                ดูแผนที่
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {hospital.facebook && (
                                                <div className="flex items-center gap-2 pt-1">
                                                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">f</span>
                                                    <span className="font-bold text-gray-800">{hospital.facebook}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}