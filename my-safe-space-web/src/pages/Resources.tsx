import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HOSPITALS_DATABASE, type Hospital } from '../data/hospitals';
import PodcastVoiceCard from '../components/PodcastVoiceCard';
import { SEED_PODCASTS } from '../data/podcasts';
import type { PodcastEpisode } from '../types/podcast';
import {
    loadResourcesContent,
    saveResourcesContent,
    deleteResourceItem,
    type ResourceArticle,
    type ResourceVideo,
    type ResourceTip,
} from '../services/resourcesService';
import { parsePodcastLink, describeLink } from '../utils/podcastLink';
import cartoon1 from '../assets/cartoons/cartoon-1.png';
import cartoon2 from '../assets/cartoons/cartoon-2.png';
import cartoon5 from '../assets/cartoons/cartoon-5.png';
import cartoon6 from '../assets/cartoons/cartoon-6.png';
import { Icon } from '../components/Icon';

// ข้อมูลหมวดหมู่บทความทั้งหมด
const ARTICLE_CATEGORIES = [
    'ทั้งหมด',
    'ความเครียด',
    'ความวิตกกังวล',
    'การนอนหลับ',
    'สติ & Mindfulness',
    'ความสัมพันธ์',
];

// ข้อมูลเริ่มต้นบทความ (ไม่มีการบังคับใส่ภาพ Default ซ้ำกันแล้ว)
const INITIAL_ARTICLES = [
    {
        id: 1,
        category: 'สติ & Mindfulness',
        title: 'การฝึก Mindfulness เพื่อลดความเครียด',
        description: 'เรียนรู้วิธีอยู่อยู่กับปัจจุบัน ลดความคิดฟุ้งซ่าน และสร้างความสงบจากภายใน',
        readTime: '3 นาที',
        url: 'https://www.thaihealth.or.th',
        imageUrl: '', // ลบภาพเดิมออก เพื่อให้แสดงข้อความหัวข้อแทน
        color: 'bg-owl-soft text-owl-pressed',
    },
    {
        id: 2,
        category: 'ความเครียด',
        title: 'แบบทดสอบความเครียด — รู้ตัวเองก่อน',
        description: 'ประเมินระดับความเครียดของคุณในวันนี้ เพื่อรับมือได้ตรงจุด',
        readTime: '4 นาที',
        url: 'https://dmh.go.th',
        imageUrl: '',
        color: 'bg-owl-soft text-owl-pressed',
    },
    {
        id: 3,
        category: 'กาย & จิต',
        title: 'Body Scan — สแกนร่างกายเพื่อสงบจิต',
        description: 'สัมผัสความรู้สึกในร่างกายทีละส่วน ช่วยคลายการเกร็งตึง และหยุดคิดฟุ้งซ่าน',
        readTime: '5 นาที',
        url: 'https://www.rama.mahidol.ac.th',
        imageUrl: '',
        color: 'bg-macaw/10 text-ink',
    },
];

// ข้อมูลเริ่มต้นวิดีโอ
const INITIAL_VIDEOS = [
    { id: 1, title: 'ดนตรีบำบัด คลื่นเสียงฮีลใจ ลดความเครียด', embedId: '1ZYbU87k9vM' },
    { id: 2, title: 'เทคนิค Mindfulness ฝึกสติใน 5 นาที', embedId: 'inpok4MKVLM' },
];

// ข้อมูลเริ่มต้นเคล็ดลับ
const INITIAL_TIPS = [
    { id: 1, icon: '📱', title: 'Digital Detox', desc: 'วางมือถือก่อนนอน 1 ชั่วโมง ช่วยลดความเครียดและหลับลึกขึ้น' },
    { id: 2, icon: '☀️', title: 'รับแสงแดดอ่อนๆ', desc: 'แสงแดดยามเช้าช่วยปรับสมดุลฮอร์โมนเซโรโทนิน ทำให้อารมณ์ดีขึ้น' },
    { id: 3, icon: '✍️', title: 'บันทึกสิ่งดีๆ', desc: 'เขียน 3 สิ่งที่คุณรู้สึกขอบคุณในแต่ละวัน ช่วยเปลี่ยนมุมมองให้เป็นบวก' },
];

// เทคนิคฝึกหายใจ (3 โหมด)
interface BreathingStep {
    label: string;
    sec: number;
    kind: 'inhale' | 'hold' | 'exhale';
}

interface BreathingMode {
    id: string;
    tabLabel: string;
    name: string;
    subtitle: string;
    suitableFor: string;
    accentTab: string;
    accentDot: string;
    accentGlow: string;
    ringText: string;
    steps: BreathingStep[];
}

