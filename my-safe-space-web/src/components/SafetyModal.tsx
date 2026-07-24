import React from 'react';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose, onProceed }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 text-center space-y-6 transform transition-all">
        
        {/* หัวข้อ & ไอคอน */}
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
          🤍
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">
            เราขออยู่ข้างๆ คุณนะ...
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed px-2">
            สัมผัสได้ว่าตอนนี้คุณอาจจะกำลังแบกรับเรื่องที่หนักหนามากๆ ไว้ หากรู้สึกไม่ไหว ลองพูดคุยกับผู้เชี่ยวชาญที่พร้อมรับฟังคุณตลอด 24 ชม. ได้เลยนะครับ
          </p>
        </div>

        {/* 🚨 รวมเบอร์สายด่วนสำคัญ */}
        <div className="space-y-2.5 text-left">
          <a 
            href="tel:1323" 
            className="flex items-center justify-between p-3.5 bg-purple-50 hover:bg-purple-100 rounded-2xl text-purple-900 transition-colors border border-purple-100"
          >
            <div>
              <div className="font-bold text-sm">📞 สายด่วนสุขภาพจิต</div>
              <div className="text-xs text-purple-600">ปรึกษาฟรี ตลอด 24 ชั่วโมง</div>
            </div>
            <span className="bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              1323
            </span>
          </a>

          <a 
            href="tel:021136789" 
            className="flex items-center justify-between p-3.5 bg-pink-50 hover:bg-pink-100 rounded-2xl text-pink-900 transition-colors border border-pink-100"
          >
            <div>
              <div className="font-bold text-sm">💬 สมาคมสะมาริตันส์</div>
              <div className="text-xs text-pink-600">รับฟังด้วยความเข้าใจ ไม่ตัดสิน</div>
            </div>
            <span className="bg-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              02-113-6789
            </span>
          </a>

          <a 
            href="tel:1669" 
            className="flex items-center justify-between p-3.5 bg-red-50 hover:bg-red-100 rounded-2xl text-red-900 transition-colors border border-red-100"
          >
            <div>
              <div className="font-bold text-sm">🚨 เจ็บป่วยฉุกเฉิน</div>
              <div className="text-xs text-red-600">ศูนย์นเรนทร ทั่วประเทศ</div>
            </div>
            <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              1669
            </span>
          </a>
        </div>

        {/* ปุ่มการทำงาน */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onProceed}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-colors text-sm shadow-md"
          >
            ระบายความรู้สึกนี้ออกไป (โพสต์ต่อ)
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-500 hover:text-gray-700 font-medium text-xs transition-colors"
          >
            ย้อนกลับไปแก้ไขข้อความ
          </button>
        </div>

      </div>
    </div>
  );
};