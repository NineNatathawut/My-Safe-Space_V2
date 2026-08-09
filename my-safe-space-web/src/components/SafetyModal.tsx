import React from 'react';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose, onProceed }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink-deep/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-hairline text-center space-y-6 transform transition-all">

        <div className="w-16 h-16 bg-owl-soft rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
          🤍
        </div>

        <div className="space-y-2">
          <h3 className="font-feather text-xl font-black text-ink">
            เราขออยู่ข้างๆ คุณนะ...
          </h3>
          <p className="text-body-muted text-sm leading-relaxed px-2 font-medium">
            สัมผัสได้ว่าตอนนี้คุณอาจจะกำลังแบกเรื่องที่หนักหนามากๆ ไว้ หากรู้สึกไม่ไหว ลองพูดคุยกับผู้เชี่ยวชาญที่พร้อมรับฟังคุณตลอด 24 ชม. ได้เลยนะครับ
          </p>
        </div>

        {/* 🚨 รวมเบอร์สายด่วนสำคัญ */}
        <div className="space-y-2.5 text-left">
          <a
            href="tel:1323"
            className="flex items-center justify-between p-3.5 bg-owl-soft hover:bg-owl-mint rounded-2xl text-ink-deep transition-colors border border-owl-mint"
          >
            <div>
              <div className="font-bold text-sm">📞 สายด่วนสุขภาพจิต</div>
              <div className="text-xs text-owl-pressed font-medium">ปรึกษาฟรี ตลอด 24 ชั่วโมง</div>
            </div>
            <span className="bg-owl text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lip-sm">
              1323
            </span>
          </a>

          <div
            className="flex items-center justify-between p-3.5 bg-macaw/10 hover:bg-macaw/20 rounded-2xl text-ink-deep transition-colors border border-macaw/20"
          >
            <div>
              <div className="font-bold text-sm">💬 สมาคมสะมาริตันส์</div>
              <div className="text-xs text-macaw font-medium">รับฟังด้วยความเข้าใจ ไม่ตัดสิน</div>
            </div>
            <span className="bg-macaw text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lip-sm">
              02-113-6789
            </span>
          </div>

          <a
            href="tel:1669"
            className="flex items-center justify-between p-3.5 bg-cardinal/10 hover:bg-cardinal/20 rounded-2xl text-ink-deep transition-colors border border-cardinal/20"
          >
            <div>
              <div className="font-bold text-sm">🚨 เจ็บป่วยฉุกเฉิน</div>
              <div className="text-xs text-cardinal font-medium">ศูนย์นเรนทร ทั่วประเทศ</div>
            </div>
            <span className="bg-cardinal text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lip-sm">
              1669
            </span>
          </a>
        </div>

        {/* ปุ่มการทำงาน */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onProceed}
            className="btn-primary w-full text-sm"
          >
            ระบายความรู้สึกนี้ออกไป (โพสต์ต่อไป)
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-body-muted hover:text-body-strong font-bold text-xs uppercase tracking-btn transition-colors"
          >
            ย้อนกลับไปแก้ไขข้อความ
          </button>
        </div>

      </div>
    </div>
  );
};