import { usePostComposer } from './usePostComposer';
import { SafetyModal } from '../SafetyModal';

interface PostComposerModalProps {
  onClose: () => void;
}

export function PostComposerModal({ onClose }: PostComposerModalProps) {
  const {
    content, setContent,
    selectedEmotion, setSelectedEmotion,
    isLoading, error, successMsg,
    showSafetyModal, setShowSafetyModal,
    EMOTIONS, handleClear, handleSubmit, handleProceedPost,
  } = usePostComposer();

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">ระบายความในใจ</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm animate-pulse">{successMsg}</div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="font-medium mb-3 text-slate-700">วันนี้คุณรู้สึกอย่างไร?</h3>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map((emo) => (
                    <button
                      key={emo.label}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setSelectedEmotion(emo.icon)}
                      className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                        selectedEmotion === emo.icon ? 'border-purple-500 bg-purple-50' : 'border-slate-100 hover:bg-slate-50'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-xl">{emo.icon}</span>
                      <span className="text-[10px] mt-1 text-slate-600">{emo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 text-slate-700">บอกเล่าสิ่งที่อยู่ในใจ...</h3>
                <textarea
                  className="w-full border border-slate-200 rounded-xl p-4 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none bg-slate-50 disabled:opacity-50 disabled:bg-slate-100 text-sm"
                  placeholder="วันนี้เกิดอะไรขึ้น? คุณรู้สึกอย่างไร? ระบายได้เลย..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={1000}
                  disabled={isLoading}
                ></textarea>
                <div className="text-right text-xs text-slate-400 mt-1">{content.length}/1000</div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleClear} disabled={isLoading} className="px-5 py-2 border border-slate-300 text-slate-600 rounded-full hover:bg-slate-50 disabled:opacity-50 text-sm transition-colors">ล้าง</button>
                <button type="submit" disabled={!content.trim() || isLoading} className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-colors">
                  {isLoading ? 'กำลังส่ง...' : 'ส่งความในใจ'}
                </button>
              </div>
            </form>

            <p className="text-[10px] text-slate-400 mt-4 flex gap-1 items-start"><span>🔒</span> ความเป็นส่วนตัวของคุณสำคัญมาก — ข้อความนี้ไม่มีการบันทึกชื่อ อีเมล หรือข้อมูลส่วนตัวใดๆ</p>
          </div>
        </div>
      </div>

      <SafetyModal isOpen={showSafetyModal} onClose={() => setShowSafetyModal(false)} onProceed={handleProceedPost} />
    </>
  );
}