const BREATHING_MODES: BreathingMode[] = [
    {
        id: '478',
        tabLabel: '4-7-8',
        name: 'คลายเครียด',
        subtitle: 'ผ่อนคลายก่อนนอน',
        suitableFor: 'เครียดสะสม, นอนไม่หลับ, ตื่นตระหนก',
        accentTab: 'border-owl bg-owl-soft text-owl-pressed',
        accentDot: 'bg-owl',
        accentGlow: 'from-owl/40 to-owl-mint/30',
        ringText: 'text-owl',
        steps: [
            { label: 'หายใจเข้าลึกๆ ทางจมูก', sec: 4, kind: 'inhale' },
            { label: 'กลั้นหายใจไว้', sec: 7, kind: 'hold' },
            { label: 'ผ่อนลมหายใจออกยาวๆ', sec: 8, kind: 'exhale' },
        ],
    },
    {
        id: 'box',
        tabLabel: '4-4-4-4',
        name: 'เรียกสมาธิ',
        subtitle: 'Box Breathing ระดับสากล',
        suitableFor: 'กังวลก่อนสอบ, สมาธิสั้น, อยากตัดสิ่งรบกวน',
        accentTab: 'border-macaw bg-macaw/10 text-macaw',
        accentDot: 'bg-macaw',
        accentGlow: 'from-macaw/40 to-beetle/30',
        ringText: 'text-macaw',
        steps: [
            { label: 'หายใจเข้าทางจมูก', sec: 4, kind: 'inhale' },
            { label: 'กลั้นหายใจไว้', sec: 4, kind: 'hold' },
            { label: 'ผ่อนลมหายใจออก', sec: 4, kind: 'exhale' },
            { label: 'กลั้นหายใจไว้', sec: 4, kind: 'hold' },
        ],
    },
    {
        id: 'coherent',
        tabLabel: '5-5',
        name: 'ปรับสมดุล',
        subtitle: 'Coherent Breathing ไม่ต้องกลั้น',
        suitableFor: 'เหนื่อยล้า, รู้สึกดิ่ง, มือใหม่เริ่มฝึก',
        accentTab: 'border-beetle bg-beetle/10 text-beetle',
        accentDot: 'bg-beetle',
        accentGlow: 'from-beetle/40 to-macaw/30',
        ringText: 'text-beetle',
        steps: [
            { label: 'หายใจเข้าช้าๆ สม่ำเสมอ', sec: 5, kind: 'inhale' },
            { label: 'ผ่อนลมหายใจออกยาวๆ', sec: 5, kind: 'exhale' },
        ],
    },
];

const BREATH_RING_RADIUS = 85;
const BREATH_RING_CIRC = 2 * Math.PI * BREATH_RING_RADIUS;

