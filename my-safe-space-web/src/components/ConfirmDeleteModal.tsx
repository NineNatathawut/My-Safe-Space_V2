import { Icon } from './Icon';

interface ConfirmDeleteModalProps {
  title?: string;
  message?: string;
  confirmText?: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  title = 'ยืนยันการลบโพสต์',
  message = 'คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
  confirmText = 'ลบโพสต์',
  confirming = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={onCancel}>
      <div
        className="card p-6 w-full max-w-sm space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-full bg-cardinal/10 flex items-center justify-center">
            <Icon name="trash" size={24} className="text-cardinal" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-ink leading-tight">{title}</h3>
            <p className="text-sm text-body-muted font-medium leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="px-5 py-2.5 bg-owl-soft hover:bg-owl-mint rounded-xl text-sm font-bold text-owl-pressed transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="px-5 py-2.5 bg-cardinal hover:bg-cardinal text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {confirming ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังลบ...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
