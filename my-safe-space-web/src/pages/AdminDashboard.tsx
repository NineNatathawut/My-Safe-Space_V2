import { useState } from 'react';
import { AdminAssessmentManager } from '../components/AdminAssessmentManager';

// 📂 Mock ข้อมูลแบบประเมินที่มีในระบบ
const MOCK_ASSESSMENTS = [
  { id: 1, name: 'แบบประเมินความเครียด (ST-5)', questions: 5, lastUpdated: '2026-07-20' },
  { id: 2, name: 'แบบวัดความเศร้า (PHQ-9)', questions: 9, lastUpdated: '2026-07-15' },
];

// 📂 Mock ข้อมูลวิดีโอ บทความ และสูตรหายใจ
const MOCK_VIDEOS = [
  { id: 1, title: 'ดนตรีบำบัด คลื่นเสียงฮีลใจ (1 ชม.)', url: 'https://youtube.com/...', isVisible: true },
];
const MOCK_ARTICLES = [
  { id: 1, title: '5 วิธีรับมือความเครียดที่ได้ผลจริง', status: 'published', views: 1205 },
];
const MOCK_BREATHING = [
  { id: 1, name: 'สูตรผ่อนคลาย (4-7-8)', in: 4, hold: 7, out: 8, rounds: 4, msg: 'ช่วยลดความวิตกกังวลและช่วยให้หลับง่ายขึ้น' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'assessment' | 'verification' | 'resources'>('resources'); // 👈 เพิ่ม resources
  
  // 🎚️ State สำหรับ Toggle Switch (แบบประเมิน)
  const [preAssessmentEnabled, setPreAssessmentEnabled] = useState(false);
  const [postAssessmentEnabled, setPostAssessmentEnabled] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // 📝 State สำหรับจัดการทรัพยากร
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      alert(`นำเข้าไฟล์ ${e.target.files[0].name} สำเร็จ!`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        
        {/* 🌟 Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>⚙️</span> ศูนย์ควบคุมแอดมิน (Admin Portal)
            </h1>
            <p className="text-gray-500 text-sm mt-1">จัดการทรัพยากร, ผู้ใช้งาน และแบบประเมินของบ้านพักใจ</p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
            <button 
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'resources' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📚 ทรัพยากรสุขภาพจิต
            </button>
            <button 
              onClick={() => setActiveTab('assessment')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'assessment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📊 จัดการแบบประเมิน
            </button>
            <button 
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'verification' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🩺 ยืนยันตัวตน
            </button>
          </div>
        </section>

        {/* 📚 Tab: ทรัพยากรสุขภาพจิต (โซนใหม่) */}
        {activeTab === 'resources' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* 1. ระบบจัดการคลิปวิดีโอแนะนำ */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-gray-800">📺 จัดการคลิปวิดีโอฮีลใจ (YouTube)</h2>
              </div>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="วางลิงก์ YouTube ที่นี่..." 
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-indigo-500"
                />
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  ดึงข้อมูล
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {MOCK_VIDEOS.map(video => (
                  <div key={video.id} className="flex gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50 items-center">
                    <div className="w-24 h-16 bg-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-500">Thumbnail</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-800 truncate">{video.title}</h3>
                      <div className="flex gap-2 mt-2">
                        <button className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 hover:bg-gray-100">ซ่อน/แสดง</button>
                        <button className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded hover:bg-red-100">ลบ</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. ระบบจัดการบทความ (Article CMS) */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-gray-800">📝 ระบบจัดการบทความ (Article CMS)</h2>
                <button className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-600 transition-colors">
                  + เขียนบทความใหม่
                </button>
              </div>
              
              <div className="space-y-3">
                {MOCK_ARTICLES.map(article => (
                  <div key={article.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-pink-200 transition-colors group">
                    <div>
                      <h4 className="font-bold text-gray-800">{article.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">สถานะ: {article.status === 'published' ? '🟢 เปิดเผย' : '🔴 ซ่อน'} • ยอดอ่าน: {article.views} ครั้ง</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold">แก้ไขเนื้อหา</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. ระบบตั้งค่าฟีเจอร์ฝึกการหายใจ (Breathing Config) */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">🌬️ ตั้งค่ารูปแบบการหายใจ (Dynamic Breathing)</h2>
                  <p className="text-sm text-gray-500">ปรับแต่งจังหวะการหายใจที่จะแสดงผลให้ผู้ใช้</p>
                </div>
                <button className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors">
                  + เพิ่มสูตรใหม่
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {MOCK_BREATHING.map(breath => (
                  <div key={breath.id} className="border border-gray-200 rounded-2xl p-4 bg-teal-50/30">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-teal-800">{breath.name}</h3>
                      <button className="text-xs text-teal-600 hover:underline font-bold">บันทึกการแก้ไข</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500">หายใจเข้า (วินาที)</label>
                        <input type="number" defaultValue={breath.in} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">กลั้นหายใจ (วินาที)</label>
                        <input type="number" defaultValue={breath.hold} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">หายใจออก (วินาที)</label>
                        <input type="number" defaultValue={breath.out} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">จำนวนรอบ</label>
                        <input type="number" defaultValue={breath.rounds} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">ข้อความเชิญชวน</label>
                      <input type="text" defaultValue={breath.msg} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* 📊 Tab: ระบบจัดการแบบประเมิน */}
        {activeTab === 'assessment' && (
          <div className="animate-fadeIn">
            <AdminAssessmentManager />
          </div>
        )}

        {/* 🩺 Tab: ยืนยันตัวตนผู้เชี่ยวชาญ (โค้ดเดิม) */}
        {activeTab === 'verification' && (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 animate-fadeIn">
            <div className="text-6xl mb-4">🩺</div>
            <h2 className="text-xl font-bold text-gray-800">ระบบจัดการคำขอยืนยันตัวตน</h2>
            <p className="text-gray-500 mt-2">พื้นที่สำหรับตรวจสอบเอกสารใบประกอบวิชาชีพของผู้เชี่ยวชาญ</p>
          </div>
        )}

      </div>
    </div>
  );
}