export default function Resources() {
    const { isAdmin } = useAuth();
    const [isEditMode, setIsEditMode] = useState(false);

    // Category Filter State for Articles
    const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

    // Hospital Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // ข้อมูลเริ่มต้น — จะถูกแทนที่ด้วยข้อมูลจากฐานข้อมูล (ทุกคนเห็นชุดเดียวกัน)
    const [articles, setArticles] = useState<ResourceArticle[]>(INITIAL_ARTICLES as ResourceArticle[]);

    const [videos, setVideos] = useState<ResourceVideo[]>(INITIAL_VIDEOS as ResourceVideo[]);

    const [tips, setTips] = useState<ResourceTip[]>(INITIAL_TIPS as ResourceTip[]);

    // Podcast States
    const [podcasts, setPodcasts] = useState<PodcastEpisode[]>(SEED_PODCASTS);

    // โหลดข้อมูลจริงจากฐานข้อมูล (ทุกคนเห็นข้อมูลเดียวกันทุกเบราว์เซอร์)
    // ถ้า DB มีข้อมูลแล้ว (initialized) → ใช้ข้อมูลจาก DB เสมอแม้หมวดใดจะว่าง
    // ถ้ายังไม่เคยบันทึก (DB ว่างทั้งใหม่) → ใช้ข้อมูลเริ่มต้นในโค้ดแทน
    useEffect(() => {
        let active = true;
        loadResourcesContent().then((data) => {
            if (!active || !data) return;
            if (data.initialized) {
                setArticles(data.articles);
                setVideos(data.videos);
                setTips(data.tips);
                setPodcasts(data.podcasts);
            } else {
                if (data.articles.length > 0) setArticles(data.articles);
                if (data.videos.length > 0) setVideos(data.videos);
                if (data.tips.length > 0) setTips(data.tips);
                if (data.podcasts.length > 0) setPodcasts(data.podcasts);
            }
        });
        return () => { active = false; };
    }, []);
    const [podcastCategory, setPodcastCategory] = useState('ทั้งหมด');
    const [newPodcast, setNewPodcast] = useState({
        title: '',
        speaker: '',
        category: 'การหายใจ',
        link: '',
    });

    const podcastSectionRef = useRef<HTMLElement | null>(null);
    const breathingSectionRef = useRef<HTMLElement | null>(null);
    const [searchParams] = useSearchParams();

    const podcastCategories = useMemo(
        () => ['ทั้งหมด', ...Array.from(new Set(podcasts.map((p) => p.category)))],
        [podcasts]
    );

    const filteredPodcasts = useMemo(() => {
        if (podcastCategory === 'ทั้งหมด') return podcasts;
        return podcasts.filter((p) => p.category === podcastCategory);
    }, [podcasts, podcastCategory]);

    // พรีวิวการ์ดพอดแคสต์จากฟอร์ม
    const previewEpisode = useMemo<PodcastEpisode>(() => {
        const link = newPodcast.link.trim();
        const parsed = link ? parsePodcastLink(link) : null;
        const ep: PodcastEpisode = {
            id: 'preview',
            title: newPodcast.title.trim() || 'ชื่อตอนพอดแคสต์',
            speaker: newPodcast.speaker.trim() || 'ผู้พูดไร้นาม',
            category: newPodcast.category,
        };
        if (parsed?.kind === 'spotify') {
            ep.embedUrl = parsed.embedUrl;
            ep.externalUrl = link;
            ep.externalLabel = 'Spotify';
        } else if (parsed?.kind === 'audio') {
            ep.audioUrl = link;
        } else if (parsed) {
            ep.externalUrl = link;
        }
        return ep;
    }, [newPodcast.title, newPodcast.speaker, newPodcast.category, newPodcast.link]);

    // ถ้ามี ?tab=podcast ให้เลื่อนไปที่ Section พอดแคสต์อัตโนมัติ
    useEffect(() => {
        if (searchParams.get('tab') === 'podcast' && podcastSectionRef.current) {
            podcastSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [searchParams]);

    // ถ้ามี ?tab=breathing ให้เลื่อนไปที่ Section เทคนิคฝึกหายใจอัตโนมัติ
    useEffect(() => {
        if (searchParams.get('tab') === 'breathing' && breathingSectionRef.current) {
            breathingSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [searchParams]);

    // Interactive Breathing States
    const [selectedBreathId, setSelectedBreathId] = useState<string>(BREATHING_MODES[0].id);
    const [durationSec, setDurationSec] = useState(180);
    const [isBreathingActive, setIsBreathingActive] = useState(false);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [breathTimer, setBreathTimer] = useState(0);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [breathComplete, setBreathComplete] = useState(false);

    const selectedMode = BREATHING_MODES.find((m) => m.id === selectedBreathId) ?? BREATHING_MODES[0];
    const breathStep = selectedMode.steps[phaseIndex] || selectedMode.steps[0];
    const ringRef = useRef<SVGCircleElement | null>(null);

    const resetBreathing = () => {
        setIsBreathingActive(false);
        setPhaseIndex(0);
        setBreathTimer(0);
        setElapsedSec(0);
        setBreathComplete(false);
    };

    const handleSelectBreathMode = (id: string) => {
        setSelectedBreathId(id);
        resetBreathing();
    };

    const handleSelectDuration = (sec: number) => {
        setDurationSec(sec);
        resetBreathing();
    };

    const handleToggleBreathing = () => {
        if (isBreathingActive) {
            resetBreathing();
            return;
        }
        setBreathComplete(false);
        setPhaseIndex(0);
        setBreathTimer(selectedMode.steps[0]?.sec || 4);
        setElapsedSec(0);
        setIsBreathingActive(true);
    };

    // Admin Form States
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newArticle, setNewArticle] = useState({
        category: 'ความเครียด',
        title: '',
        description: '',
        readTime: '3 นาที',
        url: '',
        imageUrl: '',
        color: 'bg-owl-soft text-owl-pressed',
    });
    const [newTip, setNewTip] = useState({ icon: '🌸', title: '', desc: '' });

    // Logic ฝึกหายใจตามจังหวะของโหมดที่เลือก (หยุดเมื่อครบระยะเวลาที่ตั้ง)
    useEffect(() => {
        let interval: any = null;

        if (isBreathingActive && breathTimer > 0) {
            interval = setInterval(() => {
                setBreathTimer((prev) => prev - 1);
                setElapsedSec((prev) => prev + 1);
            }, 1000);
        } else if (isBreathingActive && breathTimer === 0) {
            const steps = selectedMode.steps;
            if (phaseIndex < steps.length - 1) {
                setPhaseIndex(phaseIndex + 1);
                setBreathTimer(steps[phaseIndex + 1].sec);
            } else {
                setPhaseIndex(0);
                setBreathTimer(steps[0].sec);
            }
        }

        // จบการฝึกเมื่อครบระยะเวลาที่ตั้งไว้
        if (isBreathingActive && elapsedSec >= durationSec) {
            setIsBreathingActive(false);
            setPhaseIndex(0);
            setBreathTimer(0);
            setBreathComplete(true);
        }

        return () => clearInterval(interval);
    }, [isBreathingActive, breathTimer, phaseIndex, elapsedSec, durationSec, selectedMode]);

    // วาดวงแหวน progress ตามจังหวะของขั้นตอนปัจจุบัน
    useEffect(() => {
        const circle = ringRef.current;
        if (!circle || !isBreathingActive) return;
        circle.style.transition = 'none';
        circle.style.strokeDashoffset = String(BREATH_RING_CIRC);
        void circle.getBoundingClientRect();
        const sec = selectedMode.steps[phaseIndex]?.sec || 4;
        circle.style.transition = `stroke-dashoffset ${sec}s linear`;
        circle.style.strokeDashoffset = '0';
    }, [isBreathingActive, phaseIndex, selectedMode]);

    // กรองบทความตามหมวดหมู่
    const filteredArticles = useMemo(() => {
        if (selectedCategory === 'ทั้งหมด') return articles;
        return articles.filter((a: any) => a.category === selectedCategory);
    }, [articles, selectedCategory]);

    // บันทึกข้อมูลลงฐานข้อมูล (แทน localStorage เดิม)
    const handleToggleEditMode = async () => {
        if (!isEditMode) {
            setIsEditMode(true);
            return;
        }

        const result = await saveResourcesContent({
            articles,
            videos,
            tips,
            breathing: null, // เทคนิคฝึกหายใจเป็นข้อมูลโค้ดคงที่ (แก้ไขได้ในโค้ด)
            podcasts,
        });

        if (result.ok) {
            alert('บันทึกการแก้ไขเรียบร้อยแล้ว!');
            setIsEditMode(false);
        } else {
            alert(`❌ ${result.error || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง'}`);
        }
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

    // ── ลบข้อมูลเข้า DB ทันที ──
    const handleDeleteArticle = async (id: string | number) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบทความนี้?')) return;
        const result = await deleteResourceItem('articles', id);
        if (result.ok) {
            setArticles((prev) => prev.filter((a) => a.id !== id));
        } else {
            alert(`❌ ${result.error || 'ไม่สามารถลบบทความได้'}`);
        }
    };

    const handleDeleteVideo = async (id: string | number) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคลิปนี้?')) return;
        const result = await deleteResourceItem('videos', id);
        if (result.ok) {
            setVideos((prev) => prev.filter((v) => v.id !== id));
        } else {
            alert(`❌ ${result.error || 'ไม่สามารถลบคลิปได้'}`);
        }
    };

    const handleDeleteTip = async (id: string | number) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเคล็ดลับนี้?')) return;
        const result = await deleteResourceItem('tips', id);
        if (result.ok) {
            setTips((prev) => prev.filter((t) => t.id !== id));
        } else {
            alert(`❌ ${result.error || 'ไม่สามารถลบเคล็ดลับได้'}`);
        }
    };

    const handleDeletePodcast = async (id: string | number) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตอนพอดแคสต์นี้?')) return;
        const result = await deleteResourceItem('podcasts', id);
        if (result.ok) {
            setPodcasts((prev) => prev.filter((p) => p.id !== id));
        } else {
            alert(`❌ ${result.error || 'ไม่สามารถลบตอนนี้ได้'}`);
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
            color: 'bg-owl-soft text-owl-pressed',
        });
    };

    const handleAddTip = () => {
        if (!newTip.title.trim() || !newTip.desc.trim()) return alert('กรุณากรอกข้อมูลเคล็ดลับให้ครบถ้วน');
        setTips([...tips, { ...newTip, id: Date.now() }]);
        setNewTip({ icon: '🌸', title: '', desc: '' });
    };

    const handleAddPodcast = () => {
        if (!newPodcast.title.trim()) return alert('กรุณากรอกชื่อตอนพอดแคสต์');
        const link = newPodcast.link.trim();
        if (!link) return alert('กรุณากรอกลิงก์ Spotify หรือไฟล์เสียง mp3');

        const parsed = parsePodcastLink(link);
        const newEpisode: PodcastEpisode = {
            id: `podcast-${Date.now()}`,
            title: newPodcast.title.trim(),
            speaker: newPodcast.speaker.trim() || 'ผู้พูดไร้นาม',
            category: newPodcast.category,
        };
        if (parsed.kind === 'spotify') {
            newEpisode.embedUrl = parsed.embedUrl;
            newEpisode.externalUrl = link;
            newEpisode.externalLabel = 'Spotify';
        } else if (parsed.kind === 'audio') {
            newEpisode.audioUrl = link;
        } else {
            newEpisode.externalUrl = link;
        }

        setPodcasts([...podcasts, newEpisode]);
        setNewPodcast({
            title: '',
            speaker: '',
            category: 'การหายใจ',
            link: '',
        });
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
        <div className="min-h-screen pb-16">
            {/* แถบเครื่องมือ Admin */}
            {isAdmin && (
                <div className="sticky top-[70px] z-30 bg-amber-500 text-white px-6 py-3 shadow-lg flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-sm md:text-base">
                        <span className="flex items-center gap-1.5"><Icon name="settings" size={16} /> โหมดผู้ดูแลระบบ (Admin View)</span>
                        <span className="bg-amber-600 text-xs px-2 py-0.5 rounded-full font-normal">หน้าคลังความรู้</span>
                    </div>
                    <button
                        onClick={handleToggleEditMode}
                        className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all shadow-sm inline-flex items-center gap-1.5 ${isEditMode
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-white text-amber-900 hover:bg-amber-100'
                            }`}
                    >
                        {isEditMode ? (<><Icon name="check" size={16} /> บันทึกการแก้ไข</>) : (<><Icon name="pencil" size={16} /> เปิดโหมดแก้ไขหน้างาน</>)}
                    </button>
                </div>
            )}

            {/* Zone 1: Header hero */}
            <div>
                <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black text-ink">แหล่งข้อมูลและคลังความรู้สุขภาพจิต</h1>
                    <p className="text-body-strong max-w-2xl mx-auto">
                        รวบรวมเครื่องมือ บทความ และหน่วยงานที่พร้อมช่วยเหลือคุณในวันที่ใจเหนื่อยล้า คุณไม่ได้อยู่ตัวคนเดียวนะ
                    </p>
                </div>
            </div>

   

                {/* Zone 2: บทความจัดการความเครียด */}
                <section className="w-screen ml-[calc(50%_-_50vw)] bg-sky-100/60">
                    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 relative">
                        {/* มาสคอตซ้าย — ลอยขอบ ระดับสูง */}
                        <div className="hidden lg:block absolute -left-14 xl:-left-20 top-16 xl:top-24 -translate-y-1/2 pointer-events-none z-10">
                            <div className="animate-float-side">
                                <img src={cartoon5} alt="" aria-hidden="true" className="w-24 xl:w-28 -rotate-12 drop-shadow-lg" />
                            </div>
                        </div>

                        {/* มาสคอตขวา — ลอยขอบ ระดับล่าง */}
                        <div className="hidden lg:block absolute -right-14 xl:-right-20 bottom-16 xl:bottom-24 pointer-events-none z-10">
                            <div className="animate-float-side" style={{ animationDelay: '-2s' }}>
                                <img src={cartoon6} alt="" aria-hidden="true" className="w-24 xl:w-28 rotate-12 drop-shadow-lg" />
                            </div>
                        </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Icon name="book" size={26} />
                            <h2 className="text-2xl font-black text-ink">บทความจัดการความเครียด</h2>
                        </div>

                        {/* Filter Categories */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {ARTICLE_CATEGORIES.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === category
                                        ? 'bg-owl text-white shadow-lip-sm'
                                        : 'bg-white text-body-strong hover:bg-owl-soft border border-hairline'
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
                            <span className="font-bold text-sm text-amber-900 block">เพิ่มบทความใหม่ (Admin)</span>
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
                                    <label className="text-xs font-bold text-amber-900">ลิงก์เว็บสำหรับอ่านต่อ (URL)</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/article"
                                        value={newArticle.url}
                                        onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-amber-900">ลิงก์รูปภาพหน้าปก (ถ้าไม่ใส่จะโชร์หัวข้อแทน)</label>
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

                    {/* รายการบทความ (Cards Grid) */}
                    {filteredArticles.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-hairline">
                            <p className="text-body-soft">ไม่พบบทความในหมวดหมู่ "{selectedCategory}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredArticles.map((article: any) => (
                                <div
                                    key={article.id}
                                    className="bg-white rounded-3xl border border-hairline shadow-card hover:shadow-md transition-all overflow-hidden flex flex-col justify-between relative group"
                                >
                                    {/* ส่วนแสดงผลรูปภาพ หรือ แสดงข้อความหัวข้อเมื่อไม่มีรูป */}
                                    {article.imageUrl ? (
                                        <div className="h-44 bg-owl-soft/40 overflow-hidden relative">
                                            <img
                                                src={article.imageUrl}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-44 bg-gradient-to-br from-owl-soft to-owl-mint/60 p-6 flex flex-col justify-between relative overflow-hidden group-hover:brightness-95 transition-all">
                                            <span className="text-xs font-semibold px-2.5 py-1 bg-white/70 backdrop-blur-md rounded-full w-fit text-owl-pressed border border-owl-mint inline-flex items-center gap-1">
                                                <Icon name="book" size={12} /> บทความ
                                            </span>
                                            <h3 className="font-bold text-lg leading-snug line-clamp-3 text-ink">
                                                {article.title}
                                            </h3>
                                        </div>
                                    )}

                                    {/* เนื้อหาภายในการ์ด */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <span className="text-xs px-3 py-1 rounded-full font-medium bg-owl-soft text-owl-pressed inline-block">
                                                {article.category}
                                            </span>

                                            {/* โหมดแก้ไขบทความ */}
                                            {isEditMode ? (
                                                <div className="space-y-2 pt-2 border-t border-amber-200 bg-amber-50/50 p-2 rounded-xl">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-amber-900 block">เปลี่ยนรูปภาพ (เว้นว่างเพื่อโชว์ข้อความ):</label>
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
                                                        <label className="text-[10px] font-bold text-amber-900 block">หัวข้อบทความ:</label>
                                                        <input
                                                            type="text"
                                                            value={article.title}
                                                            onChange={(e) => {
                                                                const updated = articles.map((a: any) =>
                                                                    a.id === article.id ? { ...a, title: e.target.value } : a
                                                                );
                                                                setArticles(updated);
                                                            }}
                                                            className="font-bold text-ink w-full border border-amber-300 bg-white rounded text-sm outline-none p-1 mt-0.5"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-amber-900 block">คำอธิบายสั้น:</label>
                                                        <textarea
                                                            value={article.description || ''}
                                                            onChange={(e) => {
                                                                const updated = articles.map((a: any) =>
                                                                    a.id === article.id ? { ...a, description: e.target.value } : a
                                                                );
                                                                setArticles(updated);
                                                            }}
                                                            placeholder="คำอธิบาย..."
                                                            className="text-xs text-body-strong w-full border border-amber-300 bg-white rounded p-1 outline-none mt-0.5"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-amber-900 block">ลิงก์อ่านเพิ่มเติม (URL):</label>
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
                                                            className="text-xs text-owl-pressed w-full border border-amber-300 bg-white rounded p-1 outline-none mt-0.5"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="font-bold text-ink text-base leading-snug line-clamp-2">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-xs text-body-muted font-medium leading-relaxed line-clamp-3">
                                                        {article.description || 'กดอ่านเพิ่มเติมเพื่อดูเนื้อหาบทความฉบับเต็ม'}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {/* ปุ่มลิงก์อ่านเพิ่มเติม */}
                                        <div className="pt-3 border-t border-hairline flex items-center justify-between">
                                            <span className="text-xs text-body-soft flex items-center gap-1"><Icon name="clock" size={12} /> อ่าน {article.readTime || '3 นาที'}</span>
                                            {article.url ? (
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-macaw hover:text-owl-pressed flex items-center gap-1 hover:underline group-hover:translate-x-0.5 transition-transform"
                                                >
                                                    <span>อ่านต่อ</span>
                                                    <Icon name="chevron-right" size={12} />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-body-soft">ไม่มีลิงก์</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* ปุ่มลบสำหรับการ์ด */}
                                    {isEditMode && (
                                        <button
                                            onClick={() => handleDeleteArticle(article.id)}
                                            className="absolute top-2 right-2 bg-cardinal text-white p-1.5 rounded-full shadow-md hover:bg-cardinal text-xs z-10 inline-flex items-center justify-center"
                                            title="ลบบทความนี้"
                                        >
                                            <Icon name="trash" size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </section>

                {/* Zone 3: เทคนิคฝึกหายใจ */}
                <section ref={breathingSectionRef} className="scroll-mt-20">
                    <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="flex flex-wrap items-center justify-between gap-y-2 mb-5">
                        <h2 className="text-2xl font-black text-ink">เทคนิคฝึกหายใจ</h2>
                        <button
                            type="button"
                            onClick={() => resetBreathing()}
                            className="text-xs font-bold text-body-strong border border-hairline bg-white/80 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                        >
                            ล้างค่า
                        </button>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                            {/* ฝั่งซ้าย: ส่วนควบคุม */}
                            <div className="space-y-4">
                                {/* ชื่อโหมด + คำอธิบาย */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedMode.accentDot}`} />
                                    <p className="text-lg font-black text-ink leading-tight">{selectedMode.name}</p>
                                    <p className="text-xs text-body-strong">· {selectedMode.subtitle}</p>
                                </div>

                                {/* แท็บเลือกโหมด */}
                                <div className="grid grid-cols-3 gap-2">
                                    {BREATHING_MODES.map((mode) => {
                                        const isActive = selectedBreathId === mode.id;
                                        return (
                                            <button
                                                key={mode.id}
                                                type="button"
                                                onClick={() => handleSelectBreathMode(mode.id)}
                                                disabled={isBreathingActive}
                                                className={`rounded-xl py-2 font-mono text-sm font-bold border transition-all ${isActive
                                                    ? mode.accentTab
                                                    : 'border-hairline bg-white/70 text-body-strong hover:bg-white'
                                                    } ${isBreathingActive ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                {mode.tabLabel}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* ขั้นตอน 1-2-3 */}
                                <ol className="space-y-2.5">
                                    {selectedMode.steps.map((step, idx) => {
                                        const done = isBreathingActive && idx < phaseIndex;
                                        const active = isBreathingActive && idx === phaseIndex;
                                        return (
                                            <li
                                                key={idx}
                                                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 bg-white/80 transition-all ${active
                                                    ? 'border-owl bg-white shadow-sm'
                                                    : 'border-hairline'
                                                    }`}
                                            >
                                                <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${active
                                                    ? 'bg-owl text-white'
                                                    : done
                                                        ? 'bg-macaw text-white'
                                                        : 'bg-owl-soft text-owl-pressed'
                                                    }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className={`text-sm flex-1 leading-snug ${active ? 'font-bold text-slate-700' : 'text-slate-600'}`}>
                                                    {step.label}
                                                </span>
                                                <span className={`font-mono text-xs whitespace-nowrap ${active ? 'text-owl-pressed font-bold' : 'text-body-muted'}`}>
                                                    {active && breathTimer > 0 ? `${breathTimer} / ` : ''}{step.sec} วิ
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>

                                {/* เลือกระยะเวลา */}
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-ink whitespace-nowrap">ระยะเวลา</span>
                                    <div className="grid grid-cols-3 gap-2 flex-1">
                                        {[1, 2, 3].map((min) => (
                                            <button
                                                key={min}
                                                type="button"
                                                onClick={() => handleSelectDuration(min * 60)}
                                                disabled={isBreathingActive}
                                                className={`rounded-xl py-2 font-mono text-sm font-bold border transition-all ${durationSec === min * 60
                                                    ? 'border-owl bg-owl text-white'
                                                    : 'border-hairline bg-white/80 text-body-muted hover:bg-white'
                                                    } ${isBreathingActive ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                {min} นาที
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ปุ่มเริ่ม / หยุด */}
                                <button
                                    type="button"
                                    onClick={handleToggleBreathing}
                                    className={`w-full py-3.5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-sm transition-all ${isBreathingActive
                                        ? 'bg-cardinal text-white hover:opacity-90'
                                        : 'btn-primary'
                                        }`}
                                >
                                    {isBreathingActive ? (
                                        <><Icon name="pause" size={20} /> หยุดการฝึก</>
                                    ) : breathComplete ? (
                                        <><Icon name="play" size={20} /> ฝึกซ้ำ</>
                                    ) : (
                                        <><Icon name="play" size={20} /> เริ่มฝึกหายใจ</>
                                    )}
                                </button>
                            </div>

                            {/* ฝั่งขวา: พื้นที่แสดงผล */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative w-44 h-44 flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 186 186">
                                        <circle cx="93" cy="93" r="85" fill="none" strokeWidth="4" className="stroke-hairline" />
                                        <circle
                                            ref={ringRef}
                                            cx="93"
                                            cy="93"
                                            r="85"
                                            fill="none"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeDasharray={BREATH_RING_CIRC}
                                            strokeDashoffset={BREATH_RING_CIRC}
                                            className={`stroke-current ${selectedMode.ringText}`}
                                        />
                                    </svg>

                                    {/* สถานะลมหายใจ — อยู่ภายในวง */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
                                        <p className="font-bold text-ink text-[15px] leading-snug">
                                            {breathComplete ? 'ฝึกครบแล้ว 🌙' : isBreathingActive ? breathStep.label : 'พร้อมเริ่มฝึก'}
                                        </p>
                                        <p className="font-mono text-sm text-owl-pressed mt-1 leading-snug">
                                            {breathComplete
                                                ? 'เยี่ยมมาก พักผ่อนได้เลย'
                                                : isBreathingActive
                                                    ? `${breathTimer} วิ`
                                                    : 'แตะเริ่มฝึกหายใจ'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </section>

                {/* 🎨 CSS Animation สำหรับฝึกหายใจ */}
                <style>{`
                    @keyframes breathe-ring {
                        0% { transform: scale(0.1); opacity: 0.7; }
                        100% { transform: scale(1.7); opacity: 0; }
                    }
                    .animate-breathe-ring {
                        animation-name: breathe-ring;
                        animation-timing-function: ease-out;
                        animation-iteration-count: infinite;
                    }
                    @keyframes breathe-holding {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.06); }
                    }
                    .animate-breathe-holding {
                        animation-name: breathe-holding;
                        animation-duration: 1.8s;
                        animation-timing-function: ease-in-out;
                        animation-iteration-count: infinite;
                    }
                    @keyframes breathe-particle {
                        0% { transform: translateY(0) scale(1); opacity: 0; }
                        15% { opacity: 0.9; }
                        100% { transform: translateY(-80px) scale(0.5); opacity: 0; }
                    }
                    .animate-breathe-particle {
                        animation-name: breathe-particle;
                        animation-timing-function: linear;
                        animation-iteration-count: infinite;
                    }
                `}</style>

                {/* Zone 4: คลิปวิดีโอแนะนำ */}
                <section className="w-screen ml-[calc(50%_-_50vw)] bg-macaw/15">
                    <div className="max-w-4xl mx-auto px-4 py-12 space-y-4 relative">
                        {/* มาสคอตซ้าย — ลอยขอบ ระดับสูง */}
                        <div className="hidden lg:block absolute -left-14 xl:-left-20 top-16 xl:top-24 -translate-y-1/2 pointer-events-none z-10">
                            <div className="animate-float-side">
                                <img src={cartoon2} alt="" aria-hidden="true" className="w-24 xl:w-28 -rotate-12 drop-shadow-lg" />
                            </div>
                        </div>
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-2xl font-black text-ink flex items-center gap-2">
                            <Icon name="play" size={24} /> คลิปวิดีโอแนะนําฮีลใจ
                        </h2>
                    </div>

                    {isEditMode && (
                        <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl flex flex-col md:flex-row gap-2">
                            <input
                                type="text"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="วางลิงก์ YouTube ที่นี่..."
                                className="flex-1 px-4 py-2 rounded-xl border border-hairline text-sm outline-none focus:border-amber-500 bg-white text-body-strong"
                            />
                            <button onClick={handleAddVideo} className="bg-amber-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-amber-700">
                                + เพิ่มวิดีโอ
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {videos.map((video: any) => (
                            <div key={video.id} className="bg-white rounded-2xl shadow-card border border-hairline overflow-hidden relative group">
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
                                            className="w-full font-bold text-ink border-b border-amber-400 outline-none bg-amber-50 px-1"
                                        />
                                    ) : (
                                        <h3 className="font-bold text-ink">{video.title}</h3>
                                    )}
                                </div>

                                {isEditMode && (
                                    <button
                                        onClick={() => handleDeleteVideo(video.id)}
                                        className="absolute top-2 right-2 bg-cardinal text-white p-2 rounded-full shadow-md hover:bg-cardinal inline-flex items-center justify-center"
                                    >
                                        <Icon name="trash" size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    </div>
                </section>

                {/* Zone 5: พอดแคสต์ฮีลใจ */}
                <section ref={podcastSectionRef} className="bg-canvas border-y border-hairline">
                    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-2xl font-black text-ink flex items-center gap-2">
                            <Icon name="headphones" size={24} /> พอดแคสต์ฮีลใจ
                        </h2>
                    </div>

                    {isEditMode && (
                        <div className="p-5 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl">
                            <span className="font-bold text-sm text-amber-900 block mb-4">เพิ่มตอนพอดแคสต์ใหม่</span>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-amber-900 block">ชื่อตอน</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น เสียงนุ่มก่อนนอน"
                                            value={newPodcast.title}
                                            onChange={(e) => setNewPodcast({ ...newPodcast, title: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-amber-900 block">ผู้พูด</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น พี่กระต่ายใจฟู"
                                            value={newPodcast.speaker}
                                            onChange={(e) => setNewPodcast({ ...newPodcast, speaker: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-amber-900 block">หมวดหมู่</label>
                                        <select
                                            value={newPodcast.category}
                                            onChange={(e) => setNewPodcast({ ...newPodcast, category: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                        >
                                            {['การหายใจ', 'Mindfulness', 'จัดการความเครียด', 'การนอนหลับ', 'กำลังใจ'].map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-amber-900 block">ลิงก์ (Spotify หรือไฟล์เสียง mp3)</label>
                                        <input
                                            type="url"
                                            placeholder="https://open.spotify.com/... หรือ https://example.com/audio.mp3"
                                            value={newPodcast.link}
                                            onChange={(e) => setNewPodcast({ ...newPodcast, link: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none mt-1"
                                        />
                                        {newPodcast.link.trim() &&
                                            (() => {
                                                const parsed = parsePodcastLink(newPodcast.link);
                                                const isOk = parsed.kind !== 'external';
                                                return (
                                                    <p className={`text-[11px] mt-1 font-medium ${isOk ? 'text-macaw' : 'text-amber-700'}`}>
                                                        {describeLink(newPodcast.link)}
                                                    </p>
                                                );
                                            })()}
                                    </div>
                                    <button
                                        onClick={handleAddPodcast}
                                        className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors"
                                    >
                                        + เพิ่มตอนนี้
                                    </button>
                                </div>

                                <div>
                                    <span className="text-xs font-bold text-amber-900 block mb-2">พรีวิวการ์ด</span>
                                    <div className="max-w-sm">
                                        <PodcastVoiceCard episode={previewEpisode} fill />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        {podcastCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setPodcastCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${podcastCategory === cat
                                    ? 'bg-owl text-white shadow-lip-sm'
                                    : 'bg-white text-body-strong hover:bg-owl-soft border border-hairline'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {filteredPodcasts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-hairline">
                            <p className="text-body-soft">ไม่พบพอดแคสต์ในหมวดหมู่ "{podcastCategory}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPodcasts.map((episode) => (
                                <div key={episode.id} className="relative group">
                                    <PodcastVoiceCard episode={episode} fill />

                                    {isEditMode && (
                                        <button
                                            onClick={() => handleDeletePodcast(episode.id)}
                                            className="absolute top-2 right-2 bg-cardinal text-white p-1.5 rounded-full shadow-md hover:bg-cardinal text-xs z-10 inline-flex items-center justify-center"
                                            title="ลบตอนนี้"
                                        >
                                            <Icon name="trash" size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </section>

                {/* Zone 6: เคล็ดลับดูแลสุขภาพจิตประจำวัน */}
                <section className="w-screen ml-[calc(50%_-_50vw)] bg-bee/15">
                    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 relative">
                        {/* มาสคอตซ้าย — ลอยขอบ ระดับสูง */}
                        <div className="hidden lg:block absolute -left-14 xl:-left-20 top-16 xl:top-24 -translate-y-1/2 pointer-events-none z-10">
                            <div className="animate-float-side">
                                <img src={cartoon1} alt="" aria-hidden="true" className="w-24 xl:w-28 -rotate-12 drop-shadow-lg" />
                            </div>
                        </div>
                    <h2 className="text-xl font-bold text-ink text-center flex items-center justify-center gap-2">
                        <Icon name="sparkles" size={20} /> เคล็ดลับดูแลใจประจำวัน
                    </h2>

                    {isEditMode && (
                        <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl space-y-3">
                            <span className="font-bold text-sm text-amber-900 block">เพิ่มเคล็ดลับใหม่</span>
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
                                            className="font-bold text-ink text-center w-full border-b border-amber-400 bg-amber-50 outline-none"
                                        />
                                        <textarea
                                            value={tip.desc}
                                            onChange={(e) => {
                                                const updated = tips.map((t: any) => (t.id === tip.id ? { ...t, desc: e.target.value } : t));
                                                setTips(updated);
                                            }}
                                            className="text-sm text-body-muted text-center w-full border border-amber-300 rounded p-1 bg-amber-50 outline-none"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-ink">{tip.title}</h3>
                                        <p className="text-sm text-body-muted font-medium">{tip.desc}</p>
                                    </>
                                )}

                                {isEditMode && (
                                    <button
                                        onClick={() => handleDeleteTip(tip.id)}
                                        className="absolute top-0 right-0 text-cardinal hover:text-cardinal p-1 text-xs"
                                    >
                                        <Icon name="trash" size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    </div>
                </section>

                {/* Zone 7: โรงพยาบาลรัฐ */}
                <section>
                    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black text-ink">โรงพยาบาลรัฐใกล้ตัวที่มีผู้เชี่ยวชาญด้านสุขภาพจิต</h2>
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
                                className="w-full px-6 py-3.5 pr-12 border-2 border-hairline focus:border-macaw rounded-full outline-none text-body-strong placeholder-body-soft text-base shadow-card transition-all bg-white"
                            />
                            <button type="button" className="absolute right-4 text-macaw hover:text-owl-pressed transition-colors p-1">
                                <Icon name="send" size={22} />
                            </button>
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-hairline rounded-2xl shadow-lg z-30 overflow-hidden">
                                {suggestions.map((province) => (
                                    <button
                                        key={province}
                                        type="button"
                                        onClick={() => handleSelectProvince(province)}
                                        className="w-full text-left px-6 py-3 hover:bg-owl-soft text-body-strong font-medium transition-colors border-b border-hairline last:border-none flex items-center gap-2"
                                    >
                                        <Icon name="map-pin" size={16} />
                                        <span>{province}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {searchTerm.trim() !== '' && (
                        <div className="space-y-6 pt-4 animate-fadeIn">
                            <h3 className="text-xl font-bold text-ink border-b border-hairline pb-2">{searchTerm}</h3>

                            {filteredHospitals.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-hairline">
                                    <p className="text-body-muted font-medium">ไม่พบข้อมูลโรงพยาบาลใน "{searchTerm}"</p>
                                    <p className="text-xs text-body-soft mt-1">ลองค้นหาด้วยชื่อจังหวัดใกล้เคียง หรือโทรสายด่วน 1323</p>
                                </div>
                            ) : (
                                filteredHospitals.map((hospital: Hospital) => (
                                    <div
                                        key={hospital.id}
                                        className="bg-white p-6 rounded-2xl border border-hairline shadow-card hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 items-start"
                                    >
                                        <div className="w-16 h-16 shrink-0 rounded-full bg-owl-soft border border-owl-mint flex items-center justify-center p-2 mx-auto sm:mx-0">
                                            <svg className="w-10 h-10 text-owl-pressed" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
                                            </svg>
                                        </div>

                                        <div className="space-y-2 text-sm text-body-strong w-full">
                                            <div>
                                                <h4 className="font-bold text-lg text-ink">{hospital.name}</h4>
                                                <p className="text-xs text-body-soft">{hospital.type || 'โรงพยาบาลรัฐ'}</p>
                                            </div>

                                            {hospital.phone && (
                                                <div className="flex items-center gap-2 pt-1">
                                                    <Icon name="phone" size={16} className="text-macaw" />
                                                    <a href={`tel:${hospital.phone.replace(/-/g, '')}`} className="font-bold text-ink hover:underline">
                                                        {hospital.phone}
                                                    </a>
                                                </div>
                                            )}

                                            {hospital.address && (
                                                <div className="flex items-start gap-2">
                                                    <Icon name="stethoscope" size={16} className="text-macaw shrink-0 mt-0.5" />
                                                    <div className="leading-relaxed">
                                                        <span>{hospital.address}</span>
                                                        {hospital.mapUrl && (
                                                            <a
                                                                href={hospital.mapUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-2 font-bold text-body-strong hover:text-macaw border-b border-body-soft hover:border-macaw transition-colors"
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
                                                    <span className="font-bold text-ink">{hospital.facebook}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    </div>
                </section>
        </div>
    );
}