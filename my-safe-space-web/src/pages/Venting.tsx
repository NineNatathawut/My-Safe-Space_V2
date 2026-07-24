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
const checkSensitiveKeywords = (text: string): boolean => {
  if (!text) return false;
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถส่งความรู้สึกได้ในขณะนี้ กรุณาลองใหม่ครับ');
    } finally {
      setIsLoading(false);
    }
  };

  // 🛡️ ด่านตรวจก่อนยิง API
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    const isSensitive = checkSensitiveKeywords(content);

    if (isSensitive) {
      setShowSafetyModal(true);
    } else {
      submitPostToBackend();
    }
  };

  // 🟢 ฟังก์ชันเมื่อผู้ใช้กด "โพสต์ต่อ" จาก Pop-up
  const handleProceedPost = () => {
    setShowSafetyModal(false);
    submitPostToBackend();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto py-8 px-4">
      
      {/* 🔴 ฝั่งซ้าย: พื้นที่ห้องระบาย */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
            ห้องระบาย 💜
          </h2>
          <p className="text-gray-600 mt-1">
            พื้นที่ปลอดภัยสำหรับคุณ — พิมพ์สิ่งที่อยู่ในใจ ไม่ต้องกลัวการตัดสิน ไม่มีใครรู้ว่าคุณเป็นใคร
          </p>
          <div className="inline-block bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full mt-2">
            🔒 ไม่มีการระบุตัวตน — ข้อมูลทั้งหมดเป็นความลับ
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 animate-pulse">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* 🌟 3. แยกเงื่อนไขการแสดงผลระหว่าง Guest กับ User */}
        {isGuest ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm mt-4">
            <div className="text-6xl mb-4">🧸</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              แวะมาพักใจหรืออยากระบายความรู้สึกไหมคะ?
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              หากมีเรื่องหนักใจอยากทิ้งไว้ที่นี่ มารับนามแฝงน่ารักๆ แล้วเข้าสู่ระบบเพื่อเขียนระบายได้เลยนะ พื้นที่นี้ปลอดภัยสำหรับคุณเสมอค่ะ ☁️✨
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/login" className="bg-purple-600 text-white px-8 py-3 rounded-full font-medium hover:bg-purple-700 transition shadow-sm">
                เข้าสู่ระบบ
              </Link>
              <Link to="/register" className="bg-white text-purple-600 border-2 border-purple-100 px-8 py-3 rounded-full font-medium hover:bg-purple-50 transition">
                รับนามแฝงใหม่ (สมัครสมาชิก)
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="font-medium mb-3">วันนี้คุณรู้สึกอย่างไร?</h3>
              <div className="flex flex-wrap gap-3">
                {EMOTIONS.map((emo) => (
                  <button
                    key={emo.label}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setSelectedEmotion(emo.icon)}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                      selectedEmotion === emo.icon 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-100 hover:bg-gray-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-2xl">{emo.icon}</span>
                    <span className="text-xs mt-1 text-gray-600">{emo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-3">บอกเล่าสิ่งที่อยู่ในใจ...</h3>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none bg-gray-50 disabled:opacity-50 disabled:bg-gray-100"
                placeholder="วันนี้เกิดอะไรขึ้น? คุณรู้สึกอย่างไร? ระบายได้เลย บ้านพักใจรับฟังคุณเสมอ..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                disabled={isLoading}
              ></textarea>
              <div className="text-right text-sm text-gray-400 mt-1">
                {content.length}/1000 ตัวอักษร
              </div>
            </div>

            <div className="flex justify-end gap-3 mb-4">
              <button 
                type="button" 
                onClick={handleClear}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 text-gray-600 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ล้าง
              </button>
              <button 
                type="submit"
                disabled={!content.trim() || isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isLoading ? 'กำลังส่งความในใจ...' : 'ส่งความในใจ'}
              </button>
            </div>

            <p className="text-xs text-gray-400 flex gap-1 items-start">
              <span>🔒</span> ความเป็นส่วนตัวของคุณสำคัญมาก — ข้อความนี้ไม่มีการบันทึกชื่อ อีเมล หรือข้อมูลส่วนตัวใดๆ ทั้งสิ้น ข้อมูลบนหน้านี้ไม่ใช่การวินิจฉัยทางการแพทย์
            </p>
          </form>
        )}
      </div>

      {/* 🔴 ฝั่งขวา: Sidebar เครื่องมือช่วยเหลือ (คงไว้เหมือนเดิมให้ทุกคนเห็นได้) */}
      <div className="lg:w-80 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            📞 สายด่วน — พร้อมช่วยเสมอ
          </h3>
          <div className="space-y-2">
            <a href="tel:1323" className="w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center transition-colors">
              <span>1323 สายด่วนสุขภาพจิต</span> <span>→</span>
            </a>
            <a href="tel:021136789" className="w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center transition-colors">
              <span>02-113-6789 สะมาริตันส์</span> <span>→</span>
            </a>
            <a href="tel:1669" className="w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center transition-colors">
              <span>1669 ฉุกเฉินฟรี</span> <span>→</span>
            </a>
            <a href="tel:1300" className="w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center transition-colors">
              <span>1300 ช่วยเหลือสังคม</span> <span>→</span>
            </a>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            🤍 หายใจ 4-4-4
          </h3>
          <p className="text-sm text-gray-600 mb-4">ลองหายใจลึกๆ เพื่อลดความเครียดได้ทันที</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>1. หายใจเข้า นับ 1-2-3-4</li>
            <li>2. กลั้นหายใจ นับ 1-2-3-4</li>
            <li>3. หายใจออก นับ 1-2-3-4</li>
            <li>4. ทำซ้ำ 4 รอบ</li>
          </ul>
        </div>
      </div>

      {/* 🚨 Pop-up สายด่วนฉุกเฉิน */}
      <SafetyModal 
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        onProceed={handleProceedPost}
      />

    </div>
  );
}