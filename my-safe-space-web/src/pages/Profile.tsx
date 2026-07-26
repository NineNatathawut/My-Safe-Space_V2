import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminAssessmentManager } from '../components/AdminAssessmentManager';

export default function Profile() {
  const { user, isAdmin, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'letters' | 'verify' | 'assessment'>('history');
  
  // State สำหรับฟอร์มยืนยันตัวตน
  const [profession, setProfession] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [consent, setConsent] = useState(false);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('ส่งคำขอยืนยันตัวตนเรียบร้อยแล้ว แอดมินจะตรวจสอบภายใน 1-3 วันทำการครับ');
    // TODO: เชื่อมต่อ API ส่งข้อมูลเข้า Supabase
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl text-gray-500 animate-pulse">กำลังโหลดโปรไฟล์...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-gray-700">กรุณาเข้าสู่ระบบก่อน</h2>
          <Link to="/login" className="inline-block px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        
        {/* 🌟 1. ส่วนหัวโปรไฟล์ & แจ้งเตือนกระดิ่ง */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -z-10"></div>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              {/* Avatar จำลอง */}
              <div className="w-20 h-20 bg-gradient-to-tr from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-4xl shadow-inner">
                🐱
              </div>
              
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                  {user?.nickname || 'ผู้ใช้งาน'}
                </h1>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <div className="inline-block px-3 py-1 bg-pink-100 text-pink-700 font-medium text-sm rounded-full">
                    {isAdmin ? 'ผู้ดูแลระบบ 🛡️' : 'ผู้รับฟัง ❤️'}
                  </div>
                  
                  {/* 🌟 ปุ่มสำหรับไปหน้าทำแบบประเมิน */}
                  <Link 
                    to="/assessment" 
                    className="inline-block px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium text-sm rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    📝 ทำแบบประเมิน
                  </Link>
                </div>
              </div>
            </div>

            {/* 🛎️ ไอคอนกระดิ่งแจ้งเตือน */}
            <button className="relative p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 0-4.496 0Z" clipRule="evenodd" />
              </svg>
              {false && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        </section>

        {/* 📑 2. เมนูนำทาง (Tabs) */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-gray-200/50 rounded-2xl">
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📖 ประวัติเรื่องราวของฉัน
          </button>
          
          <button 
            onClick={() => setActiveTab('letters')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'letters' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            💌 จดหมายส่งต่อกำลังใจ
          </button>

          {!isAdmin && (
            <button 
              onClick={() => setActiveTab('verify')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'verify' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🩺 ขอรับยศผู้เชี่ยวชาญ
            </button>
          )}

          {/* 🌟 Tab สำหรับ Admin */}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('assessment')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'assessment' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📋 จัดการแบบประเมิน
            </button>
          )}
        </div>

        {/* 🗂️ 3. พื้นที่แสดงเนื้อหาตาม Tab */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 min-h-[400px]">
          
          {/* Tab: ประวัติเรื่องราว */}
          {activeTab === 'history' && (
            <div className="space-y-4 text-center py-10">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-lg font-bold text-gray-700">ตู้เซฟของคุณยังว่างเปล่า</h3>
              <p className="text-gray-500">พื้นที่นี้จัดเก็บเฉพาะโพสต์ที่คุณเคยระบายไว้ สบายใจได้ ไม่มีใครเห็นแน่นอน</p>
            </div>
          )}

          {/* Tab: จดหมายกำลังใจ */}
          {activeTab === 'letters' && (
            <div className="space-y-4 text-center py-10">
              <div className="text-5xl mb-4">📬</div>
              <h3 className="text-lg font-bold text-gray-700">กล่องจดหมายใจฟู</h3>
              <p className="text-gray-500">ข้อความอบอุ่นจากผู้รับฟังและผู้เชี่ยวชาญจะถูกส่งมาเก็บไว้ที่นี่</p>
            </div>
          )}

          {/* Tab: ฟอร์มยืนยันตัวตนผู้เชี่ยวชาญ */}
          {activeTab === 'verify' && !isAdmin && isAuthenticated && (
            <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">ยกระดับบัญชีเป็น "ผู้เชี่ยวชาญ"</h2>
                <p className="text-sm text-gray-500 mt-2">
                  กรุณากรอกข้อมูลและแนบเอกสารเพื่อรับตราสัญลักษณ์ <span className="font-bold text-gray-700">ผู้เชี่ยวชาญ 🩺</span><br/>
                  (ข้อมูลทั้งหมดจะถูกเก็บเป็นความลับและประมวลผลโดยแอดมินเท่านั้น)
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-5">
                {/* วิชาชีพ */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">ประเภทวิชาชีพ <span className="text-red-500">*</span></label>
                  <select 
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:bg-white transition-colors"
                  >
                    <option value="" disabled>เลือกประเภทวิชาชีพของคุณ</option>
                    <option value="psychiatrist">จิตแพทย์</option>
                    <option value="clinical_psychologist">นักจิตวิทยาคลินิก</option>
                    <option value="counseling_psychologist">นักจิตวิทยาการปรึกษา</option>
                    <option value="social_worker">นักสังคมสงเคราะห์จิตเวช</option>
                  </select>
                </div>

                {/* เลขที่ใบประกอบวิชาชีพ */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">เลขที่ใบประกอบวิชาชีพ / ใบอนุญาต <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="เช่น ว.12345 หรือ ศส.9876"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:bg-white transition-colors"
                  />
                </div>

                {/* อัปโหลดเอกสาร */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">รูปถ่ายใบประกอบวิชาชีพ <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-3xl mb-2">📎</div>
                    <p className="text-sm text-gray-600 font-medium">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
                    <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG, PDF ขนาดไม่เกิน 5MB</p>
                    <input type="file" accept=".jpg,.png,.pdf" className="hidden" />
                  </div>
                </div>

                {/* PDPA Consent */}
                <label className="flex items-start gap-3 mt-6 cursor-pointer">
                  <input 
                    type="checkbox" 
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    ข้าพเจ้ายินยอมให้เว็บไซต์บ้านพักใจเก็บรวบรวมและประมวลผลข้อมูลส่วนบุคคลและเอกสารที่แนบมานี้ เพื่อวัตถุประสงค์ในการตรวจสอบและยืนยันตัวตนเท่านั้น (ข้อมูลไฟล์จะถูกลบออกจากระบบหลังการอนุมัติเสร็จสิ้น)
                  </span>
                </label>

                {/* ปุ่ม Submit */}
                <button 
                  type="submit" 
                  disabled={!consent}
                  className="w-full py-3.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors shadow-sm mt-4"
                >
                  ส่งคำขอยืนยันตัวตน
                </button>
              </form>
            </div>
          )}

          {/* 🌟 Tab: จัดการแบบประเมิน (สำหรับ Admin เท่านั้น) */}
          {activeTab === 'assessment' && isAdmin && (
            <div className="animate-fadeIn">
              <AdminAssessmentManager />
            </div>
          )}

        </section>
      </div>
    </div>
  );
}